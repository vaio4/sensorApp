import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import {
  Activity,
  Download,
  History,
  LayoutDashboard,
  Moon,
  Radio,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { DashboardTab } from './components/DashboardTab';
import { ExportTab } from './components/ExportTab';
import { HistoryTab } from './components/HistoryTab';
import { LoginView } from './components/LoginView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProfileTab } from './components/ProfileTab';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SensorsTab } from './components/SensorsTab';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from './firebase';
import {
  closeSession,
  deleteCameraCapture,
  deleteSession,
  getCameraCaptures,
  getDailyStepHistory,
  getReadingsBySession,
  getSessions,
  insertCameraCapture,
  insertReading,
  insertSession,
} from './services/localDb';
import { WebSensorHub } from './services/webSensors';
import type {
  CameraCapture,
  DailySteps,
  LiveSensorsSnapshot,
  RecordingSession,
  SensorReading,
  UserProfile,
} from './types/sensor';
import { buildCsvContent, triggerCsvDownload } from './utils/csv';
import { formatIso8601WithOffset } from './utils/isoDate';

type TabKey = 'dashboard' | 'sensors' | 'history' | 'export' | 'profile';

const TABS: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'sensors', label: 'Sensors', icon: Radio },
  { key: 'history', label: 'History', icon: History },
  { key: 'export', label: 'Export', icon: Download },
  { key: 'profile', label: 'Profile', icon: UserIcon },
];

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('sensor_dashboard_theme');
    return saved ? saved === 'dark' : false;
  });

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  const hubRef = useRef<WebSensorHub | null>(null);
  if (!hubRef.current) {
    hubRef.current = new WebSensorHub();
  }
  const [snapshot, setSnapshot] = useState<LiveSensorsSnapshot>(() =>
    hubRef.current!.getSnapshot()
  );

  const [samplingIntervalMs, setSamplingIntervalMs] = useState(1000);
  const [accelHistory, setAccelHistory] = useState<number[]>([]);
  const [gyroHistory, setGyroHistory] = useState<number[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSampleCount, setActiveSampleCount] = useState(0);
  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const [stepHistory, setStepHistory] = useState<DailySteps[]>([]);
  const [cameraCaptures, setCameraCaptures] = useState<CameraCapture[]>([]);
  const [cameraAvailable, setCameraAvailable] = useState(true);

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const activeSessionRef = useRef<{ id: string; count: number } | null>(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sensor_dashboard_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Test Firestore connection on boot
  useEffect(() => {
    void testFirestoreConnection();
  }, []);

  // Firebase Auth listener & profile hydration
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setAuthReady(true);
        hubRef.current?.dispose();
        return;
      }

      const userPath = `users/${user.uid}`;
      const userRef = doc(db, 'users', user.uid);
      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setProfile(data);
          setSamplingIntervalMs(data.samplingIntervalMs || 1000);
        } else {
          const fallbackName =
            user.displayName?.trim() ||
            user.email?.split('@')[0]?.trim() ||
            'Sensor User';
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || `${user.uid}@local.user`,
            displayName: fallbackName.slice(0, 100),
            dailyStepGoal: 10000,
            samplingIntervalMs: 1000,
          };
          await setDoc(userRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setProfile(newProfile);
          setSamplingIntervalMs(1000);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, userPath);
      }
      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  const refreshLocalHistory = async (email?: string) => {
    const [sList, stepsList, capList] = await Promise.all([
      getSessions(email),
      getDailyStepHistory(),
      getCameraCaptures(email),
    ]);
    setSessions(sList);
    setStepHistory(stepsList);
    setCameraCaptures(capList);
  };

  // Start hardware sensor listeners once user profile is ready
  useEffect(() => {
    if (!profile) return;
    const hub = hubRef.current!;
    const unsub = hub.subscribe((next) => setSnapshot(next));
    void hub.init(profile.dailyStepGoal);
    void refreshLocalHistory(profile.email);

    return () => {
      unsub();
    };
  }, [profile?.uid]);

  // Live chart & recording sampling loop
  useEffect(() => {
    if (!profile) return;

    const timer = window.setInterval(() => {
      const snap = snapshotRef.current;

      if (snap.accelerometer.available && snap.accelerometer.value) {
        const { x, y, z } = snap.accelerometer.value;
        const mag = Math.sqrt(x * x + y * y + z * z);
        setAccelHistory((prev) => [...prev.slice(-29), mag]);
      }

      if (snap.gyroscope.available && snap.gyroscope.value) {
        const { x, y, z } = snap.gyroscope.value;
        const mag = Math.sqrt(x * x + y * y + z * z);
        setGyroHistory((prev) => [...prev.slice(-29), mag]);
      }

      if (activeSessionRef.current && profileRef.current) {
        const reading: SensorReading = {
          sessionId: activeSessionRef.current.id,
          timestamp: formatIso8601WithOffset(new Date()),
          userEmail: profileRef.current.email,
          stepCount: snap.steps.todaySteps,
          accelerometerX: snap.accelerometer.value?.x ?? null,
          accelerometerY: snap.accelerometer.value?.y ?? null,
          accelerometerZ: snap.accelerometer.value?.z ?? null,
          gyroscopeX: snap.gyroscope.value?.x ?? null,
          gyroscopeY: snap.gyroscope.value?.y ?? null,
          gyroscopeZ: snap.gyroscope.value?.z ?? null,
          magnetometerHeading: snap.magnetometer.headingDeg,
          pressureHpa: snap.barometer.pressureHpa,
          lightLux: snap.ambientLight.lux,
          proximity: snap.proximity.value,
          latitude: snap.gps.latitude,
          longitude: snap.gps.longitude,
          altitude: snap.gps.altitude,
          speed: snap.gps.speed,
          bearing: snap.gps.bearing,
          batteryLevel: snap.battery.levelPercent,
        };
        activeSessionRef.current.count += 1;
        setActiveSampleCount(activeSessionRef.current.count);
        void insertReading(reading);
      }
    }, samplingIntervalMs);

    return () => window.clearInterval(timer);
  }, [profile?.uid, samplingIntervalMs]);

  const handleStartRecording = async () => {
    if (!profile || isRecording) return;
    const now = new Date();
    const sessionId = `session_${now.getTime()}`;
    const session: RecordingSession = {
      id: sessionId,
      userEmail: profile.email,
      startedAt: formatIso8601WithOffset(now),
      endedAt: null,
      sampleCount: 0,
    };
    await insertSession(session);
    activeSessionRef.current = { id: sessionId, count: 0 };
    setActiveSessionId(sessionId);
    setActiveSampleCount(0);
    setIsRecording(true);
    await refreshLocalHistory(profile.email);
  };

  const handleStopRecording = async () => {
    if (!profile || !activeSessionRef.current) return;
    const { id, count } = activeSessionRef.current;
    const endedAt = formatIso8601WithOffset(new Date());
    const startedAt =
      sessions.find((s) => s.id === id)?.startedAt ?? formatIso8601WithOffset(new Date());

    activeSessionRef.current = null;
    setIsRecording(false);
    setActiveSessionId(null);

    await closeSession(id, endedAt, count);
    await refreshLocalHistory(profile.email);

    // Sync session metadata summary to Firestore
    const metaPath = `users/${profile.uid}/sessions/${id}`;
    try {
      await setDoc(doc(db, 'users', profile.uid, 'sessions', id), {
        id,
        userId: profile.uid,
        startedAt,
        endedAt,
        sampleCount: count,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, metaPath);
    }
  };

  const handleChangeSamplingInterval = async (ms: number) => {
    setSamplingIntervalMs(ms);
    if (!profile) return;
    const nextProfile = { ...profile, samplingIntervalMs: ms };
    setProfile(nextProfile);
    const path = `users/${profile.uid}`;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        samplingIntervalMs: ms,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpdateGoal = async (goal: number) => {
    if (!profile) return;
    const nextProfile = { ...profile, dailyStepGoal: goal };
    setProfile(nextProfile);
    await hubRef.current?.updateDailyGoal(goal);
    await refreshLocalHistory(profile.email);
    const path = `users/${profile.uid}`;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        dailyStepGoal: goal,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleExportSession = async (sessionId: string) => {
    const rows = await getReadingsBySession(sessionId);
    if (rows.length === 0) return;
    const csv = buildCsvContent(rows);
    triggerCsvDownload(csv, `${sessionId}.csv`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    await refreshLocalHistory(profile?.email);
  };

  const handleCaptureSaved = async (capture: CameraCapture) => {
    await insertCameraCapture(capture);
    await refreshLocalHistory(profile?.email);
  };

  const handleDeleteCapture = async (id: number) => {
    await deleteCameraCapture(id);
    await refreshLocalHistory(profile?.email);
  };

  const handleLogout = async () => {
    if (isRecording) {
      await handleStopRecording();
    }
    await signOut(auth);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0E17] text-slate-600 dark:text-slate-400 text-sm">
        Initializing Sensor Data Dashboard...
      </div>
    );
  }

  if (!firebaseUser || !profile) {
    return <LoginView isDark={isDark} onToggleTheme={() => setIsDark((d) => !d)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0E17] text-slate-900 dark:text-slate-100 pb-20 md:pb-8">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-8 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="flex items-center gap-2 text-base font-bold tracking-tight whitespace-nowrap shrink-0"
        >
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Sensor Data Dashboard</span>
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            aria-label="Toggle color theme"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            userEmail={profile.email}
            snapshot={snapshot}
            dailyStepGoal={profile.dailyStepGoal}
            accelHistory={accelHistory}
            gyroHistory={gyroHistory}
            isRecording={isRecording}
            activeSampleCount={activeSampleCount}
            samplingIntervalMs={samplingIntervalMs}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onRequestMotionPermission={() => void hubRef.current?.requestMotionPermissions()}
            onRequestLocation={() => hubRef.current?.initGeolocation()}
            onCaptureSaved={handleCaptureSaved}
            onCameraAvailabilityChange={setCameraAvailable}
          />
        )}

        {activeTab === 'sensors' && (
          <SensorsTab
            userEmail={profile.email}
            snapshot={snapshot}
            samplingIntervalMs={samplingIntervalMs}
            onChangeSamplingInterval={handleChangeSamplingInterval}
            onRequestMotionPermission={() => void hubRef.current?.requestMotionPermissions()}
            onRequestLocation={() => hubRef.current?.initGeolocation()}
            onCaptureSaved={handleCaptureSaved}
            onCameraAvailabilityChange={setCameraAvailable}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            sessions={sessions}
            stepHistory={stepHistory}
            cameraCaptures={cameraCaptures}
            onExportSession={handleExportSession}
            onDeleteSession={handleDeleteSession}
            onDeleteCapture={handleDeleteCapture}
          />
        )}

        {activeTab === 'export' && <ExportTab userEmail={profile.email} />}

        {activeTab === 'profile' && (
          <ProfileTab
            profile={profile}
            snapshot={snapshot}
            cameraAvailable={cameraAvailable}
            isDark={isDark}
            onToggleTheme={() => setIsDark((d) => !d)}
            onUpdateGoal={handleUpdateGoal}
            onLogout={handleLogout}
          />
        )}
      </main>

      <OfflineIndicator />

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center justify-center gap-1 min-h-[44px] text-[10px] font-medium transition-colors ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

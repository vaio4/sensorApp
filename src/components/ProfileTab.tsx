import React, { useState } from 'react';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import type { LiveSensorsSnapshot, UserProfile } from '../types/sensor';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileTabProps {
  profile: UserProfile;
  snapshot: LiveSensorsSnapshot;
  cameraAvailable: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onUpdateGoal: (goal: number) => Promise<void>;
  onLogout: () => Promise<void>;
}

export function ProfileTab({
  profile,
  snapshot,
  cameraAvailable,
  isDark,
  onToggleTheme,
  onUpdateGoal,
  onLogout,
}: ProfileTabProps) {
  const [goalInput, setGoalInput] = useState(String(profile.dailyStepGoal));
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const availabilityRows = [
    { label: 'Accelerometer', available: snapshot.accelerometer.available },
    { label: 'Gyroscope', available: snapshot.gyroscope.available },
    { label: 'Magnetometer / Compass', available: snapshot.magnetometer.available },
    { label: 'Barometer', available: snapshot.barometer.available },
    { label: 'Ambient Light Sensor', available: snapshot.ambientLight.available },
    { label: 'Proximity Sensor', available: snapshot.proximity.available },
    { label: 'GPS / Location', available: snapshot.gps.available },
    { label: 'Device Battery API', available: snapshot.battery.available },
    { label: 'Camera Sensor', available: cameraAvailable },
    {
      label: 'Step Detection (Accelerometer Fallback)',
      available: snapshot.accelerometer.available,
    },
  ];

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(goalInput, 10);
    if (Number.isNaN(parsed) || parsed < 500 || parsed > 100000) {
      setSavedNotice('Daily step goal must be between 500 and 100,000.');
      return;
    }
    setSaving(true);
    setSavedNotice(null);
    try {
      await onUpdateGoal(parsed);
      setSavedNotice('Daily step goal saved to Firestore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold truncate">{profile.displayName}</h2>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Appearance</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Switch between light and dark telemetry themes
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Install Application (PWA)</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Run standalone on Android, iOS, or Desktop with offline caching
                </div>
              </div>
              <PWAInstallButton variant="card" />
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Daily Step Goal
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={500}
                  max={100000}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="h-10 flex-1 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
              {savedNotice && (
                <p className="text-xs text-slate-600 dark:text-slate-300">{savedNotice}</p>
              )}
            </form>
          </div>
        </section>

        <button
          type="button"
          onClick={onLogout}
          className="w-full min-h-[44px] rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {/* Sensor Availability Matrix */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-semibold mb-1">Device Sensor Availability</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Live hardware capability report for the current browser/device
        </p>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {availabilityRows.map((row) => (
            <div key={row.label} className="py-2.5 flex items-center justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300">{row.label}</span>
              <span
                className={`text-xs font-mono font-medium ${
                  row.available
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {row.available ? 'Active' : 'Not Available'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

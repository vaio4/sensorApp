export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  dailyStepGoal: number;
  samplingIntervalMs: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SensorReading {
  id?: number;
  sessionId: string;
  timestamp: string; // ISO 8601 with local offset, e.g. 2026-11-24T15:04:00+05:30
  userEmail: string;
  stepCount: number;
  accelerometerX: number | null;
  accelerometerY: number | null;
  accelerometerZ: number | null;
  gyroscopeX: number | null;
  gyroscopeY: number | null;
  gyroscopeZ: number | null;
  magnetometerHeading: number | null;
  pressureHpa: number | null;
  lightLux: number | null;
  proximity: number | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  speed: number | null;
  bearing: number | null;
  batteryLevel: number | null;
}

export interface RecordingSession {
  id: string;
  userEmail: string;
  startedAt: string;
  endedAt: string | null;
  sampleCount: number;
}

export interface DailySteps {
  dateKey: string; // YYYY-MM-DD in device timezone
  steps: number;
  goal: number;
  updatedAt: string;
}

export interface CameraCapture {
  id?: number;
  dataUrl: string;
  timestamp: string;
  userEmail: string;
  facingMode: 'environment' | 'user';
  width: number;
  height: number;
  latitude: number | null;
  longitude: number | null;
  lightLux: number | null;
  stepCount: number;
}

export interface AxisReading {
  x: number;
  y: number;
  z: number;
}

export interface LiveSensorsSnapshot {
  accelerometer: { available: boolean; value: AxisReading | null; source: string };
  gyroscope: { available: boolean; value: AxisReading | null; source: string };
  magnetometer: { available: boolean; headingDeg: number | null; source: string };
  barometer: { available: boolean; pressureHpa: number | null };
  ambientLight: { available: boolean; lux: number | null };
  proximity: { available: boolean; value: number | null; label: string | null };
  gps: {
    available: boolean;
    permissionState: 'prompt' | 'granted' | 'denied' | 'unavailable';
    errorMessage: string | null;
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    speed: number | null;
    bearing: number | null;
  };
  battery: {
    available: boolean;
    levelPercent: number | null;
    charging: boolean | null;
  };
  steps: {
    hardwareAvailable: boolean;
    sourceLabel: string;
    todaySteps: number;
    totalSteps: number;
  };
  motionPermissionRequired: boolean;
  motionPermissionGranted: boolean;
}

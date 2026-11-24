import React from 'react';
import type { CameraCapture, LiveSensorsSnapshot } from '../types/sensor';
import { CameraPanel } from './CameraPanel';
import { CompassDial } from './CompassDial';
import { GpsRadarPlot } from './GpsRadarPlot';

interface SensorsTabProps {
  userEmail: string;
  snapshot: LiveSensorsSnapshot;
  samplingIntervalMs: number;
  onChangeSamplingInterval: (ms: number) => void;
  onRequestMotionPermission: () => void;
  onRequestLocation: () => void;
  onCaptureSaved: (capture: CameraCapture) => Promise<void>;
  onCameraAvailabilityChange: (available: boolean) => void;
}

const INTERVAL_OPTIONS = [
  { label: '0.5 sec (2 Hz)', ms: 500 },
  { label: '1.0 sec (Default)', ms: 1000 },
  { label: '2.0 sec', ms: 2000 },
  { label: '5.0 sec', ms: 5000 },
];

export function SensorsTab({
  userEmail,
  snapshot,
  samplingIntervalMs,
  onChangeSamplingInterval,
  onRequestMotionPermission,
  onRequestLocation,
  onCaptureSaved,
  onCameraAvailabilityChange,
}: SensorsTabProps) {
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Hardware Sensor Streams</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Direct Web &amp; Mobile hardware telemetry · Unsupported sensors report availability cleanly
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {snapshot.motionPermissionRequired && !snapshot.motionPermissionGranted && (
            <button
              type="button"
              onClick={onRequestMotionPermission}
              className="min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Authorize Motion Sensors
            </button>
          )}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Update Interval</span>
            <select
              value={samplingIntervalMs}
              onChange={(e) => onChangeSamplingInterval(Number(e.target.value))}
              className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
            >
              {INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.ms} value={opt.ms}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Accelerometer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Accelerometer</h3>
            <span className="text-xs font-mono text-slate-400">{snapshot.accelerometer.source}</span>
          </div>
          {snapshot.accelerometer.available && snapshot.accelerometer.value ? (
            <div className="space-y-2 font-mono tabular-nums text-sm">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-500">X-Axis</span>
                <span>{snapshot.accelerometer.value.x.toFixed(4)} m/s²</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-500">Y-Axis</span>
                <span>{snapshot.accelerometer.value.y.toFixed(4)} m/s²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Z-Axis</span>
                <span>{snapshot.accelerometer.value.z.toFixed(4)} m/s²</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sensor not available on this device
            </p>
          )}
        </div>

        {/* Gyroscope */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Gyroscope</h3>
            <span className="text-xs font-mono text-slate-400">{snapshot.gyroscope.source}</span>
          </div>
          {snapshot.gyroscope.available && snapshot.gyroscope.value ? (
            <div className="space-y-2 font-mono tabular-nums text-sm">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-500">X-Axis</span>
                <span>{snapshot.gyroscope.value.x.toFixed(4)} rad/s</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-500">Y-Axis</span>
                <span>{snapshot.gyroscope.value.y.toFixed(4)} rad/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Z-Axis</span>
                <span>{snapshot.gyroscope.value.z.toFixed(4)} rad/s</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sensor not available on this device
            </p>
          )}
        </div>

        {/* Magnetometer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Magnetometer / Compass</h3>
            <span className="text-xs font-mono text-slate-400">{snapshot.magnetometer.source}</span>
          </div>
          <CompassDial
            headingDeg={snapshot.magnetometer.headingDeg}
            available={snapshot.magnetometer.available}
          />
        </div>

        {/* Barometer & Ambient Light & Proximity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold">Environmental &amp; Proximity</h3>
          <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-slate-500">Barometer</span>
            <span className="font-mono tabular-nums text-xs">
              {snapshot.barometer.available && snapshot.barometer.pressureHpa !== null
                ? `${snapshot.barometer.pressureHpa.toFixed(2)} hPa`
                : 'Sensor not available on this device'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-slate-500">Ambient Light</span>
            <span className="font-mono tabular-nums text-xs">
              {snapshot.ambientLight.available && snapshot.ambientLight.lux !== null
                ? `${snapshot.ambientLight.lux.toFixed(1)} lux`
                : 'Sensor not available on this device'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Proximity</span>
            <span className="font-mono tabular-nums text-xs">
              {snapshot.proximity.available
                ? snapshot.proximity.label ?? `${snapshot.proximity.value}`
                : 'Sensor not available on this device'}
            </span>
          </div>
        </div>

        {/* GPS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">GPS &amp; Navigation</h3>
            <span className="text-xs font-mono text-slate-400">
              Permission: {snapshot.gps.permissionState}
            </span>
          </div>
          <GpsRadarPlot gps={snapshot.gps} onRequestLocation={onRequestLocation} />
        </div>

        {/* Camera Sensor */}
        <div className="md:col-span-2">
          <CameraPanel
            userEmail={userEmail}
            snapshot={snapshot}
            onCaptureSaved={onCaptureSaved}
            onAvailabilityChange={onCameraAvailabilityChange}
          />
        </div>
      </div>
    </div>
  );
}

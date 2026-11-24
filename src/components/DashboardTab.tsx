import React from 'react';
import {
  Battery,
  BatteryCharging,
  Compass,
  Footprints,
  Gauge,
  Navigation,
  Play,
  Square,
  Sun,
} from 'lucide-react';
import type { CameraCapture, LiveSensorsSnapshot } from '../types/sensor';
import { CameraPanel } from './CameraPanel';
import { CompassDial } from './CompassDial';
import { GpsRadarPlot } from './GpsRadarPlot';
import { SparklineChart } from './SparklineChart';

interface DashboardTabProps {
  userEmail: string;
  snapshot: LiveSensorsSnapshot;
  dailyStepGoal: number;
  accelHistory: number[];
  gyroHistory: number[];
  isRecording: boolean;
  activeSampleCount: number;
  samplingIntervalMs: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRequestMotionPermission: () => void;
  onRequestLocation: () => void;
  onCaptureSaved: (capture: CameraCapture) => Promise<void>;
  onCameraAvailabilityChange: (available: boolean) => void;
}

export function DashboardTab({
  userEmail,
  snapshot,
  dailyStepGoal,
  accelHistory,
  gyroHistory,
  isRecording,
  activeSampleCount,
  samplingIntervalMs,
  onStartRecording,
  onStopRecording,
  onRequestMotionPermission,
  onRequestLocation,
  onCaptureSaved,
  onCameraAvailabilityChange,
}: DashboardTabProps) {
  const goalPct =
    dailyStepGoal > 0
      ? Math.min(100, Math.round((snapshot.steps.todaySteps / dailyStepGoal) * 100))
      : 0;
  const ringCircumference = 2 * Math.PI * 36;
  const ringOffset = ringCircumference - (goalPct / 100) * ringCircumference;

  return (
    <div className="space-y-6">
      {/* Top Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Live Telemetry Recording
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
            Sampling {(samplingIntervalMs / 1000).toFixed(1)}s
            {isRecording ? ` · Recording active · ${activeSampleCount} samples saved` : ' · Standby'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {snapshot.motionPermissionRequired && !snapshot.motionPermissionGranted && (
            <button
              type="button"
              onClick={onRequestMotionPermission}
              className="min-h-[44px] px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Enable Motion Sensors
            </button>
          )}
          <button
            type="button"
            onClick={isRecording ? onStopRecording : onStartRecording}
            className={`min-h-[44px] px-5 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-colors whitespace-nowrap ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                Stop Recording
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Start Recording
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step Counter + Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                strokeWidth="7"
                className="stroke-slate-100 dark:stroke-slate-800"
              />
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                className="stroke-blue-600 transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-mono tabular-nums font-bold">
              {goalPct}%
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Footprints className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Today&apos;s Steps</span>
            </div>
            <div className="text-2xl font-mono tabular-nums font-bold mt-1">
              {snapshot.steps.todaySteps.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                / {dailyStepGoal.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
              Total: {snapshot.steps.totalSteps.toLocaleString()} steps
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {snapshot.steps.sourceLabel}
            </div>
          </div>
        </div>

        <SparklineChart
          title="Accelerometer |a|"
          unit="m/s²"
          values={accelHistory}
          color="#2563EB"
          available={snapshot.accelerometer.available}
        />

        <SparklineChart
          title="Gyroscope |ω|"
          unit="rad/s"
          values={gyroHistory}
          color="#0891B2"
          available={snapshot.gyroscope.available}
        />
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Accelerometer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Accelerometer</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">m/s²</span>
          </div>
          {snapshot.accelerometer.available && snapshot.accelerometer.value ? (
            <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-sm">
              <div>
                <div className="text-[11px] text-slate-400">X</div>
                <div className="font-semibold">{snapshot.accelerometer.value.x.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Y</div>
                <div className="font-semibold">{snapshot.accelerometer.value.y.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Z</div>
                <div className="font-semibold">{snapshot.accelerometer.value.z.toFixed(2)}</div>
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
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Gyroscope</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">rad/s</span>
          </div>
          {snapshot.gyroscope.available && snapshot.gyroscope.value ? (
            <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-sm">
              <div>
                <div className="text-[11px] text-slate-400">X</div>
                <div className="font-semibold">{snapshot.gyroscope.value.x.toFixed(3)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Y</div>
                <div className="font-semibold">{snapshot.gyroscope.value.y.toFixed(3)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Z</div>
                <div className="font-semibold">{snapshot.gyroscope.value.z.toFixed(3)}</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sensor not available on this device
            </p>
          )}
        </div>

        {/* Magnetometer / Compass */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Magnetometer / Compass
            </span>
          </div>
          <CompassDial
            headingDeg={snapshot.magnetometer.headingDeg}
            available={snapshot.magnetometer.available}
          />
        </div>

        {/* Barometer + Ambient Light + Proximity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Barometer
              </span>
              <span className="text-xs text-slate-400">hPa</span>
            </div>
            {snapshot.barometer.available && snapshot.barometer.pressureHpa !== null ? (
              <div className="text-lg font-mono tabular-nums font-semibold">
                {snapshot.barometer.pressureHpa.toFixed(2)} hPa
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sensor not available on this device
              </p>
            )}
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                Ambient Light
              </span>
              <span className="text-xs text-slate-400">lux</span>
            </div>
            {snapshot.ambientLight.available && snapshot.ambientLight.lux !== null ? (
              <div className="text-lg font-mono tabular-nums font-semibold">
                {snapshot.ambientLight.lux.toFixed(1)} lux
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sensor not available on this device
              </p>
            )}
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">Proximity Sensor</span>
            </div>
            {snapshot.proximity.available ? (
              <div className="text-sm font-mono tabular-nums font-semibold">
                {snapshot.proximity.label ?? snapshot.proximity.value}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sensor not available on this device
              </p>
            )}
          </div>
        </div>

        {/* GPS / Navigation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              GPS &amp; Navigation
            </span>
          </div>
          <GpsRadarPlot gps={snapshot.gps} onRequestLocation={onRequestLocation} />
        </div>

        {/* Battery */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                {snapshot.battery.charging ? (
                  <BatteryCharging className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Battery className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                )}
                Device Battery
              </span>
            </div>
            {snapshot.battery.available && snapshot.battery.levelPercent !== null ? (
              <div>
                <div className="text-3xl font-mono tabular-nums font-bold">
                  {snapshot.battery.levelPercent}%
                </div>
                <div className="mt-3 w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      snapshot.battery.charging ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${snapshot.battery.levelPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {snapshot.battery.charging ? 'Charging via power source' : 'Discharging on battery'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sensor not available on this device
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Live Camera Sensor & Snapshot Capture */}
      <CameraPanel
        userEmail={userEmail}
        snapshot={snapshot}
        onCaptureSaved={onCaptureSaved}
        onAvailabilityChange={onCameraAvailabilityChange}
        compact
      />
    </div>
  );
}

import React from 'react';
import type { LiveSensorsSnapshot } from '../types/sensor';

interface GpsRadarPlotProps {
  gps: LiveSensorsSnapshot['gps'];
  onRequestLocation: () => void;
}

export function GpsRadarPlot({ gps, onRequestLocation }: GpsRadarPlotProps) {
  if (!gps.available && gps.errorMessage) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-rose-600 dark:text-rose-400">{gps.errorMessage}</p>
        <button
          type="button"
          onClick={onRequestLocation}
          className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Retry GPS Permission
        </button>
      </div>
    );
  }

  if (gps.latitude === null || gps.longitude === null) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Waiting for GPS coordinates or location authorization.
        </p>
        <button
          type="button"
          onClick={onRequestLocation}
          className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Enable GPS Tracking
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative h-28 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <svg viewBox="0 0 280 112" className="w-full h-full">
          {[35, 70, 105, 140, 175, 210, 245].map((x) => (
            <line
              key={x}
              x1={x}
              y1={0}
              x2={x}
              y2={112}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="1"
            />
          ))}
          {[28, 56, 84].map((y) => (
            <line
              key={y}
              x1={0}
              y1={y}
              x2={280}
              y2={y}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="1"
            />
          ))}
          <circle cx="140" cy="56" r="26" className="fill-blue-600/10 stroke-blue-500/40" />
          <circle cx="140" cy="56" r="6" className="fill-blue-600" />
        </svg>
        <div className="absolute bottom-2 left-2.5 text-[11px] font-mono tabular-nums font-medium text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
          {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-slate-500 dark:text-slate-400">Altitude</div>
          <div className="font-mono tabular-nums font-medium">
            {gps.altitude !== null ? `${gps.altitude.toFixed(1)} m` : '--'}
          </div>
        </div>
        <div>
          <div className="text-slate-500 dark:text-slate-400">Speed</div>
          <div className="font-mono tabular-nums font-medium">
            {gps.speed !== null ? `${gps.speed.toFixed(2)} m/s` : '--'}
          </div>
        </div>
        <div>
          <div className="text-slate-500 dark:text-slate-400">Bearing</div>
          <div className="font-mono tabular-nums font-medium">
            {gps.bearing !== null ? `${gps.bearing.toFixed(1)}°` : '--'}
          </div>
        </div>
      </div>
    </div>
  );
}

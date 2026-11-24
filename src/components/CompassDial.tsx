import React from 'react';

interface CompassDialProps {
  headingDeg: number | null;
  available: boolean;
}

function cardinalDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export function CompassDial({ headingDeg, available }: CompassDialProps) {
  if (!available || headingDeg === null) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Sensor not available on this device
      </p>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 80" className="w-16 h-16 shrink-0">
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth="2"
        />
        <text x="40" y="15" textAnchor="middle" className="fill-slate-400 text-[8px] font-mono">
          N
        </text>
        <text x="66" y="43" textAnchor="middle" className="fill-slate-400 text-[8px] font-mono">
          E
        </text>
        <text x="40" y="71" textAnchor="middle" className="fill-slate-400 text-[8px] font-mono">
          S
        </text>
        <text x="14" y="43" textAnchor="middle" className="fill-slate-400 text-[8px] font-mono">
          W
        </text>
        <g transform={`rotate(${headingDeg} 40 40)`}>
          <polygon points="40,16 44,40 40,36 36,40" fill="#2563EB" />
          <polygon points="40,64 44,40 40,44 36,40" className="fill-slate-400 dark:fill-slate-600" />
        </g>
        <circle cx="40" cy="40" r="3" className="fill-slate-900 dark:fill-white" />
      </svg>
      <div>
        <div className="text-2xl font-mono tabular-nums font-semibold">
          {headingDeg.toFixed(1)}°
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Bearing {cardinalDirection(headingDeg)}
        </div>
      </div>
    </div>
  );
}

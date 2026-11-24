import React, { useState } from 'react';

interface SparklineChartProps {
  title: string;
  unit: string;
  values: number[];
  color?: string;
  available: boolean;
}

export function SparklineChart({
  title,
  unit,
  values,
  color = '#2563EB',
  available,
}: SparklineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 420;
  const height = 110;
  const pad = 10;

  const latest = values.length > 0 ? values[values.length - 1] : null;
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 1;
  const span = maxVal - minVal || 1;

  const points = values.map((v, i) => {
    const x =
      values.length === 1
        ? width / 2
        : pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - minVal) / span) * (height - pad * 2);
    return { x, y, v };
  });

  const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath =
    points.length > 1
      ? `M ${points[0].x},${height - pad} L ${points
          .map((p) => `${p.x},${p.y}`)
          .join(' L ')} L ${points[points.length - 1].x},${height - pad} Z`
      : '';

  const activePoint = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <span className="text-xs font-mono tabular-nums font-medium text-blue-600 dark:text-blue-400">
          {!available
            ? 'Sensor unavailable'
            : activePoint
              ? `${activePoint.v.toFixed(2)} ${unit}`
              : latest !== null
                ? `${latest.toFixed(2)} ${unit}`
                : `-- ${unit}`}
        </span>
      </div>

      {!available ? (
        <div className="h-[110px] flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
          Sensor not available on this device
        </div>
      ) : points.length < 2 ? (
        <div className="h-[110px] flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
          Collecting live telemetry samples...
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-[110px] cursor-crosshair overflow-visible"
            onMouseLeave={() => setHoverIdx(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = (e.clientX - rect.left) / rect.width;
              const idx = Math.min(
                points.length - 1,
                Math.max(0, Math.round(relX * (points.length - 1)))
              );
              setHoverIdx(idx);
            }}
          >
            <line
              x1={pad}
              y1={pad}
              x2={width - pad}
              y2={pad}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeDasharray="3 3"
            />
            <line
              x1={pad}
              y1={height / 2}
              x2={width - pad}
              y2={height / 2}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeDasharray="3 3"
            />
            <line
              x1={pad}
              y1={height - pad}
              x2={width - pad}
              y2={height - pad}
              className="stroke-slate-200 dark:stroke-slate-800"
            />
            {areaPath && <path d={areaPath} fill={color} fillOpacity="0.1" />}
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={polyline}
            />
            {activePoint && (
              <>
                <line
                  x1={activePoint.x}
                  y1={pad}
                  x2={activePoint.x}
                  y2={height - pad}
                  stroke={color}
                  strokeOpacity="0.4"
                  strokeDasharray="2 2"
                />
                <circle cx={activePoint.x} cy={activePoint.y} r="4" fill={color} />
              </>
            )}
          </svg>
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400 mt-1">
            <span>Min {minVal.toFixed(2)}</span>
            <span>Max {maxVal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

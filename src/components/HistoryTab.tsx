import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import type { CameraCapture, DailySteps, RecordingSession } from '../types/sensor';

interface HistoryTabProps {
  sessions: RecordingSession[];
  stepHistory: DailySteps[];
  cameraCaptures: CameraCapture[];
  onExportSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onDeleteCapture: (id: number) => void;
}

export function HistoryTab({
  sessions,
  stepHistory,
  cameraCaptures,
  onExportSession,
  onDeleteSession,
  onDeleteCapture,
}: HistoryTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Step History */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-semibold mb-1">Daily Step History</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Resets automatically at midnight in your device timezone
        </p>

        {stepHistory.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
            No daily step logs recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stepHistory.map((day) => {
              const pct = day.goal > 0 ? Math.min(100, Math.round((day.steps / day.goal) * 100)) : 0;
              return (
                <div key={day.dateKey} className="py-3">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-mono tabular-nums font-medium">{day.dateKey}</span>
                    <span className="font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
                      {day.steps.toLocaleString()} / {day.goal.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recorded Sessions */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-semibold mb-1">Recorded Sessions</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Stored locally in browser IndexedDB (sqflite equivalent on Android)
        </p>

        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
            No recorded sessions yet. Use Start Recording on the Dashboard tab.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-mono tabular-nums font-medium truncate">
                    {session.startedAt}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                    {session.sampleCount} samples · {session.endedAt ? 'Completed' : 'Recording'}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onExportSession(session.id)}
                    title="Download Session CSV"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSession(session.id)}
                    title="Delete Session"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Captured Camera Snapshots */}
      <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-semibold mb-1">Camera Snapshots</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Telemetry-tagged JPEG snapshots stored locally in IndexedDB
        </p>

        {cameraCaptures.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
            No camera snapshots captured yet. Start the Camera on the Dashboard or Sensors tab.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameraCaptures.map((cap) => (
              <div
                key={cap.id ?? cap.timestamp}
                className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950"
              >
                <img
                  src={cap.dataUrl}
                  alt={`Snapshot at ${cap.timestamp}`}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-3 space-y-1.5">
                  <div className="text-xs font-mono tabular-nums font-medium truncate">
                    {cap.timestamp}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {cap.facingMode === 'environment' ? 'Rear' : 'Front'} · {cap.width}×{cap.height} · Steps {cap.stepCount}
                  </div>
                  {cap.latitude !== null && cap.longitude !== null && (
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      GPS {cap.latitude.toFixed(5)}, {cap.longitude.toFixed(5)}
                    </div>
                  )}
                  <div className="pt-1 flex items-center justify-end gap-1">
                    <a
                      href={cap.dataUrl}
                      download={`sensor_snapshot_${cap.timestamp.replace(/[:+]/g, '-')}.jpg`}
                      className="min-h-[36px] px-2.5 inline-flex items-center gap-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      JPG
                    </a>
                    {cap.id !== undefined && (
                      <button
                        type="button"
                        onClick={() => onDeleteCapture(cap.id!)}
                        title="Delete Snapshot"
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

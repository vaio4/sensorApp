import React, { useEffect, useState } from 'react';
import { Code2, Download, FileSpreadsheet, Share2, Terminal } from 'lucide-react';
import { getReadingsInDateRange } from '../services/localDb';
import type { SensorReading } from '../types/sensor';
import { buildCsvContent, CSV_HEADERS, triggerCsvDownload } from '../utils/csv';
import {
  downloadFlutterProjectZip,
  getFlutterProjectFiles,
  type FlutterSourceFile,
} from '../utils/flutterBundle';
import { localDateKey } from '../utils/isoDate';

interface ExportTabProps {
  userEmail: string;
}

export function ExportTab({ userEmail }: ExportTabProps) {
  const today = localDateKey();
  const weekAgo = localDateKey(new Date(Date.now() - 7 * 86400_000));

  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [flutterFiles] = useState<FlutterSourceFile[]>(() => getFlutterProjectFiles());
  const [selectedFile, setSelectedFile] = useState<string>('pubspec.yaml');

  const loadReadings = async () => {
    setLoading(true);
    try {
      const rows = await getReadingsInDateRange(startDate, endDate, userEmail);
      setReadings(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReadings();
  }, [startDate, endDate, userEmail]);

  const handleDownloadCsv = () => {
    if (readings.length === 0) return;
    const csv = buildCsvContent(readings);
    const fileName = `sensor_readings_${startDate}_to_${endDate}.csv`;
    triggerCsvDownload(csv, fileName);
    setExportStatus(`CSV exported successfully: ${fileName} (${readings.length} rows)`);
  };

  const handleShareCsv = async () => {
    if (readings.length === 0) return;
    const csv = buildCsvContent(readings);
    const fileName = `sensor_readings_${startDate}_to_${endDate}.csv`;
    const file = new File([csv], fileName, { type: 'text/csv' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Sensor Data Dashboard CSV',
          files: [file],
        });
        setExportStatus(`Shared ${fileName} via system share sheet.`);
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    triggerCsvDownload(csv, fileName);
    setExportStatus(`CSV downloaded: ${fileName}`);
  };

  const handleDownloadFlutterZip = async () => {
    await downloadFlutterProjectZip();
    setExportStatus(
      `Downloaded sensor-data-dashboard-flutter.zip (${flutterFiles.length} source files).`
    );
  };

  const activeFileContent =
    flutterFiles.find((f) => f.path === selectedFile)?.content ?? '';

  return (
    <div className="space-y-6">
      {/* CSV Export Panel */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              CSV Sensor Data Export
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ISO 8601 timestamps with local offset · 19 standardized telemetry columns
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs">
              <span className="block text-slate-500 dark:text-slate-400 mb-1">From Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs"
              />
            </label>
            <label className="text-xs">
              <span className="block text-slate-500 dark:text-slate-400 mb-1">To Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs"
              />
            </label>
            <button
              type="button"
              disabled={readings.length === 0}
              onClick={handleDownloadCsv}
              className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Download CSV ({readings.length})
            </button>
            <button
              type="button"
              disabled={readings.length === 0}
              onClick={handleShareCsv}
              className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Share2 className="w-4 h-4" />
              Share CSV
            </button>
          </div>
        </div>

        {exportStatus && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-mono">
            {exportStatus}
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading readings...</div>
          ) : readings.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No recorded readings in this date range. Start a recording session on the Dashboard tab first.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono tabular-nums whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  {CSV_HEADERS.map((col) => (
                    <th key={col} className="px-3 py-2.5 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {readings.slice(0, 20).map((r, idx) => (
                  <tr key={r.id ?? idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2">{r.timestamp}</td>
                    <td className="px-3 py-2">{r.userEmail}</td>
                    <td className="px-3 py-2">{r.stepCount}</td>
                    <td className="px-3 py-2">{r.accelerometerX?.toFixed(3) ?? ''}</td>
                    <td className="px-3 py-2">{r.accelerometerY?.toFixed(3) ?? ''}</td>
                    <td className="px-3 py-2">{r.accelerometerZ?.toFixed(3) ?? ''}</td>
                    <td className="px-3 py-2">{r.gyroscopeX?.toFixed(3) ?? ''}</td>
                    <td className="px-3 py-2">{r.gyroscopeY?.toFixed(3) ?? ''}</td>
                    <td className="px-3 py-2">{r.gyroscopeZ?.toFixed(3) ?? ''}</td>
                    <td className="px-3 py-2">{r.magnetometerHeading?.toFixed(1) ?? ''}</td>
                    <td className="px-3 py-2">{r.pressureHpa?.toFixed(2) ?? ''}</td>
                    <td className="px-3 py-2">{r.lightLux?.toFixed(1) ?? ''}</td>
                    <td className="px-3 py-2">{r.proximity?.toFixed(1) ?? ''}</td>
                    <td className="px-3 py-2">{r.latitude?.toFixed(6) ?? ''}</td>
                    <td className="px-3 py-2">{r.longitude?.toFixed(6) ?? ''}</td>
                    <td className="px-3 py-2">{r.altitude?.toFixed(1) ?? ''}</td>
                    <td className="px-3 py-2">{r.speed?.toFixed(2) ?? ''}</td>
                    <td className="px-3 py-2">{r.bearing?.toFixed(1) ?? ''}</td>
                    <td className="px-3 py-2">{r.batteryLevel ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Flutter Android Project & APK Build Bundle */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Flutter Android 8.0+ Source &amp; APK Build
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Complete {flutterFiles.length}-file Flutter project configured for{' '}
              <span className="font-mono">sensor_data_dashboard.apk</span>. Note: this web container
              does not include the Android SDK/Flutter compiler, so download the project zip and run{' '}
              <span className="font-mono">flutter build apk --release</span> locally.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadFlutterZip}
            className="min-h-[44px] px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            Download Flutter Project (.zip)
          </button>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>Build sensor_data_dashboard.apk locally:</span>
          </div>
          <div>1. unzip sensor-data-dashboard-flutter.zip &amp;&amp; cd sensor_data_dashboard</div>
          <div>2. flutterfire configure --platforms=android</div>
          <div>3. flutter pub get &amp;&amp; flutter build apk --release</div>
          <div className="text-slate-500">
            Output: build/app/outputs/flutter-apk/sensor_data_dashboard.apk
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-1 border border-slate-200 dark:border-slate-800 rounded-lg max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {flutterFiles.map((f) => (
              <button
                key={f.path}
                type="button"
                onClick={() => setSelectedFile(f.path)}
                className={`w-full text-left px-3 py-2 text-xs font-mono truncate transition-colors ${
                  selectedFile === f.path
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                {f.path}
              </button>
            ))}
          </div>

          <pre className="lg:col-span-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 p-4 text-xs font-mono overflow-auto max-h-72 text-slate-800 dark:text-slate-200">
            {activeFileContent}
          </pre>
        </div>
      </section>
    </div>
  );
}

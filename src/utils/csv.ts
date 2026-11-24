import type { SensorReading } from '../types/sensor';

export const CSV_HEADERS = [
  'timestamp',
  'user_email',
  'step_count',
  'accelerometer_x',
  'accelerometer_y',
  'accelerometer_z',
  'gyroscope_x',
  'gyroscope_y',
  'gyroscope_z',
  'magnetometer_heading',
  'pressure_hpa',
  'light_lux',
  'proximity',
  'latitude',
  'longitude',
  'altitude',
  'speed',
  'bearing',
  'battery_level',
] as const;

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function fmtNum(val: number | null, digits: number): string {
  return val === null || Number.isNaN(val) ? '' : val.toFixed(digits);
}

export function buildCsvContent(readings: SensorReading[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const r of readings) {
    const row = [
      r.timestamp,
      r.userEmail,
      r.stepCount,
      fmtNum(r.accelerometerX, 4),
      fmtNum(r.accelerometerY, 4),
      fmtNum(r.accelerometerZ, 4),
      fmtNum(r.gyroscopeX, 4),
      fmtNum(r.gyroscopeY, 4),
      fmtNum(r.gyroscopeZ, 4),
      fmtNum(r.magnetometerHeading, 2),
      fmtNum(r.pressureHpa, 2),
      fmtNum(r.lightLux, 1),
      fmtNum(r.proximity, 2),
      fmtNum(r.latitude, 6),
      fmtNum(r.longitude, 6),
      fmtNum(r.altitude, 2),
      fmtNum(r.speed, 2),
      fmtNum(r.bearing, 2),
      r.batteryLevel ?? '',
    ].map(escapeCsvCell);
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

export function triggerCsvDownload(csvText: string, fileName: string): void {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

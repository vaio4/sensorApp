/**
 * Formats a Date into ISO 8601 with local timezone offset,
 * e.g. 2026-11-24T15:04:00+05:30
 */
export function formatIso8601WithOffset(date: Date = new Date()): string {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const offHours = pad2(Math.floor(abs / 60));
  const offMins = pad2(abs % 60);

  return (
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` +
    `T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}` +
    `${sign}${offHours}:${offMins}`
  );
}

/**
 * Returns local calendar date key YYYY-MM-DD in device timezone.
 */
export function localDateKey(date: Date = new Date()): string {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

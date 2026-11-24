/// Formats a [DateTime] into strict ISO 8601 with local timezone offset,
/// e.g. `2026-11-24T15:04:00+05:30`.
String formatIso8601WithOffset(DateTime dt) {
  final local = dt.toLocal();
  String pad2(int n) => n.toString().padLeft(2, '0');
  final offset = local.timeZoneOffset;
  final sign = offset.isNegative ? '-' : '+';
  final absMinutes = offset.inMinutes.abs();
  final offsetHours = pad2(absMinutes ~/ 60);
  final offsetMins = pad2(absMinutes % 60);

  return '${local.year}-${pad2(local.month)}-${pad2(local.day)}'
      'T${pad2(local.hour)}:${pad2(local.minute)}:${pad2(local.second)}'
      '$sign$offsetHours:$offsetMins';
}

String localDateKey(DateTime dt) {
  final local = dt.toLocal();
  String pad2(int n) => n.toString().padLeft(2, '0');
  return '${local.year}-${pad2(local.month)}-${pad2(local.day)}';
}

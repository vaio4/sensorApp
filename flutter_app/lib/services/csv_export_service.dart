import 'dart:io';
import 'package:csv/csv.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';
import '../models/sensor_reading.dart';
import '../utils/constants.dart';

class CsvExportService {
  String buildCsvString(List<SensorReading> readings) {
    final rows = <List<dynamic>>[
      AppConstants.csvHeaders,
      ...readings.map((r) => r.toCsvRow()),
    ];
    return const ListToCsvConverter().convert(rows);
  }

  Future<String> saveCsvToDownloads(List<SensorReading> readings, {String? fileName}) async {
    final csvData = buildCsvString(readings);
    final stamp = DateTime.now().toIso8601String().replaceAll(':', '-').split('.').first;
    final name = fileName ?? 'sensor_readings_$stamp.csv';

    if (Platform.isAndroid) {
      // Request storage permission on Android 8-12 (API 26-32)
      await Permission.storage.request();

      final publicDownloadDir = Directory('/storage/emulated/0/Download');
      if (await publicDownloadDir.exists()) {
        try {
          final file = File(p.join(publicDownloadDir.path, name));
          await file.writeAsString(csvData);
          return file.path;
        } catch (_) {
          // Scoped storage fallback on Android 11+
        }
      }

      final extDirs = await getExternalStorageDirectories(type: StorageDirectory.downloads);
      if (extDirs != null && extDirs.isNotEmpty) {
        final file = File(p.join(extDirs.first.path, name));
        await file.writeAsString(csvData);
        return file.path;
      }
    }

    final docsDir = await getApplicationDocumentsDirectory();
    final file = File(p.join(docsDir.path, name));
    await file.writeAsString(csvData);
    return file.path;
  }

  Future<void> shareCsv(List<SensorReading> readings) async {
    final path = await saveCsvToDownloads(readings);
    await Share.shareXFiles([XFile(path)], text: 'Sensor Data Dashboard CSV Export');
  }
}

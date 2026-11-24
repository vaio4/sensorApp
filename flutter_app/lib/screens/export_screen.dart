import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/sensor_reading.dart';
import '../providers/app_state_provider.dart';
import '../services/csv_export_service.dart';
import '../services/database_service.dart';
import '../utils/iso_date_formatter.dart';

class ExportScreen extends StatefulWidget {
  const ExportScreen({super.key});

  @override
  State<ExportScreen> createState() => _ExportScreenState();
}

class _ExportScreenState extends State<ExportScreen> {
  final CsvExportService _csvService = CsvExportService();
  DateTimeRange _range = DateTimeRange(
    start: DateTime.now().subtract(const Duration(days: 7)),
    end: DateTime.now(),
  );
  List<SensorReading> _readings = [];
  bool _loading = false;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _loadPreview();
  }

  Future<void> _loadPreview() async {
    setState(() => _loading = true);
    final email = context.read<AppStateProvider>().userProfile?.email;
    final rows = await DatabaseService.instance.getReadingsInDateRange(
      _range.start,
      _range.end,
      userEmail: email,
    );
    if (mounted) {
      setState(() {
        _readings = rows;
        _loading = false;
      });
    }
  }

  Future<void> _pickRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2024),
      lastDate: DateTime.now().add(const Duration(days: 1)),
      initialDateRange: _range,
    );
    if (picked != null) {
      setState(() => _range = picked);
      await _loadPreview();
    }
  }

  Future<void> _downloadCsv() async {
    if (_readings.isEmpty) return;
    final path = await _csvService.saveCsvToDownloads(_readings);
    if (mounted) {
      setState(() => _statusMessage = 'CSV exported successfully to:\n$path');
    }
  }

  Future<void> _shareCsv() async {
    if (_readings.isEmpty) return;
    await _csvService.shareCsv(_readings);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          elevation: 0,
          child: ListTile(
            title: const Text('Date Range Filter'),
            subtitle: Text('${localDateKey(_range.start)} to ${localDateKey(_range.end)}'),
            trailing: OutlinedButton(
              onPressed: _pickRange,
              child: const Text('Select Dates'),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: _readings.isEmpty ? null : _downloadCsv,
                icon: const Icon(Icons.download),
                label: Text('Download CSV (${_readings.length})'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _readings.isEmpty ? null : _shareCsv,
                icon: const Icon(Icons.share),
                label: const Text('Share CSV'),
              ),
            ),
          ],
        ),
        if (_statusMessage != null) ...[
          const SizedBox(height: 12),
          Card(
            color: const Color(0xFF16A34A).withOpacity(0.12),
            elevation: 0,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Text(_statusMessage!, style: const TextStyle(color: Color(0xFF15803D))),
            ),
          ),
        ],
        const SizedBox(height: 16),
        Text(
          'CSV Preview (${_readings.length} rows)',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        if (_loading)
          const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
        else if (_readings.isEmpty)
          const Card(
            elevation: 0,
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No recorded readings found in the selected date range.'),
            ),
          )
        else
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columns: const [
                DataColumn(label: Text('timestamp')),
                DataColumn(label: Text('steps')),
                DataColumn(label: Text('accel_x')),
                DataColumn(label: Text('gyro_x')),
                DataColumn(label: Text('lat')),
                DataColumn(label: Text('lon')),
                DataColumn(label: Text('battery')),
              ],
              rows: _readings.take(25).map((r) {
                return DataRow(
                  cells: [
                    DataCell(Text(r.timestamp)),
                    DataCell(Text('${r.stepCount}')),
                    DataCell(Text(r.accelerometerX?.toStringAsFixed(2) ?? '')),
                    DataCell(Text(r.gyroscopeX?.toStringAsFixed(3) ?? '')),
                    DataCell(Text(r.latitude?.toStringAsFixed(5) ?? '')),
                    DataCell(Text(r.longitude?.toStringAsFixed(5) ?? '')),
                    DataCell(Text('${r.batteryLevel ?? ''}')),
                  ],
                );
              }).toList(),
            ),
          ),
      ],
    );
  }
}

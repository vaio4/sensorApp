import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state_provider.dart';
import '../services/database_service.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: appState.refreshHistory,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Daily Step History', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (appState.stepHistory.isEmpty)
            const Card(
              elevation: 0,
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('No daily step records yet.'),
              ),
            )
          else
            ...appState.stepHistory.map(
              (day) => Card(
                elevation: 0,
                child: ListTile(
                  title: Text(day.dateKey, style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()])),
                  subtitle: LinearProgressIndicator(
                    value: day.goal > 0 ? (day.steps / day.goal).clamp(0.0, 1.0) : 0,
                  ),
                  trailing: Text(
                    '${day.steps} / ${day.goal}',
                    style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()], fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ),
          const SizedBox(height: 24),
          Text('Recorded Sessions', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (appState.sessions.isEmpty)
            const Card(
              elevation: 0,
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('No recorded sessions yet. Start recording on the Dashboard tab.'),
              ),
            )
          else
            ...appState.sessions.map(
              (session) => Card(
                elevation: 0,
                child: ListTile(
                  title: Text(session.startedAt),
                  subtitle: Text('${session.sampleCount} samples · ${session.endedAt ?? "In progress"}'),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () async {
                      await DatabaseService.instance.deleteSession(session.id);
                      await appState.refreshHistory();
                    },
                  ),
                ),
              ),
            ),
          const SizedBox(height: 24),
          Text('Camera Snapshots', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (appState.cameraCaptures.isEmpty)
            const Card(
              elevation: 0,
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('No camera snapshots captured yet. Open Sensors tab to capture.'),
              ),
            )
          else
            ...appState.cameraCaptures.map(
              (cap) => Card(
                elevation: 0,
                child: ListTile(
                  leading: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      File(cap.filePath),
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(Icons.broken_image),
                    ),
                  ),
                  title: Text('${cap.lensDirection} · ${cap.timestamp}'),
                  subtitle: Text('Steps: ${cap.stepCount} · Lux: ${cap.lightLux?.toStringAsFixed(1) ?? '--'}'),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () async {
                      if (cap.id != null) {
                        await DatabaseService.instance.deleteCameraCapture(cap.id!);
                        await appState.refreshHistory();
                      }
                    },
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

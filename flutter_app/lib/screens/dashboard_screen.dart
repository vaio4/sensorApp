import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state_provider.dart';
import '../widgets/camera_preview_card.dart';
import '../widgets/gps_map_preview.dart';
import '../widgets/live_line_chart.dart';
import '../widgets/sensor_card.dart';
import '../widgets/step_progress_ring.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final s = appState.sensorService;
    final loc = appState.locationService;
    final steps = appState.stepTracker;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: appState.isRecording ? appState.stopRecording : appState.startRecording,
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  backgroundColor: appState.isRecording ? const Color(0xFFDC2626) : const Color(0xFF2563EB),
                ),
                icon: Icon(appState.isRecording ? Icons.stop : Icons.fiber_manual_record),
                label: Text(
                  appState.isRecording
                      ? 'Stop Recording (${appState.activeSampleCount} samples)'
                      : 'Start Recording',
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        StepProgressRing(
          todaySteps: steps.todaySteps,
          totalSteps: steps.totalHistoricalSteps,
          goal: appState.userProfile?.dailyStepGoal ?? 10000,
          sourceLabel: steps.hardwarePedometerAvailable
              ? 'Hardware Step Counter'
              : 'Accelerometer Step Detection',
        ),
        const SizedBox(height: 12),
        LiveLineChart(
          title: 'Accelerometer Magnitude Squared',
          values: appState.accelMagHistory,
          color: const Color(0xFF2563EB),
          unit: 'm²/s⁴',
        ),
        const SizedBox(height: 12),
        SensorCard(
          title: 'Accelerometer (m/s²)',
          icon: Icons.speed,
          isAvailable: s.accelAvailable,
          child: Text(
            'X: ${s.accelX?.toStringAsFixed(2) ?? '--'}   '
            'Y: ${s.accelY?.toStringAsFixed(2) ?? '--'}   '
            'Z: ${s.accelZ?.toStringAsFixed(2) ?? '--'}',
            style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()]),
          ),
        ),
        const SizedBox(height: 12),
        SensorCard(
          title: 'Gyroscope (rad/s)',
          icon: Icons.rotate_right,
          isAvailable: s.gyroAvailable,
          child: Text(
            'X: ${s.gyroX?.toStringAsFixed(3) ?? '--'}   '
            'Y: ${s.gyroY?.toStringAsFixed(3) ?? '--'}   '
            'Z: ${s.gyroZ?.toStringAsFixed(3) ?? '--'}',
            style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()]),
          ),
        ),
        const SizedBox(height: 12),
        SensorCard(
          title: 'GPS & Navigation',
          icon: Icons.location_on,
          isAvailable: loc.isAvailable || loc.errorMessage != null,
          child: GpsMapPreview(
            latitude: loc.latitude,
            longitude: loc.longitude,
            altitude: loc.altitude,
            speed: loc.speed,
            bearing: loc.bearing,
            errorMessage: loc.errorMessage,
            onRetryPermission: loc.initialize,
          ),
        ),
        const SizedBox(height: 12),
        SensorCard(
          title: 'Battery Status',
          icon: Icons.battery_std,
          isAvailable: s.batteryAvailable,
          child: Text(
            '${s.batteryLevel ?? '--'}% · ${s.batteryState.name}',
            style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()]),
          ),
        ),
        const SizedBox(height: 12),
        CameraPreviewCard(
          cameraService: appState.cameraService,
          onInitialize: appState.cameraService.initialize,
          onSwitchLens: appState.cameraService.switchLens,
          onToggleFlash: appState.cameraService.toggleFlash,
          onCapture: appState.capturePhoto,
          onStop: appState.cameraService.stop,
        ),
      ],
    );
  }
}

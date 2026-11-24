import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state_provider.dart';
import '../widgets/camera_preview_card.dart';
import '../widgets/gps_map_preview.dart';
import '../widgets/sensor_card.dart';

class SensorsScreen extends StatelessWidget {
  const SensorsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final s = appState.sensorService;
    final loc = appState.locationService;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          elevation: 0,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Sampling Interval', style: TextStyle(fontWeight: FontWeight.w600)),
                DropdownButton<int>(
                  value: appState.samplingIntervalMs,
                  items: const [
                    DropdownMenuItem(value: 500, child: Text('0.5 sec (2 Hz)')),
                    DropdownMenuItem(value: 1000, child: Text('1.0 sec (1 Hz)')),
                    DropdownMenuItem(value: 2000, child: Text('2.0 sec')),
                    DropdownMenuItem(value: 5000, child: Text('5.0 sec')),
                  ],
                  onChanged: (val) {
                    if (val != null) appState.setSamplingInterval(val);
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        SensorCard(
          title: 'Accelerometer',
          icon: Icons.vibration,
          isAvailable: s.accelAvailable,
          child: Text(
            'X: ${s.accelX?.toStringAsFixed(4) ?? '--'} m/s²\n'
            'Y: ${s.accelY?.toStringAsFixed(4) ?? '--'} m/s²\n'
            'Z: ${s.accelZ?.toStringAsFixed(4) ?? '--'} m/s²',
            style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()]),
          ),
        ),
        const SizedBox(height: 12),
        SensorCard(
          title: 'Gyroscope',
          icon: Icons.screen_rotation,
          isAvailable: s.gyroAvailable,
          child: Text(
            'X: ${s.gyroX?.toStringAsFixed(4) ?? '--'} rad/s\n'
            'Y: ${s.gyroY?.toStringAsFixed(4) ?? '--'} rad/s\n'
            'Z: ${s.gyroZ?.toStringAsFixed(4) ?? '--'} rad/s',
            style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()]),
          ),
        ),
        const SizedBox(height: 12),
        SensorCard(
          title: 'Magnetometer / Compass',
          icon: Icons.explore,
          isAvailable: s.magAvailable,
          child: Text(
            'Heading: ${s.magnetometerHeading?.toStringAsFixed(1) ?? '--'}°',
            style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()]),
          ),
        ),
        const SizedBox(height: 12),
        SensorCard(
          title: 'Barometer',
          icon: Icons.compress,
          isAvailable: s.baroAvailable,
          child: Text(
            'Pressure: ${s.pressureHpa?.toStringAsFixed(2) ?? '--'} hPa',
            style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()]),
          ),
        ),
        const SizedBox(height: 12),
        SensorCard(
          title: 'Ambient Light Sensor',
          icon: Icons.light_mode,
          isAvailable: s.lightAvailable,
          child: Text(
            'Illuminance: ${s.lightLux?.toStringAsFixed(1) ?? '--'} lux',
            style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()]),
          ),
        ),
        const SizedBox(height: 12),
        SensorCard(
          title: 'Proximity Sensor',
          icon: Icons.sensors,
          isAvailable: s.proximityAvailable,
          child: Text(
            s.proximity == null ? '--' : (s.proximity! > 0 ? 'Near (Object detected)' : 'Far (Clear)'),
          ),
        ),
        const SizedBox(height: 12),
        SensorCard(
          title: 'GPS & Navigation',
          icon: Icons.gps_fixed,
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
          title: 'Battery',
          icon: Icons.battery_charging_full,
          isAvailable: s.batteryAvailable,
          child: Text(
            'Level: ${s.batteryLevel ?? '--'}% · State: ${s.batteryState.name}',
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

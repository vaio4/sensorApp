import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final profile = appState.userProfile;
    final s = appState.sensorService;
    final loc = appState.locationService;

    final availability = <String, bool>{
      'Accelerometer': s.accelAvailable,
      'Gyroscope': s.gyroAvailable,
      'Magnetometer / Compass': s.magAvailable,
      'Barometer': s.baroAvailable,
      'Ambient Light': s.lightAvailable,
      'Proximity': s.proximityAvailable,
      'Hardware Step Counter': appState.stepTracker.hardwarePedometerAvailable,
      'GPS / Location': loc.isAvailable,
      'Battery Telemetry': s.batteryAvailable,
      'Camera Sensor': appState.cameraService.isAvailable,
    };

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          elevation: 0,
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: Text(profile?.displayName ?? 'User'),
            subtitle: Text(profile?.email ?? ''),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          elevation: 0,
          child: SwitchListTile(
            title: const Text('Dark Mode'),
            value: appState.isDarkMode,
            onChanged: (_) => appState.toggleTheme(),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Device Sensor Availability',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        Card(
          elevation: 0,
          child: Column(
            children: availability.entries.map((entry) {
              return ListTile(
                dense: true,
                title: Text(entry.key),
                trailing: Text(
                  entry.value ? 'Available' : 'Not Available',
                  style: TextStyle(
                    color: entry.value ? const Color(0xFF16A34A) : Theme.of(context).colorScheme.outline,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 24),
        OutlinedButton.icon(
          onPressed: () async {
            if (appState.isRecording) {
              await appState.stopRecording();
            }
            await appState.authService.signOut();
          },
          icon: const Icon(Icons.logout),
          label: const Text('Log Out'),
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        ),
      ],
    );
  }
}

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state_provider.dart';
import 'dashboard_screen.dart';
import 'export_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'sensors_screen.dart';

class HomeShell extends StatefulWidget {
  final User firebaseUser;
  const HomeShell({super.key, required this.firebaseUser});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _initUser();
  }

  Future<void> _initUser() async {
    final provider = context.read<AppStateProvider>();
    final profile = await provider.authService.ensureUserProfile(widget.firebaseUser);
    await provider.initializeForUser(profile);
    if (mounted) setState(() => _initialized = true);
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    if (!_initialized) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    const pages = [
      DashboardScreen(),
      SensorsScreen(),
      HistoryScreen(),
      ExportScreen(),
      ProfileScreen(),
    ];

    const titles = [
      'Dashboard',
      'Sensors',
      'History',
      'Export CSV',
      'Profile',
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(titles[_index]),
        actions: [
          if (appState.isRecording)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Center(
                child: Text(
                  'REC (${appState.activeSampleCount})',
                  style: const TextStyle(
                    color: Color(0xFFDC2626),
                    fontWeight: FontWeight.w700,
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
              ),
            ),
          IconButton(
            onPressed: appState.toggleTheme,
            icon: Icon(appState.isDarkMode ? Icons.light_mode : Icons.dark_mode),
            tooltip: 'Toggle Theme',
          ),
        ],
      ),
      body: pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.sensors_outlined), selectedIcon: Icon(Icons.sensors), label: 'Sensors'),
          NavigationDestination(icon: Icon(Icons.history_outlined), selectedIcon: Icon(Icons.history), label: 'History'),
          NavigationDestination(icon: Icon(Icons.download_outlined), selectedIcon: Icon(Icons.download), label: 'Export'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

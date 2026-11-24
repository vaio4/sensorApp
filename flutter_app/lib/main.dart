import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_state_provider.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppStateProvider(),
      child: const SensorDashboardApp(),
    ),
  );
}

class SensorDashboardApp extends StatelessWidget {
  const SensorDashboardApp({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();

    return MaterialApp(
      title: 'Sensor Data Dashboard',
      debugShowCheckedModeBanner: false,
      themeMode: appState.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        colorSchemeSeed: const Color(0xFF2563EB),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorSchemeSeed: const Color(0xFF3B82F6),
        scaffoldBackgroundColor: const Color(0xFF0B0E17),
      ),
      home: StreamBuilder(
        stream: appState.authService.authStateChanges,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          final user = snapshot.data;
          if (user == null) {
            return const LoginScreen();
          }
          return HomeShell(firebaseUser: user);
        },
      ),
    );
  }
}

import 'dart:async';
import 'package:flutter/material.dart';
import '../models/camera_capture.dart';
import '../models/daily_steps.dart';
import '../models/recording_session.dart';
import '../models/sensor_reading.dart';
import '../models/user_profile.dart';
import '../services/auth_service.dart';
import '../services/camera_service.dart';
import '../services/database_service.dart';
import '../services/location_service.dart';
import '../services/sensor_service.dart';
import '../services/step_tracker_service.dart';
import '../utils/iso_date_formatter.dart';

class AppStateProvider extends ChangeNotifier {
  final AuthService authService = AuthService();
  final SensorService sensorService = SensorService();
  final StepTrackerService stepTracker = StepTrackerService();
  final LocationService locationService = LocationService();
  final CameraService cameraService = CameraService();

  UserProfile? userProfile;
  bool isDarkMode = false;
  int samplingIntervalMs = 1000;

  bool isRecording = false;
  String? activeSessionId;
  int activeSampleCount = 0;
  Timer? _recordingTimer;
  Timer? _chartTimer;

  // Rolling chart history (last 30 points)
  final List<double> accelMagHistory = [];
  final List<double> gyroMagHistory = [];
  final List<double> lightHistory = [];

  List<RecordingSession> sessions = [];
  List<DailySteps> stepHistory = [];
  List<CameraCapture> cameraCaptures = [];

  Future<void> initializeForUser(UserProfile profile) async {
    userProfile = profile;
    samplingIntervalMs = profile.samplingIntervalMs;

    sensorService.onFallbackStepDetected = () {
      stepTracker.recordFallbackStep();
    };
    sensorService.onUpdate = notifyListeners;
    stepTracker.onStepUpdated = notifyListeners;
    locationService.onLocationChanged = notifyListeners;
    cameraService.onUpdate = notifyListeners;

    sensorService.startListening(
      samplingPeriod: Duration(milliseconds: samplingIntervalMs.clamp(200, 5000)),
    );
    await stepTracker.initialize(dailyGoal: profile.dailyStepGoal);
    await locationService.initialize();
    await refreshHistory();

    _chartTimer?.cancel();
    _chartTimer = Timer.periodic(Duration(milliseconds: samplingIntervalMs), (_) {
      _pushChartSample();
    });
    notifyListeners();
  }

  void _pushChartSample() {
    if (sensorService.accelAvailable && sensorService.accelX != null) {
      final ax = sensorService.accelX!;
      final ay = sensorService.accelY!;
      final az = sensorService.accelZ!;
      accelMagHistory.add((ax * ax + ay * ay + az * az));
      if (accelMagHistory.length > 30) accelMagHistory.removeAt(0);
    }
    if (sensorService.gyroAvailable && sensorService.gyroX != null) {
      final gx = sensorService.gyroX!;
      final gy = sensorService.gyroY!;
      final gz = sensorService.gyroZ!;
      gyroMagHistory.add((gx * gx + gy * gy + gz * gz));
      if (gyroMagHistory.length > 30) gyroMagHistory.removeAt(0);
    }
    if (sensorService.lightAvailable && sensorService.lightLux != null) {
      lightHistory.add(sensorService.lightLux!);
      if (lightHistory.length > 30) lightHistory.removeAt(0);
    }
    notifyListeners();
  }

  void toggleTheme() {
    isDarkMode = !isDarkMode;
    notifyListeners();
  }

  Future<void> setSamplingInterval(int ms) async {
    samplingIntervalMs = ms;
    sensorService.startListening(samplingPeriod: Duration(milliseconds: ms.clamp(200, 5000)));
    _chartTimer?.cancel();
    _chartTimer = Timer.periodic(Duration(milliseconds: ms), (_) => _pushChartSample());
    if (isRecording) {
      _restartRecordingTimer();
    }
    if (userProfile != null) {
      userProfile = UserProfile(
        uid: userProfile!.uid,
        email: userProfile!.email,
        displayName: userProfile!.displayName,
        dailyStepGoal: userProfile!.dailyStepGoal,
        samplingIntervalMs: ms,
      );
      await authService.updateUserProfile(userProfile!);
    }
    notifyListeners();
  }

  Future<void> startRecording() async {
    if (isRecording || userProfile == null) return;
    final now = DateTime.now();
    activeSessionId = 'session_${now.millisecondsSinceEpoch}';
    activeSampleCount = 0;
    isRecording = true;

    await DatabaseService.instance.insertSession(
      RecordingSession(
        id: activeSessionId!,
        userEmail: userProfile!.email,
        startedAt: formatIso8601WithOffset(now),
        sampleCount: 0,
      ),
    );

    await _captureReading();
    _restartRecordingTimer();
    await refreshHistory();
    notifyListeners();
  }

  void _restartRecordingTimer() {
    _recordingTimer?.cancel();
    _recordingTimer = Timer.periodic(Duration(milliseconds: samplingIntervalMs), (_) {
      _captureReading();
    });
  }

  Future<void> _captureReading() async {
    if (!isRecording || activeSessionId == null || userProfile == null) return;
    final reading = SensorReading(
      sessionId: activeSessionId!,
      timestamp: formatIso8601WithOffset(DateTime.now()),
      userEmail: userProfile!.email,
      stepCount: stepTracker.todaySteps,
      accelerometerX: sensorService.accelX,
      accelerometerY: sensorService.accelY,
      accelerometerZ: sensorService.accelZ,
      gyroscopeX: sensorService.gyroX,
      gyroscopeY: sensorService.gyroY,
      gyroscopeZ: sensorService.gyroZ,
      magnetometerHeading: sensorService.magnetometerHeading,
      pressureHpa: sensorService.pressureHpa,
      lightLux: sensorService.lightLux,
      proximity: sensorService.proximity,
      latitude: locationService.latitude,
      longitude: locationService.longitude,
      altitude: locationService.altitude,
      speed: locationService.speed,
      bearing: locationService.bearing,
      batteryLevel: sensorService.batteryLevel,
    );
    await DatabaseService.instance.insertReading(reading);
    activeSampleCount += 1;
    notifyListeners();
  }

  Future<void> stopRecording() async {
    if (!isRecording || activeSessionId == null) return;
    _recordingTimer?.cancel();
    await DatabaseService.instance.closeSession(
      activeSessionId!,
      formatIso8601WithOffset(DateTime.now()),
      activeSampleCount,
    );
    isRecording = false;
    activeSessionId = null;
    await refreshHistory();
    notifyListeners();
  }

  Future<void> capturePhoto() async {
    if (userProfile == null) return;
    final path = await cameraService.captureSnapshot();
    if (path == null) return;
    await DatabaseService.instance.insertCameraCapture(
      CameraCapture(
        filePath: path,
        timestamp: formatIso8601WithOffset(DateTime.now()),
        userEmail: userProfile!.email,
        lensDirection: cameraService.activeLensLabel,
        latitude: locationService.latitude,
        longitude: locationService.longitude,
        lightLux: sensorService.lightLux,
        stepCount: stepTracker.todaySteps,
      ),
    );
    await refreshHistory();
  }

  Future<void> refreshHistory() async {
    sessions = await DatabaseService.instance.getSessions();
    stepHistory = await DatabaseService.instance.getDailyStepHistory();
    cameraCaptures = await DatabaseService.instance.getCameraCaptures();
    notifyListeners();
  }

  @override
  void dispose() {
    _recordingTimer?.cancel();
    _chartTimer?.cancel();
    sensorService.stopListening();
    stepTracker.dispose();
    locationService.dispose();
    cameraService.dispose();
    super.dispose();
  }
}

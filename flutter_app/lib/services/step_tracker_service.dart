import 'dart:async';
import 'package:pedometer/pedometer.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/daily_steps.dart';
import '../utils/iso_date_formatter.dart';
import 'database_service.dart';

class StepTrackerService {
  static const String _prefDateKey = 'step_tracker_date';
  static const String _prefBaselineKey = 'step_tracker_baseline';
  static const String _prefTodayStepsKey = 'step_tracker_today_steps';

  StreamSubscription<StepCount>? _stepSub;
  bool hardwarePedometerAvailable = false;
  bool usingAccelerometerFallback = false;
  String? statusMessage;

  int todaySteps = 0;
  int totalHistoricalSteps = 0;
  int _dailyGoal = 10000;
  String _currentDateKey = localDateKey(DateTime.now());
  int? _hardwareBaseline;

  void Function()? onStepUpdated;

  Future<void> initialize({required int dailyGoal}) async {
    _dailyGoal = dailyGoal;
    final prefs = await SharedPreferences.getInstance();
    final todayKey = localDateKey(DateTime.now());
    final savedDate = prefs.getString(_prefDateKey);

    if (savedDate == todayKey) {
      todaySteps = prefs.getInt(_prefTodayStepsKey) ?? 0;
      _hardwareBaseline = prefs.getInt(_prefBaselineKey);
    } else {
      todaySteps = 0;
      _hardwareBaseline = null;
      await prefs.setString(_prefDateKey, todayKey);
      await prefs.setInt(_prefTodayStepsKey, 0);
      await prefs.remove(_prefBaselineKey);
    }
    _currentDateKey = todayKey;

    totalHistoricalSteps = await DatabaseService.instance.getTotalAllTimeSteps();
    await _persistToday();

    final status = await Permission.activityRecognition.request();
    if (!status.isGranted) {
      hardwarePedometerAvailable = false;
      usingAccelerometerFallback = true;
      statusMessage = 'Activity recognition denied — using accelerometer step detection';
      onStepUpdated?.call();
      return;
    }

    _stepSub?.cancel();
    _stepSub = Pedometer.stepCountStream.listen(
      (StepCount event) async {
        await checkMidnightReset();
        hardwarePedometerAvailable = true;
        usingAccelerometerFallback = false;
        statusMessage = 'Hardware Step Counter active';

        final prefs = await SharedPreferences.getInstance();
        if (_hardwareBaseline == null || event.steps < _hardwareBaseline!) {
          _hardwareBaseline = event.steps - todaySteps;
          await prefs.setInt(_prefBaselineKey, _hardwareBaseline!);
        }

        todaySteps = (event.steps - _hardwareBaseline!).clamp(0, 500000);
        await _persistToday();
        onStepUpdated?.call();
      },
      onError: (_) {
        hardwarePedometerAvailable = false;
        usingAccelerometerFallback = true;
        statusMessage = 'Hardware step counter unavailable — using accelerometer fallback';
        onStepUpdated?.call();
      },
      cancelOnError: false,
    );
  }

  Future<void> recordFallbackStep() async {
    if (hardwarePedometerAvailable) return;
    await checkMidnightReset();
    todaySteps += 1;
    await _persistToday();
    onStepUpdated?.call();
  }

  Future<void> checkMidnightReset() async {
    final nowKey = localDateKey(DateTime.now());
    if (nowKey != _currentDateKey) {
      _currentDateKey = nowKey;
      todaySteps = 0;
      _hardwareBaseline = null;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefDateKey, nowKey);
      await prefs.setInt(_prefTodayStepsKey, 0);
      await prefs.remove(_prefBaselineKey);
      totalHistoricalSteps = await DatabaseService.instance.getTotalAllTimeSteps();
      await _persistToday();
    }
  }

  Future<void> _persistToday() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_prefTodayStepsKey, todaySteps);
    await DatabaseService.instance.upsertDailySteps(
      DailySteps(
        dateKey: _currentDateKey,
        steps: todaySteps,
        goal: _dailyGoal,
        updatedAt: formatIso8601WithOffset(DateTime.now()),
      ),
    );
    totalHistoricalSteps = await DatabaseService.instance.getTotalAllTimeSteps();
  }

  void updateDailyGoal(int goal) {
    _dailyGoal = goal;
    _persistToday();
  }

  void dispose() {
    _stepSub?.cancel();
  }
}

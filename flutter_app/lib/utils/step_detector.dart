import 'dart:math';

/// Accelerometer-based peak detection step counter used as fallback
/// when the hardware STEP_COUNTER sensor is unavailable on the device.
class AccelerometerStepDetector {
  static const double _stepThreshold = 11.4; // m/s^2 magnitude above gravity (~9.81)
  static const int _minStepIntervalMs = 280; // max ~3.5 steps/sec physiological limit

  double _prevMagnitude = 9.81;
  bool _aboveThreshold = false;
  int _lastStepMs = 0;

  /// Processes a raw accelerometer reading (m/s^2) and returns `true` when a step is detected.
  bool processSample(double x, double y, double z, {DateTime? timestamp}) {
    final magnitude = sqrt(x * x + y * y + z * z);
    final smoothed = (_prevMagnitude * 0.65) + (magnitude * 0.35);
    final nowMs = (timestamp ?? DateTime.now()).millisecondsSinceEpoch;

    bool stepDetected = false;
    if (!_aboveThreshold && smoothed > _stepThreshold) {
      if (nowMs - _lastStepMs >= _minStepIntervalMs) {
        _aboveThreshold = true;
        _lastStepMs = nowMs;
        stepDetected = true;
      }
    } else if (_aboveThreshold && smoothed < 10.3) {
      _aboveThreshold = false;
    }

    _prevMagnitude = smoothed;
    return stepDetected;
  }
}

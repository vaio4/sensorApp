import 'dart:async';
import 'dart:math';
import 'package:battery_plus/battery_plus.dart';
import 'package:light/light.dart';
import 'package:proximity_sensor/proximity_sensor.dart';
import 'package:sensors_plus/sensors_plus.dart';
import '../utils/step_detector.dart';

class SensorService {
  final Battery _battery = Battery();
  final Light _light = Light();
  final AccelerometerStepDetector _fallbackStepDetector = AccelerometerStepDetector();

  StreamSubscription? _accelSub;
  StreamSubscription? _gyroSub;
  StreamSubscription? _magSub;
  StreamSubscription? _baroSub;
  StreamSubscription? _lightSub;
  StreamSubscription? _proxSub;
  StreamSubscription? _batteryStateSub;
  Timer? _batteryPollTimer;

  // Sensor availability flags (updated dynamically from real streams)
  bool accelAvailable = false;
  bool gyroAvailable = false;
  bool magAvailable = false;
  bool baroAvailable = false;
  bool lightAvailable = false;
  bool proximityAvailable = false;
  bool batteryAvailable = false;

  // Latest readings
  double? accelX, accelY, accelZ;
  double? gyroX, gyroY, gyroZ;
  double? magX, magY, magZ;
  double? magnetometerHeading;
  double? pressureHpa;
  double? lightLux;
  double? proximity; // 1.0 = near, 0.0 = far (or distance in cm if supported)
  int? batteryLevel;
  BatteryState batteryState = BatteryState.unknown;

  void Function()? onFallbackStepDetected;
  void Function()? onUpdate;

  void startListening({Duration samplingPeriod = const Duration(milliseconds: 200)}) {
    stopListening();

    _accelSub = accelerometerEventStream(samplingPeriod: samplingPeriod).listen(
      (event) {
        accelAvailable = true;
        accelX = event.x;
        accelY = event.y;
        accelZ = event.z;
        if (_fallbackStepDetector.processSample(event.x, event.y, event.z)) {
          onFallbackStepDetected?.call();
        }
        onUpdate?.call();
      },
      onError: (_) {
        accelAvailable = false;
        onUpdate?.call();
      },
      cancelOnError: false,
    );

    _gyroSub = gyroscopeEventStream(samplingPeriod: samplingPeriod).listen(
      (event) {
        gyroAvailable = true;
        gyroX = event.x;
        gyroY = event.y;
        gyroZ = event.z;
        onUpdate?.call();
      },
      onError: (_) {
        gyroAvailable = false;
        onUpdate?.call();
      },
      cancelOnError: false,
    );

    _magSub = magnetometerEventStream(samplingPeriod: samplingPeriod).listen(
      (event) {
        magAvailable = true;
        magX = event.x;
        magY = event.y;
        magZ = event.z;
        final headingRad = atan2(event.y, event.x);
        var headingDeg = headingRad * (180.0 / pi);
        if (headingDeg < 0) headingDeg += 360.0;
        magnetometerHeading = headingDeg;
        onUpdate?.call();
      },
      onError: (_) {
        magAvailable = false;
        onUpdate?.call();
      },
      cancelOnError: false,
    );

    _baroSub = barometerEventStream(samplingPeriod: samplingPeriod).listen(
      (event) {
        baroAvailable = true;
        pressureHpa = event.pressure;
        onUpdate?.call();
      },
      onError: (_) {
        baroAvailable = false;
        onUpdate?.call();
      },
      cancelOnError: false,
    );

    try {
      _lightSub = _light.lightSensorStream.listen(
        (luxValue) {
          lightAvailable = true;
          lightLux = luxValue.toDouble();
          onUpdate?.call();
        },
        onError: (_) {
          lightAvailable = false;
          onUpdate?.call();
        },
        cancelOnError: false,
      );
    } catch (_) {
      lightAvailable = false;
    }

    try {
      _proxSub = ProximitySensor.events.listen(
        (int value) {
          proximityAvailable = true;
          proximity = value > 0 ? 1.0 : 0.0;
          onUpdate?.call();
        },
        onError: (_) {
          proximityAvailable = false;
          onUpdate?.call();
        },
        cancelOnError: false,
      );
    } catch (_) {
      proximityAvailable = false;
    }

    _refreshBattery();
    _batteryStateSub = _battery.onBatteryStateChanged.listen((state) {
      batteryAvailable = true;
      batteryState = state;
      _refreshBattery();
    });
    _batteryPollTimer = Timer.periodic(const Duration(seconds: 15), (_) => _refreshBattery());
  }

  Future<void> _refreshBattery() async {
    try {
      final level = await _battery.batteryLevel;
      batteryAvailable = true;
      batteryLevel = level;
      onUpdate?.call();
    } catch (_) {
      batteryAvailable = false;
    }
  }

  void stopListening() {
    _accelSub?.cancel();
    _gyroSub?.cancel();
    _magSub?.cancel();
    _baroSub?.cancel();
    _lightSub?.cancel();
    _proxSub?.cancel();
    _batteryStateSub?.cancel();
    _batteryPollTimer?.cancel();
  }
}

class SensorReading {
  final int? id;
  final String sessionId;
  final String timestamp;
  final String userEmail;
  final int stepCount;
  final double? accelerometerX;
  final double? accelerometerY;
  final double? accelerometerZ;
  final double? gyroscopeX;
  final double? gyroscopeY;
  final double? gyroscopeZ;
  final double? magnetometerHeading;
  final double? pressureHpa;
  final double? lightLux;
  final double? proximity;
  final double? latitude;
  final double? longitude;
  final double? altitude;
  final double? speed;
  final double? bearing;
  final int? batteryLevel;

  const SensorReading({
    this.id,
    required this.sessionId,
    required this.timestamp,
    required this.userEmail,
    required this.stepCount,
    this.accelerometerX,
    this.accelerometerY,
    this.accelerometerZ,
    this.gyroscopeX,
    this.gyroscopeY,
    this.gyroscopeZ,
    this.magnetometerHeading,
    this.pressureHpa,
    this.lightLux,
    this.proximity,
    this.latitude,
    this.longitude,
    this.altitude,
    this.speed,
    this.bearing,
    this.batteryLevel,
  });

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'session_id': sessionId,
      'timestamp': timestamp,
      'user_email': userEmail,
      'step_count': stepCount,
      'accelerometer_x': accelerometerX,
      'accelerometer_y': accelerometerY,
      'accelerometer_z': accelerometerZ,
      'gyroscope_x': gyroscopeX,
      'gyroscope_y': gyroscopeY,
      'gyroscope_z': gyroscopeZ,
      'magnetometer_heading': magnetometerHeading,
      'pressure_hpa': pressureHpa,
      'light_lux': lightLux,
      'proximity': proximity,
      'latitude': latitude,
      'longitude': longitude,
      'altitude': altitude,
      'speed': speed,
      'bearing': bearing,
      'battery_level': batteryLevel,
    };
  }

  factory SensorReading.fromMap(Map<String, dynamic> map) {
    return SensorReading(
      id: map['id'] as int?,
      sessionId: map['session_id'] as String,
      timestamp: map['timestamp'] as String,
      userEmail: map['user_email'] as String,
      stepCount: map['step_count'] as int,
      accelerometerX: (map['accelerometer_x'] as num?)?.toDouble(),
      accelerometerY: (map['accelerometer_y'] as num?)?.toDouble(),
      accelerometerZ: (map['accelerometer_z'] as num?)?.toDouble(),
      gyroscopeX: (map['gyroscope_x'] as num?)?.toDouble(),
      gyroscopeY: (map['gyroscope_y'] as num?)?.toDouble(),
      gyroscopeZ: (map['gyroscope_z'] as num?)?.toDouble(),
      magnetometerHeading: (map['magnetometer_heading'] as num?)?.toDouble(),
      pressureHpa: (map['pressure_hpa'] as num?)?.toDouble(),
      lightLux: (map['light_lux'] as num?)?.toDouble(),
      proximity: (map['proximity'] as num?)?.toDouble(),
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
      altitude: (map['altitude'] as num?)?.toDouble(),
      speed: (map['speed'] as num?)?.toDouble(),
      bearing: (map['bearing'] as num?)?.toDouble(),
      batteryLevel: map['battery_level'] as int?,
    );
  }

  List<dynamic> toCsvRow() {
    String fmt(double? v, [int digits = 4]) => v != null ? v.toStringAsFixed(digits) : '';
    return [
      timestamp,
      userEmail,
      stepCount,
      fmt(accelerometerX),
      fmt(accelerometerY),
      fmt(accelerometerZ),
      fmt(gyroscopeX),
      fmt(gyroscopeY),
      fmt(gyroscopeZ),
      fmt(magnetometerHeading, 2),
      fmt(pressureHpa, 2),
      fmt(lightLux, 1),
      fmt(proximity, 2),
      fmt(latitude, 6),
      fmt(longitude, 6),
      fmt(altitude, 2),
      fmt(speed, 2),
      fmt(bearing, 2),
      batteryLevel ?? '',
    ];
  }
}

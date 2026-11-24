class CameraCapture {
  final int? id;
  final String filePath;
  final String timestamp;
  final String userEmail;
  final String lensDirection;
  final double? latitude;
  final double? longitude;
  final double? lightLux;
  final int stepCount;

  const CameraCapture({
    this.id,
    required this.filePath,
    required this.timestamp,
    required this.userEmail,
    required this.lensDirection,
    this.latitude,
    this.longitude,
    this.lightLux,
    required this.stepCount,
  });

  Map<String, dynamic> toMap() => {
        if (id != null) 'id': id,
        'file_path': filePath,
        'timestamp': timestamp,
        'user_email': userEmail,
        'lens_direction': lensDirection,
        'latitude': latitude,
        'longitude': longitude,
        'light_lux': lightLux,
        'step_count': stepCount,
      };

  factory CameraCapture.fromMap(Map<String, dynamic> map) => CameraCapture(
        id: map['id'] as int?,
        filePath: map['file_path'] as String,
        timestamp: map['timestamp'] as String,
        userEmail: map['user_email'] as String,
        lensDirection: map['lens_direction'] as String,
        latitude: (map['latitude'] as num?)?.toDouble(),
        longitude: (map['longitude'] as num?)?.toDouble(),
        lightLux: (map['light_lux'] as num?)?.toDouble(),
        stepCount: map['step_count'] as int,
      );
}

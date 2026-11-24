class AppConstants {
  static const String appName = 'Sensor Data Dashboard';
  static const int defaultDailyStepGoal = 10000;
  static const int defaultSamplingIntervalMs = 1000;

  static const List<String> csvHeaders = [
    'timestamp',
    'user_email',
    'step_count',
    'accelerometer_x',
    'accelerometer_y',
    'accelerometer_z',
    'gyroscope_x',
    'gyroscope_y',
    'gyroscope_z',
    'magnetometer_heading',
    'pressure_hpa',
    'light_lux',
    'proximity',
    'latitude',
    'longitude',
    'altitude',
    'speed',
    'bearing',
    'battery_level',
  ];
}

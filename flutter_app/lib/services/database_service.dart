import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';
import '../models/camera_capture.dart';
import '../models/daily_steps.dart';
import '../models/recording_session.dart';
import '../models/sensor_reading.dart';

class DatabaseService {
  static final DatabaseService instance = DatabaseService._internal();
  DatabaseService._internal();

  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, 'sensor_data_dashboard.db');
    _db = await openDatabase(
      path,
      version: 2,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE recording_sessions (
            id TEXT PRIMARY KEY,
            user_email TEXT NOT NULL,
            started_at TEXT NOT NULL,
            ended_at TEXT,
            sample_count INTEGER NOT NULL DEFAULT 0
          )
        ''');

        await db.execute('''
          CREATE TABLE sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            user_email TEXT NOT NULL,
            step_count INTEGER NOT NULL,
            accelerometer_x REAL,
            accelerometer_y REAL,
            accelerometer_z REAL,
            gyroscope_x REAL,
            gyroscope_y REAL,
            gyroscope_z REAL,
            magnetometer_heading REAL,
            pressure_hpa REAL,
            light_lux REAL,
            proximity REAL,
            latitude REAL,
            longitude REAL,
            altitude REAL,
            speed REAL,
            bearing REAL,
            battery_level INTEGER
          )
        ''');

        await db.execute(
          'CREATE INDEX idx_readings_timestamp ON sensor_readings (timestamp)',
        );
        await db.execute(
          'CREATE INDEX idx_readings_session ON sensor_readings (session_id)',
        );

        await db.execute('''
          CREATE TABLE daily_steps (
            date_key TEXT PRIMARY KEY,
            steps INTEGER NOT NULL,
            goal INTEGER NOT NULL,
            updated_at TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE camera_captures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            user_email TEXT NOT NULL,
            lens_direction TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            light_lux REAL,
            step_count INTEGER NOT NULL
          )
        ''');
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          await db.execute('''
            CREATE TABLE IF NOT EXISTS camera_captures (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              file_path TEXT NOT NULL,
              timestamp TEXT NOT NULL,
              user_email TEXT NOT NULL,
              lens_direction TEXT NOT NULL,
              latitude REAL,
              longitude REAL,
              light_lux REAL,
              step_count INTEGER NOT NULL
            )
          ''');
        }
      },
    );
    return _db!;
  }

  Future<void> insertSession(RecordingSession session) async {
    final db = await database;
    await db.insert(
      'recording_sessions',
      session.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> closeSession(String sessionId, String endedAt, int sampleCount) async {
    final db = await database;
    await db.update(
      'recording_sessions',
      {'ended_at': endedAt, 'sample_count': sampleCount},
      where: 'id = ?',
      whereArgs: [sessionId],
    );
  }

  Future<void> insertReading(SensorReading reading) async {
    final db = await database;
    await db.insert('sensor_readings', reading.toMap());
  }

  Future<List<RecordingSession>> getSessions() async {
    final db = await database;
    final rows = await db.query('recording_sessions', orderBy: 'started_at DESC');
    return rows.map(RecordingSession.fromMap).toList();
  }

  Future<List<SensorReading>> getReadingsInDateRange(
    DateTime startInclusive,
    DateTime endInclusive, {
    String? userEmail,
  }) async {
    final db = await database;
    final startStr = DateTime(startInclusive.year, startInclusive.month, startInclusive.day)
        .toIso8601String();
    final endStr = DateTime(endInclusive.year, endInclusive.month, endInclusive.day, 23, 59, 59)
        .toIso8601String();

    final rows = await db.query(
      'sensor_readings',
      where: userEmail != null
          ? 'timestamp >= ? AND timestamp <= ? AND user_email = ?'
          : 'timestamp >= ? AND timestamp <= ?',
      whereArgs: userEmail != null ? [startStr, endStr, userEmail] : [startStr, endStr],
      orderBy: 'timestamp ASC',
    );
    return rows.map(SensorReading.fromMap).toList();
  }

  Future<List<SensorReading>> getReadingsBySession(String sessionId) async {
    final db = await database;
    final rows = await db.query(
      'sensor_readings',
      where: 'session_id = ?',
      whereArgs: [sessionId],
      orderBy: 'timestamp ASC',
    );
    return rows.map(SensorReading.fromMap).toList();
  }

  Future<void> upsertDailySteps(DailySteps daily) async {
    final db = await database;
    await db.insert(
      'daily_steps',
      daily.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<DailySteps>> getDailyStepHistory({int limit = 30}) async {
    final db = await database;
    final rows = await db.query(
      'daily_steps',
      orderBy: 'date_key DESC',
      limit: limit,
    );
    return rows.map(DailySteps.fromMap).toList();
  }

  Future<int> getTotalAllTimeSteps() async {
    final db = await database;
    final result = await db.rawQuery('SELECT SUM(steps) as total FROM daily_steps');
    final val = result.first['total'];
    return val is int ? val : (val is num ? val.toInt() : 0);
  }

  Future<void> deleteSession(String sessionId) async {
    final db = await database;
    await db.delete('sensor_readings', where: 'session_id = ?', whereArgs: [sessionId]);
    await db.delete('recording_sessions', where: 'id = ?', whereArgs: [sessionId]);
  }

  Future<void> insertCameraCapture(CameraCapture capture) async {
    final db = await database;
    await db.insert('camera_captures', capture.toMap());
  }

  Future<List<CameraCapture>> getCameraCaptures({int limit = 50}) async {
    final db = await database;
    final rows = await db.query('camera_captures', orderBy: 'timestamp DESC', limit: limit);
    return rows.map(CameraCapture.fromMap).toList();
  }

  Future<void> deleteCameraCapture(int id) async {
    final db = await database;
    await db.delete('camera_captures', where: 'id = ?', whereArgs: [id]);
  }
}

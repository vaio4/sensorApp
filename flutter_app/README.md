# Sensor Data Dashboard (Flutter Android 8.0+)

A complete Android mobile sensor telemetry application built with Flutter for Android 8.0+ (API 26+).

## Features
- **Firebase Email/Password Auth**: Login, sign-up, password reset, and Firestore user profile persistence (`/users/{uid}`).
- **Live Device Sensors**: Accelerometer, Gyroscope, Magnetometer/Compass heading, Barometer (hPa), Ambient Light (lux), Proximity, Camera live preview & JPEG snapshot capture, GPS/Navigation (latitude, longitude, altitude, speed, bearing), and Battery level/charging state. Missing hardware sensors gracefully display `"Sensor not available on this device"`.
- **Daily Step Counter**: Uses Android `TYPE_STEP_COUNTER` via `pedometer` with automatic midnight reset in the device timezone, plus an accelerometer peak-detection fallback when hardware step counting is unavailable.
- **SQLite Session Recording**: Configurable sampling interval (default 1s) storing timestamped readings in `sqflite`.
- **CSV Export**: Exports date-range-filtered readings with ISO 8601 timezone-offset timestamps (`2026-11-24T15:04:00+05:30`) and exact 19-column headers to Android `Download/` or via the Android share sheet.

## Firebase Setup
1. Install the FlutterFire CLI:
   ```bash
   dart pub global activate flutterfire_cli
   ```
2. Configure Firebase for Android (replace with your project ID `graphite-ability-t6shk` or your own):
   ```bash
   flutterfire configure --platforms=android
   ```
   This generates `lib/firebase_options.dart` and places `android/app/google-services.json`.
3. In Firebase Console -> **Authentication -> Sign-in method**, enable **Email/Password**.
4. Update `lib/main.dart` to pass `options: DefaultFirebaseOptions.currentPlatform` to `Firebase.initializeApp(...)` if using `flutterfire configure`.

## Android Permissions (`AndroidManifest.xml`)
Configured for Android 8.0+ (API 26–34):
- `INTERNET`, `ACCESS_NETWORK_STATE`
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- `ACTIVITY_RECOGNITION`, `BODY_SENSORS`, `CAMERA`
- `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`, `WAKE_LOCK`
- `READ_EXTERNAL_STORAGE` & `WRITE_EXTERNAL_STORAGE` (`maxSdkVersion="32"` for Android 8–12 compatibility)

## Build & Run Instructions
1. Fetch packages:
   ```bash
   cd flutter_app
   flutter pub get
   ```
2. Run on a physical Android 8.0+ device:
   ```bash
   flutter run
   ```
3. Build the release APK (`sensor_data_dashboard.apk`):
   ```bash
   flutter build apk --release
   ```
   Output APK path:
   `build/app/outputs/flutter-apk/sensor_data_dashboard.apk`

### Optional Release Keystore Signing
Create `android/key.properties`:
```properties
storePassword=<your-store-password>
keyPassword=<your-key-password>
keyAlias=<your-key-alias>
storeFile=../app/upload-keystore.jks
```
Without `android/key.properties`, `android/app/build.gradle` falls back to debug signing so `flutter build apk --release` succeeds immediately for testing.

import 'dart:async';
import 'package:geolocator/geolocator.dart';

class LocationService {
  StreamSubscription<Position>? _posSub;

  bool isAvailable = false;
  bool serviceEnabled = false;
  LocationPermission permissionStatus = LocationPermission.denied;
  String? errorMessage;

  double? latitude;
  double? longitude;
  double? altitude;
  double? speed;
  double? bearing;

  void Function()? onLocationChanged;

  Future<void> initialize() async {
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      isAvailable = false;
      errorMessage = 'GPS / Location services are disabled. Enable GPS in Android Settings.';
      onLocationChanged?.call();
      return;
    }

    permissionStatus = await Geolocator.checkPermission();
    if (permissionStatus == LocationPermission.denied) {
      permissionStatus = await Geolocator.requestPermission();
    }

    if (permissionStatus == LocationPermission.denied) {
      isAvailable = false;
      errorMessage = 'Location permission denied. Grant permission to track GPS coordinates.';
      onLocationChanged?.call();
      return;
    }

    if (permissionStatus == LocationPermission.deniedForever) {
      isAvailable = false;
      errorMessage = 'Location permission permanently denied. Enable it in App Settings.';
      onLocationChanged?.call();
      return;
    }

    errorMessage = null;
    isAvailable = true;

    try {
      final initial = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      _applyPosition(initial);
    } catch (_) {}

    _posSub?.cancel();
    _posSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.best,
        distanceFilter: 0,
      ),
    ).listen(
      _applyPosition,
      onError: (err) {
        isAvailable = false;
        errorMessage = 'Location stream error: $err';
        onLocationChanged?.call();
      },
    );
  }

  void _applyPosition(Position pos) {
    isAvailable = true;
    errorMessage = null;
    latitude = pos.latitude;
    longitude = pos.longitude;
    altitude = pos.altitude;
    speed = pos.speed;
    bearing = pos.heading;
    onLocationChanged?.call();
  }

  Future<void> openAppSettings() async {
    await Geolocator.openAppSettings();
  }

  Future<void> openLocationSettings() async {
    await Geolocator.openLocationSettings();
  }

  void dispose() {
    _posSub?.cancel();
  }
}

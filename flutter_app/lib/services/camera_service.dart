import 'dart:io';
import 'package:camera/camera.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

class CameraService {
  List<CameraDescription> _cameras = [];
  CameraController? controller;
  int _selectedCameraIndex = 0;
  bool isAvailable = false;
  bool isInitialized = false;
  bool flashEnabled = false;
  String? errorMessage;

  void Function()? onUpdate;

  String get activeLensLabel {
    if (_cameras.isEmpty) return 'Unavailable';
    return _cameras[_selectedCameraIndex].lensDirection == CameraLensDirection.front
        ? 'Front'
        : 'Rear';
  }

  Future<void> initialize() async {
    final perm = await Permission.camera.request();
    if (!perm.isGranted) {
      isAvailable = false;
      isInitialized = false;
      errorMessage = 'Camera permission denied. Grant Camera permission to capture snapshots.';
      onUpdate?.call();
      return;
    }

    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) {
        isAvailable = false;
        isInitialized = false;
        errorMessage = 'Camera not available on this device';
        onUpdate?.call();
        return;
      }

      isAvailable = true;
      errorMessage = null;
      await _startController(_selectedCameraIndex);
    } catch (e) {
      isAvailable = false;
      isInitialized = false;
      errorMessage = 'Camera initialization failed: $e';
      onUpdate?.call();
    }
  }

  Future<void> _startController(int index) async {
    await controller?.dispose();
    final nextCtrl = CameraController(
      _cameras[index],
      ResolutionPreset.medium,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );
    controller = nextCtrl;
    await nextCtrl.initialize();
    await nextCtrl.setFlashMode(flashEnabled ? FlashMode.torch : FlashMode.off);
    isInitialized = true;
    onUpdate?.call();
  }

  Future<void> switchLens() async {
    if (_cameras.length < 2) return;
    _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras.length;
    isInitialized = false;
    onUpdate?.call();
    await _startController(_selectedCameraIndex);
  }

  Future<void> toggleFlash() async {
    if (controller == null || !isInitialized) return;
    flashEnabled = !flashEnabled;
    try {
      await controller!.setFlashMode(flashEnabled ? FlashMode.torch : FlashMode.off);
    } catch (_) {
      flashEnabled = false;
    }
    onUpdate?.call();
  }

  Future<String?> captureSnapshot() async {
    if (controller == null || !isInitialized) return null;
    final xFile = await controller!.takePicture();
    final docsDir = await getApplicationDocumentsDirectory();
    final capturesDir = Directory(p.join(docsDir.path, 'camera_captures'));
    if (!await capturesDir.exists()) {
      await capturesDir.create(recursive: true);
    }
    final fileName = 'capture_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final destPath = p.join(capturesDir.path, fileName);
    await File(xFile.path).copy(destPath);
    return destPath;
  }

  Future<void> stop() async {
    await controller?.dispose();
    controller = null;
    isInitialized = false;
    onUpdate?.call();
  }

  void dispose() {
    controller?.dispose();
  }
}

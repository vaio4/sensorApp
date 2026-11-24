import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import '../services/camera_service.dart';

class CameraPreviewCard extends StatelessWidget {
  final CameraService cameraService;
  final VoidCallback onInitialize;
  final VoidCallback onSwitchLens;
  final VoidCallback onToggleFlash;
  final VoidCallback onCapture;
  final VoidCallback onStop;

  const CameraPreviewCard({
    super.key,
    required this.cameraService,
    required this.onInitialize,
    required this.onSwitchLens,
    required this.onToggleFlash,
    required this.onCapture,
    required this.onStop,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ctrl = cameraService.controller;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: theme.colorScheme.outlineVariant.withOpacity(0.6)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.photo_camera, size: 18, color: Color(0xFF2563EB)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Camera Sensor (${cameraService.activeLensLabel})',
                    style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
                Text(
                  cameraService.isInitialized ? 'Live' : 'Standby',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: cameraService.isInitialized
                        ? const Color(0xFF16A34A)
                        : theme.colorScheme.outline,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (cameraService.errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                  cameraService.errorMessage!,
                  style: TextStyle(color: theme.colorScheme.error, fontSize: 12),
                ),
              ),
            if (cameraService.isInitialized && ctrl != null && ctrl.value.isInitialized) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: AspectRatio(
                  aspectRatio: ctrl.value.aspectRatio,
                  child: CameraPreview(ctrl),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: onCapture,
                      icon: const Icon(Icons.camera_alt, size: 18),
                      label: const Text('Capture Snapshot'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.outlined(
                    onPressed: onSwitchLens,
                    icon: const Icon(Icons.flip_camera_android),
                    tooltip: 'Switch Front/Rear',
                  ),
                  IconButton.outlined(
                    onPressed: onToggleFlash,
                    icon: Icon(cameraService.flashEnabled ? Icons.flash_on : Icons.flash_off),
                    tooltip: 'Toggle Flash',
                  ),
                  IconButton.outlined(
                    onPressed: onStop,
                    icon: const Icon(Icons.videocam_off_outlined),
                    tooltip: 'Stop Camera',
                  ),
                ],
              ),
            ] else
              OutlinedButton.icon(
                onPressed: onInitialize,
                icon: const Icon(Icons.videocam_outlined, size: 18),
                label: const Text('Enable Live Camera'),
              ),
          ],
        ),
      ),
    );
  }
}

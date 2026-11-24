import 'package:flutter/material.dart';

class GpsMapPreview extends StatelessWidget {
  final double? latitude;
  final double? longitude;
  final double? altitude;
  final double? speed;
  final double? bearing;
  final String? errorMessage;
  final VoidCallback onRetryPermission;

  const GpsMapPreview({
    super.key,
    required this.latitude,
    required this.longitude,
    required this.altitude,
    required this.speed,
    required this.bearing,
    required this.errorMessage,
    required this.onRetryPermission,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (errorMessage != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(errorMessage!, style: TextStyle(color: theme.colorScheme.error)),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: onRetryPermission,
            icon: const Icon(Icons.my_location, size: 16),
            label: const Text('Grant / Enable GPS'),
          ),
        ],
      );
    }

    if (latitude == null || longitude == null) {
      return const Text('Acquiring GPS satellite lock...');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 110,
          width: double.infinity,
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          child: CustomPaint(
            painter: _CoordinateGridPainter(
              bearingDeg: bearing ?? 0,
              accentColor: const Color(0xFF2563EB),
              gridColor: theme.colorScheme.outlineVariant,
            ),
            child: Align(
              alignment: Alignment.bottomLeft,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Text(
                  '${latitude!.toStringAsFixed(6)}, ${longitude!.toStringAsFixed(6)}',
                  style: theme.textTheme.labelSmall?.copyWith(
                    fontFeatures: const [FontFeature.tabularFigures()],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 16,
          runSpacing: 6,
          children: [
            _metric('Alt', '${(altitude ?? 0).toStringAsFixed(1)} m'),
            _metric('Speed', '${(speed ?? 0).toStringAsFixed(2)} m/s'),
            _metric('Bearing', '${(bearing ?? 0).toStringAsFixed(1)}°'),
          ],
        ),
      ],
    );
  }

  Widget _metric(String label, String value) {
    return Text(
      '$label: $value',
      style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()], fontSize: 13),
    );
  }
}

class _CoordinateGridPainter extends CustomPainter {
  final double bearingDeg;
  final Color accentColor;
  final Color gridColor;

  _CoordinateGridPainter({
    required this.bearingDeg,
    required this.accentColor,
    required this.gridColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = gridColor.withOpacity(0.5)
      ..strokeWidth = 1;

    for (var x = 0.0; x < size.width; x += 24) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var y = 0.0; y < size.height; y += 24) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    final center = Offset(size.width / 2, size.height / 2);
    canvas.drawCircle(center, 18, Paint()..color = accentColor.withOpacity(0.15));
    canvas.drawCircle(center, 6, Paint()..color = accentColor);
  }

  @override
  bool shouldRepaint(covariant _CoordinateGridPainter oldDelegate) =>
      oldDelegate.bearingDeg != bearingDeg;
}

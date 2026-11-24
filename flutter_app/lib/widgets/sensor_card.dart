import 'package:flutter/material.dart';

class SensorCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isAvailable;
  final Widget child;
  final Color accentColor;

  const SensorCard({
    super.key,
    required this.title,
    required this.icon,
    required this.isAvailable,
    required this.child,
    this.accentColor = const Color(0xFF2563EB),
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: theme.colorScheme.outlineVariant.withOpacity(0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: isAvailable ? accentColor : theme.disabledColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
                Text(
                  isAvailable ? 'Active' : 'Unavailable',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: isAvailable ? const Color(0xFF16A34A) : theme.colorScheme.outline,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (isAvailable)
              child
            else
              Text(
                'Sensor not available on this device',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.outline,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

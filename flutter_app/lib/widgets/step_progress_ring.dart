import 'package:flutter/material.dart';

class StepProgressRing extends StatelessWidget {
  final int todaySteps;
  final int totalSteps;
  final int goal;
  final String sourceLabel;

  const StepProgressRing({
    super.key,
    required this.todaySteps,
    required this.totalSteps,
    required this.goal,
    required this.sourceLabel,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final progress = goal > 0 ? (todaySteps / goal).clamp(0.0, 1.0) : 0.0;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: theme.colorScheme.outlineVariant.withOpacity(0.6)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            SizedBox(
              width: 84,
              height: 84,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 8,
                    backgroundColor: theme.colorScheme.surfaceContainerHighest,
                    color: const Color(0xFF2563EB),
                  ),
                  Text(
                    '${(progress * 100).round()}%',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Daily Step Count', style: theme.textTheme.labelMedium),
                  const SizedBox(height: 4),
                  Text(
                    '$todaySteps / $goal',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'All-time total: $totalSteps steps',
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sourceLabel,
                    style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.primary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

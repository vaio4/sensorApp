import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class LiveLineChart extends StatelessWidget {
  final String title;
  final List<double> values;
  final Color color;
  final String unit;

  const LiveLineChart({
    super.key,
    required this.title,
    required this.values,
    required this.color,
    required this.unit,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final spots = List<FlSpot>.generate(
      values.length,
      (i) => FlSpot(i.toDouble(), values[i]),
    );

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
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                Text(
                  values.isNotEmpty ? '${values.last.toStringAsFixed(2)} $unit' : '-- $unit',
                  style: theme.textTheme.labelMedium?.copyWith(
                    fontFeatures: const [FontFeature.tabularFigures()],
                    color: color,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 120,
              child: spots.length < 2
                  ? Center(
                      child: Text(
                        'Waiting for live samples...',
                        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
                      ),
                    )
                  : LineChart(
                      LineChartData(
                        gridData: const FlGridData(show: true, drawVerticalLine: false),
                        titlesData: const FlTitlesData(show: false),
                        borderData: FlBorderData(show: false),
                        lineBarsData: [
                          LineChartBarData(
                            spots: spots,
                            isCurved: true,
                            color: color,
                            barWidth: 2.5,
                            dotData: const FlDotData(show: false),
                            belowBarData: BarAreaData(
                              show: true,
                              color: color.withOpacity(0.12),
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

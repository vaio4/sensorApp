class DailySteps {
  final String dateKey; // yyyy-MM-dd in device local timezone
  final int steps;
  final int goal;
  final String updatedAt;

  const DailySteps({
    required this.dateKey,
    required this.steps,
    required this.goal,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() => {
        'date_key': dateKey,
        'steps': steps,
        'goal': goal,
        'updated_at': updatedAt,
      };

  factory DailySteps.fromMap(Map<String, dynamic> map) => DailySteps(
        dateKey: map['date_key'] as String,
        steps: map['steps'] as int,
        goal: map['goal'] as int,
        updatedAt: map['updated_at'] as String,
      );
}

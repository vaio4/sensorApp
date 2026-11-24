class RecordingSession {
  final String id;
  final String userEmail;
  final String startedAt;
  final String? endedAt;
  final int sampleCount;

  const RecordingSession({
    required this.id,
    required this.userEmail,
    required this.startedAt,
    this.endedAt,
    required this.sampleCount,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'user_email': userEmail,
        'started_at': startedAt,
        'ended_at': endedAt,
        'sample_count': sampleCount,
      };

  factory RecordingSession.fromMap(Map<String, dynamic> map) => RecordingSession(
        id: map['id'] as String,
        userEmail: map['user_email'] as String,
        startedAt: map['started_at'] as String,
        endedAt: map['ended_at'] as String?,
        sampleCount: map['sample_count'] as int,
      );
}

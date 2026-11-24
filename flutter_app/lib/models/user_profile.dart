class UserProfile {
  final String uid;
  final String email;
  final String displayName;
  final int dailyStepGoal;
  final int samplingIntervalMs;

  const UserProfile({
    required this.uid,
    required this.email,
    required this.displayName,
    this.dailyStepGoal = 10000,
    this.samplingIntervalMs = 1000,
  });

  Map<String, dynamic> toFirestore() => {
        'uid': uid,
        'email': email,
        'displayName': displayName,
        'dailyStepGoal': dailyStepGoal,
        'samplingIntervalMs': samplingIntervalMs,
      };

  factory UserProfile.fromFirestore(Map<String, dynamic> data) => UserProfile(
        uid: data['uid'] as String,
        email: data['email'] as String,
        displayName: (data['displayName'] as String?) ?? 'User',
        dailyStepGoal: (data['dailyStepGoal'] as int?) ?? 10000,
        samplingIntervalMs: (data['samplingIntervalMs'] as int?) ?? 1000,
      );
}

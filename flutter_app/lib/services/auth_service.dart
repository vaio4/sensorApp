import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_profile.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  Future<UserCredential> signInWithEmail(String email, String password) async {
    return await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
  }

  Future<UserCredential> signUpWithEmail({
    required String email,
    required String password,
    required String displayName,
  }) async {
    final cred = await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    await cred.user?.updateDisplayName(displayName.trim());
    if (cred.user != null) {
      await ensureUserProfile(cred.user!, displayName: displayName.trim());
    }
    return cred;
  }

  Future<void> sendPasswordResetEmail(String email) async {
    await _auth.sendPasswordResetEmail(email: email.trim());
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }

  Future<UserProfile> ensureUserProfile(User user, {String? displayName}) async {
    final docRef = _db.collection('users').doc(user.uid);
    final snap = await docRef.get();
    if (snap.exists && snap.data() != null) {
      return UserProfile.fromFirestore(snap.data()!);
    }

    final profile = UserProfile(
      uid: user.uid,
      email: user.email ?? '',
      displayName: displayName ?? user.displayName ?? (user.email?.split('@').first ?? 'User'),
      dailyStepGoal: 10000,
      samplingIntervalMs: 1000,
    );

    await docRef.set({
      ...profile.toFirestore(),
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    return profile;
  }

  Future<void> updateUserProfile(UserProfile profile) async {
    await _db.collection('users').doc(profile.uid).update({
      'displayName': profile.displayName,
      'email': profile.email,
      'dailyStepGoal': profile.dailyStepGoal,
      'samplingIntervalMs': profile.samplingIntervalMs,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}

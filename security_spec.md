# Security Specification: Sensor Data Dashboard

## 1. Data Invariants
1. A `UserProfile` document at `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
2. `list` queries on `/users` are strictly prohibited to protect PII (`email`).
3. Every document write enforces exact schema keys (`hasAll` + `hasOnly`), field types, string length bounds, and server-side timestamps (`request.time`).
4. `uid` and `createdAt` on `/users/{userId}` are immutable after creation.
5. `RecordingSessionMeta` documents under `/users/{userId}/sessions/{sessionId}` require an existing parent `/users/{userId}` document and `userId == request.auth.uid`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Profile Read**: Unauthenticated `get(/users/userA)` -> `PERMISSION_DENIED`.
2. **Cross-User PII Read**: Authenticated `userB` calling `get(/users/userA)` -> `PERMISSION_DENIED`.
3. **User Collection Enumeration**: Authenticated `userB` calling `list(/users)` -> `PERMISSION_DENIED`.
4. **UID Spoofing on Create**: Authenticated `userB` creating `/users/userB` with `uid: "userA"` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection**: Authenticated `userA` creating `/users/userA` with extra key `isAdmin: true` -> `PERMISSION_DENIED`.
6. **Client Timestamp Forgery**: Authenticated `userA` creating `/users/userA` with past `createdAt` instead of `request.time` -> `PERMISSION_DENIED`.
7. **Immutable Field Tampering**: Authenticated `userA` updating `/users/userA` to change `uid` or `createdAt` -> `PERMISSION_DENIED`.
8. **Invalid Step Goal Type/Range**: Authenticated `userA` updating `dailyStepGoal` to `-500` or `"10000"` -> `PERMISSION_DENIED`.
9. **Resource Poisoning (Oversized Display Name)**: Authenticated `userA` updating `displayName` to a 500-char string -> `PERMISSION_DENIED`.
10. **Path Variable Poisoning**: Request targeting `/users/invalid$id!` -> `PERMISSION_DENIED`.
11. **Orphaned Session Write**: Creating `/users/userA/sessions/s1` when `/users/userA` does not exist -> `PERMISSION_DENIED`.
12. **Cross-User Session Hijack**: Authenticated `userB` listing or writing `/users/userA/sessions` -> `PERMISSION_DENIED`.

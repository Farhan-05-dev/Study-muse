# Security Specification - Study Muse

## Data Invariants
1. **User Ownership**: Every document (except possibly global config or shared content, though not currently implemented) must belong to a specific user identified by `userId` or `uid`.
2. **Path Integrity**: Users can only read, write, or delete documents where `userId` (or parent deck `userId`) matches their authenticated `uid`.
3. **Timestamp Integrity**: `createdAt` and `updatedAt` must be set via `serverTimestamp()`.
4. **Schema Strictness**: No unknown fields allowed. Valid types and sizes for all strings.
5. **Admin Isolation**: Feedback status can only be updated by admins. Users can create feedback but not update its status.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a note with `userId` of another user.
2. **PII Leak**: Attempt to read another user's profile which contains their email.
3. **Ghost Field**: Attempt to update a note with an extra field `isPremium: true`.
4. **ID Poisoning**: Attempt to create a document with a 2KB string as the document ID.
5. **Resource Exhaustion**: Attempt to write a note where the `topic` is 1MB in size.
6. **State Shortcutting**: Attempt to update a feedback status to `fixed` as a regular user.
7. **Orphaned Write**: Attempt to create a flashcard for a `deckId` that does not exist.
8. **Auth Bypass**: Attempt to read any note without being signed in.
9. **Email Spoofing**: Attempt to access admin features using an unverified email that matches an admin email.
10. **Immutable Violation**: Attempt to change the `userId` of an existing note.
11. **Timestamp Faking**: Attempt to set `createdAt` to a date in 2020.
12. **Blanket Query**: Attempt a collection group query on `notes` without a `userId` filter.

## Test Strategy
A `firestore.rules.test.ts` will be implemented to verify these denials using the Firebase Emulator or equivalent logic.

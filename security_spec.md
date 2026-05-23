# Security Specification for Language Learning Hub Firestore Rules

## 1. Data Invariants
- A UserProfile can only be created by the user itself (where docId == auth.uid).
- Private info (`/users/{userId}/private/info`) is completely private to the owner and Admins.
- Word logs, conversational scenario records, and chat message elements can only be read, created, modified, or deleted by the certified owner of that specific branch (where `userId` == `auth.uid`).
- Fields like `createdAt` of a conversation cannot be modified after creation.
- A user can never change their own role or status to "admin" or self-assign higher privileges.

## 2. The "Dirty Dozen" Malicious Payloads

### Payload A: Profile Escalation & Self-Assigned Privileges
- Attempting to set standard role to `admin` or modify system config properties directly inside the user profile.
- Expected outcome: `PERMISSION_DENIED` due to role isolation and strict field updates check.

### Payload B: Identity Impersonation (Profile Spoofing)
- Attempting to overwrite a profile with a fake registration ID (e.g. creating `users/user_alpha` with `request.auth.uid = 'user_beta'`).
- Expected outcome: `PERMISSION_DENIED` because the profile ID must match the current authenticated user's ID.

### Payload C: Value Poisoning (Invalid Type/Size)
- Creating vocabulary lists with a words entry containing a 10MB text string as a form of Denial of Wallet attack.
- Expected outcome: `PERMISSION_DENIED` because words and translations are size-restricted (`< 1000 characters`).

### Payload D: Spoofed Parent References
- Storing learned words under a target foreign language or scenario with spoofed timestamps or random, unvalidated parent parameters.
- Expected outcome: `PERMISSION_DENIED`.

### Payload E: Cross-User Resource Deletion
- Authenticated User A attempting to delete the chat messages of Authenticated User B.
- Expected outcome: `PERMISSION_DENIED`.

### Payload F: Writing Messages into Terminal Chats
- Attempting to post message items to an archived or finished chat dialogue session.
- Expected outcome: `PERMISSION_DENIED` since updates are blocked on finalized states.

### Payload G: Shadow Updates (Ghost Fields)
- Adding extra fields (e.g. `isAdmin: true` or `isPremium: true`) during a routine statistics update.
- Expected outcome: `PERMISSION_DENIED` due to exact matching of allowed keys via `affectedKeys().hasOnly()`.

### Payload H: Unauthenticated Profile Creation
- Creating a learner profile prior to actual Google Sign-In setup.
- Expected outcome: `PERMISSION_DENIED`.

### Payload I: Spoofed Temporal Fields
- Providing a client-side timestamp (e.g. retroactively dating a daily streak to skip learning tasks).
- Expected outcome: `PERMISSION_DENIED` because timestamps must strictly equal `request.time`.

### Payload J: Blank Collection Scraping (List All Profiles)
- Requesting a list of all subscriber lists or user emails from the client database.
- Expected outcome: `PERMISSION_DENIED` as collection list operations require active ownership queries.

### Payload K: Private PII Data Exfiltration
- Reading another user's isolated private subcollection (`users/{userId}/private/info`).
- Expected outcome: `PERMISSION_DENIED`.

### Payload L: Invalid ID Injection
- Creating a document with custom alphanumeric values containing malicious scripting elements or excessively large strings.
- Expected outcome: `PERMISSION_DENIED` thanks to regex validation in `isValidId(docId)`.

## 3. Test Specification Overview
The test environment executes these payloads using mock transactions representing the authenticated learner, matching the expected `PERMISSION_DENIED` results.

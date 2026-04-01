# Authentication Architecture

> How PRAXIS handles identity, sessions, token lifecycle, and access control.

---

## Overview

PRAXIS uses **Firebase Authentication** for identity (client-side SDK) and an **httpOnly session cookie** for server-side session management. The middleware reads the cookie to protect `/app/*` routes without a round-trip to Firebase on every request.

```
Browser (Firebase Auth SDK)
    │
    │  1. signIn → Firebase issues a JWT (1-hour ID token)
    │
    ▼
POST /api/auth/session
    │
    │  2. Server verifies JWT via Firebase Admin SDK
    │  3. Stores raw token in httpOnly cookie (24h)
    │
    ▼
middleware.ts
    │
    │  4. Reads cookie on every /app/* request
    │  5. Checks !!sessionData?.token — redirects to /login if absent
    │
    ▼
/app/* routes (protected)
```

---

## Sign-in Methods

### Google OAuth (Redirect Flow)

```typescript
// auth-context.tsx
await signInWithRedirect(auth, new GoogleAuthProvider());
// Page navigates to Google — user returns with credential
// onAuthStateChanged fires → syncTokenCookie() → cookie set
```

Why redirect (not popup)? Cross-Origin-Opener-Policy (COOP) headers on modern browsers block `window.open()` from accessing the opener. `signInWithRedirect` avoids this entirely by navigating the current tab.

On return: `getRedirectResult(auth)` is called in a `useEffect`. Errors (e.g. `auth/unauthorized-domain`) are caught and displayed; success is handled by `onAuthStateChanged`.

### Email/Password

```
User submits form
    │
    ├─→ signInWithEmailAndPassword(auth, email, password)
    │       Firebase validates credentials
    │       Returns FirebaseUser with ID token
    │
    ├─→ syncTokenCookie(firebaseUser)
    │       POST /api/auth/session with { token }
    │       Server: verifyIdToken → set httpOnly cookie
    │       Returns { success: true } or { error }
    │
    └─→ router.push('/app/dashboard')   ← immediate, cookie already set
```

Error handling covers: `auth/invalid-credential`, `auth/wrong-password`, `auth/too-many-requests`, `auth/user-disabled`, `auth/network-request-failed`, `auth/operation-not-allowed`, `auth/invalid-email`.

### Password Reset

```
User clicks "Forgot password?" → mode = 'reset'
    │
    ├─→ sendPasswordResetEmail(auth, email)
    │       Firebase sends reset link to the address
    │
    └─→ Success: "If an account exists for that email, a reset link has been sent."
```

The success message is **deliberately ambiguous** — it does not confirm or deny whether the email exists. This prevents user enumeration attacks (OWASP A01:2021).

The error `auth/user-not-found` and `auth/invalid-email` are both silently converted to success on the server. `auth/too-many-requests` surfaces as an error.

### Demo Mode

```
User clicks "Enter Demo Mode"
    │
    ├─→ POST /api/auth/session  { demo: true }
    │       Sets cookie: tacitus-auth-session = { "demo": true }
    │       No Firebase involved
    │
    ├─→ setUser(DEMO_USER) in React state
    │       id: 'demo-user-001'
    │       credits: 999 (unlimited display)
    │       isDemo: true
    │
    └─→ router.push('/demo/dashboard')
```

Demo sessions are completely isolated from Firebase. The middleware reads the cookie and routes to `/demo/*`. Demo data never touches production Firestore.

---

## Session Cookie

**Name**: `tacitus-auth-session`
**Value**: JSON — `{"token":"eyJ..."}` (Firebase) or `{"demo":true}` (demo mode)

```typescript
const COOKIE_OPTIONS = {
  httpOnly: true,         // Not accessible via JavaScript
  secure: NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'lax',        // CSRF protection + allows top-level navigation
  maxAge: 60 * 60 * 24,  // 24 hours
  path: '/',
};
```

**Why `sameSite: 'lax'` and not `'strict'`?** Strict would block the cookie on Google's OAuth redirect back to the site (a cross-site top-level navigation), breaking the Google sign-in flow. Lax allows top-level navigation GETs while blocking cross-site sub-resource requests.

**Why store the raw ID token (not a Firebase session cookie)?** Firebase session cookies require a separate Admin SDK call to `createSessionCookie()` and a dedicated revocation system. The raw ID token approach is simpler and sufficient given the proactive 50-minute client-side refresh (see Token Refresh below).

---

## Token Lifecycle

Firebase ID tokens expire after **60 minutes**. PRAXIS handles this with two complementary mechanisms:

### 1. Reactive: `onIdTokenChanged` listener

```typescript
onIdTokenChanged(auth, async (fbUser) => {
  if (fbUser) {
    await syncTokenCookie(fbUser);  // Push fresh token to cookie immediately
    // Schedule proactive refresh...
  }
});
```

Firebase automatically refreshes the ID token using the refresh token. When it does, `onIdTokenChanged` fires → the new token is pushed to the session cookie.

### 2. Proactive: Forced refresh at 50 minutes

```typescript
refreshTimerRef.current = setTimeout(async () => {
  await fbUser.getIdToken(true);  // Force-refresh before expiry
  // onIdTokenChanged fires → cookie updated
}, 50 * 60 * 1000);
```

By refreshing at 50 minutes (10 minutes before expiry), we ensure the session cookie always has a valid token. The timer is cleared on sign-out and reset on each `onIdTokenChanged` event.

### Token Sync Retry Logic

`syncTokenCookie` retries once with a force-refreshed token if the server returns 401:

```typescript
let res = await fetch('/api/auth/session', { method: 'POST', body: { token } });
if (!res.ok && res.status === 401) {
  token = await fbUser.getIdToken(true);  // Force-refresh
  res = await fetch('/api/auth/session', { method: 'POST', body: { token } });
}
```

This handles the edge case where the client token is slightly ahead of Firebase's clock tolerance.

---

## Middleware (Route Protection)

`src/middleware.ts` — runs at the Vercel edge on every matched request.

```
matcher: ['/demo/:path*', '/app/:path*', '/login', '/pricing']
```

**Decision tree for `/app/*`:**
1. Read `tacitus-auth-session` cookie
2. Parse JSON value
3. If `sessionData?.token` → allow through
4. If `sessionData?.demo` → redirect to `/demo/dashboard` (wrong app)
5. Otherwise → redirect to `/login?redirect={pathname}`

**Decision tree for `/demo/*`:**
1. Read cookie
2. If `sessionData?.demo` → allow through
3. If `sessionData?.token` → redirect to `/app/dashboard` (wrong app)
4. Otherwise → redirect to `/login` (with demo hint)

**Important:** The middleware does NOT verify the Firebase token cryptographically — it only checks for presence. Full `verifyIdToken` happens in each API route via `withAuth()`. The middleware is a UX guard (redirects unauthenticated users); the API routes enforce actual security.

> **Do not rename `middleware.ts` to `proxy.ts`.** The Next.js proxy convention broke Google Sign-In in v3.9.1 (OAuth redirect returned to a `proxy.ts` that didn't handle the redirect result). Reverted in v3.9.2.

---

## API Route Protection

All AI and data API routes use `withAuth()`:

```typescript
export const GET = withAuth(async (req, user) => {
  // user.uid is verified — safe to use for Firestore queries
});
```

`withAuth()` in `src/lib/api/with-auth.ts`:
1. Reads `Authorization: Bearer <token>` header
2. Calls `verifyIdToken(token)` via Firebase Admin SDK
3. Checks rate limit (100 req/min per uid, in-memory)
4. Returns `{ uid, email }` to the handler

Credit deduction happens after auth, before AI calls:

```typescript
await checkAndDeductCredits(uid, 'risk_assessment', 3);
// throws 402 if insufficient credits
const result = await generateText(…);
```

---

## CSRF Protection

The session POST endpoint compares the `Origin` header against the server's host:

```typescript
const originHost = new URL(request.headers.get('origin')).host;
const serverHost =
  request.headers.get('x-forwarded-host') ||
  request.headers.get('host');

if (originHost !== serverHost) → 403 Forbidden
```

**Why `x-forwarded-host` first?** Vercel's edge proxy may rewrite the `host` header on production requests. `x-forwarded-host` preserves the original hostname the client connected to. Without this fallback, legitimate requests from `praxis.tacitus.me` would fail the origin check when Vercel's internal routing rewrote `host` to an internal address.

The check is skipped if either header is absent (covers server-to-server requests and health checks).

---

## Firestore User Profile

On first sign-in, `ensureUserProfile()` creates (or fetches) a Firestore document at `users/{uid}`:

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'analyst' | 'senior' | 'admin';
  orgId: string;
  orgName: string;
  credits: number;           // 5,000 on creation
  totalCreditsUsed: number;  // used to detect brand-new users for welcome email
  createdAt: Timestamp;
  // Consent fields (GDPR)
  tosAcceptedAt?: Timestamp;
  gdprConsentDate?: Timestamp;
  cookieConsentVersion?: string;
  marketingConsent?: boolean;
}
```

A Firestore `onSnapshot` listener in `AuthProvider` keeps the React `credits` state in real-time sync — credit deductions from AI usage, Stripe payments, and admin adjustments all update the UI immediately without a page refresh.

---

## Real-time Credit Sync

```typescript
const userDocRef = doc(db, 'users', firebaseUser.uid);
onSnapshot(userDocRef, (snapshot) => {
  const newCredits = snapshot.data()?.credits ?? 0;
  setCredits(newCredits);
  setUser(prev => prev ? { ...prev, credits: newCredits } : null);
});
```

This listener is active for the duration of the authenticated session. It is NOT started for demo users (`isDemoMode` check).

---

## Diagnosing Auth Issues

A dedicated diagnostic endpoint confirms the full stack is working from the Vercel runtime:

```
GET /api/auth/test-firebase
```

**Response:**
```json
{
  "diagnosis": "✅ Email/Password auth is ENABLED (Firebase responded with \"INVALID_LOGIN_CREDENTIALS\" as expected)",
  "firebaseReachable": true,
  "emailPasswordEnabled": true,
  "firebaseErrorCode": "INVALID_LOGIN_CREDENTIALS",
  "adminSdkStatus": "INITIALIZED_OK",
  "apiKeyUsed": "AIzaSyAH…",
  "timestamp": "2026-04-01T12:00:00.000Z"
}
```

| `adminSdkStatus` | Meaning |
|-----------------|---------|
| `INITIALIZED_OK` | `FIREBASE_SERVICE_ACCOUNT_KEY` is set and valid |
| `NOT_INITIALIZED` | Env var missing — Admin SDK running in projectId-only mode |
| `ERROR: ...` | Service account key is malformed or key has been revoked |

| `emailPasswordEnabled` | Meaning |
|----------------------|---------|
| `true` | Provider enabled — users can sign in |
| `false` + `OPERATION_NOT_ALLOWED` | Provider disabled in Firebase Console → Authentication → Sign-in method |

---

## Security Notes

- **Service account keys**: If a service account key is ever exposed, immediately revoke it in Google Cloud Console → IAM & Admin → Service Accounts → Manage Keys → Delete key. Generate a new key and update `FIREBASE_SERVICE_ACCOUNT_KEY` in Vercel.
- **ID token vs session cookie**: The raw ID token in the cookie expires in 60 min. The session cookie itself has a 24h `maxAge`, but the token inside becomes invalid after 60 min unless refreshed. Client-side refresh (via `onIdTokenChanged`) keeps it valid for active sessions.
- **Revocation**: Firebase does not revoke ID tokens immediately on sign-out — they remain technically valid until expiry. The session cookie deletion on logout effectively revokes access for this app. For hard security requirements, use Firebase session cookies (which support revocation) via `Admin.auth().createSessionCookie()`.

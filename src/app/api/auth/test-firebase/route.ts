import { NextResponse } from 'next/server';

/**
 * GET /api/auth/test-firebase
 *
 * Diagnostic endpoint — tests whether Firebase Auth is reachable and whether
 * Email/Password sign-in is enabled for this project. Sends a deliberate
 * bad-credential request to identitytoolkit and interprets the error code.
 *
 * Safe to expose: uses a clearly-invalid test email, no real credentials.
 */
export async function GET() {
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyAHNn4zJdMaxJXziRNa9SmHRFKUvO1q9uA';

  // --- 1. Check Admin SDK ---
  let adminStatus = 'unknown';
  try {
    const { verifyIdToken } = await import('@/lib/firebase/admin');
    // Deliberately pass a junk token — we expect a "Failed to verify" error,
    // not a "not initialized" error.
    await verifyIdToken('test-junk-token').catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      adminStatus = msg.includes('not initialized')
        ? 'NOT_INITIALIZED'
        : 'INITIALIZED_OK';
    });
    if (adminStatus === 'unknown') adminStatus = 'INITIALIZED_OK';
  } catch (e) {
    adminStatus = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // --- 2. Test Email/Password auth via REST (no SDK needed) ---
  let emailPasswordEnabled = false;
  let firebaseErrorCode = '';
  let firebaseReachable = false;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'diagnostic-test@praxis.tacitus.invalid',
          password: 'this-password-does-not-exist-xyz987',
          returnSecureToken: true,
        }),
      }
    );

    firebaseReachable = true;
    const data = (await res.json()) as { error?: { message: string; code: number } };

    if (data.error) {
      firebaseErrorCode = data.error.message;
      // OPERATION_NOT_ALLOWED  → Email/Password provider is DISABLED
      // EMAIL_NOT_FOUND        → enabled, but account doesn't exist (expected)
      // INVALID_LOGIN_CREDENTIALS → enabled, new Firebase SDK response
      // INVALID_PASSWORD       → enabled, old Firebase SDK response
      emailPasswordEnabled = firebaseErrorCode !== 'OPERATION_NOT_ALLOWED';
    } else {
      // Signed in with a junk password — shouldn't happen
      emailPasswordEnabled = true;
    }
  } catch (e) {
    firebaseReachable = false;
    firebaseErrorCode = `fetch_error: ${e instanceof Error ? e.message : String(e)}`;
  }

  const diagnosis = !firebaseReachable
    ? '❌ Cannot reach Firebase — network or CSP issue'
    : !emailPasswordEnabled
    ? '❌ Email/Password sign-in is DISABLED in Firebase Console → go to Authentication → Sign-in method → enable it'
    : `✅ Email/Password auth is ENABLED (Firebase responded with "${firebaseErrorCode}" as expected)`;

  return NextResponse.json({
    diagnosis,
    firebaseReachable,
    emailPasswordEnabled,
    firebaseErrorCode,
    adminSdkStatus: adminStatus,
    apiKeyUsed: `${apiKey.slice(0, 8)}…`,
    timestamp: new Date().toISOString(),
  });
}

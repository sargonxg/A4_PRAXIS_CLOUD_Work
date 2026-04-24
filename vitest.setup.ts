// Vitest global setup. Stubs the public Firebase env vars so modules that
// eagerly call `initializeApp` at import time don't crash under vitest.
//
// These values are NEVER used at runtime in tests — any code path that
// actually touches Firestore or Auth is mocked via `vi.mock` in the test
// file itself. The stubs only exist so the config-shaped module load
// succeeds.

process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??= 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??= 'praxis-test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??= 'praxis-test';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??= 'praxis-test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??= '000000000000';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??= '1:000000000000:web:test';

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { readFileSync } from 'node:fs';
import { verifyCurrentIdentity } from '@/lib/auth/current-token';
import { serverFirebaseEmulators } from '@/lib/firebase/emulator-config';

const emulators = serverFirebaseEmulators();

let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _initError: string | null = null;
let _credentialSource: 'FIREBASE_SERVICE_ACCOUNT_KEY' | 'FIREBASE_SERVICE_ACCOUNT_KEY_FILE' | 'GOOGLE_APPLICATION_CREDENTIALS' | null = null;

function readServiceAccountJson(): string | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    _credentialSource = 'FIREBASE_SERVICE_ACCOUNT_KEY';
    return process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  }

  const credentialPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialPath) return null;

  _credentialSource = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE
    ? 'FIREBASE_SERVICE_ACCOUNT_KEY_FILE'
    : 'GOOGLE_APPLICATION_CREDENTIALS';

  try {
    return readFileSync(credentialPath, 'utf8');
  } catch (err) {
    _initError = err instanceof Error ? err.message : String(err);
    console.error(`[firebase-admin] Could not read service-account file from ${_credentialSource}:`, _initError);
    return null;
  }
}

function ensureInitialized() {
  if (_app) return;

  if (emulators) {
    const existing = getApps()[0];
    if (existing && existing.options.projectId !== emulators.projectId) throw new Error('Refusing to reuse a non-emulator Firebase Admin app.');
    _app = existing ?? initializeApp({ projectId: emulators.projectId });
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    return;
  }

  // Already initialized by another import
  if (getApps().length > 0) {
    _app = getApps()[0];
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    return;
  }

  const raw = readServiceAccountJson();

  if (!raw) {
    _initError = _initError || 'Firebase Admin service-account credentials are not configured';
    console.error(`[firebase-admin] ${_initError}`);
    // Initialize without credentials — auth fallback will still work
    _app = initializeApp({ projectId: 'praxisbytacitus' });
    _auth = getAuth(_app);
    // _db intentionally left null — Firestore ops will fail with clear error
    return;
  }

  try {
    const serviceAccount = JSON.parse(raw);

    // Handle literal \n in private_key (common in env vars)
    if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    _app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || 'praxisbytacitus',
    });
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    console.log(`[firebase-admin] Initialized successfully with service account from ${_credentialSource}`);
  } catch (e) {
    _initError = e instanceof Error ? e.message : String(e);
    console.error('[firebase-admin] Failed to initialize:', _initError);
    // Fallback
    _app = initializeApp({ projectId: 'praxisbytacitus' });
    _auth = getAuth(_app);
  }
}

// Initialize on module load
ensureInitialized();

if (!_db) {
  console.error(
    '[firebase-admin] ⚠️  Firestore is NOT available.',
    'All routes requiring Firestore (credits, tool data, auth rate limiting) will fail.',
    'Init error:', _initError || 'FIREBASE_SERVICE_ACCOUNT_KEY not set or invalid JSON'
  );
}

export const adminAuth: Auth = _auth!;

// adminDb can be null if no service account key is set
export const adminDb: Firestore = _db!;

export function getAdminDbOrThrow(): Firestore {
  if (!_db) {
    const hint = !process.env.FIREBASE_SERVICE_ACCOUNT_KEY && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE && !process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? 'Firebase Admin credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY, FIREBASE_SERVICE_ACCOUNT_KEY_FILE, or GOOGLE_APPLICATION_CREDENTIALS.'
      : `Firebase Admin SDK failed to initialize: ${_initError}`;
    throw new Error(`[firebase-admin] Firestore unavailable. ${hint}`);
  }
  return _db;
}

/**
 * Firebase Admin Storage handle. Uses the default GCS bucket associated with
 * the Firebase project (praxisbytacitus.appspot.com unless overridden via
 * FIREBASE_STORAGE_BUCKET).
 */
export function getAdminStorage(): Storage {
  if (emulators) throw new Error('Source-byte storage is unavailable in the Auth/Firestore persistence lane.');
  if (!_app) {
    throw new Error('[firebase-admin] App not initialized; cannot return Storage.');
  }
  return getStorage(_app);
}

export function getDefaultBucketName(): string {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'praxisbytacitus.appspot.com'
  );
}

export async function verifyIdToken(token: string): Promise<{
  uid: string;
  email: string;
  name: string;
  emailVerified: boolean;
}> {
  if (!_auth) {
    throw new Error(
      'Firebase Auth not initialized. Set FIREBASE_SERVICE_ACCOUNT_KEY.'
    );
  }

  // Always verify token cryptographically — never decode without verification
  const decoded = await verifyCurrentIdentity(token, {
    verify: (value, checkRevoked) => _auth!.verifyIdToken(value, checkRevoked),
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    emulator: Boolean(emulators),
  });
  return {
    uid: decoded.uid,
    email: decoded.email || '',
    name: decoded.name || decoded.email?.split('@')[0] || 'User',
    emailVerified: decoded.email_verified === true,
  };
}

export default _app!;

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _initError: string | null = null;

function ensureInitialized() {
  if (_app) return;

  // Already initialized by another import
  if (getApps().length > 0) {
    _app = getApps()[0];
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    return;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) {
    _initError = 'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set';
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
    console.log('[firebase-admin] Initialized successfully with service account');
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
    const hint = !process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? 'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Check Secret Manager and Cloud Run configuration.'
      : `Firebase Admin SDK failed to initialize: ${_initError}`;
    throw new Error(`[firebase-admin] Firestore unavailable. ${hint}`);
  }
  return _db;
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
  const decoded = await _auth.verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email || '',
    name: decoded.name || decoded.email?.split('@')[0] || 'User',
    emailVerified: decoded.email_verified === true,
  };
}

export default _app!;

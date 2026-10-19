import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { resolveClientEmulators } from './emulator-config';
import type { Analytics } from 'firebase/analytics';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
} from 'firebase/app-check';

// -----------------------------------------------------------------------------
// IMPORTANT: These must be LITERAL `process.env.NEXT_PUBLIC_*` accesses. Any
// function/bracket indirection (e.g. `process.env[key]`) breaks Next.js 16
// Turbopack's static inlining — the browser bundle then ships without the
// values and every page throws at runtime.
// -----------------------------------------------------------------------------

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAHNn4zJdMaxJXziRNa9SmHRFKUvO1q9uA',
  authDomain: 'praxisbytacitus.firebaseapp.com',
  projectId: 'praxisbytacitus',
  storageBucket: 'praxisbytacitus.firebasestorage.app',
  messagingSenderId: '852128226674',
  appId: '1:852128226674:web:535f771c7a3568462c11eb',
  measurementId: 'G-7R44KT7CDY',
} as const;

// The fallback values are public Firebase client identifiers for the PRAXIS
// project. They keep `next build` working from a clean clone; production still
// injects the same values explicitly through Cloud Build.
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId;
// App Check site keys — reCAPTCHA Enterprise preferred; reCAPTCHA v3 as fallback.
const appCheckEnterpriseKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY;
const appCheckV3Key = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_V3_KEY;
const appCheckDebugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;

function assertPresent(name: string, value: string | undefined): asserts value is string {
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. See .env.example for the Firebase configuration block. ` +
        `In production, these are set by Cloud Build via --build-arg and --set-env-vars.`,
    );
  }
}

assertPresent('NEXT_PUBLIC_FIREBASE_API_KEY', apiKey);
assertPresent('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', authDomain);
assertPresent('NEXT_PUBLIC_FIREBASE_PROJECT_ID', projectId);
assertPresent('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', storageBucket);
assertPresent('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', messagingSenderId);
assertPresent('NEXT_PUBLIC_FIREBASE_APP_ID', appId);

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId, // optional
};

const emulator = resolveClientEmulators({
  mode: process.env.NEXT_PUBLIC_PRAXIS_EMULATOR_MODE,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  authHost: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
  firestoreHost: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}, typeof window === 'undefined' ? undefined : window.location.origin);
const emulatorHandlesKey = Symbol.for('praxis.local-emulator.client-handles.v1');
const emulatorHandles = globalThis as unknown as Record<symbol, { app: FirebaseApp; auth: Auth; db: Firestore } | undefined>;
const owned = emulator ? emulatorHandles[emulatorHandlesKey] : undefined;
if (emulator && (getApps().some(app => app !== owned?.app) || (owned && owned.app.options.projectId !== emulator.projectId))) {
  throw new Error('Mixed Firebase applications in isolated emulator runtime');
}
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ----------------------------------------------------------------------------
// Firebase App Check — prevents abuse of the public API key by asserting that
// requests originate from your registered app (via reCAPTCHA attestation).
// Runs only in the browser. Silently no-ops when no site key is configured.
// ----------------------------------------------------------------------------
// App Check only initializes when NEXT_PUBLIC_FIREBASE_APPCHECK_ENABLED=true.
// This lets us hold the reCAPTCHA Enterprise key in the build but keep App
// Check opt-in until the site key is fully registered in Firebase Console.
// Otherwise every Firebase call logs a reCAPTCHA 400 warning and may fail
// if enforcement is accidentally on server-side.
const appCheckEnabled = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENABLED === 'true';
if (emulator && (appCheckEnabled || appCheckEnterpriseKey || appCheckV3Key || appCheckDebugToken)) {
  throw new Error('App Check cannot be mixed with isolated Firebase emulators');
}

if (typeof window !== 'undefined' && appCheckEnabled) {
  try {
    if (appCheckDebugToken) {
      (window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
        appCheckDebugToken === 'true' ? true : appCheckDebugToken;
    }
    if (appCheckEnterpriseKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(appCheckEnterpriseKey),
        isTokenAutoRefreshEnabled: true,
      });
    } else if (appCheckV3Key) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckV3Key),
        isTokenAutoRefreshEnabled: true,
      });
    }
  } catch (err) {
    console.warn('[firebase/app-check] initialization failed (non-fatal):', err);
  }
}

export const auth = owned?.auth || getAuth(app);
export const db = owned?.db || getFirestore(app);
if (emulator && !owned) {
  connectAuthEmulator(auth, emulator.authOrigin);
  // Module initialization happens before any application Firestore operation.
  connectFirestoreEmulator(db, emulator.firestoreHost, emulator.firestorePort);
  emulatorHandles[emulatorHandlesKey] = Object.freeze({ app, auth, db });
}

// App initialization and sign-in must not initialize optional visit analytics.
// Keep this export compatible for callers; a future consent flow may opt in.
export const analytics: Analytics | null = null;

export default app;

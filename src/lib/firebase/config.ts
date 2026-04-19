import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// -----------------------------------------------------------------------------
// IMPORTANT: These must be LITERAL `process.env.NEXT_PUBLIC_*` accesses. Any
// function/bracket indirection (e.g. `process.env[key]`) breaks Next.js 16
// Turbopack's static inlining — the browser bundle then ships without the
// values and every page throws at runtime.
// -----------------------------------------------------------------------------

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

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

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
export { analytics };

export default app;

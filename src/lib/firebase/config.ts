import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required env var: ${key}. ` +
      `See .env.local.example for the Firebase configuration block. ` +
      `In production, these are set by Cloud Build via --set-env-vars.`
    );
  }
  return value;
}

const firebaseConfig = {
  apiKey: getEnvOrThrow('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvOrThrow('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvOrThrow('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvOrThrow('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvOrThrow('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvOrThrow('NEXT_PUBLIC_FIREBASE_APP_ID'),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // optional
};

// Initialize Firebase (singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics — only initialize on the client
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

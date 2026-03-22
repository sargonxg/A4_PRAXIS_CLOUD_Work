import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // In production, use service account credentials from env var.
  // In development, the Firebase Admin SDK can use Application Default Credentials
  // or a service account key JSON set via FIREBASE_SERVICE_ACCOUNT_KEY env var.
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: 'praxisbytacitus',
      });
    } catch (e) {
      console.error('[firebase-admin] Failed to parse service account key:', e);
    }
  }

  // Fallback: initialize without explicit credentials (uses ADC or emulator)
  return initializeApp({
    projectId: 'praxisbytacitus',
  });
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export default adminApp;

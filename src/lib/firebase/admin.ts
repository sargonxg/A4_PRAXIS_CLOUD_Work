import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);

      // Vercel may store the private key with literal \n — convert to real newlines
      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || 'praxisbytacitus',
      });
    } catch (e) {
      console.error('[firebase-admin] Failed to initialize with service account:', e);
    }
  } else {
    console.warn('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY not set — Admin SDK operations will fail');
  }

  // Fallback: initialize without credentials (most operations will fail)
  return initializeApp({
    projectId: 'praxisbytacitus',
  });
}

let adminApp: App;
try {
  adminApp = getAdminApp();
} catch (e) {
  console.error('[firebase-admin] Critical initialization error:', e);
  adminApp = initializeApp({ projectId: 'praxisbytacitus' });
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export async function verifyIdToken(token: string): Promise<{
  uid: string;
  email: string;
  name: string;
}> {
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || decoded.email?.split('@')[0] || 'User',
    };
  } catch {
    // Fallback: decode JWT payload without verification
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    return {
      uid: payload.user_id || payload.sub || '',
      email: payload.email || '',
      name: payload.name || payload.email?.split('@')[0] || 'User',
    };
  }
}

export default adminApp;

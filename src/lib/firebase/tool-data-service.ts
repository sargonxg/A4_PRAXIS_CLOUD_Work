import { adminDb } from './admin';

/**
 * Firestore path: users/{uid}/situations/{situationId}/tool-data/{toolId}
 * Stores AI-generated tool data so it persists across navigation.
 */

function toolDataRef(uid: string, situationId: string, toolId: string) {
  if (!adminDb) {
    throw new Error(
      'Firebase Admin SDK not initialized. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.'
    );
  }
  return adminDb
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(situationId)
    .collection('tool-data')
    .doc(toolId);
}

export async function saveToolData(
  uid: string,
  situationId: string,
  toolId: string,
  data: unknown
): Promise<void> {
  const ref = toolDataRef(uid, situationId, toolId);
  await ref.set({
    data,
    generatedAt: new Date().toISOString(),
    version: 1,
  });
}

export async function getToolData(
  uid: string,
  situationId: string,
  toolId: string
): Promise<{ data: unknown; generatedAt: string } | null> {
  const ref = toolDataRef(uid, situationId, toolId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const doc = snap.data();
  if (!doc) return null;

  return {
    data: doc.data,
    generatedAt: doc.generatedAt as string,
  };
}

export async function deleteToolData(
  uid: string,
  situationId: string,
  toolId: string
): Promise<void> {
  const ref = toolDataRef(uid, situationId, toolId);
  await ref.delete();
}

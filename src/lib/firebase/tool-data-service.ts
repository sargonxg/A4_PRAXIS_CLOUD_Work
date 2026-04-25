import { adminDb } from './admin';

/**
 * Firestore path: users/{uid}/situations/{situationId}/tool-data/{toolId}
 * Stores AI-generated tool data so it persists across navigation.
 * Version history: last 10 generations stored in versions/ subcollection.
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

function toolVersionsRef(uid: string, situationId: string, toolId: string) {
  return toolDataRef(uid, situationId, toolId).collection('versions');
}

export async function saveToolData(
  uid: string,
  situationId: string,
  toolId: string,
  data: unknown
): Promise<{ generatedAt: string; version: number }> {
  const ref = toolDataRef(uid, situationId, toolId);
  const snap = await ref.get();
  const prevVersion = snap.exists ? ((snap.data()?.version as number) ?? 1) : 0;
  const newVersion = prevVersion + 1;
  const generatedAt = new Date().toISOString();

  // Write current doc
  await ref.set({ data, generatedAt, version: newVersion });

  // Write version history snapshot
  const versionsRef = toolVersionsRef(uid, situationId, toolId);
  await versionsRef.doc(String(newVersion)).set({ data, generatedAt, version: newVersion });

  // Prune oldest version — keep last 10
  if (newVersion > 10) {
    const oldestKey = String(newVersion - 10);
    const oldSnap = await versionsRef.doc(oldestKey).get();
    if (oldSnap.exists) await versionsRef.doc(oldestKey).delete();
  }

  return { generatedAt, version: newVersion };
}

export async function getToolData(
  uid: string,
  situationId: string,
  toolId: string
): Promise<{ data: unknown; generatedAt: string; version: number } | null> {
  const ref = toolDataRef(uid, situationId, toolId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const doc = snap.data();
  if (!doc) return null;

  return {
    data: doc.data,
    generatedAt: doc.generatedAt as string,
    version: (doc.version as number) ?? 1,
  };
}

export async function getToolVersions(
  uid: string,
  situationId: string,
  toolId: string
): Promise<Array<{ version: number; generatedAt: string }>> {
  const versionsRef = toolVersionsRef(uid, situationId, toolId);
  const snap = await versionsRef.orderBy('version', 'desc').limit(10).get();
  return snap.docs.map(d => ({
    version: d.data().version as number,
    generatedAt: d.data().generatedAt as string,
  }));
}

export async function deleteToolData(
  uid: string,
  situationId: string,
  toolId: string
): Promise<void> {
  const ref = toolDataRef(uid, situationId, toolId);
  await ref.delete();
  // Version subcollection retained for audit purposes
}

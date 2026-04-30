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

export interface SaveToolDataOptions {
  metadata?: Record<string, unknown>;
  profileVersion?: number;
  toolRunId?: string | null;
  sourceReceipts?: unknown[];
  mirrorLegacyToolDoc?: boolean;
}

export interface ToolDataEnvelope {
  data: unknown;
  generatedAt: string;
  version: number;
  envelopeVersion?: number;
  toolId?: string;
  metadata?: Record<string, unknown>;
  profileVersion?: number;
  toolRunId?: string | null;
  sourceReceipts?: unknown[];
}

export async function saveToolData(
  uid: string,
  situationId: string,
  toolId: string,
  data: unknown,
  options: SaveToolDataOptions = {}
): Promise<{ generatedAt: string; version: number }> {
  const ref = toolDataRef(uid, situationId, toolId);
  const snap = await ref.get();
  const prevVersion = snap.exists ? ((snap.data()?.version as number) ?? 1) : 0;
  const newVersion = prevVersion + 1;
  const generatedAt = new Date().toISOString();
  const sourceReceipts = Array.isArray(options.sourceReceipts)
    ? options.sourceReceipts
    : Array.isArray(options.metadata?.sourceReceipts)
      ? options.metadata.sourceReceipts
      : [];
  const envelope: ToolDataEnvelope = {
    envelopeVersion: 1,
    toolId,
    data,
    generatedAt,
    version: newVersion,
    metadata: options.metadata ?? {},
    profileVersion: options.profileVersion,
    toolRunId: options.toolRunId ?? null,
    sourceReceipts,
  };

  // Write current doc
  await ref.set(envelope, { merge: true });

  // Write version history snapshot
  const versionsRef = toolVersionsRef(uid, situationId, toolId);
  await versionsRef.doc(String(newVersion)).set(envelope);

  if (options.mirrorLegacyToolDoc) {
    const situationRef = ref.parent.parent;
    await situationRef?.collection('tools').doc(toolId).set({
      toolId,
      output: data,
      metadata: {
        ...(options.metadata ?? {}),
        canonicalCollection: 'tool-data',
        canonicalVersion: newVersion,
      },
      generatedAtIso: generatedAt,
      version: newVersion,
    }, { merge: true });
  }

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
): Promise<ToolDataEnvelope | null> {
  const ref = toolDataRef(uid, situationId, toolId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const doc = snap.data();
  if (!doc) return null;

  return {
    data: doc.data,
    generatedAt: doc.generatedAt as string,
    version: (doc.version as number) ?? 1,
    envelopeVersion: doc.envelopeVersion as number | undefined,
    toolId: doc.toolId as string | undefined,
    metadata: doc.metadata as Record<string, unknown> | undefined,
    profileVersion: doc.profileVersion as number | undefined,
    toolRunId: doc.toolRunId as string | null | undefined,
    sourceReceipts: doc.sourceReceipts as unknown[] | undefined,
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

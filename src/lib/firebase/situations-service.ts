import { adminDb } from './admin';
import type { Situation, CreateSituationInput } from '@/types/situation';

function situationsCol(uid: string) {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
  }
  return adminDb.collection('users').doc(uid).collection('situations');
}

export async function createSituation(
  uid: string,
  data: CreateSituationInput
): Promise<Situation> {
  const col = situationsCol(uid);
  const ref = col.doc();
  const now = new Date().toISOString();
  const situation: Situation = {
    id: ref.id,
    name: data.name,
    type: data.type,
    description: data.description,
    region: data.region,
    actors: data.actors,
    userRole: data.userRole,
    status: data.status ?? 'active',
    riskScore: 0,
    glaslStage: null,
    escalationTrend: 'stable',
    actorCount: data.actors.length,
    graphEntities: 0,
    documentCount: data.initialDocumentIds?.length ?? 0,
    ...(data.sourceUrls?.length ? { sourceUrls: data.sourceUrls } : {}),
    ...(data.contextNotes ? { contextNotes: data.contextNotes } : {}),
    ...(data.initialDocumentIds?.length ? { initialDocumentIds: data.initialDocumentIds } : {}),
    ...(data.ontology ? { ontology: data.ontology } : {}),
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(situation);
  return situation;
}

export async function getSituation(
  uid: string,
  situationId: string
): Promise<Situation | null> {
  const snap = await situationsCol(uid).doc(situationId).get();
  return snap.exists ? (snap.data() as Situation) : null;
}

export async function listSituations(uid: string): Promise<Situation[]> {
  try {
    const snap = await situationsCol(uid).orderBy('updatedAt', 'desc').get();
    return snap.docs.map((d) => d.data() as Situation);
  } catch {
    // If index doesn't exist yet, try without ordering
    try {
      const snap = await situationsCol(uid).get();
      return snap.docs.map((d) => d.data() as Situation);
    } catch {
      return [];
    }
  }
}

export async function updateSituation(
  uid: string,
  situationId: string,
  updates: Partial<Situation>
): Promise<void> {
  await situationsCol(uid).doc(situationId).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function archiveSituation(
  uid: string,
  situationId: string
): Promise<void> {
  await updateSituation(uid, situationId, { status: 'archived' });
}

export async function deleteSituation(
  uid: string,
  situationId: string
): Promise<void> {
  if (!adminDb) throw new Error('Firebase Admin SDK not initialized.');
  const db = adminDb;
  const sitRef = situationsCol(uid).doc(situationId);
  const subcollections = [
    'graph', 'documents', 'reports', 'scenarios', 'chats',
    'tool-data', 'briefings', 'dossiers', 'talking-points',
    'risk-assessments', 'conflict-grammar',
  ];
  for (const name of subcollections) {
    let snap = await sitRef.collection(name).limit(200).get();
    while (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      if (snap.size < 200) break;
      snap = await sitRef.collection(name).limit(200).get();
    }
  }
  await sitRef.delete();
}

/**
 * Reads the conflict knowledge graph for a situation using the Admin SDK.
 * Used server-side to pre-load graph data into AI tool context.
 */
export async function getConflictGraphAdmin(
  uid: string,
  situationId: string
): Promise<{ nodes: unknown[]; edges: unknown[] } | null> {
  if (!adminDb) return null;
  const snap = await situationsCol(uid)
    .doc(situationId)
    .collection('graph')
    .doc('main')
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as { nodes?: unknown[]; edges?: unknown[] };
  return { nodes: data.nodes ?? [], edges: data.edges ?? [] };
}

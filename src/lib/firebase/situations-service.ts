import type { Situation, CreateSituationInput } from '@/types/situation';

/**
 * Get the Admin Firestore instance. Lazy-loaded to avoid initialization
 * errors when the module is imported but not used.
 */
function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { adminDb } = require('./admin');
  return adminDb as FirebaseFirestore.Firestore;
}

function situationsCol(uid: string) {
  return getDb().collection('users').doc(uid).collection('situations');
}

export async function createSituation(
  uid: string,
  data: CreateSituationInput
): Promise<Situation> {
  const ref = situationsCol(uid).doc();
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
    documentCount: 0,
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
  } catch (err) {
    // If index doesn't exist yet, try without ordering
    console.warn('[situations] orderBy failed, trying without:', err);
    const snap = await situationsCol(uid).get();
    return snap.docs.map((d) => d.data() as Situation);
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
  await situationsCol(uid).doc(situationId).delete();
}

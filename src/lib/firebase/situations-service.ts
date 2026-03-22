import { adminDb } from './admin';
import type { Situation, CreateSituationInput } from '@/types/situation';

function situationsCol(uid: string) {
  return adminDb.collection('users').doc(uid).collection('situations');
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
  const snap = await situationsCol(uid).orderBy('updatedAt', 'desc').get();
  return snap.docs.map((d) => d.data() as Situation);
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

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';
import type { Situation, CreateSituationInput } from '@/types/situation';

function situationsRef(uid: string) {
  return collection(db, 'users', uid, 'situations');
}

function situationDoc(uid: string, situationId: string) {
  return doc(db, 'users', uid, 'situations', situationId);
}

export async function createSituation(
  uid: string,
  data: CreateSituationInput
): Promise<Situation> {
  const ref = doc(situationsRef(uid));
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
  await setDoc(ref, situation);
  return situation;
}

export async function getSituation(
  uid: string,
  situationId: string
): Promise<Situation | null> {
  const snap = await getDoc(situationDoc(uid, situationId));
  return snap.exists() ? (snap.data() as Situation) : null;
}

export async function listSituations(uid: string): Promise<Situation[]> {
  const q = query(situationsRef(uid), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Situation);
}

export async function updateSituation(
  uid: string,
  situationId: string,
  updates: Partial<Situation>
): Promise<void> {
  await updateDoc(situationDoc(uid, situationId), {
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
  await deleteDoc(situationDoc(uid, situationId));
}

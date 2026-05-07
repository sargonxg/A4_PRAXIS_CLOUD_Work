import { randomUUID } from 'node:crypto';
import { adminDb } from '@/lib/firebase/admin';
import type { SavedClaim } from '@/types/saved-claims';

function collectionRef(uid: string, caseId: string) {
  return adminDb.collection('users').doc(uid).collection('situations').doc(caseId).collection('saved-claims');
}

function normalizeSavedClaim(id: string, data: FirebaseFirestore.DocumentData, uid: string, caseId: string): SavedClaim {
  const now = new Date().toISOString();
  return {
    id,
    caseId,
    ownerUid: uid,
    text: typeof data.text === 'string' ? data.text : '',
    title: typeof data.title === 'string' ? data.title : 'Saved claim',
    sourceRef: typeof data.sourceRef === 'string' ? data.sourceRef : undefined,
    trustScore: typeof data.trustScore === 'number' ? data.trustScore : 50,
    status: data.status === 'promoted' || data.status === 'dismissed' ? data.status : 'saved',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : now,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : now,
  };
}

export async function listSavedClaims(uid: string, caseId: string): Promise<SavedClaim[]> {
  const snap = await collectionRef(uid, caseId).limit(100).get();
  return snap.docs
    .map((doc) => normalizeSavedClaim(doc.id, doc.data(), uid, caseId))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function createSavedClaim(input: {
  uid: string;
  caseId: string;
  text: string;
  title?: string;
  sourceRef?: string;
  trustScore?: number;
}): Promise<SavedClaim> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const claim: SavedClaim = {
    id,
    caseId: input.caseId,
    ownerUid: input.uid,
    text: input.text,
    title: input.title?.trim() || input.text.slice(0, 72),
    sourceRef: input.sourceRef,
    trustScore: Math.max(0, Math.min(100, input.trustScore ?? 50)),
    status: 'saved',
    createdAt: now,
    updatedAt: now,
  };
  await collectionRef(input.uid, input.caseId).doc(id).set(claim);
  return claim;
}


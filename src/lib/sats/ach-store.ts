import { rankACH } from '@/lib/sats/ach-ranking';
import { buildSampleACHMatrix } from '@/lib/sats/sample-ach';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { ACHMatrixSchema, type ACHMatrix } from '@/types/sats';

const MAX_LIST = 25;

function achCollection(uid: string, caseId: string) {
  return getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(caseId)
    .collection('ach');
}

function normalizeMatrix(input: ACHMatrix): ACHMatrix {
  const matrix = ACHMatrixSchema.parse(input);
  return {
    ...matrix,
    ranking: rankACH(matrix),
  };
}

export function buildInitialACHMatrix(input: {
  uid: string;
  caseId: string;
  achId: string;
  title?: string;
  now?: string;
}): ACHMatrix {
  return normalizeMatrix(buildSampleACHMatrix(input.caseId, input.achId, {
    ownerUid: input.uid,
    title: input.title,
    now: input.now ?? new Date().toISOString(),
  }));
}

export async function listACHMatrices(uid: string, caseId: string, limit = MAX_LIST): Promise<ACHMatrix[]> {
  const snapshot = await achCollection(uid, caseId)
    .orderBy('updatedAt', 'desc')
    .limit(Math.min(Math.max(limit, 1), MAX_LIST))
    .get();

  return snapshot.docs.map((doc) => normalizeMatrix({ id: doc.id, ...doc.data() } as ACHMatrix));
}

export async function createACHMatrix(input: {
  uid: string;
  caseId: string;
  title?: string;
}): Promise<ACHMatrix> {
  const docRef = achCollection(input.uid, input.caseId).doc();
  const matrix = buildInitialACHMatrix({
    uid: input.uid,
    caseId: input.caseId,
    achId: docRef.id,
    title: input.title,
  });
  await docRef.set(matrix);
  return matrix;
}

export async function getACHMatrix(uid: string, caseId: string, achId: string): Promise<ACHMatrix | null> {
  const doc = await achCollection(uid, caseId).doc(achId).get();
  if (!doc.exists) return null;
  return normalizeMatrix({ id: doc.id, ...doc.data(), caseId, ownerUid: uid } as ACHMatrix);
}

export async function saveACHMatrix(uid: string, caseId: string, achId: string, matrix: ACHMatrix): Promise<ACHMatrix> {
  const now = new Date().toISOString();
  const sanitized = normalizeMatrix({
    ...matrix,
    id: achId,
    caseId,
    ownerUid: uid,
    updatedAt: now,
    createdAt: matrix.createdAt || now,
  });
  await achCollection(uid, caseId).doc(achId).set(sanitized, { merge: true });
  return sanitized;
}

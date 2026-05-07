import { randomUUID } from 'node:crypto';
import { adminDb } from '@/lib/firebase/admin';
import type { OpenQuestion, OpenQuestionCategory, OpenQuestionStatus } from '@/types/open-questions';

function collectionRef(uid: string, caseId: string) {
  return adminDb.collection('users').doc(uid).collection('situations').doc(caseId).collection('open-questions');
}

function normalizeOpenQuestion(id: string, data: FirebaseFirestore.DocumentData, uid: string, caseId: string): OpenQuestion {
  return {
    id,
    caseId,
    ownerUid: uid,
    question: typeof data.question === 'string' ? data.question : '',
    category: data.category ?? 'other',
    status: data.status ?? 'open',
    createdAt: data.createdAt ?? new Date().toISOString(),
    resolvedAt: data.resolvedAt,
    resolvedBy: data.resolvedBy,
    resolvedRef: data.resolvedRef,
    notes: data.notes,
  };
}

export async function listOpenQuestions(uid: string, caseId: string, status?: OpenQuestionStatus): Promise<OpenQuestion[]> {
  let query: FirebaseFirestore.Query = collectionRef(uid, caseId);
  if (status) query = query.where('status', '==', status);
  const snap = await query.limit(50).get();
  return snap.docs
    .map((doc) => normalizeOpenQuestion(doc.id, doc.data(), uid, caseId))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function createOpenQuestion(input: {
  uid: string;
  caseId: string;
  question: string;
  category?: OpenQuestionCategory;
  notes?: string;
}): Promise<OpenQuestion> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const item: OpenQuestion = {
    id,
    caseId: input.caseId,
    ownerUid: input.uid,
    question: input.question,
    category: input.category ?? 'other',
    status: 'open',
    createdAt: now,
    notes: input.notes,
  };
  await collectionRef(input.uid, input.caseId).doc(id).set(item);
  return item;
}

export async function updateOpenQuestion(input: {
  uid: string;
  caseId: string;
  questionId: string;
  status?: OpenQuestionStatus;
  notes?: string;
  resolvedRef?: string;
}): Promise<OpenQuestion | null> {
  const ref = collectionRef(input.uid, input.caseId).doc(input.questionId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const patch: Record<string, unknown> = {};
  if (input.status) {
    patch.status = input.status;
    patch.resolvedAt = input.status === 'answered' || input.status === 'dismissed' ? new Date().toISOString() : null;
    patch.resolvedBy = input.status === 'answered' ? 'user' : null;
  }
  if (typeof input.notes === 'string') patch.notes = input.notes;
  if (typeof input.resolvedRef === 'string') patch.resolvedRef = input.resolvedRef;

  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return normalizeOpenQuestion(updated.id, updated.data() ?? {}, input.uid, input.caseId);
}

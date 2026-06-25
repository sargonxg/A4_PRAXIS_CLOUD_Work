import type { DocumentData } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from './admin';

export interface AskThreadTurnRecord {
  id: string;
  ownerUid?: string;
  uid: string;
  capsuleId: string;
  threadId: string;
  situationId: string | null;
  prompt: string;
  output: string;
  capsuleVersion: number | null;
  runtime: Record<string, unknown>;
  pathId: string | null;
  pathVersion: number | null;
  frameworkSteps: unknown[];
  toolInvocations: unknown[];
  createdAt: string;
}

export interface AskThreadRecord {
  ownerUid?: string;
  uid: string;
  capsuleId: string;
  threadId: string;
  situationId: string | null;
  capsuleVersion: number | null;
  lastPrompt: string;
  lastOutputPreview: string;
  turnCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersistAskThreadTurnInput {
  uid: string;
  capsuleId?: string | null;
  threadId?: string | null;
  situationId?: string | null;
  prompt: string;
  output: string;
  capsuleVersion?: number | null;
  runtime?: Record<string, unknown>;
  pathId?: string | null;
  pathVersion?: number | null;
  frameworkSteps?: unknown[];
  toolInvocations?: unknown[];
  now?: Date;
  turnId?: string | null;
}

export async function persistAskThreadTurn(input: PersistAskThreadTurnInput): Promise<AskThreadTurnRecord | null> {
  const capsuleId = cleanDocId(input.capsuleId, '');
  if (!capsuleId) return null;

  const threadId = cleanDocId(input.threadId, 'default');
  const now = input.now ?? new Date();
  const requestedTurnId = cleanDocId(input.turnId, '');
  const turnId = requestedTurnId || `turn-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const db = getAdminDbOrThrow();
  const threadRef = db
    .collection('users').doc(input.uid)
    .collection('capsules').doc(capsuleId)
    .collection('askThreads').doc(threadId);
  const turnRef = threadRef.collection('turns').doc(turnId);
  const [threadSnap, turnSnap] = await Promise.all([
    threadRef.get(),
    requestedTurnId ? turnRef.get() : Promise.resolve(null),
  ]);
  const existing = threadSnap.exists ? threadSnap.data() : null;
  const existingTurn = turnSnap?.exists ? turnSnap.data() : null;
  const previousTurnCount = typeof existing?.turnCount === 'number' ? existing.turnCount : 0;
  const createdAt = typeof existingTurn?.createdAt === 'string' ? existingTurn.createdAt : now.toISOString();
  const nextTurnCount = existingTurn ? previousTurnCount : previousTurnCount + 1;

  const turn: AskThreadTurnRecord = {
    id: turnId,
    ownerUid: input.uid,
    uid: input.uid,
    capsuleId,
    threadId,
    situationId: input.situationId ?? null,
    prompt: input.prompt,
    output: input.output,
    capsuleVersion: input.capsuleVersion ?? null,
    runtime: input.runtime ?? {},
    pathId: input.pathId ?? null,
    pathVersion: input.pathVersion ?? null,
    frameworkSteps: input.frameworkSteps ?? [],
    toolInvocations: input.toolInvocations ?? [],
    createdAt,
  };

  await db.batch()
    .set(threadRef, {
      ownerUid: input.uid,
      uid: input.uid,
      capsuleId,
      threadId,
      situationId: input.situationId ?? existing?.situationId ?? null,
      capsuleVersion: input.capsuleVersion ?? existing?.capsuleVersion ?? null,
      lastPrompt: input.prompt.slice(0, 1600),
      lastOutputPreview: input.output.slice(0, 1600),
      turnCount: nextTurnCount,
      createdAt: typeof existing?.createdAt === 'string' ? existing.createdAt : createdAt,
      updatedAt: now.toISOString(),
    } satisfies AskThreadRecord, { merge: true })
    .set(turnRef, turn, { merge: true })
    .commit();

  return turn;
}

export async function listAskThreadTurns(input: {
  uid: string;
  capsuleId: string;
  threadId: string;
  limit?: number;
}): Promise<{ thread: AskThreadRecord | null; turns: AskThreadTurnRecord[] }> {
  const capsuleId = cleanDocId(input.capsuleId, '');
  const threadId = cleanDocId(input.threadId, '');
  if (!capsuleId || !threadId) return { thread: null, turns: [] };

  const db = getAdminDbOrThrow();
  const threadRef = db
    .collection('users').doc(input.uid)
    .collection('capsules').doc(capsuleId)
    .collection('askThreads').doc(threadId);
  const safeLimit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const [threadSnap, turnsSnap] = await Promise.all([
    threadRef.get(),
    threadRef.collection('turns').orderBy('createdAt', 'desc').limit(safeLimit).get(),
  ]);

  const thread = threadSnap.exists ? normalizeThread(threadSnap.data(), input.uid, capsuleId, threadId) : null;
  const safeThread = threadSnap.exists && recordOwnedBy(threadSnap.data(), input.uid) ? thread : null;
  const turns = turnsSnap.docs
    .filter((doc) => recordOwnedBy(doc.data(), input.uid))
    .map((doc) => normalizeTurn(doc.id, doc.data(), input.uid, capsuleId, threadId))
    .reverse();

  return { thread: safeThread, turns };
}

function normalizeThread(
  data: DocumentData | undefined,
  uid: string,
  capsuleId: string,
  threadId: string,
): AskThreadRecord {
  return {
    ownerUid: uid,
    uid,
    capsuleId,
    threadId,
    situationId: typeof data?.situationId === 'string' ? data.situationId : null,
    capsuleVersion: typeof data?.capsuleVersion === 'number' ? data.capsuleVersion : null,
    lastPrompt: typeof data?.lastPrompt === 'string' ? data.lastPrompt : '',
    lastOutputPreview: typeof data?.lastOutputPreview === 'string' ? data.lastOutputPreview : '',
    turnCount: typeof data?.turnCount === 'number' ? data.turnCount : 0,
    createdAt: typeof data?.createdAt === 'string' ? data.createdAt : '',
    updatedAt: typeof data?.updatedAt === 'string' ? data.updatedAt : '',
  };
}

function normalizeTurn(
  id: string,
  data: DocumentData | undefined,
  uid: string,
  capsuleId: string,
  threadId: string,
): AskThreadTurnRecord {
  return {
    id,
    ownerUid: uid,
    uid,
    capsuleId,
    threadId,
    situationId: typeof data?.situationId === 'string' ? data.situationId : null,
    prompt: typeof data?.prompt === 'string' ? data.prompt : '',
    output: typeof data?.output === 'string' ? data.output : '',
    capsuleVersion: typeof data?.capsuleVersion === 'number' ? data.capsuleVersion : null,
    runtime: isRecord(data?.runtime) ? data.runtime : {},
    pathId: typeof data?.pathId === 'string' ? data.pathId : null,
    pathVersion: typeof data?.pathVersion === 'number' ? data.pathVersion : null,
    frameworkSteps: Array.isArray(data?.frameworkSteps) ? data.frameworkSteps : [],
    toolInvocations: Array.isArray(data?.toolInvocations) ? data.toolInvocations : [],
    createdAt: typeof data?.createdAt === 'string' ? data.createdAt : '',
  };
}

function cleanDocId(value: string | null | undefined, fallback: string): string {
  const cleaned = value?.trim().replace(/[/?#[\]]/g, '-');
  return cleaned || fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function recordOwnedBy(data: DocumentData | undefined, uid: string): boolean {
  const ownerUid = typeof data?.ownerUid === 'string' && data.ownerUid.trim() ? data.ownerUid.trim() : null;
  const recordUid = typeof data?.uid === 'string' && data.uid.trim() ? data.uid.trim() : null;
  const storedOwner = ownerUid ?? recordUid;
  return !storedOwner || storedOwner === uid;
}

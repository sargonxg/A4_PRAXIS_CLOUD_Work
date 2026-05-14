import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export interface MemoSourceRecord {
  memoId: string;
  ownerUid: string;
  situationId: string | null;
  capsuleId: string;
  capsuleVersion: number;
  sourceReceipts: unknown[];
  claimChecks: unknown[];
  graphSnapshotId: string | null;
  toolInvocations: unknown[];
  askThreadId: string | null;
  askTurnId: string | null;
  createdFrom: 'ask-praxis';
  status: 'source-ready';
  ts: string;
}

export interface CreateMemoFromAskInput {
  memoId?: string;
  situationId?: string | null;
  capsuleId: string;
  capsuleVersion: number;
  sourceReceipts?: unknown[];
  claimChecks?: unknown[];
  graphSnapshotId?: string | null;
  toolInvocations?: unknown[];
  askThreadId?: string | null;
  askTurnId?: string | null;
  now?: Date;
}

export async function createMemoSourceFromAsk(
  uid: string,
  input: CreateMemoFromAskInput,
  db: Firestore = getAdminDbOrThrow(),
): Promise<MemoSourceRecord> {
  const record = buildMemoSourceRecord(uid, input);
  await db.collection('users').doc(uid).collection('memos').doc(record.memoId).set({
    ...record,
    updatedAtServer: FieldValue.serverTimestamp(),
  }, { merge: true });
  return record;
}

export function buildMemoSourceRecord(uid: string, input: CreateMemoFromAskInput): MemoSourceRecord {
  const ts = (input.now ?? new Date()).toISOString();
  return {
    memoId: cleanDocId(input.memoId) ?? `memo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    ownerUid: uid,
    situationId: cleanDocId(input.situationId) ?? null,
    capsuleId: cleanDocId(input.capsuleId) ?? 'default',
    capsuleVersion: Math.max(1, Math.floor(input.capsuleVersion)),
    sourceReceipts: Array.isArray(input.sourceReceipts) ? input.sourceReceipts : [],
    claimChecks: Array.isArray(input.claimChecks) ? input.claimChecks : [],
    graphSnapshotId: cleanDocId(input.graphSnapshotId) ?? null,
    toolInvocations: Array.isArray(input.toolInvocations) ? input.toolInvocations : [],
    askThreadId: cleanDocId(input.askThreadId) ?? null,
    askTurnId: cleanDocId(input.askTurnId) ?? null,
    createdFrom: 'ask-praxis',
    status: 'source-ready',
    ts,
  };
}

function cleanDocId(value: string | null | undefined): string | null {
  const cleaned = value?.trim().replace(/[/?#[\]]/g, '_').slice(0, 180);
  return cleaned || null;
}

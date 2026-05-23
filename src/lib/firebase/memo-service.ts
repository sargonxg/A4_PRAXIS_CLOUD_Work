import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { createMemoVersion } from '@/lib/memo/export';
import { MemoBlockSchema, MemoTemplateIdSchema, type Memo, type MemoBlock, type MemoStatus, type MemoTemplateId, type MemoVersion } from '@/types/memo';

export interface SaveMemoDraftInput {
  caseId: string;
  templateId: MemoTemplateId;
  title: string;
  blocks: MemoBlock[];
  graphSnapshotId: string;
  status?: MemoStatus;
  changeNote?: string;
  capsuleId?: string | null;
  capsuleVersion?: number | null;
  conversationId?: string | null;
  runId?: string | null;
  outputTarget?: string | null;
  sourceReceiptIds?: string[];
  sourceReceipts?: unknown[];
  unsupportedClaims?: string[];
  claimChecks?: unknown[];
  outputCapsuleId?: string | null;
}

export interface MemoDraftRecord {
  memo: Memo;
  versions: MemoVersion[];
}

export function memoDocumentId(caseId: string, templateId: MemoTemplateId): string {
  return `${sanitizeDocId(caseId)}__${sanitizeDocId(templateId)}`;
}

export async function loadMemoDraft(uid: string, caseId: string, templateId: MemoTemplateId, db: Firestore = getAdminDbOrThrow()): Promise<MemoDraftRecord | null> {
  const memoRef = memoRefFor(db, uid, caseId, templateId);
  const memoSnap = await memoRef.get();
  if (!memoSnap.exists) return null;

  const versionsSnap = await memoRef.collection('versions').orderBy('versionNumber', 'asc').get();
  return {
    memo: memoSnap.data() as Memo,
    versions: versionsSnap.docs.map((doc) => doc.data() as MemoVersion),
  };
}

export async function saveMemoDraft(uid: string, input: SaveMemoDraftInput, db: Firestore = getAdminDbOrThrow()): Promise<MemoDraftRecord> {
  validateMemoDraft(input);
  const memoId = memoDocumentId(input.caseId, input.templateId);
  const memoRef = memoRefFor(db, uid, input.caseId, input.templateId);
  const existing = await loadMemoDraft(uid, input.caseId, input.templateId, db);
  const version = createMemoVersion({
    memoId,
    templateId: input.templateId,
    title: input.title,
    authorUid: uid,
    graphSnapshotId: input.graphSnapshotId,
    blocks: input.blocks,
    previousVersions: existing?.versions,
    changeNote: input.changeNote,
  });
  const now = new Date().toISOString();
  const memo: Memo = {
    id: memoId,
    caseId: input.caseId,
    ownerUid: uid,
    templateId: input.templateId,
    title: input.title,
    status: input.status ?? existing?.memo.status ?? 'draft',
    currentVersionId: version.id,
    createdAt: existing?.memo.createdAt ?? now,
    updatedAt: now,
  };
  const memoMetadata = {
    ...(input.capsuleId ? { capsuleId: input.capsuleId } : {}),
    ...(typeof input.capsuleVersion === 'number' ? { capsuleVersion: input.capsuleVersion } : {}),
    ...(input.conversationId ? { conversationId: input.conversationId } : {}),
    ...(input.runId ? { runId: input.runId } : {}),
    ...(input.outputTarget ? { outputTarget: input.outputTarget } : {}),
    ...(input.sourceReceiptIds ? { sourceReceiptIds: input.sourceReceiptIds } : {}),
    ...(input.sourceReceipts ? { sourceReceipts: input.sourceReceipts } : {}),
    ...(input.unsupportedClaims ? { unsupportedClaims: input.unsupportedClaims } : {}),
    ...(input.claimChecks ? { claimChecks: input.claimChecks } : {}),
    ...(input.outputCapsuleId ? { outputCapsuleId: input.outputCapsuleId } : {}),
  };

  await memoRef.set({ ...memo, ...memoMetadata, updatedAtServer: FieldValue.serverTimestamp() }, { merge: true });
  await memoRef.collection('versions').doc(version.id).set(version);
  return { memo, versions: [...(existing?.versions ?? []), version] };
}

function validateMemoDraft(input: SaveMemoDraftInput): void {
  if (!input.caseId || !input.title || !input.graphSnapshotId) throw new Error('caseId, title, and graphSnapshotId are required');
  MemoTemplateIdSchema.parse(input.templateId);
  for (const block of input.blocks) MemoBlockSchema.parse(block);
}

function memoRefFor(db: Firestore, uid: string, caseId: string, templateId: MemoTemplateId) {
  return db.collection('users').doc(uid)
    .collection('situations').doc(sanitizeDocId(caseId))
    .collection('memos').doc(memoDocumentId(caseId, templateId));
}

function sanitizeDocId(value: string): string {
  return value.replace(/[/?#[\]]/g, '_').slice(0, 180);
}

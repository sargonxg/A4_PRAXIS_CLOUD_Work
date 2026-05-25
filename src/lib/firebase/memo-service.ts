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

export interface LoadedMemoByIdRecord {
  memo: Memo & Record<string, unknown>;
  versions: Array<MemoVersion & Record<string, unknown>>;
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

export async function loadMemoById(uid: string, memoId: string, db: Firestore = getAdminDbOrThrow()): Promise<LoadedMemoByIdRecord | null> {
  const cleanMemoId = sanitizeDocId(memoId);
  if (!cleanMemoId) return null;

  const rootRef = db.collection('users').doc(uid).collection('memos').doc(cleanMemoId);
  const rootSnap = await rootRef.get();
  if (rootSnap.exists) {
    const versionsSnap = await rootRef.collection('versions').orderBy('versionNumber', 'asc').get().catch(() => null);
    return normalizeLoadedMemo(cleanMemoId, rootSnap.data() ?? {}, versionsSnap?.docs.map((doc) => doc.data()) ?? []);
  }

  const byId = await db
    .collectionGroup('memos')
    .where('ownerUid', '==', uid)
    .where('id', '==', cleanMemoId)
    .limit(1)
    .get();
  const match = byId.docs[0];
  if (!match) return null;

  const versionsSnap = await match.ref.collection('versions').orderBy('versionNumber', 'asc').get().catch(() => null);
  return normalizeLoadedMemo(cleanMemoId, match.data() ?? {}, versionsSnap?.docs.map((doc) => doc.data()) ?? []);
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

function normalizeLoadedMemo(memoId: string, data: Record<string, unknown>, versions: Array<Record<string, unknown>>): LoadedMemoByIdRecord {
  const now = new Date(0).toISOString();
  const caseId = stringField(data.caseId) ?? stringField(data.situationId) ?? stringField(data.capsuleId) ?? 'default';
  const templateId = MemoTemplateIdSchema.safeParse(data.templateId).success
    ? data.templateId as MemoTemplateId
    : 'policy-memo';
  const status = typeof data.status === 'string' && ['draft', 'review', 'final', 'archived'].includes(data.status)
    ? data.status as MemoStatus
    : 'draft';
  const normalizedVersions = versions.map((version, index) => ({
    id: stringField(version.id) ?? `version-${index + 1}`,
    memoId: stringField(version.memoId) ?? memoId,
    versionNumber: numberField(version.versionNumber) ?? index + 1,
    authorUid: stringField(version.authorUid) ?? stringField(data.ownerUid) ?? 'unknown',
    createdAt: stringField(version.createdAt) ?? stringField(data.updatedAt) ?? now,
    graphSnapshotId: stringField(version.graphSnapshotId) ?? stringField(data.graphSnapshotId) ?? `${caseId}:memo:${memoId}`,
    blocks: Array.isArray(version.blocks) ? version.blocks as MemoBlock[] : [],
    ...(typeof version.changeNote === 'string' ? { changeNote: version.changeNote } : {}),
    ...version,
  }));

  return {
    memo: {
      id: stringField(data.id) ?? stringField(data.memoId) ?? memoId,
      caseId,
      ownerUid: stringField(data.ownerUid) ?? 'unknown',
      templateId,
      title: stringField(data.title) ?? stringField(data.memoTitle) ?? memoId,
      status,
      currentVersionId: stringField(data.currentVersionId) ?? normalizedVersions.at(-1)?.id ?? 'version-1',
      createdAt: stringField(data.createdAt) ?? stringField(data.ts) ?? now,
      updatedAt: stringField(data.updatedAt) ?? stringField(data.ts) ?? now,
      ...data,
    },
    versions: normalizedVersions,
  };
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberField(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sanitizeDocId(value: string): string {
  return value.replace(/[/?#[\]]/g, '_').slice(0, 180);
}

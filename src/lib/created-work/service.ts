import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { listRecentAgentRuns } from '@/lib/agent-runtime/postgres';
import { toAgentRunOutput } from '@/lib/agent-runtime/schema';
import type { AgentRun } from '@/lib/agent-runtime/types';
import { listOutputCapsules } from '@/lib/output-capsules/storage';
import type { OutputCapsuleRecord } from '@/lib/output-capsules/types';

export type CreatedWorkKind =
  | 'ask_document_pack'
  | 'output_capsule'
  | 'memo_draft'
  | 'handover_package'
  | 'tool_run_artifact'
  | 'agent_run';

export type CreatedWorkSummary = {
  id: string;
  kind: CreatedWorkKind;
  title: string;
  status: string;
  capsuleId: string | null;
  conversationId: string | null;
  runId: string | null;
  createdAt: string;
  primaryAction: {
    label: string;
    href: string;
  };
  receiptIds: string[];
  outputCapsuleId?: string | null;
  mode: 'live' | 'demo';
};

export type CreatedWorkResponse = {
  persisted: boolean;
  items: CreatedWorkSummary[];
  errors?: string[];
};

export type CreatedWorkListInput = {
  capsuleId?: string | null;
  limit?: number;
  demo?: boolean;
};

export type CreatedWorkServiceDeps = {
  db?: Firestore;
  listOutputCapsules?: typeof listOutputCapsules;
  listRecentAgentRuns?: typeof listRecentAgentRuns;
};

type CreatedWorkInternal = CreatedWorkSummary & { sortAt: string };

const DEFAULT_LIMIT = 24;
const EPOCH_ISO = new Date(0).toISOString();

export async function listCreatedWork(
  uid: string,
  input: CreatedWorkListInput = {},
  deps: CreatedWorkServiceDeps = {},
): Promise<CreatedWorkResponse> {
  const limit = Math.max(1, Math.min(50, Math.floor(input.limit ?? DEFAULT_LIMIT)));
  if (input.demo) {
    return {
      persisted: false,
      items: demoCreatedWork().slice(0, limit),
    };
  }

  const db = deps.db ?? getAdminDbOrThrow();
  const errors: string[] = [];
  const items: CreatedWorkInternal[] = [];

  await readCreatedWorkLane(errors, async () => {
    items.push(...await listOutputCapsuleWork(uid, input, deps));
  });
  await readCreatedWorkLane(errors, async () => {
    items.push(...await listMemoDraftWork(db, uid, input));
  });
  await readCreatedWorkLane(errors, async () => {
    items.push(...await listHandoverPackageWork(db, uid, input));
  });
  await readCreatedWorkLane(errors, async () => {
    items.push(...await listToolArtifactWork(db, uid, input));
  });
  await readCreatedWorkLane(errors, async () => {
    items.push(...await listAskDocumentPackWork(db, uid, input));
  });
  await readCreatedWorkLane(errors, async () => {
    items.push(...await listAgentRunWork(uid, input, deps));
  });

  const deduped = dedupeCreatedWork(items)
    .sort((a, b) => b.sortAt.localeCompare(a.sortAt))
    .slice(0, limit)
    .map(({ sortAt: _sortAt, ...item }) => item);

  return {
    persisted: errors.length === 0,
    items: deduped,
    ...(errors.length ? { errors } : {}),
  };
}

function demoCreatedWork(): CreatedWorkSummary[] {
  return [
    {
      id: 'demo-ask-pack',
      kind: 'ask_document_pack',
      title: 'Demo source-backed options pack',
      status: 'local demo',
      capsuleId: 'starter-situation-mediation-track',
      conversationId: 'demo-conversation',
      runId: null,
      createdAt: '2026-05-24T00:00:00.000Z',
      primaryAction: { label: 'Open demo', href: '/' },
      receiptIds: ['demo-source-receipt'],
      mode: 'demo',
    },
    {
      id: 'demo-output-capsule',
      kind: 'output_capsule',
      title: 'Demo principals memo OutputCapsule',
      status: 'review',
      capsuleId: 'starter-output-principals-decision-memo',
      conversationId: null,
      runId: 'demo-run',
      createdAt: '2026-05-24T00:00:01.000Z',
      primaryAction: { label: 'Open output', href: '/login?mode=signup' },
      receiptIds: ['demo-source-receipt'],
      mode: 'demo',
    },
    {
      id: 'demo-handover',
      kind: 'handover_package',
      title: 'Demo handover package',
      status: 'sample',
      capsuleId: 'starter-output-board-decision-memo-pack',
      conversationId: null,
      runId: 'demo-run',
      createdAt: '2026-05-24T00:00:02.000Z',
      primaryAction: { label: 'Inspect receipts', href: '/login?mode=signup' },
      receiptIds: ['demo-source-receipt', 'demo-gap-receipt'],
      mode: 'demo',
    },
  ];
}

async function listOutputCapsuleWork(
  uid: string,
  input: CreatedWorkListInput,
  deps: CreatedWorkServiceDeps,
): Promise<CreatedWorkInternal[]> {
  const records = await (deps.listOutputCapsules ?? listOutputCapsules)(uid, {
    contextCapsuleId: input.capsuleId ?? undefined,
    limit: input.limit ?? DEFAULT_LIMIT,
  });
  return records.map(outputCapsuleToCreatedWork);
}

function outputCapsuleToCreatedWork(record: OutputCapsuleRecord): CreatedWorkInternal {
  const title = titleFromPayload(record.payload)
    ?? labelFromTemplateId(record.templateId)
    ?? record.id;
  const receiptIds = uniqueStrings([
    ...record.citations.map((citation) => citation.sourceReceiptId),
  ]);
  const provenance = record.provenance as unknown as Record<string, unknown>;
  const runId = stringField(provenance.runId)
    ?? record.provenance.traceId
    ?? null;
  return withSortKey({
    id: record.id,
    kind: 'output_capsule',
    title,
    status: record.status,
    capsuleId: record.contextCapsuleId ?? null,
    conversationId: stringField((record.payload as Record<string, unknown>)?.conversationId),
    runId,
    createdAt: record.createdAt,
    primaryAction: { label: 'Open output', href: `/app?panel=output-capsule&outputCapsuleId=${encodeURIComponent(record.id)}` },
    receiptIds,
    outputCapsuleId: record.id,
    mode: 'live',
  }, record.updatedAt);
}

async function listMemoDraftWork(
  db: Firestore,
  uid: string,
  input: CreatedWorkListInput,
): Promise<CreatedWorkInternal[]> {
  const situationIds = await situationIdsForMemoScan(db, uid, input.capsuleId);
  const items: CreatedWorkInternal[] = [];
  for (const situationId of situationIds) {
    const snap = await db
      .collection('users').doc(uid)
      .collection('situations').doc(situationId)
      .collection('memos')
      .orderBy('updatedAt', 'desc')
      .limit(Math.max(1, Math.min(50, input.limit ?? 20)))
      .get();
    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const capsuleId = stringField(data.capsuleId) ?? situationId;
      if (input.capsuleId && capsuleId !== input.capsuleId && situationId !== input.capsuleId) continue;
      const memoId = stringField(data.id) ?? stringField(data.memoId) ?? doc.id;
      const updatedAt = isoField(data.updatedAt) ?? isoField(data.createdAt) ?? EPOCH_ISO;
      items.push(withSortKey({
        id: memoId,
        kind: 'memo_draft',
        title: stringField(data.title) ?? stringField(data.memoTitle) ?? memoId,
        status: stringField(data.status) ?? 'draft',
        capsuleId,
        conversationId: stringField(data.conversationId),
        runId: stringField(data.runId),
        createdAt: isoField(data.createdAt) ?? updatedAt,
        primaryAction: { label: 'Open memo', href: `/app/write?memoId=${encodeURIComponent(memoId)}` },
        receiptIds: receiptIdsFrom(data.sourceReceiptIds ?? data.sourceReceipts),
        outputCapsuleId: stringField(data.outputCapsuleId),
        mode: 'live',
      }, updatedAt));
    }
  }
  return items;
}

async function listHandoverPackageWork(
  db: Firestore,
  uid: string,
  input: CreatedWorkListInput,
): Promise<CreatedWorkInternal[]> {
  const snap = await db
    .collection('users').doc(uid)
    .collection('handover_packages')
    .orderBy('createdAt', 'desc')
    .limit(Math.max(1, Math.min(50, input.limit ?? 20)))
    .get();
  return snap.docs
    .map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const capsuleId = stringField(data.capsuleId);
      if (input.capsuleId && capsuleId !== input.capsuleId) return null;
      const memoId = stringField(data.memoId);
      const createdAt = isoField(data.createdAt) ?? isoField(data.updatedAt) ?? EPOCH_ISO;
      return withSortKey({
        id: doc.id,
        kind: 'handover_package',
        title: stringField(data.title) ?? (memoId ? `Handover package for ${memoId}` : 'Handover package'),
        status: stringField(data.status) ?? 'ready',
        capsuleId,
        conversationId: stringField(data.conversationId),
        runId: stringField(data.runId),
        createdAt,
        primaryAction: { label: 'Open handover', href: stringField(data.signedUrl) ?? (memoId ? `/app/write?memoId=${encodeURIComponent(memoId)}` : '/app') },
        receiptIds: receiptIdsFrom(data.sourceReceiptIds ?? data.sourceReceipts),
        mode: 'live',
      }, isoField(data.updatedAt) ?? createdAt);
    })
    .filter(isCreatedWorkInternal);
}

async function listToolArtifactWork(
  db: Firestore,
  uid: string,
  input: CreatedWorkListInput,
): Promise<CreatedWorkInternal[]> {
  const situationIds = await situationIdsForMemoScan(db, uid, input.capsuleId);
  const items: CreatedWorkInternal[] = [];
  for (const situationId of situationIds) {
    const snap = await db
      .collection('users').doc(uid)
      .collection('situations').doc(situationId)
      .collection('artifacts')
      .orderBy('updatedAt', 'desc')
      .limit(Math.max(1, Math.min(50, input.limit ?? 20)))
      .get();
    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const capsuleId = stringField(data.capsuleId) ?? situationId;
      if (input.capsuleId && capsuleId !== input.capsuleId && situationId !== input.capsuleId) continue;
      const updatedAt = isoField(data.updatedAt) ?? isoField(data.createdAt) ?? EPOCH_ISO;
      items.push(withSortKey({
        id: doc.id,
        kind: 'tool_run_artifact',
        title: stringField(data.title) ?? stringField(data.name) ?? doc.id,
        status: stringField(data.status) ?? stringField(data.toolId) ?? 'artifact',
        capsuleId,
        conversationId: stringField(data.conversationId),
        runId: stringField(data.runId),
        createdAt: isoField(data.createdAt) ?? updatedAt,
        primaryAction: { label: 'Open artifact', href: `/app?panel=artifact&artifactId=${encodeURIComponent(doc.id)}` },
        receiptIds: receiptIdsFrom(data.sourceReceiptIds ?? data.sourceReceipts),
        mode: 'live',
      }, updatedAt));
    }
  }
  return items;
}

async function listAskDocumentPackWork(
  db: Firestore,
  uid: string,
  input: CreatedWorkListInput,
): Promise<CreatedWorkInternal[]> {
  const conversationSnap = await db
    .collection('users').doc(uid)
    .collection('conversations')
    .orderBy('updatedAt', 'desc')
    .limit(12)
    .get();
  const items: CreatedWorkInternal[] = [];
  for (const conversationDoc of conversationSnap.docs) {
    const conversation = conversationDoc.data() as Record<string, unknown>;
    const conversationId = stringField(conversation.conversationId) ?? conversationDoc.id;
    const conversationCapsuleId = stringField(conversation.capsuleId);
    if (input.capsuleId && conversationCapsuleId && conversationCapsuleId !== input.capsuleId) continue;
    const turnSnap = await db
      .collection('users').doc(uid)
      .collection('conversations').doc(conversationId)
      .collection('turns')
      .orderBy('createdAt', 'desc')
      .limit(8)
      .get();
    for (const turnDoc of turnSnap.docs) {
      const turn = turnDoc.data() as Record<string, unknown>;
      const pack = documentPackFromTurn(turn);
      if (!pack) continue;
      const provenance = isRecord(pack.provenance) ? pack.provenance : {};
      const capsuleId = stringField(provenance.capsuleId) ?? stringField(turn.capsuleId) ?? conversationCapsuleId;
      if (input.capsuleId && capsuleId !== input.capsuleId) continue;
      const createdAt = isoField(provenance.generatedAt) ?? isoField(turn.createdAt) ?? EPOCH_ISO;
      items.push(withSortKey({
        id: `${conversationId}:${turnDoc.id}:pack`,
        kind: 'ask_document_pack',
        title: stringField(pack.title) ?? stringField(turn.prompt) ?? 'Ask PRAXIS document pack',
        status: stringField((provenance as Record<string, unknown>).outputTarget) ?? 'ask-response',
        capsuleId,
        conversationId,
        runId: stringField(provenance.runId),
        createdAt,
        primaryAction: {
          label: 'Open conversation',
          href: `/app/conversations/${encodeURIComponent(conversationId)}${capsuleId ? `?capsuleId=${encodeURIComponent(capsuleId)}` : ''}`,
        },
        receiptIds: receiptIdsFrom(provenance.sourceReceiptIds),
        mode: 'live',
      }, createdAt));
    }
  }
  return items;
}

async function listAgentRunWork(
  uid: string,
  input: CreatedWorkListInput,
  deps: CreatedWorkServiceDeps,
): Promise<CreatedWorkInternal[]> {
  const runs = await (deps.listRecentAgentRuns ?? listRecentAgentRuns)(uid, input.limit ?? 20);
  return runs
    .filter((run) => !input.capsuleId || run.capsuleId === input.capsuleId)
    .map(agentRunToCreatedWork);
}

function agentRunToCreatedWork(run: AgentRun): CreatedWorkInternal {
  const dto = toAgentRunOutput(run);
  return withSortKey({
    id: dto.runId,
    kind: 'agent_run',
    title: dto.policyAgentLabel ? `${dto.policyAgentLabel}: ${dto.objective}` : dto.objective,
    status: dto.status,
    capsuleId: dto.capsuleId,
    conversationId: stringField(run.metadata?.conversationId),
    runId: dto.runId,
    createdAt: dto.createdAt,
    primaryAction: { label: 'Open run', href: `/agents/${encodeURIComponent(dto.runId)}` },
    receiptIds: dto.sourceReceiptIds ?? [],
    mode: 'live',
  }, dto.updatedAt);
}

async function situationIdsForMemoScan(
  db: Firestore,
  uid: string,
  capsuleId?: string | null,
): Promise<string[]> {
  if (capsuleId) return [capsuleId];
  const snap = await db
    .collection('users').doc(uid)
    .collection('situations')
    .limit(20)
    .get();
  return snap.docs.map((doc) => doc.id);
}

function documentPackFromTurn(turn: Record<string, unknown>): Record<string, unknown> | null {
  const directEnvelope = isRecord(turn.answerEnvelope) ? turn.answerEnvelope : null;
  const runtime = isRecord(turn.runtime) ? turn.runtime : null;
  const runtimeEnvelope = isRecord(runtime?.answerEnvelope) ? runtime.answerEnvelope : null;
  const pack = directEnvelope?.documentPackCandidate ?? runtimeEnvelope?.documentPackCandidate;
  return isRecord(pack) ? pack : null;
}

async function readCreatedWorkLane(errors: string[], lane: () => Promise<void>): Promise<void> {
  try {
    await lane();
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }
}

function withSortKey(item: CreatedWorkSummary, sortAt?: string | null): CreatedWorkInternal {
  return {
    ...item,
    createdAt: item.createdAt || EPOCH_ISO,
    sortAt: sortAt || item.createdAt || EPOCH_ISO,
  };
}

function dedupeCreatedWork(items: CreatedWorkInternal[]): CreatedWorkInternal[] {
  const byKey = new Map<string, CreatedWorkInternal>();
  for (const item of items) {
    byKey.set(`${item.kind}:${item.id}`, item);
  }
  return Array.from(byKey.values());
}

function titleFromPayload(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  return stringField(payload.title)
    ?? stringField(payload.heading)
    ?? stringField(payload.summary);
}

function labelFromTemplateId(templateId: string): string {
  return templateId
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function receiptIdsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return uniqueStrings(value.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (isRecord(item)) return [item.id, item.receiptId, item.sourceReceiptId];
    return [];
  }));
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(new Set(values
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())));
}

function isoField(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isCreatedWorkInternal(value: CreatedWorkInternal | null): value is CreatedWorkInternal {
  return Boolean(value);
}

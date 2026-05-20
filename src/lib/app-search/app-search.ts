import { z } from 'zod';
import { COMMAND_SEARCH_ACTIONS } from '@/lib/app-search/static-actions';
import { listCapsules, type PraxisCapsule } from '@/lib/context/capsule-service';
import { CAPSULE_STARTER_DEFINITIONS } from '@/lib/product/context-capsules';
import { listKnowledgeDocuments, type KnowledgeDocument } from '@/lib/knowledge/library-service';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { listRecentAgentRuns } from '@/lib/agent-runtime/postgres';
import { toAgentRunOutput } from '@/lib/agent-runtime/schema';
import type { AgentRun } from '@/lib/agent-runtime/types';

export const APP_SEARCH_TYPES = ['action', 'capsule', 'memo', 'document', 'source', 'agent_run'] as const;
export type AppSearchType = typeof APP_SEARCH_TYPES[number];
export type AppSearchGroupKey = 'actions' | 'capsules' | 'memos' | 'documents_sources' | 'agent_runs';

export const AppSearchResultSchema = z.object({
  id: z.string(),
  type: z.enum(APP_SEARCH_TYPES),
  label: z.string(),
  description: z.string(),
  href: z.string(),
  score: z.number(),
  badges: z.array(z.string()),
  sourcePosture: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type AppSearchResult = z.infer<typeof AppSearchResultSchema>;

export const AppSearchResponseSchema = z.object({
  query: z.string(),
  groups: z.object({
    actions: z.array(AppSearchResultSchema),
    capsules: z.array(AppSearchResultSchema),
    memos: z.array(AppSearchResultSchema),
    documents_sources: z.array(AppSearchResultSchema),
    agent_runs: z.array(AppSearchResultSchema),
  }),
  diagnostics: z.object({
    degradedLanes: z.array(z.string()),
  }),
});

export type AppSearchResponse = z.infer<typeof AppSearchResponseSchema>;

export interface AppSearchInput {
  uid: string;
  isDemo: boolean;
  query: string;
  types?: AppSearchType[];
  limit?: number;
}

export interface NormalizedAppSearchQuery {
  q: string;
  types?: AppSearchType[];
  limit: number;
}

export interface AppSearchDeps {
  listCapsules?: typeof listCapsules;
  listMemos?: (uid: string, limit: number) => Promise<MemoSearchRecord[]>;
  listKnowledgeDocuments?: typeof listKnowledgeDocuments;
  listRecentAgentRuns?: typeof listRecentAgentRuns;
}

interface MemoSearchRecord {
  memoId: string;
  title: string;
  snippets: string[];
  sourceReceiptIds: string[];
  updatedAt: string;
}

const TYPE_PRIORITY: Record<AppSearchType, number> = {
  action: 500,
  capsule: 420,
  memo: 360,
  document: 330,
  source: 320,
  agent_run: 300,
};

export function normalizeAppSearchQuery(raw: Record<string, unknown>): NormalizedAppSearchQuery {
  const q = typeof raw.q === 'string' ? raw.q.trim() : '';
  if (q.length > 200) throw new Error('q must be 200 characters or fewer');
  const limitRaw = typeof raw.limit === 'string' || typeof raw.limit === 'number' ? Number(raw.limit) : 8;
  const limit = Math.max(1, Math.min(25, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 8));
  const typeInput = typeof raw.types === 'string' ? raw.types : '';
  const types = typeInput
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is AppSearchType => APP_SEARCH_TYPES.includes(item as AppSearchType));

  return {
    q,
    ...(types.length ? { types } : {}),
    limit,
  };
}

export async function searchApp(input: AppSearchInput, deps: AppSearchDeps = {}): Promise<AppSearchResponse> {
  const query = input.query.trim();
  const limit = Math.max(1, Math.min(25, Math.floor(input.limit ?? 8)));
  const requestedTypes = new Set<AppSearchType>(input.types ?? APP_SEARCH_TYPES);
  const degradedLanes: string[] = [];

  const groups: AppSearchResponse['groups'] = {
    actions: [],
    capsules: [],
    memos: [],
    documents_sources: [],
    agent_runs: [],
  };

  if (requestedTypes.has('action')) {
    groups.actions = sortAndLimit(
      COMMAND_SEARCH_ACTIONS
        .map((action) => normalizeActionResult(action, query))
        .filter((item) => query.length === 0 || item.score > TYPE_PRIORITY.action),
      limit,
    );
    if (query.length > 0 && groups.actions.length === 0) {
      groups.actions = sortAndLimit(
        COMMAND_SEARCH_ACTIONS
          .filter((action) => action.id === 'open-home' || action.id === 'find-gaps')
          .map((action) => normalizeActionResult(action, '')),
        2,
      );
    }
  }

  if (query.length === 0) {
    return AppSearchResponseSchema.parse({ query, groups, diagnostics: { degradedLanes } });
  }

  if (requestedTypes.has('capsule')) {
    try {
      const capsules = input.isDemo
        ? starterCapsuleResults(query)
        : (await (deps.listCapsules ?? listCapsules)(input.uid, {}, undefined))
          .map((capsule) => normalizeCapsuleSearchResult(capsule, query));
      groups.capsules = sortAndLimit(capsules.filter((item) => item.score > TYPE_PRIORITY.capsule), limit);
    } catch {
      degradedLanes.push('capsules');
    }
  }

  if (!input.isDemo && requestedTypes.has('memo')) {
    try {
      const memos = await (deps.listMemos ?? listMemoSearchRecords)(input.uid, Math.max(50, limit * 5));
      groups.memos = sortAndLimit(
        memos.map((memo) => normalizeMemoSearchResult(memo, query)).filter((item) => item.score > TYPE_PRIORITY.memo),
        limit,
      );
    } catch {
      degradedLanes.push('memos');
    }
  }

  if (!input.isDemo && (requestedTypes.has('document') || requestedTypes.has('source'))) {
    try {
      const docs = await (deps.listKnowledgeDocuments ?? listKnowledgeDocuments)(input.uid);
      groups.documents_sources = sortAndLimit(
        docs
          .map((doc) => normalizeKnowledgeDocumentSearchResult(doc, query))
          .filter((item) => item.score > TYPE_PRIORITY.document),
        limit,
      );
    } catch {
      degradedLanes.push('documents_sources');
    }
  }

  if (!input.isDemo && requestedTypes.has('agent_run')) {
    try {
      const runs = await (deps.listRecentAgentRuns ?? listRecentAgentRuns)(input.uid, Math.max(25, limit * 4));
      groups.agent_runs = sortAndLimit(
        runs.map((run) => normalizeAgentRunSearchResult(run, query)).filter((item) => item.score > TYPE_PRIORITY.agent_run),
        limit,
      );
    } catch {
      degradedLanes.push('agent_runs');
    }
  }

  return AppSearchResponseSchema.parse({ query, groups, diagnostics: { degradedLanes } });
}

export function normalizeCapsuleSearchResult(capsule: PraxisCapsule, query: string): AppSearchResult {
  const sourceCount = capsule.coreRefs?.sourceCoreIds?.length ?? 0;
  const documentCount = capsule.coreRefs?.documentCoreIds?.length ?? 0;
  const outputCount = capsule.coreRefs?.outputCoreIds?.length ?? 0;
  const tags = capsule.community?.tags ?? [];
  const trustScore = typeof capsule.trust?.score === 'number' ? capsule.trust.score : null;
  const health = trustScore === null ? 'health unknown' : `health ${trustScore}`;
  const stale = capsule.trust?.level === 'red' || capsule.trust?.level === 'grey' ? ['degraded'] : [];
  const haystack = [capsule.label, capsule.capsuleId, ...tags, capsule.starterSnapshot?.category].filter(Boolean).join(' ');
  const labelMatchesExactly = capsule.label?.trim().toLowerCase() === query.trim().toLowerCase();
  return {
    id: capsule.capsuleId,
    type: 'capsule',
    label: capsule.label || capsule.capsuleId,
    description: tags.length ? tags.slice(0, 3).join(' / ') : 'ContextCapsule workspace item',
    href: `/app/capsules?capsuleId=${encodeURIComponent(capsule.capsuleId)}`,
    score: scoreResult(query, haystack, 'capsule', capsule.updatedAt) + (labelMatchesExactly ? 300 : 0),
    badges: [
      health,
      `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}`,
      `${documentCount} ${documentCount === 1 ? 'document' : 'documents'}`,
      ...(outputCount ? ['output target'] : []),
      ...stale,
    ],
    sourcePosture: `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}`,
    updatedAt: capsule.updatedAt ?? null,
  };
}

export function normalizeKnowledgeDocumentSearchResult(doc: KnowledgeDocument, query: string): AppSearchResult {
  const haystack = [
    doc.title,
    doc.documentId,
    doc.categoryId,
    doc.policyDomain,
    doc.sourceType,
    doc.sourceNote,
    ...doc.tags,
    ...(doc.digest?.keyClaims ?? []),
  ].join(' ');
  const sourcePosture = doc.retrievalStatus === 'indexed'
    ? 'indexed'
    : doc.retrievalStatus === 'partial'
      ? 'partial index'
      : 'not indexed';
  return {
    id: doc.id,
    type: doc.sourceType === 'source' ? 'source' : 'document',
    label: doc.title || doc.documentId,
    description: doc.digest?.shortSummary || doc.sourceNote || doc.policyDomain || 'Repository document',
    href: `/app/capsules?lane=repository&documentId=${encodeURIComponent(doc.id)}`,
    score: scoreResult(query, haystack, 'document', doc.updatedAt),
    badges: [doc.fileType || 'document', sourcePosture, `${doc.chunkCount} chunks`],
    sourcePosture,
    updatedAt: doc.updatedAt,
  };
}

function normalizeMemoSearchResult(memo: MemoSearchRecord, query: string): AppSearchResult {
  const haystack = [memo.memoId, memo.title, ...memo.snippets, ...memo.sourceReceiptIds].join(' ');
  const sourceCount = memo.sourceReceiptIds.length;
  return {
    id: memo.memoId,
    type: 'memo',
    label: memo.title || memo.memoId,
    description: memo.snippets[0] ?? 'Saved PRAXIS memo',
    href: `/app?memoId=${encodeURIComponent(memo.memoId)}`,
    score: scoreResult(query, haystack, 'memo', memo.updatedAt),
    badges: [`${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}`],
    sourcePosture: `${sourceCount} source receipts`,
    updatedAt: memo.updatedAt,
  };
}

function normalizeAgentRunSearchResult(run: AgentRun, query: string): AppSearchResult {
  const output = toAgentRunOutput(run);
  const haystack = [
    output.runId,
    output.objective,
    output.status,
    output.policyAgentLabel,
    output.outputTargetLabel,
    output.sourcePosture,
  ].filter(Boolean).join(' ');
  return {
    id: output.runId,
    type: 'agent_run',
    label: output.policyAgentLabel ? `${output.policyAgentLabel}: ${output.objective}` : output.objective,
    description: output.outputTargetLabel ? `Output target: ${output.outputTargetLabel}` : 'Durable AgentRun ledger entry',
    href: `/app/capsules?capsuleId=${encodeURIComponent(output.capsuleId)}&runId=${encodeURIComponent(output.runId)}`,
    score: scoreResult(query, haystack, 'agent_run', output.updatedAt),
    badges: [output.status, output.outputTargetLabel ?? 'no output target', `${output.sourceCount ?? 0} sources`],
    sourcePosture: output.sourcePosture ?? null,
    updatedAt: output.updatedAt,
  };
}

function normalizeActionResult(action: typeof COMMAND_SEARCH_ACTIONS[number], query: string): AppSearchResult {
  return {
    id: action.id,
    type: 'action',
    label: action.label,
    description: action.description,
    href: action.href,
    score: scoreResult(query, [action.label, action.description, ...action.keywords].join(' '), 'action', null),
    badges: action.badges,
    sourcePosture: action.sourcePosture,
    updatedAt: null,
  };
}

function starterCapsuleResults(query: string): AppSearchResult[] {
  return CAPSULE_STARTER_DEFINITIONS.map((starter) => {
    const device = starter.deviceProfile;
    const haystack = [
      starter.starterId,
      starter.label,
      starter.summary,
      starter.detail,
      starter.category,
      starter.domain,
      starter.agentWorkflow.approvalNotes,
      ...starter.outputProductIds,
      ...starter.sourcePack.map((source) => `${source.label} ${source.publisher ?? ''} ${source.relevance}`),
      ...(device ? [
        device.deviceKind,
        device.humanReviewGate,
        device.agentInstructions,
        ...device.methodSteps,
        ...device.bestInputs,
        ...device.expectedOutputs,
        ...device.failureModes,
        ...device.sourceabilityRequirements,
      ] : []),
      ...starter.tags,
    ].join(' ');
    const labelMatchesExactly = starter.label.trim().toLowerCase() === query.trim().toLowerCase();
    return {
      id: starter.starterId,
      type: 'capsule' as const,
      label: starter.label,
      description: starter.summary,
      href: `/app/capsules?starter=${encodeURIComponent(starter.starterId)}`,
      score: scoreResult(query, haystack, 'capsule', null) + (labelMatchesExactly ? 300 : 0),
      badges: ['starter', device ? 'thinking device' : starter.category, `${starter.sourcePack.length} sources`],
      sourcePosture: starter.sourcePack.length ? `${starter.sourcePack.length} starter sources` : 'starter context',
      updatedAt: null,
    };
  }).filter((item) => item.score > TYPE_PRIORITY.capsule);
}

async function listMemoSearchRecords(uid: string, limit: number): Promise<MemoSearchRecord[]> {
  const snap = await getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('memos')
    .orderBy('ts', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((doc) => normalizeMemoRecord(doc.id, doc.data()));
}

function normalizeMemoRecord(id: string, data: FirebaseFirestore.DocumentData): MemoSearchRecord {
  const title = stringField(data.title) ?? stringField(data.memoTitle) ?? id;
  return {
    memoId: stringField(data.memoId) ?? id,
    title,
    snippets: [
      title,
      ...stringsFromUnknown(data.claimChecks).slice(0, 2),
      ...stringsFromUnknown(data.toolInvocations).slice(0, 2),
    ].filter(Boolean).slice(0, 4),
    sourceReceiptIds: sourceReceiptIdsFrom(data.sourceReceiptIds ?? data.sourceReceipts),
    updatedAt: stringField(data.updatedAt) ?? stringField(data.ts) ?? stringField(data.createdAt) ?? new Date(0).toISOString(),
  };
}

function scoreResult(query: string, haystack: string, type: AppSearchType, updatedAt: string | null): number {
  const normalizedQuery = query.toLowerCase();
  const normalizedHaystack = haystack.toLowerCase();
  let score = TYPE_PRIORITY[type];
  if (!normalizedQuery) return score;
  if (normalizedHaystack === normalizedQuery) score += 300;
  else if (normalizedHaystack.split(/\s*[/,|]\s*|\s+/).includes(normalizedQuery)) score += 190;
  else if (normalizedHaystack.includes(normalizedQuery)) score += 90;
  else score -= 1000;
  if (updatedAt) {
    const ageMs = Date.now() - Date.parse(updatedAt);
    if (Number.isFinite(ageMs) && ageMs < 1000 * 60 * 60 * 24 * 14) score += 15;
  }
  return score;
}

function sortAndLimit(results: AppSearchResult[], limit: number): AppSearchResult[] {
  return [...results]
    .sort((a, b) => b.score - a.score || (Date.parse(b.updatedAt ?? '0') - Date.parse(a.updatedAt ?? '0')))
    .slice(0, limit)
    .map((item) => AppSearchResultSchema.parse(item));
}

function sourceReceiptIdsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return stringField(record.id) ?? stringField(record.receiptId) ?? stringField(record.sourceReceiptId);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

function stringsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      return stringField(record.summary) ?? stringField(record.title) ?? stringField(record.text) ?? '';
    }
    return '';
  }).filter(Boolean);
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

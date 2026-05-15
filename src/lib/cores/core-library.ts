import type { CoreSpecimenKind } from '@/components/cores/specimen-card';
import { CONSOLIDATED_TOOLS } from '@/lib/constants/consolidated-tools';
import { listExampleCases } from '@/lib/cases/registry';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { listCapsules, type PraxisCapsule } from '@/lib/context/capsule-service';
import type { ContextHealth } from '@/types/context-engine';
import type { Firestore } from 'firebase-admin/firestore';
import type { SourceImportReceipt } from '@/lib/workbench/library-state';

export interface LibraryCore {
  id: string;
  kind: CoreSpecimenKind;
  name: string;
  lineage: string;
  completeness: number;
  projectedReadinessDelta: number;
  essence?: string;
  tags: string[];
  ownerScope: 'platform' | 'user' | 'team' | 'situation' | 'artifact';
  template: boolean;
  updatedAt: string;
  source?: 'template' | 'situation' | 'capsule' | 'document' | 'source' | 'output' | 'memory';
  status?: 'ready' | 'thin' | 'queued' | 'failed' | 'needs_review';
  boundSituationIds?: string[];
  documentId?: string;
  sourceReceiptId?: string;
  capsuleIds?: string[];
  ingestionRunId?: string;
  health?: ContextHealth | LibraryCoreHealth;
  provenance?: LibraryCoreProvenance;
  chunkCount?: number;
  embeddingStatus?: 'embedded' | 'queued' | 'unavailable' | 'failed';
  extractionStatus?: string;
  graphDeltaReviewCount?: number;
  receipt?: SourceImportReceipt;
}

export interface CoreLibraryFilters {
  kind?: CoreSpecimenKind | 'all';
  q?: string;
  limit?: number;
  ownerScope?: LibraryCore['ownerScope'] | 'all';
  status?: NonNullable<LibraryCore['status']> | 'all';
  attached?: 'all' | 'attached' | 'unattached';
  situationId?: string;
  provenance?: string;
}

export interface LibraryCoreHealth {
  score: number;
  gaps: string[];
}

export interface LibraryCoreProvenance {
  kind: 'platform-template' | 'firestore' | 'upload' | 'capsule' | 'working-memory';
  refPath?: string;
  source?: string;
}

export interface CoreLibraryDeps {
  db?: Firestore;
}

const UPDATED_AT = '2026-05-14T00:00:00.000Z';

const TEMPLATE_CORES: LibraryCore[] = [
  {
    id: 'obj-decision-options',
    kind: 'objective',
    name: 'Decision options for principals',
    lineage: 'template',
    completeness: 94,
    projectedReadinessDelta: 12,
    essence: 'Frames tradeoffs, confidence, decision asks, and second-order risks.',
    tags: ['decision', 'memo', 'principals'],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'obj-red-team',
    kind: 'objective',
    name: 'Red-team dominant assessment',
    lineage: 'template',
    completeness: 88,
    projectedReadinessDelta: 10,
    essence: 'Forces assumptions, contrary evidence, indicators that would change the call.',
    tags: ['red-team', 'assumptions', 'risk'],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'obj-source-repair',
    kind: 'objective',
    name: 'Source gap repair',
    lineage: 'template',
    completeness: 86,
    projectedReadinessDelta: 9,
    essence: 'Turns weak claims into collection tasks and source receipts.',
    tags: ['sources', 'evidence', 'gaps'],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'prd-options-memo',
    kind: 'product',
    name: 'Cited options memo',
    lineage: 'template',
    completeness: 96,
    projectedReadinessDelta: 10,
    essence: 'BLUF, options, risks, evidence ledger, decision asks.',
    tags: ['memo', 'policy', 'export'],
    ownerScope: 'artifact',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'prd-negotiation-brief',
    kind: 'product',
    name: 'Negotiation brief',
    lineage: 'template',
    completeness: 91,
    projectedReadinessDelta: 8,
    essence: 'ZOPA, BATNA, red lines, leverage, confidence-building sequence.',
    tags: ['diplomacy', 'negotiation', 'talking-points'],
    ownerScope: 'artifact',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'prd-corporate-risk-note',
    kind: 'product',
    name: 'Corporate public-affairs risk note',
    lineage: 'template',
    completeness: 89,
    projectedReadinessDelta: 8,
    essence: 'Board-ready regulatory, stakeholder, and reputation posture.',
    tags: ['company', 'board', 'regulatory'],
    ownerScope: 'artifact',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'tim-72h-ops',
    kind: 'time',
    name: '72-hour watch window',
    lineage: 'preset',
    completeness: 100,
    projectedReadinessDelta: 6,
    essence: 'Tight monitoring posture for live developments and response drafting.',
    tags: ['freshness', 'ops', 'watch'],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'tim-quarterly-policy',
    kind: 'time',
    name: 'Quarterly policy horizon',
    lineage: 'preset',
    completeness: 100,
    projectedReadinessDelta: 5,
    essence: 'Good for legislative, regulatory, and strategy cycles.',
    tags: ['policy', 'regulatory', 'planning'],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'mem-working-assumptions',
    kind: 'memory',
    name: 'Pinned working assumptions',
    lineage: 'live',
    completeness: 82,
    projectedReadinessDelta: 5,
    essence: 'Remember recurring caveats, adopted definitions, and analyst preferences.',
    tags: ['memory', 'assumptions', 'private'],
    ownerScope: 'user',
    template: true,
    updatedAt: UPDATED_AT,
  },
];

export function listCoreLibrary(filters: CoreLibraryFilters = {}): LibraryCore[] {
  return filterCoreLibrary(templateCoreLibrary(), filters);
}

export async function composeCoreLibrary(uid: string, filters: CoreLibraryFilters = {}, deps: CoreLibraryDeps = {}): Promise<LibraryCore[]> {
  const db = deps.db ?? getAdminDbOrThrow();
  const [situations, capsules, memory] = await Promise.all([
    readSituationCores(uid, db),
    listCapsules(uid, { includeArchived: true }, { db }),
    readMemoryCores(uid, db),
  ]);
  const [documents, sources, graphDeltas, outputs] = await Promise.all([
    readDocumentCores(uid, db, situations.map((item) => item.id), capsules),
    readSourceCores(uid, db, situations.map((item) => item.id), capsules),
    readGraphDeltaCounts(uid, db, situations.map((item) => item.id)),
    readOutputCores(uid, db),
  ]);
  const enrichedDocuments = documents.map((core) => ({
    ...core,
    graphDeltaReviewCount: graphDeltas.get(core.documentId ?? core.id) ?? core.graphDeltaReviewCount ?? 0,
    status: graphDeltas.get(core.documentId ?? core.id) ? 'needs_review' as const : core.status,
  }));
  return filterCoreLibrary([
    ...templateCoreLibrary(),
    ...situations,
    ...capsules.map(capsuleToCore),
    ...enrichedDocuments,
    ...sources,
    ...outputs,
    ...memory,
  ], filters);
}

function templateCoreLibrary(): LibraryCore[] {
  return [
    ...userCores(),
    ...situationCores(),
    ...toolCores(),
    ...sourceCores(),
    ...graphCores(),
    ...outputCores(),
    ...TEMPLATE_CORES,
  ];
}

function filterCoreLibrary(cores: LibraryCore[], filters: CoreLibraryFilters): LibraryCore[] {
  const seen = new Map<string, LibraryCore>();
  for (const core of cores) {
    const key = `${core.kind}:${core.id}`;
    if (!seen.has(key) || !seen.get(key)?.template) seen.set(key, core);
  }
  const all = Array.from(seen.values());
  const q = filters.q?.trim().toLowerCase();
  const kind = filters.kind && filters.kind !== 'all' ? filters.kind : null;
  return all
    .filter((core) => !kind || core.kind === kind)
    .filter((core) => !filters.ownerScope || filters.ownerScope === 'all' || core.ownerScope === filters.ownerScope)
    .filter((core) => !filters.status || filters.status === 'all' || core.status === filters.status)
    .filter((core) => {
      if (!filters.situationId) return true;
      return core.id === filters.situationId || core.boundSituationIds?.includes(filters.situationId);
    })
    .filter((core) => {
      if (!filters.provenance) return true;
      return core.provenance?.kind === filters.provenance || core.provenance?.source === filters.provenance;
    })
    .filter((core) => {
      if (!filters.attached || filters.attached === 'all') return true;
      const attached = Boolean(core.capsuleIds?.length || core.boundSituationIds?.length);
      return filters.attached === 'attached' ? attached : !attached;
    })
    .filter((core) => {
      if (!q) return true;
      return [
        core.name,
        core.essence,
        core.kind,
        core.ownerScope,
        core.status,
        core.provenance?.kind,
        core.provenance?.source,
        ...(core.boundSituationIds ?? []),
        ...(core.capsuleIds ?? []),
        ...core.tags,
      ].join(' ').toLowerCase().includes(q);
    })
    .sort((a, b) => b.projectedReadinessDelta - a.projectedReadinessDelta || b.completeness - a.completeness)
    .slice(0, Math.max(1, Math.min(filters.limit ?? 80, 160)));
}

function userCores(): LibraryCore[] {
  return PUBLIC_USER_MODELS.map((model) => ({
    id: model.modelId,
    kind: 'user',
    name: model.identity,
    lineage: `v${model.version}`,
    completeness: model.workOntologyId ? 92 : 76,
    projectedReadinessDelta: model.identity.toLowerCase().includes('corporate') ? 13 : 11,
    essence: `${model.role} · ${model.communicationStyle}`,
    tags: ['user', 'persona', model.workOntologyId ?? 'analyst'],
    ownerScope: 'user',
    template: model.visibility === 'public-seed',
    updatedAt: UPDATED_AT,
  }));
}

function situationCores(): LibraryCore[] {
  return listExampleCases().map((example) => ({
    id: example.id,
    kind: 'situation',
    name: example.manifest.name,
    lineage: 'demo',
    completeness: 88,
    projectedReadinessDelta: 18,
    essence: `${example.manifest.region} · ${example.manifest.summary}`,
    tags: ['situation', 'demo', example.manifest.region, ...example.manifest.tags],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  }));
}

function toolCores(): LibraryCore[] {
  return CONSOLIDATED_TOOLS.map((tool) => ({
    id: tool.id,
    kind: 'tool',
    name: tool.label,
    lineage: tool.costPosture,
    completeness: tool.requires.includes('ai') ? 88 : 94,
    projectedReadinessDelta: tool.id === 'ask-praxis' || tool.id === 'briefing-studio' ? 16 : 9,
    essence: tool.primaryOutput,
    tags: ['tool', tool.costPosture, ...tool.requires],
    ownerScope: 'platform',
    template: true,
    updatedAt: UPDATED_AT,
  }));
}

function sourceCores(): LibraryCore[] {
  return [
    core('src-gdelt-grounded-search', 'source', 'GDELT + grounded Google Search', 'live', 90, 12, 'Live media/event triangulation with grounded search fallback.', ['source', 'gdelt', 'google']),
    core('src-reliefweb-hdx', 'source', 'ReliefWeb + HDX humanitarian receipts', 'live', 87, 10, 'Humanitarian operations, needs, access, and cluster evidence.', ['source', 'humanitarian', 'hdx']),
    core('src-ucdp-acled-events', 'source', 'UCDP / ACLED event posture', 'live', 84, 10, 'Conflict event baselines and escalation pattern support.', ['source', 'conflict', 'events']),
    core('doc-uploaded-corpus', 'document', 'Uploaded document corpus', 'workspace', 72, 9, 'User-owned files chunked, embedded, and attached to active capsules.', ['document', 'upload', 'retrieval']),
  ];
}

function graphCores(): LibraryCore[] {
  return [
    core('grf-actor-claim-lattice', 'graph', 'Actor-claim lattice', 'template', 78, 10, 'Actors, claims, commitments, edges, and provenance gaps.', ['graph', 'claims', 'actors']),
    core('grf-company-stakeholder-map', 'graph', 'Company stakeholder map', 'template', 74, 8, 'Regulators, investors, NGOs, employees, and affected communities.', ['graph', 'company', 'stakeholders']),
  ];
}

function outputCores(): LibraryCore[] {
  return [
    core('out-policy-memo', 'output', 'Policy memo output', 'template', 96, 8, 'Cited memo structure with assumptions and evidence gaps.', ['output', 'memo']),
    core('out-talking-points', 'output', 'Talking points output', 'template', 92, 6, 'Principal-ready speaker notes with caveats.', ['output', 'talking-points']),
  ];
}

function core(
  id: string,
  kind: CoreSpecimenKind,
  name: string,
  lineage: string,
  completeness: number,
  projectedReadinessDelta: number,
  essence: string,
  tags: string[],
): LibraryCore {
  return { id, kind, name, lineage, completeness, projectedReadinessDelta, essence, tags, ownerScope: 'situation', template: true, updatedAt: UPDATED_AT };
}

async function readSituationCores(uid: string, db: Firestore): Promise<LibraryCore[]> {
  const snap = await db.collection('users').doc(uid).collection('situations').limit(100).get();
  return snap.docs.map((doc) => {
    const data = asRecord(doc.data());
    const title = stringField(data, 'name') ?? stringField(data, 'title') ?? stringField(data, 'caseName') ?? doc.id;
    const summary = stringField(data, 'summary') ?? stringField(data, 'description') ?? 'User-owned Situation Core.';
    const updatedAt = stringField(data, 'updatedAt') ?? stringField(data, 'createdAt') ?? UPDATED_AT;
    const documentCount = numberField(data, 'documentCount') ?? 0;
    return {
      id: doc.id,
      kind: 'situation',
      name: title,
      lineage: 'user-workspace',
      completeness: documentCount > 0 ? 82 : 64,
      projectedReadinessDelta: documentCount > 0 ? 20 : 14,
      essence: summary,
      tags: ['situation', 'user-owned', documentCount > 0 ? 'documented' : 'thin'],
      ownerScope: 'situation',
      template: false,
      updatedAt,
      source: 'situation',
      status: documentCount > 0 ? 'ready' : 'thin',
      boundSituationIds: [doc.id],
      provenance: { kind: 'firestore', refPath: `users/${uid}/situations/${doc.id}` },
    } satisfies LibraryCore;
  });
}

async function readDocumentCores(uid: string, db: Firestore, situationIds: string[], capsules: PraxisCapsule[]): Promise<LibraryCore[]> {
  const out: LibraryCore[] = [];
  for (const situationId of situationIds) {
    const snap = await db.collection('users').doc(uid).collection('situations').doc(situationId).collection('documents').limit(100).get();
    for (const doc of snap.docs) {
      const data = asRecord(doc.data());
      const title = stringField(data, 'title') ?? doc.id;
      const chunkCount = numberField(data, 'chunkCount') ?? 0;
      const statusRaw = stringField(data, 'status') ?? 'uploaded';
      const ingestionRunId = stringField(data, 'ingestionRunId') ?? stringField(asRecord(data.ingestion), 'runId');
      const updatedAt = stringField(data, 'uploadedAt') ?? stringField(data, 'updatedAt') ?? UPDATED_AT;
      const capsuleIds = capsules
        .filter((capsule) => capsule.coreRefs.documentCoreIds.includes(doc.id))
        .map((capsule) => capsule.capsuleId);
      out.push({
        id: doc.id,
        kind: 'document',
        name: title,
        lineage: ingestionRunId ? `ingestion:${ingestionRunId}` : 'uploaded',
        completeness: statusRaw === 'error' ? 30 : chunkCount > 0 ? 88 : 58,
        projectedReadinessDelta: chunkCount > 0 ? 18 : 8,
        essence: chunkCount > 0 ? `${chunkCount} chunk(s) indexed for retrieval.` : 'Uploaded document awaiting retrievable chunks.',
        tags: ['document', 'uploaded', statusRaw, situationId],
        ownerScope: 'artifact',
        template: false,
        updatedAt,
        source: 'document',
        status: coreStatusFromDocument(statusRaw, chunkCount),
        boundSituationIds: [situationId],
        documentId: doc.id,
        capsuleIds,
        ingestionRunId,
        chunkCount,
        embeddingStatus: chunkCount > 0 ? 'embedded' : statusRaw === 'error' ? 'failed' : 'queued',
        extractionStatus: statusRaw,
        health: {
          score: statusRaw === 'error' ? 25 : chunkCount > 0 ? 88 : 54,
          gaps: chunkCount > 0 ? [] : ['No retrievable chunks yet.'],
        },
        provenance: { kind: 'upload', refPath: `users/${uid}/situations/${situationId}/documents/${doc.id}` },
      });
    }
  }
  return out;
}

async function readSourceCores(uid: string, db: Firestore, situationIds: string[], capsules: PraxisCapsule[]): Promise<LibraryCore[]> {
  const out: LibraryCore[] = [];
  for (const situationId of situationIds) {
    const sourceSnap = await db.collection('users').doc(uid).collection('situations').doc(situationId).collection('sources').limit(100).get();
    for (const doc of sourceSnap.docs) {
      const data = asRecord(doc.data());
      const name = stringField(data, 'name') ?? stringField(data, 'title') ?? doc.id;
      const sourceCoreId = stringField(data, 'sourceCoreId') ?? doc.id;
      const extracted = data.extracted === true;
      out.push(sourceCore({
        uid,
        situationId,
        id: sourceCoreId,
        name,
        sourceType: stringField(data, 'sourceType') ?? 'document',
        updatedAt: stringField(data, 'uploadedAt') ?? UPDATED_AT,
        documentId: stringField(data, 'documentId') ?? undefined,
        sourceReceiptId: stringField(data, 'sourceReceiptId') ?? doc.id,
        capsuleIds: capsules.filter((capsule) => capsule.coreRefs.sourceCoreIds.includes(sourceCoreId)).map((capsule) => capsule.capsuleId),
        status: extracted ? 'ready' : 'queued',
        receipt: parseSourceImportReceipt(data.receipt),
      }));
    }
  }
  return out;
}

async function readGraphDeltaCounts(uid: string, db: Firestore, situationIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const situationId of situationIds) {
    const snap = await db.collection('users').doc(uid).collection('situations').doc(situationId).collection('graph-delta-review').limit(100).get();
    for (const doc of snap.docs) {
      const data = asRecord(doc.data());
      const documentId = stringField(data, 'documentId');
      if (!documentId) continue;
      counts.set(documentId, (counts.get(documentId) ?? 0) + 1);
    }
  }
  return counts;
}

async function readOutputCores(uid: string, db: Firestore): Promise<LibraryCore[]> {
  const collections = ['memos', 'drafts', 'exports'];
  const out: LibraryCore[] = [];
  for (const collection of collections) {
    const snap = await db.collection('users').doc(uid).collection(collection).limit(50).get().catch(() => null);
    for (const doc of snap?.docs ?? []) {
      const data = asRecord(doc.data());
      out.push({
        id: doc.id,
        kind: 'output',
        name: stringField(data, 'title') ?? stringField(data, 'name') ?? `${collection.slice(0, -1)} ${doc.id}`,
        lineage: collection,
        completeness: 76,
        projectedReadinessDelta: 7,
        essence: stringField(data, 'summary') ?? 'Saved output artifact from the workspace.',
        tags: ['output', collection],
        ownerScope: 'artifact',
        template: false,
        updatedAt: stringField(data, 'updatedAt') ?? stringField(data, 'createdAt') ?? UPDATED_AT,
        source: 'output',
        status: 'ready',
        provenance: { kind: 'firestore', refPath: `users/${uid}/${collection}/${doc.id}` },
      });
    }
  }
  return out;
}

async function readMemoryCores(uid: string, db: Firestore): Promise<LibraryCore[]> {
  const snap = await db.collection('users').doc(uid).collection('working-memory').limit(100).get().catch(() => null);
  const visible = (snap?.docs ?? [])
    .map((doc) => ({ id: doc.id, data: asRecord(doc.data()) }))
    .filter((item) => !item.data.deletedAt);
  if (visible.length === 0) return [];
  return [{
    id: 'mem-working-visible',
    kind: 'memory',
    name: 'Visible working memory',
    lineage: `${visible.length} fact(s)`,
    completeness: Math.min(92, 55 + visible.length * 8),
    projectedReadinessDelta: 8,
    essence: 'User-owned working memory available for future capsules.',
    tags: ['memory', 'working-memory', 'deletable'],
    ownerScope: 'user',
    template: false,
    updatedAt: visible.map((item) => stringField(item.data, 'updatedAt') ?? UPDATED_AT).sort().at(-1) ?? UPDATED_AT,
    source: 'memory',
    status: 'ready',
    provenance: { kind: 'working-memory', refPath: `users/${uid}/working-memory` },
  }];
}

function capsuleToCore(capsule: PraxisCapsule): LibraryCore {
  return {
    id: capsule.capsuleId,
    kind: 'product',
    name: capsule.label,
    lineage: `v${capsule.version}`,
    completeness: capsule.health.score,
    projectedReadinessDelta: capsule.activeForSituationIds.length ? 14 : 7,
    essence: `${capsule.scope} capsule with ${capsule.coreRefs.sourceCoreIds.length} source and ${capsule.coreRefs.documentCoreIds.length} document core(s).`,
    tags: ['capsule', capsule.scope, capsule.archivedAt ? 'archived' : 'active'],
    ownerScope: capsule.scope === 'team' ? 'team' : capsule.scope,
    template: false,
    updatedAt: capsule.updatedAt,
    source: 'capsule',
    status: capsule.archivedAt ? 'thin' : capsule.health.score >= 70 ? 'ready' : 'thin',
    boundSituationIds: capsule.activeForSituationIds,
    capsuleIds: [capsule.capsuleId],
    health: capsule.health,
    provenance: { kind: 'capsule', refPath: `users/${capsule.ownerUid}/capsules/${capsule.capsuleId}` },
  };
}

function sourceCore(input: {
  uid: string;
  situationId: string;
  id: string;
  name: string;
  sourceType: string;
  updatedAt: string;
  documentId?: string;
  sourceReceiptId?: string;
  capsuleIds: string[];
  status: NonNullable<LibraryCore['status']>;
}): LibraryCore {
  return {
    id: input.id,
    kind: 'source',
    name: input.name,
    lineage: input.sourceType,
    completeness: input.status === 'ready' ? 84 : 55,
    projectedReadinessDelta: input.status === 'ready' ? 13 : 6,
    essence: input.status === 'ready' ? 'Source receipt linked to a user-owned situation.' : 'Source receipt is queued or awaiting extraction.',
    tags: ['source', input.sourceType, input.situationId],
    ownerScope: 'artifact',
    template: false,
    updatedAt: input.updatedAt,
    source: 'source',
    status: input.status,
    boundSituationIds: [input.situationId],
    documentId: input.documentId,
    sourceReceiptId: input.sourceReceiptId,
    capsuleIds: input.capsuleIds,
    provenance: { kind: 'firestore', refPath: `users/${input.uid}/situations/${input.situationId}/sources/${input.sourceReceiptId ?? input.id}` },
  };
}

function coreStatusFromDocument(status: string, chunkCount: number): NonNullable<LibraryCore['status']> {
  if (status === 'error') return 'failed';
  if (chunkCount > 0) return 'ready';
  if (status === 'processing' || status === 'uploaded') return 'queued';
  return 'thin';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringField(value: Record<string, unknown>, key: string): string | undefined {
  const item = value[key];
  return typeof item === 'string' && item.trim() ? item.trim() : undefined;
}

function numberField(value: Record<string, unknown>, key: string): number | undefined {
  const item = value[key];
  return typeof item === 'number' && Number.isFinite(item) ? item : undefined;
}

import {
  getCapability,
  type CapabilityDefinition,
  type CapabilityId,
} from '@/lib/ai/capability-registry';
import {
  resolveInjectableContext,
  type InjectableContext,
  type InjectableContextInput,
} from '@/lib/context/context-injection';
import type { CapsuleServiceDeps } from '@/lib/context/capsule-service';
import type { CapsuleRepositoryMetadata } from '@/lib/product/context-capsules';

export type MemoryType = 'semantic' | 'episodic' | 'procedural';

export interface KernelMemoryItem {
  id: string;
  text: string;
  type: MemoryType;
  capsuleId?: string;
  deletedAt?: string | null;
  updatedAt?: string;
}

export interface TurnCapsule {
  traceId: string;
  capsuleId: string;
  capsuleVersion: number;
  stack: {
    stackId: string;
    label: string;
    scope: string;
    parentCapsuleId: string | null;
    forkedFromVersion: number | null;
    activeForSituationIds: string[];
    lockedCoreKinds: string[];
  };
  userCore: string | null;
  situationCore: string | null;
  sourceDocumentCore: string[];
  graphCore: string | null;
  memoryCore: string | null;
  outputCore: string[];
  retrievedEvidence: Array<{ id: string; title: string; citation?: string; excerpt?: string }>;
  graphProposalCounts: { proposed: number; accepted: number; rejected: number };
  activeGaps: string[];
  recentToolOutputs: string[];
  tokenBudgetReport: { maxInputTokens: number; reservedOutputTokens: number; estimatedContextChars: number };
  injectableContext: InjectableContext;
  memory: Record<MemoryType, KernelMemoryItem[]>;
  retrievalPlan: CapsuleRetrievalPlan;
  enrichment?: {
    receipt: {
      firestore: 'ready';
      canonicalStatus: 'firestore-canonical';
      cognee: 'enabled' | 'disabled' | 'degraded';
      graphiti: 'deferred';
      memoryItemIds: string[];
      memoryHitCount: number;
      writebackProposalIds: string[];
      warnings: string[];
    };
    memoryHitCount: number;
  };
}

export type CapsuleRetrievalLayerId =
  | 'capsule-core-refs'
  | 'associated-capsules'
  | 'repository-documents'
  | 'source-receipts'
  | 'graph-core'
  | 'time-core'
  | 'memory-core'
  | 'recent-runs'
  | 'output-history';

export interface CapsuleRetrievalLayer {
  id: CapsuleRetrievalLayerId;
  label: string;
  priority: number;
  refIds: string[];
  status: 'ready' | 'missing';
}

export interface CapsuleRetrievalPlan {
  capsuleId: string;
  capsuleVersion: number;
  repository: {
    documentIds: string[];
    sourceReceiptIds: string[];
    storageObjectRefs: string[];
    chunkCount: number;
    embeddingStatus: CapsuleRepositoryMetadata['embeddingStatus'];
    retrievalBackend: CapsuleRepositoryMetadata['retrievalBackend'];
    freshness: CapsuleRepositoryMetadata['freshness'];
    lastIngestionRunId: string | null;
  };
  layers: CapsuleRetrievalLayer[];
  promptBlock: string;
}

export interface EffectiveCapsuleSlotTrace {
  slot: 'user' | 'situation' | 'sourceDocument' | 'graph' | 'memory' | 'output' | 'tool' | 'objective';
  status: 'ready' | 'missing';
  ids: string[];
  role: 'primary' | 'reference' | 'comparison';
}

export interface EffectiveCapsule {
  capsuleId: string;
  capsuleVersion: number;
  objective: string | null;
  primaryCapsuleId: string;
  referenceCapsuleIds: string[];
  comparisonCapsuleIds: string[];
  slotTrace: EffectiveCapsuleSlotTrace[];
  selectedFiles: string[];
  selectedConnectors: string[];
  selectedTools: string[];
  readiness: {
    score: number;
    warnings: string[];
    missingSlots: EffectiveCapsuleSlotTrace['slot'][];
  };
  governance: {
    readContractRequired: true;
    activeOntologyStackId: string;
    activeReadContractId: string;
    latestGateState: string;
    advisoryMemoryHitCount: number;
    graphProposalCount: number;
    reviewCardCount: number;
  };
  contentHash: string;
  promptBlock: string;
}

export interface TurnCapsuleInput extends InjectableContextInput {
  query?: string;
  traceId?: string;
  retrievedEvidence?: TurnCapsule['retrievedEvidence'];
  graphProposalCounts?: Partial<TurnCapsule['graphProposalCounts']>;
  activeGaps?: string[];
  recentToolOutputs?: string[];
  memoryItems?: KernelMemoryItem[];
}

export interface RunCapabilityInput {
  capabilityId: CapabilityId;
  capsule: TurnCapsule;
  payload?: Record<string, unknown>;
  actionLabel?: string;
}

export interface CapabilityRunPlan {
  capability: CapabilityDefinition;
  routeFamily: CapabilityDefinition['routeFamily'];
  canonicalPath: CapabilityDefinition['canonicalPath'];
  requiredCores: CapabilityDefinition['requiredCores'];
  persistenceTarget: CapabilityDefinition['persistenceTarget'];
  payload: Record<string, unknown>;
  traceId: string;
  receipt: SuggestedActionReceipt;
}

export interface SemanticNextAction {
  id: 'find_sources' | 'extract_commitments' | 'map_stakeholders' | 'draft_memo' | 'review_weak_claim' | 'build_scenario';
  label: 'Find sources' | 'Extract commitments' | 'Map stakeholders' | 'Draft memo' | 'Review weak claim' | 'Build scenario';
  detail: string;
  href: string;
  prompt: string;
  priority: number;
  capabilityId: CapabilityId;
}

export interface SuggestedActionReceipt {
  actionId: string;
  capabilityId: CapabilityId;
  capsuleId: string;
  capsuleVersion: number;
  routeFamily: CapabilityDefinition['routeFamily'];
  traceId: string;
  status: 'planned' | 'running' | 'succeeded' | 'failed';
  actionLabel: string;
  createdAt: string;
}

const DEFAULT_MAX_INPUT_TOKENS = 24_000;
const DEFAULT_RESERVED_OUTPUT_TOKENS = 4_000;

export async function buildTurnCapsule(
  input: TurnCapsuleInput,
  deps?: CapsuleServiceDeps,
): Promise<TurnCapsule> {
  const injectableContext = await resolveInjectableContext(input, deps);
  const refs = injectableContext.capsule.coreRefs;
  const memory = groupVisibleMemory(input.memoryItems ?? [], injectableContext.capsule.capsuleId);
  const estimatedContextChars = [
    injectableContext.promptBlock,
    input.query ?? '',
    ...Object.values(memory).flat().map((item) => item.text),
    ...(input.activeGaps ?? []),
    ...(input.recentToolOutputs ?? []),
  ].join('\n').length;

  const baseCapsule = {
    traceId: input.traceId ?? `turn_${Date.now().toString(36)}`,
    capsuleId: injectableContext.capsule.capsuleId,
    capsuleVersion: injectableContext.capsule.version,
    stack: {
      stackId: injectableContext.capsule.capsuleId,
      label: injectableContext.capsule.label,
      scope: injectableContext.capsule.scope,
      parentCapsuleId: injectableContext.capsule.parentCapsuleId,
      forkedFromVersion: injectableContext.capsule.forkedFromVersion,
      activeForSituationIds: injectableContext.capsule.activeForSituationIds,
      lockedCoreKinds: injectableContext.capsule.lockedCoreKinds,
    },
    userCore: refs.userCoreId ?? null,
    situationCore: refs.situationCoreId ?? null,
    sourceDocumentCore: [...refs.sourceCoreIds, ...refs.documentCoreIds],
    graphCore: refs.graphCoreId ?? null,
    memoryCore: refs.memoryCoreId ?? null,
    outputCore: refs.outputCoreIds,
    retrievedEvidence: input.retrievedEvidence ?? [],
    graphProposalCounts: {
      proposed: input.graphProposalCounts?.proposed ?? 0,
      accepted: input.graphProposalCounts?.accepted ?? 0,
      rejected: input.graphProposalCounts?.rejected ?? 0,
    },
    activeGaps: input.activeGaps ?? injectableContext.capsule.health.warnings,
    recentToolOutputs: input.recentToolOutputs ?? [],
    tokenBudgetReport: {
      maxInputTokens: DEFAULT_MAX_INPUT_TOKENS,
      reservedOutputTokens: DEFAULT_RESERVED_OUTPUT_TOKENS,
      estimatedContextChars,
    },
    injectableContext,
    memory,
  } satisfies Omit<TurnCapsule, 'retrievalPlan'>;

  return {
    ...baseCapsule,
    retrievalPlan: buildCapsuleRetrievalPlan(baseCapsule),
  };
}

export function buildCapsuleRetrievalPlan(
  capsule: Omit<TurnCapsule, 'retrievalPlan'>,
  repository?: Partial<CapsuleRepositoryMetadata> | null,
): CapsuleRetrievalPlan {
  const refs = capsule.injectableContext.capsule.coreRefs;
  const repositoryDocumentIds = uniqueStrings(repository?.documentIds ?? refs.documentCoreIds);
  const sourceReceiptIds = uniqueStrings(repository?.sourceReceiptIds ?? refs.sourceCoreIds);
  const storageObjectRefs = uniqueStrings(repository?.storageObjectRefs ?? []);
  const chunkCount = Math.max(0, Math.floor(repository?.chunkCount ?? 0));
  const layers: CapsuleRetrievalLayer[] = [
    retrievalLayer('capsule-core-refs', 'Capsule core refs', 1, [
      refs.userCoreId,
      refs.situationCoreId,
      refs.pathCoreId,
      ...refs.sourceCoreIds,
      ...refs.documentCoreIds,
      refs.graphCoreId,
      refs.timeCoreId,
      refs.memoryCoreId,
      ...refs.outputCoreIds,
    ]),
    retrievalLayer('associated-capsules', 'Reference capsules', 2, referenceCapsuleRefs(capsule.injectableContext.associatedCapsules)),
    retrievalLayer('repository-documents', 'Attached repository documents', 3, repositoryDocumentIds),
    retrievalLayer('source-receipts', 'Attached source receipts', 4, sourceReceiptIds),
    retrievalLayer('graph-core', 'Actor and graph core', 5, refs.graphCoreId ? [refs.graphCoreId] : []),
    retrievalLayer('time-core', 'Time and watchlist core', 6, refs.timeCoreId ? [refs.timeCoreId] : []),
    retrievalLayer('memory-core', 'Memory and handover core', 7, [
      refs.memoryCoreId,
      ...Object.values(capsule.memory).flat().map((item) => item.id),
    ]),
    retrievalLayer('recent-runs', 'Recent run receipts', 8, capsule.recentToolOutputs),
    retrievalLayer('output-history', 'Output capsule history', 9, refs.outputCoreIds),
  ];
  const promptLines = [
    '## Active Capsule Retrieval Plan',
    `Capsule: ${capsule.capsuleId} v${capsule.capsuleVersion}`,
    `Repository: ${repositoryDocumentIds.length} document ref(s), ${sourceReceiptIds.length} source receipt ref(s), ${chunkCount} chunk(s), ${repository?.retrievalBackend ?? 'local-hybrid'} backend, freshness ${repository?.freshness ?? inferRepositoryFreshness(repositoryDocumentIds, sourceReceiptIds)}.`,
    'Read order:',
    ...layers.map((layer) => `- ${layer.priority}. ${layer.label}: ${layer.status}${layer.refIds.length ? ` (${layer.refIds.slice(0, 8).join(', ')})` : ''}`),
    'Answer from capsule core refs first, then associated reference capsule summaries, then repository documents/chunks and source receipts, then graph/time/memory/recent run/output history. Treat missing layers as explicit evidence gaps.',
  ];

  return {
    capsuleId: capsule.capsuleId,
    capsuleVersion: capsule.capsuleVersion,
    repository: {
      documentIds: repositoryDocumentIds,
      sourceReceiptIds,
      storageObjectRefs,
      chunkCount,
      embeddingStatus: repository?.embeddingStatus ?? (chunkCount > 0 ? 'queued' : 'not-started'),
      retrievalBackend: repository?.retrievalBackend ?? 'local-hybrid',
      freshness: repository?.freshness ?? inferRepositoryFreshness(repositoryDocumentIds, sourceReceiptIds),
      lastIngestionRunId: repository?.lastIngestionRunId ?? null,
    },
    layers,
    promptBlock: promptLines.join('\n'),
  };
}

export function suggestNextActions(capsule: TurnCapsule, surface: 'ask' | 'drafting' = 'ask'): SemanticNextAction[] {
  const missingSources = capsule.sourceDocumentCore.length === 0;
  const hasGaps = capsule.activeGaps.length > 0;
  const base = [
    action('find_sources', missingSources ? 98 : hasGaps ? 84 : 48, 'Find sources', 'Fill the most important source gaps before relying on this answer.', '/app?panel=library', 'Find sources for the weakest claims in the active Context Capsule.', 'source-search'),
    action('extract_commitments', capsule.sourceDocumentCore.length ? 86 : 52, 'Extract commitments', 'Pull commitments, obligations, claims, and dates into reviewable proposals.', '/app?panel=canvas', 'Extract commitments and claims from the active capsule sources.', 'commitment-tracking'),
    action('map_stakeholders', capsule.graphCore ? 62 : 80, 'Map stakeholders', 'Turn actors, claims, and relationships into reviewable graph proposals.', '/app?panel=canvas', 'Map stakeholders, commitments, and evidence gaps from the active capsule.', 'stakeholder-mapping'),
    action('draft_memo', surface === 'drafting' ? 92 : 68, 'Draft memo', 'Move the answer into an Output Core with citations and explicit gaps.', '/app?panel=memo', 'Draft a concise options memo from this capsule and mark weak evidence.', 'brief-generation'),
    action('review_weak_claim', hasGaps ? 90 : 58, 'Review weak claim', 'Check weak evidence, contradictions, and stale context.', '/app?panel=ask', 'Review the weakest claim for evidence gaps and unresolved contradictions.', 'evidence-critique'),
    action('build_scenario', capsule.situationCore ? 64 : 40, 'Build scenario', 'Project next plausible paths from the current capsule.', '/app?panel=canvas', 'Build scenario branches from the active situation capsule.', 'scenario-projection'),
  ].sort((a, b) => b.priority - a.priority);

  return base.slice(0, 3);
}

export function compileEffectiveCapsule(capsule: TurnCapsule, objective?: string | null): EffectiveCapsule {
  const refs = capsule.injectableContext.capsule.coreRefs;
  const slotTrace: EffectiveCapsuleSlotTrace[] = [
    slot('user', refs.userCoreId ? [refs.userCoreId] : []),
    slot('situation', refs.situationCoreId ? [refs.situationCoreId] : []),
    slot('sourceDocument', [...refs.sourceCoreIds, ...refs.documentCoreIds]),
    slot('graph', refs.graphCoreId ? [refs.graphCoreId] : []),
    slot('memory', refs.memoryCoreId ? [refs.memoryCoreId] : []),
    slot('output', refs.outputCoreIds),
    slot('tool', refs.toolCoreIds ?? []),
    slot('objective', refs.objectiveCoreIds ?? []),
  ];
  const missingSlots = slotTrace.filter((item) => item.status === 'missing').map((item) => item.slot);
  const hashInput = JSON.stringify({
    capsuleId: capsule.capsuleId,
    capsuleVersion: capsule.capsuleVersion,
    objective: objective ?? null,
    slotTrace,
    warnings: capsule.activeGaps,
    injectionKey: capsule.injectableContext.injectionKey,
  });

  return {
    capsuleId: capsule.capsuleId,
    capsuleVersion: capsule.capsuleVersion,
    objective: objective?.trim() ? objective.trim().slice(0, 500) : null,
    primaryCapsuleId: capsule.capsuleId,
    referenceCapsuleIds: capsule.injectableContext.associatedCapsules.map((reference) => reference.capsuleId),
    comparisonCapsuleIds: [],
    slotTrace,
    selectedFiles: refs.documentCoreIds,
    selectedConnectors: refs.sourceCoreIds,
    selectedTools: refs.toolCoreIds ?? [],
    readiness: {
      score: capsule.injectableContext.capsule.health.score,
      warnings: capsule.activeGaps,
      missingSlots,
    },
    governance: {
      readContractRequired: true,
      activeOntologyStackId: capsule.injectableContext.capsule.activeOntologyStackId ?? 'ontology-stack-default',
      activeReadContractId: capsule.injectableContext.capsule.activeReadContractId ?? 'read-contract-default',
      latestGateState: capsule.injectableContext.capsule.latestGateState ?? 'none',
      advisoryMemoryHitCount: capsule.injectableContext.capsule.readinessSummary?.advisoryMemoryHitCount ?? 0,
      graphProposalCount: capsule.injectableContext.capsule.readinessSummary?.graphProposalCount ?? 0,
      reviewCardCount: capsule.injectableContext.capsule.readinessSummary?.reviewCardCount ?? 0,
    },
    contentHash: stableHash(hashInput),
    promptBlock: capsule.injectableContext.promptBlock,
  };
}

function referenceCapsuleRefs(capsules: InjectableContext['associatedCapsules']): string[] {
  return uniqueStrings(capsules.flatMap((capsule) => [
    capsule.capsuleId,
    capsule.coreRefs.userCoreId,
    capsule.coreRefs.situationCoreId,
    capsule.coreRefs.pathCoreId,
    ...capsule.coreRefs.sourceCoreIds,
    ...capsule.coreRefs.documentCoreIds,
    capsule.coreRefs.graphCoreId,
    capsule.coreRefs.timeCoreId,
    capsule.coreRefs.memoryCoreId,
    ...capsule.coreRefs.outputCoreIds,
    ...(capsule.coreRefs.toolCoreIds ?? []),
    ...(capsule.coreRefs.objectiveCoreIds ?? []),
    ...(capsule.coreRefs.productCoreIds ?? []),
  ]));
}

export function runCapability(input: RunCapabilityInput): CapabilityRunPlan {
  const capability = getCapability(input.capabilityId);
  const actionLabel = input.actionLabel ?? capability.capabilityId;
  const receipt: SuggestedActionReceipt = {
    actionId: `action_${input.capsule.traceId}_${capability.capabilityId}`,
    capabilityId: capability.capabilityId,
    capsuleId: input.capsule.capsuleId,
    capsuleVersion: input.capsule.capsuleVersion,
    routeFamily: capability.routeFamily,
    traceId: input.capsule.traceId,
    status: 'planned',
    actionLabel,
    createdAt: new Date().toISOString(),
  };
  return {
    capability,
    routeFamily: capability.routeFamily,
    canonicalPath: capability.canonicalPath,
    requiredCores: capability.requiredCores,
    persistenceTarget: capability.persistenceTarget,
    payload: {
      ...(input.payload ?? {}),
      capsuleId: input.capsule.capsuleId,
      capsuleVersion: input.capsule.capsuleVersion,
      traceId: input.capsule.traceId,
      capabilityId: capability.capabilityId,
      actionLabel,
    },
    traceId: input.capsule.traceId,
    receipt,
  };
}

export async function persistSuggestedActionReceipt(
  uid: string,
  receipt: SuggestedActionReceipt,
  deps?: CapsuleServiceDeps,
): Promise<SuggestedActionReceipt> {
  const db = deps?.db;
  if (!db) return receipt;
  await db
    .collection('users')
    .doc(uid)
    .collection('capability_action_receipts')
    .doc(receipt.actionId)
    .set(receipt, { merge: true });
  return receipt;
}

function groupVisibleMemory(items: KernelMemoryItem[], capsuleId: string): TurnCapsule['memory'] {
  const grouped: TurnCapsule['memory'] = { semantic: [], episodic: [], procedural: [] };
  for (const item of items) {
    if (item.deletedAt) continue;
    if (item.capsuleId && item.capsuleId !== capsuleId && item.capsuleId !== '__global__') continue;
    grouped[item.type].push(item);
  }
  return grouped;
}

function retrievalLayer(
  id: CapsuleRetrievalLayerId,
  label: string,
  priority: number,
  refIds: Array<string | null | undefined>,
): CapsuleRetrievalLayer {
  const ids = uniqueStrings(refIds);
  return {
    id,
    label,
    priority,
    refIds: ids,
    status: ids.length > 0 ? 'ready' : 'missing',
  };
}

function inferRepositoryFreshness(
  documentIds: string[],
  sourceReceiptIds: string[],
): CapsuleRepositoryMetadata['freshness'] {
  if (documentIds.length === 0 && sourceReceiptIds.length === 0) return 'empty';
  if (documentIds.length === 0) return 'needs-documents';
  if (sourceReceiptIds.length === 0) return 'needs-sources';
  return 'fresh';
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim() ?? '').filter(Boolean))).slice(0, 50);
}

function action(
  id: SemanticNextAction['id'],
  priority: number,
  label: SemanticNextAction['label'],
  detail: string,
  href: string,
  prompt: string,
  capabilityId: CapabilityId,
): SemanticNextAction {
  return { id, priority, label, detail, href, prompt, capabilityId };
}

function slot(slot: EffectiveCapsuleSlotTrace['slot'], ids: string[]): EffectiveCapsuleSlotTrace {
  return {
    slot,
    ids,
    status: ids.length > 0 ? 'ready' : 'missing',
    role: 'primary',
  };
}

function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

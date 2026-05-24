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
import type {
  CapsuleClaimLedgerItem,
  CapsuleGroundingReceipt,
  CapsuleMemoryReceipt,
  CapsuleSourceRefreshDocket,
  CapsuleSourceRefreshDocketItem,
} from '@/lib/ai/ask-answer-envelope';

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
  sourceExcerpts: Array<{
    sourceId: string;
    title: string;
    citation?: string;
    excerpt: string;
  }>;
  claimLedger: CapsuleClaimLedgerItem[];
  sourceRefreshDocket: CapsuleSourceRefreshDocket;
  memoryReceipt: CapsuleMemoryReceipt;
  groundingReceipt: CapsuleGroundingReceipt;
  reviewRequirements: {
    humanReviewRequired: boolean;
    requiredBeforeExternalUse: boolean;
    gates: string[];
    nextRepairActions: string[];
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
    sourceDocumentCore: uniqueStrings([...refs.sourceCoreIds, ...refs.documentCoreIds]),
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
    'ContextChain block priority: userCore, situation, sources, thinkingDevices, output.',
    ...formatRetrievalContextBlocks(capsule.injectableContext.stack.contextBlocks),
    'Read order:',
    ...layers.map((layer) => `- ${layer.priority}. ${layer.label}: ${layer.status}${layer.refIds.length ? ` (${layer.refIds.slice(0, 8).join(', ')})` : ''}`),
    'Answer from capsule core refs first, then associated reference capsule summaries, then repository documents/chunks and source receipts, then graph/time/memory/recent run/output history. Treat missing layers as explicit evidence gaps.',
    'Use model knowledge, online reading, or retrieval only to supplement, verify, or fill gaps outside the governed capsule blocks, and label that outside context clearly.',
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

function formatRetrievalContextBlocks(blocks: TurnCapsule['injectableContext']['stack']['contextBlocks']): string[] {
  return [
    `- userCore block: ${formatRetrievalBlockItems(blocks.userCore)}`,
    `- situation block: ${formatRetrievalBlockItems(blocks.situation)}`,
    `- sources block: ${formatRetrievalBlockItems(blocks.sources)}`,
    `- thinkingDevices block: ${formatRetrievalBlockItems(blocks.thinkingDevices)}`,
    `- output block: ${formatRetrievalBlockItems(blocks.output)}`,
  ];
}

function formatRetrievalBlockItems(items: TurnCapsule['injectableContext']['stack']['contextBlocks']['sources']): string {
  if (!items.length) return 'none';
  return items.map((item) => `${item.id}${item.primary ? ' (primary)' : ' (secondary)'}`).join(', ');
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
  const sourceExcerpts = buildEffectiveSourceExcerpts(capsule);
  const memoryReceipt = buildEffectiveMemoryReceipt(capsule);
  const claimLedger = buildEffectiveClaimLedger(capsule, sourceExcerpts, memoryReceipt);
  const sourceRefreshDocket = buildEffectiveSourceRefreshDocket(capsule, sourceExcerpts);
  const groundingReceipt = buildEffectiveGroundingReceipt(capsule, claimLedger, sourceExcerpts, memoryReceipt, sourceRefreshDocket);
  const reviewRequirements = buildEffectiveReviewRequirements(groundingReceipt, sourceRefreshDocket, memoryReceipt);
  const hashInput = JSON.stringify({
    capsuleId: capsule.capsuleId,
    capsuleVersion: capsule.capsuleVersion,
    objective: objective ?? null,
    slotTrace,
    warnings: capsule.activeGaps,
    injectionKey: capsule.injectableContext.injectionKey,
    groundingReceipt,
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
    sourceExcerpts,
    claimLedger,
    sourceRefreshDocket,
    memoryReceipt,
    groundingReceipt,
    reviewRequirements,
    contentHash: stableHash(hashInput),
    promptBlock: capsule.injectableContext.promptBlock,
  };
}

function buildEffectiveSourceExcerpts(capsule: TurnCapsule): EffectiveCapsule['sourceExcerpts'] {
  return capsule.retrievedEvidence
    .map((evidence) => ({
      sourceId: evidence.id,
      title: evidence.title,
      ...(evidence.citation ? { citation: evidence.citation } : {}),
      excerpt: evidence.excerpt ?? evidence.citation ?? evidence.title,
    }))
    .filter((source) => source.sourceId && source.excerpt)
    .slice(0, 12);
}

function buildEffectiveMemoryReceipt(capsule: TurnCapsule): CapsuleMemoryReceipt {
  const receipt = capsule.enrichment?.receipt;
  const receiptMemoryIds = receipt?.memoryItemIds ?? [];
  const visibleMemoryIds = Object.values(capsule.memory)
    .flat()
    .map((item) => item.id)
    .filter((id) => id.startsWith('cognee:'));
  const memoryIds = uniqueStrings([...receiptMemoryIds, ...visibleMemoryIds]);
  return {
    cogneeStatus: receipt?.cognee ?? 'disabled',
    memoryHitCount: receipt?.memoryHitCount ?? memoryIds.length,
    memoryIds,
    ignoredMemoryIds: [],
    advisoryOnly: true,
    promotionRequired: 'review-card',
    warnings: receipt?.warnings ?? [],
    writebackProposalIds: receipt?.writebackProposalIds ?? [],
  };
}

function buildEffectiveClaimLedger(
  capsule: TurnCapsule,
  sourceExcerpts: EffectiveCapsule['sourceExcerpts'],
  memoryReceipt: CapsuleMemoryReceipt,
): CapsuleClaimLedgerItem[] {
  const sourceClaims = sourceExcerpts.map((source): CapsuleClaimLedgerItem => ({
    claimId: `claim:${stableHash(`${capsule.capsuleId}:${source.sourceId}:${source.excerpt}`).slice(6)}`,
    text: source.excerpt,
    status: 'supported',
    sourceIds: [source.sourceId],
    memoryIds: [],
    confidence: 'high',
    freshness: 'current',
    reviewState: 'none',
  }));
  const gapClaims = capsule.activeGaps.map((gap): CapsuleClaimLedgerItem => ({
    claimId: `claim:${stableHash(`${capsule.capsuleId}:gap:${gap}`).slice(6)}`,
    text: gap,
    status: 'unsupported',
    sourceIds: [],
    memoryIds: [],
    confidence: 'low',
    freshness: 'unknown',
    reviewState: 'owner_review',
  }));
  const memoryClaims = memoryReceipt.memoryIds.map((memoryId): CapsuleClaimLedgerItem => ({
    claimId: `claim:${stableHash(`${capsule.capsuleId}:memory:${memoryId}`).slice(6)}`,
    text: `Advisory memory hit ${memoryId}; review-card apply metadata is required before canonical use.`,
    status: 'advisory_memory',
    sourceIds: [],
    memoryIds: [memoryId],
    confidence: 'low',
    freshness: 'unknown',
    reviewState: 'proposed',
  }));
  return [...sourceClaims, ...gapClaims, ...memoryClaims].slice(0, 16);
}

function buildEffectiveSourceRefreshDocket(
  capsule: TurnCapsule,
  sourceExcerpts: EffectiveCapsule['sourceExcerpts'],
): CapsuleSourceRefreshDocket {
  const generatedAt = new Date().toISOString();
  const sourceItems: CapsuleSourceRefreshDocketItem[] = sourceExcerpts.map((source) => ({
    sourceId: source.sourceId,
    title: source.title,
    status: 'refreshed',
    lastCheckedAt: generatedAt,
    excerptCount: 1,
  }));
  const missingSourceIds = capsule.sourceDocumentCore
    .filter((sourceId) => !sourceItems.some((item) => item.sourceId === sourceId));
  const missingItems: CapsuleSourceRefreshDocketItem[] = missingSourceIds.map((sourceId) => ({
    sourceId,
    title: sourceId,
    status: 'needs_refresh',
    lastCheckedAt: null,
    excerptCount: 0,
    gap: 'Source core is attached but no source excerpt was used in this turn.',
  }));
  const gapItems: CapsuleSourceRefreshDocketItem[] = capsule.activeGaps.map((gap) => ({
    sourceId: `source-gap:${stableHash(`${capsule.capsuleId}:${gap}`).slice(6)}`,
    title: 'Source gap',
    status: 'source_gap',
    lastCheckedAt: null,
    excerptCount: 0,
    gap,
  }));
  const items = [...sourceItems, ...missingItems, ...gapItems].slice(0, 20);
  const staleSourceIds = items
    .filter((item) => item.status === 'needs_refresh' || item.status === 'stale')
    .map((item) => item.sourceId);
  const needsRefresh = staleSourceIds.length > 0 || capsule.activeGaps.length > 0 || sourceExcerpts.length === 0;
  return {
    capsuleId: capsule.capsuleId,
    capsuleVersion: capsule.capsuleVersion,
    generatedAt,
    items,
    sourceIds: uniqueStrings(items.filter((item) => item.status !== 'source_gap').map((item) => item.sourceId)),
    excerptSourceIds: uniqueStrings(sourceItems.map((item) => item.sourceId)),
    staleSourceIds: uniqueStrings(staleSourceIds),
    missingEvidenceGaps: capsule.activeGaps,
    lastRefreshedAt: sourceItems.length ? generatedAt : null,
    needsRefresh,
    nextActions: needsRefresh
      ? ['Refresh or attach source excerpts for stale and missing source lanes.']
      : ['Review source excerpts before claim promotion.'],
  };
}

function buildEffectiveGroundingReceipt(
  capsule: TurnCapsule,
  claimLedger: CapsuleClaimLedgerItem[],
  sourceExcerpts: EffectiveCapsule['sourceExcerpts'],
  memoryReceipt: CapsuleMemoryReceipt,
  sourceRefreshDocket: CapsuleSourceRefreshDocket,
): CapsuleGroundingReceipt {
  const supportedClaims = claimLedger.filter((claim) => claim.status === 'supported').length;
  const weakClaims = claimLedger.filter((claim) => claim.status === 'weak' || claim.status === 'advisory_memory').length;
  const unsupportedClaims = claimLedger.filter((claim) => claim.status === 'unsupported' || claim.status === 'model_prior').length;
  const staleClaims = claimLedger.filter((claim) => claim.status === 'stale').length + sourceRefreshDocket.staleSourceIds.length;
  const nextRepairActions = uniqueStrings([
    sourceRefreshDocket.needsRefresh ? 'Refresh stale or missing source lanes before external use.' : '',
    unsupportedClaims > 0 ? 'Create source gaps or attach evidence for unsupported claims.' : '',
    memoryReceipt.memoryHitCount > 0 ? 'Create review-card proposals before using Cognee memory as canonical context.' : '',
  ]).length
    ? uniqueStrings([
        sourceRefreshDocket.needsRefresh ? 'Refresh stale or missing source lanes before external use.' : '',
        unsupportedClaims > 0 ? 'Create source gaps or attach evidence for unsupported claims.' : '',
        memoryReceipt.memoryHitCount > 0 ? 'Create review-card proposals before using Cognee memory as canonical context.' : '',
      ])
    : ['Review source excerpts before saving or exporting.'];
  return {
    capsuleId: capsule.capsuleId,
    capsuleVersion: capsule.capsuleVersion,
    ...(capsule.injectableContext.capsule.starterSnapshot?.catalogVersion
      ? { catalogVersion: capsule.injectableContext.capsule.starterSnapshot.catalogVersion }
      : {}),
    sourceExcerptCount: sourceExcerpts.length,
    cogneeStatus: memoryReceipt.cogneeStatus,
    memoryHitCount: memoryReceipt.memoryHitCount,
    supportedClaims,
    weakClaims,
    unsupportedClaims,
    staleClaims,
    humanReviewRequired: weakClaims > 0
      || unsupportedClaims > 0
      || staleClaims > 0
      || memoryReceipt.memoryHitCount > 0
      || sourceRefreshDocket.needsRefresh,
    nextRepairActions,
  };
}

function buildEffectiveReviewRequirements(
  groundingReceipt: CapsuleGroundingReceipt,
  sourceRefreshDocket: CapsuleSourceRefreshDocket,
  memoryReceipt: CapsuleMemoryReceipt,
): EffectiveCapsule['reviewRequirements'] {
  const gates = uniqueStrings([
    groundingReceipt.humanReviewRequired ? 'human-review' : '',
    sourceRefreshDocket.needsRefresh ? 'source-refresh' : '',
    memoryReceipt.memoryHitCount > 0 ? 'memory-review-card' : '',
  ]);
  return {
    humanReviewRequired: groundingReceipt.humanReviewRequired,
    requiredBeforeExternalUse: groundingReceipt.humanReviewRequired,
    gates,
    nextRepairActions: groundingReceipt.nextRepairActions,
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

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
import type { CapsuleServiceDeps, PraxisCapsule } from '@/lib/context/capsule-service';
import { appendAgentContextPacketToPromptBlock, type AgentContextPacketResult } from '@/lib/context/agent-context-packet';
import { isTemporalIntent } from '@/lib/context/temporal-timeline';
import type {
  CapsuleContextCaptureProfile,
  CapsuleStarterSnapshot,
  CapsuleRepositoryMetadata,
} from '@/lib/product/context-capsules';
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
  tokenBudgetReport: {
    maxInputTokens: number;
    reservedOutputTokens: number;
    estimatedContextChars: number;
    estimatedContextTokens: number;
    droppedCores: string[];
  };
  injectableContext: InjectableContext;
  agentContextPacket?: AgentContextPacketResult;
  memory: Record<MemoryType, KernelMemoryItem[]>;
  retrievalPlan: CapsuleRetrievalPlan;
  enrichment?: {
    receipt: {
      firestore: 'ready';
      canonicalStatus: 'firestore-canonical';
      cognee: 'enabled' | 'disabled' | 'degraded';
      trustgraph: 'enabled' | 'disabled' | 'degraded';
      graphlite: 'enabled' | 'disabled' | 'degraded';
      graphiti: 'deferred';
      memoryItemIds: string[];
      usedMemoryItemIds: string[];
      ignoredMemoryItemIds: string[];
      memoryHitCount: number;
      trustgraphItemIds: string[];
      usedTrustGraphItemIds: string[];
      ignoredTrustGraphItemIds: string[];
      trustgraphHitCount: number;
      graphliteItemIds: string[];
      usedGraphLiteItemIds: string[];
      ignoredGraphLiteItemIds: string[];
      graphliteHitCount: number;
      graphCandidateIds: string[];
      explainabilityIds: string[];
      writebackProposalIds: string[];
      warnings: string[];
    };
    memoryHitCount: number;
  };
}

export type CapsuleRetrievalLayerId =
  | 'capsule-core-refs'
  | 'associated-capsules'
  | 'ontology-bound-sources'
  | 'usage-inference'
  | 'repository-documents'
  | 'source-receipts'
  | 'advisory-cognee-memory'
  | 'advisory-trustgraph-context'
  | 'advisory-graphlite-context'
  | 'capsule-plus-graph'
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
  maxInputTokens?: number;
  reservedOutputTokens?: number;
  modelContextWindowTokens?: number;
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

export const DEFAULT_MAX_INPUT_TOKENS = 24_000;
export const DEFAULT_RESERVED_OUTPUT_TOKENS = 4_000;

export async function buildTurnCapsule(
  input: TurnCapsuleInput,
  deps?: CapsuleServiceDeps,
): Promise<TurnCapsule> {
  const injectableContext = await resolveInjectableContext(input, deps);
  const requestTime = (deps?.now?.() ?? new Date()).toISOString();
  const temporalIntent = isTemporalIntent(input.query ?? input.situationId ?? injectableContext.capsule.label);
  const packetAugmentation = appendAgentContextPacketToPromptBlock({
    capsule: injectableContext.capsule,
    promptBlock: injectableContext.promptBlock,
    userQuery: input.query ?? input.situationId ?? injectableContext.capsule.label,
    budgetTier: temporalIntent ? 'expanded' : 'standard',
    requestTime,
    turnId: input.traceId ?? injectableContext.injectionKey,
    temporalIntent,
  });
  const augmentedInjectableContext: InjectableContext = {
    ...injectableContext,
    promptBlock: packetAugmentation.promptBlock,
  };
  const refs = augmentedInjectableContext.capsule.coreRefs;
  const memory = groupVisibleMemory(input.memoryItems ?? [], augmentedInjectableContext.capsule.capsuleId);
  const tokenBudget = resolveTokenBudget(input);
  const selectedCores = selectCoresForBudget(augmentedInjectableContext.capsule, {
    objective: input.query ?? input.situationId ?? augmentedInjectableContext.capsule.label,
  }, tokenBudget);
  const estimatedContextChars = [
    augmentedInjectableContext.promptBlock,
    input.query ?? '',
    ...Object.values(memory).flat().map((item) => item.text),
    ...(input.activeGaps ?? []),
    ...(input.recentToolOutputs ?? []),
  ].join('\n').length;
  const estimatedContextTokens = estimateTokens([
    augmentedInjectableContext.promptBlock,
    input.query ?? '',
    ...Object.values(memory).flat().map((item) => item.text),
  ].join('\n'));

  const baseCapsule = {
    traceId: input.traceId ?? `turn_${Date.now().toString(36)}`,
    capsuleId: augmentedInjectableContext.capsule.capsuleId,
    capsuleVersion: augmentedInjectableContext.capsule.version,
    stack: {
      stackId: augmentedInjectableContext.capsule.capsuleId,
      label: augmentedInjectableContext.capsule.label,
      scope: augmentedInjectableContext.capsule.scope,
      parentCapsuleId: augmentedInjectableContext.capsule.parentCapsuleId,
      forkedFromVersion: augmentedInjectableContext.capsule.forkedFromVersion,
      activeForSituationIds: augmentedInjectableContext.capsule.activeForSituationIds,
      lockedCoreKinds: augmentedInjectableContext.capsule.lockedCoreKinds,
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
    activeGaps: input.activeGaps ?? augmentedInjectableContext.capsule.health.warnings,
    recentToolOutputs: input.recentToolOutputs ?? [],
    tokenBudgetReport: {
      maxInputTokens: tokenBudget.maxInputTokens,
      reservedOutputTokens: tokenBudget.reservedOutputTokens,
      estimatedContextChars,
      estimatedContextTokens,
      droppedCores: selectedCores.droppedCores,
    },
    injectableContext: augmentedInjectableContext,
    agentContextPacket: packetAugmentation.packet,
    memory,
  } satisfies Omit<TurnCapsule, 'retrievalPlan'>;

  return {
    ...baseCapsule,
    retrievalPlan: buildCapsuleRetrievalPlan(baseCapsule),
  };
}

export interface CoreBudgetSelection {
  selectedCoreIds: string[];
  droppedCores: string[];
  estimatedTokens: number;
}

export function selectCoresForBudget(
  capsule: PraxisCapsule,
  turn: { objective?: string | null },
  budget: { maxInputTokens?: number; reservedOutputTokens?: number } = {},
): CoreBudgetSelection {
  const refs = capsule.coreRefs;
  const locked = new Set(capsule.lockedCoreKinds);
  const objective = (turn.objective ?? '').toLowerCase();
  const usableBudget = Math.max(1, (budget.maxInputTokens ?? DEFAULT_MAX_INPUT_TOKENS) - (budget.reservedOutputTokens ?? DEFAULT_RESERVED_OUTPUT_TOKENS));
  const items = [
    coreBudgetItem('user', refs.userCoreId, locked.has('user'), objective),
    coreBudgetItem('situation', refs.situationCoreId, locked.has('situation'), objective),
    ...refs.sourceCoreIds.map((id) => coreBudgetItem('source', id, locked.has('source'), objective)),
    ...refs.documentCoreIds.map((id) => coreBudgetItem('document', id, locked.has('document'), objective)),
    coreBudgetItem('graph', refs.graphCoreId, locked.has('graph'), objective),
    coreBudgetItem('time', refs.timeCoreId, locked.has('time'), objective),
    ...refs.outputCoreIds.map((id) => coreBudgetItem('output', id, locked.has('output'), objective)),
    ...(refs.toolCoreIds ?? []).map((id) => coreBudgetItem('tool', id, locked.has('tool'), objective)),
    ...(refs.objectiveCoreIds ?? []).map((id) => coreBudgetItem('objective', id, locked.has('objective'), objective)),
    ...(refs.productCoreIds ?? []).map((id) => coreBudgetItem('product', id, locked.has('product'), objective)),
    coreBudgetItem('memory', refs.memoryCoreId, locked.has('memory'), objective),
  ].filter((item): item is NonNullable<ReturnType<typeof coreBudgetItem>> => Boolean(item))
    .sort((a, b) => Number(b.locked) - Number(a.locked) || b.score - a.score || a.id.localeCompare(b.id));
  const selected: string[] = [];
  const dropped: string[] = [];
  let used = 0;
  for (const item of items) {
    if (item.locked || used + item.tokens <= usableBudget) {
      selected.push(item.id);
      used += item.tokens;
    } else {
      dropped.push(item.id);
    }
  }
  return {
    selectedCoreIds: selected,
    droppedCores: dropped,
    estimatedTokens: used,
  };
}

export function buildCapsuleRetrievalPlan(
  capsule: Omit<TurnCapsule, 'retrievalPlan'>,
  repository?: Partial<CapsuleRepositoryMetadata> | null,
): CapsuleRetrievalPlan {
  const refs = capsule.injectableContext.capsule.coreRefs;
  const contextCaptureProfile = capsule.injectableContext.capsule.starterSnapshot?.contextCaptureProfile ?? null;
  const ontologyOverlay = capsule.injectableContext.capsule.starterSnapshot?.ontologyOverlay ?? null;
  const repositoryDocumentIds = uniqueStrings(repository?.documentIds ?? refs.documentCoreIds);
  const sourceReceiptIds = uniqueStrings(repository?.sourceReceiptIds ?? refs.sourceCoreIds);
  const storageObjectRefs = uniqueStrings(repository?.storageObjectRefs ?? []);
  const chunkCount = Math.max(0, Math.floor(repository?.chunkCount ?? 0));
  const advisoryCogneeMemoryIds = uniqueStrings([
    ...(contextCaptureProfile?.cogneeCapture.seedDocumentIds ?? []),
    ...(capsule.enrichment?.receipt.usedMemoryItemIds ?? capsule.enrichment?.receipt.memoryItemIds ?? []),
    ...Object.values(capsule.memory).flat().filter((item) => item.id.startsWith('cognee:')).map((item) => item.id),
  ]);
  const advisoryTrustGraphContextIds = uniqueStrings([
    ...(capsule.enrichment?.receipt.usedTrustGraphItemIds ?? capsule.enrichment?.receipt.trustgraphItemIds ?? []),
    ...(capsule.enrichment?.receipt.graphCandidateIds ?? []),
    ...(capsule.enrichment?.receipt.explainabilityIds ?? []),
    ...Object.values(capsule.memory).flat().filter((item) => item.id.startsWith('trustgraph:')).map((item) => item.id),
  ]);
  const advisoryGraphLiteContextIds = uniqueStrings([
    ...(capsule.enrichment?.receipt.usedGraphLiteItemIds ?? capsule.enrichment?.receipt.graphliteItemIds ?? []),
    ...(capsule.enrichment?.receipt.graphCandidateIds ?? []),
    ...(capsule.enrichment?.receipt.explainabilityIds ?? []),
    ...Object.values(capsule.memory).flat().filter((item) => item.id.startsWith('graphlite:')).map((item) => item.id),
  ]);
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
    retrievalLayer('ontology-bound-sources', 'Ontology-bound sources', 3, contextCaptureProfile?.sourceBindings.map((binding) =>
      `${binding.sourceId}:${binding.ontologyIds.join('+')}`,
    ) ?? []),
    retrievalLayer('usage-inference', 'Usage inference', 4, contextCaptureProfile ? [
      contextCaptureProfile.profileId,
      ...contextCaptureProfile.usageInference.activationSignals.slice(0, 3),
      ...contextCaptureProfile.usageInference.userJobs.slice(0, 2),
    ] : []),
    retrievalLayer('repository-documents', 'Attached repository documents', 5, repositoryDocumentIds),
    retrievalLayer('source-receipts', 'Attached source receipts', 6, sourceReceiptIds),
    retrievalLayer('advisory-cognee-memory', 'Advisory Cognee memory', 7, advisoryCogneeMemoryIds),
    retrievalLayer('advisory-trustgraph-context', 'Advisory TrustGraph context', 8, advisoryTrustGraphContextIds),
    retrievalLayer('advisory-graphlite-context', 'Advisory GraphLite embedded graph', 9, advisoryGraphLiteContextIds),
    retrievalLayer('capsule-plus-graph', 'Capsule+ graph capture', 10, contextCaptureProfile ? [
      `${contextCaptureProfile.profileId}:graph-candidates`,
      ...(ontologyOverlay ? [`${ontologyOverlay.overlayId}:starter-seed:nodes=${ontologyOverlay.graphSeed.nodeTemplates.length}:edges=${ontologyOverlay.graphSeed.edgeTemplates.length}`] : []),
      `nodes:${contextCaptureProfile.embeddedGraph.allowedNodeTypes.slice(0, 8).join(',')}`,
      `edges:${contextCaptureProfile.embeddedGraph.allowedEdgeTypes.slice(0, 6).join(',')}`,
      `provenance:${contextCaptureProfile.embeddedGraph.requiredProvenance.join('+')}`,
      `review:${contextCaptureProfile.embeddedGraph.reviewState}`,
    ] : []),
    retrievalLayer('graph-core', 'Actor and graph core', 11, refs.graphCoreId ? [refs.graphCoreId] : []),
    retrievalLayer('time-core', 'Time and watchlist core', 12, refs.timeCoreId ? [refs.timeCoreId] : []),
    retrievalLayer('memory-core', 'Memory and handover core', 13, [
      refs.memoryCoreId,
      ...Object.values(capsule.memory).flat().map((item) => item.id),
    ]),
    retrievalLayer('recent-runs', 'Recent run receipts', 14, capsule.recentToolOutputs),
    retrievalLayer('output-history', 'Output capsule history', 15, refs.outputCoreIds),
  ];
  const promptLines = [
    '## Active Capsule Retrieval Plan',
    `Capsule: ${capsule.capsuleId} v${capsule.capsuleVersion}`,
    `Repository: ${repositoryDocumentIds.length} document ref(s), ${sourceReceiptIds.length} source receipt ref(s), ${chunkCount} chunk(s), ${repository?.retrievalBackend ?? 'local-hybrid'} backend, freshness ${repository?.freshness ?? inferRepositoryFreshness(repositoryDocumentIds, sourceReceiptIds)}.`,
    'ContextChain block priority: userCore, situation, sources, thinkingDevices, output.',
    ...formatRetrievalContextBlocks(capsule.injectableContext.stack.contextBlocks),
    ...formatContextCapturePromptLines(contextCaptureProfile, capsule.enrichment?.receipt, ontologyOverlay),
    'Read order:',
    ...layers.map((layer) => `- ${layer.priority}. ${layer.label}: ${layer.status}${layer.refIds.length ? ` (${layer.refIds.slice(0, 8).join(', ')})` : ''}`),
    'Answer from capsule core refs first, then associated reference capsule summaries, ontology-bound source lanes, usage inference, repository documents/chunks and source receipts, advisory Cognee memory, advisory TrustGraph context, advisory GraphLite embedded graph context, Capsule+ graph candidates, then graph/time/memory/recent run/output history. Treat missing layers as explicit evidence gaps.',
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

function formatContextCapturePromptLines(
  profile: CapsuleContextCaptureProfile | null,
  receipt?: {
    memoryItemIds?: string[];
    usedMemoryItemIds?: string[];
    ignoredMemoryItemIds?: string[];
    trustgraphItemIds?: string[];
    usedTrustGraphItemIds?: string[];
    ignoredTrustGraphItemIds?: string[];
    graphliteItemIds?: string[];
    usedGraphLiteItemIds?: string[];
    ignoredGraphLiteItemIds?: string[];
    graphCandidateIds?: string[];
    explainabilityIds?: string[];
    writebackProposalIds?: string[];
  } | null,
  ontologyOverlay?: CapsuleStarterSnapshot['ontologyOverlay'] | null,
): string[] {
  if (!profile) {
    return [
      'Ontology-bound sources: none',
      'Usage inference: none',
      'Advisory Cognee memory: disabled or no source-bound advisory hits',
      'Advisory TrustGraph context: disabled or no provenance-bound graph paths',
      'Advisory GraphLite embedded graph: disabled or no provenance-bound local graph paths',
      'Capsule+ graph capture: no proposed graph profile',
    ];
  }
  const usedMemoryIds = receipt?.usedMemoryItemIds ?? receipt?.memoryItemIds ?? [];
  const ignoredMemoryIds = receipt?.ignoredMemoryItemIds ?? [];
  const usedTrustGraphIds = receipt?.usedTrustGraphItemIds ?? receipt?.trustgraphItemIds ?? [];
  const ignoredTrustGraphIds = receipt?.ignoredTrustGraphItemIds ?? [];
  const usedGraphLiteIds = receipt?.usedGraphLiteItemIds ?? receipt?.graphliteItemIds ?? [];
  const ignoredGraphLiteIds = receipt?.ignoredGraphLiteItemIds ?? [];
  const graphSeed = ontologyOverlay?.graphSeed ?? null;
  return [
    `Context capture profile: ${profile.profileId}`,
    `Ontology-bound sources: ${compactList(profile.sourceBindings.map((binding) => `${binding.sourceId} [${binding.ontologyIds.join('+')} -> ${binding.expectedClaims.slice(0, 2).join('; ')}]`), 4)}`,
    `Usage inference: signals=${compactList(profile.usageInference.activationSignals, 3)}; jobs=${compactList(profile.usageInference.userJobs, 2)}; contraindications=${compactList(profile.usageInference.contraindications, 3)}; confidence<=${profile.usageInference.confidenceThresholds.advisoryGenerationMaxConfidence} until evidence.`,
    `Advisory Cognee memory: seed_docs=${compactList(profile.cogneeCapture.seedDocumentIds, 4)}; used=${compactList(usedMemoryIds, 4)}; ignored=${compactList(ignoredMemoryIds, 4)}; advisory_only=${profile.cogneeCapture.advisoryOnly}; promotion=review-card.`,
    `Advisory TrustGraph context: used=${compactList(usedTrustGraphIds, 4)}; ignored=${compactList(ignoredTrustGraphIds, 4)}; graph_candidates=${compactList(receipt?.graphCandidateIds ?? [], 4)}; explainability=${compactList(receipt?.explainabilityIds ?? [], 4)}; advisory_only=true; promotion=review-card.`,
    `Advisory GraphLite embedded graph: used=${compactList(usedGraphLiteIds, 4)}; ignored=${compactList(ignoredGraphLiteIds, 4)}; graph_candidates=${compactList(receipt?.graphCandidateIds ?? [], 4)}; explainability=${compactList(receipt?.explainabilityIds ?? [], 4)}; advisory_only=true; promotion=review-card.`,
    `Capsule+ graph capture: nodes=${profile.embeddedGraph.allowedNodeTypes.slice(0, 8).join(',')}; edges=${profile.embeddedGraph.allowedEdgeTypes.slice(0, 6).join(',')}; provenance=${profile.embeddedGraph.requiredProvenance.join('+')}; review_state=${profile.embeddedGraph.reviewState}; promotion_gate=${profile.embeddedGraph.promotionGate}`,
    graphSeed
      ? `Ontology graph seed: ${ontologyOverlay?.overlayId}; graph_doc=ontologyGraphs/starter-seed; nodes=${graphSeed.nodeTemplates.length}; edges=${graphSeed.edgeTemplates.length}; sample_nodes=${compactList(graphSeed.nodeTemplates, 3)}; sample_edges=${compactList(graphSeed.edgeTemplates, 3)}`
      : 'Ontology graph seed: none',
    `Unsupported claim warnings: ${compactList(profile.generationImpact.unsupportedClaimWarnings, 3)}; evidence_required=${compactList(profile.generationImpact.evidenceRequiredBeforeConfidentGeneration, 3)}`,
  ];
}

function formatRetrievalBlockItems(items: TurnCapsule['injectableContext']['stack']['contextBlocks']['sources']): string {
  if (!items.length) return 'none';
  return items.map((item) => `${item.id}${item.primary ? ' (primary)' : ' (secondary)'}`).join(', ');
}

function compactList(values: string[], limit: number): string {
  const compact = values.map((value) => value.trim()).filter(Boolean).slice(0, limit);
  return compact.length ? compact.join(' | ') : 'none';
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
  const cogneeProfileId = capsule.injectableContext.capsule.starterSnapshot?.cogneeProfile?.profileId ?? undefined;
  return {
    cogneeStatus: receipt?.cognee ?? 'disabled',
    ...(cogneeProfileId ? { cogneeProfileId } : {}),
    usedCogneeAdvisoryMemory: Boolean(cogneeProfileId || (receipt?.memoryHitCount ?? memoryIds.length) > 0),
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
    ...(capsule.injectableContext.capsule.starterSnapshot?.intelligenceProfile?.profileId
      ? { intelligenceProfileId: capsule.injectableContext.capsule.starterSnapshot.intelligenceProfile.profileId }
      : {}),
    ...(capsule.injectableContext.capsule.starterSnapshot?.cogneeProfile?.profileId
      ? { cogneeProfileId: capsule.injectableContext.capsule.starterSnapshot.cogneeProfile.profileId }
      : {}),
    usedCapsuleIntelligenceProfile: Boolean(capsule.injectableContext.capsule.starterSnapshot?.intelligenceProfile?.profileId),
    usedCogneeAdvisoryMemory: Boolean(memoryReceipt.usedCogneeAdvisoryMemory),
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

function resolveTokenBudget(input: TurnCapsuleInput): { maxInputTokens: number; reservedOutputTokens: number } {
  const reservedOutputTokens = positiveInt(input.reservedOutputTokens) ?? DEFAULT_RESERVED_OUTPUT_TOKENS;
  const modelWindow = positiveInt(input.modelContextWindowTokens);
  const explicitMax = positiveInt(input.maxInputTokens);
  return {
    maxInputTokens: explicitMax ?? (modelWindow ? Math.max(512, modelWindow - reservedOutputTokens) : DEFAULT_MAX_INPUT_TOKENS),
    reservedOutputTokens,
  };
}

function positiveInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function coreBudgetItem(kind: string, id: string | null | undefined, locked: boolean, objective: string) {
  if (!id) return null;
  const idText = id.toLowerCase();
  const overlap = objective
    .split(/\W+/)
    .filter((token) => token.length > 2 && idText.includes(token)).length;
  const kindPriority = kind === 'user' || kind === 'situation' ? 8 : kind === 'source' || kind === 'document' ? 7 : kind === 'objective' ? 6 : 4;
  return {
    id,
    kind,
    locked,
    score: kindPriority + overlap * 2,
    tokens: estimateTokens(`${kind}:${id}`),
  };
}

function estimateTokens(value: string): number {
  return Math.max(1, Math.ceil(value.length / 4));
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

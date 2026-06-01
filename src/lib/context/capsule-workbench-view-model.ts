import { getDomainOntologyCards, WORK_ONTOLOGIES, type WorkOntologyId } from '@/lib/ontology/work-ontologies';

export type CapsuleWorkbenchCoreKind =
  | 'user'
  | 'situation'
  | 'path'
  | 'source'
  | 'document'
  | 'graph'
  | 'time'
  | 'tool'
  | 'objective'
  | 'product'
  | 'output'
  | 'memory';

export type CapsuleWorkbenchReviewState = 'canonical' | 'proposed' | 'missing' | 'advisory' | 'reviewed';

export interface CapsuleWorkbenchCoreRefs {
  userCoreId?: string | null;
  teamCoreId?: string | null;
  situationCoreId?: string | null;
  pathCoreId?: string | null;
  sourceCoreIds?: string[];
  documentCoreIds?: string[];
  graphCoreId?: string | null;
  timeCoreId?: string | null;
  toolCoreIds?: string[];
  objectiveCoreIds?: string[];
  productCoreIds?: string[];
  outputCoreIds?: string[];
  memoryCoreId?: string | null;
}

export interface CapsuleWorkbenchCapsuleInput {
  capsuleId: string;
  label: string;
  scope?: string | null;
  version?: number | null;
  summary?: string | null;
  updatedAt?: string | null;
  archivedAt?: string | null;
  activeForSituationIds?: string[];
  coreRefs?: CapsuleWorkbenchCoreRefs | null;
  health?: {
    score?: number | null;
    warnings?: string[];
    blockers?: string[];
  } | null;
  trust?: {
    level?: string | null;
    score?: number | null;
    label?: string | null;
  } | null;
  readiness?: {
    score?: number | null;
    tier?: 'red' | 'amber' | 'green' | string | null;
    diagnostics?: string[];
  } | null;
  readinessSummary?: {
    sourceBacked?: boolean;
    graphLinked?: boolean;
    advisoryMemoryHitCount?: number;
    graphProposalCount?: number;
    reviewCardCount?: number;
    reviewRequired?: boolean;
  } | null;
  community?: {
    tags?: string[];
    favorite?: boolean;
    userRating?: number | null;
    averageRating?: number | null;
    ratingCount?: number;
  } | null;
  access?: {
    visibility?: string | null;
    allowDownload?: boolean;
    allowClone?: boolean;
  } | null;
  activeOntologyStackId?: string | null;
  activeReadContractId?: string | null;
  latestGateState?: string | null;
  sourceRefs?: unknown[];
  claimLedger?: unknown[];
  outputContracts?: unknown[];
  memoryPosture?: unknown;
  starterSnapshot?: unknown;
  graphLiteProjection?: unknown;
  embeddedGraph?: unknown;
  grounding?: unknown;
}

export interface CapsuleWorkbenchDocumentInput {
  id: string;
  title?: string | null;
  status?: string | null;
  chunkCount?: number | null;
  fileType?: string | null;
}

export interface CapsuleWorkbenchAgentRunInput {
  runId: string;
  status: string;
  objective?: string | null;
  policyAgentLabel?: string | null;
  policyAgentId?: string | null;
  createdAt?: string | null;
  outputHref?: string | null;
}

export interface CapsuleWorkbenchTacitMemoryInput {
  id: string;
  type: string;
  summary: string;
  detail?: string | null;
  confidence?: number | null;
  tags?: string[];
  lastUsedAt?: string | null;
}

export interface CapsuleWorkbenchReviewCardInput {
  id?: string;
  reviewCardId?: string;
  title?: string | null;
  target?: string | null;
  state?: string | null;
  sourceType?: string | null;
}

export interface CapsuleWorkbenchViewModelInput {
  capsule: CapsuleWorkbenchCapsuleInput;
  repositoryDocuments?: CapsuleWorkbenchDocumentInput[];
  agentRuns?: CapsuleWorkbenchAgentRunInput[];
  tacitMemories?: CapsuleWorkbenchTacitMemoryInput[];
  reviewCards?: CapsuleWorkbenchReviewCardInput[];
}

export interface CapsuleCoreDisplay {
  kind: CapsuleWorkbenchCoreKind;
  label: string;
  status: 'present' | 'missing';
  ids: string[];
  description: string;
  reviewState: CapsuleWorkbenchReviewState;
}

export interface CapsuleEvidenceDisplay {
  sourceCount: number;
  sourcePosture: string;
  supportedClaims: string[];
  weakClaims: string[];
  unsupportedClaims: string[];
  assumptions: string[];
  dateChecks: string[];
  gaps: string[];
  sourceIds: string[];
  documentIds: string[];
}

export interface CapsuleGraphNodeDisplay {
  id: string;
  label: string;
  type: 'capsule' | 'core' | 'source' | 'document' | 'claim' | 'gap' | 'memory' | 'output' | 'agent' | 'ontology' | 'review';
  reviewState: CapsuleWorkbenchReviewState;
  detail?: string;
  entityType?: string;
  provenance?: string;
  confidence?: number | null;
  sourceReceiptIds?: string[];
  linkedClaimIds?: string[];
  version?: number | null;
}

export interface CapsuleGraphEdgeDisplay {
  id: string;
  source: string;
  target: string;
  label: string;
  reviewState: CapsuleWorkbenchReviewState;
  relationshipType?: string;
  confidence?: number | null;
  sourceReceiptIds?: string[];
}

export interface CapsuleGraphDisplay {
  nodes: CapsuleGraphNodeDisplay[];
  edges: CapsuleGraphEdgeDisplay[];
  canonicalNodeCount: number;
  proposedNodeCount: number;
}

export interface CapsuleOntologyItemDisplay {
  id: string;
  label: string;
  role: 'active' | 'proposed' | 'missing';
  primitiveCoverage: string[];
  requiredRelations: string[];
  reviewState: CapsuleWorkbenchReviewState;
}

export interface CapsuleOntologyDisplay {
  active: CapsuleOntologyItemDisplay[];
  proposed: CapsuleOntologyItemDisplay[];
  missing: CapsuleOntologyItemDisplay[];
}

export interface CapsuleTacitKnowledgeDisplay {
  items: Array<{
    id: string;
    type: string;
    summary: string;
    detail: string | null;
    confidence: number | null;
    reviewState: CapsuleWorkbenchReviewState;
    tags: string[];
    lastUsedAt: string | null;
  }>;
  contextReadyCount: number;
  advisoryCount: number;
}

export interface CapsuleAgentWorkflowDisplay {
  recentRuns: Array<{
    runId: string;
    label: string;
    status: string;
    objective: string;
    createdAt: string | null;
    outputHref: string | null;
  }>;
  nextActions: string[];
  reviewRequired: boolean;
}

export interface CapsuleOutputDisplay {
  id: string;
  label: string;
  type: 'output' | 'product' | 'memo' | 'handover';
  reviewState: CapsuleWorkbenchReviewState;
}

export interface CapsuleReviewCardDisplay {
  id: string;
  title: string;
  target: string;
  state: string;
  sourceType: string;
  reviewState: CapsuleWorkbenchReviewState;
}

export interface CapsuleWorkbenchViewModel {
  capsuleId: string;
  capsuleVersion: number;
  title: string;
  scope: string;
  status: 'active' | 'available' | 'archived';
  summary: string;
  readiness: {
    score: number;
    tier: 'red' | 'amber' | 'green';
    diagnostics: string[];
  };
  summaryFacts: {
    jurisdiction?: string;
    domain?: string;
    outputGoal?: string;
    nextAction: string;
  };
  anatomy: CapsuleCoreDisplay[];
  evidence: CapsuleEvidenceDisplay;
  graph: CapsuleGraphDisplay;
  ontology: CapsuleOntologyDisplay;
  tacitKnowledge: CapsuleTacitKnowledgeDisplay;
  agents: CapsuleAgentWorkflowDisplay;
  outputs: CapsuleOutputDisplay[];
  reviewQueue: CapsuleReviewCardDisplay[];
}

const CORE_ORDER: Array<{
  kind: CapsuleWorkbenchCoreKind;
  label: string;
  scalarKey?: keyof CapsuleWorkbenchCoreRefs;
  arrayKey?: keyof CapsuleWorkbenchCoreRefs;
  description: string;
}> = [
  { kind: 'user', label: 'User Core', scalarKey: 'userCoreId', description: 'Mandate, audience, voice, risk posture, and red lines.' },
  { kind: 'situation', label: 'Situation Core', scalarKey: 'situationCoreId', description: 'Issue, domain, jurisdiction, actors, and decision context.' },
  { kind: 'path', label: 'Path Core', scalarKey: 'pathCoreId', description: 'The working method or domain path for the policy work.' },
  { kind: 'source', label: 'Source Core', arrayKey: 'sourceCoreIds', description: 'Receipts, links, source posture, and source gaps.' },
  { kind: 'document', label: 'Document Core', arrayKey: 'documentCoreIds', description: 'Uploaded files, extracted chunks, notes, and reports.' },
  { kind: 'graph', label: 'Graph Core', scalarKey: 'graphCoreId', description: 'Actors, claims, relationships, reviewed facts, and proposals.' },
  { kind: 'time', label: 'Time Core', scalarKey: 'timeCoreId', description: 'Freshness windows, episodes, deadlines, and scenario horizon.' },
  { kind: 'tool', label: 'Tool Core', arrayKey: 'toolCoreIds', description: 'Recommended tools, thinking devices, and allowed actions.' },
  { kind: 'objective', label: 'Objective Core', arrayKey: 'objectiveCoreIds', description: 'What the capsule is trying to decide, monitor, or produce.' },
  { kind: 'product', label: 'Product Core', arrayKey: 'productCoreIds', description: 'Product family such as memo, note, map, board pack, or handover.' },
  { kind: 'output', label: 'Output Core', arrayKey: 'outputCoreIds', description: 'Exact output goal, audience, citation posture, and export rules.' },
  { kind: 'memory', label: 'Memory Core', scalarKey: 'memoryCoreId', description: 'Tacit knowledge, caveats, decisions, and handover notes.' },
];

export function buildCapsuleWorkbenchViewModel(input: CapsuleWorkbenchViewModelInput): CapsuleWorkbenchViewModel {
  const capsule = input.capsule;
  const coreRefs = capsule.coreRefs ?? {};
  const warnings = cleanStrings(capsule.health?.warnings);
  const blockers = cleanStrings(capsule.health?.blockers);
  const diagnostics = [...blockers, ...warnings].slice(0, 8);
  const score = scoreForCapsule(capsule);
  const anatomy = buildAnatomy(coreRefs);
  const evidence = buildEvidence(capsule, input.repositoryDocuments ?? []);
  const tacitKnowledge = buildTacitKnowledge(capsule, input.tacitMemories ?? []);
  const outputs = buildOutputs(coreRefs, capsule.outputContracts);
  const reviewQueue = buildReviewQueue(capsule, input.reviewCards ?? [], evidence);
  const ontology = buildOntology(capsule, coreRefs);
  const agents = buildAgentWorkflow(input.agentRuns ?? [], evidence, reviewQueue);
  const graph = buildGraph({
    capsule,
    anatomy,
    evidence,
    tacitKnowledge,
    outputs,
    reviewQueue,
    ontology,
    agentRuns: input.agentRuns ?? [],
  });

  return {
    capsuleId: capsule.capsuleId,
    capsuleVersion: Number.isFinite(capsule.version ?? NaN) ? Number(capsule.version) : 1,
    title: cleanText(capsule.label) || 'Untitled capsule',
    scope: cleanText(capsule.scope) || 'user',
    status: capsule.archivedAt ? 'archived' : capsule.activeForSituationIds?.length ? 'active' : 'available',
    summary: cleanText(capsule.summary) || 'No capsule summary has been written yet.',
    readiness: {
      score,
      tier: tierForScore(score),
      diagnostics,
    },
    summaryFacts: {
      jurisdiction: inferJurisdiction(capsule),
      domain: inferDomain(capsule),
      outputGoal: inferOutputGoal(capsule, outputs),
      nextAction: nextActionForCapsule(evidence, warnings, reviewQueue),
    },
    anatomy,
    evidence,
    graph,
    ontology,
    tacitKnowledge,
    agents,
    outputs,
    reviewQueue,
  };
}

function buildAnatomy(coreRefs: CapsuleWorkbenchCoreRefs): CapsuleCoreDisplay[] {
  return CORE_ORDER.map((core) => {
    const ids = cleanStrings(core.arrayKey ? coreRefs[core.arrayKey] as string[] | undefined : [coreRefs[core.scalarKey!] as string | null | undefined]);
    const present = ids.length > 0;
    return {
      kind: core.kind,
      label: core.label,
      status: present ? 'present' : 'missing',
      ids,
      description: core.description,
      reviewState: present ? 'canonical' : 'missing',
    };
  });
}

function buildEvidence(capsule: CapsuleWorkbenchCapsuleInput, documents: CapsuleWorkbenchDocumentInput[]): CapsuleEvidenceDisplay {
  const coreRefs = capsule.coreRefs ?? {};
  const sourceIds = uniqueStrings([
    ...cleanStrings(coreRefs.sourceCoreIds),
    ...sourceIdsFromUnknown(capsule.sourceRefs),
  ]);
  const documentIds = uniqueStrings([
    ...cleanStrings(coreRefs.documentCoreIds),
    ...documents.map((document) => document.id),
  ]);
  const claimBuckets = claimBucketsFromUnknown(capsule.claimLedger);
  const warningText = cleanStrings(capsule.health?.warnings);
  const blockerText = cleanStrings(capsule.health?.blockers);
  const unsupportedFromWarnings = warningText
    .filter((item) => /unsupported|thin|missing source|missing evidence/i.test(item))
    .map((item) => item.replace(/^Unsupported claim:\s*/i, '').trim());
  const dateChecks = warningText.filter((item) => /date|fresh|stale|current|guidance/i.test(item));
  const gaps = uniqueStrings([
    ...blockerText,
    ...warningText.filter((item) => /gap|missing|unsupported|thin/i.test(item)),
  ]);
  const sourceCount = sourceIds.length + documentIds.length;
  return {
    sourceCount,
    sourcePosture: sourceCount > 0
      ? `${sourceCount} attached source/document receipt${sourceCount === 1 ? '' : 's'}.`
      : 'No source receipts attached yet.',
    supportedClaims: claimBuckets.supported,
    weakClaims: claimBuckets.weak,
    unsupportedClaims: uniqueStrings([...claimBuckets.unsupported, ...unsupportedFromWarnings]),
    assumptions: claimBuckets.assumptions,
    dateChecks,
    gaps,
    sourceIds,
    documentIds,
  };
}

function buildTacitKnowledge(
  capsule: CapsuleWorkbenchCapsuleInput,
  memories: CapsuleWorkbenchTacitMemoryInput[],
): CapsuleTacitKnowledgeDisplay {
  const explicit = memories.map((memory) => ({
    id: memory.id,
    type: memory.type,
    summary: cleanText(memory.summary),
    detail: cleanText(memory.detail) || null,
    confidence: typeof memory.confidence === 'number' ? clamp(memory.confidence, 0, 1) : null,
    reviewState: 'canonical' as CapsuleWorkbenchReviewState,
    tags: cleanStrings(memory.tags),
    lastUsedAt: memory.lastUsedAt ?? null,
  })).filter((memory) => memory.summary);
  const memoryPosture = memoryFactsFromUnknown(capsule.memoryPosture);
  const advisoryCount = Math.max(Number(capsule.readinessSummary?.advisoryMemoryHitCount ?? 0), memoryPosture.advisory.length);
  const derived = [
    ...memoryPosture.canonical.map((summary, index) => ({
      id: `canonical-memory-${index + 1}`,
      type: 'capsule_fact',
      summary,
      detail: null,
      confidence: null,
      reviewState: 'canonical' as CapsuleWorkbenchReviewState,
      tags: ['capsule-fact'],
      lastUsedAt: null,
    })),
    ...memoryPosture.advisory.map((summary, index) => ({
      id: `advisory-memory-${index + 1}`,
      type: 'advisory_memory',
      summary,
      detail: 'Advisory memory is not canonical until a review card is applied.',
      confidence: 0.6,
      reviewState: 'advisory' as CapsuleWorkbenchReviewState,
      tags: ['advisory'],
      lastUsedAt: null,
    })),
  ];
  const fallback = advisoryCount > 0 && !explicit.length && !derived.length
    ? [{
        id: 'advisory-memory-count',
        type: 'advisory_memory',
        summary: `${advisoryCount} advisory memory signal${advisoryCount === 1 ? '' : 's'} available for review.`,
        detail: 'Review before treating this as reusable capsule context.',
        confidence: 0.6,
        reviewState: 'advisory' as CapsuleWorkbenchReviewState,
        tags: ['advisory'],
        lastUsedAt: null,
      }]
    : [];
  const items = [...explicit, ...derived, ...fallback].slice(0, 12);
  return {
    items,
    contextReadyCount: items.filter((item) => item.reviewState === 'canonical').length,
    advisoryCount: items.filter((item) => item.reviewState === 'advisory').length,
  };
}

function buildOutputs(coreRefs: CapsuleWorkbenchCoreRefs, outputContracts: unknown): CapsuleOutputDisplay[] {
  const outputIds = cleanStrings(coreRefs.outputCoreIds);
  const productIds = cleanStrings(coreRefs.productCoreIds);
  const contractLabels = outputLabelsFromUnknown(outputContracts);
  return [
    ...outputIds.map((id) => ({ id, label: humanizeId(id), type: 'output' as const, reviewState: 'canonical' as const })),
    ...productIds.map((id) => ({ id, label: humanizeId(id), type: 'product' as const, reviewState: 'canonical' as const })),
    ...contractLabels.map((label, index) => ({
      id: `output-contract-${index + 1}`,
      label,
      type: 'memo' as const,
      reviewState: 'canonical' as const,
    })),
  ].slice(0, 10);
}

function buildReviewQueue(
  capsule: CapsuleWorkbenchCapsuleInput,
  cards: CapsuleWorkbenchReviewCardInput[],
  evidence: CapsuleEvidenceDisplay,
): CapsuleReviewCardDisplay[] {
  const explicit = cards.map((card, index) => ({
    id: card.id ?? card.reviewCardId ?? `review-card-${index + 1}`,
    title: cleanText(card.title) || humanizeId(card.target ?? 'review card'),
    target: cleanText(card.target) || 'capsuleEnvelope',
    state: cleanText(card.state) || 'proposed',
    sourceType: cleanText(card.sourceType) || 'user',
    reviewState: reviewStateFrom(card.state),
  }));
  const derived: CapsuleReviewCardDisplay[] = [];
  if (!evidence.sourceCount) {
    derived.push({
      id: 'source-gap-review',
      title: 'Attach sources or create a source-gap review card',
      target: 'sourceGap',
      state: 'proposed',
      sourceType: 'source-gap',
      reviewState: 'proposed',
    });
  }
  if (evidence.unsupportedClaims.length) {
    derived.push({
      id: 'unsupported-claims-review',
      title: `${evidence.unsupportedClaims.length} unsupported claim${evidence.unsupportedClaims.length === 1 ? '' : 's'} need evidence`,
      target: 'claimLedger',
      state: 'proposed',
      sourceType: 'source-gap',
      reviewState: 'proposed',
    });
  }
  if ((capsule.readinessSummary?.graphProposalCount ?? 0) > 0 || !capsule.coreRefs?.graphCoreId) {
    derived.push({
      id: 'graph-proposal-review',
      title: capsule.coreRefs?.graphCoreId ? 'Review pending graph proposals' : 'Create or review capsule graph structure',
      target: 'graphProposal',
      state: 'proposed',
      sourceType: 'graph',
      reviewState: 'proposed',
    });
  }
  if ((capsule.readinessSummary?.advisoryMemoryHitCount ?? 0) > 0) {
    derived.push({
      id: 'advisory-memory-review',
      title: 'Review advisory tacit memory before reuse',
      target: 'advisoryMemory',
      state: 'proposed',
      sourceType: 'cognee',
      reviewState: 'advisory',
    });
  }
  return uniqueBy([...explicit, ...derived], (item) => item.id).slice(0, 12);
}

function buildOntology(
  capsule: CapsuleWorkbenchCapsuleInput,
  coreRefs: CapsuleWorkbenchCoreRefs,
): CapsuleOntologyDisplay {
  const ids = uniqueStrings([
    cleanText(coreRefs.pathCoreId),
    cleanText(capsule.activeOntologyStackId),
    ...cleanStrings(capsule.community?.tags).map((tag) => tag.replace(/^domain:/, '').replace(/^ontology:/, '')),
  ]);
  const workById = new Map(WORK_ONTOLOGIES.map((ontology) => [ontology.id, ontology]));
  const activeWork = ids
    .map((id) => workById.get(id as WorkOntologyId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 3)
    .map((ontology) => ({
      id: ontology.id,
      label: ontology.label,
      role: 'active' as const,
      primitiveCoverage: Object.keys(ontology.primitiveSubtypes).slice(0, 6),
      requiredRelations: ontology.mandatoryRelations.map((relation) => relation.description).slice(0, 3),
      reviewState: 'canonical' as CapsuleWorkbenchReviewState,
    }));
  const domainCandidates = getDomainOntologyCards()
    .filter((ontology) => ids.some((id) => id.includes(ontology.id) || ontology.id.includes(id)))
    .slice(0, 2)
    .map((ontology) => ({
      id: ontology.id,
      label: ontology.label,
      role: 'active' as const,
      primitiveCoverage: ontology.nodeTypes?.slice(0, 6).map(String) ?? [],
      requiredRelations: ontology.validators?.map((validator) => validator.label).slice(0, 3) ?? [],
      reviewState: 'canonical' as CapsuleWorkbenchReviewState,
    }));
  const active = uniqueBy([...activeWork, ...domainCandidates], (item) => item.id);
  const proposed = active.length
    ? []
    : [{
        id: 'policy-work-ontology',
        label: 'Policy work ontology',
        role: 'proposed' as const,
        primitiveCoverage: ['Actor', 'Claim', 'Source', 'Decision', 'Memory'],
        requiredRelations: ['Claims should link to supporting sources.', 'Decisions should link to assumptions and actors.'],
        reviewState: 'proposed' as CapsuleWorkbenchReviewState,
      }];
  const missing = active.length && !capsule.coreRefs?.graphCoreId
    ? [{
        id: 'graph-core-missing',
        label: 'Graph core not attached',
        role: 'missing' as const,
        primitiveCoverage: [],
        requiredRelations: ['Attach or review graph proposals before relying on graph analytics.'],
        reviewState: 'missing' as CapsuleWorkbenchReviewState,
      }]
    : [];
  return { active, proposed, missing };
}

function buildAgentWorkflow(
  runs: CapsuleWorkbenchAgentRunInput[],
  evidence: CapsuleEvidenceDisplay,
  reviewQueue: CapsuleReviewCardDisplay[],
): CapsuleAgentWorkflowDisplay {
  const recentRuns = runs.slice(0, 6).map((run) => ({
    runId: run.runId,
    label: cleanText(run.policyAgentLabel) || cleanText(run.policyAgentId) || 'Capsule agent',
    status: cleanText(run.status) || 'queued',
    objective: cleanText(run.objective) || 'Capsule-scoped analysis run.',
    createdAt: run.createdAt ?? null,
    outputHref: run.outputHref ?? null,
  }));
  const nextActions = uniqueStrings([
    evidence.unsupportedClaims.length ? 'Run sourceability on unsupported claims.' : '',
    evidence.dateChecks.length ? 'Refresh date-sensitive sources.' : '',
    evidence.sourceCount ? 'Open as draft with source receipts.' : 'Attach sources before drafting.',
    reviewQueue.length ? 'Review proposed graph, source, and memory changes.' : '',
  ]).slice(0, 4);
  return {
    recentRuns,
    nextActions,
    reviewRequired: reviewQueue.some((item) => item.reviewState !== 'canonical'),
  };
}

function buildGraph(input: {
  capsule: CapsuleWorkbenchCapsuleInput;
  anatomy: CapsuleCoreDisplay[];
  evidence: CapsuleEvidenceDisplay;
  tacitKnowledge: CapsuleTacitKnowledgeDisplay;
  outputs: CapsuleOutputDisplay[];
  reviewQueue: CapsuleReviewCardDisplay[];
  ontology: CapsuleOntologyDisplay;
  agentRuns: CapsuleWorkbenchAgentRunInput[];
}): CapsuleGraphDisplay {
  const nodes: CapsuleGraphNodeDisplay[] = [{
    id: `capsule:${input.capsule.capsuleId}`,
    label: input.capsule.label,
    type: 'capsule',
    reviewState: 'canonical',
    detail: input.capsule.summary ?? undefined,
    entityType: 'Policy',
    provenance: 'ContextCapsule envelope',
    confidence: confidenceFromScore(scoreForCapsule(input.capsule)),
    version: input.capsule.version ?? null,
  }];
  const edges: CapsuleGraphEdgeDisplay[] = [];
  const sourceItems = sourceItemsFromUnknown(input.capsule.sourceRefs);
  const sourceById = new Map(sourceItems.map((source) => [source.id, source]));
  const claimItems = claimItemsFromUnknown(input.capsule.claimLedger);
  const addNode = (node: CapsuleGraphNodeDisplay) => {
    if (!nodes.some((existing) => existing.id === node.id)) nodes.push(node);
  };
  const addEdge = (edge: CapsuleGraphEdgeDisplay) => {
    if (!edges.some((existing) => existing.id === edge.id)) edges.push(edge);
  };

  for (const core of input.anatomy) {
    const nodeId = `core:${core.kind}`;
    addNode({
      id: nodeId,
      label: core.label.replace(' Core', ''),
      type: 'core',
      reviewState: core.reviewState,
      detail: core.status === 'present' ? core.ids.slice(0, 3).join(', ') : core.description,
      entityType: core.kind === 'source' || core.kind === 'document' ? 'Resource' : core.kind === 'memory' ? 'Narrative' : 'Policy',
      provenance: 'Capsule core reference',
    });
    addEdge({
      id: `capsule-${nodeId}`,
      source: `capsule:${input.capsule.capsuleId}`,
      target: nodeId,
      label: core.status === 'present' ? 'has core' : 'missing core',
      reviewState: core.reviewState,
      relationshipType: 'member_of',
    });
  }

  for (const sourceId of input.evidence.sourceIds) {
    const source = sourceById.get(sourceId);
    addNode({
      id: `source:${sourceId}`,
      label: source?.label ?? humanizeId(sourceId),
      type: 'source',
      reviewState: source?.reviewState ?? 'canonical',
      detail: source?.detail,
      entityType: source?.entityType ?? 'Resource',
      provenance: source?.provenance ?? 'source receipt',
      confidence: source?.confidence ?? null,
      sourceReceiptIds: [sourceId],
      linkedClaimIds: claimItems.filter((claim) => claim.sourceIds.includes(sourceId)).map((claim) => claim.id),
    });
    addEdge({
      id: `source-${sourceId}-core`,
      source: `source:${sourceId}`,
      target: 'core:source',
      label: 'uses source',
      reviewState: source?.reviewState ?? 'canonical',
      relationshipType: 'member_of',
      confidence: source?.confidence ?? null,
      sourceReceiptIds: [sourceId],
    });
  }
  for (const documentId of input.evidence.documentIds) {
    addNode({
      id: `document:${documentId}`,
      label: humanizeId(documentId),
      type: 'document',
      reviewState: 'canonical',
      entityType: 'Resource',
      provenance: 'repository document',
      sourceReceiptIds: [documentId],
    });
    addEdge({
      id: `document-${documentId}-core`,
      source: `document:${documentId}`,
      target: 'core:document',
      label: 'uses document',
      reviewState: 'canonical',
      relationshipType: 'member_of',
      sourceReceiptIds: [documentId],
    });
  }
  for (const claim of claimItems) {
    const id = `claim:${claim.id}`;
    addNode({
      id,
      label: claim.text,
      type: 'claim',
      reviewState: claim.reviewState,
      detail: claim.status ? `Claim status: ${claim.status}` : 'Capsule claim ledger entry.',
      entityType: 'Claim',
      provenance: claim.provenance ?? 'claim ledger',
      confidence: claim.confidence ?? null,
      sourceReceiptIds: claim.sourceIds,
    });
    if (!claim.sourceIds.length) {
      addEdge({
        id: `${id}-source-gap`,
        source: id,
        target: 'core:source',
        label: 'needs evidence',
        reviewState: claim.reviewState === 'canonical' ? 'proposed' : claim.reviewState,
        relationshipType: 'requires_resource',
      });
    }
    for (const sourceId of claim.sourceIds) {
      addEdge({
        id: `claim-${claim.id}-source-${sourceId}`,
        source: id,
        target: `source:${sourceId}`,
        label: 'supported by',
        reviewState: claim.reviewState,
        relationshipType: 'supports_claim',
        confidence: claim.confidence ?? null,
        sourceReceiptIds: [sourceId],
      });
    }
  }
  const claimTexts = new Set(claimItems.map((claim) => claim.text));
  for (const [index, claim] of input.evidence.unsupportedClaims.filter((claim) => !claimTexts.has(claim)).entries()) {
    const id = `claim:unsupported-${index + 1}`;
    addNode({
      id,
      label: claim,
      type: 'claim',
      reviewState: 'proposed',
      detail: 'Unsupported or weak claim.',
      entityType: 'Claim',
      provenance: 'readiness warning',
    });
    addEdge({ id: `${id}-source-gap`, source: id, target: 'core:source', label: 'needs evidence', reviewState: 'proposed', relationshipType: 'requires_resource' });
  }
  for (const [index, gap] of input.evidence.gaps.entries()) {
    const id = `gap:${index + 1}`;
    addNode({ id, label: gap, type: 'gap', reviewState: 'proposed', entityType: 'Risk', provenance: 'readiness diagnostics' });
    addEdge({ id: `${id}-review`, source: id, target: 'core:source', label: 'needs review', reviewState: 'proposed', relationshipType: 'triggers_risk' });
  }
  if (!input.evidence.sourceCount) {
    addNode({ id: 'gap:no-sources', label: 'No attached sources', type: 'gap', reviewState: 'missing', entityType: 'Risk', provenance: 'source readiness gate' });
    addEdge({ id: 'gap-no-sources-core', source: 'gap:no-sources', target: 'core:source', label: 'blocks evidence', reviewState: 'missing', relationshipType: 'requires_resource' });
  }
  for (const memory of input.tacitKnowledge.items) {
    addNode({
      id: `memory:${memory.id}`,
      label: memory.summary,
      type: 'memory',
      reviewState: memory.reviewState,
      detail: memory.detail ?? undefined,
      entityType: 'Narrative',
      provenance: memory.type,
      confidence: memory.confidence,
    });
    addEdge({ id: `memory-${memory.id}-core`, source: `memory:${memory.id}`, target: 'core:memory', label: 'travels as context', reviewState: memory.reviewState, relationshipType: 'reinforces' });
  }
  for (const output of input.outputs) {
    addNode({ id: `output:${output.id}`, label: output.label, type: 'output', reviewState: output.reviewState, entityType: 'Policy', provenance: output.type, version: input.capsule.version ?? null });
    addEdge({ id: `output-${output.id}-core`, source: 'core:output', target: `output:${output.id}`, label: 'produces', reviewState: output.reviewState, relationshipType: 'generates_claim' });
  }
  for (const run of input.agentRuns) {
    addNode({ id: `agent:${run.runId}`, label: run.policyAgentLabel ?? run.policyAgentId ?? 'Agent run', type: 'agent', reviewState: 'canonical', detail: run.status, entityType: 'Actor', provenance: run.createdAt ?? 'agent run receipt' });
    addEdge({ id: `agent-${run.runId}-capsule`, source: `agent:${run.runId}`, target: `capsule:${input.capsule.capsuleId}`, label: 'reads capsule', reviewState: 'canonical', relationshipType: 'claims' });
  }
  for (const ontology of [...input.ontology.active, ...input.ontology.proposed, ...input.ontology.missing]) {
    addNode({ id: `ontology:${ontology.id}`, label: ontology.label, type: 'ontology', reviewState: ontology.reviewState, detail: ontology.requiredRelations.join(', '), entityType: 'Institution', provenance: 'ACO ontology overlay' });
    addEdge({ id: `ontology-${ontology.id}-graph`, source: `ontology:${ontology.id}`, target: 'core:graph', label: 'structures graph', reviewState: ontology.reviewState, relationshipType: 'governs' });
  }
  for (const card of input.reviewQueue) {
    addNode({ id: `review:${card.id}`, label: card.title, type: 'review', reviewState: card.reviewState, detail: card.target, entityType: 'Commitment', provenance: card.sourceType });
    addEdge({ id: `review-${card.id}-capsule`, source: `review:${card.id}`, target: `capsule:${input.capsule.capsuleId}`, label: 'needs approval', reviewState: card.reviewState, relationshipType: 'made_commitment' });
  }
  for (const proposal of graphProposalsFromUnknown(input.capsule.memoryPosture)) {
    if (proposal.kind === 'node' && proposal.operation !== 'delete') {
      const nodeId = graphProposalNodeId(proposal.payload.id);
      addNode({
        id: nodeId,
        label: proposal.payload.label,
        type: graphDisplayTypeForEntity(proposal.payload.entityType),
        reviewState: 'reviewed',
        detail: proposal.payload.reason || 'Approved graph proposal.',
        entityType: proposal.payload.entityType,
        provenance: proposal.payload.provenance || 'approved graph proposal',
        confidence: proposal.payload.confidence,
        sourceReceiptIds: proposal.payload.sourceReceiptIds,
      });
      addEdge({
        id: `${proposal.proposalId}-capsule`,
        source: nodeId,
        target: `capsule:${input.capsule.capsuleId}`,
        label: 'approved into graph',
        reviewState: 'reviewed',
        relationshipType: 'member_of',
        confidence: proposal.payload.confidence,
        sourceReceiptIds: proposal.payload.sourceReceiptIds,
      });
    }
    if (proposal.kind === 'edge' && proposal.operation !== 'delete') {
      const source = graphProposalNodeId(proposal.payload.source);
      const target = graphProposalNodeId(proposal.payload.target);
      if (!nodes.some((node) => node.id === source)) {
        addNode({ id: source, label: humanizeId(proposal.payload.source), type: 'ontology', reviewState: 'reviewed', entityType: 'Policy', provenance: 'approved graph proposal endpoint' });
      }
      if (!nodes.some((node) => node.id === target)) {
        addNode({ id: target, label: humanizeId(proposal.payload.target), type: 'ontology', reviewState: 'reviewed', entityType: 'Policy', provenance: 'approved graph proposal endpoint' });
      }
      addEdge({
        id: proposal.payload.id || proposal.proposalId,
        source,
        target,
        label: proposal.payload.label || proposal.payload.relationshipType || 'related to',
        reviewState: 'reviewed',
        relationshipType: proposal.payload.relationshipType,
        confidence: proposal.payload.confidence,
        sourceReceiptIds: proposal.payload.sourceReceiptIds,
      });
    }
  }
  addGraphLiteProjection(input.capsule, addNode, addEdge);

  const canonicalNodeCount = nodes.filter((node) => node.reviewState === 'canonical' || node.reviewState === 'reviewed').length;
  return {
    nodes,
    edges,
    canonicalNodeCount,
    proposedNodeCount: nodes.length - canonicalNodeCount,
  };
}

function scoreForCapsule(capsule: CapsuleWorkbenchCapsuleInput): number {
  const explicit = capsule.readiness?.score ?? capsule.health?.score ?? capsule.trust?.score;
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return Math.round(clamp(explicit, 0, 100));
  const refs = capsule.coreRefs ?? {};
  const presentCores = buildAnatomy(refs).filter((core) => core.status === 'present').length;
  return Math.round((presentCores / CORE_ORDER.length) * 100);
}

function tierForScore(score: number): 'red' | 'amber' | 'green' {
  if (score >= 75) return 'green';
  if (score >= 45) return 'amber';
  return 'red';
}

function inferJurisdiction(capsule: CapsuleWorkbenchCapsuleInput): string | undefined {
  const text = `${capsule.label} ${capsule.summary ?? ''} ${cleanStrings(capsule.community?.tags).join(' ')}`.toLowerCase();
  if (/\bus federal\b|\bfederal\b|\bcongress\b|\bagency\b/.test(text)) return 'U.S. federal';
  if (/\beu\b|european union/.test(text)) return 'EU';
  if (/\bun\b|united nations/.test(text)) return 'UN / multilateral';
  return undefined;
}

function inferDomain(capsule: CapsuleWorkbenchCapsuleInput): string | undefined {
  const tags = cleanStrings(capsule.community?.tags);
  const taggedDomain = tags.find((tag) => tag.startsWith('domain:'))?.replace('domain:', '');
  if (taggedDomain) return humanizeId(taggedDomain);
  const path = capsule.coreRefs?.pathCoreId;
  return path ? humanizeId(path) : undefined;
}

function inferOutputGoal(capsule: CapsuleWorkbenchCapsuleInput, outputs: CapsuleOutputDisplay[]): string | undefined {
  if (outputs[0]) return outputs[0].label;
  const tag = cleanStrings(capsule.community?.tags).find((item) => item.startsWith('type:') || item.startsWith('output:'));
  return tag ? humanizeId(tag.replace(/^type:/, '').replace(/^output:/, '')) : undefined;
}

function nextActionForCapsule(
  evidence: CapsuleEvidenceDisplay,
  warnings: string[],
  reviewQueue: CapsuleReviewCardDisplay[],
): string {
  if (warnings[0]) return warnings[0];
  if (!evidence.sourceCount) return 'Attach sources or create a source-gap review card.';
  if (evidence.unsupportedClaims.length) return 'Run sourceability and add missing evidence.';
  if (reviewQueue.length) return 'Review proposed capsule changes before export.';
  return 'Ask PRAXIS or open a draft from this capsule.';
}

function claimBucketsFromUnknown(value: unknown): {
  supported: string[];
  weak: string[];
  unsupported: string[];
  assumptions: string[];
} {
  const buckets = { supported: [] as string[], weak: [] as string[], unsupported: [] as string[], assumptions: [] as string[] };
  if (!Array.isArray(value)) return buckets;
  for (const item of value) {
    const record = asRecord(item);
    if (!record) continue;
    const text = cleanText(record.text) || cleanText(record.claim) || cleanText(record.claimText);
    if (!text) continue;
    const status = cleanText(record.status).toLowerCase();
    if (/support/.test(status)) buckets.supported.push(text);
    else if (/weak|partial/.test(status)) buckets.weak.push(text);
    else if (/unsupported|missing/.test(status)) buckets.unsupported.push(text);
    else if (/assumption|assumed/.test(status)) buckets.assumptions.push(text);
  }
  return buckets;
}

interface CapsuleGraphSourceItem {
  id: string;
  label: string;
  detail?: string;
  entityType?: string;
  provenance?: string;
  confidence?: number | null;
  reviewState: CapsuleWorkbenchReviewState;
}

interface CapsuleGraphClaimItem {
  id: string;
  text: string;
  status: string;
  sourceIds: string[];
  provenance?: string;
  confidence?: number | null;
  reviewState: CapsuleWorkbenchReviewState;
}

interface CapsuleGraphProposalItem {
  proposalId: string;
  kind: 'node' | 'edge';
  operation: 'create' | 'edit' | 'delete';
  payload: {
    id: string;
    source: string;
    target: string;
    label: string;
    entityType: string;
    relationshipType?: string;
    provenance?: string;
    reason?: string;
    confidence?: number | null;
    sourceReceiptIds?: string[];
  };
}

interface GraphLiteProjectionItem {
  projectionId: string;
  status: string;
  namedGraph: string;
  canonicalStore: string;
  promotionGate: string;
  nodeCount: number;
  edgeCount: number;
  nodes: Array<{
    id: string;
    label: string;
    entityType: string;
    reviewState: CapsuleWorkbenchReviewState;
    confidence: number | null;
    sourceReceiptIds: string[];
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    relationshipType?: string;
    reviewState: CapsuleWorkbenchReviewState;
    confidence: number | null;
    sourceReceiptIds: string[];
  }>;
}

function sourceItemsFromUnknown(value: unknown): CapsuleGraphSourceItem[] {
  if (!Array.isArray(value)) return [];
  return uniqueBy(value.flatMap((item): CapsuleGraphSourceItem[] => {
    if (typeof item === 'string') {
      const id = item.trim();
      return id ? [{ id, label: humanizeId(id), reviewState: 'canonical' }] : [];
    }
    const record = asRecord(item);
    if (!record) return [];
    const id = cleanText(record.id) || cleanText(record.sourceId) || cleanText(record.receiptId);
    if (!id) return [];
    const label = cleanText(record.label) || cleanText(record.title) || cleanText(record.name) || humanizeId(id);
    return [{
      id,
      label,
      detail: cleanText(record.summary) || cleanText(record.description) || cleanText(record.url) || undefined,
      entityType: cleanText(record.entityType) || cleanText(record.type) || 'Resource',
      provenance: cleanText(record.provenance) || cleanText(record.sourceType) || cleanText(record.publisher) || undefined,
      confidence: confidenceFromUnknown(record.confidence ?? record.score),
      reviewState: reviewStateFrom(record.reviewState ?? record.status ?? 'canonical'),
    }];
  }), (source) => source.id);
}

function claimItemsFromUnknown(value: unknown): CapsuleGraphClaimItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index): CapsuleGraphClaimItem[] => {
    const record = asRecord(item);
    const text = typeof item === 'string'
      ? item.trim()
      : record
        ? cleanText(record.text) || cleanText(record.claim) || cleanText(record.claimText) || cleanText(record.summary)
        : '';
    if (!text) return [];
    const id = record
      ? cleanText(record.id) || cleanText(record.claimId) || cleanText(record.uid) || slugId(text, `claim-${index + 1}`)
      : slugId(text, `claim-${index + 1}`);
    const status = record ? cleanText(record.status) || cleanText(record.reviewState) : '';
    const sourceIds = record ? uniqueStrings([
      ...cleanStrings(record.sourceIds),
      ...cleanStrings(record.receiptIds),
      ...cleanStrings(record.evidenceIds),
      cleanText(record.sourceId),
      cleanText(record.receiptId),
    ]) : [];
    return [{
      id,
      text,
      status,
      sourceIds,
      provenance: record ? cleanText(record.provenance) || cleanText(record.generatedBy) || undefined : undefined,
      confidence: record ? confidenceFromUnknown(record.confidence ?? record.score) : null,
      reviewState: reviewStateForClaim(status, sourceIds.length),
    }];
  });
}

function graphProposalsFromUnknown(value: unknown): CapsuleGraphProposalItem[] {
  const record = asRecord(value);
  if (!record || !Array.isArray(record.graphProposals)) return [];
  return record.graphProposals.flatMap((item): CapsuleGraphProposalItem[] => {
    const proposal = asRecord(item);
    const payload = asRecord(proposal?.payload);
    if (!proposal || !payload) return [];
    const kind = proposal.kind === 'edge' ? 'edge' : proposal.kind === 'node' ? 'node' : null;
    if (!kind) return [];
    return [{
      proposalId: cleanText(proposal.proposalId) || slugId(JSON.stringify(payload), 'graph-proposal'),
      kind,
      operation: proposal.operation === 'edit' || proposal.operation === 'delete' ? proposal.operation : 'create',
      payload: {
        id: cleanText(payload.id),
        source: cleanText(payload.source),
        target: cleanText(payload.target),
        label: cleanText(payload.label),
        entityType: cleanText(payload.entityType) || 'Policy',
        relationshipType: cleanText(payload.relationshipType) || undefined,
        provenance: cleanText(payload.provenance) || undefined,
        reason: cleanText(payload.reason) || undefined,
        confidence: confidenceFromUnknown(payload.confidence),
        sourceReceiptIds: cleanStrings(payload.sourceReceiptIds),
      },
    }];
  });
}

function addGraphLiteProjection(
  capsule: CapsuleWorkbenchCapsuleInput,
  addNode: (node: CapsuleGraphNodeDisplay) => void,
  addEdge: (edge: CapsuleGraphEdgeDisplay) => void,
) {
  const projection = graphLiteProjectionFromCapsule(capsule);
  if (!projection) return;

  const projectionNodeId = `graphlite:${projection.projectionId}`;
  addNode({
    id: projectionNodeId,
    label: 'GraphLite advisory projection',
    type: 'ontology',
    reviewState: 'advisory',
    detail: `${projection.status}; ${projection.namedGraph}; ${projection.nodeCount} nodes, ${projection.edgeCount} edges. ${projection.canonicalStore} canonical.`,
    entityType: 'Policy',
    provenance: 'GraphLite advisory projection',
    confidence: 0.6,
  });
  addEdge({
    id: `graphlite-${projection.projectionId}-capsule`,
    source: projectionNodeId,
    target: `capsule:${capsule.capsuleId}`,
    label: 'derived from',
    reviewState: 'advisory',
    relationshipType: 'derived_from',
  });

  for (const node of projection.nodes) {
    const id = `graphlite:${node.id}`;
    addNode({
      id,
      label: node.label,
      type: graphDisplayTypeForEntity(node.entityType),
      reviewState: 'advisory',
      detail: node.reviewState === 'reviewed' ? 'Reviewed inside GraphLite projection; Firestore promotion still requires a review card.' : projection.promotionGate,
      entityType: node.entityType,
      provenance: 'GraphLite advisory projection',
      confidence: node.confidence,
      sourceReceiptIds: node.sourceReceiptIds,
    });
    addEdge({
      id: `graphlite-node:${projection.projectionId}:${node.id}`,
      source: projectionNodeId,
      target: id,
      label: 'projects',
      reviewState: 'advisory',
      relationshipType: 'projects',
      confidence: node.confidence,
      sourceReceiptIds: node.sourceReceiptIds,
    });
  }

  for (const edge of projection.edges) {
    addEdge({
      id: `graphlite-edge:${edge.id}`,
      source: `graphlite:${edge.source}`,
      target: `graphlite:${edge.target}`,
      label: edge.label,
      reviewState: 'advisory',
      relationshipType: edge.relationshipType,
      confidence: edge.confidence,
      sourceReceiptIds: edge.sourceReceiptIds,
    });
  }
}

function graphLiteProjectionFromCapsule(capsule: CapsuleWorkbenchCapsuleInput): GraphLiteProjectionItem | null {
  const grounding = asRecord(capsule.grounding);
  const starterSnapshot = asRecord(capsule.starterSnapshot);
  const candidate = firstRecord(
    capsule.graphLiteProjection,
    capsule.embeddedGraph,
    grounding?.embeddedGraph,
    starterSnapshot?.graphLiteProjection,
  );
  if (!candidate || cleanText(candidate.provider) !== 'graphlite') return null;
  const projectionId = cleanText(candidate.projectionId);
  if (!projectionId) return null;
  const nodes = graphLiteNodesFromUnknown(candidate.nodes);
  const edges = graphLiteEdgesFromUnknown(candidate.edges);
  return {
    projectionId,
    status: cleanText(candidate.status) || 'compiled-advisory',
    namedGraph: cleanText(candidate.namedGraph) || projectionId,
    canonicalStore: cleanText(candidate.canonicalStore) || 'Firestore ContextCapsules',
    promotionGate: cleanText(candidate.promotionGate) || 'Human review-card approval required before canonical graph promotion.',
    nodeCount: typeof candidate.nodeCount === 'number' ? candidate.nodeCount : nodes.length,
    edgeCount: typeof candidate.edgeCount === 'number' ? candidate.edgeCount : edges.length,
    nodes,
    edges,
  };
}

function graphLiteNodesFromUnknown(value: unknown): GraphLiteProjectionItem['nodes'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): GraphLiteProjectionItem['nodes'] => {
    const record = asRecord(item);
    const id = cleanText(record?.id);
    if (!id) return [];
    return [{
      id,
      label: cleanText(record?.label) || humanizeId(id),
      entityType: cleanText(record?.entityType) || 'Policy',
      reviewState: reviewStateFrom(record?.reviewState ?? 'advisory'),
      confidence: confidenceFromUnknown(record?.confidence),
      sourceReceiptIds: cleanStrings(record?.sourceReceiptIds),
    }];
  });
}

function graphLiteEdgesFromUnknown(value: unknown): GraphLiteProjectionItem['edges'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index): GraphLiteProjectionItem['edges'] => {
    const record = asRecord(item);
    const source = cleanText(record?.source);
    const target = cleanText(record?.target);
    if (!source || !target) return [];
    return [{
      id: cleanText(record?.id) || `edge-${index + 1}`,
      source,
      target,
      label: cleanText(record?.label) || cleanText(record?.relationshipType) || 'related to',
      relationshipType: cleanText(record?.relationshipType) || undefined,
      reviewState: reviewStateFrom(record?.reviewState ?? 'advisory'),
      confidence: confidenceFromUnknown(record?.confidence),
      sourceReceiptIds: cleanStrings(record?.sourceReceiptIds),
    }];
  });
}

function firstRecord(...values: unknown[]): Record<string, unknown> | null {
  return values.find((value): value is Record<string, unknown> => Boolean(asRecord(value))) ?? null;
}

function sourceIdsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return [item];
    const record = asRecord(item);
    if (!record) return [];
    return [cleanText(record.id), cleanText(record.sourceId), cleanText(record.receiptId)].filter(Boolean);
  });
}

function outputLabelsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return [humanizeId(item)];
    const record = asRecord(item);
    if (!record) return [];
    return [cleanText(record.label), cleanText(record.title), cleanText(record.outputTarget)].filter(Boolean);
  });
}

function memoryFactsFromUnknown(value: unknown): { canonical: string[]; advisory: string[] } {
  const record = asRecord(value);
  if (!record) return { canonical: [], advisory: [] };
  const canonical = arrayText(record.canonicalCapsuleFacts);
  const advisory = arrayText(record.advisoryCogneeRecall).map((item) => {
    const nested = asRecord(item);
    return nested ? cleanText(nested.text) || cleanText(nested.summary) : item;
  }).filter(Boolean);
  return { canonical, advisory };
}

function reviewStateFrom(value: unknown): CapsuleWorkbenchReviewState {
  const state = cleanText(value).toLowerCase();
  if (/approved|applied|canonical/.test(state)) return 'reviewed';
  if (/advisory/.test(state)) return 'advisory';
  if (/missing/.test(state)) return 'missing';
  return 'proposed';
}

function reviewStateForClaim(status: string, sourceCount: number): CapsuleWorkbenchReviewState {
  const cleanStatus = status.toLowerCase();
  if (/unsupported|missing|gap/.test(cleanStatus)) return 'proposed';
  if (/weak|partial|stale|disputed/.test(cleanStatus)) return 'proposed';
  if (/support|canonical|approved|reviewed/.test(cleanStatus) && sourceCount > 0) return 'canonical';
  return sourceCount > 0 ? 'canonical' : 'proposed';
}

function confidenceFromUnknown(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(clamp(value > 1 ? value / 100 : value, 0, 1) * 1000) / 1000;
}

function confidenceFromScore(value: number): number {
  return Math.round(clamp(value / 100, 0, 1) * 1000) / 1000;
}

function graphProposalNodeId(value: string): string {
  const clean = cleanText(value);
  if (!clean) return 'graph:proposal-node';
  return clean.includes(':') ? clean : `graph:${clean}`;
}

function graphDisplayTypeForEntity(value: string): CapsuleGraphNodeDisplay['type'] {
  const clean = value.toLowerCase();
  if (clean === 'claim') return 'claim';
  if (clean === 'resource') return 'source';
  if (clean === 'risk') return 'gap';
  if (clean === 'narrative') return 'memory';
  if (clean === 'actor') return 'agent';
  if (clean === 'institution' || clean === 'norm') return 'ontology';
  return 'ontology';
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map(cleanText).filter(Boolean);
}

function arrayText(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return [item.trim()];
    const record = asRecord(item);
    if (!record) return [];
    return [cleanText(record.text), cleanText(record.summary), cleanText(record.title)].filter(Boolean);
  }).filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function uniqueBy<T>(values: T[], keyOf: (value: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const value of values) {
    const key = keyOf(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function humanizeId(value: string): string {
  return value
    .replace(/^[a-z]+:/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugId(value: string, fallback: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || fallback;
}

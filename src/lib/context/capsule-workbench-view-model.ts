import { TACITUS_CORE_PRIMITIVES, type TacitusCorePrimitive } from '@/lib/graph/core-primitives';
import { summarizeOntologyMapping } from '@/lib/ontology/registry';
import { getDomainOntologyCards, WORK_ONTOLOGIES, type WorkOntologyId } from '@/lib/ontology/work-ontologies';
import { deriveCapsuleQuality, type CapsuleQualityBreakdownId } from '@/lib/context/capsule-quality';
import {
  CAPSULE_CANONICAL_CATEGORY_DEFINITIONS,
  type CanonicalCapsuleCategoryId,
} from '@/lib/context/capsule-categories';

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
  sourceRefs?: unknown;
  claimLedger?: unknown;
  outputContracts?: unknown[];
  memoryPosture?: unknown;
  humanTacitKnowledge?: unknown;
  sourceSpine?: unknown;
  contextCaptureProfile?: unknown;
  agentOperatingContract?: unknown;
  agentPermissions?: unknown;
  governance?: unknown;
  marketplaceProfile?: unknown;
  evaluation?: unknown;
  temporality?: unknown;
  causality?: unknown;
  ontologyBinding?: unknown;
  bestNextAction?: string | null;
  purpose?: string | null;
  audience?: unknown;
  sourcePosture?: unknown;
  decisionHorizon?: unknown;
  expiry?: string | null;
  reviewState?: unknown;
  provenance?: unknown;
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
  evidence?: Array<{ id?: string | null; label?: string | null; sourceType?: string | null; advisory?: boolean | null }> | null;
  proposedEnvelopePatch?: unknown;
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

export interface CapsuleCoreSourceabilityGate {
  kind: Extract<CapsuleWorkbenchCoreKind, 'user' | 'situation' | 'source' | 'document' | 'output'>;
  label: string;
  sourceCoverageScore: number;
  threshold: number;
  evidenceGapCount: number;
  unsupportedClaimCount: number;
  unsupportedClaims: string[];
  gapLabels: string[];
  ready: boolean;
  readyBlocked: boolean;
  provenance: 'capsule-evidence-pack';
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
  type: 'capsule' | 'core' | 'source' | 'document' | 'claim' | 'gap' | 'memory' | 'output' | 'agent' | 'ontology' | 'review' | 'boundary';
  reviewState: CapsuleWorkbenchReviewState;
  detail?: string;
  entityType?: string;
  provenance?: string;
  confidence?: number | null;
  confidenceKind?: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' | 'ASSESSED';
  sourceReceiptIds?: string[];
  linkedClaimIds?: string[];
  version?: number | null;
  validFrom?: string;
  validUntil?: string;
  asOf?: string;
  recordedAt?: string;
  invalidatedAt?: string;
  supersededBy?: string;
  invalidationReason?: 'CONTRADICTED' | 'SOURCE_RETRACTED' | 'TEMPORAL_EXPIRY' | 'HUMAN_OVERRIDE';
  rationale?: string;
  derivedFrom?: string[];
  generatedBy?: {
    actorType: 'model' | 'human';
    actorId: string;
    at: string;
    activity: 'extraction' | 'proposal' | 'review_decision' | 'import' | 'quality_review';
  };
}

export interface CapsuleGraphEdgeDisplay {
  id: string;
  source: string;
  target: string;
  label: string;
  reviewState: CapsuleWorkbenchReviewState;
  relationshipType?: string;
  provenance?: string;
  judgeRationale?: string;
  confidence?: number | null;
  confidenceKind?: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' | 'ASSESSED';
  sourceReceiptIds?: string[];
  validFrom?: string;
  validUntil?: string;
  asOf?: string;
  recordedAt?: string;
  invalidatedAt?: string;
  supersededBy?: string;
  invalidationReason?: 'CONTRADICTED' | 'SOURCE_RETRACTED' | 'TEMPORAL_EXPIRY' | 'HUMAN_OVERRIDE';
  rationale?: string;
  derivedFrom?: string[];
  generatedBy?: {
    actorType: 'model' | 'human';
    actorId: string;
    at: string;
    activity: 'extraction' | 'proposal' | 'review_decision' | 'import' | 'quality_review';
  };
}

export interface CapsuleGraphDisplay {
  nodes: CapsuleGraphNodeDisplay[];
  edges: CapsuleGraphEdgeDisplay[];
  canonicalNodeCount: number;
  proposedNodeCount: number;
  stats: CapsuleGraphStatsDisplay;
}

export interface CapsuleGraphStatsDisplay {
  totalNodes: number;
  totalEdges: number;
  sourceBackedClaims: number;
  unsupportedClaims: number;
  boundaryNodes: number;
  reviewGatedNodes: number;
  temporalNodes: number;
  provenanceCoveragePct: number;
  densityLabel: string;
}

export interface CapsuleOntologyItemDisplay {
  id: string;
  label: string;
  role: 'active' | 'proposed' | 'missing';
  primitiveCoverage: TacitusCorePrimitive[];
  missingPrimitives: TacitusCorePrimitive[];
  coverageRatio: number;
  requiredRelations: string[];
  reviewState: CapsuleWorkbenchReviewState;
  validatorSummary: {
    passed: number;
    warnings: number;
    total: number;
    passRate: number;
    labels: string[];
  };
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
  why: string;
  evidenceLabels: string[];
  impact: string;
  allowedActions: Array<'approve' | 'reject'>;
}

export type CapsuleWorkbenchPillarId = CanonicalCapsuleCategoryId;

export interface CapsulePillarDisplay {
  id: CapsuleWorkbenchPillarId;
  title: string;
  description: string;
  inspectionFocus: string;
  mappedCoreKinds: string[];
  sections: string[];
  facts: Array<{
    label: string;
    value: string;
    reviewState: CapsuleWorkbenchReviewState;
  }>;
}

export interface CapsuleTimelineItemDisplay {
  id: string;
  label: string;
  start: string;
  end: string | null;
  group: string;
  kind: string;
  confidence: number | null;
  nodeIds: string[];
  sourceIds: string[];
}

export interface CapsuleTimelineDisplay {
  asOf: string | null;
  validFrom: string | null;
  validUntil: string | null;
  groups: string[];
  items: CapsuleTimelineItemDisplay[];
}

export interface CapsuleCausalChainDisplay {
  id: string;
  cause: string;
  effect: string;
  relation: string;
  direction: 'causal' | 'enabling' | 'blocking' | 'escalation' | 'de-escalation';
  confidence: number | null;
  caveat: string | null;
  nodeIds: string[];
  sourceIds: string[];
  reviewState: CapsuleWorkbenchReviewState;
}

export interface CapsuleQualityDisplay {
  score: number;
  sections: Array<{
    id: CapsuleQualityBreakdownId;
    label: string;
    score: number;
    maxScore: number;
    diagnostics: string[];
    fixTarget: {
      target: string;
      builderStep: string;
      label: 'Fix this';
      reviewCardId: string | null;
    };
  }>;
  diagnostics: string[];
}

export interface CapsuleClaimReceiptDisplay {
  sourceId: string;
  url: string | null;
  publisher: string | null;
  date: string | null;
  reliabilityTier: number | string | null;
  snippet: string;
  charOffset: string | number | null;
  page: string | number | null;
  embedding: number[] | null;
  confidence: number | null;
  stance: string | null;
}

export interface CapsuleClaimDisplay {
  claimId: string;
  text: string;
  support: string;
  validFrom: string | null;
  validUntil: string | null;
  asOf: string | null;
  causalLinks: Record<string, string[]>;
  receipts: CapsuleClaimReceiptDisplay[];
  sourceIds: string[];
  provenance?: string;
  confidence: number | null;
  reviewState: CapsuleWorkbenchReviewState;
}

export interface CapsuleResearchSourceDisplay {
  sourceId: string;
  label: string;
  url: string | null;
  publisher: string | null;
  date: string | null;
  reliabilityTier: number | string | null;
  role: string;
  rationale: string | null;
}

export interface CapsuleResearchDisplay {
  dossierId: string;
  status: string;
  humanJob: string;
  realWorldScenario: string;
  howHumanUsesCapsule: string;
  sourceSpine: CapsuleResearchSourceDisplay[];
  sourceSpineCount: number;
  evidenceGaps: string[];
  evidenceGapCount: number;
  nextHumanActions: string[];
  unsupportedClaimCount: number;
  claimPosture: {
    supported: number;
    weak: number;
    missing: number;
    stale: number;
    reviewGate: string;
  };
  workflow: {
    workflowId: string;
    humanRole: string;
    scenario: string;
    steps: string[];
    outputPath: string;
    humanReviewGate: string;
    nextActions: string[];
  };
  refresh: {
    status: string;
    cadence: string;
    sourceCount: number;
    staleSourceCount: number;
    missingEvidenceGapCount: number;
    nextRepairActions: string[];
    humanReviewRequired: boolean;
  };
  graphProjection: {
    provider: 'graphlite' | string;
    status: string;
    namedGraph: string;
    nodeCount: number;
    edgeCount: number;
    advisoryOnly: boolean;
    canonicalStore: string;
    promotionGate: string;
  };
  ontologyCoverage: {
    activeOntologyIds: string[];
    graphNodeTypes: string[];
    graphEdgeTypes: string[];
    activeCount: number;
    proposedCount: number;
    missingCount: number;
    coveredPrimitiveCount: number;
    missingPrimitives: string[];
  };
  reasoningPolicy: {
    operation: string;
    activationCriteria: string[];
    outputGrammar: string[];
    reviewGate: string;
  };
  reviewGates: string[];
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
  coreSourceability: CapsuleCoreSourceabilityGate[];
  graph: CapsuleGraphDisplay;
  ontology: CapsuleOntologyDisplay;
  tacitKnowledge: CapsuleTacitKnowledgeDisplay;
  agents: CapsuleAgentWorkflowDisplay;
  outputs: CapsuleOutputDisplay[];
  reviewQueue: CapsuleReviewCardDisplay[];
  pillars: CapsulePillarDisplay[];
  timeline: CapsuleTimelineDisplay;
  causalChains: CapsuleCausalChainDisplay[];
  quality: CapsuleQualityDisplay;
  claims: CapsuleClaimDisplay[];
  research: CapsuleResearchDisplay;
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

const SOURCEABILITY_CORE_ORDER: Array<CapsuleCoreSourceabilityGate['kind']> = ['user', 'situation', 'source', 'document', 'output'];
const SOURCEABILITY_READY_THRESHOLD = 70;

export function buildCapsuleWorkbenchViewModel(input: CapsuleWorkbenchViewModelInput): CapsuleWorkbenchViewModel {
  const capsule = input.capsule;
  const coreRefs = capsule.coreRefs ?? {};
  const warnings = cleanStrings(capsule.health?.warnings);
  const blockers = cleanStrings(capsule.health?.blockers);
  const diagnostics = [...blockers, ...warnings].slice(0, 8);
  const score = scoreForCapsule(capsule);
  const anatomy = buildAnatomy(coreRefs);
  const claims = buildClaims(capsule.claimLedger);
  const evidence = buildEvidence(capsule, input.repositoryDocuments ?? []);
  const outputs = buildOutputs(coreRefs, capsule.outputContracts);
  const coreSourceability = buildCoreSourceability({
    anatomy,
    evidence,
    claims,
    outputs,
  });
  const tacitKnowledge = buildTacitKnowledge(capsule, input.tacitMemories ?? []);
  const reviewQueue = buildReviewQueue(capsule, input.reviewCards ?? [], evidence);
  const ontology = buildOntology(capsule, coreRefs);
  const agents = buildAgentWorkflow(input.agentRuns ?? [], evidence, reviewQueue);
  const timeline = buildTimeline(capsule, claims);
  const causalChains = buildCausalChains(capsule, claims);
  const quality = buildQuality(capsule, reviewQueue);
  const pillars = buildPillars({
    anatomy,
    evidence,
    tacitKnowledge,
    agents,
    outputs,
    reviewQueue,
    ontology,
    timeline,
    causalChains,
    quality,
    claims,
  });
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
  const research = buildResearchDisplay({
    capsule,
    evidence,
    claims,
    ontology,
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
    coreSourceability,
    graph,
    ontology,
    tacitKnowledge,
    agents,
    outputs,
    reviewQueue,
    pillars,
    timeline,
    causalChains,
    quality,
    claims,
    research,
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

function buildResearchDisplay(input: {
  capsule: CapsuleWorkbenchCapsuleInput;
  evidence: CapsuleEvidenceDisplay;
  claims: CapsuleClaimDisplay[];
  ontology: CapsuleOntologyDisplay;
}): CapsuleResearchDisplay {
  const { capsule, evidence, claims, ontology } = input;
  const grounding = asRecord(capsule.grounding);
  const starterSnapshot = asRecord(capsule.starterSnapshot);
  const dossier = firstRecord(
    grounding?.researchDossier,
    starterSnapshot?.researchDossier,
  );
  const claimLedgerSeeds = firstRecord(
    grounding?.claimLedgerSeeds,
    starterSnapshot?.claimLedgerSeeds,
  );
  const workflow = firstRecord(
    grounding?.humanWorkflowExample,
    starterSnapshot?.humanWorkflowExample,
    starterSnapshot?.intelligenceProfile && asRecord(starterSnapshot.intelligenceProfile)?.humanWorkflow,
  );
  const refreshDocket = firstRecord(
    grounding?.sourceRefreshDocket,
    starterSnapshot?.sourceRefreshDocket,
  );
  const projectionCandidate = firstRecord(
    grounding?.embeddedGraph,
    capsule.embeddedGraph,
    capsule.graphLiteProjection,
    starterSnapshot?.embeddedGraph,
    starterSnapshot?.graphLiteProjection,
  );
  const ontologyOverlay = firstRecord(
    grounding?.ontologyOverlay,
    starterSnapshot?.ontologyOverlay,
  );
  const deviceProfile = firstRecord(
    grounding?.deviceProfile,
    starterSnapshot?.deviceProfile,
  );
  const sourceSpine = sourceSpineFromUnknown(dossier?.sourceSpine);
  const claimPosture = claimPostureFromUnknown(claimLedgerSeeds, claims);
  const dossierEvidenceGaps = uniqueStrings([
    ...cleanStrings(dossier?.knownEvidenceGaps),
    ...cleanStrings(refreshDocket?.missingEvidenceGaps),
  ]);
  const evidenceGaps = uniqueStrings([
    ...dossierEvidenceGaps,
    ...evidence.gaps,
  ]);
  const nextHumanActions = uniqueStrings([
    ...cleanStrings(dossier?.nextHumanActions),
    ...cleanStrings(refreshDocket?.nextRepairActions),
    ...cleanStrings(workflow?.nextActions),
    ...input.evidence.dateChecks,
  ]);
  const graphProjection = graphProjectionResearchFromUnknown(projectionCandidate);
  const workflowDisplay = workflowResearchFromUnknown(workflow, nextHumanActions);
  const refresh = refreshResearchFromUnknown(refreshDocket, dossier, sourceSpine, evidenceGaps);
  const reasoningPolicy = reasoningPolicyFromUnknown(deviceProfile);

  return {
    dossierId: cleanText(dossier?.dossierId) || `${capsule.capsuleId}-research-dossier`,
    status: cleanText(dossier?.status) || 'capsule-research-display',
    humanJob: cleanText(dossier?.humanJob) || 'Human reviewer needs the capsule research posture, source receipts, claim gaps, and review gates before relying on the capsule.',
    realWorldScenario: cleanText(dossier?.realWorldScenario) || cleanText(capsule.summary) || 'Inspect this capsule before using it for sourced policy work.',
    howHumanUsesCapsule: cleanText(dossier?.howHumanUsesCapsule) || 'Open Inspect, review source receipts, check unsupported claims, refresh stale sources, and keep graph proposals review-gated.',
    sourceSpine,
    sourceSpineCount: sourceSpine.length,
    evidenceGaps,
    evidenceGapCount: dossierEvidenceGaps.length || evidenceGaps.length,
    nextHumanActions,
    unsupportedClaimCount: evidence.unsupportedClaims.length,
    claimPosture,
    workflow: workflowDisplay,
    refresh,
    graphProjection,
    ontologyCoverage: ontologyCoverageFromUnknown(ontologyOverlay, ontology),
    reasoningPolicy,
    reviewGates: uniqueStrings(cleanStrings([
      claimPosture.reviewGate,
      workflowDisplay.humanReviewGate,
      graphProjection.promotionGate,
      reasoningPolicy.reviewGate,
      cleanText(dossier?.claimReviewPolicy),
      refresh.humanReviewRequired ? 'Human review required before accepting the source refresh docket.' : null,
    ])),
  };
}

function sourceSpineFromUnknown(value: unknown): CapsuleResearchSourceDisplay[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): CapsuleResearchSourceDisplay[] => {
    const record = asRecord(item);
    const sourceId = cleanText(record?.sourceId) || cleanText(record?.id);
    if (!sourceId) return [];
    return [{
      sourceId,
      label: cleanText(record?.label) || cleanText(record?.title) || humanizeId(sourceId),
      url: cleanText(record?.url),
      publisher: cleanText(record?.publisher),
      date: cleanText(record?.date),
      reliabilityTier: scalarStringOrNumber(record?.reliabilityTier),
      role: cleanText(record?.role) || 'source-receipt',
      rationale: cleanText(record?.rationale),
    }];
  });
}

function claimPostureFromUnknown(value: Record<string, unknown> | null | undefined, claims: CapsuleClaimDisplay[]): CapsuleResearchDisplay['claimPosture'] {
  const supported = arrayUnknown(value?.supported).length || claims.filter((claim) => supportSeverity(claim.support) === 'supported').length;
  const weak = arrayUnknown(value?.weak).length || claims.filter((claim) => supportSeverity(claim.support) === 'weak').length;
  const missing = arrayUnknown(value?.missing).length || claims.filter((claim) => supportSeverity(claim.support) === 'unsupported').length;
  const stale = arrayUnknown(value?.stale).length;
  return {
    supported,
    weak,
    missing,
    stale,
    reviewGate: cleanText(value?.reviewGate) || 'Human review required before using unresolved, weak, missing, or stale claims externally.',
  };
}

function workflowResearchFromUnknown(value: Record<string, unknown> | null | undefined, fallbackActions: string[]): CapsuleResearchDisplay['workflow'] {
  return {
    workflowId: cleanText(value?.workflowId) || 'capsule-inspect-workflow',
    humanRole: cleanText(value?.humanRole) || 'Capsule reviewer',
    scenario: cleanText(value?.scenario) || 'Review the capsule before drafting, exporting, or promoting graph/source changes.',
    steps: cleanStrings(value?.steps).length ? cleanStrings(value?.steps) : ['Inspect sources.', 'Check claim posture.', 'Refresh gaps.', 'Approve or reject review cards.'],
    outputPath: cleanText(value?.outputPath) || 'Review-gated policy work product',
    humanReviewGate: cleanText(value?.humanReviewGate) || 'Human review required before external use.',
    nextActions: cleanStrings(value?.nextActions).length ? cleanStrings(value?.nextActions) : fallbackActions.slice(0, 4),
  };
}

function refreshResearchFromUnknown(
  docket: Record<string, unknown> | null | undefined,
  dossier: Record<string, unknown> | null | undefined,
  sourceSpine: CapsuleResearchSourceDisplay[],
  evidenceGaps: string[],
): CapsuleResearchDisplay['refresh'] {
  return {
    status: cleanText(docket?.status) || (evidenceGaps.length ? 'needs-refresh' : 'starter-seeded'),
    cadence: cleanText(docket?.cadence) || cleanText(dossier?.refreshCadence) || 'Refresh before external use or high-stakes reliance.',
    sourceCount: cleanStrings(docket?.sourceIds).length || sourceSpine.length,
    staleSourceCount: cleanStrings(docket?.staleSourceIds).length,
    missingEvidenceGapCount: cleanStrings(docket?.missingEvidenceGaps).length || evidenceGaps.length,
    nextRepairActions: cleanStrings(docket?.nextRepairActions),
    humanReviewRequired: docket?.humanReviewRequired === true || evidenceGaps.length > 0,
  };
}

function graphProjectionResearchFromUnknown(value: Record<string, unknown> | null | undefined): CapsuleResearchDisplay['graphProjection'] {
  const nodes = graphLiteNodesFromUnknown(value?.nodes);
  const edges = graphLiteEdgesFromUnknown(value?.edges);
  const projectionId = cleanText(value?.projectionId) || 'graphlite-advisory-projection';
  return {
    provider: cleanText(value?.provider) || 'graphlite',
    status: cleanText(value?.status) || 'compiled-advisory',
    namedGraph: cleanText(value?.namedGraph) || projectionId,
    nodeCount: typeof value?.nodeCount === 'number' ? value.nodeCount : nodes.length,
    edgeCount: typeof value?.edgeCount === 'number' ? value.edgeCount : edges.length,
    advisoryOnly: value?.advisoryOnly !== false,
    canonicalStore: cleanText(value?.canonicalStore) || 'Firestore ContextCapsules',
    promotionGate: cleanText(value?.promotionGate) || 'Human review-card approval required before canonical graph promotion.',
  };
}

function ontologyCoverageFromUnknown(
  overlay: Record<string, unknown> | null | undefined,
  ontology: CapsuleOntologyDisplay,
): CapsuleResearchDisplay['ontologyCoverage'] {
  const primitiveCoverage = uniqueStrings(ontology.active.flatMap((item) => item.primitiveCoverage));
  const missingPrimitives = uniqueStrings([
    ...ontology.missing.flatMap((item) => item.missingPrimitives),
    ...ontology.active.flatMap((item) => item.missingPrimitives),
  ]);
  return {
    activeOntologyIds: cleanStrings(overlay?.baseOntologyIds),
    graphNodeTypes: cleanStrings(overlay?.graphNodeTypes),
    graphEdgeTypes: cleanStrings(overlay?.graphEdgeTypes),
    activeCount: ontology.active.length,
    proposedCount: ontology.proposed.length,
    missingCount: ontology.missing.length,
    coveredPrimitiveCount: primitiveCoverage.length,
    missingPrimitives,
  };
}

function reasoningPolicyFromUnknown(value: Record<string, unknown> | null | undefined): CapsuleResearchDisplay['reasoningPolicy'] {
  return {
    operation: cleanText(value?.reasoningOperation) || 'inspect sources, claims, graph proposals, and caveats before drafting',
    activationCriteria: cleanStrings(value?.activationCriteria),
    outputGrammar: cleanStrings(value?.outputGrammar),
    reviewGate: cleanText(value?.humanReviewGate) || 'Human review required before external advice, final outputs, memory capture, or graph promotion.',
  };
}

function buildCoreSourceability(input: {
  anatomy: CapsuleCoreDisplay[];
  evidence: CapsuleEvidenceDisplay;
  claims: CapsuleClaimDisplay[];
  outputs: CapsuleOutputDisplay[];
}): CapsuleCoreSourceabilityGate[] {
  const anatomyByKind = new Map(input.anatomy.map((core) => [core.kind, core]));
  const ledgerUnsupportedClaimTexts = input.claims
    .filter((claim) => supportSeverity(claim.support) === 'unsupported')
    .map((claim) => claim.text);
  const unsupportedClaimTexts = uniqueStrings(
    ledgerUnsupportedClaimTexts.length ? ledgerUnsupportedClaimTexts : input.evidence.unsupportedClaims,
  );
  const totalClaimCount = Math.max(
    input.claims.length || input.evidence.supportedClaims.length + input.evidence.weakClaims.length + unsupportedClaimTexts.length,
    0,
  );
  const supportedClaimCount = Math.max(
    input.evidence.supportedClaims.length,
    input.claims.filter((claim) => supportSeverity(claim.support) === 'supported').length,
  );
  const weakClaimCount = Math.max(
    input.evidence.weakClaims.length,
    input.claims.filter((claim) => supportSeverity(claim.support) === 'weak').length,
  );
  const claimSupportScore = totalClaimCount
    ? Math.round(((supportedClaimCount + weakClaimCount * 0.55) / totalClaimCount) * 100)
    : input.evidence.sourceCount > 0 ? 80 : 0;

  return SOURCEABILITY_CORE_ORDER.map((kind) => {
    const core = anatomyByKind.get(kind);
    const gaps = sourceabilityGapsForKind(kind, input.evidence, core, input.outputs);
    const unsupportedClaims = kind === 'source' || kind === 'output' ? unsupportedClaimTexts : [];
    const sourceCoverageScore = sourceabilityScoreForKind({
      kind,
      core,
      evidence: input.evidence,
      outputCount: input.outputs.length,
      claimSupportScore,
      unsupportedClaimCount: unsupportedClaims.length,
    });
    const ready = sourceCoverageScore >= SOURCEABILITY_READY_THRESHOLD
      && unsupportedClaims.length === 0
      && gaps.length === 0;
    return {
      kind,
      label: `${core?.label ?? humanizeId(kind)} sourceability`,
      sourceCoverageScore,
      threshold: SOURCEABILITY_READY_THRESHOLD,
      evidenceGapCount: gaps.length,
      unsupportedClaimCount: unsupportedClaims.length,
      unsupportedClaims,
      gapLabels: gaps,
      ready,
      readyBlocked: !ready,
      provenance: 'capsule-evidence-pack',
    };
  });
}

function sourceabilityScoreForKind(input: {
  kind: CapsuleCoreSourceabilityGate['kind'];
  core?: CapsuleCoreDisplay;
  evidence: CapsuleEvidenceDisplay;
  outputCount: number;
  claimSupportScore: number;
  unsupportedClaimCount: number;
}): number {
  if (input.kind === 'source') {
    if (!input.evidence.sourceCount) return 0;
    return clamp(input.unsupportedClaimCount ? Math.min(input.claimSupportScore, 65) : input.claimSupportScore, 0, 100);
  }
  if (input.kind === 'document') {
    if (input.evidence.documentIds.length) return 100;
    return input.evidence.sourceIds.length ? 55 : 0;
  }
  if (input.kind === 'output') {
    if (!input.outputCount) return 0;
    return input.unsupportedClaimCount ? 60 : 90;
  }
  if (input.kind === 'situation') {
    if (input.core?.status !== 'present') return 0;
    return input.evidence.sourceCount ? 90 : 72;
  }
  if (input.kind === 'user') {
    if (input.core?.status !== 'present') return 0;
    return 82;
  }
  return 0;
}

function sourceabilityGapsForKind(
  kind: CapsuleCoreSourceabilityGate['kind'],
  evidence: CapsuleEvidenceDisplay,
  core: CapsuleCoreDisplay | undefined,
  outputs: CapsuleOutputDisplay[],
): string[] {
  const explicit = evidence.gaps.filter((gap) => {
    if (kind === 'source') return /source|evidence|receipt|unsupported|claim/i.test(gap);
    if (kind === 'document') return /document|library|chunk|paragraph|extract/i.test(gap);
    if (kind === 'situation') return /situation|jurisdiction|decision|time|fresh|stale|date/i.test(gap);
    if (kind === 'user') return /user|profile|audience|mandate|red line|voice/i.test(gap);
    return /output|memo|brief|handover|export|approval/i.test(gap);
  });
  const structural = [
    kind === 'source' && evidence.sourceCount === 0 ? 'No source receipts attached yet.' : '',
    kind === 'document' && evidence.documentIds.length === 0 && evidence.sourceCount === 0 ? 'No documents or source receipts attached yet.' : '',
    kind === 'user' && core?.status !== 'present' ? 'No user core attached yet.' : '',
    kind === 'situation' && core?.status !== 'present' ? 'No situation core attached yet.' : '',
    kind === 'output' && outputs.length === 0 ? 'No output contract attached yet.' : '',
  ];
  return uniqueStrings([...explicit, ...structural.filter(Boolean)]);
}

function supportSeverity(support: string): 'supported' | 'weak' | 'unsupported' | 'unknown' {
  const normalized = support.toLowerCase();
  if (/unsupported|needs_source|missing|contradict|disput|stale/.test(normalized)) return 'unsupported';
  if (/weak|partial|mixed/.test(normalized)) return 'weak';
  if (/support|canonical|reviewed|approved/.test(normalized)) return 'supported';
  return 'unknown';
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
  const explicit = cards.map((card, index) => {
    const target = cleanText(card.target) || 'capsuleEnvelope';
    const sourceType = cleanText(card.sourceType) || 'user';
    const title = cleanText(card.title) || humanizeId(target);
    const evidenceLabels = reviewEvidenceLabels(card.evidence);
    return {
      id: card.id ?? card.reviewCardId ?? `review-card-${index + 1}`,
      title,
      target,
      state: cleanText(card.state) || 'proposed',
      sourceType,
      reviewState: reviewStateFrom(card.state),
      why: reviewWhyFor(target, sourceType, evidenceLabels),
      evidenceLabels,
      impact: reviewImpactFor(target),
      allowedActions: (card.id || card.reviewCardId) && ['proposed', 'owner_review', 'accepted'].includes(card.state ?? '')
        ? ['approve', 'reject'] as Array<'approve' | 'reject'> : [],
    };
  });
  const derived: CapsuleReviewCardDisplay[] = [];
  if (!evidence.sourceCount) {
    derived.push({
      id: 'source-gap-review',
      title: 'Attach sources or create a source-gap review card',
      target: 'sourceGap',
      state: 'proposed',
      sourceType: 'source-gap',
      reviewState: 'proposed',
      why: 'The capsule has no attached source or document receipts, so factual claims should not be promoted.',
      evidenceLabels: ['source count: 0', ...evidence.gaps.slice(0, 2)],
      impact: 'Blocks sourced drafting until receipts or a visible evidence gap are added.',
      allowedActions: [],
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
      why: 'Unsupported claims need source receipts, explicit caveats, or rejection before final outputs.',
      evidenceLabels: evidence.unsupportedClaims.slice(0, 3),
      impact: 'Keeps weak claims out of canonical capsule context until reviewed.',
      allowedActions: [],
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
      why: 'Graph structure is advisory until a human accepts the node and edge proposal.',
      evidenceLabels: evidence.sourceIds.slice(0, 3),
      impact: 'Prevents GraphLite or embedded graph suggestions from mutating canonical capsule state silently.',
      allowedActions: [],
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
      why: 'Advisory memory can guide the turn but must be reviewed before becoming durable context.',
      evidenceLabels: [`${capsule.readinessSummary?.advisoryMemoryHitCount ?? 0} advisory memory hit(s)`],
      impact: 'Keeps tacit memory useful without treating probabilistic recall as canonical evidence.',
      allowedActions: [],
    });
  }
  return uniqueBy([...explicit, ...derived], (item) => item.id);
}

function reviewEvidenceLabels(value: CapsuleWorkbenchReviewCardInput['evidence']): string[] {
  if (!Array.isArray(value)) return [];
  return uniqueStrings(value.flatMap((item) => [
    cleanText(item?.label),
    cleanText(item?.id),
    cleanText(item?.sourceType),
    item?.advisory ? 'advisory' : null,
  ].filter(Boolean) as string[])).slice(0, 4);
}

function reviewWhyFor(target: string, sourceType: string, evidenceLabels: string[]): string {
  const normalizedTarget = target.toLowerCase();
  if (normalizedTarget.includes('source')) return 'Source changes affect claim support and must be accepted before agents rely on them.';
  if (normalizedTarget.includes('claim')) return 'Claim ledger changes alter what the capsule treats as supported, weak, or missing.';
  if (normalizedTarget.includes('graph')) return 'Graph and ontology changes stay advisory until reviewed.';
  if (normalizedTarget.includes('memory')) return 'Memory capture can preserve useful tacit knowledge but needs owner review.';
  if (evidenceLabels.length) return `Review generated from ${evidenceLabels.slice(0, 2).join(', ')}.`;
  return `${humanizeId(sourceType)} proposal requires human approval before canonical promotion.`;
}

function reviewImpactFor(target: string): string {
  const normalizedTarget = target.toLowerCase();
  if (normalizedTarget.includes('source')) return 'May change source posture, refresh status, or evidence gaps.';
  if (normalizedTarget.includes('claim')) return 'May change unsupported-claim counts and output readiness.';
  if (normalizedTarget.includes('graph')) return 'May add or reject advisory graph nodes, edges, or ontology bindings.';
  if (normalizedTarget.includes('memory')) return 'May promote or discard advisory tacit knowledge.';
  if (normalizedTarget.includes('output')) return 'May change memo, briefing, or handover readiness.';
  return 'May update capsule context after explicit approval.';
}

function buildTimeline(
  capsule: CapsuleWorkbenchCapsuleInput,
  claims: CapsuleClaimDisplay[],
): CapsuleTimelineDisplay {
  const temporality = temporalityFromCapsule(capsule);
  const anchors = timelineAnchorsFromUnknown(temporality?.timelineAnchors);
  const claimItems: CapsuleTimelineItemDisplay[] = claims.flatMap((claim): CapsuleTimelineItemDisplay[] => {
    const start = claim.validFrom ?? claim.asOf;
    if (!start) return [];
    return [{
      id: `claim-validity-${claim.claimId}`,
      label: claim.text,
      start,
      end: claim.validUntil,
      group: 'claim-validity',
      kind: 'claim-validity',
      confidence: claim.confidence,
      nodeIds: [`claim:${claim.claimId}`],
      sourceIds: claim.sourceIds,
    }];
  });
  const items = uniqueBy([
    ...anchors,
    ...claimItems,
  ], (item) => item.id).sort((left, right) => left.start.localeCompare(right.start));
  return {
    asOf: cleanText(temporality?.asOf) || null,
    validFrom: cleanText(temporality?.validFrom) || null,
    validUntil: cleanText(temporality?.validUntil) || null,
    groups: uniqueStrings(items.map((item) => item.group)),
    items,
  };
}

function buildCausalChains(
  capsule: CapsuleWorkbenchCapsuleInput,
  claims: CapsuleClaimDisplay[],
): CapsuleCausalChainDisplay[] {
  const causality = causalityFromCapsule(capsule);
  const topLevel = causalLinksFromUnknown(causality?.causalLinks);
  const claimLevel = claims.flatMap((claim): CapsuleCausalChainDisplay[] => {
    const entries = Object.entries(claim.causalLinks).flatMap(([relation, targets]) =>
      targets.map((target, index) => ({
        id: `claim-causal-${claim.claimId}-${relation}-${index + 1}`,
        cause: claim.text,
        effect: humanizeId(target),
        relation: relationForCausalKey(relation),
        direction: directionForRelation(relationForCausalKey(relation)),
        confidence: claim.confidence,
        caveat: null,
        nodeIds: [`claim:${claim.claimId}`, causalTargetNodeId(target)],
        sourceIds: claim.sourceIds,
        reviewState: claim.reviewState,
      })),
    );
    return entries;
  });
  return uniqueBy([...topLevel, ...claimLevel], (item) => item.id).slice(0, 24);
}

function buildQuality(
  capsule: CapsuleWorkbenchCapsuleInput,
  reviewQueue: CapsuleReviewCardDisplay[],
): CapsuleQualityDisplay {
  const quality = safeDeriveCapsuleQuality(capsule);
  return {
    score: quality.score,
    diagnostics: quality.diagnostics,
    sections: quality.sections.map((section) => {
      const fixTarget = fixTargetForQuality(section.id);
      const reviewCard = reviewQueue.find((card) => card.target === fixTarget.target);
      return {
        ...section,
        fixTarget: {
          ...fixTarget,
          label: 'Fix this' as const,
          reviewCardId: reviewCard?.id ?? null,
        },
      };
    }),
  };
}

function buildPillars(input: {
  anatomy: CapsuleCoreDisplay[];
  evidence: CapsuleEvidenceDisplay;
  tacitKnowledge: CapsuleTacitKnowledgeDisplay;
  agents: CapsuleAgentWorkflowDisplay;
  outputs: CapsuleOutputDisplay[];
  reviewQueue: CapsuleReviewCardDisplay[];
  ontology: CapsuleOntologyDisplay;
  timeline: CapsuleTimelineDisplay;
  causalChains: CapsuleCausalChainDisplay[];
  quality: CapsuleQualityDisplay;
  claims: CapsuleClaimDisplay[];
}): CapsulePillarDisplay[] {
  const coreState = (kind: CapsuleWorkbenchCoreKind): CapsuleWorkbenchReviewState =>
    input.anatomy.find((core) => core.kind === kind)?.reviewState ?? 'missing';

  return [
    {
      id: 'user',
      title: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.user.label,
      description: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.user.description,
      inspectionFocus: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.user.inspectionFocus,
      mappedCoreKinds: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.user.mappedCoreKinds,
      sections: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.user.sections,
      facts: [
        { label: 'User core', value: coreState('user'), reviewState: coreState('user') },
        { label: 'Tacit cards', value: `${input.tacitKnowledge.items.length}`, reviewState: input.tacitKnowledge.items.length ? 'canonical' : 'missing' },
        { label: 'Review cards', value: `${input.reviewQueue.length}`, reviewState: input.reviewQueue.length ? 'proposed' : 'canonical' },
      ],
    },
    {
      id: 'situation',
      title: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.situation.label,
      description: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.situation.description,
      inspectionFocus: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.situation.inspectionFocus,
      mappedCoreKinds: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.situation.mappedCoreKinds,
      sections: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.situation.sections,
      facts: [
        { label: 'Claims', value: `${input.claims.length}`, reviewState: input.claims.length ? 'canonical' : 'missing' },
        { label: 'Timeline', value: `${input.timeline.items.length} anchor${input.timeline.items.length === 1 ? '' : 's'}`, reviewState: input.timeline.items.length ? 'canonical' : 'missing' },
        { label: 'Causal links', value: `${input.causalChains.length}`, reviewState: input.causalChains.length ? 'canonical' : 'missing' },
      ],
    },
    {
      id: 'tools',
      title: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.tools.label,
      description: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.tools.description,
      inspectionFocus: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.tools.inspectionFocus,
      mappedCoreKinds: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.tools.mappedCoreKinds,
      sections: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.tools.sections,
      facts: [
        { label: 'Sources', value: `${input.evidence.sourceCount}`, reviewState: input.evidence.sourceCount ? 'canonical' : 'missing' },
        { label: 'Ontologies', value: `${input.ontology.active.length + input.ontology.proposed.length}`, reviewState: input.ontology.active.length ? 'canonical' : 'proposed' },
        { label: 'Agent runs', value: `${input.agents.recentRuns.length}`, reviewState: input.agents.recentRuns.length ? 'canonical' : 'missing' },
      ],
    },
    {
      id: 'output',
      title: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.output.label,
      description: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.output.description,
      inspectionFocus: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.output.inspectionFocus,
      mappedCoreKinds: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.output.mappedCoreKinds,
      sections: CAPSULE_CANONICAL_CATEGORY_DEFINITIONS.output.sections,
      facts: [
        { label: 'Outputs', value: `${input.outputs.length}`, reviewState: input.outputs.length ? 'canonical' : 'missing' },
        { label: 'Quality', value: `${input.quality.score}`, reviewState: input.quality.score >= 75 ? 'canonical' : input.quality.score >= 45 ? 'proposed' : 'missing' },
        { label: 'Next fixes', value: `${input.quality.sections.filter((section) => section.diagnostics.length).length}`, reviewState: input.quality.diagnostics.length ? 'proposed' : 'canonical' },
      ],
    },
  ];
}

function buildOntology(
  capsule: CapsuleWorkbenchCapsuleInput,
  coreRefs: CapsuleWorkbenchCoreRefs,
): CapsuleOntologyDisplay {
  const explicitBinding = ontologyBindingItemFromUnknown(capsule.ontologyBinding);
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
    .map((ontology) => {
      const primitiveCoverage = TACITUS_CORE_PRIMITIVES.filter((primitive) => ontology.primitiveSubtypes[primitive]?.length);
      const missingPrimitives = TACITUS_CORE_PRIMITIVES.filter((primitive) => !primitiveCoverage.includes(primitive));
      const total = ontology.mandatoryRelations.length;
      return {
        id: ontology.id,
        label: ontology.label,
        role: 'active' as const,
        primitiveCoverage,
        missingPrimitives,
        coverageRatio: primitiveCoverage.length / TACITUS_CORE_PRIMITIVES.length,
        requiredRelations: ontology.mandatoryRelations.map((relation) => relation.description).slice(0, 3),
        reviewState: 'canonical' as CapsuleWorkbenchReviewState,
        validatorSummary: {
          passed: missingPrimitives.length ? 0 : total,
          warnings: missingPrimitives.length,
          total,
          passRate: total ? (missingPrimitives.length ? 0 : 1) : primitiveCoverage.length / TACITUS_CORE_PRIMITIVES.length,
          labels: ontology.mandatoryRelations.map((relation) => relation.description).slice(0, 3),
        },
      };
    });
  const domainCandidates = getDomainOntologyCards()
    .filter((ontology) => ids.some((id) => id.includes(ontology.id) || ontology.id.includes(id)))
    .slice(0, 2)
    .map((ontology) => {
      const mapping = summarizeOntologyMapping(ontology);
      const warningCount = mapping.issues.filter((issue) => issue.severity === 'warn').length;
      const total = ontology.validators.length + 1;
      return {
        id: ontology.id,
        label: ontology.label,
        role: 'active' as const,
        primitiveCoverage: mapping.coveredPrimitives,
        missingPrimitives: mapping.missingPrimitives,
        coverageRatio: mapping.primitiveCoverage,
        requiredRelations: ontology.validators?.map((validator) => validator.label).slice(0, 3) ?? [],
        reviewState: 'canonical' as CapsuleWorkbenchReviewState,
        validatorSummary: {
          passed: Math.max(0, total - warningCount),
          warnings: warningCount,
          total,
          passRate: total ? Math.max(0, total - warningCount) / total : mapping.primitiveCoverage,
          labels: [
            `${Math.round(mapping.primitiveCoverage * 100)}% ACO primitive coverage`,
            ...ontology.validators.map((validator) => validator.label),
          ].slice(0, 3),
        },
      };
    });
  const active = uniqueBy([
    ...(explicitBinding ? [explicitBinding] : []),
    ...activeWork,
    ...domainCandidates,
  ], (item) => item.id);
  const fallbackProposedPrimitives: TacitusCorePrimitive[] = ['Actor', 'Claim', 'Interest', 'Constraint', 'Commitment', 'Narrative'];
  const fallbackMissingPrimitives: TacitusCorePrimitive[] = ['Leverage', 'Event'];
  const proposed = active.length
    ? []
    : [{
      id: 'policy-work-ontology',
      label: 'Policy work ontology',
      role: 'proposed' as const,
      primitiveCoverage: fallbackProposedPrimitives,
      missingPrimitives: fallbackMissingPrimitives,
      coverageRatio: 6 / TACITUS_CORE_PRIMITIVES.length,
      requiredRelations: ['Claims should link to supporting sources.', 'Decisions should link to assumptions and actors.'],
      reviewState: 'proposed' as CapsuleWorkbenchReviewState,
      validatorSummary: {
        passed: 1,
        warnings: 2,
        total: 3,
        passRate: 1 / 3,
        labels: ['Needs review-card approval before it becomes the active binding.'],
      },
    }];
  const missing = active.length && !capsule.coreRefs?.graphCoreId
    ? [{
        id: 'graph-core-missing',
        label: 'Graph core not attached',
        role: 'missing' as const,
        primitiveCoverage: [],
        missingPrimitives: [...TACITUS_CORE_PRIMITIVES],
        coverageRatio: 0,
        requiredRelations: ['Attach or review graph proposals before relying on graph analytics.'],
        reviewState: 'missing' as CapsuleWorkbenchReviewState,
        validatorSummary: {
          passed: 0,
          warnings: 1,
          total: 1,
          passRate: 0,
          labels: ['Graph core is required before relying on graph analytics.'],
        },
      }]
    : [];
  return { active, proposed, missing };
}

function ontologyBindingItemFromUnknown(value: unknown): CapsuleOntologyItemDisplay | null {
  const record = asRecord(value);
  if (!record) return null;
  const taxonomyPath = cleanStrings(record.taxonomyPath);
  const ontologyIds = cleanStrings(record.ontologyIds);
  const primitiveCoverage = cleanStrings(record.acoPrimitives)
    .filter((primitive): primitive is TacitusCorePrimitive =>
      (TACITUS_CORE_PRIMITIVES as readonly string[]).includes(primitive),
    );
  if (!taxonomyPath.length && !ontologyIds.length && !primitiveCoverage.length) return null;
  const missingPrimitives = TACITUS_CORE_PRIMITIVES.filter((primitive) => !primitiveCoverage.includes(primitive));
  const total = Math.max(1, TACITUS_CORE_PRIMITIVES.length);
  const label = taxonomyPath.length
    ? taxonomyPath.join(' / ')
    : ontologyIds.length
      ? ontologyIds.join(', ')
      : 'Explicit capsule ontology binding';
  const rationale = cleanText(record.bindingRationale);
  return {
    id: `ontology-binding:${cleanText(record.domainId) || slugId(label, 'capsule-binding')}`,
    label,
    role: 'active',
    primitiveCoverage,
    missingPrimitives,
    coverageRatio: primitiveCoverage.length / total,
    requiredRelations: uniqueStrings([
      rationale,
      ontologyIds.length ? `Ontology ids: ${ontologyIds.join(', ')}` : '',
      taxonomyPath.length ? `Taxonomy path: ${taxonomyPath.join(' / ')}` : '',
    ]).slice(0, 3),
    reviewState: 'canonical',
    validatorSummary: {
      passed: primitiveCoverage.length,
      warnings: missingPrimitives.length,
      total,
      passRate: primitiveCoverage.length / total,
      labels: uniqueStrings([
        `${primitiveCoverage.length}/${total} ACO primitives covered by explicit binding`,
        rationale,
      ]).slice(0, 3),
    },
  };
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
    recordedAt: capsuleGraphRecordedAt(input.capsule),
  }];
  const edges: CapsuleGraphEdgeDisplay[] = [];
  const sourceItems = sourceItemsFromUnknown(input.capsule.sourceRefs);
  const sourceById = new Map(sourceItems.map((source) => [source.id, source]));
  const claimItems = claimItemsFromUnknown(input.capsule.claimLedger);
  const addNode = (node: CapsuleGraphNodeDisplay) => {
    if (!nodes.some((existing) => existing.id === node.id)) nodes.push(node);
  };
  const addEdge = (edge: CapsuleGraphEdgeDisplay) => {
    if (!edges.some((existing) => existing.id === edge.id)) {
      edges.push({
        derivedFrom: ['capsule-workbench-graph-builder'],
        ...edge,
      });
    }
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
  addGraphBoundaryLayer({
    capsule: input.capsule,
    evidence: input.evidence,
    reviewQueue: input.reviewQueue,
    sourceBackedClaimCount: claimItems.filter((claim) => claim.sourceIds.length > 0).length,
    addNode,
    addEdge,
  });
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
        confidenceKind: proposal.payload.confidenceKind,
        sourceReceiptIds: proposal.payload.sourceReceiptIds,
        recordedAt: proposal.payload.recordedAt,
        invalidatedAt: proposal.payload.invalidatedAt,
        supersededBy: proposal.payload.supersededBy,
        invalidationReason: proposal.payload.invalidationReason,
        rationale: proposal.payload.rationale,
        derivedFrom: proposal.payload.derivedFrom,
        generatedBy: proposal.payload.generatedBy,
      });
      addEdge({
        id: `${proposal.proposalId}-capsule`,
        source: nodeId,
        target: `capsule:${input.capsule.capsuleId}`,
        label: 'approved into graph',
        reviewState: 'reviewed',
        relationshipType: 'member_of',
        confidence: proposal.payload.confidence,
        confidenceKind: proposal.payload.confidenceKind,
        sourceReceiptIds: proposal.payload.sourceReceiptIds,
        recordedAt: proposal.payload.recordedAt,
        invalidatedAt: proposal.payload.invalidatedAt,
        supersededBy: proposal.payload.supersededBy,
        invalidationReason: proposal.payload.invalidationReason,
        rationale: proposal.payload.rationale,
        derivedFrom: proposal.payload.derivedFrom,
        generatedBy: proposal.payload.generatedBy,
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
        judgeRationale: proposal.payload.judgeRationale,
        confidence: proposal.payload.confidence,
        confidenceKind: proposal.payload.confidenceKind,
        sourceReceiptIds: proposal.payload.sourceReceiptIds,
        recordedAt: proposal.payload.recordedAt,
        invalidatedAt: proposal.payload.invalidatedAt,
        supersededBy: proposal.payload.supersededBy,
        invalidationReason: proposal.payload.invalidationReason,
        rationale: proposal.payload.rationale,
        derivedFrom: proposal.payload.derivedFrom,
        generatedBy: proposal.payload.generatedBy,
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
    stats: summarizeCapsuleGraph({
      nodes,
      edges,
      sourceBackedClaims: claimItems.filter((claim) => claim.sourceIds.length > 0).length,
      unsupportedClaims: input.evidence.unsupportedClaims.length,
    }),
  };
}

function addGraphBoundaryLayer(input: {
  capsule: CapsuleWorkbenchCapsuleInput;
  evidence: CapsuleEvidenceDisplay;
  reviewQueue: CapsuleReviewCardDisplay[];
  sourceBackedClaimCount: number;
  addNode: (node: CapsuleGraphNodeDisplay) => void;
  addEdge: (edge: CapsuleGraphEdgeDisplay) => void;
}) {
  const capsuleId = `capsule:${input.capsule.capsuleId}`;
  const boundarySpecs = [
    {
      id: 'boundary:context-frame',
      label: 'Context frame',
      detail: cleanText(input.capsule.purpose) || cleanText(input.capsule.summary) || 'Defines the work this capsule is allowed to carry into Ask PRAXIS.',
      reviewState: 'canonical' as const,
      edgeLabel: 'frames use',
      relationshipType: 'structures',
      target: capsuleId,
    },
    {
      id: 'boundary:source-scope',
      label: `${input.evidence.sourceCount} source receipt${input.evidence.sourceCount === 1 ? '' : 's'} bound the graph`,
      detail: input.evidence.sourcePosture,
      reviewState: input.evidence.sourceCount ? 'canonical' as const : 'missing' as const,
      edgeLabel: 'bounds evidence',
      relationshipType: 'requires_resource',
      target: 'core:source',
    },
    {
      id: 'boundary:unsupported-claims',
      label: `Unsupported claims boundary: ${input.evidence.unsupportedClaims.length} outside confident use`,
      detail: input.evidence.unsupportedClaims.length
        ? input.evidence.unsupportedClaims.slice(0, 3).join(' | ')
        : 'No unsupported claims are currently visible in the capsule evidence ledger.',
      reviewState: input.evidence.unsupportedClaims.length ? 'proposed' as const : 'canonical' as const,
      edgeLabel: 'delimits confidence',
      relationshipType: 'bounds_confidence',
      target: 'core:source',
    },
    {
      id: 'boundary:review-gate',
      label: `${input.reviewQueue.length} review gate${input.reviewQueue.length === 1 ? '' : 's'} before promotion`,
      detail: input.reviewQueue.length
        ? input.reviewQueue.map((card) => card.title).slice(0, 4).join(' | ')
        : 'No open review cards are blocking this capsule graph.',
      reviewState: input.reviewQueue.length ? 'proposed' as const : 'canonical' as const,
      edgeLabel: 'requires review',
      relationshipType: 'triggers_review',
      target: capsuleId,
    },
    {
      id: 'boundary:agent-stop-condition',
      label: 'Agent stop condition',
      detail: 'Ask PRAXIS should stop or ask for review when claims cross source scope, freshness, confidence, or output-contract boundaries.',
      reviewState: 'advisory' as const,
      edgeLabel: 'constrains agent',
      relationshipType: 'constrains',
      target: 'core:tool',
    },
  ];

  for (const spec of boundarySpecs) {
    input.addNode({
      id: spec.id,
      label: spec.label,
      type: 'boundary',
      reviewState: spec.reviewState,
      detail: spec.detail,
      entityType: spec.id.includes('unsupported') ? 'Risk' : spec.id.includes('review') ? 'Commitment' : 'Constraint',
      provenance: 'derived capsule delimitation layer',
      confidence: spec.reviewState === 'canonical' ? 0.86 : spec.reviewState === 'missing' ? 0.35 : 0.62,
      confidenceKind: 'ASSESSED',
      sourceReceiptIds: input.evidence.sourceIds.slice(0, 4),
      linkedClaimIds: input.evidence.unsupportedClaims.map((_, index) => `unsupported-${index + 1}`),
      recordedAt: capsuleGraphRecordedAt(input.capsule),
      rationale: 'Context is both structure and delimitation; this node keeps the graph honest about source scope, review gates, and forbidden overreach.',
      derivedFrom: ['capsule-envelope', 'sourceability-gates', 'review-queue'],
      generatedBy: {
        actorType: 'model',
        actorId: 'capsule-workbench-view-model',
        at: capsuleGraphRecordedAt(input.capsule),
        activity: 'quality_review',
      },
    });
    input.addEdge({
      id: `${spec.id}-edge`,
      source: spec.id,
      target: spec.target,
      label: spec.edgeLabel,
      reviewState: spec.reviewState,
      relationshipType: spec.relationshipType,
      confidence: spec.reviewState === 'canonical' ? 0.84 : 0.6,
      confidenceKind: 'ASSESSED',
      sourceReceiptIds: input.evidence.sourceIds.slice(0, 4),
      recordedAt: capsuleGraphRecordedAt(input.capsule),
      rationale: 'Boundary edge prevents graph structure from being mistaken for factual proof.',
      derivedFrom: ['capsule-envelope', 'sourceability-gates'],
      generatedBy: {
        actorType: 'model',
        actorId: 'capsule-workbench-view-model',
        at: capsuleGraphRecordedAt(input.capsule),
        activity: 'quality_review',
      },
    });
  }

  if (input.sourceBackedClaimCount > 0) {
    input.addEdge({
      id: 'boundary-source-backed-claims',
      source: 'boundary:source-scope',
      target: 'boundary:unsupported-claims',
      label: `${input.sourceBackedClaimCount} claims remain inside source scope`,
      reviewState: 'canonical',
      relationshipType: 'delimits',
      confidence: 0.78,
      confidenceKind: 'ASSESSED',
      sourceReceiptIds: input.evidence.sourceIds.slice(0, 4),
      recordedAt: capsuleGraphRecordedAt(input.capsule),
      rationale: 'Source-backed claims are separated from unsupported claims so generation can preserve the confidence boundary.',
      derivedFrom: ['claim-ledger', 'source-receipts'],
    });
  }
}

function summarizeCapsuleGraph(input: {
  nodes: CapsuleGraphNodeDisplay[];
  edges: CapsuleGraphEdgeDisplay[];
  sourceBackedClaims: number;
  unsupportedClaims: number;
}): CapsuleGraphStatsDisplay {
  const allElements = [...input.nodes, ...input.edges];
  const provenanceBacked = allElements.filter((element) => Boolean(
    element.provenance
    || element.sourceReceiptIds?.length
    || element.derivedFrom?.length
    || element.generatedBy,
  )).length;
  const provenanceCoveragePct = allElements.length
    ? Math.round((provenanceBacked / allElements.length) * 100)
    : 0;
  const total = input.nodes.length + input.edges.length;
  const densityLabel = total >= 320
    ? 'dense living graph'
    : total >= 140
      ? 'living graph'
      : total >= 60
        ? 'structured graph'
        : 'starter graph';
  return {
    totalNodes: input.nodes.length,
    totalEdges: input.edges.length,
    sourceBackedClaims: input.sourceBackedClaims,
    unsupportedClaims: input.unsupportedClaims,
    boundaryNodes: input.nodes.filter((node) => node.type === 'boundary').length,
    reviewGatedNodes: input.nodes.filter((node) => node.reviewState === 'proposed' || node.reviewState === 'missing' || node.reviewState === 'advisory').length,
    temporalNodes: input.nodes.filter((node) => node.validFrom || node.validUntil || node.asOf || node.recordedAt || node.invalidatedAt).length,
    provenanceCoveragePct,
    densityLabel,
  };
}

function capsuleGraphRecordedAt(capsule: CapsuleWorkbenchCapsuleInput): string {
  return capsule.updatedAt || '2026-01-01T00:00:00.000Z';
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
  for (const item of claimEntriesFromUnknown(value)) {
    const record = asRecord(item);
    if (!record) continue;
    const text = cleanText(record.text) || cleanText(record.claim) || cleanText(record.claimText);
    if (!text) continue;
    const status = (cleanText(record.support) || cleanText(record.status) || cleanText(record.reviewState)).toLowerCase();
    if (/unsupported|missing|needs_source/.test(status)) buckets.unsupported.push(text);
    else if (/weak|partial/.test(status)) buckets.weak.push(text);
    else if (/assumption|assumed/.test(status)) buckets.assumptions.push(text);
    else if (/support/.test(status)) buckets.supported.push(text);
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
    confidenceKind?: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' | 'ASSESSED';
    sourceReceiptIds?: string[];
    recordedAt?: string;
    invalidatedAt?: string;
    supersededBy?: string;
    invalidationReason?: 'CONTRADICTED' | 'SOURCE_RETRACTED' | 'TEMPORAL_EXPIRY' | 'HUMAN_OVERRIDE';
    rationale?: string;
    derivedFrom?: string[];
    judgeRationale?: string;
    generatedBy?: {
      actorType: 'model' | 'human';
      actorId: string;
      at: string;
      activity: 'extraction' | 'proposal' | 'review_decision' | 'import' | 'quality_review';
    };
  };
}

type SafeQualitySection = Omit<CapsuleQualityDisplay['sections'][number], 'fixTarget'>;

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
    confidenceKind?: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' | 'ASSESSED';
    sourceReceiptIds: string[];
    recordedAt?: string;
    invalidatedAt?: string;
    supersededBy?: string;
    invalidationReason?: 'CONTRADICTED' | 'SOURCE_RETRACTED' | 'TEMPORAL_EXPIRY' | 'HUMAN_OVERRIDE';
    rationale?: string;
    derivedFrom?: string[];
    generatedBy?: {
      actorType: 'model' | 'human';
      actorId: string;
      at: string;
      activity: 'extraction' | 'proposal' | 'review_decision' | 'import' | 'quality_review';
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    relationshipType?: string;
    judgeRationale?: string;
    reviewState: CapsuleWorkbenchReviewState;
    confidence: number | null;
    confidenceKind?: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' | 'ASSESSED';
    sourceReceiptIds: string[];
    recordedAt?: string;
    invalidatedAt?: string;
    supersededBy?: string;
    invalidationReason?: 'CONTRADICTED' | 'SOURCE_RETRACTED' | 'TEMPORAL_EXPIRY' | 'HUMAN_OVERRIDE';
    rationale?: string;
    derivedFrom?: string[];
    generatedBy?: {
      actorType: 'model' | 'human';
      actorId: string;
      at: string;
      activity: 'extraction' | 'proposal' | 'review_decision' | 'import' | 'quality_review';
    };
  }>;
}

function buildClaims(value: unknown): CapsuleClaimDisplay[] {
  return claimEntriesFromUnknown(value).flatMap((item, index): CapsuleClaimDisplay[] => {
    const record = asRecord(item);
    const text = typeof item === 'string'
      ? item.trim()
      : record
        ? cleanText(record.text) || cleanText(record.claim) || cleanText(record.claimText) || cleanText(record.summary)
        : '';
    if (!text) return [];
    const claimId = record
      ? cleanText(record.claimId) || cleanText(record.id) || cleanText(record.uid) || slugId(text, `claim-${index + 1}`)
      : slugId(text, `claim-${index + 1}`);
    const receipts = record ? receiptDisplaysFromUnknown(record.receipts) : [];
    const sourceIds = record ? sourceIdsForClaim(record, receipts) : [];
    const support = record
      ? cleanText(record.support) || cleanText(record.status) || cleanText(record.reviewState) || supportFromReceipts(receipts)
      : 'unsupported';
    return [{
      claimId,
      text,
      support,
      validFrom: record ? cleanText(record.validFrom) || null : null,
      validUntil: record ? cleanText(record.validUntil) || null : null,
      asOf: record ? cleanText(record.asOf) || null : null,
      causalLinks: record ? causalLinksObjectFromUnknown(record.causalLinks) : {},
      receipts,
      sourceIds,
      provenance: record ? cleanText(record.provenance) || cleanText(record.generatedBy) || undefined : undefined,
      confidence: record ? confidenceFromUnknown(record.confidence ?? record.score) : null,
      reviewState: reviewStateForClaim(support, sourceIds.length),
    }];
  });
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
  return claimEntriesFromUnknown(value).flatMap((item, index): CapsuleGraphClaimItem[] => {
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
    const receipts = record ? receiptDisplaysFromUnknown(record.receipts) : [];
    const status = record ? cleanText(record.status) || cleanText(record.support) || cleanText(record.reviewState) : '';
    const sourceIds = record ? sourceIdsForClaim(record, receipts) : [];
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

function claimEntriesFromUnknown(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];
  return uniqueBy([
    ...arrayUnknown(record.allClaims),
    ...arrayUnknown(record.claims),
    ...arrayUnknown(record.supportedClaims),
    ...arrayUnknown(record.weakClaims),
    ...arrayUnknown(record.unsupportedClaims),
    ...arrayUnknown(record.disputedClaims),
    ...arrayUnknown(record.staleClaims),
  ], (item) => {
    if (typeof item === 'string') return item;
    const itemRecord = asRecord(item);
    return cleanText(itemRecord?.claimId) || cleanText(itemRecord?.id) || cleanText(itemRecord?.text) || JSON.stringify(item);
  });
}

function receiptDisplaysFromUnknown(value: unknown): CapsuleClaimReceiptDisplay[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): CapsuleClaimReceiptDisplay[] => {
    const record = asRecord(item);
    if (!record) return [];
    const sourceId = cleanText(record.sourceId) || cleanText(record.id) || cleanText(record.receiptId);
    const snippet = cleanText(record.snippet) || cleanText(record.quote) || cleanText(record.text);
    if (!sourceId && !snippet) return [];
    return [{
      sourceId: sourceId || 'unattributed-source',
      url: cleanText(record.url) || null,
      publisher: cleanText(record.publisher) || cleanText(record.source) || null,
      date: cleanText(record.date) || cleanText(record.publishedAt) || null,
      reliabilityTier: scalarStringOrNumber(record.reliabilityTier ?? record.tier),
      snippet,
      charOffset: scalarStringOrNumber(record.charOffset),
      page: scalarStringOrNumber(record.page),
      embedding: embeddingFromUnknown(record.embedding),
      confidence: confidenceFromUnknown(record.confidence),
      stance: cleanText(record.stance) || cleanText(record.verdict) || null,
    }];
  });
}

function sourceIdsForClaim(record: Record<string, unknown>, receipts: CapsuleClaimReceiptDisplay[]): string[] {
  return uniqueStrings([
    ...cleanStrings(record.sourceIds),
    ...cleanStrings(record.sourceRefIds),
    ...cleanStrings(record.receiptIds),
    ...cleanStrings(record.evidenceIds),
    cleanText(record.sourceId),
    cleanText(record.receiptId),
    ...receipts.map((receipt) => receipt.sourceId),
  ]);
}

function supportFromReceipts(receipts: CapsuleClaimReceiptDisplay[]): string {
  const stances = receipts.map((receipt) => receipt.stance?.toLowerCase() ?? '');
  if (stances.some((stance) => /contradict|disput|oppose/.test(stance)) && stances.some((stance) => /support/.test(stance))) return 'disputed';
  if (stances.some((stance) => /contradict|disput|oppose/.test(stance))) return 'disputed';
  if (stances.some((stance) => /support/.test(stance))) return 'supported';
  return receipts.length ? 'weak' : 'unsupported';
}

function causalLinksObjectFromUnknown(value: unknown): Record<string, string[]> {
  const record = asRecord(value);
  if (!record) return {};
  const out: Record<string, string[]> = {};
  for (const key of ['causes', 'causedBy', 'enables', 'blocks', 'escalates', 'deEscalates', 'de-escalates']) {
    const values = cleanStrings(record[key]);
    if (values.length) out[key] = values;
  }
  return out;
}

function temporalityFromCapsule(capsule: CapsuleWorkbenchCapsuleInput): Record<string, unknown> | null {
  const grounding = asRecord(capsule.grounding);
  const starterSnapshot = asRecord(capsule.starterSnapshot);
  return firstRecord(capsule.temporality, grounding?.temporality, starterSnapshot?.temporality);
}

function timelineAnchorsFromUnknown(value: unknown): CapsuleTimelineItemDisplay[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index): CapsuleTimelineItemDisplay[] => {
    const record = asRecord(item);
    if (!record) return [];
    const start = cleanText(record.date) || cleanText(record.start) || cleanText(record.asOf);
    const label = cleanText(record.label) || cleanText(record.title) || cleanText(record.event);
    if (!start || !label) return [];
    const sourceIds = uniqueStrings([
      ...cleanStrings(record.sourceRefs),
      ...cleanStrings(record.sourceRefIds),
      ...cleanStrings(record.sourceIds),
    ]);
    const kind = cleanText(record.kind) || 'event';
    return [{
      id: cleanText(record.id) || slugId(`${label}-${start}`, `timeline-anchor-${index + 1}`),
      label,
      start,
      end: cleanText(record.end) || null,
      group: kind,
      kind,
      confidence: confidenceFromUnknown(record.confidence),
      nodeIds: sourceIds.map((id) => `source:${id}`),
      sourceIds,
    }];
  });
}

function causalityFromCapsule(capsule: CapsuleWorkbenchCapsuleInput): Record<string, unknown> | null {
  const grounding = asRecord(capsule.grounding);
  const starterSnapshot = asRecord(capsule.starterSnapshot);
  return firstRecord(capsule.causality, grounding?.causality, starterSnapshot?.causality);
}

function causalLinksFromUnknown(value: unknown): CapsuleCausalChainDisplay[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index): CapsuleCausalChainDisplay[] => {
    const record = asRecord(item);
    if (!record) return [];
    const cause = cleanText(record.cause) || cleanText(record.source);
    const effect = cleanText(record.effect) || cleanText(record.target);
    if (!cause || !effect) return [];
    const relation = relationForCausalKey(cleanText(record.relation) || cleanText(record.relationshipType) || 'causes');
    const sourceIds = uniqueStrings([
      ...cleanStrings(record.evidenceRefs),
      ...cleanStrings(record.sourceRefs),
      ...cleanStrings(record.sourceIds),
    ]);
    return [{
      id: cleanText(record.id) || slugId(`${cause}-${relation}-${effect}`, `causal-link-${index + 1}`),
      cause,
      effect,
      relation,
      direction: directionForRelation(relation),
      confidence: confidenceFromUnknown(record.confidence),
      caveat: cleanText(record.caveat) || null,
      nodeIds: sourceIds.map((id) => `source:${id}`),
      sourceIds,
      reviewState: reviewStateFrom(record.reviewState ?? record.status ?? 'canonical'),
    }];
  });
}

function safeDeriveCapsuleQuality(capsule: CapsuleWorkbenchCapsuleInput): {
  score: number;
  sections: SafeQualitySection[];
  diagnostics: string[];
} {
  try {
    const result = deriveCapsuleQuality(capsule);
    return {
      score: result.score,
      diagnostics: result.diagnostics.map((diagnostic) => diagnostic.message),
      sections: result.breakdown.map((item) => ({
        id: item.id,
        label: item.label,
        score: item.score,
        maxScore: item.maxScore,
        diagnostics: item.diagnostics.map((diagnostic) => diagnostic.message),
      })),
    };
  } catch {
    const score = scoreForCapsule(capsule);
    const sourceRefCount = sourceIdsFromUnknown(capsule.sourceRefs).length;
    const outputCount = Array.isArray(capsule.outputContracts) ? capsule.outputContracts.length : 0;
    return {
      score,
      diagnostics: capsule.readiness?.diagnostics ?? capsule.health?.warnings ?? [],
      sections: [
        { id: 'completeness', label: 'Completeness', score: Math.min(15, Math.round(score * 0.15)), maxScore: 15, diagnostics: [] },
        { id: 'source_support', label: 'Source support', score: sourceRefCount ? 15 : 0, maxScore: 15, diagnostics: sourceRefCount ? [] : ['Capsule is missing source support.'] },
        { id: 'freshness', label: 'Freshness', score: 10, maxScore: 10, diagnostics: [] },
        { id: 'human_review_provenance', label: 'Human review/provenance', score: 10, maxScore: 10, diagnostics: [] },
        { id: 'output_readiness', label: 'Output readiness', score: outputCount ? 10 : 0, maxScore: 10, diagnostics: outputCount ? [] : ['Capsule is missing an output contract.'] },
        { id: 'agent_operability', label: 'Agent operability', score: 5, maxScore: 10, diagnostics: [] },
        { id: 'temporality_coverage', label: 'Temporality coverage', score: 0, maxScore: 7, diagnostics: ['Capsule is missing validity windows or timeline anchors.'] },
        { id: 'causality_coverage', label: 'Causality coverage', score: 0, maxScore: 7, diagnostics: ['Capsule is missing causal links.'] },
        { id: 'ontology_binding_coverage', label: 'Ontology binding coverage', score: 0, maxScore: 6, diagnostics: ['Capsule is missing an ontology binding.'] },
        { id: 'receipt_depth', label: 'Receipt depth', score: sourceRefCount ? 8 : 0, maxScore: 8, diagnostics: sourceRefCount ? [] : ['Capsule is missing claim receipts.'] },
        { id: 'contradiction_rate', label: 'Contradiction rate', score: 2, maxScore: 2, diagnostics: [] },
      ],
    };
  }
}

function fixTargetForQuality(id: CapsuleQualityBreakdownId): { target: string; builderStep: string } {
  const targets: Record<CapsuleQualityBreakdownId, { target: string; builderStep: string }> = {
    completeness: { target: 'capsuleEnvelope', builderStep: 'prompt' },
    source_support: { target: 'claimLedger', builderStep: 'sources' },
    freshness: { target: 'sourceGap', builderStep: 'sources' },
    human_review_provenance: { target: 'agentInstructions', builderStep: 'review' },
    output_readiness: { target: 'outputContracts', builderStep: 'output' },
    agent_operability: { target: 'agentInstructions', builderStep: 'tools' },
    temporality_coverage: { target: 'claimLedger', builderStep: 'temporal' },
    causality_coverage: { target: 'claimLedger', builderStep: 'causal' },
    ontology_binding_coverage: { target: 'graphProposal', builderStep: 'ontology' },
    receipt_depth: { target: 'claimLedger', builderStep: 'receipts' },
    contradiction_rate: { target: 'claimLedger', builderStep: 'review' },
  };
  return targets[id];
}

function relationForCausalKey(value: string): string {
  const clean = value.trim();
  if (clean === 'deEscalates') return 'de-escalates';
  if (clean === 'causedBy') return 'caused by';
  return clean || 'causes';
}

function directionForRelation(relation: string): CapsuleCausalChainDisplay['direction'] {
  const clean = relation.toLowerCase();
  if (/de-?escalat/.test(clean)) return 'de-escalation';
  if (/escalat/.test(clean)) return 'escalation';
  if (/block/.test(clean)) return 'blocking';
  if (/enable/.test(clean)) return 'enabling';
  return 'causal';
}

function causalTargetNodeId(value: string): string {
  const clean = cleanText(value);
  if (!clean) return 'graph:causal-target';
  return clean.includes(':') ? clean : `graph:${slugId(clean, 'causal-target')}`;
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
        confidenceKind: graphConfidenceKindFromUnknown(payload.confidenceKind),
        sourceReceiptIds: cleanStrings(payload.sourceReceiptIds),
        recordedAt: cleanText(payload.recordedAt) || undefined,
        invalidatedAt: cleanText(payload.invalidatedAt) || undefined,
        supersededBy: cleanText(payload.supersededBy) || undefined,
        invalidationReason: graphInvalidationReasonFromUnknown(payload.invalidationReason),
        rationale: cleanText(payload.rationale) || undefined,
        derivedFrom: cleanStrings(payload.derivedFrom),
        judgeRationale: cleanText(payload.judgeRationale) || undefined,
        generatedBy: graphGeneratedByFromUnknown(payload.generatedBy),
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
      confidenceKind: node.confidenceKind,
      sourceReceiptIds: node.sourceReceiptIds,
      recordedAt: node.recordedAt,
      invalidatedAt: node.invalidatedAt,
      supersededBy: node.supersededBy,
      invalidationReason: node.invalidationReason,
      rationale: node.rationale,
      derivedFrom: node.derivedFrom,
      generatedBy: node.generatedBy,
    });
    addEdge({
      id: `graphlite-node:${projection.projectionId}:${node.id}`,
      source: projectionNodeId,
      target: id,
      label: 'projects',
      reviewState: 'advisory',
      relationshipType: 'projects',
      confidence: node.confidence,
      confidenceKind: node.confidenceKind,
      sourceReceiptIds: node.sourceReceiptIds,
      recordedAt: node.recordedAt,
      invalidatedAt: node.invalidatedAt,
      supersededBy: node.supersededBy,
      invalidationReason: node.invalidationReason,
      rationale: node.rationale,
      derivedFrom: node.derivedFrom,
      generatedBy: node.generatedBy,
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
      judgeRationale: edge.judgeRationale,
      confidence: edge.confidence,
      confidenceKind: edge.confidenceKind,
      sourceReceiptIds: edge.sourceReceiptIds,
      recordedAt: edge.recordedAt,
      invalidatedAt: edge.invalidatedAt,
      supersededBy: edge.supersededBy,
      invalidationReason: edge.invalidationReason,
      rationale: edge.rationale,
      derivedFrom: edge.derivedFrom,
      generatedBy: edge.generatedBy,
    });
  }
}

function graphLiteProjectionFromCapsule(capsule: CapsuleWorkbenchCapsuleInput): GraphLiteProjectionItem | null {
  const grounding = asRecord(capsule.grounding);
  const starterSnapshot = asRecord(capsule.starterSnapshot);
  const candidate = firstRecord(
    grounding?.embeddedGraph,
    capsule.embeddedGraph,
    capsule.graphLiteProjection,
    starterSnapshot?.embeddedGraph,
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
      confidenceKind: graphConfidenceKindFromUnknown(record?.confidenceKind),
      sourceReceiptIds: cleanStrings(record?.sourceReceiptIds),
      ...graphElementDisplayMetadataFromRecord(record),
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
      judgeRationale: cleanText(record?.judgeRationale) || undefined,
      reviewState: reviewStateFrom(record?.reviewState ?? 'advisory'),
      confidence: confidenceFromUnknown(record?.confidence),
      confidenceKind: graphConfidenceKindFromUnknown(record?.confidenceKind),
      sourceReceiptIds: cleanStrings(record?.sourceReceiptIds),
      ...graphElementDisplayMetadataFromRecord(record),
    }];
  });
}

function graphElementDisplayMetadataFromRecord(record: Record<string, unknown> | null | undefined) {
  if (!record) return {};
  const recordedAt = cleanText(record.recordedAt);
  const invalidatedAt = cleanText(record.invalidatedAt);
  const supersededBy = cleanText(record.supersededBy);
  const invalidationReason = graphInvalidationReasonFromUnknown(record.invalidationReason);
  const rationale = cleanText(record.rationale);
  const derivedFrom = cleanStrings(record.derivedFrom);
  const generatedBy = graphGeneratedByFromUnknown(record.generatedBy);
  return {
    ...(recordedAt ? { recordedAt } : {}),
    ...(invalidatedAt ? { invalidatedAt } : {}),
    ...(supersededBy ? { supersededBy } : {}),
    ...(invalidationReason ? { invalidationReason } : {}),
    ...(rationale ? { rationale } : {}),
    ...(derivedFrom.length ? { derivedFrom } : {}),
    ...(generatedBy ? { generatedBy } : {}),
  };
}

function graphInvalidationReasonFromUnknown(value: unknown): 'CONTRADICTED' | 'SOURCE_RETRACTED' | 'TEMPORAL_EXPIRY' | 'HUMAN_OVERRIDE' | undefined {
  return value === 'CONTRADICTED' ||
    value === 'SOURCE_RETRACTED' ||
    value === 'TEMPORAL_EXPIRY' ||
    value === 'HUMAN_OVERRIDE'
    ? value
    : undefined;
}

function graphConfidenceKindFromUnknown(value: unknown): 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' | 'ASSESSED' | undefined {
  return value === 'EXTRACTED' || value === 'INFERRED' || value === 'AMBIGUOUS' || value === 'ASSESSED' ? value : undefined;
}

function graphGeneratedByFromUnknown(value: unknown): CapsuleGraphNodeDisplay['generatedBy'] {
  const record = asRecord(value);
  if (!record) return undefined;
  const actorType = record.actorType === 'model' ? 'model' : record.actorType === 'human' ? 'human' : null;
  const actorId = cleanText(record.actorId);
  const at = cleanText(record.at);
  const activity = graphGeneratedByActivityFromUnknown(record.activity);
  return actorType && actorId && at && activity ? { actorType, actorId, at, activity } : undefined;
}

function graphGeneratedByActivityFromUnknown(value: unknown): NonNullable<CapsuleGraphNodeDisplay['generatedBy']>['activity'] | undefined {
  return value === 'extraction' ||
    value === 'proposal' ||
    value === 'review_decision' ||
    value === 'import' ||
    value === 'quality_review'
    ? value
    : undefined;
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

function arrayUnknown(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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

function scalarStringOrNumber(value: unknown): string | number | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function embeddingFromUnknown(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const numbers = value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item));
  return numbers.length === value.length ? numbers : null;
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

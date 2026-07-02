import {
  normalizeContextCapsuleV2,
  type ContextCapsuleClaim,
  type ContextCapsuleClaimCausalLinks,
  type ContextCapsuleNormalizeOptions,
  type ContextCapsuleOutputContract,
  type ContextCapsuleSourceRef,
  type ContextCapsuleV2,
  type EvidenceReceipt,
  type SourceSupportState,
} from '@/lib/context/capsule-v2';
import { TACITUS_CORE_PRIMITIVES, type TacitusCorePrimitive } from '@/lib/graph/core-primitives';
import {
  type CapsuleContextCaptureProfile,
  type CapsuleLocalOntologyExtension,
  type CapsuleOntologyBindingProfile,
  type CapsuleOntologyEntitySubtype,
  type CapsuleOntologyRelationshipSubtype,
} from '@/lib/product/context-capsules';
import { getOntology } from '@/lib/ontology/registry';
import { isOntologyId, type OntologyId } from '@/lib/ontology/types';
import {
  AGENTIC_RESEARCH_EVAL_SCENARIOS,
  buildDefaultAgenticResearchEvalRun,
  summarizeAgenticResearchEval,
} from '@/lib/agent-runtime/research-eval';

export const CONTEXT_CAPSULE_V3_SECTION_IDS = [
  'identity',
  'businessUseCase',
  'humanTacitKnowledge',
  'sourceSpine',
  'contextCaptureProfile',
  'grounding',
  'claimLedger',
  'reasoningScaffold',
  'agentOperatingContract',
  'memoryPosture',
  'governance',
  'marketplaceProfile',
  'outputContracts',
  'evaluation',
] as const;

export type ContextCapsuleV3SectionId = (typeof CONTEXT_CAPSULE_V3_SECTION_IDS)[number];

export type ContextCapsuleV3ReviewCardTarget =
  | 'advisoryMemory'
  | 'sourceGap'
  | 'graphProposal'
  | 'claimLedger'
  | 'agentInstructions';

export type CogneeAdvisoryOperation = 'remember' | 'recall' | 'improve' | 'forget';

export interface CogneeAdvisoryReceipt {
  datasetId: string;
  sourceCapsuleId: string;
  sourceCapsuleVersion: number;
  memoryItemId: string;
  confidence: number;
  sourceIds: string[];
  canonicality: 'canonical' | 'advisory';
  operation: CogneeAdvisoryOperation;
}

export interface ContextCapsuleV3ReviewCard {
  reviewCardId: string;
  capsuleId: string;
  capsuleVersion: number;
  target: ContextCapsuleV3ReviewCardTarget;
  title: string;
  rationale: string;
  sourceType: 'cognee' | 'agent' | 'source-gap' | 'quality-audit' | 'marketplace';
  state: 'proposed' | 'accepted' | 'rejected';
  requiresHumanReview: true;
  mutatesCanonicalState: false;
  evidenceSourceIds: string[];
  evidenceReceipts: CogneeAdvisoryReceipt[];
  proposedPatch: Record<string, unknown>;
}

export interface ContextCapsuleHumanTacitKnowledge {
  workingAssumptions: string[];
  hiddenConstraints: string[];
  redLines: string[];
  institutionalHabits: string[];
  approvalPolitics: string[];
  practicalHeuristics: string[];
  stakeholderSensitivities: string[];
  caveats: string[];
  recurringDecisions: string[];
  promptlessKnowledge: string[];
}

export interface ContextCapsuleSourceSpine {
  sourceRefs: ContextCapsuleSourceRef[];
  sourceIds: string[];
  requiredSourceTypes: string[];
  sourceGaps: string[];
  staleSourceIds: string[];
  unsupportedClaimIds: string[];
  independenceScore: number;
  freshnessWindowDays: number | null;
  score: number;
}

export type ContextCapsuleClaimV3 = ContextCapsuleClaim & {
  support: SourceSupportState;
  receipts: EvidenceReceipt[];
  validFrom: string | null;
  validUntil: string | null;
  asOf: string | null;
  causalLinks: Required<ContextCapsuleClaimCausalLinks>;
};

export interface ContextCapsuleCrossClaimContradiction {
  contradictionId: string;
  claimIds: [string, string];
  reason: string;
  evidenceSourceIds: string[];
  receiptDates: string[];
  reviewRequired: true;
}

export interface ContextCapsuleClaimLedgerV3 {
  allClaims: ContextCapsuleClaimV3[];
  supportedClaims: ContextCapsuleClaimV3[];
  weakClaims: ContextCapsuleClaimV3[];
  unsupportedClaims: ContextCapsuleClaimV3[];
  disputedClaims: ContextCapsuleClaimV3[];
  staleClaims: ContextCapsuleClaimV3[];
  inferredClaims: ContextCapsuleClaimV3[];
  crossClaimContradictions: ContextCapsuleCrossClaimContradiction[];
  forbiddenClaims: string[];
}

export interface ContextCapsuleAgentOperatingContract {
  allowedActions: string[];
  forbiddenActions: string[];
  sourceRequirements: string[];
  reviewCheckpoints: string[];
  toolRecommendations: string[];
  bestNextAction: string;
  handoffInstructions: string[];
  stopConditions: string[];
}

export interface ContextCapsuleMemoryPosture {
  canonicalCapsuleFacts: string[];
  advisoryCogneeRecall: string[];
  sessionMemory: string[];
  graphProposals: string[];
  staleAssumptions: string[];
  disputedClaims: string[];
  rejectedInferences: string[];
  cogneeDatasetId: string;
  cogneeMode: 'advisory-only';
  cogneeOperations: CogneeAdvisoryOperation[];
}

export interface ContextCapsuleGovernanceV3 {
  canonicalStore: 'Firestore ContextCapsules';
  humanGateRequired: boolean;
  humanGateStatus: ContextCapsuleV2['humanGate']['gateStatus'];
  authorId: string | null;
  reviewerId: string | null;
  reviewedAt: string | null;
  approvalId: string | null;
  agentsMayMutateCanonical: false;
  reviewCardsRequiredForTargets: ContextCapsuleV3ReviewCardTarget[];
}

export interface ContextCapsuleMarketplaceProfile {
  publicCandidate: boolean;
  forkable: boolean;
  reuseTerms: string;
  moderationSummary: string;
  shelves: CapsuleV3ShelfId[];
  trustBadges: CapsuleV3TrustBadgeId[];
  requiredBeforePublish: string[];
}

export type CapsuleV3ShelfId =
  | 'human-gated'
  | 'expert-pick'
  | 'agent-ready'
  | 'source-backed'
  | 'needs-refresh'
  | 'tacit-knowledge-rich'
  | 'marketplace-candidate'
  | 'public-forkable';

export type CapsuleV3TrustBadgeId =
  | 'human-written'
  | 'human-reviewed'
  | 'human-gated'
  | 'ai-proposal'
  | 'cognee-advisory'
  | 'source-gap'
  | 'stale'
  | 'rejected-inference';

export interface ContextCapsuleEvaluationV3 {
  qualityScore: number;
  tacitKnowledgeScore: number;
  sourceSpineScore: number;
  agentOperabilityScore: number;
  marketplaceReadinessScore: number;
  temporalityCoverage: number;
  causalityCoverage: number;
  ontologyBindingCoverage: number;
  receiptDepth: number;
  contradictionRate: number;
  groundedAnswerRate: number;
  sourceIndependence: number;
  capsuleVsGenericDelta: number;
  goldenQuestionEvals: Array<{
    questionId: string;
    prompt: string;
    praxisLabel: 'PRAXIS capsule-grounded answer';
    baselineLabel: 'Generic prompt-only LLM';
    capsuleScore: number;
    genericScore: number;
    delta: number;
    groundedAnswerRate: number;
    contradictionRate: number;
    sourceIndependence: number;
    sourceIds: string[];
    disputedClaimIds: string[];
    computedBy: 'deterministic-contract-eval';
  }>;
  openGaps: string[];
}

export type ContextCapsuleTimelineAnchorKind = 'as-of' | 'event' | 'deadline' | 'review' | 'validity-start' | 'validity-end';
export type ContextCapsuleCausalRelation = 'causes' | 'enables' | 'blocks' | 'escalates' | 'de-escalates' | 'correlates';

export interface ContextCapsuleTimelineAnchorV3 {
  id: string;
  label: string;
  date: string;
  kind: ContextCapsuleTimelineAnchorKind;
  sourceRefs: string[];
  confidence: number | null;
}

export interface ContextCapsuleCausalLinkV3 {
  id: string;
  cause: string;
  effect: string;
  relation: ContextCapsuleCausalRelation;
  evidenceRefs: string[];
  confidence: number | null;
  caveat: string | null;
}

export interface ContextCapsuleOntologyBindingV3 {
  domainId: string;
  taxonomyPath: string[];
  ontologyIds: OntologyId[];
  acoPrimitives: TacitusCorePrimitive[];
  bindingRationale: string;
}

export type ContextCapsuleGraphInvalidationReasonV3 = 'CONTRADICTED' | 'SOURCE_RETRACTED' | 'TEMPORAL_EXPIRY' | 'HUMAN_OVERRIDE';
export type ContextCapsuleGraphConfidenceKindV3 = 'EXTRACTED' | 'INFERRED' | 'ASSESSED';

export interface ContextCapsuleGraphGeneratedByV3 {
  actorType: 'model' | 'human';
  actorId: string;
  at: string;
  activity: 'extraction' | 'proposal' | 'review_decision' | 'import' | 'quality_review';
}

export interface ContextCapsuleGraphElementProvenanceV3 {
  recordedAt?: string;
  invalidatedAt?: string;
  supersededBy?: string;
  invalidationReason?: ContextCapsuleGraphInvalidationReasonV3;
  rationale?: string;
  derivedFrom?: string[];
  confidenceKind?: ContextCapsuleGraphConfidenceKindV3;
  generatedBy?: ContextCapsuleGraphGeneratedByV3;
}

export interface ContextCapsuleGraphLiteNodeV3 extends ContextCapsuleGraphElementProvenanceV3 {
  id: string;
  label: string;
  entityType: string;
  reviewState: 'canonical' | 'proposed' | 'missing' | 'advisory' | 'reviewed';
  confidence: number | null;
  sourceReceiptIds: string[];
}

export interface ContextCapsuleGraphLiteEdgeV3 extends ContextCapsuleGraphElementProvenanceV3 {
  id: string;
  source: string;
  target: string;
  label: string;
  relationshipType: string | null;
  judgeRationale?: string;
  reviewState: 'canonical' | 'proposed' | 'missing' | 'advisory' | 'reviewed';
  confidence: number | null;
  sourceReceiptIds: string[];
}

export interface ContextCapsuleEmbeddedGraphV3 {
  provider: 'graphlite';
  projectionId: string;
  status: 'compiled-advisory' | 'stale' | 'reviewed' | 'promoted';
  namedGraph: string;
  advisoryOnly: true;
  canonicalStore: 'Firestore ContextCapsules';
  promotionGate: string;
  nodeCount: number;
  edgeCount: number;
  nodes: ContextCapsuleGraphLiteNodeV3[];
  edges: ContextCapsuleGraphLiteEdgeV3[];
}

export interface ContextCapsuleGroundingV3 {
  temporality: {
    timelineAnchors: ContextCapsuleTimelineAnchorV3[];
    asOf: string | null;
    validFrom: string | null;
    validUntil: string | null;
  };
  causality: {
    causalLinks: ContextCapsuleCausalLinkV3[];
  };
  ontologyBinding: ContextCapsuleOntologyBindingV3;
  embeddedGraph: ContextCapsuleEmbeddedGraphV3;
}

export interface ContextCapsuleV3 {
  schemaVersion: 3;
  baseSchemaVersion: 2;
  sectionIds: ContextCapsuleV3SectionId[];
  identity: {
    capsuleId: string;
    ownerUid: string;
    label: string;
    summary: string;
    scope: string;
    capsuleVersion: number;
    capsuleClass: ContextCapsuleV2['capsuleClass'];
    capsuleMode: ContextCapsuleV2['capsuleMode'];
    visibility: ContextCapsuleV2['visibility'];
    forkability: ContextCapsuleV2['forkability'];
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
    canonicalStore: 'Firestore ContextCapsules';
  };
  businessUseCase: {
    purpose: string;
    useCase: string;
    audience: string[];
    domainTags: string[];
    decisionHorizon: string | null;
    updateCadence: string | null;
    bestNextAction: string;
  };
  humanTacitKnowledge: ContextCapsuleHumanTacitKnowledge;
  sourceSpine: ContextCapsuleSourceSpine;
  contextCaptureProfile: CapsuleContextCaptureProfile;
  grounding: ContextCapsuleGroundingV3;
  claimLedger: ContextCapsuleClaimLedgerV3;
  reasoningScaffold: {
    publicMethod: string[];
    caveats: string[];
    privateNotesRedacted: true;
    hiddenChainOfThoughtRedacted: true;
  };
  agentOperatingContract: ContextCapsuleAgentOperatingContract;
  memoryPosture: ContextCapsuleMemoryPosture;
  governance: ContextCapsuleGovernanceV3;
  marketplaceProfile: ContextCapsuleMarketplaceProfile;
  outputContracts: ContextCapsuleOutputContract[];
  evaluation: ContextCapsuleEvaluationV3;
  reviewCards: ContextCapsuleV3ReviewCard[];
}

export type CapsuleV3QualityBreakdownId =
  | 'tacit_knowledge'
  | 'source_spine'
  | 'agent_operability'
  | 'cognee_posture'
  | 'human_review'
  | 'marketplace_readiness'
  | 'source_freshness';

export interface CapsuleV3QualityBreakdownItem {
  id: CapsuleV3QualityBreakdownId;
  label: string;
  score: number;
  maxScore: number;
  diagnostics: string[];
}

export interface CapsuleV3QualityAuditResult {
  score: number;
  breakdown: CapsuleV3QualityBreakdownItem[];
  reviewCardTargets: ContextCapsuleV3ReviewCardTarget[];
  diagnostics: string[];
}

export interface CapsuleV3PublishIssue {
  code:
    | 'missing_human_author'
    | 'missing_human_reviewer'
    | 'missing_approval'
    | 'stale_human_gate'
    | 'unsupported_final_claims'
    | 'source_spine_below_threshold'
    | 'missing_reuse_terms'
    | 'missing_output_contract'
    | 'missing_moderation_summary'
    | 'agent_publish_forbidden';
  severity: 'warning' | 'error';
  message: string;
}

export interface CapsuleV3PublishResult {
  allowed: boolean;
  status: 'not_required' | 'needs_review' | 'review_needed' | 'stale' | 'human_gated' | 'blocked';
  issues: CapsuleV3PublishIssue[];
}

export interface CapsuleV3AgentRole {
  id:
    | 'capsule-editor-agent'
    | 'tacit-knowledge-interviewer'
    | 'source-spine-agent'
    | 'claim-ledger-agent'
    | 'cognee-memory-agent'
    | 'agent-operability-agent'
    | 'marketplace-curator-agent'
    | 'human-review-agent';
  label: string;
  reviewCardTargets: ContextCapsuleV3ReviewCardTarget[];
  allowedActions: string[];
  forbiddenActions: string[];
  canApproveOwnWork: false;
}

export const CAPSULE_V3_AGENT_ROLES: CapsuleV3AgentRole[] = [
  {
    id: 'capsule-editor-agent',
    label: 'Capsule Editor Agent',
    reviewCardTargets: ['claimLedger', 'agentInstructions'],
    allowedActions: ['rewrite_prose', 'preserve_receipts', 'surface_caveats'],
    forbiddenActions: ['write_canonical_capsule', 'drop_claim_receipts', 'approve_own_work'],
    canApproveOwnWork: false,
  },
  {
    id: 'tacit-knowledge-interviewer',
    label: 'Tacit Knowledge Interviewer',
    reviewCardTargets: ['agentInstructions'],
    allowedActions: ['ask_targeted_questions', 'summarize_hidden_constraints', 'surface_red_lines'],
    forbiddenActions: ['invent_tacit_knowledge', 'write_canonical_capsule', 'approve_own_work'],
    canApproveOwnWork: false,
  },
  {
    id: 'source-spine-agent',
    label: 'Source Spine Agent',
    reviewCardTargets: ['sourceGap', 'claimLedger'],
    allowedActions: ['audit_sources', 'flag_freshness', 'rank_source_gaps'],
    forbiddenActions: ['claim_source_support_without_receipt', 'write_canonical_capsule', 'approve_own_work'],
    canApproveOwnWork: false,
  },
  {
    id: 'claim-ledger-agent',
    label: 'Claim Ledger Agent',
    reviewCardTargets: ['claimLedger'],
    allowedActions: ['classify_claim_support', 'mark_weak_claims', 'separate_inferences'],
    forbiddenActions: ['promote_unsupported_claims', 'write_canonical_capsule', 'approve_own_work'],
    canApproveOwnWork: false,
  },
  {
    id: 'cognee-memory-agent',
    label: 'Cognee Memory Agent',
    reviewCardTargets: ['advisoryMemory', 'graphProposal'],
    allowedActions: ['recall_advisory_memory', 'improve_advisory_memory', 'create_review_cards'],
    forbiddenActions: ['remember_without_review', 'write_canonical_capsule', 'approve_own_work'],
    canApproveOwnWork: false,
  },
  {
    id: 'agent-operability-agent',
    label: 'Agent Operability Agent',
    reviewCardTargets: ['agentInstructions'],
    allowedActions: ['check_allowed_tools', 'check_stop_conditions', 'check_output_contracts'],
    forbiddenActions: ['authorize_external_actions', 'write_canonical_capsule', 'approve_own_work'],
    canApproveOwnWork: false,
  },
  {
    id: 'marketplace-curator-agent',
    label: 'Marketplace Curator Agent',
    reviewCardTargets: ['sourceGap', 'agentInstructions'],
    allowedActions: ['score_reuse_readiness', 'flag_moderation_risk', 'check_reuse_terms'],
    forbiddenActions: ['publish_capsule', 'write_canonical_capsule', 'approve_own_work'],
    canApproveOwnWork: false,
  },
  {
    id: 'human-review-agent',
    label: 'Human Review Agent',
    reviewCardTargets: ['advisoryMemory', 'sourceGap', 'graphProposal', 'claimLedger', 'agentInstructions'],
    allowedActions: ['prepare_review_packet', 'summarize_open_gates', 'route_to_human_approver'],
    forbiddenActions: ['approve_own_work', 'write_canonical_capsule', 'self_certify_human_review'],
    canApproveOwnWork: false,
  },
];

export function normalizeContextCapsuleV3(input: ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions = {}): ContextCapsuleV3 {
  const v2 = normalizeV2ForV3(input, options);
  const body = isRecord(input) ? input : {};
  const claimLedger = buildClaimLedger(v2);
  const sourceSpine = buildSourceSpine(v2, options, claimLedger.allClaims);
  const humanTacitKnowledge = normalizeTacitKnowledge(body.humanTacitKnowledge, v2);
  const contextCaptureProfile = buildContextCaptureProfile(v2, sourceSpine, body);
  const grounding = buildGrounding(body, v2, contextCaptureProfile);
  const agentOperatingContract = buildAgentOperatingContract(v2);
  const memoryPosture = buildMemoryPosture(v2, body.memoryPosture);
  const governance = buildGovernance(v2);
  const marketplaceProfile = buildMarketplaceProfile(v2, sourceSpine, humanTacitKnowledge);
  const evaluation = buildEvaluation(v2, sourceSpine, humanTacitKnowledge, agentOperatingContract, marketplaceProfile, grounding, claimLedger, options);

  const capsule: ContextCapsuleV3 = {
    schemaVersion: 3,
    baseSchemaVersion: 2,
    sectionIds: [...CONTEXT_CAPSULE_V3_SECTION_IDS],
    identity: {
      capsuleId: v2.capsuleId,
      ownerUid: v2.ownerUid,
      label: v2.label,
      summary: v2.summary,
      scope: v2.scope,
      capsuleVersion: v2.version,
      capsuleClass: v2.capsuleClass,
      capsuleMode: v2.capsuleMode,
      visibility: v2.visibility,
      forkability: v2.forkability,
      createdAt: v2.createdAt,
      updatedAt: v2.updatedAt,
      archivedAt: v2.archivedAt,
      canonicalStore: 'Firestore ContextCapsules',
    },
    businessUseCase: {
      purpose: v2.purpose,
      useCase: v2.useCase,
      audience: [...v2.audience],
      domainTags: [...v2.domainTags],
      decisionHorizon: v2.decisionHorizon,
      updateCadence: v2.updateCadence,
      bestNextAction: v2.bestNextAction,
    },
    humanTacitKnowledge,
    sourceSpine,
    contextCaptureProfile,
    grounding,
    claimLedger,
    reasoningScaffold: {
      publicMethod: [...v2.reasoningScaffold.publicMethod],
      caveats: [...v2.reasoningScaffold.caveats],
      privateNotesRedacted: true,
      hiddenChainOfThoughtRedacted: true,
    },
    agentOperatingContract,
    memoryPosture,
    governance,
    marketplaceProfile,
    outputContracts: v2.outputContracts.map((contract) => ({ ...contract })),
    evaluation,
    reviewCards: [],
  };

  return {
    ...capsule,
    reviewCards: buildDefaultReviewCards(capsule),
  };
}

export function buildCogneeAdvisoryReviewCard(
  capsule: ContextCapsuleV3 | ContextCapsuleV2 | unknown,
  receipt: CogneeAdvisoryReceipt,
  input: {
    target: ContextCapsuleV3ReviewCardTarget;
    title: string;
    rationale: string;
    proposedPatch?: Record<string, unknown>;
  },
): ContextCapsuleV3ReviewCard {
  const v3 = isContextCapsuleV3(capsule) ? capsule : normalizeContextCapsuleV3(capsule);
  return {
    reviewCardId: stableId(['cognee', v3.identity.capsuleId, receipt.datasetId, receipt.memoryItemId, input.target].join(':')),
    capsuleId: v3.identity.capsuleId,
    capsuleVersion: v3.identity.capsuleVersion,
    target: input.target,
    title: input.title,
    rationale: input.rationale,
    sourceType: 'cognee',
    state: 'proposed',
    requiresHumanReview: true,
    mutatesCanonicalState: false,
    evidenceSourceIds: [...receipt.sourceIds],
    evidenceReceipts: [{ ...receipt, sourceIds: [...receipt.sourceIds] }],
    proposedPatch: input.proposedPatch ?? {},
  };
}

export function buildCapsuleV3AgentReviewCards(
  capsule: ContextCapsuleV3 | ContextCapsuleV2 | unknown,
  agentRoleId: CapsuleV3AgentRole['id'],
): ContextCapsuleV3ReviewCard[] {
  const v3 = isContextCapsuleV3(capsule) ? capsule : normalizeContextCapsuleV3(capsule);
  const role = CAPSULE_V3_AGENT_ROLES.find((item) => item.id === agentRoleId);
  if (!role) return [];
  return role.reviewCardTargets.map((target) => ({
    reviewCardId: stableId(['agent', role.id, v3.identity.capsuleId, v3.identity.capsuleVersion, target].join(':')),
    capsuleId: v3.identity.capsuleId,
    capsuleVersion: v3.identity.capsuleVersion,
    target,
    title: `${role.label}: ${target}`,
    rationale: `${role.label} may propose ${target} changes, but canonical Firestore capsule fields change only after human review.`,
    sourceType: 'agent',
    state: 'proposed',
    requiresHumanReview: true,
    mutatesCanonicalState: false,
    evidenceSourceIds: v3.sourceSpine.sourceIds,
    evidenceReceipts: [],
    proposedPatch: {
      agentRoleId: role.id,
      allowedActions: role.allowedActions,
      forbiddenActions: role.forbiddenActions,
    },
  }));
}

export function deriveCapsuleV3QualityAudit(input: ContextCapsuleV3 | ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions = {}): CapsuleV3QualityAuditResult {
  const capsule = isContextCapsuleV3(input) ? input : normalizeContextCapsuleV3(input, options);
  const breakdown: CapsuleV3QualityBreakdownItem[] = [
    scoreItem('tacit_knowledge', 'Tacit knowledge', capsule.evaluation.tacitKnowledgeScore, 15, capsule.evaluation.tacitKnowledgeScore >= 12 ? [] : ['Tacit knowledge needs more human assumptions, red lines, or stakeholder sensitivities.']),
    scoreItem('source_spine', 'Source spine', capsule.evaluation.sourceSpineScore, 20, capsule.sourceSpine.score >= 80 ? [] : ['Source spine is below marketplace threshold.']),
    scoreItem('agent_operability', 'Agent operability', capsule.evaluation.agentOperabilityScore, 15, capsule.evaluation.agentOperabilityScore >= 12 ? [] : ['Agent contract needs actions, stop conditions, and source requirements.']),
    scoreItem('cognee_posture', 'Cognee posture', capsule.memoryPosture.cogneeMode === 'advisory-only' ? 100 : 0, 10, capsule.memoryPosture.cogneeMode === 'advisory-only' ? [] : ['Cognee must remain advisory.']),
    scoreItem('human_review', 'Human review', humanReviewScore(capsule), 15, humanReviewScore(capsule) >= 80 ? [] : ['Human review metadata is incomplete.']),
    scoreItem('marketplace_readiness', 'Marketplace readiness', capsule.evaluation.marketplaceReadinessScore, 15, capsule.evaluation.marketplaceReadinessScore >= 12 ? [] : ['Marketplace profile needs reuse terms, moderation summary, and publish gates.']),
    scoreItem('source_freshness', 'Source freshness', capsule.sourceSpine.staleSourceIds.length ? 0 : 10, 10, capsule.sourceSpine.staleSourceIds.length ? ['Stale source refs require refresh.'] : []),
  ];
  const diagnostics = breakdown.flatMap((item) => item.diagnostics);
  return {
    score: breakdown.reduce((sum, item) => sum + item.score, 0),
    breakdown,
    reviewCardTargets: ['advisoryMemory', 'sourceGap', 'graphProposal', 'claimLedger', 'agentInstructions'],
    diagnostics,
  };
}

export function canPublishCapsuleV3(input: ContextCapsuleV3 | ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions & { actor?: 'human' | 'agent' } = {}): CapsuleV3PublishResult {
  const capsule = isContextCapsuleV3(input) ? input : normalizeContextCapsuleV3(input, options);
  const issues: CapsuleV3PublishIssue[] = [];

  if (options.actor === 'agent') {
    issues.push({
      code: 'agent_publish_forbidden',
      severity: 'error',
      message: 'Agents can create review cards, but cannot publish governed capsules.',
    });
  }
  if (capsule.governance.humanGateRequired && !capsule.governance.authorId) {
    issues.push({ code: 'missing_human_author', severity: 'error', message: 'Marketplace publishing requires human author metadata.' });
  }
  if (capsule.governance.humanGateRequired && !capsule.governance.reviewerId) {
    issues.push({ code: 'missing_human_reviewer', severity: 'error', message: 'Marketplace publishing requires reviewer metadata.' });
  }
  if (capsule.governance.humanGateRequired && !capsule.governance.approvalId) {
    issues.push({ code: 'missing_approval', severity: 'error', message: 'Marketplace publishing requires an approval receipt.' });
  }
  if (isStale(capsule.governance.reviewedAt, capsule.identity.updatedAt, options.now) || capsule.governance.humanGateStatus === 'stale') {
    issues.push({ code: 'stale_human_gate', severity: 'error', message: 'Stale human gates must be refreshed before publishing.' });
  }
  if (capsule.claimLedger.unsupportedClaims.length || capsule.claimLedger.disputedClaims.length) {
    issues.push({ code: 'unsupported_final_claims', severity: 'error', message: 'Unsupported or disputed final claims block marketplace publishing.' });
  }
  if (capsule.sourceSpine.score < 80) {
    issues.push({ code: 'source_spine_below_threshold', severity: 'error', message: 'Source spine score must be at least 80 before publishing.' });
  }
  if (!hasExplicitReuseTerms(capsule.marketplaceProfile.reuseTerms)) {
    issues.push({ code: 'missing_reuse_terms', severity: 'error', message: 'Public/forkable capsules need explicit reuse terms.' });
  }
  if (!capsule.outputContracts.length) {
    issues.push({ code: 'missing_output_contract', severity: 'error', message: 'Publishing requires at least one output contract.' });
  }
  if (!capsule.marketplaceProfile.moderationSummary.trim()) {
    issues.push({ code: 'missing_moderation_summary', severity: 'error', message: 'Publishing requires a moderation-ready summary.' });
  }

  const status = publishStatus(capsule, issues);
  return {
    allowed: !issues.some((issue) => issue.severity === 'error') && status === 'human_gated',
    status,
    issues,
  };
}

function buildSourceSpine(v2: ContextCapsuleV2, options: ContextCapsuleNormalizeOptions, claims: ContextCapsuleClaimV3[] = buildClaimLedger(v2).allClaims): ContextCapsuleSourceSpine {
  const sourceIds = v2.sourceRefs.map((source) => source.sourceId);
  const sourceIdSet = new Set(sourceIds);
  const staleSourceIds = v2.sourceRefs
    .filter((source) => source.stale || isDateOlderThanWindow(source.date, v2.sourcePosture?.freshnessWindowDays ?? null, options.now))
    .map((source) => source.sourceId);
  const unsupportedClaimIds = claims
    .filter((claim) => claim.support === 'unsupported' || claim.support === 'needs_source' || claim.support === 'disputed' || claim.sourceRefIds.some((sourceId) => !sourceIdSet.has(sourceId)))
    .map((claim) => claim.claimId);
  const sourceGaps = [
    ...(!v2.sourceRefs.length ? ['Attach source receipts before final use.'] : []),
    ...unsupportedClaimIds.map((claimId) => `Claim ${claimId} needs source support.`),
    ...staleSourceIds.map((sourceId) => `Source ${sourceId} is stale.`),
  ];
  const independenceScore = scoreIndependence(v2.sourceRefs);
  const sourceCountScore = Math.min(1, v2.sourceRefs.length / 2);
  const reliabilityScore = average(v2.sourceRefs.map((source) => source.reliabilityTier === 1 ? 1 : source.reliabilityTier === 2 ? 0.75 : source.reliabilityTier === 3 ? 0.45 : 0.55), v2.sourceRefs.length ? 0.55 : 0);
  const claimSupportScore = average(claims.map((claim) => scoreClaimSupport(claim.support)), claims.length ? 0 : 0.75);
  const freshnessScore = staleSourceIds.length ? 0 : 1;
  const score = Math.round(100 * average([sourceCountScore, reliabilityScore, claimSupportScore, freshnessScore, independenceScore / 100], 0));
  return {
    sourceRefs: v2.sourceRefs.map((source) => ({ ...source })),
    sourceIds,
    requiredSourceTypes: v2.sourcePosture?.requiredSourceTypes ?? [],
    sourceGaps,
    staleSourceIds,
    unsupportedClaimIds,
    independenceScore,
    freshnessWindowDays: v2.sourcePosture?.freshnessWindowDays ?? null,
    score,
  };
}

function buildContextCaptureProfile(
  v2: ContextCapsuleV2,
  sourceSpine: ContextCapsuleSourceSpine,
  input: Record<string, unknown> = {},
): CapsuleContextCaptureProfile {
  const starterProfile = isRecord(input.contextCaptureProfile)
    ? input.contextCaptureProfile as unknown as CapsuleContextCaptureProfile
    : v2.starterSnapshot?.contextCaptureProfile;
  if (starterProfile) return cloneContextCaptureProfile(starterProfile, v2, sourceSpine);

  const ontologyIds = inferContextCaptureOntologyIds(v2);
  const sourceRefs = sourceSpine.sourceRefs.length
    ? sourceSpine.sourceRefs
    : [{
      sourceId: `${v2.capsuleId}:source-gap`,
      label: 'Source gap',
      url: null,
      publisher: null,
      date: null,
      reliabilityTier: null,
      stale: false,
    } satisfies ContextCapsuleSourceRef];
  const sourceBindings = sourceRefs.map((source) => ({
    sourceId: source.sourceId,
    sourceType: 'official' as const,
    ontologyIds,
    expectedEntities: [
      'actors named by the source',
      'institutions, programs, jurisdictions, or output owners',
    ],
    expectedClaims: [
      'source-backed claims, rules, risks, commitments, or decisions',
      'claims that remain unsupported or stale until refreshed',
    ],
    expectedEvents: [
      'dated actions, changes, reviews, decisions, or incidents',
    ],
    expectedDates: [
      source.date ?? 'as-of date, publication date, deadline, or review date',
    ],
    freshnessCadence: v2.updateCadence ?? (source.stale ? 'refresh before use' : 'refresh before external or high-stakes use'),
    forbiddenInferences: [
      'Do not infer canonical facts without a source, document, or run receipt.',
      'Do not treat advisory Cognee recall or graph candidates as reviewed truth.',
      'Do not convert stale or missing-source claims into confident generation.',
    ],
    captureRationale: `Bind ${source.label} to ${ontologyIds.join(', ')} so extraction stays source-bound and reviewable.`,
  }));
  const profileId = `${v2.capsuleId}-context-capture-v1`;
  const ontologyBinding = buildContextCaptureOntologyBinding(v2, sourceBindings);

  return {
    profileId,
    ontologyBinding,
    sourceBindings,
    usageInference: {
      activationSignals: withFallback(v2.evidenceRequirements, [
        'Use when the answer depends on source-bound claims, dates, actors, risks, or decisions.',
        'Use when the capsule needs to decide which source lanes and graph candidates should enter generation.',
      ]).slice(0, 8),
      userJobs: withFallback([v2.useCase, v2.bestNextAction].filter(Boolean), [
        'Produce a sourced answer while keeping unsupported claims visible.',
      ]).slice(0, 5),
      outputFit: withFallback(v2.outputContracts.map((contract) => contract.label), [
        'memo',
        'brief',
        'sourceability review',
      ]).slice(0, 6),
      contraindications: [
        'Do not use when no source, document, run receipt, or explicit source gap can be carried forward.',
        'Do not use to promote advisory Cognee memory, graph candidates, stale claims, or unsupported inferences as canonical.',
      ],
      nextBestActions: [
        'Refresh source receipts before confident generation.',
        'Create review-card proposals for graph, Cognee memory, and unsupported-claim candidates.',
        'Carry source gaps into the answer instead of hiding them.',
      ],
      confidenceThresholds: {
        confidentGenerationRequiresEvidence: 0.72,
        advisoryGenerationMaxConfidence: 0.6,
        cogneeRecallMaxConfidence: 0.6,
      },
    },
    embeddedGraph: {
      allowedNodeTypes: ['Actor', 'Claim', 'Decision', 'Event', 'OpenQuestion', 'Risk', 'Rule', 'Source'],
      allowedEdgeTypes: ['CITED_BY', 'CONTRADICTS', 'DEPENDS_ON', 'INVOLVES', 'SUPPORTED_BY', 'TRIGGERS_REVIEW'],
      allowedAcoPrimitives: ['Actor', 'Claim', 'Interest', 'Constraint', 'Leverage', 'Commitment', 'Event', 'Narrative'],
      requiredProvenance: ['sourceIds', 'documentIds', 'runIds'],
      reviewState: 'proposed',
      promotionGate: 'Human review-card approval is required before canonical graph promotion.',
      proposalOnly: true,
      confidenceCap: 0.6,
      unsupportedClaimPolicy: 'Unsupported claims remain source gaps, OpenQuestion/Risk candidates, or rejected inferences until reviewed.',
    },
    generationImpact: {
      profileId: `${profileId}-generation-impact`,
      improves: [
        'Select source-bound ontology and graph candidates before generation.',
        'Expose source gaps and freshness constraints before confident answers.',
      ],
      suppresses: [
        'Suppress unsupported, stale, single-source, or Cognee-derived claims as canonical conclusions.',
        'Suppress graph-centrality and ontology-fit claims unless source/document/run provenance exists.',
      ],
      evidenceRequiredBeforeConfidentGeneration: [
        'At least one source, document, or run receipt for every confident factual claim.',
        'Review-card proposal id for every Cognee or Capsule+ graph candidate.',
      ],
      unsupportedClaimWarnings: [
        'No unsupported, stale, or Cognee-derived claim can be marked canonical without human review.',
      ],
      advisoryOnly: true,
      confidenceCap: 0.6,
    },
    cogneeCapture: {
      seedDocumentIds: v2.starterSnapshot?.cogneeProfile?.seedDocuments.map((document) => document.id) ?? [],
      advisoryOnly: true,
      canonicalTruth: 'Firestore ContextCapsules',
      usedMemoryReceiptField: 'usedMemoryItemIds',
      ignoredMemoryReceiptField: 'ignoredMemoryItemIds',
      reviewCardPromotionRequired: true,
    },
    reviewState: 'proposed',
    canonicalTruth: 'Firestore ContextCapsules',
  };
}

function cloneContextCaptureProfile(
  profile: CapsuleContextCaptureProfile,
  v2: ContextCapsuleV2,
  _sourceSpine: ContextCapsuleSourceSpine,
): CapsuleContextCaptureProfile {
  const rawProfile = profile as CapsuleContextCaptureProfile & { ontologyBinding?: CapsuleOntologyBindingProfile };
  const ontologyBinding = buildContextCaptureOntologyBinding(v2, profile.sourceBindings, rawProfile.ontologyBinding);
  return {
    ...profile,
    ontologyBinding,
    sourceBindings: profile.sourceBindings.map((binding) => ({
      ...binding,
      ontologyIds: [...binding.ontologyIds],
      expectedEntities: [...binding.expectedEntities],
      expectedClaims: [...binding.expectedClaims],
      expectedEvents: [...binding.expectedEvents],
      expectedDates: [...binding.expectedDates],
      forbiddenInferences: [...binding.forbiddenInferences],
    })),
    usageInference: {
      ...profile.usageInference,
      activationSignals: [...profile.usageInference.activationSignals],
      userJobs: [...profile.usageInference.userJobs],
      outputFit: [...profile.usageInference.outputFit],
      contraindications: [...profile.usageInference.contraindications],
      nextBestActions: [...profile.usageInference.nextBestActions],
      confidenceThresholds: { ...profile.usageInference.confidenceThresholds },
    },
    embeddedGraph: {
      ...profile.embeddedGraph,
      allowedNodeTypes: [...profile.embeddedGraph.allowedNodeTypes],
      allowedEdgeTypes: [...profile.embeddedGraph.allowedEdgeTypes],
      allowedAcoPrimitives: [...profile.embeddedGraph.allowedAcoPrimitives],
      requiredProvenance: [...profile.embeddedGraph.requiredProvenance],
    },
    generationImpact: {
      ...profile.generationImpact,
      improves: [...profile.generationImpact.improves],
      suppresses: [...profile.generationImpact.suppresses],
      evidenceRequiredBeforeConfidentGeneration: [...profile.generationImpact.evidenceRequiredBeforeConfidentGeneration],
      unsupportedClaimWarnings: [...profile.generationImpact.unsupportedClaimWarnings],
    },
    cogneeCapture: {
      ...profile.cogneeCapture,
      seedDocumentIds: [...profile.cogneeCapture.seedDocumentIds],
    },
  };
}

function buildContextCaptureOntologyBinding(
  v2: ContextCapsuleV2,
  sourceBindings: CapsuleContextCaptureProfile['sourceBindings'],
  explicit?: Partial<CapsuleOntologyBindingProfile> | null,
): CapsuleOntologyBindingProfile {
  const explicitOntologyIds = cleanStringArray(explicit?.ontologyIds).filter(isOntologyId) as OntologyId[];
  const ontologyIds = withFallback(
    explicitOntologyIds,
    dedupeStrings([
      ...sourceBindings.flatMap((binding) => binding.ontologyIds),
      ...inferContextCaptureOntologyIds(v2),
    ]).filter(isOntologyId) as OntologyId[],
  );
  const localExtensions = normalizeLocalOntologyExtensions(explicit?.localExtensions);
  const globalEntitySubtypes = dedupeByString([
    ...(explicit?.entitySubtypes ?? []).filter(isOntologyEntitySubtype),
    ...ontologyIds.flatMap((ontologyId) => {
      try {
        return getOntology(ontologyId).nodeTypes.map((node): CapsuleOntologyEntitySubtype => ({
          subtypeId: node.id,
          label: node.label,
          primitive: node.primitive,
          description: node.description,
          source: 'global',
        }));
      } catch {
        return [];
      }
    }),
    ...TACITUS_CORE_PRIMITIVES.map((primitive): CapsuleOntologyEntitySubtype => ({
      subtypeId: primitive.toLowerCase(),
      label: primitive,
      primitive,
      description: `Base ACO primitive ${primitive}.`,
      source: 'global',
    })),
  ], (item) => item.subtypeId);
  const globalRelationshipSubtypes = dedupeByString([
    ...(explicit?.relationshipSubtypes ?? []).filter(isOntologyRelationshipSubtype),
    ...ontologyIds.flatMap((ontologyId) => {
      try {
        return getOntology(ontologyId).edgeTypes.map((edge): CapsuleOntologyRelationshipSubtype => ({
          subtypeId: edge.id,
          label: edge.label,
          from: [...edge.from],
          to: [...edge.to],
          description: edge.description,
          source: 'global',
        }));
      } catch {
        return [];
      }
    }),
  ], (item) => item.subtypeId);
  const localEntitySubtypes = localExtensions
    .filter((extension) => extension.kind === 'entity' && extension.primitive)
    .map((extension): CapsuleOntologyEntitySubtype => ({
      subtypeId: extension.subtypeId,
      label: extension.label,
      primitive: extension.primitive!,
      description: extension.description,
      source: 'capsule-local',
      extensionId: extension.extensionId,
    }));
  const localRelationshipSubtypes = localExtensions
    .filter((extension) => extension.kind === 'relationship' && extension.from?.length && extension.to?.length)
    .map((extension): CapsuleOntologyRelationshipSubtype => ({
      subtypeId: extension.subtypeId,
      label: extension.label,
      from: extension.from ?? [],
      to: extension.to ?? [],
      description: extension.description,
      source: 'capsule-local',
      extensionId: extension.extensionId,
    }));

  return {
    ontologyIds,
    domainId: cleanString(explicit?.domainId) || v2.domainTags[0] || 'generic',
    entitySubtypes: dedupeByString([...globalEntitySubtypes, ...localEntitySubtypes], (item) => `${item.source}:${item.subtypeId}`),
    relationshipSubtypes: dedupeByString([...globalRelationshipSubtypes, ...localRelationshipSubtypes], (item) => `${item.source}:${item.subtypeId}`),
    localExtensions,
    unknownTypePolicy: 'candidate-extension-review-card',
    promotionGate: 'ADMIN_ALLOWLIST',
    canonicalStore: 'Firestore ContextCapsules',
  };
}

function normalizeLocalOntologyExtensions(value: unknown): CapsuleLocalOntologyExtension[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index): CapsuleLocalOntologyExtension[] => {
    const record = isRecord(item) ? item : {};
    const subtypeId = cleanString(record.subtypeId);
    const kind = record.kind === 'relationship' ? 'relationship' : record.kind === 'entity' ? 'entity' : null;
    if (!subtypeId || !kind) return [];
    const primitive = cleanString(record.primitive);
    const extension: CapsuleLocalOntologyExtension = {
      extensionId: cleanString(record.extensionId) || `local-extension-${index + 1}`,
      kind,
      subtypeId,
      label: cleanString(record.label) || labelizeSubtype(subtypeId),
      description: cleanString(record.description) || `Capsule-local ${kind} subtype ${subtypeId}.`,
      status: record.status === 'approved-local' || record.status === 'promoted' ? record.status : 'candidate',
      evidenceIds: cleanStringArray(record.evidenceIds).slice(0, 20),
      createdAt: cleanString(record.createdAt) || null,
    };
    if (kind === 'entity' && isTacitusCorePrimitive(primitive)) extension.primitive = primitive;
    if (kind === 'relationship') {
      extension.from = cleanStringArray(record.from).filter(isTacitusCorePrimitive) as TacitusCorePrimitive[];
      extension.to = cleanStringArray(record.to).filter(isTacitusCorePrimitive) as TacitusCorePrimitive[];
    }
    return [extension];
  }).slice(0, 50);
}

function isOntologyEntitySubtype(value: unknown): value is CapsuleOntologyEntitySubtype {
  return isRecord(value)
    && typeof value.subtypeId === 'string'
    && typeof value.label === 'string'
    && typeof value.primitive === 'string'
    && isTacitusCorePrimitive(value.primitive)
    && typeof value.description === 'string'
    && (value.source === 'global' || value.source === 'capsule-local');
}

function isOntologyRelationshipSubtype(value: unknown): value is CapsuleOntologyRelationshipSubtype {
  return isRecord(value)
    && typeof value.subtypeId === 'string'
    && typeof value.label === 'string'
    && Array.isArray(value.from)
    && Array.isArray(value.to)
    && typeof value.description === 'string'
    && (value.source === 'global' || value.source === 'capsule-local');
}

function buildGrounding(
  input: Record<string, unknown>,
  v2: ContextCapsuleV2,
  profile: CapsuleContextCaptureProfile,
): ContextCapsuleGroundingV3 {
  const explicitGrounding = isRecord(input.grounding) ? input.grounding : {};
  const temporalityInput = isRecord(explicitGrounding.temporality)
    ? explicitGrounding.temporality
    : isRecord(input.temporality)
      ? input.temporality
      : {};
  const causalityInput = isRecord(explicitGrounding.causality)
    ? explicitGrounding.causality
    : isRecord(input.causality)
      ? input.causality
      : {};
  const ontologyInput = isRecord(explicitGrounding.ontologyBinding)
    ? explicitGrounding.ontologyBinding
    : isRecord(input.ontologyBinding)
      ? input.ontologyBinding
      : {};
  const graphInput = firstRecord(
    explicitGrounding.embeddedGraph,
    input.embeddedGraph,
    input.graphLiteProjection,
    isRecord(input.starterSnapshot) ? input.starterSnapshot.graphLiteProjection : undefined,
    isRecord(v2.starterSnapshot) ? v2.starterSnapshot.graphLiteProjection : undefined,
  ) ?? {};

  const inferredOntologyIds = dedupeStrings([
    ...profile.sourceBindings.flatMap((binding) => binding.ontologyIds),
    ...inferContextCaptureOntologyIds(v2),
  ]).filter(isOntologyId) as OntologyId[];
  const domainId = cleanString(ontologyInput.domainId)
    || cleanString(input.persona && isRecord(input.persona) ? input.persona.domain : undefined)
    || v2.domainTags[0]
    || 'generic';
  const taxonomyPath = withFallback(cleanStringArray(ontologyInput.taxonomyPath), domainId === 'generic' ? ['generic'] : ['generic', domainId]);
  const ontologyIds = withFallback(cleanStringArray(ontologyInput.ontologyIds).filter(isOntologyId) as OntologyId[], inferredOntologyIds.length ? inferredOntologyIds : ['governance']);
  const acoPrimitives = withFallback(
    cleanStringArray(ontologyInput.acoPrimitives).filter(isTacitusCorePrimitive) as TacitusCorePrimitive[],
    profile.embeddedGraph.allowedAcoPrimitives.filter(isTacitusCorePrimitive) as TacitusCorePrimitive[],
  );
  const embeddedGraph = normalizeGraphLiteProjection(graphInput, v2);

  return {
    temporality: {
      timelineAnchors: normalizeTimelineAnchors(temporalityInput.timelineAnchors),
      asOf: cleanString(temporalityInput.asOf) || null,
      validFrom: cleanString(temporalityInput.validFrom) || null,
      validUntil: cleanString(temporalityInput.validUntil) || null,
    },
    causality: {
      causalLinks: normalizeCausalLinks(causalityInput.causalLinks),
    },
    ontologyBinding: {
      domainId,
      taxonomyPath,
      ontologyIds,
      acoPrimitives: acoPrimitives.length ? acoPrimitives : ['Actor', 'Claim'],
      bindingRationale: cleanString(ontologyInput.bindingRationale)
        || `Bind ${v2.label} to ${ontologyIds.join(', ')} with ACO primitives ${acoPrimitives.join(', ') || 'Actor, Claim'}.`,
    },
    embeddedGraph,
  };
}

function normalizeTimelineAnchors(value: unknown): ContextCapsuleTimelineAnchorV3[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index): ContextCapsuleTimelineAnchorV3[] => {
    const record = isRecord(item) ? item : {};
    const label = cleanString(record.label);
    const date = cleanString(record.date);
    if (!label || !date) return [];
    return [{
      id: cleanString(record.id) || `timeline-anchor-${index + 1}`,
      label,
      date,
      kind: timelineAnchorKindFromUnknown(record.kind),
      sourceRefs: cleanStringArray(record.sourceRefs),
      confidence: confidenceFromUnknown(record.confidence),
    }];
  });
}

function normalizeCausalLinks(value: unknown): ContextCapsuleCausalLinkV3[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index): ContextCapsuleCausalLinkV3[] => {
    const record = isRecord(item) ? item : {};
    const cause = cleanString(record.cause);
    const effect = cleanString(record.effect);
    if (!cause || !effect) return [];
    return [{
      id: cleanString(record.id) || `causal-link-${index + 1}`,
      cause,
      effect,
      relation: causalRelationFromUnknown(record.relation),
      evidenceRefs: cleanStringArray(record.evidenceRefs),
      confidence: confidenceFromUnknown(record.confidence),
      caveat: cleanString(record.caveat) || null,
    }];
  });
}

function normalizeGraphLiteProjection(value: Record<string, unknown>, v2: ContextCapsuleV2): ContextCapsuleEmbeddedGraphV3 {
  const projectionId = cleanString(value.projectionId) || `${v2.capsuleId}-graphlite-projection`;
  const nodes = normalizeGraphLiteNodes(value.nodes);
  const edges = normalizeGraphLiteEdges(value.edges);
  return {
    provider: 'graphlite',
    projectionId,
    status: graphLiteStatusFromUnknown(value.status),
    namedGraph: cleanString(value.namedGraph) || `capsule_${v2.capsuleId.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`,
    advisoryOnly: true,
    canonicalStore: 'Firestore ContextCapsules',
    promotionGate: cleanString(value.promotionGate) || 'Human review-card approval required before canonical graph promotion.',
    nodeCount: numberFromUnknown(value.nodeCount) ?? nodes.length,
    edgeCount: numberFromUnknown(value.edgeCount) ?? edges.length,
    nodes,
    edges,
  };
}

function normalizeGraphLiteNodes(value: unknown): ContextCapsuleGraphLiteNodeV3[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): ContextCapsuleGraphLiteNodeV3[] => {
    const record = isRecord(item) ? item : {};
    const id = cleanString(record.id);
    if (!id) return [];
    return [{
      id,
      label: cleanString(record.label) || id,
      entityType: cleanString(record.entityType) || 'Policy',
      reviewState: reviewStateFromUnknown(record.reviewState),
      confidence: confidenceFromUnknown(record.confidence),
      sourceReceiptIds: cleanStringArray(record.sourceReceiptIds),
      ...graphElementProvenanceFromRecord(record),
    }];
  });
}

function normalizeV2ForV3(input: ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions): ContextCapsuleV2 {
  if (options.now === undefined && isContextCapsuleV2(input)) {
    return input;
  }
  return normalizeContextCapsuleV2(input, options);
}

function normalizeGraphLiteEdges(value: unknown): ContextCapsuleGraphLiteEdgeV3[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index): ContextCapsuleGraphLiteEdgeV3[] => {
    const record = isRecord(item) ? item : {};
    const source = cleanString(record.source);
    const target = cleanString(record.target);
    if (!source || !target) return [];
    return [{
      id: cleanString(record.id) || `graphlite-edge-${index + 1}`,
      source,
      target,
      label: cleanString(record.label) || cleanString(record.relationshipType) || 'related to',
      relationshipType: cleanString(record.relationshipType) || null,
      ...(cleanString(record.judgeRationale) ? { judgeRationale: cleanString(record.judgeRationale) } : {}),
      reviewState: reviewStateFromUnknown(record.reviewState),
      confidence: confidenceFromUnknown(record.confidence),
      sourceReceiptIds: cleanStringArray(record.sourceReceiptIds),
      ...graphElementProvenanceFromRecord(record),
    }];
  });
}

function graphElementProvenanceFromRecord(record: Record<string, unknown>): ContextCapsuleGraphElementProvenanceV3 {
  const recordedAt = cleanString(record.recordedAt);
  const invalidatedAt = cleanString(record.invalidatedAt);
  const supersededBy = cleanString(record.supersededBy);
  const invalidationReason = graphInvalidationReasonFromUnknown(record.invalidationReason);
  const rationale = cleanString(record.rationale);
  const derivedFrom = cleanStringArray(record.derivedFrom);
  const confidenceKind = graphConfidenceKindFromUnknown(record.confidenceKind);
  const generatedBy = graphGeneratedByFromUnknown(record.generatedBy);
  return {
    ...(recordedAt ? { recordedAt } : {}),
    ...(invalidatedAt ? { invalidatedAt } : {}),
    ...(supersededBy ? { supersededBy } : {}),
    ...(invalidationReason ? { invalidationReason } : {}),
    ...(rationale ? { rationale } : {}),
    ...(derivedFrom.length ? { derivedFrom } : {}),
    ...(confidenceKind ? { confidenceKind } : {}),
    ...(generatedBy ? { generatedBy } : {}),
  };
}

function graphGeneratedByFromUnknown(value: unknown): ContextCapsuleGraphGeneratedByV3 | undefined {
  if (!isRecord(value)) return undefined;
  const actorType = value.actorType === 'human' ? 'human' : value.actorType === 'model' ? 'model' : null;
  const activity = graphGeneratedByActivityFromUnknown(value.activity);
  const actorId = cleanString(value.actorId);
  const at = cleanString(value.at);
  if (!actorType || !activity || !actorId || !at) return undefined;
  return { actorType, actorId, at, activity };
}

function graphGeneratedByActivityFromUnknown(value: unknown): ContextCapsuleGraphGeneratedByV3['activity'] | null {
  return value === 'extraction' ||
    value === 'proposal' ||
    value === 'review_decision' ||
    value === 'import' ||
    value === 'quality_review'
    ? value
    : null;
}

function graphInvalidationReasonFromUnknown(value: unknown): ContextCapsuleGraphInvalidationReasonV3 | undefined {
  return value === 'CONTRADICTED' ||
    value === 'SOURCE_RETRACTED' ||
    value === 'TEMPORAL_EXPIRY' ||
    value === 'HUMAN_OVERRIDE'
    ? value
    : undefined;
}

function graphConfidenceKindFromUnknown(value: unknown): ContextCapsuleGraphConfidenceKindV3 | undefined {
  return value === 'EXTRACTED' || value === 'INFERRED' || value === 'ASSESSED' ? value : undefined;
}

function inferContextCaptureOntologyIds(v2: ContextCapsuleV2): OntologyId[] {
  const text = `${v2.domainTags.join(' ')} ${v2.useCase} ${v2.summary}`.toLowerCase();
  const ids: OntologyId[] = ['governance'];
  if (/conflict|war|mediation|ceasefire|negotiation/.test(text)) ids.push('conflict', 'mediation', 'security');
  if (/humanitarian|rights|atrocity|displacement|refugee|access/.test(text)) ids.push('humanitarian', 'human-rights');
  if (/economic|finance|sanction|market|procurement|risk/.test(text)) ids.push('economic', 'legal');
  if (/narrative|media|misinformation|story/.test(text)) ids.push('narrative');
  return dedupeStrings(ids).slice(0, 5) as OntologyId[];
}

export function computeClaimSupportFromReceipts(receipts: EvidenceReceipt[]): SourceSupportState {
  if (!receipts.length) return 'needs_source';
  const stances = receipts.map((receipt) => receipt.stance ?? 'supports');
  const supports = stances.filter((stance) => stance === 'supports').length;
  const contradicts = stances.filter((stance) => stance === 'contradicts' || stance === 'mixed').length;
  if (contradicts > 0 && supports > 0) return 'disputed';
  if (contradicts > 0) return 'disputed';
  if (!supports) return 'needs_source';
  const confidenceScore = average(receipts.map((receipt) => receipt.confidence ?? 0.6), 0.6);
  const reliabilityScore = average(receipts.map((receipt) => receipt.reliabilityTier === 1 ? 1 : receipt.reliabilityTier === 2 ? 0.78 : 0.55), 0.55);
  return confidenceScore >= 0.72 && reliabilityScore >= 0.72 ? 'supported' : 'partially_supported';
}

export function claimsValidAt(input: ContextCapsuleV3 | ContextCapsuleV2 | unknown, asOf: string | Date): ContextCapsuleClaimV3[] {
  const capsule = isContextCapsuleV3(input)
    ? migrateContextCapsuleV3ClaimLedger(input)
    : normalizeContextCapsuleV3(input, { now: asOf });
  return capsule.claimLedger.allClaims.filter((claim) => claimIsValidAt(claim, asOf));
}

export interface CapsuleOntologyTypeCandidateInput {
  kind: 'entity' | 'relationship';
  subtypeId: string;
  label?: string | null;
  primitive?: TacitusCorePrimitive | string | null;
  from?: string[] | null;
  to?: string[] | null;
  evidenceIds?: string[] | null;
  description?: string | null;
}

export function validateCapsuleOntologyType(
  input: ContextCapsuleV3 | ContextCapsuleV2 | unknown,
  candidate: CapsuleOntologyTypeCandidateInput,
): { known: true } | { known: false; extension: CapsuleLocalOntologyExtension } {
  const capsule = isContextCapsuleV3(input)
    ? migrateContextCapsuleV3ClaimLedger(input)
    : normalizeContextCapsuleV3(input);
  const subtypeId = cleanString(candidate.subtypeId);
  const normalized = normalizeSubtypeKey(subtypeId);
  if (!subtypeId) {
    return {
      known: false,
      extension: buildCandidateExtension({ ...candidate, subtypeId: 'unknown_subtype' }),
    };
  }
  if (candidate.kind === 'entity') {
    const knownEntityKeys = new Set([
      ...capsule.contextCaptureProfile.ontologyBinding.entitySubtypes.flatMap((item) => [
        normalizeSubtypeKey(item.subtypeId),
        normalizeSubtypeKey(item.label),
        normalizeSubtypeKey(item.primitive),
      ]),
      ...capsule.contextCaptureProfile.embeddedGraph.allowedNodeTypes.map(normalizeSubtypeKey),
    ]);
    return knownEntityKeys.has(normalized)
      ? { known: true }
      : { known: false, extension: buildCandidateExtension(candidate) };
  }
  const knownRelationshipKeys = new Set([
    ...capsule.contextCaptureProfile.ontologyBinding.relationshipSubtypes.flatMap((item) => [
      normalizeSubtypeKey(item.subtypeId),
      normalizeSubtypeKey(item.label),
    ]),
    ...capsule.contextCaptureProfile.embeddedGraph.allowedEdgeTypes.map(normalizeSubtypeKey),
  ]);
  return knownRelationshipKeys.has(normalized)
    ? { known: true }
    : { known: false, extension: buildCandidateExtension(candidate) };
}

export function migrateContextCapsuleV3ClaimLedger(capsule: ContextCapsuleV3): ContextCapsuleV3 {
  const sourceById = new Map(capsule.sourceSpine.sourceRefs.map((source) => [source.sourceId, source]));
  const allClaims = capsule.claimLedger.allClaims.map((claim, index) => normalizeClaimForV3(claim, index, sourceById));
  return {
    ...capsule,
    claimLedger: buildClaimLedgerFromClaims(allClaims, capsule.reasoningScaffold.caveats),
  };
}

function buildCandidateExtension(candidate: CapsuleOntologyTypeCandidateInput): CapsuleLocalOntologyExtension {
  const subtypeId = cleanString(candidate.subtypeId) || 'unknown_subtype';
  const primitive = cleanString(candidate.primitive);
  const extension: CapsuleLocalOntologyExtension = {
    extensionId: stableId(['ontology-extension', candidate.kind, subtypeId, cleanString(candidate.label)].join(':')),
    kind: candidate.kind,
    subtypeId,
    label: cleanString(candidate.label) || labelizeSubtype(subtypeId),
    description: cleanString(candidate.description) || `Candidate capsule-local ${candidate.kind} subtype ${subtypeId}.`,
    status: 'candidate',
    evidenceIds: cleanStringArray(candidate.evidenceIds).slice(0, 20),
    createdAt: null,
  };
  if (candidate.kind === 'entity' && isTacitusCorePrimitive(primitive)) extension.primitive = primitive;
  if (candidate.kind === 'relationship') {
    extension.from = cleanStringArray(candidate.from).filter(isTacitusCorePrimitive) as TacitusCorePrimitive[];
    extension.to = cleanStringArray(candidate.to).filter(isTacitusCorePrimitive) as TacitusCorePrimitive[];
  }
  return extension;
}

function buildClaimLedger(v2: ContextCapsuleV2): ContextCapsuleClaimLedgerV3 {
  const sourceById = new Map(v2.sourceRefs.map((source) => [source.sourceId, source]));
  const claims = v2.claimLedger.map((claim, index) => normalizeClaimForV3(claim, index, sourceById));
  return buildClaimLedgerFromClaims(claims, v2.reasoningScaffold.caveats);
}

function buildClaimLedgerFromClaims(claims: ContextCapsuleClaimV3[], caveats: string[]): ContextCapsuleClaimLedgerV3 {
  const crossClaimContradictions = detectCrossClaimContradictions(claims);
  const crossDisputedClaimIds = new Set(crossClaimContradictions.flatMap((contradiction) => contradiction.claimIds));
  const normalizedClaims = claims.map((claim) => crossDisputedClaimIds.has(claim.claimId)
    ? markClaimDisputedByCrossClaimContradiction(claim, crossClaimContradictions)
    : claim);
  const unsupportedClaims = normalizedClaims.filter((claim) => claim.support === 'unsupported' || claim.support === 'needs_source');
  const weakClaims = normalizedClaims.filter((claim) => claim.support === 'partially_supported' || claim.support === 'needs_source');
  const disputedClaims = normalizedClaims.filter((claim) => claim.support === 'disputed' || /disputed|contested|contradict/i.test(`${claim.text} ${claim.caveat ?? ''}`));
  return {
    allClaims: normalizedClaims.map(cloneClaimV3),
    supportedClaims: normalizedClaims.filter((claim) => claim.support === 'supported').map(cloneClaimV3),
    weakClaims: weakClaims.map(cloneClaimV3),
    unsupportedClaims: unsupportedClaims.map(cloneClaimV3),
    disputedClaims: disputedClaims.map(cloneClaimV3),
    staleClaims: normalizedClaims.filter((claim) => /stale|expired|refresh/i.test(`${claim.text} ${claim.caveat ?? ''}`)).map(cloneClaimV3),
    inferredClaims: normalizedClaims.filter((claim) => /infer|assumption|estimate/i.test(`${claim.text} ${claim.caveat ?? ''}`)).map(cloneClaimV3),
    crossClaimContradictions: crossClaimContradictions.map((contradiction) => ({
      ...contradiction,
      claimIds: [...contradiction.claimIds] as [string, string],
      evidenceSourceIds: [...contradiction.evidenceSourceIds],
      receiptDates: [...contradiction.receiptDates],
    })),
    forbiddenClaims: [
      ...caveats.filter((caveat) => /do not|must not|no\b/i.test(caveat)),
      ...unsupportedClaims.map((claim) => `Do not use as final claim: ${claim.text}`),
      ...disputedClaims.map((claim) => `Do not use as final claim until dispute is resolved: ${claim.text}`),
    ],
  };
}

export function detectCrossClaimContradictions(claims: ContextCapsuleClaimV3[]): ContextCapsuleCrossClaimContradiction[] {
  const contradictions: ContextCapsuleCrossClaimContradiction[] = [];
  for (let leftIndex = 0; leftIndex < claims.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < claims.length; rightIndex += 1) {
      const left = claims[leftIndex]!;
      const right = claims[rightIndex]!;
      if (!claimValidityWindowsOverlap(left, right)) continue;
      if (!claimsShareTopic(left.text, right.text)) continue;
      const negationConflict = hasClaimNegation(left.text) !== hasClaimNegation(right.text);
      const receiptConflict = receiptsDisagree(left, right);
      if (!negationConflict && !receiptConflict) continue;
      contradictions.push({
        contradictionId: stableId(['cross-claim-contradiction', left.claimId, right.claimId].join(':')),
        claimIds: [left.claimId, right.claimId],
        reason: negationConflict
          ? 'Claims share a topic and one asserts the inverse of the other over an overlapping validity window.'
          : 'Claims share a topic and their receipts carry contradictory stances over an overlapping validity window.',
        evidenceSourceIds: dedupeStrings([...left.sourceRefIds, ...right.sourceRefIds, ...left.receipts.map((receipt) => receipt.sourceId), ...right.receipts.map((receipt) => receipt.sourceId)]),
        receiptDates: dedupeStrings([...left.receipts, ...right.receipts].map((receipt) => receipt.date).filter((date): date is string => Boolean(date))),
        reviewRequired: true,
      });
    }
  }
  return contradictions;
}

function markClaimDisputedByCrossClaimContradiction(
  claim: ContextCapsuleClaimV3,
  contradictions: ContextCapsuleCrossClaimContradiction[],
): ContextCapsuleClaimV3 {
  const reasons = contradictions
    .filter((contradiction) => contradiction.claimIds.includes(claim.claimId))
    .map((contradiction) => contradiction.reason);
  const caveat = dedupeStrings([
    claim.caveat ?? '',
    ...reasons.map((reason) => `Cross-claim contradiction review required: ${reason}`),
  ].filter(Boolean)).join(' ');
  return {
    ...claim,
    support: 'disputed',
    caveat,
  };
}

function claimValidityWindowsOverlap(left: ContextCapsuleClaimV3, right: ContextCapsuleClaimV3): boolean {
  const leftStart = dateLowerBound(left.validFrom ?? left.asOf) ?? Number.NEGATIVE_INFINITY;
  const leftEnd = dateUpperBound(left.validUntil ?? left.asOf) ?? Number.POSITIVE_INFINITY;
  const rightStart = dateLowerBound(right.validFrom ?? right.asOf) ?? Number.NEGATIVE_INFINITY;
  const rightEnd = dateUpperBound(right.validUntil ?? right.asOf) ?? Number.POSITIVE_INFINITY;
  return leftStart <= rightEnd && rightStart <= leftEnd;
}

function claimsShareTopic(left: string, right: string): boolean {
  const leftTerms = new Set(claimKeywords(left));
  const shared = claimKeywords(right).filter((term) => leftTerms.has(term));
  return shared.length >= 2;
}

function claimKeywords(text: string): string[] {
  return dedupeStrings(text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2 && !CLAIM_STOP_WORDS.has(term)));
}

function hasClaimNegation(text: string): boolean {
  return /\b(not|no|never|without|cannot|can't|closed|blocked|prohibited|denied|suspended|inactive)\b/i.test(text);
}

function receiptsDisagree(left: ContextCapsuleClaimV3, right: ContextCapsuleClaimV3): boolean {
  const leftStances = new Set(left.receipts.map((receipt) => receipt.stance ?? 'supports'));
  const rightStances = new Set(right.receipts.map((receipt) => receipt.stance ?? 'supports'));
  return (leftStances.has('supports') && (rightStances.has('contradicts') || rightStances.has('mixed')))
    || (rightStances.has('supports') && (leftStances.has('contradicts') || leftStances.has('mixed')));
}

function normalizeClaimForV3(
  claim: ContextCapsuleClaim,
  index: number,
  sourceById: Map<string, ContextCapsuleSourceRef>,
): ContextCapsuleClaimV3 {
  const receiptSourceIds = claim.receipts?.map((receipt) => receipt.sourceId) ?? [];
  const sourceRefIds = dedupeStrings([...claim.sourceRefIds, ...receiptSourceIds]);
  const receipts = normalizeClaimReceipts(claim, sourceRefIds, sourceById);
  return {
    ...claim,
    claimId: cleanString(claim.claimId) || `claim-${index + 1}`,
    text: cleanString(claim.text),
    support: computeClaimSupportFromReceipts(receipts),
    sourceRefIds: dedupeStrings([...sourceRefIds, ...receipts.map((receipt) => receipt.sourceId)]),
    receipts,
    validFrom: cleanString(claim.validFrom) || null,
    validUntil: cleanString(claim.validUntil) || null,
    asOf: cleanString(claim.asOf) || null,
    causalLinks: normalizeClaimCausalLinks(claim.causalLinks),
  };
}

function normalizeClaimReceipts(
  claim: ContextCapsuleClaim,
  sourceRefIds: string[],
  sourceById: Map<string, ContextCapsuleSourceRef>,
): EvidenceReceipt[] {
  const explicit = (claim.receipts ?? []).map((receipt) => {
    const source = sourceById.get(receipt.sourceId);
    return {
      ...receipt,
      url: receipt.url ?? source?.url ?? null,
      publisher: receipt.publisher ?? source?.publisher ?? null,
      date: receipt.date ?? source?.date ?? null,
      reliabilityTier: receipt.reliabilityTier ?? source?.reliabilityTier ?? null,
      confidence: receipt.confidence ?? confidenceForClaimSupport(claim.support),
      stance: receipt.stance ?? stanceForClaimSupport(claim.support),
    };
  });
  if (explicit.length) return dedupeReceipts(explicit);
  if (claim.support === 'needs_source') return [];

  return dedupeReceipts(sourceRefIds.flatMap((sourceId): EvidenceReceipt[] => {
    const source = sourceById.get(sourceId);
    return [{
      sourceId,
      url: source?.url ?? null,
      publisher: source?.publisher ?? null,
      date: source?.date ?? null,
      reliabilityTier: source?.reliabilityTier ?? null,
      snippet: claim.text,
      charOffset: null,
      page: null,
      embedding: null,
      confidence: confidenceForClaimSupport(claim.support),
      stance: stanceForClaimSupport(claim.support),
    }];
  }));
}

function normalizeClaimCausalLinks(value: ContextCapsuleClaim['causalLinks']): Required<ContextCapsuleClaimCausalLinks> {
  return {
    causes: cleanStringArray(value?.causes),
    causedBy: cleanStringArray(value?.causedBy),
    enables: cleanStringArray(value?.enables),
    blocks: cleanStringArray(value?.blocks),
    escalates: cleanStringArray(value?.escalates),
    deEscalates: cleanStringArray(value?.deEscalates),
  };
}

function claimIsValidAt(claim: ContextCapsuleClaimV3, asOf: string | Date): boolean {
  const compare = asOf instanceof Date ? asOf.getTime() : Date.parse(asOf);
  if (Number.isNaN(compare)) return true;
  const from = dateLowerBound(claim.validFrom);
  const until = dateUpperBound(claim.validUntil);
  return (from === null || compare >= from) && (until === null || compare <= until);
}

function dateLowerBound(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function dateUpperBound(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? parsed + 86_400_000 - 1 : parsed;
}

function dedupeReceipts(receipts: EvidenceReceipt[]): EvidenceReceipt[] {
  const seen = new Set<string>();
  return receipts.filter((receipt) => {
    const key = [
      receipt.sourceId,
      receipt.stance ?? 'supports',
      receipt.page ?? '',
      receipt.charOffset?.start ?? '',
      receipt.charOffset?.end ?? '',
      receipt.snippet,
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 20);
}

function stanceForClaimSupport(support: SourceSupportState): EvidenceReceipt['stance'] {
  if (support === 'unsupported' || support === 'disputed') return 'contradicts';
  return 'supports';
}

function confidenceForClaimSupport(support: SourceSupportState): number | null {
  if (support === 'supported') return 0.86;
  if (support === 'partially_supported') return 0.62;
  if (support === 'unsupported' || support === 'disputed') return 0.52;
  return null;
}

function scoreClaimSupport(support: SourceSupportState): number {
  if (support === 'supported') return 1;
  if (support === 'partially_supported') return 0.65;
  return 0;
}

function cloneClaimV3(claim: ContextCapsuleClaimV3): ContextCapsuleClaimV3 {
  return {
    ...claim,
    sourceRefIds: [...claim.sourceRefIds],
    receipts: claim.receipts.map((receipt) => ({
      ...receipt,
      charOffset: receipt.charOffset ? { ...receipt.charOffset } : null,
      embedding: receipt.embedding ? [...receipt.embedding] : null,
    })),
    causalLinks: {
      causes: [...claim.causalLinks.causes],
      causedBy: [...claim.causalLinks.causedBy],
      enables: [...claim.causalLinks.enables],
      blocks: [...claim.causalLinks.blocks],
      escalates: [...claim.causalLinks.escalates],
      deEscalates: [...claim.causalLinks.deEscalates],
    },
  };
}

function buildAgentOperatingContract(v2: ContextCapsuleV2): ContextCapsuleAgentOperatingContract {
  const starterCuration = v2.starterSnapshot?.curationProfile;
  const allowedActions = [
    ...(v2.agentPermissions.canSuggest ? ['suggest'] : []),
    ...(v2.agentPermissions.canSource ? ['source'] : []),
    ...(v2.agentPermissions.canFork ? ['fork'] : []),
    ...(v2.agentPermissions.canDraft ? ['draft'] : []),
    ...(v2.agentPermissions.canPublish ? ['publish'] : []),
  ];
  const forbiddenActions = [
    ...(!v2.agentPermissions.canPublish ? ['publish'] : []),
    ...(v2.humanGate.required ? ['approve_human_gate', 'mutate_canonical_without_review'] : ['mutate_canonical_without_review']),
    'treat_cognee_recall_as_canonical',
    'drop_source_receipts',
  ];
  return {
    allowedActions,
    forbiddenActions: dedupeStrings(forbiddenActions),
    sourceRequirements: v2.evidenceRequirements.length
      ? [...v2.evidenceRequirements]
      : starterCuration?.sourceRefreshStatus.primaryExternalSourceIds.length
        ? [`Inspect primary external sources: ${starterCuration.sourceRefreshStatus.primaryExternalSourceIds.join(', ')}.`]
        : ['Label unsupported claims and source gaps before final output.'],
    reviewCheckpoints: [
      ...(v2.humanGate.required ? ['human_review_gate'] : []),
      'sourceability_review',
      'claim_ledger_review',
      'output_contract_review',
    ],
    toolRecommendations: [
      ...v2.coreRefs.toolCoreIds,
      ...(v2.sourceRefs.length ? ['sourceability-reviewer'] : ['source-gap-review']),
    ],
    bestNextAction: v2.bestNextAction || 'Inspect the capsule before agent use.',
    handoffInstructions: [
      `Use capsule ${v2.capsuleId}@v${v2.version}.`,
      'Carry source ids, caveats, and review card state into every output.',
      ...(starterCuration?.compactAgentInstructions ?? []),
    ],
    stopConditions: [
      'Stop before external publish, graph mutation, credential use, or unsupported final claims.',
      ...(starterCuration?.tacitKnowledge.redLines ?? []).slice(0, 3),
      ...(v2.humanGate.required ? ['Stop if the human gate is stale, missing reviewer metadata, or disputed.'] : []),
    ],
  };
}

function buildMemoryPosture(v2: ContextCapsuleV2, input?: unknown): ContextCapsuleMemoryPosture {
  const datasetId = `owner:${v2.ownerUid}/capsule:${v2.capsuleId}/v${v2.version}`;
  const body = isRecord(input) ? input : {};
  return {
    canonicalCapsuleFacts: withFallback(cleanStringArray(body.canonicalCapsuleFacts), [
      `${v2.capsuleId}@v${v2.version}`,
      ...v2.claimLedger.filter((claim) => claim.support === 'supported').map((claim) => claim.text),
    ]),
    advisoryCogneeRecall: withFallback(cleanStringArray(body.advisoryCogneeRecall), v2.starterSnapshot?.cogneeProfile
      ? [
        v2.starterSnapshot.cogneeProfile.whyCogneeHelps,
        ...v2.starterSnapshot.cogneeProfile.seedDocuments.map((document) => document.title),
      ]
      : []),
    sessionMemory: cleanStringArray(body.sessionMemory),
    graphProposals: withFallback(cleanStringArray(body.graphProposals), v2.coreRefs.graphCoreId ? [`approved graph ${v2.coreRefs.graphCoreId}`] : ['review-card graph proposal required before graph promotion']),
    staleAssumptions: withFallback(cleanStringArray(body.staleAssumptions), v2.sourceRefs.filter((source) => source.stale).map((source) => source.label)),
    disputedClaims: withFallback(cleanStringArray(body.disputedClaims), v2.claimLedger.filter((claim) => claim.support === 'unsupported' || claim.support === 'disputed' || /disputed|contested/i.test(`${claim.text} ${claim.caveat ?? ''}`)).map((claim) => claim.text)),
    rejectedInferences: cleanStringArray(body.rejectedInferences),
    cogneeDatasetId: typeof body.cogneeDatasetId === 'string' && body.cogneeDatasetId.trim() ? body.cogneeDatasetId.trim() : datasetId,
    cogneeMode: 'advisory-only',
    cogneeOperations: ['remember', 'recall', 'improve', 'forget'],
  };
}

function buildGovernance(v2: ContextCapsuleV2): ContextCapsuleGovernanceV3 {
  return {
    canonicalStore: 'Firestore ContextCapsules',
    humanGateRequired: v2.humanGate.required,
    humanGateStatus: v2.humanGate.gateStatus,
    authorId: v2.humanGate.authorId ?? v2.provenance.humanAuthorId ?? null,
    reviewerId: v2.humanGate.reviewerId ?? v2.reviewState.reviewerId ?? null,
    reviewedAt: v2.humanGate.reviewedAt ?? v2.reviewState.reviewedAt ?? null,
    approvalId: v2.reviewState.approvalId ?? null,
    agentsMayMutateCanonical: false,
    reviewCardsRequiredForTargets: ['advisoryMemory', 'sourceGap', 'graphProposal', 'claimLedger', 'agentInstructions'],
  };
}

function buildMarketplaceProfile(
  v2: ContextCapsuleV2,
  sourceSpine: ContextCapsuleSourceSpine,
  tacit: ContextCapsuleHumanTacitKnowledge,
): ContextCapsuleMarketplaceProfile {
  const shelves: CapsuleV3ShelfId[] = [];
  const badges: CapsuleV3TrustBadgeId[] = ['cognee-advisory'];
  if (v2.humanGate.required) shelves.push('human-gated');
  if (v2.capsuleMode === 'expert_pick') shelves.push('expert-pick');
  if (v2.bestNextAction && v2.agentPermissions.canDraft) shelves.push('agent-ready');
  if (sourceSpine.score >= 80) shelves.push('source-backed');
  if (sourceSpine.staleSourceIds.length || v2.reviewState.status === 'stale') shelves.push('needs-refresh');
  if (scoreTacitKnowledge(tacit) >= 80) shelves.push('tacit-knowledge-rich');
  if (v2.visibility === 'public' || v2.visibility === 'unlisted') shelves.push('marketplace-candidate');
  if ((v2.visibility === 'public' || v2.visibility === 'unlisted') && v2.forkability !== 'disabled') shelves.push('public-forkable');
  if (v2.provenance.authoredSubstantiveBody) badges.push('human-written');
  if (v2.reviewState.status === 'approved' || v2.reviewState.status === 'human_reviewed') badges.push('human-reviewed');
  if (v2.humanGate.required) badges.push('human-gated');
  if (sourceSpine.sourceGaps.length) badges.push('source-gap');
  if (sourceSpine.staleSourceIds.length || v2.reviewState.status === 'stale') badges.push('stale');
  return {
    publicCandidate: v2.visibility === 'public' || v2.visibility === 'unlisted',
    forkable: v2.forkability !== 'disabled',
    reuseTerms: v2.reuseTerms,
    moderationSummary: `${v2.label}: ${v2.summary}`.slice(0, 500),
    shelves: dedupeStrings(shelves) as CapsuleV3ShelfId[],
    trustBadges: dedupeStrings(badges) as CapsuleV3TrustBadgeId[],
    requiredBeforePublish: [
      'Human author metadata',
      'Human reviewer metadata',
      'Source spine score >= 80',
      'No unsupported final claims',
      'Explicit reuse terms',
      'No stale gate',
      'Output contract',
      'Moderation-ready summary',
    ],
  };
}

function buildEvaluation(
  v2: ContextCapsuleV2,
  sourceSpine: ContextCapsuleSourceSpine,
  tacit: ContextCapsuleHumanTacitKnowledge,
  agentContract: ContextCapsuleAgentOperatingContract,
  marketplace: ContextCapsuleMarketplaceProfile,
  grounding: ContextCapsuleGroundingV3,
  claimLedger: ContextCapsuleClaimLedgerV3,
  options: ContextCapsuleNormalizeOptions,
): ContextCapsuleEvaluationV3 {
  const tacitKnowledgeScore = scoreTacitKnowledge(tacit);
  const agentOperabilityScore = scoreAgentOperability(agentContract);
  const marketplaceReadinessScore = scoreMarketplaceReadiness(v2, sourceSpine, marketplace, options);
  const receiptDepth = scoreReceiptDepth(claimLedger);
  const temporalityCoverage = scoreTemporalityCoverage(v2, grounding, claimLedger);
  const causalityCoverage = scoreCausalityCoverage(grounding, claimLedger);
  const ontologyBindingCoverage = scoreOntologyBindingCoverage(grounding);
  const contradictionRate = scoreContradictionRate(claimLedger);
  const groundedAnswerRate = Math.round(average([
    sourceSpine.score,
    receiptDepth,
    100 - contradictionRate,
    average(claimLedger.allClaims.map((claim) => scoreClaimSupport(claim.support) * 100), 75),
  ], 0));
  const sourceIndependence = sourceSpine.independenceScore;
  const goldenQuestionEvals = buildGoldenQuestionEvals({
    sourceSpine,
    claimLedger,
    groundedAnswerRate,
    contradictionRate,
    sourceIndependence,
  });
  const capsuleVsGenericDelta = Math.round(average(goldenQuestionEvals.map((item) => item.delta), 0));
  const openGaps = [
    ...sourceSpine.sourceGaps,
    ...(tacitKnowledgeScore < 80 ? ['Tacit knowledge needs more human-authored context.'] : []),
    ...(agentOperabilityScore < 80 ? ['Agent operating contract needs stronger stop conditions or source requirements.'] : []),
    ...(receiptDepth < 80 ? ['Claim ledger needs receipts for more claims.'] : []),
    ...(temporalityCoverage < 80 ? ['Temporality needs validity windows or timeline anchors.'] : []),
    ...(causalityCoverage < 80 ? ['Causality needs explicit causal links or claim-level causal relationships.'] : []),
    ...(ontologyBindingCoverage < 80 ? ['Ontology binding needs domain, ontology ids, and ACO primitives.'] : []),
    ...(contradictionRate > 0 ? ['Cross-claim contradictions require human review before canonical updates.'] : []),
  ];
  return {
    qualityScore: Math.round(average([
      tacitKnowledgeScore,
      sourceSpine.score,
      agentOperabilityScore,
      marketplaceReadinessScore,
      receiptDepth,
      temporalityCoverage,
      causalityCoverage,
      ontologyBindingCoverage,
      100 - contradictionRate,
    ], 0)),
    tacitKnowledgeScore,
    sourceSpineScore: sourceSpine.score,
    agentOperabilityScore,
    marketplaceReadinessScore,
    temporalityCoverage,
    causalityCoverage,
    ontologyBindingCoverage,
    receiptDepth,
    contradictionRate,
    groundedAnswerRate,
    sourceIndependence,
    capsuleVsGenericDelta,
    goldenQuestionEvals,
    openGaps,
  };
}

function scoreReceiptDepth(claimLedger: ContextCapsuleClaimLedgerV3): number {
  if (!claimLedger.allClaims.length) return 0;
  const receipted = claimLedger.allClaims.filter((claim) => claim.receipts.length > 0).length;
  return Math.round(100 * receipted / claimLedger.allClaims.length);
}

function scoreTemporalityCoverage(
  v2: ContextCapsuleV2,
  grounding: ContextCapsuleGroundingV3,
  claimLedger: ContextCapsuleClaimLedgerV3,
): number {
  const hasGroundingWindow = Boolean(
    grounding.temporality.timelineAnchors.length ||
    grounding.temporality.asOf ||
    grounding.temporality.validFrom ||
    grounding.temporality.validUntil,
  );
  const claimCoverage = claimLedger.allClaims.length
    ? claimLedger.allClaims.filter((claim) => claim.validFrom || claim.validUntil || claim.asOf).length / claimLedger.allClaims.length
    : 0;
  const hasCapsuleWindow = Boolean(v2.expiry && v2.decisionHorizon);
  return hasGroundingWindow || claimCoverage === 1 || (hasCapsuleWindow && claimCoverage > 0)
    ? 100
    : Math.round(100 * average([claimCoverage, hasCapsuleWindow ? 0.5 : 0], 0));
}

function scoreCausalityCoverage(grounding: ContextCapsuleGroundingV3, claimLedger: ContextCapsuleClaimLedgerV3): number {
  const groundingRatio = grounding.causality.causalLinks.length ? 1 : 0;
  const claimRatio = claimLedger.allClaims.length
    ? claimLedger.allClaims.filter((claim) => hasClaimCausalLinks(claim)).length / claimLedger.allClaims.length
    : 0;
  return Math.round(100 * Math.max(groundingRatio, claimRatio));
}

function scoreOntologyBindingCoverage(grounding: ContextCapsuleGroundingV3): number {
  return Math.round(100 * average([
    grounding.ontologyBinding.domainId ? 1 : 0,
    grounding.ontologyBinding.ontologyIds.length ? 1 : 0,
    grounding.ontologyBinding.acoPrimitives.length ? 1 : 0,
    grounding.ontologyBinding.taxonomyPath.length ? 1 : 0,
  ], 0));
}

function scoreContradictionRate(claimLedger: ContextCapsuleClaimLedgerV3): number {
  if (!claimLedger.allClaims.length) return 0;
  const disputedClaimIds = new Set([
    ...claimLedger.disputedClaims.map((claim) => claim.claimId),
    ...claimLedger.crossClaimContradictions.flatMap((contradiction) => contradiction.claimIds),
  ]);
  return Math.round(100 * disputedClaimIds.size / claimLedger.allClaims.length);
}

function buildGoldenQuestionEvals(input: {
  sourceSpine: ContextCapsuleSourceSpine;
  claimLedger: ContextCapsuleClaimLedgerV3;
  groundedAnswerRate: number;
  contradictionRate: number;
  sourceIndependence: number;
}): ContextCapsuleEvaluationV3['goldenQuestionEvals'] {
  const comparisons = buildDefaultAgenticResearchEvalRun();
  const researchScorecard = summarizeAgenticResearchEval(comparisons);
  const scenariosById = new Map(AGENTIC_RESEARCH_EVAL_SCENARIOS.map((scenario) => [scenario.id, scenario]));
  const disputedClaimIds = input.claimLedger.disputedClaims.map((claim) => claim.claimId);
  return comparisons.slice(0, 3).map((comparison) => {
    const scenario = scenariosById.get(comparison.scenarioId);
    const capsuleScore = Math.round(average([
      comparison.praxis.total,
      input.groundedAnswerRate,
      input.sourceIndependence,
      100 - input.contradictionRate,
    ], 0));
    const genericScore = Math.max(0, Math.round(capsuleScore - researchScorecard.capsuleVsGenericDelta));
    return {
      questionId: comparison.scenarioId,
      prompt: scenario?.prompt ?? comparison.scenarioId,
      praxisLabel: 'PRAXIS capsule-grounded answer',
      baselineLabel: 'Generic prompt-only LLM',
      capsuleScore,
      genericScore,
      delta: capsuleScore - genericScore,
      groundedAnswerRate: input.groundedAnswerRate,
      contradictionRate: input.contradictionRate,
      sourceIndependence: input.sourceIndependence,
      sourceIds: input.sourceSpine.sourceIds.slice(0, 8),
      disputedClaimIds,
      computedBy: 'deterministic-contract-eval',
    };
  });
}

function hasClaimCausalLinks(claim: ContextCapsuleClaimV3): boolean {
  return Object.values(claim.causalLinks).some((values) => values.length > 0);
}

function buildDefaultReviewCards(capsule: ContextCapsuleV3): ContextCapsuleV3ReviewCard[] {
  const cards: ContextCapsuleV3ReviewCard[] = [];
  const add = (
    target: ContextCapsuleV3ReviewCardTarget,
    title: string,
    rationale: string,
    sourceType: ContextCapsuleV3ReviewCard['sourceType'] = 'quality-audit',
    proposedPatch: Record<string, unknown> = {},
    evidenceSourceIds: string[] = capsule.sourceSpine.sourceIds,
  ) => {
    cards.push({
      reviewCardId: stableId(['v3', capsule.identity.capsuleId, capsule.identity.capsuleVersion, target, title].join(':')),
      capsuleId: capsule.identity.capsuleId,
      capsuleVersion: capsule.identity.capsuleVersion,
      target,
      title,
      rationale,
      sourceType,
      state: 'proposed',
      requiresHumanReview: true,
      mutatesCanonicalState: false,
      evidenceSourceIds,
      evidenceReceipts: [],
      proposedPatch,
    });
  };
  if (capsule.memoryPosture.advisoryCogneeRecall.length || capsule.memoryPosture.cogneeMode === 'advisory-only') add('advisoryMemory', 'Review advisory memory posture', 'Cognee recall/improve output must remain advisory until a human applies a review card.', 'cognee');
  if (capsule.sourceSpine.sourceGaps.length) add('sourceGap', 'Review source gaps', 'Source gaps must be resolved or explicitly carried before final use.', 'source-gap');
  if (!capsule.identity.archivedAt && !capsule.sourceSpine.sourceIds.includes(capsule.identity.capsuleId)) add('graphProposal', 'Review graph proposal boundary', 'Graph extraction may propose candidates but cannot promote graph state directly.');
  if (capsule.claimLedger.crossClaimContradictions.length) {
    const first = capsule.claimLedger.crossClaimContradictions[0]!;
    add(
      'claimLedger',
      'Review cross-claim contradiction',
      'Cross-claim contradiction detection can propose disputed status, but canonical claim-ledger edits require human review.',
      'quality-audit',
      {
        crossClaimContradictionIds: capsule.claimLedger.crossClaimContradictions.map((contradiction) => contradiction.contradictionId),
        disputedClaimIds: [...first.claimIds],
        proposedSupport: 'disputed',
      },
      first.evidenceSourceIds,
    );
  }
  if (capsule.claimLedger.weakClaims.length || capsule.claimLedger.unsupportedClaims.length || capsule.claimLedger.disputedClaims.length) add('claimLedger', 'Review claim support', 'Weak, unsupported, and disputed claims require claim-ledger review before final outputs.');
  if (!capsule.agentOperatingContract.stopConditions.length || capsule.agentOperatingContract.forbiddenActions.includes('mutate_canonical_without_review')) add('agentInstructions', 'Review agent operating contract', 'Agent instructions must preserve stop conditions and forbidden actions.');
  return cards;
}

function normalizeTacitKnowledge(value: unknown, v2: ContextCapsuleV2): ContextCapsuleHumanTacitKnowledge {
  const body = isRecord(value) ? value : {};
  const intelligence = v2.starterSnapshot?.intelligenceProfile?.humanWorkflow;
  const starterTacit = v2.starterSnapshot?.curationProfile?.tacitKnowledge;
  const redLines = cleanStringArray(body.redLines).length
    ? cleanStringArray(body.redLines)
    : [
      ...(starterTacit?.redLines ?? []),
      ...(intelligence?.redLines ?? []),
      ...v2.reasoningScaffold.caveats.filter((item) => /do not|must not|no\b|review/i.test(item)),
    ];
  return {
    workingAssumptions: withFallback(cleanStringArray(body.workingAssumptions), [
      ...(starterTacit?.workingAssumptions ?? []),
      ...v2.claimLedger.filter((claim) => claim.support === 'partially_supported').map((claim) => claim.text),
    ]),
    hiddenConstraints: withFallback(cleanStringArray(body.hiddenConstraints), v2.reasoningScaffold.privateNotes ?? []),
    redLines: withFallback(redLines, v2.reasoningScaffold.caveats),
    institutionalHabits: withFallback(cleanStringArray(body.institutionalHabits), v2.audience.map((audience) => `${audience} review habit`)),
    approvalPolitics: withFallback(cleanStringArray(body.approvalPolitics), [
      ...(starterTacit?.approvalPolitics ?? []),
      ...(v2.humanGate.required ? ['Human gate controls final reuse and publication.'] : []),
    ]),
    practicalHeuristics: withFallback(cleanStringArray(body.practicalHeuristics), [
      ...(starterTacit?.practicalHeuristics ?? []),
      ...v2.reasoningScaffold.publicMethod,
    ]),
    stakeholderSensitivities: withFallback(cleanStringArray(body.stakeholderSensitivities), [
      ...(starterTacit?.stakeholderSensitivities ?? []),
      ...v2.audience,
    ]),
    caveats: withFallback(cleanStringArray(body.caveats), [
      ...(starterTacit?.caveats ?? []),
      ...v2.reasoningScaffold.caveats,
    ]),
    recurringDecisions: withFallback(cleanStringArray(body.recurringDecisions), v2.bestNextAction ? [v2.bestNextAction] : []),
    promptlessKnowledge: withFallback(cleanStringArray(body.promptlessKnowledge), [v2.useCase, v2.purpose].filter(Boolean)),
  };
}

function scoreTacitKnowledge(value: ContextCapsuleHumanTacitKnowledge): number {
  const sectionValues = [
    value.workingAssumptions,
    value.hiddenConstraints,
    value.redLines,
    value.institutionalHabits,
    value.approvalPolitics,
    value.practicalHeuristics,
    value.stakeholderSensitivities,
    value.caveats,
    value.recurringDecisions,
    value.promptlessKnowledge,
  ];
  return Math.round(100 * sectionValues.filter((items) => items.length > 0).length / sectionValues.length);
}

function scoreAgentOperability(contract: ContextCapsuleAgentOperatingContract): number {
  return Math.round(100 * average([
    contract.allowedActions.length ? 1 : 0,
    contract.forbiddenActions.length ? 1 : 0,
    contract.sourceRequirements.length ? 1 : 0,
    contract.reviewCheckpoints.length ? 1 : 0,
    contract.toolRecommendations.length ? 1 : 0,
    contract.bestNextAction ? 1 : 0,
    contract.handoffInstructions.length ? 1 : 0,
    contract.stopConditions.length ? 1 : 0,
  ], 0));
}

function scoreMarketplaceReadiness(
  v2: ContextCapsuleV2,
  sourceSpine: ContextCapsuleSourceSpine,
  marketplace: ContextCapsuleMarketplaceProfile,
  options: ContextCapsuleNormalizeOptions,
): number {
  return Math.round(100 * average([
    marketplace.publicCandidate ? 1 : 0.75,
    marketplace.forkable ? 1 : 0,
    marketplace.reuseTerms.trim() ? 1 : 0,
    marketplace.moderationSummary.trim() ? 1 : 0,
    sourceSpine.score >= 80 ? 1 : 0,
    v2.outputContracts.length ? 1 : 0,
    v2.claimLedger.some((claim) => claim.support === 'unsupported' || claim.support === 'needs_source' || claim.support === 'disputed') ? 0 : 1,
    isStale(v2.humanGate.reviewedAt ?? v2.reviewState.reviewedAt ?? null, v2.updatedAt ?? null, options.now) ? 0 : 1,
  ], 0));
}

function humanReviewScore(capsule: ContextCapsuleV3): number {
  if (!capsule.governance.humanGateRequired) return 100;
  return Math.round(100 * average([
    capsule.governance.authorId ? 1 : 0,
    capsule.governance.reviewerId ? 1 : 0,
    capsule.governance.reviewedAt ? 1 : 0,
    capsule.governance.approvalId ? 1 : 0,
    capsule.governance.humanGateStatus === 'approved' ? 1 : 0,
  ], 0));
}

function hasExplicitReuseTerms(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized) && normalized !== 'reuse requires source and review attribution.';
}

function publishStatus(capsule: ContextCapsuleV3, issues: CapsuleV3PublishIssue[]): CapsuleV3PublishResult['status'] {
  if (capsule.governance.humanGateStatus === 'blocked') return 'blocked';
  if (issues.some((issue) => issue.code === 'stale_human_gate')) return 'stale';
  if (issues.some((issue) => issue.code === 'unsupported_final_claims')) return 'review_needed';
  if (issues.some((issue) => issue.severity === 'error')) return 'needs_review';
  if (!capsule.governance.humanGateRequired) return 'not_required';
  return 'human_gated';
}

function scoreItem(
  id: CapsuleV3QualityBreakdownId,
  label: string,
  rawScore: number,
  maxScore: number,
  diagnostics: string[],
): CapsuleV3QualityBreakdownItem {
  return {
    id,
    label,
    maxScore,
    score: Math.round(maxScore * Math.max(0, Math.min(100, rawScore)) / 100),
    diagnostics,
  };
}

function scoreIndependence(sources: ContextCapsuleSourceRef[]): number {
  if (!sources.length) return 0;
  const publishers = dedupeStrings(sources.map((source) => source.publisher ?? source.label));
  return Math.round(100 * Math.min(1, publishers.length / Math.min(2, sources.length)));
}

function isContextCapsuleV3(value: unknown): value is ContextCapsuleV3 {
  return isRecord(value) && value.schemaVersion === 3 && isRecord(value.identity) && Array.isArray(value.sectionIds);
}

function isContextCapsuleV2(value: unknown): value is ContextCapsuleV2 {
  return isRecord(value)
    && value.schemaVersion === 2
    && typeof value.capsuleId === 'string'
    && typeof value.ownerUid === 'string'
    && Array.isArray(value.sourceRefs)
    && Array.isArray(value.outputContracts)
    && isRecord(value.humanGate);
}

function isStale(reviewedAt: string | null, fallbackDate: string | null, now?: string | Date): boolean {
  const date = reviewedAt ?? fallbackDate;
  if (!date) return false;
  return isDateOlderThanWindow(date, 120, now);
}

function isDateOlderThanWindow(value: string | null | undefined, freshnessWindowDays: number | null, now?: string | Date): boolean {
  if (!value || freshnessWindowDays === null) return false;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return false;
  const compare = now instanceof Date ? now.getTime() : now ? Date.parse(now) : Date.now();
  if (Number.isNaN(compare)) return false;
  return (compare - timestamp) / 86_400_000 > freshnessWindowDays;
}

function withFallback<T extends string>(values: T[], fallback: T[]): T[] {
  return values.length ? values : dedupeStrings(fallback.filter(Boolean));
}

function firstRecord(...values: unknown[]): Record<string, unknown> | null {
  return values.find(isRecord) ?? null;
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return dedupeStrings(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean));
}

function normalizeSubtypeKey(value: unknown): string {
  return cleanString(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function labelizeSubtype(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function confidenceFromUnknown(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(Math.max(0, Math.min(1, value > 1 ? value / 100 : value)) * 1000) / 1000;
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value));
}

function isTacitusCorePrimitive(value: string): value is TacitusCorePrimitive {
  return (TACITUS_CORE_PRIMITIVES as readonly string[]).includes(value);
}

function timelineAnchorKindFromUnknown(value: unknown): ContextCapsuleTimelineAnchorKind {
  const clean = cleanString(value);
  if (clean === 'as-of' || clean === 'event' || clean === 'deadline' || clean === 'review' || clean === 'validity-start' || clean === 'validity-end') return clean;
  return 'review';
}

function causalRelationFromUnknown(value: unknown): ContextCapsuleCausalRelation {
  const clean = cleanString(value);
  if (clean === 'causes' || clean === 'enables' || clean === 'blocks' || clean === 'escalates' || clean === 'de-escalates' || clean === 'correlates') return clean;
  return 'causes';
}

function graphLiteStatusFromUnknown(value: unknown): ContextCapsuleEmbeddedGraphV3['status'] {
  const clean = cleanString(value);
  if (clean === 'compiled-advisory' || clean === 'stale' || clean === 'reviewed' || clean === 'promoted') return clean;
  return 'compiled-advisory';
}

function reviewStateFromUnknown(value: unknown): ContextCapsuleGraphLiteNodeV3['reviewState'] {
  const clean = cleanString(value);
  if (clean === 'canonical' || clean === 'proposed' || clean === 'missing' || clean === 'advisory' || clean === 'reviewed') return clean;
  return 'advisory';
}

function dedupeStrings<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function dedupeByString<T>(values: T[], keyOf: (value: T) => string): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = keyOf(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const CLAIM_STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'that',
  'this',
  'with',
  'from',
  'will',
  'would',
  'could',
  'should',
  'requires',
  'require',
  'remains',
  'source',
  'review',
]);

function average(values: number[], fallback: number): number {
  if (!values.length) return fallback;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stableId(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return `v3-${Math.abs(hash).toString(36)}`;
}

import {
  normalizeContextCapsuleV2,
  type ContextCapsuleClaim,
  type ContextCapsuleNormalizeOptions,
  type ContextCapsuleOutputContract,
  type ContextCapsuleSourceRef,
  type ContextCapsuleV2,
} from '@/lib/context/capsule-v2';

export const CONTEXT_CAPSULE_V3_SECTION_IDS = [
  'identity',
  'businessUseCase',
  'humanTacitKnowledge',
  'sourceSpine',
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

export interface ContextCapsuleClaimLedgerV3 {
  allClaims: ContextCapsuleClaim[];
  supportedClaims: ContextCapsuleClaim[];
  weakClaims: ContextCapsuleClaim[];
  unsupportedClaims: ContextCapsuleClaim[];
  disputedClaims: ContextCapsuleClaim[];
  staleClaims: ContextCapsuleClaim[];
  inferredClaims: ContextCapsuleClaim[];
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
  openGaps: string[];
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
  const v2 = normalizeContextCapsuleV2(input, options);
  const body = isRecord(input) ? input : {};
  const sourceSpine = buildSourceSpine(v2, options);
  const humanTacitKnowledge = normalizeTacitKnowledge(body.humanTacitKnowledge, v2);
  const claimLedger = buildClaimLedger(v2);
  const agentOperatingContract = buildAgentOperatingContract(v2);
  const memoryPosture = buildMemoryPosture(v2);
  const governance = buildGovernance(v2);
  const marketplaceProfile = buildMarketplaceProfile(v2, sourceSpine, humanTacitKnowledge);
  const evaluation = buildEvaluation(v2, sourceSpine, humanTacitKnowledge, agentOperatingContract, marketplaceProfile, options);

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
  if (capsule.claimLedger.unsupportedClaims.length) {
    issues.push({ code: 'unsupported_final_claims', severity: 'error', message: 'Unsupported final claims block marketplace publishing.' });
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

function buildSourceSpine(v2: ContextCapsuleV2, options: ContextCapsuleNormalizeOptions): ContextCapsuleSourceSpine {
  const sourceIds = v2.sourceRefs.map((source) => source.sourceId);
  const sourceIdSet = new Set(sourceIds);
  const staleSourceIds = v2.sourceRefs
    .filter((source) => source.stale || isDateOlderThanWindow(source.date, v2.sourcePosture?.freshnessWindowDays ?? null, options.now))
    .map((source) => source.sourceId);
  const unsupportedClaimIds = v2.claimLedger
    .filter((claim) => claim.support === 'unsupported' || claim.support === 'needs_source' || claim.sourceRefIds.some((sourceId) => !sourceIdSet.has(sourceId)))
    .map((claim) => claim.claimId);
  const sourceGaps = [
    ...(!v2.sourceRefs.length ? ['Attach source receipts before final use.'] : []),
    ...unsupportedClaimIds.map((claimId) => `Claim ${claimId} needs source support.`),
    ...staleSourceIds.map((sourceId) => `Source ${sourceId} is stale.`),
  ];
  const independenceScore = scoreIndependence(v2.sourceRefs);
  const sourceCountScore = Math.min(1, v2.sourceRefs.length / 2);
  const reliabilityScore = average(v2.sourceRefs.map((source) => source.reliabilityTier === 1 ? 1 : source.reliabilityTier === 2 ? 0.75 : source.reliabilityTier === 3 ? 0.45 : 0.55), v2.sourceRefs.length ? 0.55 : 0);
  const claimSupportScore = average(v2.claimLedger.map((claim) => claim.support === 'supported' ? 1 : claim.support === 'partially_supported' ? 0.65 : 0), v2.claimLedger.length ? 0 : 0.75);
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

function buildClaimLedger(v2: ContextCapsuleV2): ContextCapsuleClaimLedgerV3 {
  const unsupportedClaims = v2.claimLedger.filter((claim) => claim.support === 'unsupported' || claim.support === 'needs_source');
  const weakClaims = v2.claimLedger.filter((claim) => claim.support === 'partially_supported' || claim.support === 'needs_source');
  return {
    allClaims: v2.claimLedger.map((claim) => ({ ...claim, sourceRefIds: [...claim.sourceRefIds] })),
    supportedClaims: v2.claimLedger.filter((claim) => claim.support === 'supported'),
    weakClaims,
    unsupportedClaims,
    disputedClaims: v2.claimLedger.filter((claim) => /disputed|contested|contradict/i.test(`${claim.text} ${claim.caveat ?? ''}`)),
    staleClaims: v2.claimLedger.filter((claim) => /stale|expired|refresh/i.test(`${claim.text} ${claim.caveat ?? ''}`)),
    inferredClaims: v2.claimLedger.filter((claim) => /infer|assumption|estimate/i.test(`${claim.text} ${claim.caveat ?? ''}`)),
    forbiddenClaims: [
      ...v2.reasoningScaffold.caveats.filter((caveat) => /do not|must not|no\b/i.test(caveat)),
      ...unsupportedClaims.map((claim) => `Do not use as final claim: ${claim.text}`),
    ],
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

function buildMemoryPosture(v2: ContextCapsuleV2): ContextCapsuleMemoryPosture {
  const datasetId = `owner:${v2.ownerUid}/capsule:${v2.capsuleId}/v${v2.version}`;
  return {
    canonicalCapsuleFacts: [
      `${v2.capsuleId}@v${v2.version}`,
      ...v2.claimLedger.filter((claim) => claim.support === 'supported').map((claim) => claim.text),
    ],
    advisoryCogneeRecall: v2.starterSnapshot?.cogneeProfile
      ? [
        v2.starterSnapshot.cogneeProfile.whyCogneeHelps,
        ...v2.starterSnapshot.cogneeProfile.seedDocuments.map((document) => document.title),
      ]
      : [],
    sessionMemory: [],
    graphProposals: v2.coreRefs.graphCoreId ? [`approved graph ${v2.coreRefs.graphCoreId}`] : ['review-card graph proposal required before graph promotion'],
    staleAssumptions: v2.sourceRefs.filter((source) => source.stale).map((source) => source.label),
    disputedClaims: v2.claimLedger.filter((claim) => claim.support === 'unsupported' || /disputed|contested/i.test(`${claim.text} ${claim.caveat ?? ''}`)).map((claim) => claim.text),
    rejectedInferences: [],
    cogneeDatasetId: datasetId,
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
  options: ContextCapsuleNormalizeOptions,
): ContextCapsuleEvaluationV3 {
  const tacitKnowledgeScore = scoreTacitKnowledge(tacit);
  const agentOperabilityScore = scoreAgentOperability(agentContract);
  const marketplaceReadinessScore = scoreMarketplaceReadiness(v2, sourceSpine, marketplace, options);
  const openGaps = [
    ...sourceSpine.sourceGaps,
    ...(tacitKnowledgeScore < 80 ? ['Tacit knowledge needs more human-authored context.'] : []),
    ...(agentOperabilityScore < 80 ? ['Agent operating contract needs stronger stop conditions or source requirements.'] : []),
  ];
  return {
    qualityScore: Math.round(average([tacitKnowledgeScore, sourceSpine.score, agentOperabilityScore, marketplaceReadinessScore], 0)),
    tacitKnowledgeScore,
    sourceSpineScore: sourceSpine.score,
    agentOperabilityScore,
    marketplaceReadinessScore,
    openGaps,
  };
}

function buildDefaultReviewCards(capsule: ContextCapsuleV3): ContextCapsuleV3ReviewCard[] {
  const cards: ContextCapsuleV3ReviewCard[] = [];
  const add = (target: ContextCapsuleV3ReviewCardTarget, title: string, rationale: string, sourceType: ContextCapsuleV3ReviewCard['sourceType'] = 'quality-audit') => {
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
      evidenceSourceIds: capsule.sourceSpine.sourceIds,
      evidenceReceipts: [],
      proposedPatch: {},
    });
  };
  if (capsule.memoryPosture.advisoryCogneeRecall.length || capsule.memoryPosture.cogneeMode === 'advisory-only') add('advisoryMemory', 'Review advisory memory posture', 'Cognee recall/improve output must remain advisory until a human applies a review card.', 'cognee');
  if (capsule.sourceSpine.sourceGaps.length) add('sourceGap', 'Review source gaps', 'Source gaps must be resolved or explicitly carried before final use.', 'source-gap');
  if (!capsule.identity.archivedAt && !capsule.sourceSpine.sourceIds.includes(capsule.identity.capsuleId)) add('graphProposal', 'Review graph proposal boundary', 'Graph extraction may propose candidates but cannot promote graph state directly.');
  if (capsule.claimLedger.weakClaims.length || capsule.claimLedger.unsupportedClaims.length) add('claimLedger', 'Review claim support', 'Weak and unsupported claims require claim-ledger review before final outputs.');
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
    v2.claimLedger.some((claim) => claim.support === 'unsupported' || claim.support === 'needs_source') ? 0 : 1,
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

function withFallback(values: string[], fallback: string[]): string[] {
  return values.length ? values : dedupeStrings(fallback.filter(Boolean));
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return dedupeStrings(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean));
}

function dedupeStrings<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values));
}

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

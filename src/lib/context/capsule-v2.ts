import type { PraxisCapsule } from '@/lib/context/capsule-service';
import type { CapsuleStarterSnapshot } from '@/lib/product/context-capsules';
import type { HumanGateStatus } from '@/lib/context/human-gate';

// Keep the v2 layer migration-free: legacy capsules normalize here before UI or agent use.
export type ContextCapsuleClass =
  | 'situation'
  | 'thinking_device'
  | 'artifact'
  | 'source_pack'
  | 'workflow'
  | 'human_gated'
  | 'compound_chain';

export type ContextCapsuleMode =
  | 'starter'
  | 'expert_pick'
  | 'team_private'
  | 'human_gated'
  | 'agent_operable'
  | 'archived';

export type SourceSupportState = 'supported' | 'partially_supported' | 'unsupported' | 'needs_source';
export type SourcePostureState = 'source_backed' | 'needs_sources' | 'source_intake' | 'advisory' | 'unsupported';
export type CapsuleReviewStatus = 'draft' | 'needs_review' | 'review_needed' | 'human_reviewed' | 'approved' | 'published' | 'stale' | 'archived';
export type CapsuleVisibilityV2 = 'private' | 'team' | 'organization' | 'public' | 'unlisted';
export type CapsuleForkability = 'allowed' | 'review_required' | 'disabled';

export interface ContextCapsuleSourcePosture {
  posture: SourcePostureState;
  requiredSourceTypes: string[];
  freshnessWindowDays: number | null;
  notes?: string;
}

export interface ContextCapsuleSourceRef {
  sourceId: string;
  label: string;
  url?: string | null;
  publisher?: string | null;
  date?: string | null;
  reliabilityTier?: 1 | 2 | 3 | null;
  stale?: boolean;
}

export interface ContextCapsuleClaim {
  claimId: string;
  text: string;
  support: SourceSupportState;
  sourceRefIds: string[];
  caveat?: string;
}

export interface ContextCapsuleReasoningScaffold {
  publicMethod: string[];
  caveats: string[];
  privateNotes?: string[];
  hiddenChainOfThought?: string;
}

export interface ContextCapsuleOutputContract {
  outputId: string;
  label: string;
  artifactType: 'memo' | 'brief' | 'annex' | 'dashboard' | 'handover' | 'source_pack' | 'other';
  citationRequired: boolean;
  reviewRequired: boolean;
}

export interface ContextCapsuleAgentPermissions {
  canSuggest: boolean;
  canSource: boolean;
  canFork: boolean;
  canDraft: boolean;
  canPublish: boolean;
}

export interface ContextCapsuleReviewState {
  status: CapsuleReviewStatus;
  reviewerId?: string | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  approvalId?: string | null;
}

export interface ContextCapsuleHealth {
  status: 'ready' | 'usable' | 'thin' | 'blocked';
  score: number;
  diagnostics: string[];
}

export interface ContextCapsuleProvenanceV2 {
  createdBy: string;
  createdAt?: string | null;
  parentCapsuleId?: string | null;
  humanAuthorId?: string | null;
  humanAuthorName?: string | null;
  humanAuthoredAt?: string | null;
  authoredSubstantiveBody?: boolean;
  source?: string | null;
  notes?: string | null;
}

export interface ContextCapsuleEditorialLogEntry {
  logId: string;
  message: string;
  visibility: 'agent_visible' | 'private';
  createdAt: string;
}

export interface ContextCapsuleHumanGate {
  required: boolean;
  gateStatus: 'not_required' | 'needs_review' | 'review_needed' | 'approved' | 'stale' | 'blocked';
  authorId?: string | null;
  authorName?: string | null;
  authoredAt?: string | null;
  reviewerId?: string | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  expiresAt?: string | null;
}

export interface ContextCapsuleV2 {
  capsuleId: string;
  ownerUid: string;
  label: string;
  summary: string;
  schemaVersion: 2;
  version: number;
  scope: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  coreRefs: {
    userCoreId: string | null;
    teamCoreId?: string | null;
    situationCoreId: string | null;
    pathCoreId?: string | null;
    sourceCoreIds: string[];
    documentCoreIds: string[];
    graphCoreId: string | null;
    timeCoreId?: string | null;
    outputCoreIds: string[];
    toolCoreIds: string[];
    objectiveCoreIds: string[];
    productCoreIds: string[];
    memoryCoreId?: string | null;
  };
  starterSnapshot?: CapsuleStarterSnapshot | null;
  capsuleClass: ContextCapsuleClass;
  capsuleMode: ContextCapsuleMode;
  domainTags: string[];
  audience: string[];
  useCase: string;
  purpose: string;
  bestNextAction: string;
  decisionHorizon: string | null;
  updateCadence: string | null;
  expiry: string | null;
  sourcePosture: ContextCapsuleSourcePosture | null;
  evidenceRequirements: string[];
  claimLedger: ContextCapsuleClaim[];
  sourceRefs: ContextCapsuleSourceRef[];
  reasoningScaffold: ContextCapsuleReasoningScaffold;
  outputContracts: ContextCapsuleOutputContract[];
  agentPermissions: ContextCapsuleAgentPermissions;
  reviewState: ContextCapsuleReviewState;
  qualityBreakdown?: { score: number };
  capsuleHealth: ContextCapsuleHealth;
  provenance: ContextCapsuleProvenanceV2;
  editorialLog: ContextCapsuleEditorialLogEntry[];
  visibility: CapsuleVisibilityV2;
  forkability: CapsuleForkability;
  reuseTerms: string;
  humanGate: ContextCapsuleHumanGate;
}

export interface ContextCapsuleNormalizeOptions {
  now?: string | Date;
}

export interface CapsuleAgentPayload {
  title: string;
  purpose: string;
  shortDescription: string;
  decisionHorizon: string | null;
  relevantClaims: Array<Pick<ContextCapsuleClaim, 'claimId' | 'text' | 'support' | 'sourceRefIds' | 'caveat'>>;
  sourceRefs: ContextCapsuleSourceRef[];
  caveats: string[];
  reasoningScaffold: { publicMethod: string[] };
  outputContracts: ContextCapsuleOutputContract[];
  humanGateStatus: HumanGateStatus;
  forbiddenActions: string[];
  requiredNextCheck: string;
}

export type CapsuleImproveAction =
  | 'add_missing_source'
  | 'clarify_audience'
  | 'convert_weak_claim_into_sourced_claim'
  | 'add_caveat'
  | 'add_output_contract'
  | 'mark_stale_content'
  | 'request_human_review'
  | 'promote_to_human_gated'
  | 'fork_into_source_pack'
  | 'attach_to_current_context_chain';

export interface CapsuleImproveProposal {
  proposalId: string;
  action: CapsuleImproveAction;
  target: string;
  rationale: string;
  reviewStatus: 'proposed';
  requiresHumanReview: true;
  mutatesApprovedBody: false;
}

export function normalizeContextCapsuleV2(input: unknown, options: ContextCapsuleNormalizeOptions = {}): ContextCapsuleV2 {
  const body = isRecord(input) ? input : {};
  const rawCoreRefs = isRecord(body.coreRefs) ? body.coreRefs : {};
  const starterSnapshot = isRecord(body.starterSnapshot) ? body.starterSnapshot as CapsuleStarterSnapshot : null;
  const sourceCoreIds = cleanStringArray(rawCoreRefs.sourceCoreIds);
  const documentCoreIds = cleanStringArray(rawCoreRefs.documentCoreIds);
  const toolCoreIds = cleanStringArray(rawCoreRefs.toolCoreIds);
  const outputCoreIds = cleanStringArray(rawCoreRefs.outputCoreIds);
  const productCoreIds = cleanStringArray(rawCoreRefs.productCoreIds);
  const createdAt = stringOrNull(body.createdAt) ?? new Date(0).toISOString();
  const updatedAt = stringOrNull(body.updatedAt) ?? createdAt;
  const label = stringOrNull(body.label) ?? 'Untitled capsule';
  const summary = stringOrNull(body.summary) ?? label;
  const explicitSourcePosture = Object.prototype.hasOwnProperty.call(body, 'sourcePosture');
  const sourceRefs = normalizeSourceRefs(body.sourceRefs, sourceCoreIds, starterSnapshot);
  const outputContracts = normalizeOutputContracts(body.outputContracts, [...outputCoreIds, ...productCoreIds]);
  const capsuleMode = normalizeCapsuleMode(body.capsuleMode, body, starterSnapshot);
  const humanGate = normalizeHumanGate(body.humanGate, capsuleMode, starterSnapshot);
  const sourcePosture = explicitSourcePosture
    ? normalizeSourcePosture(body.sourcePosture)
    : defaultSourcePosture(sourceRefs);
  const reviewState = normalizeReviewState(body.reviewState, humanGate);
  const provenance = normalizeProvenance(body.provenance, body, createdAt);
  const claimLedger = normalizeClaimLedger(body.claimLedger);
  const reasoningScaffold = normalizeReasoningScaffold(body.reasoningScaffold);

  const capsule: ContextCapsuleV2 = {
    capsuleId: stringOrNull(body.capsuleId) ?? 'default',
    ownerUid: stringOrNull(body.ownerUid) ?? 'unknown-owner',
    label,
    summary,
    schemaVersion: 2,
    version: numberOrDefault(body.version, 1),
    scope: stringOrNull(body.scope) ?? inferScope(rawCoreRefs),
    createdAt,
    updatedAt,
    archivedAt: stringOrNull(body.archivedAt),
    coreRefs: {
      userCoreId: stringOrNull(rawCoreRefs.userCoreId),
      teamCoreId: stringOrNull(rawCoreRefs.teamCoreId),
      situationCoreId: stringOrNull(rawCoreRefs.situationCoreId),
      pathCoreId: stringOrNull(rawCoreRefs.pathCoreId),
      sourceCoreIds,
      documentCoreIds,
      graphCoreId: stringOrNull(rawCoreRefs.graphCoreId),
      timeCoreId: stringOrNull(rawCoreRefs.timeCoreId),
      outputCoreIds,
      toolCoreIds,
      objectiveCoreIds: cleanStringArray(rawCoreRefs.objectiveCoreIds),
      productCoreIds,
      memoryCoreId: stringOrNull(rawCoreRefs.memoryCoreId),
    },
    starterSnapshot,
    capsuleClass: normalizeCapsuleClass(body.capsuleClass, starterSnapshot, rawCoreRefs),
    capsuleMode,
    domainTags: cleanStringArray(body.domainTags).length
      ? cleanStringArray(body.domainTags)
      : starterSnapshot?.domain
        ? [starterSnapshot.domain]
        : cleanStringArray(isRecord(body.community) ? body.community.tags : []).filter((tag) => tag.startsWith('domain:')).map((tag) => tag.slice('domain:'.length)),
    audience: cleanStringArray(body.audience),
    useCase: stringOrNull(body.useCase) ?? starterSnapshot?.summary ?? summary,
    purpose: Object.prototype.hasOwnProperty.call(body, 'purpose')
      ? (typeof body.purpose === 'string' ? body.purpose.trim() : '')
      : starterSnapshot?.richProfile?.purpose ?? summary,
    bestNextAction: stringOrNull(body.bestNextAction) ?? starterSnapshot?.suggestedNextActions?.[0] ?? '',
    decisionHorizon: stringOrNull(body.decisionHorizon),
    updateCadence: stringOrNull(body.updateCadence),
    expiry: stringOrNull(body.expiry),
    sourcePosture,
    evidenceRequirements: cleanStringArray(body.evidenceRequirements),
    claimLedger,
    sourceRefs,
    reasoningScaffold,
    outputContracts,
    agentPermissions: normalizeAgentPermissions(body.agentPermissions),
    reviewState,
    ...(isRecord(body.qualityBreakdown) && typeof body.qualityBreakdown.score === 'number' ? {
      qualityBreakdown: { score: Math.max(0, Math.min(100, body.qualityBreakdown.score)) },
    } : {}),
    capsuleHealth: normalizeCapsuleHealth(body.capsuleHealth, claimLedger, sourceRefs, outputContracts),
    provenance,
    editorialLog: normalizeEditorialLog(body.editorialLog),
    visibility: normalizeVisibility(body.visibility, body),
    forkability: normalizeForkability(body.forkability, body),
    reuseTerms: stringOrNull(body.reuseTerms) ?? 'Reuse requires source and review attribution.',
    humanGate,
  };

  if (capsule.archivedAt) capsule.capsuleMode = 'archived';
  if (capsule.humanGate.required && capsule.capsuleMode !== 'expert_pick') capsule.capsuleMode = 'human_gated';
  if (!capsule.expiry && capsule.humanGate.expiresAt) capsule.expiry = capsule.humanGate.expiresAt;
  if (!capsule.updateCadence && capsule.sourcePosture?.freshnessWindowDays) capsule.updateCadence = `${capsule.sourcePosture.freshnessWindowDays} days`;
  if (isStale(capsule.expiry, options.now)) {
    capsule.reviewState = { ...capsule.reviewState, status: 'stale' };
    capsule.humanGate = capsule.humanGate.required ? { ...capsule.humanGate, gateStatus: 'stale' } : capsule.humanGate;
  }
  return capsule;
}

export function buildCapsuleAgentPayload(input: ContextCapsuleV2 | PraxisCapsule | unknown, options: ContextCapsuleNormalizeOptions = {}): CapsuleAgentPayload {
  const capsule = normalizeContextCapsuleV2(input, options);
  const humanGateStatus = derivePayloadHumanGateStatus(capsule, options);
  const forbiddenActions = new Set<string>();
  if (!capsule.agentPermissions.canPublish) forbiddenActions.add('publish_capsule');
  if (capsule.humanGate.required) forbiddenActions.add('publish_human_gated_capsule');
  if (capsule.reviewState.status !== 'approved' && capsule.reviewState.status !== 'human_reviewed') forbiddenActions.add('treat_as_approved');

  return {
    title: capsule.label,
    purpose: capsule.purpose,
    shortDescription: capsule.summary,
    decisionHorizon: capsule.decisionHorizon,
    relevantClaims: capsule.claimLedger.map((claim) => ({
      claimId: claim.claimId,
      text: claim.text,
      support: claim.support,
      sourceRefIds: [...claim.sourceRefIds],
      ...(claim.caveat ? { caveat: claim.caveat } : {}),
    })),
    sourceRefs: capsule.sourceRefs.map((source) => ({ ...source })),
    caveats: [...capsule.reasoningScaffold.caveats],
    reasoningScaffold: { publicMethod: [...capsule.reasoningScaffold.publicMethod] },
    outputContracts: capsule.outputContracts.map((contract) => ({ ...contract })),
    humanGateStatus,
    forbiddenActions: Array.from(forbiddenActions).sort(),
    requiredNextCheck: requiredNextCheck(capsule, humanGateStatus),
  };
}

export function buildCapsuleImproveProposals(input: ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions = {}): CapsuleImproveProposal[] {
  const capsule = normalizeContextCapsuleV2(input, options);
  const proposals: CapsuleImproveProposal[] = [];
  const add = (action: CapsuleImproveAction, target: string, rationale: string) => {
    proposals.push({
      proposalId: `proposal-${action}-${stableId(`${capsule.capsuleId}:${target}:${rationale}`)}`,
      action,
      target,
      rationale,
      reviewStatus: 'proposed',
      requiresHumanReview: true,
      mutatesApprovedBody: false,
    });
  };

  if (!capsule.sourceRefs.length) add('add_missing_source', 'sourceRefs', 'Attach at least one source receipt before treating the capsule as sourceable.');
  if (!capsule.audience.length) add('clarify_audience', 'audience', 'Clarify the decision audience so output contracts and tone can be reviewed.');
  if (capsule.claimLedger.some((claim) => claim.support === 'unsupported' || claim.support === 'needs_source' || !claim.sourceRefIds.length)) {
    add('convert_weak_claim_into_sourced_claim', 'claimLedger', 'Convert weak claims into sourced claims or mark them as open questions.');
    add('add_caveat', 'reasoningScaffold.caveats', 'Add a caveat for any claim whose support is partial, stale, or missing.');
  }
  if (!capsule.outputContracts.length) add('add_output_contract', 'outputContracts', 'Add the intended memo, brief, annex, dashboard, or handover contract.');
  const humanGateStatus = derivePayloadHumanGateStatus(capsule, options);
  if (humanGateStatus === 'stale') add('mark_stale_content', 'reviewState', 'Mark stale human-gated content for refresh before use.');
  if (capsule.humanGate.required && humanGateStatus !== 'human_gated' && humanGateStatus !== 'expert_pick_human_gated') {
    add('request_human_review', 'humanGate', 'Request human review before changing approved capsule body or publishing outputs.');
  }
  if (!capsule.humanGate.required) add('promote_to_human_gated', 'humanGate', 'Promote high-stakes reusable context into a human-gated capsule after author and reviewer metadata are ready.');
  if (capsule.sourceRefs.length && capsule.capsuleClass !== 'source_pack') add('fork_into_source_pack', 'sourceRefs', 'Fork reusable source receipts into a source-pack capsule when they should travel independently.');
  add('attach_to_current_context_chain', 'contextChain', 'Attach the proposal to the current ContextChain for review instead of mutating canonical capsule state.');

  return dedupeBy(proposals, (proposal) => proposal.action);
}

function normalizeCapsuleClass(value: unknown, starter: CapsuleStarterSnapshot | null, coreRefs: Record<string, unknown>): ContextCapsuleClass {
  if (isCapsuleClass(value)) return value;
  if (starter?.category === 'tool') return 'thinking_device';
  if (starter?.category === 'output') return 'artifact';
  if (starter?.category === 'user') return 'workflow';
  if (stringOrNull(coreRefs.situationCoreId)) return 'situation';
  if (cleanStringArray(coreRefs.sourceCoreIds).length && !stringOrNull(coreRefs.situationCoreId)) return 'source_pack';
  if (cleanStringArray(coreRefs.outputCoreIds).length || cleanStringArray(coreRefs.productCoreIds).length) return 'artifact';
  return 'situation';
}

function normalizeCapsuleMode(value: unknown, body: Record<string, unknown>, starter: CapsuleStarterSnapshot | null): ContextCapsuleMode {
  if (isCapsuleMode(value)) return value;
  if (stringOrNull(body.archivedAt)) return 'archived';
  if (starter) return 'starter';
  if (isRecord(body.access) && body.access.visibility === 'public') return 'expert_pick';
  return 'team_private';
}

function normalizeSourcePosture(value: unknown): ContextCapsuleSourcePosture | null {
  if (value === null) return null;
  const body = isRecord(value) ? value : {};
  const posture = isSourcePostureState(body.posture) ? body.posture : null;
  if (!posture) return null;
  return {
    posture,
    requiredSourceTypes: cleanStringArray(body.requiredSourceTypes),
    freshnessWindowDays: typeof body.freshnessWindowDays === 'number' ? Math.max(0, Math.floor(body.freshnessWindowDays)) : null,
    ...(stringOrNull(body.notes) ? { notes: stringOrNull(body.notes)! } : {}),
  };
}

function defaultSourcePosture(sourceRefs: ContextCapsuleSourceRef[]): ContextCapsuleSourcePosture {
  return {
    posture: sourceRefs.length ? 'source_backed' : 'needs_sources',
    requiredSourceTypes: [],
    freshnessWindowDays: sourceRefs.length ? 90 : null,
  };
}

function normalizeSourceRefs(value: unknown, sourceCoreIds: string[], starter: CapsuleStarterSnapshot | null): ContextCapsuleSourceRef[] {
  const explicit = Array.isArray(value) ? value : null;
  const rows = explicit ?? starter?.sourcePack ?? sourceCoreIds.map((sourceId) => ({ sourceId, id: sourceId, label: sourceId }));
  return rows
    .map((row): ContextCapsuleSourceRef | null => {
      if (!isRecord(row)) return null;
      const sourceId = stringOrNull(row.sourceId) ?? stringOrNull(row.id);
      if (!sourceId) return null;
      const reliability = typeof row.reliabilityTier === 'number' && [1, 2, 3].includes(row.reliabilityTier)
        ? row.reliabilityTier as 1 | 2 | 3
        : null;
      return {
        sourceId,
        label: stringOrNull(row.label) ?? sourceId,
        url: stringOrNull(row.url),
        publisher: stringOrNull(row.publisher),
        date: stringOrNull(row.date),
        reliabilityTier: reliability,
        stale: row.stale === true,
      };
    })
    .filter((row): row is ContextCapsuleSourceRef => Boolean(row));
}

function normalizeClaimLedger(value: unknown): ContextCapsuleClaim[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row, index): ContextCapsuleClaim | null => {
      if (!isRecord(row)) return null;
      const text = stringOrNull(row.text);
      if (!text) return null;
      return {
        claimId: stringOrNull(row.claimId) ?? `claim-${index + 1}`,
        text,
        support: isSourceSupportState(row.support) ? row.support : 'needs_source',
        sourceRefIds: cleanStringArray(row.sourceRefIds),
        ...(stringOrNull(row.caveat) ? { caveat: stringOrNull(row.caveat)! } : {}),
      };
    })
    .filter((row): row is ContextCapsuleClaim => Boolean(row));
}

function normalizeReasoningScaffold(value: unknown): ContextCapsuleReasoningScaffold {
  const body = isRecord(value) ? value : {};
  return {
    publicMethod: cleanStringArray(body.publicMethod),
    caveats: cleanStringArray(body.caveats),
    privateNotes: cleanStringArray(body.privateNotes),
    hiddenChainOfThought: stringOrNull(body.hiddenChainOfThought) ?? undefined,
  };
}

function normalizeOutputContracts(value: unknown, outputIds: string[]): ContextCapsuleOutputContract[] {
  const explicit = Array.isArray(value) ? value : null;
  const rows = explicit ?? outputIds.map((outputId) => ({ outputId, label: outputId }));
  return rows
    .map((row): ContextCapsuleOutputContract | null => {
      if (!isRecord(row)) return null;
      const outputId = stringOrNull(row.outputId) ?? stringOrNull(row.id);
      if (!outputId) return null;
      return {
        outputId,
        label: stringOrNull(row.label) ?? outputId,
        artifactType: isOutputArtifactType(row.artifactType) ? row.artifactType : 'other',
        citationRequired: row.citationRequired !== false,
        reviewRequired: row.reviewRequired !== false,
      };
    })
    .filter((row): row is ContextCapsuleOutputContract => Boolean(row));
}

function normalizeAgentPermissions(value: unknown): ContextCapsuleAgentPermissions {
  const body = isRecord(value) ? value : {};
  return {
    canSuggest: body.canSuggest !== false,
    canSource: body.canSource !== false,
    canFork: body.canFork !== false,
    canDraft: body.canDraft !== false,
    canPublish: body.canPublish === true,
  };
}

function normalizeHumanGate(value: unknown, mode: ContextCapsuleMode, starter: CapsuleStarterSnapshot | null): ContextCapsuleHumanGate {
  const body = isRecord(value) ? value : {};
  const starterReview = starter?.humanReview;
  const required = body.required === true || mode === 'human_gated' || mode === 'expert_pick' || Boolean(starterReview);
  const gateStatus = isHumanGateState(body.gateStatus)
    ? body.gateStatus
    : starterReview?.status === 'human-reviewed'
      ? 'approved'
      : required
        ? 'needs_review'
        : 'not_required';
  return {
    required,
    gateStatus,
    authorId: stringOrNull(body.authorId) ?? starterReview?.authorOrPublisher ?? null,
    authorName: stringOrNull(body.authorName) ?? starterReview?.authorOrPublisher ?? null,
    authoredAt: stringOrNull(body.authoredAt) ?? null,
    reviewerId: stringOrNull(body.reviewerId) ?? starterReview?.reviewedBy ?? null,
    reviewerName: stringOrNull(body.reviewerName) ?? starterReview?.reviewedBy ?? null,
    reviewedAt: stringOrNull(body.reviewedAt) ?? starterReview?.reviewedAt ?? null,
    expiresAt: stringOrNull(body.expiresAt) ?? null,
  };
}

function normalizeReviewState(value: unknown, humanGate: ContextCapsuleHumanGate): ContextCapsuleReviewState {
  const body = isRecord(value) ? value : {};
  return {
    status: isReviewStatus(body.status) ? body.status : humanGate.gateStatus === 'approved' ? 'approved' : humanGate.required ? 'needs_review' : 'draft',
    reviewerId: stringOrNull(body.reviewerId) ?? humanGate.reviewerId,
    reviewerName: stringOrNull(body.reviewerName) ?? humanGate.reviewerName,
    reviewedAt: stringOrNull(body.reviewedAt) ?? humanGate.reviewedAt,
    approvalId: stringOrNull(body.approvalId),
  };
}

function normalizeCapsuleHealth(value: unknown, claims: ContextCapsuleClaim[], sources: ContextCapsuleSourceRef[], outputs: ContextCapsuleOutputContract[]): ContextCapsuleHealth {
  const body = isRecord(value) ? value : {};
  const diagnostics = cleanStringArray(body.diagnostics);
  if (!sources.length) diagnostics.push('No source refs attached.');
  if (claims.some((claim) => claim.support === 'unsupported')) diagnostics.push('Unsupported claims require review.');
  if (!outputs.length) diagnostics.push('No output contract attached.');
  const score = typeof body.score === 'number'
    ? Math.max(0, Math.min(100, Math.round(body.score)))
    : Math.max(0, 100 - diagnostics.length * 20);
  return {
    status: body.status === 'ready' || body.status === 'usable' || body.status === 'thin' || body.status === 'blocked'
      ? body.status
      : diagnostics.some((item) => /unsupported/i.test(item))
        ? 'blocked'
        : score >= 80
          ? 'ready'
          : score >= 50
            ? 'usable'
            : 'thin',
    score,
    diagnostics: dedupeStrings(diagnostics),
  };
}

function normalizeProvenance(value: unknown, body: Record<string, unknown>, createdAt: string): ContextCapsuleProvenanceV2 {
  const source = isRecord(value) ? value : {};
  return {
    createdBy: stringOrNull(source.createdBy) ?? stringOrNull(body.ownerUid) ?? 'unknown-owner',
    createdAt: stringOrNull(source.createdAt) ?? createdAt,
    parentCapsuleId: stringOrNull(source.parentCapsuleId),
    humanAuthorId: stringOrNull(source.humanAuthorId),
    humanAuthorName: stringOrNull(source.humanAuthorName),
    humanAuthoredAt: stringOrNull(source.humanAuthoredAt),
    authoredSubstantiveBody: source.authoredSubstantiveBody === true,
    source: stringOrNull(source.source),
    notes: stringOrNull(source.notes),
  };
}

function normalizeEditorialLog(value: unknown): ContextCapsuleEditorialLogEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row, index): ContextCapsuleEditorialLogEntry | null => {
      if (!isRecord(row)) return null;
      const message = stringOrNull(row.message);
      if (!message) return null;
      return {
        logId: stringOrNull(row.logId) ?? `log-${index + 1}`,
        message,
        visibility: row.visibility === 'agent_visible' ? 'agent_visible' : 'private',
        createdAt: stringOrNull(row.createdAt) ?? new Date(0).toISOString(),
      };
    })
    .filter((row): row is ContextCapsuleEditorialLogEntry => Boolean(row));
}

function normalizeVisibility(value: unknown, body: Record<string, unknown>): CapsuleVisibilityV2 {
  if (value === 'private' || value === 'team' || value === 'organization' || value === 'public' || value === 'unlisted') return value;
  if (isRecord(body.access) && body.access.visibility === 'public') return 'public';
  if (isRecord(body.access) && body.access.visibility === 'organization') return 'organization';
  return 'private';
}

function normalizeForkability(value: unknown, body: Record<string, unknown>): CapsuleForkability {
  if (value === 'allowed' || value === 'review_required' || value === 'disabled') return value;
  if (isRecord(body.access) && body.access.allowClone === false) return 'disabled';
  return 'review_required';
}

function inferScope(coreRefs: Record<string, unknown>): string {
  if (stringOrNull(coreRefs.userCoreId)) return 'user';
  if (stringOrNull(coreRefs.teamCoreId)) return 'team';
  return 'situation';
}

function isStale(value: string | null | undefined, now?: string | Date): boolean {
  if (!value) return false;
  const then = Date.parse(value);
  if (Number.isNaN(then)) return false;
  const compare = now instanceof Date ? now.getTime() : now ? Date.parse(now) : Date.now();
  return !Number.isNaN(compare) && then < compare;
}

function requiredNextCheck(capsule: ContextCapsuleV2, status: HumanGateStatus): string {
  if (status === 'stale') return 'refresh_human_review';
  if (status === 'needs_review' || status === 'review_needed') return 'request_human_review';
  if (capsule.claimLedger.some((claim) => claim.support !== 'supported')) return 'run_sourceability';
  return capsule.bestNextAction || 'inspect_sourceability';
}

function derivePayloadHumanGateStatus(capsule: ContextCapsuleV2, options: ContextCapsuleNormalizeOptions): HumanGateStatus {
  if (!capsule.humanGate.required) return 'not_required';
  if (isStale(capsule.humanGate.expiresAt ?? capsule.expiry, options.now)) return 'stale';
  if (capsule.claimLedger.some((claim) => claim.support === 'unsupported' || claim.support === 'needs_source')) return 'review_needed';
  if (capsule.humanGate.gateStatus === 'approved' && capsule.humanGate.reviewerId && capsule.humanGate.reviewedAt) return 'human_gated';
  return 'needs_review';
}

function isCapsuleClass(value: unknown): value is ContextCapsuleClass {
  return value === 'situation' || value === 'thinking_device' || value === 'artifact' || value === 'source_pack' || value === 'workflow' || value === 'human_gated' || value === 'compound_chain';
}

function isCapsuleMode(value: unknown): value is ContextCapsuleMode {
  return value === 'starter' || value === 'expert_pick' || value === 'team_private' || value === 'human_gated' || value === 'agent_operable' || value === 'archived';
}

function isSourceSupportState(value: unknown): value is SourceSupportState {
  return value === 'supported' || value === 'partially_supported' || value === 'unsupported' || value === 'needs_source';
}

function isSourcePostureState(value: unknown): value is SourcePostureState {
  return value === 'source_backed' || value === 'needs_sources' || value === 'source_intake' || value === 'advisory' || value === 'unsupported';
}

function isOutputArtifactType(value: unknown): value is ContextCapsuleOutputContract['artifactType'] {
  return value === 'memo' || value === 'brief' || value === 'annex' || value === 'dashboard' || value === 'handover' || value === 'source_pack' || value === 'other';
}

function isHumanGateState(value: unknown): value is ContextCapsuleHumanGate['gateStatus'] {
  return value === 'not_required' || value === 'needs_review' || value === 'review_needed' || value === 'approved' || value === 'stale' || value === 'blocked';
}

function isReviewStatus(value: unknown): value is CapsuleReviewStatus {
  return value === 'draft' || value === 'needs_review' || value === 'review_needed' || value === 'human_reviewed' || value === 'approved' || value === 'published' || value === 'stale' || value === 'archived';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return dedupeStrings(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean));
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function dedupeBy<T>(values: T[], keyOf: (value: T) => string): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = keyOf(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

function stableId(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

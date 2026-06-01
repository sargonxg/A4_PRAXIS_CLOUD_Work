import {
  normalizeContextCapsuleV2,
  type ContextCapsuleClaim,
  type ContextCapsuleNormalizeOptions,
  type ContextCapsuleV2,
} from '@/lib/context/capsule-v2';
import { canShowHumanReviewed, canShowHumanWritten, deriveHumanGateStatus } from '@/lib/context/human-gate';

export type CapsuleQualityBreakdownId =
  | 'completeness'
  | 'source_support'
  | 'freshness'
  | 'human_review_provenance'
  | 'output_readiness'
  | 'agent_operability'
  | 'temporality_coverage'
  | 'causality_coverage'
  | 'ontology_binding_coverage'
  | 'receipt_depth'
  | 'contradiction_rate';

export type CapsuleQualityDiagnosticCode =
  | 'missing_purpose'
  | 'missing_audience'
  | 'no_source_posture'
  | 'no_decision_horizon'
  | 'unsupported_claims'
  | 'stale_source_refs'
  | 'missing_output_contract'
  | 'human_gated_missing_author_reviewer'
  | 'agent_operable_missing_best_next_action_or_permissions'
  | 'runtime_usage_degraded'
  | 'missing_temporality'
  | 'missing_causality'
  | 'missing_ontology_binding'
  | 'low_receipt_depth'
  | 'contradiction_rate_high';

export interface CapsuleQualityDiagnostic {
  code: CapsuleQualityDiagnosticCode;
  message: string;
}

export interface CapsuleQualityBreakdownItem {
  id: CapsuleQualityBreakdownId;
  label: string;
  score: number;
  maxScore: number;
  diagnostics: CapsuleQualityDiagnostic[];
}

export interface CapsuleQualityResult {
  score: number;
  breakdown: CapsuleQualityBreakdownItem[];
  diagnostics: CapsuleQualityDiagnostic[];
}

interface V3EvaluationHints {
  tacitKnowledgeScore?: number;
  sourceSpineScore?: number;
  agentOperabilityScore?: number;
  marketplaceReadinessScore?: number;
  temporalityCoverage?: number;
  causalityCoverage?: number;
  ontologyBindingCoverage?: number;
  receiptDepth?: number;
  contradictionRate?: number;
}

interface CapsuleUsageSignals {
  readCount: number;
  fallbackRate: number;
  droppedCoreRate: number;
  staleCoreRate: number;
}

interface Quality2Signals {
  temporalityCoverage: number;
  causalityCoverage: number;
  ontologyBindingCoverage: number;
  receiptDepth: number;
  contradictionRate: number;
}

const QUALITY_WEIGHTS: Array<{ id: CapsuleQualityBreakdownId; label: string; maxScore: number }> = [
  { id: 'completeness', label: 'Completeness', maxScore: 15 },
  { id: 'source_support', label: 'Source support', maxScore: 15 },
  { id: 'freshness', label: 'Freshness', maxScore: 10 },
  { id: 'human_review_provenance', label: 'Human review/provenance', maxScore: 10 },
  { id: 'output_readiness', label: 'Output readiness', maxScore: 10 },
  { id: 'agent_operability', label: 'Agent operability', maxScore: 10 },
  { id: 'temporality_coverage', label: 'Temporality coverage', maxScore: 7 },
  { id: 'causality_coverage', label: 'Causality coverage', maxScore: 7 },
  { id: 'ontology_binding_coverage', label: 'Ontology binding coverage', maxScore: 6 },
  { id: 'receipt_depth', label: 'Receipt depth', maxScore: 8 },
  { id: 'contradiction_rate', label: 'Contradiction rate', maxScore: 2 },
];

export function deriveCapsuleQuality(input: ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions = {}): CapsuleQualityResult {
  const capsule = normalizeContextCapsuleV2(input, options);
  const v3Evaluation = readV3EvaluationHints(input);
  const usage = readUsageSignals(input);
  const quality2 = readQuality2Signals(input, capsule, v3Evaluation);
  const breakdown = QUALITY_WEIGHTS.map((weight) => scoreBreakdown(weight.id, weight.label, weight.maxScore, capsule, options, v3Evaluation, usage, quality2));
  const diagnostics = breakdown.flatMap((item) => item.diagnostics);
  return {
    score: breakdown.reduce((sum, item) => sum + item.score, 0),
    breakdown,
    diagnostics,
  };
}

function scoreBreakdown(
  id: CapsuleQualityBreakdownId,
  label: string,
  maxScore: number,
  capsule: ContextCapsuleV2,
  options: ContextCapsuleNormalizeOptions,
  v3Evaluation: V3EvaluationHints,
  usage: CapsuleUsageSignals,
  quality2: Quality2Signals,
): CapsuleQualityBreakdownItem {
  const diagnostics: CapsuleQualityDiagnostic[] = [];
  let ratio = 1;

  if (id === 'completeness') {
    const checks = [
      { ok: Boolean(capsule.purpose.trim()), code: 'missing_purpose' as const, message: 'Capsule is missing a clear purpose.' },
      { ok: capsule.audience.length > 0, code: 'missing_audience' as const, message: 'Capsule is missing its intended audience.' },
      { ok: Boolean(capsule.sourcePosture), code: 'no_source_posture' as const, message: 'Capsule is missing source posture.' },
      { ok: Boolean(capsule.decisionHorizon), code: 'no_decision_horizon' as const, message: 'Capsule is missing decision horizon.' },
    ];
    for (const check of checks) if (!check.ok) diagnostics.push({ code: check.code, message: check.message });
    ratio = passRatio(checks.map((check) => check.ok));
  }

  if (id === 'source_support') {
    if (!capsule.sourcePosture) diagnostics.push({ code: 'no_source_posture', message: 'Capsule has no source posture.' });
    const sourceIds = new Set(capsule.sourceRefs.map((source) => source.sourceId));
    const unsupported = capsule.claimLedger.filter((claim) =>
      claim.support === 'unsupported' ||
      claim.support === 'needs_source' ||
      claim.sourceRefIds.length === 0 ||
      claim.sourceRefIds.some((sourceId) => !sourceIds.has(sourceId))
    );
    if (unsupported.length) diagnostics.push({ code: 'unsupported_claims', message: 'One or more claims lack source support.' });
    ratio = average([
      capsule.sourcePosture ? 1 : 0,
      capsule.sourceRefs.length ? 1 : 0,
      capsule.claimLedger.length ? 1 : 0.75,
      unsupported.length ? 0 : 1,
      scoreRatio(v3Evaluation.sourceSpineScore),
    ]);
  }

  if (id === 'freshness') {
    const staleSources = capsule.sourceRefs.filter((source) => source.stale || isStale(source.date, capsule.sourcePosture?.freshnessWindowDays ?? null, options.now));
    if (staleSources.length || isPast(capsule.expiry, options.now)) {
      diagnostics.push({ code: 'stale_source_refs', message: 'Source refs or review expiry are stale.' });
    }
    ratio = staleSources.length || isPast(capsule.expiry, options.now) ? 0 : 1;
  }

  if (id === 'human_review_provenance') {
    if (capsule.humanGate.required) {
      const written = canShowHumanWritten(capsule) && Boolean(capsule.humanGate.authorId && capsule.humanGate.authoredAt);
      const reviewed = canShowHumanReviewed(capsule) && Boolean(capsule.humanGate.reviewerId && capsule.humanGate.reviewedAt);
      const current = deriveHumanGateStatus(capsule, options) === 'human_gated' || deriveHumanGateStatus(capsule, options) === 'expert_pick_human_gated';
      if (!written || !reviewed) diagnostics.push({ code: 'human_gated_missing_author_reviewer', message: 'Human-gated capsule is missing author or reviewer metadata.' });
      ratio = average([written ? 1 : 0, reviewed ? 1 : 0, current ? 1 : 0]);
    } else {
      ratio = 1;
    }
  }

  if (id === 'output_readiness') {
    if (!capsule.outputContracts.length) diagnostics.push({ code: 'missing_output_contract', message: 'Capsule is missing an output contract.' });
    ratio = average([
      capsule.outputContracts.length ? 1 : 0,
      scoreRatio(v3Evaluation.marketplaceReadinessScore),
    ]);
  }

  if (id === 'agent_operability') {
    const hasAllowedAction = capsule.agentPermissions.canSuggest ||
      capsule.agentPermissions.canSource ||
      capsule.agentPermissions.canFork ||
      capsule.agentPermissions.canDraft;
    if (!capsule.bestNextAction || !hasAllowedAction) {
      diagnostics.push({
        code: 'agent_operable_missing_best_next_action_or_permissions',
        message: 'Agent-operable capsule needs a best next action and allowed agent permissions.',
      });
    }
    if (usage.readCount > 0 && (usage.fallbackRate > 0.25 || usage.droppedCoreRate > 0.5 || usage.staleCoreRate > 0.5)) {
      diagnostics.push({
        code: 'runtime_usage_degraded',
        message: 'Recent agent reads show thin fallback, dropped cores, or stale-core hits.',
      });
    }
    ratio = average([
      capsule.bestNextAction && hasAllowedAction ? 1 : 0,
      scoreRatio(v3Evaluation.agentOperabilityScore),
      scoreRatio(v3Evaluation.tacitKnowledgeScore),
      usage.readCount ? Math.max(0, 1 - Math.max(usage.fallbackRate, usage.droppedCoreRate, usage.staleCoreRate)) : Number.NaN,
    ]);
  }

  if (id === 'temporality_coverage') {
    if (quality2.temporalityCoverage <= 0) {
      diagnostics.push({ code: 'missing_temporality', message: 'Capsule is missing validity windows or timeline anchors.' });
    }
    ratio = quality2.temporalityCoverage;
  }

  if (id === 'causality_coverage') {
    if (quality2.causalityCoverage <= 0) {
      diagnostics.push({ code: 'missing_causality', message: 'Capsule is missing causal links or claim-level causal relationships.' });
    }
    ratio = quality2.causalityCoverage;
  }

  if (id === 'ontology_binding_coverage') {
    if (quality2.ontologyBindingCoverage <= 0) {
      diagnostics.push({ code: 'missing_ontology_binding', message: 'Capsule is missing a declared domain, ontology, or ACO binding.' });
    }
    ratio = quality2.ontologyBindingCoverage;
  }

  if (id === 'receipt_depth') {
    if (quality2.receiptDepth < 1) {
      diagnostics.push({ code: 'low_receipt_depth', message: 'One or more claims are missing receipts.' });
    }
    ratio = quality2.receiptDepth;
  }

  if (id === 'contradiction_rate') {
    if (quality2.contradictionRate > 0) {
      diagnostics.push({ code: 'contradiction_rate_high', message: 'One or more claims are disputed or contradicted.' });
    }
    ratio = Math.max(0, 1 - quality2.contradictionRate);
  }

  return {
    id,
    label,
    maxScore,
    score: Math.round(maxScore * ratio),
    diagnostics,
  };
}

function passRatio(values: boolean[]): number {
  if (!values.length) return 1;
  return values.filter(Boolean).length / values.length;
}

function average(values: number[]): number {
  const usable = values.filter((value) => Number.isFinite(value));
  if (!usable.length) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function readUsageSignals(input: unknown): CapsuleUsageSignals {
  const body = isRecord(input) ? input : {};
  const usage = isRecord(body.usage) ? body.usage : {};
  const readCount = numberOrZero(usage.readCount);
  const fallbackRate = boundedRatio(usage.fallbackRate);
  const droppedCoreRate = boundedRatio(usage.droppedCoreRate);
  const staleCoreRate = boundedRatio(usage.staleCoreRate);
  return { readCount, fallbackRate, droppedCoreRate, staleCoreRate };
}

function readQuality2Signals(input: unknown, capsule: ContextCapsuleV2, v3Evaluation: V3EvaluationHints): Quality2Signals {
  const grounding = readGrounding(input);
  const timelineAnchors = arrayLength(firstRecord(grounding.temporality)?.timelineAnchors);
  const legacyCoreReady = capsule.claimLedger.length === 0 && (
    Boolean(capsule.starterSnapshot) ||
    Boolean(capsule.coreRefs.situationCoreId) ||
    Boolean(capsule.coreRefs.pathCoreId) ||
    Boolean(capsule.coreRefs.graphCoreId) ||
    capsule.coreRefs.objectiveCoreIds.length > 0
  );
  const groundingTemporalWindow = Boolean(
    timelineAnchors ||
    cleanString(firstRecord(grounding.temporality)?.asOf) ||
    cleanString(firstRecord(grounding.temporality)?.validFrom) ||
    cleanString(firstRecord(grounding.temporality)?.validUntil),
  );
  const claimTemporalCoverage = ratioLike(
    capsule.claimLedger.filter((claim) => Boolean(claim.validFrom || claim.validUntil || claim.asOf)).length,
    capsule.claimLedger.length,
  );
  const temporalFallback = legacyCoreReady && (capsule.decisionHorizon || capsule.expiry || capsule.coreRefs.timeCoreId || capsule.updatedAt)
    ? 0.5
    : 0;
  const groundingCausalLinks = arrayLength(firstRecord(grounding.causality)?.causalLinks);
  const claimCausalCoverage = ratioLike(
    capsule.claimLedger.filter((claim) => hasCausalLinks(claim)).length,
    capsule.claimLedger.length,
  );
  const causalFallback = legacyCoreReady && (
    Boolean(capsule.coreRefs.pathCoreId) ||
    Boolean(capsule.coreRefs.graphCoreId) ||
    capsule.coreRefs.objectiveCoreIds.length > 0 ||
    (Boolean(capsule.coreRefs.situationCoreId) && capsule.coreRefs.toolCoreIds.length > 0)
  ) ? 0.5 : 0;
  const ontologyBinding = firstRecord(grounding.ontologyBinding);
  const ontologyCoverage = ontologyBinding
    ? average([
      cleanString(ontologyBinding.domainId) ? 1 : 0,
      arrayLength(ontologyBinding.ontologyIds) ? 1 : 0,
      arrayLength(ontologyBinding.acoPrimitives) ? 1 : 0,
    ])
    : legacyCoreReady && (capsule.domainTags.length || capsule.coreRefs.situationCoreId || capsule.capsuleClass)
      ? 0.75
      : 0;
  const receiptDepth = ratioLike(
    capsule.claimLedger.filter((claim) => hasReceiptLikeSupport(claim, capsule)).length,
    capsule.claimLedger.length,
  );
  const disputedClaimIds = new Set(capsule.claimLedger
    .filter((claim) => claim.support === 'disputed' || receiptsDisagreeWithinClaim(claim))
    .map((claim) => claim.claimId));
  const crossClaimContradictions = firstRecord(firstRecord(input)?.claimLedger)?.crossClaimContradictions;
  if (Array.isArray(crossClaimContradictions)) {
    for (const contradiction of crossClaimContradictions) {
      const claimIds = isRecord(contradiction) && Array.isArray(contradiction.claimIds) ? contradiction.claimIds : [];
      for (const claimId of claimIds) if (typeof claimId === 'string') disputedClaimIds.add(claimId);
    }
  }
  const contradictionRate = ratioLike(disputedClaimIds.size, capsule.claimLedger.length);
  return {
    temporalityCoverage: scoreRatio(v3Evaluation.temporalityCoverage) || (groundingTemporalWindow || claimTemporalCoverage === 1 ? 1 : Math.max(claimTemporalCoverage, temporalFallback)),
    causalityCoverage: scoreRatio(v3Evaluation.causalityCoverage) || Math.max(groundingCausalLinks ? 1 : 0, claimCausalCoverage, causalFallback),
    ontologyBindingCoverage: scoreRatio(v3Evaluation.ontologyBindingCoverage) || ontologyCoverage,
    receiptDepth: scoreRatio(v3Evaluation.receiptDepth) || (capsule.claimLedger.length ? receiptDepth : capsule.coreRefs.sourceCoreIds.length || capsule.sourceRefs.length ? 1 : 0),
    contradictionRate: scoreRatio(v3Evaluation.contradictionRate) || contradictionRate,
  };
}

function scoreRatio(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return Number.NaN;
  return Math.max(0, Math.min(1, value / 100));
}

function readV3EvaluationHints(input: unknown): V3EvaluationHints {
  const body = isRecord(input) ? input : {};
  const evaluation = isRecord(body.evaluation)
    ? body.evaluation
    : isRecord(body.v3) && isRecord(body.v3.evaluation)
      ? body.v3.evaluation
      : {};
  return {
    tacitKnowledgeScore: numberOrUndefined(evaluation.tacitKnowledgeScore),
    sourceSpineScore: numberOrUndefined(evaluation.sourceSpineScore),
    agentOperabilityScore: numberOrUndefined(evaluation.agentOperabilityScore),
    marketplaceReadinessScore: numberOrUndefined(evaluation.marketplaceReadinessScore),
    temporalityCoverage: numberOrUndefined(evaluation.temporalityCoverage),
    causalityCoverage: numberOrUndefined(evaluation.causalityCoverage),
    ontologyBindingCoverage: numberOrUndefined(evaluation.ontologyBindingCoverage),
    receiptDepth: numberOrUndefined(evaluation.receiptDepth),
    contradictionRate: numberOrUndefined(evaluation.contradictionRate),
  };
}

function readGrounding(input: unknown): Record<string, unknown> {
  const body = isRecord(input) ? input : {};
  const nestedV3 = isRecord(body.v3) ? body.v3 : {};
  return firstRecord(body.grounding, nestedV3.grounding, {
    temporality: body.temporality,
    causality: body.causality,
    ontologyBinding: body.ontologyBinding,
  }) ?? {};
}

function hasReceiptLikeSupport(claim: ContextCapsuleClaim, capsule: ContextCapsuleV2): boolean {
  if (claim.receipts?.length) return true;
  const sourceIds = new Set(capsule.sourceRefs.map((source) => source.sourceId));
  return claim.sourceRefIds.some((sourceId) => sourceIds.has(sourceId));
}

function hasCausalLinks(claim: ContextCapsuleClaim): boolean {
  const links = claim.causalLinks;
  if (!links) return false;
  return Boolean(
    links.causes?.length ||
    links.causedBy?.length ||
    links.enables?.length ||
    links.blocks?.length ||
    links.escalates?.length ||
    links.deEscalates?.length,
  );
}

function receiptsDisagreeWithinClaim(claim: ContextCapsuleClaim): boolean {
  const stances = new Set((claim.receipts ?? []).map((receipt) => receipt.stance ?? 'supports'));
  return stances.has('supports') && (stances.has('contradicts') || stances.has('mixed'));
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function boundedRatio(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function ratioLike(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(1, numerator / denominator));
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function firstRecord(...values: unknown[]): Record<string, unknown> | null {
  return values.find(isRecord) ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPast(value: string | null | undefined, now?: string | Date): boolean {
  if (!value) return false;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return false;
  const compare = now instanceof Date ? now.getTime() : now ? Date.parse(now) : Date.now();
  return !Number.isNaN(compare) && timestamp < compare;
}

function isStale(value: string | null | undefined, freshnessWindowDays: number | null, now?: string | Date): boolean {
  if (!value || freshnessWindowDays === null) return false;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return false;
  const compare = now instanceof Date ? now.getTime() : now ? Date.parse(now) : Date.now();
  if (Number.isNaN(compare)) return false;
  const ageDays = (compare - timestamp) / 86_400_000;
  return ageDays > freshnessWindowDays;
}

import {
  normalizeContextCapsuleV2,
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
  | 'agent_operability';

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
  | 'runtime_usage_degraded';

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
}

interface CapsuleUsageSignals {
  readCount: number;
  fallbackRate: number;
  droppedCoreRate: number;
  staleCoreRate: number;
}

const QUALITY_WEIGHTS: Array<{ id: CapsuleQualityBreakdownId; label: string; maxScore: number }> = [
  { id: 'completeness', label: 'Completeness', maxScore: 25 },
  { id: 'source_support', label: 'Source support', maxScore: 25 },
  { id: 'freshness', label: 'Freshness', maxScore: 15 },
  { id: 'human_review_provenance', label: 'Human review/provenance', maxScore: 15 },
  { id: 'output_readiness', label: 'Output readiness', maxScore: 10 },
  { id: 'agent_operability', label: 'Agent operability', maxScore: 10 },
];

export function deriveCapsuleQuality(input: ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions = {}): CapsuleQualityResult {
  const capsule = normalizeContextCapsuleV2(input, options);
  const v3Evaluation = readV3EvaluationHints(input);
  const usage = readUsageSignals(input);
  const breakdown = QUALITY_WEIGHTS.map((weight) => scoreBreakdown(weight.id, weight.label, weight.maxScore, capsule, options, v3Evaluation, usage));
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
  };
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

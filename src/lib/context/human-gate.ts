import {
  normalizeContextCapsuleV2,
  type ContextCapsuleNormalizeOptions,
  type ContextCapsuleV2,
} from '@/lib/context/capsule-v2';

export type HumanGateStatus =
  | 'not_required'
  | 'needs_review'
  | 'review_needed'
  | 'stale'
  | 'human_gated'
  | 'expert_pick_human_gated'
  | 'blocked';

export interface HumanGateBadge {
  id: 'human-written' | 'human-reviewed' | 'human-gated' | 'expert-pick' | 'review-needed' | 'stale';
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  detail: string;
}

export interface HumanGateLintIssue {
  code:
    | 'missing_human_author'
    | 'missing_substantive_human_body'
    | 'missing_human_reviewer'
    | 'missing_reviewed_at'
    | 'missing_approval'
    | 'stale_human_gate'
    | 'unsupported_claims'
    | 'agent_publish_forbidden'
    | 'expert_pick_quality_threshold'
    | 'missing_output_contract';
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface PublishGateResult {
  allowed: boolean;
  status: HumanGateStatus;
  issues: HumanGateLintIssue[];
}

export interface PublishGateOptions extends ContextCapsuleNormalizeOptions {
  actor?: 'human' | 'agent';
}

export function deriveHumanGateStatus(input: ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions = {}): HumanGateStatus {
  const capsule = normalizeContextCapsuleV2(input, options);
  if (!capsule.humanGate.required) return 'not_required';
  if (isGateStale(capsule, options)) return 'stale';
  if (capsule.humanGate.gateStatus === 'blocked') return 'blocked';
  if (hasUnsupportedClaims(capsule)) return 'review_needed';
  if (!hasAuthorMetadata(capsule) || !hasReviewerMetadata(capsule)) return 'needs_review';
  if (capsule.humanGate.gateStatus !== 'approved') return 'needs_review';
  if (capsule.capsuleMode === 'expert_pick') {
    const score = capsule.qualityBreakdown?.score ?? capsule.capsuleHealth.score;
    return score >= 90 ? 'expert_pick_human_gated' : 'needs_review';
  }
  return 'human_gated';
}

export function deriveHumanGateBadges(input: ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions = {}): HumanGateBadge[] {
  const capsule = normalizeContextCapsuleV2(input, options);
  const badges: HumanGateBadge[] = [];
  const status = deriveHumanGateStatus(capsule, options);

  if (canShowHumanWritten(capsule)) {
    badges.push({
      id: 'human-written',
      label: 'Human Written',
      tone: 'success',
      detail: 'Substantive human-authored body metadata is present.',
    });
  }
  if (canShowHumanReviewed(capsule)) {
    badges.push({
      id: 'human-reviewed',
      label: 'Human Reviewed',
      tone: 'success',
      detail: 'Reviewer identity and reviewedAt metadata are present.',
    });
  }
  if (status === 'human_gated' || status === 'expert_pick_human_gated') {
    badges.push({
      id: 'human-gated',
      label: 'Human-Gated',
      tone: 'success',
      detail: 'Human gate is current and supported enough for governed reuse.',
    });
  }
  if (status === 'expert_pick_human_gated') {
    badges.push({
      id: 'expert-pick',
      label: 'Expert Pick',
      tone: 'success',
      detail: 'Expert-pick score and review thresholds are satisfied.',
    });
  }
  if (status === 'needs_review' || status === 'review_needed') {
    badges.push({
      id: 'review-needed',
      label: 'Review Needed',
      tone: 'warning',
      detail: 'Human gate is incomplete or claims need source review.',
    });
  }
  if (status === 'stale') {
    badges.push({
      id: 'stale',
      label: 'Stale Gate',
      tone: 'danger',
      detail: 'Review or expiry metadata is stale for final-output use.',
    });
  }
  return badges;
}

export function canShowHumanWritten(input: ContextCapsuleV2 | unknown): boolean {
  const capsule = normalizeContextCapsuleV2(input);
  return Boolean(
    capsule.provenance.authoredSubstantiveBody &&
    (capsule.provenance.humanAuthorId || capsule.humanGate.authorId) &&
    (capsule.provenance.humanAuthoredAt || capsule.humanGate.authoredAt),
  );
}

export function canShowHumanReviewed(input: ContextCapsuleV2 | unknown): boolean {
  const capsule = normalizeContextCapsuleV2(input);
  if (capsule.humanGate.required) {
    return Boolean(capsule.humanGate.gateStatus === 'approved' && capsule.humanGate.reviewerId && capsule.humanGate.reviewedAt);
  }
  return hasReviewerMetadata(capsule) &&
    (capsule.humanGate.gateStatus === 'approved' || capsule.reviewState.status === 'approved' || capsule.reviewState.status === 'human_reviewed');
}

export function canPublishCapsule(input: ContextCapsuleV2 | unknown, options: PublishGateOptions = {}): PublishGateResult {
  const capsule = normalizeContextCapsuleV2(input, options);
  const issues = lintHumanGate(capsule, options);
  if (options.actor === 'agent' && capsule.humanGate.required) {
    issues.push({
      code: 'agent_publish_forbidden',
      severity: 'error',
      message: 'Agents may suggest, source, fork, or draft, but cannot publish human-gated capsules.',
    });
  }
  if (!capsule.outputContracts.length) {
    issues.push({
      code: 'missing_output_contract',
      severity: 'error',
      message: 'Publication requires at least one output contract.',
    });
  }
  const status = deriveHumanGateStatus(capsule, options);
  return {
    allowed: !issues.some((issue) => issue.severity === 'error') && status !== 'stale' && status !== 'blocked',
    status,
    issues,
  };
}

export function lintHumanGate(input: ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions = {}): HumanGateLintIssue[] {
  const capsule = normalizeContextCapsuleV2(input, options);
  const issues: HumanGateLintIssue[] = [];
  if (!capsule.humanGate.required) return issues;

  if (!capsule.humanGate.authorId && !capsule.provenance.humanAuthorId) {
    issues.push({
      code: 'missing_human_author',
      severity: 'error',
      message: 'Human-gated capsules require author identity metadata.',
    });
  }
  if (!capsule.provenance.authoredSubstantiveBody) {
    issues.push({
      code: 'missing_substantive_human_body',
      severity: 'warning',
      message: 'Human Written cannot be displayed without substantive human-authored body metadata.',
    });
  }
  if (!capsule.humanGate.reviewerId && !capsule.reviewState.reviewerId) {
    issues.push({
      code: 'missing_human_reviewer',
      severity: 'error',
      message: 'Human Reviewed requires reviewer identity.',
    });
  }
  if (!capsule.humanGate.reviewedAt && !capsule.reviewState.reviewedAt) {
    issues.push({
      code: 'missing_reviewed_at',
      severity: 'error',
      message: 'Human Reviewed requires reviewedAt metadata.',
    });
  }
  if (!capsule.reviewState.approvalId && capsule.humanGate.gateStatus === 'approved') {
    issues.push({
      code: 'missing_approval',
      severity: 'error',
      message: 'Publication-ready human gates require an approval receipt.',
    });
  }
  if (isGateStale(capsule, options)) {
    issues.push({
      code: 'stale_human_gate',
      severity: 'error',
      message: 'Expired or stale human-gated capsules require renewed review.',
    });
  }
  if (hasUnsupportedClaims(capsule)) {
    issues.push({
      code: 'unsupported_claims',
      severity: 'error',
      message: 'Unsupported claims block final-output readiness.',
    });
  }
  if (capsule.capsuleMode === 'expert_pick') {
    const score = capsule.qualityBreakdown?.score ?? capsule.capsuleHealth.score;
    if (score < 90) {
      issues.push({
        code: 'expert_pick_quality_threshold',
        severity: 'error',
        message: 'Expert Pick + Human-Gated capsules require quality score at or above 90.',
      });
    }
  }
  return issues;
}

function hasAuthorMetadata(capsule: ContextCapsuleV2): boolean {
  return Boolean((capsule.humanGate.authorId || capsule.provenance.humanAuthorId) && (capsule.humanGate.authoredAt || capsule.provenance.humanAuthoredAt));
}

function hasReviewerMetadata(capsule: ContextCapsuleV2): boolean {
  return Boolean((capsule.humanGate.reviewerId || capsule.reviewState.reviewerId) && (capsule.humanGate.reviewedAt || capsule.reviewState.reviewedAt));
}

function hasUnsupportedClaims(capsule: ContextCapsuleV2): boolean {
  return capsule.claimLedger.some((claim) => claim.support === 'unsupported' || claim.support === 'needs_source' || claim.sourceRefIds.length === 0);
}

function isGateStale(capsule: ContextCapsuleV2, options: ContextCapsuleNormalizeOptions): boolean {
  return isPast(capsule.humanGate.expiresAt ?? capsule.expiry, options.now) ||
    capsule.humanGate.gateStatus === 'stale' ||
    capsule.reviewState.status === 'stale' ||
    capsule.sourceRefs.some((source) => source.stale);
}

function isPast(value: string | null | undefined, now?: string | Date): boolean {
  if (!value) return false;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return false;
  const compare = now instanceof Date ? now.getTime() : now ? Date.parse(now) : Date.now();
  return !Number.isNaN(compare) && timestamp < compare;
}

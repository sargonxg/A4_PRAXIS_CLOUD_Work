import type { OutputCapsuleQuality, OutputCapsuleRecord, OutputCapsuleTemplate } from './types';

export function evaluateOutputCapsuleQuality(input: {
  template: OutputCapsuleTemplate;
  citationCoverage?: number;
  unsupportedClaimCount?: number;
  gapCount?: number;
  sourceabilityStatus?: OutputCapsuleQuality['sourceabilityStatus'];
  humanApproved?: boolean;
}): OutputCapsuleQuality {
  const citationCoverage = clamp01(input.citationCoverage ?? 0);
  const unsupportedClaimCount = Math.max(0, input.unsupportedClaimCount ?? 0);
  const gapCount = Math.max(0, input.gapCount ?? 0);
  const sourceabilityStatus = input.sourceabilityStatus ?? 'not-run';
  const humanApproved = input.humanApproved ?? false;
  const blockers: string[] = [];

  if (citationCoverage < input.template.qualityPolicy.minCitationCoverage) {
    blockers.push('citation-coverage-below-threshold');
  }
  if (input.template.qualityPolicy.blockApprovalOnUnsupportedClaims && unsupportedClaimCount > 0) {
    blockers.push('unsupported-claims-unresolved');
  }
  if (input.template.qualityPolicy.requireSourceabilityForApproval && sourceabilityStatus !== 'clean') {
    blockers.push('sourceability-review-required');
  }
  if (input.template.qualityPolicy.requireHumanApprovalForShipping && !humanApproved) {
    blockers.push('human-approval-required-for-shipping');
  }

  return {
    citationCoverage,
    unsupportedClaimCount,
    gapCount,
    sourceabilityStatus,
    humanApproved,
    blockers,
  };
}

export function canTransitionOutputCapsule(
  record: OutputCapsuleRecord,
  nextStatus: OutputCapsuleRecord['status'],
): boolean {
  if (nextStatus === 'draft') return true;
  const blockers = new Set(record.quality.blockers);
  if (nextStatus === 'review') return true;
  if (nextStatus === 'approved') {
    return !blockers.has('citation-coverage-below-threshold')
      && !blockers.has('unsupported-claims-unresolved')
      && !blockers.has('sourceability-review-required');
  }
  if (nextStatus === 'shipped') {
    return canTransitionOutputCapsule(record, 'approved') && !blockers.has('human-approval-required-for-shipping');
  }
  return false;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

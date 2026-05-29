import { outputTargetLabel, outputTargetReviewGate } from '@/lib/policy-work-file/output-targets';

export interface ActivePolicyFileInput {
  capsuleId?: string | null;
  capsuleVersion?: number | null;
  title?: string | null;
  jurisdiction?: string | null;
  domain?: string | null;
  outputGoal?: string | null;
  outputTarget?: string | null;
  sourceCount?: number | null;
  openQuestions?: number | null;
  unsupportedClaims?: number | null;
  nextAction?: string | null;
}

export interface ActivePolicyFileModel {
  hasActiveFile: boolean;
  title: string;
  subtitle: string;
  capsuleLabel: string;
  outputGoal: string;
  sourceCount: number;
  openQuestions: number;
  unsupportedClaims: number;
  nextAction: string;
  reviewGate: string;
  sourceabilityRequired: boolean;
}

export function buildActivePolicyFileModel(input: ActivePolicyFileInput): ActivePolicyFileModel {
  const hasActiveFile = Boolean(input.capsuleId || input.title);
  const title = clean(input.title) || (hasActiveFile ? clean(input.capsuleId) || 'Policy file' : 'No active file yet');
  const capsuleLabel = input.capsuleId
    ? `${input.capsuleId}${typeof input.capsuleVersion === 'number' ? ` v${input.capsuleVersion}` : ''}`
    : 'No capsule linked';
  const jurisdiction = clean(input.jurisdiction) || 'Jurisdiction not set';
  const domain = clean(input.domain) || 'Policy domain open';
  const reviewGate = outputTargetReviewGate(input.outputTarget);
  return {
    hasActiveFile,
    title,
    subtitle: `${jurisdiction} / ${domain}`,
    capsuleLabel,
    outputGoal: input.outputTarget ? outputTargetLabel(input.outputTarget) : clean(input.outputGoal) || 'Output goal not set',
    sourceCount: safeCount(input.sourceCount),
    openQuestions: safeCount(input.openQuestions),
    unsupportedClaims: safeCount(input.unsupportedClaims),
    nextAction: clean(input.nextAction) || (hasActiveFile ? 'Open as Draft when the answer is ready.' : 'Create from this question'),
    reviewGate: reviewGate.statusLabel,
    sourceabilityRequired: reviewGate.requiresSourceabilityBeforeExport,
  };
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

function safeCount(value: number | null | undefined): number {
  return Number.isFinite(value) && value ? Math.max(0, Math.floor(value)) : 0;
}

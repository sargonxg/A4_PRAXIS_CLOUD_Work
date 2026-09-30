import { getAskPraxisModelRuntimePolicy } from '@/lib/ai/model-runtime-policy';
import { getModelMatrixEntry } from '@/lib/ai/model-matrix';
import { normalizeMemoOutputReview, type MemoOutputReviewReceipt } from '@/lib/memo/output-review';

export type ProofContextHealth = 'ready' | 'review' | 'thin' | 'missing' | 'degraded';

export interface ProofConfidenceDistribution {
  high: number;
  medium: number;
  low: number;
}

export interface ProofSourceabilitySummary {
  totalClaims: number;
  supportedClaims: number;
  weakClaims: number;
  unsupportedClaims: number;
  contradictedClaims: number;
  modelPriorClaims: number;
  assumptionClaims: number;
}

export interface ProofGroundingVerificationFlag {
  text: string;
  reason: string;
  claimCardIds: string[];
  sourceReceiptIds: string[];
  graphPathIds: string[];
}

export interface ProofGroundingVerificationSummary {
  coverageScore: number;
  groundedClaimCount: number;
  totalClaimCount: number;
  ungroundedSpanCount: number;
  contradictedSpanCount: number;
  flaggedSpans: ProofGroundingVerificationFlag[];
}

export interface UiProofSummary {
  contextHealth: ProofContextHealth;
  sourceCount: number;
  documentCount: number;
  unsupportedClaimCount: number;
  confidenceDistribution: ProofConfidenceDistribution;
  outputHref: string | null;
  memoId: string | null;
  outputCapsuleId: string | null;
  modelPolicyLabel: string;
  outputTarget: string | null;
  activeCapsule: string | null;
  appliedCapsules: string[];
  sourceability: ProofSourceabilitySummary;
  sourceabilityScope: 'input_evidence' | 'generated_answer';
  groundingVerification: ProofGroundingVerificationSummary | null;
  outputReview: MemoOutputReviewReceipt | null;
  degradedStates: string[];
  improvementActions: string[];
  exportBlocked: boolean;
}

export function modelPolicyLabelFor(input: {
  selectedModelId?: unknown;
  modelTier?: unknown;
  modelPolicy?: unknown;
  lifecycleTier?: unknown;
  mode?: unknown;
  fallbackPosture?: unknown;
} = {}): string {
  const tier = cleanLower(input.modelTier);
  const policyId = cleanLower(input.modelPolicy);
  const mode = cleanLower(input.mode);
  const fallbackPosture = cleanLower(input.fallbackPosture);
  const selectedModelId = cleanString(input.selectedModelId);
  const policy = getAskPraxisModelRuntimePolicy();
  // A lifecycle category or a ready fallback chain is not an executed fallback.
  const fallbackSuffix = fallbackPosture === 'fallback' ? ' (fallback)' : '';

  if (
    tier === 'sourceability'
    || mode?.includes('sourceability')
  ) {
    return `sourceability review${fallbackSuffix}`;
  }

  if (tier === 'fast') return `economical recall and extraction${fallbackSuffix}`;

  if (tier === 'standard') {
    return `standard policy reasoning${fallbackSuffix}`;
  }

  if (
    tier === 'deep'
    || policyId?.includes('deep')
    || selectedModelId === policy.frontierPrimary.deepModelId
    || policy.stableFallback.deep.includes(selectedModelId ?? '')
  ) {
    return `deep policy reasoning${fallbackSuffix}`;
  }

  if (selectedModelId === getModelMatrixEntry('cheap_classify').model) return `economical recall and extraction${fallbackSuffix}`;
  return `standard policy reasoning${fallbackSuffix}`;
}

export function buildProofSummaryFromAskEnvelope(
  envelope: unknown,
  fallback: Record<string, unknown> = {},
): UiProofSummary {
  const value = asRecord(envelope);
  const orchestration = asRecord(value?.orchestrationReceipt);
  const capsule = asRecord(orchestration?.capsule);
  const readReceipt = asRecord(orchestration?.capsuleReadReceipt);
  const grounding = asRecord(orchestration?.grounding);
  const routingDecision = asRecord(orchestration?.routingDecision);
  const supervisor = asRecord(orchestration?.supervisor);
  const queuedRun = asRecord(supervisor?.queuedRun);
  const sourceability = normalizeSourceabilitySummary(value?.claimLedgerSummary);
  const sourceAudit = asRecord(value?.sourceAudit);
  const generationReceipt = asRecord(value?.generationReceipt);
  const groundingVerification = normalizeGroundingVerificationReport(value?.groundingVerification);

  return normalizeProofSummary({
    contextHealth: stringField(capsule?.contextHealth) ?? stringField(fallback.contextHealth),
    activeCapsule: stringField(capsule?.capsuleId) ?? stringField(readReceipt?.capsuleId) ?? stringField(fallback.activeCapsule),
    sourceCount: numberField(readReceipt?.sourceCount)
      ?? numberField(sourceAudit?.sourceCount)
      ?? numberField(capsule?.sourcePreviewCount)
      ?? numberField(fallback.sourceCount),
    documentCount: numberField(readReceipt?.documentCount) ?? numberField(fallback.documentCount),
    unsupportedClaimCount: sourceability.unsupportedClaims
      || numberField(sourceAudit?.unsupportedClaimCount)
      || numberField(fallback.unsupportedClaimCount)
      || 0,
    sourceability,
    groundingVerification,
    outputHref: safeAppHref(queuedRun?.outputHref) ?? safeAppHref(fallback.outputHref),
    outputTarget: stringField(readReceipt?.outputTarget)
      ?? stringField(supervisor?.outputDestination)
      ?? stringField(fallback.outputTarget),
    memoId: stringField(fallback.memoId),
    outputCapsuleId: stringField(fallback.outputCapsuleId),
    confidenceDistribution: deriveConfidenceDistribution(sourceability),
    modelPolicyLabel: modelPolicyLabelFor({
      selectedModelId: generationReceipt?.selectedModel ?? fallback.selectedModelId,
      modelTier: routingDecision?.modelTier ?? fallback.modelTier,
      modelPolicy: fallback.modelPolicy,
      lifecycleTier: fallback.lifecycleTier,
      fallbackPosture: generationReceipt?.fallbackModel ? 'fallback' : fallback.fallbackPosture,
    }),
    groundingPosture: stringField(grounding?.groundingPosture) ?? stringField(readReceipt?.groundingPosture),
    degradedReason: stringField(grounding?.degradedReason) ?? stringField(fallback.degradedReason),
    warnings: stringArray(capsule?.warnings),
    gaps: stringArray(readReceipt?.contextGaps),
    status: stringField(queuedRun?.status),
  });
}

export function buildProofSummaryFromAgentRun(
  run: unknown,
  boardroomOutput?: unknown,
): UiProofSummary {
  const value = asRecord(run);
  const metadata = asRecord(value?.metadata);
  const output = asRecord(boardroomOutput) ?? asRecord(value?.boardroomOutput);
  const evidenceStats = asRecord(output?.evidenceStats);
  const contextReceipt = asRecord(value?.contextReceipt);
  const readReceipt = asRecord(value?.capsuleReadReceipt);
  const outputHref = safeAppHref(value?.outputHref);
  const artifactIds = outputHref ? artifactIdsFromHref(outputHref) : {};
  const sourceability = normalizeSourceabilitySummary(value?.sourceabilityLedgerSummary ?? metadata?.sourceabilityLedgerSummary);
  const groundingVerification = normalizeGroundingVerificationReport(value?.groundingVerification ?? metadata?.groundingVerification);
  const outputReview = normalizeMemoOutputReview(value?.outputReview ?? metadata?.outputReview);
  const requiresMemoReview = Boolean(value?.memoId ?? metadata?.memoId ?? artifactIds.memoId)
    || Object.prototype.hasOwnProperty.call(value ?? {}, 'outputReview')
    || Object.prototype.hasOwnProperty.call(metadata ?? {}, 'outputReview');

  return normalizeProofSummary({
    contextHealth: stringField(contextReceipt?.contextHealth) ?? stringField(value?.contextHealth),
    activeCapsule: stringField(contextReceipt?.activeCapsuleOrChain) ?? stringField(value?.capsuleId),
    appliedCapsules: appliedCapsuleLabels(value?.appliedCapsules),
    sourceCount: numberField(evidenceStats?.sourceCount)
      ?? numberField(readReceipt?.sourceCount)
      ?? numberField(contextReceipt?.sourceCount)
      ?? numberField(value?.sourceCount)
      ?? stringArray(value?.sourceReceiptIds).length,
    documentCount: numberField(evidenceStats?.documentCount)
      ?? numberField(readReceipt?.documentCount)
      ?? numberField(value?.documentCount),
    unsupportedClaimCount: numberField(evidenceStats?.unsupportedClaimCount)
      ?? sourceability.unsupportedClaims
      ?? numberField(value?.unsupportedClaimCount)
      ?? 0,
    sourceability,
    sourceabilityScope: 'input_evidence',
    groundingVerification,
    outputReview,
    requiresMemoReview,
    outputHref,
    outputTarget: stringField(contextReceipt?.outputDestination) ?? stringField(value?.outputDestination),
    memoId: stringField(value?.memoId) ?? artifactIds.memoId,
    outputCapsuleId: stringField(value?.outputCapsuleId) ?? artifactIds.outputCapsuleId,
    confidenceDistribution: normalizeConfidenceDistribution(output?.confidenceDistribution)
      ?? deriveConfidenceDistribution(sourceability),
    modelPolicyLabel: modelPolicyLabelFor({
      selectedModelId: value?.selectedModelId,
      modelTier: value?.modelTier,
      modelPolicy: value?.modelPolicy,
      lifecycleTier: value?.modelLifecycleTier,
      fallbackPosture: value?.fallbackPosture,
    }),
    groundingPosture: stringField(contextReceipt?.groundingPosture) ?? stringField(value?.groundingPosture),
    degradedReason: stringField(contextReceipt?.degradedReason) ?? stringField(value?.degradedReason),
    warnings: stringArray(value?.warnings),
    gaps: [
      ...stringArray(readReceipt?.contextGaps),
      ...stringArray(output?.openQuestions),
    ],
    status: stringField(value?.status),
  });
}

function normalizeProofSummary(input: {
  contextHealth?: string | null;
  activeCapsule?: string | null;
  appliedCapsules?: string[];
  sourceCount?: number | null;
  documentCount?: number | null;
  unsupportedClaimCount?: number | null;
  sourceability?: ProofSourceabilitySummary;
  sourceabilityScope?: UiProofSummary['sourceabilityScope'];
  groundingVerification?: ProofGroundingVerificationSummary | null;
  outputReview?: MemoOutputReviewReceipt | null;
  requiresMemoReview?: boolean;
  outputHref?: string | null;
  outputTarget?: string | null;
  memoId?: string | null;
  outputCapsuleId?: string | null;
  confidenceDistribution?: ProofConfidenceDistribution | null;
  modelPolicyLabel: string;
  groundingPosture?: string | null;
  degradedReason?: string | null;
  warnings?: string[];
  gaps?: string[];
  status?: string | null;
}): UiProofSummary {
  const sourceCount = clampCount(input.sourceCount);
  const documentCount = clampCount(input.documentCount);
  const sourceability = input.sourceability ?? emptySourceabilitySummary();
  const groundingVerification = input.groundingVerification ?? null;
  const outputReview = input.outputReview ?? null;
  const generatedReviewBlocked = Boolean(input.requiresMemoReview && (!outputReview || outputReview.reviewRequired || !outputReview.exportReady));
  const groundingFlags = (groundingVerification?.ungroundedSpanCount ?? 0) + (groundingVerification?.contradictedSpanCount ?? 0);
  const unsupportedClaimCount = clampCount(input.unsupportedClaimCount ?? sourceability.unsupportedClaims);
  const contextHealth = normalizeContextHealth(input.contextHealth, sourceCount, documentCount, unsupportedClaimCount);
  const degradedStates = buildDegradedStates({
    contextHealth,
    sourceCount,
    documentCount,
    unsupportedClaimCount,
    groundingVerification,
    groundingPosture: input.groundingPosture,
    degradedReason: input.degradedReason,
    outputHref: input.outputHref,
    outputTarget: input.outputTarget,
    status: input.status,
  });
  const gaps = uniqueStrings([...(input.gaps ?? []), ...(input.warnings ?? [])]);
  if (generatedReviewBlocked) degradedStates.push('generated memo review required');

  return {
    contextHealth,
    sourceCount,
    documentCount,
    unsupportedClaimCount,
    confidenceDistribution: input.confidenceDistribution ?? deriveConfidenceDistribution(sourceability),
    outputHref: input.outputHref ?? null,
    memoId: input.memoId ?? null,
    outputCapsuleId: input.outputCapsuleId ?? null,
    modelPolicyLabel: input.modelPolicyLabel,
    outputTarget: input.outputTarget ?? null,
    activeCapsule: input.activeCapsule ?? null,
    appliedCapsules: uniqueStrings(input.appliedCapsules ?? []),
    sourceability,
    sourceabilityScope: input.sourceabilityScope ?? 'generated_answer',
    groundingVerification,
    outputReview,
    degradedStates,
    improvementActions: uniqueStrings([
      ...(generatedReviewBlocked ? ['Review the whole generated memo and apply feedback before external export.'] : []),
      ...buildImprovementActions({
        contextHealth,
        sourceCount,
        documentCount,
        unsupportedClaimCount,
        gaps,
        outputHref: input.outputHref,
        outputTarget: input.outputTarget,
      }),
    ]),
    exportBlocked: unsupportedClaimCount > 0 || groundingFlags > 0 || generatedReviewBlocked,
  };
}

function buildDegradedStates(input: {
  contextHealth: ProofContextHealth;
  sourceCount: number;
  documentCount: number;
  unsupportedClaimCount: number;
  groundingVerification?: ProofGroundingVerificationSummary | null;
  groundingPosture?: string | null;
  degradedReason?: string | null;
  outputHref?: string | null;
  outputTarget?: string | null;
  status?: string | null;
}): string[] {
  const states: string[] = [];
  if (input.contextHealth === 'thin') states.push('thin capsule');
  if (input.contextHealth === 'missing') states.push('missing capsule');
  if (input.sourceCount + input.documentCount === 0) states.push('no source receipts');
  if (input.groundingPosture && /unavailable|not configured|disabled|no grounding/i.test(input.groundingPosture)) {
    states.push('no live grounding');
  }
  if (input.degradedReason) states.push('degraded optional capability');
  if (input.status === 'queued' || input.status === 'dispatch_enqueued' || input.status === 'running') states.push('worker queued');
  if (input.outputTarget && !input.outputHref) states.push('artifact persistence pending');
  if (input.unsupportedClaimCount > 0) states.push(`${input.unsupportedClaimCount} unsupported claim${input.unsupportedClaimCount === 1 ? '' : 's'}`);
  const groundingFlagCount = (input.groundingVerification?.ungroundedSpanCount ?? 0) + (input.groundingVerification?.contradictedSpanCount ?? 0);
  if (groundingFlagCount > 0) states.push(`${groundingFlagCount} grounding verifier flag${groundingFlagCount === 1 ? '' : 's'}`);
  return uniqueStrings(states);
}

function buildImprovementActions(input: {
  contextHealth: ProofContextHealth;
  sourceCount: number;
  documentCount: number;
  unsupportedClaimCount: number;
  gaps: string[];
  outputHref?: string | null;
  outputTarget?: string | null;
}): string[] {
  const actions: string[] = [];
  if (input.sourceCount + input.documentCount === 0) {
    actions.push('Attach source receipts or uploaded documents before relying on this answer.');
  }
  if (input.contextHealth === 'thin' || input.contextHealth === 'missing') {
    actions.push('Select a concrete ContextCapsule before queueing deeper work.');
  }
  if (input.unsupportedClaimCount > 0) {
    actions.push('Attach stronger source receipts for unsupported claims.');
  }
  if (input.gaps.length > 0) {
    actions.push('Resolve boardroom open questions before sharing externally.');
  }
  if (input.outputTarget && !input.outputHref) {
    actions.push('Retry artifact persistence or save the answer to Memo Studio.');
  }
  if (!actions.length) {
    actions.push('Preserve this receipt with the saved artifact.');
  }
  return uniqueStrings(actions).slice(0, 5);
}

function normalizeContextHealth(value: string | null | undefined, sourceCount: number, documentCount: number, unsupportedClaimCount: number): ProofContextHealth {
  const health = value?.toLowerCase().replace(/[_\s-]+/g, '_') ?? '';
  if (['ready', 'ok', 'healthy'].includes(health)) return 'ready';
  if (['partial', 'review', 'needs_review', 'warning', 'warn'].includes(health)) return 'review';
  if (['missing', 'not_found', 'no_capsule'].includes(health)) return 'missing';
  if (['degraded', 'down', 'unconfigured'].includes(health)) return 'degraded';
  if (['thin', 'weak'].includes(health)) return 'thin';
  if (sourceCount + documentCount === 0) return 'thin';
  if (unsupportedClaimCount > 0) return 'review';
  return 'ready';
}

function normalizeSourceabilitySummary(value: unknown): ProofSourceabilitySummary {
  const record = asRecord(value);
  return {
    totalClaims: clampCount(record?.totalClaims),
    supportedClaims: clampCount(record?.supportedClaims),
    weakClaims: clampCount(record?.weakClaims),
    unsupportedClaims: clampCount(record?.unsupportedClaims),
    contradictedClaims: clampCount(record?.contradictedClaims),
    modelPriorClaims: clampCount(record?.modelPriorClaims),
    assumptionClaims: clampCount(record?.assumptionClaims),
  };
}

function emptySourceabilitySummary(): ProofSourceabilitySummary {
  return normalizeSourceabilitySummary(null);
}

function normalizeGroundingVerificationReport(value: unknown): ProofGroundingVerificationSummary | null {
  const record = asRecord(value);
  if (!record) return null;
  const groundedClaims = arrayOfRecords(record.groundedClaims);
  const ungroundedSpans = arrayOfRecords(record.ungroundedSpans);
  const contradictedSpans = arrayOfRecords(record.contradictedSpans);
  const flaggedSpans = [...ungroundedSpans, ...contradictedSpans].map((span): ProofGroundingVerificationFlag => ({
    text: stringField(span.text) ?? '',
    reason: stringField(span.reason) ?? 'unknown',
    claimCardIds: stringArray(span.claimCardIds),
    sourceReceiptIds: stringArray(span.sourceReceiptIds),
    graphPathIds: stringArray(span.graphPathIds),
  })).filter((span) => span.text);
  const totalClaimCount = groundedClaims.length + ungroundedSpans.length + contradictedSpans.length;
  const coverageScore = typeof record.coverageScore === 'number' && Number.isFinite(record.coverageScore)
    ? Math.max(0, Math.min(1, record.coverageScore))
    : totalClaimCount > 0
      ? groundedClaims.length / totalClaimCount
      : 1;
  return {
    coverageScore: Math.round(coverageScore * 1000) / 1000,
    groundedClaimCount: groundedClaims.length,
    totalClaimCount,
    ungroundedSpanCount: ungroundedSpans.length,
    contradictedSpanCount: contradictedSpans.length,
    flaggedSpans: flaggedSpans.slice(0, 12),
  };
}

function deriveConfidenceDistribution(summary: ProofSourceabilitySummary): ProofConfidenceDistribution {
  return {
    high: summary.supportedClaims,
    medium: summary.weakClaims + summary.assumptionClaims,
    low: summary.unsupportedClaims + summary.contradictedClaims + summary.modelPriorClaims,
  };
}

function normalizeConfidenceDistribution(value: unknown): ProofConfidenceDistribution | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    high: clampCount(record.high),
    medium: clampCount(record.medium),
    low: clampCount(record.low),
  };
}

function artifactIdsFromHref(href: string): { memoId?: string; outputCapsuleId?: string } {
  try {
    const url = new URL(href, 'https://praxis.local');
    return {
      memoId: cleanString(url.searchParams.get('memoId')) ?? undefined,
      outputCapsuleId: cleanString(url.searchParams.get('outputCapsuleId')) ?? undefined,
    };
  } catch {
    return {};
  }
}

function appliedCapsuleLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const record = asRecord(item);
    const label = stringField(record?.label) ?? stringField(record?.id);
    return label ? [label] : [];
  });
}

function safeAppHref(value: unknown): string | null {
  const href = cleanString(value);
  return href && (href.startsWith('/app') || href.startsWith('/agents')) ? href : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function arrayOfRecords(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const record = asRecord(item);
    return record ? [record] : [];
  });
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function clampCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function numberField(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

function stringField(value: unknown): string | null {
  return cleanString(value);
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function cleanLower(value: unknown): string | null {
  return cleanString(value)?.toLowerCase() ?? null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

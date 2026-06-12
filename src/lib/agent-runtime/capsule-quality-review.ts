import { createHash } from 'crypto';
import { z } from 'zod';
import type { AgentRun } from '@/lib/agent-runtime/types';
import { getModelIdForTask } from '@/lib/ai/model-matrix';
import {
  deriveCapsuleQuality,
  deriveCapsuleReadinessSummary,
  type CapsuleQualityBreakdownItem,
  type CapsuleQualityResult,
} from '@/lib/context/capsule-quality';
import type { CreateCapsuleReviewCardInput } from '@/lib/context/capsule-service';
import {
  normalizeContextCapsuleV2,
  type ContextCapsuleClaim,
  type ContextCapsuleNormalizeOptions,
  type ContextCapsuleSourceRef,
  type ContextCapsuleV2,
} from '@/lib/context/capsule-v2';
import { deriveHumanGateStatus, lintHumanGate } from '@/lib/context/human-gate';

export const CapsuleQualityReviewProposalKindSchema = z.enum([
  'sourcing',
  'temporal',
  'causal',
  'ontology',
  'guardrail',
  'output',
]);

export const CapsuleQualityReviewProposalSchema = z.object({
  kind: CapsuleQualityReviewProposalKindSchema,
  title: z.string().trim().min(3).max(120),
  rationale: z.string().trim().min(8).max(800),
  suggestedChange: z.string().trim().min(8).max(1000),
  confidence: z.enum(['low', 'medium', 'high']),
}).strict();

export const CapsuleQualityReviewProposalListSchema = z.array(CapsuleQualityReviewProposalSchema).max(8);

export type CapsuleQualityReviewProposalKind = z.infer<typeof CapsuleQualityReviewProposalKindSchema>;
export type CapsuleQualityReviewProposal = z.infer<typeof CapsuleQualityReviewProposalSchema>;

export type CapsuleQualityReviewDeficit = {
  kind: CapsuleQualityReviewProposalKind;
  title: string;
  detail: string;
  path: string;
  severity: 'low' | 'medium' | 'high';
};

export type CapsuleQualityReviewAnalysis = {
  capsule: ContextCapsuleV2;
  quality: CapsuleQualityResult;
  readiness: ReturnType<typeof deriveCapsuleReadinessSummary>;
  deficits: CapsuleQualityReviewDeficit[];
  deterministicProposals: CapsuleQualityReviewProposal[];
  digest: string;
};

const ACTIVE_REVIEW_SOURCE = 'capsule-quality-review-agent';

export function buildCapsuleQualityReviewAnalysis(
  input: unknown,
  options: ContextCapsuleNormalizeOptions = {},
): CapsuleQualityReviewAnalysis {
  const capsule = normalizeContextCapsuleV2(input, options);
  const quality = deriveCapsuleQuality(input, options);
  const readiness = deriveCapsuleReadinessSummary(input, options);
  const deficits = collectCapsuleQualityDeficits(input, capsule, quality, options);
  const deterministicProposals = buildDeterministicCapsuleQualityReviewProposals(deficits).slice(0, 8);
  const digest = buildCapsuleQualityReviewDigest(capsule, quality, readiness, deficits);
  return { capsule, quality, readiness, deficits, deterministicProposals, digest };
}

export function parseCapsuleQualityReviewProposalsFromText(text: string): CapsuleQualityReviewProposal[] {
  const cleaned = stripJsonFence(text);
  const candidate = cleaned.startsWith('[')
    ? cleaned
    : cleaned.match(/\[[\s\S]*\]/)?.[0] ?? cleaned;
  const parsed = JSON.parse(candidate) as unknown;
  return CapsuleQualityReviewProposalListSchema.parse(parsed);
}

export function capsuleQualityReviewOutputHref(run: Pick<AgentRun, 'capsuleId'>): string {
  return `/app/capsules?capsuleId=${encodeURIComponent(run.capsuleId)}#capsule-review-queue`;
}

export function capsuleQualityReviewCardInput(
  run: Pick<AgentRun, 'id' | 'createdAt' | 'metadata'>,
  proposal: CapsuleQualityReviewProposal,
  index: number,
): CreateCapsuleReviewCardInput {
  const marker = {
    source: ACTIVE_REVIEW_SOURCE,
    generatedByRunId: run.id,
    generatedBy: capsuleQualityReviewGeneratedBy(run),
    proposalKind: proposal.kind,
    title: proposal.title,
    rationale: proposal.rationale,
    suggestedChange: proposal.suggestedChange,
    confidence: proposal.confidence,
    reviewRequired: true,
  };
  return {
    reviewCardId: `review-card-capsule-quality-${stableShortId(`${run.id}:${index}:${proposal.kind}:${proposal.title}`)}`,
    title: `Quality review: ${proposal.title}`,
    sourceType: 'quality-audit',
    target: reviewTargetForProposalKind(proposal.kind),
    state: 'proposed',
    evidence: [{
      id: `capsule-quality-review-${stableShortId(`${run.id}:${index}`)}`,
      label: proposal.title,
      advisory: true,
      sourceType: ACTIVE_REVIEW_SOURCE,
    }],
    proposedEnvelopePatch: patchForProposal(proposal, marker),
  };
}

function capsuleQualityReviewGeneratedBy(run: Pick<AgentRun, 'createdAt' | 'metadata'>) {
  const selectedModelId = typeof run.metadata.selectedModelId === 'string' && run.metadata.selectedModelId.trim()
    ? run.metadata.selectedModelId.trim()
    : null;
  return {
    actorType: 'model' as const,
    actorId: selectedModelId ?? getModelIdForTask('complex_reasoning'),
    at: run.createdAt,
    activity: 'quality_review' as const,
  };
}

export function summarizeCapsuleQualityReviewRun(
  readinessScore: number,
  proposals: CapsuleQualityReviewProposal[],
): string {
  const score = Number.isFinite(readinessScore) ? `${Math.round(readinessScore)}` : 'not available';
  const counts = countCapsuleQualityReviewProposalKinds(proposals);
  const countText = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${kind}: ${count}`)
    .join(', ') || 'none';
  return `Readiness before: ${score}. Created ${proposals.length} review-gated capsule improvement proposal${proposals.length === 1 ? '' : 's'} (${countText}).`;
}

export function countCapsuleQualityReviewProposalKinds(
  proposals: CapsuleQualityReviewProposal[],
): Record<CapsuleQualityReviewProposalKind, number> {
  const counts: Record<CapsuleQualityReviewProposalKind, number> = {
    sourcing: 0,
    temporal: 0,
    causal: 0,
    ontology: 0,
    guardrail: 0,
    output: 0,
  };
  for (const proposal of proposals) counts[proposal.kind] += 1;
  return counts;
}

function collectCapsuleQualityDeficits(
  raw: unknown,
  capsule: ContextCapsuleV2,
  quality: CapsuleQualityResult,
  options: ContextCapsuleNormalizeOptions,
): CapsuleQualityReviewDeficit[] {
  const deficits: CapsuleQualityReviewDeficit[] = [];
  const add = (deficit: CapsuleQualityReviewDeficit) => deficits.push(deficit);

  for (const item of quality.breakdown) {
    if (!isLowQualityBreakdown(item)) continue;
    add({
      kind: kindForBreakdown(item.id),
      title: item.label,
      detail: item.diagnostics.map((diagnostic) => diagnostic.message).join(' ') || `${item.label} is below the quality threshold.`,
      path: `quality.breakdown.${item.id}`,
      severity: item.score <= item.maxScore * 0.45 ? 'high' : 'medium',
    });
  }

  collectStaleTemporalAnchors(capsule, options).forEach(add);
  collectHumanGateDeficits(capsule, options).forEach(add);
  collectSourcingModeGaps(capsule).forEach(add);

  const body = isRecord(raw) ? raw : {};
  if (!firstRecord(body.grounding, body.temporality) && !capsule.decisionHorizon && !capsule.coreRefs.timeCoreId) {
    add({
      kind: 'temporal',
      title: 'Missing temporal frame',
      detail: 'Capsule has no explicit temporality object, decision horizon, or Time Core binding.',
      path: 'temporality',
      severity: 'medium',
    });
  }

  return dedupeDeficits(deficits).slice(0, 16);
}

function collectStaleTemporalAnchors(
  capsule: ContextCapsuleV2,
  options: ContextCapsuleNormalizeOptions,
): CapsuleQualityReviewDeficit[] {
  const deficits: CapsuleQualityReviewDeficit[] = [];
  capsule.sourceRefs.forEach((source, index) => {
    if (source.stale || isStaleSource(source, capsule.sourcePosture?.freshnessWindowDays ?? null, options.now)) {
      deficits.push({
        kind: 'temporal',
        title: 'Refresh stale source anchor',
        detail: `Source "${source.label || source.sourceId}" is stale or outside the freshness window.`,
        path: `sourceRefs[${index}]`,
        severity: 'medium',
      });
    }
  });
  if (isPast(capsule.expiry, options.now)) {
    deficits.push({
      kind: 'temporal',
      title: 'Refresh capsule expiry',
      detail: 'Capsule expiry is in the past and should be refreshed before reuse.',
      path: 'expiry',
      severity: 'high',
    });
  }
  if (isPast(capsule.humanGate.expiresAt, options.now)) {
    deficits.push({
      kind: 'guardrail',
      title: 'Renew expired human gate',
      detail: 'Human-gate expiry is in the past and requires reviewer renewal.',
      path: 'humanGate.expiresAt',
      severity: 'high',
    });
  }
  for (const claim of capsule.claimLedger) {
    if (!claim.asOf && !claim.validFrom && !claim.validUntil) continue;
    if (isPast(claim.validUntil, options.now)) {
      deficits.push({
        kind: 'temporal',
        title: 'Refresh stale claim validity',
        detail: `Claim "${compact(claim.text, 120)}" has a validity window that has ended.`,
        path: `claimLedger.${claim.claimId}.validUntil`,
        severity: 'medium',
      });
    }
  }
  return deficits;
}

function collectHumanGateDeficits(
  capsule: ContextCapsuleV2,
  options: ContextCapsuleNormalizeOptions,
): CapsuleQualityReviewDeficit[] {
  const status = deriveHumanGateStatus(capsule, options);
  return lintHumanGate(capsule, options).map((issue) => ({
    kind: issue.code === 'unsupported_claims' ? 'sourcing' : 'guardrail',
    title: issue.code === 'unsupported_claims' ? 'Resolve unsupported claims' : 'Complete human review gate',
    detail: `${issue.message} Current gate status: ${status}.`,
    path: `humanGate.${issue.code}`,
    severity: issue.severity === 'error' ? 'high' : 'medium',
  }));
}

function collectSourcingModeGaps(capsule: ContextCapsuleV2): CapsuleQualityReviewDeficit[] {
  const deficits: CapsuleQualityReviewDeficit[] = [];
  if (!capsule.sourcePosture) {
    deficits.push({
      kind: 'sourcing',
      title: 'Set source posture',
      detail: 'Capsule has no source posture, so agents cannot distinguish authoritative, advisory, and missing evidence.',
      path: 'sourcePosture',
      severity: 'high',
    });
  } else if (capsule.sourcePosture.posture !== 'source_backed') {
    deficits.push({
      kind: 'sourcing',
      title: 'Repair source support mode',
      detail: `Capsule source posture is "${capsule.sourcePosture.posture}" rather than source_backed.`,
      path: 'sourcePosture.posture',
      severity: capsule.sourcePosture.posture === 'unsupported' ? 'high' : 'medium',
    });
  }
  if (!capsule.sourceRefs.length) {
    deficits.push({
      kind: 'sourcing',
      title: 'Attach source receipts',
      detail: 'Capsule has no source refs attached.',
      path: 'sourceRefs',
      severity: 'high',
    });
  }
  const unsupportedClaims = capsule.claimLedger.filter(isUnsupportedClaim);
  if (unsupportedClaims.length) {
    deficits.push({
      kind: 'sourcing',
      title: 'Source unsupported claims',
      detail: `${unsupportedClaims.length} claim${unsupportedClaims.length === 1 ? '' : 's'} need source receipts before final use.`,
      path: 'claimLedger',
      severity: 'high',
    });
  }
  return deficits;
}

function buildDeterministicCapsuleQualityReviewProposals(
  deficits: CapsuleQualityReviewDeficit[],
): CapsuleQualityReviewProposal[] {
  const proposals: CapsuleQualityReviewProposal[] = [];
  for (const deficit of deficits) {
    proposals.push({
      kind: deficit.kind,
      title: titleForDeficit(deficit),
      rationale: compact(deficit.detail, 760),
      suggestedChange: suggestedChangeForDeficit(deficit),
      confidence: deficit.severity === 'high' ? 'high' : deficit.severity === 'medium' ? 'medium' : 'low',
    });
  }
  return dedupeProposals(proposals);
}

function buildCapsuleQualityReviewDigest(
  capsule: ContextCapsuleV2,
  quality: CapsuleQualityResult,
  readiness: ReturnType<typeof deriveCapsuleReadinessSummary>,
  deficits: CapsuleQualityReviewDeficit[],
): string {
  const topClaims = capsule.claimLedger.slice(0, 8).map((claim) => {
    const sourceRefs = claim.sourceRefIds.length ? claim.sourceRefIds.join(', ') : 'no source refs';
    return `- ${claim.claimId}: ${compact(claim.text, 220)} [${claim.support}; ${sourceRefs}]`;
  });
  const sources = capsule.sourceRefs.slice(0, 10).map((source) => (
    `- ${source.sourceId}: ${compact(source.label, 140)}${source.date ? ` (${source.date})` : ''}${source.stale ? ' [stale]' : ''}`
  ));
  const causalClaims = capsule.claimLedger.filter((claim) => hasCausalLinks(claim)).slice(0, 5);
  return [
    `Capsule: ${capsule.label} (${capsule.capsuleId}) v${capsule.version}`,
    `Persona/audience: ${capsule.audience.join(', ') || 'not specified'}`,
    `Purpose: ${compact(capsule.purpose || capsule.summary, 500) || 'not specified'}`,
    `Sourcing: ${capsule.sourcePosture ? JSON.stringify(capsule.sourcePosture) : 'missing'}; source count ${capsule.sourceRefs.length}`,
    `Temporality: decisionHorizon=${capsule.decisionHorizon ?? 'missing'}; expiry=${capsule.expiry ?? 'none'}; staleSources=${capsule.sourceRefs.filter((source) => source.stale).length}`,
    `Causality: ${causalClaims.length} claims carry causal links.`,
    `Ontology: domains=${capsule.domainTags.join(', ') || 'none'}; graphCore=${capsule.coreRefs.graphCoreId ?? 'none'}`,
    `Output contracts: ${capsule.outputContracts.map((contract) => contract.label).join(', ') || 'none'}`,
    `Quality score: ${quality.score}; readiness score: ${Number.isFinite(readiness.score) ? readiness.score : 'not available'}; tier=${readiness.tier}; topBlocker=${readiness.topBlocker ?? 'none'}`,
    'Top claims:',
    topClaims.length ? topClaims.join('\n') : '- none',
    'Source list:',
    sources.length ? sources.join('\n') : '- none',
    'Deterministic deficits:',
    deficits.slice(0, 12).map((deficit) => `- ${deficit.kind}: ${deficit.title} (${deficit.path}) - ${compact(deficit.detail, 220)}`).join('\n') || '- none',
  ].join('\n');
}

function patchForProposal(
  proposal: CapsuleQualityReviewProposal,
  marker: Record<string, unknown>,
): NonNullable<CreateCapsuleReviewCardInput['proposedEnvelopePatch']> {
  const base = { latestGateState: 'proposed' as const };
  switch (proposal.kind) {
    case 'sourcing':
      return {
        ...base,
        sourcePosture: {
          posture: 'needs_sources',
          sourceGaps: [proposal.suggestedChange],
          qualityReview: marker,
        },
      };
    case 'temporal':
      return {
        ...base,
        temporality: {
          staleAnchorReviewRequired: true,
          qualityReview: marker,
        },
      };
    case 'causal':
      return {
        ...base,
        causality: {
          causalLinkReviewRequired: true,
          qualityReview: marker,
        },
      };
    case 'ontology':
      return {
        ...base,
        ontologyBinding: {
          bindingReviewRequired: true,
          qualityReview: marker,
        },
      };
    case 'guardrail':
      return {
        ...base,
        agentPermissions: {
          reviewGateRequired: true,
          qualityReview: marker,
        },
      };
    case 'output':
      return {
        ...base,
        outputContracts: [{
          outputId: `quality-review-output-${stableShortId(String(marker.title ?? proposal.title))}`,
          label: proposal.title,
          artifactType: 'other',
          citationRequired: true,
          reviewRequired: true,
          qualityReview: marker,
        }],
      };
  }
}

function reviewTargetForProposalKind(kind: CapsuleQualityReviewProposalKind): CreateCapsuleReviewCardInput['target'] {
  switch (kind) {
    case 'sourcing':
      return 'sourceGap';
    case 'temporal':
    case 'causal':
      return 'claimLedger';
    case 'ontology':
      return 'ontologyStack';
    case 'guardrail':
      return 'agentInstructions';
    case 'output':
      return 'artifactLink';
  }
}

function kindForBreakdown(id: CapsuleQualityBreakdownItem['id']): CapsuleQualityReviewProposalKind {
  switch (id) {
    case 'source_support':
    case 'receipt_depth':
      return 'sourcing';
    case 'freshness':
    case 'temporality_coverage':
      return 'temporal';
    case 'causality_coverage':
    case 'contradiction_rate':
      return 'causal';
    case 'ontology_binding_coverage':
      return 'ontology';
    case 'human_review_provenance':
    case 'agent_operability':
      return 'guardrail';
    case 'completeness':
    case 'output_readiness':
      return 'output';
  }
}

function titleForDeficit(deficit: CapsuleQualityReviewDeficit): string {
  const prefix: Record<CapsuleQualityReviewProposalKind, string> = {
    sourcing: 'Source support repair',
    temporal: 'Temporal anchor repair',
    causal: 'Causal reasoning repair',
    ontology: 'Ontology binding repair',
    guardrail: 'Review guardrail repair',
    output: 'Output readiness repair',
  };
  return compact(`${prefix[deficit.kind]}: ${deficit.title}`, 118);
}

function suggestedChangeForDeficit(deficit: CapsuleQualityReviewDeficit): string {
  const guidance: Record<CapsuleQualityReviewProposalKind, string> = {
    sourcing: 'Create a review-card source proposal with candidate receipts, source type, and claim links before treating the capsule as source-backed.',
    temporal: 'Add or refresh dated anchors, validity windows, as-of dates, and stale-source notes for human approval.',
    causal: 'Add claim-level causal links or contradiction notes as a review-card proposal before relying on causal analysis.',
    ontology: 'Bind the capsule to the relevant domain, ontology IDs, or ACO primitives through a review-card proposal.',
    guardrail: 'Complete the human gate, reviewer metadata, and agent-permission guardrails before final reuse.',
    output: 'Add a review-gated output contract that states artifact type, citation needs, and human-review requirements.',
  };
  return `${guidance[deficit.kind]} Deficit path: ${deficit.path}.`;
}

function isLowQualityBreakdown(item: CapsuleQualityBreakdownItem): boolean {
  return item.diagnostics.length > 0 || item.score < item.maxScore * 0.75;
}

function isUnsupportedClaim(claim: ContextCapsuleClaim): boolean {
  return claim.support === 'unsupported' ||
    claim.support === 'needs_source' ||
    claim.sourceRefIds.length === 0;
}

function hasCausalLinks(claim: ContextCapsuleClaim): boolean {
  const links = claim.causalLinks;
  return Boolean(
    links?.causes?.length ||
    links?.causedBy?.length ||
    links?.enables?.length ||
    links?.blocks?.length ||
    links?.escalates?.length ||
    links?.deEscalates?.length,
  );
}

function isStaleSource(source: ContextCapsuleSourceRef, freshnessWindowDays: number | null, now?: string | Date): boolean {
  if (!source.date || freshnessWindowDays === null) return false;
  const timestamp = Date.parse(source.date);
  if (Number.isNaN(timestamp)) return false;
  const compare = compareTime(now);
  if (Number.isNaN(compare)) return false;
  return (compare - timestamp) / 86_400_000 > freshnessWindowDays;
}

function isPast(value: string | null | undefined, now?: string | Date): boolean {
  if (!value) return false;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return false;
  const compare = compareTime(now);
  return !Number.isNaN(compare) && timestamp < compare;
}

function compareTime(now?: string | Date): number {
  return now instanceof Date ? now.getTime() : now ? Date.parse(now) : Date.now();
}

function firstRecord(...values: unknown[]): Record<string, unknown> | null {
  return values.find(isRecord) ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function dedupeDeficits(deficits: CapsuleQualityReviewDeficit[]): CapsuleQualityReviewDeficit[] {
  const seen = new Set<string>();
  return deficits.filter((deficit) => {
    const key = `${deficit.kind}:${deficit.path}:${deficit.title}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeProposals(proposals: CapsuleQualityReviewProposal[]): CapsuleQualityReviewProposal[] {
  const seen = new Set<string>();
  return proposals.filter((proposal) => {
    const key = `${proposal.kind}:${proposal.title}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function compact(value: string | null | undefined, maxLength: number): string {
  const cleaned = (value ?? '').replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, Math.max(0, maxLength - 3))}...` : cleaned;
}

function stableShortId(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

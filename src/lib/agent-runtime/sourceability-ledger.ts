import { createHash } from 'crypto';
import type { CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import type { AgentRun } from '@/lib/agent-runtime/types';
import type { PolicyAgentOutputDestination } from '@/lib/product/policy-agents';

export type SourceabilitySupportLabel =
  | 'supported'
  | 'weak'
  | 'contradicted'
  | 'model_prior'
  | 'assumption'
  | 'unsupported';

export type SourceabilityVerdict = 'supported' | 'weak' | 'contradicted' | 'unsupported';

export interface SourceabilityClaimVerdict {
  claimId: string;
  claim: string;
  verdict: SourceabilityVerdict;
  supportLabel: SourceabilitySupportLabel;
  sourceIds: string[];
  confidence: number | null;
  reviewNote?: string;
}

export interface EvidenceCoverageSummary {
  totalClaims: number;
  supportedClaims: number;
  unsupportedClaims: number;
  weakClaims: number;
  contradictedClaims: number;
  coveragePercent: number;
  unsupportedClaimTexts: string[];
}

export interface SourceabilityClaimVerdictInput {
  id?: string;
  claim: string;
  supportLabel: SourceabilitySupportLabel;
  sourceIds?: string[];
  sourceReceiptIds?: string[];
  sourceCardIds?: string[];
  documentParagraphIds?: string[];
  confidence?: number | null;
  reviewNote?: string;
}

export interface SourceabilityClaim {
  id: string;
  claim: string;
  supportLabel: SourceabilitySupportLabel;
  sourceReceiptIds: string[];
  documentParagraphIds: string[];
  confidence: number;
  reviewNote: string;
}

export interface SourceabilityLedgerSummary {
  totalClaims: number;
  supportedClaims: number;
  weakClaims: number;
  unsupportedClaims: number;
  contradictedClaims: number;
  modelPriorClaims: number;
  assumptionClaims: number;
}

export interface SourceabilityLedger {
  version: 1;
  ledgerId: string;
  capsuleId: string | null;
  agentRunId: string | null;
  evidencePackId: string | null;
  outputTarget: PolicyAgentOutputDestination | null;
  generatedAt: string;
  claims: SourceabilityClaim[];
  contextGaps?: string[];
  summary: SourceabilityLedgerSummary;
  unsupportedClaims: SourceabilityClaim[];
  outputReadiness: {
    capsuleId: string | null;
    capsuleVersion: number | null;
    agentRunId: string | null;
    sourceReceiptIds: string[];
    generatedAt: string;
    destination: PolicyAgentOutputDestination | null;
  };
}

export interface SourceCheckerTracePayload {
  agentId: 'source-checker';
  lane: 'sourceability';
  toolId: 'sourceability-reviewer';
  ledgerId: string;
  sourceabilityLedgerId: string;
  checkedClaimCount: number;
  unsupportedClaimCount: number;
  weakClaimCount: number;
  contradictedClaimCount: number;
  liveSourceReceiptCount: number;
  sourceReceiptIds: string[];
  sourceabilityVerdicts: SourceabilityClaimVerdict[];
}

export function sourceabilityVerdictForSupportLabel(label: SourceabilitySupportLabel): SourceabilityVerdict {
  if (label === 'supported') return 'supported';
  if (label === 'weak') return 'weak';
  if (label === 'contradicted') return 'contradicted';
  return 'unsupported';
}

export function buildSourceabilityClaimVerdicts(claims: SourceabilityClaimVerdictInput[]): SourceabilityClaimVerdict[] {
  return claims
    .filter((item) => item.claim.trim().length > 0)
    .slice(0, 12)
    .map((item) => {
      const sourceIds = uniqueStrings([
        ...(item.sourceIds ?? []),
        ...(item.sourceCardIds ?? []),
        ...(item.sourceReceiptIds ?? []),
        ...(item.documentParagraphIds ?? []),
      ]);
      return {
        claimId: item.id ?? `claim:${createHash('sha256').update(`${item.claim}:${item.supportLabel}:${sourceIds.join('|')}`).digest('hex').slice(0, 16)}`,
        claim: item.claim.slice(0, 900),
        verdict: sourceabilityVerdictForSupportLabel(item.supportLabel),
        supportLabel: item.supportLabel,
        sourceIds,
        confidence: typeof item.confidence === 'number' ? Math.max(0, Math.min(1, item.confidence)) : null,
        ...(item.reviewNote ? { reviewNote: item.reviewNote } : {}),
      };
    });
}

export function buildSourceabilityClaimVerdictsFromLedger(ledger: SourceabilityLedger): SourceabilityClaimVerdict[] {
  return buildSourceabilityClaimVerdicts(ledger.claims.map((item) => ({
    id: item.id,
    claim: item.claim,
    supportLabel: item.supportLabel,
    sourceReceiptIds: item.sourceReceiptIds,
    documentParagraphIds: item.documentParagraphIds,
    confidence: item.confidence,
    reviewNote: item.reviewNote,
  })));
}

export function computeEvidenceCoverage(verdicts: SourceabilityClaimVerdict[]): EvidenceCoverageSummary {
  const totalClaims = verdicts.length;
  const supportedClaims = verdicts.filter((item) => item.verdict === 'supported').length;
  const unsupported = verdicts.filter((item) => item.verdict === 'unsupported');
  const unsupportedClaims = unsupported.length;
  const weakClaims = verdicts.filter((item) => item.verdict === 'weak').length;
  const contradictedClaims = verdicts.filter((item) => item.verdict === 'contradicted').length;
  return {
    totalClaims,
    supportedClaims,
    unsupportedClaims,
    weakClaims,
    contradictedClaims,
    coveragePercent: totalClaims ? Math.round((supportedClaims / totalClaims) * 100) : 0,
    unsupportedClaimTexts: unsupported.map((item) => item.claim).filter(Boolean),
  };
}

export function buildSourceGapScoutObjective(claims: string[], fallback = 'Find sources for unsupported claims.'): string {
  const cleaned = uniqueStrings(claims)
    .slice(0, 8)
    .map((claim) => claim.slice(0, 320));
  if (!cleaned.length) return fallback.slice(0, 2000);
  return [
    'Find current, defensible sources for these unsupported Ask PRAXIS claims.',
    'Create review-gated source-pack candidates; do not promote claims automatically.',
    ...cleaned.map((claim) => `- ${claim}`),
  ].join('\n').slice(0, 2000);
}

export function buildSourceCheckerTracePayload(
  ledger: SourceabilityLedger,
  options: {
    liveSourceReceiptIds?: string[];
  } = {},
): SourceCheckerTracePayload {
  const liveSourceReceiptIds = uniqueStrings(options.liveSourceReceiptIds ?? []);
  return {
    agentId: 'source-checker',
    lane: 'sourceability',
    toolId: 'sourceability-reviewer',
    ledgerId: ledger.ledgerId,
    sourceabilityLedgerId: ledger.ledgerId,
    checkedClaimCount: ledger.summary.totalClaims,
    unsupportedClaimCount: ledger.summary.unsupportedClaims,
    weakClaimCount: ledger.summary.weakClaims,
    contradictedClaimCount: ledger.summary.contradictedClaims,
    liveSourceReceiptCount: liveSourceReceiptIds.length,
    sourceReceiptIds: liveSourceReceiptIds,
    sourceabilityVerdicts: buildSourceabilityClaimVerdictsFromLedger(ledger),
  };
}

export function buildSourceabilityLedgerFromEvidencePack(
  pack: CapsuleEvidencePack,
  options: {
    agentRunId?: string | null;
    outputTarget?: PolicyAgentOutputDestination | null;
    generatedAt?: string;
  } = {},
): SourceabilityLedger {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const claims: SourceabilityClaim[] = [
    ...pack.sourcedParagraphs.map((paragraph) => claim({
      basis: `${pack.packId}:${paragraph.id}`,
      claim: paragraph.excerpt,
      supportLabel: !paragraph.sourceReceiptId ? 'unsupported' : paragraph.confidence >= 0.7 ? 'supported' : 'weak',
      sourceReceiptIds: paragraph.sourceReceiptId ? [paragraph.sourceReceiptId] : [],
      documentParagraphIds: [paragraph.id],
      confidence: paragraph.confidence,
      reviewNote: paragraph.sourceReceiptId ? 'Attached paragraph and source receipt support this claim.' : 'Attached paragraph exists, but no source receipt id is available.',
    })),
    ...pack.documentDigests.flatMap((digest) => digest.keyClaims.slice(0, 6).map((keyClaim, index) => claim({
      basis: `${pack.packId}:${digest.documentId}:${index}`,
      claim: keyClaim,
      supportLabel: pack.sourceReceiptIds.length ? 'weak' : 'model_prior',
      sourceReceiptIds: pack.sourceReceiptIds.slice(0, 3),
      documentParagraphIds: [],
      confidence: pack.sourceReceiptIds.length ? 0.55 : 0.35,
      reviewNote: pack.sourceReceiptIds.length ? 'Digest claim needs paragraph-level citation before export.' : 'Digest claim has no attached source receipt.',
    }))),

  ];
  if (!claims.length) {
    claims.push(claim({
      basis: `${pack.packId}:objective`,
      claim: pack.objective,
      supportLabel: 'assumption',
      sourceReceiptIds: [],
      documentParagraphIds: [],
      confidence: 0.25,
      reviewNote: 'No material evidence claims were available; preserve the user objective as an assumption.',
    }));
  }
  return buildLedger({
    capsuleId: pack.capsuleId,
    capsuleVersion: pack.activeCapsule.version ?? null,
    agentRunId: options.agentRunId ?? null,
    evidencePackId: pack.packId,
    outputTarget: options.outputTarget ?? null,
    generatedAt,
    sourceReceiptIds: pack.sourceReceiptIds,
    contextGaps: pack.openGaps,
    claims,
  });
}

export function buildSourceabilityLedgerFromRun(
  run: AgentRun,
  options: {
    outputTarget?: PolicyAgentOutputDestination | null;
    generatedAt?: string;
    claims?: SourceabilityClaim[];
  } = {},
): SourceabilityLedger {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const sourceReceiptIds = stringArray(run.metadata.sourceReceiptIds);
  const fallbackClaims = options.claims?.length ? options.claims : [
    claim({
      basis: `${run.id}:objective`,
      claim: run.objective,
      supportLabel: sourceReceiptIds.length ? 'weak' : 'assumption',
      sourceReceiptIds,
      documentParagraphIds: [],
      confidence: sourceReceiptIds.length ? 0.45 : 0.25,
      reviewNote: sourceReceiptIds.length ? 'Run has source receipts, but the objective still needs claim-level mapping.' : 'Run has no source receipts; treat generated claims as assumptions until reviewed.',
    }),
  ];
  return buildLedger({
    capsuleId: run.capsuleId,
    capsuleVersion: typeof run.metadata.capsuleVersion === 'number' ? run.metadata.capsuleVersion : null,
    agentRunId: run.id,
    evidencePackId: typeof run.metadata.evidencePackId === 'string' ? run.metadata.evidencePackId : null,
    outputTarget: options.outputTarget ?? normalizeOutputTarget(run.metadata.outputDestination),
    generatedAt,
    sourceReceiptIds,
    claims: fallbackClaims,
  });
}

function buildLedger(input: {
  capsuleId: string | null;
  capsuleVersion: number | null;
  agentRunId: string | null;
  evidencePackId: string | null;
  outputTarget: PolicyAgentOutputDestination | null;
  generatedAt: string;
  sourceReceiptIds: string[];
  claims: SourceabilityClaim[];
  contextGaps?: string[];
}): SourceabilityLedger {
  const summary = summarizeClaims(input.claims);
  const unsupportedClaims = input.claims.filter((item) => item.supportLabel === 'unsupported');
  return {
    version: 1,
    ledgerId: `claim-ledger:${createHash('sha256').update(`${input.capsuleId}:${input.agentRunId}:${input.evidencePackId}:${input.generatedAt}`).digest('hex').slice(0, 20)}`,
    capsuleId: input.capsuleId,
    agentRunId: input.agentRunId,
    evidencePackId: input.evidencePackId,
    outputTarget: input.outputTarget,
    generatedAt: input.generatedAt,
    claims: input.claims,
    contextGaps: input.contextGaps ?? [],
    summary,
    unsupportedClaims,
    outputReadiness: {
      capsuleId: input.capsuleId,
      capsuleVersion: input.capsuleVersion,
      agentRunId: input.agentRunId,
      sourceReceiptIds: input.sourceReceiptIds,
      generatedAt: input.generatedAt,
      destination: input.outputTarget,
    },
  };
}

function claim(input: Omit<SourceabilityClaim, 'id'> & { basis: string }): SourceabilityClaim {
  return {
    id: `claim:${createHash('sha256').update(input.basis).digest('hex').slice(0, 16)}`,
    claim: input.claim.slice(0, 900),
    supportLabel: input.supportLabel,
    sourceReceiptIds: uniqueStrings(input.sourceReceiptIds),
    documentParagraphIds: uniqueStrings(input.documentParagraphIds),
    confidence: Math.max(0, Math.min(1, input.confidence)),
    reviewNote: input.reviewNote,
  };
}

function summarizeClaims(claims: SourceabilityClaim[]): SourceabilityLedgerSummary {
  return {
    totalClaims: claims.length,
    supportedClaims: claims.filter((item) => item.supportLabel === 'supported').length,
    weakClaims: claims.filter((item) => item.supportLabel === 'weak').length,
    unsupportedClaims: claims.filter((item) => item.supportLabel === 'unsupported').length,
    contradictedClaims: claims.filter((item) => item.supportLabel === 'contradicted').length,
    modelPriorClaims: claims.filter((item) => item.supportLabel === 'model_prior').length,
    assumptionClaims: claims.filter((item) => item.supportLabel === 'assumption').length,
  };
}

function normalizeOutputTarget(value: unknown): PolicyAgentOutputDestination | null {
  return value === 'memo_studio' || value === 'canvas' || value === 'library' || value === 'handover' ? value : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 80);
}

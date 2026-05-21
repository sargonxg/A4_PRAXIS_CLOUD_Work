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
      supportLabel: paragraph.confidence >= 0.7 ? 'supported' : 'weak',
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
    ...pack.openGaps.map((gap, index) => claim({
      basis: `${pack.packId}:gap:${index}`,
      claim: gap,
      supportLabel: 'unsupported',
      sourceReceiptIds: [],
      documentParagraphIds: [],
      confidence: 0.1,
      reviewNote: 'Gap must remain visible until supporting context is attached.',
    })),
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

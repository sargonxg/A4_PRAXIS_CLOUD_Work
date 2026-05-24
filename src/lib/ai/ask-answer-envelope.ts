import type { CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import type { SourceabilityLedgerSummary, SourceabilitySupportLabel } from '@/lib/agent-runtime/sourceability-ledger';
import type { AskIntent } from '@/lib/ai/ask-conversation';
import type { AskConversationOrchestrationReceipt } from '@/lib/ai/ask-orchestrator';
import type { ContextEnrichmentReceipt } from '@/lib/knowledge/context-enrichment-adapter';
import type { ResearchGraphReceipt } from '@/lib/research-graph';
import type { MemoBlock } from '@/types/memo';

export type SourcePreviewType =
  | 'grounded-search'
  | 'uploaded-document'
  | 'corpus'
  | 'source-receipt'
  | 'document-digest'
  | 'research-graph'
  | 'context-capsule'
  | 'ai-knowledge'
  | 'inference';

export interface SourcePreviewCard {
  id: string;
  title: string;
  label: string;
  sourceType: SourcePreviewType;
  url?: string;
  quotePreview: string;
  documentId?: string;
  chunkId?: string;
  sourceReceiptId?: string;
  pageRef?: string;
  paragraphRef?: string;
  locatorLabel?: string;
  citationLabel?: string;
  sourceReceiptHref?: string;
  extractionFallbackLabel?: string;
  confidence: number;
}

export interface ClaimGrounding {
  claim: string;
  grounding: 'source-backed' | 'ai-knowledge' | 'inference' | 'unsupported';
  supportLabel: SourceabilitySupportLabel;
  sourceCardIds: string[];
}

export type ClaimStatus =
  | 'supported'
  | 'weak'
  | 'unsupported'
  | 'stale'
  | 'advisory_memory'
  | 'model_prior';

export interface CapsuleClaimLedgerItem {
  claimId: string;
  text: string;
  status: ClaimStatus;
  sourceIds: string[];
  memoryIds: string[];
  confidence: 'low' | 'medium' | 'high';
  freshness: 'current' | 'stale' | 'unknown';
  reviewState: 'none' | 'proposed' | 'owner_review' | 'applied' | 'rejected';
}

export interface CapsuleGroundingReceipt {
  capsuleId: string;
  capsuleVersion: number;
  catalogVersion?: string;
  sourceExcerptCount: number;
  cogneeStatus: 'enabled' | 'disabled' | 'degraded';
  memoryHitCount: number;
  supportedClaims: number;
  weakClaims: number;
  unsupportedClaims: number;
  staleClaims: number;
  humanReviewRequired: boolean;
  nextRepairActions: string[];
}

export interface CapsuleMemoryReceipt {
  cogneeStatus: 'enabled' | 'disabled' | 'degraded';
  memoryHitCount: number;
  memoryIds: string[];
  ignoredMemoryIds: string[];
  advisoryOnly: true;
  promotionRequired: 'review-card';
  warnings: string[];
  writebackProposalIds: string[];
}

export interface CapsuleSourceRefreshDocketItem {
  sourceId: string;
  title: string;
  url?: string;
  status: 'refreshed' | 'needs_refresh' | 'missing' | 'stale' | 'source_gap';
  lastCheckedAt: string | null;
  excerptCount: number;
  gap?: string;
}

export interface CapsuleSourceRefreshDocket {
  capsuleId: string;
  capsuleVersion: number;
  generatedAt: string;
  items: CapsuleSourceRefreshDocketItem[];
  sourceIds: string[];
  excerptSourceIds: string[];
  staleSourceIds: string[];
  missingEvidenceGaps: string[];
  lastRefreshedAt: string | null;
  needsRefresh: boolean;
  nextActions: string[];
}

export interface CapsuleReviewCardSuggestion {
  id: string;
  label: string;
  action:
    | 'promote_supported_claim'
    | 'mark_disputed'
    | 'create_source_gap'
    | 'save_as_memo'
    | 'create_output_capsule';
  target: 'claim' | 'source_gap' | 'memory_hit' | 'memo' | 'output_capsule';
  evidenceIds: string[];
  requiresHumanReview: boolean;
  prompt: string;
}

export interface AskGenerationReceipt {
  selectedModel: string;
  fallbackModel: string | null;
  budgetMode: 'standard' | 'long_context';
  maxOutputTokens: number;
  finishReason?: string | null;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
  sourceCount?: number;
  capsuleCount?: number;
  warningCount?: number;
}

export interface AskSourceAuditSummary {
  sourceCount: number;
  sourceReceiptCount: number;
  sourceTypes: SourcePreviewType[];
  gapCount: number;
  supportedClaimCount: number;
  weakClaimCount: number;
  unsupportedClaimCount: number;
  contradictedClaimCount: number;
  modelPriorClaimCount: number;
  assumptionClaimCount: number;
  sourcePosture: 'source_previews_attached' | 'model_prior_or_inference';
  gapPosture: 'gaps_visible' | 'no_recorded_gaps';
}

export interface AskTraceabilitySummary {
  detectedIntent: string;
  selectedPolicyContext: string;
  activeCapsulesUsed: string[];
  sourceCount: number;
  sourcePosture: string;
  unsupportedClaimsCount: number;
  assumptionsCount: number;
  confidencePosture: 'high' | 'medium' | 'low';
  humanReviewRecommendation: string;
  bestNextAction: string;
}

export interface AskContinuationAction {
  id: 'continue-as-memo' | 'expand-evidence-annex' | 'create-output-capsule';
  label: string;
  prompt: string;
}

export interface AskCapsuleSuggestionReceipt {
  capsuleId: string;
  label: string;
  category: string;
  reason: string;
  sourceReadinessSignal: string;
  score?: number;
  autoApplied: false;
}

export interface AskAnswerEnvelope {
  style: {
    mode: 'claude_like_dialogue';
    paragraphShape: string;
    sourcePosture: 'always_visible';
  };
  sourceCards: SourcePreviewCard[];
  claimGrounding: ClaimGrounding[];
  claimLedgerSummary: SourceabilityLedgerSummary;
  sourceAudit: AskSourceAuditSummary;
  traceabilitySummary: AskTraceabilitySummary;
  groundingReceipt: CapsuleGroundingReceipt;
  claimLedger: CapsuleClaimLedgerItem[];
  sourceRefreshDocket: CapsuleSourceRefreshDocket;
  memoryReceipt: CapsuleMemoryReceipt;
  reviewCardSuggestions: CapsuleReviewCardSuggestion[];
  generationReceipt?: AskGenerationReceipt;
  continuationActions: AskContinuationAction[];
  capsuleSuggestions: AskCapsuleSuggestionReceipt[];
  researchGraphReceipts: ResearchGraphReceipt[];
  followUps: string[];
  documentPackCandidate: ConversationDocumentPack;
  orchestrationReceipt?: AskConversationOrchestrationReceipt;
}

export interface ConversationDocumentPack {
  title: string;
  prompt: string;
  answer: string;
  sourceCards: SourcePreviewCard[];
  gaps: string[];
  provenance: ConversationPackProvenance;
}

export type AskDocumentPackOutputTarget =
  | 'ask-response'
  | 'source-note'
  | 'memo'
  | 'brief'
  | 'docx-pdf'
  | 'handover';

export interface ConversationPackProvenance {
  capsuleId?: string | null;
  capsuleVersion?: number | null;
  conversationId?: string | null;
  threadId?: string | null;
  runId?: string | null;
  model?: string | null;
  provider?: string | null;
  contextPackageId?: string | null;
  catalogVersion?: string | null;
  sourceReceiptIds?: string[];
  unsupportedClaims?: string[];
  outputTarget?: AskDocumentPackOutputTarget;
  generatedAt?: string;
}

export interface BuildSourcePreviewCardsInput {
  evidencePack?: CapsuleEvidencePack | null;
  groundedFetches?: Array<{
    id?: string;
    title?: string;
    url?: string;
    markdown?: string;
    content?: string;
    confidence?: number;
  }>;
}

export function buildResearchGraphSourcePreviewCards(receipts: ResearchGraphReceipt[]): SourcePreviewCard[] {
  return receipts.flatMap((receipt, receiptIndex) => {
    const urls = receipt.sourceUrls.length
      ? receipt.sourceUrls
      : receipt.entityMatches.map((match) => `https://www.wikidata.org/wiki/${match.qid}`);
    return urls.slice(0, 4).map((url, urlIndex) => ({
      id: `research-graph:${receipt.queryKind}:${receiptIndex}:${urlIndex}`,
      title: titleForResearchGraphSource(receipt, url),
      label: 'Research Graph',
      sourceType: 'research-graph' as const,
      url,
      quotePreview: researchGraphQuote(receipt),
      locatorLabel: `${receipt.provider} / ${receipt.queryKind.replace(/_/g, ' ')}`,
      citationLabel: 'advisory only',
      confidence: clamp01(receipt.confidence || 0.45),
    }));
  });
}

export function buildSourcePreviewCards(input: BuildSourcePreviewCardsInput): SourcePreviewCard[] {
  const cards: SourcePreviewCard[] = [];

  for (const paragraph of input.evidencePack?.sourcedParagraphs ?? []) {
    cards.push({
      id: `${paragraph.documentId}:${paragraph.chunkId}`,
      title: `Uploaded document ${paragraph.documentId}`,
      label: 'Uploaded Document',
      sourceType: 'uploaded-document',
      quotePreview: excerpt(paragraph.excerpt, 360),
      documentId: paragraph.documentId,
      chunkId: paragraph.chunkId,
      sourceReceiptId: paragraph.sourceReceiptId ?? undefined,
      pageRef: paragraph.pageRef ?? undefined,
      paragraphRef: paragraph.paragraphRef ?? undefined,
      locatorLabel: locatorLabel([paragraph.citationLabel, paragraph.pageRef, paragraph.paragraphRef]),
      citationLabel: paragraph.citationLabel,
      sourceReceiptHref: paragraph.sourceReceiptId ? receiptHref(paragraph.sourceReceiptId) : undefined,
      extractionFallbackLabel: paragraph.pageRef || paragraph.paragraphRef ? undefined : 'Text extraction only',
      confidence: clamp01(paragraph.confidence),
    });
  }

  for (const document of input.evidencePack?.knowledgeDocuments ?? []) {
    const summary = document.digest?.shortSummary || document.sourceNote || `${document.chunkCount} indexed chunk${document.chunkCount === 1 ? '' : 's'} available.`;
    cards.push({
      id: `corpus:${document.documentId}`,
      title: document.title || `Corpus document ${document.documentId}`,
      label: 'Corpus Result',
      sourceType: 'corpus',
      quotePreview: excerpt(summary, 360),
      documentId: document.documentId,
      locatorLabel: document.chunkCount > 0 ? `${document.chunkCount} chunks indexed` : document.retrievalStatus,
      extractionFallbackLabel: document.extractionStatus === 'extracted' ? undefined : extractionFallbackFor(document.extractionStatus),
      confidence: document.retrievalStatus === 'indexed' ? 0.68 : 0.48,
    });
  }

  for (const digest of input.evidencePack?.documentDigests ?? []) {
    cards.push({
      id: `digest:${digest.documentId}`,
      title: digest.title || `Document digest ${digest.documentId}`,
      label: 'Document Digest',
      sourceType: 'document-digest',
      quotePreview: excerpt(digest.shortSummary || digest.keyClaims.join(' '), 360),
      documentId: digest.documentId,
      locatorLabel: digest.keyClaims.length ? `${digest.keyClaims.length} extracted claim${digest.keyClaims.length === 1 ? '' : 's'}` : undefined,
      extractionFallbackLabel: 'Text extraction only',
      confidence: digest.sourceabilityWarnings.length ? 0.54 : 0.62,
    });
  }

  for (const sourceReceiptId of input.evidencePack?.sourceReceiptIds ?? []) {
    cards.push({
      id: `receipt:${sourceReceiptId}`,
      title: sourceReceiptId,
      label: 'Source Receipt',
      sourceType: 'source-receipt',
      quotePreview: `Source receipt attached to the active ContextCapsule: ${sourceReceiptId}.`,
      sourceReceiptId,
      sourceReceiptHref: receiptHref(sourceReceiptId),
      confidence: 0.58,
    });
  }

  for (const fetch of input.groundedFetches ?? []) {
    const url = fetch.url?.trim();
    const id = fetch.id?.trim() || url || `grounded:${cards.length + 1}`;
    cards.push({
      id,
      title: fetch.title?.trim() || url || 'Grounded search result',
      label: 'Grounded Search',
      sourceType: 'grounded-search',
      url,
      quotePreview: excerpt(fetch.markdown ?? fetch.content ?? '', 360),
      locatorLabel: url ? 'Grounded fetch' : undefined,
      confidence: clamp01(fetch.confidence ?? 0.62),
    });
  }

  return dedupeCards(cards).slice(0, 12);
}

export function buildAskAnswerEnvelope(input: {
  prompt: string;
  answer: string;
  intent: AskIntent;
  sourceCards: SourcePreviewCard[];
  gaps?: string[];
  provenance?: ConversationPackProvenance;
  orchestrationReceipt?: AskConversationOrchestrationReceipt;
  generationReceipt?: AskGenerationReceipt;
  capsuleSuggestions?: AskCapsuleSuggestionReceipt[];
  researchGraphReceipts?: ResearchGraphReceipt[];
  contextEnrichment?: ContextEnrichmentReceipt;
}): AskAnswerEnvelope {
  const claimGrounding = groundClaims(input.answer, input.sourceCards);
  const claimLedgerSummary = summarizeClaimGrounding(claimGrounding);
  const memoryReceipt = buildCapsuleMemoryReceipt(input.contextEnrichment);
  const claimLedger = buildCapsuleClaimLedger(claimGrounding, memoryReceipt);
  const sourceRefreshDocket = buildCapsuleSourceRefreshDocket({
    capsuleId: input.provenance?.capsuleId ?? input.orchestrationReceipt?.capsule.capsuleId ?? null,
    capsuleVersion: input.provenance?.capsuleVersion ?? null,
    sourceCards: input.sourceCards,
    gaps: input.gaps ?? [],
  });
  const groundingReceipt = buildCapsuleGroundingReceipt({
    capsuleId: sourceRefreshDocket.capsuleId,
    capsuleVersion: sourceRefreshDocket.capsuleVersion,
    catalogVersion: input.provenance?.catalogVersion ?? undefined,
    sourceCards: input.sourceCards,
    claimLedger,
    memoryReceipt,
    sourceRefreshDocket,
  });
  const reviewCardSuggestions = buildCapsuleReviewCardSuggestions({
    claimLedger,
    sourceRefreshDocket,
    memoryReceipt,
  });
  const sourceAudit = buildSourceAudit({
    sourceCards: input.sourceCards,
    gaps: input.gaps ?? [],
    claimLedgerSummary,
  });
  const queuedRunId = input.orchestrationReceipt?.supervisor.queuedRun?.runId;
  const pack = buildConversationDocumentPack({
    title: titleForPrompt(input.prompt),
    prompt: input.prompt,
    answer: input.answer,
    sourceCards: input.sourceCards,
    gaps: input.gaps ?? [],
    unsupportedClaims: claimGrounding
      .filter((claim) => claim.supportLabel === 'unsupported')
      .map((claim) => claim.claim),
    provenance: {
      ...input.provenance,
      conversationId: input.provenance?.conversationId ?? input.provenance?.threadId ?? null,
      runId: input.provenance?.runId ?? (queuedRunId && queuedRunId !== 'unavailable' ? queuedRunId : null),
      outputTarget: input.provenance?.outputTarget ?? 'ask-response',
    },
  });

  return {
    style: {
      mode: 'claude_like_dialogue',
      paragraphShape: 'thesis, evidence, caveat, next move',
      sourcePosture: 'always_visible',
    },
    sourceCards: input.sourceCards,
    claimGrounding,
    claimLedgerSummary,
    sourceAudit,
    groundingReceipt,
    claimLedger,
    sourceRefreshDocket,
    memoryReceipt,
    reviewCardSuggestions,
    traceabilitySummary: buildAskTraceabilitySummary({
      sourceAudit,
      claimLedgerSummary,
      orchestrationReceipt: input.orchestrationReceipt,
    }),
    generationReceipt: input.generationReceipt,
    continuationActions: continuationActionsFor(input.intent),
    capsuleSuggestions: input.capsuleSuggestions ?? [],
    researchGraphReceipts: input.researchGraphReceipts ?? [],
    followUps: followUpsFor(input.intent, input.sourceCards.length, input.researchGraphReceipts?.length ?? 0),
    documentPackCandidate: pack,
    orchestrationReceipt: input.orchestrationReceipt,
  };
}

export function buildAskTraceabilitySummary(input: {
  sourceAudit: AskSourceAuditSummary;
  claimLedgerSummary: SourceabilityLedgerSummary;
  orchestrationReceipt?: AskConversationOrchestrationReceipt;
}): AskTraceabilitySummary {
  const workIntent = input.orchestrationReceipt?.triage.workIntent ?? null;
  const policyContext = workIntent?.policyContext ?? null;
  const activeCapsulesUsed = (workIntent?.activeCapsuleIds.length
    ? workIntent.activeCapsuleIds
    : input.orchestrationReceipt?.capsule.capsuleId
      ? [input.orchestrationReceipt.capsule.capsuleId]
      : []).slice(0, 5);
  const unsupportedClaimsCount = input.claimLedgerSummary.unsupportedClaims;
  const assumptionsCount = input.claimLedgerSummary.assumptionClaims + input.sourceAudit.gapCount;
  const confidencePosture: AskTraceabilitySummary['confidencePosture'] =
    input.sourceAudit.sourceCount >= 3 && unsupportedClaimsCount === 0
      ? 'high'
      : input.sourceAudit.sourceCount > 0 && unsupportedClaimsCount <= 1
        ? 'medium'
        : 'low';

  return {
    detectedIntent: workIntent?.intent ?? input.orchestrationReceipt?.triage.intent ?? 'general_answer',
    selectedPolicyContext: policyContext
      ? `${policyContext.presetLabel}${policyContext.subPresetLabel ? ` / ${policyContext.subPresetLabel}` : ''}`
      : 'None inferred',
    activeCapsulesUsed,
    sourceCount: input.sourceAudit.sourceCount,
    sourcePosture: input.sourceAudit.sourcePosture.replace(/_/g, ' '),
    unsupportedClaimsCount,
    assumptionsCount,
    confidencePosture,
    humanReviewRecommendation: workIntent?.humanReviewPosture.gate
      ?? (unsupportedClaimsCount > 0 ? 'Human review recommended for unsupported claims.' : 'Standard review.'),
    bestNextAction: workIntent?.suggestedNextActions[0]
      ?? (input.sourceAudit.sourceCount > 0 ? 'Review the source previews and continue.' : 'Attach sources for the weakest claim.'),
  };
}

export function buildConversationDocumentPack(input: {
  title: string;
  prompt: string;
  answer: string;
  sourceCards: SourcePreviewCard[];
  gaps?: string[];
  unsupportedClaims?: string[];
  provenance?: ConversationPackProvenance;
}): ConversationDocumentPack {
  const sourceReceiptIds = uniqueStrings([
    ...(input.provenance?.sourceReceiptIds ?? []),
    ...input.sourceCards.map((card) => card.sourceReceiptId).filter(isString),
  ]);
  const unsupportedClaims = uniqueStrings([
    ...(input.provenance?.unsupportedClaims ?? []),
    ...(input.unsupportedClaims ?? []),
  ]);
  return {
    title: input.title.trim() || 'Ask PRAXIS document pack',
    prompt: input.prompt,
    answer: input.answer,
    sourceCards: input.sourceCards,
    gaps: input.gaps ?? [],
    provenance: {
      ...input.provenance,
      conversationId: input.provenance?.conversationId ?? input.provenance?.threadId ?? null,
      sourceReceiptIds,
      unsupportedClaims,
      outputTarget: input.provenance?.outputTarget ?? 'ask-response',
      generatedAt: input.provenance?.generatedAt ?? new Date().toISOString(),
    },
  };
}

export function conversationDocumentPackToMemoBlocks(pack: ConversationDocumentPack): MemoBlock[] {
  const sourceReceiptIds = uniqueStrings([
    ...(pack.provenance.sourceReceiptIds ?? []),
    ...pack.sourceCards.map((card) => card.sourceReceiptId).filter(isString),
  ]);
  const citations = sourceReceiptIds.length
    ? [{ nodeIds: [], sourceReceiptIds, surface: 'footnote' as const }]
    : [];
  const sourceItems = pack.sourceCards.length
    ? pack.sourceCards.map((card) => {
        const locator = card.locatorLabel ?? [card.citationLabel, card.pageRef, card.paragraphRef].filter(Boolean).join(' ');
        const href = card.url ? ` ${card.url}` : '';
        const receipt = card.sourceReceiptId ? ` Source receipt: ${card.sourceReceiptId}.` : '';
        const fallback = card.extractionFallbackLabel ? ` ${card.extractionFallbackLabel}.` : '';
        return `${card.label}: ${card.title}${locator ? ` (${locator})` : ''}.${href}${receipt}${fallback} Quote preview: "${card.quotePreview}"`;
      })
    : ['No source previews were attached. Treat factual claims as AI knowledge or inference until grounded.'];
  const gapItems = pack.gaps.length ? pack.gaps : ['No explicit source gap was recorded for this turn.'];
  const provenance = [
    pack.provenance.capsuleId ? `Capsule: ${pack.provenance.capsuleId}${pack.provenance.capsuleVersion ? ` v${pack.provenance.capsuleVersion}` : ''}` : null,
    pack.provenance.conversationId ? `Conversation: ${pack.provenance.conversationId}` : null,
    pack.provenance.threadId ? `Thread: ${pack.provenance.threadId}` : null,
    pack.provenance.runId ? `Run: ${pack.provenance.runId}` : null,
    pack.provenance.model ? `Model: ${pack.provenance.model}` : null,
    pack.provenance.provider ? `Provider: ${pack.provenance.provider}` : null,
    pack.provenance.contextPackageId ? `Context package: ${pack.provenance.contextPackageId}` : null,
    sourceReceiptIds.length ? `Source receipts: ${sourceReceiptIds.join(', ')}` : null,
    pack.provenance.unsupportedClaims?.length ? `Unsupported claims: ${pack.provenance.unsupportedClaims.length}` : null,
    pack.provenance.outputTarget ? `Output target: ${pack.provenance.outputTarget}` : null,
    pack.provenance.generatedAt ? `Generated: ${pack.provenance.generatedAt}` : null,
  ].filter(isString);
  const artifactMetadata = {
    conversationId: pack.provenance.conversationId ?? pack.provenance.threadId ?? null,
    runId: pack.provenance.runId ?? null,
    capsuleId: pack.provenance.capsuleId ?? null,
    capsuleVersion: pack.provenance.capsuleVersion ?? null,
    sourceReceiptIds,
    unsupportedClaims: pack.provenance.unsupportedClaims ?? [],
    gaps: pack.gaps,
    timestamp: pack.provenance.generatedAt ?? new Date().toISOString(),
    outputTarget: pack.provenance.outputTarget ?? 'ask-response',
  };

  return [
    block('pack-heading', 'heading', pack.title, [], {}),
    block('pack-answer', 'paragraph', pack.answer || 'No answer text was captured.', citations, { prompt: pack.prompt, artifactMetadata }),
    block('pack-sources', 'bullets', '', citations, {}, 'Source previews', sourceItems),
    block('pack-gaps', 'bullets', '', [], {}, 'Gaps and review notes', gapItems),
    block('pack-provenance', 'bullets', '', [], artifactMetadata, 'Provenance', provenance.length ? provenance : ['No provenance was attached.']),
  ];
}

function block(
  id: string,
  type: MemoBlock['type'],
  content: string,
  citations: MemoBlock['citations'],
  metadata: MemoBlock['metadata'],
  title?: string,
  items?: string[],
): MemoBlock {
  return { id, type, content, citations, metadata, title, items };
}

function groundClaims(answer: string, sourceCards: SourcePreviewCard[]): ClaimGrounding[] {
  const claims = answer
    .split(/(?<=[.!?])\s+/)
    .map((claim) => claim.trim())
    .filter((claim) => claim.length > 12)
    .slice(0, 5);
  return claims.map((claim) => {
    if (isAssumptionClaim(claim)) {
      return {
        claim,
        grounding: 'inference',
        supportLabel: 'assumption',
        sourceCardIds: [],
      };
    }
    const matches = sourceCards
      .map((card) => ({ card, score: sourceabilityScore(claim, card) }))
      .filter((match) => match.score >= 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((match) => match.card);
    const bestConfidence = matches.reduce((max, card) => Math.max(max, card.confidence ?? 0), 0);
    return {
      claim,
      grounding: matches.length > 0 ? 'source-backed' as const : sourceCards.length ? 'unsupported' as const : 'ai-knowledge' as const,
      supportLabel: matches.length > 0 ? (bestConfidence >= 0.7 ? 'supported' as const : 'weak' as const) : sourceCards.length ? 'unsupported' as const : 'model_prior' as const,
      sourceCardIds: matches.map((card) => card.id),
    };
  });
}

function summarizeClaimGrounding(claims: ClaimGrounding[]): SourceabilityLedgerSummary {
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

function buildSourceAudit(input: {
  sourceCards: SourcePreviewCard[];
  gaps: string[];
  claimLedgerSummary: SourceabilityLedgerSummary;
}): AskSourceAuditSummary {
  return {
    sourceCount: input.sourceCards.length,
    sourceReceiptCount: input.sourceCards.filter((card) => Boolean(card.sourceReceiptId)).length,
    sourceTypes: Array.from(new Set(input.sourceCards.map((card) => card.sourceType))),
    gapCount: input.gaps.length,
    supportedClaimCount: input.claimLedgerSummary.supportedClaims,
    weakClaimCount: input.claimLedgerSummary.weakClaims,
    unsupportedClaimCount: input.claimLedgerSummary.unsupportedClaims,
    contradictedClaimCount: input.claimLedgerSummary.contradictedClaims,
    modelPriorClaimCount: input.claimLedgerSummary.modelPriorClaims,
    assumptionClaimCount: input.claimLedgerSummary.assumptionClaims,
    sourcePosture: input.sourceCards.length ? 'source_previews_attached' : 'model_prior_or_inference',
    gapPosture: input.gaps.length ? 'gaps_visible' : 'no_recorded_gaps',
  };
}

function continuationActionsFor(intent: AskIntent): AskContinuationAction[] {
  const memoPrompt = intent === 'research_memo'
    ? 'Continue this as a structured research memo with headings, caveats, and source notes.'
    : 'Continue this as a Memo Studio draft with the same evidence and caveats.';
  return [
    {
      id: 'continue-as-memo',
      label: 'Continue as memo',
      prompt: memoPrompt,
    },
    {
      id: 'expand-evidence-annex',
      label: 'Expand evidence annex',
      prompt: 'Expand the evidence annex: list supported, weak, unsupported, model-prior, and assumption claims with source gaps.',
    },
    {
      id: 'create-output-capsule',
      label: 'Create output capsule',
      prompt: 'Create a review-gated Output Capsule from this answer, preserving sources, claim posture, and next checks.',
    },
  ];
}

function buildCapsuleMemoryReceipt(enrichment?: ContextEnrichmentReceipt): CapsuleMemoryReceipt {
  const memoryIds = uniqueStrings(enrichment?.memoryItemIds ?? []);
  return {
    cogneeStatus: enrichment?.cognee ?? 'disabled',
    memoryHitCount: enrichment?.memoryHitCount ?? memoryIds.length,
    memoryIds,
    ignoredMemoryIds: [],
    advisoryOnly: true,
    promotionRequired: 'review-card',
    warnings: enrichment?.warnings ?? [],
    writebackProposalIds: enrichment?.writebackProposalIds ?? [],
  };
}

function buildCapsuleClaimLedger(
  claimGrounding: ClaimGrounding[],
  memoryReceipt: CapsuleMemoryReceipt,
): CapsuleClaimLedgerItem[] {
  const sourceClaims = claimGrounding.map((claim, index): CapsuleClaimLedgerItem => {
    const status = claimStatusForSupportLabel(claim.supportLabel);
    return {
      claimId: `claim:${stableTinyHash(`${index}:${claim.claim}:${claim.sourceCardIds.join('|')}`)}`,
      text: claim.claim,
      status,
      sourceIds: claim.sourceCardIds,
      memoryIds: [],
      confidence: confidenceForStatus(status),
      freshness: claim.sourceCardIds.length ? 'current' : 'unknown',
      reviewState: status === 'supported' ? 'none' : 'owner_review',
    };
  });
  const memoryClaims = memoryReceipt.memoryIds.map((memoryId): CapsuleClaimLedgerItem => ({
    claimId: `claim:${stableTinyHash(`memory:${memoryId}`)}`,
    text: `Advisory memory hit ${memoryId}; not canonical until a review card is applied.`,
    status: 'advisory_memory',
    sourceIds: [],
    memoryIds: [memoryId],
    confidence: 'low',
    freshness: 'unknown',
    reviewState: 'proposed',
  }));
  return [...sourceClaims, ...memoryClaims].slice(0, 12);
}

function buildCapsuleSourceRefreshDocket(input: {
  capsuleId?: string | null;
  capsuleVersion?: number | null;
  sourceCards: SourcePreviewCard[];
  gaps: string[];
}): CapsuleSourceRefreshDocket {
  const generatedAt = new Date().toISOString();
  const sourceItems: CapsuleSourceRefreshDocketItem[] = input.sourceCards.map((card) => ({
    sourceId: card.sourceReceiptId ?? card.id,
    title: card.title,
    url: card.url,
    status: 'refreshed',
    lastCheckedAt: generatedAt,
    excerptCount: card.quotePreview ? 1 : 0,
  }));
  const gapItems: CapsuleSourceRefreshDocketItem[] = input.gaps.map((gap, index) => ({
    sourceId: `source-gap:${stableTinyHash(`${index}:${gap}`)}`,
    title: 'Source gap',
    status: 'source_gap',
    lastCheckedAt: null,
    excerptCount: 0,
    gap,
  }));
  const items = [...sourceItems, ...gapItems].slice(0, 16);
  const needsRefresh = input.gaps.length > 0 || input.sourceCards.length === 0;
  return {
    capsuleId: input.capsuleId ?? 'unknown-capsule',
    capsuleVersion: input.capsuleVersion ?? 0,
    generatedAt,
    items,
    sourceIds: uniqueStrings(sourceItems.map((item) => item.sourceId)),
    excerptSourceIds: uniqueStrings(sourceItems.filter((item) => item.excerptCount > 0).map((item) => item.sourceId)),
    staleSourceIds: [],
    missingEvidenceGaps: input.gaps,
    lastRefreshedAt: sourceItems.length ? generatedAt : null,
    needsRefresh,
    nextActions: needsRefresh
      ? ['Refresh source-pack URLs and create source gaps for missing evidence before external use.']
      : ['Review source excerpts and promote only supported claims.'],
  };
}

function buildCapsuleGroundingReceipt(input: {
  capsuleId: string;
  capsuleVersion: number;
  catalogVersion?: string;
  sourceCards: SourcePreviewCard[];
  claimLedger: CapsuleClaimLedgerItem[];
  memoryReceipt: CapsuleMemoryReceipt;
  sourceRefreshDocket: CapsuleSourceRefreshDocket;
}): CapsuleGroundingReceipt {
  const supportedClaims = input.claimLedger.filter((claim) => claim.status === 'supported').length;
  const weakClaims = input.claimLedger.filter((claim) => claim.status === 'weak' || claim.status === 'advisory_memory').length;
  const unsupportedClaims = input.claimLedger.filter((claim) => claim.status === 'unsupported' || claim.status === 'model_prior').length;
  const staleClaims = input.claimLedger.filter((claim) => claim.status === 'stale').length + input.sourceRefreshDocket.staleSourceIds.length;
  const humanReviewRequired = weakClaims > 0
    || unsupportedClaims > 0
    || staleClaims > 0
    || input.memoryReceipt.memoryHitCount > 0
    || input.sourceRefreshDocket.needsRefresh;
  return {
    capsuleId: input.capsuleId,
    capsuleVersion: input.capsuleVersion,
    ...(input.catalogVersion ? { catalogVersion: input.catalogVersion } : {}),
    sourceExcerptCount: input.sourceCards.length,
    cogneeStatus: input.memoryReceipt.cogneeStatus,
    memoryHitCount: input.memoryReceipt.memoryHitCount,
    supportedClaims,
    weakClaims,
    unsupportedClaims,
    staleClaims,
    humanReviewRequired,
    nextRepairActions: nextGroundingRepairActions({
      weakClaims,
      unsupportedClaims,
      staleClaims,
      memoryHitCount: input.memoryReceipt.memoryHitCount,
      needsRefresh: input.sourceRefreshDocket.needsRefresh,
    }),
  };
}

function buildCapsuleReviewCardSuggestions(input: {
  claimLedger: CapsuleClaimLedgerItem[];
  sourceRefreshDocket: CapsuleSourceRefreshDocket;
  memoryReceipt: CapsuleMemoryReceipt;
}): CapsuleReviewCardSuggestion[] {
  const supported = input.claimLedger.find((claim) => claim.status === 'supported');
  const disputed = input.claimLedger.find((claim) => claim.status === 'unsupported' || claim.status === 'weak' || claim.status === 'model_prior');
  const memory = input.claimLedger.find((claim) => claim.status === 'advisory_memory');
  const gap = input.sourceRefreshDocket.missingEvidenceGaps[0] ?? 'Create a source gap for the weakest unsupported claim.';
  return [
    {
      id: `review-suggestion:${stableTinyHash(`promote:${supported?.claimId ?? 'none'}`)}`,
      label: 'Promote supported claim',
      action: 'promote_supported_claim',
      target: 'claim',
      evidenceIds: supported?.sourceIds ?? [],
      requiresHumanReview: true,
      prompt: 'Create a review card to promote this supported claim into canonical capsule context.',
    },
    {
      id: `review-suggestion:${stableTinyHash(`dispute:${disputed?.claimId ?? memory?.claimId ?? 'none'}`)}`,
      label: 'Mark disputed',
      action: 'mark_disputed',
      target: disputed ? 'claim' : 'memory_hit',
      evidenceIds: disputed?.sourceIds.length ? disputed.sourceIds : input.memoryReceipt.memoryIds,
      requiresHumanReview: true,
      prompt: 'Create a review card marking this claim or memory hit as disputed until better evidence is attached.',
    },
    {
      id: `review-suggestion:${stableTinyHash(`gap:${gap}`)}`,
      label: 'Create source gap',
      action: 'create_source_gap',
      target: 'source_gap',
      evidenceIds: input.sourceRefreshDocket.sourceIds,
      requiresHumanReview: true,
      prompt: gap,
    },
    {
      id: 'review-suggestion:save-as-memo',
      label: 'Save as memo',
      action: 'save_as_memo',
      target: 'memo',
      evidenceIds: input.sourceRefreshDocket.excerptSourceIds,
      requiresHumanReview: false,
      prompt: 'Save this answer as a memo draft while preserving sources, gaps, and grounding receipt metadata.',
    },
    {
      id: 'review-suggestion:create-output-capsule',
      label: 'Create output capsule',
      action: 'create_output_capsule',
      target: 'output_capsule',
      evidenceIds: input.sourceRefreshDocket.excerptSourceIds,
      requiresHumanReview: true,
      prompt: 'Create a review-gated Output Capsule preserving claim posture, source excerpts, memory receipt, and next repair actions.',
    },
  ];
}

function claimStatusForSupportLabel(label: SourceabilitySupportLabel): ClaimStatus {
  if (label === 'supported') return 'supported';
  if (label === 'weak') return 'weak';
  if (label === 'unsupported' || label === 'contradicted') return 'unsupported';
  return 'model_prior';
}

function confidenceForStatus(status: ClaimStatus): CapsuleClaimLedgerItem['confidence'] {
  if (status === 'supported') return 'high';
  if (status === 'weak') return 'medium';
  return 'low';
}

function nextGroundingRepairActions(input: {
  weakClaims: number;
  unsupportedClaims: number;
  staleClaims: number;
  memoryHitCount: number;
  needsRefresh: boolean;
}): string[] {
  const actions = [
    input.needsRefresh ? 'Refresh source-pack URLs or record source gaps for missing evidence.' : null,
    input.unsupportedClaims > 0 ? 'Attach sources or mark unsupported claims as open questions.' : null,
    input.weakClaims > 0 ? 'Promote only reviewed supported claims; keep weak claims visible.' : null,
    input.staleClaims > 0 ? 'Refresh stale source claims before external reliance.' : null,
    input.memoryHitCount > 0 ? 'Turn useful Cognee memory hits into review cards before canonical promotion.' : null,
  ].filter(isString);
  return actions.length ? actions : ['Review source excerpts before saving or exporting.'];
}

function isAssumptionClaim(claim: string): boolean {
  return /\b(should|could|would|recommend|recommendation|assume|assumption|likely|may|might|next|verify|check|consider)\b/i.test(claim);
}

function followUpsFor(intent: AskIntent, sourceCount: number, researchGraphReceiptCount = 0): string[] {
  const common = [
    'Check the weakest claim against attached sources.',
    'Turn this into a document pack for Memo Studio.',
    sourceCount > 0 ? 'Open the source previews and identify what is still missing.' : 'Find sources for the unsupported claims.',
  ];
  if (researchGraphReceiptCount > 0) {
    common.splice(2, 0, 'Promote Research graph candidates to a review-gated graph proposal.');
  }
  if (intent === 'research_memo') return ['Tighten this into an options memo.', ...common].slice(0, 4);
  if (intent === 'sourceability_review') return ['Repair the highest-risk citation gap.', ...common].slice(0, 4);
  if (intent === 'red_team_review') return ['Rewrite this after the strongest objection.', ...common].slice(0, 4);
  if (intent === 'handover') return ['Prepare a successor handover pack.', ...common].slice(0, 4);
  return ['What would change your assessment?', ...common].slice(0, 4);
}

function titleForPrompt(prompt: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'Ask PRAXIS document pack';
  return cleaned.length > 72 ? `${cleaned.slice(0, 69)}...` : cleaned;
}

function excerpt(value: string, maxLength: number): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function dedupeCards(cards: SourcePreviewCard[]): SourcePreviewCard[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}

function sourceabilityScore(claim: string, card: SourcePreviewCard): number {
  const claimTokens = tokenSet(claim);
  const sourceTokens = tokenSet([card.quotePreview, card.title, card.citationLabel, card.locatorLabel].filter(Boolean).join(' '));
  if (claimTokens.size === 0 || sourceTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of claimTokens) {
    if (sourceTokens.has(token)) overlap += 1;
  }
  return overlap / claimTokens.size;
}

function tokenSet(value: string): Set<string> {
  return new Set(value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token)));
}

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'that',
  'this',
  'with',
  'from',
  'into',
  'about',
  'are',
  'near',
  'not',
  'attached',
  'sources',
  'source',
  'claim',
  'separate',
]);

function locatorLabel(parts: Array<string | null | undefined>): string | undefined {
  const label = parts.filter(isString).join(' ');
  return label || undefined;
}

function receiptHref(sourceReceiptId: string): string {
  return `/app/library?receiptId=${encodeURIComponent(sourceReceiptId)}`;
}

function titleForResearchGraphSource(receipt: ResearchGraphReceipt, url: string): string {
  const entity = receipt.entityMatches[0]?.label;
  if (entity) return `${entity} research graph receipt`;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Research graph receipt';
  }
}

function researchGraphQuote(receipt: ResearchGraphReceipt): string {
  const signals = receipt.extractedSignals
    .slice(0, 3)
    .map((signal) => `${signal.label}: ${signal.value}`)
    .join(' ');
  if (signals) return excerpt(signals, 360);
  const matches = receipt.entityMatches
    .slice(0, 3)
    .map((match) => `${match.label} (${match.qid})`)
    .join(', ');
  if (matches) return `Entity grounding candidates: ${matches}.`;
  return receipt.caveats[0] ?? 'Research graph returned an advisory receipt.';
}

function extractionFallbackFor(status: string): string | undefined {
  if (status === 'extracted') return undefined;
  if (status === 'processing') return 'Extraction still processing';
  if (status === 'error') return 'Extraction failed';
  return 'Text extraction only';
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function stableTinyHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

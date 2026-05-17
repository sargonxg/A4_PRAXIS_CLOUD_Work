import type { CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import type { AskIntent } from '@/lib/ai/ask-conversation';
import type { MemoBlock } from '@/types/memo';

export type SourcePreviewType =
  | 'grounded-search'
  | 'uploaded-document'
  | 'corpus'
  | 'source-receipt'
  | 'document-digest'
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
  sourceCardIds: string[];
}

export interface AskAnswerEnvelope {
  style: {
    mode: 'claude_like_dialogue';
    paragraphShape: string;
    sourcePosture: 'always_visible';
  };
  sourceCards: SourcePreviewCard[];
  claimGrounding: ClaimGrounding[];
  followUps: string[];
  documentPackCandidate: ConversationDocumentPack;
}

export interface ConversationDocumentPack {
  title: string;
  prompt: string;
  answer: string;
  sourceCards: SourcePreviewCard[];
  gaps: string[];
  provenance: ConversationPackProvenance;
}

export interface ConversationPackProvenance {
  capsuleId?: string | null;
  capsuleVersion?: number | null;
  threadId?: string | null;
  model?: string | null;
  provider?: string | null;
  contextPackageId?: string | null;
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
}): AskAnswerEnvelope {
  const pack = buildConversationDocumentPack({
    title: titleForPrompt(input.prompt),
    prompt: input.prompt,
    answer: input.answer,
    sourceCards: input.sourceCards,
    gaps: input.gaps ?? [],
    provenance: input.provenance ?? {},
  });

  return {
    style: {
      mode: 'claude_like_dialogue',
      paragraphShape: 'thesis, evidence, caveat, next move',
      sourcePosture: 'always_visible',
    },
    sourceCards: input.sourceCards,
    claimGrounding: groundClaims(input.answer, input.sourceCards),
    followUps: followUpsFor(input.intent, input.sourceCards.length),
    documentPackCandidate: pack,
  };
}

export function buildConversationDocumentPack(input: {
  title: string;
  prompt: string;
  answer: string;
  sourceCards: SourcePreviewCard[];
  gaps?: string[];
  provenance?: ConversationPackProvenance;
}): ConversationDocumentPack {
  return {
    title: input.title.trim() || 'Ask PRAXIS document pack',
    prompt: input.prompt,
    answer: input.answer,
    sourceCards: input.sourceCards,
    gaps: input.gaps ?? [],
    provenance: {
      ...input.provenance,
      generatedAt: input.provenance?.generatedAt ?? new Date().toISOString(),
    },
  };
}

export function conversationDocumentPackToMemoBlocks(pack: ConversationDocumentPack): MemoBlock[] {
  const sourceReceiptIds = uniqueStrings(pack.sourceCards.map((card) => card.sourceReceiptId).filter(isString));
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
    pack.provenance.threadId ? `Thread: ${pack.provenance.threadId}` : null,
    pack.provenance.model ? `Model: ${pack.provenance.model}` : null,
    pack.provenance.provider ? `Provider: ${pack.provenance.provider}` : null,
    pack.provenance.contextPackageId ? `Context package: ${pack.provenance.contextPackageId}` : null,
    pack.provenance.generatedAt ? `Generated: ${pack.provenance.generatedAt}` : null,
  ].filter(isString);

  return [
    block('pack-heading', 'heading', pack.title, [], {}),
    block('pack-answer', 'paragraph', pack.answer || 'No answer text was captured.', citations, { prompt: pack.prompt }),
    block('pack-sources', 'bullets', '', citations, {}, 'Source previews', sourceItems),
    block('pack-gaps', 'bullets', '', [], {}, 'Gaps and review notes', gapItems),
    block('pack-provenance', 'bullets', '', [], {}, 'Provenance', provenance.length ? provenance : ['No provenance was attached.']),
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
    const matches = sourceCards
      .map((card) => ({ card, score: sourceabilityScore(claim, card) }))
      .filter((match) => match.score >= 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((match) => match.card.id);
    return {
      claim,
      grounding: matches.length > 0 ? 'source-backed' as const : 'unsupported' as const,
      sourceCardIds: matches,
    };
  });
}

function followUpsFor(intent: AskIntent, sourceCount: number): string[] {
  const common = [
    'Check the weakest claim against attached sources.',
    'Turn this into a document pack for Memo Studio.',
    sourceCount > 0 ? 'Open the source previews and identify what is still missing.' : 'Find sources for the unsupported claims.',
  ];
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

function extractionFallbackFor(status: string): string | undefined {
  if (status === 'extracted') return undefined;
  if (status === 'processing') return 'Extraction still processing';
  if (status === 'error') return 'Extraction failed';
  return 'Text extraction only';
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

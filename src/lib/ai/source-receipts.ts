import type { WebResearchResult } from '@/lib/ai/web-research';
import type { LiveSourcePack } from '@/lib/ai/live-source-pack';
import type {
  CanonicalSourceReceipt,
  SourceReceiptConfidence,
} from '@/types/source-receipt';

export type SourceReceipt = CanonicalSourceReceipt;
export type { SourceReceiptConfidence, SourceReceiptKind } from '@/types/source-receipt';

export interface SourceReceiptAudit {
  generatedAt: string;
  sourceCount: number;
  providerCounts: Record<string, number>;
  highReliabilityCount: number;
  checkableUrlCount: number;
  scrapedExcerptCount: number;
  structuredDataCount: number;
  confidence: SourceReceiptConfidence;
  gaps: string[];
  notes: string[];
}

export interface SourceReceiptBuildInput {
  results?: WebResearchResult[];
  scraped?: LiveSourcePack['scraped'];
  ucdp?: LiveSourcePack['ucdp'];
  gaps?: string[];
  generatedAt?: string;
}

export function buildSourceReceipts(input: SourceReceiptBuildInput): SourceReceipt[] {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const receipts: SourceReceipt[] = [];

  for (const result of input.results ?? []) {
    const sourceId = stableId(result.url || `${result.provider}:${result.source}:${result.title}`, 'src');
    const timestamp = result.retrievedAt ?? generatedAt;
    const excerpt = cleanExcerpt(result.snippet || result.content, 260);
    receipts.push({
      receiptId: stableId(`${sourceId}:${timestamp}:${result.query ?? ''}`, 'rcpt'),
      sourceId,
      name: result.source || result.provider,
      title: result.title || result.source || result.provider,
      url: result.url,
      provider: result.provider,
      source: result.source,
      kind: 'web-result',
      retrievalMethod: 'web_search',
      timestamp,
      publishedDate: result.publishedDate,
      query: result.query,
      reliabilityScore: clampReliability(result.reliabilityScore),
      confidence: confidenceForReliability(result.reliabilityScore, Boolean(result.url)),
      excerpt,
      contentHash: stableId([result.url, result.title, excerpt].filter(Boolean).join('|'), 'hash'),
      span: excerpt ? { quote: excerpt } : undefined,
    });
  }

  for (const scrape of input.scraped ?? []) {
    const sourceId = stableId(scrape.url || scrape.title || 'scraped-source', 'src');
    const excerpt = scrape.success ? cleanExcerpt(scrape.content, 260) : scrape.error;
    receipts.push({
      receiptId: stableId(`${sourceId}:${generatedAt}`, 'rcpt'),
      sourceId,
      name: scrape.title || hostFromUrl(scrape.url) || 'Scraped source',
      title: scrape.title || scrape.url,
      url: scrape.url,
      provider: 'firecrawl',
      source: hostFromUrl(scrape.url) || 'firecrawl',
      kind: 'scraped-excerpt',
      retrievalMethod: 'scrape',
      timestamp: generatedAt,
      reliabilityScore: scrape.success ? 0.78 : 0.35,
      confidence: scrape.success ? 'medium' : 'low',
      excerpt,
      contentHash: stableId([scrape.url, scrape.title, excerpt].filter(Boolean).join('|'), 'hash'),
      span: excerpt ? { quote: excerpt } : undefined,
    });
  }

  const ucdp = input.ucdp;
  if (ucdp?.conflicts.length || ucdp?.battleDeaths.length) {
    const sourceId = stableId('https://ucdp.uu.se/apidocs/', 'src');
    const excerpt = `${ucdp.conflicts.length} conflict record(s), ${ucdp.battleDeaths.length} battle-death trend row(s).`;
    receipts.push({
      receiptId: stableId(`${sourceId}:${generatedAt}`, 'rcpt'),
      sourceId,
      name: 'UCDP API',
      title: 'UCDP structured conflict data',
      url: 'https://ucdp.uu.se/apidocs/',
      provider: 'ucdp',
      source: 'ucdp.uu.se',
      kind: 'structured-data',
      retrievalMethod: 'structured_data',
      timestamp: generatedAt,
      reliabilityScore: 0.92,
      confidence: 'high',
      excerpt,
      contentHash: stableId(excerpt, 'hash'),
      span: { quote: excerpt },
    });
  }

  return dedupeReceipts(receipts).slice(0, 24);
}

export function summarizeSourceReceipts(receipts: SourceReceipt[], gaps: string[] = []): SourceReceiptAudit {
  const providerCounts: Record<string, number> = {};
  for (const receipt of receipts) {
    providerCounts[receipt.provider] = (providerCounts[receipt.provider] ?? 0) + 1;
  }

  const highReliabilityCount = receipts.filter((receipt) => receipt.reliabilityScore >= 0.85).length;
  const checkableUrlCount = receipts.filter((receipt) => Boolean(receipt.url && /^https?:\/\//i.test(receipt.url))).length;
  const scrapedExcerptCount = receipts.filter((receipt) => receipt.kind === 'scraped-excerpt' && receipt.excerpt).length;
  const structuredDataCount = receipts.filter((receipt) => receipt.kind === 'structured-data').length;
  const sourceCount = receipts.length;
  const confidence = sourceCount >= 5 && highReliabilityCount >= 2 && checkableUrlCount >= 4
    ? 'high'
    : sourceCount >= 3 && checkableUrlCount >= 2
      ? 'medium'
      : 'low';

  const notes: string[] = [];
  if (confidence === 'high') notes.push('Multiple checkable sources are available, including high-reliability records.');
  if (confidence === 'medium') notes.push('Source basis is usable but should be triangulated before high-stakes claims.');
  if (confidence === 'low') notes.push('Source basis is thin; outputs must clearly qualify uncertainty and request more evidence.');
  if (scrapedExcerptCount === 0) notes.push('No full-page scrape excerpt was available; source use may rely on snippets or grounded summaries.');
  if (structuredDataCount > 0) notes.push('Structured data is corroborating context, not a substitute for current source-linked reporting.');

  return {
    generatedAt: new Date().toISOString(),
    sourceCount,
    providerCounts,
    highReliabilityCount,
    checkableUrlCount,
    scrapedExcerptCount,
    structuredDataCount,
    confidence,
    gaps,
    notes,
  };
}

export function formatSourceReceiptAudit(audit: SourceReceiptAudit): string {
  const providers = Object.entries(audit.providerCounts)
    .map(([provider, count]) => `${provider}: ${count}`)
    .join(', ') || 'none';
  return [
    '### Source Receipt Audit',
    `Confidence: ${audit.confidence}`,
    `Checkable sources: ${audit.checkableUrlCount}/${audit.sourceCount}`,
    `High-reliability sources: ${audit.highReliabilityCount}`,
    `Providers: ${providers}`,
    audit.gaps.length ? `Gaps:\n${audit.gaps.map((gap) => `- ${gap}`).join('\n')}` : 'Gaps: none detected',
    `Notes:\n${audit.notes.map((note) => `- ${note}`).join('\n')}`,
  ].join('\n');
}

function dedupeReceipts(receipts: SourceReceipt[]): SourceReceipt[] {
  const seen = new Set<string>();
  const out: SourceReceipt[] = [];
  for (const receipt of receipts) {
    const key = (receipt.url || `${receipt.provider}:${receipt.title}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(receipt);
  }
  return out;
}

function confidenceForReliability(score: number, hasUrl: boolean): SourceReceiptConfidence {
  if (hasUrl && score >= 0.85) return 'high';
  if (hasUrl && score >= 0.65) return 'medium';
  return 'low';
}

function clampReliability(score: number): number {
  if (!Number.isFinite(score)) return 0.5;
  return Math.max(0, Math.min(1, score));
}

function cleanExcerpt(text: string | undefined, limit: number): string | undefined {
  const cleaned = text?.replace(/\s+/g, ' ').trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, limit);
}

function hostFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function stableId(input: string, prefix: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return `${prefix}_${hash.toString(36)}`;
}

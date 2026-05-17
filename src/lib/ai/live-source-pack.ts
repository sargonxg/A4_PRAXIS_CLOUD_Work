import { executeWebResearch, SEARCH_FAILURE_WARNING, type WebResearchResult } from '@/lib/ai/web-research';
import { scrapeUrl } from '@/lib/ai/grounded-research';
import {
  buildSourceReceipts,
  formatSourceReceiptAudit,
  summarizeSourceReceipts,
  type SourceReceipt,
  type SourceReceiptAudit,
} from '@/lib/ai/source-receipts';

export interface LiveSourcePackInput {
  uid: string;
  situationName: string;
  query: string;
  toolId: string;
  region?: string;
  actors?: string[];
  description?: string;
  maxResults?: number;
  scrapeTop?: number;
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
}

export interface LiveSourcePack {
  query: string;
  generatedAt: string;
  results: WebResearchResult[];
  scraped: Array<{
    url: string;
    title: string;
    content: string;
    success: boolean;
    error?: string;
  }>;
  sourceReceipts: SourceReceipt[];
  sourceAudit: SourceReceiptAudit;
  gaps: string[];
  formatted: string;
}

function cleanExcerpt(text: string, limit: number): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, limit);
}

function formatSources(results: WebResearchResult[]): string {
  if (!results.length) return SEARCH_FAILURE_WARNING;
  return results
    .slice(0, 10)
    .map((r, i) => {
      const date = r.publishedDate ? ` (${r.publishedDate})` : '';
      const excerpt = cleanExcerpt(r.snippet || r.content, 420);
      return `[S${i + 1}] ${r.title} — ${r.source}${date}\nURL: ${r.url}\nProvider: ${r.provider}; reliability: ${r.reliabilityScore.toFixed(2)}\n${excerpt}`;
    })
    .join('\n\n');
}

function formatScrapes(scraped: LiveSourcePack['scraped']): string {
  const usable = scraped.filter((s) => s.success && s.content.trim().length > 0);
  if (!usable.length) return '';
  return usable
    .slice(0, 4)
    .map((s, i) => `[X${i + 1}] ${s.title}\nURL: ${s.url}\n${cleanExcerpt(s.content, 900)}`)
    .join('\n\n');
}

export async function buildLiveSourcePack(input: LiveSourcePackInput): Promise<LiveSourcePack> {
  const generatedAt = new Date().toISOString();
  const maxResults = Math.max(3, Math.min(input.maxResults ?? 10, 20));
  const scrapeTop = Math.max(0, Math.min(input.scrapeTop ?? 2, 5));

  const results = await executeWebResearch(input.query, input.situationName, input.uid, {
    toolId: input.toolId,
    actors: input.actors,
    description: input.description,
    region: input.region,
    maxResults,
    includeContent: true,
    timeRange: input.timeRange,
  }).catch(() => []);

  const scrapeCandidates = results
    .filter((r) => r.url && /^https?:\/\//i.test(r.url) && !r.url.includes('google.com/search'))
    .slice(0, scrapeTop);
  const scraped = await Promise.all(scrapeCandidates.map(async (r) => {
    const out = await scrapeUrl(r.url).catch((err) => ({
      url: r.url,
      title: r.title,
      content: '',
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }));
    return {
      url: out.url,
      title: out.title || r.title,
      content: out.content || '',
      success: Boolean(out.success),
      error: out.error,
    };
  }));

  const gaps: string[] = [];
  if (!results.length) gaps.push('No grounded web search results were available.');
  if (!scraped.some((s) => s.success)) gaps.push('No full-page scrape text was available; using result snippets only.');

  const sourceReceipts = buildSourceReceipts({
    results,
    scraped,
    gaps,
    generatedAt,
  });
  const sourceAudit = summarizeSourceReceipts(sourceReceipts, gaps);

  const sourceBlock = formatSources(results);
  const scrapeBlock = formatScrapes(scraped);
  const gapBlock = gaps.length ? `\n\n### Live Source Gaps\n${gaps.map((g) => `- ${g}`).join('\n')}` : '';
  const receiptAuditBlock = formatSourceReceiptAudit(sourceAudit);

  const formatted = `### Live Source Pack
Generated: ${generatedAt}
Query: ${input.query}

### Grounded Search Results
${sourceBlock}
${scrapeBlock ? `\n\n### Scraped Source Excerpts\n${scrapeBlock}` : ''}

${receiptAuditBlock}${gapBlock}

Instruction: Use this pack as the primary live evidence layer. Cite [S#] or [X#] for factual claims. If the pack is thin, state the limitation instead of filling gaps from memory.`;

  return {
    query: input.query,
    generatedAt,
    results,
    scraped,
    sourceReceipts,
    sourceAudit,
    gaps,
    formatted,
  };
}

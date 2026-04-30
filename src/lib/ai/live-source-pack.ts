import { executeWebResearch, SEARCH_FAILURE_WARNING, type WebResearchResult } from '@/lib/ai/web-research';
import { scrapeUrl } from '@/lib/ai/firecrawl';
import { getBattleDeaths, getConflicts, type UCDPConflict } from '@/lib/data-feeds/ucdp-client';
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
  ucdp: {
    configured: boolean;
    conflicts: UCDPConflict[];
    battleDeaths: Array<{ year: number; bestDeaths: number; lowDeaths: number; highDeaths: number }>;
  };
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

function formatUcdp(conflicts: UCDPConflict[], deaths: LiveSourcePack['ucdp']['battleDeaths']): string {
  if (!conflicts.length && !deaths.length) return '';
  const conflictLines = conflicts
    .slice(0, 6)
    .map((c) => `- ${c.conflict_name || `${c.side_a} / ${c.side_b}`}: ${c.location}; ${c.side_a} vs ${c.side_b}; intensity ${c.intensity_level}; start ${c.start_date}${c.ep_end_date ? `; ended ${c.ep_end_date}` : ''}.`)
    .join('\n');
  const deathLines = deaths
    .slice(-6)
    .map((d) => `- ${d.year}: best ${d.bestDeaths}, low ${d.lowDeaths}, high ${d.highDeaths}`)
    .join('\n');

  return [
    '### UCDP Structured Corroboration',
    'Use UCDP as historical/structured corroboration. Do not treat it as a substitute for current source-linked reporting.',
    conflictLines ? `Conflicts:\n${conflictLines}` : '',
    deathLines ? `Battle-related deaths trend:\n${deathLines}` : '',
  ].filter(Boolean).join('\n');
}

export async function buildLiveSourcePack(input: LiveSourcePackInput): Promise<LiveSourcePack> {
  const generatedAt = new Date().toISOString();
  const country = input.region || input.situationName;
  const maxResults = Math.max(3, Math.min(input.maxResults ?? 10, 20));
  const scrapeTop = Math.max(0, Math.min(input.scrapeTop ?? 2, 5));

  const [results, conflicts, battleDeaths] = await Promise.all([
    executeWebResearch(input.query, input.situationName, input.uid, {
      toolId: input.toolId,
      actors: input.actors,
      description: input.description,
      region: input.region,
      maxResults,
      includeContent: true,
      timeRange: input.timeRange,
    }).catch(() => []),
    getConflicts(country).catch(() => []),
    getBattleDeaths(country).catch(() => []),
  ]);

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
  if (!conflicts.length && !battleDeaths.length) gaps.push('No UCDP structured records matched this region/name.');

  const sourceReceipts = buildSourceReceipts({
    results,
    scraped,
    ucdp: {
      configured: Boolean(process.env.UCDP_API_TOKEN || process.env.UCDP_ACCESS_TOKEN),
      conflicts,
      battleDeaths,
    },
    gaps,
    generatedAt,
  });
  const sourceAudit = summarizeSourceReceipts(sourceReceipts, gaps);

  const sourceBlock = formatSources(results);
  const scrapeBlock = formatScrapes(scraped);
  const ucdpBlock = formatUcdp(conflicts, battleDeaths);
  const gapBlock = gaps.length ? `\n\n### Live Source Gaps\n${gaps.map((g) => `- ${g}`).join('\n')}` : '';
  const receiptAuditBlock = formatSourceReceiptAudit(sourceAudit);

  const formatted = `### Live Source Pack
Generated: ${generatedAt}
Query: ${input.query}

### Grounded Search Results
${sourceBlock}
${scrapeBlock ? `\n\n### Scraped Source Excerpts\n${scrapeBlock}` : ''}
${ucdpBlock ? `\n\n${ucdpBlock}` : ''}

${receiptAuditBlock}${gapBlock}

Instruction: Use this pack as the primary live evidence layer. Cite [S#] or [X#] for factual claims. If the pack is thin, state the limitation instead of filling gaps from memory.`;

  return {
    query: input.query,
    generatedAt,
    results,
    scraped,
    ucdp: {
      configured: Boolean(process.env.UCDP_API_TOKEN || process.env.UCDP_ACCESS_TOKEN),
      conflicts,
      battleDeaths,
    },
    sourceReceipts,
    sourceAudit,
    gaps,
    formatted,
  };
}

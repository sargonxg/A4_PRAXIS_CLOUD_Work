import { executeWebResearch, type WebResearchResult } from '@/lib/ai/web-research';

export interface WebSearchResult {
  title: string;
  url: string;
  description?: string;
  content: string;
  publishedDate?: string;
  provider?: string;
  success: boolean;
  error?: string;
}

export function isGroundedSearchConfigured(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_VERTEX_PROJECT);
}

export async function searchWeb(
  query: string,
  options: { numResults?: number; region?: string; timeRange?: 'day' | 'week' | 'month' | 'year' | 'all' } = {},
): Promise<WebSearchResult[]> {
  const results = await executeWebResearch(query, options.region ?? '', 'system', {
    maxResults: options.numResults ?? 5,
    region: options.region,
    timeRange: options.timeRange,
  });
  return results.map(fromResearchResult);
}

export async function scrapeUrl(url: string): Promise<WebSearchResult> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const content = await res.text();
  return {
    title: url,
    url,
    description: content.slice(0, 300),
    content: content.slice(0, 25000),
    provider: 'direct-fetch',
    success: true,
  };
}

export async function scrapeMultiple(urls: string[]): Promise<WebSearchResult[]> {
  const settled = await Promise.allSettled(urls.map((url) => scrapeUrl(url)));
  return settled
    .filter((item): item is PromiseFulfilledResult<WebSearchResult> => item.status === 'fulfilled')
    .map((item) => item.value);
}

export function formatResultsAsContext(results: WebSearchResult[]): string {
  return results
    .map((result, index) => {
      const title = result.title || result.url;
      const body = result.content || result.description || '';
      return `[${index + 1}] ${title}\nURL: ${result.url}\n${body}`;
    })
    .join('\n\n');
}

function fromResearchResult(result: WebResearchResult): WebSearchResult {
  return {
    title: result.title,
    url: result.url,
    description: result.snippet,
    content: result.content || result.snippet || '',
    publishedDate: result.publishedDate,
    provider: result.provider,
    success: true,
  };
}

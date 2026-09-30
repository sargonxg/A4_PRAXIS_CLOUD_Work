import { executeWebResearch, type WebResearchResult, type GeneratedGroundingSegment } from '@/lib/ai/web-research';
import { fetchOriginalSource, type OriginalSourceCapture } from '@/lib/ai/source-passage';

export interface WebSearchResult extends Partial<OriginalSourceCapture> {
  title: string;
  url: string;
  description?: string;
  content: string;
  publishedDate?: string;
  provider?: string;
  success: boolean;
  error?: string;
  generatedGroundingSegments?: GeneratedGroundingSegment[];
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
  // Generated research overviews are useful prose, not independent citations.
  return results.filter((result) => !result.isGroundedSummary).map(fromResearchResult);
}

export async function scrapeUrl(url: string): Promise<WebSearchResult> {
  const capture = await fetchOriginalSource(url);
  const content = capture.originalPassages.map((passage) => passage.text).join('\n');
  return {
    title: url,
    url,
    description: content.slice(0, 300),
    content,
    provider: 'direct-fetch',
    success: capture.originalPassageStatus === 'retrieved',
    error: capture.unavailableReason,
    ...capture,
  };
}

export async function scrapeMultiple(urls: string[]): Promise<WebSearchResult[]> {
  const settled = await Promise.allSettled(urls.slice(0, 5).map((url) => scrapeUrl(url)));
  return settled
    .filter((item): item is PromiseFulfilledResult<WebSearchResult> => item.status === 'fulfilled')
    .map((item) => item.value);
}

export function formatResultsAsContext(results: WebSearchResult[]): string {
  return results
    .map((result, index) => {
      const title = result.title || result.url;
      const body = result.content || '';
      const status = result.originalPassageStatus ?? 'unavailable';
      const generated = result.generatedGroundingSegments?.map((segment) => segment.text).join('\n') ?? '';
      const locators = result.originalPassages?.map((passage) => passage.locator).join(', ') ?? 'none';
      return `[${index + 1}] ${title}\nURL: ${result.finalUrl ?? result.url}\nOriginal passage: ${status}${result.unavailableReason ? ` (${result.unavailableReason})` : ''}\nPublisher: ${result.publisher ?? 'unknown'}; authority: ${result.authority ?? 'unknown'} (host classification, not claim verification)\nPublished: ${result.publishedDate ?? 'unknown'}; captured extracted-text locator: ${locators}\n${body}${generated ? `\nGenerated grounding segments (not original quotations; claim support unverified):\n${generated}` : ''}`;
    })
    .join('\n\n');
}

function fromResearchResult(result: WebResearchResult): WebSearchResult {
  return {
    title: result.title,
    url: result.url,
    description: result.snippet,
    content: result.content || '',
    publishedDate: result.publishedDate,
    provider: result.provider,
    success: true,
    originalPassageStatus: result.originalPassageStatus,
    originalPassages: result.originalPassages,
    unavailableReason: result.unavailableReason,
    generatedGroundingSegments: result.generatedGroundingSegments,
    publisher: result.publisher,
    authority: result.authority,
    finalUrl: result.finalUrl,
    truncated: result.truncated,
  };
}

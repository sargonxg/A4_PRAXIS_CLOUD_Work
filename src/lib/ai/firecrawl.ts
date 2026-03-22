/**
 * Firecrawl Web Intelligence Service for PRAXIS
 *
 * Replaces Google Search grounding with full-page web crawling.
 * Returns clean markdown content from any URL, handles JS rendering,
 * and provides structured web search results.
 */

import FirecrawlApp from '@mendable/firecrawl-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;          // Full markdown content of the page
  publishedDate?: string;
  description?: string;
}

export interface ScrapeResult {
  url: string;
  content: string;          // Clean markdown
  title?: string;
  description?: string;
  success: boolean;
  error?: string;
}

export interface SearchOptions {
  numResults?: number;
  lang?: string;
  country?: string;
}

// ---------------------------------------------------------------------------
// In-memory cache (15-min TTL)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 15 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const scrapeCache = new Map<string, CacheEntry<ScrapeResult>>();
const searchCache = new Map<string, CacheEntry<WebSearchResult[]>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
  // Prevent unbounded cache growth
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

// ---------------------------------------------------------------------------
// Firecrawl client
// ---------------------------------------------------------------------------

function getClient(): FirecrawlApp | null {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.warn('[firecrawl] FIRECRAWL_API_KEY not set — web research unavailable');
    return null;
  }
  return new FirecrawlApp({ apiKey });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search the web for a query and return results with full page content.
 * Returns empty array if Firecrawl is unavailable.
 */
export async function searchWeb(
  query: string,
  options: SearchOptions = {}
): Promise<WebSearchResult[]> {
  const cacheKey = `${query}:${options.numResults || 5}`;
  const cached = getCached(searchCache, cacheKey);
  if (cached) return cached;

  const client = getClient();
  if (!client) return [];

  try {
    const numResults = options.numResults || 5;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await client.search(query, {
      limit: numResults,
      scrapeOptions: {
        formats: ['markdown'],
      },
    });

    if (!response.success || !response.data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: WebSearchResult[] = (response.data as any[])
      .filter((r) => r.markdown || r.url)
      .map((r) => ({
        title: r.title || r.url || '',
        url: r.url || '',
        content: (r.markdown || r.description || '').slice(0, 8000),
        publishedDate: r.publishedDate,
        description: r.description || '',
      }));

    setCache(searchCache, cacheKey, results);
    return results;
  } catch (err) {
    console.error('[firecrawl] Search failed:', err);
    return [];
  }
}

/**
 * Scrape a single URL and return clean markdown content.
 */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const cached = getCached(scrapeCache, url);
  if (cached) return cached;

  const client = getClient();
  if (!client) {
    return { url, content: '', success: false, error: 'Firecrawl not configured' };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await client.scrape(url, {
      formats: ['markdown'],
    });

    if (!response.success) {
      return { url, content: '', success: false, error: 'Scrape failed' };
    }

    const result: ScrapeResult = {
      url,
      content: (response.markdown || '').slice(0, 15000),
      title: response.metadata?.title || '',
      description: response.metadata?.description || '',
      success: true,
    };

    setCache(scrapeCache, url, result);
    return result;
  } catch (err) {
    console.error('[firecrawl] Scrape failed for', url, err);
    return { url, content: '', success: false, error: String(err) };
  }
}

/**
 * Scrape multiple URLs in parallel with error handling.
 * Returns results in the same order as input URLs.
 */
export async function scrapeMultiple(urls: string[]): Promise<ScrapeResult[]> {
  return Promise.all(urls.map((url) => scrapeUrl(url)));
}

/**
 * Check if Firecrawl is configured (API key present).
 */
export function isFirecrawlConfigured(): boolean {
  return !!process.env.FIRECRAWL_API_KEY;
}

/**
 * Format search results as context for an AI prompt.
 * Produces a condensed markdown block suitable for injection into system prompts.
 */
export function formatResultsAsContext(results: WebSearchResult[]): string {
  if (results.length === 0) return '';

  return results
    .map((r, i) => {
      const date = r.publishedDate ? ` (${r.publishedDate})` : '';
      const content = r.content.slice(0, 3000);
      return `### Source ${i + 1}: ${r.title}${date}\nURL: ${r.url}\n\n${content}`;
    })
    .join('\n\n---\n\n');
}

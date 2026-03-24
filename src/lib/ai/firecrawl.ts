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
  if (!client) {
    // Fallback: use free Wikipedia + GDELT APIs when Firecrawl is not configured
    return searchFreeApis(query, options);
  }

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

// ---------------------------------------------------------------------------
// Free API fallback (Wikipedia + GDELT) when Firecrawl is not configured
// ---------------------------------------------------------------------------

async function searchWikipedia(query: string, limit = 3): Promise<WebSearchResult[]> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&format=json&origin=*`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const results: WebSearchResult[] = [];

    for (const item of data?.query?.search || []) {
      // Fetch the page extract for content
      const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
      try {
        const extractRes = await fetch(extractUrl, { signal: AbortSignal.timeout(5000) });
        const extractData = await extractRes.json();
        const pages = extractData?.query?.pages || {};
        const page = Object.values(pages)[0] as { extract?: string } | undefined;
        results.push({
          title: item.title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
          content: (page?.extract || item.snippet?.replace(/<[^>]*>/g, '') || '').slice(0, 5000),
          description: item.snippet?.replace(/<[^>]*>/g, '') || '',
        });
      } catch {
        results.push({
          title: item.title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
          content: item.snippet?.replace(/<[^>]*>/g, '') || '',
          description: item.snippet?.replace(/<[^>]*>/g, '') || '',
        });
      }
    }
    return results;
  } catch (err) {
    console.warn('[wikipedia] Search failed:', err);
    return [];
  }
}

async function searchGDELT(query: string, limit = 3): Promise<WebSearchResult[]> {
  try {
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=${limit}&format=json&sort=DateDesc`;
    const res = await fetch(gdeltUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.articles || []).map((a: { title?: string; url?: string; seendate?: string; domain?: string; sourcecountry?: string }) => ({
      title: a.title || 'Untitled',
      url: a.url || '',
      content: `${a.title || ''} — Source: ${a.domain || 'Unknown'}, Country: ${a.sourcecountry || 'Unknown'}`,
      publishedDate: a.seendate ? `${a.seendate.slice(0, 4)}-${a.seendate.slice(4, 6)}-${a.seendate.slice(6, 8)}` : undefined,
      description: `${a.domain || 'Unknown source'} — ${a.sourcecountry || ''}`,
    }));
  } catch (err) {
    console.warn('[gdelt] Search failed:', err);
    return [];
  }
}

async function searchFreeApis(query: string, options: SearchOptions = {}): Promise<WebSearchResult[]> {
  const limit = options.numResults || 5;
  const wikiLimit = Math.min(3, limit);
  const gdeltLimit = Math.max(2, limit - wikiLimit);

  const [wikiResults, gdeltResults] = await Promise.all([
    searchWikipedia(query, wikiLimit),
    searchGDELT(query, gdeltLimit),
  ]);

  const results = [...wikiResults, ...gdeltResults];
  setCache(searchCache, `${query}:${limit}`, results);
  return results;
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

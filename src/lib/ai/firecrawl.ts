/**
 * Firecrawl Web Intelligence Service for PRAXIS
 *
 * Premium web intelligence with free fallbacks. When FIRECRAWL_API_KEY is
 * configured it searches and scrapes full-page markdown from JS-rendered sites.
 * Without a key it falls back to Wikipedia, GDELT, and native fetch so free
 * users still get useful web context.
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

type FirecrawlSearchItem = {
  title?: string;
  url?: string;
  markdown?: string;
  content?: string;
  description?: string;
  publishedDate?: string;
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
  };
};

type FirecrawlScrapeResponse = {
  success?: boolean;
  markdown?: string;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string;
      description?: string;
      sourceURL?: string;
    };
  };
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
  };
};

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
    const response = await client.search(query, {
      limit: numResults,
      scrapeOptions: {
        formats: ['markdown'],
      },
    }) as unknown as { success?: boolean; data?: FirecrawlSearchItem[] | { web?: FirecrawlSearchItem[]; news?: FirecrawlSearchItem[]; images?: FirecrawlSearchItem[] } };

    if (!response.success || !response.data) return [];

    const items = Array.isArray(response.data)
      ? response.data
      : [...(response.data.web ?? []), ...(response.data.news ?? [])];

    const results: WebSearchResult[] = items
      .filter((r) => r.markdown || r.url)
      .map((r) => ({
        title: r.title || r.metadata?.title || r.url || r.metadata?.sourceURL || '',
        url: r.url || r.metadata?.sourceURL || '',
        content: (r.markdown || r.content || r.description || '').slice(0, 8000),
        publishedDate: r.publishedDate,
        description: r.description || r.metadata?.description || '',
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
 * Falls back to free alternatives when Firecrawl is not configured:
 *  - Wikipedia URLs → Wikipedia REST API (full article extract)
 *  - Any URL → native fetch() + HTML stripping
 */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const cached = getCached(scrapeCache, url);
  if (cached) return cached;

  const client = getClient();
  if (!client) {
    // Free fallbacks — no Firecrawl required
    const result = await scrapeUrlFree(url);
    if (result.success) setCache(scrapeCache, url, result);
    return result;
  }

  try {
    const response = await client.scrape(url, {
      formats: ['markdown'],
    }) as unknown as FirecrawlScrapeResponse;

    if (!response.success) {
      // Firecrawl failed — try free fallback
      return scrapeUrlFree(url);
    }

    const markdown = response.data?.markdown ?? response.markdown ?? '';
    const metadata = response.data?.metadata ?? response.metadata;

    const result: ScrapeResult = {
      url: metadata?.sourceURL || url,
      content: markdown.slice(0, 15000),
      title: metadata?.title || '',
      description: metadata?.description || '',
      success: true,
    };

    setCache(scrapeCache, url, result);
    return result;
  } catch (err) {
    console.error('[firecrawl] Scrape failed for', url, '— trying free fallback:', err);
    return scrapeUrlFree(url);
  }
}

/**
 * Free URL scraper — no API key required.
 * Wikipedia → REST API for clean article text.
 * Any other URL → native fetch + HTML tag stripping.
 */
async function scrapeUrlFree(url: string): Promise<ScrapeResult> {
  try {
    // Wikipedia: use the REST API for clean plain-text extract
    const wikiMatch = url.match(/wikipedia\.org\/wiki\/([^#?]+)/);
    if (wikiMatch) {
      const title = decodeURIComponent(wikiMatch[1]);
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&exsectionformat=plain&titles=${encodeURIComponent(title)}&format=json&origin=*`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const data = await res.json();
        const pages = data?.query?.pages || {};
        const page = Object.values(pages)[0] as { title?: string; extract?: string } | undefined;
        if (page?.extract) {
          const result: ScrapeResult = {
            url,
            content: page.extract.slice(0, 12000),
            title: page.title || title,
            description: page.extract.slice(0, 300),
            success: true,
          };
          return result;
        }
      }
    }

    // General URL: fetch + strip HTML tags
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'PRAXIS/3.10 TACITUS (+https://praxis.tacitus.me)' },
    });
    if (!res.ok) return { url, content: '', success: false, error: `HTTP ${res.status}` };

    const html = await res.text();

    // Strip scripts, styles, nav, footer — keep main content
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')             // strip all remaining tags
      .replace(/&[a-z]+;/gi, ' ')           // decode common HTML entities to space
      .replace(/\s{2,}/g, ' ')              // collapse whitespace
      .trim();

    // Extract title from <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    if (!cleaned || cleaned.length < 100) {
      return { url, content: '', success: false, error: 'No content extracted' };
    }

    return {
      url,
      content: cleaned.slice(0, 12000),
      title,
      description: cleaned.slice(0, 300),
      success: true,
    };
  } catch (err) {
    console.warn('[scrapeUrlFree] Failed for', url, err);
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

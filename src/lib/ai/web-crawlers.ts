/**
 * Unified web crawler interface for PRAXIS.
 * Supports Firecrawl and Parallel.ai with automatic fallback.
 *
 * Engine selection:
 *   - 'auto'      → Firecrawl if configured, else Parallel, else free fallback
 *   - 'firecrawl' → Firecrawl only (falls through to free APIs if unconfigured)
 *   - 'parallel'  → Parallel only
 *   - 'both'      → Run both in parallel, merge and deduplicate results
 */
import { searchWeb, scrapeUrl, isFirecrawlConfigured, type WebSearchResult } from './firecrawl';
import { parallelSearch, parallelExtract, parallelResearchTask, isParallelConfigured } from './parallel';

export type CrawlerEngine = 'auto' | 'firecrawl' | 'parallel' | 'both';

export interface CrawlerOptions {
  engine?: CrawlerEngine;
  numResults?: number;
}

export function getAvailableCrawlers(): { firecrawl: boolean; parallel: boolean } {
  return {
    firecrawl: isFirecrawlConfigured(),
    parallel: isParallelConfigured(),
  };
}

/**
 * Unified search across crawlers. Returns merged, deduplicated results.
 */
export async function unifiedSearch(
  query: string,
  options: CrawlerOptions = {}
): Promise<WebSearchResult[]> {
  const { engine = 'auto', numResults = 5 } = options;
  const available = getAvailableCrawlers();

  const useFirecrawl =
    engine === 'firecrawl' ||
    engine === 'both' ||
    (engine === 'auto' && available.firecrawl);

  const useParallel =
    engine === 'parallel' ||
    engine === 'both' ||
    (engine === 'auto' && available.parallel && !available.firecrawl);

  const promises: Promise<WebSearchResult[]>[] = [];

  if (useFirecrawl) {
    promises.push(searchWeb(query, { numResults }).catch(() => []));
  }

  if (useParallel) {
    promises.push(
      parallelSearch(query, { numResults })
        .then((results) =>
          results.map((r) => ({
            title: r.title,
            url: r.url,
            content: r.excerpt || '',
            description: r.excerpt || '',
          }))
        )
        .catch(() => [])
    );
  }

  if (promises.length === 0) {
    // Fallback to Firecrawl's free API fallback (Wikipedia + GDELT)
    return searchWeb(query, { numResults });
  }

  const allResults = (await Promise.all(promises)).flat();

  // Deduplicate by URL
  const seen = new Set<string>();
  return allResults.filter((r) => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

/**
 * Unified URL scraping — tries Parallel Extract first, falls back to Firecrawl scrape.
 */
export async function unifiedScrape(
  url: string,
  options: CrawlerOptions = {}
): Promise<{ content: string; success: boolean }> {
  const available = getAvailableCrawlers();
  const { engine = 'auto' } = options;

  const useParallel =
    engine === 'parallel' ||
    engine === 'both' ||
    (engine === 'auto' && available.parallel);

  if (useParallel) {
    try {
      const content = await parallelExtract(url);
      if (content) return { content, success: true };
    } catch {
      // Fall through to Firecrawl
    }
  }

  const result = await scrapeUrl(url);
  return { content: result.content, success: result.success };
}

/**
 * Deep research using the best available crawler.
 * Prefers Parallel's Task API for structured research with citations,
 * falls back to Firecrawl search + concatenation.
 */
export async function unifiedResearch(
  task: string,
  options: CrawlerOptions = {}
): Promise<{ content: string; sources: { title: string; url: string }[] }> {
  const available = getAvailableCrawlers();
  const { engine = 'auto' } = options;

  const useParallel =
    engine === 'parallel' ||
    engine === 'both' ||
    (engine === 'auto' && available.parallel);

  if (useParallel) {
    try {
      const result = await parallelResearchTask(task);
      if (result) {
        // parallelResearchTask returns { result, citations, confidence }
        const content =
          typeof result.result === 'string'
            ? result.result
            : JSON.stringify(result.result, null, 2);
        return {
          content,
          sources: (result.citations || []).map((c) => ({
            title: c.title || c.url,
            url: c.url,
          })),
        };
      }
    } catch {
      // Fall through to Firecrawl
    }
  }

  // Fallback: Firecrawl search and concatenate
  const results = await searchWeb(task, { numResults: 5 });
  return {
    content: results.map((r) => `## ${r.title}\n${r.content}`).join('\n\n---\n\n'),
    sources: results.map((r) => ({ title: r.title, url: r.url })),
  };
}

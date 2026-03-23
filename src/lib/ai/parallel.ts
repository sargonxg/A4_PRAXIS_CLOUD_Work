/**
 * Parallel AI integration for PRAXIS
 *
 * Parallel provides advanced web research capabilities:
 * - Search API: natural language web search with LLM-optimized excerpts
 * - Extract API: clean markdown from any URL
 * - Task API: structured research with citations and confidence levels
 *
 * Requires PARALLEL_API_KEY env var.
 * Falls back to Firecrawl if not configured.
 */

let parallelClient: unknown = null;

function getClient() {
  if (parallelClient) return parallelClient;

  const apiKey = process.env.PARALLEL_API_KEY;
  if (!apiKey) return null;

  try {
    // Dynamic import to avoid build errors when not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Parallel } = require('parallel-web');
    parallelClient = new Parallel({ apiKey });
    return parallelClient;
  } catch {
    console.warn('[parallel] parallel-web SDK not available');
    return null;
  }
}

export function isParallelConfigured(): boolean {
  return !!process.env.PARALLEL_API_KEY;
}

/**
 * Search the web using Parallel's Search API.
 * Returns LLM-optimized excerpts with source URLs.
 */
export async function parallelSearch(
  query: string,
  options?: { mode?: 'fast' | 'research'; numResults?: number }
): Promise<{ title: string; url: string; excerpt: string; }[]> {
  const client = getClient() as { beta?: { search: (opts: Record<string, unknown>) => Promise<{ results: { title: string; url: string; excerpt: string }[] }> } } | null;
  if (!client?.beta?.search) return [];

  try {
    const result = await client.beta.search({
      objective: query,
      search_queries: [query],
      mode: options?.mode || 'fast',
      max_results: options?.numResults || 5,
    });

    return (result.results || []).map((r: { title?: string; url?: string; excerpt?: string }) => ({
      title: r.title || 'Untitled',
      url: r.url || '',
      excerpt: r.excerpt || '',
    }));
  } catch (err) {
    console.error('[parallel] Search failed:', err);
    return [];
  }
}

/**
 * Extract clean content from a URL using Parallel's Extract API.
 */
export async function parallelExtract(url: string): Promise<string | null> {
  const client = getClient() as { beta?: { extract: (opts: Record<string, unknown>) => Promise<{ content: string }> } } | null;
  if (!client?.beta?.extract) return null;

  try {
    const result = await client.beta.extract({ url, mode: 'full' });
    return result.content || null;
  } catch (err) {
    console.error('[parallel] Extract failed:', err);
    return null;
  }
}

/**
 * Run a structured research task using Parallel's Task API.
 * Returns structured output with citations and confidence levels.
 */
export async function parallelResearchTask(
  task: string,
  options?: { output_schema?: Record<string, unknown> }
): Promise<{ result: unknown; citations: { url: string; title: string }[]; confidence: number } | null> {
  const client = getClient() as { beta?: { task: (opts: Record<string, unknown>) => Promise<{ result: unknown; citations: { url: string; title: string }[]; confidence: number }> } } | null;
  if (!client?.beta?.task) return null;

  try {
    const result = await client.beta.task({
      task,
      ...(options?.output_schema ? { output_schema: options.output_schema } : {}),
    });
    return {
      result: result.result,
      citations: result.citations || [],
      confidence: result.confidence || 0,
    };
  } catch (err) {
    console.error('[parallel] Task failed:', err);
    return null;
  }
}

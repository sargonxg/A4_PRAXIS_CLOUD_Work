/**
 * Wikipedia enrichment client.
 *
 * Authored 2026-04-26 round 4. The user asked for Conflict Graph and
 * Timeline generation to be solidly Wikipedia-backed (in addition to the
 * sources the analyst supplies). Wikipedia is the highest-quality open
 * baseline for entities, dates, and structural relationships in
 * geopolitical situations — the REST API is unauthenticated, fast, and
 * permissively licensed (CC-BY-SA 4.0).
 *
 * Endpoints used:
 *   GET /api/rest_v1/page/summary/{title}     — summary card.
 *   GET /api/rest_v1/page/related/{title}     — related entities.
 *   GET /w/api.php?action=opensearch&search=  — title search.
 *
 * Caller is the calibrated AI route. Pass the resulting summary text
 * + related links into the model's prompt as an explicit `## WIKIPEDIA
 * BACKGROUND` block. ALWAYS cite by URL when claims rely on it.
 *
 * Spec: docs/specs/2026-04-26-improvements/EE-wikipedia-enrichment.md.
 */

const SUMMARY_URL = (lang: string, title: string) =>
  `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
const RELATED_URL = (lang: string, title: string) =>
  `https://${lang}.wikipedia.org/api/rest_v1/page/related/${encodeURIComponent(title)}`;
const SEARCH_URL = (lang: string, query: string) =>
  `https://${lang}.wikipedia.org/w/api.php?action=opensearch&format=json&limit=5&search=${encodeURIComponent(query)}`;

export interface WikipediaSummary {
  title: string;
  /** Canonical Wikipedia URL — cite this. */
  url: string;
  /** First-paragraph plain-text extract (~250 words). */
  extract: string;
  /** Optional thumbnail URL. */
  thumbnail?: string;
  /** ISO date the page was last revised. */
  revisedAt?: string;
  /** Wikidata QID if available. */
  qid?: string;
  /** "armed_conflict" | "country" | "person" | "treaty" | "other". */
  pageType: string;
  language: string;
}

export interface WikipediaRelatedItem {
  title: string;
  url: string;
  extract: string;
}

const FETCH_TIMEOUT_MS = 6000;

async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        ...(init?.headers ?? {}),
        // Wikipedia REST API kindly requests a contact UA. Use a stable
        // PRAXIS user-agent so they can rate-limit / contact us.
        'User-Agent': 'PRAXIS by TACITUS (giulio@tacitus.me) Wikipedia enrichment',
        Accept: 'application/json',
      },
    });
    return r;
  } catch (err) {
    console.warn('[wikipedia] fetch failed:', err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function getWikipediaSummary(
  title: string,
  language: string = 'en'
): Promise<WikipediaSummary | null> {
  const r = await safeFetch(SUMMARY_URL(language, title));
  if (!r || !r.ok) return null;
  try {
    const data = (await r.json()) as Record<string, unknown>;
    const titles = data.titles as { canonical?: string } | undefined;
    return {
      title: typeof data.title === 'string' ? data.title : (titles?.canonical ?? title),
      url:
        typeof (data.content_urls as { desktop?: { page?: string } } | undefined)?.desktop?.page === 'string'
          ? (data.content_urls as { desktop: { page: string } }).desktop.page
          : `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      extract: typeof data.extract === 'string' ? data.extract : '',
      thumbnail: typeof (data.thumbnail as { source?: string } | undefined)?.source === 'string'
        ? (data.thumbnail as { source: string }).source
        : undefined,
      revisedAt: typeof data.timestamp === 'string' ? data.timestamp : undefined,
      qid: typeof (data.wikibase_item as string | undefined) === 'string'
        ? (data.wikibase_item as string)
        : undefined,
      pageType: typeof data.type === 'string' ? data.type : 'standard',
      language,
    };
  } catch {
    return null;
  }
}

export async function getWikipediaRelated(
  title: string,
  language: string = 'en',
  max: number = 6
): Promise<WikipediaRelatedItem[]> {
  const r = await safeFetch(RELATED_URL(language, title));
  if (!r || !r.ok) return [];
  try {
    const data = (await r.json()) as { pages?: Array<Record<string, unknown>> };
    const pages = Array.isArray(data.pages) ? data.pages.slice(0, max) : [];
    return pages.map((p) => ({
      title: String(p.title ?? p.displaytitle ?? ''),
      url: typeof (p.content_urls as { desktop?: { page?: string } } | undefined)?.desktop?.page === 'string'
        ? (p.content_urls as { desktop: { page: string } }).desktop.page
        : `https://${language}.wikipedia.org/wiki/${encodeURIComponent(String(p.title ?? ''))}`,
      extract: String(p.extract ?? ''),
    }));
  } catch {
    return [];
  }
}

export async function searchWikipedia(
  query: string,
  language: string = 'en'
): Promise<string[]> {
  const r = await safeFetch(SEARCH_URL(language, query));
  if (!r || !r.ok) return [];
  try {
    const data = (await r.json()) as unknown[];
    const titles = Array.isArray(data) && Array.isArray(data[1]) ? (data[1] as unknown[]) : [];
    return titles.filter((t): t is string => typeof t === 'string');
  } catch {
    return [];
  }
}

/**
 * Build a single ## WIKIPEDIA BACKGROUND block for prompt injection.
 * Always closes with a "Cite by URL when relying on this" reminder so the
 * downstream model knows it must attach the canonical URL on every claim.
 */
export function formatWikipediaPromptBlock(
  summary: WikipediaSummary | null,
  related: WikipediaRelatedItem[]
): string {
  if (!summary && related.length === 0) {
    return '## WIKIPEDIA BACKGROUND\nNo Wikipedia entries matched the situation. Mark relevant claims as intelligence gaps.';
  }
  const lines: string[] = ['## WIKIPEDIA BACKGROUND (CC-BY-SA, cite by URL on use)'];
  if (summary) {
    lines.push(`Primary entry: ${summary.title}`);
    lines.push(`URL: ${summary.url}`);
    if (summary.revisedAt) lines.push(`Last revised: ${summary.revisedAt}`);
    if (summary.qid) lines.push(`Wikidata: ${summary.qid}`);
    lines.push('');
    lines.push(summary.extract.slice(0, 1800));
  }
  if (related.length > 0) {
    lines.push('');
    lines.push('Related entities:');
    for (const r of related) {
      lines.push(`- [${r.title}](${r.url}): ${r.extract.slice(0, 320)}`);
    }
  }
  lines.push('');
  lines.push('When you reference any fact from this block, cite it inline as `[Wikipedia: TITLE]` followed by the URL. If the fact isn\'t in this block, mark it as an intelligence gap rather than inventing a source.');
  return lines.join('\n');
}

export const __test__ = {
  SUMMARY_URL,
  RELATED_URL,
  SEARCH_URL,
};

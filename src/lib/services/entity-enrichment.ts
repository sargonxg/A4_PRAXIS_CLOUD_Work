/**
 * Entity enrichment service.
 *
 * Takes a bare entity name (e.g. an actor pulled out of a document or feed
 * item) and returns the best-available structured summary we can assemble
 * without asking the user for more input. Sources tried in order:
 *
 *   1. Wikipedia (English) — summary, type, location, categories.
 *   2. GDELT DOC 2.0 — mention volume, average tone, top domains (reach signal).
 *   3. Grounded Gemini fallback — when both of the above are thin, ask the
 *      model to synthesise a one-paragraph bio with inline citations.
 *
 * All three paths are non-throwing; the caller receives a best-effort object
 * with explicit null fields on failure.
 */

import { getEntitySignal, type GKGEntitySignal } from '@/lib/data-feeds/gdelt-gkg-client';
import { getGroundedSearchEvents } from '@/lib/data-feeds/grounded-search-client';

export interface WikipediaSummary {
  title: string;
  extract: string;
  type: 'disambiguation' | 'standard' | 'no-extract' | null;
  url: string;
  thumbnail?: string;
}

export interface EnrichedEntity {
  query: string;
  wikipedia: WikipediaSummary | null;
  gdelt: GKGEntitySignal | null;
  aiSummary: string | null;
  citations: string[];
  fetchedAt: string;
}

const WIKI_SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

export async function fetchWikipediaSummary(query: string): Promise<WikipediaSummary | null> {
  if (!query) return null;
  try {
    const slug = encodeURIComponent(query.trim().replace(/\s+/g, '_'));
    const res = await fetch(`${WIKI_SUMMARY_BASE}${slug}`, {
      signal: AbortSignal.timeout(8_000),
      headers: { 'User-Agent': 'PRAXIS/6.3 (https://praxis.tacitus.me)' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      type?: string;
      title?: string;
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
      thumbnail?: { source?: string };
    };
    const extract = (data.extract ?? '').trim();
    return {
      title: data.title ?? query,
      extract,
      type: data.type === 'disambiguation' ? 'disambiguation' : extract ? 'standard' : 'no-extract',
      url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${slug}`,
      thumbnail: data.thumbnail?.source,
    };
  } catch {
    return null;
  }
}

export async function enrichEntity(query: string, opts: { useAiSummary?: boolean } = {}): Promise<EnrichedEntity> {
  const [wikipedia, gdelt] = await Promise.all([
    fetchWikipediaSummary(query),
    getEntitySignal({ query, window: '7d' }),
  ]);

  const citations: string[] = [];
  if (wikipedia) citations.push(wikipedia.url);
  if (gdelt && gdelt.topDomains.length > 0) citations.push(...gdelt.topDomains.slice(0, 5).map((d) => `https://${d}`));

  let aiSummary: string | null = null;
  const wantAi = opts.useAiSummary !== false;
  const wikipediaThin = !wikipedia || !wikipedia.extract || wikipedia.extract.length < 200;
  if (wantAi && wikipediaThin) {
    try {
      const events = await getGroundedSearchEvents({ query, limit: 3 });
      if (events.length > 0) {
        aiSummary = events
          .map((e) => `${e.title}: ${e.description}`)
          .slice(0, 3)
          .join(' ')
          .slice(0, 600);
        for (const e of events) citations.push(e.url);
      }
    } catch {
      /* silent — aiSummary stays null */
    }
  }

  return {
    query,
    wikipedia,
    gdelt,
    aiSummary,
    citations: Array.from(new Set(citations)).slice(0, 10),
    fetchedAt: new Date().toISOString(),
  };
}

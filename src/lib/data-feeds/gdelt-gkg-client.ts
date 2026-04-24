/**
 * GDELT Knowledge Graph (GKG) client.
 *
 * Uses the GDELT DOC 2.0 API (`mode=ArtList` and `mode=TimelineVol`) to pull
 * two signals that feed into the ACO graph for entity enrichment:
 *
 *   1. Mention volume for a named entity over a recent window — how loud
 *      is this actor in global media right now?
 *   2. Average tone for that entity — how positive/negative is the coverage?
 *
 * Free, no API key. Rate-limited to ~1 request per second per host, so the
 * client serialises calls behind a minimal queue.
 *
 * Notes:
 *   - GDELT's full GKG themes feed lives on BigQuery (gdeltv2.gkg) and is far
 *     richer than DOC 2.0 — we use DOC 2.0 for the free-tier path because no
 *     key or BigQuery project is required. When PRAXIS runs on GCP with the
 *     Cloud Run SA granted BigQuery user, a future path can read gdeltv2.gkg
 *     directly. Wire it in `src/lib/data-feeds/gdelt-gkg-bq-client.ts`.
 */

const GDELT_DOC_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

export interface GKGEntitySignal {
  query: string;
  window: '24h' | '7d' | '30d';
  mentionCount: number;
  averageTone: number | null;
  volumeTimeline: Array<{ date: string; value: number }>;
  /** Top domains covering the entity — proxy for reach / authority. */
  topDomains: string[];
  fetchedAt: string;
}

let lastCallMs = 0;
const RATE_LIMIT_MS = 1100;

async function rateLimit(): Promise<void> {
  const delta = Date.now() - lastCallMs;
  if (delta < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - delta));
  lastCallMs = Date.now();
}

async function gdeltFetch(url: string, timeoutMs = 12_000): Promise<Response> {
  await rateLimit();
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`GDELT responded ${res.status}`);
  return res;
}

interface DocArtListResponse {
  articles?: Array<{ url: string; title?: string; seendate?: string; domain?: string; tone?: number }>;
}

interface TimelineResponse {
  timeline?: Array<{ data: Array<{ date: string; value: number }> }>;
}

/**
 * Fetch mention volume + tone for an entity over the requested window. Returns
 * null when GDELT is unreachable or the query returns nothing — the caller
 * should treat `null` as "no signal" rather than "entity is absent".
 */
export async function getEntitySignal(opts: {
  query: string;
  window?: '24h' | '7d' | '30d';
}): Promise<GKGEntitySignal | null> {
  const query = opts.query?.trim();
  if (!query) return null;
  const window = opts.window ?? '7d';
  const timespan = window === '24h' ? '24h' : window === '30d' ? '30d' : '7d';
  const q = encodeURIComponent(query);

  try {
    // 1. Article list — sample of covering domains + tone field
    const artUrl = `${GDELT_DOC_BASE}?query=${q}&mode=ArtList&format=json&maxrecords=50&timespan=${timespan}&sort=HybridRel`;
    const artRes = await gdeltFetch(artUrl);
    const artData = (await artRes.json().catch(() => ({}))) as DocArtListResponse;
    const articles = Array.isArray(artData.articles) ? artData.articles : [];

    // 2. Volume timeline — per-day mention count
    const volUrl = `${GDELT_DOC_BASE}?query=${q}&mode=TimelineVol&format=json&timespan=${timespan}`;
    const volRes = await gdeltFetch(volUrl);
    const volData = (await volRes.json().catch(() => ({}))) as TimelineResponse;
    const points = Array.isArray(volData.timeline) ? volData.timeline[0]?.data ?? [] : [];

    const tones = articles.map((a) => Number(a.tone ?? 0)).filter((n) => Number.isFinite(n));
    const averageTone = tones.length > 0 ? tones.reduce((s, v) => s + v, 0) / tones.length : null;

    const domainCounts = new Map<string, number>();
    for (const a of articles) {
      const d = a.domain?.trim();
      if (d) domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
    }
    const topDomains = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([d]) => d);

    return {
      query,
      window,
      mentionCount: articles.length,
      averageTone,
      volumeTimeline: points.map((p) => ({ date: p.date, value: Number(p.value) })),
      topDomains,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[gdelt-gkg] getEntitySignal failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Z-score the current window's daily mean against the trailing baseline. A
 * |z| > 2 is the conventional "significant spike" threshold; the caller
 * decides whether to label it.
 */
export function computeVolumeZScore(timeline: Array<{ date: string; value: number }>): {
  zScore: number;
  current: number;
  baseline: number;
  stdDev: number;
} {
  if (timeline.length < 4) return { zScore: 0, current: 0, baseline: 0, stdDev: 0 };
  const current = timeline[timeline.length - 1].value;
  const history = timeline.slice(0, -1).map((p) => p.value);
  const mean = history.reduce((s, v) => s + v, 0) / history.length;
  const variance = history.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, history.length - 1);
  const stdDev = Math.sqrt(variance);
  const zScore = stdDev > 0 ? (current - mean) / stdDev : 0;
  return { zScore, current, baseline: mean, stdDev };
}

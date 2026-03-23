/**
 * GDELT DOC 2.0 API Client
 * Global Database of Events, Language, and Tone
 * https://blog.gdeltproject.org/gdelt-doc-2-0-api-unveiled/
 *
 * Free, no API key required. Rate limit: ~1 req/sec
 */

export interface GDELTArticle {
  url: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
  tone: number;
}

export interface GDELTTimelinePoint {
  date: string;
  value: number;
}

const GDELT_DOC_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';
const GDELT_GEO_BASE = 'https://api.gdeltproject.org/api/v2/geo/geo';

async function fetchWithTimeout(url: string, timeout = 12000): Promise<Response> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`GDELT API ${res.status}`);
  return res;
}

/**
 * Search articles mentioning a query in the last N hours/days
 */
export async function searchArticles(options: {
  query: string;
  timespan?: string; // e.g., '24h', '7d', '30d'
  mode?: 'ArtList' | 'TimelineVol' | 'TimelineTone';
  maxRecords?: number;
}): Promise<GDELTArticle[]> {
  const params = new URLSearchParams({
    query: options.query,
    mode: options.mode || 'ArtList',
    maxrecords: String(options.maxRecords || 25),
    format: 'json',
    sort: 'DateDesc',
  });
  if (options.timespan) params.set('timespan', options.timespan);

  try {
    const res = await fetchWithTimeout(`${GDELT_DOC_BASE}?${params}`);
    const data = await res.json();
    return (data.articles || []).map((a: Record<string, unknown>) => ({
      url: a.url || '',
      title: a.title || '',
      seendate: a.seendate || '',
      socialimage: a.socialimage || '',
      domain: a.domain || '',
      language: a.language || '',
      sourcecountry: a.sourcecountry || '',
      tone: typeof a.tone === 'number' ? a.tone : 0,
    }));
  } catch (err) {
    console.error('[gdelt] searchArticles failed:', err);
    return [];
  }
}

/**
 * Get article volume timeline for a query
 */
export async function getVolumeTimeline(query: string, timespan = '30d'): Promise<GDELTTimelinePoint[]> {
  const params = new URLSearchParams({
    query,
    mode: 'TimelineVol',
    timespan,
    format: 'json',
  });

  try {
    const res = await fetchWithTimeout(`${GDELT_DOC_BASE}?${params}`);
    const data = await res.json();
    const timeline = data.timeline?.[0]?.data || [];
    return timeline.map((d: { date: string; value: number }) => ({
      date: d.date,
      value: d.value,
    }));
  } catch (err) {
    console.error('[gdelt] getVolumeTimeline failed:', err);
    return [];
  }
}

/**
 * Get tone/sentiment timeline for a query
 */
export async function getToneTimeline(query: string, timespan = '30d'): Promise<GDELTTimelinePoint[]> {
  const params = new URLSearchParams({
    query,
    mode: 'TimelineTone',
    timespan,
    format: 'json',
  });

  try {
    const res = await fetchWithTimeout(`${GDELT_DOC_BASE}?${params}`);
    const data = await res.json();
    const timeline = data.timeline?.[0]?.data || [];
    return timeline.map((d: { date: string; value: number }) => ({
      date: d.date,
      value: d.value,
    }));
  } catch (err) {
    console.error('[gdelt] getToneTimeline failed:', err);
    return [];
  }
}

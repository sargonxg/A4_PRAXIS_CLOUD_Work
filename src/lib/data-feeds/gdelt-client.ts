/**
 * GDELT DOC 2.0 API Client
 * Global Database of Events, Language, and Tone
 * https://blog.gdeltproject.org/gdelt-doc-2-0-api-unveiled/
 * Free, no API key. Rate limit: ~1 req/sec
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

export interface GDELTVolumeSpikeResult {
  isSpike: boolean;
  zScore: number;
  currentVolume: number;
  baseline: number;
  stdDev: number;
  description: string;
}

const GDELT_DOC_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

async function fetchWithTimeout(url: string, timeout = 12000): Promise<Response> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`GDELT API ${res.status}`);
  return res;
}

/** Search articles mentioning a query */
export async function searchArticles(options: {
  query: string;
  timespan?: string; // '24h', '7d', '30d'
  mode?: 'ArtList' | 'TimelineVol' | 'TimelineTone';
  maxRecords?: number;
  theme?: string; // GDELT CAMEO theme e.g. 'MILITARY', 'PROTEST', 'NEGOTIATIONS'
  sourceCountry?: string; // ISO2 country code
  language?: string; // e.g. 'English', 'Arabic'
}): Promise<GDELTArticle[]> {
  let q = options.query;
  if (options.theme) q += ` theme:${options.theme}`;
  if (options.sourceCountry) q += ` sourcecountry:${options.sourceCountry}`;
  if (options.language) q += ` sourcelang:${options.language}`;

  const params = new URLSearchParams({
    query: q,
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
      url: String(a.url ?? ''),
      title: String(a.title ?? ''),
      seendate: String(a.seendate ?? ''),
      socialimage: String(a.socialimage ?? ''),
      domain: String(a.domain ?? ''),
      language: String(a.language ?? ''),
      sourcecountry: String(a.sourcecountry ?? ''),
      tone: typeof a.tone === 'number' ? a.tone : 0,
    }));
  } catch (err) {
    console.error('[gdelt] searchArticles failed:', err);
    return [];
  }
}

/** Get article volume timeline */
export async function getVolumeTimeline(query: string, timespan = '30d'): Promise<GDELTTimelinePoint[]> {
  const params = new URLSearchParams({ query, mode: 'TimelineVol', timespan, format: 'json' });
  try {
    const res = await fetchWithTimeout(`${GDELT_DOC_BASE}?${params}`);
    const data = await res.json();
    const timeline = data.timeline?.[0]?.data || [];
    return timeline.map((d: { date: string; value: number }) => ({ date: d.date, value: d.value }));
  } catch (err) {
    console.error('[gdelt] getVolumeTimeline failed:', err);
    return [];
  }
}

/** Get tone/sentiment timeline */
export async function getToneTimeline(query: string, timespan = '30d'): Promise<GDELTTimelinePoint[]> {
  const params = new URLSearchParams({ query, mode: 'TimelineTone', timespan, format: 'json' });
  try {
    const res = await fetchWithTimeout(`${GDELT_DOC_BASE}?${params}`);
    const data = await res.json();
    const timeline = data.timeline?.[0]?.data || [];
    return timeline.map((d: { date: string; value: number }) => ({ date: d.date, value: d.value }));
  } catch (err) {
    console.error('[gdelt] getToneTimeline failed:', err);
    return [];
  }
}

/** Compute rolling mean and std dev for Z-score */
function computeStats(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 1 };
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return { mean, stdDev: Math.sqrt(variance) || 1 };
}

/**
 * Detect volume spike using Z-score methodology.
 * Spike = current volume > 2 standard deviations above 30-day rolling mean.
 */
export async function detectVolumeSpike(query: string): Promise<GDELTVolumeSpikeResult> {
  const timeline = await getVolumeTimeline(query, '30d');

  if (timeline.length < 7) {
    return { isSpike: false, zScore: 0, currentVolume: 0, baseline: 0, stdDev: 0, description: 'Insufficient data for spike detection' };
  }

  const values = timeline.map((p) => p.value);
  const current = values[values.length - 1];
  const baseline30 = values.slice(0, -1);
  const { mean, stdDev } = computeStats(baseline30);
  const zScore = (current - mean) / stdDev;

  return {
    isSpike: zScore > 2.0,
    zScore: Math.round(zScore * 100) / 100,
    currentVolume: current,
    baseline: Math.round(mean * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    description: zScore > 2.0
      ? `Volume spike detected: ${current} articles vs baseline of ${mean.toFixed(1)} (Z=${zScore.toFixed(1)})`
      : `Volume within normal range: Z=${zScore.toFixed(1)}`,
  };
}

/** Aggregate average tone over articles */
export function aggregateTone(articles: GDELTArticle[]): { avgTone: number; sentiment: 'positive' | 'neutral' | 'negative'; sampleSize: number } {
  if (articles.length === 0) return { avgTone: 0, sentiment: 'neutral', sampleSize: 0 };
  const avg = articles.reduce((s, a) => s + a.tone, 0) / articles.length;
  return {
    avgTone: Math.round(avg * 100) / 100,
    sentiment: avg > 1 ? 'positive' : avg < -1 ? 'negative' : 'neutral',
    sampleSize: articles.length,
  };
}

/** Get source country distribution from articles */
export function getSourceCountries(articles: GDELTArticle[]): { country: string; count: number; avgTone: number }[] {
  const map = new Map<string, { count: number; toneSum: number }>();
  for (const a of articles) {
    const c = a.sourcecountry || 'Unknown';
    const existing = map.get(c) ?? { count: 0, toneSum: 0 };
    existing.count++;
    existing.toneSum += a.tone;
    map.set(c, existing);
  }
  return Array.from(map.entries())
    .map(([country, { count, toneSum }]) => ({ country, count, avgTone: Math.round((toneSum / count) * 100) / 100 }))
    .sort((a, b) => b.count - a.count);
}

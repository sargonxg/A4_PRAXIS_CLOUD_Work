/**
 * Crisis Group CrisisWatch Client
 * https://www.crisisgroup.org/crisiswatch
 * Uses the public CrisisWatch page.
 */

export type CrisisWatchStatus = 'deteriorated' | 'unchanged' | 'improved' | 'new_conflict' | 'resolved_situation' | 'unknown';

export interface CrisisWatchEntry {
  country: string;
  status: CrisisWatchStatus;
  summary: string;
  date: string; // ISO date of the bulletin
  url: string;
  source: 'crisiswatch';
}

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours (CrisisWatch updates monthly)
const cache = new Map<string, { data: CrisisWatchEntry | null; ts: number }>();

function classifyStatus(text: string): CrisisWatchStatus {
  const lower = text.toLowerCase();
  if (lower.includes('deteriorat') || lower.includes('worsened') || lower.includes('escalat')) return 'deteriorated';
  if (lower.includes('improv') || lower.includes('de-escalat') || lower.includes('progress')) return 'improved';
  if (lower.includes('new conflict') || lower.includes('new crisis')) return 'new_conflict';
  if (lower.includes('resolved') || lower.includes('ended')) return 'resolved_situation';
  return 'unchanged';
}

/**
 * Fetch the latest CrisisWatch entry for a country.
 * Returns null if unavailable.
 */
export async function getCrisisWatch(country: string): Promise<CrisisWatchEntry | null> {
  const cacheKey = `crisiswatch:${country.toLowerCase()}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  try {
    const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.crisisgroup.org/crisiswatch/database#/?location=${countrySlug}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      cache.set(cacheKey, { data: null, ts: Date.now() });
      return null;
    }

    const markdown = await res.text();

    if (!markdown || markdown.length < 100) {
      cache.set(cacheKey, { data: null, ts: Date.now() });
      return null;
    }

    // Extract relevant paragraphs mentioning the country
    const lines = markdown.split('\n').filter((l) => l.trim().length > 20);
    const relevant = lines.filter((l) => l.toLowerCase().includes(country.toLowerCase())).slice(0, 5);
    const summary = relevant.join(' ').replace(/\[.*?\]/g, '').replace(/\n/g, ' ').slice(0, 600);

    const entry: CrisisWatchEntry = {
      country,
      status: classifyStatus(summary || markdown.slice(0, 300)),
      summary: summary || markdown.slice(0, 400),
      date: new Date().toISOString().slice(0, 7) + '-01', // First of current month
      url: `https://www.crisisgroup.org/crisiswatch/database`,
      source: 'crisiswatch',
    };

    cache.set(cacheKey, { data: entry, ts: Date.now() });
    return entry;
  } catch {
    cache.set(cacheKey, { data: null, ts: Date.now() });
    return null;
  }
}

export function isCrisisGroupConfigured(): boolean {
  return true;
}

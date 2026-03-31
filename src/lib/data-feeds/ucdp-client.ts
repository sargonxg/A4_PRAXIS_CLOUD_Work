/**
 * UCDP API Client — Uppsala Conflict Data Program
 * https://ucdpapi.pcr.uu.se/api/
 * Free, no API key required.
 */

export interface UCDPEvent {
  id: string;
  conflict_new_id: number;
  conflict_name: string;
  year: number;
  type_of_violence: 1 | 2 | 3; // 1=state, 2=non-state, 3=one-sided
  side_a: string;
  side_b: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  date_start: string;
  date_end: string;
  deaths_a: number;
  deaths_b: number;
  deaths_civilians: number;
  deaths_unknown: number;
  best: number; // best estimate total deaths
  low: number;
  high: number;
  source_article: string;
}

export interface UCDPConflict {
  conflict_id: number;
  conflict_name: string;
  type_of_conflict: number;
  start_date: string;
  ep_end_date: string | null;
  location: string;
  side_a: string;
  side_b: string;
  intensity_level: 1 | 2; // 1=minor, 2=war
  cumulative_intensity: number;
}

const UCDP_BASE = 'https://ucdpapi.pcr.uu.se/api';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
const cache = new Map<string, { data: unknown; ts: number }>();

function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.data as T);
  return fetcher().then((data) => {
    cache.set(key, { data, ts: Date.now() });
    return data;
  });
}

async function ucdpFetch(endpoint: string, params: Record<string, string>): Promise<unknown> {
  try {
    const qs = new URLSearchParams({ ...params, pagesize: '100', page: '1' });
    const res = await fetch(`${UCDP_BASE}/${endpoint}?${qs}`, {
      signal: AbortSignal.timeout(15000),
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Get georeferenced conflict events for a country */
export async function getEvents(country: string, year?: number): Promise<UCDPEvent[]> {
  return cached(`ucdp:events:${country}:${year ?? 'all'}`, async () => {
    const params: Record<string, string> = { country };
    if (year) params.year = String(year);
    const data = await ucdpFetch('gedevents', params) as Record<string, unknown> | null;
    if (!data?.Result) return [];
    return ((data.Result as Record<string, unknown>[]) ?? []).map((e) => ({
      id: String(e.id ?? ''),
      conflict_new_id: Number(e.conflict_new_id ?? 0),
      conflict_name: String(e.conflict_name ?? ''),
      year: Number(e.year ?? 0),
      type_of_violence: Number(e.type_of_violence ?? 1) as 1 | 2 | 3,
      side_a: String(e.side_a ?? ''),
      side_b: String(e.side_b ?? ''),
      country: String(e.country ?? ''),
      region: String(e.region ?? ''),
      latitude: Number(e.latitude ?? 0),
      longitude: Number(e.longitude ?? 0),
      date_start: String(e.date_start ?? ''),
      date_end: String(e.date_end ?? ''),
      deaths_a: Number(e.deaths_a ?? 0),
      deaths_b: Number(e.deaths_b ?? 0),
      deaths_civilians: Number(e.deaths_civilians ?? 0),
      deaths_unknown: Number(e.deaths_unknown ?? 0),
      best: Number(e.best ?? 0),
      low: Number(e.low ?? 0),
      high: Number(e.high ?? 0),
      source_article: String(e.source_article ?? ''),
    }));
  }) as Promise<UCDPEvent[]>;
}

/** Get active conflicts for a country */
export async function getConflicts(country: string): Promise<UCDPConflict[]> {
  return cached(`ucdp:conflicts:${country}`, async () => {
    const data = await ucdpFetch('conflict', { location: country }) as Record<string, unknown> | null;
    if (!data?.Result) return [];
    return ((data.Result as Record<string, unknown>[]) ?? []).map((c) => ({
      conflict_id: Number(c.conflict_id ?? 0),
      conflict_name: String(c.conflict_name ?? ''),
      type_of_conflict: Number(c.type_of_conflict ?? 0),
      start_date: String(c.start_date ?? ''),
      ep_end_date: c.ep_end_date ? String(c.ep_end_date) : null,
      location: String(c.location ?? ''),
      side_a: String(c.side_a ?? ''),
      side_b: String(c.side_b ?? ''),
      intensity_level: Number(c.intensity_level ?? 1) as 1 | 2,
      cumulative_intensity: Number(c.cumulative_intensity ?? 0),
    }));
  }) as Promise<UCDPConflict[]>;
}

/** Get total battle deaths by year for a country */
export async function getBattleDeaths(country: string): Promise<{ year: number; bestDeaths: number; lowDeaths: number; highDeaths: number }[]> {
  return cached(`ucdp:deaths:${country}`, async () => {
    const data = await ucdpFetch('battledeaths', { location: country }) as Record<string, unknown> | null;
    if (!data?.Result) return [];
    return ((data.Result as Record<string, unknown>[]) ?? []).map((d) => ({
      year: Number(d.year ?? 0),
      bestDeaths: Number(d.bd_best ?? 0),
      lowDeaths: Number(d.bd_low ?? 0),
      highDeaths: Number(d.bd_high ?? 0),
    })).sort((a, b) => a.year - b.year);
  }) as Promise<{ year: number; bestDeaths: number; lowDeaths: number; highDeaths: number }[]>;
}

export function isUCDPConfigured(): boolean {
  return true; // No API key required
}

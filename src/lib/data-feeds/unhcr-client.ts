/**
 * UNHCR Refugee Data Finder API Client
 * https://api.unhcr.org/population/v1/
 * Free, no API key required.
 */

export interface UNHCRPopulation {
  year: number;
  country: string;
  countryCode: string;
  refugees: number;
  asylumSeekers: number;
  idps: number;
  returnees: number;
  stateless: number;
  other: number;
  total: number;
}

export interface UNHCROriginData {
  year: number;
  originCountry: string;
  asylumCountry: string;
  refugees: number;
}

const UNHCR_BASE = 'https://api.unhcr.org/population/v1';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, { data: unknown; ts: number }>();

function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.data as T);
  return fetcher().then((data) => {
    cache.set(key, { data, ts: Date.now() });
    return data;
  });
}

async function unhcrFetch(path: string): Promise<unknown> {
  try {
    const url = `${UNHCR_BASE}${path}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Get latest displacement statistics for a country (by ISO3 or country name) */
export async function getDisplacementStats(countryIso3: string, year?: number): Promise<UNHCRPopulation | null> {
  return cached(`unhcr:displacement:${countryIso3}:${year ?? 'latest'}`, async () => {
    const targetYear = year ?? new Date().getFullYear() - 1;
    const data = await unhcrFetch(`/population/?limit=1&year=${targetYear}&coa_iso=${countryIso3.toUpperCase()}`) as Record<string, unknown> | null;
    if (!data) {
      // Try as country of origin
      const originData = await unhcrFetch(`/population/?limit=1&year=${targetYear}&coo_iso=${countryIso3.toUpperCase()}`) as Record<string, unknown> | null;
      if (!originData) return null;
      const items = (originData.items as Record<string, unknown>[]) ?? [];
      if (!items.length) return null;
      const item = items[0];
      return {
        year: targetYear,
        country: (item.coo_name ?? countryIso3) as string,
        countryCode: countryIso3.toUpperCase(),
        refugees: Number(item.refugees ?? 0),
        asylumSeekers: Number(item.asylum_seekers ?? 0),
        idps: Number(item.idps ?? 0),
        returnees: Number(item.returned_refugees ?? 0),
        stateless: Number(item.stateless ?? 0),
        other: Number(item.others_of_concern ?? 0),
        total: Number(item.total ?? 0),
      };
    }
    const items = (data.items as Record<string, unknown>[]) ?? [];
    if (!items.length) return null;
    const item = items[0];
    return {
      year: targetYear,
      country: (item.coa_name ?? countryIso3) as string,
      countryCode: countryIso3.toUpperCase(),
      refugees: Number(item.refugees ?? 0),
      asylumSeekers: Number(item.asylum_seekers ?? 0),
      idps: Number(item.idps ?? 0),
      returnees: Number(item.returned_refugees ?? 0),
      stateless: Number(item.stateless ?? 0),
      other: Number(item.others_of_concern ?? 0),
      total: Number(item.total ?? 0),
    };
  });
}

/** Get time series of displacement data for trend analysis */
export async function getDisplacementTimeSeries(countryIso3: string, yearsBack = 5): Promise<UNHCRPopulation[]> {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: yearsBack }, (_, i) => currentYear - 1 - i);
  const results = await Promise.allSettled(years.map((y) => getDisplacementStats(countryIso3, y)));
  return results
    .filter((r): r is PromiseFulfilledResult<UNHCRPopulation | null> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value as UNHCRPopulation)
    .sort((a, b) => a.year - b.year);
}

/** Get countries that refugees from this country fled to */
export async function getDisplacedToCountries(originIso3: string): Promise<UNHCROriginData[]> {
  return cached(`unhcr:origin:${originIso3}`, async () => {
    const year = new Date().getFullYear() - 1;
    const data = await unhcrFetch(`/population/?limit=20&year=${year}&coo_iso=${originIso3.toUpperCase()}&cf_type=REF`) as Record<string, unknown> | null;
    if (!data) return [];
    return ((data.items as Record<string, unknown>[]) ?? []).map((item) => ({
      year,
      originCountry: (item.coo_name ?? originIso3) as string,
      asylumCountry: (item.coa_name ?? '') as string,
      refugees: Number(item.refugees ?? 0),
    }));
  }) as Promise<UNHCROriginData[]>;
}

export function isUNHCRConfigured(): boolean {
  return true; // No API key required
}

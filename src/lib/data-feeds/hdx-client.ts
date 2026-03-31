/**
 * HDX Humanitarian API (HAPI) v2 Client
 * https://hapi.humdata.org/api/v2
 * Free, no API key required.
 */

const HDX_BASE = 'https://hapi.humdata.org/api/v2';
const APP_ID = 'praxis-tacitus';
const CACHE_TTL = 30 * 60 * 1000; // 30 min
const cache = new Map<string, { data: unknown; ts: number }>();

// Expanded ISO3 country code mapping
const COUNTRY_ISO3: Record<string, string> = {
  'afghanistan': 'AFG', 'burkina faso': 'BFA', 'cameroon': 'CMR',
  'central african republic': 'CAF', 'chad': 'TCD', 'colombia': 'COL',
  'congo': 'COD', 'drc': 'COD', 'democratic republic of congo': 'COD',
  'democratic republic of the congo': 'COD',
  'ethiopia': 'ETH', 'iraq': 'IRQ', 'libya': 'LBY', 'mali': 'MLI',
  'mozambique': 'MOZ', 'myanmar': 'MMR', 'niger': 'NER', 'nigeria': 'NGA',
  'pakistan': 'PAK', 'palestine': 'PSE', 'gaza': 'PSE', 'philippines': 'PHL',
  'somalia': 'SOM', 'south sudan': 'SSD', 'sudan': 'SDN', 'syria': 'SYR',
  'ukraine': 'UKR', 'yemen': 'YEM', 'haiti': 'HTI', 'lebanon': 'LBN',
  'israel': 'ISR', 'turkey': 'TUR', 'türkiye': 'TUR', 'china': 'CHN',
  'russia': 'RUS', 'iran': 'IRN', 'india': 'IND', 'bangladesh': 'BGD',
  'kenya': 'KEN', 'tanzania': 'TZA', 'uganda': 'UGA', 'zimbabwe': 'ZWE',
  'venezuela': 'VEN', 'mexico': 'MEX', 'brazil': 'BRA', 'egypt': 'EGY',
  'tunisia': 'TUN', 'algeria': 'DZA', 'morocco': 'MAR', 'senegal': 'SEN',
  'guinea': 'GIN', 'eritrea': 'ERI', 'jordan': 'JOR', 'saudi arabia': 'SAU',
  'rwanda': 'RWA', 'burundi': 'BDI', 'malawi': 'MWI', 'zambia': 'ZMB',
  'angola': 'AGO', 'south africa': 'ZAF',
  'indonesia': 'IDN', 'timor-leste': 'TLS', 'nepal': 'NPL',
  'cambodia': 'KHM', 'laos': 'LAO', 'vietnam': 'VNM',
  'papua new guinea': 'PNG', 'solomon islands': 'SLB',
  'georgia': 'GEO', 'armenia': 'ARM', 'azerbaijan': 'AZE',
  'moldova': 'MDA', 'belarus': 'BLR', 'kyrgyzstan': 'KGZ',
  'tajikistan': 'TJK', 'uzbekistan': 'UZB', 'turkmenistan': 'TKM',
  'nicaragua': 'NIC', 'honduras': 'HND', 'el salvador': 'SLV',
  'guatemala': 'GTM', 'cuba': 'CUB',
};

export function countryNameToIso3(name: string): string | null {
  if (!name) return null;
  // Direct lookup
  const lower = name.toLowerCase().trim();
  if (COUNTRY_ISO3[lower]) return COUNTRY_ISO3[lower];
  // Try to find a partial match (e.g. "Syria" in "Syrian Arab Republic")
  for (const [key, iso3] of Object.entries(COUNTRY_ISO3)) {
    if (lower.includes(key) || key.includes(lower)) return iso3;
  }
  // If already looks like ISO3
  if (/^[A-Z]{3}$/.test(name)) return name;
  return null;
}

async function hdxFetch<T>(path: string, limit = 10): Promise<T | null> {
  const cacheKey = `hdx:${path}:${limit}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data as T;

  try {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${HDX_BASE}${path}${sep}app_identifier=${APP_ID}&output_format=json&limit=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = await res.json() as T;
    cache.set(cacheKey, { data, ts: Date.now() });
    return data;
  } catch { return null; }
}

export async function getPopulation(countryIso3: string) {
  try {
    const data = await hdxFetch<Record<string, unknown>>(`/population/social/population?location_code=${countryIso3}`);
    const item = (data?.data as Record<string, unknown>[])?.[0];
    return item ? { total: item.population as number, source: (item.resource_hdx_stub as string) || 'HDX', date: (item.reference_period_start as string) || '' } : null;
  } catch { return null; }
}

export async function getFoodSecurity(countryIso3: string) {
  try {
    const data = await hdxFetch<Record<string, unknown>>(`/food/food-security?location_code=${countryIso3}`, 20);
    return ((data?.data as Record<string, unknown>[]) || []).map((d) => ({
      phase: (d.ipc_phase as string) || '',
      population: (d.population_in_phase as number) || 0,
      pct: (d.population_fraction_in_phase as number) || 0,
    }));
  } catch { return []; }
}

export async function getDisplacement(countryIso3: string) {
  try {
    const data = await hdxFetch<Record<string, unknown>>(`/affected-people/refugees?location_code=${countryIso3}`, 20);
    const items = (data?.data as Record<string, number>[]) || [];
    const refugees = items.reduce((sum, d) => sum + (d.number_of_refugees || 0), 0);
    const idps = items.reduce((sum, d) => sum + (d.number_of_idps || 0), 0);
    return { idps, refugees, source: 'UNHCR via HDX' };
  } catch { return { idps: 0, refugees: 0, source: 'HDX' }; }
}

export async function getFunding(countryIso3: string) {
  try {
    const data = await hdxFetch<Record<string, unknown>>(`/coordination-context/funding?location_code=${countryIso3}`);
    const item = (data?.data as Record<string, number>[])?.[0];
    return item ? {
      required: (item.requirements_usd as number) || 0,
      funded: (item.funding_usd as number) || 0,
      pct: (item.funding_pct as number) || 0,
    } : null;
  } catch { return null; }
}

/** IDP breakdown by admin level */
export async function getIDPsByAdmin(countryIso3: string): Promise<{ admin1: string; idps: number; returnees: number }[]> {
  try {
    const data = await hdxFetch<Record<string, unknown>>(`/affected-people/idps?location_code=${countryIso3}`, 50);
    return ((data?.data as Record<string, unknown>[]) || []).map((d) => ({
      admin1: (d.admin1_name as string) || '',
      idps: Number(d.number_of_idps ?? 0),
      returnees: Number(d.number_of_returnees ?? 0),
    })).filter((d) => d.admin1);
  } catch { return []; }
}

/** Nutrition indicators (GAM/SAM rates for under-5) */
export async function getNutrition(countryIso3: string): Promise<{ gam: number | null; sam: number | null; year: number | null } | null> {
  try {
    const data = await hdxFetch<Record<string, unknown>>(`/food/wfp-food-prices?location_code=${countryIso3}`);
    if (!data) return null;
    // Proxy: parse from available HDX nutrition endpoints
    const items = (data?.data as Record<string, unknown>[]) || [];
    if (!items.length) return null;
    const latest = items[0];
    return {
      gam: typeof latest.gam_rate === 'number' ? latest.gam_rate as number : null,
      sam: typeof latest.sam_rate === 'number' ? latest.sam_rate as number : null,
      year: typeof latest.reference_year === 'number' ? latest.reference_year as number : null,
    };
  } catch { return null; }
}

/** Operational presence (3W: Who does What Where) */
export async function getOperationalPresence(countryIso3: string): Promise<{ org: string; sector: string; admin1: string }[]> {
  try {
    const data = await hdxFetch<Record<string, unknown>>(`/coordination-context/operational-presence?location_code=${countryIso3}`, 100);
    return ((data?.data as Record<string, unknown>[]) || []).map((d) => ({
      org: (d.org_name as string) || '',
      sector: (d.sector_name as string) || '',
      admin1: (d.admin1_name as string) || '',
    })).filter((d) => d.org);
  } catch { return []; }
}

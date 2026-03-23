/**
 * HDX Humanitarian API (HAPI) v2 Client
 * https://hapi.humdata.org/api/v2
 * Free, no API key required — pass app_identifier
 */

const HDX_BASE = 'https://hapi.humdata.org/api/v2';
const APP_ID = 'praxis-tacitus';

// Common conflict-affected countries ISO3 mapping
const COUNTRY_ISO3: Record<string, string> = {
  'afghanistan': 'AFG', 'burkina faso': 'BFA', 'cameroon': 'CMR',
  'central african republic': 'CAF', 'chad': 'TCD', 'colombia': 'COL',
  'congo': 'COD', 'drc': 'COD', 'democratic republic of congo': 'COD',
  'ethiopia': 'ETH', 'iraq': 'IRQ', 'libya': 'LBY', 'mali': 'MLI',
  'mozambique': 'MOZ', 'myanmar': 'MMR', 'niger': 'NER', 'nigeria': 'NGA',
  'pakistan': 'PAK', 'palestine': 'PSE', 'gaza': 'PSE', 'philippines': 'PHL',
  'somalia': 'SOM', 'south sudan': 'SSD', 'sudan': 'SDN', 'syria': 'SYR',
  'ukraine': 'UKR', 'yemen': 'YEM', 'haiti': 'HTI', 'lebanon': 'LBN',
  'israel': 'ISR', 'turkey': 'TUR', 'china': 'CHN', 'russia': 'RUS',
  'iran': 'IRN', 'india': 'IND', 'bangladesh': 'BGD', 'kenya': 'KEN',
  'tanzania': 'TZA', 'uganda': 'UGA', 'zimbabwe': 'ZWE', 'venezuela': 'VEN',
  'mexico': 'MEX', 'brazil': 'BRA', 'egypt': 'EGY', 'tunisia': 'TUN',
  'algeria': 'DZA', 'morocco': 'MAR', 'senegal': 'SEN', 'guinea': 'GIN',
  'eritrea': 'ERI', 'jordan': 'JOR', 'saudi arabia': 'SAU',
};

export function countryNameToIso3(name: string): string | null {
  return COUNTRY_ISO3[name.toLowerCase()] || null;
}

async function hdxFetch(path: string) {
  const url = `${HDX_BASE}${path}${path.includes('?') ? '&' : '?'}app_identifier=${APP_ID}&output_format=json&limit=10`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  return res.json();
}

export async function getPopulation(countryIso3: string) {
  try {
    const data = await hdxFetch(`/population/social/population?location_code=${countryIso3}`);
    const item = data?.data?.[0];
    return item ? { total: item.population, source: item.resource_hdx_stub || 'HDX', date: item.reference_period_start || '' } : null;
  } catch { return null; }
}

export async function getFoodSecurity(countryIso3: string) {
  try {
    const data = await hdxFetch(`/food/food-security?location_code=${countryIso3}`);
    return (data?.data || []).map((d: Record<string, unknown>) => ({
      phase: d.ipc_phase as string || '',
      population: d.population_in_phase as number || 0,
      pct: d.population_fraction_in_phase as number || 0,
    }));
  } catch { return []; }
}

export async function getDisplacement(countryIso3: string) {
  try {
    const data = await hdxFetch(`/affected-people/refugees?location_code=${countryIso3}`);
    const items = data?.data || [];
    const refugees = items.reduce((sum: number, d: Record<string, number>) => sum + (d.number_of_refugees || 0), 0);
    const idps = items.reduce((sum: number, d: Record<string, number>) => sum + (d.number_of_idps || 0), 0);
    return { idps, refugees, source: 'UNHCR via HDX' };
  } catch { return { idps: 0, refugees: 0, source: 'HDX' }; }
}

export async function getFunding(countryIso3: string) {
  try {
    const data = await hdxFetch(`/coordination-context/funding?location_code=${countryIso3}`);
    const item = data?.data?.[0];
    return item ? {
      required: item.requirements_usd as number || 0,
      funded: item.funding_usd as number || 0,
      pct: item.funding_pct as number || 0,
    } : null;
  } catch { return null; }
}

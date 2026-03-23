/**
 * World Bank API v2 Client
 * https://api.worldbank.org/v2
 * Free, no API key required
 */

const WB_BASE = 'https://api.worldbank.org/v2';

async function getIndicator(countryIso2: string, indicator: string, years = 5): Promise<{ year: number; value: number }[]> {
  try {
    const res = await fetch(
      `${WB_BASE}/country/${countryIso2}/indicator/${indicator}?format=json&per_page=${years}&date=${new Date().getFullYear() - years}:${new Date().getFullYear()}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const entries = data?.[1] || [];
    return entries
      .filter((e: Record<string, unknown>) => e.value !== null)
      .map((e: Record<string, unknown>) => ({ year: Number(e.date), value: Number(e.value) }))
      .sort((a: { year: number }, b: { year: number }) => a.year - b.year);
  } catch { return []; }
}

export async function getGDP(countryIso2: string) {
  return getIndicator(countryIso2, 'NY.GDP.MKTP.CD');
}

export async function getInflation(countryIso2: string) {
  return getIndicator(countryIso2, 'FP.CPI.TOTL.ZG');
}

export async function getPopulationGrowth(countryIso2: string) {
  return getIndicator(countryIso2, 'SP.POP.GROW');
}

export async function getMilitaryExpenditure(countryIso2: string) {
  return getIndicator(countryIso2, 'MS.MIL.XPND.GD.ZS');
}

export async function getRefugeePopulation(countryIso2: string) {
  return getIndicator(countryIso2, 'SM.POP.REFG');
}

export async function getEconomicSnapshot(countryIso2: string) {
  const [gdp, inflation, military, pop] = await Promise.all([
    getGDP(countryIso2),
    getInflation(countryIso2),
    getMilitaryExpenditure(countryIso2),
    getPopulationGrowth(countryIso2),
  ]);
  return {
    gdp: gdp[gdp.length - 1] || null,
    inflation: inflation[inflation.length - 1] || null,
    militarySpending: military[military.length - 1] || null,
    populationGrowth: pop[pop.length - 1] || null,
  };
}

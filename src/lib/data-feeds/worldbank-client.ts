/**
 * World Bank API v2 Client
 * https://api.worldbank.org/v2
 * Free, no API key required.
 */

const WB_BASE = 'https://api.worldbank.org/v2';

export interface WBIndicatorValue {
  year: number;
  value: number;
}

export interface WBGovernanceIndicators {
  voiceAccountability?: number;
  politicalStability?: number;
  govEffectiveness?: number;
  regulatoryQuality?: number;
  ruleOfLaw?: number;
  controlOfCorruption?: number;
  year: number;
}

export interface WBEconomicSnapshot {
  gdp?: WBIndicatorValue;
  gdpPerCapita?: WBIndicatorValue;
  gdpGrowth?: WBIndicatorValue;
  inflation?: WBIndicatorValue;
  militarySpending?: WBIndicatorValue;
  populationGrowth?: WBIndicatorValue;
  giniIndex?: WBIndicatorValue;
  povertyRate?: WBIndicatorValue;
}

async function getIndicator(countryIso2: string, indicator: string, years = 5): Promise<WBIndicatorValue[]> {
  try {
    const endYear = new Date().getFullYear();
    const startYear = endYear - years;
    const res = await fetch(
      `${WB_BASE}/country/${countryIso2}/indicator/${indicator}?format=json&per_page=${years + 2}&date=${startYear}:${endYear}&mrv=5`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const entries = data?.[1] || [];
    return entries
      .filter((e: Record<string, unknown>) => e.value !== null && e.value !== undefined)
      .map((e: Record<string, unknown>) => ({ year: Number(e.date), value: Number(e.value) }))
      .sort((a: WBIndicatorValue, b: WBIndicatorValue) => a.year - b.year);
  } catch { return []; }
}

/** Fetch most recent value of an indicator */
async function getLatest(countryIso2: string, indicator: string): Promise<WBIndicatorValue | null> {
  const series = await getIndicator(countryIso2, indicator, 5);
  return series[series.length - 1] ?? null;
}

export async function getGDP(countryIso2: string): Promise<WBIndicatorValue[]> {
  return getIndicator(countryIso2, 'NY.GDP.MKTP.CD');
}

export async function getInflation(countryIso2: string): Promise<WBIndicatorValue[]> {
  return getIndicator(countryIso2, 'FP.CPI.TOTL.ZG');
}

export async function getPopulationGrowth(countryIso2: string): Promise<WBIndicatorValue[]> {
  return getIndicator(countryIso2, 'SP.POP.GROW');
}

export async function getMilitaryExpenditure(countryIso2: string): Promise<WBIndicatorValue[]> {
  return getIndicator(countryIso2, 'MS.MIL.XPND.GD.ZS');
}

export async function getRefugeePopulation(countryIso2: string): Promise<WBIndicatorValue[]> {
  return getIndicator(countryIso2, 'SM.POP.REFG');
}

/** World Governance Indicators (WGI) — scored -2.5 to 2.5 */
export async function getGovernanceIndicators(countryIso2: string): Promise<WBGovernanceIndicators | null> {
  const [va, ps, ge, rq, rl, cc] = await Promise.all([
    getLatest(countryIso2, 'VA.EST'),   // Voice & Accountability
    getLatest(countryIso2, 'PV.EST'),   // Political Stability
    getLatest(countryIso2, 'GE.EST'),   // Gov Effectiveness
    getLatest(countryIso2, 'RQ.EST'),   // Regulatory Quality
    getLatest(countryIso2, 'RL.EST'),   // Rule of Law
    getLatest(countryIso2, 'CC.EST'),   // Control of Corruption
  ]);

  const year = ps?.year ?? va?.year ?? ge?.year;
  if (!year) return null;

  return {
    voiceAccountability: va?.value,
    politicalStability: ps?.value,
    govEffectiveness: ge?.value,
    regulatoryQuality: rq?.value,
    ruleOfLaw: rl?.value,
    controlOfCorruption: cc?.value,
    year,
  };
}

/** Fragile States — proxy via political stability and rule of law */
export async function getFragilityIndicators(countryIso2: string): Promise<{ fragilityScore: number; label: string; year: number } | null> {
  const gov = await getGovernanceIndicators(countryIso2);
  if (!gov) return null;

  // Scale WGI political stability (-2.5 to 2.5) to fragility (0-100, higher = more fragile)
  const psScore = gov.politicalStability ?? 0;
  const rlScore = gov.ruleOfLaw ?? 0;
  const normalized = Math.round(((2.5 - (psScore * 0.6 + rlScore * 0.4)) / 5) * 100);
  const fragilityScore = Math.max(0, Math.min(100, normalized));

  const label = fragilityScore >= 70 ? 'Alert' : fragilityScore >= 50 ? 'Warning' : fragilityScore >= 30 ? 'Elevated Warning' : 'Stable';

  return { fragilityScore, label, year: gov.year };
}

/** Time series for any indicator over N years */
export async function getTimeSeries(countryIso2: string, indicator: string, years = 10): Promise<WBIndicatorValue[]> {
  return getIndicator(countryIso2, indicator, years);
}

export async function getEconomicSnapshot(countryIso2: string): Promise<WBEconomicSnapshot> {
  const [gdp, gdpPerCapita, gdpGrowth, inflation, military, pop, gini, poverty] = await Promise.all([
    getLatest(countryIso2, 'NY.GDP.MKTP.CD'),
    getLatest(countryIso2, 'NY.GDP.PCAP.CD'),
    getLatest(countryIso2, 'NY.GDP.MKTP.KD.ZG'),
    getLatest(countryIso2, 'FP.CPI.TOTL.ZG'),
    getLatest(countryIso2, 'MS.MIL.XPND.GD.ZS'),
    getLatest(countryIso2, 'SP.POP.GROW'),
    getLatest(countryIso2, 'SI.POV.GINI'),
    getLatest(countryIso2, 'SI.POV.DDAY'),
  ]);
  return {
    gdp: gdp ?? undefined,
    gdpPerCapita: gdpPerCapita ?? undefined,
    gdpGrowth: gdpGrowth ?? undefined,
    inflation: inflation ?? undefined,
    militarySpending: military ?? undefined,
    populationGrowth: pop ?? undefined,
    giniIndex: gini ?? undefined,
    povertyRate: poverty ?? undefined,
  };
}

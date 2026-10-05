import type { SignalDesk, SignalSource } from './schema';
import { SIGNAL_COUNTRIES } from './geography';
import { sourceStatus } from './visualizations';
import { SIGNAL_WORLD_GEOGRAPHY, SIGNAL_WORLD_GEOGRAPHY_METADATA } from './world-geography';

export interface SignalCoverageCountry {
  code: string; name: string; longitude: number | null; latitude: number | null; coordinateAvailable: boolean;
  selected: boolean; activeSourceCount: number; activeFamilyCount: number; originalTextCount: number; headlineCount: number;
  historicalRevisionCount: number; withdrawnRevisionCount: number; supersededRevisionCount: number;
  synthetic: boolean; activeSyntheticCount: number; sourceRevisionIds: string[]; activeSourceRevisionIds: string[];
}
export interface SignalCoverageGlobe {
  countries: SignalCoverageCountry[];
  totals: {
    selectedCountryCount: number; coveredCountryCount: number; mappedCountryCount: number; coordinateMissingCountryCount: number;
    activeSourceCount: number; activeFamilyCount: number; mappedActiveSourceCount: number; unmappedActiveSourceCount: number;
    activeSourcesWithoutCoordinates: number; originalTextCount: number; headlineCount: number;
    historicalRevisionCount: number; mappedHistoricalRevisionCount: number; unmappedHistoricalRevisionCount: number;
    withdrawnRevisionCount: number; supersededRevisionCount: number; synthetic: boolean; activeSyntheticCount: number; truncated: boolean;
  };
  unmapped: { sourceRevisionIds: string[]; activeSourceRevisionIds: string[]; originalTextCount: number; headlineCount: number; withdrawnRevisionCount: number; supersededRevisionCount: number; synthetic: boolean; activeSyntheticCount: number };
  geography: typeof SIGNAL_WORLD_GEOGRAPHY_METADATA;
  limitations: string[];
}
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const registry = new Map(SIGNAL_COUNTRIES.map(c => [c.code, c.name]));
const geometry = new Map(SIGNAL_WORLD_GEOGRAPHY.filter(c => c.code).map(c => [c.code!, c]));
function country(code: string, selected: boolean): SignalCoverageCountry { const g = geometry.get(code); const available = typeof g?.longitude === 'number' && typeof g.latitude === 'number' && Number.isFinite(g.longitude) && Number.isFinite(g.latitude); return { code, name: registry.get(code)!, longitude: available ? g!.longitude : null, latitude: available ? g!.latitude : null, coordinateAvailable: available, selected, activeSourceCount: 0, activeFamilyCount: 0, originalTextCount: 0, headlineCount: 0, historicalRevisionCount: 0, withdrawnRevisionCount: 0, supersededRevisionCount: 0, synthetic: false, activeSyntheticCount: 0, sourceRevisionIds: [], activeSourceRevisionIds: [] }; }
/** Explicit analyst-assigned country coverage only. Mandate selection and publisher geography are independent. */
export function buildSignalCoverageGlobe(desk: SignalDesk): SignalCoverageGlobe {
  const sources = desk.sources.slice(0, 80); const rows = new Map<string, SignalCoverageCountry>(); const families = new Map<string, Set<string>>();
  for (const code of desk.scope.countries.slice(0, 30)) if (registry.has(code)) rows.set(code, country(code, true));
  const totals: SignalCoverageGlobe['totals'] = { selectedCountryCount: rows.size, coveredCountryCount: 0, mappedCountryCount: 0, coordinateMissingCountryCount: 0, activeSourceCount: 0, activeFamilyCount: 0, mappedActiveSourceCount: 0, unmappedActiveSourceCount: 0, activeSourcesWithoutCoordinates: 0, originalTextCount: 0, headlineCount: 0, historicalRevisionCount: sources.length, mappedHistoricalRevisionCount: 0, unmappedHistoricalRevisionCount: 0, withdrawnRevisionCount: 0, supersededRevisionCount: 0, synthetic: false, activeSyntheticCount: 0, truncated: desk.sources.length > 80 || desk.scope.countries.length > 30 };
  const unmapped: SignalCoverageGlobe['unmapped'] = { sourceRevisionIds: [], activeSourceRevisionIds: [], originalTextCount: 0, headlineCount: 0, withdrawnRevisionCount: 0, supersededRevisionCount: 0, synthetic: false, activeSyntheticCount: 0 };
  const activeFamilies = new Set<string>();
  function activeCounts(target: { originalTextCount: number; headlineCount: number; activeSyntheticCount: number }, source: SignalSource) { if (source.kind === 'original_text') target.originalTextCount++; else target.headlineCount++; target.activeSyntheticCount += Number(source.synthetic); }
  for (const source of sources) {
    const status = sourceStatus(desk, source); const active = status === 'available'; const code = source.coverageCountry && registry.has(source.coverageCountry) ? source.coverageCountry : null;
    totals.synthetic ||= source.synthetic;
    if (active) { totals.activeSourceCount++; activeFamilies.add(source.sourceId); activeCounts(totals, source); } else if (status === 'withdrawn') totals.withdrawnRevisionCount++; else totals.supersededRevisionCount++;
    if (!code) { totals.unmappedHistoricalRevisionCount++; unmapped.sourceRevisionIds.push(source.id); unmapped.synthetic ||= source.synthetic; if (active) { totals.unmappedActiveSourceCount++; unmapped.activeSourceRevisionIds.push(source.id); activeCounts(unmapped, source); } else if (status === 'withdrawn') unmapped.withdrawnRevisionCount++; else unmapped.supersededRevisionCount++; continue; }
    totals.mappedHistoricalRevisionCount++; let row = rows.get(code); if (!row) { row = country(code, false); rows.set(code, row); }
    row.historicalRevisionCount++; row.sourceRevisionIds.push(source.id); row.synthetic ||= source.synthetic;
    if (active) { totals.mappedActiveSourceCount++; row.activeSourceCount++; row.activeSourceRevisionIds.push(source.id); if (!families.has(code)) families.set(code, new Set()); families.get(code)!.add(source.sourceId); activeCounts(row, source); if (!row.coordinateAvailable) totals.activeSourcesWithoutCoordinates++; } else if (status === 'withdrawn') row.withdrawnRevisionCount++; else row.supersededRevisionCount++;
  }
  const countries = [...rows.values()].sort((a, b) => compare(a.code, b.code));
  for (const row of countries) { row.activeFamilyCount = families.get(row.code)?.size ?? 0; row.sourceRevisionIds.sort(compare); row.activeSourceRevisionIds.sort(compare); }
  totals.activeFamilyCount = activeFamilies.size; totals.coveredCountryCount = countries.filter(c => c.activeSourceCount > 0).length; totals.mappedCountryCount = countries.filter(c => c.historicalRevisionCount > 0).length; totals.coordinateMissingCountryCount = countries.filter(c => !c.coordinateAvailable).length;
  unmapped.sourceRevisionIds.sort(compare); unmapped.activeSourceRevisionIds.sort(compare);
  return { countries, totals, unmapped, geography: SIGNAL_WORLD_GEOGRAPHY_METADATA, limitations: [
    'Hollow selected countries describe the desk mandate. Filled coverage represents active sources with an explicit analyst-assigned covered country; selection alone establishes no coverage.',
    'Coverage country does not identify publisher origin, audience, independence or event location. No country is inferred from a hostname, language, headline or selected scope.',
    'Original text and discovery-only headlines are counted separately. Withdrawn and superseded revisions stay in history and do not fill active coverage.',
    'Unmapped sources stay outside country markers. Natural Earth label points are illustrative anchors, not source locations or country centroids. Small territories without a dataset anchor remain unplaced.',
    'Natural Earth 110m boundaries are local public-domain illustrative geography, not an endorsement of territorial claims. Counts describe this bounded panel, not public opinion, influence or comprehensive country coverage.',
  ] };
}

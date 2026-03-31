/**
 * Unified data feed aggregator
 * Merges ACLED, GDELT, ReliefWeb, HDX, GDELT Stability, UN News,
 * UNHCR, UCDP, World Bank, Crisis Group and SIPRI into a single
 * intelligence and conflict-profile stream.
 */

import { fetchEvents, isACLEDConfigured, type ACLEDEvent } from './acled-client';
import { searchArticles, type GDELTArticle } from './gdelt-client';
import { searchReports, type RWReport } from './reliefweb-client';
import { countryNameToIso3, getDisplacement, getFoodSecurity, getFunding } from './hdx-client';
import { getCurrentStability } from './gdelt-stability';
import { searchUNNews, type UNNewsItem } from './unnews-client';
import { getDisplacementStats, type UNHCRPopulation } from './unhcr-client';
import { getConflicts, type UCDPConflict } from './ucdp-client';
import {
  getEconomicSnapshot,
  getGovernanceIndicators,
  type WBEconomicSnapshot,
  type WBGovernanceIndicators,
} from './worldbank-client';
import { getCrisisWatch, type CrisisWatchEntry } from './crisisgroup-client';
import { getArmsTransfers, type SIPRIArmsSnapshot } from './sipri-client';

// ─── Re-export client types used by consumers ────────────────────────────────
export type { UNHCRPopulation, UCDPConflict, WBEconomicSnapshot, WBGovernanceIndicators, CrisisWatchEntry, SIPRIArmsSnapshot };

// ─── Core intelligence interfaces (unchanged) ─────────────────────────────────

export interface IntelligenceItem {
  id: string;
  source: 'acled' | 'gdelt' | 'reliefweb' | 'unnews';
  type: 'event' | 'article' | 'report' | 'statement';
  title: string;
  description: string;
  date: string;
  url?: string;
  actors: string[];
  location?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metadata: Record<string, unknown>;
}

export interface HumanitarianSnapshot {
  displacement?: { idps: number; refugees: number };
  foodSecurity?: { phase: string; population: number; pct: number }[];
  funding?: { required: number; funded: number; pct: number };
}

export interface StabilitySnapshot {
  score: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface SituationIntelligence {
  events: IntelligenceItem[];
  totalCount: number;
  sources: { acled: number; gdelt: number; reliefweb: number; unnews: number };
  humanitarian?: HumanitarianSnapshot;
  stability?: StabilitySnapshot;
  fetchedAt: string;
}

// ─── New v2 interfaces ────────────────────────────────────────────────────────

export interface SourceHealth {
  name: string;
  available: boolean;
  latencyMs: number;
  recordCount: number;
  lastSuccess: string | null;
  error?: string;
}

export interface DataQuality {
  overallScore: number; // 0-100
  sourcesAvailable: number;
  sourcesTotal: number;
  coverageGaps: string[];
  freshness: 'live' | 'recent' | 'stale';
  lastUpdated: string;
}

export interface GovernanceSnapshot {
  ruleOfLaw: number | null;
  governmentEffectiveness: number | null;
  politicalStability: number | null;
  controlOfCorruption: number | null;
  source: 'World Bank WGI';
  year: number | null;
}

export interface ArmsFlowSnapshot {
  totalValue?: number;
  topSuppliers?: string[];
  topRecipients?: string[];
  source: 'SIPRI';
  year?: number;
}

export interface PopulationSnapshot {
  refugees?: number;
  idps?: number;
  returnees?: number;
  asylumSeekers?: number;
  source: 'UNHCR';
  year?: number;
}

export interface ConflictProfile {
  intelligence: SituationIntelligence;
  riskAssessment: {
    composite: number;
    confidence: 'high' | 'medium' | 'low';
    sources: string[];
  };
  escalation: {
    glaslStage: number;
    stageName: string;
    trend: string;
  };
  humanitarian: HumanitarianSnapshot;
  governance: GovernanceSnapshot;
  armsFlows: ArmsFlowSnapshot;
  populationStats: PopulationSnapshot;
  ucdpConflicts: UCDPConflict[];
  crisisWatchStatus?: string;
  sourceHealth: SourceHealth[];
  dataQuality: DataQuality;
  fetchedAt: string;
}

// ─── Glasl stage lookup ───────────────────────────────────────────────────────

const GLASL_STAGES: { stage: number; name: string; minRatio: number }[] = [
  { stage: 9, name: 'Together into the Abyss', minRatio: 0.90 },
  { stage: 8, name: 'Fragmentation of the Enemy', minRatio: 0.75 },
  { stage: 7, name: 'Limited Annihilation Blows', minRatio: 0.60 },
  { stage: 6, name: 'Face-Threatening Strategies', minRatio: 0.45 },
  { stage: 5, name: 'Loss of Face', minRatio: 0.35 },
  { stage: 4, name: 'Images and Coalitions', minRatio: 0.25 },
  { stage: 3, name: 'Actions Not Words', minRatio: 0.15 },
  { stage: 2, name: 'Debate and Polemics', minRatio: 0.07 },
  { stage: 1, name: 'Hardening', minRatio: 0 },
];

function glaslFromRatio(eventRatio: number): { glaslStage: number; stageName: string } {
  const clamped = Math.max(0, Math.min(1, eventRatio));
  for (const entry of GLASL_STAGES) {
    if (clamped >= entry.minRatio) {
      return { glaslStage: entry.stage, stageName: entry.name };
    }
  }
  return { glaslStage: 1, stageName: 'Hardening' };
}

// ─── ISO3 → ISO2 helper (World Bank requires ISO2) ───────────────────────────

const ISO3_TO_ISO2: Record<string, string> = {
  AFG: 'AF', ALB: 'AL', DZA: 'DZ', AGO: 'AO', ARG: 'AR', ARM: 'AM', AUS: 'AU',
  AZE: 'AZ', BGD: 'BD', BLR: 'BY', BEL: 'BE', BLZ: 'BZ', BEN: 'BJ', BTN: 'BT',
  BOL: 'BO', BIH: 'BA', BWA: 'BW', BRA: 'BR', BFA: 'BF', BDI: 'BI', KHM: 'KH',
  CMR: 'CM', CAF: 'CF', TCD: 'TD', CHL: 'CL', CHN: 'CN', COL: 'CO', COD: 'CD',
  COG: 'CG', CRI: 'CR', CIV: 'CI', HRV: 'HR', CUB: 'CU', CYP: 'CY', CZE: 'CZ',
  DNK: 'DK', DJI: 'DJ', DOM: 'DO', ECU: 'EC', EGY: 'EG', SLV: 'SV', GNQ: 'GQ',
  ERI: 'ER', EST: 'EE', ETH: 'ET', FIN: 'FI', FRA: 'FR', GEO: 'GE', DEU: 'DE',
  GHA: 'GH', GRC: 'GR', GTM: 'GT', GIN: 'GN', GNB: 'GW', HTI: 'HT', HND: 'HN',
  HUN: 'HU', IND: 'IN', IDN: 'ID', IRN: 'IR', IRQ: 'IQ', ISR: 'IL', ITA: 'IT',
  JAM: 'JM', JPN: 'JP', JOR: 'JO', KAZ: 'KZ', KEN: 'KE', PRK: 'KP', KOR: 'KR',
  KWT: 'KW', KGZ: 'KG', LAO: 'LA', LBN: 'LB', LBR: 'LR', LBY: 'LY', LTU: 'LT',
  LVA: 'LV', MKD: 'MK', MDG: 'MG', MWI: 'MW', MYS: 'MY', MDV: 'MV', MLI: 'ML',
  MRT: 'MR', MEX: 'MX', MDA: 'MD', MNG: 'MN', MNE: 'ME', MAR: 'MA', MOZ: 'MZ',
  MMR: 'MM', NAM: 'NA', NPL: 'NP', NLD: 'NL', NZL: 'NZ', NIC: 'NI', NER: 'NE',
  NGA: 'NG', NOR: 'NO', OMN: 'OM', PAK: 'PK', PAN: 'PA', PNG: 'PG', PRY: 'PY',
  PER: 'PE', PHL: 'PH', POL: 'PL', PRT: 'PT', PSE: 'PS', QAT: 'QA', ROU: 'RO',
  RUS: 'RU', RWA: 'RW', SAU: 'SA', SEN: 'SN', SRB: 'RS', SLE: 'SL', SOM: 'SO',
  ZAF: 'ZA', SSD: 'SS', ESP: 'ES', LKA: 'LK', SDN: 'SD', SWE: 'SE', CHE: 'CH',
  SYR: 'SY', TWN: 'TW', TJK: 'TJ', TZA: 'TZ', THA: 'TH', TLS: 'TL', TGO: 'TG',
  TUN: 'TN', TUR: 'TR', TKM: 'TM', UGA: 'UG', UKR: 'UA', ARE: 'AE', GBR: 'GB',
  USA: 'US', URY: 'UY', UZB: 'UZ', VEN: 'VE', VNM: 'VN', YEM: 'YE', ZMB: 'ZM',
  ZWE: 'ZW',
};

function iso3ToIso2(iso3: string): string | null {
  return ISO3_TO_ISO2[iso3.toUpperCase()] ?? null;
}

// ─── Mappers (backwards-compatible) ─────────────────────────────────────────

export function acledToIntel(e: ACLEDEvent): IntelligenceItem {
  const severity = e.fatalities > 10 ? 'critical' : e.fatalities > 0 ? 'high' :
    ['Battles', 'Violence against civilians'].includes(e.event_type) ? 'medium' : 'low';
  return {
    id: `acled-${e.event_id_cnty}`,
    source: 'acled',
    type: 'event',
    title: `${e.event_type}: ${e.sub_event_type}`,
    description: e.notes?.slice(0, 500) || '',
    date: e.event_date,
    actors: [e.actor1, e.actor2].filter(Boolean),
    location: [e.location, e.admin1, e.country].filter(Boolean).join(', '),
    severity,
    metadata: { fatalities: e.fatalities, eventType: e.event_type, latitude: e.latitude, longitude: e.longitude },
  };
}

export function gdeltToIntel(a: GDELTArticle): IntelligenceItem {
  return {
    id: `gdelt-${Buffer.from(a.url).toString('base64').slice(0, 20)}`,
    source: 'gdelt',
    type: 'article',
    title: a.title,
    description: '',
    date: a.seendate,
    url: a.url,
    actors: [],
    severity: Math.abs(a.tone) > 5 ? 'high' : Math.abs(a.tone) > 2 ? 'medium' : 'low',
    metadata: { tone: a.tone, domain: a.domain, language: a.language, sourcecountry: a.sourcecountry },
  };
}

export function rwToIntel(r: RWReport): IntelligenceItem {
  return {
    id: `rw-${r.id}`,
    source: 'reliefweb',
    type: 'report',
    title: r.title,
    description: r.body?.slice(0, 300) || '',
    date: r.date,
    url: r.url,
    actors: [],
    location: r.country,
    severity: r.format === 'Situation Report' ? 'high' : 'medium',
    metadata: { source: r.source, format: r.format, theme: r.theme },
  };
}

export function unToIntel(item: UNNewsItem): IntelligenceItem {
  return {
    id: `un-${Buffer.from(item.url).toString('base64').slice(0, 20)}`,
    source: 'unnews',
    type: 'statement',
    title: item.title,
    description: item.summary,
    date: item.date,
    url: item.url,
    actors: ['United Nations'],
    severity: item.topic === 'Peace & Security' ? 'high' : 'medium',
    metadata: { topic: item.topic },
  };
}

// ─── Internal cache for ConflictProfile (15-minute TTL) ──────────────────────

interface ProfileCacheEntry {
  data: ConflictProfile;
  ts: number;
}
const profileCache = new Map<string, ProfileCacheEntry>();
const PROFILE_CACHE_TTL = 15 * 60 * 1000;

// ─── Helper: time a promise and record SourceHealth ──────────────────────────

async function timed<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ result: T | null; health: SourceHealth }> {
  const start = Date.now();
  try {
    const result = await fn();
    const latencyMs = Date.now() - start;
    const recordCount = Array.isArray(result) ? result.length : result !== null ? 1 : 0;
    return {
      result,
      health: {
        name,
        available: result !== null,
        latencyMs,
        recordCount,
        lastSuccess: result !== null ? new Date().toISOString() : null,
      },
    };
  } catch (err) {
    return {
      result: null,
      health: {
        name,
        available: false,
        latencyMs: Date.now() - start,
        recordCount: 0,
        lastSuccess: null,
        error: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

// ─── getSituationIntelligence (backwards compatible) ─────────────────────────

/**
 * Fetch intelligence from all available data sources for a country/situation.
 * This is the v1 API — preserved for full backwards compatibility.
 */
export async function getSituationIntelligence(options: {
  country: string;
  query?: string;
  dateStart?: string;
  limit?: number;
}): Promise<SituationIntelligence> {
  const iso3 = countryNameToIso3(options.country);

  const results = await Promise.allSettled([
    isACLEDConfigured()
      ? fetchEvents({ country: options.country, dateStart: options.dateStart, limit: options.limit || 50 })
      : Promise.resolve([]),
    searchArticles({ query: options.query || options.country, timespan: '7d', maxRecords: 20 }),
    searchReports({ country: options.country, limit: 10 }),
    iso3 ? getDisplacement(iso3) : Promise.resolve({ idps: 0, refugees: 0, source: '' }),
    iso3 ? getFoodSecurity(iso3) : Promise.resolve([]),
    iso3 ? getFunding(iso3) : Promise.resolve(null),
    getCurrentStability(options.country.slice(0, 2).toUpperCase()),
    searchUNNews(options.query || options.country, 8),
  ]);

  const acledEvents = results[0].status === 'fulfilled' ? results[0].value as ACLEDEvent[] : [];
  const gdeltArticles = results[1].status === 'fulfilled' ? results[1].value as GDELTArticle[] : [];
  const rwReports = results[2].status === 'fulfilled' ? results[2].value as RWReport[] : [];
  const displacement = results[3].status === 'fulfilled' ? results[3].value as { idps: number; refugees: number } : undefined;
  const foodSecurity = results[4].status === 'fulfilled' ? results[4].value as { phase: string; population: number; pct: number }[] : undefined;
  const funding = results[5].status === 'fulfilled' ? results[5].value as { required: number; funded: number; pct: number } | null : undefined;
  const stability = results[6].status === 'fulfilled' ? results[6].value as { score: number; trend: 'improving' | 'stable' | 'worsening' } | null : undefined;
  const unNews = results[7].status === 'fulfilled' ? results[7].value as UNNewsItem[] : [];

  const items: IntelligenceItem[] = [
    ...acledEvents.map(acledToIntel),
    ...gdeltArticles.map(gdeltToIntel),
    ...rwReports.map(rwToIntel),
    ...unNews.map(unToIntel),
  ];

  const severityOrder: Record<IntelligenceItem['severity'], number> = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return {
    events: items,
    totalCount: items.length,
    sources: { acled: acledEvents.length, gdelt: gdeltArticles.length, reliefweb: rwReports.length, unnews: unNews.length },
    humanitarian: (displacement || foodSecurity?.length || funding) ? {
      displacement: displacement?.idps || displacement?.refugees ? displacement : undefined,
      foodSecurity: foodSecurity?.length ? foodSecurity : undefined,
      funding: funding || undefined,
    } : undefined,
    stability: stability ? { score: stability.score, trend: stability.trend } : undefined,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── getConflictProfile (v2 full-spectrum API) ────────────────────────────────

/**
 * Fetch a full ConflictProfile for a country, aggregating all 9+ data sources
 * in parallel with latency tracking, SourceHealth, and DataQuality metrics.
 * Results are cached in-memory for 15 minutes.
 */
export async function getConflictProfile(options: {
  country: string;
  query?: string;
  dateStart?: string;
  limit?: number;
  situation?: { actors: string[]; region: string };
}): Promise<ConflictProfile> {
  const cacheKey = options.country.toLowerCase();
  const cached = profileCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < PROFILE_CACHE_TTL) {
    return cached.data;
  }

  const iso3 = countryNameToIso3(options.country) ?? '';
  const iso2 = iso3 ? (iso3ToIso2(iso3) ?? options.country.slice(0, 2).toUpperCase()) : options.country.slice(0, 2).toUpperCase();
  const gdeltCountryCode = options.country.slice(0, 2).toUpperCase();

  // ── Parallel fetch all sources ──────────────────────────────────────────────
  const [
    acledResult,
    gdeltResult,
    rwResult,
    unNewsResult,
    hdxDispResult,
    hdxFoodResult,
    hdxFundResult,
    stabilityResult,
    unhcrResult,
    ucdpResult,
    wbEconResult,
    wbGovResult,
    crisisWatchResult,
    sipriResult,
  ] = await Promise.all([
    timed('ACLED', () =>
      isACLEDConfigured()
        ? fetchEvents({ country: options.country, dateStart: options.dateStart, limit: options.limit ?? 50 })
        : Promise.resolve([]),
    ),
    timed('GDELT', () =>
      searchArticles({ query: options.query ?? options.country, timespan: '7d', maxRecords: 20 }),
    ),
    timed('ReliefWeb', () =>
      searchReports({ country: options.country, limit: 10 }),
    ),
    timed('UN News', () =>
      searchUNNews(options.query ?? options.country, 8),
    ),
    timed('HDX Displacement', () =>
      iso3 ? getDisplacement(iso3) : Promise.resolve(null),
    ),
    timed('HDX Food Security', () =>
      iso3 ? getFoodSecurity(iso3) : Promise.resolve([]),
    ),
    timed('HDX Funding', () =>
      iso3 ? getFunding(iso3) : Promise.resolve(null),
    ),
    timed('GDELT Stability', () =>
      getCurrentStability(gdeltCountryCode),
    ),
    timed('UNHCR', () =>
      iso3 ? getDisplacementStats(iso3) : Promise.resolve(null),
    ),
    timed('UCDP', () =>
      getConflicts(options.country),
    ),
    timed('World Bank Economic', () =>
      getEconomicSnapshot(iso2),
    ),
    timed('World Bank Governance', () =>
      getGovernanceIndicators(iso2),
    ),
    timed('Crisis Group', () =>
      getCrisisWatch(options.country),
    ),
    timed('SIPRI', () =>
      getArmsTransfers(options.country),
    ),
  ]);

  // ── Unpack results ──────────────────────────────────────────────────────────
  const acledEvents = (acledResult.result as ACLEDEvent[] | null) ?? [];
  const gdeltArticles = (gdeltResult.result as GDELTArticle[] | null) ?? [];
  const rwReports = (rwResult.result as RWReport[] | null) ?? [];
  const unNews = (unNewsResult.result as UNNewsItem[] | null) ?? [];

  const hdxDisp = hdxDispResult.result as { idps: number; refugees: number } | null;
  const hdxFood = (hdxFoodResult.result as { phase: string; population: number; pct: number }[] | null) ?? [];
  const hdxFund = hdxFundResult.result as { required: number; funded: number; pct: number } | null;
  const stability = stabilityResult.result as { score: number; trend: 'improving' | 'stable' | 'worsening'; recent7d: number; baseline30d: number } | null;

  const unhcrData = unhcrResult.result as UNHCRPopulation | null;
  const ucdpConflicts = (ucdpResult.result as UCDPConflict[] | null) ?? [];
  const wbEcon = wbEconResult.result as WBEconomicSnapshot | null;
  const wbGov = wbGovResult.result as WBGovernanceIndicators | null;
  const crisisWatch = crisisWatchResult.result as CrisisWatchEntry | null;
  const sipri = sipriResult.result as SIPRIArmsSnapshot | null;

  // ── Build SituationIntelligence ─────────────────────────────────────────────
  const items: IntelligenceItem[] = [
    ...acledEvents.map(acledToIntel),
    ...gdeltArticles.map(gdeltToIntel),
    ...rwReports.map(rwToIntel),
    ...unNews.map(unToIntel),
  ];

  const severityOrder: Record<IntelligenceItem['severity'], number> = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const humanitarian: HumanitarianSnapshot = {
    displacement: hdxDisp?.idps || hdxDisp?.refugees ? hdxDisp : undefined,
    foodSecurity: hdxFood.length ? hdxFood : undefined,
    funding: hdxFund ?? undefined,
  };

  const intelligence: SituationIntelligence = {
    events: items,
    totalCount: items.length,
    sources: {
      acled: acledEvents.length,
      gdelt: gdeltArticles.length,
      reliefweb: rwReports.length,
      unnews: unNews.length,
    },
    humanitarian,
    stability: stability ? { score: stability.score, trend: stability.trend } : undefined,
    fetchedAt: new Date().toISOString(),
  };

  // ── Risk composite ──────────────────────────────────────────────────────────
  // Three signals normalised to 0-100:
  //   1. Security intensity: acled events / 100, clamped
  //   2. GDELT instability: stability score (already 0-N instability; normalise against 3.0 as high)
  //   3. Humanitarian need: food insecurity phase 3+ population fraction
  const securitySignal = Math.min(1, acledEvents.length / 100);
  const gdeltSignal = stability ? Math.min(1, stability.score / 3.0) : 0;
  const foodPhase3Plus = hdxFood
    .filter((f) => ['IPC 3', 'IPC 4', 'IPC 5', 'Phase 3', 'Phase 4', 'Phase 5', 'Crisis', 'Emergency', 'Catastrophe'].some((p) => f.phase.includes(p)))
    .reduce((s, f) => s + f.pct, 0);
  const humanSignal = Math.min(1, foodPhase3Plus / 100);

  const signals = [securitySignal, gdeltSignal, humanSignal].filter((s) => s > 0);
  const compositeRaw = signals.length > 0 ? signals.reduce((a, b) => a + b, 0) / signals.length : 0;
  const composite = Math.round(Math.min(100, compositeRaw * 100));

  const activeSources = [
    acledEvents.length > 0 && 'ACLED',
    gdeltArticles.length > 0 && 'GDELT',
    stability !== null && 'GDELT Stability',
    unhcrData !== null && 'UNHCR',
    ucdpConflicts.length > 0 && 'UCDP',
    wbGov !== null && 'World Bank WGI',
  ].filter((s): s is string => Boolean(s));

  const confidence: 'high' | 'medium' | 'low' =
    activeSources.length >= 4 ? 'high' : activeSources.length >= 2 ? 'medium' : 'low';

  // ── Escalation ──────────────────────────────────────────────────────────────
  // Use ratio of composite to 1.0 for Glasl mapping
  const { glaslStage, stageName } = glaslFromRatio(compositeRaw);
  const escalationTrend = stability?.trend ?? (ucdpConflicts.some((c) => c.intensity_level === 2) ? 'worsening' : 'stable');

  // ── Governance (WGI) ────────────────────────────────────────────────────────
  const governance: GovernanceSnapshot = {
    ruleOfLaw: wbGov?.ruleOfLaw ?? null,
    governmentEffectiveness: wbGov?.govEffectiveness ?? null,
    politicalStability: wbGov?.politicalStability ?? null,
    controlOfCorruption: wbGov?.controlOfCorruption ?? null,
    source: 'World Bank WGI',
    year: wbGov?.year ?? null,
  };

  // ── Arms flows ──────────────────────────────────────────────────────────────
  const armsFlows: ArmsFlowSnapshot = {
    totalValue: sipri ? sipri.totalImportTIV + sipri.totalExportTIV : undefined,
    topSuppliers: sipri?.majorSuppliers,
    topRecipients: sipri?.majorRecipients,
    source: 'SIPRI',
    year: sipri ? new Date().getFullYear() - 1 : undefined,
  };

  // ── Population stats ────────────────────────────────────────────────────────
  const populationStats: PopulationSnapshot = {
    refugees: unhcrData?.refugees,
    idps: unhcrData?.idps,
    returnees: unhcrData?.returnees,
    asylumSeekers: unhcrData?.asylumSeekers,
    source: 'UNHCR',
    year: unhcrData?.year,
  };

  // ── Source health list ──────────────────────────────────────────────────────
  const sourceHealth: SourceHealth[] = [
    acledResult.health,
    gdeltResult.health,
    rwResult.health,
    unNewsResult.health,
    hdxDispResult.health,
    hdxFoodResult.health,
    hdxFundResult.health,
    stabilityResult.health,
    unhcrResult.health,
    ucdpResult.health,
    wbEconResult.health,
    wbGovResult.health,
    crisisWatchResult.health,
    sipriResult.health,
  ];

  // ── Data quality ────────────────────────────────────────────────────────────
  const sourcesTotal = sourceHealth.length;
  const sourcesAvailable = sourceHealth.filter((s) => s.available).length;
  const coverageGaps = sourceHealth.filter((s) => !s.available).map((s) => s.name);

  const avgLatencyMs = sourceHealth.reduce((s, h) => s + h.latencyMs, 0) / sourcesTotal;
  const freshness: DataQuality['freshness'] =
    avgLatencyMs < 5000 ? 'live' : avgLatencyMs < 15000 ? 'recent' : 'stale';

  const overallScore = Math.round((sourcesAvailable / sourcesTotal) * 100);

  const dataQuality: DataQuality = {
    overallScore,
    sourcesAvailable,
    sourcesTotal,
    coverageGaps,
    freshness,
    lastUpdated: new Date().toISOString(),
  };

  const profile: ConflictProfile = {
    intelligence,
    riskAssessment: {
      composite,
      confidence,
      sources: activeSources,
    },
    escalation: {
      glaslStage,
      stageName,
      trend: escalationTrend,
    },
    humanitarian,
    governance,
    armsFlows,
    populationStats,
    ucdpConflicts,
    crisisWatchStatus: crisisWatch?.status,
    sourceHealth,
    dataQuality,
    fetchedAt: new Date().toISOString(),
  };

  profileCache.set(cacheKey, { data: profile, ts: Date.now() });
  return profile;
}

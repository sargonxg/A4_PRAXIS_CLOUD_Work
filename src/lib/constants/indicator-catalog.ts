/**
 * Domain-specific indicator catalogs used by /api/ai/risk-indicators to
 * scope a grounded-search expansion. Each indicator is a one-line spec
 * that gets fed into the prompt; the LLM is asked to populate value,
 * trend, source, and confidence from grounded results + situation corpus.
 *
 * Frameworks referenced (see CLAUDE.md): INFORM Risk Index, Glasl 9-stage,
 * Galtung Triangle, Stedman spoilers, IPC Food Security, OCHA SitRep.
 */

export interface IndicatorSpec {
  id: string;
  name: string;
  framework: string;
  unit?: string;
  rationale: string;
}

export type DomainKey =
  | 'generic'
  | 'armed-conflict-security'
  | 'diplomacy-negotiation'
  | 'humanitarian'
  | 'human-rights'
  | 'governance-rule-of-law'
  | 'economic-sanctions'
  | 'development-stabilization'
  | 'climate-environmental-security'
  | 'information-cyber'
  | 'transnational-threats';

const COMMON_INDICATORS: IndicatorSpec[] = [
  { id: 'inform-overall', name: 'INFORM composite risk', framework: 'INFORM Risk Index', unit: '0–10', rationale: 'Headline composite — drives heatmap colour.' },
  { id: 'glasl-stage', name: 'Glasl escalation stage', framework: 'Glasl 9-stage', unit: 'stage', rationale: 'Where the conflict sits on the 9-stage hardening → abyss model.' },
  { id: 'incident-trend-30d', name: 'Incident trend (30d)', framework: 'GDELT/ACLED proxy', unit: '%Δ', rationale: 'Direction and magnitude of incident volume vs prior 30 days.' },
  { id: 'rhetoric-temperature', name: 'Rhetorical temperature', framework: 'Galtung Triangle (cultural)', unit: '−5 to +5', rationale: 'Tone of public statements by primary actors.' },
];

export const INDICATOR_CATALOG: Record<DomainKey, IndicatorSpec[]> = {
  'generic': COMMON_INDICATORS,
  'armed-conflict-security': [
    ...COMMON_INDICATORS,
    { id: 'armed-clashes-7d', name: 'Armed clashes (7d)', framework: 'ACLED proxy', unit: 'count', rationale: 'Recent kinetic activity, week-over-week.' },
    { id: 'civilian-casualties-30d', name: 'Civilian casualties (30d)', framework: 'IHL / OCHA', unit: 'count', rationale: 'Civilian harm signal.' },
    { id: 'ceasefire-violations', name: 'Ceasefire violations', framework: 'Berghof / Stedman', unit: 'count', rationale: 'Spoiler activity vs current agreements.' },
    { id: 'frontline-shift', name: 'Frontline shift', framework: 'OSINT', unit: 'km', rationale: 'Net territorial change in the last week.' },
  ],
  'diplomacy-negotiation': [
    ...COMMON_INDICATORS,
    { id: 'track-1-meetings-30d', name: 'Track-1 meetings (30d)', framework: 'Putnam two-level', unit: 'count', rationale: 'Pace of formal diplomacy.' },
    { id: 'mediator-engagement', name: 'Mediator engagement', framework: 'Zartman ripeness', unit: 'qual', rationale: 'Active mediators and channels.' },
    { id: 'cbm-momentum', name: 'CBM momentum', framework: 'Berghof Mediation', unit: 'qual', rationale: 'Confidence-building measures gained / lost.' },
  ],
  'humanitarian': [
    ...COMMON_INDICATORS,
    { id: 'idps', name: 'IDPs in country', framework: 'UNHCR / OCHA', unit: 'count', rationale: 'Internally displaced persons load.' },
    { id: 'refugees-cross-border', name: 'Cross-border refugees', framework: 'UNHCR', unit: 'count', rationale: 'Outflow into neighbours.' },
    { id: 'ipc-phase', name: 'IPC food-security phase', framework: 'IPC', unit: 'phase 1–5', rationale: 'Highest-classification phase in scope.' },
    { id: 'hrp-funding-gap', name: 'HRP funding gap', framework: 'OCHA appeal', unit: '%', rationale: 'Underfunding signal for response capacity.' },
  ],
  'human-rights': [
    ...COMMON_INDICATORS,
    { id: 'arrests-detentions-30d', name: 'Arrests / detentions (30d)', framework: 'OHCHR', unit: 'count', rationale: 'Civic-space contraction signal.' },
    { id: 'press-freedom-rank', name: 'Press freedom rank', framework: 'RSF', unit: 'rank', rationale: 'Trend in journalistic environment.' },
  ],
  'governance-rule-of-law': [
    ...COMMON_INDICATORS,
    { id: 'rule-of-law-index', name: 'Rule-of-law index', framework: 'WJP', unit: '0–1', rationale: 'Headline governance signal.' },
    { id: 'corruption-cpi', name: 'Corruption CPI', framework: 'Transparency Intl.', unit: '0–100', rationale: 'Public-sector integrity.' },
  ],
  'economic-sanctions': [
    ...COMMON_INDICATORS,
    { id: 'sanctions-active-count', name: 'Active sanctions designations', framework: 'OFAC/EU/UK lists', unit: 'count', rationale: 'Pressure intensity.' },
    { id: 'fx-volatility-30d', name: 'FX volatility (30d)', framework: 'IMF / market', unit: '%', rationale: 'Macro stress proxy.' },
  ],
  'development-stabilization': [
    ...COMMON_INDICATORS,
    { id: 'gdp-yoy', name: 'GDP YoY', framework: 'World Bank / IMF', unit: '%', rationale: 'Growth trajectory.' },
    { id: 'unemployment-youth', name: 'Youth unemployment', framework: 'ILO', unit: '%', rationale: 'Stabilisation risk factor.' },
  ],
  'climate-environmental-security': [
    ...COMMON_INDICATORS,
    { id: 'drought-coverage', name: 'Drought coverage', framework: 'NOAA / FEWS NET', unit: '%', rationale: 'Climate-driven instability proxy.' },
    { id: 'water-stress', name: 'Water stress', framework: 'WRI Aqueduct', unit: '0–5', rationale: 'Resource competition driver.' },
  ],
  'information-cyber': [
    ...COMMON_INDICATORS,
    { id: 'disinfo-incidents-30d', name: 'Disinformation incidents (30d)', framework: 'EUDisinfoLab', unit: 'count', rationale: 'Information-environment activity.' },
    { id: 'cyber-incidents-30d', name: 'Cyber incidents (30d)', framework: 'CISA / ENISA', unit: 'count', rationale: 'Cyber escalation.' },
  ],
  'transnational-threats': [
    ...COMMON_INDICATORS,
    { id: 'terror-attacks-30d', name: 'Terror attacks (30d)', framework: 'GTD / ACLED', unit: 'count', rationale: 'Non-state armed group activity.' },
    { id: 'illicit-flows', name: 'Illicit flows', framework: 'GI-TOC', unit: 'qual', rationale: 'Trafficking, finance, smuggling signal.' },
  ],
};

export function indicatorsForDomain(domain: string | null | undefined): IndicatorSpec[] {
  const key = (domain ?? 'generic') as DomainKey;
  return INDICATOR_CATALOG[key] ?? COMMON_INDICATORS;
}

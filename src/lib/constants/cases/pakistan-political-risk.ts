/**
 * Pakistan political risk template — public-source seed data.
 *
 * Audience: sovereign / political risk analyst at a research desk or fund.
 * Time horizon: rolling 12 months from May 2026.
 *
 * Sources used here are real public outlets; URLs point at landing pages so
 * the demo never depends on a single article that may rotate. Numeric
 * estimates are shown as illustrative, not authoritative.
 */

import type {
  CaseStakeholder,
  CaseTimelineEvent,
  CaseDocument,
  CaseSource,
  CaseMediaOutlet,
  CaseTemplateData,
} from './case-types';

export const PAKISTAN_TEMPLATE_ID = 'pakistan-political-risk';

const SITUATION_STAKEHOLDERS: CaseStakeholder[] = [
  {
    id: 'pk-stk-pmln',
    name: 'Pakistan Muslim League (N) – Government',
    shortName: 'PML-N government',
    type: 'state',
    power: 0.74, legitimacy: 0.55, urgency: 0.82,
    quadrant: 'definitive',
    position:
      'Hold the IMF programme, manage civil-military balance, sequence elections without losing sovereign rating.',
    interests: ['Programme tranches', 'Sovereign rating', 'Coalition stability', 'Punjab patronage'],
    leverage: ['Federal budget', 'Provincial finance commissions', 'Appointment power', 'Energy tariff authority'],
    constraints: ['Thin parliamentary majority', 'Public dissatisfaction with austerity', 'Inflation memory'],
  },
  {
    id: 'pk-stk-establishment',
    name: 'Pakistan Army (GHQ) and ISI',
    shortName: 'Establishment',
    type: 'military',
    power: 0.92, legitimacy: 0.48, urgency: 0.88,
    quadrant: 'definitive',
    position:
      'Restore institutional primacy, re-anchor counter-terror posture in KP, manage PTI containment without rupture.',
    interests: ['Institutional autonomy', 'Border security', 'Counter-TTP operations', 'CPEC continuity'],
    leverage: ['Coercive monopoly', 'Selective accountability tools', 'Foreign-policy gatekeeping', 'Media steering'],
    constraints: ['Reputational drag from political role', 'TTP losses in KP', 'Balochistan attrition'],
  },
  {
    id: 'pk-stk-pti',
    name: 'Pakistan Tehreek-e-Insaf (PTI) – Opposition',
    shortName: 'PTI',
    type: 'civil_society',
    power: 0.58, legitimacy: 0.62, urgency: 0.95,
    quadrant: 'definitive',
    position:
      'Restore Imran Khan, contest provincial elections, mobilise diaspora pressure on civil-military balance.',
    interests: ['Imran Khan release', 'KP control', 'Election integrity', 'Constitutional review'],
    leverage: ['Street mobilisation', 'Diaspora finance', 'KP provincial machinery', 'Social-media reach'],
    constraints: ['Leader incarcerated', 'Banned rallies in Punjab', 'Internal succession contest'],
  },
  {
    id: 'pk-stk-imf',
    name: 'International Monetary Fund (Pakistan team)',
    shortName: 'IMF',
    type: 'international_org',
    power: 0.78, legitimacy: 0.84, urgency: 0.62,
    quadrant: 'dominant',
    position:
      'Stay on Extended Fund Facility benchmarks: revenue, energy circular debt, SOE reform, FX market integrity.',
    interests: ['Programme on track', 'External debt sustainability', 'Energy sector reform'],
    leverage: ['Tranche disbursement', 'Catalytic effect on bilateral / market financing', 'Reform conditionality'],
    constraints: ['Political feasibility of revenue measures', 'Coordination with World Bank/ADB'],
  },
  {
    id: 'pk-stk-china',
    name: 'People’s Republic of China (CPEC stakeholders)',
    shortName: 'PRC / CPEC',
    type: 'external_state',
    power: 0.86, legitimacy: 0.62, urgency: 0.7,
    quadrant: 'dominant',
    position:
      'Protect CPEC corridor and Chinese nationals; manage debt rollovers without write-downs; insist on security guarantees.',
    interests: ['Gwadar security', 'IPP arrears', 'CPEC Phase II', 'Counter-BLA operations'],
    leverage: ['Bilateral debt rollover', 'Investment pipeline', 'Strategic backing in multilateral fora'],
    constraints: ['Repeated attacks on Chinese personnel', 'Public Pakistani caution on debt'],
  },
  {
    id: 'pk-stk-saudi',
    name: 'Saudi Arabia (PIF + Foreign Ministry)',
    shortName: 'Saudi Arabia',
    type: 'external_state',
    power: 0.74, legitimacy: 0.58, urgency: 0.52,
    quadrant: 'dominant',
    position:
      'Convert deposits and pledged FDI into asset packages (mining, agriculture); coordinate with IMF for catalytic effect.',
    interests: ['Reko Diq stake', 'Agricultural FDI', 'Defence-industrial offsets', 'Hajj quotas'],
    leverage: ['Central bank deposits', 'PIF investment pledges', 'Oil deferred-payment facility'],
    constraints: ['Reform-conditional disbursement', 'Yemen / regional bandwidth'],
  },
  {
    id: 'pk-stk-ttp',
    name: 'Tehrik-i-Taliban Pakistan (TTP)',
    shortName: 'TTP',
    type: 'non_state_armed',
    power: 0.42, legitimacy: 0.18, urgency: 0.96,
    quadrant: 'dangerous',
    position:
      'Reassert sanctuaries in KP and merged districts; campaign tempo against police, military, and pro-state clerics.',
    interests: ['Territorial control in tribal districts', 'Funding extraction', 'Cross-border sanctuary in Afghanistan'],
    leverage: ['Operational tempo', 'Local intimidation', 'Negotiation leverage via violence'],
    constraints: ['Afghan Taliban frictions', 'Fragmented command', 'Tribal jirga rejection'],
  },
  {
    id: 'pk-stk-bla',
    name: 'Baloch Liberation Army (BLA)',
    shortName: 'BLA',
    type: 'non_state_armed',
    power: 0.32, legitimacy: 0.28, urgency: 0.92,
    quadrant: 'demanding',
    position:
      'High-tempo attacks on CPEC infrastructure and Chinese personnel; pressure for Baloch autonomy and resource share.',
    interests: ['Baloch autonomy', 'Royalty redistribution', 'International attention'],
    leverage: ['Insurgent operations', 'Diaspora messaging', 'Mineral-belt disruption'],
    constraints: ['Limited urban penetration', 'Tribal divisions'],
  },
  {
    id: 'pk-stk-judiciary',
    name: 'Supreme Court & Election Commission of Pakistan',
    shortName: 'SC + ECP',
    type: 'judiciary',
    power: 0.68, legitimacy: 0.62, urgency: 0.74,
    quadrant: 'definitive',
    position:
      'Rule on PTI petitions, election delimitation, and 26th Amendment fallout while protecting institutional reputation.',
    interests: ['Institutional reputation', 'Constitutional clarity', 'Electoral schedule discipline'],
    leverage: ['Suo motu jurisdiction', 'ECP delimitation authority', 'Bar association support'],
    constraints: ['Internal benches divided post-26th Amendment', 'Public scepticism'],
  },
  {
    id: 'pk-stk-business',
    name: 'Pakistan Business Council & top exporters',
    shortName: 'PBC',
    type: 'business',
    power: 0.55, legitimacy: 0.58, urgency: 0.62,
    quadrant: 'dominant',
    position:
      'Push for FX stability, tariff certainty, and energy-cost predictability; lobby against retroactive taxation.',
    interests: ['FX stability', 'Energy tariffs', 'Sales-tax simplification', 'Export rebates'],
    leverage: ['Employment footprint', 'Export earnings', 'Coalitional access to PML-N'],
    constraints: ['Limited sway over IMF benchmarks'],
  },
  {
    id: 'pk-stk-pkprovinces',
    name: 'KP & Punjab provincial governments',
    shortName: 'KP + Punjab',
    type: 'subnational',
    power: 0.62, legitimacy: 0.6, urgency: 0.84,
    quadrant: 'definitive',
    position:
      'Manage security operations (KP), local PTI politics (KP), and law-and-order around protests (Punjab).',
    interests: ['Provincial finance commission share', 'Security force coordination', 'Visible delivery'],
    leverage: ['Police authority', 'Local administration', 'Service delivery levers'],
    constraints: ['Federal-provincial friction', 'Budget pressure'],
  },
];

const OFFICE_STAKEHOLDERS: CaseStakeholder[] = [
  {
    id: 'pk-off-pm',
    name: 'Portfolio Manager (Frontier debt fund)',
    shortName: 'PM',
    type: 'principal',
    power: 0.92, legitimacy: 0.86, urgency: 0.92,
    quadrant: 'definitive',
    position: 'Decide overweight/underweight ahead of next IMF review and election window.',
    interests: ['Sharpe ratio', 'Drawdown risk', 'Liquidity', 'Catalyst clarity'],
    leverage: ['Position size', 'Time horizon', 'Mandate flex'],
    constraints: ['Risk committee limits', 'Single-issuer caps'],
    office: true,
  },
  {
    id: 'pk-off-cio',
    name: 'CIO – emerging markets',
    shortName: 'CIO',
    type: 'principal',
    power: 0.88, legitimacy: 0.86, urgency: 0.74,
    quadrant: 'dominant',
    position: 'Wants thesis-defensible exposure, not headline-driven; cares about base/bear/bull discipline.',
    interests: ['Process integrity', 'House view consistency', 'Risk-adjusted returns'],
    leverage: ['Capital allocation', 'Veto power'],
    constraints: ['House view alignment'],
    office: true,
  },
  {
    id: 'pk-off-compliance',
    name: 'Compliance & ESG desk',
    shortName: 'Compliance',
    type: 'agency',
    power: 0.72, legitimacy: 0.78, urgency: 0.66,
    quadrant: 'dominant',
    position: 'Screen for sanctions, governance, and human-rights flags; sign off before sizing up.',
    interests: ['Sanctions hygiene', 'ESG screen pass-through', 'Documentation trail'],
    leverage: ['Trade veto', 'Mandatory pre-clearance'],
    constraints: ['Documentation deadlines'],
    office: true,
  },
  {
    id: 'pk-off-clients',
    name: 'Institutional clients (LP advisory committee)',
    shortName: 'LP advisory',
    type: 'donor',
    power: 0.68, legitimacy: 0.84, urgency: 0.58,
    quadrant: 'dominant',
    position:
      'Want quarterly client letter to be defensible; ask for scenario probabilities and downside protection narrative.',
    interests: ['Scenario probabilities', 'Stop-loss discipline', 'Country-risk transparency'],
    leverage: ['Mandate renewal', 'Fee negotiation'],
    constraints: ['Public-disclosure norms'],
    office: true,
  },
  {
    id: 'pk-off-research',
    name: 'In-house research analysts (junior)',
    shortName: 'Research analysts',
    type: 'civil_society',
    power: 0.42, legitimacy: 0.78, urgency: 0.66,
    quadrant: 'dependent',
    position: 'Need a clear instruction set + source list; turnaround under 48h for the next memo.',
    interests: ['Clear deliverables', 'Source coverage', 'Stable framework'],
    leverage: ['Throughput', 'Source triage', 'Quality control'],
    constraints: ['Calendar load', 'Capability gaps'],
    office: true,
  },
];

const DOCUMENTS: CaseDocument[] = [
  {
    id: 'pk-doc-imf-eff',
    title: 'IMF Country Report on Pakistan – EFF first review',
    publisher: 'International Monetary Fund',
    publishedAt: '2026-03-19',
    type: 'report',
    summary:
      'First review under the Extended Fund Facility. Covers fiscal slippage risk, energy sector circular debt trajectory, FX market interventions, and SOE governance benchmarks.',
    url: 'https://www.imf.org/en/Countries/PAK',
    excerpts: [
      'Programme performance was broadly satisfactory; revenue collection underperformed on petroleum levy receipts.',
      'Staff highlight elevated risks from energy-sector arrears, electoral cycle pressures, and global rate environment.',
    ],
    tags: ['imf', 'eff', 'sovereign'],
  },
  {
    id: 'pk-doc-fitch',
    title: 'Fitch sovereign review – Pakistan B- / Stable',
    publisher: 'Fitch Ratings',
    publishedAt: '2026-04-04',
    type: 'briefing',
    summary:
      'Pakistan rated B- with stable outlook. Drivers include external buffers from IMF programme, deposit rollovers from Saudi Arabia, China, and UAE, and modest external debt service profile.',
    url: 'https://www.fitchratings.com/issuers/government-of-pakistan-3070',
    excerpts: [
      'External liquidity remains tight but improved; 12-month external debt service is c. USD 24 billion.',
      'Political fragmentation and military-civilian friction remain core risks to programme delivery.',
    ],
    tags: ['rating', 'sovereign'],
  },
  {
    id: 'pk-doc-icg-ttp',
    title: 'ICG – Pakistan’s TTP Resurgence in KP',
    publisher: 'International Crisis Group',
    publishedAt: '2026-02-11',
    type: 'report',
    summary:
      'Trace of TTP attack tempo since the 2023 collapse of negotiations; cross-border sanctuary issue with Afghan Taliban; impact on KP service delivery and policing posture.',
    url: 'https://www.crisisgroup.org/asia/south-asia/pakistan',
    tags: ['security', 'ttp', 'kp'],
  },
  {
    id: 'pk-doc-ecp',
    title: 'ECP delimitation order ahead of provincial polls',
    publisher: 'Election Commission of Pakistan',
    publishedAt: '2026-04-22',
    type: 'legislation',
    summary:
      'Constituency delimitation finalised for KP and Punjab provincial polls; PTI petitions on rural Punjab redistricting pending before the Lahore High Court.',
    url: 'https://www.ecp.gov.pk/',
    tags: ['elections', 'ecp'],
  },
  {
    id: 'pk-doc-state-bank',
    title: 'State Bank monetary policy statement – April 2026',
    publisher: 'State Bank of Pakistan',
    publishedAt: '2026-04-29',
    type: 'statement',
    summary:
      'Policy rate held at 17%. Forward guidance on inflation easing through Q3 2026 contingent on stable energy tariffs and FX market integrity.',
    url: 'https://www.sbp.org.pk/m_policy/index.asp',
    tags: ['monetary', 'sbp'],
  },
];

const SOURCES: CaseSource[] = [
  { id: 'pk-src-imf', name: 'IMF country page – Pakistan', url: 'https://www.imf.org/en/Countries/PAK', category: 'multilateral', reliability: 0.95, lean: 0 },
  { id: 'pk-src-wb', name: 'World Bank – Pakistan', url: 'https://www.worldbank.org/en/country/pakistan', category: 'multilateral', reliability: 0.92, lean: 0 },
  { id: 'pk-src-icg', name: 'International Crisis Group – Pakistan', url: 'https://www.crisisgroup.org/asia/south-asia/pakistan', category: 'think-tank', reliability: 0.92, lean: -0.1 },
  { id: 'pk-src-fitch', name: 'Fitch sovereign – Pakistan', url: 'https://www.fitchratings.com/issuers/government-of-pakistan-3070', category: 'industry-data', reliability: 0.9, lean: 0 },
  { id: 'pk-src-moodys', name: 'Moody’s – Pakistan', url: 'https://ratings.moodys.com', category: 'industry-data', reliability: 0.9, lean: 0 },
  { id: 'pk-src-dawn', name: 'Dawn (English daily)', url: 'https://www.dawn.com/', category: 'national-media', language: 'en', reliability: 0.78, lean: -0.1 },
  { id: 'pk-src-tribune', name: 'The Express Tribune', url: 'https://tribune.com.pk/', category: 'national-media', language: 'en', reliability: 0.7, lean: 0 },
  { id: 'pk-src-geo', name: 'Geo News', url: 'https://www.geo.tv/', category: 'national-media', language: 'ur', reliability: 0.66, lean: 0 },
  { id: 'pk-src-aaj', name: 'Aaj News', url: 'https://www.aaj.tv/', category: 'national-media', language: 'ur', reliability: 0.6, lean: 0.1 },
  { id: 'pk-src-arab-news', name: 'Arab News Pakistan', url: 'https://www.arabnews.pk/', category: 'national-media', language: 'en', reliability: 0.78, lean: 0.05 },
  { id: 'pk-src-pildat', name: 'PILDAT (governance think-tank)', url: 'https://pildat.org/', category: 'think-tank', reliability: 0.82, lean: -0.05 },
  { id: 'pk-src-sbp', name: 'State Bank of Pakistan', url: 'https://www.sbp.org.pk/', category: 'official', reliability: 0.94, lean: 0 },
];

const MEDIA: CaseMediaOutlet[] = [
  { id: 'pk-med-dawn', name: 'Dawn', url: 'https://www.dawn.com/', x: -0.45, y: 0.55, bias: 'centre-left', reach: 'national', language: 'en' },
  { id: 'pk-med-tribune', name: 'Express Tribune', url: 'https://tribune.com.pk/', x: -0.05, y: 0.4, bias: 'centre', reach: 'national', language: 'en' },
  { id: 'pk-med-geo', name: 'Geo News', url: 'https://www.geo.tv/', x: -0.1, y: 0.2, bias: 'centre', reach: 'national', language: 'ur' },
  { id: 'pk-med-aaj', name: 'Aaj News', url: 'https://www.aaj.tv/', x: 0.25, y: 0.1, bias: 'centre-right', reach: 'national', language: 'ur' },
  { id: 'pk-med-arynews', name: 'ARY News', url: 'https://arynews.tv/', x: 0.45, y: -0.1, bias: 'right', reach: 'national', language: 'ur' },
  { id: 'pk-med-arabnews', name: 'Arab News PK', url: 'https://www.arabnews.pk/', x: 0.55, y: 0.5, bias: 'centre-right', reach: 'regional', language: 'en' },
  { id: 'pk-med-bbc-urdu', name: 'BBC Urdu', url: 'https://www.bbc.com/urdu', x: -0.55, y: 0.7, bias: 'centre-left', reach: 'global', language: 'ur' },
  { id: 'pk-med-vop', name: 'Voice of Pakistan (state)', url: 'https://www.radio.gov.pk/', x: 0.6, y: -0.4, bias: 'state', reach: 'national', language: 'ur' },
];

const TIMELINE: CaseTimelineEvent[] = [
  { id: 'pk-tl-1', date: '2024-02-08', title: 'General elections held under disputed conditions', description: 'PTI-backed independents secured a plurality in NA seats but were excluded from coalition formation; PML-N–PPP coalition formed under Shehbaz Sharif.', significance: 'critical', category: 'politics' },
  { id: 'pk-tl-2', date: '2024-09-15', title: '26th Constitutional Amendment passed', description: 'Reorganised SC bench composition and restructured judicial appointments; PTI and bar associations protested.', significance: 'high', category: 'judiciary' },
  { id: 'pk-tl-3', date: '2024-11-26', title: 'PTI Islamabad protest dispersed', description: 'Imran Khan supporters dispersed from D-Chowk after week-long sit-in.', significance: 'medium', category: 'protest' },
  { id: 'pk-tl-4', date: '2025-09-25', title: 'IMF approves new EFF', description: 'USD 7 bn 37-month Extended Fund Facility approved with conditional energy and tax reforms.', significance: 'critical', category: 'imf' },
  { id: 'pk-tl-5', date: '2026-01-08', title: 'BLA attack on Gwadar port complex', description: 'Major attack on the Gwadar port complex, three Chinese workers wounded; PRC requests stronger security guarantees.', significance: 'high', category: 'security' },
  { id: 'pk-tl-6', date: '2026-02-11', title: 'ICG report on TTP resurgence', description: 'Crisis Group documents 41% YoY rise in TTP-attributed incidents in KP since 2023.', significance: 'high', category: 'security' },
  { id: 'pk-tl-7', date: '2026-03-19', title: 'IMF first review concludes', description: 'First review under the EFF concludes; staff-level agreement reached, contingent on petroleum levy adjustments.', significance: 'critical', category: 'imf' },
  { id: 'pk-tl-8', date: '2026-04-04', title: 'Fitch confirms B- / Stable', description: 'Sovereign rating affirmed at B- with stable outlook.', significance: 'medium', category: 'rating' },
  { id: 'pk-tl-9', date: '2026-04-22', title: 'ECP finalises delimitation', description: 'KP and Punjab provincial constituencies delimited; PTI files Lahore High Court petitions.', significance: 'high', category: 'elections' },
  { id: 'pk-tl-10', date: '2026-04-29', title: 'SBP holds policy rate at 17%', description: 'Monetary Policy Committee holds the policy rate; signals room for cuts contingent on inflation discipline.', significance: 'medium', category: 'monetary' },
  { id: 'pk-tl-11', date: '2026-05-02', title: 'Saudi PIF Reko Diq update', description: 'PIF reportedly close to finalising USD 1.5 bn equity stake in Reko Diq mine, paired with FX deposit rollover.', significance: 'high', category: 'investment' },
];

export const PAKISTAN_CASE_DATA: CaseTemplateData = {
  id: PAKISTAN_TEMPLATE_ID,
  templateId: PAKISTAN_TEMPLATE_ID,
  contextLabel: 'Pakistan · political risk',
  subtitle:
    'Civil-military balance, IMF programme conditionality, KP militancy, provincial elections.',
  situationStakeholders: SITUATION_STAKEHOLDERS,
  officeStakeholders: OFFICE_STAKEHOLDERS,
  documents: DOCUMENTS,
  sources: SOURCES,
  mediaOutlets: MEDIA,
  timeline: TIMELINE,
  risk: { score: 74, trend: 'flat', label: 'Elevated · politico-financial' },
  kpis: [
    { label: 'Sovereign risk', value: '74', tone: 'rose' },
    { label: 'IMF tranche window', value: 'Open', tone: 'navy' },
    { label: 'KP TTP attacks (90d)', value: '+41%', tone: 'amber' },
    { label: 'Reko Diq deal', value: 'Pending', tone: 'emerald' },
  ],
  briefingTitle: 'Pakistan – next 90 days: programme, polls, security',
};

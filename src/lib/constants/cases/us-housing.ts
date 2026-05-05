/**
 * US housing policy template — public-source seed data.
 *
 * Audience: domestic policy analyst (state legislature staff, advocacy
 * intermediary, governor's policy office, foundation programme officer).
 * Time horizon: 2026 state legislative sessions and recent litigation.
 *
 * Data is illustrative; URLs point at landing pages so the demo is robust to
 * link rot.
 */

import type {
  CaseStakeholder,
  CaseTimelineEvent,
  CaseDocument,
  CaseSource,
  CaseMediaOutlet,
  CaseTemplateData,
} from './case-types';

export const US_HOUSING_TEMPLATE_ID = 'us-housing';

const SITUATION_STAKEHOLDERS: CaseStakeholder[] = [
  {
    id: 'us-stk-hud',
    name: 'US Department of Housing and Urban Development',
    shortName: 'HUD',
    type: 'agency',
    power: 0.78, legitimacy: 0.84, urgency: 0.66,
    quadrant: 'dominant',
    position:
      'Use HOME, CDBG, and PRO-Housing rules to nudge state and local zoning reform; defend tenant protections through Notices of Funding Opportunity.',
    interests: ['Production targets', 'Tenant protections', 'Housing First', 'Fair Housing rule enforcement'],
    leverage: ['HUD funding conditions', 'PRO-Housing scoring', 'Section 8 vouchers'],
    constraints: ['Annual appropriations', 'Litigation exposure on AFFH'],
  },
  {
    id: 'us-stk-fhfa',
    name: 'Federal Housing Finance Agency',
    shortName: 'FHFA',
    type: 'agency',
    power: 0.72, legitimacy: 0.78, urgency: 0.62,
    quadrant: 'dominant',
    position:
      'Influence MBS pricing, GSE-backed multifamily rules, and Tenant Bill of Rights compliance.',
    interests: ['GSE solvency', 'Tenant protections in GSE multifamily', 'Conforming loan limits'],
    leverage: ['Conservatorship of Fannie Mae & Freddie Mac', 'Multifamily lending caps'],
    constraints: ['Conservatorship politics', 'Mortgage market sensitivity'],
  },
  {
    id: 'us-stk-ca',
    name: 'California Legislature & Governor’s Office',
    shortName: 'California',
    type: 'subnational',
    power: 0.86, legitimacy: 0.74, urgency: 0.92,
    quadrant: 'definitive',
    position:
      'Pass next wave of streamlining (CEQA reform, faith-based housing, transit corridors); defend SB 9 / SB 35 from local resistance.',
    interests: ['RHNA compliance', 'Builder’s Remedy', 'Transit-oriented housing', 'CEQA modernisation'],
    leverage: ['State preemption authority', 'HCD enforcement', 'Tax credit allocation'],
    constraints: ['NIMBY litigation', 'Coastal commission politics', 'Initiative challenges'],
  },
  {
    id: 'us-stk-nyc',
    name: 'New York State + NYC Council',
    shortName: 'NY (state + city)',
    type: 'subnational',
    power: 0.78, legitimacy: 0.66, urgency: 0.86,
    quadrant: 'definitive',
    position:
      'Implement City of Yes for Housing Opportunity and 421-a successor programme; manage rent stabilisation politics around RGB schedule.',
    interests: ['City of Yes implementation', '421-a / Affordable NY successor', 'Voucher expansion'],
    leverage: ['Zoning resolution', 'Property tax tools', 'NYCHA capital'],
    constraints: ['Borough political balance', 'Housing court backlog'],
  },
  {
    id: 'us-stk-tx',
    name: 'Texas Legislature & Governor',
    shortName: 'Texas',
    type: 'subnational',
    power: 0.68, legitimacy: 0.6, urgency: 0.62,
    quadrant: 'dominant',
    position:
      'Continue starter-home (HB 14-style) preemption while resisting state-level rent regulation; push Tax Code Chapter 313 successor.',
    interests: ['Affordable home production', 'Property tax relief', 'Local preemption'],
    leverage: ['Sunset commission authority', 'Trigger laws', 'Comptroller’s rule-making'],
    constraints: ['Senate / House divide', 'Local government opposition'],
  },
  {
    id: 'us-stk-mn',
    name: 'Minneapolis & Minnesota legislators',
    shortName: 'MN',
    type: 'subnational',
    power: 0.5, legitimacy: 0.74, urgency: 0.66,
    quadrant: 'dependent',
    position:
      'Defend Minneapolis 2040 plan in litigation; pass statewide pre-emption of single-family-only zoning.',
    interests: ['Statewide zoning floor', 'Tenant protections', 'TIF reform'],
    leverage: ['DFL trifecta windows', 'Strong policy networks', 'Mayoral coalitions'],
    constraints: ['ENRTF environmental ruling', 'Suburban resistance'],
  },
  {
    id: 'us-stk-fl',
    name: 'Florida Legislature & Live Local Act administration',
    shortName: 'Florida',
    type: 'subnational',
    power: 0.62, legitimacy: 0.58, urgency: 0.72,
    quadrant: 'dominant',
    position:
      'Maintain Live Local Act preemption; resist tenant-protection bills; experiment with state HFA revenue-bond programmes.',
    interests: ['Live Local implementation', 'Tax exemption policy', 'HFA bond capacity'],
    leverage: ['Statutory preemption', 'Sales tax holiday tools'],
    constraints: ['Local government pushback', 'Insurance market crisis'],
  },
  {
    id: 'us-stk-yimby',
    name: 'YIMBY coalitions (national + state)',
    shortName: 'YIMBY',
    type: 'advocacy',
    power: 0.46, legitimacy: 0.66, urgency: 0.86,
    quadrant: 'dependent',
    position:
      'Push pro-supply legislation; intervene in CEQA and zoning litigation; publish legislator scorecards.',
    interests: ['Zoning liberalisation', 'CEQA reform', 'Transit-oriented density'],
    leverage: ['Coalition mobilisation', 'Litigation amici', 'Policy research output'],
    constraints: ['Funding base', 'Coalition discipline with tenant groups'],
  },
  {
    id: 'us-stk-tenant',
    name: 'National tenant unions & rent-stabilisation coalitions',
    shortName: 'Tenant unions',
    type: 'advocacy',
    power: 0.42, legitimacy: 0.74, urgency: 0.92,
    quadrant: 'demanding',
    position:
      'Push rent-stabilisation, just-cause eviction, and source-of-income protection; oppose preemption of local protections.',
    interests: ['Rent stabilisation', 'Just-cause eviction', 'Right-to-counsel', 'Source-of-income protection'],
    leverage: ['Member mobilisation', 'Eviction-court presence', 'Coalition with labor'],
    constraints: ['Resource asymmetry vs. landlord lobby'],
  },
  {
    id: 'us-stk-realtors',
    name: 'NAR & state Realtor associations',
    shortName: 'NAR + state',
    type: 'industry',
    power: 0.7, legitimacy: 0.6, urgency: 0.6,
    quadrant: 'dominant',
    position:
      'Manage post-Sitzer commission landscape, defend property tax structure, support modest pro-supply legislation.',
    interests: ['Commission rules', 'MLS access', 'Property-tax stability', 'Mortgage interest deduction'],
    leverage: ['Lobby spend', 'PAC infrastructure', 'Local board reach'],
    constraints: ['DOJ scrutiny', 'Sitzer settlement obligations'],
  },
  {
    id: 'us-stk-builders',
    name: 'NAHB and large homebuilders',
    shortName: 'NAHB',
    type: 'industry',
    power: 0.66, legitimacy: 0.6, urgency: 0.66,
    quadrant: 'dominant',
    position:
      'Push permit-streamlining and impact-fee restraint; defend rate buy-down marketing.',
    interests: ['Permit timing', 'Impact fee caps', 'Builder pipeline land cost', 'Tariff exposure'],
    leverage: ['Trade lobby', 'Pipeline data'],
    constraints: ['Cyclical demand', 'Insurance / lumber pricing'],
  },
  {
    id: 'us-stk-aclu',
    name: 'ACLU + Lawyers’ Committee for Civil Rights',
    shortName: 'ACLU + LCCR',
    type: 'advocacy',
    power: 0.5, legitimacy: 0.78, urgency: 0.7,
    quadrant: 'dependent',
    position:
      'Litigate Fair Housing claims, exclusionary zoning, and source-of-income discrimination.',
    interests: ['AFFH enforcement', 'Source-of-income protection', 'Eviction defence'],
    leverage: ['Litigation pipeline', 'AFFH amicus capacity'],
    constraints: ['Political headwinds', 'Funding constraints'],
  },
];

const OFFICE_STAKEHOLDERS: CaseStakeholder[] = [
  {
    id: 'us-off-governor',
    name: 'Governor’s Chief of Staff',
    shortName: 'COS',
    type: 'principal',
    power: 0.92, legitimacy: 0.86, urgency: 0.9,
    quadrant: 'definitive',
    position: 'Wants a one-page brief and a signing-statement-ready talking points pack.',
    interests: ['Political optics', 'Coalition discipline', 'Implementation feasibility'],
    leverage: ['Calendar', 'Veto pen', 'Press strategy'],
    constraints: ['Re-election timing', 'Caucus politics'],
    office: true,
  },
  {
    id: 'us-off-legdir',
    name: 'Legislative Director',
    shortName: 'Leg Director',
    type: 'principal',
    power: 0.78, legitimacy: 0.78, urgency: 0.84,
    quadrant: 'dominant',
    position: 'Wants vote-counting tables and amendment language ready by 48h before floor action.',
    interests: ['Whip math', 'Amendment strategy', 'Caucus management'],
    leverage: ['Bill scheduling', 'Committee referrals'],
    constraints: ['Caucus splits', 'Speaker priorities'],
    office: true,
  },
  {
    id: 'us-off-policy',
    name: 'Policy Director (housing portfolio)',
    shortName: 'Policy Director',
    type: 'principal',
    power: 0.72, legitimacy: 0.82, urgency: 0.74,
    quadrant: 'dominant',
    position: 'Wants the substance right, the citations clean, and the alternatives stress-tested.',
    interests: ['Policy quality', 'Citation hygiene', 'Implementation realism'],
    leverage: ['Drafting authority', 'Stakeholder convening'],
    constraints: ['Other portfolios competing for time'],
    office: true,
  },
  {
    id: 'us-off-comms',
    name: 'Communications Director',
    shortName: 'Comms',
    type: 'principal',
    power: 0.62, legitimacy: 0.66, urgency: 0.78,
    quadrant: 'dominant',
    position: 'Wants three numbers, one human story, and a clean rebuttal for the trade press.',
    interests: ['Earned media', 'Owned channels', 'Rebuttal speed'],
    leverage: ['Press list', 'Statement scheduling'],
    constraints: ['Crisis cycles'],
    office: true,
  },
  {
    id: 'us-off-counsel',
    name: 'Office of General Counsel',
    shortName: 'Counsel',
    type: 'judiciary',
    power: 0.7, legitimacy: 0.86, urgency: 0.6,
    quadrant: 'dominant',
    position: 'Wants every claim citable, every preemption argument bulletproof, and litigation risk pre-vetted.',
    interests: ['Litigation risk', 'Preemption defensibility', 'Record building'],
    leverage: ['Legal sign-off', 'Veto on draft language'],
    constraints: ['Bar review timelines'],
    office: true,
  },
];

const DOCUMENTS: CaseDocument[] = [
  {
    id: 'us-doc-hud-pro',
    title: 'HUD PRO-Housing NOFO – FY26',
    publisher: 'US Department of Housing and Urban Development',
    publishedAt: '2026-02-10',
    type: 'legislation',
    summary:
      'Notice of Funding Opportunity for the Pathways to Removing Obstacles to Housing programme. Awards weighted toward jurisdictions with adopted zoning reforms and rental protections.',
    url: 'https://www.hud.gov/program_offices/comm_planning/pro_housing',
    tags: ['hud', 'zoning', 'funding'],
  },
  {
    id: 'us-doc-mn-court',
    title: 'Minnesota Court of Appeals – Smart Growth Minneapolis v. City of Minneapolis',
    publisher: 'Minnesota Court of Appeals',
    publishedAt: '2026-01-22',
    type: 'litigation',
    summary:
      'Appellate ruling on the Minneapolis 2040 comprehensive plan and ENRTF environmental review. Implications for plan-level environmental review of zoning reform.',
    url: 'https://www.mncourts.gov/CourtOfAppeals.aspx',
    tags: ['litigation', 'minneapolis-2040'],
  },
  {
    id: 'us-doc-ca-cega',
    title: 'California SB 423 + faith-based housing AB 1633 implementation report',
    publisher: 'California HCD',
    publishedAt: '2026-03-05',
    type: 'report',
    summary:
      'Implementation update on SB 423 (streamlining), AB 1633 (CEQA constraints on objective standards), and the YBL Code of Conduct rollout.',
    url: 'https://www.hcd.ca.gov/',
    tags: ['california', 'streamlining', 'ceqa'],
  },
  {
    id: 'us-doc-nyc-cityofyes',
    title: 'NYC City of Yes for Housing Opportunity – DCP final EIS',
    publisher: 'NYC Department of City Planning',
    publishedAt: '2026-04-12',
    type: 'report',
    summary:
      'Final Environmental Impact Statement for the City of Yes housing opportunity zoning text amendment. Estimated 80,000 unit capacity over 15 years.',
    url: 'https://www.nyc.gov/site/planning/index.page',
    tags: ['nyc', 'city-of-yes', 'zoning'],
  },
  {
    id: 'us-doc-fhfa-tbr',
    title: 'FHFA Tenant Bill of Rights – year-one compliance report',
    publisher: 'Federal Housing Finance Agency',
    publishedAt: '2026-04-30',
    type: 'report',
    summary:
      'Year-one report on GSE-backed multifamily tenant protections; flags compliance gaps in chronic non-renewal, fee transparency, and dispute resolution.',
    url: 'https://www.fhfa.gov/',
    tags: ['fhfa', 'tenant'],
  },
];

const SOURCES: CaseSource[] = [
  { id: 'us-src-hud', name: 'HUD program offices', url: 'https://www.hud.gov/', category: 'official', reliability: 0.95, lean: 0 },
  { id: 'us-src-fhfa', name: 'FHFA news + rules', url: 'https://www.fhfa.gov/', category: 'official', reliability: 0.94, lean: 0 },
  { id: 'us-src-census', name: 'US Census – housing data', url: 'https://www.census.gov/topics/housing.html', category: 'official', reliability: 0.96, lean: 0 },
  { id: 'us-src-jchs', name: 'Harvard JCHS – State of the Nation’s Housing', url: 'https://www.jchs.harvard.edu/', category: 'think-tank', reliability: 0.94, lean: 0 },
  { id: 'us-src-furman', name: 'NYU Furman Center', url: 'https://furmancenter.org/', category: 'think-tank', reliability: 0.93, lean: -0.05 },
  { id: 'us-src-urban', name: 'Urban Institute – housing finance', url: 'https://www.urban.org/policy-centers/housing-finance-policy-center', category: 'think-tank', reliability: 0.92, lean: -0.1 },
  { id: 'us-src-nyt', name: 'New York Times', url: 'https://www.nytimes.com/section/realestate', category: 'national-media', reliability: 0.85, lean: -0.2 },
  { id: 'us-src-wsj', name: 'Wall Street Journal – Real Estate', url: 'https://www.wsj.com/news/realestate', category: 'national-media', reliability: 0.85, lean: 0.2 },
  { id: 'us-src-bloomberg', name: 'Bloomberg CityLab', url: 'https://www.bloomberg.com/citylab', category: 'national-media', reliability: 0.85, lean: 0 },
  { id: 'us-src-axios', name: 'Axios cities', url: 'https://www.axios.com/local', category: 'national-media', reliability: 0.78, lean: 0 },
  { id: 'us-src-statesman', name: 'Texas Tribune – housing', url: 'https://www.texastribune.org/', category: 'local-media', reliability: 0.88, lean: -0.1 },
  { id: 'us-src-calmatters', name: 'CalMatters – housing', url: 'https://calmatters.org/housing/', category: 'local-media', reliability: 0.9, lean: -0.1 },
];

const MEDIA: CaseMediaOutlet[] = [
  { id: 'us-med-nyt', name: 'NYT Real Estate', url: 'https://www.nytimes.com/section/realestate', x: -0.45, y: 0.55, bias: 'centre-left', reach: 'national' },
  { id: 'us-med-wsj', name: 'WSJ Real Estate', url: 'https://www.wsj.com/news/realestate', x: 0.45, y: 0.5, bias: 'centre-right', reach: 'national' },
  { id: 'us-med-bloomberg', name: 'Bloomberg CityLab', url: 'https://www.bloomberg.com/citylab', x: -0.05, y: 0.45, bias: 'centre', reach: 'national' },
  { id: 'us-med-axios', name: 'Axios Cities', url: 'https://www.axios.com/local', x: 0.0, y: 0.2, bias: 'centre', reach: 'national' },
  { id: 'us-med-calmatters', name: 'CalMatters', url: 'https://calmatters.org/housing/', x: -0.4, y: 0.1, bias: 'centre-left', reach: 'regional' },
  { id: 'us-med-texastrib', name: 'Texas Tribune', url: 'https://www.texastribune.org/', x: -0.2, y: 0.2, bias: 'centre-left', reach: 'regional' },
  { id: 'us-med-fox', name: 'Fox Business', url: 'https://www.foxbusiness.com/', x: 0.6, y: -0.1, bias: 'right', reach: 'national' },
  { id: 'us-med-grist', name: 'Grist – cities', url: 'https://grist.org/cities/', x: -0.55, y: -0.1, bias: 'left', reach: 'sectoral' },
];

const TIMELINE: CaseTimelineEvent[] = [
  { id: 'us-tl-1', date: '2025-09-04', title: 'Federal PRO-Housing FY26 NOFO posted', description: 'HUD posts FY26 NOFO with weighted scoring favouring jurisdictions adopting zoning liberalisation and tenant protections.', significance: 'high', category: 'federal' },
  { id: 'us-tl-2', date: '2025-12-05', title: 'NYC City of Yes adopted', description: 'NYC Council adopts the City of Yes for Housing Opportunity zoning text amendment.', significance: 'critical', category: 'state-local' },
  { id: 'us-tl-3', date: '2026-01-22', title: 'MN Court of Appeals ruling', description: 'Smart Growth Minneapolis v. City of Minneapolis — appellate ruling on plan-level environmental review issued.', significance: 'high', category: 'litigation' },
  { id: 'us-tl-4', date: '2026-02-10', title: 'HUD PRO-Housing NOFO awards announced', description: 'HUD announces FY26 PRO-Housing awards across 32 jurisdictions; California, Minnesota, and Massachusetts overrepresented.', significance: 'high', category: 'federal' },
  { id: 'us-tl-5', date: '2026-02-26', title: 'CA AB 1633 implementation guidance', description: 'California HCD issues operational guidance on AB 1633 (housing accountability under CEQA).', significance: 'medium', category: 'state-local' },
  { id: 'us-tl-6', date: '2026-03-05', title: 'CA SB 423 streamlining annual report', description: 'HCD report logs 14,800 streamlined units across 22 jurisdictions.', significance: 'medium', category: 'state-local' },
  { id: 'us-tl-7', date: '2026-03-31', title: 'TX HB 14 successor advances out of committee', description: 'Texas legislature advances starter-home preemption bill out of House Land & Resource Management.', significance: 'medium', category: 'state-local' },
  { id: 'us-tl-8', date: '2026-04-12', title: 'NYC City of Yes final EIS', description: 'DCP releases final EIS for City of Yes; estimates 80k unit capacity over 15 years.', significance: 'high', category: 'state-local' },
  { id: 'us-tl-9', date: '2026-04-22', title: 'FL HB 102 (Live Local 2.0) enacted', description: 'Florida enacts amendments to the Live Local Act addressing tax exemption administrability.', significance: 'high', category: 'state-local' },
  { id: 'us-tl-10', date: '2026-04-30', title: 'FHFA Tenant Bill of Rights year-one report', description: 'Year-one compliance report flags chronic non-renewal and fee-transparency gaps in GSE multifamily.', significance: 'high', category: 'federal' },
  { id: 'us-tl-11', date: '2026-05-02', title: 'Sitzer settlement implementation milestone', description: 'NAR settlement implementation milestone — buyer-broker agreement disclosure rules in effect across remaining MLS markets.', significance: 'medium', category: 'industry' },
];

export const US_HOUSING_CASE_DATA: CaseTemplateData = {
  id: US_HOUSING_TEMPLATE_ID,
  templateId: US_HOUSING_TEMPLATE_ID,
  contextLabel: 'US housing · domestic policy',
  subtitle:
    'Zoning reform, ADU legalisation, rent-stabilisation, LIHTC pipelines, NIMBY litigation across 24 active states.',
  situationStakeholders: SITUATION_STAKEHOLDERS,
  officeStakeholders: OFFICE_STAKEHOLDERS,
  documents: DOCUMENTS,
  sources: SOURCES,
  mediaOutlets: MEDIA,
  timeline: TIMELINE,
  risk: { score: 56, trend: 'flat', label: 'Moderate · politico-legal' },
  kpis: [
    { label: 'Bills tracked', value: '142', tone: 'navy' },
    { label: 'Active states', value: '24', tone: 'blue' },
    { label: 'Litigation watch', value: '7', tone: 'amber' },
    { label: 'PRO-Housing $', value: '$300M', tone: 'emerald' },
  ],
  briefingTitle: 'US housing – cross-state policy outlook · Q3 2026',
};

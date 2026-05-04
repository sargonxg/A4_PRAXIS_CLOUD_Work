/**
 * Syria post-Assad transition demo data per tool surface.
 *
 * These constants populate the tool-page demo experience when the Syria
 * recording case is active (`isSyriaWorkspaceCase(case, isDemo)`). They are
 * not wired into the live AI/Firestore path — the live pipeline still owns
 * production data. They exist so the recording walkthrough shows the right
 * Syria substance even on a clean tenant.
 *
 * Source basis: UN Geneva, OCHA, UNFPA, UNHCR, Security Council Report,
 * Brookings, ECFR, Carnegie, Atlantic Council, HRW (2026 Syria reporting).
 */

// ── Timeline ────────────────────────────────────────────────────────────────

export type SyriaTimelineSignificance = 'critical' | 'high' | 'medium' | 'low';
export type SyriaTimelineCategory =
  | 'Military' | 'Political' | 'Diplomatic' | 'Humanitarian' | 'Economic';

export interface SyriaTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  significance: SyriaTimelineSignificance;
  category: SyriaTimelineCategory;
  actors?: string[];
  source?: string;
  location?: string;
  sources?: string[];
  glaslStage?: number;
  isCustom?: boolean;
}

export const SYRIA_TIMELINE_EVENTS: SyriaTimelineEvent[] = [
  {
    id: 'sy-e1',
    date: '2024-12-08',
    title: 'Assad regime overthrown — Damascus falls to opposition coalition',
    description:
      'A rapid 11-day offensive ends 53 years of Assad family rule. Bashar al-Assad flees to Moscow. The transitional administration under Ahmad al-Sharaa announces a 90-day caretaker government and a constitutional declaration to follow.',
    significance: 'critical',
    category: 'Political',
    glaslStage: 7,
    actors: ['Opposition coalition', 'Bashar al-Assad', 'Ahmad al-Sharaa'],
    location: 'Damascus',
    sources: ['UN Geneva', 'Reuters', 'Al Jazeera English'],
  },
  {
    id: 'sy-e2',
    date: '2025-01-29',
    title: 'al-Sharaa named president for transitional period',
    description:
      'A national dialogue conference of armed factions and civil society names Ahmad al-Sharaa president for the transition. The interim cabinet dissolves the former Syrian army and intelligence agencies and pledges a new constitution within three months.',
    significance: 'critical',
    category: 'Political',
    glaslStage: 5,
    actors: ['Ahmad al-Sharaa', 'Transitional Cabinet', 'National Dialogue Conference'],
    location: 'Damascus',
    sources: ['SANA (state)', 'UN Special Envoy briefing', 'Enab Baladi'],
  },
  {
    id: 'sy-e3',
    date: '2025-03-13',
    title: 'Constitutional Declaration signed — five-year transitional framework',
    description:
      'The transitional authorities sign a Constitutional Declaration setting a five-year transition, an interim People\'s Assembly, and committees on transitional justice, civil society, and elections. Critics warn the declaration centralises executive power.',
    significance: 'high',
    category: 'Political',
    actors: ['Transitional Cabinet', 'Legal Experts Committee'],
    location: 'Damascus',
    sources: ['UN Special Envoy', 'Carnegie', 'HRW commentary'],
  },
  {
    id: 'sy-e4',
    date: '2025-03-25',
    title: 'Coastal violence in Latakia and Tartus — 800+ civilian deaths reported',
    description:
      'Sectarian killings against Alawite communities along the coast over five days. The transitional government sets up an investigative commission. UN human rights officials call for accountability and protection of minorities.',
    significance: 'critical',
    category: 'Military',
    glaslStage: 8,
    actors: ['Local armed groups', 'Transitional Security Forces', 'Alawite communities'],
    location: 'Latakia · Tartus · Banias',
    sources: ['UN Human Rights Office', 'SOHR', 'HRW', 'Syria Direct'],
  },
  {
    id: 'sy-e5',
    date: '2025-07-16',
    title: 'Sweida flashpoints — Druze armed groups clash with security forces',
    description:
      'Days of clashes in Sweida province between Druze armed groups and government-aligned security forces over policing arrangements. Israeli airstrikes hit positions near the southern border. Local mediation by Druze religious leadership pauses the fighting.',
    significance: 'high',
    category: 'Military',
    glaslStage: 7,
    actors: ['Druze armed groups', 'Transitional Security Forces', 'Israel'],
    location: 'Sweida governorate',
    sources: ['UN OCHA', 'North Press Agency', 'Al Jazeera'],
  },
  {
    id: 'sy-e6',
    date: '2025-12-12',
    title: 'UNHCR — 1.2M refugees and 1.9M IDPs returned since December 2024',
    description:
      'UNHCR reports the largest movement of Syrian returns in over a decade. Returnees face shelter, services, and protection challenges. UNHCR calls for sustained donor support for the recovery window.',
    significance: 'high',
    category: 'Humanitarian',
    actors: ['UNHCR', 'Returnees', 'Host states'],
    location: 'Cross-border + interior Syria',
    sources: ['UNHCR press release'],
  },
  {
    id: 'sy-e7',
    date: '2026-01-06',
    title: 'Aleppo and northeast escalation displaces 128,400 civilians',
    description:
      'Fighting across Aleppo, Ar-Raqqa, Al-Hasakah, and Deir-ez-Zor displaces 128,400 in five weeks. UNFPA warns of acute protection needs for women, children, and minorities along the displacement corridors.',
    significance: 'critical',
    category: 'Humanitarian',
    glaslStage: 6,
    actors: ['UNFPA', 'OCHA', 'Local communities', 'SDF'],
    location: 'Aleppo · Ar-Raqqa · Al-Hasakah · Deir-ez-Zor',
    sources: ['UNFPA Sitrep 12 Feb 2026'],
  },
  {
    id: 'sy-e8',
    date: '2026-01-30',
    title: 'Damascus-SDF ceasefire and integration agreement',
    description:
      'The transitional government and the Syrian Democratic Forces sign a phased agreement: ceasefire, integration of SDF formations into the new Syrian army, return provisions, and protections for Kurdish civil, cultural, educational, and citizenship rights.',
    significance: 'critical',
    category: 'Diplomatic',
    glaslStage: 4,
    actors: ['Transitional Cabinet', 'SDF', 'Kurdish civil authorities', 'UN Special Envoy'],
    location: 'Damascus / Hasakah',
    sources: ['UN Geneva 13 Feb 2026', 'Enab Baladi', 'North Press Agency'],
  },
  {
    id: 'sy-e9',
    date: '2026-02-13',
    title: 'Security Council briefed — cautious optimism, persistent strain',
    description:
      'UN Special Envoy briefs the Security Council on the Damascus-SDF agreement, southern violence, Israeli incursions, ISIL detention-facility concerns, and severe humanitarian conditions. Members welcome the agreement and call for rights-protective implementation.',
    significance: 'high',
    category: 'Diplomatic',
    actors: ['UN Special Envoy', 'UN Security Council', 'OCHA'],
    location: 'United Nations, New York',
    sources: ['UN Geneva live coverage', 'Security Council Report'],
  },
  {
    id: 'sy-e10',
    date: '2026-02-25',
    title: 'EU lifts core sanctions on transitional Syrian institutions',
    description:
      'The EU adopts a sanctions package decoupling state institutions from Assad-era restrictions, retaining targeted sanctions on individuals tied to the prior regime. The move is paired with conditions on rights protections and inclusive governance.',
    significance: 'high',
    category: 'Economic',
    actors: ['European Union', 'Transitional Cabinet'],
    location: 'Brussels',
    sources: ['ECFR', 'Carnegie Europe'],
  },
  {
    id: 'sy-e11',
    date: '2026-03-18',
    title: 'UN warns regional escalation could undermine recovery',
    description:
      'UN officials warn the Security Council that wider Middle East escalation — Israeli operations, Lebanese border incidents, airspace restrictions — adds strain at a fragile transition moment. OCHA calls for diplomacy, aid, and recovery support.',
    significance: 'high',
    category: 'Diplomatic',
    glaslStage: 6,
    actors: ['UN Special Envoy', 'OCHA', 'Israel', 'Lebanon'],
    location: 'United Nations / regional theatre',
    sources: ['UN Geneva 18 Mar 2026', 'OCHA briefing'],
  },
  {
    id: 'sy-e12',
    date: '2026-04-02',
    title: 'Constitutional drafting committee announces consultative round',
    description:
      'The drafting committee opens a 60-day consultative round including civil society, women\'s networks, religious leaders, and minority representatives. Critics push for transparent participation criteria and independent observers.',
    significance: 'medium',
    category: 'Political',
    actors: ['Constitutional Drafting Committee', 'Civil society networks'],
    location: 'Damascus',
    sources: ['UN Special Envoy update', 'SyriaUntold'],
  },
  {
    id: 'sy-e13',
    date: '2026-04-22',
    title: 'Security Council live: regional war threatens fragile transition',
    description:
      'Security Council briefing emphasises that the transition window is narrow and that Israeli incursions, southern violence, and aid shortfalls remain decision triggers. Members call for sustained engagement and humanitarian funding.',
    significance: 'high',
    category: 'Diplomatic',
    actors: ['UN Security Council', 'UN Special Envoy', 'OCHA'],
    location: 'United Nations, New York',
    sources: ['UN Geneva live coverage 22 Apr 2026'],
  },
  {
    id: 'sy-e14',
    date: '2026-04-28',
    title: 'Syria–Türkiye energy and reconstruction MoU',
    description:
      'Damascus and Ankara sign a memorandum on grid interconnection, gas supply for power generation, and reconstruction services. Civil society groups raise HLP and procurement transparency concerns.',
    significance: 'medium',
    category: 'Economic',
    actors: ['Transitional Cabinet', 'Türkiye', 'Reconstruction firms'],
    location: 'Ankara · Damascus',
    sources: ['The Syria Report', 'Reuters'],
  },
  {
    id: 'sy-e15',
    date: '2026-05-01',
    title: 'May Council forecast — sanctions, EU engagement, HRP launch',
    description:
      'Security Council Report May forecast highlights Syria as a recurring agenda item: EU engagement track, residual sanctions delisting debates, and the Humanitarian Needs and Response Plan launch.',
    significance: 'medium',
    category: 'Diplomatic',
    actors: ['UN Security Council', 'European Union', 'OCHA'],
    location: 'United Nations',
    sources: ['Security Council Report monthly forecast'],
  },
];

// ── Humanitarian ────────────────────────────────────────────────────────────

export const SYRIA_HUMANITARIAN_DEMO = {
  displacement: {
    idps: 7_400_000,
    refugees: 4_700_000,
    asylumSeekers: 240_000,
    returnees: 1_200_000,
    idpTrend: 'down' as const,
    refugeeTrend: 'down' as const,
  },
  foodSecurity: [
    { phase: '1', population: 4_300_000, percentage: 18.6 },
    { phase: '2', population: 6_100_000, percentage: 26.4 },
    { phase: '3', population: 9_300_000, percentage: 40.3 },
    { phase: '4', population: 2_900_000, percentage: 12.6 },
    { phase: '5', population: 480_000,   percentage: 2.1  },
  ],
  funding: {
    required: 4_070_000_000,
    funded: 1_180_000_000,
    percentage: 29,
    sectors: [
      { name: 'Food security',  funded: 41, color: 'bg-emerald-400' },
      { name: 'Health',         funded: 26, color: 'bg-blue-400'    },
      { name: 'WASH',           funded: 22, color: 'bg-cyan-400'    },
      { name: 'Protection',     funded: 18, color: 'bg-purple-400'  },
      { name: 'Shelter / NFI',  funded: 14, color: 'bg-amber-400'   },
      { name: 'Education',      funded: 24, color: 'bg-pink-400'    },
      { name: 'Early recovery', funded: 11, color: 'bg-teal-400'    },
    ],
  },
  peopleInNeed: 16_500_000,
  populationAffected: 21_400_000,
  hotspots: [
    {
      name: 'Aleppo — east and rural belt',
      pin: 2_300_000,
      idp: 540_000,
      drivers: ['Returns pressure', 'Shelter damage', 'Service restoration'],
      risk: 'High',
    },
    {
      name: 'Northeast Syria (Hasakah, Raqqa, Deir-ez-Zor)',
      pin: 2_800_000,
      idp: 720_000,
      drivers: ['Displacement waves', 'SDF integration uncertainty', 'Detention-facility concerns'],
      risk: 'Critical',
    },
    {
      name: 'Sweida and southern Syria',
      pin: 720_000,
      idp: 95_000,
      drivers: ['Local clashes', 'Israeli incursions', 'Service interruption'],
      risk: 'High',
    },
    {
      name: 'Coastal Latakia and Tartus',
      pin: 980_000,
      idp: 110_000,
      drivers: ['Sectarian tensions', 'Minority protection', 'Returnee absorption'],
      risk: 'Elevated',
    },
    {
      name: 'Damascus, Rural Damascus, Homs',
      pin: 3_400_000,
      idp: 410_000,
      drivers: ['Returnee pressure', 'HLP disputes', 'Service capacity'],
      risk: 'Moderate',
    },
  ],
  clusters: [
    { cluster: 'Food Security',          lead: 'WFP / FAO',     funded: 41, gap: 'Cash for returns + winterisation' },
    { cluster: 'Health',                 lead: 'WHO',           funded: 26, gap: 'Cholera response, primary care, mental health' },
    { cluster: 'WASH',                   lead: 'UNICEF',        funded: 22, gap: 'Pipeline rehab, chlorination, sanitation' },
    { cluster: 'Protection',             lead: 'UNHCR',         funded: 18, gap: 'GBV, child protection, HLP, mine action' },
    { cluster: 'Shelter / NFI',          lead: 'UNHCR / IOM',   funded: 14, gap: 'Emergency shelter, return-area rehab' },
    { cluster: 'Education',              lead: 'UNICEF / Save', funded: 24, gap: 'School rehab, teacher pay, learning gap' },
    { cluster: 'Early Recovery',         lead: 'UNDP',          funded: 11, gap: 'Livelihoods, civil documentation, rubble' },
    { cluster: 'CCCM (camp coord.)',     lead: 'UNHCR / IOM',   funded: 16, gap: 'Phased decommissioning + relocation' },
    { cluster: 'Logistics',              lead: 'WFP',           funded: 31, gap: 'Cross-border + cross-line corridor mix' },
  ],
  partners: [
    {
      name: 'OCHA',
      type: 'UN coordination',
      url: 'https://www.unocha.org/syrian-arab-republic',
      role: 'Cluster coordination, Humanitarian Needs and Response Plan, Financial Tracking Service.',
    },
    {
      name: 'UNHCR',
      type: 'UN agency',
      url: 'https://www.unhcr.org/countries/syrian-arab-republic',
      role: 'Refugee returns, IDP protection, shelter, civil documentation, durable solutions.',
    },
    {
      name: 'UNICEF',
      type: 'UN agency',
      url: 'https://www.unicef.org/syria/',
      role: 'WASH, education, child protection, vaccination, nutrition.',
    },
    {
      name: 'WFP',
      type: 'UN agency',
      url: 'https://www.wfp.org/countries/syrian-arab-republic',
      role: 'Food assistance, school meals, logistics common services.',
    },
    {
      name: 'WHO',
      type: 'UN agency',
      url: 'https://www.emro.who.int/countries/syria/index.html',
      role: 'Health emergency operations, cholera response, primary care.',
    },
    {
      name: 'UNFPA',
      type: 'UN agency',
      url: 'https://syria.unfpa.org/',
      role: 'GBV, reproductive health, women & girls protection, dignity kits.',
    },
    {
      name: 'IOM',
      type: 'UN agency',
      url: 'https://syria.iom.int/',
      role: 'Returns tracking, mobility, shelter, cross-border coordination.',
    },
    {
      name: 'ICRC',
      type: 'Movement',
      url: 'https://www.icrc.org/en/where-we-work/middle-east/syria',
      role: 'Detention visits, IHL outreach, water systems, family links.',
    },
    {
      name: 'Syrian Arab Red Crescent (SARC)',
      type: 'National Society',
      url: 'https://sarc.sy/',
      role: 'Frontline access partner across cross-line and cross-border modalities.',
    },
    {
      name: 'MSF',
      type: 'INGO',
      url: 'https://www.msf.org/syria',
      role: 'Trauma surgery, emergency medical, mobile clinics, cholera response.',
    },
    {
      name: 'NRC',
      type: 'INGO',
      url: 'https://www.nrc.no/countries/middle-east/syria/',
      role: 'Shelter, education, ICLA (civil documentation, HLP, legal aid).',
    },
    {
      name: 'Save the Children',
      type: 'INGO',
      url: 'https://www.savethechildren.net/where-we-work/middle-east-eastern-europe/syria',
      role: 'Education in emergencies, child protection, health, food security.',
    },
    {
      name: 'Mercy Corps',
      type: 'INGO',
      url: 'https://www.mercycorps.org/where-we-work/syria',
      role: 'Cash, livelihoods, water systems, market resilience.',
    },
    {
      name: 'IRC',
      type: 'INGO',
      url: 'https://www.rescue.org/country/syria',
      role: 'Health, protection, women\'s programming, emergency response.',
    },
    {
      name: 'CARE',
      type: 'INGO',
      url: 'https://www.care-international.org/where-we-work/syria',
      role: 'Food security, WASH, gender-based violence response, livelihoods.',
    },
    {
      name: 'World Vision',
      type: 'INGO',
      url: 'https://www.wvi.org/syria-response',
      role: 'Child-focused services, food, WASH, education in displacement areas.',
    },
    {
      name: 'Syria Civil Defence (White Helmets)',
      type: 'Local NGO',
      url: 'https://www.whitehelmets.org/',
      role: 'Search and rescue, emergency medical response, debris management.',
    },
    {
      name: 'Syrian American Medical Society (SAMS)',
      type: 'Diaspora medical NGO',
      url: 'https://www.sams-usa.net/',
      role: 'Medical relief, hospital support, training, prosthetics.',
    },
    {
      name: 'Hand in Hand for Aid and Development',
      type: 'Local NGO',
      url: 'https://www.hihfad.org/',
      role: 'Health, food security, livelihoods, WASH in northern Syria.',
    },
    {
      name: 'Violet Organization',
      type: 'Local NGO',
      url: 'https://www.violetsyria.org/',
      role: 'Education, child protection, livelihoods in northwest and northeast.',
    },
  ],
  reports: [
    {
      id: 'syr-hnrp-2026',
      title: '2026 Humanitarian Needs and Response Plan — Syria',
      date: '2026-02-15',
      source: 'OCHA',
      url: 'https://reliefweb.int/country/syr',
    },
    {
      id: 'syr-unhcr-returns',
      title: 'Historic return of displaced Syrians — opportunity and challenges',
      date: '2025-12-12',
      source: 'UNHCR',
      url: 'https://www.unhcr.org/us/news/press-releases/unhcr-historic-return-displaced-syrians-presents-opportunity-and-urgent',
    },
    {
      id: 'syr-unfpa-aleppo',
      title: 'Situation Report: Aleppo and Northeast Syria',
      date: '2026-02-12',
      source: 'UNFPA',
      url: 'https://arabstates.unfpa.org/en/publications/situation-report-aleppo-and-north-east-syria-6-january-node2-february-2entity26',
    },
    {
      id: 'syr-cca-2026',
      title: 'Common Country Analysis — Syria 2026',
      date: '2026-03-31',
      source: 'UN Country Team',
      url: 'https://syria.un.org/en/312773-common-country-analysis-syria',
    },
    {
      id: 'syr-hrw-2026',
      title: 'World Report 2026: Syria',
      date: '2026-01-12',
      source: 'Human Rights Watch',
      url: 'https://www.hrw.org/world-report/2026/country-chapters/syria',
    },
  ],
  disasters: [
    { name: 'Cholera outbreak — northeast clusters', status: 'Active', date: '2026-04' },
    { name: 'Winter storm impact — northwest IDP sites', status: 'Recovery', date: '2026-02' },
    { name: 'Drought stress — Hasakah and Raqqa rural belt', status: 'Monitoring', date: '2026-03' },
  ],
  briefingNote:
    'PRAXIS read: prioritise return-area rehab (shelter, services, civil documentation, mine action), protection of minorities (Alawite coast, Druze south, Kurdish northeast), and a transparent FTS line so EU/Gulf/Türkiye flows are not double-counted with reconstruction MoUs. Treat any single-source claim on detention-facility security as unverified until cross-checked.',
};

// ── Commitments ─────────────────────────────────────────────────────────────

export type SyriaComplianceStatus =
  | 'compliant' | 'partial' | 'non-compliant' | 'unknown' | 'expired';
export type SyriaCommitmentType =
  | 'ceasefire' | 'political' | 'humanitarian' | 'security' | 'economic' | 'legal';

export interface SyriaCommitment {
  id: string;
  title: string;
  type: SyriaCommitmentType;
  parties: string[];
  date: string;
  deadline?: string;
  status: SyriaComplianceStatus;
  complianceScore: number;
  description: string;
  violations: string[];
  monitoringBody?: string;
  referenceDoc?: string;
}

export const SYRIA_COMMITMENTS_DEMO: {
  commitments: SyriaCommitment[];
  overallComplianceRate: number;
  criticalViolations: string[];
  upcomingDeadlines: { title: string; date: string; party: string }[];
  analysis: string;
} = {
  commitments: [
    {
      id: 'sy-c1',
      title: '30 January Damascus-SDF ceasefire and integration agreement',
      type: 'ceasefire',
      parties: ['Syrian Transitional Authorities', 'Syrian Democratic Forces (SDF)'],
      date: '2026-01-30',
      deadline: '2026-12-31',
      status: 'partial',
      complianceScore: 56,
      description:
        'Ceasefire and phased integration of SDF formations into the new Syrian army; protection of Kurdish civil, cultural, educational, and citizenship rights; return provisions in northeast Syria.',
      violations: [
        'Implementation plan timeline not yet published 90+ days after signing',
        'Localized clashes reported in Deir-ez-Zor rural areas (4 incidents, Mar–Apr 2026)',
        'Detention-facility security arrangements not independently verified',
      ],
      monitoringBody: 'UN Special Envoy for Syria',
      referenceDoc: 'UN Geneva briefing 13 Feb 2026',
    },
    {
      id: 'sy-c2',
      title: 'Constitutional Declaration — five-year transitional framework',
      type: 'political',
      parties: ['Transitional Cabinet', 'Legal Experts Committee'],
      date: '2025-03-13',
      deadline: '2030-03-13',
      status: 'partial',
      complianceScore: 48,
      description:
        'Five-year transitional roadmap establishing an interim People\'s Assembly, transitional justice committee, civil society committee, and elections committee.',
      violations: [
        'People\'s Assembly composition not yet published',
        'Transitional justice committee operating without civil society observers',
        'Decentralisation provisions still unclear in implementation',
      ],
      monitoringBody: 'UN Special Envoy / civil society networks',
    },
    {
      id: 'sy-c3',
      title: 'Coastal sectarian violence — accountability commitment',
      type: 'legal',
      parties: ['Transitional Authorities'],
      date: '2025-03-30',
      status: 'non-compliant',
      complianceScore: 22,
      description:
        'Public commitment to investigate March 2025 violence in Latakia and Tartus and to refer perpetrators to justice. International observers requested independent participation.',
      violations: [
        'Investigative commission published interim findings without source list or victim consultation',
        'No prosecutions filed 13 months after the events',
        'Minority protection plan for coastal communities still in draft',
      ],
      monitoringBody: 'UN Human Rights Office',
    },
    {
      id: 'sy-c4',
      title: 'Humanitarian Access Compact (cross-border + cross-line)',
      type: 'humanitarian',
      parties: ['Transitional Authorities', 'OCHA', 'Donors'],
      date: '2025-06-10',
      status: 'partial',
      complianceScore: 64,
      description:
        'Operational compact maintaining cross-border crossings and cross-line modalities, with a 14-day pre-notification window and security guarantees for humanitarian convoys.',
      violations: [
        '6 incidents of convoy delay or rerouting at Tal Abyad and Manbij (Q1 2026)',
        'Customs friction on dual-use medical equipment imports',
      ],
      monitoringBody: 'OCHA Humanitarian Access Working Group',
    },
    {
      id: 'sy-c5',
      title: 'EU sanctions delisting of state institutions (conditional)',
      type: 'economic',
      parties: ['European Union', 'Transitional Cabinet'],
      date: '2026-02-25',
      status: 'compliant',
      complianceScore: 81,
      description:
        'EU lifts core sanctions on transitional state institutions and Central Bank, retaining individually targeted sanctions. Conditioned on rights protections and inclusive governance benchmarks.',
      violations: [],
      monitoringBody: 'EEAS / Council Working Party',
    },
    {
      id: 'sy-c6',
      title: 'Israel–Syria southern de-escalation understanding (verbal)',
      type: 'security',
      parties: ['Transitional Authorities', 'Israel (informal)'],
      date: '2025-09-04',
      status: 'non-compliant',
      complianceScore: 19,
      description:
        'Verbal understanding to reduce incidents in the Quneitra and Sweida buffer corridor and respect the 1974 disengagement-line spirit.',
      violations: [
        '11 reported Israeli airstrikes in southern Syria since the understanding',
        'Repeated armoured incursions reported by UNDOF and local sources',
        'Disengagement-line patrols not yet resumed in original configuration',
      ],
      monitoringBody: 'UNDOF / UN Special Envoy',
    },
    {
      id: 'sy-c7',
      title: 'Returns Framework Agreement with UNHCR',
      type: 'humanitarian',
      parties: ['Transitional Authorities', 'UNHCR', 'Lebanon', 'Türkiye', 'Jordan'],
      date: '2025-05-20',
      status: 'partial',
      complianceScore: 58,
      description:
        'Voluntary, safe, dignified returns framework. Includes civil documentation, HLP guarantees, and reintegration support for IDPs and refugees.',
      violations: [
        'HLP disputes unresolved in 18% of returnee cases reviewed by NRC ICLA',
        'Conscription concerns reported by male returnees in Daraa and Quneitra',
      ],
      monitoringBody: 'UNHCR',
    },
    {
      id: 'sy-c8',
      title: 'Syria–Türkiye energy and reconstruction MoU',
      type: 'economic',
      parties: ['Transitional Authorities', 'Türkiye'],
      date: '2026-04-28',
      status: 'compliant',
      complianceScore: 72,
      description:
        'Grid interconnection, gas supply, and reconstruction services. Civil-society annex on procurement transparency and HLP safeguards.',
      violations: [],
      monitoringBody: 'Joint Steering Committee',
    },
  ],
  overallComplianceRate: 52,
  criticalViolations: [
    'Coastal accountability commitment unfulfilled — minority protection at risk',
    'Israel–Syria de-escalation understanding repeatedly broken',
    'Constitutional drafting transparency gap — civil society observers excluded',
  ],
  upcomingDeadlines: [
    { title: 'SDF integration plan publication',                  date: '2026-06-30', party: 'Transitional Authorities + SDF' },
    { title: 'Constitutional drafting consultative round closes',   date: '2026-06-02', party: 'Drafting Committee' },
    { title: 'EU sanctions benchmark review',                       date: '2026-08-25', party: 'European Union' },
  ],
  analysis:
    'Compliance pattern: economic/diplomatic commitments with third-party oversight (EU sanctions track, Türkiye MoU) trend higher; security and rights commitments without independent monitoring trend lower. The coastal accountability commitment and Israel southern understanding are the most consequential gaps. PRAXIS recommends linking the Damascus-SDF implementation dashboard to the same monitoring view, and tying humanitarian access incidents to the 14-day notification clause for follow-up reporting.',
};

// ── Stakeholder map (Mitchell-Agle-Wood salience) ────────────────────────────

export interface SyriaStakeholder {
  id: string;
  name: string;
  shortName: string;
  type: 'state' | 'non_state_armed' | 'civil_society' | 'international_org' | 'external_state' | 'business' | 'minority';
  power: number;        // 0..1
  legitimacy: number;   // 0..1
  urgency: number;      // 0..1
  quadrant: 'definitive' | 'dominant' | 'dangerous' | 'dependent' | 'dormant' | 'discretionary' | 'demanding' | 'non-stakeholder';
  position: string;
  interests: string[];
  leverage: string[];
  constraints: string[];
}

export const SYRIA_STAKEHOLDERS: SyriaStakeholder[] = [
  {
    id: 'sy-stk-government',
    name: 'Syrian Transitional Authorities (al-Sharaa)',
    shortName: 'Damascus',
    type: 'state',
    power: 0.78, legitimacy: 0.62, urgency: 0.85,
    quadrant: 'definitive',
    position: 'Centralised consolidation with phased decentralisation rhetoric.',
    interests: ['Consolidate sovereignty', 'Avoid security vacuum', 'Sanctions relief', 'Reconstruction inflows'],
    leverage: ['Recognition by major powers', 'Border control', 'New army formation', 'Constitutional drafting agenda'],
    constraints: ['Fragile coalition of factions', 'Coastal/southern violence record', 'Donor benchmarks'],
  },
  {
    id: 'sy-stk-sdf',
    name: 'Syrian Democratic Forces / AANES',
    shortName: 'SDF / AANES',
    type: 'non_state_armed',
    power: 0.62, legitimacy: 0.58, urgency: 0.92,
    quadrant: 'definitive',
    position: 'Integration with rights guarantees; preserve local administration.',
    interests: ['Kurdish civil/educational rights', 'Local security primacy', 'Detention-facility resourcing', 'Energy royalties'],
    leverage: ['Northeast oil/gas fields', 'ISIL detention infrastructure', 'US informal coordination', 'Local taxation'],
    constraints: ['Türkiye threat posture', 'Internal Arab-Kurdish balance', 'Limited international recognition'],
  },
  {
    id: 'sy-stk-druze',
    name: 'Druze leadership (Sweida)',
    shortName: 'Druze leadership',
    type: 'minority',
    power: 0.32, legitimacy: 0.74, urgency: 0.78,
    quadrant: 'dependent',
    position: 'Conditional cooperation contingent on local policing autonomy.',
    interests: ['Community security', 'Religious autonomy', 'Cross-border ties to Israeli Druze diaspora'],
    leverage: ['Local mobilisation', 'Religious authority', 'Diaspora advocacy'],
    constraints: ['Israeli airstrikes raise loyalty questions', 'Limited military capacity'],
  },
  {
    id: 'sy-stk-alawite',
    name: 'Alawite coastal communities',
    shortName: 'Alawite coast',
    type: 'minority',
    power: 0.21, legitimacy: 0.46, urgency: 0.88,
    quadrant: 'demanding',
    position: 'Seek protection guarantees and accountability for March 2025 violence.',
    interests: ['Personal security', 'Property rights', 'Accountability for violence', 'Economic inclusion'],
    leverage: ['Russian residual ties (Tartus)', 'Diaspora networks', 'Military expertise'],
    constraints: ['Stigma from Assad-era association', 'Vulnerability after coastal violence'],
  },
  {
    id: 'sy-stk-un',
    name: 'UN Special Envoy + UN Country Team',
    shortName: 'UN',
    type: 'international_org',
    power: 0.46, legitimacy: 0.86, urgency: 0.72,
    quadrant: 'dominant',
    position: 'Inclusive Syrian-led transition with rights and humanitarian discipline.',
    interests: ['Implementation benchmarks', 'Humanitarian access', 'Rights protections', 'Regional de-escalation'],
    leverage: ['Security Council attention', 'Good offices', 'Coordination of UN agencies'],
    constraints: ['No coercive tools', 'Donor funding cycles'],
  },
  {
    id: 'sy-stk-eu',
    name: 'European Union (EEAS + Member States)',
    shortName: 'EU',
    type: 'external_state',
    power: 0.66, legitimacy: 0.74, urgency: 0.62,
    quadrant: 'dominant',
    position: 'Conditional engagement: sanctions delisting tied to rights and governance.',
    interests: ['Refugee returns', 'Migration management', 'Reconstruction market access', 'Counter-terrorism'],
    leverage: ['Sanctions architecture', 'Reconstruction finance', 'Visa & migration tools'],
    constraints: ['Member-state divergence', 'Public scrutiny on rights conditionality'],
  },
  {
    id: 'sy-stk-us',
    name: 'United States',
    shortName: 'United States',
    type: 'external_state',
    power: 0.78, legitimacy: 0.62, urgency: 0.46,
    quadrant: 'dormant',
    position: 'Selective engagement on counter-ISIL, sanctions reviews, and detention-facility issues.',
    interests: ['ISIL containment', 'Detention-facility security', 'Regional stability', 'Israel security'],
    leverage: ['Sanctions tools', 'Force posture in northeast', 'Diplomatic recognition signals'],
    constraints: ['Domestic political swings', 'Allied management with Türkiye and Israel'],
  },
  {
    id: 'sy-stk-turkey',
    name: 'Türkiye',
    shortName: 'Türkiye',
    type: 'external_state',
    power: 0.74, legitimacy: 0.52, urgency: 0.84,
    quadrant: 'definitive',
    position: 'Active stake in northern Syria, SDF posture, refugee returns, and reconstruction.',
    interests: ['SDF/PKK threat reduction', 'Refugee returns', 'Reconstruction contracts', 'Border security'],
    leverage: ['Border control', 'TSK / SNA presence', 'Reconstruction pipelines', 'Refugee leverage'],
    constraints: ['Domestic economic pressure', 'EU/US balancing'],
  },
  {
    id: 'sy-stk-israel',
    name: 'Israel',
    shortName: 'Israel',
    type: 'external_state',
    power: 0.82, legitimacy: 0.42, urgency: 0.86,
    quadrant: 'dangerous',
    position: 'Active operations against perceived threats; reluctance to recognise transition.',
    interests: ['Counter Iran/Hezbollah supply', 'Druze welfare', 'Buffer zone integrity', 'Air dominance'],
    leverage: ['Air operations', 'ISR capacity', 'Diplomatic ties with US and Gulf'],
    constraints: ['Regional escalation risk', 'International legitimacy critique'],
  },
  {
    id: 'sy-stk-iran',
    name: 'Iran',
    shortName: 'Iran',
    type: 'external_state',
    power: 0.46, legitimacy: 0.34, urgency: 0.66,
    quadrant: 'dangerous',
    position: 'Reduced footprint; seeks residual influence via reconstruction and Shia networks.',
    interests: ['Land bridge to Hezbollah', 'Shia minority protection', 'Sanctions evasion'],
    leverage: ['IRGC residual networks', 'Shia religious networks', 'Sanctions-evasion expertise'],
    constraints: ['Lost military bases', 'Israeli strike pressure'],
  },
  {
    id: 'sy-stk-russia',
    name: 'Russia',
    shortName: 'Russia',
    type: 'external_state',
    power: 0.52, legitimacy: 0.36, urgency: 0.48,
    quadrant: 'dormant',
    position: 'Hold Tartus/Hmeimim leverage, transactional posture toward transition.',
    interests: ['Naval and air bases', 'Mediterranean access', 'Wagner-successor business'],
    leverage: ['Veto in Security Council', 'Bases', 'Business networks'],
    constraints: ['Ukraine bandwidth', 'Reduced influence post-Assad'],
  },
  {
    id: 'sy-stk-gulf',
    name: 'Gulf states (Saudi, UAE, Qatar)',
    shortName: 'Gulf states',
    type: 'external_state',
    power: 0.68, legitimacy: 0.66, urgency: 0.54,
    quadrant: 'dominant',
    position: 'Re-engagement led by Saudi Arabia and UAE; reconstruction finance and security cooperation.',
    interests: ['Regional stability', 'Counter-extremism', 'Reconstruction influence', 'Migration partner'],
    leverage: ['Reconstruction finance', 'Investment vehicles', 'Diplomatic recognition'],
    constraints: ['Yemen and Iran files', 'Internal coordination'],
  },
  {
    id: 'sy-stk-civilsociety',
    name: 'Syrian civil society networks',
    shortName: 'Civil society',
    type: 'civil_society',
    power: 0.28, legitimacy: 0.74, urgency: 0.78,
    quadrant: 'dependent',
    position: 'Push for transparent process, women\'s participation, transitional justice.',
    interests: ['Inclusive constitution', 'Transitional justice', 'Independent media', 'Women\'s political participation'],
    leverage: ['Domestic and diaspora networks', 'Documentation evidence', 'International advocacy'],
    constraints: ['Restricted civic space', 'Resource constraints'],
  },
  {
    id: 'sy-stk-business',
    name: 'Reconstruction business elite',
    shortName: 'Reconstruction elite',
    type: 'business',
    power: 0.54, legitimacy: 0.42, urgency: 0.62,
    quadrant: 'discretionary',
    position: 'Position for first-mover reconstruction contracts; mixed transparency.',
    interests: ['Procurement access', 'HLP transactions', 'Banking normalisation'],
    leverage: ['Capital deployment speed', 'Political connections', 'Logistics'],
    constraints: ['Sanctions screening', 'HLP litigation risk'],
  },
];

// ── Sources Library (Syria) ─────────────────────────────────────────────────

export const SYRIA_SOURCES_LIBRARY = [
  // UN / official
  { id: 'sy-src-1', name: 'UN Geneva — Syria coverage', url: 'https://www.ungeneva.org/en/news-media/news', type: 'government', priority: 'high', reliability: 96, region: 'Geneva / Damascus', language: 'English', category: 'UN' },
  { id: 'sy-src-2', name: 'UN OCHA — Syria', url: 'https://www.unocha.org/syrian-arab-republic', type: 'government', priority: 'high', reliability: 94, region: 'Syria', language: 'English / Arabic', category: 'UN humanitarian' },
  { id: 'sy-src-3', name: 'UN Security Council Report', url: 'https://www.securitycouncilreport.org/', type: 'think_tank', priority: 'high', reliability: 92, region: 'New York', language: 'English', category: 'UN diplomatic' },
  { id: 'sy-src-4', name: 'UNHCR — Syria operation', url: 'https://www.unhcr.org/countries/syrian-arab-republic', type: 'government', priority: 'high', reliability: 93, region: 'Syria', language: 'English', category: 'UN humanitarian' },
  { id: 'sy-src-5', name: 'UNFPA — Arab States Syria', url: 'https://syria.unfpa.org/', type: 'government', priority: 'high', reliability: 91, region: 'Syria', language: 'English', category: 'UN humanitarian' },
  { id: 'sy-src-6', name: 'WHO EMRO — Syria', url: 'https://www.emro.who.int/countries/syria/', type: 'government', priority: 'high', reliability: 91, region: 'Syria', language: 'English', category: 'UN humanitarian' },
  { id: 'sy-src-7', name: 'UN Common Country Analysis 2026', url: 'https://syria.un.org/en/312773-common-country-analysis-syria', type: 'government', priority: 'high', reliability: 92, region: 'Damascus', language: 'English', category: 'UN strategic' },
  { id: 'sy-src-8', name: 'ReliefWeb — Syria', url: 'https://reliefweb.int/country/syr', type: 'ngo', priority: 'high', reliability: 90, region: 'Syria', language: 'English / Arabic', category: 'Humanitarian' },

  // Syrian local & diaspora
  { id: 'sy-src-9',  name: 'Enab Baladi (English)', url: 'https://en.enabbaladi.org/', type: 'local_media', priority: 'high', reliability: 78, region: 'Syria + diaspora', language: 'English / Arabic', category: 'Independent local' },
  { id: 'sy-src-10', name: 'Syria Direct',          url: 'https://syriadirect.org/', type: 'diaspora', priority: 'high', reliability: 82, region: 'Diaspora', language: 'English / Arabic', category: 'Independent local' },
  { id: 'sy-src-11', name: 'North Press Agency',    url: 'https://npasyria.com/en/', type: 'local_media', priority: 'high', reliability: 70, region: 'Northeast Syria', language: 'Arabic / English / Kurdish', category: 'Local regional' },
  { id: 'sy-src-12', name: 'The Syria Report',      url: 'https://syria-report.com/', type: 'newspaper', priority: 'high', reliability: 86, region: 'Syria economy', language: 'English', category: 'Specialist economic' },
  { id: 'sy-src-13', name: 'SyriaUntold',           url: 'https://syriauntold.com/', type: 'diaspora', priority: 'medium', reliability: 74, region: 'Syria + diaspora', language: 'Arabic / English', category: 'Civic storytelling' },
  { id: 'sy-src-14', name: 'The Syrian Observer',   url: 'https://syrianobserver.com/', type: 'newspaper', priority: 'medium', reliability: 72, region: 'Syria media ecosystem', language: 'English', category: 'Translation digest' },
  { id: 'sy-src-15', name: 'SANA (state)',          url: 'https://sana.sy/en/', type: 'state_media', priority: 'medium', reliability: 42, region: 'Damascus', language: 'Arabic / English', category: 'Official messaging' },
  { id: 'sy-src-16', name: 'SOHR',                  url: 'https://www.syriahr.com/en/', type: 'ngo', priority: 'medium', reliability: 68, region: 'Syria', language: 'Arabic / English', category: 'Conflict monitoring' },

  // International think tanks
  { id: 'sy-src-17', name: 'International Crisis Group — Syria',     url: 'https://www.crisisgroup.org/middle-east-north-africa/east-mediterranean-mena/syria', type: 'think_tank', priority: 'high', reliability: 91, region: 'International', language: 'English', category: 'Conflict analysis' },
  { id: 'sy-src-18', name: 'Brookings — Syria research',             url: 'https://www.brookings.edu/topic/syria/', type: 'think_tank', priority: 'high', reliability: 88, region: 'Washington', language: 'English', category: 'Policy research' },
  { id: 'sy-src-19', name: 'European Council on Foreign Relations',  url: 'https://ecfr.eu/topic/syria/', type: 'think_tank', priority: 'high', reliability: 87, region: 'Europe', language: 'English', category: 'European policy' },
  { id: 'sy-src-20', name: 'Carnegie — Middle East & Syria',         url: 'https://carnegieendowment.org/regions/middle-east', type: 'think_tank', priority: 'high', reliability: 89, region: 'Washington / Beirut', language: 'English', category: 'Strategic analysis' },
  { id: 'sy-src-21', name: 'Atlantic Council — Syria & MENA',        url: 'https://www.atlanticcouncil.org/region/syria/', type: 'think_tank', priority: 'medium', reliability: 84, region: 'Washington', language: 'English', category: 'Regional policy' },
  { id: 'sy-src-22', name: 'Middle East Institute — Syria Program',  url: 'https://www.mei.edu/programs/syria-program', type: 'think_tank', priority: 'medium', reliability: 84, region: 'Washington', language: 'English', category: 'Policy research' },
  { id: 'sy-src-23', name: 'Chatham House — Syria',                  url: 'https://www.chathamhouse.org/topics/syria', type: 'think_tank', priority: 'high', reliability: 88, region: 'London', language: 'English', category: 'International affairs' },

  // Rights / legal / humanitarian INGOs
  { id: 'sy-src-24', name: 'Human Rights Watch — Syria',  url: 'https://www.hrw.org/middle-east/n-africa/syria', type: 'ngo', priority: 'high', reliability: 89, region: 'International', language: 'English', category: 'Rights' },
  { id: 'sy-src-25', name: 'Amnesty International — Syria', url: 'https://www.amnesty.org/en/location/middle-east-and-north-africa/west-asia/syria/', type: 'ngo', priority: 'high', reliability: 88, region: 'International', language: 'English', category: 'Rights' },
  { id: 'sy-src-26', name: 'ICRC — Syria',                 url: 'https://www.icrc.org/en/where-we-work/middle-east/syria', type: 'ngo', priority: 'high', reliability: 90, region: 'Geneva', language: 'English', category: 'IHL / detention' },
  { id: 'sy-src-27', name: 'MSF — Syria',                  url: 'https://www.msf.org/syria', type: 'ngo', priority: 'high', reliability: 89, region: 'International', language: 'English', category: 'Medical / humanitarian' },
  { id: 'sy-src-28', name: 'NRC — Syria',                  url: 'https://www.nrc.no/countries/middle-east/syria/', type: 'ngo', priority: 'high', reliability: 88, region: 'International', language: 'English', category: 'Shelter / HLP / education' },
  { id: 'sy-src-29', name: 'IRC — Syria',                  url: 'https://www.rescue.org/country/syria', type: 'ngo', priority: 'medium', reliability: 86, region: 'International', language: 'English', category: 'Multi-sector' },
  { id: 'sy-src-30', name: 'Save the Children — Syria',    url: 'https://www.savethechildren.net/where-we-work/middle-east-eastern-europe/syria', type: 'ngo', priority: 'medium', reliability: 86, region: 'International', language: 'English', category: 'Child-focused' },
  { id: 'sy-src-31', name: 'White Helmets',                url: 'https://www.whitehelmets.org/', type: 'ngo', priority: 'medium', reliability: 78, region: 'Syria', language: 'Arabic / English', category: 'Civil defense' },
  { id: 'sy-src-32', name: 'SAMS',                         url: 'https://www.sams-usa.net/', type: 'ngo', priority: 'medium', reliability: 80, region: 'Diaspora', language: 'English', category: 'Medical relief' },

  // Regional & wires
  { id: 'sy-src-33', name: 'Reuters — Syria desk',  url: 'https://www.reuters.com/world/middle-east/syria/', type: 'wire', priority: 'high', reliability: 88, region: 'International', language: 'English', category: 'Wire' },
  { id: 'sy-src-34', name: 'AFP — Syria',           url: 'https://www.afp.com/en', type: 'wire', priority: 'high', reliability: 87, region: 'International', language: 'English / Arabic / French', category: 'Wire' },
  { id: 'sy-src-35', name: 'AP — Syria',            url: 'https://apnews.com/hub/syria', type: 'wire', priority: 'high', reliability: 86, region: 'International', language: 'English', category: 'Wire' },
  { id: 'sy-src-36', name: 'Al Jazeera English — Syria', url: 'https://www.aljazeera.com/where/syria/', type: 'broadcaster', priority: 'high', reliability: 80, region: 'Doha', language: 'English / Arabic', category: 'Pan-Arab' },
  { id: 'sy-src-37', name: 'Al Arabiya — Syria',    url: 'https://english.alarabiya.net/News/middle-east', type: 'broadcaster', priority: 'medium', reliability: 76, region: 'Riyadh', language: 'English / Arabic', category: 'Saudi-aligned' },
  { id: 'sy-src-38', name: 'BBC News — Syria',      url: 'https://www.bbc.com/news/topics/c008qmb44vrt/syria', type: 'broadcaster', priority: 'high', reliability: 88, region: 'London', language: 'English / Arabic', category: 'Public broadcaster' },
  { id: 'sy-src-39', name: 'Le Monde — Syria',      url: 'https://www.lemonde.fr/en/syria/', type: 'newspaper', priority: 'medium', reliability: 84, region: 'Paris', language: 'French / English', category: 'Quality press' },
];

// ── Info Environment (media compass) ────────────────────────────────────────

export const SYRIA_INFO_ENVIRONMENT = {
  narrativeLanes: [
    { lane: 'Northeast integration',        position: 'Cautious progress',     volume: 0.74, divergence: 0.66 },
    { lane: 'Humanitarian access & returns', position: 'Strain and gaps',       volume: 0.82, divergence: 0.41 },
    { lane: 'Minority protection',           position: 'Contested',             volume: 0.69, divergence: 0.78 },
    { lane: 'Sanctions and reconstruction',  position: 'Conditional opening',   volume: 0.61, divergence: 0.58 },
    { lane: 'Regional spillover',            position: 'Escalation pressure',   volume: 0.77, divergence: 0.52 },
    { lane: 'Constitutional process',        position: 'Centralisation concern',volume: 0.48, divergence: 0.71 },
  ],
  outletPositions: [
    { outlet: 'SANA (state)',     reliability: 42, orientation: +0.42, lane: 'sovereignty / unity' },
    { outlet: 'Enab Baladi',      reliability: 78, orientation: -0.18, lane: 'rights / local' },
    { outlet: 'Syria Direct',     reliability: 82, orientation: -0.12, lane: 'accountability / explainer' },
    { outlet: 'North Press',      reliability: 70, orientation: -0.05, lane: 'northeast / Kurdish' },
    { outlet: 'The Syria Report', reliability: 86, orientation: +0.02, lane: 'economy / HLP' },
    { outlet: 'SOHR',             reliability: 68, orientation: -0.08, lane: 'monitoring / casualties' },
    { outlet: 'Al Jazeera EN',    reliability: 80, orientation: -0.10, lane: 'pan-Arab / explainer' },
    { outlet: 'Al Arabiya',       reliability: 76, orientation: +0.18, lane: 'Saudi-aligned' },
    { outlet: 'Reuters',          reliability: 88, orientation: +0.00, lane: 'wire' },
    { outlet: 'AFP',              reliability: 87, orientation: +0.00, lane: 'wire' },
  ],
  watchSignals: [
    'Language shifts on "decentralisation" vs "national unity" in SANA editorials.',
    'New northeast crossing-point reporting in North Press and Enab Baladi.',
    'OCHA sector funding deltas in successive HRP updates.',
    'Israeli operations cadence reported by UN, SOHR, Al Jazeera, and Al Arabiya.',
    'EU member-state divergence on sanctions delisting reviews.',
    'Constitutional drafting committee participation lists.',
  ],
};

// ── Advisory Council ────────────────────────────────────────────────────────

export interface SyriaAdvisor {
  id: string;
  name: string;
  affiliation: string;
  lens: string;
  bio: string;
  position: string;
  signals: string[];
  redLines: string[];
  publicWork?: string;
}

export const SYRIA_ADVISORY_COUNCIL: SyriaAdvisor[] = [
  {
    id: 'adv-khatib',
    name: 'Lina Khatib',
    affiliation: 'SOAS Middle East Institute · former Chatham House',
    lens: 'Political transition + regional power dynamics',
    bio: 'Senior MENA scholar with a long publication record on Syrian politics, regional power competition, and post-conflict state-building.',
    position:
      'The transition is real but governance quality and inclusivity are the binding constraints. External actors should reward measurable benchmarks rather than pre-commit recognition.',
    signals: [
      'Transitional cabinet appointments by sector and minority share',
      'Constitutional drafting committee participation transparency',
      'Regional re-engagement signals from Saudi/UAE/Türkiye',
    ],
    redLines: [
      'Do not infer legitimacy from public ceremony',
      'Do not collapse Kurdish, Druze, and Alawite files into one minority frame',
    ],
  },
  {
    id: 'adv-landis',
    name: 'Joshua Landis',
    affiliation: 'University of Oklahoma · Syria Comment',
    lens: 'Syrian society + sectarian and regional fault lines',
    bio: 'Long-running scholar of Syria with deep continuity from the Ba\'athist period to the transition; runs Syria Comment.',
    position:
      'Sectarian coexistence is not automatic. The Alawite coast and Druze south will define whether the transition is read as inclusive or majoritarian. Treat economic recovery and rights guarantees as one file.',
    signals: [
      'Coastal accountability investigation outputs',
      'Sweida policing arrangements and Israeli airstrike cadence',
      'Returnee absorption rates by governorate',
    ],
    redLines: [
      'Do not treat HTS-era language as definitive of current behaviour',
      'Do not project Tunisia-style transition logic onto Syria',
    ],
  },
  {
    id: 'adv-lund',
    name: 'Aron Lund',
    affiliation: 'Century International · Swedish Defence Research Agency',
    lens: 'Armed-group dynamics + peace process mechanics',
    bio: 'Detailed historian of Syrian armed groups and peace process attempts; widely cited for granular field analysis.',
    position:
      'The Damascus-SDF deal is the single most consequential agreement, but implementation will hinge on detention-facility security and command-and-control sequencing. Watch the technical annexes.',
    signals: [
      'SDF-to-army integration order of battle',
      'ISIL detention-facility security transitions',
      'Northwest faction posture toward integration',
    ],
    redLines: [
      'Do not equate ceasefire announcement with implementation',
      'Do not under-weight Türkiye veto power on northeast outcomes',
    ],
  },
  {
    id: 'adv-heller',
    name: 'Sam Heller',
    affiliation: 'Independent analyst · former TCF',
    lens: 'Counter-terrorism + sanctions + Syria-specific policy',
    bio: 'Specialist on counter-terrorism designations, sanctions, and Syria-specific policy levers.',
    position:
      'Sanctions delisting is the most powerful Western leverage but it is also the easiest to misuse. Conditionality must be technical, not symbolic, with named benchmarks.',
    signals: [
      'EU and US sanctions designations updates',
      'Detention-facility access for ICRC',
      'Counter-terror designation logic on transitional figures',
    ],
    redLines: [
      'Do not lift sanctions in a single bundle without monitoring milestones',
      'Do not conflate sanctions relief with normalisation',
    ],
  },
  {
    id: 'adv-khalifa',
    name: 'Dareen Khalifa',
    affiliation: 'International Crisis Group',
    lens: 'Mediation + armed-group relations',
    bio: 'Analyst with field-driven access to multiple Syrian armed groups; central voice on mediation and northern Syria.',
    position:
      'The window to lock in inclusive arrangements is narrow. Mediation needs to focus on procedural guarantees: independent observers, public timelines, and grievance channels.',
    signals: [
      'Local mediation committees in Sweida, Latakia, and northeast',
      'Civil society participation in constitutional consultations',
      'Cross-line humanitarian working group functionality',
    ],
    redLines: [
      'Do not centralise mediation in capitals only',
      'Do not bypass civil society for state-to-state shortcuts',
    ],
  },
  {
    id: 'adv-lister',
    name: 'Charles Lister',
    affiliation: 'Middle East Institute',
    lens: 'Jihadism + Syria insurgency history',
    bio: 'Long-time analyst of Syrian insurgent factions, jihadist groups, and the trajectory of the Syrian war.',
    position:
      'Public-source confidence is high on broad strategic framing and lower on internal command dynamics. Watch the field on the SDF integration order, foreign fighter regimes, and detention oversight.',
    signals: [
      'Foreign fighter regularisation regimes',
      'Detention-facility access and oversight arrangements',
      'Disengagement-line incidents in southern Syria',
    ],
    redLines: [
      'Do not treat all transitional security elements as homogeneous',
      'Do not ignore foreign fighter governance question',
    ],
  },
  {
    id: 'adv-yahya',
    name: 'Maha Yahya',
    affiliation: 'Carnegie Middle East Center',
    lens: 'Inclusive governance + regional political economy',
    bio: 'Director of Carnegie Middle East; political economy of post-conflict transitions and inclusive governance.',
    position:
      'Recovery economics will determine whether the transition consolidates. HLP, banking, and procurement reform are central — donor frameworks should reward institutional reform over symbolic openings.',
    signals: [
      'HLP registry, legal aid, and returnee protection programs',
      'Central Bank reform and correspondent banking access',
      'Reconstruction procurement transparency',
    ],
    redLines: [
      'Do not finance reconstruction without HLP safeguards',
      'Do not allow elite capture of recovery markets',
    ],
  },
  {
    id: 'adv-natali',
    name: 'Denise Natali',
    affiliation: 'Independent analyst · former NDU INSS',
    lens: 'Kurdish politics + cross-border dynamics',
    bio: 'Specialist on Kurdish political dynamics in Iraq, Syria, and Türkiye; bridges Erbil, Damascus, and Ankara files.',
    position:
      'The northeast file is unresolvable without simultaneous Türkiye, Iraq Kurdistan, and US channels. SDF integration depends on regional alignment, not just bilateral negotiations.',
    signals: [
      'Türkiye–US northeast working group cadence',
      'Erbil–Qamishli civilian corridors and trade flows',
      'PKK/YPG distinction in operational reporting',
    ],
    redLines: [
      'Do not treat northeast Syria as bilateral file',
      'Do not flatten Kurdish political pluralism',
    ],
  },
];

// ── Briefing block templates seeded with Syria content ──────────────────────

export const SYRIA_BRIEFING_BLOCKS = [
  {
    id: 'syr-brief-bluf',
    type: 'bluf',
    title: 'Bottom-line up front',
    body:
      'The 30 January Damascus-SDF agreement is the most concrete de-escalatory pathway in the public-source Syria file but it is fragile. Implementation, humanitarian access, and regional spillover are decision triggers within days, not months.',
  },
  {
    id: 'syr-brief-graph-readout',
    type: 'graph-readout',
    title: 'Graph readout',
    body:
      'Four live clusters: agreement (Damascus, SDF, UN, Kurdish rights), humanitarian (OCHA, UNFPA, UNHCR, displacement), security (south, Israel, detention), and recovery (trust-building, banking, reconstruction). One click traces a milestone to its humanitarian and spillover consequences.',
  },
  {
    id: 'syr-brief-risk-board',
    type: 'risk-board',
    title: 'Risk board',
    body:
      'Implementation risk: governance + rights protections. Humanitarian risk: returns, services, protection. Security risk: south, Israel, detention, regional. Evidence risk: thin local field verification.',
  },
  {
    id: 'syr-brief-actions',
    type: 'actions',
    title: 'Decision actions',
    body:
      'Protect the agreement with a 30-day implementation dashboard; fuse humanitarian metrics into the same view; monitor red triggers (south, Israel, regional, funding); add local civil-society sources before granular claims.',
  },
  {
    id: 'syr-brief-collection',
    type: 'collection',
    title: 'Collection asks',
    body:
      'Field reporting from Sweida, the northeast, and coastal Syria; ICRC detention access updates; Türkiye–US northeast working-group readouts; OCHA HRP funding deltas at sector level.',
  },
];

import type { ConflictGraph } from '@/lib/ai/schemas/conflict-grammar';
import type { BriefingSlide } from '@/lib/constants/briefing-data';
import type { DemoBrainstormingOutput, DemoSourceScoutOutput } from '@/lib/constants/demo-tool-outputs';
import type { GraphData } from '@/lib/firebase/graph-service';
import type { CanonicalSourceReceipt } from '@/types/source-receipt';
import type { Situation } from '@/types/situation';

export const SYRIA_DEMO_CASE_ID = 'syria-transition-2026';
export const SYRIA_DEMO_QUERY_PARAM = 'syria';

export const SYRIA_DEMO_SOURCES = {
  unGenevaFebruary:
    'https://www.ungeneva.org/en/news-media/news/2026/02/115867/syria-transition-gains-ground-kurdish-deal-violence-and-humanitarian',
  unGenevaMarch:
    'https://www.ungeneva.org/en/news-media/news/2026/03/116903/middle-east-war-risks-undermining-syrias-fragile-recovery-security',
  unCommonCountryAnalysis:
    'https://syria.un.org/en/312773-common-country-analysis-syria',
  unfpaNorthEast:
    'https://arabstates.unfpa.org/en/publications/situation-report-aleppo-and-north-east-syria-6-january-node2-february-2entity26',
  unhcrReturns:
    'https://www.unhcr.org/us/news/press-releases/unhcr-historic-return-displaced-syrians-presents-opportunity-and-urgent',
} as const;

export const SYRIA_DEMO_SITUATION: Situation = {
  id: SYRIA_DEMO_CASE_ID,
  name: 'Syria Transition - Northeast Integration & Regional Spillover',
  type: 'civil',
  description:
    'Public-source Syria case file for early 2026: a post-Assad political transition, a January 2026 Damascus-SDF ceasefire and integration agreement, persistent humanitarian strain, renewed displacement in Aleppo and northeast Syria, southern flashpoints, Israeli incursions, and regional war spillover risks. The case is designed to show how PRAXIS turns real sources into graph-ready actors, claims, events, risks, and decision products.',
  region: 'Syrian Arab Republic',
  actors: [
    'Syrian Government / transitional authorities',
    'Syrian Democratic Forces (SDF)',
    'Kurdish civil and educational authorities',
    'UN Special Envoy for Syria',
    'OCHA and UN humanitarian agencies',
    'UNHCR',
    'Israel',
    'Local armed groups in Sweida',
    'ISIL detention-facility stakeholders',
  ],
  userRole: 'analyst',
  status: 'active',
  riskScore: 7.8,
  glaslStage: 5,
  escalationTrend: 'volatile',
  actorCount: 9,
  graphEntities: 46,
  documentCount: 5,
  sourceUrls: Object.values(SYRIA_DEMO_SOURCES),
  contextNotes:
    'Recording stance: treat all analysis as public-source and source-grounded. Distinguish observed reporting from PRAXIS assessment. Priority decisions: protect the northeast agreement, sustain humanitarian access, reduce regional spillover, and identify what evidence would change confidence.',
  createdAt: '2026-05-02T09:00:00.000Z',
  updatedAt: '2026-05-02T09:00:00.000Z',
  conflictClassification: 'internationalized_intrastate',
  ucdpIntensity: 'war',
  informRiskIndex: { hazard: 7.9, vulnerability: 8.3, lackOfCoping: 7.5, composite: 7.9 },
  populationAffected: 128400,
  conflictOnsetDate: '2011-03-15',
  latestEventDate: '2026-03-18',
  geoBoundingBox: { north: 37.4, south: 32.0, east: 42.4, west: 35.6 },
  keyDates: [
    { date: '2024-12-08', label: 'Assad regime overthrown; transition period begins', significance: 'critical' },
    { date: '2026-01-30', label: 'Damascus-SDF ceasefire and integration agreement welcomed by UN', significance: 'critical' },
    { date: '2026-02-13', label: 'Security Council briefed on Kurdish deal, southern violence, Israeli incursions, and aid strain', significance: 'high' },
    { date: '2026-03-18', label: 'UN warns regional escalation could undermine Syria recovery', significance: 'high' },
  ],
  tags: ['syria', 'transition', 'humanitarian-access', 'northeast-syria', 'regional-spillover'],
  analysisPhase: 'monitoring',
  lastAiRefresh: '2026-05-02T09:00:00.000Z',
  dataCompleteness: 88,
  domain: 'conflict-prevention',
  domainConfidence: 0.93,
  workflowPath: 'peace-security',
  workflowPathLabel: 'Peace and security decision support',
  sourceCategoryOrder: ['un-official', 'humanitarian', 'conflict-data', 'think-tank', 'local-media'],
  sourceCategoriesEnabled: {
    'un-official': true,
    humanitarian: true,
    'conflict-data': true,
    'think-tank': true,
    'local-media': true,
  },
  customSources: [
    { id: 'syria-un-envoy', url: SYRIA_DEMO_SOURCES.unGenevaFebruary, name: 'UN Syria Security Council update', categoryId: 'un-official' },
    { id: 'syria-ocha-march', url: SYRIA_DEMO_SOURCES.unGenevaMarch, name: 'OCHA / Security Council humanitarian update', categoryId: 'humanitarian' },
    { id: 'syria-cca', url: SYRIA_DEMO_SOURCES.unCommonCountryAnalysis, name: 'UN Syria Common Country Analysis', categoryId: 'un-official' },
    { id: 'syria-enab-baladi', url: 'https://en.enabbaladi.org/', name: 'Enab Baladi local Syria reporting', categoryId: 'local-media' },
    { id: 'syria-direct', url: 'https://syriadirect.org/', name: 'Syria Direct independent reporting', categoryId: 'local-media' },
    { id: 'syria-north-press', url: 'https://npasyria.com/en/', name: 'North Press Agency northeast Syria reporting', categoryId: 'local-media' },
    { id: 'syria-report-economy', url: 'https://syria-report.com/', name: 'The Syria Report economy and HLP coverage', categoryId: 'think-tank' },
  ],
};

const SYRIA_RECEIPTS: CanonicalSourceReceipt[] = [
  {
    receiptId: 'syria-src-001',
    sourceId: 'un-geneva-syria-2026-02-13',
    name: 'UN Geneva',
    title: 'Syria transition gains ground with Kurdish deal, but violence and humanitarian strain persist',
    url: SYRIA_DEMO_SOURCES.unGenevaFebruary,
    provider: 'Public web source',
    source: 'UN Geneva',
    kind: 'web-result',
    retrievalMethod: 'web_search',
    timestamp: '2026-05-02T09:00:00Z',
    publishedDate: '2026-02-13',
    query: 'Syria 30 January 2026 SDF government agreement humanitarian strain',
    reliabilityScore: 0.96,
    confidence: 'high',
    excerpt:
      'UN reporting describes the 30 January ceasefire and integration agreement, continuing violence in the south, Israeli incursions, and severe humanitarian conditions.',
    contentHash: 'syria-demo-001',
    graphPath: ['UN Special Envoy', '30 January agreement', 'Syrian Government', 'SDF'],
    toolRunId: 'syria-demo-source-scout-2026-05-02',
  },
  {
    receiptId: 'syria-src-002',
    sourceId: 'un-geneva-syria-2026-03-18',
    name: 'UN Geneva',
    title: 'Middle East war risks undermining Syria fragile recovery, Security Council hears',
    url: SYRIA_DEMO_SOURCES.unGenevaMarch,
    provider: 'Public web source',
    source: 'UN Geneva / OCHA',
    kind: 'web-result',
    retrievalMethod: 'web_search',
    timestamp: '2026-05-02T09:00:00Z',
    publishedDate: '2026-03-18',
    query: 'Syria fragile recovery regional escalation March 2026 OCHA',
    reliabilityScore: 0.95,
    confidence: 'high',
    excerpt:
      'UN officials warned that regional escalation adds strain at a fragile moment and called for diplomatic engagement, humanitarian assistance, and recovery support.',
    contentHash: 'syria-demo-002',
    graphPath: ['Regional escalation', 'Syria recovery', 'OCHA', 'Security Council'],
    toolRunId: 'syria-demo-source-scout-2026-05-02',
  },
  {
    receiptId: 'syria-src-003',
    sourceId: 'un-syria-cca-2026-03-31',
    name: 'UN Syria',
    title: 'Common Country Analysis - Syria',
    url: SYRIA_DEMO_SOURCES.unCommonCountryAnalysis,
    provider: 'Public web source',
    source: 'United Nations in Syrian Arab Republic',
    kind: 'web-result',
    retrievalMethod: 'web_search',
    timestamp: '2026-05-02T09:00:00Z',
    publishedDate: '2026-03-31',
    query: 'Syria Common Country Analysis 2026 transition recovery trust building',
    reliabilityScore: 0.94,
    confidence: 'high',
    excerpt:
      'The UN Common Country Analysis frames trust-building as a cross-cutting priority for transition, recovery, reconstruction, and development.',
    contentHash: 'syria-demo-003',
    graphPath: ['UN Country Team', 'trust-building', 'recovery', 'UNSDCF 2027-2030'],
    toolRunId: 'syria-demo-source-scout-2026-05-02',
  },
  {
    receiptId: 'syria-src-004',
    sourceId: 'unfpa-syria-2026-02-12',
    name: 'UNFPA Arab States',
    title: 'Situation Report on Aleppo and North-East Syria',
    url: SYRIA_DEMO_SOURCES.unfpaNorthEast,
    provider: 'Public web source',
    source: 'UNFPA',
    kind: 'web-result',
    retrievalMethod: 'web_search',
    timestamp: '2026-05-02T09:00:00Z',
    publishedDate: '2026-02-12',
    query: 'Aleppo northeast Syria displaced 128400 2026 UNFPA',
    reliabilityScore: 0.92,
    confidence: 'high',
    excerpt:
      'UNFPA reporting described escalation across Aleppo, Ar-Raqqa, Al-Hasakah, and Deir-ez-Zor and estimated 128,400 displaced people as of 11 February 2026.',
    contentHash: 'syria-demo-004',
    graphPath: ['Aleppo and northeast escalation', 'displacement', 'women and children', 'UNFPA'],
    toolRunId: 'syria-demo-source-scout-2026-05-02',
  },
  {
    receiptId: 'syria-src-005',
    sourceId: 'unhcr-syria-returns-2025-12',
    name: 'UNHCR',
    title: 'Historic return of displaced Syrians presents opportunity and urgent challenges',
    url: SYRIA_DEMO_SOURCES.unhcrReturns,
    provider: 'Public web source',
    source: 'UNHCR',
    kind: 'web-result',
    retrievalMethod: 'web_search',
    timestamp: '2026-05-02T09:00:00Z',
    publishedDate: '2025-12-12',
    query: 'UNHCR Syria returns since December 2024 1.2 million refugees 1.9 million IDPs',
    reliabilityScore: 0.93,
    confidence: 'high',
    excerpt:
      'UNHCR reported large-scale refugee and IDP returns since December 2024 while emphasizing urgent shelter, services, and protection challenges.',
    contentHash: 'syria-demo-005',
    graphPath: ['UNHCR', 'returnees', 'basic services', 'protection'],
    toolRunId: 'syria-demo-source-scout-2026-05-02',
  },
];

export const SYRIA_DEMO_SOURCE_SCOUT_OUTPUT: DemoSourceScoutOutput = {
  question:
    'What should an envoy team read before deciding whether the northeast integration track is still stabilizing Syria, or whether spillover and humanitarian strain are overtaking it?',
  generatedAt: '2026-05-02T09:00:00Z',
  searchPlan: {
    keywords: [
      'Syria 30 January ceasefire integration agreement SDF',
      'Syria fragile recovery regional escalation March 2026',
      'Aleppo northeast Syria displacement February 2026',
      'Syria Common Country Analysis 2026 trust-building',
      'UNHCR Syria returns since December 2024',
      'Enab Baladi Syria transition local governance returns rights',
      'North Press Agency northeast Syria SDF integration local reporting',
      'The Syria Report reconstruction HLP sanctions Syria transition',
    ],
    excludedDomains: ['unsourced social media', 'advocacy posts without primary links', 'stale pre-transition explainers'],
    timeframe: '90d',
    languages: ['English', 'Arabic where available'],
  },
  proposedSources: [
    {
      name: 'UN Geneva - Syria transition gains ground with Kurdish deal',
      url: SYRIA_DEMO_SOURCES.unGenevaFebruary,
      reason:
        'Primary UN Security Council coverage for the 30 January agreement, southern flashpoints, Israeli incursions, and humanitarian figures.',
      reliability: 'tier_a',
      publishedAt: '2026-02-13',
      corroborated: true,
      format: 'article',
    },
    {
      name: 'UN Geneva / OCHA - Middle East war risks undermining Syria recovery',
      url: SYRIA_DEMO_SOURCES.unGenevaMarch,
      reason:
        'Best source for the regional-spillover decision frame and OCHA requests on diplomacy, aid, and recovery support.',
      reliability: 'tier_a',
      publishedAt: '2026-03-18',
      corroborated: true,
      format: 'article',
    },
    {
      name: 'UN Syria - Common Country Analysis 2026',
      url: SYRIA_DEMO_SOURCES.unCommonCountryAnalysis,
      reason:
        'Gives the strategic recovery and trust-building framework that PRAXIS can connect to the conflict graph.',
      reliability: 'tier_a',
      publishedAt: '2026-03-31',
      corroborated: true,
      format: 'report',
    },
    {
      name: 'UNFPA - Aleppo and North-East Syria Situation Report',
      url: SYRIA_DEMO_SOURCES.unfpaNorthEast,
      reason:
        'Anchors the displacement and protection layer for Aleppo, Ar-Raqqa, Al-Hasakah, and Deir-ez-Zor.',
      reliability: 'tier_a',
      publishedAt: '2026-02-12',
      corroborated: true,
      format: 'report',
    },
    {
      name: 'UNHCR - Historic return of displaced Syrians',
      url: SYRIA_DEMO_SOURCES.unhcrReturns,
      reason:
        'Adds the returns and reintegration lens: opportunity, shelter needs, basic services, and funding stress.',
      reliability: 'tier_a',
      publishedAt: '2025-12-12',
      corroborated: true,
      format: 'article',
    },
    {
      name: 'Enab Baladi - Local Syria reporting and investigations',
      url: 'https://en.enabbaladi.org/',
      reason:
        'Adds Syrian-origin local coverage, investigations, social impact, governance, rights, and service-delivery signals that UN sources cannot provide alone.',
      reliability: 'tier_b',
      publishedAt: 'continuous',
      corroborated: false,
      format: 'article',
    },
    {
      name: 'North Press Agency - Northeast Syria reporting',
      url: 'https://npasyria.com/en/',
      reason:
        'Adds high-proximity northeast reporting for SDF-administered areas, border dynamics, community stress, and local implementation indicators.',
      reliability: 'tier_b',
      publishedAt: 'continuous',
      corroborated: false,
      format: 'article',
    },
    {
      name: 'The Syria Report - Economy, HLP, and recovery constraints',
      url: 'https://syria-report.com/',
      reason:
        'Adds specialist economic, business, reconstruction, sanctions, procurement, and housing-land-property coverage to the recovery risk frame.',
      reliability: 'tier_b',
      publishedAt: 'continuous',
      corroborated: false,
      format: 'article',
    },
  ],
  duplicatesAvoided: [
    'Generic Syria civil-war explainers that predate the December 2024 political transition.',
    'News reposts that repeat UN numbers without adding new sourcing or field detail.',
    'Speculative war-spillover commentary without official or event-level corroboration.',
  ],
  intelligenceGaps: [
    'Local governance details of the northeast implementation plan remain incomplete in public reporting.',
    'Independent field verification of detention-facility security and transfers is limited in the public-source corpus.',
    'Reliable local reporting from Sweida, northeast Syria, returns corridors, and economic/HLP channels should be added before briefing narrow local dynamics.',
  ],
  retrievalTrace: {
    layersSearched: ['official UN reporting', 'humanitarian reports', 'returns data', 'graph primitives', 'tool-output cache'],
    itemCount: 18,
    durationMs: 682,
  },
  sourceReceipts: SYRIA_RECEIPTS,
  sourceAudit: {
    generatedAt: '2026-05-02T09:00:00Z',
    sourceCount: SYRIA_RECEIPTS.length,
    providerCounts: { 'Public web source': 5 },
    highReliabilityCount: 5,
    checkableUrlCount: 5,
    scrapedExcerptCount: 5,
    structuredDataCount: 4,
    confidence: 'high',
    gaps: [
      'Need more local civil society reporting from Sweida and northeast Syria.',
      'Need independent detention-facility security verification before strong operational claims.',
    ],
    notes: [
      'This case uses official and humanitarian sources first to avoid unnecessary cloud/provider calls during recording.',
      'All proposed sources have checkable URLs and are suitable for public attribution.',
      'Local Syria media sources are proposed for source diversity but should be triangulated before high-impact factual claims.',
    ],
  },
};

export const SYRIA_DEMO_BRAINSTORMING_TABLE_OUTPUT: DemoBrainstormingOutput = {
  question:
    'Should PRAXIS recommend prioritizing the northeast integration agreement as the stabilizing center of gravity, or shift leadership attention to regional spillover and humanitarian strain?',
  generatedAt: '2026-05-02T09:08:00Z',
  personas: ['mediator', 'humanitarian', 'legal', 'media', 'security', 'red-team'],
  retrievalTrace: {
    layersSearched: ['source receipts', 'conflict graph', 'humanitarian reports', 'Security Council updates'],
    itemCount: 22,
    durationMs: 744,
  },
  turns: [
    {
      turnId: 'syria-bt-1',
      persona: 'mediator',
      claim:
        'The northeast agreement should remain the organizing frame because it creates a concrete implementation pathway where UN good offices can still shape outcomes.',
      evidence: [
        { sourceType: 'source', sourceId: 'un-geneva-syria-2026-02-13', excerpt: 'UN reporting says implementation planning was progressing after the 30 January Damascus-SDF agreement.' },
      ],
      recommendation:
        'Brief leadership on three implementation asks: local governance sequencing, protection of Kurdish civil rights, and a return/displacement monitoring cell.',
      confidence: 'medium',
      status: 'accepted',
    },
    {
      turnId: 'syria-bt-2',
      persona: 'humanitarian',
      claim:
        'The agreement is strategically important, but humanitarian strain is the immediate credibility test for the transition.',
      evidence: [
        { sourceType: 'source', sourceId: 'unfpa-syria-2026-02-12', excerpt: 'UNFPA estimated 128,400 people remained displaced in Aleppo and northeast Syria as of 11 February 2026.' },
      ],
      recommendation:
        'Tie the agreement dashboard to measurable access, shelter, GBV/protection, winterization, and return-support indicators.',
      confidence: 'high',
      status: 'accepted',
    },
    {
      turnId: 'syria-bt-3',
      persona: 'legal',
      claim:
        'Public recommendations should avoid implying implementation success until rights protections, detention issues, and territorial-integrity concerns are verified.',
      evidence: [
        { sourceType: 'source', sourceId: 'un-geneva-syria-2026-02-13', excerpt: 'The UN emphasized rights protection, return of displaced people, and sensitivity around ISIL detention facilities.' },
      ],
      recommendation:
        'Use a calibrated finding: "potentially transformative but contingent on rights-protective implementation."',
      confidence: 'medium',
      status: 'accepted',
    },
    {
      turnId: 'syria-bt-4',
      persona: 'media',
      claim:
        'Investors and principals will understand PRAXIS fastest if the recording shows the graph catching the tension between optimism and fragility.',
      evidence: [
        { sourceType: 'graph', sourceId: 'risk-regional-spillover', excerpt: 'Regional escalation connects to recovery fragility, airspace restrictions, and aid constraints.' },
      ],
      recommendation:
        'Narrate the graph as a live operating picture: green implementation pathway, red humanitarian and spillover risks, yellow evidence gaps.',
      confidence: 'high',
      status: 'accepted',
    },
    {
      turnId: 'syria-bt-5',
      persona: 'security',
      claim:
        'Regional spillover is the risk that can invalidate otherwise good transition planning.',
      evidence: [
        { sourceType: 'source', sourceId: 'un-geneva-syria-2026-03-18', excerpt: 'UN officials warned that regional escalation adds strain at a fragile moment.' },
      ],
      recommendation:
        'Track incidents, airspace restrictions, southern incursions, and detention-facility security as early-warning triggers.',
      confidence: 'medium',
      status: 'accepted',
    },
    {
      turnId: 'syria-bt-6',
      persona: 'red-team',
      claim:
        'The recording must say "public-source case file" out loud. Otherwise the sophistication of the graph may invite overclaiming.',
      evidence: [
        { sourceType: 'source-audit', sourceId: 'syria-demo-source-scout-2026-05-02', excerpt: 'Source Scout found high-reliability UN and humanitarian sources but local reporting gaps remain.' },
      ],
      critique:
        'Do not claim live intelligence or classified awareness. Show how PRAXIS would update when new receipts arrive.',
      recommendation:
        'End the recording with the evidence gap and the next collection task, not with false certainty.',
      confidence: 'high',
      status: 'challenged',
    },
  ],
  synthesis: {
    bluf:
      'Keep the northeast integration agreement as the stabilizing center of gravity, but brief it as fragile: humanitarian access, rights-protective implementation, southern flashpoints, and regional spillover are the triggers that could overturn the positive trajectory.',
    consensusPoints: [
      'The January 2026 Damascus-SDF agreement is the most concrete de-escalatory pathway in the public corpus.',
      'Humanitarian and protection indicators must be fused into the same graph as political implementation milestones.',
      'Regional spillover and southern incidents are not side issues; they can break confidence in the transition.',
    ],
    divergences: [
      'Mediator prioritizes protecting the implementation channel; humanitarian and security advisors want equal prominence for immediate strain indicators.',
      'Legal and red-team personas caution that public data is strong on strategic framing but thin on several local implementation details.',
    ],
    optionsForDecision: [
      {
        label: 'Implementation-first brief',
        tradeoffs:
          'Best for diplomatic momentum and investor clarity, but must include visible red triggers and evidence gaps.',
        preferredBy: ['mediator', 'media'],
      },
      {
        label: 'Risk-first brief',
        tradeoffs:
          'Best for preventing surprise and overconfidence, but could understate the opportunity created by the agreement.',
        preferredBy: ['humanitarian', 'security', 'red-team'],
      },
    ],
    openQuestions: [
      'What local governance benchmarks would prove the agreement is being implemented rights-protectively?',
      'Which incidents in southern Syria or regional escalation would force a change in UN posture?',
      'What source would raise confidence on detention-facility security and transfer procedures?',
    ],
    nextActions: [
      { action: 'Create a northeast implementation trigger board with governance, rights, return, and access indicators.', owner: 'Political affairs analyst', urgency: 'immediate' },
      { action: 'Add local Sweida and northeast civil society sources to the next Source Scout run.', owner: 'Research lead', urgency: 'short-term' },
      { action: 'Prepare a one-page principal brief that separates facts, assessments, and collection gaps.', owner: 'Briefing officer', urgency: 'immediate' },
    ],
  },
};

export const SYRIA_DEMO_POLICY_MEMO = {
  classification: 'UNCLASSIFIED / PUBLIC SOURCES',
  to: 'Special Envoy and Senior Transition Team',
  from: 'PRAXIS Syria Case Cell',
  subject: 'Protecting the Northeast Integration Track While Managing Humanitarian and Regional Spillover Risk',
  executiveSummary:
    'The 30 January 2026 Damascus-SDF ceasefire and integration agreement remains the clearest stabilizing pathway in the public-source Syria file, but it should not be briefed as self-executing progress. PRAXIS recommends an implementation-first posture with a visible risk dashboard: humanitarian access, return conditions, rights protections, southern flashpoints, Israeli incursions, detention-facility concerns, and regional escalation should be treated as decision triggers that can change the policy line within days.',
  problemStatement:
    'Leadership needs a position that protects a rare de-escalatory opening without overclaiming what public reporting can prove. The policy question is whether to organize diplomatic energy around the northeast integration agreement, or shift principal attention toward humanitarian strain and regional spillover as the dominant risks.',
  contextAndBackground:
    'UN reporting in February 2026 described the northeast agreement as potentially transformative while also highlighting violence, Israeli incursions, humanitarian needs, and rights-protection concerns. In March 2026, UN and OCHA reporting warned that wider Middle East escalation could undermine Syria fragile recovery. The UN Common Country Analysis frames trust-building, recovery, and inclusive transition as central for the 2027-2030 planning cycle. UNFPA reporting added a concrete displacement layer across Aleppo and northeast Syria, and UNHCR reporting emphasized large-scale returns alongside urgent shelter, services, and protection constraints.',
  policyOptions: [
    {
      option: 'Implementation-first posture with explicit red triggers',
      pros: [
        'Keeps the most concrete de-escalatory track at the center of diplomacy.',
        'Creates measurable benchmarks for governance, rights, returns, aid access, and security integration.',
        'Allows leadership to show optimism while retaining analytic discipline.',
      ],
      cons: [
        'Can look too optimistic if humanitarian or regional indicators worsen quickly.',
        'Requires disciplined monitoring and repeated source refreshes.',
      ],
      riskLevel: 'medium',
      resourceImplications:
        'Requires a small analytic cell to maintain the trigger board, update source receipts, and brief changes twice weekly.',
      levelOneAnalysis:
        'Internationally, the UN can support implementation benchmarks while preserving Syrian ownership and territorial-integrity language.',
      levelTwoAnalysis:
        'Domestically, the posture depends on rights-protective implementation that does not alienate Kurdish civil authorities or communities affected by displacement.',
      winSet:
        'Largest win-set if the brief links implementation progress to humanitarian and rights indicators rather than treating them as separate files.',
    },
    {
      option: 'Risk-first posture centered on humanitarian and spillover pressure',
      pros: [
        'Reduces the risk of surprise if regional escalation or aid constraints dominate the next reporting cycle.',
        'Gives operational teams clearer warning thresholds for displacement, access, and protection stress.',
      ],
      cons: [
        'May underuse the diplomatic opening created by the northeast agreement.',
        'Can make the transition appear less governable to external supporters.',
      ],
      riskLevel: 'medium',
      resourceImplications:
        'Requires deeper humanitarian data refresh and local civil-society sourcing before narrow geographic recommendations.',
      levelOneAnalysis:
        'Internationally, it aligns with OCHA and UN warnings on recovery fragility and spillover risk.',
      levelTwoAnalysis:
        'Domestically, it may be received as skepticism toward transition authorities unless paired with practical support.',
      winSet:
        'Works if framed as protecting the recovery window, not downgrading the agreement.',
    },
    {
      option: 'Hold posture until local verification improves',
      pros: [
        'Avoids overclaiming public-source data on detention facilities, local governance, and field implementation.',
        'Protects credibility if public reporting is thin or contradictory.',
      ],
      cons: [
        'Misses the moment to shape implementation metrics while the agreement is still politically salient.',
        'Can leave principals without a usable line for engagements this week.',
      ],
      riskLevel: 'high',
      resourceImplications:
        'Lower immediate cost but higher opportunity cost; still requires a collection plan for local sources.',
      levelOneAnalysis:
        'Internationally cautious, but it weakens the UN ability to shape the agreement terms through public and private benchmarks.',
      levelTwoAnalysis:
        'Domestic stakeholders may interpret silence as disengagement or lack of confidence.',
      winSet:
        'Narrow. Use only if new reporting contradicts the public-source baseline.',
    },
  ],
  recommendation:
    'Adopt Option 1: an implementation-first posture with explicit red triggers. The memo should say the northeast agreement is the organizing opportunity, not the guaranteed outcome. PRAXIS should brief three immediate asks: a rights-protective implementation benchmark set, a humanitarian-access and return-support dashboard, and a regional-spillover warning board connected to the graph.',
  implementationSteps: [
    'Create a 14-day trigger board covering governance sequencing, Kurdish civil and educational rights, security integration, detention-facility handling, displacement, aid access, and regional escalation.',
    'Use Source Scout to add local civil society, northeast governance, and southern flashpoint reporting before any narrow operational recommendation.',
    'Run GraphOps review on the Syria Firestore graph so each claim, event, and trigger retains source receipts and confidence labels.',
    'Prepare a principal one-pager that separates observed facts, PRAXIS assessment, assumptions, and collection gaps.',
    'Schedule a twice-weekly refresh cadence that updates graph edges when new source receipts arrive.',
  ],
  monitoringIndicators: [
    'Public evidence of joint implementation mechanisms after the 30 January agreement.',
    'Reports on returns, shelter access, protection services, and aid delivery in Aleppo and northeast Syria.',
    'Southern violence, Israeli incursions, airspace restrictions, or regional incidents that constrain recovery.',
    'Statements or reporting on Kurdish civil rights, education, governance, and security integration.',
    'Funding, banking, and liquidity constraints affecting humanitarian and early recovery operations.',
  ],
  risks:
    'The main analytic risk is conflating a promising agreement with verified implementation. The main policy risk is briefing optimism without visible triggers. PRAXIS mitigates both by tying every recommendation to source receipts, graph provenance, confidence levels, and explicit follow-up research gaps.',
  citations: [
    SYRIA_DEMO_SOURCES.unGenevaFebruary,
    SYRIA_DEMO_SOURCES.unGenevaMarch,
    SYRIA_DEMO_SOURCES.unCommonCountryAnalysis,
    SYRIA_DEMO_SOURCES.unfpaNorthEast,
    SYRIA_DEMO_SOURCES.unhcrReturns,
  ],
  draftingAudit: {
    confidenceNote:
      'Confidence is medium-high for the strategic frame because it is anchored in UN and humanitarian sources. Confidence is medium for local implementation details because public reporting remains incomplete.',
    limits: [
      'Public sources do not fully verify local governance implementation or detention-facility security arrangements.',
      'Local civil society and Arabic-language reporting should be added before operational recommendations by district.',
      'Regional spillover indicators require frequent refresh because they can change faster than formal UN reporting.',
    ],
    followUpResearch: [
      'Add local northeast and Sweida reporting to test the graph against field-level dynamics.',
      'Collect implementation statements from transitional authorities, SDF-linked civil authorities, and humanitarian actors.',
      'Refresh displacement, returns, and service-restoration data before external distribution.',
    ],
    sourceUse: [
      {
        source: 'UN Geneva, 13 February 2026',
        claim: 'Frames the January agreement alongside violence, Israeli incursions, rights concerns, and humanitarian strain.',
        confidence: 'high',
      },
      {
        source: 'UN Geneva / OCHA, 18 March 2026',
        claim: 'Supports the spillover-risk and fragile-recovery warning line.',
        confidence: 'high',
      },
      {
        source: 'UN Syria Common Country Analysis',
        claim: 'Supports trust-building, recovery, and inclusive transition as strategic requirements.',
        confidence: 'high',
      },
      {
        source: 'UNFPA and UNHCR public reporting',
        claim: 'Supports displacement, returns, shelter, services, and protection constraints.',
        confidence: 'medium',
      },
    ],
  },
};

export const SYRIA_DEMO_MORNING_BRIEF: BriefingSlide[] = [
  {
    id: 'syria-slide-1-title',
    type: 'title',
    title: 'SYRIA TRANSITION - Decision Brief',
    content: `2 May 2026

Public-source PRAXIS case file

UNCLASSIFIED / PUBLIC SOURCES`,
    speakerNotes:
      'Open by saying this is a public-source Syria case file: PRAXIS converts current reporting into a structured graph, advisor debate, and briefable decision product.',
    sources: ['UN Geneva', 'OCHA', 'UN Syria CCA', 'UNFPA', 'UNHCR'],
  },
  {
    id: 'syria-slide-2-summary',
    type: 'summary',
    title: 'BLUF: Opportunity Under Strain',
    content: `- **Stabilizing pathway:** The 30 January Damascus-SDF ceasefire and integration agreement gives the transition a concrete implementation track.

- **Fragility drivers:** Renewed displacement in Aleppo and the northeast, southern flashpoints, Israeli incursions, and regional spillover risks could erode confidence quickly.

- **PRAXIS judgment:** Treat the agreement as potentially transformative, but manage it through measurable humanitarian, rights, governance, and security triggers.`,
    speakerNotes:
      'This slide is the 10-second thesis: PRAXIS is not summarizing articles; it is turning sources into a decision frame with triggers.',
    sources: ['UN Geneva, 13 Feb 2026', 'UN Geneva / OCHA, 18 Mar 2026'],
  },
  {
    id: 'syria-slide-3-graph',
    type: 'map',
    title: 'Graph Readout',
    content: `The graph has four live clusters:

- **Agreement cluster:** Syrian Government, SDF, UN Special Envoy, Kurdish rights, northeast integration, return provisions.
- **Humanitarian cluster:** OCHA, UNFPA, UNHCR, displacement, protection services, return support, basic services.
- **Security cluster:** southern violence, Israeli incursions, detention-facility concerns, regional spillover.
- **Recovery cluster:** trust-building, inclusive governance, reconstruction, banking and funding constraints.

The value is causal adjacency: one click shows how a ceasefire implementation milestone connects to displacement, protection, governance, and spillover risk.`,
    speakerNotes:
      'On the conflict graph page, click the 30 January agreement node, then SDF, then displacement. Say: PRAXIS turns a case file into a queryable operating picture.',
    sources: ['PRAXIS Syria graph built from public receipts'],
  },
  {
    id: 'syria-slide-4-timeline',
    type: 'timeline',
    title: 'Key Developments',
    content: `- **8 Dec 2024:** Assad regime overthrown; Syria enters a new transition period.
- **Jan 2026:** Fighting in Aleppo and northeast Syria creates new displacement and protection stress.
- **30 Jan 2026:** Syrian Government and SDF reach ceasefire and integration agreement.
- **13 Feb 2026:** Security Council hears cautious optimism, but also southern violence, Israeli incursions, and severe needs.
- **18 Mar 2026:** UN warns regional escalation could undermine Syria's fragile recovery.`,
    speakerNotes:
      'The timeline is deliberately short: show investors that PRAXIS can compress messy reporting into the current decision sequence.',
    sources: ['UN Geneva, UNFPA, UNHCR'],
  },
  {
    id: 'syria-slide-5-risk',
    type: 'risk',
    title: 'Risk Board',
    content: `**Overall risk: 78/100 - volatile**

- **Implementation risk:** Local governance and rights protections are the main tests of the Damascus-SDF agreement.
- **Humanitarian risk:** Displacement and service strain remain acute in Aleppo and northeast Syria.
- **Security risk:** Southern flashpoints, Israeli incursions, detention-facility concerns, and regional spillover can derail recovery.
- **Evidence risk:** Public sources are strong for strategic framing, thinner for local implementation detail.`,
    speakerNotes:
      'Stress the evidence risk. The wow factor is that PRAXIS makes uncertainty visible instead of hiding it.',
    sources: ['PRAXIS GraphOps summary', 'Source Scout receipt audit'],
  },
  {
    id: 'syria-slide-6-actions',
    type: 'actions',
    title: 'Decision Actions',
    content: `- **Protect the agreement:** Ask for a 30-day implementation dashboard: local governance, security integration, rights, returns, and detention-facility safeguards.
- **Fuse humanitarian metrics:** Make displacement, shelter, protection, and return support visible on the same graph as political milestones.
- **Monitor red triggers:** Southern incidents, Israeli incursions, regional escalation, airspace restrictions, and aid-funding constraints.
- **Close gaps:** Add local civil society and field-verification sources before making granular claims.`,
    speakerNotes:
      'End by showing that PRAXIS produces decisions, not just analysis. These are immediately assignable next steps.',
    sources: ['Brainstorming Table synthesis', 'UN Syria CCA'],
  },
  {
    id: 'syria-slide-7-discussion',
    type: 'discussion',
    title: 'Principal Questions',
    content: `- What would convince us the northeast integration agreement is becoming self-sustaining?
- Which humanitarian or security trigger would force leadership to change posture this week?
- What source gap is most dangerous: local governance, detention-facility security, southern violence, or return conditions?
- Which product should PRAXIS produce next: policy memo, talking points, or evidence-gap tasking?`,
    speakerNotes:
      'This final slide is useful for an investor recording because it makes the platform feel like a live decision system.',
    sources: ['PRAXIS structured advisor output'],
  },
];

export const SYRIA_DEMO_CONFLICT_GRAPH: ConflictGraph = {
  id: SYRIA_DEMO_CASE_ID,
  name: SYRIA_DEMO_SITUATION.name,
  description: SYRIA_DEMO_SITUATION.description,
  region: 'Syria',
  status: 'active',
  lastUpdated: '2026-05-02T09:00:00.000Z',
  actors: [
    {
      type: 'actor',
      id: 'actor-syrian-government',
      name: 'Syrian Government / transitional authorities',
      shortName: 'Syrian Government',
      actorType: 'state',
      description:
        'Post-Assad Syrian authorities managing national transition, territorial integration, recovery, and security consolidation.',
      relationships: [
        { targetActorId: 'actor-sdf', type: 'competitor', description: 'Ceasefire/integration counterpart in northeast Syria.' },
        { targetActorId: 'actor-un-envoy', type: 'neutral', description: 'Engages with UN good offices and Security Council diplomacy.' },
        { targetActorId: 'actor-israel', type: 'adversary', description: 'Objects to continued incursions and security operations in Syrian territory.' },
      ],
    },
    {
      type: 'actor',
      id: 'actor-sdf',
      name: 'Syrian Democratic Forces / Kurdish-led authorities',
      shortName: 'SDF / AANES',
      actorType: 'non_state_armed_group',
      description:
        'Kurdish-led security and administrative actor in northeast Syria; party to the January 2026 integration agreement.',
      relationships: [
        { targetActorId: 'actor-syrian-government', type: 'competitor', description: 'Negotiates phased military and administrative integration.' },
        { targetActorId: 'actor-kurdish-civil', type: 'ally', description: 'Linked to civil, cultural, educational, and citizenship-rights concerns.' },
      ],
    },
    {
      type: 'actor',
      id: 'actor-kurdish-civil',
      name: 'Kurdish civil and educational authorities',
      shortName: 'Kurdish civil authorities',
      actorType: 'civil_society',
      description:
        'Civil and educational stakeholders whose rights protections are referenced in the northeast agreement.',
    },
    {
      type: 'actor',
      id: 'actor-un-envoy',
      name: 'UN Special Envoy and Deputy Special Envoy for Syria',
      shortName: 'UN Special Envoy',
      actorType: 'international_organization',
      description:
        'UN good offices actor supporting a Syrian-led political process, inclusive governance, human rights, and implementation diplomacy.',
      relationships: [
        { targetActorId: 'actor-ocha', type: 'ally', description: 'Coordinates political and humanitarian messaging to the Security Council.' },
      ],
    },
    {
      type: 'actor',
      id: 'actor-ocha',
      name: 'OCHA and UN humanitarian agencies',
      shortName: 'OCHA / UN agencies',
      actorType: 'international_organization',
      description:
        'Humanitarian coordination and response actors tracking needs, access, displacement, services, and funding constraints.',
    },
    {
      type: 'actor',
      id: 'actor-unhcr',
      name: 'UNHCR',
      shortName: 'UNHCR',
      actorType: 'international_organization',
      description:
        'UN refugee agency tracking refugee and IDP returns, protection, shelter, and reintegration needs.',
    },
    {
      type: 'actor',
      id: 'actor-israel',
      name: 'Israel',
      shortName: 'Israel',
      actorType: 'state',
      description:
        'Regional military actor referenced in UN reporting on incursions, search operations, and disengagement-line concerns.',
    },
    {
      type: 'actor',
      id: 'actor-sweida-armed-groups',
      name: 'Local armed groups in Sweida and southern Syria',
      shortName: 'Southern armed groups',
      actorType: 'non_state_armed_group',
      description:
        'Local armed actors associated with renewed clashes, protests, infrastructure damage, and confidence-building needs.',
    },
  ],
  claims: [
    {
      type: 'claim',
      id: 'claim-state-integrity',
      actorId: 'actor-syrian-government',
      claimType: 'sovereignty',
      title: 'National territorial integrity and central state authority',
      description:
        'Syrian authorities assert the need to consolidate state authority while pursuing a political transition.',
      basis: 'UN reporting on transition, integration, and territorial-integrity language.',
      status: 'active',
      legitimacyScore: 0.68,
      internationalRecognition: 'broad',
      competingClaimIds: ['claim-kurdish-rights'],
    },
    {
      type: 'claim',
      id: 'claim-kurdish-rights',
      actorId: 'actor-kurdish-civil',
      claimType: 'cultural',
      title: 'Protection of Kurdish civil, cultural, educational, and citizenship rights',
      description:
        'Kurdish stakeholders seek rights protections within the integration process.',
      basis: 'UN description of the 30 January agreement and related presidential decree.',
      status: 'active',
      legitimacyScore: 0.74,
      internationalRecognition: 'disputed',
      competingClaimIds: ['claim-state-integrity'],
    },
    {
      type: 'claim',
      id: 'claim-humanitarian-access',
      actorId: 'actor-ocha',
      claimType: 'humanitarian',
      title: 'Sustained humanitarian access and recovery support',
      description:
        'UN humanitarian officials call for assistance, recovery investment, and access during a fragile transition.',
      basis: 'OCHA and UN Security Council briefings.',
      status: 'active',
      legitimacyScore: 0.9,
      internationalRecognition: 'broad',
    },
  ],
  interests: [
    {
      type: 'interest',
      id: 'interest-government-control',
      actorId: 'actor-syrian-government',
      interestType: 'political',
      title: 'Consolidate transition authority without renewed fragmentation',
      description:
        'The government seeks to integrate northeast Syria and prevent security vacuums while preserving sovereignty.',
      priority: 'vital',
      visibility: 'inferred',
    },
    {
      type: 'interest',
      id: 'interest-sdf-autonomy-rights',
      actorId: 'actor-sdf',
      interestType: 'security',
      title: 'Protect local rights and avoid coercive security integration',
      description:
        'The SDF and linked civil authorities seek safeguards for Kurdish rights, education, governance, and security roles.',
      priority: 'vital',
      visibility: 'stated',
    },
    {
      type: 'interest',
      id: 'interest-un-transition',
      actorId: 'actor-un-envoy',
      interestType: 'political',
      title: 'Advance inclusive Syrian-led transition',
      description:
        'The UN seeks inclusive governance, rights protection, implementation support, and reduced violence.',
      priority: 'important',
      visibility: 'stated',
    },
    {
      type: 'interest',
      id: 'interest-humanitarian-stability',
      actorId: 'actor-ocha',
      interestType: 'humanitarian',
      title: 'Reduce needs and protect recovery window',
      description:
        'Humanitarian actors seek funding, access, basic services, protection, and safe voluntary returns.',
      priority: 'vital',
      visibility: 'stated',
    },
  ],
  constraints: [
    {
      type: 'constraint',
      id: 'constraint-regional-escalation',
      actorId: 'actor-syrian-government',
      constraintType: 'international',
      title: 'Regional escalation and spillover',
      description:
        'Regional war dynamics, airspace restrictions, and cross-border incidents increase pressure on Syria recovery.',
      severity: 'significant',
      source: SYRIA_DEMO_SOURCES.unGenevaMarch,
    },
    {
      type: 'constraint',
      id: 'constraint-aid-funding',
      actorId: 'actor-ocha',
      constraintType: 'economic',
      title: 'Funding and banking constraints',
      description:
        'Humanitarian operations remain constrained by funding shortfalls, liquidity, and weak banking services.',
      severity: 'significant',
      source: SYRIA_DEMO_SOURCES.unGenevaMarch,
    },
    {
      type: 'constraint',
      id: 'constraint-local-trust',
      actorId: 'actor-un-envoy',
      constraintType: 'social',
      title: 'Trust deficit after fourteen years of conflict',
      description:
        'The UN Common Country Analysis identifies trust-building as central to transition, recovery, and development.',
      severity: 'binding',
      source: SYRIA_DEMO_SOURCES.unCommonCountryAnalysis,
    },
  ],
  leverage: [
    {
      type: 'leverage',
      id: 'leverage-security-integration',
      actorId: 'actor-syrian-government',
      targetActorId: 'actor-sdf',
      leverageType: 'institutional',
      title: 'Phased military and administrative integration',
      description:
        'Damascus can shape appointments, governance arrangements, and security integration under the agreement.',
      effectiveness: 0.72,
      sustainability: 'medium_term',
      isActive: true,
      cost: 'medium',
    },
    {
      type: 'leverage',
      id: 'leverage-un-good-offices',
      actorId: 'actor-un-envoy',
      targetActorId: 'actor-syrian-government',
      leverageType: 'diplomatic',
      title: 'Security Council attention and good offices',
      description:
        'UN briefings and good offices can elevate implementation benchmarks and inclusion concerns.',
      effectiveness: 0.62,
      sustainability: 'medium_term',
      isActive: true,
      cost: 'low',
    },
    {
      type: 'leverage',
      id: 'leverage-aid-recovery',
      actorId: 'actor-ocha',
      targetActorId: 'actor-syrian-government',
      leverageType: 'financial',
      title: 'Humanitarian and recovery support',
      description:
        'Aid, recovery investment, and service restoration can support stabilization if access and governance conditions hold.',
      effectiveness: 0.66,
      sustainability: 'short_term',
      isActive: true,
      cost: 'high',
    },
  ],
  commitments: [
    {
      type: 'commitment',
      id: 'commitment-jan30-integration',
      actorId: 'actor-syrian-government',
      commitmentType: 'ceasefire',
      title: '30 January ceasefire and northeast integration agreement',
      description:
        'Agreement between the Syrian Government and SDF for phased military and administrative integration of northeast Syria, return provisions, and rights protections.',
      status: 'active',
      counterpartyIds: ['actor-sdf', 'actor-kurdish-civil'],
      conditions: ['Implementation plan', 'Rights protections', 'Return arrangements', 'Avoid security vacuum'],
      verificationMechanism: 'UN and stakeholder monitoring through public briefings and implementation reporting',
      dateCommitted: '2026-01-30',
    },
  ],
  events: [
    {
      type: 'event',
      id: 'event-assad-overthrow',
      title: 'Assad regime overthrown',
      description:
        'UN reporting frames Syria as more than a year into transition after the overthrow of the Assad regime on 8 December 2024.',
      eventType: 'political',
      date: '2024-12-08',
      location: 'Syria',
      actorIds: ['actor-syrian-government'],
      impact: 'critical',
      escalatoryDirection: 'de_escalatory',
      sources: [SYRIA_DEMO_SOURCES.unGenevaMarch],
    },
    {
      type: 'event',
      id: 'event-jan2026-ne-displacement',
      title: 'Aleppo and northeast Syria escalation displaces civilians',
      description:
        'Escalation across Aleppo, Ar-Raqqa, Al-Hasakah, and Deir-ez-Zor displaced large numbers and heightened protection needs.',
      eventType: 'humanitarian',
      date: '2026-01-06',
      location: 'Aleppo and northeast Syria',
      actorIds: ['actor-syrian-government', 'actor-sdf', 'actor-ocha'],
      impact: 'major',
      escalatoryDirection: 'escalatory',
      sources: [SYRIA_DEMO_SOURCES.unfpaNorthEast],
    },
    {
      type: 'event',
      id: 'event-jan30-agreement',
      title: 'Damascus-SDF ceasefire and integration agreement',
      description:
        'UN officials pointed to a 30 January agreement as potentially transformative for northeast Syria.',
      eventType: 'ceasefire',
      date: '2026-01-30',
      location: 'Northeast Syria',
      actorIds: ['actor-syrian-government', 'actor-sdf', 'actor-un-envoy'],
      impact: 'critical',
      escalatoryDirection: 'de_escalatory',
      sources: [SYRIA_DEMO_SOURCES.unGenevaFebruary],
    },
    {
      type: 'event',
      id: 'event-feb13-unsc',
      title: 'Security Council briefed on transition momentum and violence risks',
      description:
        'UN Security Council heard that the transition gained momentum but remains threatened by southern violence, Israeli incursions, and humanitarian strain.',
      eventType: 'diplomatic',
      date: '2026-02-13',
      location: 'UN Security Council',
      actorIds: ['actor-un-envoy', 'actor-ocha', 'actor-syrian-government'],
      impact: 'major',
      escalatoryDirection: 'ambiguous',
      sources: [SYRIA_DEMO_SOURCES.unGenevaFebruary],
    },
    {
      type: 'event',
      id: 'event-mar18-spillover',
      title: 'UN warns regional escalation risks undermining recovery',
      description:
        'UN officials warned that wider Middle East escalation adds strain to Syria at a fragile moment.',
      eventType: 'escalation',
      date: '2026-03-18',
      location: 'Syria / regional theater',
      actorIds: ['actor-un-envoy', 'actor-ocha', 'actor-syrian-government'],
      impact: 'major',
      escalatoryDirection: 'escalatory',
      sources: [SYRIA_DEMO_SOURCES.unGenevaMarch],
    },
  ],
  narratives: [
    {
      type: 'narrative',
      id: 'narrative-cautious-optimism',
      actorId: 'actor-un-envoy',
      title: 'Cautious optimism with explicit fragility',
      description:
        'The UN frames Syria as having a real recovery opportunity that remains fragile and dependent on inclusive politics, humanitarian support, and reduced violence.',
      narrativeType: 'humanitarian',
      keyMessages: ['Opportunity exists', 'Transition must be inclusive', 'Humanitarian and recovery support remain essential'],
      targetAudience: 'international',
      effectiveness: 0.74,
      reach: 'global',
    },
    {
      type: 'narrative',
      id: 'narrative-territorial-integrity',
      actorId: 'actor-syrian-government',
      title: 'Sovereignty and territorial integrity',
      description:
        'Syrian authorities and UN reporting emphasize sovereignty and territorial integrity as a frame for security arrangements and foreign-incursion concerns.',
      narrativeType: 'security',
      keyMessages: ['Sovereignty', 'Territorial integrity', 'Security arrangements'],
      targetAudience: 'domestic',
      effectiveness: 0.62,
      reach: 'regional',
    },
  ],
  dataCompleteness: 88,
  metadata: {
    demoCase: 'syria',
    sourceMode: 'public-source snapshot',
  },
};

export const SYRIA_DEMO_CANONICAL_GRAPH: GraphData = {
  version: '2.0',
  schemaVersion: 'aco-v2-demo',
  lastUpdated: '2026-05-02T09:00:00.000Z',
  nodes: [
    ...SYRIA_DEMO_CONFLICT_GRAPH.actors.map((actor) => ({
      id: actor.id,
      type: 'actor',
      label: actor.shortName ?? actor.name,
      properties: { name: actor.name },
      createdAt: '2026-05-02T09:00:00.000Z',
      source: 'web-research' as const,
      metadata: {
        description: actor.description,
        confidence: 'high',
        valid_from: '2026-02-13',
        source_url: SYRIA_DEMO_SOURCES.unGenevaFebruary,
        source_name: 'UN Geneva',
      },
    })),
    ...SYRIA_DEMO_CONFLICT_GRAPH.claims.map((claim) => ({
      id: claim.id,
      type: 'claim',
      label: claim.title,
      properties: { name: claim.title },
      createdAt: '2026-05-02T09:00:00.000Z',
      source: 'web-research' as const,
      metadata: {
        description: claim.description,
        confidence: 'medium',
        valid_from: '2026-02-13',
        source_url: SYRIA_DEMO_SOURCES.unGenevaFebruary,
        source_name: 'UN Geneva',
      },
    })),
    ...SYRIA_DEMO_CONFLICT_GRAPH.interests.map((interest) => ({
      id: interest.id,
      type: 'interest',
      label: interest.title,
      properties: { name: interest.title },
      createdAt: '2026-05-02T09:00:00.000Z',
      source: 'web-research' as const,
      metadata: {
        description: interest.description,
        confidence: interest.visibility === 'stated' ? 'high' : 'medium',
        valid_from: '2026-02-13',
        source_url: SYRIA_DEMO_SOURCES.unGenevaFebruary,
        source_name: 'UN Geneva',
      },
    })),
    ...SYRIA_DEMO_CONFLICT_GRAPH.constraints.map((constraint) => ({
      id: constraint.id,
      type: 'constraint',
      label: constraint.title,
      properties: { name: constraint.title },
      createdAt: '2026-05-02T09:00:00.000Z',
      source: 'web-research' as const,
      metadata: {
        description: constraint.description,
        confidence: 'high',
        valid_from: '2026-03-18',
        source_url: constraint.source,
        source_name: 'UN / OCHA',
      },
    })),
    ...SYRIA_DEMO_CONFLICT_GRAPH.commitments.map((commitment) => ({
      id: commitment.id,
      type: 'commitment',
      label: commitment.title,
      properties: { name: commitment.title },
      createdAt: '2026-05-02T09:00:00.000Z',
      source: 'web-research' as const,
      metadata: {
        description: commitment.description,
        confidence: 'high',
        valid_from: commitment.dateCommitted,
        source_url: SYRIA_DEMO_SOURCES.unGenevaFebruary,
        source_name: 'UN Geneva',
      },
    })),
    ...SYRIA_DEMO_CONFLICT_GRAPH.events.map((event) => ({
      id: event.id,
      type: 'event',
      label: event.title,
      properties: { name: event.title },
      createdAt: '2026-05-02T09:00:00.000Z',
      source: 'web-research' as const,
      metadata: {
        description: event.description,
        confidence: 'high',
        valid_from: event.date,
        date: event.date,
        location: event.location,
        source_url: event.sources?.[0],
        source_name: 'Public-source receipt',
      },
    })),
  ],
  edges: [
    { id: 'edge-gov-sdf-commitment', source: 'actor-syrian-government', target: 'commitment-jan30-integration', type: 'party_to', weight: 0.9, label: 'Party to', metadata: { confidence: 'high', valid_from: '2026-01-30', source_url: SYRIA_DEMO_SOURCES.unGenevaFebruary } },
    { id: 'edge-sdf-commitment', source: 'actor-sdf', target: 'commitment-jan30-integration', type: 'party_to', weight: 0.9, label: 'Party to', metadata: { confidence: 'high', valid_from: '2026-01-30', source_url: SYRIA_DEMO_SOURCES.unGenevaFebruary } },
    { id: 'edge-un-envoy-supports', source: 'actor-un-envoy', target: 'commitment-jan30-integration', type: 'supports', weight: 0.7, label: 'Supports implementation', metadata: { confidence: 'medium', valid_from: '2026-02-13', source_url: SYRIA_DEMO_SOURCES.unGenevaFebruary } },
    { id: 'edge-commitment-rights', source: 'commitment-jan30-integration', target: 'claim-kurdish-rights', type: 'contains', weight: 0.8, label: 'Contains rights provisions', metadata: { confidence: 'medium', valid_from: '2026-01-30', source_url: SYRIA_DEMO_SOURCES.unGenevaFebruary } },
    { id: 'edge-displacement-humanitarian', source: 'event-jan2026-ne-displacement', target: 'claim-humanitarian-access', type: 'raises_need_for', weight: 0.9, label: 'Raises need for', metadata: { confidence: 'high', valid_from: '2026-02-12', source_url: SYRIA_DEMO_SOURCES.unfpaNorthEast } },
    { id: 'edge-spillover-constraint', source: 'event-mar18-spillover', target: 'constraint-regional-escalation', type: 'triggers', weight: 0.85, label: 'Triggers', metadata: { confidence: 'high', valid_from: '2026-03-18', source_url: SYRIA_DEMO_SOURCES.unGenevaMarch } },
    { id: 'edge-aid-constraint-humanitarian', source: 'constraint-aid-funding', target: 'interest-humanitarian-stability', type: 'constrains', weight: 0.8, label: 'Constrains', metadata: { confidence: 'high', valid_from: '2026-03-18', source_url: SYRIA_DEMO_SOURCES.unGenevaMarch } },
    { id: 'edge-local-trust-transition', source: 'constraint-local-trust', target: 'interest-un-transition', type: 'constrains', weight: 0.7, label: 'Constrains', metadata: { confidence: 'high', valid_from: '2026-03-31', source_url: SYRIA_DEMO_SOURCES.unCommonCountryAnalysis } },
    { id: 'edge-feb-briefing-agreement', source: 'event-feb13-unsc', target: 'event-jan30-agreement', type: 'reviews', weight: 0.7, label: 'Reviews', metadata: { confidence: 'high', valid_from: '2026-02-13', source_url: SYRIA_DEMO_SOURCES.unGenevaFebruary } },
    { id: 'edge-gov-claim', source: 'actor-syrian-government', target: 'claim-state-integrity', type: 'asserts', weight: 0.7, label: 'Asserts', metadata: { confidence: 'medium', valid_from: '2026-02-13', source_url: SYRIA_DEMO_SOURCES.unGenevaFebruary } },
    { id: 'edge-kurdish-claim', source: 'actor-kurdish-civil', target: 'claim-kurdish-rights', type: 'asserts', weight: 0.7, label: 'Asserts', metadata: { confidence: 'medium', valid_from: '2026-02-13', source_url: SYRIA_DEMO_SOURCES.unGenevaFebruary } },
  ],
};

export const SYRIA_RECORDING_STORY = [
  'Dashboard: show PRAXIS as a situation room anchored in a real Syria transition snapshot.',
  'Context Builder: show missing local governance and field-verification gaps before any AI answer.',
  'Source Scout: show five checkable UN/humanitarian receipts and the audit panel.',
  'Media Compass: show local Syrian media, state messaging, economic reporting, and monitoring sources on one reliability map.',
  'Media Roundup: show narrative divergence lanes and watch items without spending live cloud calls.',
  'GraphOps: show provenance, temporal coverage, repair suggestions, and Firestore-first graph readiness.',
  'Conflict Graph: click 30 January agreement, SDF, displacement, regional spillover.',
  'Boardroom: show expert disagreement and the red-team warning against overclaiming public data.',
  'Briefing: end on a slide-ready decision brief with sources, risk triggers, and next actions.',
];

export const SYRIA_RECORDING_SCENES = [
  {
    id: 'dashboard',
    seconds: '00-06',
    title: 'Situation room',
    href: '/dashboard?recording=1&case=syria',
    voiceover:
      'PRAXIS opens a real Syria public-source case file: risk, actors, sources, graph health, and next actions in one operating room.',
  },
  {
    id: 'context-builder',
    seconds: '06-11',
    title: 'Context discipline',
    href: '/context-builder?recording=1&case=syria',
    voiceover:
      'Before any model answer, Context Builder shows what is known, what is thin, and which evidence gaps block confidence.',
  },
  {
    id: 'source-scout',
    seconds: '11-16',
    title: 'Source receipts',
    href: '/source-scout?recording=1&case=syria',
    voiceover:
      'Source Scout turns the Syria question into checkable UN and humanitarian receipts with reliability tiers and explicit gaps.',
  },
  {
    id: 'media-compass',
    seconds: '16-21',
    title: 'Media compass',
    href: '/media-compass?recording=1&case=syria',
    voiceover:
      'Media Compass adds local Syrian outlets, official messaging, economic reporting, and monitoring sources to one explainable map.',
  },
  {
    id: 'media-roundup',
    seconds: '21-26',
    title: 'Narrative lanes',
    href: '/media-roundup?recording=1&case=syria',
    voiceover:
      'The roundup separates northeast integration, humanitarian access, rights, recovery, and regional-spillover narratives.',
  },
  {
    id: 'graphops',
    seconds: '26-31',
    title: 'GraphOps',
    href: '/graphops?recording=1&case=syria',
    voiceover:
      'GraphOps shows the Firestore graph as a production asset: provenance, temporal anchors, repair suggestions, and review gates.',
  },
  {
    id: 'conflict-graph',
    seconds: '31-36',
    title: 'Live graph',
    href: '/conflict-graph?recording=1&case=syria',
    voiceover:
      'The graph makes the case legible: the January agreement links to the SDF, Kurdish rights, displacement, aid, and regional spillover.',
  },
  {
    id: 'brainstorming-table',
    seconds: '36-41',
    title: 'Expert disagreement',
    href: '/brainstorming-table?recording=1&case=syria',
    voiceover:
      'The advisor table keeps mediator, humanitarian, legal, security, media, and red-team disagreement visible.',
  },
  {
    id: 'briefing',
    seconds: '41-45',
    title: 'Decision brief',
    href: '/briefing?recording=1&case=syria',
    voiceover:
      'The output is not a chat. It is a briefable decision product: facts, assessment, triggers, sources, and next actions.',
  },
];

export const SYRIA_RECORDING_AUDIO_SCRIPT = [
  'PRAXIS opens a real Syria public-source case file: risk, actors, sources, graph health, and next actions in one operating room.',
  'Before any model answer, Context Builder shows what is known, what is thin, and which evidence gaps block confidence.',
  'Source Scout turns the Syria question into checkable UN and humanitarian receipts with reliability tiers and explicit gaps.',
  'Media Compass adds local Syrian media, official messaging, economic reporting, and monitoring sources to one reliability map.',
  'The roundup separates northeast integration, humanitarian access, rights, recovery, and regional-spillover narratives.',
  'GraphOps shows the Firestore graph as a production asset: provenance, temporal anchors, repair suggestions, and review gates.',
  'The visual graph makes the case legible: the January agreement links to the SDF, Kurdish rights, displacement, aid, and regional spillover.',
  'Then the advisor table preserves structured disagreement: mediator, humanitarian, legal, security, media, and red-team views stay separate.',
  'The final output is not a chat. It is a briefable decision product: facts, assessment, triggers, source basis, and next actions.',
].join(' ');

export function isSyriaDemoCase(caseParam: string | null | undefined): boolean {
  return caseParam === SYRIA_DEMO_QUERY_PARAM || caseParam === SYRIA_DEMO_CASE_ID;
}

export function isSyriaWorkspaceCase(caseParam: string | null | undefined, isNoAccountWorkspace = false): boolean {
  return isSyriaDemoCase(caseParam) || isNoAccountWorkspace;
}

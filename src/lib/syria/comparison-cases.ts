export type PrimitiveCounts = {
  actors: number;
  claims: number;
  interests: number;
  constraints: number;
  leverage: number;
  commitments: number;
  events: number;
  narratives: number;
};

export type SyriaComparisonCase = {
  id: string;
  name: string;
  era: string;
  geography: string;
  summary: string;
  whyComparable: string;
  primitiveCounts: PrimitiveCounts;
  edgeVocabulary: string[];
  lessonsForSyria: string[];
  limitations: string;
};

export const PRIMITIVE_LABELS: Record<keyof PrimitiveCounts, string> = {
  actors: 'actor density',
  claims: 'rights and status claims',
  interests: 'interest map',
  constraints: 'implementation constraints',
  leverage: 'external leverage',
  commitments: 'agreement commitments',
  events: 'temporal event chain',
  narratives: 'competing narratives',
};

export const SYRIA_COMPARISON_CASES: SyriaComparisonCase[] = [
  {
    id: 'lebanon-taif-1989',
    name: 'Lebanon Taif Agreement',
    era: '1989-1991',
    geography: 'Lebanon',
    summary:
      'Civil-war settlement that mixed sovereignty, militia integration, sectarian guarantees, Syrian and Arab leverage, and a long implementation tail.',
    whyComparable:
      'Useful for thinking about a national compact that depends on armed-group integration, external guarantors, and power-sharing language that must become enforceable practice.',
    primitiveCounts: { actors: 9, claims: 4, interests: 5, constraints: 4, leverage: 4, commitments: 2, events: 5, narratives: 3 },
    edgeVocabulary: ['party_to', 'contains', 'supports', 'constrains', 'reviews', 'asserts', 'mediates'],
    lessonsForSyria: [
      'Do not confuse agreement language with implementation capacity.',
      'Make external guarantees explicit enough to monitor, but narrow enough to avoid permanent tutelage.',
      'Track rights protections and security sequencing together, not as separate files.',
    ],
    limitations:
      'Lebanon had a different sectarian institutional baseline and regional military environment; PRAXIS should use it as a pattern analog, not a policy template.',
  },
  {
    id: 'bosnia-dayton-1995',
    name: 'Bosnia Dayton Accords',
    era: '1995-1997',
    geography: 'Bosnia and Herzegovina',
    summary:
      'A war-ending settlement with territorial administration, refugee return, international supervision, external guarantors, and contested legitimacy.',
    whyComparable:
      'Strong analog for linking ceasefire durability, rights language, return provisions, institutional design, and international monitoring in one graph.',
    primitiveCounts: { actors: 10, claims: 4, interests: 5, constraints: 5, leverage: 4, commitments: 2, events: 6, narratives: 3 },
    edgeVocabulary: ['party_to', 'contains', 'supports', 'constrains', 'asserts', 'reviews', 'guarantees', 'divides'],
    lessonsForSyria: [
      'Return provisions need security, property, and services evidence before they are briefed as durable.',
      'International monitoring can stabilize a transition while also freezing contested governance structures.',
      'Map which commitments are verifiable in days, weeks, and quarters.',
    ],
    limitations:
      'Dayton followed a different military end-state and institutional architecture; its value is the monitoring logic, not the constitutional structure.',
  },
  {
    id: 'south-sudan-r-arcss-2018',
    name: 'South Sudan R-ARCSS',
    era: '2018-2022',
    geography: 'South Sudan',
    summary:
      'Revitalized peace agreement centered on elite commitments, security arrangements, humanitarian access, external pressure, and repeated implementation slippage.',
    whyComparable:
      'Closest pattern for asking whether a public agreement is moving from announcement to verifiable implementation under weak trust and fragmented armed authority.',
    primitiveCounts: { actors: 8, claims: 3, interests: 5, constraints: 4, leverage: 3, commitments: 2, events: 5, narratives: 3 },
    edgeVocabulary: ['party_to', 'contains', 'supports', 'constrains', 'reviews', 'asserts', 'raises_need_for'],
    lessonsForSyria: [
      'Make compliance indicators concrete enough that slippage is visible early.',
      'Separate public optimism from implementation evidence at cantonment, command, access, and protection levels.',
      'Preserve a red-team lane for whether agreement parties are buying time.',
    ],
    limitations:
      'South Sudan lacks Syria-specific regional spillover dynamics and has different state-capacity constraints.',
  },
  {
    id: 'iraq-kurdish-referendum-2017',
    name: 'Iraq Kurdish Referendum Aftermath',
    era: '2017-2019',
    geography: 'Iraq / Kurdistan Region',
    summary:
      'A sovereignty and autonomy confrontation with Baghdad-Erbil bargaining, external pressure, budget and security leverage, and disputed territorial control.',
    whyComparable:
      'Useful for northeast Syria because Kurdish-rights language, central authority, resource leverage, and security sequencing interact directly.',
    primitiveCounts: { actors: 7, claims: 4, interests: 4, constraints: 3, leverage: 4, commitments: 1, events: 4, narratives: 3 },
    edgeVocabulary: ['asserts', 'constrains', 'triggers', 'supports', 'reviews', 'contains'],
    lessonsForSyria: [
      'Watch whether fiscal, border, and security levers quietly decide political autonomy questions.',
      'Compare official unity language against local rights and governance language.',
      'Keep external patrons in the graph even when they are not formal parties.',
    ],
    limitations:
      'Iraq had an established federal constitution and oil-budget bargaining structure that Syria does not currently share.',
  },
  {
    id: 'mozambique-renamo-2014-2019',
    name: 'Mozambique RENAMO Settlement',
    era: '2014-2019',
    geography: 'Mozambique',
    summary:
      'Peace and decentralization track involving opposition armed-group demobilization, political guarantees, local governance, and implementation monitoring.',
    whyComparable:
      'Good analog for transforming armed opposition into political participation while preserving local legitimacy and security guarantees.',
    primitiveCounts: { actors: 7, claims: 3, interests: 4, constraints: 3, leverage: 3, commitments: 2, events: 4, narratives: 2 },
    edgeVocabulary: ['party_to', 'contains', 'supports', 'constrains', 'reviews', 'asserts'],
    lessonsForSyria: [
      'Security integration should be paired with local governance guarantees and a public implementation calendar.',
      'Demobilization language must specify sequencing, livelihoods, and verification.',
      'Local legitimacy signals matter as much as capital-city agreement text.',
    ],
    limitations:
      'Scale, regional complexity, sanctions exposure, and humanitarian need are much greater in Syria.',
  },
  {
    id: 'colombia-farc-2016',
    name: 'Colombia FARC Accord',
    era: '2016-2020',
    geography: 'Colombia',
    summary:
      'Comprehensive settlement linking demobilization, rural reform, political participation, transitional justice, verification, and social trust.',
    whyComparable:
      'Useful for showing how PRAXIS can decompose a large agreement into commitments, evidence requirements, blockers, and public narratives.',
    primitiveCounts: { actors: 8, claims: 3, interests: 4, constraints: 4, leverage: 4, commitments: 2, events: 5, narratives: 3 },
    edgeVocabulary: ['party_to', 'contains', 'supports', 'constrains', 'reviews', 'asserts', 'verifies'],
    lessonsForSyria: [
      'Build a commitment monitor before the first implementation controversy arrives.',
      'Model opposition and community narratives as first-class objects, not as memo footnotes.',
      'Tie reintegration, services, rights, and security guarantees to dated verification events.',
    ],
    limitations:
      'Colombia was not a post-regime-collapse transition and did not share Syria regional-war spillover risk.',
  },
];

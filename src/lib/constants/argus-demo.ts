// ARGUS by TACITUS — Graph-Augmented RAG Intelligence Demo Data

export interface ArgusQuery {
  id: string;
  query: string;
  category: 'graph' | 'entity' | 'parallel';
  response: {
    summary: string;
    confidence: number;
    sources: string[];
    entities: { name: string; type: string; relevance: number }[];
    graphPath: { from: string; relation: string; to: string }[];
  };
}

export interface ArgusDocument {
  id: string;
  title: string;
  type: string;
  extractedEntities: {
    text: string;
    entityType: 'Actor' | 'Claim' | 'Interest' | 'Constraint' | 'Leverage' | 'Commitment' | 'Event' | 'Narrative';
    confidence: number;
    startChar: number;
    endChar: number;
  }[];
  sampleText: string;
}

export const ARGUS_DEMO_QUERIES: ArgusQuery[] = [
  {
    id: 'q1',
    query: 'Show all actors with leverage over the ceasefire',
    category: 'graph',
    response: {
      summary:
        'Three primary actors hold direct leverage over the Nordalia ceasefire: the Government of Nordalia controls military deployment and border access, EMLF leadership holds veto power over combatant disarmament timelines, and the African Union Mission (AUNM) manages the ceasefire monitoring mechanism. Secondary leverage exists through international donors conditioning humanitarian aid on compliance.',
      confidence: 87,
      sources: [
        'UNSC Resolution 2847 (2025)',
        'Nordalia Ceasefire Agreement, Annex III',
        'AUNM Situation Report #42',
        'ICG Briefing: Nordalia at the Crossroads',
      ],
      entities: [
        { name: 'Government of Nordalia', type: 'Actor', relevance: 0.95 },
        { name: 'EMLF', type: 'Actor', relevance: 0.92 },
        { name: 'AUNM', type: 'Actor', relevance: 0.88 },
        { name: 'Ceasefire Agreement', type: 'Commitment', relevance: 0.85 },
        { name: 'Border Access', type: 'Leverage', relevance: 0.78 },
      ],
      graphPath: [
        { from: 'Gov. of Nordalia', relation: 'CONTROLS', to: 'Military Deployment' },
        { from: 'Military Deployment', relation: 'AFFECTS', to: 'Ceasefire Compliance' },
        { from: 'EMLF', relation: 'HOLDS_VETO', to: 'Disarmament Timeline' },
        { from: 'AUNM', relation: 'MONITORS', to: 'Ceasefire Compliance' },
      ],
    },
  },
  {
    id: 'q2',
    query: 'Map narrative clusters in Eastern Marches media',
    category: 'entity',
    response: {
      summary:
        'Eastern Marches media landscape shows three dominant narrative clusters: (1) "Liberation Discourse" framing EMLF as defenders of ethnic Marchian identity, prevalent in Marches Daily and Radio Liberte (62% of sampled coverage); (2) "National Unity" counter-narrative from state-aligned outlets emphasizing territorial integrity (28%); (3) "Humanitarian Crisis" framing from international correspondents focusing on civilian displacement (10%). Cross-pollination between clusters 1 and 3 is increasing.',
      confidence: 79,
      sources: [
        'TACITUS Media Monitoring Report Q4-2025',
        'Marches Daily Archive (Oct-Dec 2025)',
        'Reuters Eastern Marches Bureau dispatches',
        'UN OCHA Media Analysis Brief',
      ],
      entities: [
        { name: 'Liberation Discourse', type: 'Narrative', relevance: 0.94 },
        { name: 'Marches Daily', type: 'Actor', relevance: 0.82 },
        { name: 'Radio Liberte', type: 'Actor', relevance: 0.79 },
        { name: 'National Unity Narrative', type: 'Narrative', relevance: 0.76 },
        { name: 'Civilian Displacement', type: 'Event', relevance: 0.71 },
      ],
      graphPath: [
        { from: 'EMLF', relation: 'PROMOTES', to: 'Liberation Discourse' },
        { from: 'Liberation Discourse', relation: 'AMPLIFIED_BY', to: 'Marches Daily' },
        { from: 'Gov. of Nordalia', relation: 'PROMOTES', to: 'National Unity Narrative' },
        { from: 'National Unity Narrative', relation: 'COUNTERS', to: 'Liberation Discourse' },
      ],
    },
  },
  {
    id: 'q3',
    query: 'Find historical parallels to current escalation',
    category: 'parallel',
    response: {
      summary:
        'The current Nordalia escalation pattern most closely parallels three historical cases: (1) Ethiopia-Eritrea 1998-2000 — border demarcation disputes escalating despite international arbitration (similarity: 0.84); (2) Sri Lanka 2006 ceasefire collapse — spoiler dynamics from hardline factions within the LTTE undermining Norwegian-mediated process (similarity: 0.78); (3) Mozambique 1992-94 — successful de-escalation through inclusive power-sharing that addressed root grievances (similarity: 0.71, as a counter-example pathway).',
      confidence: 82,
      sources: [
        'TACITUS Historical Parallel Engine v2.1',
        'Glasl Escalation Model Database',
        'Uppsala Conflict Data Program',
        'Kriesberg & Dayton, Constructive Conflicts (2017)',
      ],
      entities: [
        { name: 'Ethiopia-Eritrea War', type: 'Event', relevance: 0.84 },
        { name: 'Sri Lanka Civil War', type: 'Event', relevance: 0.78 },
        { name: 'Mozambique Peace Process', type: 'Event', relevance: 0.71 },
        { name: 'Spoiler Dynamics', type: 'Constraint', relevance: 0.68 },
        { name: 'Power-Sharing', type: 'Interest', relevance: 0.65 },
      ],
      graphPath: [
        { from: 'Nordalia Escalation', relation: 'PARALLELS', to: 'Ethiopia-Eritrea 1998' },
        { from: 'Nordalia Escalation', relation: 'PARALLELS', to: 'Sri Lanka 2006' },
        { from: 'Mozambique 1992', relation: 'COUNTER_EXAMPLE', to: 'Nordalia Escalation' },
      ],
    },
  },
  {
    id: 'q4',
    query: 'Trace commitment chains between Government and EMLF',
    category: 'graph',
    response: {
      summary:
        'The Government-EMLF commitment chain spans 14 formal agreements since 2023, with declining compliance rates. The March 2025 ceasefire (Commitment C-7) has 3 active sub-commitments: prisoner exchange (62% complete), humanitarian corridor (operational but restricted), and cantonment of forces (stalled at 15%). Historical pattern shows Government compliance peaks during UNSC review periods and drops in interstitial months. EMLF compliance correlates inversely with hardliner faction influence.',
      confidence: 91,
      sources: [
        'PRAXIS Commitment Tracker',
        'AUNM Compliance Report #18',
        'Nordalia Peace Process Archive',
        'UNMISS Best Practices: Commitment Monitoring',
      ],
      entities: [
        { name: 'March 2025 Ceasefire', type: 'Commitment', relevance: 0.96 },
        { name: 'Prisoner Exchange', type: 'Commitment', relevance: 0.88 },
        { name: 'Humanitarian Corridor', type: 'Commitment', relevance: 0.85 },
        { name: 'Cantonment of Forces', type: 'Commitment', relevance: 0.82 },
        { name: 'Hardliner Faction', type: 'Actor', relevance: 0.74 },
      ],
      graphPath: [
        { from: 'Gov. of Nordalia', relation: 'COMMITTED_TO', to: 'March 2025 Ceasefire' },
        { from: 'EMLF', relation: 'COMMITTED_TO', to: 'March 2025 Ceasefire' },
        { from: 'March 2025 Ceasefire', relation: 'INCLUDES', to: 'Prisoner Exchange' },
        { from: 'March 2025 Ceasefire', relation: 'INCLUDES', to: 'Cantonment of Forces' },
        { from: 'Hardliner Faction', relation: 'BLOCKS', to: 'Cantonment of Forces' },
      ],
    },
  },
  {
    id: 'q5',
    query: 'Identify spoiler risks in the peace process',
    category: 'entity',
    response: {
      summary:
        'Four spoiler risks identified with high confidence: (1) General Korvac\'s "Patriotic Front" faction within the Nordalia military — opposes territorial concessions, controls 3 key border garrisons (risk: critical); (2) EMLF splinter group "Eastern Dawn Brigade" — rejects ceasefire terms, estimated 800 fighters (risk: high); (3) Cross-border arms trafficking via Merovia — supplies both spoiler factions (risk: high); (4) Diaspora funding networks channeling resources to hardliners via Marchian Heritage Foundation (risk: medium). Mitigation requires targeted sanctions and inclusive DDR programming.',
      confidence: 85,
      sources: [
        'UN Panel of Experts Report S/2025/412',
        'TACITUS Spoiler Analysis Module',
        'Small Arms Survey: Nordalia Region 2025',
        'FATF Nordalia Financial Flows Assessment',
      ],
      entities: [
        { name: 'General Korvac', type: 'Actor', relevance: 0.93 },
        { name: 'Patriotic Front', type: 'Actor', relevance: 0.91 },
        { name: 'Eastern Dawn Brigade', type: 'Actor', relevance: 0.87 },
        { name: 'Arms Trafficking', type: 'Constraint', relevance: 0.82 },
        { name: 'Marchian Heritage Foundation', type: 'Actor', relevance: 0.69 },
      ],
      graphPath: [
        { from: 'General Korvac', relation: 'LEADS', to: 'Patriotic Front' },
        { from: 'Patriotic Front', relation: 'OPPOSES', to: 'Territorial Concessions' },
        { from: 'Eastern Dawn Brigade', relation: 'SPLINTER_OF', to: 'EMLF' },
        { from: 'Merovia', relation: 'SUPPLIES_ARMS', to: 'Eastern Dawn Brigade' },
        { from: 'Marchian Heritage Foundation', relation: 'FUNDS', to: 'EMLF Hardliners' },
      ],
    },
  },
];

export const ARGUS_DEMO_DOCUMENTS: ArgusDocument[] = [
  {
    id: 'doc1',
    title: 'UNSC Resolution 2847 — Situation in Nordalia',
    type: 'UN Resolution',
    sampleText:
      'The Security Council, recalling its previous resolutions on the situation in Nordalia, demands that the Government of Nordalia and the Eastern Marches Liberation Front immediately cease all hostilities and comply fully with the terms of the March 2025 ceasefire agreement. The Council further decides to extend the mandate of AUNM for an additional twelve months, authorizing the deployment of up to 8,500 military personnel to monitor compliance and protect civilians in affected areas.',
    extractedEntities: [
      { text: 'Security Council', entityType: 'Actor', confidence: 0.99, startChar: 4, endChar: 20 },
      { text: 'Government of Nordalia', entityType: 'Actor', confidence: 0.97, startChar: 102, endChar: 124 },
      { text: 'Eastern Marches Liberation Front', entityType: 'Actor', confidence: 0.97, startChar: 133, endChar: 165 },
      { text: 'immediately cease all hostilities', entityType: 'Commitment', confidence: 0.92, startChar: 166, endChar: 198 },
      { text: 'March 2025 ceasefire agreement', entityType: 'Commitment', confidence: 0.95, startChar: 237, endChar: 267 },
      { text: 'extend the mandate of AUNM', entityType: 'Event', confidence: 0.88, startChar: 298, endChar: 324 },
      { text: 'protect civilians', entityType: 'Interest', confidence: 0.85, startChar: 419, endChar: 436 },
    ],
  },
  {
    id: 'doc2',
    title: 'OCHA Situation Report — Eastern Marches Humanitarian Crisis',
    type: 'Humanitarian Report',
    sampleText:
      'An estimated 340,000 persons have been displaced since the resumption of hostilities in September 2025, with 78,000 seeking refuge across the Merovian border. Access constraints imposed by the Nordalia Armed Forces continue to impede humanitarian operations in three key corridors. EMLF-controlled areas report acute food insecurity affecting approximately 120,000 civilians, with malnutrition rates among children under five reaching emergency thresholds in Marchville and Eastport districts.',
    extractedEntities: [
      { text: '340,000 persons have been displaced', entityType: 'Event', confidence: 0.94, startChar: 13, endChar: 48 },
      { text: 'Merovian border', entityType: 'Constraint', confidence: 0.82, startChar: 121, endChar: 136 },
      { text: 'Access constraints imposed by the Nordalia Armed Forces', entityType: 'Constraint', confidence: 0.91, startChar: 138, endChar: 192 },
      { text: 'humanitarian operations', entityType: 'Interest', confidence: 0.87, startChar: 214, endChar: 237 },
      { text: 'EMLF-controlled areas', entityType: 'Actor', confidence: 0.85, startChar: 263, endChar: 284 },
      { text: 'acute food insecurity', entityType: 'Event', confidence: 0.89, startChar: 292, endChar: 313 },
    ],
  },
  {
    id: 'doc3',
    title: 'ICG Briefing — Nordalia: Preventing a Return to War',
    type: 'Policy Brief',
    sampleText:
      'The fragile ceasefire risks collapse unless both parties demonstrate genuine commitment to the political process. President Mabara faces pressure from military hardliners who view territorial concessions as an existential threat to national sovereignty. The EMLF leadership, while publicly committed to negotiations, has failed to discipline splinter factions operating outside the ceasefire framework. International mediators should prioritize confidence-building measures, including accelerated prisoner exchanges and joint verification of cantonment sites.',
    extractedEntities: [
      { text: 'fragile ceasefire risks collapse', entityType: 'Event', confidence: 0.88, startChar: 4, endChar: 36 },
      { text: 'genuine commitment to the political process', entityType: 'Interest', confidence: 0.84, startChar: 65, endChar: 109 },
      { text: 'President Mabara', entityType: 'Actor', confidence: 0.96, startChar: 111, endChar: 127 },
      { text: 'military hardliners', entityType: 'Actor', confidence: 0.90, startChar: 152, endChar: 171 },
      { text: 'territorial concessions as an existential threat', entityType: 'Claim', confidence: 0.86, startChar: 181, endChar: 229 },
      { text: 'EMLF leadership', entityType: 'Actor', confidence: 0.94, startChar: 258, endChar: 273 },
      { text: 'confidence-building measures', entityType: 'Leverage', confidence: 0.81, startChar: 420, endChar: 448 },
    ],
  },
];

export const ARGUS_CROSS_CASE_MATRIX: Record<
  string,
  { nordalia: string; ethiopia: string; sudan: string; confidence: number }[]
> = {
  'Escalation Pattern': [
    {
      nordalia: 'Gradual military buildup along ceasefire line with periodic provocations (Glasl Stage 5-6)',
      ethiopia: 'Rapid escalation from political crisis to full-scale military offensive within 3 weeks',
      sudan: 'Decentralized militia-driven escalation with multiple simultaneous flashpoints',
      confidence: 84,
    },
  ],
  'Actor Archetype': [
    {
      nordalia: 'State vs. ethno-nationalist liberation movement with moderate diaspora influence',
      ethiopia: 'Federal government vs. regional state with strong institutional capacity on both sides',
      sudan: 'Competing military factions (SAF vs. RSF) with shifting civilian alliance patterns',
      confidence: 79,
    },
  ],
  'Leverage Type': [
    {
      nordalia: 'International sanctions + humanitarian aid conditionality + AU peacekeeping presence',
      ethiopia: 'US/EU diplomatic pressure + AU mediation + trade route dependencies',
      sudan: 'Regional actor influence (Egypt, UAE, Saudi) + arms embargo enforcement gaps',
      confidence: 76,
    },
  ],
  'Resolution Pathway': [
    {
      nordalia: 'Inclusive political dialogue with phased autonomy framework — 45% probability of success',
      ethiopia: 'Pretoria Agreement model with transitional justice — implementation at 60%',
      sudan: 'Ceasefire-first approach with parallel civilian governance track — currently stalled',
      confidence: 71,
    },
  ],
  'Historical Parallel': [
    {
      nordalia: 'Mozambique (RENAMO) 1992 + Northern Ireland (GFA) 1998 — power-sharing models',
      ethiopia: 'Ethiopia-Eritrea 2000 (Algiers Agreement) + Colombia (FARC) 2016',
      sudan: 'Libya post-2011 fragmentation + Yemen multi-party civil war dynamics',
      confidence: 68,
    },
  ],
};

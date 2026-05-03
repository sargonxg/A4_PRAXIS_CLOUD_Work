import type { AnalystProfile } from '@/types/analyst-profile';
import { SYRIA_CHAPTER_FLOW } from '@/lib/syria/chapter-flow';

export { SYRIA_CHAPTER_FLOW };

export const SYRIA_DEMO_ANALYST_PROFILE: AnalystProfile = {
  identity: {
    role: 'un_official',
    seniority: 'senior',
    org: 'TACITUS Demo Organization',
    team: 'Syria Transition Case Cell',
  },
  perspective: {
    mandate:
      'Prepare source-grounded decision support for senior leadership on Syria transition risk, humanitarian access, rights-protective implementation, and regional spillover.',
    lenses: ['diplomatic', 'security', 'humanitarian', 'legal_ihl', 'mediation'],
    regions: ['Syrian Arab Republic', 'Northeast Syria', 'Aleppo', 'Sweida', 'Middle East regional theater'],
    audience: 'senior_leadership',
    primaryDomain: 'armed-conflict-security',
    secondaryDomains: ['diplomacy-negotiation', 'humanitarian', 'governance-rule-of-law'],
  },
  workingStyle: {
    sourceCategories: ['un-official', 'humanitarian', 'conflict-data', 'local-media', 'think-tank'],
    language: 'en',
    redLines: [
      'Do not imply classified access or live intelligence collection.',
      'Separate observed reporting from PRAXIS assessment.',
      'Do not treat the January agreement as implemented until rights and governance benchmarks are verified.',
      'Keep humanitarian access, returns, and protection indicators in the same decision frame as political implementation.',
    ],
    analyticalStyle: 'rapid_brief',
  },
  meta: {
    version: 1,
    completedAt: '2026-05-02T09:00:00.000Z',
    lastEditedAt: '2026-05-02T09:00:00.000Z',
    skipCount: 0,
    createdAt: '2026-05-02T09:00:00.000Z',
    deletedAt: null,
  },
};

export const SYRIA_DEMO_PREFERENCES = {
  sourceMode: 'Public-source first, UN and humanitarian receipts prioritized',
  defaultFramework: 'ACO v2.0 graph + ICD-203 discipline + INFORM-style risk decomposition',
  outputStyle: 'Leadership-ready, fact/assessment/gap separated, red-team dissent preserved',
  trustedSources: ['UN Geneva', 'OCHA', 'UN Syria CCA', 'UNFPA', 'UNHCR', 'ReliefWeb', 'UCDP/GDELT when available'],
  avoidedPatterns: ['unsourced social posts', 'single-source tactical claims', 'stale pre-transition explainers'],
  toolOverrides: [
    'Source Scout: reliability tiers and retrieval trace visible',
    'GraphOps: provenance and temporal anchors required before graph claims are trusted',
    'Policy Memo: options must include implementation triggers and evidence limits',
    'Briefing: BLUF, graph readout, risk board, action asks, and collection gaps',
  ],
};

export const SYRIA_SITUATION_CONTEXT_CARDS = [
  {
    label: 'Decision center',
    value: '30 Jan agreement',
    detail: 'Damascus-SDF ceasefire and integration track is the main stabilizing opportunity.',
  },
  {
    label: 'Breakpoints',
    value: '4 trigger lanes',
    detail: 'Humanitarian access, rights implementation, southern flashpoints, regional spillover.',
  },
  {
    label: 'Evidence posture',
    value: 'Public-source',
    detail: 'UN and humanitarian receipts are strong; local implementation details remain thinner.',
  },
  {
    label: 'Next product',
    value: 'Principal brief',
    detail: 'Separate facts, PRAXIS assessment, assumptions, and collection gaps.',
  },
];

export const SYRIA_DOCUMENT_REVIEW_CHECKLIST = [
  'Every recommendation has a source basis or explicit assumption label.',
  'Humanitarian, political, legal, and security effects are not collapsed into one generic risk.',
  'The memo preserves a red-team objection and a next collection task.',
  'The document can be exported to DOCX and edited in LibreOffice or Word.',
];

export const SYRIA_LOCAL_MEDIA_SOURCES = [
  {
    name: 'Enab Baladi',
    url: 'https://en.enabbaladi.org/',
    type: 'independent_local',
    sourceType: 'local',
    language: 'Arabic / English',
    geography: 'Syria, diaspora newsroom, local reporting network',
    reliability: 78,
    orientationScore: -0.18,
    proximity: 88,
    access: 'Syrian-origin outlet with public reporting, investigations, polling, and local civil society coverage.',
    posture: 'Independent Syrian media; strong for local governance, rights, and social impact angles.',
    risks: 'Needs triangulation on fast tactical claims and areas where access is uneven.',
    useCase: 'Use for local implementation signals, returns, rights claims, public-service delivery, and narrative shifts among Syrian civil society.',
  },
  {
    name: 'Syria Direct',
    url: 'https://syriadirect.org/',
    type: 'independent_nonprofit',
    sourceType: 'diaspora',
    language: 'English / Arabic',
    geography: 'Syria and Syrian diaspora',
    reliability: 82,
    orientationScore: -0.12,
    proximity: 74,
    access: 'Independent nonprofit media and training organization producing original reporting, investigations, and multimedia coverage.',
    posture: 'Useful bridge for policymakers who need accountable Syria coverage in English.',
    risks: 'Long-form cadence means it is less useful as a same-hour alert source.',
    useCase: 'Use for explainers, interviews, accountability reporting, and diaspora-facing policy context.',
  },
  {
    name: 'North Press Agency',
    url: 'https://npasyria.com/en/',
    type: 'regional_local',
    sourceType: 'local',
    language: 'Arabic / English / Kurdish',
    geography: 'Northeast Syria and wider Syrian theater',
    reliability: 70,
    orientationScore: -0.05,
    proximity: 92,
    access: 'Regional outlet with frequent northeast Syria coverage and local field proximity.',
    posture: 'Strong for SDF-administered areas, crossings, local security, services, and Kurdish rights coverage.',
    risks: 'Needs balancing with Damascus, UN, humanitarian, and civil society sources for politically sensitive claims.',
    useCase: 'Use for northeast implementation, local security incidents, border dynamics, and community-level stress indicators.',
  },
  {
    name: 'The Syria Report',
    url: 'https://syria-report.com/',
    type: 'economic_specialist',
    sourceType: 'economic',
    language: 'English',
    geography: 'Syria economy, business, public finance, HLP',
    reliability: 86,
    orientationScore: 0.02,
    proximity: 62,
    access: 'Specialist economic and political-economy publication with databases, business profiles, statistics, and HLP reporting.',
    posture: 'Best for sanctions, reconstruction, banking, business elites, housing-land-property, and recovery constraints.',
    risks: 'Some content is subscription-based; tactical security coverage is outside its core lane.',
    useCase: 'Use for reconstruction feasibility, HLP risk, procurement, sanctions, and recovery-market assumptions.',
  },
  {
    name: 'SyriaUntold',
    url: 'https://syriauntold.com/',
    type: 'independent_civic',
    sourceType: 'diaspora',
    language: 'Arabic / English',
    geography: 'Syria, diaspora, marginalized voices',
    reliability: 74,
    orientationScore: -0.22,
    proximity: 66,
    access: 'Independent nonprofit storytelling outlet focused on Syrian stories and voices pushed to the margins.',
    posture: 'High value for social texture, memory, identity, rights, civil society, and minority/community narratives.',
    risks: 'Not designed as a breaking-news wire; use it to enrich context rather than verify urgent events alone.',
    useCase: 'Use for social cohesion, local legitimacy, minority rights, trauma, and community trust analysis.',
  },
  {
    name: 'The Syrian Observer',
    url: 'https://syrianobserver.com/',
    type: 'translation_digest',
    sourceType: 'monitoring',
    language: 'English',
    geography: 'Syrian media ecosystem',
    reliability: 72,
    orientationScore: -0.04,
    proximity: 54,
    access: 'Daily English service translating and comparing Syrian state, opposition, activist, and civil-society narratives.',
    posture: 'Very useful for narrative divergence because it intentionally exposes different Syrian media frames.',
    risks: 'It says it does not fully verify every translated story; treat as a map of discourse, not final fact validation.',
    useCase: 'Use to compare official, opposition, activist, and civil-society framings before asking PRAXIS for synthesis.',
  },
  {
    name: 'SANA',
    url: 'https://sana.sy/en/',
    type: 'state',
    sourceType: 'state',
    language: 'Arabic / English',
    geography: 'Damascus and official Syrian institutions',
    reliability: 42,
    orientationScore: 0.42,
    proximity: 80,
    access: 'Official Syrian Arab News Agency; useful for government statements and declared policy positions.',
    posture: 'Treat as primary-source official messaging, not as independent verification.',
    risks: 'High framing risk; cross-check claims with UN, humanitarian, local, and independent reporting.',
    useCase: 'Use for declared policy, official appointments, state narratives, and language shifts in Damascus messaging.',
  },
  {
    name: 'SOHR',
    url: 'https://www.syriahr.com/en/',
    type: 'monitoring_network',
    sourceType: 'monitoring',
    language: 'Arabic / English',
    geography: 'Syria conflict monitoring network',
    reliability: 68,
    orientationScore: -0.08,
    proximity: 70,
    access: 'Human-rights monitoring outlet focused on violations, casualties, and conflict developments.',
    posture: 'Useful alerting and monitoring input that requires corroboration for high-impact claims.',
    risks: 'Source network and attribution debates make provenance review essential.',
    useCase: 'Use as an early-warning signal, then require triangulation before any principal-level claim.',
  },
];

export const SYRIA_MEDIA_VISUAL_METRICS = [
  { label: 'Local proximity', score: 82, detail: 'Syrian-origin and northeast outlets are included beside wires and UN receipts.' },
  { label: 'Source diversity', score: 88, detail: 'State, independent, economic, monitoring, diaspora, and international sources are separated.' },
  { label: 'Reliability floor', score: 74, detail: 'High-risk claims require UN, humanitarian, or two independent local confirmations.' },
  { label: 'Narrative divergence', score: 67, detail: 'Official, Kurdish-rights, humanitarian, and regional-security frames are intentionally compared.' },
  { label: 'Cost discipline', score: 91, detail: 'Seeded case data renders without live cloud calls; live AI runs only when the user generates.' },
];

export const SYRIA_MEDIA_NARRATIVE_LANES = [
  {
    lane: 'Northeast integration',
    localSignals: 'North Press and local civil society watch whether security integration and Kurdish-rights language become practice.',
    globalSignals: 'Wires and diplomatic reporting focus on ceasefire durability and senior-level negotiation status.',
    risk: 76,
    gap: 'Need district-level implementation evidence, not only leader statements.',
  },
  {
    lane: 'Humanitarian access',
    localSignals: 'Local outlets surface service delivery, displacement pressure, checkpoint friction, and returnee concerns.',
    globalSignals: 'UN and ReliefWeb receipts define the funding, access, and protection baseline.',
    risk: 81,
    gap: 'Need sustained monitoring of crossings, winterization, health capacity, and aid diversion allegations.',
  },
  {
    lane: 'Rights and minority protection',
    localSignals: 'SyriaUntold, Enab Baladi, SOHR, and civil-society reporting capture trust, abuse claims, and community fear.',
    globalSignals: 'UN rights and diplomatic channels frame this as legitimacy and transition credibility.',
    risk: 73,
    gap: 'Need corroborated local reporting in coastal, southern, and mixed-control areas.',
  },
  {
    lane: 'Economic recovery and HLP',
    localSignals: 'The Syria Report and local media track banking, property rights, prices, procurement, and reconstruction incentives.',
    globalSignals: 'IFIs, donors, and sanctions reporting shape feasibility and political-economy risk.',
    risk: 69,
    gap: 'Need project-level ownership, procurement, and beneficiary evidence before recovery claims are briefed.',
  },
  {
    lane: 'Regional spillover',
    localSignals: 'Syrian and regional outlets expose border pressure, Israeli/Turkish/Gulf signaling, and displacement corridors.',
    globalSignals: 'Diplomatic and wire coverage emphasizes state-to-state de-escalation and external-actor leverage.',
    risk: 84,
    gap: 'Need timeline-anchored actor intent and incident data to avoid narrative overfit.',
  },
];

export const SYRIA_MEDIA_ROUNDUP_DEMO = {
  generatedAt: '2026-05-03T09:00:00.000-04:00',
  headline: 'Syria media watch: transition opportunity with high implementation and narrative-fragmentation risk',
  brief:
    'PRAXIS separates official statements, local Syrian reporting, humanitarian receipts, and monitoring alerts so analysts can see where the Syria story is converging and where it is still contested.',
  highlights: [
    'Official and diplomatic narratives emphasize transition stability and the January northeast agreement.',
    'Local Syrian outlets add ground texture: services, returns, rights implementation, checkpoints, and community trust.',
    'Humanitarian sources keep access, displacement, health capacity, and funding gaps in the same decision frame as politics.',
    'Economic specialist reporting flags sanctions, HLP, procurement, banking, and reconstruction credibility as leadership risks.',
    'Monitoring sources are useful for early warning but require cross-checking before principal-level claims.',
  ],
  watchItems: [
    'Any public timeline for SDF integration, command arrangements, and rights guarantees.',
    'Aid-access changes in northeast Syria, Aleppo corridors, coastal communities, and southern flashpoints.',
    'Official-media language shifts around pluralism, decentralization, Kurdish rights, and minority protection.',
    'Reports of returnee pressure, property seizures, retaliation, or local security-force abuse.',
    'Regional messaging from Turkey, Israel, Gulf states, Iran-linked networks, and US/EU diplomatic channels.',
  ],
};

export const SYRIA_CURRENT_RESEARCH_SOURCES = [
  {
    name: 'UN Security Council / UN Geneva',
    title: 'Security Council live coverage: regional war threatens Syria fragile transition',
    url: 'https://www.ungeneva.org/en/news-media/news/2026/04/117901/security-council-live-regional-war-threatens-syrias-fragile',
    date: '2026-04-22',
    type: 'un-briefing',
    track: 'political-humanitarian',
    extraction: 'Use for newest UN political/humanitarian framing, regional-spillover language, and Council meeting chronology.',
    graphUse: 'Event node: 22 Apr Council briefing; edges to regional spillover, transition support, humanitarian access, and UN role.',
  },
  {
    name: 'Security Council Report',
    title: 'Syria, May 2026 Monthly Forecast',
    url: 'https://www.securitycouncilreport.org/monthly-forecast/2026-05/syria-91.php',
    date: '2026-05-01',
    type: 'council-forecast',
    track: 'diplomatic-calendar',
    extraction: 'Use for expected Council agenda, negotiating dynamics, sanctions/delisting context, and EU-Syria engagement signals.',
    graphUse: 'Calendar node: May Syria meeting; edges to Council members, EU engagement, sanctions posture, HNRP launch, and transition support.',
  },
  {
    name: 'Brookings',
    title: 'Shaping the new Syria',
    url: 'https://www.brookings.edu/articles/shaping-the-new-syria/',
    date: '2026-02-10',
    type: 'think-tank',
    track: 'security-sector-reform',
    extraction: 'Use for policy option framing around sanctions relief, investment, professional security-sector reform, and reconstruction support.',
    graphUse: 'Claim nodes: SSR program, investment sequencing, reconstruction support; edges to US/EU leverage and transition capacity.',
  },
  {
    name: 'ECFR',
    title: 'A year after Assad: The search for Syria future',
    url: 'https://ecfr.eu/article/a-year-after-assad-the-search-for-syrias-future/',
    date: '2026-02-25',
    type: 'think-tank',
    track: 'european-engagement',
    extraction: 'Use for European engagement, civil-society consultation, SDF integration, command/control, and inclusive political/economic vision.',
    graphUse: 'Claim nodes: SDF integration trajectory, EU role, institutional inclusion; edges to confidence benchmarks and local legitimacy.',
  },
  {
    name: 'Carnegie Europe',
    title: 'Can Europe Still Matter in Syria?',
    url: 'https://carnegieendowment.org/europe/strategic-europe/2026/02/can-europe-still-matter-in-syria',
    date: '2026-02-17',
    type: 'think-tank',
    track: 'european-leverage-hlp',
    extraction: 'Use for property registries, legal aid, returnee protection, reconstruction budget, and EU leverage.',
    graphUse: 'Policy-option nodes: HLP registry, legal aid, returnee protection; edges to returns, reconstruction, and EU funding.',
  },
  {
    name: 'Atlantic Council',
    title: 'Why Syria government must turn inward in 2026',
    url: 'https://www.atlanticcouncil.org/region/syria',
    date: '2026-01-29',
    type: 'think-tank',
    track: 'domestic-reform',
    extraction: 'Use for domestic reform, economic development, constitutional process, and security reform debate.',
    graphUse: 'Claim nodes: domestic reform priority, constitution, security reform; edges to legitimacy and investor confidence.',
  },
  {
    name: 'Human Rights Watch',
    title: 'World Report 2026: Syria',
    url: 'https://www.hrw.org/world-report/2026/country-chapters/syria',
    date: '2026',
    type: 'rights-report',
    track: 'rights-protection',
    extraction: 'Use for identity-based violence, explosive remnants, accountability, sanctions relief, and rights-protection risk.',
    graphUse: 'Risk nodes: minority protection, explosive remnants, accountability gaps; edges to returns, security legitimacy, and donor risk.',
  },
  {
    name: 'UNFPA Syria',
    title: 'Aleppo and North-East Syria Situation Report',
    url: 'https://syria.unfpa.org/en/publications/situation-report-aleppo-and-north-east-syria-6-january-node2-february-2entity26',
    date: '2026-02-12',
    type: 'humanitarian-sitrep',
    track: 'displacement-protection',
    extraction: 'Use for displacement scale, women/children protection, governorate scope, and humanitarian response needs.',
    graphUse: 'Event/risk nodes: Aleppo/northeast displacement; edges to protection services, humanitarian access, and returns.',
  },
];

export const SYRIA_DISCREPANCY_WORKFLOWS = [
  {
    question: 'Is the SDF integration track improving or merely announced?',
    compare: ['UN language: potentially transformative but fragile', 'ECFR: initial stages unfolding better than expected', 'Local media: district-level implementation still uneven'],
    graphLens: 'commitment_implementation',
    output: 'Briefing caveat: treat progress as conditional until rights, command, and service-delivery benchmarks are evidenced.',
  },
  {
    question: 'Do official statements and local reporting use the same language for Kurdish rights?',
    compare: ['SANA / official: unity, sovereignty, territorial integrity', 'Local/civil reporting: education, governance, language, security guarantees', 'Think tanks: inclusion must be institutionalized'],
    graphLens: 'statement_wording_diff',
    output: 'Discrepancy table with exact phrasing deltas and a recommended diplomatic formulation.',
  },
  {
    question: 'Does reconstruction optimism account for HLP and protection constraints?',
    compare: ['Brookings / Atlantic Council: investment and reconstruction opportunity', 'Carnegie: registries, legal aid, returnee protection needed', 'HRW / local sources: rights and safety risks remain material'],
    graphLens: 'economic_recovery_constraints',
    output: 'Economic-impact scenario that links funding/investment to HLP, returns, sanctions, and procurement risk nodes.',
  },
  {
    question: 'Are humanitarian access updates changing faster than diplomatic reporting?',
    compare: ['UN/OCHA/UNFPA sitreps: operational displacement and access indicators', 'Council forecasts: diplomatic calendar and political framing', 'Local reporting: checkpoint friction and service pressure'],
    graphLens: 'temporal_lag_detection',
    output: 'Temporal warning board showing which indicators need live search before the next principal brief.',
  },
];

export const SYRIA_COMMITMENT_MONITOR_DEMO = [
  {
    commitment: '30 January Damascus-SDF ceasefire and integration agreement',
    parties: ['Syrian transitional authorities', 'SDF / northeast authorities'],
    source: 'UN Geneva Security Council briefing, 13 Feb 2026',
    status: 'monitoring',
    evidenceNeeded: ['joint implementation mechanism', 'rights language', 'security command sequencing', 'return and access guarantees'],
    graphQuery: 'commitment:jan30-integration -> edges(type=contains|requires|constrains) -> rights, returns, access, detention-facility-security',
    nextAction: 'Run commitment monitor weekly; generate compliance deltas and new graph edges from official/local source changes.',
  },
  {
    commitment: 'EU-Syria cooperation and economic-security engagement track',
    parties: ['European Union', 'Syrian transitional authorities'],
    source: 'Security Council Report May 2026 forecast and public EU reporting',
    status: 'watching-language',
    evidenceNeeded: ['formal cooperation text', 'economic sectors', 'security cooperation scope', 'rights conditionality'],
    graphQuery: 'actor:EU -> leverage:economic_support -> constraints:rights/HLP/sanctions -> outcome:recovery',
    nextAction: 'Extract exact statement wording, compare with prior EU language, and flag changes in conditionality.',
  },
  {
    commitment: '2026 Humanitarian Needs and Response Plan support',
    parties: ['UN / OCHA', 'donors', 'Syrian authorities'],
    source: 'May 2026 Council forecast; UN/OCHA public planning references',
    status: 'funding-risk',
    evidenceNeeded: ['appeal amount', 'sector coverage', 'access commitments', 'funding gap', 'field implementation data'],
    graphQuery: 'plan:HNRP2026 -> sector needs -> funding gaps -> protection/access outcomes',
    nextAction: 'Bind funding-gap changes to briefing risk score and trigger donor-facing asks.',
  },
];

export const SYRIA_ONTOLOGY_REASONING_TRACKS = [
  {
    track: 'Northeast integration',
    graphNodes: ['commitment', 'actor', 'claim', 'rights_guarantee', 'security_sequence', 'implementation_event'],
    edgeFocus: ['party_to', 'contains', 'requires', 'constrains', 'verifies', 'contradicts'],
    policyQuestion: 'What evidence would prove the January agreement is becoming rights-protective implementation?',
    tools: ['Source Scout', 'Commitment Monitor', 'GraphOps', 'Conflict Graph', 'Policy Memo'],
  },
  {
    track: 'Humanitarian access and returns',
    graphNodes: ['event', 'population', 'need', 'access_constraint', 'service_capacity', 'funding_gap'],
    edgeFocus: ['displaces', 'requires', 'blocks', 'funds', 'enables', 'worsens'],
    policyQuestion: 'Which access, return, protection, and funding indicators should change the briefing line?',
    tools: ['Context Builder', 'Media Roundup', 'Humanitarian', 'Briefing Studio'],
  },
  {
    track: 'Economic recovery and HLP',
    graphNodes: ['policy_option', 'constraint', 'leverage', 'institution', 'property_claim', 'investment_signal'],
    edgeFocus: ['depends_on', 'risks', 'finances', 'legitimizes', 'requires_due_diligence'],
    policyQuestion: 'Where do reconstruction narratives overrun property, procurement, sanctions, and returnee-protection evidence?',
    tools: ['Economic Impact', 'Scenario Builder', 'Documents', 'Source Scout'],
  },
  {
    track: 'Statement and think-tank discrepancy',
    graphNodes: ['statement', 'claim', 'frame', 'actor_position', 'citation', 'confidence_note'],
    edgeFocus: ['asserts', 'softens', 'hardens', 'omits', 'conflicts_with', 'corroborates'],
    policyQuestion: 'Which wording differences across UN, local media, official, and think-tank production matter diplomatically?',
    tools: ['Media Compass', 'Media Roundup', 'Ask PRAXIS', 'Policy Memo'],
  },
];

export const SYRIA_NEUROSYMBOLIC_RESEARCH_BASE = [
  {
    title: 'Microsoft GraphRAG: local-to-global sensemaking',
    source: 'Microsoft Research',
    year: '2024',
    url: 'https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/',
    finding:
      'GraphRAG builds entity graphs and community summaries so an LLM can answer broad sensemaking questions across large document collections, not only retrieve isolated chunks.',
    praxisUse:
      'PRAXIS uses the same pattern for policy questions like "what changed in Syria this week?" by clustering actors, commitments, narratives, risks, and evidence communities before drafting.',
  },
  {
    title: 'Graph Retrieval-Augmented Generation survey',
    source: 'arXiv 2408.08921',
    year: '2024',
    url: 'https://arxiv.org/abs/2408.08921',
    finding:
      'GraphRAG formalizes graph-based indexing, graph-guided retrieval, and graph-enhanced generation to improve relational and context-aware answers.',
    praxisUse:
      'This maps directly to the PRAXIS pipeline: ingest sources, create typed edges, retrieve by policy track, then generate with provenance and gaps attached.',
  },
  {
    title: 'GraphRAG for customized domain LLMs',
    source: 'arXiv 2501.13958',
    year: '2025',
    url: 'https://arxiv.org/abs/2501.13958',
    finding:
      'Domain-specific GraphRAG addresses complex query understanding, distributed knowledge integration, and scale bottlenecks using graph-structured domain hierarchies.',
    praxisUse:
      'Conflict policy is exactly this kind of domain: the system needs hierarchy, source discipline, temporal context, and multi-hop reasoning across actors, events, and commitments.',
  },
  {
    title: 'Neuro-symbolic AI for LLM reasoning',
    source: 'IJCAI 2025 survey',
    year: '2025',
    url: 'https://www.ijcai.org/proceedings/2025/1195',
    finding:
      'Neuro-symbolic methods combine LLMs with symbolic structures from three directions: symbols guiding LLMs, LLMs producing symbolic artifacts, and hybrid LLM-plus-symbolic reasoning.',
    praxisUse:
      'Dialectica is this hybrid layer: LLMs read messy language, graphs hold durable structure, and rules check contradiction, omission, temporal drift, and source confidence.',
  },
  {
    title: 'Unifying large language models and knowledge graphs',
    source: 'IEEE TKDE roadmap / arXiv',
    year: '2024',
    url: 'https://arxiv.org/abs/2306.08302',
    finding:
      'LLMs and KGs are complementary: KGs improve factual inference and interpretability, while LLMs help construct, complete, and query evolving graphs.',
    praxisUse:
      'PRAXIS can let agents extract candidate graph facts from UN documents and media, then route those facts through GraphOps review before they become reusable institutional memory.',
  },
  {
    title: 'Ontologies for explanations in neuro-symbolic AI',
    source: 'Neurosymbolic Artificial Intelligence journal',
    year: '2025',
    url: 'https://journals.sagepub.com/doi/10.3233/NAI-240754',
    finding:
      'Ontologies and knowledge graphs support human-understandable explanations, consistency checks, abstraction, refinement, and repair of hallucination-prone model output.',
    praxisUse:
      'This is the reason PRAXIS shows why an answer is supported: the graph can expose source basis, missing evidence, contradictory wording, and the policy ontology behind the conclusion.',
  },
];

export const SYRIA_NEUROSYMBOLIC_POLICY_PAYOFFS = [
  {
    label: 'Grounded sensemaking',
    problem: 'Analysts are buried in UN records, local media, think-tank articles, and official statements.',
    capability:
      'Graph communities summarize the Syria file by actor, geography, commitment, and narrative so the LLM drafts from structured context instead of a flat search dump.',
  },
  {
    label: 'Discrepancy detection',
    problem: 'Diplomatic meaning often changes through small wording shifts, omissions, dates, and qualifier language.',
    capability:
      'Symbolic statement nodes preserve exact claims, dates, speakers, citations, modality, and confidence, then LLMs explain why the difference matters.',
  },
  {
    label: 'Commitment monitoring',
    problem: 'Agreements and communiques are easy to announce and hard to verify.',
    capability:
      'Commitment nodes are decomposed into parties, obligations, evidence requirements, implementation events, blockers, and compliance deltas.',
  },
  {
    label: 'Scenario simulation',
    problem: 'Policy options fail when models ignore constraints across humanitarian, legal, security, and economic tracks.',
    capability:
      'Typed graph edges let PRAXIS run multi-hop "if this changes, what else moves?" reasoning before the LLM writes scenario narratives.',
  },
  {
    label: 'Explainable drafting',
    problem: 'A polished memo is not useful if leadership cannot audit why it says what it says.',
    capability:
      'Each recommendation can carry source receipts, graph paths, dissent notes, assumptions, and gaps into the memo or briefing.',
  },
  {
    label: 'Cost-aware live AI',
    problem: 'Always-on cloud agents can become expensive and noisy.',
    capability:
      'Seeded graph state renders locally; live agents refresh only targeted gaps, propose bounded graph updates, and avoid re-processing the whole corpus.',
  },
];

export const SYRIA_LIVE_RESEARCH_MODES = [
  {
    mode: 'Latest-source sweep',
    prompt:
      'Find the latest UN, humanitarian, local Syrian, and think-tank sources on Syria northeast integration and regional spillover. Separate facts, claims, and gaps.',
    sources: ['UN Geneva', 'Security Council Report', 'ReliefWeb/OCHA', 'local Syrian media', 'think tanks'],
    graphWrites: ['event', 'source_receipt', 'claim', 'actor_position', 'confidence_note'],
    output:
      'A dated source pack with reliability tiers, checkable URLs, what changed, what is still thin, and graph update candidates.',
  },
  {
    mode: 'Think-tank discrepancy review',
    prompt:
      'Compare Brookings, ECFR, Carnegie, Atlantic Council, HRW, and local Syrian reporting on Syria recovery, rights, and SDF integration. Identify substantive disagreements and exact wording differences.',
    sources: ['Brookings', 'ECFR', 'Carnegie Europe', 'Atlantic Council', 'HRW', 'Syrian local media'],
    graphWrites: ['statement', 'claim', 'frame', 'contradiction', 'omission'],
    output:
      'A discrepancy matrix showing aligned claims, contested claims, hidden assumptions, missing evidence, and wording that matters diplomatically.',
  },
  {
    mode: 'Commitment and communique monitor',
    prompt:
      'Extract commitments from Syria-related agreements, communiques, UN briefings, and Arab/European statements, then evaluate what evidence would show compliance or non-compliance.',
    sources: ['official statements', 'UN briefings', 'EU/Arab communiques', 'local implementation reporting'],
    graphWrites: ['commitment', 'obligation', 'party_to', 'implementation_event', 'blocker'],
    output:
      'A compliance board with parties, obligations, evidence needed, implementation signals, open questions, and next monitoring searches.',
  },
  {
    mode: 'Local media and narrative divergence',
    prompt:
      'Search Syrian local, diaspora, state, monitoring, and economic sources for divergence on humanitarian access, Kurdish rights, HLP, security integration, and regional spillover.',
    sources: ['Enab Baladi', 'Syria Direct', 'North Press', 'Syria Report', 'SyriaUntold', 'SANA', 'SOHR'],
    graphWrites: ['narrative', 'source_posture', 'local_signal', 'frame', 'temporal_signal'],
    output:
      'A media compass update with source posture, local proximity, framing deltas, reliability notes, and briefing implications.',
  },
  {
    mode: 'Graph-grounded policy question',
    prompt:
      'Use the Syria graph first, then live search only the missing edges: is the January agreement still the stabilizing center of gravity, and which triggers should change the policy line?',
    sources: ['Firestore graph', 'saved documents', 'source receipts', 'targeted live search'],
    graphWrites: ['risk_trigger', 'edge_confidence', 'source_gap', 'scenario_driver'],
    output:
      'A graph-path answer with evidence trails, uncertainty, contradiction checks, trigger board, and recommended briefing language.',
  },
  {
    mode: 'Economic and HLP scenario research',
    prompt:
      'Research Syria recovery, sanctions relief, HLP/property risk, procurement, banking, and donor constraints, then generate three plausible policy scenarios.',
    sources: ['The Syria Report', 'Carnegie', 'World Bank/IMF where available', 'donor statements', 'rights reports'],
    graphWrites: ['constraint', 'policy_option', 'property_claim', 'funding_gap', 'investment_signal'],
    output:
      'A scenario table linking recovery optimism to legal, humanitarian, financing, and property-rights constraints.',
  },
];

export const SYRIA_STRUCTURED_RESEARCH_RESPONSE_CONTRACT = [
  {
    section: '1. Question and scope',
    requirement: 'Restate the precise policy question, geography, time window, source languages, and decision audience.',
  },
  {
    section: '2. Source receipts',
    requirement: 'List checkable sources with URL, date, source class, reliability tier, and why each source matters.',
  },
  {
    section: '3. Findings by confidence',
    requirement: 'Separate observed facts, analytical assessments, assumptions, and unresolved intelligence gaps.',
  },
  {
    section: '4. Discrepancy table',
    requirement: 'Compare exact wording, omissions, date drift, actor framing, and contradictions across source families.',
  },
  {
    section: '5. Graph grounding',
    requirement: 'Show relevant nodes, edges, graph paths, missing edges, proposed graph updates, and provenance status.',
  },
  {
    section: '6. Policy implications',
    requirement: 'Translate evidence into options, risks, triggers, confidence notes, and brief-ready language.',
  },
  {
    section: '7. Next searches',
    requirement: 'Return targeted follow-up searches with cost level, expected source class, and the gap each search would close.',
  },
];

export const SYRIA_GRAPH_GROUNDING_PIPELINE = [
  {
    step: 'Search',
    detail: 'Use Google-grounded search, saved source libraries, documents, and local media profiles to find current evidence.',
  },
  {
    step: 'Extract',
    detail: 'Turn text into typed graph candidates: actors, claims, events, commitments, constraints, sources, and dates.',
  },
  {
    step: 'Validate',
    detail: 'Compare against existing graph paths, source tiers, temporal anchors, and contradiction/omission rules.',
  },
  {
    step: 'Stage',
    detail: 'Put graph changes in GraphOps with provenance, confidence, and review notes before they become durable memory.',
  },
  {
    step: 'Reason',
    detail: 'Retrieve by graph path and ontology track so the LLM sees relationships, not isolated paragraphs.',
  },
  {
    step: 'Draft',
    detail: 'Generate memos and briefings that carry graph paths, citations, assumptions, dissent, and next collection tasks.',
  },
];

export const SYRIA_DEMO_ENTRY_PATH =
  '/login?mode=demo&redirect=/app/syria-case%3Frecording%3D1%26case%3Dsyria';

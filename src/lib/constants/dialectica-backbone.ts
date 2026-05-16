export type DialecticaReadiness = 'available' | 'standard' | 'premium' | 'planned';

export interface DialecticaPrimitive {
  id: string;
  label: string;
  description: string;
  demoCount: number;
}

export interface DialecticaNamedGraph {
  id: string;
  label: string;
  purpose: string;
  currentState: string;
  readiness: DialecticaReadiness;
}

export interface DialecticaCapability {
  label: string;
  firestore: string;
  dialectica: string;
  readiness: DialecticaReadiness;
}

export interface DialecticaDemoScenario {
  question: string;
  datalogRule: string;
  expectedOutput: string[];
  analystGate: string;
}

export const DIALECTICA_PRIMITIVES: DialecticaPrimitive[] = [
  {
    id: 'actor',
    label: 'Actor',
    description: 'States, armed groups, institutions, companies, civil society, and named negotiators.',
    demoCount: 12,
  },
  {
    id: 'claim',
    label: 'Claim',
    description: 'Asserted facts, accusations, promises, threats, and contested public positions.',
    demoCount: 8,
  },
  {
    id: 'interest',
    label: 'Interest',
    description: 'Actor objectives, red lines, time horizons, and hidden incentives.',
    demoCount: 7,
  },
  {
    id: 'constraint',
    label: 'Constraint',
    description: 'Legal, political, fiscal, capability, humanitarian, and reputational limits.',
    demoCount: 6,
  },
  {
    id: 'leverage',
    label: 'Leverage',
    description: 'Economic, military, institutional, narrative, legal, and diplomatic pressure pathways.',
    demoCount: 5,
  },
  {
    id: 'commitment',
    label: 'Commitment',
    description: 'Public or private promises, ceasefire obligations, access guarantees, and treaty clauses.',
    demoCount: 6,
  },
  {
    id: 'event',
    label: 'Event',
    description: 'Time-bound incidents, mediation rounds, sanctions actions, and conflict milestones.',
    demoCount: 18,
  },
  {
    id: 'narrative',
    label: 'Narrative',
    description: 'Frames, legitimacy claims, audience targeting, and information-environment storylines.',
    demoCount: 4,
  },
];

export const DIALECTICA_NAMED_GRAPHS: DialecticaNamedGraph[] = [
  {
    id: 'facts',
    label: 'Facts',
    purpose: 'Approved typed primitives and relationships for the active situation.',
    currentState: 'Stored in Firestore canonical graph and rendered through GraphOps.',
    readiness: 'standard',
  },
  {
    id: 'provenance',
    label: 'Provenance',
    purpose: 'PROV-O-style activity records for source, tool, advisor, and analyst attribution.',
    currentState: 'Partially available through source receipts, tool envelopes, graph proposals, and output provenance panels.',
    readiness: 'standard',
  },
  {
    id: 'retrieval_trace',
    label: 'Retrieval Trace',
    purpose: 'Search, document, graph, tool-output, and source-receipt paths used by each answer.',
    currentState: 'Available in Source Scout, Brainstorming Table, and several calibrated AI routes.',
    readiness: 'available',
  },
  {
    id: 'hypotheses',
    label: 'Hypotheses',
    purpose: 'Competing explanations and pending analyst assumptions before promotion to facts.',
    currentState: 'Available as owner-scoped Firestore hypotheses with analyst promotion into facts.',
    readiness: 'standard',
  },
  {
    id: 'contradictions',
    label: 'Contradictions',
    purpose: 'Detected conflict among claims, commitments, interests, and narratives.',
    currentState: 'Available through named recipe checks and stance/citation divergence; broader link prediction remains premium.',
    readiness: 'standard',
  },
  {
    id: 'agent_reasoning',
    label: 'Agent Reasoning',
    purpose: 'Structured agent turns, dissent, citations, cost, model, and tool-use metadata.',
    currentState: 'Tracked through agent runs, tool calls, output capsules, and Ask PRAXIS traces.',
    readiness: 'standard',
  },
  {
    id: 'scenario_forks',
    label: 'Scenario Forks',
    purpose: 'Time-travel branches for red-team/blue-team counterfactual planning.',
    currentState: 'Available as copy-on-write mutation logs over the canonical graph.',
    readiness: 'standard',
  },
];

export const DIALECTICA_CAPABILITIES: DialecticaCapability[] = [
  {
    label: 'Typed conflict grammar',
    firestore: 'Stored as documents, graph nodes, edges, and tool-output JSON.',
    dialectica: 'Stored as first-class typed facts and edges with qualifiers.',
    readiness: 'standard',
  },
  {
    label: 'Source-grounded retrieval',
    firestore: 'Source receipts and retrieval traces attached to tool outputs.',
    dialectica: 'Hybrid vector, BM25, and graph traversal with path receipts.',
    readiness: 'standard',
  },
  {
    label: 'Recursive reasoning',
    firestore: 'Materialized summaries and shallow graph queries.',
    dialectica: 'Five deterministic NetworkX recipe traversals over commitments, leverage chains, stance divergence, ZOPA openings, and action paths.',
    readiness: 'standard',
  },
  {
    label: 'Analyst-approved mutations',
    firestore: 'Graph proposal review queue and provenance-aware approvals.',
    dialectica: 'Human-approved graph actions generating separate provenance activities.',
    readiness: 'standard',
  },
  {
    label: 'Time-validity and scenario forks',
    firestore: 'Temporal metadata and scenario outputs.',
    dialectica: 'Time-travel graph branches, diffs, and mergeable scenario states.',
    readiness: 'standard',
  },
  {
    label: 'Inductive graph inference',
    firestore: 'No latent edge prediction in the default tier.',
    dialectica: 'Premium ULTRA-class link suggestions gated by analyst review.',
    readiness: 'planned',
  },
];

export const DIALECTICA_DEMO_SCENARIO: DialecticaDemoScenario = {
  question:
    'If the envoy chooses a quiet 72-hour pause, which commitments and leverage paths become contradictory if corridor access does not resume?',
  datalogRule:
    'COMMITMENT-CHECK + LEVERAGE-TRACE over the Episodic/Semantic views, with analyst approval before graph mutation.',
  expectedOutput: [
    'Government access guarantees conflict with continued AFN movement restrictions if UNMN monitors are blocked.',
    'DRM acceptance of AU sequencing conflicts with revenue-control escalation if Belara levies continue during the pause.',
    'RECONA sanctions leverage becomes actionable only if the trigger condition is verified by UNMN or ICRC.',
  ],
  analystGate:
    'PRAXIS should propose these as graph findings, not mutate the canonical graph until an analyst approves the supporting receipts.',
};

export function dialecticaCoveragePercent(): number {
  const total = DIALECTICA_PRIMITIVES.reduce((sum, primitive) => sum + primitive.demoCount, 0);
  const represented = DIALECTICA_PRIMITIVES.filter((primitive) => primitive.demoCount > 0).length;
  if (DIALECTICA_PRIMITIVES.length === 0 || total === 0) return 0;
  return Math.round((represented / DIALECTICA_PRIMITIVES.length) * 100);
}

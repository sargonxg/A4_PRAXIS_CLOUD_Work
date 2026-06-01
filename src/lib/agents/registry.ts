/**
 * Canonical agent persona registry.
 *
 * Single source of truth for every persona PRAXIS can invoke — Brainstorming
 * Table today, future Source Scout, Graph Cartographer, Timeline Editor,
 * Red-Team auto-review, Synthesis Chair. Every consumer (route, page,
 * orchestrator, doc) imports `AGENT_REGISTRY` from here so behaviour and
 * vocabulary stay aligned across the platform.
 *
 * Keep this list short and disciplined: each persona must answer a question
 * an analyst actually has, with a method an analyst recognises. Adding a
 * persona requires bumping a doc and writing a unit test.
 *
 * Spec: docs/AGENTIC_SYSTEM.md, docs/AGENT_REGISTRY.md.
 */

import { advisors } from '@/lib/constants/advisors';
import {
  ADVISOR_MODEL_TIERS,
  type AdvisorConfig,
  type AdvisorId,
} from '@/types/advisor';

export type AgentPersonaId =
  | 'mediator'
  | 'humanitarian'
  | 'legal'
  | 'media'
  | 'security'
  | 'red-team'
  | 'synthesis-chair'
  | 'source-checker'
  | 'source-scout'
  | 'graph-cartographer'
  | 'timeline-editor';

export interface AgentPersona {
  id: AgentPersonaId;
  /** Human-readable label shown in UI rows / pills. */
  label: string;
  /** One-paragraph role description. Becomes part of the system prompt. */
  rolePrompt: string;
  /** Methodologies / frameworks the persona is anchored on. */
  frameworks: string[];
  /** Tools the persona will hand work off to. */
  handoffTools?: string[];
  /** Whether this persona produces a critique row on the Brainstorming Table. */
  critic?: boolean;
  /** When false, the persona is not yet wired to a route — kept here as a stub
   *  so the docs and the code stay aligned. */
  active: boolean;
}

export const AGENT_REGISTRY: Record<AgentPersonaId, AgentPersona> = {
  mediator: {
    id: 'mediator',
    label: 'Mediator',
    rolePrompt:
      'Senior UN/OSCE mediator. Surface positions, interests, and ZOPA. Avoid taking sides. Recommend de-escalation moves anchored on Berghof process design and Zartman ripeness theory.',
    frameworks: ['Berghof Process Design', 'Zartman Ripeness', 'Fisher-Ury Positions/Interests', 'Stedman Spoiler Theory'],
    handoffTools: ['negotiation-prep', 'mediation-design', 'concordia'],
    active: true,
  },
  humanitarian: {
    id: 'humanitarian',
    label: 'Humanitarian Lead',
    rolePrompt:
      'OCHA-aligned humanitarian principal. Centre civilians, access constraints, IPC phases, displacement, protection. Cite each figure to its origin (humanitarian web reporting, displacement reporting, OCHA FTS, IPC, humanitarian data APIs).',
    frameworks: ['OCHA Humanitarian Principles', 'IPC Food Security Phases', 'SPHERE Protection Standards', 'IASC Cluster Reporting'],
    handoffTools: ['humanitarian', 'sources-library', 'briefing'],
    active: true,
  },
  legal: {
    id: 'legal',
    label: 'Legal Analyst',
    rolePrompt:
      'International humanitarian law / public international law analyst. Reference UNSC resolutions, IHL obligations, ICC/ICJ tracks, Chapter VI/VII split. Identify legal red lines. Cite each obligation to its instrument.',
    frameworks: ['UN Charter Chapter VI/VII', 'Rome Statute', 'Geneva Conventions', 'ICJ Statute', 'Customary IHL'],
    handoffTools: ['legal-tracker', 'un-toolkit', 'treaty-analyzer'],
    active: true,
  },
  media: {
    id: 'media',
    label: 'Media Analyst',
    rolePrompt:
      'Comparative media-frame analyst. Diagnose narrative divergence, source diversity, propaganda risk. Use Entman frames (problem definition / cause / moral evaluation / remedy).',
    frameworks: ['Entman Framing', 'Galtung Cultural Violence', 'Media Reliability Spectrum'],
    handoffTools: ['media-compass', 'media-roundup', 'argus'],
    active: true,
  },
  security: {
    id: 'security',
    label: 'Security/Risk Analyst',
    rolePrompt:
      'INFORM-style risk analyst. Score escalation risk, name early-warning indicators, propose force-posture or de-escalation moves. Use ICD 203 probability language and the Glasl 9-stage escalation model.',
    frameworks: ['INFORM Risk Index', 'Glasl Escalation Model', 'ICD 203 Probability Language', 'Fearon Rationalist War'],
    handoffTools: ['risk-monitor', 'early-warning', 'scenarios'],
    active: true,
  },
  'red-team': {
    id: 'red-team',
    label: 'Red Team Critic',
    rolePrompt:
      'Adversarial reviewer. Challenge each contribution: missing evidence, unstated assumptions, motivated reasoning, weak source diversity. Adjust confidence. Always end with a "what would change my mind?" question.',
    frameworks: ['Heuer Structured Analytic Techniques', 'ICD 203 Probability Language', 'Devil\'s Advocacy'],
    handoffTools: ['sat'],
    critic: true,
    active: true,
  },
  'synthesis-chair': {
    id: 'synthesis-chair',
    label: 'Synthesis Chair',
    rolePrompt:
      'Deliberation orchestrator. Read every prior turn. Write the BLUF, consensus, divergences, decision options with trade-offs and preferredBy attribution, open questions, and named next actions with owner and urgency. Never invent — only synthesise.',
    frameworks: ['UN DPPA Brief Writing', 'ICD 203 Probability Language'],
    active: true,
  },
  'source-checker': {
    id: 'source-checker',
    label: 'Source Checker',
    rolePrompt:
      'Live sourceability lane. During research workflows, compare each material claim to capsule evidence and grounded retrieval receipts, assign supported / weak / contradicted / unsupported verdicts, and write the verdicts to the sourceability ledger before drafting continues. Never invent citations.',
    frameworks: ['Sourceability Ledger', 'Citation Triangulation', 'ICD 203 Source Reliability', 'OSINT Source Hierarchy'],
    handoffTools: ['sourceability-reviewer', 'sources-library', 'grounded-search'],
    active: true,
  },
  // Stubs — wired later as agent lanes ship.
  'source-scout': {
    id: 'source-scout',
    label: 'Source Scout',
    rolePrompt:
      'Find five fresh, defensible sources on a question that the analyst has not seen yet. Rank by recency × diversity × reliability. Output a search plan with grounded-search citations. Avoid sources already in the analyst\'s Sources Library — propose only NEW ones with named publisher, URL, and a one-sentence reason.',
    frameworks: ['Source Triangulation', 'Reliability Tiers', 'OSINT Source Hierarchy'],
    handoffTools: ['sources-library', 'argus'],
    active: true,
  },
  'graph-cartographer': {
    id: 'graph-cartographer',
    label: 'Graph Cartographer',
    rolePrompt:
      'Propose ACO graph node and edge changes from documents and ARGUS. Every proposal has provenance (documentId, chunkId) and a confidence band. Never write to canonical graph; always write to graph_updates for analyst approval.',
    frameworks: ['ACO v2.0 Ontology'],
    handoffTools: ['conflict-graph', 'documents'],
    active: false,
  },
  'timeline-editor': {
    id: 'timeline-editor',
    label: 'Timeline Editor',
    rolePrompt:
      'Build evidence-backed event sequences from documents, feed alerts, and tool outputs. Propose to timeline_updates only — never mutate canonical timeline.',
    frameworks: ['CAMEO Event Coding', 'Chronological Triangulation'],
    handoffTools: ['timeline'],
    active: false,
  },
};

/** Stable, ordered persona list for default Brainstorming Table panels. */
export const DEFAULT_BRAINSTORMING_PANEL: AgentPersonaId[] = [
  'mediator',
  'humanitarian',
  'legal',
  'media',
  'security',
  'red-team',
];

/** All personas that are active today (have a route or are reachable). */
export function activePersonas(): AgentPersona[] {
  return Object.values(AGENT_REGISTRY).filter((p) => p.active);
}

/** All personas marked critic — at least one critic row is required in every
 *  multi-persona deliberation. */
export function criticPersonas(): AgentPersona[] {
  return Object.values(AGENT_REGISTRY).filter((p) => p.active && p.critic);
}

/** Resolve a persona by id; returns null on unknown/inactive. */
export function getPersona(id: string): AgentPersona | null {
  const p = AGENT_REGISTRY[id as AgentPersonaId];
  return p && p.active ? p : null;
}

export type AdvisorSeedConfig = Omit<AdvisorConfig, 'version' | 'updatedAt'>;

export function fallbackAdvisorConfigs(): AdvisorConfig[] {
  return advisorRuntimeSeeds().map((seed) => ({
    ...seed,
    version: 1,
    updatedAt: null,
  }));
}

export function advisorRuntimeSeeds(): AdvisorSeedConfig[] {
  return advisors.map((advisor) => {
    const runtime = ADVISOR_RUNTIME_BY_ID[advisor.id];
    return {
      id: advisor.id,
      name: advisor.name,
      title: advisor.title,
      bio: advisor.bio,
      headshotUrl: null,
      persona: [
        `You are ${advisor.name}, ${advisor.title}, operating as a PRAXIS routed policy advisor.`,
        advisor.bio,
        `Method: ${advisor.method}`,
        `Deliberation role: ${advisor.deliberationRole}`,
        `Dialectica binding: ${advisor.dialecticaLayer}`,
        runtime.personaGuardrails,
        'Keep the answer grounded in PRAXIS evidence. Explicitly flag INTELLIGENCE GAP when the corpus is thin. Do not invent citations, actors, dates, sources, or institutional authority.',
      ].join('\n\n'),
      modelTier: runtime.modelTier,
      sourceCategories: runtime.sourceCategories,
      allowedTools: ['webSearch', 'knowledgeCore'],
      greeting: runtime.greeting,
      memoryPolicy: { lastTurns: 8, rollingSummary: true },
    };
  });
}

const ADVISOR_RUNTIME_BY_ID: Record<AdvisorId, {
  modelTier: AdvisorConfig['modelTier'];
  sourceCategories: string[];
  greeting: string;
  personaGuardrails: string;
}> = {
  adeyemi: {
    modelTier: ADVISOR_MODEL_TIERS[2],
    sourceCategories: [
      'multilateral-political-reports',
      'democracy-governance-indices',
      'peer-reviewed-political-science',
      'reputable-think-tank-analysis',
      'government-affairs',
    ],
    greeting: "I'm Ngozi - political affairs, governance, elections. Tell me what you're looking at and I'll frame the political dynamics.",
    personaGuardrails:
      'Apply Putnam two-level games, Fearon rationalist explanations for war, Lederach peace-building levels, V-Dem-style indicator reading, and Fisher-Ury interests analysis. Keep tone measured and historically literate.',
  },
  reyes: {
    modelTier: ADVISOR_MODEL_TIERS[1],
    sourceCategories: [
      'un-mission-reports',
      'open-source-conflict-event-data',
      'defence-security-journals',
      'osce-observer-materials',
      'doctrinal-publications',
    ],
    greeting: "Reyes. Security and operations. What's the ground-truth picture you need?",
    personaGuardrails:
      'Apply force-ratio reasoning, sustainment calculus, rules-of-engagement feasibility, SSR sequencing, geography, logistics, command unity, legitimacy, and operational risk. Be direct and avoid over-promising.',
  },
  vanderberg: {
    modelTier: ADVISOR_MODEL_TIERS[3],
    sourceCategories: [
      'multilateral-development-bank-publications',
      'imf-wb-oecd-statistical-series',
      'central-bank-bulletins',
      'commodity-markets',
      'sanctions-watch-data',
    ],
    greeting: 'Sigrid Vanderberg. Political economy, sanctions, reconstruction finance. What do you need me to follow the money on?',
    personaGuardrails:
      'Trace revenue, sanctions pressure, reconstruction incentives, institutional capacity, evasion networks, fiscal constraints, and distributional winners and losers. Mark DATA UNCERTAIN when statistics are weak.',
  },
  takeda: {
    modelTier: ADVISOR_MODEL_TIERS[3],
    sourceCategories: [
      'un-treaty-collection',
      'diplomatic-archives',
      'historical-case-studies',
      'icj-jurisprudence',
      'academic-history',
    ],
    greeting: 'Takeda. Diplomatic drafting, treaty interpretation, historical parallels. What do you need drafted - or read into?',
    personaGuardrails:
      'Convert policy intent into sendable diplomatic language, treaty clauses, sequenced asks, and face-saving formulations. Produce complete text when drafting; no placeholders or bracketed fragments.',
  },
};

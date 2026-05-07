import type { OntologyId } from '@/lib/ontology/types';

export type CaseTypeId =
  | 'active-conflict'
  | 'frozen-conflict'
  | 'negotiation-mediation'
  | 'counter-terrorism'
  | 'humanitarian-crisis'
  | 'political-transition'
  | 'sanctions-economic-statecraft'
  | 'strategic-competition'
  | 'cyber-hybrid'
  | 'forced-displacement';

export interface CaseTypeDefinition {
  id: CaseTypeId;
  label: string;
  description: string;
  primaryOntologyId: OntologyId;
  compatibleOntologyIds: OntologyId[];
  terms: string[];
}

export interface CaseTypeClassification {
  caseType: CaseTypeId;
  caseTypeSecondary?: CaseTypeId;
  confidence: number;
  rationale: string;
  scores: Array<{ caseType: CaseTypeId; score: number; signals: string[] }>;
}

export const MAX_ACTIVE_CASE_TYPES = 2;

export const CASE_TYPE_DEFINITIONS: CaseTypeDefinition[] = [
  {
    id: 'active-conflict',
    label: 'Active conflict',
    description: 'Kinetic violence, contested control, frontlines, ceasefires, and escalation.',
    primaryOntologyId: 'conflict',
    compatibleOntologyIds: ['conflict', 'humanitarian', 'security'],
    terms: ['armed group', 'ceasefire', 'frontline', 'kinetic', 'violence', 'combatant', 'control claim', 'escalation'],
  },
  {
    id: 'frozen-conflict',
    label: 'Frozen conflict',
    description: 'Unresolved territorial dispute, line of control, monitoring, and status talks.',
    primaryOntologyId: 'conflict',
    compatibleOntologyIds: ['conflict', 'governance', 'legal'],
    terms: ['frozen conflict', 'line of control', 'status quo', 'monitoring mission', 'contested territory', 'provocation'],
  },
  {
    id: 'negotiation-mediation',
    label: 'Negotiation and mediation',
    description: 'Talks, mediators, positions, interests, BATNA, ZOPA, and commitments.',
    primaryOntologyId: 'mediation',
    compatibleOntologyIds: ['mediation', 'conflict', 'governance'],
    terms: ['mediation', 'mediator', 'negotiation', 'zopa', 'batna', 'offer', 'position', 'party interests', 'settlement'],
  },
  {
    id: 'counter-terrorism',
    label: 'Counter-terrorism',
    description: 'Designations, cells, financing, operational capability, and disruption.',
    primaryOntologyId: 'security',
    compatibleOntologyIds: ['security', 'economic', 'legal'],
    terms: ['terrorism', 'counter-terrorism', 'cell', 'designation', 'financing channel', 'radicalization', 'material support'],
  },
  {
    id: 'humanitarian-crisis',
    label: 'Humanitarian crisis',
    description: 'Affected populations, access corridors, protection risks, needs, and delivery constraints.',
    primaryOntologyId: 'humanitarian',
    compatibleOntologyIds: ['humanitarian', 'conflict', 'human-rights'],
    terms: ['humanitarian', 'access', 'needs assessment', 'protection', 'aid corridor', 'cluster', 'ocha', 'response gaps'],
  },
  {
    id: 'political-transition',
    label: 'Political transition',
    description: 'Elections, interim authorities, legitimacy, constitutional milestones, and power sharing.',
    primaryOntologyId: 'governance',
    compatibleOntologyIds: ['governance', 'legal', 'conflict'],
    terms: ['transition', 'election', 'constitutional', 'power sharing', 'transitional authority', 'legitimacy', 'institutional reform'],
  },
  {
    id: 'sanctions-economic-statecraft',
    label: 'Sanctions and economic statecraft',
    description: 'Sanctions regimes, evasion routes, financial channels, and pressure claims.',
    primaryOntologyId: 'economic',
    compatibleOntologyIds: ['economic', 'governance', 'legal'],
    terms: ['sanction', 'designation', 'ofac', 'evasion', 'export control', 'financial channel', 'beneficial owner'],
  },
  {
    id: 'strategic-competition',
    label: 'Strategic competition',
    description: 'Rivalry, influence assets, red lines, deterrence claims, and alliance commitments.',
    primaryOntologyId: 'security',
    compatibleOntologyIds: ['security', 'governance', 'narrative'],
    terms: ['strategic competition', 'deterrence', 'red line', 'alliance', 'influence operation', 'coercion', 'signaling'],
  },
  {
    id: 'cyber-hybrid',
    label: 'Cyber and hybrid',
    description: 'Cyber operations, attribution, disinformation, compromised assets, and hybrid activity.',
    primaryOntologyId: 'narrative',
    compatibleOntologyIds: ['narrative', 'security', 'conflict'],
    terms: ['cyber', 'hybrid', 'disinformation', 'malware', 'attribution', 'intrusion', 'gray-zone'],
  },
  {
    id: 'forced-displacement',
    label: 'Forced displacement',
    description: 'Refugees, IDPs, host communities, return constraints, routes, and durable solutions.',
    primaryOntologyId: 'humanitarian',
    compatibleOntologyIds: ['humanitarian', 'human-rights', 'legal'],
    terms: ['refugee', 'idp', 'forced displacement', 'host community', 'return', 'legal status', 'crossing'],
  },
];

export const CASE_TYPE_IDS = CASE_TYPE_DEFINITIONS.map((item) => item.id);

const ROLE_CASE_TYPE_PRIORITIES: Record<string, CaseTypeId[]> = {
  mediator: ['negotiation-mediation', 'active-conflict'],
  party: ['negotiation-mediation', 'active-conflict'],
  analyst: ['active-conflict', 'political-transition'],
  observer: ['active-conflict', 'humanitarian-crisis'],
  advisor: ['political-transition', 'strategic-competition'],
  researcher: ['cyber-hybrid', 'strategic-competition'],
  human_rights_officer: ['humanitarian-crisis', 'forced-displacement'],
  sanctions_analyst: ['sanctions-economic-statecraft', 'counter-terrorism'],
  humanitarian_coordinator: ['humanitarian-crisis', 'forced-displacement'],
  treaty_lawyer: ['political-transition', 'sanctions-economic-statecraft'],
  defense_analyst: ['strategic-competition', 'active-conflict'],
};

export function isCaseTypeId(value: unknown): value is CaseTypeId {
  return typeof value === 'string' && (CASE_TYPE_IDS as string[]).includes(value);
}

export function getCaseTypeDefinition(id: CaseTypeId): CaseTypeDefinition {
  const definition = CASE_TYPE_DEFINITIONS.find((item) => item.id === id);
  if (!definition) throw new Error(`Unknown case type: ${id}`);
  return definition;
}

export function normalizeCaseTypeSelection(input: Array<CaseTypeId | undefined | null>): CaseTypeId[] {
  const unique: CaseTypeId[] = [];
  for (const item of input) {
    if (item && !unique.includes(item)) unique.push(item);
    if (unique.length === MAX_ACTIVE_CASE_TYPES) break;
  }
  return unique;
}

export function suggestCaseTypesForRole(role: string | null | undefined): CaseTypeId[] {
  return ROLE_CASE_TYPE_PRIORITIES[role ?? ''] ?? ['active-conflict'];
}

function scoreTerms(text: string, terms: string[]): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 0;
  for (const term of terms) {
    if (text.includes(term)) {
      signals.push(term);
      score += term.includes(' ') ? 2 : 1;
    }
  }
  return { score, signals };
}

export function classifyCaseTypeSignals(input: {
  name: string;
  description: string;
  sourceUrls?: string[];
  role?: string | null;
}): CaseTypeClassification {
  const text = [input.name, input.description, ...(input.sourceUrls ?? [])].join(' ').toLowerCase();
  const rolePriorities = suggestCaseTypesForRole(input.role);
  const scores = CASE_TYPE_DEFINITIONS
    .map((definition) => {
      const scored = scoreTerms(text, definition.terms);
      const roleBoost = rolePriorities.includes(definition.id) ? 1 : 0;
      return {
        caseType: definition.id,
        score: scored.score + roleBoost,
        signals: scored.signals,
      };
    })
    .sort((a, b) => b.score - a.score);

  const positive = scores.filter((item) => item.score > 0).map((item) => item.caseType);
  const selected = normalizeCaseTypeSelection(positive.length ? positive : rolePriorities);
  const caseType = selected[0] ?? 'active-conflict';
  const caseTypeSecondary = selected[1];
  const topScore = scores[0]?.score ?? 0;
  const runnerUp = scores[1]?.score ?? 0;
  const confidence = topScore > 0
    ? Math.min(0.95, Math.max(0.5, 0.52 + topScore * 0.08 + (topScore - runnerUp) * 0.03))
    : 0.45;
  const signals = scores.find((item) => item.caseType === caseType)?.signals.slice(0, 3) ?? [];

  return {
    caseType,
    ...(caseTypeSecondary ? { caseTypeSecondary } : {}),
    confidence: Number(confidence.toFixed(2)),
    rationale: signals.length
      ? `Matched ${signals.join(', ')} signals for ${caseType}.`
      : `Using ${caseType} as the default case type for this role.`,
    scores,
  };
}

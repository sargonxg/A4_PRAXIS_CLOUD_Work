import { CASE_ONTOLOGIES } from '@/lib/ontology/registry';
import type { OntologyId } from '@/lib/ontology/types';
import { normalizeOntologySelection } from '@/lib/ontology/suggestions';

export interface OntologyClassifyInput {
  name: string;
  description: string;
  sourceUrls?: string[];
  role?: string | null;
}

export interface OntologyClassification {
  ontologyId: OntologyId;
  ontologyIds: OntologyId[];
  primaryOntologyId: OntologyId;
  confidence: number;
  rationale: string;
  scores: Array<{ ontologyId: OntologyId; score: number; signals: string[] }>;
}

const ONTOLOGY_SIGNAL_TERMS: Record<OntologyId, string[]> = {
  conflict: [
    'conflict',
    'ceasefire',
    'armed group',
    'escalation',
    'de-escalation',
    'combatant',
    'frontline',
    'violence',
  ],
  mediation: [
    'mediation',
    'mediator',
    'negotiation',
    'settlement',
    'zopa',
    'party interests',
    'facilitation',
    'agreement',
  ],
  governance: [
    'governance',
    'coalition',
    'veto',
    'institution',
    'parliament',
    'constitutional',
    'mandate',
    'policy',
  ],
  narrative: [
    'narrative',
    'disinformation',
    'counter-narrative',
    'framing',
    'propaganda',
    'information operation',
    'media',
    'messaging',
  ],
  'human-rights': [
    'human rights',
    'rights',
    'atrocity',
    'accountability',
    'detention',
    'victim',
    'protected group',
    'icc',
    'torture',
  ],
  economic: [
    'sanction',
    'ofac',
    'designation',
    'beneficial owner',
    'export control',
    'trade',
    'finance',
    'payment channel',
    'evasion',
  ],
  humanitarian: [
    'humanitarian',
    'ocha',
    'idp',
    'refugee',
    'access',
    'cluster',
    'needs',
    'response',
    'protection',
  ],
  legal: [
    'treaty',
    'jurisdiction',
    'reservation',
    'tribunal',
    'legal provision',
    'customary law',
    'icj',
    'icc',
    'breach',
  ],
  security: [
    'security',
    'defense',
    'nato',
    'force posture',
    'capability',
    'deterrence',
    'military',
    'engagement rule',
    'doctrine',
  ],
};

const ROLE_BOOSTS: Record<string, OntologyId[]> = {
  mediator: ['mediation', 'conflict'],
  analyst: ['conflict'],
  observer: ['conflict'],
  advisor: ['governance', 'conflict'],
  researcher: ['narrative', 'conflict'],
  human_rights_officer: ['human-rights', 'legal'],
  sanctions_analyst: ['economic', 'governance'],
  humanitarian_coordinator: ['humanitarian', 'conflict'],
  treaty_lawyer: ['legal', 'governance'],
  defense_analyst: ['security', 'conflict'],
};

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

export function classifyOntologySignals(input: OntologyClassifyInput): OntologyClassification {
  const text = [input.name, input.description, ...(input.sourceUrls ?? [])]
    .join(' ')
    .toLowerCase();
  const boosted = ROLE_BOOSTS[input.role ?? ''] ?? [];

  const scores = CASE_ONTOLOGIES
    .map((ontology) => {
      const termScore = scoreTerms(text, ONTOLOGY_SIGNAL_TERMS[ontology.id]);
      const domainSignals = ontology.domains.filter((domain) => text.includes(domain.replaceAll('-', ' ')));
      const boost = boosted.includes(ontology.id) ? 1 : 0;
      return {
        ontologyId: ontology.id,
        score: termScore.score + domainSignals.length + boost,
        signals: [...termScore.signals, ...domainSignals],
      };
    })
    .sort((a, b) => b.score - a.score);

  const positive = scores.filter((item) => item.score > 0).map((item) => item.ontologyId);
  const ontologyIds = normalizeOntologySelection(positive.length ? positive : boosted);
  const primaryOntologyId = ontologyIds[0];
  const topScore = scores[0]?.score ?? 0;
  const runnerUp = scores[1]?.score ?? 0;
  const confidence = Math.min(0.95, Math.max(0.45, 0.5 + topScore * 0.08 + (topScore - runnerUp) * 0.04));
  const signals = scores.find((item) => item.ontologyId === primaryOntologyId)?.signals.slice(0, 3) ?? [];

  return {
    ontologyId: primaryOntologyId,
    ontologyIds,
    primaryOntologyId,
    confidence: topScore > 0 ? Number(confidence.toFixed(2)) : 0.45,
    rationale: signals.length
      ? `Matched ${signals.join(', ')} signals for ${primaryOntologyId}.`
      : `Using ${primaryOntologyId} as the default ontology lens for this role.`,
    scores,
  };
}

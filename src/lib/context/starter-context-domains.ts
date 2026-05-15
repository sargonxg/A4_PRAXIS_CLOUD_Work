import type { DomainId } from '@/types/domain';
import type { PathId } from '@/lib/path/types';
import type { SituationType, UserRole } from '@/types/situation';

export type StarterContextDomainId =
  | 'policy'
  | 'conflict'
  | 'diplomacy'
  | 'humanitarian'
  | 'legal'
  | 'corporate-risk'
  | 'custom';

export interface StarterContextDomain {
  id: StarterContextDomainId;
  label: string;
  domainId: DomainId;
  pathId?: PathId;
  type: SituationType;
  userRole: UserRole;
  defaultRegion: string;
  sourceTypes: string[];
  graphLenses: string[];
  timeHorizon: string;
  outputFormats: string[];
  starterActors: string[];
  description: string;
}

export const STARTER_CONTEXT_DOMAINS: StarterContextDomain[] = [
  {
    id: 'policy',
    label: 'Policy',
    domainId: 'governance-rule-of-law',
    pathId: 'governance-path',
    type: 'political',
    userRole: 'analyst',
    defaultRegion: 'Policy file',
    sourceTypes: ['statute or mandate', 'implementation note', 'stakeholder position'],
    graphLenses: ['institutional actors', 'constraints', 'policy tradeoffs'],
    timeHorizon: 'Next 6-18 months',
    outputFormats: ['policy memo', 'options note', 'implementation brief'],
    starterActors: ['Decision maker', 'Implementing agency', 'Affected constituency'],
    description: 'A policy context for decisions, implementation constraints, stakeholder posture, and evidence-backed recommendations.',
  },
  {
    id: 'conflict',
    label: 'Conflict',
    domainId: 'armed-conflict-security',
    pathId: 'conflict-path',
    type: 'international',
    userRole: 'analyst',
    defaultRegion: 'Conflict file',
    sourceTypes: ['incident report', 'actor statement', 'humanitarian update'],
    graphLenses: ['actors', 'claims', 'events'],
    timeHorizon: 'Next 30-180 days',
    outputFormats: ['situation brief', 'risk memo', 'timeline review'],
    starterActors: ['Primary party', 'External backer', 'Civilian authority'],
    description: 'A conflict context for actors, claims, escalation markers, source receipts, and near-term risk assessment.',
  },
  {
    id: 'diplomacy',
    label: 'Diplomacy',
    domainId: 'diplomacy-negotiation',
    pathId: 'diplomacy-path',
    type: 'international',
    userRole: 'mediator',
    defaultRegion: 'Diplomatic file',
    sourceTypes: ['communique', 'negotiation note', 'treaty or mandate text'],
    graphLenses: ['interests', 'red lines', 'commitments'],
    timeHorizon: 'Negotiation round + 12 months',
    outputFormats: ['non-paper', 'talking points', 'deal memo'],
    starterActors: ['Party A', 'Party B', 'Mediator or guarantor'],
    description: 'A diplomacy context for parties, interests, constraints, sequencing, commitments, and careful negotiation language.',
  },
  {
    id: 'humanitarian',
    label: 'Humanitarian',
    domainId: 'humanitarian',
    pathId: 'humanitarian-path',
    type: 'civil',
    userRole: 'humanitarian_coordinator',
    defaultRegion: 'Humanitarian file',
    sourceTypes: ['OCHA update', 'needs assessment', 'access constraint note'],
    graphLenses: ['needs', 'access', 'protection'],
    timeHorizon: 'Next 4-12 weeks',
    outputFormats: ['access brief', 'needs summary', 'donor note'],
    starterActors: ['Affected population', 'Humanitarian actor', 'Access authority'],
    description: 'A humanitarian context for needs, access, protection, response constraints, and source-grounded operational writing.',
  },
  {
    id: 'legal',
    label: 'Legal',
    domainId: 'governance-rule-of-law',
    pathId: 'governance-path',
    type: 'legal',
    userRole: 'treaty_lawyer',
    defaultRegion: 'Legal file',
    sourceTypes: ['legal authority', 'case record', 'procedural history'],
    graphLenses: ['authority', 'obligations', 'procedural risk'],
    timeHorizon: 'Matter lifecycle',
    outputFormats: ['legal note', 'authority map', 'risk memo'],
    starterActors: ['Competent authority', 'Affected party', 'Reviewer'],
    description: 'A legal context for authorities, obligations, procedural posture, evidence gaps, and cautious memo drafting.',
  },
  {
    id: 'corporate-risk',
    label: 'Corporate Risk',
    domainId: 'economic-sanctions',
    pathId: 'economic-path',
    type: 'trade',
    userRole: 'advisor',
    defaultRegion: 'Corporate risk file',
    sourceTypes: ['regulatory update', 'market signal', 'counterparty note'],
    graphLenses: ['exposure', 'stakeholders', 'controls'],
    timeHorizon: 'Next quarter + annual risk cycle',
    outputFormats: ['board brief', 'risk register note', 'decision memo'],
    starterActors: ['Company', 'Regulator', 'Counterparty'],
    description: 'A corporate risk context for exposure, regulation, stakeholders, controls, and board-ready recommendations.',
  },
  {
    id: 'custom',
    label: 'Custom',
    domainId: 'generic',
    type: 'custom',
    userRole: 'analyst',
    defaultRegion: 'Custom file',
    sourceTypes: ['core document', 'stakeholder note', 'timeline item'],
    graphLenses: ['actors', 'claims', 'open questions'],
    timeHorizon: 'User-defined',
    outputFormats: ['memo', 'brief', 'handover'],
    starterActors: ['Primary actor', 'Reviewer', 'Affected stakeholder'],
    description: 'A flexible context for work that does not fit one domain cleanly yet.',
  },
];

export function getStarterContextDomain(id: StarterContextDomainId): StarterContextDomain {
  return STARTER_CONTEXT_DOMAINS.find((domain) => domain.id === id) ?? STARTER_CONTEXT_DOMAINS[0];
}

export function starterContextNotes(domain: StarterContextDomain): string {
  return [
    `Starter Situation Core domain: ${domain.label}`,
    `Recommended source types: ${domain.sourceTypes.join(', ')}`,
    `Graph lenses: ${domain.graphLenses.join(', ')}`,
    `Time horizon: ${domain.timeHorizon}`,
    `Output formats: ${domain.outputFormats.join(', ')}`,
  ].join('\n');
}

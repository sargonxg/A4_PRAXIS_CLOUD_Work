import type { DomainId } from '@/types/domain';
import type { UserRole } from '@/types/situation';
import type { CaseTypeId } from '@/lib/ontology/case-types';
import type { OntologyId } from '@/lib/ontology/types';
import {
  SEMANTICA_ADAPTER_VERSION,
  buildSemanticaContextGraph,
  type SemanticaContextGraph,
} from '@/lib/semantica/context-core-adapter';

export type ContextDomainOptionId = 'conflict' | 'mediation' | 'humanitarian';
export type ContextWorkOptionId = 'foreign-policy' | 'domestic-policy' | 'corporate-strategy';

export interface ContextDomainOption {
  id: ContextDomainOptionId;
  label: string;
  domainId: DomainId;
  ontologyIds: OntologyId[];
  caseType: CaseTypeId;
  regionFallback: string;
}

export interface ContextWorkOption {
  id: ContextWorkOptionId;
  label: string;
  userRole: UserRole;
  workflowPath: string;
}

export interface ContextCreateDraft {
  name: string;
  frame: string;
  domain: ContextDomainOptionId;
  work: ContextWorkOptionId;
}

export interface ContextCreatePayload {
  name: string;
  type: 'custom';
  description: string;
  region: string;
  actors: string[];
  userRole: UserRole;
  status: 'active';
  contextNotes: string;
  ontologyIds: OntologyId[];
  primaryOntologyId: OntologyId;
  ontologyOverriddenByUser: true;
  caseType: CaseTypeId;
  caseTypeLocked: true;
  domain: DomainId;
  domainOverriddenByUser: true;
  workflowPath: string;
  workflowPathLabel: string;
  semanticaLayer: {
    enabled: true;
    adapterVersion: typeof SEMANTICA_ADAPTER_VERSION;
    serviceBoundary: 'future-python-or-rest-worker';
  };
  semanticaContextGraph: SemanticaContextGraph;
}

export const CONTEXT_DOMAIN_OPTIONS: ContextDomainOption[] = [
  {
    id: 'conflict',
    label: 'Conflict',
    domainId: 'armed-conflict-security',
    ontologyIds: ['conflict', 'security', 'governance'],
    caseType: 'active-conflict',
    regionFallback: 'Global',
  },
  {
    id: 'mediation',
    label: 'Mediation',
    domainId: 'diplomacy-negotiation',
    ontologyIds: ['mediation', 'conflict', 'governance'],
    caseType: 'negotiation-mediation',
    regionFallback: 'Negotiation track',
  },
  {
    id: 'humanitarian',
    label: 'Humanitarian',
    domainId: 'humanitarian',
    ontologyIds: ['humanitarian', 'conflict', 'human-rights'],
    caseType: 'humanitarian-crisis',
    regionFallback: 'Humanitarian operating area',
  },
];

export const CONTEXT_WORK_OPTIONS: ContextWorkOption[] = [
  {
    id: 'foreign-policy',
    label: 'Foreign Policy Research',
    userRole: 'advisor',
    workflowPath: 'foreign-policy-research',
  },
  {
    id: 'domestic-policy',
    label: 'Domestic Policy Analysis',
    userRole: 'analyst',
    workflowPath: 'domestic-policy-analysis',
  },
  {
    id: 'corporate-strategy',
    label: 'Corporate Strategic Analysis',
    userRole: 'researcher',
    workflowPath: 'corporate-strategic-analysis',
  },
];

export function suggestContextDomainId(text: string): ContextDomainOptionId {
  const lower = text.toLowerCase();
  if (/\b(aid|humanitarian|ocha|access|corridor|protection|displacement|refugee|idp)\b/.test(lower)) {
    return 'humanitarian';
  }
  if (/\b(talk|talks|mediation|mediator|negotiation|ceasefire|settlement|zopa|batna)\b/.test(lower)) {
    return 'mediation';
  }
  return 'conflict';
}

export function findContextDomainOption(id: ContextDomainOptionId): ContextDomainOption {
  return CONTEXT_DOMAIN_OPTIONS.find((option) => option.id === id) ?? CONTEXT_DOMAIN_OPTIONS[0];
}

export function findContextWorkOption(id: ContextWorkOptionId): ContextWorkOption {
  return CONTEXT_WORK_OPTIONS.find((option) => option.id === id) ?? CONTEXT_WORK_OPTIONS[0];
}

export function buildContextCreatePayload(draft: ContextCreateDraft): ContextCreatePayload {
  const name = draft.name.trim();
  const frame = draft.frame.trim();
  const domain = findContextDomainOption(draft.domain);
  const work = findContextWorkOption(draft.work);
  const description = frame || `Initial context frame for ${name}.`;
  const semanticaContextGraph = buildSemanticaContextGraph({ draft, domain, work });

  return {
    name,
    type: 'custom',
    description,
    region: domain.regionFallback,
    actors: [],
    userRole: work.userRole,
    status: 'active',
    contextNotes: [
      `Domain ontology: ${domain.label}`,
      `Work ontology: ${work.label}`,
      '',
      frame || 'No four-field frame provided yet.',
    ].join('\n'),
    ontologyIds: domain.ontologyIds,
    primaryOntologyId: domain.ontologyIds[0],
    ontologyOverriddenByUser: true,
    caseType: domain.caseType,
    caseTypeLocked: true,
    domain: domain.domainId,
    domainOverriddenByUser: true,
    workflowPath: work.workflowPath,
    workflowPathLabel: work.label,
    semanticaLayer: {
      enabled: true,
      adapterVersion: SEMANTICA_ADAPTER_VERSION,
      serviceBoundary: 'future-python-or-rest-worker',
    },
    semanticaContextGraph,
  };
}

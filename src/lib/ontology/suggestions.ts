import type { OntologyId } from '@/lib/ontology/types';
import type { UserRole } from '@/types/context';

export const MAX_ACTIVE_ONTOLOGIES = 3;

export const ROLE_ONTOLOGY_PRIORITIES: Record<UserRole, OntologyId[]> = {
  diplomat: ['conflict', 'governance', 'narrative'],
  mediator: ['mediation', 'conflict'],
  analyst: ['conflict', 'narrative'],
  researcher: ['narrative', 'conflict'],
  policy_advisor: ['governance', 'conflict'],
  human_rights_officer: ['human-rights', 'legal'],
  sanctions_analyst: ['economic', 'governance'],
  humanitarian_coordinator: ['humanitarian', 'conflict'],
  treaty_lawyer: ['legal', 'governance'],
  defense_analyst: ['security', 'conflict'],
  other: ['conflict'],
};

export function suggestOntologiesForRole(role: UserRole | null | undefined, history: OntologyId[] = []): OntologyId[] {
  const base = ROLE_ONTOLOGY_PRIORITIES[role ?? 'other'] ?? ROLE_ONTOLOGY_PRIORITIES.other;
  return normalizeOntologySelection([...history, ...base]);
}

export function normalizeOntologySelection(input: OntologyId[]): OntologyId[] {
  const unique: OntologyId[] = [];
  for (const ontologyId of input) {
    if (!unique.includes(ontologyId)) unique.push(ontologyId);
    if (unique.length === MAX_ACTIVE_ONTOLOGIES) break;
  }
  return unique.length > 0 ? unique : ['conflict'];
}

export function primaryOntologyId(input: OntologyId[]): OntologyId {
  return normalizeOntologySelection(input)[0];
}

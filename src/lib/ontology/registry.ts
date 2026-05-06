import { TACITUS_CORE_PRIMITIVES, type TacitusCorePrimitive } from '@/lib/graph/core-primitives';
import { CONFLICT_ONTOLOGY } from '@/lib/ontology/conflict';
import { GOVERNANCE_ONTOLOGY } from '@/lib/ontology/governance';
import { MEDIATION_ONTOLOGY } from '@/lib/ontology/mediation';
import { NARRATIVE_ONTOLOGY } from '@/lib/ontology/narrative';
import type {
  CaseOntologyDefinition,
  OntologyId,
  OntologyMappingIssue,
  OntologyMappingSummary,
} from '@/lib/ontology/types';

export const CASE_ONTOLOGIES: CaseOntologyDefinition[] = [
  CONFLICT_ONTOLOGY,
  MEDIATION_ONTOLOGY,
  GOVERNANCE_ONTOLOGY,
  NARRATIVE_ONTOLOGY,
];

export function getOntology(id: OntologyId): CaseOntologyDefinition {
  const ontology = CASE_ONTOLOGIES.find((item) => item.id === id);
  if (!ontology) throw new Error(`Unknown ontology: ${id}`);
  return ontology;
}

export function getOntologyForDomain(domain: string | null | undefined): CaseOntologyDefinition {
  const normalized = (domain ?? '').trim().toLowerCase();
  return CASE_ONTOLOGIES.find((ontology) => ontology.domains.includes(normalized)) ?? CONFLICT_ONTOLOGY;
}

export function getPrimitiveSet(ontology: CaseOntologyDefinition): Set<TacitusCorePrimitive> {
  return new Set(ontology.nodeTypes.map((node) => node.primitive));
}

export function summarizeOntologyMapping(ontology: CaseOntologyDefinition): OntologyMappingSummary {
  const covered = getPrimitiveSet(ontology);
  const coveredPrimitives = TACITUS_CORE_PRIMITIVES.filter((primitive) => covered.has(primitive));
  const missingPrimitives = TACITUS_CORE_PRIMITIVES.filter((primitive) => !covered.has(primitive));
  const issues: OntologyMappingIssue[] = [];

  if (missingPrimitives.length > 0) {
    issues.push({
      severity: 'warn',
      validatorId: `${ontology.id}.primitive-coverage`,
      message: `Missing core primitives: ${missingPrimitives.join(', ')}`,
    });
  }

  for (const edge of ontology.edgeTypes) {
    const missingFrom = edge.from.filter((primitive) => !covered.has(primitive));
    const missingTo = edge.to.filter((primitive) => !covered.has(primitive));
    if (missingFrom.length || missingTo.length) {
      issues.push({
        severity: 'warn',
        validatorId: `${ontology.id}.${edge.id}.primitive-link`,
        message: `${edge.label} references primitives not exposed by node types.`,
      });
    }
  }

  return {
    ontologyId: ontology.id,
    primitiveCoverage: coveredPrimitives.length / TACITUS_CORE_PRIMITIVES.length,
    coveredPrimitives,
    missingPrimitives,
    issues,
  };
}

export function auditOntologyRegistry(): OntologyMappingSummary[] {
  return CASE_ONTOLOGIES.map(summarizeOntologyMapping);
}

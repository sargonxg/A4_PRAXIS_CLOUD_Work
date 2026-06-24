import { TACITUS_CORE_PRIMITIVES, type TacitusCorePrimitive } from '@/lib/graph/core-primitives';
import { CONFLICT_ONTOLOGY } from '@/lib/ontology/conflict';
import { ECONOMIC_ONTOLOGY } from '@/lib/ontology/economic';
import { GOVERNANCE_ONTOLOGY } from '@/lib/ontology/governance';
import { HUMAN_RIGHTS_ONTOLOGY } from '@/lib/ontology/human-rights';
import { HUMANITARIAN_ONTOLOGY } from '@/lib/ontology/humanitarian';
import { LEGAL_ONTOLOGY } from '@/lib/ontology/legal';
import { MEDIATION_ONTOLOGY } from '@/lib/ontology/mediation';
import { NARRATIVE_ONTOLOGY } from '@/lib/ontology/narrative';
import { SECURITY_ONTOLOGY } from '@/lib/ontology/security';
import {
  UNIVERSAL_CONTESTATION_NODE_TYPES,
  UNIVERSAL_EDGE_TYPES,
  UNIVERSAL_READINESS_VALIDATORS,
} from '@/lib/ontology/universal';
import type {
  CaseOntologyDefinition,
  OntologyId,
  OntologyMappingIssue,
  OntologyMappingSummary,
} from '@/lib/ontology/types';

function withUniversalOntologyVocabulary(ontology: CaseOntologyDefinition): CaseOntologyDefinition {
  const nodeTypes = [...ontology.nodeTypes];
  for (const node of UNIVERSAL_CONTESTATION_NODE_TYPES) {
    if (!nodeTypes.some((item) => item.id === node.id)) nodeTypes.push(node);
  }

  const edgeById = new Map(ontology.edgeTypes.map((edge) => [edge.id, edge]));
  for (const edge of UNIVERSAL_EDGE_TYPES) {
    const existing = edgeById.get(edge.id);
    edgeById.set(edge.id, existing ? { ...edge, ...existing, category: edge.category, direction: edge.direction } : edge);
  }

  const validators = [...ontology.validators];
  for (const validator of UNIVERSAL_READINESS_VALIDATORS) {
    if (!validators.some((item) => item.id === validator.id)) validators.push(validator);
  }

  return {
    ...ontology,
    nodeTypes,
    edgeTypes: Array.from(edgeById.values()),
    validators,
  };
}

export const CASE_ONTOLOGIES: CaseOntologyDefinition[] = [
  CONFLICT_ONTOLOGY,
  MEDIATION_ONTOLOGY,
  GOVERNANCE_ONTOLOGY,
  NARRATIVE_ONTOLOGY,
  HUMAN_RIGHTS_ONTOLOGY,
  ECONOMIC_ONTOLOGY,
  HUMANITARIAN_ONTOLOGY,
  LEGAL_ONTOLOGY,
  SECURITY_ONTOLOGY,
].map(withUniversalOntologyVocabulary);

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

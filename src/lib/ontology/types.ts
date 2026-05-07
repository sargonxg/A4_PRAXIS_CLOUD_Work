import type { TacitusCorePrimitive } from '@/lib/graph/core-primitives';

export type OntologyId =
  | 'conflict'
  | 'mediation'
  | 'governance'
  | 'narrative'
  | 'human-rights'
  | 'economic'
  | 'humanitarian'
  | 'legal'
  | 'security';

export const ONTOLOGY_IDS: OntologyId[] = [
  'conflict',
  'mediation',
  'governance',
  'narrative',
  'human-rights',
  'economic',
  'humanitarian',
  'legal',
  'security',
];

export function isOntologyId(value: unknown): value is OntologyId {
  return typeof value === 'string' && (ONTOLOGY_IDS as string[]).includes(value);
}

export interface OntologyNodeType {
  id: string;
  label: string;
  primitive: TacitusCorePrimitive;
  description: string;
}

export interface OntologyEdgeType {
  id: string;
  label: string;
  from: TacitusCorePrimitive[];
  to: TacitusCorePrimitive[];
  description: string;
}

export interface OntologyValidator {
  id: string;
  label: string;
  severity: 'info' | 'warn';
  description: string;
}

export interface CaseOntologyDefinition {
  id: OntologyId;
  version: string;
  label: string;
  description: string;
  domains: string[];
  nodeTypes: OntologyNodeType[];
  edgeTypes: OntologyEdgeType[];
  validators: OntologyValidator[];
  recommendedToolIds: string[];
}

export interface OntologyMappingIssue {
  severity: 'info' | 'warn';
  message: string;
  validatorId: string;
}

export interface OntologyMappingSummary {
  ontologyId: OntologyId;
  primitiveCoverage: number;
  coveredPrimitives: TacitusCorePrimitive[];
  missingPrimitives: TacitusCorePrimitive[];
  issues: OntologyMappingIssue[];
}

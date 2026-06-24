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
  gapObject?: boolean;
  attributes?: Array<{
    id: string;
    label: string;
    description: string;
    required?: boolean;
  }>;
}

export interface OntologyEdgeType {
  id: string;
  label: string;
  from: TacitusCorePrimitive[];
  to: TacitusCorePrimitive[];
  description: string;
  category?: 'domain' | 'evidence' | 'temporal' | 'causal';
  direction?: 'directed';
  requiresEvidenceRefs?: boolean;
  confidenceCap?: number;
  directSourceStatementMayExceedCap?: boolean;
  capsuleCausalRelation?: 'causes' | 'enables' | 'blocks' | 'escalates' | 'de-escalates' | 'correlates';
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

export interface OntologyPathTemplateStep {
  from: TacitusCorePrimitive[];
  edgeTypeId: string;
  to: TacitusCorePrimitive[];
  note?: string;
}

export interface OntologyPathTemplate {
  id: string;
  label: string;
  ontologyIds: OntologyId[];
  description: string;
  steps: OntologyPathTemplateStep[];
}

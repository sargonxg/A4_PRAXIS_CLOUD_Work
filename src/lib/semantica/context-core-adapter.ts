import type { ContextDomainOption, ContextCreateDraft, ContextWorkOption } from '@/lib/contexts/context-create-payload';

export const SEMANTICA_CONTEXT_GRAPH_SCHEMA_VERSION = 'praxis-semantica-context-core.v1';
export const SEMANTICA_ADAPTER_VERSION = 'praxis-semantica-adapter.2026-05-11';
export const SEMANTICA_TARGET_VERSION = '0.5.x';

export type SemanticaContextNodeType =
  | 'context_core'
  | 'user_core'
  | 'domain_ontology'
  | 'work_ontology'
  | 'case_type'
  | 'frame_statement';

export interface SemanticaContextProvenance {
  source: 'context-create-wizard' | 'server-sanitized';
  sourceField: string;
  capturedAt?: string;
  confidence: number;
}

export interface SemanticaContextNode {
  id: string;
  type: SemanticaContextNodeType;
  label: string;
  text?: string;
  properties: Record<string, string | number | boolean | string[]>;
  provenance: SemanticaContextProvenance;
}

export interface SemanticaContextEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type:
    | 'has_domain_ontology'
    | 'has_work_ontology'
    | 'has_primary_ontology'
    | 'has_case_type'
    | 'contains_frame_statement'
    | 'scoped_by_user_core'
    | 'supports_context_core';
  label: string;
  properties: Record<string, string | number | boolean | string[]>;
  provenance: SemanticaContextProvenance;
}

export interface SemanticaContextGraphQuality {
  nodeCount: number;
  edgeCount: number;
  hasContextRoot: boolean;
  hasDomainOntology: boolean;
  hasWorkOntology: boolean;
  hasFrame: boolean;
  semanticaReady: boolean;
}

export interface SemanticaContextGraph {
  schemaVersion: typeof SEMANTICA_CONTEXT_GRAPH_SCHEMA_VERSION;
  adapterVersion: typeof SEMANTICA_ADAPTER_VERSION;
  targetSemanticaVersion: typeof SEMANTICA_TARGET_VERSION;
  generatedBy: 'praxis-context-create';
  contextCoreId: string;
  entities: SemanticaContextNode[];
  relationships: SemanticaContextEdge[];
  quality: SemanticaContextGraphQuality;
  intendedSemanticaCapabilities: Array<
    | 'context_graph'
    | 'provenance'
    | 'entity_resolution'
    | 'conflict_detection'
    | 'multi_hop_retrieval'
    | 'policy_trace'
  >;
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled-context';
}

function provenance(sourceField: string): SemanticaContextProvenance {
  return {
    source: 'context-create-wizard',
    sourceField,
    confidence: 1,
  };
}

function frameStatements(frame: string): string[] {
  const trimmed = frame.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function buildSemanticaContextGraph({
  draft,
  domain,
  work,
}: {
  draft: ContextCreateDraft;
  domain: ContextDomainOption;
  work: ContextWorkOption;
}): SemanticaContextGraph {
  const name = draft.name.trim();
  const frame = draft.frame.trim();
  const contextCoreId = `context-core:${slug(name)}`;
  const userCoreId = `user-core:${work.id}`;
  const domainNodeId = `domain-ontology:${domain.domainId}`;
  const workNodeId = `work-ontology:${work.workflowPath}`;
  const caseTypeNodeId = `case-type:${domain.caseType}`;
  const primaryOntologyNodeId = `ontology:${domain.ontologyIds[0]}`;
  const statements = frameStatements(frame);

  const entities: SemanticaContextNode[] = [
    {
      id: contextCoreId,
      type: 'context_core',
      label: name,
      text: frame || `Initial context frame for ${name}.`,
      properties: {
        name,
        regionFallback: domain.regionFallback,
        ownerScope: 'authenticated-user',
        status: 'active',
      },
      provenance: provenance('name'),
    },
    {
      id: userCoreId,
      type: 'user_core',
      label: work.label,
      properties: {
        userRole: work.userRole,
        workflowPath: work.workflowPath,
      },
      provenance: provenance('work'),
    },
    {
      id: domainNodeId,
      type: 'domain_ontology',
      label: domain.label,
      properties: {
        domainId: domain.domainId,
        ontologyIds: domain.ontologyIds,
      },
      provenance: provenance('domain'),
    },
    {
      id: workNodeId,
      type: 'work_ontology',
      label: work.label,
      properties: {
        workflowPath: work.workflowPath,
      },
      provenance: provenance('work'),
    },
    {
      id: caseTypeNodeId,
      type: 'case_type',
      label: domain.caseType,
      properties: {
        caseType: domain.caseType,
        locked: true,
      },
      provenance: provenance('domain.caseType'),
    },
    {
      id: primaryOntologyNodeId,
      type: 'domain_ontology',
      label: domain.ontologyIds[0],
      properties: {
        ontologyId: domain.ontologyIds[0],
        primary: true,
      },
      provenance: provenance('domain.ontologyIds'),
    },
    ...statements.map((statement, index): SemanticaContextNode => ({
      id: `${contextCoreId}:frame:${index + 1}`,
      type: 'frame_statement',
      label: `Frame statement ${index + 1}`,
      text: statement,
      properties: {
        ordinal: index + 1,
      },
      provenance: provenance('frame'),
    })),
  ];

  const baseEdges: SemanticaContextEdge[] = [
    edge(contextCoreId, domainNodeId, 'has_domain_ontology', 'uses domain ontology', 'domain'),
    edge(contextCoreId, workNodeId, 'has_work_ontology', 'uses work ontology', 'work'),
    edge(contextCoreId, primaryOntologyNodeId, 'has_primary_ontology', 'uses primary ontology', 'domain.ontologyIds'),
    edge(contextCoreId, caseTypeNodeId, 'has_case_type', 'has case type', 'domain.caseType'),
    edge(contextCoreId, userCoreId, 'scoped_by_user_core', 'scoped by user core', 'work'),
    edge(userCoreId, contextCoreId, 'supports_context_core', 'supports context core', 'work'),
  ];

  const frameEdges = statements.map((_, index) =>
    edge(contextCoreId, `${contextCoreId}:frame:${index + 1}`, 'contains_frame_statement', 'contains frame statement', 'frame'),
  );
  const relationships = [...baseEdges, ...frameEdges];

  return {
    schemaVersion: SEMANTICA_CONTEXT_GRAPH_SCHEMA_VERSION,
    adapterVersion: SEMANTICA_ADAPTER_VERSION,
    targetSemanticaVersion: SEMANTICA_TARGET_VERSION,
    generatedBy: 'praxis-context-create',
    contextCoreId,
    entities,
    relationships,
    quality: {
      nodeCount: entities.length,
      edgeCount: relationships.length,
      hasContextRoot: true,
      hasDomainOntology: true,
      hasWorkOntology: true,
      hasFrame: statements.length > 0,
      semanticaReady: Boolean(name && domain.domainId && work.workflowPath),
    },
    intendedSemanticaCapabilities: [
      'context_graph',
      'provenance',
      'entity_resolution',
      'conflict_detection',
      'multi_hop_retrieval',
      'policy_trace',
    ],
  };
}

function edge(
  sourceId: string,
  targetId: string,
  type: SemanticaContextEdge['type'],
  label: string,
  sourceField: string,
): SemanticaContextEdge {
  return {
    id: `${sourceId}->${type}->${targetId}`,
    sourceId,
    targetId,
    type,
    label,
    properties: {
      createdBy: 'praxis-context-create',
    },
    provenance: provenance(sourceField),
  };
}

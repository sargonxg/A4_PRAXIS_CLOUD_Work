import { TACITUS_CORE_PRIMITIVES, type TacitusCorePrimitive } from '@/lib/graph/core-primitives';
import { buildWorkbenchCaseGraph } from '@/lib/graph/workbench-case-graph';
import { getOntology, getOntologyForDomain, summarizeOntologyMapping } from '@/lib/ontology/registry';
import {
  UNIVERSAL_CAUSAL_EDGE_TYPES,
  UNIVERSAL_READINESS_VALIDATORS,
  UNIVERSAL_TEMPORAL_EDGE_TYPES,
} from '@/lib/ontology/universal';
import type { CaseOntologyDefinition, OntologyId } from '@/lib/ontology/types';
import { isOntologyId } from '@/lib/ontology/types';
import type { CaseModule } from '@/types/case-module';

export interface OntologyPrimitiveCoverage {
  primitive: TacitusCorePrimitive;
  count: number;
  hint: string;
}

export interface OntologyValidatorStatus {
  id: string;
  label: string;
  passed: boolean;
  severity: 'info' | 'warn';
  hint: string;
}

export interface ActiveOntologyStatus {
  ontology: CaseOntologyDefinition;
  role: 'primary' | 'secondary';
  passRate: number;
  primitiveCoverage: number;
  primitives: OntologyPrimitiveCoverage[];
  validators: OntologyValidatorStatus[];
  recommendedToolIds: string[];
  sourceAffinity: string[];
}

export interface OntologyReadinessNode {
  id: string;
  primitive?: TacitusCorePrimitive;
  entityType?: string;
  label?: string;
  validAt?: string | null;
  occurredAt?: string | null;
  date?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  asOf?: string | null;
  sourceReceiptIds?: string[];
  evidenceRefs?: string[];
  usedInAnswer?: boolean;
  explicitUncertainty?: boolean;
  uncertaintyType?: string | null;
  reviewState?: string | null;
}

export interface OntologyReadinessEdge {
  id: string;
  source: string;
  target: string;
  relationshipType?: string | null;
  label?: string | null;
  sourceReceiptIds?: string[];
  evidenceRefs?: string[];
  reviewState?: string | null;
  confidence?: number | null;
  directlySourceStated?: boolean;
}

export interface OntologyReadinessIssue {
  validatorId: string;
  severity: 'info' | 'warn';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface OntologyReadinessResult {
  passed: boolean;
  issues: OntologyReadinessIssue[];
}

const PRIMITIVE_TYPE_MAP: Record<string, TacitusCorePrimitive> = {
  actor: 'Actor',
  claim: 'Claim',
  source: 'Event',
  evidence: 'Event',
  verdict: 'Commitment',
  case: 'Narrative',
};

export function getActiveOntologyStatuses(caseModule: CaseModule): ActiveOntologyStatus[] {
  return getOntologyStatusesForIds(caseModule, activeOntologyIds(caseModule));
}

export function getOntologyStatusesForIds(caseModule: CaseModule, activeIds: OntologyId[]): ActiveOntologyStatus[] {
  const graph = buildWorkbenchCaseGraph(caseModule);
  const primitiveCounts = Object.fromEntries(TACITUS_CORE_PRIMITIVES.map((primitive) => [primitive, 0])) as Record<TacitusCorePrimitive, number>;
  for (const node of graph.nodes) {
    const primitive = PRIMITIVE_TYPE_MAP[node.type];
    if (primitive) primitiveCounts[primitive] += 1;
  }

  return activeIds.slice(0, 3).map((id, index) => {
    const ontology = getOntology(id);
    const mapping = summarizeOntologyMapping(ontology);
    const primitives = TACITUS_CORE_PRIMITIVES.map((primitive) => ({
      primitive,
      count: primitiveCounts[primitive],
      hint: primitiveCounts[primitive] > 0
        ? `${primitiveCounts[primitive]} ${primitive} node${primitiveCounts[primitive] === 1 ? '' : 's'} visible in this case.`
        : `${ontology.label}: no ${primitive} nodes yet. Review Context or run a recommended tool before relying on this lens.`,
    }));
    const validators = ontology.validators.map((validator) => {
      const requiredHasData = mapping.coveredPrimitives.some((primitive) => primitiveCounts[primitive] > 0);
      if (UNIVERSAL_READINESS_VALIDATORS.some((item) => item.id === validator.id)) {
        const readiness = validateOntologyReadiness({
          ontologyIds: [id],
          nodes: graph.nodes.map((node) => ({
            id: node.id,
            primitive: PRIMITIVE_TYPE_MAP[node.type],
            label: node.label,
            validAt: node.occurredAt,
            sourceReceiptIds: node.provenanceCount > 0 ? [`provenance:${node.id}`] : [],
          })),
          edges: [],
        });
        const issues = readiness.issues.filter((issue) => issue.validatorId === validator.id);
        return {
          id: validator.id,
          label: validator.label,
          passed: issues.length === 0,
          severity: validator.severity,
          hint: issues[0]?.message ?? 'Readiness validator is available for serialized graph packets.',
        };
      }
      return {
        id: validator.id,
        label: validator.label,
        passed: requiredHasData && graph.provenanceCoverage >= 0.35,
        severity: validator.severity,
        hint: requiredHasData
          ? 'Validator has matching primitives in the current graph.'
          : 'No matching graph primitive exists yet; add context or promote reviewed graph proposals.',
      };
    });
    const passRate = validators.length
      ? validators.filter((validator) => validator.passed).length / validators.length
      : mapping.primitiveCoverage;
    return {
      ontology,
      role: index === 0 ? 'primary' : 'secondary',
      passRate,
      primitiveCoverage: primitives.filter((item) => item.count > 0 && mapping.coveredPrimitives.includes(item.primitive)).length / TACITUS_CORE_PRIMITIVES.length,
      primitives,
      validators,
      recommendedToolIds: ontology.recommendedToolIds.slice(0, 4),
      sourceAffinity: sourceAffinityFor(id),
    };
  });
}

const CAUSAL_EDGE_IDS = new Set(UNIVERSAL_CAUSAL_EDGE_TYPES.map((edge) => edge.id));
const TEMPORAL_EDGE_IDS = new Set(UNIVERSAL_TEMPORAL_EDGE_TYPES.map((edge) => edge.id));
const PROPOSAL_REVIEW_STATES = new Set(['proposed', 'advisory', 'missing']);

function normalizeRelationshipType(edge: OntologyReadinessEdge): string {
  return (edge.relationshipType ?? edge.label ?? '').trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
}

function nodePrimitive(node: OntologyReadinessNode | undefined): TacitusCorePrimitive | null {
  if (!node) return null;
  if (node.primitive && TACITUS_CORE_PRIMITIVES.includes(node.primitive)) return node.primitive;
  const normalized = (node.entityType ?? '').trim().toLowerCase().replace(/[_\s-]+/g, '');
  return TACITUS_CORE_PRIMITIVES.find((primitive) => primitive.toLowerCase() === normalized) ?? null;
}

function hasRefs(value: { sourceReceiptIds?: string[]; evidenceRefs?: string[] }): boolean {
  return Boolean(value.sourceReceiptIds?.length || value.evidenceRefs?.length);
}

function hasValidTime(node: OntologyReadinessNode): boolean {
  return [node.validAt, node.occurredAt, node.date, node.validFrom, node.asOf].some((value) => (
    typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value))
  ));
}

function isExplicitlyUncertain(node: OntologyReadinessNode): boolean {
  return Boolean(node.explicitUncertainty || node.uncertaintyType || node.reviewState === 'missing' || node.reviewState === 'advisory');
}

export function validateOntologyReadiness(input: {
  ontologyIds: OntologyId[];
  nodes: OntologyReadinessNode[];
  edges: OntologyReadinessEdge[];
}): OntologyReadinessResult {
  const nodesById = new Map(input.nodes.map((node) => [node.id, node]));
  const allowedEdgeIds = new Set<string>();
  for (const ontologyId of input.ontologyIds.length ? input.ontologyIds : (['conflict'] as OntologyId[])) {
    for (const edge of getOntology(ontologyId).edgeTypes) {
      allowedEdgeIds.add(edge.id);
    }
  }

  const issues: OntologyReadinessIssue[] = [];

  for (const edge of input.edges) {
    const relationshipType = normalizeRelationshipType(edge);
    if (CAUSAL_EDGE_IDS.has(relationshipType)) {
      if (!hasRefs(edge)) {
        issues.push({
          validatorId: 'readiness.causal-edge-evidence',
          severity: 'warn',
          edgeId: edge.id,
          message: `Causal edge ${edge.id} needs evidenceRefs or sourceReceiptIds.`,
        });
      }
      const definition = UNIVERSAL_CAUSAL_EDGE_TYPES.find((item) => item.id === relationshipType);
      if (
        typeof edge.confidence === 'number'
        && definition?.confidenceCap !== undefined
        && edge.confidence > definition.confidenceCap
        && !edge.directlySourceStated
      ) {
        issues.push({
          validatorId: 'readiness.causal-confidence-cap',
          severity: 'warn',
          edgeId: edge.id,
          message: `Causal edge ${edge.id} exceeds confidence cap ${definition.confidenceCap} without a direct source statement.`,
        });
      }
    }

    if (TEMPORAL_EDGE_IDS.has(relationshipType)) {
      for (const node of [nodesById.get(edge.source), nodesById.get(edge.target)]) {
        if (node && nodePrimitive(node) === 'Event' && !hasValidTime(node)) {
          issues.push({
            validatorId: 'readiness.temporal-event-time',
            severity: 'warn',
            nodeId: node.id,
            edgeId: edge.id,
            message: `Event node ${node.id} is used in a temporal chain but lacks valid time metadata.`,
          });
        }
      }
    }

    if (!allowedEdgeIds.has(relationshipType) && !PROPOSAL_REVIEW_STATES.has(edge.reviewState ?? '')) {
      issues.push({
        validatorId: 'readiness.off-schema-edge-proposal',
        severity: 'warn',
        edgeId: edge.id,
        message: `Off-schema edge ${edge.id} must remain proposed, advisory, or missing before it is treated as fact.`,
      });
    }
  }

  for (const node of input.nodes) {
    if (node.usedInAnswer && nodePrimitive(node) === 'Claim' && !hasRefs(node) && !isExplicitlyUncertain(node)) {
      issues.push({
        validatorId: 'readiness.answer-claim-receipt',
        severity: 'warn',
        nodeId: node.id,
        message: `Claim node ${node.id} is used in an answer but lacks receipts or explicit uncertainty.`,
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

export function activeOntologyIds(caseModule: CaseModule): OntologyId[] {
  const situation = caseModule.situation;
  const ids = [
    situation.primaryOntologyId,
    situation.ontologyId,
    ...(situation.ontologyIds ?? []),
    getOntologyForDomain(caseModule.manifest.domain).id,
  ].filter(isOntologyId);
  const unique: OntologyId[] = [];
  for (const id of ids) {
    if (!unique.includes(id)) unique.push(id);
  }
  return unique.slice(0, 3);
}

function sourceAffinityFor(id: OntologyId): string[] {
  const map: Record<OntologyId, string[]> = {
    conflict: ['wire reporting', 'source-linked event reporting-style event data', 'expert analysis analysis'],
    mediation: ['party statements', 'agreement texts', 'process design notes'],
    governance: ['UN documents', 'mandates', 'voting records'],
    narrative: ['local media', 'social channels', 'fact-check traces'],
    'human-rights': ['OHCHR reports', 'NGO documentation', 'legal filings'],
    economic: ['economic institution', 'IMF', 'customs/trade data'],
    humanitarian: ['OCHA', 'humanitarian web reporting', 'displacement reporting/WHO field reports'],
    legal: ['treaties', 'court records', 'sanctions notices'],
    security: ['incident reports', 'military statements', 'maritime/aviation notices'],
  };
  return map[id];
}

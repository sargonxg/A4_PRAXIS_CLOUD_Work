import type { TacitusCorePrimitive } from '@/lib/graph/core-primitives';
import { TACITUS_CORE_PRIMITIVES } from '@/lib/graph/core-primitives';
import { getOntology } from '@/lib/ontology/registry';
import { getPathTemplatesForOntology } from '@/lib/ontology/path-templates';
import type { OntologyEdgeType, OntologyId } from '@/lib/ontology/types';
import { isOntologyId } from '@/lib/ontology/types';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

export type AgentContextBudgetTier = 'tiny' | 'standard' | 'expanded';
export type OmittedContextReason = 'low_relevance' | 'stale' | 'unsupported' | 'duplicate' | 'budget';
export type ConfidenceKind = 'EXTRACTED' | 'INFERRED' | 'ASSESSED';
export type ReviewState = 'canonical' | 'reviewed' | 'proposed' | 'advisory' | 'missing';

export interface NormalizedGraphNode {
  id: string;
  label: string;
  entityType: string;
  primitive: TacitusCorePrimitive;
  reviewState: ReviewState;
  confidence: number | null;
  confidenceKind: ConfidenceKind;
  sourceReceiptIds: string[];
  recordedAt?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  invalidatedAt?: string | null;
  supersededBy?: string | null;
  generatedBy?: { actorType?: string } | null;
  salienceScore: number;
  salienceSignals: string[];
}

export interface NormalizedGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationshipType: string;
  reviewState: ReviewState;
  confidence: number | null;
  confidenceKind: ConfidenceKind;
  sourceReceiptIds: string[];
  recordedAt?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  invalidatedAt?: string | null;
  supersededBy?: string | null;
  directlySourceStated: boolean;
  judgeRationale?: string | null;
  salienceScore: number;
  salienceSignals: string[];
}

export interface NormalizedSourceReceipt {
  id: string;
  title: string;
  url?: string | null;
  publisher?: string | null;
  date?: string | null;
  reliabilityTier?: number | null;
  stale?: boolean;
  excerpt?: string | null;
  trust?: number | null;
  salienceScore: number;
}

export interface NormalizedClaimCard {
  id: string;
  text: string;
  type: string;
  status: ReviewState;
  confidence: number | null;
  confidenceKind: ConfidenceKind;
  validFrom?: string | null;
  validTo?: string | null;
  asOf?: string | null;
  recordedAt?: string | null;
  sourceReceiptIds: string[];
  contradicts: string[];
  linkedNodeIds: string[];
  linkedEdgeIds: string[];
  support?: string | null;
  caveat?: string | null;
  salienceScore: number;
  salienceSignals: string[];
}

export interface NormalizedTimelineAnchor {
  id: string;
  label: string;
  date: string;
  kind: string;
  sourceReceiptIds: string[];
  confidence: number | null;
}

export interface NormalizedCausalLink {
  id: string;
  cause: string;
  effect: string;
  relation: string;
  evidenceRefs: string[];
  confidence: number | null;
  caveat?: string | null;
}

export interface ReasoningPath {
  id: string;
  purpose: 'multi-hop' | 'comparison' | 'causal' | 'provenance';
  nodeIds: string[];
  edgeIds: string[];
  whySelected: string;
  sourceReceiptIds: string[];
  salienceScore: number;
}

export interface OmittedContextItem {
  id: string;
  kind: 'node' | 'edge' | 'claim' | 'source' | 'path' | 'causal';
  reason: OmittedContextReason;
  detail: string;
}

export interface SelectedAgentContext {
  nodes: NormalizedGraphNode[];
  edges: NormalizedGraphEdge[];
  claims: NormalizedClaimCard[];
  sources: NormalizedSourceReceipt[];
  paths: ReasoningPath[];
  timeline: NormalizedTimelineAnchor[];
  causalLinks: NormalizedCausalLink[];
}

export interface AgentContextSelectionResult extends SelectedAgentContext {
  omitted: OmittedContextItem[];
  budget: AgentContextBudget;
  activeOntologyIds: OntologyId[];
  ontologyStackIds: string[];
}

export interface AgentContextBudget {
  tier: AgentContextBudgetTier;
  maxTokens: number;
  maxClaims: number;
  maxNodes: number;
  maxEdges: number;
  maxSources: number;
  maxPaths: number;
  maxCausalLinks: number;
  includeSourceIndex: boolean;
}

export interface SelectAgentContextSubgraphInput {
  capsule: PraxisCapsule;
  userQuery?: string | null;
  budgetTier: AgentContextBudgetTier;
  requestTime: string;
}

const BUDGETS: Record<AgentContextBudgetTier, AgentContextBudget> = {
  tiny: {
    tier: 'tiny',
    maxTokens: 4_500,
    maxClaims: 5,
    maxNodes: 8,
    maxEdges: 8,
    maxSources: 8,
    maxPaths: 3,
    maxCausalLinks: 3,
    includeSourceIndex: false,
  },
  standard: {
    tier: 'standard',
    maxTokens: 7_500,
    maxClaims: 12,
    maxNodes: 20,
    maxEdges: 30,
    maxSources: 20,
    maxPaths: 6,
    maxCausalLinks: 8,
    includeSourceIndex: true,
  },
  expanded: {
    tier: 'expanded',
    maxTokens: 12_000,
    maxClaims: 24,
    maxNodes: 60,
    maxEdges: 80,
    maxSources: 40,
    maxPaths: 12,
    maxCausalLinks: 16,
    includeSourceIndex: true,
  },
};

const NEGATIVE_RELATIONSHIPS = new Set([
  'contradicts_claim',
  'contests',
  'blocks',
  'violates',
  'violates_after',
  'escalates',
]);

const CAUSAL_RELATIONSHIPS = new Set(['causes', 'enables', 'blocks', 'escalates', 'de_escalates', 'de-escalates', 'correlates']);
const ADVISORY_REVIEW_STATES = new Set(['advisory', 'missing', 'proposed']);

export function selectAgentContextSubgraph(input: SelectAgentContextSubgraphInput): AgentContextSelectionResult {
  const budget = BUDGETS[input.budgetTier];
  const queryTokens = tokenize(input.userQuery ?? '');
  const activeOntologyIds = getActiveOntologyIds(input.capsule);
  const ontologyStackIds = uniqueStrings([
    ...activeOntologyIds,
    input.capsule.activeOntologyStackId,
  ]);
  const ontologyEdgeTypes = activeOntologyIds.flatMap((id) => getOntology(id).edgeTypes);
  const pathTemplateEdgeIds = new Set(activeOntologyIds.flatMap((id) =>
    getPathTemplatesForOntology(id).flatMap((template) => template.steps.map((step) => step.edgeTypeId)),
  ));

  const sources = normalizeSources(input.capsule);
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const nodes = normalizeNodes(input.capsule, activeOntologyIds);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const degree = new Map<string, number>();
  const omitted: OmittedContextItem[] = [];
  const edges = normalizeEdges(input.capsule);
  for (const edge of edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }

  const scoredNodes = nodes
    .filter((node) => includeSourcedRow(node, omitted, 'node'))
    .map((node) => scoreNode(node, {
      queryTokens,
      activeOntologyIds,
      degree: degree.get(node.id) ?? 0,
      requestTime: input.requestTime,
      sourceById,
    }))
    .sort(compareSalience);

  const scoredEdges = edges
    .filter((edge) => includeSourcedRow(edge, omitted, 'edge'))
    .map((edge) => scoreEdge(edge, {
      queryTokens,
      nodeById,
      activeOntologyIds,
      ontologyEdgeTypes,
      pathTemplateEdgeIds,
      requestTime: input.requestTime,
      sourceById,
    }))
    .sort(compareSalience);

  const claims = normalizeClaims(input.capsule, scoredNodes, scoredEdges, sources);
  const scoredClaims = claims
    .filter((claim) => includeClaimRow(claim, omitted))
    .map((claim) => scoreClaim(claim, { queryTokens, requestTime: input.requestTime, sourceById }))
    .sort(compareSalience);

  const selectedClaims = selectWithCoverage(scoredClaims, budget.maxClaims, 'Claim', omitted, 'claim');
  const selectedNodes = selectWithCoverage(scoredNodes, budget.maxNodes, 'node', omitted, 'node');
  const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
  const selectedEdges = scoredEdges
    .filter((edge) => selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target) || NEGATIVE_RELATIONSHIPS.has(edge.relationshipType))
    .slice(0, budget.maxEdges);
  for (const edge of scoredEdges.slice(budget.maxEdges)) {
    omitted.push({ id: edge.id, kind: 'edge', reason: 'budget', detail: `Exceeded ${budget.tier} edge limit ${budget.maxEdges}.` });
  }

  const paths = buildReasoningPaths(selectedNodes, selectedEdges, queryTokens, budget.maxPaths);
  const causalLinks = normalizeCausalLinks(input.capsule)
    .map(capCausalConfidence)
    .sort((a, b) => compareNumber(b.confidence, a.confidence) || a.id.localeCompare(b.id))
    .slice(0, budget.maxCausalLinks);
  const sourceIds = uniqueStrings([
    ...selectedClaims.flatMap((claim) => [...claim.sourceReceiptIds, ...claim.contradicts]),
    ...selectedNodes.flatMap((node) => node.sourceReceiptIds),
    ...selectedEdges.flatMap((edge) => edge.sourceReceiptIds),
    ...paths.flatMap((path) => path.sourceReceiptIds),
    ...causalLinks.flatMap((link) => link.evidenceRefs),
  ]);
  const selectedSources = sourceIds
    .map((id) => sourceById.get(id) ?? sourceFromId(id))
    .sort((a, b) => compareNumber(b.salienceScore, a.salienceScore) || a.id.localeCompare(b.id))
    .slice(0, budget.maxSources);
  for (const sourceId of sourceIds.slice(budget.maxSources)) {
    omitted.push({ id: sourceId, kind: 'source', reason: 'budget', detail: `Exceeded ${budget.tier} source limit ${budget.maxSources}.` });
  }

  return {
    nodes: selectedNodes,
    edges: selectedEdges,
    claims: selectedClaims,
    sources: selectedSources,
    paths,
    timeline: normalizeTimeline(input.capsule)
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
      .slice(0, input.budgetTier === 'tiny' ? 3 : input.budgetTier === 'standard' ? 8 : 16),
    causalLinks,
    omitted: dedupeOmitted(omitted),
    budget,
    activeOntologyIds,
    ontologyStackIds,
  };
}

export function agentContextBudgetForTier(tier: AgentContextBudgetTier): AgentContextBudget {
  return BUDGETS[tier];
}

export function normalizePrimitive(value: unknown, ontologyIds: OntologyId[] = []): TacitusCorePrimitive | null {
  const normalized = cleanString(value).toLowerCase().replace(/[_\s-]+/g, '');
  const direct = TACITUS_CORE_PRIMITIVES.find((primitive) => primitive.toLowerCase() === normalized);
  if (direct) return direct;
  for (const ontologyId of ontologyIds) {
    const ontology = getOntology(ontologyId);
    const nodeType = ontology.nodeTypes.find((type) => (
      type.id.toLowerCase().replace(/[_\s-]+/g, '') === normalized
      || type.label.toLowerCase().replace(/[_\s-]+/g, '') === normalized
    ));
    if (nodeType) return nodeType.primitive;
  }
  return null;
}

export function capCausalConfidence<T extends { confidence: number | null; relation?: string; relationshipType?: string; confidenceKind?: ConfidenceKind; directlySourceStated?: boolean; reviewState?: ReviewState }>(row: T): T {
  const relation = normalizeRelationship(row.relation ?? row.relationshipType ?? '');
  if (!CAUSAL_RELATIONSHIPS.has(relation) || typeof row.confidence !== 'number') return row;
  const canExceed = row.directlySourceStated && (row.reviewState === 'canonical' || row.reviewState === 'reviewed') && row.confidenceKind === 'EXTRACTED';
  return canExceed ? row : { ...row, confidence: Math.min(row.confidence, 0.75) };
}

export function getActiveOntologyIds(capsule: PraxisCapsule): OntologyId[] {
  const v3 = firstRecord(capsule.v3);
  const grounding = firstRecord(v3?.grounding);
  const v3Binding = firstRecord(grounding?.ontologyBinding);
  const rootBinding = firstRecord(capsule.ontologyBinding, v3Binding);
  const ids = uniqueStrings([
    ...arrayOfStrings(rootBinding?.ontologyIds),
    ...arrayOfStrings(v3Binding?.ontologyIds),
  ]).filter(isOntologyId);
  return ids.length ? ids.slice(0, 3) : ['governance'];
}

function normalizeSources(capsule: PraxisCapsule): NormalizedSourceReceipt[] {
  const v3 = firstRecord(capsule.v3);
  const sourceSpine = firstRecord(v3?.sourceSpine);
  const sourceRecords = [
    ...arrayOfRecords(capsule.sourceRefs),
    ...arrayOfRecords(sourceSpine?.sourceRefs),
  ];
  const byId = new Map<string, NormalizedSourceReceipt>();
  for (const source of sourceRecords) {
    const id = cleanString(source.sourceId ?? source.id);
    if (!id) continue;
    byId.set(id, {
      id,
      title: cleanString(source.label ?? source.title) || id,
      url: nullableString(source.url),
      publisher: nullableString(source.publisher),
      date: nullableString(source.date),
      reliabilityTier: numberOrNull(source.reliabilityTier),
      stale: Boolean(source.stale),
      excerpt: nullableString(source.snippet ?? source.excerpt ?? source.relevance),
      trust: sourceTrust(numberOrNull(source.reliabilityTier)),
      salienceScore: sourceQualityScore({
        reliabilityTier: numberOrNull(source.reliabilityTier),
        stale: Boolean(source.stale),
        date: nullableString(source.date),
      }, new Map()),
    });
  }

  for (const claim of claimRecords(capsule)) {
    for (const receipt of arrayOfRecords(claim.receipts)) {
      const id = cleanString(receipt.sourceId);
      if (!id) continue;
      const existing = byId.get(id);
      byId.set(id, {
        id,
        title: existing?.title ?? (cleanString(receipt.publisher) || id),
        url: existing?.url ?? nullableString(receipt.url),
        publisher: existing?.publisher ?? nullableString(receipt.publisher),
        date: existing?.date ?? nullableString(receipt.date),
        reliabilityTier: existing?.reliabilityTier ?? numberOrNull(receipt.reliabilityTier),
        stale: existing?.stale ?? false,
        excerpt: existing?.excerpt ?? nullableString(receipt.snippet),
        trust: existing?.trust ?? sourceTrust(numberOrNull(receipt.reliabilityTier)),
        salienceScore: existing?.salienceScore ?? 0.6,
      });
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function normalizeNodes(capsule: PraxisCapsule, ontologyIds: OntologyId[]): NormalizedGraphNode[] {
  return arrayOfRecords(graphRecord(capsule)?.nodes).map((node, index) => {
    const entityType = cleanString(node.entityType ?? node.type) || 'Claim';
    const primitive = normalizePrimitive(entityType, ontologyIds) ?? 'Claim';
    return {
      id: cleanString(node.id) || `N-${stableHash(`${entityType}:${cleanString(node.label)}:${index}`)}`,
      label: cleanString(node.label) || entityType,
      entityType,
      primitive,
      reviewState: reviewStateOf(node.reviewState),
      confidence: numberOrNull(node.confidence),
      confidenceKind: confidenceKindOf(node.confidenceKind),
      sourceReceiptIds: arrayOfStrings(node.sourceReceiptIds ?? node.evidenceRefs),
      recordedAt: nullableString(node.recordedAt),
      validFrom: nullableString(node.validFrom ?? node.occurredAt ?? node.date ?? node.asOf),
      validTo: nullableString(node.validTo ?? node.validUntil),
      invalidatedAt: nullableString(node.invalidatedAt),
      supersededBy: nullableString(node.supersededBy),
      generatedBy: firstRecord(node.generatedBy) as { actorType?: string } | null,
      salienceScore: 0,
      salienceSignals: [],
    };
  });
}

function normalizeEdges(capsule: PraxisCapsule): NormalizedGraphEdge[] {
  return arrayOfRecords(graphRecord(capsule)?.edges).map((edge, index) => {
    const relationshipType = normalizeRelationship(edge.relationshipType ?? edge.label) || 'related_to';
    return capCausalConfidence({
      id: cleanString(edge.id) || `E-${stableHash(`${cleanString(edge.source)}:${relationshipType}:${cleanString(edge.target)}:${index}`)}`,
      source: cleanString(edge.source),
      target: cleanString(edge.target),
      label: cleanString(edge.label) || relationshipType,
      relationshipType,
      reviewState: reviewStateOf(edge.reviewState),
      confidence: numberOrNull(edge.confidence),
      confidenceKind: confidenceKindOf(edge.confidenceKind),
      sourceReceiptIds: arrayOfStrings(edge.sourceReceiptIds ?? edge.evidenceRefs),
      recordedAt: nullableString(edge.recordedAt),
      validFrom: nullableString(edge.validFrom ?? edge.occurredAt ?? edge.date ?? edge.asOf),
      validTo: nullableString(edge.validTo ?? edge.validUntil),
      invalidatedAt: nullableString(edge.invalidatedAt),
      supersededBy: nullableString(edge.supersededBy),
      directlySourceStated: Boolean(edge.directlySourceStated),
      judgeRationale: nullableString(edge.judgeRationale ?? edge.rationale),
      salienceScore: 0,
      salienceSignals: [],
    });
  });
}

function normalizeClaims(
  capsule: PraxisCapsule,
  nodes: NormalizedGraphNode[],
  edges: NormalizedGraphEdge[],
  sources: NormalizedSourceReceipt[],
): NormalizedClaimCard[] {
  const sourceIds = new Set(sources.map((source) => source.id));
  const nodeClaims = nodes.filter((node) => node.primitive === 'Claim');
  const graphClaimByText = new Map(nodeClaims.map((node) => [normalizeText(node.label), node]));
  const claims = claimRecords(capsule).map((claim, index) => {
    const id = cleanString(claim.claimId ?? claim.id) || `CL-${stableHash(`${cleanString(claim.text)}:${index}`)}`;
    const sourceReceiptIds = uniqueStrings([
      ...arrayOfStrings(claim.sourceRefIds ?? claim.sourceReceiptIds),
      ...arrayOfRecords(claim.receipts).map((receipt) => cleanString(receipt.sourceId)).filter(Boolean),
    ]);
    const linkedNode = graphClaimByText.get(normalizeText(cleanString(claim.text)));
    const linkedNodeIds = linkedNode ? [linkedNode.id] : [];
    const linkedEdgeIds = edges
      .filter((edge) => linkedNodeIds.includes(edge.source) || linkedNodeIds.includes(edge.target))
      .map((edge) => edge.id);
    const contradicts = uniqueStrings([
      ...arrayOfRecords(claim.receipts)
        .filter((receipt) => cleanString(receipt.stance).toLowerCase() === 'contradicts')
        .map((receipt) => cleanString(receipt.sourceId))
        .filter(Boolean),
      ...edges
        .filter((edge) => linkedNodeIds.includes(edge.target) && NEGATIVE_RELATIONSHIPS.has(edge.relationshipType))
        .flatMap((edge) => edge.sourceReceiptIds),
    ]).filter((id) => sourceIds.has(id));
    return {
      id,
      text: cleanString(claim.text) || id,
      type: 'Claim',
      status: supportToReviewState(cleanString(claim.support), linkedNode?.reviewState),
      confidence: claimConfidence(claim, linkedNode),
      confidenceKind: linkedNode?.confidenceKind ?? 'EXTRACTED',
      validFrom: nullableString(claim.validFrom),
      validTo: nullableString(claim.validUntil ?? claim.validTo),
      asOf: nullableString(claim.asOf),
      recordedAt: linkedNode?.recordedAt ?? nullableString(claim.recordedAt),
      sourceReceiptIds,
      contradicts,
      linkedNodeIds,
      linkedEdgeIds,
      support: nullableString(claim.support),
      caveat: nullableString(claim.caveat),
      salienceScore: 0,
      salienceSignals: [],
    };
  });

  const ledgerIds = new Set(claims.map((claim) => claim.id));
  for (const node of nodeClaims) {
    if (claims.some((claim) => claim.linkedNodeIds.includes(node.id))) continue;
    const id = node.id.startsWith('claim') ? node.id : `claim:${node.id}`;
    if (ledgerIds.has(id)) continue;
    claims.push({
      id,
      text: node.label,
      type: node.entityType,
      status: node.reviewState,
      confidence: node.confidence,
      confidenceKind: node.confidenceKind,
      recordedAt: node.recordedAt ?? null,
      validFrom: node.validFrom ?? null,
      validTo: node.validTo ?? null,
      asOf: null,
      sourceReceiptIds: node.sourceReceiptIds,
      contradicts: edges
        .filter((edge) => edge.target === node.id && NEGATIVE_RELATIONSHIPS.has(edge.relationshipType))
        .flatMap((edge) => edge.sourceReceiptIds),
      linkedNodeIds: [node.id],
      linkedEdgeIds: edges.filter((edge) => edge.source === node.id || edge.target === node.id).map((edge) => edge.id),
      support: null,
      caveat: null,
      salienceScore: 0,
      salienceSignals: [],
    });
  }
  return claims;
}

function normalizeTimeline(capsule: PraxisCapsule): NormalizedTimelineAnchor[] {
  const grounding = firstRecord(firstRecord(capsule.v3)?.grounding);
  const temporality = firstRecord(capsule.temporality, grounding?.temporality);
  return arrayOfRecords(temporality?.timelineAnchors).flatMap((anchor, index) => {
    const date = cleanString(anchor.date);
    if (!date) return [];
    return [{
      id: cleanString(anchor.id) || `T-${stableHash(`${date}:${cleanString(anchor.label)}:${index}`)}`,
      label: cleanString(anchor.label) || 'Timeline anchor',
      date,
      kind: cleanString(anchor.kind) || 'event',
      sourceReceiptIds: arrayOfStrings(anchor.sourceRefs ?? anchor.sourceReceiptIds),
      confidence: numberOrNull(anchor.confidence),
    }];
  });
}

function normalizeCausalLinks(capsule: PraxisCapsule): NormalizedCausalLink[] {
  const grounding = firstRecord(firstRecord(capsule.v3)?.grounding);
  const causality = firstRecord(capsule.causality, grounding?.causality);
  return arrayOfRecords(causality?.causalLinks).flatMap((link, index) => {
    const cause = cleanString(link.cause);
    const effect = cleanString(link.effect);
    if (!cause || !effect) return [];
    return [{
      id: cleanString(link.id) || `C-${stableHash(`${cause}:${cleanString(link.relation)}:${effect}:${index}`)}`,
      cause,
      effect,
      relation: normalizeRelationship(link.relation) || 'causes',
      evidenceRefs: arrayOfStrings(link.evidenceRefs ?? link.sourceReceiptIds),
      confidence: numberOrNull(link.confidence),
      caveat: nullableString(link.caveat),
    }];
  });
}

function scoreNode(node: NormalizedGraphNode, input: {
  queryTokens: Set<string>;
  activeOntologyIds: OntologyId[];
  degree: number;
  requestTime: string;
  sourceById: Map<string, NormalizedSourceReceipt>;
}): NormalizedGraphNode {
  const signals: string[] = [];
  let score = overlapScore(input.queryTokens, tokenize(`${node.label} ${node.entityType}`)) * 2.2;
  if (mentionMatch(input.queryTokens, node.label)) {
    score += 1.2;
    signals.push('mention_match');
  }
  if (input.activeOntologyIds.some((id) => getOntology(id).nodeTypes.some((type) => type.primitive === node.primitive))) {
    score += 0.8;
    signals.push('ontology_fit');
  }
  score += sourceQualityForIds(node.sourceReceiptIds, input.sourceById);
  score += evidenceStrength(node);
  score += temporalScore(node, input.requestTime);
  score += Math.min(0.6, input.degree * 0.12);
  if (!signals.length) signals.push('query_similarity');
  return { ...node, salienceScore: roundScore(score), salienceSignals: signals };
}

function scoreEdge(edge: NormalizedGraphEdge, input: {
  queryTokens: Set<string>;
  nodeById: Map<string, NormalizedGraphNode>;
  activeOntologyIds: OntologyId[];
  ontologyEdgeTypes: OntologyEdgeType[];
  pathTemplateEdgeIds: Set<string>;
  requestTime: string;
  sourceById: Map<string, NormalizedSourceReceipt>;
}): NormalizedGraphEdge {
  const source = input.nodeById.get(edge.source);
  const target = input.nodeById.get(edge.target);
  const signals: string[] = [];
  let score = overlapScore(input.queryTokens, tokenize(`${edge.label} ${edge.relationshipType} ${source?.label ?? ''} ${target?.label ?? ''}`)) * 2.2;
  const allowed = input.ontologyEdgeTypes.some((type) => type.id === edge.relationshipType);
  if (allowed) {
    score += 0.9;
    signals.push('ontology_fit');
  }
  if (input.pathTemplateEdgeIds.has(edge.relationshipType) || CAUSAL_RELATIONSHIPS.has(edge.relationshipType)) {
    score += 0.8;
    signals.push('path_utility');
  }
  if (NEGATIVE_RELATIONSHIPS.has(edge.relationshipType)) {
    score += 1.4;
    signals.push('negative_evidence');
  }
  score += sourceQualityForIds(edge.sourceReceiptIds, input.sourceById);
  score += evidenceStrength(edge);
  score += temporalScore(edge, input.requestTime);
  score += taskFit(input.queryTokens, edge.relationshipType);
  if (!signals.length) signals.push('query_similarity');
  return { ...edge, salienceScore: roundScore(score), salienceSignals: signals };
}

function scoreClaim(claim: NormalizedClaimCard, input: {
  queryTokens: Set<string>;
  requestTime: string;
  sourceById: Map<string, NormalizedSourceReceipt>;
}): NormalizedClaimCard {
  const signals: string[] = [];
  let score = overlapScore(input.queryTokens, tokenize(`${claim.text} ${claim.type} ${claim.support ?? ''}`)) * 2.3;
  if (mentionMatch(input.queryTokens, claim.text)) {
    score += 1.1;
    signals.push('mention_match');
  }
  if (claim.contradicts.length || claim.support === 'disputed' || claim.support === 'unsupported') {
    score += 1.5;
    signals.push('negative_evidence');
  }
  score += sourceQualityForIds([...claim.sourceReceiptIds, ...claim.contradicts], input.sourceById);
  score += evidenceStrength(claim);
  score += temporalScore({ validFrom: claim.validFrom, validTo: claim.validTo, recordedAt: claim.recordedAt }, input.requestTime);
  if (!signals.length) signals.push('query_similarity');
  return { ...claim, salienceScore: roundScore(score), salienceSignals: signals };
}

function selectWithCoverage<T extends { id: string; primitive?: TacitusCorePrimitive; salienceScore: number }>(
  rows: T[],
  limit: number,
  fallbackPrimitive: TacitusCorePrimitive | 'node',
  omitted: OmittedContextItem[],
  kind: OmittedContextItem['kind'],
): T[] {
  const selected: T[] = [];
  const primitiveCounts = new Map<string, number>();
  for (const row of rows) {
    if (selected.length >= limit) {
      omitted.push({ id: row.id, kind, reason: 'budget', detail: `Exceeded selected ${kind} limit ${limit}.` });
      continue;
    }
    const primitive = row.primitive ?? fallbackPrimitive;
    const coveragePenalty = primitiveCounts.get(primitive) ?? 0;
    if (coveragePenalty >= 4 && rows.some((candidate) => !selected.includes(candidate) && (primitiveCounts.get(candidate.primitive ?? fallbackPrimitive) ?? 0) === 0)) {
      continue;
    }
    selected.push(row);
    primitiveCounts.set(primitive, coveragePenalty + 1);
  }
  return selected;
}

function buildReasoningPaths(
  nodes: NormalizedGraphNode[],
  edges: NormalizedGraphEdge[],
  queryTokens: Set<string>,
  limit: number,
): ReasoningPath[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  return edges
    .filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target))
    .map((edge, index): ReasoningPath => {
      const purpose = CAUSAL_RELATIONSHIPS.has(edge.relationshipType)
        ? 'causal'
        : NEGATIVE_RELATIONSHIPS.has(edge.relationshipType)
          ? 'comparison'
          : edge.sourceReceiptIds.length
            ? 'provenance'
            : 'multi-hop';
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      const whySelected = NEGATIVE_RELATIONSHIPS.has(edge.relationshipType)
        ? 'contradiction or negative evidence outranks duplicate support'
        : overlapScore(queryTokens, tokenize(`${source?.label ?? ''} ${target?.label ?? ''}`)) > 0
          ? 'connects query terms to graph evidence'
          : 'high-confidence ontology path';
      return {
        id: `path-${index + 1}`,
        purpose,
        nodeIds: [edge.source, edge.target],
        edgeIds: [edge.id],
        whySelected,
        sourceReceiptIds: edge.sourceReceiptIds,
        salienceScore: edge.salienceScore,
      };
    })
    .sort((a, b) => compareNumber(b.salienceScore, a.salienceScore) || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map((path, index) => ({ ...path, id: `path-${index + 1}` }));
}

function includeSourcedRow(
  row: { id: string; sourceReceiptIds: string[]; reviewState: ReviewState; generatedBy?: { actorType?: string } | null; entityType?: string },
  omitted: OmittedContextItem[],
  kind: 'node' | 'edge',
): boolean {
  if (row.sourceReceiptIds.length) return true;
  if (ADVISORY_REVIEW_STATES.has(row.reviewState)) return true;
  if (row.generatedBy?.actorType === 'human') return true;
  if (row.entityType === 'EvidenceGap' || row.entityType === 'Assumption') return true;
  omitted.push({ id: row.id, kind, reason: 'unsupported', detail: 'No source receipts and not advisory, missing, schema, or user-provided.' });
  return false;
}

function includeClaimRow(claim: NormalizedClaimCard, omitted: OmittedContextItem[]): boolean {
  if (claim.sourceReceiptIds.length || claim.contradicts.length) return true;
  if (ADVISORY_REVIEW_STATES.has(claim.status)) return true;
  if (claim.type === 'EvidenceGap' || claim.type === 'Assumption') return true;
  omitted.push({ id: claim.id, kind: 'claim', reason: 'unsupported', detail: 'No source receipts and not advisory, missing, schema, or user-provided.' });
  return false;
}

function graphRecord(capsule: PraxisCapsule): Record<string, unknown> | null {
  const grounding = firstRecord(firstRecord(capsule.v3)?.grounding);
  return firstRecord(capsule.embeddedGraph, grounding?.embeddedGraph);
}

function claimRecords(capsule: PraxisCapsule): Record<string, unknown>[] {
  const v3 = firstRecord(capsule.v3);
  const claimLedger = firstRecord(v3?.claimLedger);
  return [
    ...arrayOfRecords(capsule.claimLedger),
    ...arrayOfRecords(claimLedger?.allClaims),
  ];
}

function sourceQualityForIds(ids: string[], sourceById: Map<string, NormalizedSourceReceipt>): number {
  if (!ids.length) return 0;
  return Math.min(1.2, ids.reduce((sum, id) => sum + (sourceById.get(id)?.salienceScore ?? 0.35), 0) / Math.max(1, ids.length));
}

function sourceQualityScore(source: { reliabilityTier?: number | null; stale?: boolean; date?: string | null }, sourceById: Map<string, NormalizedSourceReceipt>): number {
  void sourceById;
  let score = 0.35;
  if (source.reliabilityTier === 1) score += 0.45;
  else if (source.reliabilityTier === 2) score += 0.3;
  else if (source.reliabilityTier === 3) score += 0.1;
  if (source.stale) score -= 0.25;
  if (source.date) score += 0.15;
  return roundScore(Math.max(0.05, Math.min(1, score)));
}

function sourceTrust(tier: number | null): number | null {
  if (tier === 1) return 0.9;
  if (tier === 2) return 0.7;
  if (tier === 3) return 0.45;
  return null;
}

function evidenceStrength(row: { confidence: number | null; confidenceKind?: ConfidenceKind; reviewState?: ReviewState }): number {
  let score = typeof row.confidence === 'number' ? Math.max(0, Math.min(1, row.confidence)) : 0.45;
  if (row.reviewState === 'canonical') score += 0.45;
  else if (row.reviewState === 'reviewed') score += 0.3;
  else if (row.reviewState === 'advisory' || row.reviewState === 'missing') score -= 0.2;
  if (row.confidenceKind === 'EXTRACTED') score += 0.15;
  if (row.confidenceKind === 'INFERRED' || row.confidenceKind === 'ASSESSED') score -= 0.1;
  return roundScore(Math.max(0, Math.min(1.4, score)));
}

function temporalScore(row: { validFrom?: string | null; validTo?: string | null; recordedAt?: string | null }, requestTime: string): number {
  const requestMs = Date.parse(requestTime);
  if (!Number.isFinite(requestMs)) return 0;
  const validTo = parseTime(row.validTo);
  if (validTo && validTo < requestMs) return -0.4;
  const date = parseTime(row.recordedAt ?? row.validFrom);
  if (!date) return 0;
  const days = Math.abs(requestMs - date) / 86_400_000;
  if (days <= 14) return 0.35;
  if (days <= 90) return 0.2;
  if (days <= 365) return 0.05;
  return -0.15;
}

function taskFit(queryTokens: Set<string>, relationshipType: string): number {
  const query = Array.from(queryTokens).join(' ');
  if (/\b(cause|caused|why|because|effect|impact)\b/.test(query) && CAUSAL_RELATIONSHIPS.has(relationshipType)) return 0.65;
  if (/\b(compare|versus|conflict|contradict|tradeoff)\b/.test(query) && NEGATIVE_RELATIONSHIPS.has(relationshipType)) return 0.65;
  if (/\b(memo|draft|brief)\b/.test(query) && relationshipType.includes('support')) return 0.35;
  return 0;
}

function claimConfidence(claim: Record<string, unknown>, node?: NormalizedGraphNode): number | null {
  const receiptConfidences = arrayOfRecords(claim.receipts).map((receipt) => numberOrNull(receipt.confidence)).filter((value): value is number => typeof value === 'number');
  if (receiptConfidences.length) return roundScore(receiptConfidences.reduce((sum, value) => sum + value, 0) / receiptConfidences.length);
  if (node?.confidence !== undefined) return node.confidence;
  const support = cleanString(claim.support);
  if (support === 'supported') return 0.86;
  if (support === 'partially_supported') return 0.68;
  if (support === 'disputed') return 0.62;
  if (support === 'unsupported' || support === 'needs_source') return 0.35;
  return null;
}

function supportToReviewState(support: string, fallback?: ReviewState): ReviewState {
  if (fallback) return fallback;
  if (support === 'supported') return 'reviewed';
  if (support === 'unsupported' || support === 'needs_source') return 'missing';
  if (support === 'disputed' || support === 'partially_supported') return 'advisory';
  return 'advisory';
}

function reviewStateOf(value: unknown): ReviewState {
  const normalized = cleanString(value).toLowerCase();
  if (normalized === 'canonical' || normalized === 'reviewed' || normalized === 'proposed' || normalized === 'advisory' || normalized === 'missing') {
    return normalized;
  }
  return 'advisory';
}

function confidenceKindOf(value: unknown): ConfidenceKind {
  const normalized = cleanString(value).toUpperCase();
  if (normalized === 'EXTRACTED' || normalized === 'INFERRED' || normalized === 'ASSESSED') return normalized;
  return 'ASSESSED';
}

function normalizeRelationship(value: unknown): string {
  return cleanString(value).toLowerCase().replace(/[\s-]+/g, '_');
}

function compareSalience<T extends { salienceScore: number; id: string }>(a: T, b: T): number {
  return compareNumber(b.salienceScore, a.salienceScore) || a.id.localeCompare(b.id, undefined, { numeric: true });
}

function compareNumber(left: number | null | undefined, right: number | null | undefined): number {
  return (left ?? -1) - (right ?? -1);
}

function tokenize(value: string): Set<string> {
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2 && !STOPWORDS.has(token)));
}

function overlapScore(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) {
    if (right.has(token)) hits += 1;
  }
  return hits / Math.max(1, Math.min(left.size, right.size));
}

function mentionMatch(queryTokens: Set<string>, text: string): boolean {
  const tokens = tokenize(text);
  if (!tokens.size) return false;
  let hits = 0;
  for (const token of tokens) {
    if (queryTokens.has(token)) hits += 1;
  }
  return hits >= Math.min(2, tokens.size);
}

function sourceFromId(id: string): NormalizedSourceReceipt {
  return {
    id,
    title: id,
    trust: null,
    salienceScore: 0.35,
  };
}

function firstRecord(...values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return null;
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [];
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? uniqueStrings(value.map(cleanString).filter(Boolean)) : [];
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableString(value: unknown): string | null {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null;
}

function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function stableHash(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) + value.charCodeAt(index);
    hash >>>= 0;
  }
  return hash.toString(36).slice(0, 8);
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = value?.trim();
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    result.push(cleaned);
  }
  return result;
}

function dedupeOmitted(items: OmittedContextItem[]): OmittedContextItem[] {
  const seen = new Set<string>();
  const result: OmittedContextItem[] = [];
  for (const item of items) {
    const key = `${item.kind}:${item.id}:${item.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'are',
  'was',
  'were',
  'has',
  'have',
  'what',
  'which',
  'draft',
  'memo',
]);

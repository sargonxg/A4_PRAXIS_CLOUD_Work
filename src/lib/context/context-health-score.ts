import type { Situation } from '@/types/situation';

export type ContextHealthDimensionId =
  | 'scope-clarity'
  | 'actor-coverage'
  | 'source-coverage'
  | 'document-coverage'
  | 'graph-density'
  | 'provenance-coverage';

export interface ContextHealthDimensionScore {
  id: ContextHealthDimensionId;
  label: string;
  score: number;
  detail: string;
}

export interface ContextHealthScore {
  score: number;
  threshold: number;
  ready: boolean;
  lowestDimension: ContextHealthDimensionScore;
  dimensions: ContextHealthDimensionScore[];
}

export interface ContextHealthScoreInput {
  situation?: Partial<Situation> | null;
  sourceCount?: number;
  sourceReliabilityTierCount?: number;
  documentCount?: number;
  ocrCompleteCount?: number;
  chunkedDocumentCount?: number;
  graphNodeCount?: number;
  graphEdgeCount?: number;
  typedEdgeRatio?: number;
  claimNodeCount?: number;
  provenanceCoveredClaimCount?: number;
  threshold?: number;
}

export function computeContextHealthScore(input: ContextHealthScoreInput): ContextHealthScore {
  const threshold = input.threshold ?? 60;
  const situation = input.situation ?? {};
  const actorCount = situation.actorCount ?? situation.actors?.length ?? 0;
  const sourceCount = input.sourceCount ?? ((situation.sourceUrls?.length ?? 0) + (situation.customSources?.length ?? 0));
  const documentCount = input.documentCount ?? situation.documentCount ?? situation.initialDocumentIds?.length ?? 0;
  const graphNodeCount = input.graphNodeCount ?? situation.graphEntities ?? 0;
  const graphEdgeCount = input.graphEdgeCount ?? relationCount(situation);
  const claimNodeCount = Math.max(1, input.claimNodeCount ?? looseArray(situation, 'claims').length ?? graphNodeCount);
  const provenanceCoveredClaimCount = input.provenanceCoveredClaimCount ?? provenanceBackedClaimCount(situation);

  const dimensions: ContextHealthDimensionScore[] = [
    {
      id: 'scope-clarity',
      label: 'Scope clarity',
      score: average([
        hasText(situation.name) ? 100 : 0,
        hasText(situation.region) ? 100 : 0,
        hasText(situation.type) || hasText(situation.domain) ? 100 : 0,
        hasText(situation.description) || hasText(situation.contextNotes) ? 100 : 0,
        hasText(situation.userRole) ? 100 : 0,
      ]),
      detail: 'Name, region, type/domain, primary context, and mandate framing.',
    },
    {
      id: 'actor-coverage',
      label: 'Actor coverage',
      score: clamp((actorCount / 5) * 100),
      detail: `${actorCount} actor(s) available; target is 5 with role, interest, leverage, and constraint.`,
    },
    {
      id: 'source-coverage',
      label: 'Source coverage',
      score: clamp(Math.min(sourceCount / 8, (input.sourceReliabilityTierCount ?? (sourceCount > 0 ? 1 : 0)) / 3) * 100),
      detail: `${sourceCount} source(s); target is 8 sources across 3 reliability tiers.`,
    },
    {
      id: 'document-coverage',
      label: 'Document coverage',
      score: clamp(Math.min(documentCount / 3, (input.ocrCompleteCount ?? documentCount) / 3, (input.chunkedDocumentCount ?? documentCount) / 3) * 100),
      detail: `${documentCount} document(s); target is 3 OCR'd and chunked documents.`,
    },
    {
      id: 'graph-density',
      label: 'Graph density',
      score: clamp(Math.min(graphNodeCount / 25, graphEdgeCount / 40, (input.typedEdgeRatio ?? (graphEdgeCount > 0 ? 0.6 : 0)) / 0.6) * 100),
      detail: `${graphNodeCount} node(s), ${graphEdgeCount} edge(s); target is 25 nodes, 40 edges, typed-edge ratio above 0.6.`,
    },
    {
      id: 'provenance-coverage',
      label: 'Provenance coverage',
      score: clamp((provenanceCoveredClaimCount / claimNodeCount) * 100),
      detail: `${provenanceCoveredClaimCount}/${claimNodeCount} claim-layer node(s) have cited provenance.`,
    },
  ];

  const score = Math.round(average(dimensions.map((dimension) => dimension.score)));
  const lowestDimension = [...dimensions].sort((a, b) => a.score - b.score)[0];

  return {
    score,
    threshold,
    ready: score >= threshold,
    lowestDimension,
    dimensions,
  };
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function relationCount(situation: Partial<Situation>): number {
  return looseArray(situation, 'relationships').length || looseArray(situation, 'edges').length;
}

function provenanceBackedClaimCount(situation: Partial<Situation>): number {
  const claims = looseArray(situation, 'claims');
  return claims.filter((claim: unknown) => {
    if (!claim || typeof claim !== 'object') return false;
    const sourceLike = (claim as { sources?: unknown; provenance?: unknown }).sources ?? (claim as { provenance?: unknown }).provenance;
    return Array.isArray(sourceLike) && sourceLike.length > 0;
  }).length;
}

function looseArray(object: unknown, key: string): unknown[] {
  if (!object || typeof object !== 'object') return [];
  const value = (object as Record<string, unknown>)[key];
  return Array.isArray(value) ? value : [];
}

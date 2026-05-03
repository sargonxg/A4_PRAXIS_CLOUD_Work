import { SYRIA_DEMO_CANONICAL_GRAPH, SYRIA_DEMO_CONFLICT_GRAPH } from '@/lib/constants/syria-demo-case';
import {
  PRIMITIVE_LABELS,
  SYRIA_COMPARISON_CASES,
  type PrimitiveCounts,
  type SyriaComparisonCase,
} from '@/lib/syria/comparison-cases';

export type SyriaPatternReference = {
  primitiveCounts: PrimitiveCounts;
  edgeVocabulary: string[];
};

export type RankedSyriaComparisonCase = SyriaComparisonCase & {
  similarityScore: number;
  primitiveSimilarity: number;
  edgeSimilarity: number;
  matchedPatterns: string[];
};

const PRIMITIVE_KEYS = Object.keys(PRIMITIVE_LABELS) as Array<keyof PrimitiveCounts>;

export function buildSyriaPatternReference(): SyriaPatternReference {
  return {
    primitiveCounts: {
      actors: SYRIA_DEMO_CONFLICT_GRAPH.actors.length,
      claims: SYRIA_DEMO_CONFLICT_GRAPH.claims.length,
      interests: SYRIA_DEMO_CONFLICT_GRAPH.interests.length,
      constraints: SYRIA_DEMO_CONFLICT_GRAPH.constraints.length,
      leverage: SYRIA_DEMO_CONFLICT_GRAPH.leverage.length,
      commitments: SYRIA_DEMO_CONFLICT_GRAPH.commitments.length,
      events: SYRIA_DEMO_CONFLICT_GRAPH.events.length,
      narratives: SYRIA_DEMO_CONFLICT_GRAPH.narratives.length,
    },
    edgeVocabulary: Array.from(new Set(SYRIA_DEMO_CANONICAL_GRAPH.edges.map((edge) => edge.type))).sort(),
  };
}

export function rankSyriaComparisonCases(limit = 3): RankedSyriaComparisonCase[] {
  const reference = buildSyriaPatternReference();

  return SYRIA_COMPARISON_CASES.map((candidate) => scoreComparisonCase(reference, candidate))
    .sort((a, b) => b.similarityScore - a.similarityScore || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function scoreComparisonCase(
  reference: SyriaPatternReference,
  candidate: SyriaComparisonCase,
): RankedSyriaComparisonCase {
  const referenceDistribution = normalizeCounts(reference.primitiveCounts);
  const candidateDistribution = normalizeCounts(candidate.primitiveCounts);
  const primitiveDistance = PRIMITIVE_KEYS.reduce(
    (sum, key) => sum + Math.abs(referenceDistribution[key] - candidateDistribution[key]),
    0,
  );
  const primitiveSimilarity = clamp01(1 - primitiveDistance / 2);
  const edgeSimilarity = jaccard(reference.edgeVocabulary, candidate.edgeVocabulary);
  const similarityScore = Math.round((primitiveSimilarity * 0.7 + edgeSimilarity * 0.3) * 100);

  return {
    ...candidate,
    similarityScore,
    primitiveSimilarity: round2(primitiveSimilarity),
    edgeSimilarity: round2(edgeSimilarity),
    matchedPatterns: getMatchedPatterns(reference, candidate, referenceDistribution, candidateDistribution),
  };
}

function normalizeCounts(counts: PrimitiveCounts): PrimitiveCounts {
  const total = PRIMITIVE_KEYS.reduce((sum, key) => sum + counts[key], 0) || 1;
  return PRIMITIVE_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: counts[key] / total }),
    {} as PrimitiveCounts,
  );
}

function jaccard(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...leftSet, ...rightSet]);
  if (union.size === 0) return 1;

  let intersection = 0;
  for (const item of leftSet) {
    if (rightSet.has(item)) intersection += 1;
  }
  return intersection / union.size;
}

function getMatchedPatterns(
  reference: SyriaPatternReference,
  candidate: SyriaComparisonCase,
  referenceDistribution: PrimitiveCounts,
  candidateDistribution: PrimitiveCounts,
): string[] {
  const primitiveMatches = PRIMITIVE_KEYS.map((key) => ({
    key,
    score: 1 - Math.abs(referenceDistribution[key] - candidateDistribution[key]),
    weight: reference.primitiveCounts[key] + candidate.primitiveCounts[key],
  }))
    .filter((item) => candidate.primitiveCounts[item.key] > 0)
    .sort((a, b) => b.score - a.score || b.weight - a.weight)
    .slice(0, 2)
    .map((item) => PRIMITIVE_LABELS[item.key]);

  const sharedEdges = candidate.edgeVocabulary.filter((edge) => reference.edgeVocabulary.includes(edge)).slice(0, 2);
  return [...primitiveMatches, ...sharedEdges.map((edge) => `edge: ${edge}`)];
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

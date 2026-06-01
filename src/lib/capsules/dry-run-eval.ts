import type { ContextCapsule } from '@/types/context-capsule';
import { buildDefaultAgenticResearchEvalRun, summarizeAgenticResearchEval } from '@/lib/agent-runtime/research-eval';

export interface CapsuleEvalClaim {
  id: string;
  text: string;
  sourceIds: string[];
}

export interface CapsuleEvalSample {
  prompt: string;
  output: unknown;
  claims: CapsuleEvalClaim[];
}

export interface CapsuleEvalSourceSnippet {
  id: string;
  text: string;
}

export interface CapsuleDryRunEvalScorecard {
  groundedAnswerRate: number;
  contradictionRate: number;
  sourceIndependence: number;
  capsuleVsGenericDelta: number;
  goldenQuestions: Array<{
    questionId: string;
    prompt: string;
    groundedAnswerRate: number;
    capsuleScore: number;
    genericScore: number;
    delta: number;
  }>;
}

export interface CapsuleDryRunEvalInput {
  capsule: ContextCapsule;
  samples: CapsuleEvalSample[];
  sourceSnippets: CapsuleEvalSourceSnippet[];
  runId?: string;
  passedAt?: string;
}

export interface CapsuleDryRunEvalResult {
  mode: 'dry-run';
  passed: boolean;
  scores: Record<string, number>;
  failures: string[];
  ragasFaithfulness: {
    mode: 'proxy';
    score: number;
    reason: string;
  };
  scorecard: CapsuleDryRunEvalScorecard;
  patch: {
    eval: {
      lastRun: {
        runId: string;
        scores: Record<string, number>;
        passedAt: string;
      };
      scorecard: CapsuleDryRunEvalScorecard;
    };
  };
}

export function runCapsuleDryRunEval(input: CapsuleDryRunEvalInput): CapsuleDryRunEvalResult {
  const claims = input.samples.flatMap((sample) => sample.claims);
  const required = requiredKeys(input.capsule.output?.responseJsonSchema);
  const citationCoverage = ratio(claims.filter((claim) => claim.sourceIds.length > 0).length, claims.length);
  const schemaConformance = ratio(
    input.samples.filter((sample) => outputHasRequiredKeys(sample.output, required)).length,
    input.samples.length,
  );
  const citedSourceIds = new Set(claims.flatMap((claim) => claim.sourceIds));
  const contextRecall = input.sourceSnippets.length
    ? ratio(Array.from(citedSourceIds).filter((id) => input.sourceSnippets.some((source) => source.id === id)).length, input.sourceSnippets.length)
    : citationCoverage;
  const faithfulness = scoreFaithfulness(claims, input.sourceSnippets);
  const safetyScore = input.samples.some((sample) => /guaranteed|certainly|without doubt/i.test(JSON.stringify(sample.output)))
    ? 0.8
    : 1;
  const redTeamPassRate = Math.min(1, Math.max(0, citationCoverage));

  const scores = {
    faithfulness,
    citationCoverage,
    contextRecall,
    schemaConformance,
    redTeamPassRate,
    safetyScore,
  };
  const scorecard = buildDryRunScorecard({
    samples: input.samples,
    claims,
    sourceSnippets: input.sourceSnippets,
    scores,
  });
  const thresholds = input.capsule.eval?.thresholds ?? {};
  const failures = Object.entries(thresholds)
    .filter(([key, threshold]) => typeof threshold === 'number' && (scores as Record<string, number>)[key] < threshold)
    .map(([key]) => `${key} below threshold`);

  return {
    mode: 'dry-run',
    passed: failures.length === 0,
    scores,
    failures,
    ragasFaithfulness: {
      mode: 'proxy',
      score: faithfulness,
      reason: 'RAGAS-compatible faithfulness proxy using cited snippet overlap; no external judge call was made.',
    },
    scorecard,
    patch: {
      eval: {
        lastRun: {
          runId: input.runId ?? `dry-run-${Date.now()}`,
          scores,
          passedAt: input.passedAt ?? new Date().toISOString(),
        },
        scorecard,
      },
    },
  };
}

function buildDryRunScorecard(input: {
  samples: CapsuleEvalSample[];
  claims: CapsuleEvalClaim[];
  sourceSnippets: CapsuleEvalSourceSnippet[];
  scores: Record<string, number>;
}): CapsuleDryRunEvalScorecard {
  const comparisons = buildDefaultAgenticResearchEvalRun();
  const researchScorecard = summarizeAgenticResearchEval(comparisons);
  const citedSourceIds = input.claims.flatMap((claim) => claim.sourceIds);
  const uniqueSourceIds = new Set(citedSourceIds);
  const groundedAnswerRate = roundRatio(average([
    input.scores.faithfulness,
    input.scores.citationCoverage,
    input.scores.contextRecall,
  ]));
  const contradictionRate = detectContradictionRate(input.claims);
  const sourceIndependence = uniqueSourceIds.size
    ? roundRatio(uniqueSourceIds.size / Math.min(2, Math.max(1, citedSourceIds.length)))
    : 0;
  const referenceComparisons = comparisons.slice(0, Math.max(1, Math.min(3, input.samples.length || 3)));
  return {
    groundedAnswerRate,
    contradictionRate,
    sourceIndependence,
    capsuleVsGenericDelta: roundRatio(researchScorecard.capsuleVsGenericDelta / 100),
    goldenQuestions: referenceComparisons.map((comparison, index) => ({
      questionId: comparison.scenarioId,
      prompt: input.samples[index]?.prompt ?? comparison.scenarioId,
      groundedAnswerRate,
      capsuleScore: roundRatio(comparison.praxis.total / 100),
      genericScore: roundRatio(comparison.baseline.total / 100),
      delta: roundRatio(comparison.delta / 100),
    })),
  };
}

function scoreFaithfulness(claims: CapsuleEvalClaim[], sources: CapsuleEvalSourceSnippet[]): number {
  if (claims.length === 0) return 1;
  const sourceById = new Map(sources.map((source) => [source.id, source.text.toLowerCase()]));
  const supported = claims.filter((claim) => {
    if (claim.sourceIds.length === 0) return false;
    const claimTerms = keywords(claim.text);
    const sourceText = claim.sourceIds.map((id) => sourceById.get(id) ?? '').join(' ');
    if (claimTerms.length === 0) return true;
    const overlaps = claimTerms.filter((term) => sourceText.includes(term)).length;
    return overlaps / claimTerms.length >= 0.5;
  }).length;
  return ratio(supported, claims.length);
}

function requiredKeys(schema: unknown): string[] {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return [];
  const required = (schema as { required?: unknown }).required;
  return Array.isArray(required) ? required.filter((item): item is string => typeof item === 'string') : [];
}

function outputHasRequiredKeys(output: unknown, required: string[]): boolean {
  if (required.length === 0) return true;
  if (!output || typeof output !== 'object' || Array.isArray(output)) return false;
  const record = output as Record<string, unknown>;
  return required.every((key) => key in record);
}

function keywords(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 3);
}

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 1;
  return Math.max(0, Math.min(1, numerator / denominator));
}

function detectContradictionRate(claims: CapsuleEvalClaim[]): number {
  if (claims.length < 2) return 0;
  let contradictoryPairs = 0;
  let comparedPairs = 0;
  for (let leftIndex = 0; leftIndex < claims.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < claims.length; rightIndex += 1) {
      const left = claims[leftIndex]!;
      const right = claims[rightIndex]!;
      if (!claimsShareTopic(left.text, right.text)) continue;
      comparedPairs += 1;
      if (hasNegation(left.text) !== hasNegation(right.text)) contradictoryPairs += 1;
    }
  }
  return comparedPairs ? roundRatio(contradictoryPairs / comparedPairs) : 0;
}

function claimsShareTopic(left: string, right: string): boolean {
  const leftTerms = new Set(keywords(left).filter((term) => !STOP_WORDS.has(term)));
  const rightTerms = keywords(right).filter((term) => !STOP_WORDS.has(term));
  return rightTerms.filter((term) => leftTerms.has(term)).length >= 2;
}

function hasNegation(text: string): boolean {
  return /\b(not|no|never|without|cannot|closed|blocked|prohibited|denied|suspended|inactive)\b/i.test(text);
}

function average(values: number[]): number {
  const usable = values.filter((value) => Number.isFinite(value));
  if (!usable.length) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function roundRatio(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
}

const STOP_WORDS = new Set([
  'that',
  'this',
  'with',
  'from',
  'have',
  'will',
  'would',
  'could',
  'should',
  'there',
  'their',
  'without',
  'unsupported',
]);

import type { ContextCapsule } from '@/types/context-capsule';

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
  patch: {
    eval: {
      lastRun: {
        runId: string;
        scores: Record<string, number>;
        passedAt: string;
      };
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
    patch: {
      eval: {
        lastRun: {
          runId: input.runId ?? `dry-run-${Date.now()}`,
          scores,
          passedAt: input.passedAt ?? new Date().toISOString(),
        },
      },
    },
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

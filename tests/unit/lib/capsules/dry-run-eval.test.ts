import { describe, expect, it } from 'vitest';

import { runCapsuleDryRunEval } from '@/lib/capsules/dry-run-eval';
import type { ContextCapsule } from '@/types/context-capsule';

const capsule = {
  id: 'eval-capsule',
  eval: {
    thresholds: {
      faithfulness: 0.7,
      citationCoverage: 0.7,
      contextRecall: 0.6,
      schemaConformance: 0.9,
      redTeamPassRate: 0.9,
      safetyScore: 0.9,
    },
  },
  output: {
    responseJsonSchema: {
      required: ['summary', 'evidence'],
    },
  },
} as unknown as ContextCapsule;

describe('capsule dry-run eval', () => {
  it('scores citation coverage, schema conformance, and faithfulness without live retrieval', () => {
    const result = runCapsuleDryRunEval({
      capsule,
      samples: [
        {
          prompt: 'Assess the issue',
          output: { summary: 'UN evidence indicates displacement rose.', evidence: ['s1'] },
          claims: [{ id: 'c1', text: 'displacement rose', sourceIds: ['s1'] }],
        },
      ],
      sourceSnippets: [{ id: 's1', text: 'UN evidence indicates displacement rose this week.' }],
    });

    expect(result.mode).toBe('dry-run');
    expect(result.ragasFaithfulness.mode).toBe('proxy');
    expect(result.scores.citationCoverage).toBe(1);
    expect(result.scores.schemaConformance).toBe(1);
    expect(result.scorecard).toMatchObject({
      groundedAnswerRate: 1,
      contradictionRate: 0,
      sourceIndependence: 1,
    });
    expect(result.scorecard.capsuleVsGenericDelta).toBeGreaterThan(0);
    expect(result.passed).toBe(true);
    expect(result.patch.eval.lastRun.runId).toMatch(/^dry-run-/);
    expect(result.patch.eval.scorecard).toEqual(result.scorecard);
  });

  it('fails the gate when claims lack citations', () => {
    const result = runCapsuleDryRunEval({
      capsule,
      samples: [
        {
          prompt: 'Assess the issue',
          output: { summary: 'Unsupported.', evidence: [] },
          claims: [{ id: 'c1', text: 'unsupported claim', sourceIds: [] }],
        },
      ],
      sourceSnippets: [],
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain('citationCoverage below threshold');
  });
});

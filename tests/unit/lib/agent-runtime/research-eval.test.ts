import {
  AGENTIC_RESEARCH_EVAL_SCENARIOS,
  comparePraxisToBaseline,
  scoreResearchEvalCandidate,
} from '@/lib/agent-runtime/research-eval';
import { describe, expect, it } from 'vitest';

describe('agentic research eval harness', () => {
  it('defines the ten fixed proof scenarios', () => {
    expect(AGENTIC_RESEARCH_EVAL_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'current-events',
      'conflict-policy-research',
      'claim-source-discovery',
      'contradiction-uncertainty',
      'capsule-grounded-research',
      'memo-pdf-output',
      'sourceability-ledger',
      'multi-agent-review',
      'handover-package',
      'degraded-grounding',
    ]);
  });

  it('scores PRAXIS-specific proof fields separately from prompt-only answer quality', () => {
    const score = scoreResearchEvalCandidate({
      scenarioId: 'capsule-grounded-research',
      label: 'PRAXIS',
      planning: true,
      sourceAuthority: true,
      recency: true,
      citationFidelity: true,
      uncertaintyHandling: true,
      capsuleReuse: true,
      persistence: true,
      auditTrail: true,
      latencyMs: 2000,
      failureMode: null,
    });

    expect(score.total).toBeGreaterThan(80);
    expect(score.criteria.capsuleReuse).toBe(10);
    expect(score.criteria.persistence).toBe(10);
    expect(score.criteria.auditTrail).toBe(10);
  });

  it('requires PRAXIS to outperform baseline on durable product proof dimensions', () => {
    const comparison = comparePraxisToBaseline({
      scenarioId: 'claim-source-discovery',
      praxis: {
        label: 'PRAXIS',
        planning: true,
        sourceAuthority: true,
        recency: true,
        citationFidelity: true,
        uncertaintyHandling: true,
        capsuleReuse: true,
        persistence: true,
        auditTrail: true,
        latencyMs: 3500,
        failureMode: null,
      },
      baseline: {
        label: 'Generic LLM',
        planning: true,
        sourceAuthority: false,
        recency: false,
        citationFidelity: false,
        uncertaintyHandling: true,
        capsuleReuse: false,
        persistence: false,
        auditTrail: false,
        latencyMs: 1200,
        failureMode: null,
      },
    });

    expect(comparison.praxisWins).toBe(true);
    expect(comparison.requiredProofWins).toEqual({
      capsuleReuse: true,
      persistence: true,
      auditTrail: true,
      citationFidelity: true,
      uncertaintyHandling: true,
    });
  });
});

import { describe, expect, it } from 'vitest';

import {
  LAUNCH_CAPSULE_IDS,
  buildLaunchCapsules,
  evaluateLaunchCapsuleGoldenSets,
} from '@/lib/capsules/launch-capsules';

describe('launch capsule set', () => {
  it('defines the ten §10 launch capsules in stable order', () => {
    expect(LAUNCH_CAPSULE_IDS).toEqual([
      'conflict-analysis-brief',
      'sanctions-impact-analysis',
      'economic-policy-analysis',
      'mediation-negotiation-readiness',
      'treaty-legal-review',
      'humanitarian-sitrep',
      'election-political-risk-watch',
      'energy-resource-security',
      'stakeholder-mapping-decision-memo',
      'osint-source-to-brief',
    ]);

    expect(buildLaunchCapsules().map((entry) => entry.capsule.id)).toEqual(LAUNCH_CAPSULE_IDS);
  });

  it('ships each capsule with a golden set and passing dry-run eval', () => {
    const evaluations = evaluateLaunchCapsuleGoldenSets();

    expect(evaluations).toHaveLength(10);
    for (const evaluation of evaluations) {
      expect(evaluation.goldenSet.samples.length).toBeGreaterThanOrEqual(2);
      expect(evaluation.result.passed).toBe(true);
      expect(evaluation.capsule.eval.lastRun?.scores.citationCoverage).toBeGreaterThanOrEqual(
        evaluation.capsule.eval.thresholds.citationCoverage,
      );
    }
  });
});

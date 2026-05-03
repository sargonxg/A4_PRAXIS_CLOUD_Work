import { describe, expect, it } from 'vitest';
import { counterfactualPenalty, summarizeCounterfactuals } from '@/lib/syria/counterfactuals';

describe('Syria counterfactuals', () => {
  it('decays confidence conservatively as toggles stack', () => {
    expect(counterfactualPenalty([])).toBe(1);
    expect(counterfactualPenalty(['a'])).toBe(0.7);
    expect(counterfactualPenalty(['a', 'b'])).toBe(0.49);
    expect(counterfactualPenalty(['a', 'b', 'c', 'd', 'e'])).toBe(0.3);
  });

  it('summarizes affected graph deltas', () => {
    const summary = summarizeCounterfactuals(['sdf_withdraws_from_jan_agreement']);
    expect(summary.active[0].shortLabel).toBe('SDF withdrawal');
    expect(summary.affectedNodes).toContain('30 Jan agreement');
    expect(summary.addedEdges.length).toBeGreaterThan(0);
  });
});

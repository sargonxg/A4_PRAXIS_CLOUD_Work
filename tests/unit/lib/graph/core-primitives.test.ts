import { describe, expect, it } from 'vitest';
import { computeCorePrimitiveCoverage } from '@/lib/graph/core-primitives';

describe('computeCorePrimitiveCoverage', () => {
  it('counts TACITUS core primitives across graph node type variants', () => {
    const coverage = computeCorePrimitiveCoverage([
      { type: 'Actor' },
      { type: 'actor' },
      { type: 'claim' },
      { primitive_type: 'Interest' },
      { type: 'non-core' },
      { type: 'Narrative' },
    ]);

    expect(coverage.counts.Actor).toBe(2);
    expect(coverage.counts.Claim).toBe(1);
    expect(coverage.counts.Interest).toBe(1);
    expect(coverage.counts.Narrative).toBe(1);
    expect(coverage.missing).toEqual(['Constraint', 'Leverage', 'Commitment', 'Event']);
    expect(coverage.coverageRatio).toBe(0.5);
  });
});

import { describe, expect, it } from 'vitest';
import { computePathConfidence, normalizeNumericConfidence } from '@/lib/knowledge/provenance-graph';

describe('provenance graph confidence math', () => {
  it('normalizes numeric, categorical, and legacy confidence values', () => {
    expect(normalizeNumericConfidence(0.84)).toBe(0.84);
    expect(normalizeNumericConfidence('EXTRACTED')).toBe(0.9);
    expect(normalizeNumericConfidence({ metadata: { confidence: 'medium' } })).toBe(0.7);
    expect(normalizeNumericConfidence({ confidence_level: 'AMBIGUOUS' })).toBe(0.4);
  });

  it('uses min(node_confidences) times product(edge_confidences)', () => {
    const confidence = computePathConfidence(
      [{ confidence: 0.92 }, { confidence: 0.81 }, { confidence: 0.66 }],
      [{ confidence: 0.8 }, { confidence: 0.75 }],
    );

    expect(confidence).toBe(0.396);
  });

  it('returns zero for an empty node path', () => {
    expect(computePathConfidence([], [{ confidence: 0.8 }])).toBe(0);
  });
});

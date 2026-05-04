import { describe, expect, it } from 'vitest';
import { SYRIA_COMPARISON_CASES } from '@/lib/syria/comparison-cases';
import { buildSyriaPatternReference, rankSyriaComparisonCases } from '@/lib/syria/pattern-similarity';

describe('Syria pattern similarity', () => {
  it('builds a reference pattern from the seeded Syria conflict graph', () => {
    const reference = buildSyriaPatternReference();

    expect(reference.primitiveCounts.actors).toBeGreaterThanOrEqual(8);
    expect(reference.primitiveCounts.commitments).toBeGreaterThanOrEqual(1);
    expect(reference.edgeVocabulary).toContain('party_to');
    expect(reference.edgeVocabulary).toContain('constrains');
  });

  it('ranks three curated analog cases with defensible match metadata', () => {
    const ranked = rankSyriaComparisonCases();

    expect(ranked).toHaveLength(3);
    expect(new Set(ranked.map((item) => item.id)).size).toBe(3);
    expect(ranked[0].similarityScore).toBeGreaterThanOrEqual(ranked[1].similarityScore);
    expect(ranked.every((item) => item.similarityScore > 70 && item.similarityScore <= 100)).toBe(true);
    expect(ranked.every((item) => item.matchedPatterns.length >= 3)).toBe(true);
  });

  it('keeps the locked analog library broad enough for investor walkthroughs', () => {
    expect(SYRIA_COMPARISON_CASES.map((item) => item.id)).toEqual([
      'lebanon-taif-1989',
      'bosnia-dayton-1995',
      'south-sudan-r-arcss-2018',
      'iraq-kurdish-referendum-2017',
      'mozambique-renamo-2014-2019',
      'colombia-farc-2016',
      'tunisia-national-dialogue-2013',
      'iraq-de-baathification-2003',
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildEvidenceReviews,
  normalizeEvidenceSources,
  summarizeEvidenceCoverage,
} from '@/lib/documents/evidence-review';

describe('document evidence review', () => {
  it('normalizes source labels and urls', () => {
    const sources = normalizeEvidenceSources([
      'UN Geneva Syria briefing https://example.org/syria',
      'ReliefWeb humanitarian update',
    ]);

    expect(sources).toEqual([
      { id: 'source-1', label: 'UN Geneva Syria briefing', url: 'https://example.org/syria' },
      { id: 'source-2', label: 'ReliefWeb humanitarian update', url: undefined },
    ]);
  });

  it('builds section-level evidence prompts from draft content', () => {
    const reviews = buildEvidenceReviews(
      [
        {
          id: 'recommendation',
          heading: 'Recommendation',
          body: 'Adopt an implementation-first posture because humanitarian access and rights guarantees remain uncertain. Tie any public optimism to dated verification triggers, district-level implementation evidence, and explicit follow-up searches before leadership repeats the line.',
        },
      ],
      ['UN Geneva Syria transition briefing', 'ReliefWeb humanitarian access update'],
    );

    expect(reviews[0].coverageState).toBe('ready');
    expect(reviews[0].suggestedSources.map((source) => source.label)).toContain('ReliefWeb humanitarian access update');
    expect(reviews[0].sectionQuestions).toContain('What implementation trigger would change this recommendation?');
    expect(reviews[0].sectionQuestions).toContain('Which graph nodes and edges defend this wording?');
  });

  it('summarizes missing and thin evidence coverage', () => {
    const reviews = buildEvidenceReviews(
      [
        { id: 'summary', heading: 'Summary', body: 'Short claim.' },
        { id: 'risk', heading: 'Risk', body: 'This is a longer risk section that has a single fallback source and should remain thin until another source span is attached.' },
      ],
      ['Single source'],
    );

    const summary = summarizeEvidenceCoverage(reviews);
    expect(summary.total).toBe(2);
    expect(summary.ready).toBe(0);
    expect(summary.thin).toBe(2);
    expect(summary.score).toBe(55);
  });
});

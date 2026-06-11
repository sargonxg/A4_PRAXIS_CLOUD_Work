import { describe, expect, it } from 'vitest';
import { mapRedTeamReviewToAnnotations, memoTextToParagraphs } from '@/lib/memo/red-team-annotations';

describe('red-team annotation mapper', () => {
  it('maps structured red-team output into paragraph-linked annotations', () => {
    const paragraphs = memoTextToParagraphs([
      'The access clause will hold through the next negotiating round.',
      'The memo relies on one official source and one NGO source.',
      'A ceasefire pause is the only realistic recommendation.',
    ].join('\n\n'));

    const annotations = mapRedTeamReviewToAnnotations({
      unstatedAssumptions: [{
        claim: 'The access clause will hold through the next negotiating round.',
        whyFlagged: 'No current implementation signal is cited.',
        severity: 'high',
      }],
      sourceDiversityIssues: ['Central claim leans on one official source.'],
      motivatedReasoningRedFlags: ['Recommendation favors the preselected ceasefire pause.'],
      missingIntelligenceGaps: ['No field verification from access monitors.'],
      confidenceAdjustment: {
        suggestedConfidence: 'low',
        rationale: 'Core claims are under-sourced.',
      },
    }, paragraphs);

    expect(annotations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        affectedParagraph: 1,
        severity: 'high',
        source: 'assumption',
      }),
      expect.objectContaining({
        source: 'motivated-reasoning',
        severity: 'high',
      }),
      expect.objectContaining({
        source: 'confidence',
        challenge: expect.stringContaining('Confidence should move to low'),
      }),
    ]));
  });
});

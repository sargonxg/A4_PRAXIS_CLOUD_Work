import { describe, expect, it } from 'vitest';
import { buildContextHealthReport } from '@/lib/context/context-health';

describe('context health', () => {
  it('scores a grounded context as ready and limits next actions', () => {
    const report = buildContextHealthReport({
      hasUserCore: true,
      hasSituationCore: true,
      sourceCount: 4,
      documentCount: 1,
      actorCount: 4,
      hasTimeline: true,
      evidenceGapCount: 0,
      hasDraft: true,
      situationHref: '/app/workbench/example',
    });

    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.label).toBe('Ready to draft');
    expect(report.nextActions).toHaveLength(1);
    expect(report.nextActions[0]?.id).toBe('ask-context');
  });

  it('prioritizes missing context before drafting', () => {
    const report = buildContextHealthReport({
      hasUserCore: false,
      hasSituationCore: false,
      sourceCount: 0,
      actorCount: 0,
      hasTimeline: false,
      evidenceGapCount: 4,
      hasDraft: false,
    });

    expect(report.score).toBeLessThan(55);
    expect(report.label).toBe('Context incomplete');
    expect(report.nextActions.map((action) => action.id)).toEqual([
      'attach-user-core',
      'attach-situation-core',
      'attach-sources',
    ]);
  });
});

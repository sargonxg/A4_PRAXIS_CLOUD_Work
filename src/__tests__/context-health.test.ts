import { describe, expect, it } from 'vitest';
import { sanitizeActiveContextStack } from '@/lib/context/active-context-stack';
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

describe('active context stack', () => {
  it('sanitizes persisted stack state for owner-scoped storage', () => {
    const stack = sanitizeActiveContextStack({
      stackId: 'default',
      userModelId: 'policy-analyst',
      situationId: 'ai-reg-2026',
      sourceIds: ['source-1', '', 42, 'source-2'],
      documentIds: ['doc-1'],
      outputGoal: 'Board memo',
      canvasLayout: {
        actor: { x: 12.2, y: 48.8 },
        broken: { x: 'nope' },
      },
    });

    expect(stack.userModelId).toBe('policy-analyst');
    expect(stack.situationId).toBe('ai-reg-2026');
    expect(stack.sourceIds).toEqual(['source-1', 'source-2']);
    expect(stack.documentIds).toEqual(['doc-1']);
    expect(stack.outputGoal).toBe('Board memo');
    expect(stack.canvasLayout.actor).toEqual({ x: 12, y: 49 });
    expect(stack.canvasLayout.broken).toBeUndefined();
  });
});

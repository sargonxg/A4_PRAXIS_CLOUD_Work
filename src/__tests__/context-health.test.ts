import { describe, expect, it } from 'vitest';
import { sanitizeActiveContextStack } from '@/lib/context/active-context-stack';
import { buildContextHealthReport } from '@/lib/context/context-health';
import {
  DEMO_SITUATION_CORES,
  DEMO_USER_CORES,
  getDemoGraphCore,
  getDemoOutputCore,
  getDemoSourceCores,
  getDemoUserCoreForSituation,
} from '@/lib/context/demo-core-objects';

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

describe('demo context core objects', () => {
  it('exposes the three v5 demo Situation Cores as structured forkable objects', () => {
    expect(DEMO_SITUATION_CORES.map((core) => core.title)).toEqual([
      'Indo-Pacific Strategic Competition 2026',
      'AI Regulation 2026 - US Federal and State Landscape',
      'Food and Beverage Regulatory and Sustainability Outlook 2026',
    ]);

    for (const core of DEMO_SITUATION_CORES) {
      expect(core.kind).toBe('situation');
      expect(core.isDemo).toBe(true);
      expect(core.ownerUid).toBe('_demo');
      expect(core.actors.length).toBeGreaterThanOrEqual(8);
      expect(core.sources.length).toBeGreaterThanOrEqual(10);
      expect(core.timeline.length).toBeGreaterThanOrEqual(6);
      expect(core.nextMoves).toHaveLength(3);
    }
  });

  it('exposes persona User Cores and companion source/graph/output cores', () => {
    expect(DEMO_USER_CORES).toHaveLength(3);

    const userCore = getDemoUserCoreForSituation('ai-regulation-2026');
    const sourceCores = getDemoSourceCores('ai-regulation-2026');
    const graphCore = getDemoGraphCore('ai-regulation-2026');
    const outputCore = getDemoOutputCore('ai-regulation-2026');

    expect(userCore?.kind).toBe('user');
    expect(userCore?.audience).toContain('legislators');
    expect(sourceCores.length).toBeGreaterThanOrEqual(10);
    expect(sourceCores[0]?.kind).toBe('source');
    expect(graphCore?.nodeCount).toBeGreaterThan(100);
    expect(outputCore?.draftSections).toContain('Evidence and gaps');
  });
});

import { describe, expect, it } from 'vitest';
import { sanitizeActiveContextStack } from '@/lib/context/active-context-stack';
import { buildContextHealthReport } from '@/lib/context/context-health';
import { autoStructureDocument } from '@/lib/documents/auto-structure';
import { buildClaimEvidenceReport } from '@/lib/documents/evidence-review';
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

  it('keeps next actions to the three smallest deterministic fixes', () => {
    const report = buildContextHealthReport({
      hasUserCore: true,
      hasSituationCore: true,
      sourceCount: 0,
      actorCount: 0,
      hasTimeline: false,
      evidenceGapCount: 5,
      hasDraft: false,
      situationHref: '/app/workbench/context-1?tab=library',
    });

    expect(report.nextActions).toHaveLength(3);
    expect(report.nextActions.map((action) => action.id)).toEqual([
      'attach-sources',
      'map-actors',
      'repair-timeline',
    ]);
    expect(report.nextActions.every((action) => action.href !== '/app/tools' || action.id === 'map-actors')).toBe(true);
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
      evidenceGaps: [
        {
          id: 'gap-1',
          situationId: 'ai-reg-2026',
          subjectId: 'draft-1',
          claimId: 'claim-1',
          claim: 'Current access is stable.',
          status: 'needs_date_check',
          sourceHints: ['UN update', 9],
          savedAt: '2026-05-13T00:00:00.000Z',
        },
        { id: 'broken', claim: 'missing fields' },
      ],
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
    expect(stack.evidenceGaps).toHaveLength(1);
    expect(stack.evidenceGaps[0]?.status).toBe('needs_date_check');
    expect(stack.evidenceGaps[0]?.sourceHints).toEqual(['UN update']);
    expect(stack.evidenceGaps[0]?.resolvedAt).toBeNull();
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

describe('document auto-structure', () => {
  it('extracts title, date, claims, actors, and timeline candidates from text', () => {
    const structured = autoStructureDocument({
      filename: 'un-report.pdf',
      fileType: 'pdf',
      parser: 'pdf-parse',
      text: `United Nations Situation Report

On May 12, 2026, the United Nations Mission reported that the Council should preserve the ceasefire monitoring lane.
The Ministry of Foreign Affairs confirmed that border access has reopened for humanitarian convoys.`,
    });

    expect(structured.title).toBe('United Nations Situation Report');
    expect(structured.date).toBe('May 12, 2026');
    expect(structured.keyClaims.length).toBeGreaterThanOrEqual(2);
    expect(structured.actors).toContain('United Nations Mission');
    expect(structured.timelineCandidates[0]?.date).toBe('May 12, 2026');
    expect(structured.provenance.parser).toBe('pdf-parse');
    expect(structured.provenance.spans.find((span) => span.kind === 'claim')?.charStart).toBeGreaterThanOrEqual(0);
  });
});

describe('claim-level evidence reports', () => {
  it('classifies supported, weak, unsupported, and date-check claims', () => {
    const report = buildClaimEvidenceReport(
      'draft-1',
      [
        {
          id: 'section-1',
          heading: 'Assessment',
          body: 'The Council should preserve the ceasefire monitoring lane because the United Nations Mission reports repeated access incidents. Current access is stable.',
        },
        { id: 'section-2', heading: 'Gap', body: 'An uncited assertion remains unresolved.' },
      ],
      [
        'United Nations Mission access incidents ceasefire monitoring lane',
        'Council ceasefire monitoring lane diplomatic source',
      ],
      {
        situationId: 'situation-1',
        draftId: 'draft-1',
        savedGaps: [{ claimId: 'section-2:claim-1', resolvedAt: null }],
      },
    );

    expect(report.situationId).toBe('situation-1');
    expect(report.draftId).toBe('draft-1');
    expect(report.savedCount).toBe(1);
    expect(report.summary.supported).toBeGreaterThanOrEqual(1);
    expect(report.summary.needs_date_check).toBeGreaterThanOrEqual(1);
    expect(report.summary.unsupported).toBeGreaterThanOrEqual(1);
    expect(report.claims.find((claim) => claim.status === 'unsupported')?.actions).toContain('add to evidence gaps');
  });
});

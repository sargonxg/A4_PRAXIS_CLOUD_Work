import { describe, expect, it } from 'vitest';
import { getToolById } from '@/lib/constants/tool-registry';
import { getToolPackageActions } from '@/lib/tools/tool-package-actions';
import { computeToolPackageReadiness } from '@/lib/tools/tool-package-readiness';
import { getToolPathPackageSummary } from '@/lib/tools/tool-path-taxonomy';
import type { Situation } from '@/types/situation';

const situation: Partial<Situation> = {
  id: 'sit-1',
  name: 'Test Situation',
  region: 'Test Region',
  description: 'A detailed situation description with enough context to support tool readiness.',
  actors: ['Actor A', 'Actor B', 'Actor C'],
  actorCount: 3,
  graphEntities: 16,
  documentCount: 2,
  sourceUrls: ['https://example.com/source'],
  contextNotes: 'Audience: policy director. Red line: do not invent facts.',
  updatedAt: new Date().toISOString(),
};

describe('tool package readiness', () => {
  it('registers GraphOps as a first-class core tool', () => {
    const graphops = getToolById('graphops');
    expect(graphops?.aiRoute).toBe('/api/graph/ops');
    expect(graphops?.relatedTools).toContain('conflict-graph');
  });

  it('scores a package using saved outputs, context readiness, and AI wiring', () => {
    const core = getToolPathPackageSummary('generic-core');
    expect(core).toBeTruthy();

    const readiness = computeToolPackageReadiness(core!, situation, {
      dashboard: { health: 'green', generatedAt: new Date().toISOString() },
      'source-scout': { health: 'green', generatedAt: new Date().toISOString() },
      graphops: { health: 'green', generatedAt: new Date().toISOString() },
    });

    expect(readiness.assessedToolIds).toContain('graphops');
    expect(readiness.counts.aiWired).toBe(readiness.counts.aiTotal);
    expect(readiness.counts.generated).toBe(3);
    expect(readiness.score).toBeGreaterThan(40);
    expect(readiness.nextAction).toMatch(/Run|Refresh|Package|Add/);
  });

  it('surfaces graph, source, and document blockers as package warnings', () => {
    const core = getToolPathPackageSummary('generic-core');
    expect(core).toBeTruthy();

    const readiness = computeToolPackageReadiness(core!, {
      id: 'sit-thin',
      name: 'Thin Situation',
      region: 'Test Region',
      description: 'Thin case file',
      actors: ['Actor A'],
      graphEntities: 0,
      documentCount: 0,
      sourceUrls: [],
    });

    expect(readiness.warnings.map((warning) => warning.type)).toContain('graph');
    expect(readiness.warnings.map((warning) => warning.type)).toContain('sources');
    expect(readiness.warnings.map((warning) => warning.type)).toContain('documents');
    expect(readiness.state).toBe('red');
  });

  it('recommends concrete package actions from readiness gaps', () => {
    const core = getToolPathPackageSummary('generic-core');
    expect(core).toBeTruthy();

    const readiness = computeToolPackageReadiness(core!, {
      ...situation,
      graphEntities: 0,
      documentCount: 0,
      sourceUrls: [],
    });
    const actions = getToolPackageActions(core!, readiness, situation);

    expect(actions[0]?.kind).toBe('seed-graph');
    expect(actions.some((action) => action.kind === 'add-sources')).toBe(true);
    expect(actions.some((action) => action.kind === 'upload-documents')).toBe(true);
    expect(actions.every((action) => action.href.startsWith('/'))).toBe(true);
  });
});

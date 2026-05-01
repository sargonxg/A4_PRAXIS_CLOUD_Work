import { describe, expect, it } from 'vitest';
import { getToolById } from '@/lib/constants/tool-registry';
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
      graphops: { health: 'green', generatedAt: new Date().toISOString() },
      'conflict-graph': { health: 'yellow', generatedAt: new Date().toISOString(), isStale: true },
    });

    expect(readiness.assessedToolIds).toContain('graphops');
    expect(readiness.counts.aiWired).toBe(readiness.counts.aiTotal);
    expect(readiness.counts.generated).toBe(3);
    expect(readiness.score).toBeGreaterThan(40);
    expect(readiness.nextAction).toMatch(/Run|Refresh|Package|Add/);
  });
});

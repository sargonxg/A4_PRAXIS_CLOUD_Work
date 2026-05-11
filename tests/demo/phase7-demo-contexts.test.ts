import { describe, expect, it } from 'vitest';
import { V5_DEMO_CASE_MODULES } from '@/lib/cases/v5-demo-contexts';
import { getCaseModule } from '@/lib/cases/registry';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';

describe('phase 7 demo contexts', () => {
  it('registers three public demo contexts with dense source and episode coverage', () => {
    expect(V5_DEMO_CASE_MODULES).toHaveLength(3);

    for (const context of V5_DEMO_CASE_MODULES) {
      const situationEpisodes = context.episodes?.filter((episode) => episode.strand === 'situation') ?? [];
      const workEpisodes = context.episodes?.filter((episode) => episode.strand === 'work') ?? [];

      expect(getCaseModule(context.id)?.id).toBe(context.id);
      expect(context.sources.length).toBeGreaterThanOrEqual(30);
      expect(situationEpisodes.length).toBeGreaterThanOrEqual(8);
      expect(workEpisodes.length).toBeGreaterThanOrEqual(3);
      expect(context.situation.actorCount).toBeGreaterThanOrEqual(30);
      expect(context.truthLayers.claim.nodeCount).toBeGreaterThanOrEqual(80);
    }
  });

  it('keeps cached demo answers under the 200ms display target', () => {
    const cachedResponses = V5_DEMO_CASE_MODULES.flatMap((context) => context.cachedResponses ?? []);

    expect(cachedResponses).toHaveLength(9);
    expect(cachedResponses.every((response) => response.latencyTargetMs <= 200)).toBe(true);
    expect(cachedResponses.every((response) => response.targetPath.startsWith('/'))).toBe(true);
  });

  it('ships the three public user model seeds needed by the demo paths', () => {
    expect(PUBLIC_USER_MODELS.map((model) => model.modelId)).toEqual(
      expect.arrayContaining([
        'foreign-policy-analyst',
        'domestic-policy-analyst',
        'corporate-strategic-analyst',
      ]),
    );
  });
});

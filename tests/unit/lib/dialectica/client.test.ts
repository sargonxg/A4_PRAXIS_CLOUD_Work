import { afterEach, describe, expect, it, vi } from 'vitest';
import { runDialecticaRecipe } from '@/lib/dialectica/client';

describe('runDialecticaRecipe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts to the recipe proxy and returns typed JSON', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ recipe: 'LEVERAGE-TRACE', paths: [], provenance: { ruleId: 'LEVERAGE-TRACE', inputNodeIds: [], modelVersion: 'test', confidence: 1 } }),
    } as Response);

    const result = await runDialecticaRecipe('leverage-trace', {
      graph: { nodes: [], edges: [] },
      params: { actor_a_id: 'actor-a', actor_b_id: 'actor-b' },
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/dialectica/reason/leverage-trace', expect.objectContaining({ method: 'POST' }));
    expect(result.provenance.ruleId).toBe('LEVERAGE-TRACE');
  });
});

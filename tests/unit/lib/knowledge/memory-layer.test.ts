import { describe, expect, it, vi } from 'vitest';
import { recallAdvisoryMemory } from '@/lib/knowledge/memory-layer';

describe('memory layer advisory recall', () => {
  it('normalizes enabled Cognee recall into capped non-canonical capsule memory', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      status: 'searched',
      candidates: [
        {
          id: 'hit-1',
          text: 'A recalled advisory fact.',
          score: 0.91,
          sourceId: 'source-1',
        },
      ],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const result = await recallAdvisoryMemory('u1', {
      capsuleId: 'cap-1',
      ownerUid: 'u1',
      label: 'Capsule',
      summary: 'Recall query',
      v3: {
        memoryPosture: {
          cogneeDatasetId: 'owner:u1/capsule:cap-1/v1',
          advisoryCogneeRecall: [],
          cogneeMode: 'advisory-only',
        },
      },
    }, { enabled: true, fetcher: fetcher as never });

    expect(fetcher).toHaveBeenCalledWith('/api/memory/recall', expect.objectContaining({ method: 'POST' }));
    expect(result.status).toBe('enabled');
    expect(result.candidates[0]).toMatchObject({
      confidence: 0.6,
      canonical: false,
      provenance: 'source-1',
    });
    expect(result.capsule.v3?.memoryPosture?.advisoryCogneeRecall?.[0]).toContain('confidence 0.600');
  });

  it('returns disabled without fetching when the Cognee gate is off', async () => {
    const fetcher = vi.fn();
    const result = await recallAdvisoryMemory('u1', { capsuleId: 'cap-1' }, { enabled: false, fetcher: fetcher as never });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'disabled', candidates: [] });
  });
});

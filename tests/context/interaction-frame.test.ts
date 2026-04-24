import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase/admin', () => {
  const docs = [
    { toolId: 'advisory', ranAt: '2026-04-20T10:00:00Z', summary: 'Advisory run' },
    { toolId: 'risk-monitor', ranAt: '2026-04-20T09:00:00Z', summary: 'Risk up' },
  ];
  return {
    adminDb: {
      collection: () => ({
        orderBy: () => ({
          limit: () => ({
            get: async () => ({ docs: docs.map((d) => ({ data: () => d })) }),
          }),
        }),
      }),
    },
  };
});

import { deriveInteractionFrame } from '@/lib/context/interaction-frame';

describe('deriveInteractionFrame', () => {
  it('returns recent tool runs', async () => {
    const f = await deriveInteractionFrame('u', 's');
    expect(f.recentTools).toHaveLength(2);
    expect(f.recentTools[0].toolId).toBe('advisory');
    expect(f.recentTools[0].ranAt).toBe('2026-04-20T10:00:00Z');
    expect(f.recentTools[0].summary).toBe('Advisory run');
    expect(f.activeSituationDrafts).toBe(0);
  });

  it('returns empty frame when situationId is null', async () => {
    const f = await deriveInteractionFrame('u', null);
    expect(f.recentTools).toEqual([]);
    expect(f.activeSituationDrafts).toBe(0);
  });
});

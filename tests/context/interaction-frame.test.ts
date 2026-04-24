import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase/admin', () => {
  const docs = [
    {
      id: 'advisory',
      toolId: 'advisory',
      generatedAt: { toDate: () => new Date('2026-04-20T10:00:00Z') },
      output: { summary: 'Advisory run' },
    },
    {
      id: 'risk-monitor',
      toolId: 'risk-monitor',
      generatedAt: { toDate: () => new Date('2026-04-20T09:00:00Z') },
      output: { summary: 'Risk up' },
    },
    {
      id: 'legacy-string-out',
      toolId: 'legacy-string-out',
      generatedAt: '2026-04-20T08:00:00Z',
      output: 'Plain-string output should still summarize',
    },
    {
      id: 'no-summary',
      toolId: 'no-summary',
      generatedAt: { toDate: () => new Date('2026-04-20T07:00:00Z') },
      output: { headline: 'Headline fallback kicks in' },
    },
  ];
  return {
    adminDb: {
      collection: () => ({
        orderBy: () => ({
          limit: () => ({
            get: async () => ({
              docs: docs.map((d) => ({ id: d.id, data: () => d })),
            }),
          }),
        }),
      }),
    },
  };
});

import { deriveInteractionFrame } from '@/lib/context/interaction-frame';

describe('deriveInteractionFrame', () => {
  it('reads from tools/ path and normalizes to { toolId, ranAt, summary }', async () => {
    const f = await deriveInteractionFrame('u', 's');
    expect(f.recentTools).toHaveLength(4);
    expect(f.recentTools[0].toolId).toBe('advisory');
    expect(f.recentTools[0].ranAt).toBe('2026-04-20T10:00:00.000Z');
    expect(f.recentTools[0].summary).toBe('Advisory run');
    expect(f.activeSituationDrafts).toBe(0);
  });

  it('handles string timestamps and string outputs', async () => {
    const f = await deriveInteractionFrame('u', 's');
    const legacy = f.recentTools.find((t) => t.toolId === 'legacy-string-out');
    expect(legacy?.ranAt).toBe('2026-04-20T08:00:00Z');
    expect(legacy?.summary).toBe('Plain-string output should still summarize');
  });

  it('falls back to headline/title when no summary field exists', async () => {
    const f = await deriveInteractionFrame('u', 's');
    const ns = f.recentTools.find((t) => t.toolId === 'no-summary');
    expect(ns?.summary).toBe('Headline fallback kicks in');
  });

  it('returns empty frame when situationId is null', async () => {
    const f = await deriveInteractionFrame('u', null);
    expect(f.recentTools).toEqual([]);
    expect(f.activeSituationDrafts).toBe(0);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map<string, Array<Record<string, unknown>>>();

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: (p: string) => ({
      orderBy: () => ({
        limit: (n: number) => ({
          get: async () => ({
            docs: (store.get(p) ?? []).slice(-n).map((d) => ({ data: () => d })),
          }),
        }),
      }),
      add: async (d: Record<string, unknown>) => {
        const arr = store.get(p) ?? [];
        arr.push(d);
        store.set(p, arr);
        return { id: `${arr.length}` };
      },
    }),
  },
}));

describe('advisor-history-service', () => {
  beforeEach(() => {
    store.clear();
  });

  it('appends + reads last N turns', async () => {
    const { appendTurn, readRecentTurns } = await import('@/lib/firebase/advisor-history-service');
    await appendTurn('u', 's', 'adeyemi', { role: 'user', content: 'hi', at: '2026-01-01T00:00:00Z' });
    await appendTurn('u', 's', 'adeyemi', { role: 'assistant', content: 'hello', at: '2026-01-01T00:00:01Z' });
    const turns = await readRecentTurns('u', 's', 'adeyemi', 8);
    expect(turns).toHaveLength(2);
    expect(turns[0].role).toBe('user');
    expect(turns[1].role).toBe('assistant');
  });

  it('respects the limit parameter', async () => {
    const { appendTurn, readRecentTurns } = await import('@/lib/firebase/advisor-history-service');
    for (let i = 0; i < 10; i++) {
      await appendTurn('u', 's', 'reyes', { role: 'user', content: `m${i}`, at: `2026-01-0${i}T00:00:00Z` });
    }
    const turns = await readRecentTurns('u', 's', 'reyes', 3);
    expect(turns).toHaveLength(3);
  });
});

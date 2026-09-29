import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  writes: [] as unknown[],
  unsubscribe: vi.fn(),
  subscriptions: [] as string[],
}));

// Exercise the real subscription callbacks against a bounded, ordered Firestore
// fixture. React scheduling is outside this unit; setters record received data.
vi.mock('react', () => ({
  useState: (initial: unknown) => [initial, (value: unknown) => fixture.writes.push(value)],
  useEffect: (effect: () => unknown) => effect(),
  useMemo: (compute: () => unknown) => compute(),
}));
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: { id: 'owner-1' } }) }));
vi.mock('@/lib/firebase/config', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...parts: string[]) => ({ path: parts.join('/'), document: true }),
  collection: (_db: unknown, ...parts: string[]) => ({ path: parts.join('/') }),
  orderBy: (field: string, direction: string) => ({ field, direction }),
  limit: (count: number) => ({ count }),
  where: (_field: string, _operator: string, status: string) => ({ status }),
  query: (reference: object, ...clauses: object[]) => Object.assign({}, reference, ...clauses),
  onSnapshot: (
    reference: { path: string; document?: boolean; direction?: string; count?: number; status?: string },
    receive: (snapshot: unknown) => void,
  ) => {
    fixture.subscriptions.push(reference.path);
    if (reference.document) {
      receive({ exists: () => false });
      return fixture.unsubscribe;
    }
    const records = Array.from({ length: 30 }, (_, index) => ({
      id: `receipt-${index + 1}`,
      data: () => ({
        runId: 'run-1',
        eventType: index === 29 ? 'thread_return_posted' : 'progress',
        toolId: `tool-${index + 1}`,
        status: index === 0 || index === 29 ? 'pending' : 'approved',
        createdAt: new Date(Date.UTC(2026, 8, 29, 0, index)).toISOString(),
        requestedAt: new Date(Date.UTC(2026, 8, 29, 0, index)).toISOString(),
      }),
    }));
    if (reference.direction === 'desc') records.reverse();
    const matching = reference.status ? records.filter((record) => record.data().status === reference.status) : records;
    receive({ docs: matching.slice(0, reference.count) });
    return fixture.unsubscribe;
  },
}));

import { useAgentRunSnapshots } from '@/hooks/useAgentRunSnapshots';

describe('agent run snapshot windows', () => {
  beforeEach(() => {
    fixture.writes.length = 0;
    fixture.subscriptions.length = 0;
  });

  it('keeps the latest events, tool calls and approvals in chronological order after the limit is reached', () => {
    useAgentRunSnapshots('run-1', { limit: 20 });
    const batches = fixture.writes.filter((value): value is Array<{ id: string; rawType?: string; status?: string }> => (
      Array.isArray(value) && value.length > 0
    ));
    expect(batches).toHaveLength(4);
    for (const batch of batches.slice(0, 3)) {
      expect(batch).toHaveLength(20);
      expect(batch[0].id).toBe('receipt-11');
      expect(batch.at(-1)?.id).toBe('receipt-30');
    }
    expect(batches[0].at(-1)?.rawType).toBe('thread_return_posted');
    expect(batches[2].at(-1)?.status).toBe('pending');
    // An older outstanding decision must remain actionable outside the recent window.
    expect(batches[3].map((approval) => approval.id)).toEqual(['receipt-1', 'receipt-30']);
  });

  it('does not subscribe or expose cached data while disabled', () => {
    const state = useAgentRunSnapshots('run-1', { enabled: false });
    expect(fixture.subscriptions).toEqual([]);
    expect(state).toEqual({ run: null, events: [], toolCalls: [], approvals: [], isConnected: false, error: null });
  });
});

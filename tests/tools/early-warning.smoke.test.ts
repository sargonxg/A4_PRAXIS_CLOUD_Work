import { describe, it, expect, vi } from 'vitest';

const updates: Array<Record<string, unknown>> = [];

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collectionGroup: () => ({
      where: () => ({
        limit: () => ({
          get: async () => ({
            docs: [
              { ref: { update: async (d: Record<string, unknown>) => { updates.push(d); return {} as FirebaseFirestore.WriteResult; } } },
              { ref: { update: async (d: Record<string, unknown>) => { updates.push(d); return {} as FirebaseFirestore.WriteResult; } } },
            ],
          }),
        }),
      }),
    }),
  },
}));

describe('cron/early-warning-refresh', () => {
  it('rejects requests without the cron secret', async () => {
    process.env.CRON_SECRET = 'expected';
    const { GET } = await import('@/app/api/cron/early-warning-refresh/route');
    const res = await GET(new Request('http://localhost/api/cron/early-warning-refresh'));
    expect(res.status).toBe(403);
  });

  it('marks active situations as pending when secret matches', async () => {
    process.env.CRON_SECRET = 'expected';
    updates.length = 0;
    const { GET } = await import('@/app/api/cron/early-warning-refresh/route');
    const res = await GET(new Request('http://localhost/api/cron/early-warning-refresh', {
      headers: { 'x-cron-secret': 'expected' },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.marked).toBe(2);
    expect(updates.length).toBe(2);
    expect(updates[0].pendingEscalationRefresh).toBe(true);
  });
});

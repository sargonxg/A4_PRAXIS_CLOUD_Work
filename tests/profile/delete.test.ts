import { describe, it, expect, vi, beforeEach } from 'vitest';

const writes: Array<Record<string, unknown>> = [];
const auditWrites: Array<Record<string, unknown>> = [];

vi.mock('@/lib/firebase/admin', () => {
  const profileData = {
    identity: { role: 'un_official', seniority: 'senior', org: 'UN', team: 'T' },
    perspective: {
      mandate: 'watch',
      lenses: ['diplomatic'],
      regions: ['Sahel'],
      audience: 'myself',
      primaryDomain: 'generic',
      secondaryDomains: [],
    },
    workingStyle: {
      sourceCategories: [],
      language: 'en',
      redLines: ['no assassinate'],
      analyticalStyle: 'rapid_brief',
    },
    meta: { version: 3, completedAt: 'x', lastEditedAt: 'x', skipCount: 0, createdAt: 'x', deletedAt: null },
    embedding: { vector: [0.1], generatedAt: null, model: 'm' },
  };

  return {
    adminDb: {
      doc: () => ({
        get: async () => ({ exists: true, data: () => profileData }),
        set: async (d: Record<string, unknown>) => { writes.push(d); },
      }),
      collection: () => ({
        add: async (d: Record<string, unknown>) => { auditWrites.push(d); return { id: 'audit-1' }; },
      }),
    },
  };
});

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: (req: Request, user: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>) =>
    async (req: Request) => h(req, { uid: 'u1', email: 'e@e', name: 'E', isDemo: false }),
}));

describe('DELETE /api/profile', () => {
  beforeEach(() => {
    writes.length = 0;
    auditWrites.length = 0;
  });

  it('scrubs PII and marks deletedAt', async () => {
    const { DELETE } = await import('@/app/api/profile/route');
    const res = await DELETE(new Request('http://localhost/api/profile', { method: 'DELETE' }));
    expect(res.status).toBe(200);
    expect(writes.length).toBe(1);
    const wrote = writes[0] as {
      identity: { org: string; team: string };
      perspective: { mandate: string; regions: string[] };
      workingStyle: { redLines: string[] };
      embedding?: unknown;
      meta: { deletedAt: string | null };
    };
    expect(wrote.identity.org).toBe('');
    expect(wrote.identity.team).toBe('');
    expect(wrote.perspective.mandate).toBe('');
    expect(wrote.perspective.regions).toEqual([]);
    expect(wrote.workingStyle.redLines).toEqual([]);
    expect(wrote.embedding).toBeUndefined();
    expect(wrote.meta.deletedAt).not.toBeNull();
  });

  it('writes an audit trail entry', async () => {
    const { DELETE } = await import('@/app/api/profile/route');
    await DELETE(new Request('http://localhost/api/profile', { method: 'DELETE' }));
    expect(auditWrites.length).toBe(1);
    expect(auditWrites[0].action).toBe('profile.delete');
  });
});

import { describe, it, expect, vi } from 'vitest';

const committed: Array<Record<string, unknown>> = [];

vi.mock('@/lib/firebase/admin', () => {
  // A minimal DocumentReference-like stub used for `ref.get()` calls from the
  // route handler's pre-check (via getAnalystProfile / isProfileComplete).
  // We return a fully-populated, "complete" AnalystProfile so the pre-check
  // passes and the transactional completion path runs.
  const completeProfile = {
    identity: { role: 'un_official', seniority: 'mid', org: 'UN', team: 'DPPA' },
    perspective: {
      mandate: 'Monitor escalation dynamics in the Sahel and advise senior leadership on diplomatic options.',
      lenses: ['diplomatic', 'security'],
      regions: ['Sahel'],
      audience: 'senior_leadership',
      primaryDomain: 'generic',
      secondaryDomains: [],
    },
    workingStyle: {
      sourceCategories: ['foundational'],
      language: 'en',
      redLines: [],
      analyticalStyle: 'rapid_brief',
    },
    meta: { version: 0, completedAt: null, lastEditedAt: null, skipCount: 0, createdAt: null, deletedAt: null },
  };

  const docStub = {
    get: async () => ({ exists: true, data: () => completeProfile }),
  };

  const subColStub = { doc: () => docStub };
  const userDocStub = {
    get: async () => ({ exists: true, data: () => ({}) }),
    collection: () => subColStub,
  };
  const topColStub = { doc: () => userDocStub };

  const adminDb = {
    runTransaction: async (fn: (tx: { set: (r: unknown, d: Record<string, unknown>) => void; get: (r: unknown) => Promise<{ exists: boolean; data?: () => unknown }>; update: (r: unknown, d: Record<string, unknown>) => void }) => Promise<unknown>) =>
      fn({
        set: (_r, d) => { committed.push(d); },
        get: async () => ({ exists: true, data: () => completeProfile }),
        update: (_r, d) => { committed.push(d); },
      }),
    doc: () => docStub,
    collection: () => topColStub,
  };

  return {
    adminDb,
    getAdminDbOrThrow: () => adminDb,
  };
});

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: (req: Request, user: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>) =>
    async (req: Request) => h(req, { uid: 'u1', email: 'e@e', name: 'E', isDemo: false }),
}));

vi.mock('@google-cloud/pubsub', () => ({
  PubSub: class { topic() { return { publishMessage: async () => 'ok' }; } },
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => undefined,
  }),
}));

vi.mock('@/lib/auth/cookie-signer', () => ({
  signCookie: (v: string) => v,
  verifyCookie: () => null,
}));

vi.mock('@/lib/knowledge/embedding-service', () => ({
  generateEmbedding: async () => null,
}));

const { POST } = await import('@/app/api/onboarding/complete/route');

describe('onboarding complete', () => {
  it('writes profile + meta.completedAt atomically', async () => {
    const req = new Request('http://localhost/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const completeWrites = committed.filter(
      (d) => typeof d === 'object' && d !== null && 'meta' in d && (d as { meta?: { completedAt?: unknown } }).meta?.completedAt
    );
    expect(completeWrites.length).toBeGreaterThan(0);
  });
});

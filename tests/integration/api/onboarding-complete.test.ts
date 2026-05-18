import { describe, it, expect, vi, beforeEach } from 'vitest';

const cookieSet = vi.fn();

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: unknown) => (req: Request) =>
    (h as (r: Request, u: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>)(req, {
      uid: 'u1', email: 'a@b', name: 'A', isDemo: false,
    }),
}));
vi.mock('@/lib/firebase/analyst-profile-admin', () => ({
  getAnalystProfile: vi.fn().mockResolvedValue({
    identity: { role: 'un_official', seniority: 'senior', org: 'UN', team: 'DPPA' },
    perspective: { mandate: 'x'.repeat(60), lenses: ['diplomatic'], regions: ['Sahel'], audience: 'senior_leadership' },
    workingStyle: { sourceCategories: [], language: 'en', redLines: [], analyticalStyle: 'rapid_brief' },
    meta: { version: 0, skipCount: 0, completedAt: null, lastEditedAt: null, createdAt: null },
  }),
  completeAnalystProfile: vi.fn().mockResolvedValue({ versionId: 'v1' }),
}));
vi.mock('@/lib/firebase/profile-events', () => ({
  publishProfileEvent: vi.fn().mockResolvedValue(true),
  refreshProfileEmbedding: vi.fn().mockResolvedValue(true),
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => ({
      value: JSON.stringify({
        token: 'firebase-token',
        onboarded: false,
        onboardingComplete: false,
        onboardingSkipped: true,
      }),
    }),
    set: cookieSet,
  }),
}));
vi.mock('@/lib/auth/cookie-signer', () => ({
  verifyCookie: (value: string) => value,
  signCookie: (value: string) => `signed:${value}`,
}));

import { POST } from '@/app/api/onboarding/complete/route';

describe('POST /api/onboarding/complete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with versionId and redirect', async () => {
    const req = new Request('http://x/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ createFirstSituation: false }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.versionId).toBe('v1');
    expect(data.redirectTo).toBe('/app');
  });

  it('returns the cockpit builder intent when createFirstSituation true', async () => {
    const req = new Request('http://x/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ createFirstSituation: true }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.redirectTo).toBe('/app?panel=builder&fromOnboarding=1');
  });

  it('refreshes the session cookie as completed onboarding', async () => {
    const req = new Request('http://x/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ createFirstSituation: false }),
    });

    await POST(req);

    expect(cookieSet).toHaveBeenCalledWith(
      'tacitus-auth-session',
      expect.stringContaining('"onboardingComplete":true'),
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
    expect(cookieSet.mock.calls.at(-1)?.[1]).toContain('"onboarded":true');
  });
});

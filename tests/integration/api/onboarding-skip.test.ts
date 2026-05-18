import { describe, expect, it, vi, beforeEach } from 'vitest';

const cookieSet = vi.fn();
const sessionCookieValue = JSON.stringify({
  token: 'firebase-token',
  onboarded: false,
  onboardingComplete: false,
  user: { uid: 'u1', email: 'a@b.test' },
});

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: unknown) => (req: Request) =>
    (h as (r: Request, u: { uid: string; email: string; name: string; isDemo: boolean }) => Promise<Response>)(req, {
      uid: 'u1', email: 'a@b.test', name: 'A', isDemo: false,
    }),
}));

vi.mock('@/lib/firebase/analyst-profile-admin', () => ({
  incrementOnboardingSkip: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => ({ value: sessionCookieValue }),
    set: cookieSet,
  }),
}));

vi.mock('@/lib/auth/cookie-signer', () => ({
  verifyCookie: (value: string) => value,
  signCookie: (value: string) => `signed:${value}`,
}));

const { POST } = await import('@/app/api/onboarding/skip/route');

describe('POST /api/onboarding/skip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes the session cookie with an explicit onboardingSkipped flag accepted by routing', async () => {
    const res = await POST(new Request('http://localhost/api/onboarding/skip', { method: 'POST' }));

    expect(res.status).toBe(200);
    expect(cookieSet).toHaveBeenCalledWith(
      'tacitus-auth-session',
      expect.stringContaining('"onboardingSkipped":true'),
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });
});

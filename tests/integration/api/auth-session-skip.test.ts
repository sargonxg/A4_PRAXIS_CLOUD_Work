import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieGet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: cookieGet,
  }),
}));

vi.mock('@/lib/firebase/admin', () => ({
  verifyIdToken: vi.fn().mockResolvedValue({
    uid: 'u1',
    email: 'canary@tacitus.test',
    name: 'Canary',
    emailVerified: true,
  }),
}));

vi.mock('@/lib/firebase/analyst-profile-admin', () => ({
  hasUserSkippedOnboarding: vi.fn(),
  isUserOnboarded: vi.fn(),
}));

vi.mock('@/lib/auth/admin-gate', () => ({
  getAdminPrincipalAccess: vi.fn().mockReturnValue({ admin: false, reason: null }),
}));

vi.mock('@/lib/auth/cookie-signer', () => ({
  signCookie: (value: string) => `signed:${value}`,
  verifyCookie: (value: string) => value,
}));

const { hasUserSkippedOnboarding, isUserOnboarded } = await import('@/lib/firebase/analyst-profile-admin');
const { POST } = await import('@/app/api/auth/session/route');

describe('POST /api/auth/session onboarding skip persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue(undefined);
    vi.mocked(isUserOnboarded).mockResolvedValue(false);
    vi.mocked(hasUserSkippedOnboarding).mockResolvedValue(false);
  });

  it('keeps skipped onboarding in refreshed session cookies from the analyst profile', async () => {
    vi.mocked(hasUserSkippedOnboarding).mockResolvedValue(true);

    const res = await POST(new Request('https://praxis.tacitus.me/api/auth/session', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://praxis.tacitus.me',
        host: 'praxis.tacitus.me',
      },
      body: JSON.stringify({ token: 'firebase-id-token' }),
    }));

    expect(res.status).toBe(200);
    const cookie = (res as unknown as { cookies: { get: (name: string) => { value: string } | undefined } })
      .cookies
      .get('tacitus-auth-session');
    expect(decodeURIComponent(cookie?.value ?? '')).toContain('"onboardingSkipped":true');
  });
});

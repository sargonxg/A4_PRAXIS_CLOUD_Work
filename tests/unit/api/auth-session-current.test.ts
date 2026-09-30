import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ cookies: vi.fn(), verifyCookie: vi.fn(), verifyIdToken: vi.fn(), initializeServerUserProfile: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/auth/cookie-signer', () => ({ verifyCookie: mocks.verifyCookie, signCookie: (v: string) => v }));
vi.mock('@/lib/firebase/admin', () => ({ verifyIdToken: mocks.verifyIdToken }));
vi.mock('@/lib/firebase/user-profile-server', () => ({ initializeServerUserProfile: mocks.initializeServerUserProfile }));
vi.mock('@/lib/firebase/analyst-profile-admin', () => ({ isUserOnboarded: async () => true, hasUserSkippedOnboarding: async () => false }));
vi.mock('@/lib/auth/admin-gate', () => ({ getAdminPrincipalAccess: () => ({ admin: false, reason: 'none' }) }));
import { GET, POST } from '@/app/api/auth/session/route';

describe('current server session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue({ get: () => ({ value: 'signed-cookie' }) });
    mocks.verifyCookie.mockReturnValue(JSON.stringify({ token: 'old-token', user: { uid: 'old-owner', name: 'Old' }, onboarded: true, admin: true }));
    mocks.verifyIdToken.mockResolvedValue({ uid: 'owner', email: 'owner@example.test', name: 'Current', emailVerified: true });
    mocks.initializeServerUserProfile.mockResolvedValue({ status: 'existing' });
  });
  it('verifies current identity instead of trusting saved identity or admin flags', async () => {
    const response = await GET();
    expect(await response.json()).toMatchObject({ authenticated: true, user: { id: 'owner', name: 'Current', admin: false } });
    expect(mocks.verifyIdToken).toHaveBeenCalledWith('old-token');
  });
  it.each(['auth/user-not-found', 'auth/user-disabled', 'auth/id-token-revoked', 'auth/id-token-expired'])('clears a GET session rejected with %s', async (code) => {
    mocks.verifyIdToken.mockRejectedValue(Object.assign(new Error('rejected'), { code }));
    const response = await GET();
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('tacitus-auth-session=');
    expect(await response.json()).toMatchObject({ user: null, authenticated: false });
  });
  it.each(['GET', 'POST'])('preserves cookies during %s verification outage', async (method) => {
    mocks.verifyIdToken.mockRejectedValue(Object.assign(new Error('provider unavailable'), { code: 'auth/verification-unavailable' }));
    const response = method === 'GET' ? await GET() : await POST(new Request('https://praxis.example.test/api/auth/session', { method: 'POST', body: JSON.stringify({ token: 'token' }) }));
    expect(response.status).toBe(503);
    expect(response.headers.get('set-cookie')).toBeNull();
  });
  it('refuses a tokenless signed identity snapshot', async () => {
    mocks.verifyCookie.mockReturnValue(JSON.stringify({ user: { uid: 'old-owner' } }));
    expect((await GET()).status).toBe(401);
  });
  it('does not mint a funded-provider bypass through a sample session', async () => {
    const response = await POST(new Request('https://praxis.example.test/api/auth/session', { method: 'POST', body: JSON.stringify({ demo: true }) }));
    expect(response.status).toBe(403);
    expect(response.headers.get('set-cookie')).toBeNull();
  });
  it('initializes the account only after current identity verification', async () => {
    const response = await POST(new Request('https://praxis.example.test/api/auth/session', { method: 'POST', body: JSON.stringify({ token: 'token' }) }));
    expect(response.status).toBe(200);
    expect(mocks.initializeServerUserProfile).toHaveBeenCalledWith({ uid: 'owner', email: 'owner@example.test', name: 'Current', emailVerified: true });
    expect(mocks.verifyIdToken.mock.invocationCallOrder[0]).toBeLessThan(mocks.initializeServerUserProfile.mock.invocationCallOrder[0]);
  });
  it('preserves the cookie and reports a configured profile-store outage', async () => {
    mocks.initializeServerUserProfile.mockRejectedValue(new Error('Firestore unavailable'));
    const response = await POST(new Request('https://praxis.example.test/api/auth/session', { method: 'POST', body: JSON.stringify({ token: 'token' }) }));
    expect(response.status).toBe(503);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.json()).toMatchObject({ code: 'account_storage_unavailable' });
  });
  it('never creates a profile for a rejected identity', async () => {
    mocks.verifyIdToken.mockRejectedValue(Object.assign(new Error('disabled'), { code: 'auth/user-disabled' }));
    expect((await POST(new Request('https://praxis.example.test/api/auth/session', { method: 'POST', body: JSON.stringify({ token: 'token' }) }))).status).toBe(401);
    expect(mocks.initializeServerUserProfile).not.toHaveBeenCalled();
  });
});

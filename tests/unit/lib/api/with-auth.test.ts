import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(), verifyCookie: vi.fn(), verifyIdToken: vi.fn(),
  runTransaction: vi.fn(), logApiCall: vi.fn(),
  getAccount: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/auth/cookie-signer', () => ({ verifyCookie: mocks.verifyCookie }));
vi.mock('@/lib/firebase/admin', () => ({
  verifyIdToken: mocks.verifyIdToken,
  adminDb: { collection: () => ({ doc: () => ({ get: mocks.getAccount }) }), runTransaction: mocks.runTransaction },
}));
vi.mock('@/lib/observability/logger', () => ({ logApiCall: mocks.logApiCall }));

import { withAuth } from '@/lib/api/with-auth';

const user = { uid: 'fixture-user', email: 'fixture@example.test', name: 'Fixture', emailVerified: false };

describe('authenticated route execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue({ get: () => ({ value: 'signed-fixture' }) });
    mocks.verifyCookie.mockReturnValue(JSON.stringify({ token: 'fixture-token', issuedAt: Date.now(), user }));
    mocks.verifyIdToken.mockResolvedValue(user);
    mocks.runTransaction.mockResolvedValue(true);
    mocks.getAccount.mockResolvedValue({ data: () => ({}) });
  });

  it('runs a throwing handler once and returns an operation error', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Fixture operation failure'));
    const response = await withAuth(handler)(new Request('https://praxis.example.test/api/fixture'));
    expect(response.status).toBe(500);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(mocks.verifyIdToken).toHaveBeenCalledTimes(1);
  });

  it.each([
    'auth/id-token-revoked', 'auth/id-token-expired', 'auth/invalid-id-token',
    'auth/user-not-found', 'auth/user-disabled', 'auth/argument-error',
  ])('rejects %s even when the cookie contains a signed user snapshot', async (code) => {
    mocks.verifyIdToken.mockRejectedValue(Object.assign(new Error('Fixture authentication rejection'), { code }));
    const handler = vi.fn().mockResolvedValue(new Response('should not run'));
    const response = await withAuth(handler)(new Request('https://praxis.example.test/api/fixture'));
    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toContain('tacitus-auth-session=');
  });

  it.each(['app/network-error', 'auth/internal-error', 'app/invalid-credential'])('preserves the session during %s without executing unauthenticated work', async (code) => {
    mocks.verifyIdToken.mockRejectedValue(Object.assign(new Error('Fixture transient authentication failure'), { code }));
    const handler = vi.fn().mockResolvedValue(new Response('should not run'));
    const response = await withAuth(handler)(new Request('https://praxis.example.test/api/fixture'));
    expect(response.status).toBe(503);
    expect(handler).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('passes a verified identity and route context to one successful handler', async () => {
    const context = { params: Promise.resolve({ id: 'fixture' }) };
    const handler = vi.fn().mockResolvedValue(new Response('ok', { status: 202 }));
    const request = new Request('https://praxis.example.test/api/fixture');
    const response = await withAuth<typeof context>(handler)(request, context);
    expect(response.status).toBe(202);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(request, { ...user, isDemo: false }, context);
  });
  it('blocks writes and analysis for a deleting account, but permits cleanup retry', async () => {
    mocks.getAccount.mockResolvedValue({ data: () => ({ accountDeletionStatus: 'deleting' }) });
    const handler = vi.fn().mockResolvedValue(new Response('ok'));
    expect((await withAuth(handler)(new Request('https://praxis.example.test/api/ask', { method: 'POST' }))).status).toBe(409);
    expect(handler).not.toHaveBeenCalled();
    expect((await withAuth(handler)(new Request('https://praxis.example.test/api/account', { method: 'DELETE' }))).status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });
  it('fails closed when current account state cannot be read', async () => {
    mocks.getAccount.mockRejectedValue(new Error('provider outage'));
    const handler = vi.fn();
    const response = await withAuth(handler)(new Request('https://praxis.example.test/api/fixture'));
    expect(response.status).toBe(503);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(handler).not.toHaveBeenCalled();
  });
  it('does not execute funded-provider or write handlers with a legacy signed sample', async () => {
    mocks.verifyCookie.mockReturnValue(JSON.stringify({ demo: true }));
    const handler = vi.fn();
    expect((await withAuth(handler)(new Request('https://praxis.example.test/api/ask', { method: 'POST' }))).status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { syncFirebaseSession } from '@/lib/auth/session-sync';

describe('client session synchronization', () => {
  it('refreshes a stale token once', async () => {
    const user = { getIdToken: vi.fn().mockResolvedValue('token') };
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 401 })).mockResolvedValueOnce(new Response('', { status: 200 }));
    expect(await syncFirebaseSession(user, fetcher)).toBe('ready');
    expect(user.getIdToken.mock.calls).toEqual([[false], [true]]);
  });
  it('reports invalid identity after the refreshed token is rejected', async () => {
    expect(await syncFirebaseSession({ getIdToken: async () => 'token' }, vi.fn().mockResolvedValue(new Response('', { status: 401 })))).toBe('invalid');
  });
  it('does not refresh or classify provider outages as invalid identity', async () => {
    const user = { getIdToken: vi.fn().mockResolvedValue('token') };
    expect(await syncFirebaseSession(user, vi.fn().mockResolvedValue(new Response('', { status: 503 })))).toBe('unavailable');
    expect(user.getIdToken).toHaveBeenCalledOnce();
  });
  it('recognizes a Firebase-deleted account during token refresh', async () => {
    expect(await syncFirebaseSession({ getIdToken: vi.fn().mockRejectedValue({ code: 'auth/user-not-found' }) })).toBe('invalid');
  });
});

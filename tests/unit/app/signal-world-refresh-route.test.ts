import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('@/lib/signal/world-service', () => ({ refreshSignalWorld: mocks.refresh }));

describe('shared SIGNAL world refresh authorization', () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    vi.stubEnv('CRON_SECRET', 'test-world-cron');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('rejects missing and wrong credentials without collecting sources', async () => {
    const { POST } = await import('@/app/api/signal/world/refresh/route');
    for (const secret of ['', 'wrong']) {
      const response = await POST(new Request('https://example.test/api/signal/world/refresh', {
        method: 'POST', headers: { 'x-cron-secret': secret },
      }));
      expect(response.status).toBe(401);
    }
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('returns the collector outcome without allowing request data to override collection', async () => {
    mocks.refresh.mockResolvedValue({ status: 'already-refreshed' });
    const { POST } = await import('@/app/api/signal/world/refresh/route');
    const response = await POST(new Request('https://example.test/api/signal/world/refresh', {
      method: 'POST', headers: { authorization: 'Bearer test-world-cron' },
      body: JSON.stringify({ url: 'https://untrusted.example/feed' }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'already-refreshed' });
    expect(mocks.refresh).toHaveBeenCalledExactlyOnceWith();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('reports collection failure without leaking provider errors', async () => {
    mocks.refresh.mockRejectedValue(new Error('private provider diagnostic'));
    const { POST } = await import('@/app/api/signal/world/refresh/route');
    const response = await POST(new Request('https://example.test/api/signal/world/refresh', {
      method: 'POST', headers: { 'x-cron-secret': 'test-world-cron' },
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'World refresh is unavailable. The last collected snapshot is retained.' });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
});

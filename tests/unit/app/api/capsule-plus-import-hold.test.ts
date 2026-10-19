import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Capsule+ import safety hold', () => {
  beforeEach(() => { vi.resetModules(); });
  it.each([false, true])('does not read or persist untrusted packages (demo=%s)', async isDemo => {
    const persist = vi.fn();
    vi.doMock('@/lib/api/with-auth', () => ({ withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }) => Promise<Response>) =>
      (request: Request) => handler(request, { uid: 'test-owner', isDemo }) }));
    vi.doMock('@/lib/context/capsule-service', () => ({ createCapsule: persist, createCapsuleReviewCard: persist }));
    const { POST } = await import('@/app/api/context/capsules/capsule-plus/import/route');
    const request = new Request('https://example.invalid/api/context/capsules/capsule-plus/import', { method: 'POST', body: 'untrusted' });
    const read = vi.spyOn(request, 'arrayBuffer');
    const response = await POST(request);
    expect(response.status).toBe(isDemo ? 403 : 503);
    expect(read).not.toHaveBeenCalled(); expect(persist).not.toHaveBeenCalled();
  });
});

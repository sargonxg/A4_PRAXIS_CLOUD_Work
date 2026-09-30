import { afterEach, describe, expect, it, vi } from 'vitest';
const provider = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string }) => Promise<Response>) =>
    (request: Request) => handler(request, { uid: 'synthetic-owner' }),
}));
vi.mock('@/lib/billing/polar-server', () => ({
  createPolarClient: () => ({ checkouts: { create: provider.create } }),
  isPolarBillingConfigured: () => true,
  polarBillingMode: () => 'configured',
  polarProductIdForPlan: () => 'synthetic-product',
}));
import { POST } from '@/app/api/billing/checkout/route';
describe('experimental checkout availability', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
  it('does not create a checkout when provider credentials exist but paid access is unavailable', async () => {
    vi.stubEnv('PRAXIS_ENABLE_PAID_CHECKOUT', '');
    const response = await POST(new Request('https://praxis.tacitus.me/api/billing/checkout', {
      method: 'POST', body: JSON.stringify({ plan: 'team' }),
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ available: false, fallbackHref: '/pricing' });
    expect(provider.create).not.toHaveBeenCalled();
  });

  it('does not sell Team even when checkout is enabled and provider configuration exists', async () => {
    vi.stubEnv('PRAXIS_ENABLE_PAID_CHECKOUT', 'true');
    const response = await POST(new Request('https://praxis.tacitus.me/api/billing/checkout', {
      method: 'POST', body: JSON.stringify({ plan: 'team' }),
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ available: false });
    expect(provider.create).not.toHaveBeenCalled();
  });

  it('binds an enabled Practitioner checkout to the authenticated owner', async () => {
    vi.stubEnv('PRAXIS_ENABLE_PAID_CHECKOUT', 'true');
    provider.create.mockResolvedValue({ url: 'https://checkout.example.test/synthetic' });
    const response = await POST(new Request('https://praxis.tacitus.me/api/billing/checkout', {
      method: 'POST', body: JSON.stringify({ plan: 'analyst' }),
    }));
    expect(response.status).toBe(200);
    expect(provider.create).toHaveBeenCalledWith(expect.objectContaining({
      externalCustomerId: 'synthetic-owner',
      products: ['synthetic-product'],
      metadata: expect.objectContaining({ uid: 'synthetic-owner', plan: 'analyst' }),
    }));
  });
});

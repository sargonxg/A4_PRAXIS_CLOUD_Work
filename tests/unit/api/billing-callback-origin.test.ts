import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const provider = vi.hoisted(() => ({ checkout: vi.fn(), portal: vi.fn(), client: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; email: string; name: string }) => Promise<Response>) =>
    (request: Request) => handler(request, { uid: 'synthetic-owner', email: 'owner@example.test', name: 'Owner' }),
}));
vi.mock('@/lib/billing/polar-server', () => ({
  createPolarClient: provider.client,
  isPolarBillingConfigured: () => true,
  polarBillingMode: () => 'production',
  polarProductIdForPlan: () => 'synthetic-practitioner-product',
}));

import { POST as checkout } from '@/app/api/billing/checkout/route';
import { POST as portal } from '@/app/api/billing/portal/route';

const publicOrigin = 'https://praxis.tacitus.me';
const routes = [
  { name: 'checkout', handler: checkout, call: provider.checkout },
  { name: 'portal', handler: portal, call: provider.portal },
] as const;

function internalRequest(route: string): Request {
  return new Request(`https://0.0.0.0:8080/api/billing/${route}`, {
    method: 'POST',
    headers: {
      host: 'attacker.example.test',
      'x-forwarded-host': 'attacker.example.test',
      'x-forwarded-proto': 'http',
      forwarded: 'host=attacker.example.test;proto=http',
    },
    body: JSON.stringify({ plan: 'analyst' }),
  });
}

describe('billing callbacks behind Cloud Run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PRAXIS_ENABLE_PAID_CHECKOUT', 'true');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', publicOrigin);
    provider.checkout.mockResolvedValue({ url: 'https://checkout.example.test/synthetic' });
    provider.portal.mockResolvedValue({ customerPortalUrl: 'https://portal.example.test/synthetic' });
    provider.client.mockReturnValue({
      checkouts: { create: provider.checkout },
      customerSessions: { create: provider.portal },
    });
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(routes)('uses the trusted operator URL for $name despite internal URL and attacker headers', async ({ name, handler, call }) => {
    const response = await handler(internalRequest(name));
    expect(response.status).toBe(200);
    expect(call).toHaveBeenCalledWith(expect.objectContaining({
      externalCustomerId: 'synthetic-owner',
      returnUrl: name === 'checkout'
        ? `${publicOrigin}/app/settings?tab=billing&checkout=cancelled`
        : `${publicOrigin}/app/settings?tab=billing`,
    }));
    if (name === 'checkout') expect(call).toHaveBeenCalledWith(expect.objectContaining({
      products: ['synthetic-practitioner-product'],
      successUrl: `${publicOrigin}/app/settings?tab=billing&checkout=success&checkoutId={CHECKOUT_ID}`,
      metadata: { uid: 'synthetic-owner', plan: 'analyst', source: 'praxis-settings' },
    }));
  });

  it.each(routes)('uses the documented canonical default for $name when no operator URL is set', async ({ name, handler, call }) => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined);
    const response = await handler(internalRequest(name));
    expect(response.status).toBe(200);
    expect(call).toHaveBeenCalledWith(expect.objectContaining({
      returnUrl: expect.stringMatching(/^https:\/\/praxis\.tacitus\.me\/app\/settings\?/),
    }));
  });

  it.each(routes)('rejects invalid production callback configuration before creating $name provider state', async ({ name, handler, call }) => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:8080');
    const response = await handler(internalRequest(name));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ configured: false });
    expect(provider.client).not.toHaveBeenCalled();
    expect(call).not.toHaveBeenCalled();
  });

  it('keeps existing customer portal access independent of new paid sales', async () => {
    vi.stubEnv('PRAXIS_ENABLE_PAID_CHECKOUT', 'false');
    const response = await portal(internalRequest('portal'));
    expect(response.status).toBe(200);
    expect(provider.portal).toHaveBeenCalledWith(expect.objectContaining({
      returnUrl: `${publicOrigin}/app/settings?tab=billing`,
    }));
  });
});

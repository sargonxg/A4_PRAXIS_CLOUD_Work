import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PricingPage from '@/app/pricing/page';

const requestRendering = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock('next/server', () => ({ connection: requestRendering }));
vi.mock('@polar-sh/sdk', () => ({ Polar: vi.fn() }));
vi.mock('@/components/ui/instrument', () => ({
  PublicPageShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/components/billing/pricing-checkout-button', () => ({
  PricingCheckoutButton: ({ plan, label }: { plan: string; label: string }) =>
    <button data-testid={`pricing-checkout-${plan}`}>{label}</button>,
}));

describe('runtime pricing availability', () => {
  beforeEach(() => {
    vi.stubEnv('PRAXIS_ENABLE_PAID_CHECKOUT', 'false');
    vi.stubEnv('POLAR_ACCESS_TOKEN', 'synthetic-token');
    vi.stubEnv('POLAR_WEBHOOK_SECRET', 'synthetic-signing-secret');
    vi.stubEnv('POLAR_PRODUCT_ANALYST', 'synthetic-practitioner');
    vi.stubEnv('POLAR_PRODUCT_TEAM', 'synthetic-team');
    vi.stubEnv('POLAR_SERVER', 'production');
    requestRendering.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('labels invited entry, paused generation and inactive allowances with paid checkout disabled', async () => {
    const html = renderToStaticMarkup(await PricingPage());
    expect(requestRendering).toHaveBeenCalledOnce();
    expect(html).toContain('pricing-checkout-free');
    expect(html).toContain('Paid upgrades are currently unavailable.');
    expect(html).toContain('Invitation-only access.');
    expect(html).toContain('AI generation is currently paused.');
    expect(html).toContain('Configured allowance, currently inactive:');
    expect(html).toContain('It becomes usable only if generation resumes');
    expect(html).toContain('Invited account access');
    expect(html).not.toContain('Free to try');
    expect(html).not.toContain('Start free');
    expect(html).not.toContain('pricing-checkout-analyst');
    expect(html).not.toContain('pricing-checkout-team');
  });

  it('shows only Practitioner checkout when enabled and configured', async () => {
    vi.stubEnv('PRAXIS_ENABLE_PAID_CHECKOUT', 'true');
    const html = renderToStaticMarkup(await PricingPage());
    expect(html).toContain('pricing-checkout-analyst');
    expect(html).toContain('$49');
    expect(html).toContain('USD / month');
    expect(html).toContain('250,000 PRAXIS credits per billing period');
    expect(html).not.toContain('Paid upgrades are currently unavailable.');
    expect(html).not.toContain('pricing-checkout-team');
    expect(html).not.toContain('synthetic-token');
    expect(html).not.toContain('synthetic-signing-secret');
    expect(html).not.toContain('synthetic-practitioner');
  });

  it('shows no paid purchase offer when supported-plan configuration is missing', async () => {
    vi.stubEnv('PRAXIS_ENABLE_PAID_CHECKOUT', 'true');
    vi.stubEnv('POLAR_PRODUCT_ANALYST', '');
    const html = renderToStaticMarkup(await PricingPage());
    expect(html).toContain('Paid upgrades are currently unavailable.');
    expect(html).not.toContain('pricing-checkout-analyst');
  });

  it('labels sandbox explicitly rather than presenting it as live paid access', async () => {
    vi.stubEnv('PRAXIS_ENABLE_PAID_CHECKOUT', 'true');
    vi.stubEnv('POLAR_SERVER', 'sandbox');
    const html = renderToStaticMarkup(await PricingPage());
    expect(html).toContain('Test checkout only; no live subscription is offered.');
    expect(html).toContain('Test Practitioner checkout');
  });
});

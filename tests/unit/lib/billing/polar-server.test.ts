import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isPolarBillingConfigured, polarBillingMode, polarProductIdForPlan } from '@/lib/billing/polar-server';

// These tests exercise local configuration only; the provider client is unused.
vi.mock('@polar-sh/sdk', () => ({ Polar: vi.fn() }));

describe('Polar billing configuration', () => {
  beforeEach(() => {
    vi.stubEnv('POLAR_ACCESS_TOKEN', 'unit-test-token');
    vi.stubEnv('POLAR_WEBHOOK_SECRET', 'unit-test-webhook');
    vi.stubEnv('POLAR_PRODUCT_ANALYST', '');
    vi.stubEnv('POLAR_PRODUCT_TEAM', '');
    vi.stubEnv('POLAR_SERVER', 'production');
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(['analyst', 'team'] as const)('enables plan-independent billing with only the %s product', (plan) => {
    const otherPlan = plan === 'analyst' ? 'team' : 'analyst';
    vi.stubEnv(plan === 'analyst' ? 'POLAR_PRODUCT_ANALYST' : 'POLAR_PRODUCT_TEAM', `unit-product-${plan}`);

    expect(isPolarBillingConfigured()).toBe(true);
    expect(isPolarBillingConfigured(undefined)).toBe(true);
    expect(isPolarBillingConfigured(plan)).toBe(true);
    expect(isPolarBillingConfigured(otherPlan)).toBe(false);
    expect(polarProductIdForPlan(plan)).toBe(`unit-product-${plan}`);
    expect(polarBillingMode()).toBe('production');
    expect(polarBillingMode(otherPlan)).toBe('unconfigured');
  });

  it.each(['POLAR_ACCESS_TOKEN', 'POLAR_WEBHOOK_SECRET'])('disables billing when %s is missing', (key) => {
    vi.stubEnv('POLAR_PRODUCT_ANALYST', 'unit-product-analyst');
    vi.stubEnv('POLAR_PRODUCT_TEAM', 'unit-product-team');
    vi.stubEnv(key, undefined);
    expect(isPolarBillingConfigured()).toBe(false);
    expect(isPolarBillingConfigured('analyst')).toBe(false);
    expect(isPolarBillingConfigured('team')).toBe(false);
    expect(polarBillingMode()).toBe('unconfigured');
  });

  it('requires at least one recognized plan product for plan-independent billing', () => {
    expect(isPolarBillingConfigured()).toBe(false);
    expect(polarBillingMode()).toBe('unconfigured');
    vi.stubEnv('POLAR_PRODUCT_OTHER', 'unit-product-other');
    expect(isPolarBillingConfigured()).toBe(false);
  });

  it.each([null, '', 'free', 'enterprise', 'unknown'])('rejects invalid specific plan %j even with both products mounted', (plan) => {
    vi.stubEnv('POLAR_PRODUCT_ANALYST', 'unit-product-analyst');
    vi.stubEnv('POLAR_PRODUCT_TEAM', 'unit-product-team');
    expect(isPolarBillingConfigured(plan)).toBe(false);
    expect(polarProductIdForPlan(plan)).toBeNull();
    expect(polarBillingMode(plan)).toBe('unconfigured');
  });

  it.each([
    { server: 'sandbox', mode: 'sandbox' },
    { server: 'production', mode: 'production' },
    { server: undefined, mode: 'production' },
  ] as const)('keeps the existing $mode mode when server is $server and only one product is mounted', ({ server, mode }) => {
    vi.stubEnv('POLAR_SERVER', server);
    vi.stubEnv('POLAR_PRODUCT_ANALYST', 'unit-product-analyst');
    expect(polarBillingMode()).toBe(mode);
    expect(polarBillingMode('analyst')).toBe(mode);
    expect(polarBillingMode('team')).toBe('unconfigured');
  });
});

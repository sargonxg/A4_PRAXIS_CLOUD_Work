import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCheckoutAvailability } from '@/lib/billing/checkout-availability';

vi.mock('@polar-sh/sdk', () => ({ Polar: vi.fn() }));

describe('public checkout availability', () => {
  beforeEach(() => {
    vi.stubEnv('PRAXIS_ENABLE_PAID_CHECKOUT', 'true');
    vi.stubEnv('POLAR_ACCESS_TOKEN', 'synthetic-token');
    vi.stubEnv('POLAR_WEBHOOK_SECRET', 'synthetic-signing-secret');
    vi.stubEnv('POLAR_PRODUCT_ANALYST', 'synthetic-practitioner');
    vi.stubEnv('POLAR_PRODUCT_TEAM', 'synthetic-team');
    vi.stubEnv('POLAR_SERVER', 'production');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('exposes only supported-plan availability and mode', () => {
    expect(getCheckoutAvailability()).toEqual({ analyst: true, team: false, mode: 'production' });
  });

  it.each(['', 'false', 'TRUE', undefined])('requires the exact enabled flag: %j', value => {
    vi.stubEnv('PRAXIS_ENABLE_PAID_CHECKOUT', value);
    expect(getCheckoutAvailability()).toEqual({ analyst: false, team: false, mode: 'unconfigured' });
  });

  it.each(['POLAR_ACCESS_TOKEN', 'POLAR_WEBHOOK_SECRET', 'POLAR_PRODUCT_ANALYST'])('fails closed without %s', key => {
    vi.stubEnv(key, '');
    expect(getCheckoutAvailability()).toEqual({ analyst: false, team: false, mode: 'unconfigured' });
  });

  it('labels configured sandbox checkout separately', () => {
    vi.stubEnv('POLAR_SERVER', 'sandbox');
    expect(getCheckoutAvailability()).toEqual({ analyst: true, team: false, mode: 'sandbox' });
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { emitMeterEvent } from '@/lib/billing/stripe-meters';

describe('emitMeterEvent', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('no-ops cleanly when STRIPE_METERS_DISABLE=1', async () => {
    process.env.STRIPE_METERS_DISABLE = '1';
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx_fake';
    const result = await emitMeterEvent({
      stripeCustomerId: 'cus_abc',
      eventName: 'praxis.tool_run',
      value: 1,
    });
    expect(result.ok).toBe(true);
    expect(result.reason).toMatch(/STRIPE_METERS_DISABLE/);
  });

  it('no-ops cleanly when STRIPE_SECRET_KEY missing', async () => {
    delete process.env.STRIPE_METERS_DISABLE;
    delete process.env.STRIPE_SECRET_KEY;
    const result = await emitMeterEvent({
      stripeCustomerId: 'cus_abc',
      eventName: 'praxis.tool_run',
      value: 1,
    });
    expect(result.ok).toBe(true);
    expect(result.reason).toMatch(/STRIPE_SECRET_KEY/);
  });

  it('rejects invalid customer ids', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx_fake_long_enough';
    const result = await emitMeterEvent({
      stripeCustomerId: 'bad-id',
      eventName: 'praxis.tool_run',
      value: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/invalid stripeCustomerId/);
  });

  it('rejects negative or non-finite values', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx_fake_long_enough';
    expect(
      (
        await emitMeterEvent({
          stripeCustomerId: 'cus_abc',
          eventName: 'praxis.tool_run',
          value: -1,
        })
      ).ok
    ).toBe(false);
    expect(
      (
        await emitMeterEvent({
          stripeCustomerId: 'cus_abc',
          eventName: 'praxis.tool_run',
          value: NaN,
        })
      ).ok
    ).toBe(false);
  });
});

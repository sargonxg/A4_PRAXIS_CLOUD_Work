import { afterEach, describe, expect, it } from 'vitest';
import { signCookie, verifyCookie } from '@/lib/auth/cookie-signer';

const ORIGINAL_SECRET = process.env.COOKIE_SIGNING_SECRET;
const ORIGINAL_K_SERVICE = process.env.K_SERVICE;

afterEach(() => {
  process.env.COOKIE_SIGNING_SECRET = ORIGINAL_SECRET;
  process.env.K_SERVICE = ORIGINAL_K_SERVICE;
});

describe('cookie-signer', () => {
  it('signs and verifies cookies with COOKIE_SIGNING_SECRET', () => {
    process.env.COOKIE_SIGNING_SECRET = 'test-cookie-secret';

    const signed = signCookie('{"uid":"user-1"}');

    expect(verifyCookie(signed)).toBe('{"uid":"user-1"}');
  });

  it('uses a deterministic local fallback when COOKIE_SIGNING_SECRET is missing off Cloud Run', () => {
    delete process.env.COOKIE_SIGNING_SECRET;
    delete process.env.K_SERVICE;

    const signed = signCookie('value');

    expect(verifyCookie(signed)).toBe('value');
  });

  it('fails closed when COOKIE_SIGNING_SECRET is missing on Cloud Run', () => {
    delete process.env.COOKIE_SIGNING_SECRET;
    process.env.K_SERVICE = 'praxis-frontend';

    expect(() => signCookie('value')).toThrow(/COOKIE_SIGNING_SECRET/);
    expect(verifyCookie('value.signature')).toBeNull();
  });
});

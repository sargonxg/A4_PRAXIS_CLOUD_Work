import { afterEach, describe, expect, it } from 'vitest';
import { signCookie, verifyCookie } from '@/lib/auth/cookie-signer';

const ORIGINAL_SECRET = process.env.COOKIE_SIGNING_SECRET;

afterEach(() => {
  process.env.COOKIE_SIGNING_SECRET = ORIGINAL_SECRET;
});

describe('cookie-signer', () => {
  it('signs and verifies cookies with COOKIE_SIGNING_SECRET', () => {
    process.env.COOKIE_SIGNING_SECRET = 'test-cookie-secret';

    const signed = signCookie('{"uid":"user-1"}');

    expect(verifyCookie(signed)).toBe('{"uid":"user-1"}');
  });

  it('fails closed when COOKIE_SIGNING_SECRET is missing', () => {
    delete process.env.COOKIE_SIGNING_SECRET;

    expect(() => signCookie('value')).toThrow(/COOKIE_SIGNING_SECRET/);
    expect(verifyCookie('value.signature')).toBeNull();
  });
});

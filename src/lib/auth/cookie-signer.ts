import crypto from 'crypto';

function getCookieSigningSecret(): string {
  const secret = process.env.COOKIE_SIGNING_SECRET;
  if (!secret) {
    const runningOnCloudRun = Boolean(
      process.env.K_SERVICE ||
      process.env.K_REVISION ||
      process.env.K_CONFIGURATION
    );
    if (!runningOnCloudRun) {
      return 'praxis-dev-cookie-signing-secret';
    }
    throw new Error('[auth] COOKIE_SIGNING_SECRET is required for signed sessions');
  }
  return secret;
}

/**
 * Signs a cookie value with HMAC-SHA256.
 * Returns `value.signature` format.
 */
export function signCookie(value: string): string {
  const sig = crypto.createHmac('sha256', getCookieSigningSecret()).update(value).digest('base64url');
  return `${value}.${sig}`;
}

/**
 * Verifies and returns the original value from a signed cookie.
 * Returns null if the signature is invalid or missing.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyCookie(signed: string): string | null {
  const idx = signed.lastIndexOf('.');
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  try {
    const expected = crypto.createHmac('sha256', getCookieSigningSecret()).update(value).digest('base64url');
    if (sig.length !== expected.length) return null;
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }
  return value;
}

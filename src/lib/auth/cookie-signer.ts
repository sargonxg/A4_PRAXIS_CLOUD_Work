import crypto from 'crypto';

const SECRET = process.env.COOKIE_SIGNING_SECRET || process.env.SESSION_SECRET || process.env.CRON_SECRET || 'dev-fallback-change-me';

/**
 * Signs a cookie value with HMAC-SHA256.
 * Returns `value.signature` format.
 */
export function signCookie(value: string): string {
  const sig = crypto.createHmac('sha256', SECRET).update(value).digest('base64url');
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
  const expected = crypto.createHmac('sha256', SECRET).update(value).digest('base64url');
  try {
    if (sig.length !== expected.length) return null;
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }
  return value;
}

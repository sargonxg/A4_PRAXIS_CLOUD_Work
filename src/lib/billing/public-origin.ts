import { isIP } from 'node:net';

const CANONICAL_PRAXIS_ORIGIN = 'https://praxis.tacitus.me';

type BillingOriginEnvironment = {
  NEXT_PUBLIC_SITE_URL?: string;
  NODE_ENV?: string;
};

/**
 * Billing redirects use operator configuration, never request headers or URLs.
 * An absent URL uses the canonical PRAXIS domain; an explicit invalid URL fails
 * closed. HTTP loopback is available only with explicit development config.
 */
export function resolveBillingPublicOrigin(env: BillingOriginEnvironment = process.env): string | null {
  const configured = env.NEXT_PUBLIC_SITE_URL;
  const value = configured === undefined ? CANONICAL_PRAXIS_ORIGIN : configured.trim();
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;

    const host = url.hostname.toLowerCase();
    const loopback = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    if (env.NODE_ENV === 'development' && loopback && (url.protocol === 'http:' || url.protocol === 'https:')) return url.origin;

    if (url.protocol !== 'https:' || url.port || !host.includes('.') || host.endsWith('.')
      || isIP(host.replace(/^\[|\]$/g, '')) || host.endsWith('.localhost')
      || host.endsWith('.local') || host.endsWith('.internal')) return null;
    return url.origin;
  } catch {
    return null;
  }
}

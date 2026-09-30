import { describe, expect, it } from 'vitest';
import { resolveBillingPublicOrigin } from '@/lib/billing/public-origin';

describe('trusted billing public origin', () => {
  it('defaults only an absent operator URL to the canonical HTTPS origin', () => {
    expect(resolveBillingPublicOrigin({ NODE_ENV: 'production' })).toBe('https://praxis.tacitus.me');
    expect(resolveBillingPublicOrigin({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: '' })).toBeNull();
  });

  it.each(['https://praxis.tacitus.me', 'https://praxis.tacitus.me/', 'https://praxis.tacitus.me:443/'])('normalizes a valid configured public URL %s', value => {
    expect(resolveBillingPublicOrigin({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: value })).toBe('https://praxis.tacitus.me');
  });

  it.each([
    'not a URL', '   ', 'http://praxis.tacitus.me', 'javascript:alert(1)',
    'https://user:secret@praxis.tacitus.me', 'https://praxis.tacitus.me/path',
    'https://praxis.tacitus.me/?next=external', 'https://praxis.tacitus.me/#section',
    'https://0.0.0.0:8080', 'https://0.0.0.0', 'https://127.0.0.1',
    'https://[::1]', 'http://localhost:3000', 'https://localhost',
    'https://app.localhost', 'https://app.local', 'https://app.internal',
    'https://localhost.', 'https://app.internal.', 'https://2130706433',
    'https://praxis.tacitus.me:8080',
  ])('rejects malformed, nonpublic or nonorigin production config %s', value => {
    expect(resolveBillingPublicOrigin({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: value })).toBeNull();
  });

  it.each(['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000'])('permits explicit loopback %s only during development', value => {
    expect(resolveBillingPublicOrigin({ NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: value })).toBe(value);
    expect(resolveBillingPublicOrigin({ NODE_ENV: 'test', NEXT_PUBLIC_SITE_URL: value })).toBeNull();
    expect(resolveBillingPublicOrigin({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: value })).toBeNull();
  });

  it('does not allow arbitrary HTTP sites even during development', () => {
    expect(resolveBillingPublicOrigin({ NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://attacker.example.test' })).toBeNull();
  });
});

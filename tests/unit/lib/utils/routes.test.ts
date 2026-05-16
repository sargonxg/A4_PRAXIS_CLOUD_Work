import { describe, expect, it } from 'vitest';
import { shouldPrefixPraxisHref } from '@/lib/utils/routes';

describe('shouldPrefixPraxisHref', () => {
  it('prefixes authenticated app-relative paths', () => {
    expect(shouldPrefixPraxisHref('/dashboard')).toBe(true);
    expect(shouldPrefixPraxisHref('dashboard')).toBe(true);
    expect(shouldPrefixPraxisHref('/settings/api-keys')).toBe(true);
  });

  it('does not prefix already-prefixed, public, or external links', () => {
    expect(shouldPrefixPraxisHref('/app/dashboard')).toBe(false);
    expect(shouldPrefixPraxisHref('/pricing')).toBe(false);
    expect(shouldPrefixPraxisHref('/login')).toBe(false);
    expect(shouldPrefixPraxisHref('/privacy')).toBe(false);
    expect(shouldPrefixPraxisHref('/terms')).toBe(false);
    expect(shouldPrefixPraxisHref('https://tacitus.me')).toBe(false);
    expect(shouldPrefixPraxisHref('mailto:hello@tacitus.me')).toBe(false);
  });
});

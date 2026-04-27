import { describe, it, expect } from 'vitest';
import {
  applySourcePreferences,
  preferenceForUrl,
  __test__,
  type SavedSource,
} from '@/lib/services/sources-preference';

const { normalizeHost } = __test__;

describe('sources-preference/normalizeHost', () => {
  it('strips protocol and www', () => {
    expect(normalizeHost('https://www.reuters.com/world/article')).toBe('reuters.com');
    expect(normalizeHost('http://example.org')).toBe('example.org');
  });

  it('keeps subdomains intact', () => {
    expect(normalizeHost('https://news.bbc.co.uk/article')).toBe('news.bbc.co.uk');
  });

  it('handles bare domains', () => {
    expect(normalizeHost('reuters.com')).toBe('reuters.com');
  });

  it('handles empty/null safely', () => {
    expect(normalizeHost('')).toBe('');
    expect(normalizeHost(undefined as unknown as string)).toBe('');
  });
});

describe('sources-preference/preferenceForUrl', () => {
  const saved: SavedSource[] = [
    { name: 'Reuters', url: 'https://www.reuters.com', preference: 'preferred' },
    { name: 'Some Blog', domain: 'someblog.example', preference: 'blocked' },
    { name: 'Crisis Group', url: 'https://crisisgroup.org', preference: 'neutral' },
    { name: 'Untagged AP', url: 'https://apnews.com' },
  ];

  it('returns preferred on a matching preferred publisher', () => {
    expect(preferenceForUrl('https://www.reuters.com/article/123', saved)).toBe('preferred');
  });

  it('returns blocked on a matching blocked publisher', () => {
    expect(preferenceForUrl('https://someblog.example/post', saved)).toBe('blocked');
  });

  it('returns neutral on a matching neutral publisher', () => {
    expect(preferenceForUrl('https://crisisgroup.org/briefing', saved)).toBe('neutral');
  });

  it('returns neutral on an untagged saved publisher', () => {
    expect(preferenceForUrl('https://apnews.com/article', saved)).toBe('neutral');
  });

  it('matches subdomains of a saved publisher', () => {
    const withSub: SavedSource[] = [{ url: 'https://www.bbc.co.uk', preference: 'preferred' }];
    expect(preferenceForUrl('https://news.bbc.co.uk/world', withSub)).toBe('preferred');
  });

  it('returns neutral on unknown publishers', () => {
    expect(preferenceForUrl('https://random-site.example/page', saved)).toBe('neutral');
  });

  it('returns neutral on missing url', () => {
    expect(preferenceForUrl('', saved)).toBe('neutral');
  });
});

describe('sources-preference/applySourcePreferences', () => {
  const saved: SavedSource[] = [
    { url: 'https://www.reuters.com', preference: 'preferred' },
    { url: 'https://blocksite.example', preference: 'blocked' },
  ];

  const proposed = [
    { name: 'Random News', url: 'https://random.example/p1' },
    { name: 'Reuters', url: 'https://www.reuters.com/world/p2' },
    { name: 'Blocked', url: 'https://blocksite.example/p3' },
    { name: 'Crisis Group', url: 'https://crisisgroup.org/p4' },
  ];

  it('floats preferred to the top, drops blocked, preserves neutral order', () => {
    const { kept, blocked, lift } = applySourcePreferences(proposed, saved);
    expect(kept.map((p) => p.name)).toEqual(['Reuters', 'Random News', 'Crisis Group']);
    expect(blocked.map((p) => p.name)).toEqual(['Blocked']);
    expect(lift.map((p) => p.name)).toEqual(['Reuters']);
  });

  it('returns the original order when no saved preferences match', () => {
    const noOpSaved: SavedSource[] = [{ url: 'https://nonexistent.example', preference: 'preferred' }];
    const { kept, blocked, lift } = applySourcePreferences(proposed, noOpSaved);
    expect(kept.map((p) => p.name)).toEqual(['Random News', 'Reuters', 'Blocked', 'Crisis Group']);
    expect(blocked.length).toBe(0);
    expect(lift.length).toBe(0);
  });

  it('handles empty saved list', () => {
    const { kept, blocked, lift } = applySourcePreferences(proposed, []);
    expect(kept).toEqual(proposed);
    expect(blocked.length).toBe(0);
    expect(lift.length).toBe(0);
  });

  it('handles empty proposed list', () => {
    const { kept, blocked, lift } = applySourcePreferences([], saved);
    expect(kept).toEqual([]);
    expect(blocked).toEqual([]);
    expect(lift).toEqual([]);
  });
});

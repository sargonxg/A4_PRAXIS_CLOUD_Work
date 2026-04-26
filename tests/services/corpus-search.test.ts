import { describe, it, expect } from 'vitest';
import { __test__ } from '@/lib/intelligence/corpus-search';

const {
  tokenize,
  scoreText,
  layerWeight,
  reliabilityToConfidence,
  severityToConfidence,
  summarizeToolOutput,
  slug,
} = __test__;

describe('corpus-search/tokenize', () => {
  it('lowercases and splits on non-alphanum, drops short tokens', () => {
    expect(tokenize('Humanitarian Access in 2026!')).toEqual(['humanitarian', 'access', '2026']);
  });

  it('returns empty array on empty/whitespace input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
    expect(tokenize('a of by')).toEqual([]);
  });
});

describe('corpus-search/scoreText', () => {
  it('counts term occurrences across the haystack', () => {
    expect(scoreText('access blocked at access points', ['access'])).toBe(2);
    expect(scoreText('No mention here', ['unrelated'])).toBe(0);
  });

  it('returns 0 when query is empty (no boost from non-matches)', () => {
    expect(scoreText('any text', [])).toBe(0);
  });

  it('handles missing/blank text gracefully', () => {
    expect(scoreText('', ['x'])).toBe(0);
    expect(scoreText(undefined as unknown as string, ['x'])).toBe(0);
  });
});

describe('corpus-search/layerWeight', () => {
  it('orders documents > argus > tool-output > graph > sources', () => {
    expect(layerWeight('documents')).toBeGreaterThan(layerWeight('argus'));
    expect(layerWeight('argus')).toBeGreaterThan(layerWeight('tool-output'));
    expect(layerWeight('tool-output')).toBeGreaterThan(layerWeight('graph'));
    expect(layerWeight('graph')).toBeGreaterThan(layerWeight('sources'));
  });

  it('returns 0 for unknown layers (degrades safely)', () => {
    expect(layerWeight('unknown-layer')).toBe(0);
  });
});

describe('corpus-search/confidence mappers', () => {
  it('reliabilityToConfidence buckets by score band', () => {
    expect(reliabilityToConfidence(9)).toBe('high');
    expect(reliabilityToConfidence(6)).toBe('medium');
    expect(reliabilityToConfidence(2)).toBe('low');
    expect(reliabilityToConfidence(null)).toBe('unknown');
  });

  it('severityToConfidence treats critical/high as high', () => {
    expect(severityToConfidence('critical')).toBe('high');
    expect(severityToConfidence('HIGH')).toBe('high');
    expect(severityToConfidence('medium')).toBe('medium');
    expect(severityToConfidence('low')).toBe('low');
    expect(severityToConfidence('weird')).toBe('unknown');
  });
});

describe('corpus-search/summarizeToolOutput', () => {
  it('prefers headline over generic keys', () => {
    const summary = summarizeToolOutput({
      title: 'fallback',
      headline: 'Mali ceasefire collapses',
      summary: 'long body',
    });
    expect(summary).toBe('Mali ceasefire collapses');
  });

  it('joins arrays of strings under recommendations', () => {
    const summary = summarizeToolOutput({ recommendations: ['Engage UNSC', 'Brief OCHA', 'Open ICRC line'] });
    expect(summary).toContain('Engage UNSC');
    expect(summary).toContain('Brief OCHA');
  });

  it('returns empty string for null/undefined', () => {
    expect(summarizeToolOutput(null)).toBe('');
    expect(summarizeToolOutput(undefined)).toBe('');
  });

  it('caps long strings to 600 chars', () => {
    const long = 'x'.repeat(2000);
    expect(summarizeToolOutput({ summary: long }).length).toBeLessThanOrEqual(600);
  });
});

describe('corpus-search/slug', () => {
  it('lowercases and dasherises', () => {
    expect(slug('Mali Ceasefire 2026')).toBe('mali-ceasefire-2026');
  });

  it('handles empty/non-string fallback', () => {
    expect(slug('')).toBe('item');
    expect(slug('!!!')).toBe('item');
  });
});

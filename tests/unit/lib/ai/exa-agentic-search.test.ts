import { describe, expect, it } from 'vitest';
import {
  buildExaAgenticSearchRequest,
  normalizeExaSearchType,
  summarizeExaSearchResponse,
} from '@/lib/ai/exa-agentic-search';

describe('Exa agentic search adapter', () => {
  it('builds the current /search payload with highlights nested under contents', () => {
    const request = buildExaAgenticSearchRequest({
      query: 'current Sudan ceasefire monitoring sources',
      type: 'deep',
      numResults: 12,
      includeDomains: ['un.org', 'reliefweb.int'],
      excludeDomains: ['example.com'],
      maxAgeHours: 24,
    });

    expect(request).toMatchObject({
      query: 'current Sudan ceasefire monitoring sources',
      type: 'deep',
      numResults: 12,
      includeDomains: ['un.org', 'reliefweb.int'],
      excludeDomains: ['example.com'],
      contents: {
        highlights: true,
        maxAgeHours: 24,
      },
    });
    expect(JSON.stringify(request)).not.toContain('useAutoprompt');
    expect(JSON.stringify(request)).not.toContain('includeUrls');
    expect(JSON.stringify(request)).not.toContain('livecrawl');
  });

  it('normalizes unsupported search types to auto', () => {
    expect(normalizeExaSearchType('instant')).toBe('instant');
    expect(normalizeExaSearchType('neural')).toBe('auto');
    expect(normalizeExaSearchType(undefined)).toBe('auto');
  });

  it('summarizes response results without exposing provider cost', () => {
    const summary = summarizeExaSearchResponse({
      requestId: 'req-1',
      searchType: 'auto',
      costDollars: { total: 0.123 },
      results: [
        {
          title: 'UN update',
          url: 'https://news.un.org/story',
          highlights: ['first useful excerpt', 'second useful excerpt'],
          publishedDate: '2026-05-20',
        },
      ],
      output: {
        content: { finding: 'Grounded finding' },
        grounding: [{ field: 'finding', citations: [{ url: 'https://news.un.org/story', title: 'UN update' }], confidence: 'high' }],
      },
    });

    expect(summary).toMatchObject({
      requestId: 'req-1',
      searchType: 'auto',
      results: [
        {
          title: 'UN update',
          url: 'https://news.un.org/story',
          highlights: ['first useful excerpt', 'second useful excerpt'],
        },
      ],
      output: {
        content: { finding: 'Grounded finding' },
      },
    });
    expect(JSON.stringify(summary)).not.toContain('costDollars');
    expect(JSON.stringify(summary)).not.toContain('0.123');
  });
});

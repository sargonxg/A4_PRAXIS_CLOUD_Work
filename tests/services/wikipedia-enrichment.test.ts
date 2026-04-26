import { describe, it, expect } from 'vitest';
import { __test__, formatWikipediaPromptBlock } from '@/lib/enrichment/wikipedia';

describe('wikipedia/url builders', () => {
  it('encodes titles with spaces and special characters', () => {
    expect(__test__.SUMMARY_URL('en', 'Syrian civil war')).toBe(
      'https://en.wikipedia.org/api/rest_v1/page/summary/Syrian%20civil%20war'
    );
    expect(__test__.SUMMARY_URL('fr', 'Côte d\'Ivoire')).toContain(
      'fr.wikipedia.org/api/rest_v1/page/summary'
    );
  });

  it('search URL uses opensearch action with limit=5', () => {
    expect(__test__.SEARCH_URL('en', 'Mali')).toMatch(/action=opensearch/);
    expect(__test__.SEARCH_URL('en', 'Mali')).toMatch(/limit=5/);
  });
});

describe('wikipedia/formatWikipediaPromptBlock', () => {
  const summary = {
    title: 'Syrian civil war',
    url: 'https://en.wikipedia.org/wiki/Syrian_civil_war',
    extract: 'The Syrian civil war is a multi-sided armed conflict in Syria fought primarily between the Syrian Arab Republic ...',
    revisedAt: '2026-04-25T10:00:00Z',
    qid: 'Q4413628',
    pageType: 'standard',
    language: 'en',
  };
  const related = [
    {
      title: 'Free Syrian Army',
      url: 'https://en.wikipedia.org/wiki/Free_Syrian_Army',
      extract: 'A loose faction of armed Syrian opposition brigades.',
    },
  ];

  it('renders an intelligence-gap notice when no data', () => {
    const block = formatWikipediaPromptBlock(null, []);
    expect(block).toMatch(/intelligence gaps/);
    expect(block).toMatch(/No Wikipedia entries matched/);
  });

  it('renders the summary block with citation reminder', () => {
    const block = formatWikipediaPromptBlock(summary, related);
    expect(block).toMatch(/## WIKIPEDIA BACKGROUND/);
    expect(block).toMatch(/Primary entry: Syrian civil war/);
    expect(block).toMatch(/URL: https:\/\/en\.wikipedia\.org\/wiki\/Syrian_civil_war/);
    expect(block).toMatch(/Last revised: 2026-04-25T10:00:00Z/);
    expect(block).toMatch(/Wikidata: Q4413628/);
    expect(block).toMatch(/Related entities:/);
    expect(block).toMatch(/Free Syrian Army/);
    expect(block).toMatch(/cite it inline as `\[Wikipedia: TITLE\]`/);
  });

  it('caps the summary extract at 1800 chars', () => {
    const long = { ...summary, extract: 'x'.repeat(5000) };
    const block = formatWikipediaPromptBlock(long, []);
    // The longest run of consecutive 'x' characters in the block must
    // not exceed the 1800-char extract cap.
    const longestRun = (block.match(/x+/g) ?? []).reduce((m, s) => Math.max(m, s.length), 0);
    expect(longestRun).toBeLessThanOrEqual(1800);
    expect(longestRun).toBeGreaterThanOrEqual(1700); // sanity — close to cap
  });
});

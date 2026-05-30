import { describe, expect, it } from 'vitest';

import { fuseSourceResults } from '@/lib/data-feeds/fuse';
import type { SourceConnectorResult } from '@/lib/data-feeds/types';

describe('source result fuse', () => {
  it('dedupes equivalent URLs and keeps the highest trust result', () => {
    const items: SourceConnectorResult[] = [
      {
        id: 'a',
        provider: 'exa',
        title: 'Reuters item',
        url: 'https://www.reuters.com/world/item?utm_source=test',
        snippet: 'lower score',
        retrievedAt: '2026-05-29T00:00:00.000Z',
        trustScore: 0.7,
      },
      {
        id: 'b',
        provider: 'google-search-grounding',
        title: 'Reuters item canonical',
        url: 'https://reuters.com/world/item',
        snippet: 'higher score',
        retrievedAt: '2026-05-30T00:00:00.000Z',
        trustScore: 0.92,
      },
      {
        id: 'c',
        provider: 'reliefweb',
        title: 'ReliefWeb report',
        url: 'https://reliefweb.int/report/example',
        snippet: 'official humanitarian source',
        retrievedAt: '2026-05-28T00:00:00.000Z',
        trustScore: 0.8,
      },
    ];

    const fused = fuseSourceResults(items, { trustRank: 'strict', limit: 10 });

    expect(fused).toHaveLength(2);
    expect(fused[0]).toMatchObject({
      id: 'b',
      provider: 'google-search-grounding',
      trustScore: 0.92,
    });
    expect(fused[0].duplicates).toEqual(['a']);
    expect(fused.map((item) => item.id)).toEqual(['b', 'c']);
  });

  it('can prioritize recency over strict source score', () => {
    const fused = fuseSourceResults([
      {
        id: 'older',
        provider: 'openalex',
        title: 'Older working paper',
        url: 'https://openalex.org/W1',
        snippet: 'older',
        retrievedAt: '2026-01-01T00:00:00.000Z',
        publishedAt: '2025-01-01T00:00:00.000Z',
        trustScore: 0.95,
      },
      {
        id: 'newer',
        provider: 'gdelt',
        title: 'Newer signal',
        url: 'https://gdeltproject.org/data',
        snippet: 'newer',
        retrievedAt: '2026-05-30T00:00:00.000Z',
        publishedAt: '2026-05-30T00:00:00.000Z',
        trustScore: 0.65,
      },
    ], { trustRank: 'recency', limit: 2 });

    expect(fused.map((item) => item.id)).toEqual(['newer', 'older']);
  });
});

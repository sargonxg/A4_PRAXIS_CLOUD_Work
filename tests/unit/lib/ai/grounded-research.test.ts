import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ generateText: vi.fn(), fetchOriginalSource: vi.fn(), googleSearch: vi.fn(() => ({ type: 'provider', id: 'google.google_search' })) }));
vi.mock('ai', () => ({ generateText: mocks.generateText }));
vi.mock('@/lib/ai/providers', () => ({
  getGroundedModel: () => 'test-model',
  getGoogleSearchTool: mocks.googleSearch,
}));
vi.mock('@/lib/ai/source-passage', () => ({ fetchOriginalSource: mocks.fetchOriginalSource }));

import { searchWeb } from '@/lib/ai/grounded-research';
import { executeWebResearch } from '@/lib/ai/web-research';

describe('grounded research receipts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchOriginalSource.mockResolvedValue({ originalPassageStatus: 'unavailable', unavailableReason: 'http-error', originalPassages: [] });
  });

  it('activates the provider search tool and keeps a generated overview out of source receipts', async () => {
    mocks.generateText.mockResolvedValue({ text: 'Generated explanation without grounding citations.', sources: [] });
    expect(await searchWeb('overview without sources')).toEqual([]);
    expect(mocks.generateText).toHaveBeenCalledWith(expect.objectContaining({
      tools: { google_search: { type: 'provider', id: 'google.google_search' } },
    }));
    expect(mocks.googleSearch).toHaveBeenCalledOnce();
    // Preserve the overview for research consumers that intentionally display prose.
    expect(await executeWebResearch('overview without sources', '', 'system', { maxResults: 5, timeRange: 'all' }))
      .toEqual([expect.objectContaining({ isGroundedSummary: true })]);
  });

  it('accepts actual provider citation URLs while excluding the generated search-page overview', async () => {
    mocks.generateText.mockResolvedValue({
      text: 'Methods summary with a grounded citation.',
      sources: [{ sourceType: 'url', url: 'https://www.oecd.org/policy-evaluation', title: 'Policy evaluation methods' }],
    });
    const results = await searchWeb('institutional policy evaluation method');
    expect(results).toEqual([expect.objectContaining({
      url: 'https://www.oecd.org/policy-evaluation',
      title: 'Policy evaluation methods',
      provider: 'google-search',
      success: true,
    })]);
    expect(results.some((result) => result.url.startsWith('https://google.com/search'))).toBe(false);
  });
  it.each(['google', 'vertex'])('maps only source-associated grounded segments for %s metadata', async (provider) => {
    mocks.generateText.mockResolvedValue({
      text: 'Full overview includes uncited prose that must not be assigned to every source.',
      sources: [
        { sourceType: 'url', url: 'https://example.org/commitments', title: 'Commitments' },
        { sourceType: 'url', url: 'https://example.org/implementation', title: 'Implementation' },
        { sourceType: 'url', url: 'https://example.org/context', title: 'Context only' },
      ],
      providerMetadata: {
        [provider]: { groundingMetadata: {
          groundingChunks: [
            { web: { uri: 'https://example.org/commitments' } },
            { web: { uri: 'https://example.org/implementation' } },
            { web: { uri: 'https://example.org/context' } },
          ],
          groundingSupports: [
            { segment: { text: 'A commitment states an intended action.' }, groundingChunkIndices: [0] },
            { segment: { text: 'Implementation is assessed through observed actions.' }, groundingChunkIndices: [1] },
            { segment: { text: 'Invalid source index must not map.' }, groundingChunkIndices: [8] },
          ],
        } },
      },
    });
    const results = await searchWeb(`source associated text ${provider}`);
    expect(results.find((result) => result.url.endsWith('/commitments'))?.content).toBe('');
    expect(results.find((result) => result.url.endsWith('/commitments'))?.generatedGroundingSegments)
      .toEqual([expect.objectContaining({ text: 'A commitment states an intended action.', kind: 'generated-grounding-segment' })]);
    expect(results.find((result) => result.url.endsWith('/implementation'))?.content).toBe('');
    expect(results.find((result) => result.url.endsWith('/implementation'))?.originalPassageStatus).toBe('unavailable');
    expect(results.find((result) => result.url.endsWith('/context'))?.content).toBe('');
    expect(JSON.stringify(results)).not.toContain('uncited prose');
    expect(JSON.stringify(results)).not.toContain('Grounded citation returned for query');
  });

  it('keeps fetched originals distinct from generated claims and exposes their publication and locator', async () => {
    mocks.generateText.mockResolvedValue({
      text: 'Synthetic case funding was spent.',
      sources: [{ url: 'https://www.gao.gov/methods', title: 'GAO methods' }],
      providerMetadata: { vertex: { groundingMetadata: {
        groundingChunks: [{ web: { uri: 'https://www.gao.gov/methods' } }],
        groundingSupports: [{ segment: { text: 'Synthetic case funding was spent.', startIndex: 0, endIndex: 32 }, groundingChunkIndices: [0] }],
      } } },
    });
    mocks.fetchOriginalSource.mockResolvedValue({
      originalPassageStatus: 'retrieved', publisher: 'gao.gov', authority: 'institutional', publishedDate: '2026-09-01', finalUrl: 'https://www.gao.gov/methods',
      originalPassages: [{ text: 'Authorization does not establish expenditure.', locator: 'extracted-text:chars:0-44', retrievedAt: '2026-09-30T00:00:00Z', claimSupport: 'unverified' }],
    });
    const [result] = await searchWeb('source fidelity synthetic allocation fixture');
    expect(result.content).toBe('Authorization does not establish expenditure.');
    expect(result.originalPassages?.[0].claimSupport).toBe('unverified');
    expect(result.generatedGroundingSegments?.[0]).toMatchObject({ kind: 'generated-grounding-segment', text: 'Synthetic case funding was spent.', responseStart: 0, responseEnd: 32 });
    expect(result.publisher).toBe('gao.gov');
    expect(result.publishedDate).toBe('2026-09-01');
  });

});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ generateText: vi.fn(), googleSearch: vi.fn(() => ({ type: 'provider', id: 'google.google_search' })) }));
vi.mock('ai', () => ({ generateText: mocks.generateText }));
vi.mock('@/lib/ai/providers', () => ({
  getGroundedModel: () => 'test-model',
  getGoogleSearchTool: mocks.googleSearch,
}));

import { searchWeb } from '@/lib/ai/grounded-research';
import { executeWebResearch } from '@/lib/ai/web-research';

describe('grounded research receipts', () => {
  beforeEach(() => vi.clearAllMocks());

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
    expect(results.find((result) => result.url.endsWith('/commitments'))?.content)
      .toBe('A commitment states an intended action.');
    expect(results.find((result) => result.url.endsWith('/implementation'))?.content)
      .toBe('Implementation is assessed through observed actions.');
    expect(results.find((result) => result.url.endsWith('/context'))?.content).toBe('');
    expect(JSON.stringify(results)).not.toContain('uncited prose');
    expect(JSON.stringify(results)).not.toContain('Grounded citation returned for query');
  });

});

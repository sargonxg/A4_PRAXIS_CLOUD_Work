import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  vertexSearch: vi.fn(() => ({ id: 'vertex-search' })),
  googleSearch: vi.fn(() => ({ id: 'google-search' })),
}));
vi.mock('@ai-sdk/google-vertex', () => ({ createVertex: () => ({ tools: { googleSearch: mocks.vertexSearch } }) }));
vi.mock('@ai-sdk/google', () => ({ createGoogleGenerativeAI: () => ({ tools: { googleSearch: mocks.googleSearch } }) }));

import { getGoogleSearchTool } from '@/lib/ai/providers';

describe('provider-aware Google Search activation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('uses Vertex Search under the production Vertex provider', () => {
    vi.stubEnv('AI_PROVIDER', 'vertex');
    vi.stubEnv('GOOGLE_VERTEX_PROJECT', 'test-project');
    expect(getGoogleSearchTool()).toEqual({ id: 'vertex-search' });
    expect(mocks.vertexSearch).toHaveBeenCalledWith({});
    expect(mocks.googleSearch).not.toHaveBeenCalled();
  });

  it('uses the AI Studio Search tool for the Google provider', () => {
    vi.stubEnv('AI_PROVIDER', 'google');
    vi.stubEnv('GOOGLE_AI_API_KEY', 'test-key');
    expect(getGoogleSearchTool()).toEqual({ id: 'google-search' });
    expect(mocks.googleSearch).toHaveBeenCalledWith({});
    expect(mocks.vertexSearch).not.toHaveBeenCalled();
  });
});

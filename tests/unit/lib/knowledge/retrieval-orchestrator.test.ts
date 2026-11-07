import { describe, expect, it, vi } from 'vitest';
import { RetrievalOrchestrator } from '@/lib/knowledge/retrieval-orchestrator';
import type { ACOEdge, ACONode, FeedCacheEntry, RelatedToolData, VectorResult } from '@/lib/knowledge/types';

function node(id: string, description = ''): ACONode {
  return { id, name: id, type: 'actor', subtypes: [], description, confidence: 'EXTRACTED', sourceDocIds: ['source'], aliases: [], createdAt: '', updatedAt: '', metadata: {} };
}

function edge(id: string, source: string, target: string): ACOEdge {
  return { id, source, target, type: 'supports', category: 'structural', confidence: 'EXTRACTED', weight: 1, sourceDocIds: ['source'], metadata: {} };
}

function vector(chunkId: string, score: number, text = 'A sourced passage.'): VectorResult {
  return { chunkId, score, text, sourceDocId: 'source', entityReferences: [], timestamp: '' };
}

function orchestratorFor(input: { nodes?: ACONode[]; edges?: ACOEdge[]; vectors?: VectorResult[]; feeds?: Record<string, FeedCacheEntry>; tools?: Record<string, RelatedToolData> }) {
  return new RetrievalOrchestrator(
    { getNodes: async () => input.nodes ?? [], getEdges: async () => input.edges ?? [], getMetrics: async () => ({ nodeCount: 0, edgeCount: 0, density: 0, communities: 0, mostCentralNode: '', lastComputed: '' }) } as never,
    { search: async () => input.vectors ?? [] } as never,
    { getToolRelevantFeeds: async () => input.feeds ?? {} } as never,
    { getRelatedToolData: async () => input.tools ?? {} } as never,
  );
}

describe('RetrievalOrchestrator', () => {
  it('keeps fitting evidence after an oversized graph node and excludes edges to omitted nodes', async () => {
    const result = await orchestratorFor({
      nodes: [node('oversized', 'x'.repeat(30_000)), node('retained-a'), node('retained-b')],
      edges: [edge('dangling', 'oversized', 'retained-a'), edge('connected', 'retained-a', 'retained-b')],
    }).retrieve('u1', 's1', 'dashboard');

    expect(result.graph?.nodes.map((item) => item.id)).toEqual(['retained-a', 'retained-b']);
    expect(result.graph?.edges.map((item) => item.id)).toEqual(['connected']);
  });

  it('ranks unique vector chunks and budgets metadata before selecting subsequent fitting passages', async () => {
    const result = await orchestratorFor({ vectors: [
      vector('oversized', 1, 'x'.repeat(12_000)),
      vector('lower', 0.3),
      vector('duplicate', 0.4),
      vector('duplicate', 0.9, 'The strongest copy.'),
      { ...vector('oversized-metadata', 0.95), entityReferences: ['x'.repeat(12_000)] },
    ] }).retrieve('u1', 's1', 'dashboard', 'query');

    expect(result.vectorResults?.map((item) => item.chunkId)).toEqual(['duplicate', 'lower']);
    expect(result.vectorResults?.[0].text).toBe('The strongest copy.');
    expect(Math.ceil(JSON.stringify(result.vectorResults).length / 4)).toBeLessThanOrEqual(2000);
  });

  it('does not let an oversized feed or structured tool output hide later fitting evidence', async () => {
    const feed = (data: unknown): FeedCacheEntry => ({ data, feedName: 'source', fetchedAt: '', ttlExpires: '', isStale: false, country: 'SY' });
    const tool = (data: unknown): RelatedToolData => ({ data, generatedAt: '', version: 1 });
    const result = await orchestratorFor({
      feeds: { oversized: feed('x'.repeat(30_000)), small: feed({ observation: 'Retained feed evidence.' }) },
      tools: { oversized: tool(Object.fromEntries(Array.from({ length: 30 }, (_, index) => [index, 'x'.repeat(5000)]))), small: tool({ conclusion: 'Retained tool evidence.' }) },
    }).retrieve('u1', 's1', 'dashboard');

    expect(Object.keys(result.feedData ?? {})).toEqual(['small']);
    expect(Object.keys(result.relatedToolData ?? {})).toEqual(['small']);
  });

  it('clips large related tool data without corrupting JSON shape', async () => {
    const graphLayer = {
      getNodes: vi.fn(async () => []),
      getEdges: vi.fn(async () => []),
      getMetrics: vi.fn(async () => ({
        nodeCount: 0,
        edgeCount: 0,
        density: 0,
        communities: 0,
        mostCentralNode: '',
        lastComputed: '',
      })),
    };
    const vectorLayer = { search: vi.fn(async () => []) };
    const feedLayer = { getToolRelevantFeeds: vi.fn(async () => ({})) };
    const toolOutputLayer = {
      getRelatedToolData: vi.fn(async () => ({
        risk: {
          toolId: 'risk-monitor',
          data: {
            narrative: 'x'.repeat(10_000),
            nested: { quote: 'y'.repeat(10_000) },
          },
          generatedAt: '2026-04-25T00:00:00Z',
          version: 1,
        },
      })),
    };

    const orchestrator = new RetrievalOrchestrator(
      graphLayer as never,
      vectorLayer as never,
      feedLayer as never,
      toolOutputLayer as never,
    );

    const context = await orchestrator.retrieve('u1', 's1', 'briefing', 'query');
    const related = context.relatedToolData?.risk?.data as { narrative: string; nested: { quote: string } };

    expect(related.narrative).toContain('...');
    expect(related.nested.quote).toContain('...');
    expect(() => JSON.stringify(context.relatedToolData)).not.toThrow();
  });
});

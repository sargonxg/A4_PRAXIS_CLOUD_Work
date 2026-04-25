import { describe, expect, it, vi } from 'vitest';
import { RetrievalOrchestrator } from '@/lib/knowledge/retrieval-orchestrator';

describe('RetrievalOrchestrator', () => {
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

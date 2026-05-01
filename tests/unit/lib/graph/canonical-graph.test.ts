import { describe, expect, it } from 'vitest';
import { buildTemporalAssertionsFromGraph, normalizeCanonicalGraph } from '@/lib/graph/canonical-graph';
import { buildGraphContextPack } from '@/lib/graph/graph-query-service';
import { generateGraphRepairSuggestions } from '@/lib/graph/graph-repair';
import type { GraphData } from '@/lib/firebase/graph-service';

describe('canonical graph backbone', () => {
  it('normalizes ids, casing, evidence, and drops edges with missing endpoints', () => {
    const graph: GraphData = {
      nodes: [
        {
          id: 'Actor A',
          type: 'Actor',
          label: 'Actor A',
          properties: {},
          createdAt: '2026-01-01T00:00:00.000Z',
          source: 'web-research',
          metadata: { source_url: 'https://example.test/a', valid_from: '2026-01-01' },
        },
        {
          id: 'Risk B',
          type: 'Risk',
          label: 'Risk B',
          properties: {},
          createdAt: '2026-01-02T00:00:00.000Z',
          source: 'extraction',
          metadata: {},
        },
      ],
      edges: [
        { id: 'E 1', source: 'Actor A', target: 'Risk B', type: 'Faces', weight: 1 },
        { id: 'Bad', source: 'Actor A', target: 'Missing', type: 'Mentions', weight: 1 },
      ],
    };

    const normalized = normalizeCanonicalGraph(graph);

    expect(normalized.schemaVersion).toBe('canonical-graph-v1');
    expect(normalized.nodes.map((node) => node.id)).toEqual(['actor-a', 'risk-b']);
    expect(normalized.nodes[0].type).toBe('actor');
    expect(normalized.edges).toHaveLength(1);
    expect(normalized.edges[0].source).toBe('actor-a');
    expect(normalized.nodes[0].metadata?.evidence).toEqual([
      expect.objectContaining({ url: 'https://example.test/a', extractor: 'web-research' }),
    ]);
  });

  it('builds temporal assertions and query packs from canonical graph', () => {
    const graph = normalizeCanonicalGraph({
      nodes: [
        {
          id: 'actor-a',
          type: 'actor',
          label: 'Actor A',
          properties: {},
          createdAt: '2026-01-01T00:00:00.000Z',
          source: 'extraction',
          metadata: { valid_from: '2026-01-01', confidence: 'EXTRACTED' },
        },
      ],
      edges: [],
      lastUpdated: '2026-01-03T00:00:00.000Z',
    });

    expect(buildTemporalAssertionsFromGraph(graph)[0]).toEqual(expect.objectContaining({
      subjectId: 'actor-a',
      predicate: 'exists',
      validFrom: '2026-01-01',
    }));
    expect(buildGraphContextPack(graph).summaryLines[0]).toContain('1 canonical nodes');
  });

  it('generates deterministic repair suggestions', () => {
    const graph: GraphData = {
      nodes: [
        { id: 'a', type: 'actor', label: 'Same', properties: {}, createdAt: '2026-01-01T00:00:00.000Z', source: 'manual', metadata: {} },
        { id: 'b', type: 'actor', label: 'Same', properties: {}, createdAt: '2026-01-01T00:00:00.000Z', source: 'manual', metadata: {} },
        { id: 'c', type: 'risk', label: 'Risk', properties: {}, createdAt: '2026-01-01T00:00:00.000Z', source: 'manual', metadata: {} },
        { id: 'd', type: 'event', label: 'Event', properties: {}, createdAt: '2026-01-01T00:00:00.000Z', source: 'manual', metadata: { valid_from: '2025-01-01' } },
      ],
      edges: [],
    };

    const suggestions = generateGraphRepairSuggestions(graph, new Date('2026-04-30T00:00:00.000Z'));

    expect(suggestions.some((suggestion) => suggestion.kind === 'duplicate-label')).toBe(true);
    expect(suggestions.some((suggestion) => suggestion.kind === 'weak-provenance')).toBe(true);
    expect(suggestions.some((suggestion) => suggestion.kind === 'stale-temporal')).toBe(true);
  });
});

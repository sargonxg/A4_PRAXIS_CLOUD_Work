import { describe, expect, it } from 'vitest';
import { buildGraphOpsSummary } from '@/lib/graph/graphops';
import type { GraphData } from '@/lib/firebase/graph-service';

describe('buildGraphOpsSummary', () => {
  it('scores provenance, temporal coverage, proposal pressure, and low confidence', () => {
    const graph: GraphData = {
      nodes: [
        {
          id: 'actor-a',
          type: 'Actor',
          label: 'Actor A',
          properties: {},
          createdAt: '2026-01-01T00:00:00.000Z',
          source: 'extraction',
          metadata: { confidence: 'EXTRACTED', source_url: 'https://example.test/a', valid_from: '2025-12-01' },
        },
        {
          id: 'risk-a',
          type: 'Risk',
          label: 'Risk A',
          properties: {},
          createdAt: '2026-01-02T00:00:00.000Z',
          source: 'ai-chat',
          metadata: { confidence: 'AMBIGUOUS' },
        },
      ],
      edges: [
        {
          id: 'actor-a__faces__risk-a',
          source: 'actor-a',
          target: 'risk-a',
          type: 'faces',
          weight: 1,
          metadata: { confidence: 'EXTRACTED', valid_from: '2026-01-05', source_name: 'Memo' },
        },
      ],
    };

    const summary = buildGraphOpsSummary({
      graph,
      proposals: [
        {
          id: 'p1',
          kind: 'node.add',
          proposedAt: '2026-01-03T00:00:00.000Z',
          confidence: 0.8,
          summary: 'Add actor',
          provenance: { extractor: 'test' },
          payload: {},
          status: 'proposed',
        },
      ],
      snapshotIds: ['main', 'snapshot-2026-01-04T00:00:00.000Z'],
      backend: 'firestore-canonical',
      now: '2026-01-06T00:00:00.000Z',
    });

    expect(summary.nodeCount).toBe(2);
    expect(summary.edgeCount).toBe(1);
    expect(summary.proposedCount).toBe(1);
    expect(summary.lowConfidenceCount).toBe(1);
    expect(summary.temporal.coveragePct).toBe(100);
    expect(summary.provenance.coveragePct).toBe(100);
    expect(summary.latestSnapshotAt).toBe('2026-01-04T00:00:00.000Z');
    expect(summary.maintenanceActions.some((action) => action.includes('Review 1 pending'))).toBe(true);
    expect(summary.repairSuggestions).toEqual(expect.any(Array));
  });

  it('returns an explicit seed action for empty graphs', () => {
    const summary = buildGraphOpsSummary({ graph: null, now: '2026-01-01T00:00:00.000Z' });

    expect(summary.nodeCount).toBe(0);
    expect(summary.edgeCount).toBe(0);
    expect(summary.maintenanceActions[0]).toContain('Seed graph');
  });
});

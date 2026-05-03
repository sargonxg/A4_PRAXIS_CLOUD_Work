import { describe, expect, it } from 'vitest';
import { episodicView, graphView, semanticView, stanceView } from '@/lib/knowledge/graph-views';
import type { GraphData, GraphEdge, GraphNode } from '@/lib/firebase/graph-service';

const node = (id: string, type: string, label = id, date?: string): GraphNode => ({
  id,
  type,
  label,
  properties: {},
  createdAt: date ?? '2026-01-01',
  source: 'manual',
  metadata: date ? { date } : {},
});

const edge = (id: string, source: string, target: string, type = 'relates_to'): GraphEdge => ({
  id,
  source,
  target,
  type,
  weight: 1,
});

const graph: GraphData = {
  nodes: [
    node('actor-gov', 'Actor'),
    node('claim-rights', 'Claim'),
    node('interest-security', 'Interest'),
    node('constraint-funding', 'Constraint'),
    node('commitment-jan30', 'Commitment'),
    node('leverage-revenue', 'Leverage'),
    node('event-older', 'Event', 'Older event', '2026-01-30'),
    node('event-newer', 'Event', 'Newer event', '2026-03-18'),
    node('narrative-sovereignty', 'Narrative'),
  ],
  edges: [
    edge('e1', 'actor-gov', 'claim-rights', 'CLAIMS'),
    edge('e2', 'actor-gov', 'event-newer', 'PARTICIPATED_IN'),
    edge('e3', 'narrative-sovereignty', 'claim-rights', 'JUSTIFIES_CLAIM'),
    edge('e4', 'narrative-sovereignty', 'event-older', 'FRAMES_EVENT'),
  ],
};

describe('graph views', () => {
  it('returns event-centered episodic view ordered by event time', () => {
    const view = episodicView(graph);
    expect(view.nodes.map((n) => n.id)).toContain('event-older');
    expect(view.nodes.map((n) => n.id)).toContain('event-newer');
    expect(view.nodes[0].id).toBe('event-older');
    expect(view.edges.map((e) => e.id)).toEqual(['e2', 'e4']);
  });

  it('returns semantic primitives without events or narratives', () => {
    const view = semanticView(graph);
    expect(view.nodes.map((n) => n.type.toLowerCase())).not.toContain('event');
    expect(view.nodes.map((n) => n.type.toLowerCase())).not.toContain('narrative');
    expect(view.nodes.map((n) => n.id)).toContain('commitment-jan30');
  });

  it('returns stance view around narratives, actors, and claims', () => {
    const view = stanceView(graph);
    expect(view.nodes.map((n) => n.id)).toContain('narrative-sovereignty');
    expect(view.nodes.map((n) => n.id)).toContain('claim-rights');
    expect(view.edges.map((e) => e.id)).toContain('e3');
  });

  it('dispatches by view id', () => {
    expect(graphView(graph, 'all').nodes).toHaveLength(graph.nodes.length);
    expect(graphView(graph, 'semantic').id).toBe('semantic');
  });
});

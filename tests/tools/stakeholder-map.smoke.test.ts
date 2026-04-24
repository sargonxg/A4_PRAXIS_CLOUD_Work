import { describe, it, expect } from 'vitest';
import { scoreSalience } from '@/lib/analytics/salience-engine';
import type { GraphNode, GraphEdge } from '@/lib/firebase/graph-service';

const n = (id: string, type: string, label: string): GraphNode => ({
  id,
  type,
  label,
  properties: {},
  createdAt: new Date().toISOString(),
  source: 'manual',
});

const e = (id: string, source: string, target: string, type: string): GraphEdge => ({
  id,
  source,
  target,
  type,
  weight: 1,
});

describe('salience-engine', () => {
  it('ranks an actor with leverage + recognition + escalation as definitive', () => {
    const nodes: GraphNode[] = [n('a1', 'Actor', 'State X'), n('c1', 'Claim', 'Territory')];
    const edges: GraphEdge[] = [
      e('e1', 'a1', 'c1', 'has_leverage'),
      e('e2', 'a1', 'c1', 'has_leverage'),
      e('e3', 'a1', 'c1', 'has_leverage'),
      e('e4', 'c1', 'a1', 'recognised_by'),
      e('e5', 'c1', 'a1', 'recognised_by'),
      e('e6', 'c1', 'a1', 'recognised_by'),
      e('e7', 'a1', 'c1', 'escalates'),
      e('e8', 'a1', 'c1', 'escalates'),
      e('e9', 'a1', 'c1', 'escalates'),
    ];
    const result = scoreSalience(nodes, edges);
    expect(result).toHaveLength(1);
    expect(result[0].quadrant).toBe('definitive');
  });

  it('returns non-stakeholder for an actor with no qualifying edges', () => {
    const nodes: GraphNode[] = [n('a1', 'Actor', 'Quiet NGO')];
    const edges: GraphEdge[] = [];
    const result = scoreSalience(nodes, edges);
    expect(result[0].quadrant).toBe('non-stakeholder');
  });

  it('caps scores at 1 regardless of edge count', () => {
    const nodes: GraphNode[] = [n('a1', 'Actor', 'Powerful')];
    const edges: GraphEdge[] = Array.from({ length: 20 }, (_, i) =>
      e(`e${i}`, 'a1', 'c1', 'has_leverage'),
    );
    const result = scoreSalience(nodes, edges);
    expect(result[0].power).toBe(1);
  });
});

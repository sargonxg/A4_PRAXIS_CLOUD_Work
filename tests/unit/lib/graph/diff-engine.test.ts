import { describe, expect, it } from 'vitest';
import { diffGraphSnapshots } from '@/lib/graph/diff-engine';

describe('graph diff engine', () => {
  it('detects added, removed, and modified graph records', () => {
    const diff = diffGraphSnapshots(
      {
        nodes: [{ id: 'a', label: 'A' }, { id: 'removed', label: 'Old' }],
        edges: [{ id: 'e1', source: 'a', target: 'b', type: 'OLD' }],
        sources: [{ id: 's1', updatedAt: '1' }],
      },
      {
        nodes: [{ id: 'a', label: 'A2' }, { id: 'b', label: 'B' }],
        edges: [{ id: 'e1', source: 'a', target: 'b', type: 'NEW' }, { id: 'e2', source: 'b', target: 'a' }],
        sources: [{ id: 's1', updatedAt: '2' }],
      },
    );

    expect(diff.addedNodes.map((node) => node.id)).toEqual(['b']);
    expect(diff.removedNodes.map((node) => node.id)).toEqual(['removed']);
    expect(diff.modifiedNodes.map((node) => node.id)).toEqual(['a']);
    expect(diff.addedEdges.map((edge) => edge.id)).toEqual(['e2']);
    expect(diff.modifiedEdges.map((edge) => edge.id)).toEqual(['e1']);
    expect(diff.sourceUpdates.map((source) => source.id)).toEqual(['s1']);
  });
});

import { describe, expect, it } from 'vitest';
import { syria2026CaseModule } from '@/lib/cases/syria-2026';
import { buildWorkbenchCaseGraph } from '@/lib/graph/workbench-case-graph';

describe('workbench case graph', () => {
  it('builds a canonical visible graph from a case module', () => {
    const graph = buildWorkbenchCaseGraph(syria2026CaseModule);

    expect(graph.nodes.some((node) => node.id === 'case')).toBe(true);
    expect(graph.nodes.some((node) => node.type === 'source')).toBe(true);
    expect(graph.edges.some((edge) => edge.type === 'informs')).toBe(true);
    expect(graph.provenanceCoverage).toBeGreaterThanOrEqual(0);
    expect(graph.provenanceCoverage).toBeLessThanOrEqual(1);
  });
});

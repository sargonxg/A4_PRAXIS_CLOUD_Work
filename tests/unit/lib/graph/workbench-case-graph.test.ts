import { describe, expect, it } from 'vitest';
import { buildWorkbenchCaseGraph } from '@/lib/graph/workbench-case-graph';
import { userCaseModule } from '../../../fixtures/user-case-module';

describe('workbench case graph', () => {
  it('builds a canonical visible graph from a case module', () => {
    const graph = buildWorkbenchCaseGraph(userCaseModule);

    expect(graph.nodes.some((node) => node.id === 'case')).toBe(true);
    expect(graph.nodes.some((node) => node.type === 'source')).toBe(true);
    expect(graph.edges.some((edge) => edge.type === 'informs')).toBe(true);
    expect(graph.provenanceCoverage).toBeGreaterThanOrEqual(0);
    expect(graph.provenanceCoverage).toBeLessThanOrEqual(1);
  });
});

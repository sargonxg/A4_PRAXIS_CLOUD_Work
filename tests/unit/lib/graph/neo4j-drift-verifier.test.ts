import { describe, expect, it } from 'vitest';
import {
  buildGraphSyncReport,
  compareGraphSnapshots,
  listExampleGraphSnapshots,
  verifyNeo4jSync,
  type GraphSyncSnapshot,
} from '@/lib/graph/neo4j-drift-verifier';

const expected: GraphSyncSnapshot = {
  situationId: 's1',
  source: 'firestore',
  nodeCount: 10,
  edgeCount: 20,
  updatedAt: '2026-05-06T00:00:00.000Z',
};

describe('neo4j-drift-verifier', () => {
  it('compares node and edge drift by situation', () => {
    const diff = compareGraphSnapshots(expected, { ...expected, source: 'neo4j', nodeCount: 9, edgeCount: 20 }, 0);

    expect(diff.status).toBe('drift');
    expect(diff.nodeDrift).toBe(1);
    expect(diff.edgeDrift).toBe(0);
    expect(diff.driftPercent).toBe(10);
  });

  it('builds ok reports when production snapshots match', () => {
    const report = buildGraphSyncReport({
      expected: [expected],
      actual: [{ ...expected, source: 'neo4j' }],
      mode: 'production',
    });

    expect(report.status).toBe('ok');
    expect(report.compared).toBe(1);
    expect(report.warnings).toHaveLength(0);
  });

  it('marks missing Neo4j rows as drift', () => {
    const report = buildGraphSyncReport({
      expected: [expected],
      actual: [],
      mode: 'production',
    });

    expect(report.status).toBe('drift');
    expect(report.warnings).toContain('missing_actual:s1');
  });

  it('verifies example case contracts without production credentials', async () => {
    const report = await verifyNeo4jSync({ production: false });

    expect(report.status).toBe('ok');
    expect(report.mode).toBe('example-contract');
    expect(report.compared).toBeGreaterThanOrEqual(2);
    expect(listExampleGraphSnapshots().map((snapshot) => snapshot.situationId)).toContain('syria-2026');
  });
});

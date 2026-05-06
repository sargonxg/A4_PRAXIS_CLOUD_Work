import type { CaseModule } from '@/types/case-module';
import { listExampleCases } from '@/lib/cases/registry';

export interface GraphSyncSnapshot {
  situationId: string;
  source: 'firestore' | 'neo4j' | 'example-contract';
  nodeCount: number;
  edgeCount: number;
  updatedAt: string | null;
}

export interface GraphSyncDiff {
  situationId: string;
  expectedNodes: number;
  actualNodes: number;
  expectedEdges: number;
  actualEdges: number;
  nodeDrift: number;
  edgeDrift: number;
  driftPercent: number;
  status: 'ok' | 'drift';
}

export interface GraphSyncReport {
  checkedAt: string;
  mode: 'example-contract' | 'production';
  status: 'ok' | 'drift' | 'unconfigured';
  thresholdPercent: number;
  compared: number;
  diffs: GraphSyncDiff[];
  warnings: string[];
}

export function snapshotFromCaseModule(caseModule: CaseModule): GraphSyncSnapshot {
  const layers = Object.values(caseModule.truthLayers);
  return {
    situationId: caseModule.id,
    source: 'example-contract',
    nodeCount: layers.reduce((sum, layer) => sum + layer.nodeCount, 0),
    edgeCount: layers.reduce((sum, layer) => sum + layer.edgeCount, 0),
    updatedAt: layers.map((layer) => layer.lastUpdated).sort().at(-1) ?? null,
  };
}

export function listExampleGraphSnapshots(caseIds?: string[]): GraphSyncSnapshot[] {
  const idSet = caseIds && caseIds.length > 0 ? new Set(caseIds) : null;
  return listExampleCases()
    .filter((caseModule) => !idSet || idSet.has(caseModule.id))
    .map(snapshotFromCaseModule);
}

export function compareGraphSnapshots(
  expected: GraphSyncSnapshot,
  actual: GraphSyncSnapshot,
  thresholdPercent: number,
): GraphSyncDiff {
  const nodeDrift = Math.abs(expected.nodeCount - actual.nodeCount);
  const edgeDrift = Math.abs(expected.edgeCount - actual.edgeCount);
  const nodeBase = Math.max(expected.nodeCount, 1);
  const edgeBase = Math.max(expected.edgeCount, 1);
  const driftPercent = Math.max((nodeDrift / nodeBase) * 100, (edgeDrift / edgeBase) * 100);
  return {
    situationId: expected.situationId,
    expectedNodes: expected.nodeCount,
    actualNodes: actual.nodeCount,
    expectedEdges: expected.edgeCount,
    actualEdges: actual.edgeCount,
    nodeDrift,
    edgeDrift,
    driftPercent: Number(driftPercent.toFixed(2)),
    status: driftPercent <= thresholdPercent ? 'ok' : 'drift',
  };
}

export function buildGraphSyncReport(input: {
  expected: GraphSyncSnapshot[];
  actual: GraphSyncSnapshot[];
  mode: GraphSyncReport['mode'];
  thresholdPercent?: number;
  warnings?: string[];
}): GraphSyncReport {
  const thresholdPercent = input.thresholdPercent ?? 0;
  const actualById = new Map(input.actual.map((snapshot) => [snapshot.situationId, snapshot]));
  const diffs = input.expected.map((expected) =>
    compareGraphSnapshots(
      expected,
      actualById.get(expected.situationId) ?? {
        situationId: expected.situationId,
        source: input.mode === 'production' ? 'neo4j' : 'example-contract',
        nodeCount: 0,
        edgeCount: 0,
        updatedAt: null,
      },
      thresholdPercent,
    ),
  );
  const warnings = [...(input.warnings ?? [])];
  for (const expected of input.expected) {
    if (!actualById.has(expected.situationId)) warnings.push(`missing_actual:${expected.situationId}`);
  }
  return {
    checkedAt: new Date().toISOString(),
    mode: input.mode,
    status: diffs.some((diff) => diff.status === 'drift') ? 'drift' : 'ok',
    thresholdPercent,
    compared: diffs.length,
    diffs,
    warnings,
  };
}

export async function loadFirestoreGraphSnapshots(limit: number): Promise<GraphSyncSnapshot[]> {
  const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
  const db = getAdminDbOrThrow();
  const snap = await db.collectionGroup('graph').limit(limit * 3).get();
  return snap.docs
    .filter((doc) => doc.id === 'main')
    .slice(0, limit)
    .map((doc) => {
      const data = doc.data() as { nodeCount?: number; edgeCount?: number; nodes?: unknown[]; edges?: unknown[]; lastUpdated?: string };
      const situationId = doc.ref.parent.parent?.id ?? doc.ref.path;
      return {
        situationId,
        source: 'firestore',
        nodeCount: typeof data.nodeCount === 'number' ? data.nodeCount : Array.isArray(data.nodes) ? data.nodes.length : 0,
        edgeCount: typeof data.edgeCount === 'number' ? data.edgeCount : Array.isArray(data.edges) ? data.edges.length : 0,
        updatedAt: data.lastUpdated ?? null,
      };
    });
}

export async function loadNeo4jGraphSnapshots(situationIds: string[]): Promise<GraphSyncSnapshot[]> {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USERNAME ?? process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;
  if (!uri || !user || !password) return [];

  const neo4j = await import('neo4j-driver');
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();
  try {
    const out: GraphSyncSnapshot[] = [];
    for (const situationId of situationIds) {
      const result = await session.run(
        `
        MATCH (n)
        WHERE n.situationId = $situationId OR n.situation_id = $situationId
        WITH count(n) AS nodeCount
        MATCH ()-[r]->()
        WHERE r.situationId = $situationId OR r.situation_id = $situationId
        RETURN nodeCount, count(r) AS edgeCount
        `,
        { situationId },
      );
      const row = result.records[0];
      const nodeCount = row?.get('nodeCount')?.toNumber?.() ?? Number(row?.get('nodeCount') ?? 0);
      const edgeCount = row?.get('edgeCount')?.toNumber?.() ?? Number(row?.get('edgeCount') ?? 0);
      out.push({ situationId, source: 'neo4j', nodeCount, edgeCount, updatedAt: null });
    }
    return out;
  } finally {
    await session.close();
    await driver.close();
  }
}

export async function verifyNeo4jSync(opts: {
  caseIds?: string[];
  production?: boolean;
  sampleSize?: number;
  thresholdPercent?: number;
} = {}): Promise<GraphSyncReport> {
  const thresholdPercent = opts.thresholdPercent ?? 0;
  if (!opts.production) {
    const snapshots = listExampleGraphSnapshots(opts.caseIds);
    return buildGraphSyncReport({
      expected: snapshots,
      actual: snapshots,
      mode: 'example-contract',
      thresholdPercent,
    });
  }

  const expected = await loadFirestoreGraphSnapshots(opts.sampleSize ?? 10);
  if (expected.length === 0) {
    return {
      checkedAt: new Date().toISOString(),
      mode: 'production',
      status: 'unconfigured',
      thresholdPercent,
      compared: 0,
      diffs: [],
      warnings: ['no_firestore_graph_snapshots'],
    };
  }

  const actual = await loadNeo4jGraphSnapshots(expected.map((snapshot) => snapshot.situationId));
  if (actual.length === 0) {
    return {
      checkedAt: new Date().toISOString(),
      mode: 'production',
      status: 'unconfigured',
      thresholdPercent,
      compared: 0,
      diffs: [],
      warnings: ['neo4j_credentials_missing_or_empty'],
    };
  }

  return buildGraphSyncReport({
    expected,
    actual,
    mode: 'production',
    thresholdPercent,
  });
}

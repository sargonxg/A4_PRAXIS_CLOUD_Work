import { adminDb } from '@/lib/firebase/admin';
import type { GraphData } from '@/lib/firebase/graph-service';
import { listProposals } from '@/lib/firebase/graph-updates-service';
import { buildGraphOpsSummary, type GraphOpsSummary } from '@/lib/graph/graphops';
import { buildGraphContextPack, type GraphContextPack } from '@/lib/graph/graph-query-service';

function graphCollection(uid: string, situationId: string) {
  return adminDb.collection('users').doc(uid).collection('situations').doc(situationId).collection('graph');
}

export async function getGraphOpsSummary(uid: string, situationId: string): Promise<GraphOpsSummary> {
  const graphRef = graphCollection(uid, situationId);
  const [mainSnap, graphDocs, proposals] = await Promise.all([
    graphRef.doc('main').get(),
    graphRef.limit(80).get(),
    listProposals(uid, situationId, { status: 'proposed', limit: 100 }),
  ]);

  const graph = mainSnap.exists ? (mainSnap.data() as GraphData) : null;
  const snapshotIds = graphDocs.docs.map((doc) => doc.id).filter((id) => id.startsWith('snapshot-'));

  return buildGraphOpsSummary({
    graph,
    proposals,
    snapshotIds,
    backend: process.env.NEO4J_URI ? 'neo4j-derived-index' : 'firestore-canonical',
  });
}

export async function getGraphContextPack(uid: string, situationId: string, opts: { focusActorId?: string; limit?: number } = {}): Promise<GraphContextPack> {
  const snap = await graphCollection(uid, situationId).doc('main').get();
  return buildGraphContextPack(snap.exists ? (snap.data() as GraphData) : null, opts);
}

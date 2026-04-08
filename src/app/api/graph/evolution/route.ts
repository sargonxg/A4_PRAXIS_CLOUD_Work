import { withAuth } from '@/lib/api/with-auth';
import {
  getGraph,
  getGraphTimeline,
  getEntityDistribution,
  findPivotActors,
  saveSnapshot,
  getGraphEvolution,
} from '@/lib/firebase/graph-service';

/**
 * Graph Evolution & Analytics API
 *
 * GET — returns graph statistics, timeline, pivot actors, entity distribution
 * POST — creates a snapshot or retrieves evolution diff between snapshots
 *
 * Used by: conflict-graph page, timeline tool, dashboard, risk monitor
 */
export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const situationId = searchParams.get('situationId');

  if (!situationId) {
    return Response.json({ error: 'situationId required' }, { status: 400 });
  }

  const graph = await getGraph(user.uid, situationId);
  if (!graph || graph.nodes.length === 0) {
    return Response.json({
      nodeCount: 0,
      edgeCount: 0,
      entityDistribution: {},
      timeline: [],
      pivotActors: [],
    });
  }

  return Response.json({
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    entityDistribution: getEntityDistribution(graph),
    timeline: getGraphTimeline(graph),
    pivotActors: findPivotActors(graph),
    lastUpdated: graph.lastUpdated,
    version: graph.version,
  });
});

export const POST = withAuth(async (req, user) => {
  const { action, situationId, fromSnapshot, toSnapshot, trigger } = await req.json();

  if (!situationId) {
    return Response.json({ error: 'situationId required' }, { status: 400 });
  }

  // Create a snapshot
  if (action === 'snapshot') {
    const timestamp = await saveSnapshot(user.uid, situationId, trigger || 'manual');
    return Response.json({ snapshot: timestamp });
  }

  // Get evolution diff between snapshots
  if (action === 'evolution') {
    if (!fromSnapshot) {
      return Response.json({ error: 'fromSnapshot required for evolution diff' }, { status: 400 });
    }
    const evolution = await getGraphEvolution(user.uid, situationId, fromSnapshot, toSnapshot);
    return Response.json(evolution);
  }

  return Response.json({ error: 'Unknown action. Use "snapshot" or "evolution".' }, { status: 400 });
});

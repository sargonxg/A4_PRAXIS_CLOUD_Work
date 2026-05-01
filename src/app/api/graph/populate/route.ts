import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { populateSituationGraph } from '@/lib/services/graph-populate';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * POST /api/graph/populate
 *
 * Body: { situationId: string, mode?: 'commit' | 'staged' }
 *
 * mode='staged' (default) — writes the merged graph into graph/staged so the
 * user can review a diff before approving.
 *
 * mode='commit' — legacy/admin direct write into graph/main. Avoid for normal
 * user workflows; GraphOps expects review before canonical mutation.
 *
 * Rebuilds or extends the ACO knowledge graph for the given situation. Reads
 * the caller's uploaded documents, the situation description, and — when no
 * content is available — seeds the graph via grounded Google Search. Every
 * Actor node is enriched with Wikipedia + GDELT signal so the graph carries
 * live context at the moment of population.
 *
 * Idempotent: running twice on the same situation merges with existing nodes
 * rather than overwriting. A snapshot is recorded for every successful run.
 */
export const POST = withAuth(async (req, user) => {
  try {
    const body = (await req.json().catch(() => ({}))) as { situationId?: string; mode?: 'commit' | 'staged' };
    if (!body.situationId) {
      return NextResponse.json({ error: 'situationId required' }, { status: 400 });
    }
    const mode = body.mode === 'commit' ? 'commit' : 'staged';
    const result = await populateSituationGraph({
      uid: user.uid,
      situationId: body.situationId,
      trigger: mode === 'staged' ? 'api-staged' : 'api',
      mode,
    });
    return NextResponse.json({ ...result, mode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Graph population failed';
    console.error('[api/graph/populate]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});

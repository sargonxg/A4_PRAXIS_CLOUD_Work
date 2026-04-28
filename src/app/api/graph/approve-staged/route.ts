import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { approveStagedGraph, discardStagedGraph, getStagedGraph } from '@/lib/services/graph-populate';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/graph/approve-staged?situationId=...
 *   → returns { staged } so the UI can render a diff against /graph/main.
 *
 * POST /api/graph/approve-staged
 *   Body: { situationId: string, action: 'approve' | 'discard' }
 *   → 'approve' merges staged → main, writes a snapshot, clears staged.
 *   → 'discard' deletes staged without touching main.
 */
export const GET = withAuth(async (req, user) => {
  try {
    const url = new URL(req.url);
    const situationId = url.searchParams.get('situationId');
    if (!situationId) return NextResponse.json({ error: 'situationId required' }, { status: 400 });
    const staged = await getStagedGraph(user.uid, situationId);
    return NextResponse.json({ situationId, staged });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to read staged graph' }, { status: 500 });
  }
});

export const POST = withAuth(async (req, user) => {
  try {
    const body = (await req.json().catch(() => ({}))) as { situationId?: string; action?: 'approve' | 'discard' };
    if (!body.situationId) return NextResponse.json({ error: 'situationId required' }, { status: 400 });
    if (body.action === 'discard') {
      await discardStagedGraph(user.uid, body.situationId);
      return NextResponse.json({ ok: true, action: 'discard', situationId: body.situationId });
    }
    const result = await approveStagedGraph({ uid: user.uid, situationId: body.situationId });
    return NextResponse.json({ ok: true, action: 'approve', ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Approve failed' }, { status: 500 });
  }
});

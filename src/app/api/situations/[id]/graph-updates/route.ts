/**
 * GET / POST /api/situations/[id]/graph-updates
 *
 * GET — list proposed graph updates for the active situation.
 * POST { updateId, action: 'approve' | 'reject', note?, editedPayload? } —
 *      flip a proposal's status. Approve writes a canonical-graph
 *      mutation via applyApprovedProposal (stubbed for now — actual
 *      mutation is queued for next round).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  approveProposal,
  applyApprovedProposal,
  getProposal,
  listProposals,
  rejectProposal,
} from '@/lib/firebase/graph-updates-service';

const PostSchema = z.object({
  updateId: z.string().min(1).max(200),
  action: z.enum(['approve', 'reject']),
  note: z.string().max(800).optional(),
  editedPayload: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withAuth<{ params: Promise<{ id: string }> }>(async (_request, user, context) => {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Missing situation id' }, { status: 400 });
    const proposals = await listProposals(user.uid, id, { status: 'proposed', limit: 50 });
    return NextResponse.json({ proposals, count: proposals.length });
  } catch (err) {
    return handleRouteError(err, 'situations/graph-updates/get');
  }
});

export const POST = withAuth<{ params: Promise<{ id: string }> }>(async (request, user, context) => {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Missing situation id' }, { status: 400 });
    const raw = await request.json().catch(() => ({}));
    const parsed = PostSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    const { updateId, action, note, editedPayload } = parsed.data;

    if (action === 'reject') {
      const ok = await rejectProposal(user.uid, id, updateId, note);
      return NextResponse.json({ ok });
    }

    // Approve flow: load proposal → flip status → attempt canonical-mutate.
    const proposal = await getProposal(user.uid, id, updateId);
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    const flipped = await approveProposal(user.uid, id, updateId, { editedPayload, decisionNote: note });
    if (!flipped) {
      return NextResponse.json({ error: 'Approve failed' }, { status: 502 });
    }
    const applied = await applyApprovedProposal(user.uid, id, proposal);
    return NextResponse.json({ ok: true, applied: applied.applied, reason: applied.reason });
  } catch (err) {
    return handleRouteError(err, 'situations/graph-updates/post');
  }
});

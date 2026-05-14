import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { applyApprovedProposal, getProposal } from '@/lib/firebase/graph-updates-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  situationId: z.string().min(1),
  note: z.string().max(800).optional(),
  editedPayload: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Demo mode cannot review graph proposals' }, { status: 403 });
    const { id } = await context.params;
    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid approval request', details: parsed.error.flatten() }, { status: 400 });
    }
    const proposal = await getProposal(user.uid, parsed.data.situationId, id);
    if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    const applied = await applyApprovedProposal(user.uid, parsed.data.situationId, {
      ...proposal,
      editedPayload: parsed.data.editedPayload,
      decisionNote: parsed.data.note,
    });
    if (!applied.applied) {
      return NextResponse.json({ error: 'Approve failed', reason: applied.reason }, { status: 422 });
    }
    return NextResponse.json({ ok: true, proposalId: id, state: parsed.data.editedPayload ? 'edited' : 'approved' });
  } catch (err) {
    return handleRouteError(err, 'graph/proposals/approve');
  }
});

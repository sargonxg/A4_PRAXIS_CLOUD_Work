import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { rejectProposal } from '@/lib/firebase/graph-updates-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  situationId: z.string().min(1),
  note: z.string().max(800).optional(),
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot review graph proposals' }, { status: 403 });
    const { id } = await context.params;
    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid rejection request', details: parsed.error.flatten() }, { status: 400 });
    }
    const ok = await rejectProposal(user.uid, parsed.data.situationId, id, parsed.data.note);
    if (!ok) return NextResponse.json({ error: 'Proposal not found or could not be rejected' }, { status: 404 });
    return NextResponse.json({ ok: true, proposalId: id, state: 'rejected' });
  } catch (err) {
    return handleRouteError(err, 'graph/proposals/reject');
  }
});

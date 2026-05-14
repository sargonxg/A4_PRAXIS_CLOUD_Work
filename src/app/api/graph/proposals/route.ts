import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { listProposals } from '@/lib/firebase/graph-updates-service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ proposed: [], accepted: [], rejected: [] });
    }
    const url = new URL(request.url);
    const situationId = url.searchParams.get('situationId');
    if (!situationId) {
      return NextResponse.json({ error: 'Missing situationId' }, { status: 400 });
    }

    const [proposed, accepted, edited, rejected] = await Promise.all([
      listProposals(user.uid, situationId, { status: 'proposed', limit: 100 }),
      listProposals(user.uid, situationId, { status: 'approved', limit: 100 }),
      listProposals(user.uid, situationId, { status: 'edited', limit: 100 }),
      listProposals(user.uid, situationId, { status: 'rejected', limit: 100 }),
    ]);

    return NextResponse.json({
      proposed,
      accepted: [...accepted, ...edited].sort((a, b) => String(b.decidedAt ?? b.proposedAt).localeCompare(String(a.decidedAt ?? a.proposedAt))),
      rejected,
    });
  } catch (err) {
    return handleRouteError(err, 'graph/proposals/get');
  }
});

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { buildCaseScaffoldProposal } from '@/lib/onboarding/case-scaffold';
import type { UserRole } from '@/types/situation';

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => null) as { objective?: unknown; userRole?: unknown } | null;
  const objective = typeof body?.objective === 'string' ? body.objective.trim() : '';

  if (objective.length < 12) {
    return NextResponse.json({ error: 'Objective must be at least 12 characters.' }, { status: 400 });
  }

  const proposal = buildCaseScaffoldProposal({
    objective,
    userRole: typeof body?.userRole === 'string' ? body.userRole as UserRole : undefined,
  });

  return NextResponse.json({
    proposal,
    audit: {
      ownerUid: user.uid,
      route: '/api/cases/scaffold',
      scaffoldMode: proposal.generatedBy,
      firewallNote: 'Accepted scaffold items must still pass normal case persistence validation.',
    },
  });
});

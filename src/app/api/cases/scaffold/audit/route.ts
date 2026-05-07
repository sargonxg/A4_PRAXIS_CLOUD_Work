import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { persistCaseScaffoldAudit } from '@/lib/onboarding/case-scaffold-audit-store';
import type { CaseScaffoldProposal } from '@/lib/onboarding/case-scaffold';

export const POST = withAuth(async (request, user) => {
  const body = await request.json().catch(() => null) as { proposal?: unknown; objective?: unknown } | null;
  const proposal = body?.proposal as CaseScaffoldProposal | undefined;
  if (!proposal?.suggestedCaseName || !Array.isArray(proposal.initialActors) || !Array.isArray(proposal.initialClaims)) {
    return NextResponse.json({ error: 'Valid CaseScaffoldProposal required.' }, { status: 400 });
  }

  if (user.isDemo) {
    return NextResponse.json({
      ok: true,
      mode: 'demo-not-persisted',
      acceptedCounts: {
        actors: proposal.initialActors.filter((actor) => actor.accepted).length,
        claims: proposal.initialClaims.filter((claim) => claim.accepted).length,
      },
    });
  }

  const audit = await persistCaseScaffoldAudit({
    uid: user.uid,
    proposal,
    objective: typeof body?.objective === 'string' ? body.objective : undefined,
  });
  return NextResponse.json({ ok: true, mode: 'persisted', audit }, { status: 201 });
});


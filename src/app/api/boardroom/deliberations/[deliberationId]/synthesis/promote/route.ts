import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { buildDemoDeliberation, getDeliberation } from '@/lib/boardroom/store';
import { createGraphUpdateProposal } from '@/lib/firebase/graph-updates-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ deliberationId: string }> };

const BodySchema = z.object({
  caseId: z.string().min(1),
  claimId: z.string().min(1),
  note: z.string().max(1000).optional(),
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { deliberationId } = await context.params;
    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid promotion request', details: parsed.error.flatten() }, { status: 400 });
    }

    const deliberation = user.isDemo
      ? buildDemoDeliberation({ uid: user.uid, caseId: parsed.data.caseId, id: deliberationId })
      : await getDeliberation(user.uid, parsed.data.caseId, deliberationId);
    if (!deliberation) return NextResponse.json({ error: 'Deliberation not found' }, { status: 404 });

    const claim = deliberation.synthesis?.consensusClaims.find((item) => item.id === parsed.data.claimId);
    if (!claim) return NextResponse.json({ error: 'Synthesis claim not found' }, { status: 404 });

    const proposal = {
      kind: 'node.add' as const,
      confidence: claim.confidence,
      summary: `Review synthesized boardroom claim: ${claim.text.slice(0, 180)}`,
      provenance: {
        extractor: 'agentic-boardroom',
        sourceUrl: `boardroom://${deliberation.caseId}/${deliberation.id}/${claim.id}`,
      },
      payload: {
        node: {
          id: `boardroom-${deliberation.id}-${claim.id}`,
          type: 'Claim',
          label: claim.text.slice(0, 120),
          properties: {
            text: claim.text,
            synthesized: 'true',
            source: 'agentic-boardroom',
            note: parsed.data.note ?? '',
          },
          source: 'ai-chat',
          metadata: {
            confidence: String(claim.confidence),
            source_name: 'Agentic Boardroom',
            source_url: `boardroom://${deliberation.caseId}/${deliberation.id}/${claim.id}`,
            synthesized: true,
            deliberationId: deliberation.id,
            claimId: claim.id,
          },
        },
      },
    };

    if (user.isDemo) {
      return NextResponse.json({
        proposalId: 'demo-boardroom-review-item',
        proposal,
        persistence: { persisted: false, reason: 'demo_mode' },
      }, { status: 201 });
    }

    const proposalId = await createGraphUpdateProposal(user.uid, parsed.data.caseId, proposal);
    if (!proposalId) {
      return NextResponse.json({ error: 'Review queue is unavailable' }, { status: 503 });
    }

    return NextResponse.json({
      proposalId,
      proposal,
      persistence: { persisted: true, collection: 'graph_updates' },
    }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'boardroom/deliberations/synthesis/promote');
  }
});

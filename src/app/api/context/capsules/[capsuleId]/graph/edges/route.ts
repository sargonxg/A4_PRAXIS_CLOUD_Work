import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  applyCapsuleReviewCard,
  proposeCapsuleGraphEdgeChange,
  rejectCapsuleReviewCard,
} from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

const EdgePayloadSchema = z.object({
  id: z.string().min(1).max(160).optional(),
  source: z.string().min(1).max(160).optional(),
  target: z.string().min(1).max(160).optional(),
  label: z.string().min(1).max(160).optional(),
  relationshipType: z.string().min(1).max(80).optional(),
  confidence: z.number().min(0).max(1).optional(),
  sourceReceiptIds: z.array(z.string().min(1).max(240)).max(25).optional(),
  reviewState: z.string().max(80).optional(),
});

const EdgeActionSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.enum(['create', 'edit', 'delete']),
    edgeId: z.string().min(1).max(160).optional(),
    edge: EdgePayloadSchema.optional(),
    sourceReceiptIds: z.array(z.string().min(1).max(240)).max(25).optional(),
    reason: z.string().max(500).optional(),
  }),
  z.object({
    operation: z.literal('approve'),
    reviewCardId: z.string().min(1).max(160),
    confirmationReason: z.string().min(1).max(500).default('Graph proposal reviewed in Capsule Studio.'),
  }),
  z.object({
    operation: z.literal('reject'),
    reviewCardId: z.string().min(1).max(160),
    confirmationReason: z.string().min(1).max(500).default('Graph proposal rejected in Capsule Studio.'),
  }),
]);

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot mutate private capsule graphs' }, { status: 403 });
    const { capsuleId } = await context.params;
    const parsed = EdgeActionSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule graph edge request', details: parsed.error.flatten() }, { status: 400 });
    }
    if (parsed.data.operation === 'approve') {
      const result = await applyCapsuleReviewCard(user.uid, capsuleId, parsed.data.reviewCardId, {
        reviewerUid: user.uid,
        diffHash: graphDiffHash(capsuleId, parsed.data.reviewCardId, parsed.data.confirmationReason),
        confirmationReason: parsed.data.confirmationReason,
      });
      if (!result) return NextResponse.json({ error: 'Review card not found' }, { status: 404 });
      return NextResponse.json(result);
    }
    if (parsed.data.operation === 'reject') {
      const result = await rejectCapsuleReviewCard(user.uid, capsuleId, parsed.data.reviewCardId, {
        reviewerUid: user.uid,
        confirmationReason: parsed.data.confirmationReason,
      });
      if (!result) return NextResponse.json({ error: 'Review card not found' }, { status: 404 });
      return NextResponse.json(result);
    }
    if (!parsed.data.edge && !parsed.data.edgeId) {
      return NextResponse.json({ error: 'edge or edgeId is required' }, { status: 400 });
    }
    const proposal = await proposeCapsuleGraphEdgeChange(user.uid, capsuleId, parsed.data);
    const card = proposal && typeof proposal === 'object' && 'card' in proposal
      ? proposal.card
      : proposal;
    return NextResponse.json({ card }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/graph/edges');
  }
});

function graphDiffHash(capsuleId: string, reviewCardId: string, reason: string): string {
  const digest = createHash('sha256')
    .update(['capsule-graph-review', capsuleId, reviewCardId, reason].join(':'))
    .digest('hex')
    .slice(0, 16);
  return `diff:graph:${digest}`;
}

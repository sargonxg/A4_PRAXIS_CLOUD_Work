import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  applyCapsuleReviewCard,
  proposeCapsuleGraphNodeChange,
} from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

const NodePayloadSchema = z.object({
  id: z.string().min(1).max(160).optional(),
  label: z.string().min(1).max(240).optional(),
  entityType: z.string().min(1).max(80).optional(),
  provenance: z.string().max(500).optional(),
  confidence: z.number().min(0).max(1).optional(),
  sourceReceiptIds: z.array(z.string().min(1).max(240)).max(25).optional(),
  reviewState: z.string().max(80).optional(),
});

const NodeActionSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.enum(['create', 'edit', 'delete']),
    nodeId: z.string().min(1).max(160).optional(),
    node: NodePayloadSchema.optional(),
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
    const parsed = NodeActionSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule graph node request', details: parsed.error.flatten() }, { status: 400 });
    }
    if (parsed.data.operation === 'approve') {
      const result = await applyCapsuleReviewCard(user.uid, capsuleId, parsed.data.reviewCardId, {
        reviewerUid: user.uid,
        confirmationReason: parsed.data.confirmationReason,
      });
      if (!result) return NextResponse.json({ error: 'Review card not found' }, { status: 404 });
      return NextResponse.json(result);
    }
    if (parsed.data.operation === 'reject') {
      return NextResponse.json({ error: 'Reject keeps the proposal un-applied; review-card rejection is not yet exposed for graph proposals.' }, { status: 501 });
    }
    if (!parsed.data.node && !parsed.data.nodeId) {
      return NextResponse.json({ error: 'node or nodeId is required' }, { status: 400 });
    }
    const proposal = await proposeCapsuleGraphNodeChange(user.uid, capsuleId, parsed.data);
    const card = proposal && typeof proposal === 'object' && 'card' in proposal
      ? proposal.card
      : proposal;
    return NextResponse.json({ card }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/graph/nodes');
  }
});

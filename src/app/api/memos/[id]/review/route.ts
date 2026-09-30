import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { approveMemoBody, MemoReviewConflictError } from '@/lib/firebase/memo-service';

const ReviewSchema = z.object({
  versionId: z.string().min(1).max(240), bodyHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  intendedUse: z.enum(['internal-analysis', 'external-sharing', 'publication']),
  limitations: z.string().trim().max(4000),
  sourcesReviewed: z.literal(true), assumptionsReviewed: z.literal(true), limitationsReviewed: z.literal(true),
}).strict();

export const POST = withAuth<{ params: Promise<{ id: string }> }>(async (request, user, context) => {
  if (user.isDemo) return NextResponse.json({ error: 'Human approval requires a saved private memo.' }, { status: 403 });
  const memoId = (await context.params).id;
  if (!memoId || memoId.length > 180 || /[/\\?#\[\]]/.test(memoId)) return NextResponse.json({ error: 'Invalid memo id' }, { status: 400 });
  const parsed = ReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Review the sources, assumptions and limitations before approving a saved version.' }, { status: 400 });
  try {
    const record = await approveMemoBody(user.uid, memoId, parsed.data);
    return record ? NextResponse.json({ success: true, ...record }) : NextResponse.json({ error: 'Memo not found' }, { status: 404 });
  } catch (error) {
    if (error instanceof MemoReviewConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    return handleRouteError(error, 'memo/review');
  }
});

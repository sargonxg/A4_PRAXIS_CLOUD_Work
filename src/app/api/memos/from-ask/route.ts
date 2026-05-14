import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { createMemoSourceFromAsk } from '@/lib/memo/from-ask';

const FromAskSchema = z.object({
  memoId: z.string().min(1).max(180).optional(),
  situationId: z.string().min(1).max(180).nullable().optional(),
  capsuleId: z.string().min(1).max(180),
  capsuleVersion: z.number().int().min(1),
  sourceReceipts: z.array(z.unknown()).optional(),
  claimChecks: z.array(z.unknown()).optional(),
  graphSnapshotId: z.string().min(1).max(180).nullable().optional(),
  toolInvocations: z.array(z.unknown()).optional(),
  askThreadId: z.string().min(1).max(180).nullable().optional(),
  askTurnId: z.string().min(1).max(180).nullable().optional(),
});

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = FromAskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid memo-source handoff', details: parsed.error.flatten() }, { status: 400 });
    }
    if (user.isDemo) {
      return NextResponse.json({ success: true, memoSource: null, mode: 'demo-local' });
    }
    const memoSource = await createMemoSourceFromAsk(user.uid, parsed.data);
    return NextResponse.json({ success: true, memoId: memoSource.memoId, memoSource }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'memos/from-ask');
  }
});

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { loadMemoById } from '@/lib/firebase/memo-service';

type MemoIdContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

export const GET = withAuth<MemoIdContext>(async (_request, user, context) => {
  try {
    const memoId = cleanMemoId((await context.params).id);
    if (!memoId) return NextResponse.json({ error: 'Invalid memo id' }, { status: 400 });
    if (user.isDemo) {
      return NextResponse.json({
        success: true,
        mode: 'demo-local',
        memo: {
          id: memoId,
          title: 'Demo memo draft',
          status: 'draft',
          caseId: 'default',
          capsuleId: 'default',
          sourceReceiptIds: [],
          unsupportedClaims: [],
        },
        versions: [],
      });
    }

    const record = await loadMemoById(user.uid, memoId);
    if (!record) return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    return NextResponse.json({ success: true, ...record });
  } catch (err) {
    return handleRouteError(err, 'memos/id/get');
  }
});

function cleanMemoId(value: string | undefined): string | null {
  const clean = value?.trim().replace(/[/?#[\]]/g, '_').slice(0, 180);
  return clean || null;
}

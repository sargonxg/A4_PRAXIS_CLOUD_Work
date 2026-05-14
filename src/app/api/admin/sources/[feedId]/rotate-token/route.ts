import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth } from '@/lib/api/with-auth';
import { requireAdmin } from '@/lib/auth/admin-gate';
import { handleRouteError } from '@/lib/api/standard-error';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ feedId: string }> };

export const POST = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    const denied = requireAdmin(user);
    if (denied) return denied;
    const { feedId } = await context.params;
    if (!/^[a-z0-9_-]{2,80}$/i.test(feedId)) {
      return NextResponse.json({ error: 'Invalid feed id' }, { status: 400 });
    }
    const ref = getAdminDbOrThrow().collection('config').doc('sources').collection('feeds').doc(feedId);
    await ref.set({
      tokenStatus: 'rotation_requested',
      tokenVersion: FieldValue.increment(1),
      rotatedAt: new Date().toISOString(),
      rotatedBy: user.uid,
    }, { merge: true });
    return NextResponse.json({ ok: true, feedId, tokenStatus: 'rotation_requested' });
  } catch (err) {
    return handleRouteError(err, 'admin/sources/rotate-token');
  }
});

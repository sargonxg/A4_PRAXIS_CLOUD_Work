import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { getCapsule } from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ versions: [] });
    const { capsuleId } = await context.params;
    const limit = Math.max(1, Math.min(Number(new URL(request.url).searchParams.get('limit') ?? 10), 25));
    const current = await getCapsule(user.uid, capsuleId);
    if (!current) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    const snap = await getAdminDbOrThrow()
      .collection('users')
      .doc(user.uid)
      .collection('capsules')
      .doc(capsuleId)
      .collection('versions')
      .orderBy('version', 'desc')
      .limit(limit)
      .get();
    const versions = snap.docs.map((doc) => doc.data());
    if (!versions.some((item) => item.version === current.version)) versions.unshift(current);
    return NextResponse.json({ versions: versions.slice(0, limit) });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/history');
  }
});

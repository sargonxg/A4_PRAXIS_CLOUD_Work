import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getCapsule } from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    const capsule = await getCapsule(user.uid, capsuleId);
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    return NextResponse.json({
      capsuleId: capsule.capsuleId,
      usage: capsule.usage ?? null,
      readiness: capsule.readiness ?? null,
    });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/usage');
  }
});

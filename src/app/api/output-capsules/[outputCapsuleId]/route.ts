import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getOutputCapsule } from '@/lib/output-capsules/storage';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ outputCapsuleId: string }> };

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    const { outputCapsuleId } = await context.params;
    if (user.isDemo) return NextResponse.json({ error: 'OutputCapsule not found' }, { status: 404 });
    const outputCapsule = await getOutputCapsule(user.uid, outputCapsuleId);
    if (!outputCapsule) return NextResponse.json({ error: 'OutputCapsule not found' }, { status: 404 });
    return NextResponse.json({ outputCapsule });
  } catch (err) {
    return handleRouteError(err, 'output-capsules/get');
  }
});

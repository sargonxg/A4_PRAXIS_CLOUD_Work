import { NextResponse } from 'next/server';

import { withAuth, type AuthenticatedUser } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { publishCapsule } from '@/lib/capsules/storage';

export const dynamic = 'force-dynamic';

type CapsuleActionContext = {
  params: Promise<{ capsuleId: string }> | { capsuleId: string };
};

export const POST = withAuth(async (_request: Request, user: AuthenticatedUser, context: CapsuleActionContext) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot publish capsules' }, { status: 403 });
    const { capsuleId } = await context.params;
    const capsule = await publishCapsule(user.uid, capsuleId);
    return NextResponse.json({ capsule });
  } catch (err) {
    return handleRouteError(err, 'capsules/publish');
  }
});

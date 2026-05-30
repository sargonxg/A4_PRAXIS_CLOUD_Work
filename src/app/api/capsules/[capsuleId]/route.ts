import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withAuth, type AuthenticatedUser } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getCapsule, updateDraftCapsule } from '@/lib/capsules/storage';

export const dynamic = 'force-dynamic';

const CapsulePatchSchema = z.object({
  capsule: z.record(z.string(), z.unknown()),
});

type CapsuleRouteContext = {
  params: Promise<{ capsuleId: string }> | { capsuleId: string };
};

async function capsuleIdOf(context: CapsuleRouteContext): Promise<string> {
  const params = await context.params;
  return params.capsuleId;
}

export const GET = withAuth(async (_request: Request, user: AuthenticatedUser, context: CapsuleRouteContext) => {
  try {
    if (user.isDemo) return NextResponse.json({ capsule: null, persisted: false }, { status: 404 });
    const capsule = await getCapsule(user.uid, await capsuleIdOf(context));
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    return NextResponse.json({ capsule });
  } catch (err) {
    return handleRouteError(err, 'capsules/get');
  }
});

export const PATCH = withAuth(async (request: Request, user: AuthenticatedUser, context: CapsuleRouteContext) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot update capsules' }, { status: 403 });
    const parsed = CapsulePatchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule patch', details: parsed.error.flatten() }, { status: 400 });
    }
    const capsule = await updateDraftCapsule(user.uid, await capsuleIdOf(context), parsed.data);
    return NextResponse.json({ capsule });
  } catch (err) {
    return handleRouteError(err, 'capsules/update-draft');
  }
});

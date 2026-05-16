import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { attachCapsuleRefs, detachCapsuleRefs } from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

const AttachSchema = z.object({
  action: z.enum(['attach', 'detach']).default('attach'),
  sourceIds: z.array(z.string().min(1).max(240)).optional(),
  documentIds: z.array(z.string().min(1).max(240)).optional(),
}).refine((value) => (value.sourceIds?.length ?? 0) > 0 || (value.documentIds?.length ?? 0) > 0, {
  message: 'sourceIds or documentIds are required',
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot mutate private capsules' }, { status: 403 });
    const { capsuleId } = await context.params;
    const parsed = AttachSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule attach request', details: parsed.error.flatten() }, { status: 400 });
    }
    const capsule = parsed.data.action === 'detach'
      ? await detachCapsuleRefs(user.uid, capsuleId, parsed.data)
      : await attachCapsuleRefs(user.uid, capsuleId, parsed.data);
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    return NextResponse.json({
      capsule,
      [parsed.data.action === 'detach' ? 'detached' : 'attached']: {
        sourceIds: parsed.data.sourceIds ?? [],
        documentIds: parsed.data.documentIds ?? [],
      },
    });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/attach');
  }
});

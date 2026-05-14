import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { bumpCapsuleVersion, getCapsule, type CapsuleCoreRefs } from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

const SwapSchema = z.object({
  slotKind: z.enum(['user', 'situation', 'path', 'source', 'graph', 'time', 'output', 'tool', 'objective', 'product', 'memory']),
  coreId: z.string().min(1).max(240).nullable(),
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Demo mode cannot mutate private capsules' }, { status: 403 });
    const { capsuleId } = await context.params;
    const parsed = SwapSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule swap', details: parsed.error.flatten() }, { status: 400 });
    }
    const current = await getCapsule(user.uid, capsuleId);
    if (!current) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    if (current.lockedCoreKinds.includes(parsed.data.slotKind)) {
      return NextResponse.json({ error: 'Core slot is locked', slotKind: parsed.data.slotKind }, { status: 409 });
    }
    const capsule = await bumpCapsuleVersion(user.uid, capsuleId, {
      coreRefs: patchForSwap(parsed.data.slotKind, parsed.data.coreId),
    });
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    return NextResponse.json({ capsule, slotKind: parsed.data.slotKind, coreId: parsed.data.coreId });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/swap');
  }
});

function patchForSwap(slotKind: z.infer<typeof SwapSchema>['slotKind'], coreId: string | null): Partial<CapsuleCoreRefs> {
  const single = coreId ?? null;
  const many = coreId ? [coreId] : [];
  switch (slotKind) {
    case 'user':
      return { userCoreId: single };
    case 'situation':
      return { situationCoreId: single };
    case 'path':
      return { pathCoreId: single };
    case 'source':
      return { sourceCoreIds: many };
    case 'graph':
      return { graphCoreId: single };
    case 'time':
      return { timeCoreId: single };
    case 'output':
      return { outputCoreIds: many };
    case 'tool':
      return { toolCoreIds: many };
    case 'objective':
      return { objectiveCoreIds: many };
    case 'product':
      return { productCoreIds: many };
    case 'memory':
      return { memoryCoreId: single };
  }
}

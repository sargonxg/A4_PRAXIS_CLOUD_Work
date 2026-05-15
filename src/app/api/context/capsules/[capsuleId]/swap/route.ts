import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  MULTI_CORE_SWAP_KINDS,
  getCapsule,
  swapCapsuleCore,
} from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

// Contract audit: swapCapsuleCore persists toolCoreIds, objectiveCoreIds,
// productCoreIds, and memoryCoreId through the shared capsule service.
const SwapSchema = z.object({
  slotKind: z.enum(['user', 'situation', 'path', 'source', 'document', 'graph', 'time', 'output', 'tool', 'objective', 'product', 'memory']),
  coreId: z.string().min(1).max(240).nullable(),
  mode: z.enum(['replace', 'add', 'remove']).default('replace'),
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
    if (!MULTI_CORE_SWAP_KINDS.has(parsed.data.slotKind) && parsed.data.mode === 'add') {
      return NextResponse.json({ error: 'Single core slots do not support add mode', slotKind: parsed.data.slotKind }, { status: 400 });
    }
    const capsule = await swapCapsuleCore(user.uid, capsuleId, {
      slotKind: parsed.data.slotKind,
      coreId: parsed.data.coreId,
      mode: parsed.data.mode,
    });
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    return NextResponse.json({
      capsule,
      slotKind: parsed.data.slotKind,
      coreId: parsed.data.coreId,
      mode: parsed.data.mode,
    });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/swap');
  }
});

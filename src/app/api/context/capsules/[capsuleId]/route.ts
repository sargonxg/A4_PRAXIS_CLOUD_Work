import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  activateCapsule,
  bumpCapsuleVersion,
  forkCapsule,
  getCapsule,
} from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

const PatchSchema = z.object({
  label: z.string().min(1).max(160).optional(),
  scope: z.enum(['user', 'situation', 'team']).optional(),
  coreRefs: z.object({
    userCoreId: z.string().nullable().optional(),
    teamCoreId: z.string().nullable().optional(),
    situationCoreId: z.string().nullable().optional(),
    sourceCoreIds: z.array(z.string()).optional(),
    documentCoreIds: z.array(z.string()).optional(),
    graphCoreId: z.string().nullable().optional(),
    outputCoreIds: z.array(z.string()).optional(),
  }).optional(),
  retrievalPolicy: z.object({
    layers: z.array(z.enum(['argus', 'sources', 'documents', 'graph', 'tool-output'])).optional(),
    limit: z.number().int().positive().max(50).optional(),
    checkFreshness: z.boolean().optional(),
    freshnessWindowDays: z.number().int().positive().max(3650).optional(),
  }).optional(),
  activeForSituationIds: z.array(z.string()).optional(),
});

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('activate'), situationId: z.string().min(1).optional() }),
  z.object({
    action: z.literal('fork'),
    forkCapsuleId: z.string().min(1).max(120).optional(),
    label: z.string().min(1).max(160).optional(),
    scope: z.enum(['user', 'situation', 'team']).optional(),
  }),
]);

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    const capsule = await getCapsule(user.uid, capsuleId);
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    return NextResponse.json({ capsule });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/get');
  }
});

export const PATCH = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) {
      return NextResponse.json({ error: 'Demo mode cannot update private capsules' }, { status: 403 });
    }
    const parsed = PatchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule update', details: parsed.error.flatten() }, { status: 400 });
    }
    const capsule = await bumpCapsuleVersion(user.uid, capsuleId, parsed.data);
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    return NextResponse.json({ capsule });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/update');
  }
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) {
      return NextResponse.json({ error: 'Demo mode cannot mutate private capsules' }, { status: 403 });
    }
    const parsed = ActionSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule action', details: parsed.error.flatten() }, { status: 400 });
    }
    if (parsed.data.action === 'activate') {
      const capsule = await activateCapsule(user.uid, capsuleId, { situationId: parsed.data.situationId });
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ capsule });
    }

    const capsule = await forkCapsule(user.uid, capsuleId, {
      capsuleId: parsed.data.forkCapsuleId,
      label: parsed.data.label,
      scope: parsed.data.scope,
    });
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    return NextResponse.json({ capsule }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/action');
  }
});

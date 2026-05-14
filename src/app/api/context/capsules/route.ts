import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  activateCapsule,
  createCapsule,
  forkCapsule,
  listCapsules,
} from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

const CoreRefsSchema = z.object({
  userCoreId: z.string().nullable().optional(),
  teamCoreId: z.string().nullable().optional(),
  situationCoreId: z.string().nullable().optional(),
  sourceCoreIds: z.array(z.string()).optional(),
  documentCoreIds: z.array(z.string()).optional(),
  graphCoreId: z.string().nullable().optional(),
  outputCoreIds: z.array(z.string()).optional(),
}).optional();

const RetrievalPolicySchema = z.object({
  layers: z.array(z.enum(['argus', 'sources', 'documents', 'graph', 'tool-output'])).optional(),
  limit: z.number().int().positive().max(50).optional(),
  checkFreshness: z.boolean().optional(),
  freshnessWindowDays: z.number().int().positive().max(3650).optional(),
}).optional();

const CreateSchema = z.object({
  action: z.literal('create').optional(),
  capsuleId: z.string().min(1).max(120).optional(),
  label: z.string().min(1).max(160).optional(),
  scope: z.enum(['user', 'situation', 'team']).optional(),
  coreRefs: CoreRefsSchema,
  retrievalPolicy: RetrievalPolicySchema,
  activeForSituationIds: z.array(z.string()).optional(),
});

const ForkSchema = z.object({
  action: z.literal('fork'),
  capsuleId: z.string().min(1),
  forkCapsuleId: z.string().min(1).max(120).optional(),
  label: z.string().min(1).max(160).optional(),
  scope: z.enum(['user', 'situation', 'team']).optional(),
});

const ActivateSchema = z.object({
  action: z.literal('activate'),
  capsuleId: z.string().min(1),
  situationId: z.string().min(1).optional(),
});

export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ capsules: [], persisted: false });
    const url = new URL(request.url);
    const capsules = await listCapsules(user.uid, {
      situationId: url.searchParams.get('situationId') ?? undefined,
    });
    return NextResponse.json({ capsules, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/list');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Demo mode cannot create private capsules' }, { status: 403 });
    }
    const raw = await request.json().catch(() => ({}));

    const activateParsed = ActivateSchema.safeParse(raw);
    if (activateParsed.success) {
      const capsule = await activateCapsule(user.uid, activateParsed.data.capsuleId, {
        situationId: activateParsed.data.situationId,
      });
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ capsule });
    }

    const forkParsed = ForkSchema.safeParse(raw);
    if (forkParsed.success) {
      const capsule = await forkCapsule(user.uid, forkParsed.data.capsuleId, {
        capsuleId: forkParsed.data.forkCapsuleId,
        label: forkParsed.data.label,
        scope: forkParsed.data.scope,
      });
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ capsule }, { status: 201 });
    }

    const parsed = CreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule request', details: parsed.error.flatten() }, { status: 400 });
    }
    const capsule = await createCapsule(user.uid, {
      capsuleId: parsed.data.capsuleId,
      label: parsed.data.label,
      scope: parsed.data.scope,
      coreRefs: parsed.data.coreRefs,
      retrievalPolicy: parsed.data.retrievalPolicy,
      activeForSituationIds: parsed.data.activeForSituationIds,
      provenance: { source: 'api', createdBy: user.uid },
    });
    return NextResponse.json({ capsule }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/create');
  }
});

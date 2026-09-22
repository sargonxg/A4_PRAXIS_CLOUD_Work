import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  activateCapsule,
  combineCapsules,
  createCapsule,
  createCapsuleFromCorePackage,
  createEmptyCapsuleInventorySummary,
  forkCapsule,
  listCapsuleInventory,
  seedStarterCapsules,
} from '@/lib/context/capsule-service';
import { parseCorePackage } from '@/lib/context/core-package';
import { CAPSULE_STARTER_DEFINITIONS } from '@/lib/product/context-capsules';

export const dynamic = 'force-dynamic';

const CoreRefsSchema = z.object({
  userCoreId: z.string().nullable().optional(),
  teamCoreId: z.string().nullable().optional(),
  situationCoreId: z.string().nullable().optional(),
  sourceCoreIds: z.array(z.string()).optional(),
  documentCoreIds: z.array(z.string()).optional(),
  graphCoreId: z.string().nullable().optional(),
  timeCoreId: z.string().nullable().optional(),
  outputCoreIds: z.array(z.string()).optional(),
  toolCoreIds: z.array(z.string()).optional(),
  objectiveCoreIds: z.array(z.string()).optional(),
  productCoreIds: z.array(z.string()).optional(),
  memoryCoreId: z.string().nullable().optional(),
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
  associatedCapsuleIds: z.array(z.string().min(1).max(120)).max(20).optional(),
  coreRefs: CoreRefsSchema,
  retrievalPolicy: RetrievalPolicySchema,
  community: z.object({
    favorite: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    listedInMarketplace: z.boolean().optional(),
  }).optional(),
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

const ImportCoreSchema = z.object({
  action: z.literal('import-core'),
  corePackage: z.unknown(),
  capsuleId: z.string().min(1).max(120).optional(),
  label: z.string().min(1).max(160).optional(),
  scope: z.enum(['user', 'situation', 'team']).optional(),
});

const CombineSchema = z.object({
  action: z.literal('combine'),
  capsuleIds: z.array(z.string().min(1)).min(2).max(10),
  combinedCapsuleId: z.string().min(1).max(120).optional(),
  label: z.string().min(1).max(160).optional(),
  scope: z.enum(['user', 'situation', 'team']).optional(),
  activateForSituationIds: z.array(z.string().min(1)).optional(),
});

const SeedStartersSchema = z.object({
  action: z.literal('seed-starters'),
  starterId: z.string().min(1).max(120).optional(),
});

export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({
        capsules: [],
        summary: createEmptyCapsuleInventorySummary(),
        persisted: false,
      });
    }
    const url = new URL(request.url);
    const inventory = await listCapsuleInventory(user.uid, {
      situationId: url.searchParams.get('situationId') ?? undefined,
      includeArchived: url.searchParams.get('includeArchived') === 'true',
    });
    return NextResponse.json({ ...inventory, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/list');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot create private capsules' }, { status: 403 });
    }
    const raw = await request.json().catch(() => ({}));

    if (raw?.action === 'seed-starters') {
      const seedParsed = SeedStartersSchema.safeParse(raw);
      if (!seedParsed.success || (seedParsed.data.starterId && !CAPSULE_STARTER_DEFINITIONS.some((starter) => starter.starterId === seedParsed.data.starterId))) {
        return NextResponse.json({ error: 'Invalid starter selection' }, { status: 400 });
      }
      const result = await seedStarterCapsules(user.uid, undefined, { starterId: seedParsed.data.starterId });
      return NextResponse.json(result, { status: result.created > 0 ? 201 : 200 });
    }

    const importParsed = ImportCoreSchema.safeParse(raw);
    if (importParsed.success) {
      const corePackage = parseCorePackage(importParsed.data.corePackage);
      if (!corePackage) return NextResponse.json({ error: 'Invalid .core package' }, { status: 400 });
      const capsule = await createCapsuleFromCorePackage(user.uid, corePackage, {
        capsuleId: importParsed.data.capsuleId,
        label: importParsed.data.label,
        scope: importParsed.data.scope,
      });
      return NextResponse.json({ capsule, imported: true }, { status: 201 });
    }

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

    const combineParsed = CombineSchema.safeParse(raw);
    if (combineParsed.success) {
      const result = await combineCapsules(user.uid, {
        capsuleIds: combineParsed.data.capsuleIds,
        capsuleId: combineParsed.data.combinedCapsuleId,
        label: combineParsed.data.label,
        scope: combineParsed.data.scope,
        activateForSituationIds: combineParsed.data.activateForSituationIds,
      });
      if (!result) return NextResponse.json({ error: 'Capsules not found or not enough capsules to combine' }, { status: 404 });
      return NextResponse.json(result, { status: 201 });
    }

    const parsed = CreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule request', details: parsed.error.flatten() }, { status: 400 });
    }
    const capsule = await createCapsule(user.uid, {
      capsuleId: parsed.data.capsuleId,
      label: parsed.data.label,
      scope: parsed.data.scope,
      associatedCapsuleIds: parsed.data.associatedCapsuleIds,
      coreRefs: parsed.data.coreRefs,
      retrievalPolicy: parsed.data.retrievalPolicy,
      community: parsed.data.community,
      activeForSituationIds: parsed.data.activeForSituationIds,
      provenance: { source: 'api', createdBy: user.uid },
    });
    return NextResponse.json({ capsule }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/create');
  }
});

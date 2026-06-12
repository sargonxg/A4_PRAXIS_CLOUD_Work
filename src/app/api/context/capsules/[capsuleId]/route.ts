import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import {
  activateCapsule,
  approveAdvisoryMemoryCandidate,
  archiveCapsule,
  bumpCapsuleVersion,
  deleteCapsule,
  exportCapsuleCorePackage,
  forkCapsule,
  getCapsule,
  promoteCapsuleSourceGaps,
  proposeCogneeSeedReviewCards,
  rateCapsule,
  rejectAdvisoryMemoryCandidate,
  renameCapsule,
  setCapsuleAccessPolicy,
  setCapsuleCoreLock,
  setCapsuleFavorite,
} from '@/lib/context/capsule-service';
import {
  buildCapsulePlusExportBundle,
  buildCapsulePlusManifest,
  buildPraxisCapsuleFilename,
  type CapsulePlusBundle,
} from '@/lib/capsule-plus';
import { listCapsulePlusGraphRows } from '@/lib/capsule-plus/postgres';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

const PatchSchema = z.object({
  label: z.string().min(1).max(160).optional(),
  scope: z.enum(['user', 'situation', 'team']).optional(),
  associatedCapsuleIds: z.array(z.string().min(1).max(120)).max(20).optional(),
  coreRefs: z.object({
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
  }).optional(),
  retrievalPolicy: z.object({
    layers: z.array(z.enum(['argus', 'sources', 'documents', 'graph', 'tool-output'])).optional(),
    limit: z.number().int().positive().max(50).optional(),
    checkFreshness: z.boolean().optional(),
    freshnessWindowDays: z.number().int().positive().max(3650).optional(),
  }).optional(),
  activeForSituationIds: z.array(z.string()).optional(),
  access: z.object({
    visibility: z.enum(['private', 'organization', 'shared', 'public', 'unlisted']).optional(),
    sharedWithUserIds: z.array(z.string()).optional(),
    sharedWithOrgIds: z.array(z.string()).optional(),
    allowClone: z.boolean().optional(),
    allowDownload: z.boolean().optional(),
    allowCommunityRating: z.boolean().optional(),
  }).optional(),
  community: z.object({
    favorite: z.boolean().optional(),
    userRating: z.number().min(1).max(5).nullable().optional(),
    tags: z.array(z.string()).optional(),
    listedInMarketplace: z.boolean().optional(),
  }).optional(),
});

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('activate'), situationId: z.string().min(1).optional() }),
  z.object({
    action: z.enum(['lock', 'unlock']),
    coreKind: z.enum(['user', 'situation', 'path', 'source', 'document', 'graph', 'time', 'output', 'tool', 'objective', 'product', 'memory']),
  }),
  z.object({
    action: z.literal('fork'),
    forkCapsuleId: z.string().min(1).max(120).optional(),
    label: z.string().min(1).max(160).optional(),
    scope: z.enum(['user', 'situation', 'team']).optional(),
  }),
  z.object({ action: z.literal('rename'), label: z.string().min(1).max(160) }),
  z.object({ action: z.literal('archive') }),
  z.object({ action: z.literal('delete') }),
  z.object({
    action: z.literal('set-visibility'),
    visibility: z.enum(['private', 'organization', 'shared', 'public', 'unlisted']),
    allowClone: z.boolean().optional(),
    allowDownload: z.boolean().optional(),
    allowCommunityRating: z.boolean().optional(),
  }),
  z.object({ action: z.literal('favorite'), favorite: z.boolean() }),
  z.object({ action: z.literal('rate'), rating: z.number().min(1).max(5) }),
  z.object({
    action: z.literal('promote-source-gaps'),
    gaps: z.array(z.string().min(1).max(600)).min(1).max(10).optional(),
    sourceIds: z.array(z.string().min(1).max(120)).max(20).optional(),
    runId: z.string().min(1).max(120).nullable().optional(),
    generatedBy: z.string().min(1).max(80).optional(),
    kind: z.literal('sourcing').optional(),
    title: z.string().min(3).max(120).optional(),
    rationale: z.string().min(8).max(800).optional(),
    suggestedChange: z.string().min(8).max(1000).optional(),
    origin: z.object({
      type: z.literal('ask_gap'),
      threadId: z.string().min(1).max(180),
      turnId: z.string().min(1).max(180),
      gapIndex: z.number().int().nonnegative().optional(),
      gapHash: z.string().min(1).max(80).optional(),
    }).strict().optional(),
  }),
  z.object({ action: z.literal('propose-cognee-seed') }),
  z.object({
    action: z.literal('approve-advisory-memory'),
    candidate: z.object({
      id: z.string().min(1).max(180),
      text: z.string().min(1).max(2000),
      confidence: z.number().min(0).max(1).optional(),
      sourceId: z.string().min(1).max(240).nullable().optional(),
      provenance: z.string().min(1).max(240).nullable().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  }),
  z.object({
    action: z.literal('reject-advisory-memory'),
    candidate: z.object({
      id: z.string().min(1).max(180),
      text: z.string().min(1).max(2000),
      reason: z.string().max(500).nullable().optional(),
    }),
  }),
]);

const ShareSchema = z.object({
  scope: z.enum(['read', 'clone']).default('read'),
  expiresAt: z.string().datetime().optional(),
});

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    const url = new URL(_request.url);
    const requestedFormat = url.searchParams.get('format');
    if (requestedFormat === 'praxis') {
      const capsule = await getCapsule(user.uid, capsuleId);
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      const graph = await listCapsulePlusGraphRows({
        ownerUid: user.uid,
        capsuleId: capsule.capsuleId,
        includeProposed: true,
      });
      const bundle: CapsulePlusBundle = {
        manifest: buildCapsulePlusManifest({
          capsuleId: capsule.capsuleId,
          ownerUid: user.uid,
          graphVersion: graph.nodes.length || graph.edges.length ? capsule.version : 0,
        }),
        capsule: { ...capsule },
        nodes: graph.nodes,
        edges: graph.edges,
        proposals: [],
        sourceReceipts: capsule.coreRefs.sourceCoreIds.map((id) => ({ id, title: id, metadata: { capsuleId: capsule.capsuleId } })),
      };
      const zip = await buildCapsulePlusExportBundle(bundle);
      return new NextResponse(new Uint8Array(zip), {
        headers: {
          'content-type': 'application/vnd.praxis.capsule+zip',
          'content-disposition': `attachment; filename="${buildPraxisCapsuleFilename({
            label: capsule.label,
            capsuleId: capsule.capsuleId,
            scope: capsule.scope,
            tags: capsule.community.tags,
          })}"`,
        },
      });
    }
    if (requestedFormat === 'core') {
      const exported = await exportCapsuleCorePackage(user.uid, capsuleId);
      if (!exported) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return new NextResponse(JSON.stringify(exported.package, null, 2), {
        headers: {
          'content-type': exported.mimeType,
          'content-disposition': `attachment; filename="${exported.filename}"`,
        },
      });
    }
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
      return NextResponse.json({ error: 'Sample mode cannot update private capsules' }, { status: 403 });
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
      return NextResponse.json({ error: 'Sample mode cannot mutate private capsules' }, { status: 403 });
    }
    const url = new URL(request.url);
    const queryAction = url.searchParams.get('action');
    const raw = await request.json().catch(() => ({}));

    if (queryAction === 'fork') {
      const parsedFork = z.object({
        forkCapsuleId: z.string().min(1).max(120).optional(),
        label: z.string().min(1).max(160).optional(),
        scope: z.enum(['user', 'situation', 'team']).optional(),
      }).safeParse(raw);
      if (!parsedFork.success) {
        return NextResponse.json({ error: 'Invalid capsule fork', details: parsedFork.error.flatten() }, { status: 400 });
      }
      const capsule = await forkCapsule(user.uid, capsuleId, {
        capsuleId: parsedFork.data.forkCapsuleId,
        label: parsedFork.data.label,
        scope: parsedFork.data.scope,
      });
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ capsule }, { status: 201 });
    }

    if (queryAction === 'share') {
      const parsedShare = ShareSchema.safeParse(raw);
      if (!parsedShare.success) {
        return NextResponse.json({ error: 'Invalid capsule share', details: parsedShare.error.flatten() }, { status: 400 });
      }
      const capsule = await getCapsule(user.uid, capsuleId);
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      const token = randomBytes(18).toString('base64url');
      const expiresAt = parsedShare.data.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await getAdminDbOrThrow()
        .collection('users')
        .doc(user.uid)
        .collection('capsule_shares')
        .doc(token)
        .set({
          token,
          capsuleId: capsule.capsuleId,
          ownerUid: user.uid,
          scope: parsedShare.data.scope,
          expiresAt,
          createdAt: new Date().toISOString(),
        });
      return NextResponse.json({ token, capsuleId: capsule.capsuleId, scope: parsedShare.data.scope, expiresAt }, { status: 201 });
    }

    const parsed = ActionSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule action', details: parsed.error.flatten() }, { status: 400 });
    }
    if (parsed.data.action === 'activate') {
      const capsule = await activateCapsule(user.uid, capsuleId, { situationId: parsed.data.situationId });
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ capsule });
    }
    if (parsed.data.action === 'lock' || parsed.data.action === 'unlock') {
      const capsule = await setCapsuleCoreLock(user.uid, capsuleId, {
        kind: parsed.data.coreKind,
        locked: parsed.data.action === 'lock',
      });
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ capsule });
    }

    if (parsed.data.action === 'rename') {
      const capsule = await renameCapsule(user.uid, capsuleId, parsed.data.label);
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ capsule });
    }
    if (parsed.data.action === 'archive') {
      const capsule = await archiveCapsule(user.uid, capsuleId);
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ archived: true, capsule });
    }
    if (parsed.data.action === 'delete') {
      const capsule = await archiveCapsule(user.uid, capsuleId);
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ archived: true, capsule });
    }
    if (parsed.data.action === 'set-visibility') {
      const capsule = await setCapsuleAccessPolicy(user.uid, capsuleId, {
        visibility: parsed.data.visibility,
        allowClone: parsed.data.allowClone,
        allowDownload: parsed.data.allowDownload,
        allowCommunityRating: parsed.data.allowCommunityRating,
      });
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ capsule });
    }
    if (parsed.data.action === 'favorite') {
      const capsule = await setCapsuleFavorite(user.uid, capsuleId, parsed.data.favorite);
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ capsule });
    }
    if (parsed.data.action === 'rate') {
      const capsule = await rateCapsule(user.uid, capsuleId, parsed.data.rating);
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ capsule });
    }
    if (parsed.data.action === 'promote-source-gaps') {
      if (parsed.data.kind === 'sourcing' && (!parsed.data.title || !parsed.data.rationale || !parsed.data.suggestedChange || !parsed.data.origin)) {
        return NextResponse.json({ error: 'Invalid Ask gap promotion request' }, { status: 400 });
      }
      if (parsed.data.kind !== 'sourcing' && !parsed.data.gaps?.length) {
        return NextResponse.json({ error: 'At least one source gap is required' }, { status: 400 });
      }
      let result;
      try {
        result = await promoteCapsuleSourceGaps(user.uid, capsuleId, parsed.data.kind === 'sourcing'
          ? {
              kind: 'sourcing',
              title: parsed.data.title ?? '',
              rationale: parsed.data.rationale ?? '',
              suggestedChange: parsed.data.suggestedChange ?? '',
              origin: parsed.data.origin ?? { type: 'ask_gap', threadId: '', turnId: '' },
              source: 'ask-gap-promotion',
            }
          : {
              gaps: parsed.data.gaps ?? [],
              sourceIds: parsed.data.sourceIds,
              runId: parsed.data.runId,
              generatedBy: parsed.data.generatedBy,
            });
      } catch (err) {
        if (isCapsuleReadOnlyError(err)) {
          return NextResponse.json({ error: err instanceof Error ? err.message : 'Capsule is read-only' }, { status: 409 });
        }
        throw err;
      }
      if (!result) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json(result, { status: 201 });
    }
    if (parsed.data.action === 'propose-cognee-seed') {
      const result = await proposeCogneeSeedReviewCards(user.uid, capsuleId);
      if (!result) return NextResponse.json({ error: 'Capsule starter seed pack not found' }, { status: 404 });
      return NextResponse.json(result, { status: 201 });
    }
    if (parsed.data.action === 'approve-advisory-memory') {
      const result = await approveAdvisoryMemoryCandidate(user.uid, capsuleId, parsed.data.candidate);
      if (!result) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json(result, { status: 201 });
    }
    if (parsed.data.action === 'reject-advisory-memory') {
      const result = await rejectAdvisoryMemoryCandidate(user.uid, capsuleId, parsed.data.candidate);
      if (!result) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json(result, { status: 201 });
    }
    if (parsed.data.action !== 'fork') {
      return NextResponse.json({ error: 'Invalid capsule action' }, { status: 400 });
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

export const DELETE = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot mutate private capsules' }, { status: 403 });
    }
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') === 'delete' ? 'delete' : 'archive';
    if (mode === 'delete') {
      const result = await deleteCapsule(user.uid, capsuleId);
      if (!result.deleted) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      return NextResponse.json({ deleted: true });
    }
    const capsule = await archiveCapsule(user.uid, capsuleId);
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    return NextResponse.json({ archived: true, capsule });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/archive');
  }
});

function isCapsuleReadOnlyError(err: unknown): boolean {
  return err instanceof Error && err.name === 'CapsuleReadOnlyError';
}

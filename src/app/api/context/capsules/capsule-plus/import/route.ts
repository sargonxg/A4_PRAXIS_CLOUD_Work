import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { createCapsule, type CapsuleCoreRefs } from '@/lib/context/capsule-service';
import { parseCapsulePlusImportBundle } from '@/lib/capsule-plus';
import { upsertApprovedCapsulePlusGraphRows } from '@/lib/capsule-plus/postgres';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  capsuleId: z.string().min(1).max(120).optional(),
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot import private Capsule+ bundles' }, { status: 403 });
    }
    const query = QuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    const buffer = Buffer.from(await request.arrayBuffer());
    const bundle = await parseCapsulePlusImportBundle(buffer, { ownerUid: user.uid });
    const importedCapsuleId = query.capsuleId ?? `${bundle.manifest.capsuleId}-import`;
    const capsule = await createCapsule(user.uid, {
      capsuleId: importedCapsuleId,
      label: typeof bundle.capsule.label === 'string' ? bundle.capsule.label : 'Imported Capsule+',
      scope: bundle.capsule.scope === 'team' || bundle.capsule.scope === 'situation' || bundle.capsule.scope === 'user'
        ? bundle.capsule.scope
        : 'user',
      coreRefs: isRecord(bundle.capsule.coreRefs) ? bundle.capsule.coreRefs as Partial<CapsuleCoreRefs> : undefined,
      community: {
        tags: ['capsule-plus', 'postgres-embedded-graph'],
      },
      provenance: {
        source: 'fork',
        createdBy: user.uid,
        parentCapsuleId: bundle.manifest.capsuleId,
        forkedFromVersion: typeof bundle.capsule.version === 'number' ? bundle.capsule.version : null,
        notes: `Imported from Capsule+ bundle ${bundle.manifest.capsuleId}.`,
      },
    });
    const scopedNodes = bundle.nodes.map((node) => ({ ...node, ownerUid: user.uid, capsuleId: capsule.capsuleId }));
    const scopedEdges = bundle.edges.map((edge) => ({ ...edge, ownerUid: user.uid, capsuleId: capsule.capsuleId }));
    const writeResult = await upsertApprovedCapsulePlusGraphRows({
      ownerUid: user.uid,
      capsuleId: capsule.capsuleId,
      nodes: scopedNodes,
      edges: scopedEdges,
    });
    return NextResponse.json({
      capsule,
      imported: true,
      graph: writeResult,
      proposedRowsRetainedForReview: scopedNodes.filter((row) => row.reviewState !== 'approved').length
        + scopedEdges.filter((row) => row.reviewState !== 'approved').length,
    }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/capsule-plus/import');
  }
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

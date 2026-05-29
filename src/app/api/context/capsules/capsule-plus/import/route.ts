import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { createCapsule, createCapsuleReviewCard, type CapsuleCoreRefs } from '@/lib/context/capsule-service';
import { parseCapsulePlusImportBundle } from '@/lib/capsule-plus';

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
    const scopedNodes = bundle.nodes.map((node) => ({ ...node, ownerUid: user.uid, capsuleId: capsule.capsuleId, reviewState: 'proposed' as const }));
    const scopedEdges = bundle.edges.map((edge) => ({ ...edge, ownerUid: user.uid, capsuleId: capsule.capsuleId, reviewState: 'proposed' as const }));
    const reviewCards = [];
    if (scopedNodes.length || scopedEdges.length || bundle.proposals.length) {
      reviewCards.push(await createCapsuleReviewCard(user.uid, capsule.capsuleId, {
        title: `Review Capsule+ graph proposal from ${bundle.manifest.capsuleId}`,
        sourceType: 'graph',
        target: 'graphProposal',
        evidence: [
          ...scopedNodes.slice(0, 10).map((node) => ({ id: node.id, label: node.label, advisory: true, sourceType: 'capsule-plus' })),
          ...scopedEdges.slice(0, 10).map((edge) => ({ id: edge.id, label: edge.label ?? edge.type, advisory: true, sourceType: 'capsule-plus' })),
        ],
      }));
    }
    return NextResponse.json({
      capsule,
      imported: true,
      graph: {
        canonicalWrites: 0,
        proposedNodes: scopedNodes.length,
        proposedEdges: scopedEdges.length,
      },
      reviewCards,
      proposedRowsRetainedForReview: scopedNodes.length + scopedEdges.length,
    }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/capsule-plus/import');
  }
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

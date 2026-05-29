import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getCapsule } from '@/lib/context/capsule-service';
import {
  buildCapsulePlusExportBundle,
  buildPraxisCapsuleFilename,
  materializeCapsulePlusBundle,
} from '@/lib/capsule-plus';
import { listCapsulePlusGraphRows } from '@/lib/capsule-plus/postgres';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot export private Capsule+ bundles' }, { status: 403 });
    }
    const { capsuleId } = await context.params;
    const capsule = await getCapsule(user.uid, capsuleId);
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });

    const graph = await listCapsulePlusGraphRows({
      ownerUid: user.uid,
      capsuleId: capsule.capsuleId,
      includeProposed: true,
    });
    const bundle = materializeCapsulePlusBundle(capsule.v3 ?? capsule);
    bundle.nodes = [...bundle.nodes, ...graph.nodes];
    bundle.edges = [...bundle.edges, ...graph.edges];
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
  } catch (err) {
    return handleRouteError(err, 'context/capsules/capsule-plus/export');
  }
});

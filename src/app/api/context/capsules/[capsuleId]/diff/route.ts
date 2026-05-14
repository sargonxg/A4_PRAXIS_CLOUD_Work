import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { getCapsule, type PraxisCapsule } from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ addedCoreRefs: [], removedCoreRefs: [], changedRetrievalPolicy: false, healthDelta: 0 });
    }
    const { capsuleId } = await context.params;
    const url = new URL(request.url);
    const fromVersion = parseVersion(url.searchParams.get('from'));
    const toVersion = parseVersion(url.searchParams.get('to'));
    if (!fromVersion || !toVersion) {
      return NextResponse.json({ error: 'from and to must look like v3 or 3' }, { status: 400 });
    }

    const [from, to] = await Promise.all([
      loadCapsuleVersion(user.uid, capsuleId, fromVersion),
      loadCapsuleVersion(user.uid, capsuleId, toVersion),
    ]);
    if (!from || !to) return NextResponse.json({ error: 'Capsule version not found' }, { status: 404 });

    const fromRefs = flattenCoreRefs(from);
    const toRefs = flattenCoreRefs(to);
    return NextResponse.json({
      addedCoreRefs: [...toRefs].filter((ref) => !fromRefs.has(ref)).sort(),
      removedCoreRefs: [...fromRefs].filter((ref) => !toRefs.has(ref)).sort(),
      changedRetrievalPolicy: JSON.stringify(from.retrievalPolicy) !== JSON.stringify(to.retrievalPolicy),
      healthDelta: (to.health?.score ?? 0) - (from.health?.score ?? 0),
    });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/diff');
  }
});

async function loadCapsuleVersion(uid: string, capsuleId: string, version: number): Promise<PraxisCapsule | null> {
  const current = await getCapsule(uid, capsuleId);
  if (current?.version === version) return current;
  const snap = await getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('capsules')
    .doc(capsuleId)
    .collection('versions')
    .doc(`v${version}`)
    .get();
  return snap.exists ? (snap.data() as PraxisCapsule) : null;
}

function parseVersion(value: string | null): number | null {
  const match = value?.match(/^v?(\d+)$/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function flattenCoreRefs(capsule: PraxisCapsule): Set<string> {
  const refs = capsule.coreRefs;
  return new Set([
    refs.userCoreId ? `user:${refs.userCoreId}` : null,
    refs.teamCoreId ? `team:${refs.teamCoreId}` : null,
    refs.situationCoreId ? `situation:${refs.situationCoreId}` : null,
    refs.graphCoreId ? `graph:${refs.graphCoreId}` : null,
    ...refs.sourceCoreIds.map((id) => `source:${id}`),
    ...refs.documentCoreIds.map((id) => `document:${id}`),
    ...refs.outputCoreIds.map((id) => `output:${id}`),
  ].filter((ref): ref is string => Boolean(ref)));
}

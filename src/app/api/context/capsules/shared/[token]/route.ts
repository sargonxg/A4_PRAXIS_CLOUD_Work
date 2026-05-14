import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { createCapsule, getCapsule } from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ token: string }> };

interface CapsuleShare {
  token: string;
  capsuleId: string;
  ownerUid: string;
  scope: 'read' | 'clone';
  expiresAt: string;
}

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    const share = await resolveShare((await context.params).token);
    if (!share) return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    if (isExpired(share.expiresAt)) return NextResponse.json({ error: 'Share expired' }, { status: 410 });
    const capsule = await getCapsule(share.ownerUid, share.capsuleId);
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    return NextResponse.json({ capsule, share: { scope: share.scope, expiresAt: share.expiresAt }, recipientUid: user.uid });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/shared/get');
  }
});

export const POST = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Demo mode cannot clone shared capsules' }, { status: 403 });
    const share = await resolveShare((await context.params).token);
    if (!share) return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    if (isExpired(share.expiresAt)) return NextResponse.json({ error: 'Share expired' }, { status: 410 });
    if (share.scope !== 'clone') return NextResponse.json({ error: 'Share is read-only' }, { status: 403 });
    const source = await getCapsule(share.ownerUid, share.capsuleId);
    if (!source) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    const capsule = await createCapsule(user.uid, {
      label: `${source.label} clone`,
      scope: source.scope,
      coreRefs: source.coreRefs,
      retrievalPolicy: source.retrievalPolicy,
      activeForSituationIds: [],
      provenance: {
        source: 'fork',
        createdBy: user.uid,
        parentCapsuleId: source.capsuleId,
        forkedFromVersion: source.version,
        notes: `Cloned from share token ${share.token}.`,
      },
    });
    return NextResponse.json({ capsule }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/shared/post');
  }
});

async function resolveShare(token: string): Promise<CapsuleShare | null> {
  const snap = await getAdminDbOrThrow()
    .collectionGroup('capsule_shares')
    .where('token', '==', token)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  if (
    typeof data.token !== 'string' ||
    typeof data.capsuleId !== 'string' ||
    typeof data.ownerUid !== 'string' ||
    (data.scope !== 'read' && data.scope !== 'clone') ||
    typeof data.expiresAt !== 'string'
  ) {
    return null;
  }
  return data as CapsuleShare;
}

function isExpired(expiresAt: string): boolean {
  const expires = Date.parse(expiresAt);
  return Number.isFinite(expires) && expires <= Date.now();
}

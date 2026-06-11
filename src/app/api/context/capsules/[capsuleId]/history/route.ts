import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { getCapsule } from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };
type CapsuleHistoryVersionRow = Record<string, unknown> & {
  version?: number;
  appliedReviewCardTitle: string | null;
};

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ versions: [] });
    const { capsuleId } = await context.params;
    const limit = Math.max(1, Math.min(Number(new URL(request.url).searchParams.get('limit') ?? 10), 25));
    const current = await getCapsule(user.uid, capsuleId);
    if (!current) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    const db = getAdminDbOrThrow();
    const snap = await db
      .collection('users')
      .doc(user.uid)
      .collection('capsules')
      .doc(capsuleId)
      .collection('versions')
      .orderBy('version', 'desc')
      .limit(limit)
      .get();
    const reviewCardsSnap = await db
      .collection('users')
      .doc(user.uid)
      .collection('capsules')
      .doc(capsuleId)
      .collection('reviewCards')
      .get();
    const appliedReviewCardTitlesByVersion = new Map<number, string>();
    reviewCardsSnap.docs.forEach((doc) => {
      const card = doc.data();
      const targetVersion = typeof card.applyMetadata?.targetVersion === 'number'
        ? Math.floor(card.applyMetadata.targetVersion)
        : null;
      if (targetVersion && typeof card.title === 'string') {
        appliedReviewCardTitlesByVersion.set(targetVersion, card.title);
      }
    });
    const versions = snap.docs.map((doc) => withAppliedReviewCardTitle(doc.data(), appliedReviewCardTitlesByVersion));
    if (!versions.some((item) => item.version === current.version)) {
      versions.unshift(withAppliedReviewCardTitle(current as unknown as Record<string, unknown>, appliedReviewCardTitlesByVersion));
    }
    return NextResponse.json({ versions: versions.slice(0, limit) });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/history');
  }
});

function withAppliedReviewCardTitle(input: Record<string, unknown>, titles: Map<number, string>): CapsuleHistoryVersionRow {
  const version = typeof input.version === 'number' ? Math.floor(input.version) : null;
  return {
    ...input,
    ...(version ? { version } : {}),
    appliedReviewCardTitle: version ? titles.get(version) ?? null : null,
  };
}

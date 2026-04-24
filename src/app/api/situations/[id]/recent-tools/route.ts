import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { handleRouteError } from '@/lib/api/standard-error';

type RouteContext = { params: Promise<{ id: string }> };

interface RecentToolItem {
  toolId: string;
  generatedAt: string | null;
  profileVersion: number | null;
  summary: string | null;
}

/**
 * GET /api/situations/{id}/recent-tools?limit=5
 *
 * Returns the last N tool outputs for a situation from
 * users/{uid}/situations/{id}/tools/*, ordered by generatedAt desc.
 * Matches the path used by save-tool-output.ts.
 */
export const GET = withAuth<RouteContext>(async (req: Request, user, context) => {
  try {
    const { id: situationId } = await context.params;
    if (!situationId) {
      return NextResponse.json({ error: 'situationId required' }, { status: 400 });
    }

    if (user.isDemo) {
      return NextResponse.json({ items: [] });
    }

    const url = new URL(req.url);
    const limit = Math.min(20, Number(url.searchParams.get('limit') ?? '5') || 5);

    const db = getAdminDbOrThrow();
    const snap = await db
      .collection('users').doc(user.uid)
      .collection('situations').doc(situationId)
      .collection('tools')
      .orderBy('generatedAt', 'desc')
      .limit(limit)
      .get();

    const items: RecentToolItem[] = snap.docs.map((doc) => {
      const d = doc.data();
      const ts = d.generatedAt?.toDate?.() as Date | undefined;
      const output = d.output as { headline?: string; title?: string } | undefined;
      return {
        toolId: (d.toolId as string) ?? doc.id,
        generatedAt: ts ? ts.toISOString() : null,
        profileVersion: typeof d.profileVersion === 'number' ? d.profileVersion : null,
        summary: output?.headline ?? output?.title ?? null,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err, 'recent-tools');
  }
});

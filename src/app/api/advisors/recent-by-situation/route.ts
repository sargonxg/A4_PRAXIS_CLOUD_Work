import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { handleRouteError } from '@/lib/api/standard-error';
import { ADVISOR_IDS, type AdvisorId } from '@/types/advisor';

interface RecentAdvisorTurn {
  advisorId: AdvisorId;
  lastTurnAt: string | null;
  snippet: string | null;
}

const SNIPPET_MAX = 140;

export const GET = withAuth(async (req, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ items: [] });
    }

    const url = new URL(req.url);
    const sid = url.searchParams.get('sid');
    if (!sid) {
      return NextResponse.json({ error: 'sid required' }, { status: 400 });
    }

    const db = getAdminDbOrThrow();
    const items: RecentAdvisorTurn[] = await Promise.all(
      ADVISOR_IDS.map(async (advisorId) => {
        try {
          const snap = await db
            .collection(`users/${user.uid}/situations/${sid}/advisors/${advisorId}/history`)
            .orderBy('at', 'desc')
            .limit(1)
            .get();
          if (snap.empty) {
            return { advisorId, lastTurnAt: null, snippet: null };
          }
          const turn = snap.docs[0].data() as { at?: string; content?: string };
          const content = typeof turn.content === 'string' ? turn.content : '';
          const snippet = content.length > SNIPPET_MAX
            ? `${content.slice(0, SNIPPET_MAX - 1)}…`
            : content || null;
          return {
            advisorId,
            lastTurnAt: turn.at ?? null,
            snippet,
          };
        } catch {
          return { advisorId, lastTurnAt: null, snippet: null };
        }
      }),
    );

    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err, 'advisors-recent-by-situation');
  }
});

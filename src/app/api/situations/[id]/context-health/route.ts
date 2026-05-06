import { NextResponse, type NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';
import { getSituationAdmin } from '@/lib/firebase/situations';
import { computeContextHealthScore } from '@/lib/context/context-health-score';
import { hashContextHealthOverride } from '@/lib/api/with-context-health-gate';

type RouteContext = { params: Promise<{ id: string }> };

export function GET(req: NextRequest, ctx: RouteContext) {
  return withAuth<RouteContext>(async (_request, user, context) => {
    const { id } = await context.params;
    const situation = user.isDemo ? null : await getSituationAdmin(user.uid, id);
    if (!user.isDemo && !situation) {
      return NextResponse.json({ error: 'Situation not found' }, { status: 404 });
    }
    const report = computeContextHealthScore({ situation });
    return NextResponse.json(report);
  })(req, ctx);
}

export function POST(req: NextRequest, ctx: RouteContext) {
  return withAuth<RouteContext>(async (request, user, context) => {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({})) as {
      justification?: unknown;
      toolId?: unknown;
      score?: unknown;
    };
    const justification = typeof body.justification === 'string' ? body.justification.trim() : '';
    if (justification.length < 50) {
      return NextResponse.json({ error: 'Override justification must be at least 50 characters.' }, { status: 400 });
    }
    if (!user.isDemo) {
      const situation = await getSituationAdmin(user.uid, id);
      if (!situation) {
        return NextResponse.json({ error: 'Situation not found' }, { status: 404 });
      }
    }
    const overrideHash = hashContextHealthOverride(justification);
    await adminDb
      .collection('users')
      .doc(user.uid)
      .collection('situations')
      .doc(id)
      .collection('audit-log')
      .add({
        at: FieldValue.serverTimestamp(),
        uid: user.uid,
        action: 'context_health_override',
        caseId: id,
        scoreAtOverride: typeof body.score === 'number' ? body.score : null,
        toolThatRan: typeof body.toolId === 'string' ? body.toolId : 'workbench-tool',
        justification,
        overrideHash,
      });
    return NextResponse.json({ ok: true, overrideHash });
  })(req, ctx);
}

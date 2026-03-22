import { NextResponse, type NextRequest } from 'next/server';
import { withAuth, type AuthenticatedUser } from '@/lib/api/with-auth';
import {
  getSituation,
  updateSituation,
  deleteSituation,
} from '@/lib/firebase/situations-service';

type RouteContext = { params: Promise<{ id: string }> };

function rejectDemo(user: AuthenticatedUser) {
  if (user.isDemo) {
    return NextResponse.json(
      { error: 'Not available in demo mode' },
      { status: 403 }
    );
  }
  return null;
}

export function GET(_req: NextRequest, ctx: RouteContext) {
  return withAuth(async (_r, user) => {
    const demoErr = rejectDemo(user);
    if (demoErr) return demoErr;

    const { id } = await ctx.params;
    const situation = await getSituation(user.uid, id);
    if (!situation) {
      return NextResponse.json({ error: 'Situation not found' }, { status: 404 });
    }
    return NextResponse.json({ situation });
  })(_req);
}

export function PATCH(req: NextRequest, ctx: RouteContext) {
  return withAuth(async (r, user) => {
    const demoErr = rejectDemo(user);
    if (demoErr) return demoErr;

    const { id } = await ctx.params;
    const body = await r.json();
    await updateSituation(user.uid, id, body);
    return NextResponse.json({ success: true });
  })(req);
}

export function DELETE(_req: NextRequest, ctx: RouteContext) {
  return withAuth(async (_r, user) => {
    const demoErr = rejectDemo(user);
    if (demoErr) return demoErr;

    const { id } = await ctx.params;
    await deleteSituation(user.uid, id);
    return NextResponse.json({ success: true });
  })(_req);
}

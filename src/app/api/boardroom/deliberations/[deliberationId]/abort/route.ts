import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { transitionDeliberation } from '@/lib/boardroom/store';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ deliberationId: string }> };

const BodySchema = z.object({
  caseId: z.string().min(1),
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { deliberationId } = await context.params;
    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'caseId required', details: parsed.error.flatten() }, { status: 400 });
    }

    const deliberation = await transitionDeliberation({
      uid: user.uid,
      caseId: parsed.data.caseId,
      id: deliberationId,
      status: 'aborted',
      phase: 'aborted',
      demo: user.isDemo,
    });

    if (!deliberation) return NextResponse.json({ error: 'Deliberation not found' }, { status: 404 });
    return NextResponse.json({
      deliberation,
      persistence: { persisted: !user.isDemo, reason: user.isDemo ? 'demo_mode' : undefined },
    });
  } catch (err) {
    return handleRouteError(err, 'boardroom/deliberations/abort');
  }
});

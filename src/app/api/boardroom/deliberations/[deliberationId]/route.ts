import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { buildDemoDeliberation, getDeliberation, saveDeliberation } from '@/lib/boardroom/store';
import { DeliberationArtifactSchema } from '@/types/boardroom';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ deliberationId: string }> };

const QuerySchema = z.object({
  caseId: z.string().min(1),
});

const PatchSchema = z.object({
  caseId: z.string().min(1),
  deliberation: DeliberationArtifactSchema,
});

function parseCaseId(request: Request) {
  const url = new URL(request.url);
  return QuerySchema.safeParse({ caseId: url.searchParams.get('caseId')?.trim() });
}

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { deliberationId } = await context.params;
    const parsed = parseCaseId(request);
    if (!parsed.success) {
      return NextResponse.json({ error: 'caseId required', details: parsed.error.flatten() }, { status: 400 });
    }

    if (user.isDemo) {
      return NextResponse.json({
        deliberation: buildDemoDeliberation({ uid: user.uid, caseId: parsed.data.caseId, id: deliberationId }),
        demo: true,
      });
    }

    const deliberation = await getDeliberation(user.uid, parsed.data.caseId, deliberationId);
    if (!deliberation) return NextResponse.json({ error: 'Deliberation not found' }, { status: 404 });
    return NextResponse.json({ deliberation });
  } catch (err) {
    return handleRouteError(err, 'boardroom/deliberations/get');
  }
});

export const PATCH = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { deliberationId } = await context.params;
    const parsed = PatchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid deliberation update', details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.deliberation.id !== deliberationId) {
      return NextResponse.json({ error: 'Deliberation id mismatch' }, { status: 400 });
    }

    if (user.isDemo) {
      return NextResponse.json({
        deliberation: parsed.data.deliberation,
        persistence: { persisted: false, reason: 'demo_mode' },
      });
    }

    const deliberation = await saveDeliberation(user.uid, parsed.data.caseId, parsed.data.deliberation);
    return NextResponse.json({ deliberation, persistence: { persisted: true } });
  } catch (err) {
    return handleRouteError(err, 'boardroom/deliberations/update');
  }
});

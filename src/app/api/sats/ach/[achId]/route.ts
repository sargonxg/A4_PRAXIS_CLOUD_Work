import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { buildInitialACHMatrix, getACHMatrix, saveACHMatrix } from '@/lib/sats/ach-store';
import { ACHMatrixSchema } from '@/types/sats';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ achId: string }> };

const QuerySchema = z.object({
  caseId: z.string().min(1),
});

const SaveACHSchema = z.object({
  caseId: z.string().min(1),
  matrix: ACHMatrixSchema,
});

function parseCaseId(request: Request) {
  const url = new URL(request.url);
  return QuerySchema.safeParse({ caseId: url.searchParams.get('caseId')?.trim() });
}

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { achId } = await context.params;
    const parsed = parseCaseId(request);
    if (!parsed.success) {
      return NextResponse.json({ error: 'caseId required', details: parsed.error.flatten() }, { status: 400 });
    }

    if (user.isDemo) {
      const matrix = buildInitialACHMatrix({
        uid: user.uid,
        caseId: parsed.data.caseId,
        achId,
        now: new Date().toISOString(),
      });
      return NextResponse.json({ matrix, demo: true });
    }

    const matrix = await getACHMatrix(user.uid, parsed.data.caseId, achId);
    if (!matrix) {
      return NextResponse.json({ error: 'ACH matrix not found' }, { status: 404 });
    }
    return NextResponse.json({ matrix });
  } catch (err) {
    return handleRouteError(err, 'sats/ach/get');
  }
});

export const PATCH = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { achId } = await context.params;
    const parsed = SaveACHSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid ACH save request', details: parsed.error.flatten() }, { status: 400 });
    }

    if (user.isDemo) {
      const matrix = buildInitialACHMatrix({
        uid: user.uid,
        caseId: parsed.data.caseId,
        achId,
        title: parsed.data.matrix.title,
        now: new Date().toISOString(),
      });
      return NextResponse.json({ matrix, persistence: { persisted: false, reason: 'demo_mode' } });
    }

    const matrix = await saveACHMatrix(user.uid, parsed.data.caseId, achId, parsed.data.matrix);
    return NextResponse.json({ matrix, persistence: { persisted: true } });
  } catch (err) {
    return handleRouteError(err, 'sats/ach/save');
  }
});

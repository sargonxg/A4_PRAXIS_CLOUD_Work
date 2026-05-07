import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { buildInitialACHMatrix, createACHMatrix, listACHMatrices } from '@/lib/sats/ach-store';

export const dynamic = 'force-dynamic';

const CreateACHSchema = z.object({
  caseId: z.string().min(1),
  title: z.string().min(1).max(180).optional(),
});

export const GET = withAuth(async (request, user) => {
  try {
    const url = new URL(request.url);
    const caseId = url.searchParams.get('caseId')?.trim();
    if (!caseId) {
      return NextResponse.json({ error: 'caseId required' }, { status: 400 });
    }

    if (user.isDemo) {
      const matrix = buildInitialACHMatrix({
        uid: user.uid,
        caseId,
        achId: 'ach-demo',
        now: new Date().toISOString(),
      });
      return NextResponse.json({ items: [matrix], demo: true });
    }

    const items = await listACHMatrices(user.uid, caseId);
    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err, 'sats/ach/list');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    const parsed = CreateACHSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid ACH create request', details: parsed.error.flatten() }, { status: 400 });
    }

    if (user.isDemo) {
      const matrix = buildInitialACHMatrix({
        uid: user.uid,
        caseId: parsed.data.caseId,
        achId: 'ach-demo',
        title: parsed.data.title,
        now: new Date().toISOString(),
      });
      return NextResponse.json({ matrix, persistence: { persisted: false, reason: 'demo_mode' } });
    }

    const matrix = await createACHMatrix({
      uid: user.uid,
      caseId: parsed.data.caseId,
      title: parsed.data.title,
    });
    return NextResponse.json({ matrix, persistence: { persisted: true } }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'sats/ach/create');
  }
});

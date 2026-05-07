import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { buildDemoDeliberation, createDeliberation, listDeliberations } from '@/lib/boardroom/store';
import { DeliberationConfigSchema } from '@/types/boardroom';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  caseId: z.string().min(1),
  config: DeliberationConfigSchema.partial().extend({
    question: z.string().min(5).max(1200),
  }),
});

export const GET = withAuth(async (request, user) => {
  try {
    const url = new URL(request.url);
    const caseId = url.searchParams.get('caseId')?.trim();
    if (!caseId) return NextResponse.json({ error: 'caseId required' }, { status: 400 });

    if (user.isDemo) {
      return NextResponse.json({ items: [buildDemoDeliberation({ uid: user.uid, caseId })], demo: true });
    }

    const items = await listDeliberations(user.uid, caseId);
    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err, 'boardroom/deliberations/list');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    const parsed = CreateSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid boardroom request', details: parsed.error.flatten() }, { status: 400 });
    }

    if (user.isDemo) {
      const deliberation = buildDemoDeliberation({
        uid: user.uid,
        caseId: parsed.data.caseId,
        question: parsed.data.config.question,
      });
      return NextResponse.json({ deliberation, persistence: { persisted: false, reason: 'demo_mode' } }, { status: 201 });
    }

    const deliberation = await createDeliberation({
      uid: user.uid,
      caseId: parsed.data.caseId,
      config: parsed.data.config,
    });
    return NextResponse.json({ deliberation, persistence: { persisted: true } }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'boardroom/deliberations/create');
  }
});

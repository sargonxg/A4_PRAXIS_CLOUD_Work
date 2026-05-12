import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { createOpenQuestion } from '@/lib/workbench/open-questions-store';

type RouteContext = { params: Promise<{ id: string }> };

const BodySchema = z.object({
  question: z.string().min(3).max(800),
  source: z.string().max(80).default('ask-praxis'),
});

export function POST(req: NextRequest, ctx: RouteContext) {
  return withAuth(async (request, user) => {
    const { id } = await ctx.params;
    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid open question', details: parsed.error.flatten() }, { status: 400 });
    }
    if (user.isDemo) {
      return NextResponse.json({ success: true, mode: 'demo-local' });
    }

    const item = await createOpenQuestion({
      uid: user.uid,
      caseId: id,
      question: parsed.data.question,
      category: 'evidence-gap',
      notes: `Created from ${parsed.data.source}.`,
    });
    return NextResponse.json({ success: true, question: item }, { status: 201 });
  })(req);
}

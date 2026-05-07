import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { createOpenQuestion, listOpenQuestions } from '@/lib/workbench/open-questions-store';
import { OpenQuestionCategorySchema, OpenQuestionStatusSchema } from '@/types/open-questions';

type RouteContext = { params: Promise<{ caseId: string }> };

export const GET = withAuth<RouteContext>(async (req, user, context) => {
  const { caseId } = await context.params;
  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status');
  const status = OpenQuestionStatusSchema.safeParse(statusParam).success
    ? OpenQuestionStatusSchema.parse(statusParam)
    : undefined;
  const questions = await listOpenQuestions(user.uid, caseId, status);
  return NextResponse.json({ questions });
});

export const POST = withAuth<RouteContext>(async (req, user, context) => {
  const { caseId } = await context.params;
  const body = await req.json().catch(() => null) as { question?: unknown; category?: unknown; notes?: unknown } | null;
  const question = typeof body?.question === 'string' ? body.question.trim() : '';

  if (question.length < 5) {
    return NextResponse.json({ error: 'Question must be at least 5 characters.' }, { status: 400 });
  }

  const categoryResult = OpenQuestionCategorySchema.safeParse(body?.category);
  const item = await createOpenQuestion({
    uid: user.uid,
    caseId,
    question,
    category: categoryResult.success ? categoryResult.data : 'other',
    notes: typeof body?.notes === 'string' ? body.notes : undefined,
  });

  return NextResponse.json({ question: item }, { status: 201 });
});

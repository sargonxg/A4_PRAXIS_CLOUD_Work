import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { updateOpenQuestion } from '@/lib/workbench/open-questions-store';
import { OpenQuestionStatusSchema } from '@/types/open-questions';

type RouteContext = { params: Promise<{ caseId: string; questionId: string }> };

export const PATCH = withAuth<RouteContext>(async (req, user, context) => {
  const { caseId, questionId } = await context.params;
  const body = await req.json().catch(() => null) as { status?: unknown; notes?: unknown; resolvedRef?: unknown } | null;
  const statusResult = OpenQuestionStatusSchema.safeParse(body?.status);

  const question = await updateOpenQuestion({
    uid: user.uid,
    caseId,
    questionId,
    status: statusResult.success ? statusResult.data : undefined,
    notes: typeof body?.notes === 'string' ? body.notes : undefined,
    resolvedRef: typeof body?.resolvedRef === 'string' ? body.resolvedRef : undefined,
  });

  if (!question) {
    return NextResponse.json({ error: 'Open question not found.' }, { status: 404 });
  }

  return NextResponse.json({ question });
});

export const DELETE = withAuth<RouteContext>(async (_req, user, context) => {
  const { caseId, questionId } = await context.params;
  const question = await updateOpenQuestion({
    uid: user.uid,
    caseId,
    questionId,
    status: 'dismissed',
  });

  if (!question) {
    return NextResponse.json({ error: 'Open question not found.' }, { status: 404 });
  }

  return NextResponse.json({ question });
});

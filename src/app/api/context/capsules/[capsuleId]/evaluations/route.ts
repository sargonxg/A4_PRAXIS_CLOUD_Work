import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { createCapsuleEvaluation, listCapsuleEvaluations } from '@/lib/context/capsule-details-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

const LinksSchema = z.object({
  runId: z.string().max(160).nullable().optional(),
  outputCapsuleId: z.string().max(160).nullable().optional(),
  sourceIds: z.array(z.string().max(160)).max(20).optional(),
  documentIds: z.array(z.string().max(160)).max(20).optional(),
}).optional();

const ScorecardSchema = z.object({
  sourceCoverage: z.number().min(0).max(1).optional(),
  freshness: z.number().min(0).max(1).optional(),
  contradictionRisk: z.number().min(0).max(1).optional(),
  actionability: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
}).optional();

const CreateEvaluationSchema = z.object({
  id: z.string().min(1).max(160).optional(),
  rubric: z.string().max(120).optional(),
  stars: z.number().min(1).max(5),
  summary: z.string().min(1).max(2400),
  scorecard: ScorecardSchema,
  tags: z.array(z.string().max(48)).max(20).optional(),
  links: LinksSchema,
});

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) return NextResponse.json({ evaluations: [], persisted: false });
    const evaluations = await listCapsuleEvaluations(user.uid, capsuleId);
    return NextResponse.json({ evaluations, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/evaluations/list');
  }
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot mutate private capsule evaluations' }, { status: 403 });
    }
    const parsed = CreateEvaluationSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule evaluation', details: parsed.error.flatten() }, { status: 400 });
    }
    const evaluation = await createCapsuleEvaluation(user.uid, capsuleId, parsed.data);
    if (!evaluation) return NextResponse.json({ error: 'Capsule not found or evaluation is empty' }, { status: 404 });
    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/evaluations/create');
  }
});

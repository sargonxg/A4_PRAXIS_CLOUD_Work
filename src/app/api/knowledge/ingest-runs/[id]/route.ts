import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  getIngestionRun,
  localKnowledgeAdapter,
  markIngestionRetry,
} from '@/lib/knowledge/context-engine';

const ParamsSchema = z.object({ id: z.string().min(1) });
const RetrySchema = z.object({
  situationId: z.string().min(1),
  retry: z.literal(true),
});

export const GET = withAuth(async (request, user, context: { params: Promise<{ id: string }> | { id: string } }) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Demo mode has no private ingestion runs' }, { status: 403 });
    const params = await context.params;
    const parsedParams = ParamsSchema.safeParse(params);
    if (!parsedParams.success) return NextResponse.json({ error: 'Invalid run id' }, { status: 400 });
    const url = new URL(request.url);
    const situationId = url.searchParams.get('situationId') || undefined;
    const run = await getIngestionRun(user.uid, situationId, parsedParams.data.id);
    if (!run) return NextResponse.json({ error: 'Ingestion run not found' }, { status: 404 });
    const trace = await localKnowledgeAdapter.explainTrace({ uid: user.uid, runId: run.id, situationId: run.situationId });
    return NextResponse.json({ run, trace });
  } catch (err) {
    return handleRouteError(err, 'knowledge/ingest-runs/get');
  }
});

export const POST = withAuth(async (request, user, context: { params: Promise<{ id: string }> | { id: string } }) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Demo mode cannot retry ingestion runs' }, { status: 403 });
    const params = await context.params;
    const parsedParams = ParamsSchema.safeParse(params);
    if (!parsedParams.success) return NextResponse.json({ error: 'Invalid run id' }, { status: 400 });
    const raw = await request.json().catch(() => ({}));
    const parsed = RetrySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    await markIngestionRetry(user.uid, parsed.data.situationId, parsedParams.data.id);
    return NextResponse.json({ ok: true, runId: parsedParams.data.id, retryRequested: true });
  } catch (err) {
    return handleRouteError(err, 'knowledge/ingest-runs/retry');
  }
});

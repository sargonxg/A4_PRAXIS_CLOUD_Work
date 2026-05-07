import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { stageResearchIngest } from '@/lib/workbench/research-ingest-store';

type RouteContext = { params: Promise<{ caseId: string }> };

const ResearchCandidateSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(300),
  url: z.string().min(1).max(1000),
  provider: z.string().min(1).max(120),
  snippet: z.string().max(1200),
  relevance: z.number().min(0).max(100),
  sourceSet: z.string().min(1).max(80),
});

const ResearchIngestRequestSchema = z.object({
  candidates: z.array(ResearchCandidateSchema).min(1).max(10),
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  const { caseId } = await context.params;
  const parsed = ResearchIngestRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid research ingest request', details: parsed.error.flatten() }, { status: 400 });
  }

  if (user.isDemo) {
    return NextResponse.json({
      ok: true,
      mode: 'demo-staged',
      remainingToday: 2,
      note: 'Demo ingestion is staged only; no graph writes occur.',
    });
  }

  try {
    const result = await stageResearchIngest({ uid: user.uid, caseId, candidates: parsed.data.candidates });
    return NextResponse.json({
      ok: true,
      mode: 're_genesis',
      status: result.record.status,
      ingestId: result.record.id,
      reviewQueuePath: result.record.reviewQueuePath,
      remainingToday: result.remainingToday,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Research ingest failed';
    const status = /limit reached/i.test(message) ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
});


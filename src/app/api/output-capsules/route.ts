import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { listOutputCapsules, saveOutputCapsule } from '@/lib/output-capsules/storage';

export const dynamic = 'force-dynamic';

const CitationSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().min(1).max(300),
  uri: z.string().url().optional(),
  sourceReceiptId: z.string().max(160).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const GapSchema = z.object({
  id: z.string().min(1).max(160),
  claim: z.string().min(1).max(1000),
  reason: z.string().min(1).max(1000),
  severity: z.enum(['low', 'medium', 'high']),
});

const CreateOutputCapsuleSchema = z.object({
  id: z.string().min(1).max(160).optional(),
  situationId: z.string().max(160).nullable().optional(),
  contextCapsuleId: z.string().max(160).nullable().optional(),
  templateId: z.string().min(1).max(160),
  payload: z.unknown(),
  citations: z.array(CitationSchema).max(100).optional(),
  gaps: z.array(GapSchema).max(100).optional(),
  provenance: z.object({
    createdBy: z.string().min(1).max(160),
    toolIds: z.array(z.string().max(160)).max(40).default([]),
    agentIds: z.array(z.string().max(160)).max(40).default([]),
    modelMatrixVersion: z.string().max(160).optional(),
    profileVersion: z.string().max(160).optional(),
    traceId: z.string().max(160).optional(),
  }),
});

export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ outputCapsules: [], persisted: false });
    const url = new URL(request.url);
    const outputCapsules = await listOutputCapsules(user.uid, {
      contextCapsuleId: url.searchParams.get('contextCapsuleId'),
      status: url.searchParams.get('status') as never,
      limit: Number(url.searchParams.get('limit') ?? 50),
    });
    return NextResponse.json({ outputCapsules, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'output-capsules/list');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot create private output capsules' }, { status: 403 });
    }
    const parsed = CreateOutputCapsuleSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid output capsule', details: parsed.error.flatten() }, { status: 400 });
    }
    const outputCapsule = await saveOutputCapsule(user.uid, parsed.data);
    if (!outputCapsule) return NextResponse.json({ error: 'ContextCapsule not found' }, { status: 404 });
    return NextResponse.json({ outputCapsule }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'output-capsules/create');
  }
});

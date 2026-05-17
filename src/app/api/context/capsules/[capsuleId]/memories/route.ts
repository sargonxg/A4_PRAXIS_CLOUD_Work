import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { createCapsuleMemory, listCapsuleMemories } from '@/lib/context/capsule-details-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

const LinksSchema = z.object({
  runId: z.string().max(160).nullable().optional(),
  outputCapsuleId: z.string().max(160).nullable().optional(),
  sourceIds: z.array(z.string().max(160)).max(20).optional(),
  documentIds: z.array(z.string().max(160)).max(20).optional(),
}).optional();

const CreateMemorySchema = z.object({
  id: z.string().min(1).max(160).optional(),
  type: z.enum(['preference', 'decision', 'commitment', 'open_question', 'working_assumption']).optional(),
  summary: z.string().min(1).max(500),
  detail: z.string().max(4000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.array(z.string().max(48)).max(20).optional(),
  links: LinksSchema,
  createdFromRunId: z.string().max(160).nullable().optional(),
  lastUsedAt: z.string().datetime().nullable().optional(),
});

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) return NextResponse.json({ memories: [], persisted: false });
    const memories = await listCapsuleMemories(user.uid, capsuleId);
    return NextResponse.json({ memories, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/memories/list');
  }
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot mutate private capsule memories' }, { status: 403 });
    }
    const parsed = CreateMemorySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule memory', details: parsed.error.flatten() }, { status: 400 });
    }
    const memory = await createCapsuleMemory(user.uid, capsuleId, parsed.data);
    if (!memory) return NextResponse.json({ error: 'Capsule not found or memory is empty' }, { status: 404 });
    return NextResponse.json({ memory }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/memories/create');
  }
});

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { CognitiveKnowledgeCaptureSchema, CognitiveKnowledgeDecisionSchema, getCognitiveCapsuleInventory, proposeCognitiveKnowledge, proposeCognitiveInterview, decideCognitiveKnowledge } from '@/lib/cognitive-capsule/service';
import { ExpertInterviewInputSchema } from '@/lib/cognitive-capsule/interview';
import { CAPSULE_MIMETYPE, packCapsule } from '@/lib/cognitive-capsule/package';
import { CapsuleReviewConflictError } from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';
type RouteContext = { params: Promise<{ capsuleId: string }> };
const idPattern = /^[a-zA-Z0-9._:-]{1,160}$/;

async function readBody(request: Request): Promise<unknown> {
  const raw = await request.text();
  if (raw.length > 64_000) throw Object.assign(new Error('The expertise request is too large.'), { status: 413 });
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('Provide a JSON expertise request.'), { status: 400 }); }
}
function routeError(error: unknown): Response {
  if (error instanceof CapsuleReviewConflictError) return NextResponse.json({ error: error.message, code: 'REVIEW_ALREADY_DECIDED' }, { status: 409 });
  if (error instanceof ZodError) return NextResponse.json({ error: 'Invalid expertise request', details: error.flatten() }, { status: 400 });
  if (error instanceof Error && 'status' in error && typeof error.status === 'number' && [400, 403, 409, 413].includes(error.status)) {
    return NextResponse.json({ error: error.message, ...(error.status === 409 ? { code: 'STALE_CAPSULE_PROPOSAL' } : {}) }, { status: error.status });
  }
  return handleRouteError(error, 'context/capsules/cognition');
}

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (!idPattern.test(capsuleId)) return NextResponse.json({ error: 'Invalid capsule ID' }, { status: 400 });
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    if (cursor && cursor.length > 2000) return NextResponse.json({ error: 'Invalid review cursor' }, { status: 400 });
    const inventory = cursor ? await getCognitiveCapsuleInventory(user.uid, capsuleId, { cursor }) : await getCognitiveCapsuleInventory(user.uid, capsuleId);
    if (!inventory) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    const format = url.searchParams.get('format');
    if (format === 'package' || format === 'jsonld') {
      if (!inventory.allowDownload) return NextResponse.json({ error: 'Downloads are disabled for this capsule.' }, { status: 403 });
      if (format === 'package') {
        if (inventory.validation?.length) return NextResponse.json({ error: 'Resolve structural issues before exporting a native capsule.' }, { status: 400 });
        const bytes = await packCapsule(inventory.cognition);
        return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': CAPSULE_MIMETYPE,
          'Content-Disposition': `attachment; filename="${capsuleId}.capsule"`, 'Cache-Control': 'private, no-store' } });
      }
    }
    return NextResponse.json(format === 'jsonld' ? inventory.jsonLd : inventory, { headers: { 'Cache-Control': 'private, no-store', ...(format === 'jsonld' ? { 'Content-Disposition': `attachment; filename="${capsuleId}.jsonld"` } : {}) } });
  } catch (error) { return routeError(error); }
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot save expertise.' }, { status: 403 });
    const { capsuleId } = await context.params;
    if (!idPattern.test(capsuleId)) return NextResponse.json({ error: 'Invalid capsule ID' }, { status: 400 });
    const body = await readBody(request);
    const interview = body && typeof body === 'object' && !Array.isArray(body) && 'mode' in body;
    const result = interview
      ? await proposeCognitiveInterview(user.uid, capsuleId, ExpertInterviewInputSchema.parse(body))
      : await proposeCognitiveKnowledge(user.uid, capsuleId, CognitiveKnowledgeCaptureSchema.parse(body));
    if (!result) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) { return routeError(error); }
});

export const PATCH = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot review expertise.' }, { status: 403 });
    const { capsuleId } = await context.params;
    if (!idPattern.test(capsuleId)) return NextResponse.json({ error: 'Invalid capsule ID' }, { status: 400 });
    const input = CognitiveKnowledgeDecisionSchema.parse(await readBody(request));
    const result = await decideCognitiveKnowledge(user.uid, capsuleId, input);
    if (!result) return NextResponse.json({ error: 'Expertise review card not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) { return routeError(error); }
});

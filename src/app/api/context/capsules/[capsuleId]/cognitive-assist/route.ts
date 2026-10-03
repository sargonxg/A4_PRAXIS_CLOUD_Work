import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { withCalibration } from '@/lib/api/with-calibration';
import { handleRouteError } from '@/lib/api/standard-error';
import { getCognitiveCapsuleInventory, proposeCognitiveKnowledge } from '@/lib/cognitive-capsule/service';
import { assistCognitiveInterview, CognitiveAssistRequestSchema, validateAssistCapture } from '@/lib/cognitive-capsule/model-assist';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
type RouteContext = { params: Promise<{ capsuleId: string }> };
async function readInterviewBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw Object.assign(new Error('Provide a JSON interview request.'), { status: 400 });
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 40000) {
        await reader.cancel();
        throw Object.assign(new Error('Summarize earlier interview answers before continuing.'), { status: 413 });
      }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Provide a JSON interview request.'), { status: 400 }); }
}
function routeError(error: unknown): Response {
  if (error instanceof ZodError) return NextResponse.json({ error: 'Invalid interview or proposed expertise.', details: error.flatten() }, { status: 400 });
  if (error instanceof Error && 'status' in error && typeof error.status === 'number' && [400, 403, 409, 413].includes(error.status)) return NextResponse.json({ error: error.message }, { status: error.status });
  return handleRouteError(error, 'context/capsules/cognitive-assist');
}

/** Validate consent, private ownership and bounded input before the existing calibration/usage gate. */
export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sign in to interview an expert.' }, { status: 403 });
    const { capsuleId } = await context.params;
    if (!/^[a-zA-Z0-9._:-]{1,160}$/.test(capsuleId)) return NextResponse.json({ error: 'Invalid capsule ID.' }, { status: 400 });
    const input = CognitiveAssistRequestSchema.parse(await readInterviewBody(request));
    if (input.capsuleId && input.capsuleId !== capsuleId) return NextResponse.json({ error: 'Interview capsule identity does not match.' }, { status: 400 });
    const inventory = await getCognitiveCapsuleInventory(user.uid, capsuleId);
    if (!inventory) return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 });
    // The actual provider call lives only inside the calibrated handler: auth,
    // ordinary Ask allowance, context firewall and tool-run lifecycle are retained.
    const calibrated = withCalibration('ask-praxis', 'ai_chat', {
      blockOnThinContext: false, allowWorkspaceRetrieval: () => false,
      retrievalQuery: () => input.messages.at(-1)?.content.slice(0, 500),
    })(async (_request, calibratedUser) => {
      try {
        if (calibratedUser.uid !== user.uid || calibratedUser.isDemo) return NextResponse.json({ error: 'The interview session changed. Sign in again.' }, { status: 403 });
        const result = await assistCognitiveInterview(inventory.cognition, input, calibratedUser.calibration.systemPromptBlock, request.signal);
        if (input.action !== 'propose' || !result.capture) return NextResponse.json({ ...result, persisted: false }, { headers: { 'Cache-Control': 'private, no-store' } });
        const current = await getCognitiveCapsuleInventory(user.uid, capsuleId);
        if (!current) return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 });
        if (current.capsuleVersion !== inventory.capsuleVersion || current.cognition.version !== inventory.cognition.version) return NextResponse.json({ error: 'The capsule changed during the interview. Reload it and generate a new review proposal.' }, { status: 409 });
        const capture = validateAssistCapture(current.cognition, result.capture);
        const proposal = await proposeCognitiveKnowledge(user.uid, capsuleId, capture, undefined, { type: 'model', id: result.modelId, expectedCapsuleVersion: inventory.capsuleVersion });
        if (!proposal) return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 });
        return NextResponse.json({ ...result, ...proposal, persisted: true, reviewRequired: true }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
      } catch (error) { return routeError(error); }
    });
    // Attach the path identity even when the caller omitted the optional field.
    // Calibration must resolve this exact capsule, never an unrelated active one.
    return await calibrated(new Request(request, { body: JSON.stringify({ ...input, capsuleId,
      activeContextStack: { capsuleId, capsuleRefs: [{ capsuleId, version: inventory.capsuleVersion, role: 'primary', primary: true }] },
    }) }));
  } catch (error) { return routeError(error); }
});

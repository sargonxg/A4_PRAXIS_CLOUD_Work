import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { withCalibration } from '@/lib/api/with-calibration';
import { SignalError } from '@/lib/signal/domain';
import { getSignalWorld } from '@/lib/signal/world-service';
import { SignalWorldResearchRequestSchema, buildSignalWorldResearchEvidence, researchSignalWorld, type SignalWorldResearchEvidence } from '@/lib/signal/world-research';

export const runtime = 'nodejs';
export const maxDuration = 180;
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Cookie, Authorization' };
const errorResponse = (error: unknown) => NextResponse.json({ error: error instanceof SignalError ? error.message : 'Check the question and country selection.' }, { status: error instanceof SignalError ? error.status : 422, headers });

// Preserve exactly the read-only evidence preflighted before normal calibrated credits.
const prepared = new WeakMap<Request, SignalWorldResearchEvidence>();
const calibratedHandler = withCalibration('media-compass', 'ai_media_compass', { blockOnThinContext: false })(async (req, ctx) => {
  try {
    const evidence = prepared.get(req);
    if (!evidence) throw new SignalError(503, 'World research input must be prepared before model access.');
    return NextResponse.json(await researchSignalWorld(evidence, ctx.calibration.systemPromptBlock), { headers });
  } catch (error) { return errorResponse(error instanceof SignalError ? error : new SignalError(503, 'World research is temporarily unavailable.')); }
  finally { prepared.delete(req); }
});

export const POST = withAuth(async req => {
  try {
    const raw = await req.clone().text();
    if (Buffer.byteLength(raw, 'utf8') > 64000) throw new SignalError(413, 'Keep research questions bounded.');
    const input = SignalWorldResearchRequestSchema.parse(JSON.parse(raw));
    const snapshot = await getSignalWorld().catch(() => { throw new SignalError(503, 'Shared world observations are temporarily unavailable.'); });
    prepared.set(req, buildSignalWorldResearchEvidence(snapshot, input));
  } catch (error) { return errorResponse(error); }
  try {
    const response = await calibratedHandler(req);
    for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
    return response;
  } finally { prepared.delete(req); }
});

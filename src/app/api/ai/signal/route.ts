import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { signalStore } from '@/lib/signal/store';
import { withCalibration } from '@/lib/api/with-calibration';
import { analyzeSignalSource, validateAnalysisSource } from '@/lib/signal/analysis';
import { pointer } from '@/lib/signal/schema';
import { SignalError } from '@/lib/signal/domain';

export const runtime = 'nodejs';
export const maxDuration = 180;
// SIGNAL is the evidence-review surface of the existing calibrated media tool.
// It reuses its tool contract/credit operation; it is not a separate provider.
const AnalysisRequestSchema = z.object({ action: z.literal('analyze').optional(), deskId: pointer, expectedVersion: z.number().int().positive(), sourceRevisionId: pointer, situationId: z.string().optional() }).strict();
const calibratedHandler = withCalibration('media-compass', 'ai_media_compass', { blockOnThinContext: false })(async (req, ctx) => {
  try {
    const input = AnalysisRequestSchema.parse(await req.json());
    const desk = await analyzeSignalSource(ctx.uid, input.deskId, input.expectedVersion, input.sourceRevisionId, ctx.calibration.systemPromptBlock);
    return NextResponse.json({ desk }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof SignalError ? error.message : 'Check the analysis input and retry.' }, { status: error instanceof SignalError ? error.status : 422, headers: { 'Cache-Control': 'private, no-store' } });
  }
  return calibratedHandler(req);
});

// Ownership/evidence/context preflight must precede calibration's credit deduction.
// The calibrated handler retains its own authentication and all normal model/tool gates.
export const POST = withAuth(async (req, user) => {
  try {
    const raw = await req.clone().text();
    if (Buffer.byteLength(raw, 'utf8') > 64000) throw new SignalError(413, 'Keep analysis requests bounded to desk and source pointers.');
    const input = AnalysisRequestSchema.parse(JSON.parse(raw)); const desk = await signalStore.get(user.uid, input.deskId);
    if (desk.version !== input.expectedVersion) throw new SignalError(409, 'Desk changed. Reload before analysis.');
    validateAnalysisSource(desk, input.sourceRevisionId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof SignalError ? error.message : 'Check the analysis input and retry.' }, { status: error instanceof SignalError ? error.status : 422, headers: { 'Cache-Control': 'private, no-store' } });
  }
  return calibratedHandler(req);
});

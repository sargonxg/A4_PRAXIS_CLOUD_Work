import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withCalibration } from '@/lib/api/with-calibration';
import { analyzeSignalSource } from '@/lib/signal/analysis';
import { pointer } from '@/lib/signal/schema';
import { SignalError } from '@/lib/signal/domain';

export const runtime = 'nodejs';
export const maxDuration = 180;
// SIGNAL is the evidence-review surface of the existing calibrated media tool.
// It reuses its tool contract/credit operation; it is not a separate provider.
export const POST = withCalibration('media-compass', 'ai_media_compass', { blockOnThinContext: false })(async (req, ctx) => {
  try {
    const input = z.object({ action: z.literal('analyze').optional(), deskId: pointer, expectedVersion: z.number().int().positive(), sourceRevisionId: pointer, situationId: z.string().optional() }).strict().parse(await req.json());
    const desk = await analyzeSignalSource(ctx.uid, input.deskId, input.expectedVersion, input.sourceRevisionId, ctx.calibration.systemPromptBlock);
    return NextResponse.json({ desk }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof SignalError ? error.message : 'Check the analysis input and retry.' }, { status: error instanceof SignalError ? error.status : 422, headers: { 'Cache-Control': 'private, no-store' } });
  }
});

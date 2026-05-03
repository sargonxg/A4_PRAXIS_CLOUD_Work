import { NextResponse } from 'next/server';
import { withCalibration } from '@/lib/api/with-calibration';
import { extractSyriaDocumentsToHypotheses } from '@/lib/syria/extract';

export const runtime = 'nodejs';
export const maxDuration = 120;

export const POST = withCalibration('conflict_graph', 'ai_analysis', {
  situationId: (req) => new URL(req.url).pathname.split('/').at(-2),
})(async (request, ctx) => {
  const situationId = new URL(request.url).pathname.split('/').at(-2);
  if (!situationId) return NextResponse.json({ error: 'Missing situation id' }, { status: 400 });
  const summary = await extractSyriaDocumentsToHypotheses(ctx.uid, situationId);
  return NextResponse.json({ ok: true, ...summary, landingZone: 'hypotheses' });
});

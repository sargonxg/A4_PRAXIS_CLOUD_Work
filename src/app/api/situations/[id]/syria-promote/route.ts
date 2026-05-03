import { NextResponse } from 'next/server';
import { withCalibration } from '@/lib/api/with-calibration';
import { promoteSyriaHypotheses } from '@/lib/syria/extract';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const POST = withCalibration('graphops', 'ai_analysis', {
  situationId: (req) => new URL(req.url).pathname.split('/').at(-2),
})(async (request, ctx) => {
  const situationId = new URL(request.url).pathname.split('/').at(-2);
  if (!situationId) return NextResponse.json({ error: 'Missing situation id' }, { status: 400 });
  const body = await request.json().catch(() => ({})) as { limit?: number };
  const result = await promoteSyriaHypotheses(ctx.uid, situationId, body.limit);
  return NextResponse.json({ ok: true, ...result, canonicalGraphMutated: true });
});

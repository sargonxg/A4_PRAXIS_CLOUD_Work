import { NextResponse } from 'next/server';
import { aiActAcknowledgedAt, requireAiActAck } from '@/lib/api/with-ai-act-ack';
import { withCalibration } from '@/lib/api/with-calibration';

export const POST = withCalibration('sanctions-check', 'ai_sanctions_scan', { variant: 'oneshot' })(async (req: Request) => {
  const ack = requireAiActAck(req);
  if (ack) return ack;
  return NextResponse.json({
    verb: 'sanctions-check',
    aiActAcknowledgedAt: aiActAcknowledgedAt(req),
    result: 'Sanctions decision-support check accepted for analyst review.',
  });
});

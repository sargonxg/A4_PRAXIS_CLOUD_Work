import { NextResponse } from 'next/server';
import { aiActAcknowledgedAt, requireAiActAck } from '@/lib/api/with-ai-act-ack';
import { withCalibration } from '@/lib/api/with-calibration';

export const POST = withCalibration('legal-check', 'ai_legal_tracker', { variant: 'oneshot' })(async (req: Request) => {
  const ack = requireAiActAck(req);
  if (ack) return ack;
  return NextResponse.json({
    verb: 'legal-check',
    aiActAcknowledgedAt: aiActAcknowledgedAt(req),
    result: 'Legal decision-support check accepted for analyst review.',
  });
});

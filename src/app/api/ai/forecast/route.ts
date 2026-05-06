import { NextResponse } from 'next/server';
import { aiActAcknowledgedAt, requireAiActAck } from '@/lib/api/with-ai-act-ack';
import { withCalibration } from '@/lib/api/with-calibration';

export const POST = withCalibration('forecast', 'ai_analysis', { variant: 'oneshot' })(async (req: Request) => {
  const ack = requireAiActAck(req);
  if (ack) return ack;
  return NextResponse.json({
    verb: 'forecast',
    aiActAcknowledgedAt: aiActAcknowledgedAt(req),
    forecast: 'Decision-support forecast accepted for calibrated processing.',
  });
});

import { NextResponse } from 'next/server';
import { withCalibration } from '@/lib/api/with-calibration';

export const GET = withCalibration('boardroom', 'ai_brainstorming_table', { variant: 'agent' })(async (req: Request) => {
  const parts = new URL(req.url).pathname.split('/');
  const sessionId = parts[parts.length - 2] ?? 'unknown';
  return NextResponse.json({
    sessionId,
    turns: [
      { event: 'advisor.turn.complete', advisor: 'political', text: 'Political feasibility requires a narrow ask.' },
      { event: 'synthesis.complete', text: 'Open a 72-hour technical pause and verify source claims before public attribution.' },
    ],
  });
});

import { NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * Cron job: Check all active situations for alert conditions.
 * Runs every 6 hours via Vercel Cron (configured in vercel.json).
 * Secured by CRON_SECRET header.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // In production, this would:
    // 1. List all active situations from Firestore
    // 2. For each, fetch latest ACLED/GDELT data
    // 3. Compare against alert thresholds
    // 4. Generate notifications for users
    // 5. Send email digests if configured

    console.log('[cron] Alert check started at', new Date().toISOString());

    // Placeholder — returns success for now
    // Full implementation requires iterating all users' situations
    return NextResponse.json({
      checked: 0,
      alertsGenerated: 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron] Alert check failed:', err);
    return NextResponse.json({ error: 'Alert check failed' }, { status: 500 });
  }
}

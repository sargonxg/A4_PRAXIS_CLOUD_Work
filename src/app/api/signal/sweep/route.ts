import { NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api/cron-auth';
import { sweepSignalWatches } from '@/lib/signal/jobs';
export const runtime = 'nodejs';
export const maxDuration = 180;
export async function POST(request: Request) {
  const denied = requireCronSecret(request); if (denied) return denied;
  try { return NextResponse.json(await sweepSignalWatches()); } catch { return NextResponse.json({ error: 'Watch sweep failed; durable jobs remain available for recovery.' }, { status: 503 }); }
}

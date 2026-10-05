import { NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api/cron-auth';
import { refreshSignalWorld } from '@/lib/signal/world-service';

export const runtime = 'nodejs';
export const maxDuration = 180;

/** Shared public-source cache only. Never collects private desks or accepts evidence. */
export async function POST(request: Request) {
  const denied = requireCronSecret(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await refreshSignalWorld(), {
      headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return NextResponse.json({ error: 'World refresh is unavailable. The last collected snapshot is retained.' }, {
      status: 503, headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}

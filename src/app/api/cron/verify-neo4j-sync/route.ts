import { NextResponse } from 'next/server';
import { verifyNeo4jSync } from '@/lib/graph/neo4j-drift-verifier';

export const runtime = 'nodejs';
export const maxDuration = 300;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET ?? '';
  if (!secret) return false;
  const got = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace(/^bearer\s+/i, '') ?? '';
  return got === secret;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const production = url.searchParams.get('production') !== '0';
  const sampleSize = Number(url.searchParams.get('sampleSize') ?? '10');
  const thresholdPercent = Number(url.searchParams.get('thresholdPercent') ?? '0');
  const report = await verifyNeo4jSync({ production, sampleSize, thresholdPercent });

  return NextResponse.json(report, { status: report.status === 'drift' ? 409 : 200 });
}

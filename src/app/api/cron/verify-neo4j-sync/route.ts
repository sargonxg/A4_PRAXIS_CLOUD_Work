import { NextResponse } from 'next/server';
import { verifyNeo4jSync } from '@/lib/graph/neo4j-drift-verifier';
import { requireCronSecret } from '@/lib/api/cron-auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: Request) {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const production = url.searchParams.get('production') !== '0';
  const sampleSize = Number(url.searchParams.get('sampleSize') ?? '10');
  const thresholdPercent = Number(url.searchParams.get('thresholdPercent') ?? '0');
  const report = await verifyNeo4jSync({ production, sampleSize, thresholdPercent });

  return NextResponse.json(report, { status: report.status === 'drift' ? 409 : 200 });
}

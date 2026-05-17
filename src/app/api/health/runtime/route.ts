import { NextResponse } from 'next/server';
import { collectRuntimeHealth, sanitizeRuntimeHealth } from '@/lib/health/runtime-health';

export const runtime = 'nodejs';

export async function GET() {
  const report = await collectRuntimeHealth();
  return NextResponse.json(sanitizeRuntimeHealth(report));
}

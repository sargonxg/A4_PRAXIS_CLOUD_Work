import { NextResponse } from 'next/server';
import { collectRuntimeHealth, sanitizeRuntimeHealth } from '@/lib/health/runtime-health';

export const runtime = 'nodejs';

// This endpoint is part of frontend deploy proof: Cloud Run stamps the live
// revision metadata here so release, workflow, and canary checks can match production to main.
const RUNTIME_HEALTH_SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export async function GET() {
  const report = await collectRuntimeHealth();
  return NextResponse.json(sanitizeRuntimeHealth(report), {
    headers: RUNTIME_HEALTH_SECURITY_HEADERS,
  });
}

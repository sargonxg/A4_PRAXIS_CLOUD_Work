import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Production health check — used by uptime monitors (UptimeRobot, Vercel, etc.)
 * Returns 200 if all critical dependencies are reachable, 503 otherwise.
 */
export async function GET() {
  const checks: Record<string, 'ok' | 'error' | 'unconfigured'> = {};
  let healthy = true;

  // --- Firebase Admin SDK ---
  try {
    const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
    const db = getAdminDbOrThrow();
    // Light read to confirm connectivity — health collection, no user data
    await db.collection('_health').doc('ping').get();
    checks.firestore = 'ok';
  } catch {
    checks.firestore = 'error';
    healthy = false;
  }

  // --- AI Provider ---
  const hasGoogle = !!process.env.GOOGLE_AI_API_KEY;
  const hasVertex = !!process.env.GOOGLE_VERTEX_PROJECT;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (hasGoogle || hasVertex) {
    checks.ai_provider = 'ok';
  } else {
    checks.ai_provider = 'unconfigured';
    healthy = false;
  }

  // --- Optional integrations (warn but don't fail) ---
  checks.anthropic = hasAnthropic ? 'ok' : 'unconfigured';
  checks.firecrawl = process.env.FIRECRAWL_API_KEY ? 'ok' : 'unconfigured';
  checks.vertex_adk = process.env.VERTEX_AGENT_ENGINE_ID ? 'ok' : 'unconfigured';
  checks.stripe = (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) ? 'ok' : 'unconfigured';

  const status = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}

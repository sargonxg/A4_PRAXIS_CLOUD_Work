import { NextResponse } from 'next/server';
import { AI_REQUEST_LIMITS } from '@/lib/api/ai-request-limits';
import { resolveGenkitGoogleProvider } from '@/lib/genkit/provider';

const HEALTH_SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * GET /api/health
 * Production health check — used by uptime monitors (UptimeRobot, Cloud Run, etc.)
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
  const genkitProvider = resolveGenkitGoogleProvider();
  if (hasGoogle || hasVertex) {
    checks.ai_provider = 'ok';
  } else {
    checks.ai_provider = 'unconfigured';
    healthy = false;
  }

  // --- Cookie signing secret ---
  const hasCookieSecret = !!process.env.COOKIE_SIGNING_SECRET;
  checks.cookie_secret = hasCookieSecret ? 'ok' : 'error';
  if (!hasCookieSecret) healthy = false;

  // --- Optional integrations (warn but don't fail) ---
  checks.vertex_adk = process.env.VERTEX_AGENT_ENGINE_ID ? 'ok' : 'unconfigured';
  checks.cognee_memory = (process.env.COGNEE_ENABLED === 'true' && process.env.COGNEE_BACKEND_URL) ? 'ok' : 'unconfigured';
  checks.polar = (
    process.env.POLAR_ACCESS_TOKEN
    && process.env.POLAR_WEBHOOK_SECRET
    && process.env.POLAR_PRODUCT_ANALYST
    && process.env.POLAR_PRODUCT_TEAM
  ) ? 'ok' : 'unconfigured';

  const status = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      safeguards: {
        authenticatedRateLimitPerMinute: 100,
        aiRequestLimits: AI_REQUEST_LIMITS,
        highCostAiRoutesRequireAuth: true,
        calibratedAiRoutesStartToolRuns: true,
        genkitProvider: genkitProvider.kind,
        genkitLocation: genkitProvider.location,
        cogneeMemoryEnabled: process.env.COGNEE_ENABLED === 'true' && Boolean(process.env.COGNEE_BACKEND_URL),
        cogneeMode: process.env.COGNEE_MODE || 'disabled',
      },
    },
    { status, headers: HEALTH_SECURITY_HEADERS }
  );
}

/**
 * GET /api/health/diagnostics
 * Admin-only deep diagnostic endpoint for production debugging.
 * Protected by CRON_SECRET — not public.
 *
 * Returns full system state without exposing secret values.
 * Usage: curl -H "Authorization: Bearer $CRON_SECRET" https://praxis.tacitus.me/api/health/diagnostics
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Admin-only: require CRON_SECRET bearer token
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const diagnostics: Record<string, unknown> = {};

  // --- Firebase Admin SDK ---
  try {
    const { adminDb, adminAuth } = await import('@/lib/firebase/admin');
    diagnostics.firebase = {
      adminDbAvailable: adminDb !== null,
      adminAuthAvailable: adminAuth !== null,
    };
    if (adminDb) {
      try {
        await (adminDb as NonNullable<typeof adminDb>).collection('_health').doc('ping').get();
        diagnostics.firebase = { ...diagnostics.firebase as object, firestoreConnected: true };
      } catch (err) {
        diagnostics.firebase = {
          ...diagnostics.firebase as object,
          firestoreConnected: false,
          firestoreError: err instanceof Error ? err.message : String(err),
        };
      }
    }
  } catch (err) {
    diagnostics.firebase = {
      adminDbAvailable: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // --- AI Provider ---
  diagnostics.aiProvider = {
    googleAiKeySet: !!process.env.GOOGLE_AI_API_KEY,
    anthropicKeySet: !!process.env.ANTHROPIC_API_KEY,
    vertexProject: process.env.GOOGLE_VERTEX_PROJECT ?? null,
    aiProvider: process.env.AI_PROVIDER ?? 'google',
  };

  // --- Model configuration ---
  try {
    const { MODEL_NAMES } = await import('@/lib/ai/providers');
    diagnostics.models = MODEL_NAMES;
  } catch (err) {
    diagnostics.models = { error: err instanceof Error ? err.message : String(err) };
  }

  // --- AI route safeguards ---
  try {
    const { AI_REQUEST_LIMITS } = await import('@/lib/api/ai-request-limits');
    diagnostics.safeguards = {
      authenticatedRateLimitPerMinute: 100,
      aiRequestLimits: AI_REQUEST_LIMITS,
      calibratedAiRoutesStartToolRuns: true,
      malformedJsonRejectedBeforeCreditDeduction: true,
      oversizedRequestsRejectedBeforeCreditDeduction: true,
    };
  } catch (err) {
    diagnostics.safeguards = { error: err instanceof Error ? err.message : String(err) };
  }

  // --- Cookie / session secrets ---
  diagnostics.cookieSecret = {
    cookieSigningSecretSet: !!process.env.COOKIE_SIGNING_SECRET,
    sessionSecretSet: !!process.env.SESSION_SECRET,
    cronSecretSet: !!process.env.CRON_SECRET,
    activeSecretSource: process.env.COOKIE_SIGNING_SECRET
      ? 'COOKIE_SIGNING_SECRET'
      : 'missing (sessions fail closed)',
  };

  // --- Optional integrations ---
  diagnostics.integrations = {
    firecrawlSet: !!process.env.FIRECRAWL_API_KEY,
    vertexAgentEngineId: process.env.VERTEX_AGENT_ENGINE_ID ?? null,
    polarAccessTokenSet: !!process.env.POLAR_ACCESS_TOKEN,
    polarWebhookSecretSet: !!process.env.POLAR_WEBHOOK_SECRET,
    polarServer: process.env.POLAR_SERVER ?? 'production',
    resendSet: !!process.env.RESEND_API_KEY,
  };

  // --- Runtime ---
  diagnostics.runtime = {
    nodeVersion: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    gcpProject: process.env.GCP_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT ?? null,
    backendUrl: process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL ?? null,
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    diagnostics,
  });
}

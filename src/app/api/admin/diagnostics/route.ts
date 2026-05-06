import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { isAdminPrincipal } from '@/lib/auth/admin-gate';
import { adminDb } from '@/lib/firebase/admin';
import { resolveFeedCapabilities } from '@/lib/data-feeds/capabilities';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface Probe {
  id: string;
  label: string;
  status: 'ok' | 'degraded' | 'error' | 'unconfigured';
  detail?: string;
  latencyMs?: number;
}

async function probeFirestore(): Promise<Probe> {
  const start = Date.now();
  try {
    if (!adminDb) return { id: 'firestore', label: 'Firestore', status: 'error', detail: 'Admin SDK not initialised' };
    await adminDb.collection('users').limit(1).get();
    return { id: 'firestore', label: 'Firestore', status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return { id: 'firestore', label: 'Firestore', status: 'error', detail: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - start };
  }
}

function probeAIProviders(): Probe[] {
  const probes: Probe[] = [];
  const vertex = !!process.env.GOOGLE_VERTEX_PROJECT && (process.env.AI_PROVIDER ?? '').toLowerCase() === 'vertex';
  const google = !!process.env.GOOGLE_AI_API_KEY;

  probes.push({
    id: 'vertex',
    label: 'Vertex AI (ADC)',
    status: vertex ? 'ok' : 'unconfigured',
    detail: vertex ? `${process.env.GOOGLE_VERTEX_PROJECT} @ ${process.env.GOOGLE_VERTEX_LOCATION ?? 'us-central1'}` : 'AI_PROVIDER != vertex or GOOGLE_VERTEX_PROJECT missing',
  });
  probes.push({
    id: 'google_ai',
    label: 'Google AI (Gemini Studio)',
    status: google ? 'ok' : 'unconfigured',
    detail: google ? 'GOOGLE_AI_API_KEY set' : 'Fallback key not configured — relies on Vertex or user BYO',
  });
  return probes;
}

function probeSecretsEnv(): Probe[] {
  const required: Array<[string, string]> = [
    ['FIREBASE_SERVICE_ACCOUNT_KEY', 'Firebase Admin SA'],
    ['COOKIE_SIGNING_SECRET', 'Session cookie HMAC'],
    ['USER_KEY_MASTER', 'User API-key envelope master'],
    ['CRON_SECRET', 'Cron + admin endpoint auth'],
  ];
  return required.map(([envVar, label]) => ({
    id: envVar.toLowerCase(),
    label,
    status: (process.env[envVar] ?? '').length > 0 ? 'ok' : 'error',
    detail: (process.env[envVar] ?? '').length > 0 ? 'Present' : `ENV var ${envVar} is not set — configure Secret Manager mount`,
  }));
}

async function countRecentDocs(collection: string, maxLookup: number): Promise<number> {
  if (!adminDb) return -1;
  try {
    const snap = await adminDb.collection(collection).limit(maxLookup).get();
    return snap.size;
  } catch {
    return -1;
  }
}

async function sumRecentCreditsBurn(lookbackMs: number): Promise<{ burn: number; count: number }> {
  if (!adminDb) return { burn: 0, count: 0 };
  try {
    const cutoff = new Date(Date.now() - lookbackMs);
    const snap = await adminDb.collection('credit_transactions').where('createdAt', '>=', cutoff).limit(1000).get();
    let burn = 0;
    for (const doc of snap.docs) {
      const amount = Number((doc.data().amount as number) ?? 0);
      if (amount < 0) burn += -amount;
    }
    return { burn, count: snap.size };
  } catch {
    return { burn: 0, count: 0 };
  }
}

/**
 * GET /api/admin/diagnostics
 *
 * Admin-only: returns a multi-probe snapshot of platform health for the
 * diagnostics dashboard. Safe to poll every few seconds — heavy work is
 * bounded and each probe fails independently.
 */
export const GET = withAuth(async (_req, user) => {
  if (!isAdminPrincipal(user)) {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
  }

  const [firestoreProbe, capabilities, usersCount, situationsRecent, credits24h, credits7d] = await Promise.all([
    probeFirestore(),
    resolveFeedCapabilities(null), // platform-only view
    countRecentDocs('users', 500),
    countRecentDocs('users', 0).catch(() => -1), // placeholder — no cheap cross-user recent lookup without collectionGroup
    sumRecentCreditsBurn(24 * 60 * 60 * 1000),
    sumRecentCreditsBurn(7 * 24 * 60 * 60 * 1000),
  ]);

  const providerProbes = probeAIProviders();
  const secretProbes = probeSecretsEnv();

  return NextResponse.json({
    computedAt: new Date().toISOString(),
    probes: {
      storage: [firestoreProbe],
      ai: providerProbes,
      secrets: secretProbes,
    },
    feeds: capabilities,
    counters: {
      users_sampled: usersCount,
      situations_recent: situationsRecent,
      credits_burn_24h: credits24h,
      credits_burn_7d: credits7d,
    },
    runtime: {
      node: process.version,
      aiProvider: process.env.AI_PROVIDER ?? 'google',
      vertexProject: process.env.GOOGLE_VERTEX_PROJECT ?? null,
      region: process.env.GCP_REGION ?? null,
    },
  });
});

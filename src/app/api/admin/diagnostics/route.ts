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

interface OperationalPanel {
  id: string;
  label: string;
  status: Probe['status'];
  metric: string;
  detail: string;
  nextAction?: string;
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

function worstStatus(statuses: Probe['status'][]): Probe['status'] {
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('degraded')) return 'degraded';
  if (statuses.includes('unconfigured')) return 'unconfigured';
  return 'ok';
}

function buildOperationalPanels(input: {
  firestoreProbe: Probe;
  providerProbes: Probe[];
  secretProbes: Probe[];
  feedCoverageScore: number;
  availableProviderCount: number;
  credits24h: { burn: number; count: number };
  credits7d: { burn: number; count: number };
  usersCount: number;
}): OperationalPanel[] {
  const aiStatus = worstStatus(input.providerProbes.map((probe) => probe.status));
  const secretStatus = worstStatus(input.secretProbes.map((probe) => probe.status));
  const authStatus = input.usersCount >= 0 && secretStatus !== 'error' ? 'ok' : 'error';

  return [
    {
      id: 'tool-health',
      label: 'Tool Health',
      status: aiStatus === 'error' ? 'error' : 'ok',
      metric: aiStatus === 'ok' ? 'AI ready' : 'Fallback mode',
      detail: 'Marketplace foundation runs, AI provider posture, and tool artifact writes are checked separately.',
      nextAction: aiStatus === 'ok' ? undefined : 'Configure Vertex AI or Google AI fallback before broader canaries.',
    },
    {
      id: 'ingestion-pipeline',
      label: 'Ingestion Pipeline',
      status: input.firestoreProbe.status,
      metric: input.firestoreProbe.status === 'ok' ? `${input.firestoreProbe.latencyMs ?? 0}ms Firestore` : 'Storage blocked',
      detail: 'Uses Firestore reachability as the live foundation signal until scheduled ingestion aggregates land.',
      nextAction: 'Add P95 ingestion duration and awaiting-review counters from background jobs.',
    },
    {
      id: 'drift-verifier',
      label: 'Drift Verifier',
      status: input.firestoreProbe.status === 'ok' ? 'degraded' : input.firestoreProbe.status,
      metric: 'Neo4j/Postgres pending',
      detail: 'Verifier scripts exist; production Postgres cutover parity is still a charter gap.',
      nextAction: 'Publish Firestore, Neo4j, and Postgres parity snapshots after cutover.',
    },
    {
      id: 'context-health',
      label: 'Context Health',
      status: input.firestoreProbe.status === 'ok' ? 'degraded' : input.firestoreProbe.status,
      metric: 'Advisory runtime',
      detail: 'Context health is computed at request time and now feeds marketplace runs.',
      nextAction: 'Add nightly distribution aggregates by ontology and persona.',
    },
    {
      id: 'symbolic-firewall',
      label: 'Symbolic Firewall',
      status: 'degraded',
      metric: 'Advisory-first',
      detail: 'Current posture records warnings and tolerant artifacts instead of strict blocking for marketplace context.',
      nextAction: 'Add warning/rejection distribution by route, ontology, and user tier.',
    },
    {
      id: 'auth-abuse',
      label: 'Auth and Abuse',
      status: authStatus,
      metric: `${input.usersCount} users sampled`,
      detail: 'Admin allowlist, signed sessions, rate limiting, and secret presence are the live foundation signals.',
      nextAction: authStatus === 'ok' ? 'Add rate-limit aggregate and failed-auth trend.' : 'Fix required auth secrets.',
    },
    {
      id: 'cost-dashboard',
      label: 'Cost Dashboard',
      status: input.credits24h.count > 0 || input.credits7d.count > 0 ? 'ok' : 'degraded',
      metric: `${input.credits24h.burn} credits / 24h`,
      detail: `${input.credits7d.burn} credits burned across ${input.credits7d.count} transactions in 7d; ${input.availableProviderCount} feed providers active at ${input.feedCoverageScore}% coverage.`,
      nextAction: 'Join cost ledger to tool run aggregates and provider latency.',
    },
  ];
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
  const panels = buildOperationalPanels({
    firestoreProbe,
    providerProbes,
    secretProbes,
    feedCoverageScore: capabilities.coverageScore,
    availableProviderCount: capabilities.availableProviders.length,
    credits24h,
    credits7d,
    usersCount,
  });

  return NextResponse.json({
    computedAt: new Date().toISOString(),
    panels,
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

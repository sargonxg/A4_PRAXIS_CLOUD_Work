import type { Firestore, QuerySnapshot } from 'firebase-admin/firestore';

export type OperationalStatus = 'ok' | 'degraded' | 'error' | 'unconfigured';

export interface OperationalPanelMetric {
  id: string;
  label: string;
  status: OperationalStatus;
  metric: string;
  detail: string;
  nextAction?: string;
}

export interface OperationalMetricsSnapshot {
  schemaVersion: 'operational-metrics-v1';
  computedAt: string;
  windowHours: number;
  panels: OperationalPanelMetric[];
  aggregates: {
    toolRuns: {
      sampled: number;
      completed: number;
      failed: number;
      running: number;
      marketplaceArtifacts: number;
      failureRate: number;
      p95DurationMs: number | null;
    };
    ingestion: {
      sampled: number;
      completed: number;
      failed: number;
      pendingReview: number;
      p95DurationMs: number | null;
    };
    subagents: {
      sampled: number;
      completed: number;
      failed: number;
      running: number;
    };
    contextHealth: {
      sampled: number;
      average: number | null;
      lowCount: number;
      byOntology: Record<string, { sampled: number; average: number | null; lowCount: number }>;
    };
    firewall: {
      sampled: number;
      warn: number;
      rejected: number;
      byOntology: Record<string, { warn: number; rejected: number }>;
    };
    authAbuse: {
      sampled: number;
      rateLimited: number;
      authFailures: number;
    };
    cost: {
      creditsBurn24h: number;
      creditsBurn7d: number;
      transactions24h: number;
      transactions7d: number;
    };
  };
  queryErrors: Record<string, string | null>;
}

interface QueryResult {
  rows: Array<Record<string, unknown>>;
  error: string | null;
}

async function safeDocs(label: string, query: Promise<QuerySnapshot>): Promise<QueryResult> {
  try {
    const snap = await query;
    return { rows: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })), error: null };
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : String(err) };
  }
}

function statusOf(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function numberOf(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function durationMs(row: Record<string, unknown>): number | null {
  for (const key of ['durationMs', 'latencyMs', 'elapsedMs', 'runtimeMs']) {
    const value = numberOf(row[key]);
    if (value !== null && value >= 0) return value;
  }
  return null;
}

function p95(values: Array<number | null>): number | null {
  const sorted = values.filter((value): value is number => value !== null && Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function ontologyOf(row: Record<string, unknown>): string {
  for (const key of ['ontologyId', 'ontology', 'domain', 'caseOntology']) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return 'unknown';
}

function healthOf(row: Record<string, unknown>): number | null {
  for (const key of ['contextHealth', 'health', 'contextHealthScore']) {
    const value = numberOf(row[key]);
    if (value !== null) return value <= 1 ? Math.round(value * 100) : Math.round(value);
  }
  const nested = row.context;
  if (nested && typeof nested === 'object') {
    const value = numberOf((nested as Record<string, unknown>).health);
    if (value !== null) return value <= 1 ? Math.round(value * 100) : Math.round(value);
  }
  return null;
}

function moneyWindow(rows: Array<Record<string, unknown>>, maxAgeMs: number, now: Date): { burn: number; count: number } {
  const cutoff = now.getTime() - maxAgeMs;
  let burn = 0;
  let count = 0;
  for (const row of rows) {
    const created = millisOf(row.createdAt ?? row.at ?? row.updatedAt);
    if (created !== null && created < cutoff) continue;
    const amount = numberOf(row.amount) ?? 0;
    if (amount < 0) burn += -amount;
    count += 1;
  }
  return { burn, count };
}

function millisOf(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'object') {
    const candidate = value as { toDate?: () => Date; seconds?: number };
    if (typeof candidate.toDate === 'function') return candidate.toDate().getTime();
    if (typeof candidate.seconds === 'number') return candidate.seconds * 1000;
  }
  return null;
}

function panelStatus(input: { failed?: number; sampled?: number; degradedWhenEmpty?: boolean }): OperationalStatus {
  if ((input.failed ?? 0) > 0) return 'degraded';
  if ((input.sampled ?? 0) === 0 && input.degradedWhenEmpty) return 'degraded';
  return 'ok';
}

export function buildOperationalMetricsSnapshot(input: {
  now?: Date;
  windowHours?: number;
  toolRuns: Array<Record<string, unknown>>;
  marketplaceArtifacts: Array<Record<string, unknown>>;
  jobs: Array<Record<string, unknown>>;
  agentRuns: Array<Record<string, unknown>>;
  ingestions: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  credits: Array<Record<string, unknown>>;
  queryErrors?: Record<string, string | null>;
}): OperationalMetricsSnapshot {
  const now = input.now ?? new Date();
  const windowHours = input.windowHours ?? 24;
  const allToolRows = [...input.toolRuns, ...input.marketplaceArtifacts];
  const completedToolRuns = allToolRows.filter((row) => ['ok', 'complete', 'completed', 'success', 'succeeded'].includes(statusOf(row.status))).length;
  const failedToolRuns = allToolRows.filter((row) => ['fail', 'failed', 'error', 'errored'].includes(statusOf(row.status))).length;
  const runningToolRuns = allToolRows.filter((row) => ['queued', 'pending', 'running', 'processing'].includes(statusOf(row.status))).length;
  const completedIngestions = input.ingestions.filter((row) => ['ok', 'complete', 'completed', 'success', 'succeeded'].includes(statusOf(row.status))).length;
  const failedIngestions = input.ingestions.filter((row) => ['fail', 'failed', 'error', 'errored'].includes(statusOf(row.status))).length;
  const pendingReview = input.ingestions.filter((row) => ['pending_review', 'awaiting_review', 'staged', 'pending'].includes(statusOf(row.status))).length;
  const completedSubagents = input.agentRuns.filter((row) => ['ok', 'complete', 'completed', 'success', 'succeeded'].includes(statusOf(row.status))).length;
  const failedSubagents = input.agentRuns.filter((row) => ['fail', 'failed', 'error', 'errored'].includes(statusOf(row.status))).length;
  const runningSubagents = input.agentRuns.filter((row) => ['queued', 'pending', 'running', 'processing'].includes(statusOf(row.status))).length;

  const healthRows = allToolRows.map((row) => ({ row, health: healthOf(row) })).filter((item): item is { row: Record<string, unknown>; health: number } => item.health !== null);
  const healthByOntology: Record<string, { values: number[]; lowCount: number }> = {};
  for (const item of healthRows) {
    const ontology = ontologyOf(item.row);
    healthByOntology[ontology] ??= { values: [], lowCount: 0 };
    healthByOntology[ontology].values.push(item.health);
    if (item.health < 60) healthByOntology[ontology].lowCount += 1;
  }

  const firewallByOntology: Record<string, { warn: number; rejected: number }> = {};
  let firewallWarn = 0;
  let firewallRejected = 0;
  for (const row of [...allToolRows, ...input.events]) {
    const status = statusOf(row.firewallStatus ?? row.firewall?.toString?.() ?? row.status);
    const ontology = ontologyOf(row);
    firewallByOntology[ontology] ??= { warn: 0, rejected: 0 };
    if (status.includes('warn') || status.includes('advisory')) {
      firewallWarn += 1;
      firewallByOntology[ontology].warn += 1;
    }
    if (status.includes('reject') || status.includes('blocked')) {
      firewallRejected += 1;
      firewallByOntology[ontology].rejected += 1;
    }
  }

  const rateLimited = input.events.filter((row) => statusOf(row.status).includes('429') || statusOf(row.type).includes('rate')).length;
  const authFailures = input.events.filter((row) => {
    const status = statusOf(row.status);
    const type = statusOf(row.type);
    return status.includes('401') || status.includes('403') || type.includes('auth');
  }).length;
  const credits24h = moneyWindow(input.credits, 24 * 60 * 60 * 1000, now);
  const credits7d = moneyWindow(input.credits, 7 * 24 * 60 * 60 * 1000, now);

  const aggregates: OperationalMetricsSnapshot['aggregates'] = {
    toolRuns: {
      sampled: allToolRows.length,
      completed: completedToolRuns,
      failed: failedToolRuns,
      running: runningToolRuns,
      marketplaceArtifacts: input.marketplaceArtifacts.length,
      failureRate: allToolRows.length > 0 ? Math.round((failedToolRuns / allToolRows.length) * 1000) / 10 : 0,
      p95DurationMs: p95(allToolRows.map(durationMs)),
    },
    ingestion: {
      sampled: input.ingestions.length,
      completed: completedIngestions,
      failed: failedIngestions,
      pendingReview,
      p95DurationMs: p95(input.ingestions.map(durationMs)),
    },
    subagents: {
      sampled: input.agentRuns.length,
      completed: completedSubagents,
      failed: failedSubagents,
      running: runningSubagents,
    },
    contextHealth: {
      sampled: healthRows.length,
      average: average(healthRows.map((item) => item.health)),
      lowCount: healthRows.filter((item) => item.health < 60).length,
      byOntology: Object.fromEntries(Object.entries(healthByOntology).map(([ontology, bucket]) => [
        ontology,
        { sampled: bucket.values.length, average: average(bucket.values), lowCount: bucket.lowCount },
      ])),
    },
    firewall: {
      sampled: allToolRows.length + input.events.length,
      warn: firewallWarn,
      rejected: firewallRejected,
      byOntology: firewallByOntology,
    },
    authAbuse: {
      sampled: input.events.length,
      rateLimited,
      authFailures,
    },
    cost: {
      creditsBurn24h: credits24h.burn,
      creditsBurn7d: credits7d.burn,
      transactions24h: credits24h.count,
      transactions7d: credits7d.count,
    },
  };

  return {
    schemaVersion: 'operational-metrics-v1',
    computedAt: now.toISOString(),
    windowHours,
    panels: [
      {
        id: 'tool-health',
        label: 'Tool Health',
        status: panelStatus({ failed: aggregates.toolRuns.failed, sampled: aggregates.toolRuns.sampled, degradedWhenEmpty: true }),
        metric: `${aggregates.toolRuns.completed}/${aggregates.toolRuns.sampled} completed`,
        detail: `${aggregates.toolRuns.failed} failed, ${aggregates.toolRuns.running} running, ${aggregates.toolRuns.marketplaceArtifacts} marketplace artifacts sampled. P95 ${aggregates.toolRuns.p95DurationMs ?? 'n/a'}ms.`,
        nextAction: aggregates.toolRuns.failed > 0 ? 'Inspect failed tool runs in Operator Console.' : undefined,
      },
      {
        id: 'ingestion-pipeline',
        label: 'Ingestion Pipeline',
        status: panelStatus({ failed: aggregates.ingestion.failed, sampled: aggregates.ingestion.sampled, degradedWhenEmpty: true }),
        metric: `${aggregates.ingestion.pendingReview} awaiting review`,
        detail: `${aggregates.ingestion.completed}/${aggregates.ingestion.sampled} completed, ${aggregates.ingestion.failed} failed. P95 ${aggregates.ingestion.p95DurationMs ?? 'n/a'}ms.`,
        nextAction: aggregates.ingestion.pendingReview > 0 ? 'Review staged graph proposals and source ingestions.' : undefined,
      },
      {
        id: 'drift-verifier',
        label: 'Drift Verifier',
        status: 'degraded',
        metric: 'Parity snapshot required',
        detail: 'Operational metrics are live; Firestore/Postgres/Neo4j parity snapshots still need production cutover data.',
        nextAction: 'Write verifier results into operational metrics after Postgres cutover.',
      },
      {
        id: 'context-health',
        label: 'Context Health',
        status: aggregates.contextHealth.lowCount > 0 ? 'degraded' : panelStatus({ sampled: aggregates.contextHealth.sampled, degradedWhenEmpty: true }),
        metric: aggregates.contextHealth.average === null ? 'No samples' : `${aggregates.contextHealth.average}/100 average`,
        detail: `${aggregates.contextHealth.lowCount} low-health samples across ${Object.keys(aggregates.contextHealth.byOntology).length} ontology bucket(s).`,
        nextAction: aggregates.contextHealth.lowCount > 0 ? 'Prioritize context collection for low-health ontology buckets.' : undefined,
      },
      {
        id: 'symbolic-firewall',
        label: 'Symbolic Firewall',
        status: aggregates.firewall.rejected > 0 ? 'degraded' : 'ok',
        metric: `${aggregates.firewall.warn} warnings`,
        detail: `${aggregates.firewall.rejected} rejected/blocked events across ${Object.keys(aggregates.firewall.byOntology).length} ontology bucket(s). Advisory-first posture remains active.`,
        nextAction: aggregates.firewall.rejected > 0 ? 'Review blocked events and route copy before broad launch.' : undefined,
      },
      {
        id: 'auth-abuse',
        label: 'Auth and Abuse',
        status: aggregates.authAbuse.rateLimited > 0 || aggregates.authAbuse.authFailures > 0 ? 'degraded' : 'ok',
        metric: `${aggregates.authAbuse.rateLimited} rate-limited`,
        detail: `${aggregates.authAbuse.authFailures} auth failures sampled from ${aggregates.authAbuse.sampled} system events.`,
        nextAction: aggregates.authAbuse.rateLimited > 0 ? 'Check rate limit and suspicious-route logs.' : undefined,
      },
      {
        id: 'cost-dashboard',
        label: 'Cost Dashboard',
        status: 'ok',
        metric: `${aggregates.cost.creditsBurn24h} credits / 24h`,
        detail: `${aggregates.cost.creditsBurn7d} credits burned across ${aggregates.cost.transactions7d} transactions in 7d.`,
        nextAction: 'Join provider-level latency and external API cost once model handlers are live.',
      },
    ],
    aggregates,
    queryErrors: input.queryErrors ?? {},
  };
}

export async function collectOperationalMetrics(db: Firestore, now = new Date()): Promise<OperationalMetricsSnapshot> {
  const limit = 500;
  const [toolRuns, marketplaceArtifacts, jobs, agentRuns, ingestions, events, credits] = await Promise.all([
    safeDocs('tool_runs', db.collection('tool_runs').orderBy('startedAt', 'desc').limit(limit).get()),
    safeDocs('toolRunArtifacts', db.collectionGroup('toolRunArtifacts').orderBy('createdAt', 'desc').limit(limit).get()),
    safeDocs('background_jobs', db.collection('background_jobs').orderBy('updatedAt', 'desc').limit(limit).get()),
    safeDocs('agent_runs', db.collectionGroup('agent_runs').orderBy('lastActivityAt', 'desc').limit(limit).get()),
    safeDocs('data_ingestions', db.collection('data_ingestions').orderBy('createdAt', 'desc').limit(limit).get()),
    safeDocs('system_events', db.collection('system_events').orderBy('createdAt', 'desc').limit(limit).get()),
    safeDocs('credit_transactions', db.collection('credit_transactions').orderBy('createdAt', 'desc').limit(limit).get()),
  ]);

  return buildOperationalMetricsSnapshot({
    now,
    toolRuns: toolRuns.rows,
    marketplaceArtifacts: marketplaceArtifacts.rows,
    jobs: jobs.rows,
    agentRuns: agentRuns.rows,
    ingestions: ingestions.rows,
    events: events.rows,
    credits: credits.rows,
    queryErrors: {
      toolRuns: toolRuns.error,
      marketplaceArtifacts: marketplaceArtifacts.error,
      jobs: jobs.error,
      agentRuns: agentRuns.error,
      ingestions: ingestions.error,
      events: events.error,
      credits: credits.error,
    },
  });
}

export async function writeOperationalMetricsSnapshot(db: Firestore, snapshot: OperationalMetricsSnapshot): Promise<void> {
  await db.collection('operational_metrics').doc('latest').set(snapshot, { merge: true });
  await db.collection('operational_metrics_history').doc(snapshot.computedAt.replace(/[:.]/g, '-')).set(snapshot);
}

export async function readLatestOperationalMetrics(db: Firestore): Promise<OperationalMetricsSnapshot | null> {
  const doc = await db.collection('operational_metrics').doc('latest').get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data || data.schemaVersion !== 'operational-metrics-v1') return null;
  return data as OperationalMetricsSnapshot;
}

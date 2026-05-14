import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { isAdminPrincipal } from '@/lib/auth/admin-gate';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import type { ReadAuditEvent } from '@/lib/audit/read-ledger';
import { getSourcePostureMap } from '@/lib/sources/posture';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, user) => {
  if (!isAdminPrincipal(user)) {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters = {
    uid: clean(url.searchParams.get('uid')),
    situationId: clean(url.searchParams.get('situationId')),
    toolId: clean(url.searchParams.get('toolId')),
    from: clean(url.searchParams.get('from')),
    to: clean(url.searchParams.get('to')),
  };
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 100), 1), 250);
  const db = getAdminDbOrThrow();
  const snap = filters.uid
    ? await db.collection('users').doc(filters.uid).collection('audit').orderBy('createdAt', 'desc').limit(limit * 2).get()
    : await db.collectionGroup('audit').orderBy('createdAt', 'desc').limit(limit * 2).get();

  const events = snap.docs
    .map((doc) => ({ eventId: doc.id, ...doc.data() }) as ReadAuditEvent)
    .filter((event) => matches(event, filters))
    .slice(0, limit);

  const includeRollups = url.searchParams.get('rollups') === '1' || url.searchParams.get('aggregate') === '1';
  const sourcePostures = await getSourcePostureMap(events.flatMap((event) => event.sourceIds ?? []));
  return NextResponse.json({
    events,
    sourcePostures,
    filters,
    limit,
    ...(includeRollups ? { rollups: buildRollups(events) } : {}),
  });
});

function matches(event: ReadAuditEvent, filters: {
  uid?: string;
  situationId?: string;
  toolId?: string;
  from?: string;
  to?: string;
}) {
  if (filters.uid && event.uid !== filters.uid) return false;
  if (filters.situationId && event.situationId !== filters.situationId) return false;
  if (filters.toolId && event.toolId !== filters.toolId) return false;
  if (filters.from && event.createdAt < filters.from) return false;
  if (filters.to && event.createdAt > filters.to) return false;
  return true;
}

function clean(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function buildRollups(events: ReadAuditEvent[]) {
  return {
    costByUid: groupCost(events, (event) => event.uid),
    costByTool: groupCost(events, (event) => event.toolId),
    costBySituation: groupCost(events, (event) => event.situationId ?? 'none'),
    modelMix: countBy(events, (event) => event.model ?? 'unknown'),
    latencyByTool: groupLatency(events),
  };
}

function groupCost(events: ReadAuditEvent[], keyOf: (event: ReadAuditEvent) => string) {
  const out: Record<string, { total: number; costClass: Record<string, number> }> = {};
  for (const event of events) {
    const key = keyOf(event);
    out[key] ??= { total: 0, costClass: {} };
    out[key].total += 1;
    const costClass = normalizeCostClass(event.costClass);
    out[key].costClass[costClass] = (out[key].costClass[costClass] ?? 0) + 1;
  }
  return out;
}

function countBy(events: ReadAuditEvent[], keyOf: (event: ReadAuditEvent) => string) {
  const out: Record<string, number> = {};
  for (const event of events) {
    const key = keyOf(event);
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

function groupLatency(events: ReadAuditEvent[]) {
  const byTool = new Map<string, number[]>();
  for (const event of events) {
    if (typeof event.latencyMs !== 'number') continue;
    const list = byTool.get(event.toolId) ?? [];
    list.push(event.latencyMs);
    byTool.set(event.toolId, list);
  }
  const out: Record<string, { count: number; p50LatencyMs: number | null; p95LatencyMs: number | null }> = {};
  for (const [toolId, values] of byTool.entries()) {
    values.sort((a, b) => a - b);
    out[toolId] = {
      count: values.length,
      p50LatencyMs: percentile(values, 0.5),
      p95LatencyMs: percentile(values, 0.95),
    };
  }
  return out;
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const index = Math.min(values.length - 1, Math.max(0, Math.ceil(values.length * p) - 1));
  return values[index];
}

function normalizeCostClass(value: string | null): 'lo' | 'mid' | 'hi' {
  if (value === 'hi' || value === 'expensive' || value === 'high') return 'hi';
  if (value === 'mid' || value === 'medium' || value === 'standard') return 'mid';
  return 'lo';
}

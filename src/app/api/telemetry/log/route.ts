import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedUser } from '@/lib/api/with-auth';
import { emitTelemetry, emitTelemetrySafe } from '@/lib/telemetry/emit';
import { isBrowserTelemetryEventName } from '@/types/telemetry';

const WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 120;
const buckets = new Map<string, { count: number; resetAt: number }>();

function orgIdOf(user: AuthenticatedUser): string | null {
  return (user as AuthenticatedUser & { orgId?: string }).orgId ?? null;
}

function consume(uid: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(uid);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(uid, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_EVENTS_PER_WINDOW) return false;
  bucket.count += 1;
  return true;
}

export const POST = withAuth(async (req, user) => {
  if (!consume(user.uid)) {
    await emitTelemetrySafe({
      eventName: 'route.timeout',
      uid: user.uid,
      orgId: orgIdOf(user),
      route: '/api/telemetry/log',
      status: 'blocked',
      details: { reason: 'telemetry-rate-limit' },
    });
    return NextResponse.json({ ok: false, dropped: true }, { status: 202 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid telemetry body' }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  if (!isBrowserTelemetryEventName(payload.eventName)) {
    return NextResponse.json({ error: 'Unsupported browser telemetry event' }, { status: 400 });
  }

  try {
    emitTelemetry({
      eventName: payload.eventName,
      uid: user.uid,
      orgId: orgIdOf(user),
      caseId: typeof payload.caseId === 'string' ? payload.caseId : null,
      sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : null,
      route: typeof payload.route === 'string' ? payload.route : new URL(req.url).pathname,
      toolId: typeof payload.toolId === 'string' ? payload.toolId : null,
      latencyMs: typeof payload.latencyMs === 'number' ? payload.latencyMs : null,
      status: payload.status === 'fail' || payload.status === 'blocked' || payload.status === 'queued'
        ? payload.status
        : 'ok',
      details: payload.details && typeof payload.details === 'object'
        ? payload.details as Record<string, unknown>
        : {},
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid telemetry event' },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
});

import type { BrowserTelemetryEventName } from '@/types/telemetry';

export interface BrowserTelemetryInput {
  eventName: BrowserTelemetryEventName;
  caseId?: string | null;
  route?: string | null;
  toolId?: string | null;
  latencyMs?: number | null;
  status?: 'ok' | 'fail' | 'blocked' | 'queued';
  details?: Record<string, unknown>;
}

export function trackTelemetry(input: BrowserTelemetryInput): void {
  if (typeof window === 'undefined') return;
  const payload = {
    ...input,
    route: input.route ?? window.location.pathname,
    sessionId: window.sessionStorage.getItem('praxis.sessionId') ?? ensureSessionId(),
  };
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/telemetry/log', new Blob([body], { type: 'application/json' }));
    return;
  }
  void fetch('/api/telemetry/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
}

function ensureSessionId(): string {
  const key = 'praxis.sessionId';
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  window.sessionStorage.setItem(key, generated);
  return generated;
}

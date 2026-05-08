export const TELEMETRY_SCHEMA_VERSION = 1;

export const TELEMETRY_EVENT_NAMES = [
  'session.start',
  'user.onboarding-complete',
  'case.create',
  'case.delete',
  'chapter.open',
  'tab.open',
  'tool.run-start',
  'tool.run-complete',
  'tool.run-fail',
  'calibration.snapshot-built',
  'calibration.refusal',
  'calibration.force-run',
  'document.upload-start',
  'document.upload-complete',
  'document.upload-fail',
  'graph.populate-start',
  'graph.populate-complete',
  'graph.populate-fail',
  'memo.save',
  'memo.export',
  'route.timeout',
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENT_NAMES)[number];

export const BROWSER_TELEMETRY_EVENT_NAMES = [
  'session.start',
  'user.onboarding-complete',
  'chapter.open',
  'tab.open',
  'memo.save',
  'memo.export',
] as const satisfies readonly TelemetryEventName[];

export type BrowserTelemetryEventName = (typeof BROWSER_TELEMETRY_EVENT_NAMES)[number];

export interface TelemetryEnvelope {
  schemaVersion: typeof TELEMETRY_SCHEMA_VERSION;
  eventName: TelemetryEventName;
  uid: string;
  orgId: string | null;
  caseId: string | null;
  sessionId: string | null;
  route: string | null;
  toolId: string | null;
  latencyMs: number | null;
  status: 'ok' | 'fail' | 'blocked' | 'queued';
  costUsd: number | null;
  createdAt: string;
  details: Record<string, unknown>;
}

export interface TelemetryInput {
  eventName: TelemetryEventName;
  uid: string;
  orgId?: string | null;
  caseId?: string | null;
  sessionId?: string | null;
  route?: string | null;
  toolId?: string | null;
  latencyMs?: number | null;
  status?: TelemetryEnvelope['status'];
  costUsd?: number | null;
  createdAt?: string;
  details?: Record<string, unknown>;
}

const eventNames = new Set<string>(TELEMETRY_EVENT_NAMES);
const browserEventNames = new Set<string>(BROWSER_TELEMETRY_EVENT_NAMES);

export function isTelemetryEventName(value: unknown): value is TelemetryEventName {
  return typeof value === 'string' && eventNames.has(value);
}

export function isBrowserTelemetryEventName(value: unknown): value is BrowserTelemetryEventName {
  return typeof value === 'string' && browserEventNames.has(value);
}

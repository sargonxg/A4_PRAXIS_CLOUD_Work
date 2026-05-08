import {
  TELEMETRY_SCHEMA_VERSION,
  isTelemetryEventName,
  type TelemetryEnvelope,
  type TelemetryInput,
} from '@/types/telemetry';

export const TELEMETRY_DETAILS_MAX_BYTES = 1024;

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function normalizeTelemetry(input: TelemetryInput): TelemetryEnvelope {
  if (!isTelemetryEventName(input.eventName)) {
    throw new Error(`Unsupported telemetry event: ${String(input.eventName)}`);
  }

  const details = input.details ?? {};
  const encodedDetails = JSON.stringify(details);
  if (byteLength(encodedDetails) > TELEMETRY_DETAILS_MAX_BYTES) {
    throw new Error(
      `Telemetry details exceed ${TELEMETRY_DETAILS_MAX_BYTES} bytes for ${input.eventName}`,
    );
  }

  return {
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    eventName: input.eventName,
    uid: input.uid,
    orgId: input.orgId ?? null,
    caseId: input.caseId ?? null,
    sessionId: input.sessionId ?? null,
    route: input.route ?? null,
    toolId: input.toolId ?? null,
    latencyMs: input.latencyMs ?? null,
    status: input.status ?? 'ok',
    costUsd: input.costUsd ?? null,
    createdAt: input.createdAt ?? new Date().toISOString(),
    details,
  };
}

export function emitTelemetry(input: TelemetryInput): TelemetryEnvelope {
  const event = normalizeTelemetry(input);
  console.log(JSON.stringify({
    message: `praxis.telemetry.${event.eventName}`,
    telemetry: event,
    ...event,
  }));
  return event;
}

export async function emitTelemetrySafe(input: TelemetryInput): Promise<TelemetryEnvelope | null> {
  try {
    return emitTelemetry(input);
  } catch (err) {
    console.warn('[telemetry] dropped invalid event:', err instanceof Error ? err.message : err);
    return null;
  }
}

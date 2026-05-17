import { randomUUID } from 'node:crypto';
import { publishPubSubJson } from '@/lib/events/pubsub';

export type PraxisEventType =
  | 'agent_run.created'
  | 'agent_run.dispatched'
  | 'agent_run.running'
  | 'agent_run.completed'
  | 'agent_run.failed'
  | 'context_package.created'
  | 'source.updated';

export type PraxisEventSource =
  | 'frontend'
  | 'backend'
  | 'worker'
  | 'cron'
  | 'agent';

export type PraxisEventInput = {
  eventType: PraxisEventType;
  ownerUid?: string | null;
  capsuleId?: string | null;
  runId?: string | null;
  traceId?: string | null;
  source: PraxisEventSource;
  data?: Record<string, unknown>;
};

export type PraxisEventEnvelope = PraxisEventInput & {
  eventId: string;
  occurredAt: string;
  schemaVersion: 1;
};

export const PRAXIS_EVENTS_TOPIC = process.env.PRAXIS_EVENTS_TOPIC || 'praxis.events';

export function buildPraxisEvent(input: PraxisEventInput): PraxisEventEnvelope {
  return {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    schemaVersion: 1,
    ...input,
    ownerUid: input.ownerUid ?? null,
    capsuleId: input.capsuleId ?? null,
    runId: input.runId ?? null,
    traceId: input.traceId ?? null,
    data: input.data ?? {},
  };
}

export async function publishPraxisEvent(input: PraxisEventInput): Promise<boolean> {
  const event = buildPraxisEvent(input);
  return publishPubSubJson({
    topicName: PRAXIS_EVENTS_TOPIC,
    payload: event,
    attributes: {
      eventType: event.eventType,
      ownerUid: event.ownerUid,
      capsuleId: event.capsuleId,
      runId: event.runId,
      traceId: event.traceId,
      source: event.source,
      schemaVersion: String(event.schemaVersion),
    },
    logPrefix: 'praxis-events',
  });
}

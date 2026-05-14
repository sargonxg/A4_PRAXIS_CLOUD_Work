import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export type AuditEventStatus = 'ok' | 'error';

export interface ReadAuditEventInput {
  uid: string;
  situationId?: string | null;
  capsuleId?: string | null;
  threadId?: string | null;
  toolId: string;
  sourceIds?: string[];
  model?: string | null;
  latencyMs?: number | null;
  status: AuditEventStatus;
  costClass?: string | null;
  createdAt?: string;
}

export interface ReadAuditEvent extends Required<Omit<ReadAuditEventInput, 'createdAt' | 'situationId' | 'capsuleId' | 'threadId' | 'model' | 'latencyMs' | 'costClass'>> {
  eventId: string;
  situationId: string | null;
  capsuleId: string | null;
  threadId: string | null;
  model: string | null;
  latencyMs: number | null;
  costClass: string | null;
  createdAt: string;
}

export async function writeReadAuditEvent(
  input: ReadAuditEventInput,
  db: Firestore = getAdminDbOrThrow(),
): Promise<ReadAuditEvent> {
  const event = buildReadAuditEvent(input);
  await db.collection('users').doc(event.uid).collection('audit').doc(event.eventId).set({
    ...event,
    createdAtServer: FieldValue.serverTimestamp(),
  });
  return event;
}

export async function writeReadAuditEvents(
  events: ReadAuditEventInput[],
  db: Firestore = getAdminDbOrThrow(),
): Promise<ReadAuditEvent[]> {
  if (events.length === 0) return [];
  const batch = db.batch();
  const records = events.map(buildReadAuditEvent);
  for (const event of records) {
    batch.set(db.collection('users').doc(event.uid).collection('audit').doc(event.eventId), {
      ...event,
      createdAtServer: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  return records;
}

export function buildReadAuditEvent(input: ReadAuditEventInput): ReadAuditEvent {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return {
    eventId: `evt-${Date.parse(createdAt).toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    uid: input.uid,
    situationId: input.situationId ?? null,
    capsuleId: input.capsuleId ?? null,
    threadId: input.threadId ?? null,
    toolId: input.toolId,
    sourceIds: Array.isArray(input.sourceIds) ? input.sourceIds.filter((id) => typeof id === 'string' && id.trim()) : [],
    model: input.model ?? null,
    latencyMs: typeof input.latencyMs === 'number' ? Math.max(0, Math.round(input.latencyMs)) : null,
    status: input.status,
    costClass: input.costClass ?? null,
    createdAt,
  };
}

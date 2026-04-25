/**
 * System event + notification emitter.
 *
 * `system_events` is the append-only firehose every PRAXIS component writes
 * to. The activity feed, admin console, and alert pipelines are derived
 * from it. `notifications` are the user-visible subset.
 */
import { Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import type { Semaphore } from '@/lib/jobs/job-service';

const TTL_DAYS = { system_events: 365, notifications: 180 } as const;
const ttl = (days: number) => Timestamp.fromMillis(Date.now() + days * 86_400_000);

export type SystemEventKind =
  | 'situation.created' | 'situation.updated' | 'situation.escalated'
  | 'tool.started' | 'tool.completed' | 'tool.failed'
  | 'job.queued' | 'job.completed' | 'job.failed' | 'job.dead_letter'
  | 'data.ingested' | 'data.duplicate_skipped'
  | 'graph.updated' | 'alert.raised'
  | 'index.missing' | 'auth.denied' | 'config.missing';

export type Severity = 'info' | 'warn' | 'error' | 'critical';

export type EventSource = 'frontend' | 'backend' | 'worker' | 'function' | 'agent' | 'cron';

export async function emitSystemEvent(input: {
  kind: SystemEventKind;
  severity: Severity;
  uid?: string | null;
  situationId?: string | null;
  jobId?: string | null;
  toolRunId?: string | null;
  message: string;
  data?: Record<string, unknown>;
  source: EventSource;
  serviceAccount?: string;
}): Promise<string> {
  const db = getAdminDbOrThrow();
  const eventId = randomUUID();
  await db.collection('system_events').doc(eventId).set({
    eventId,
    kind: input.kind,
    severity: input.severity,
    uid: input.uid ?? null,
    situationId: input.situationId ?? null,
    jobId: input.jobId ?? null,
    toolRunId: input.toolRunId ?? null,
    message: input.message,
    data: input.data ?? {},
    source: input.source,
    serviceAccount: input.serviceAccount ?? process.env.K_SERVICE ?? 'unknown',
    createdAt: Timestamp.now(),
    expiresAt: ttl(TTL_DAYS.system_events),
  });
  return eventId;
}

export type NotificationKind =
  | 'situation.update' | 'data.found' | 'analysis.completed'
  | 'monitor.change_detected' | 'action.required'
  | 'data.ingest_failed' | 'config.missing' | 'tool.warning'
  | 'situation.escalation_risk' | 'monitor.no_change';

export async function emitNotification(input: {
  uid: string;
  kind: NotificationKind;
  semaphore: Semaphore;
  title: string;
  body: string;
  situationId?: string;
  toolRunId?: string;
  jobId?: string;
  actionUrl?: string;
  actions?: { label: string; kind: 'primary' | 'secondary'; href: string }[];
}): Promise<string> {
  const db = getAdminDbOrThrow();
  const notificationId = randomUUID();
  await db
    .collection('users').doc(input.uid)
    .collection('notifications').doc(notificationId)
    .set({
      notificationId,
      kind: input.kind,
      semaphore: input.semaphore,
      title: input.title,
      body: input.body,
      situationId: input.situationId ?? null,
      toolRunId: input.toolRunId ?? null,
      jobId: input.jobId ?? null,
      actionUrl: input.actionUrl ?? null,
      actions: input.actions ?? [],
      read: false,
      archived: false,
      createdAt: Timestamp.now(),
      readAt: null,
      expiresAt: ttl(TTL_DAYS.notifications),
    });
  return notificationId;
}

/**
 * Job + tool-run lifecycle helpers.
 *
 * Every async unit of work in PRAXIS — AI tool calls, pipeline runs, GDELT
 * polls, agent sessions — gets a row in `tool_runs` (per AI/tool action) and
 * `background_jobs` (per worker/function/cron unit). Both surface to the user
 * via the activity feed and inform the semaphore status indicator.
 *
 * Idempotency: callers pass an `idempotencyKey`. If a tool_run already exists
 * with that key in a non-terminal state, we return the existing run instead
 * of creating a duplicate. This is the only thing that prevents double credit
 * deduction when Eventarc redelivers.
 */
import { Timestamp } from 'firebase-admin/firestore';
import { createHash, randomUUID } from 'node:crypto';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export type Semaphore = 'grey' | 'blue' | 'purple' | 'yellow' | 'green' | 'red';

export type ToolRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'dead_letter';

// Retention windows — paired with Firestore TTL policies in
// infrastructure/setup-ttl.sh. Tweak per-collection here if compliance changes.
const TTL_DAYS = {
  tool_runs: 365,
  background_jobs: 90,
} as const;

function ttlTimestamp(days: number): Timestamp {
  return Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000);
}

export interface ToolRun {
  toolRunId: string;
  uid: string;
  situationId: string | null;
  toolId: string;
  variant: 'oneshot' | 'streaming' | 'agent';
  idempotencyKey: string;
  status: ToolRunStatus;
  semaphore: Semaphore;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  durationMs: number | null;
  model: string | null;
  promptVersion: string | null;
  profileVersion: number | null;
  creditsDeducted: number;
  inputTokens: number;
  outputTokens: number;
  outputDocPath: string | null;
  graphUpdateIds: string[];
  error: { code: string; message: string } | null;
  retryCount: number;
  parentJobId: string | null;
  triggeredBy: 'user' | 'system' | 'cron' | 'eventarc' | 'agent';
}

export function buildIdempotencyKey(parts: {
  uid: string;
  situationId?: string | null;
  toolId: string;
  trigger: string;
  payload?: unknown;
}): string {
  const payloadHash = createHash('sha256')
    .update(JSON.stringify(parts.payload ?? null))
    .digest('hex')
    .slice(0, 16);
  return [
    parts.uid,
    parts.situationId ?? '_',
    parts.toolId,
    parts.trigger,
    payloadHash,
  ].join(':');
}

function semaphoreForToolRun(status: ToolRunStatus, variant: ToolRun['variant']): Semaphore {
  if (status === 'completed') return 'green';
  if (status === 'failed') return 'red';
  if (status === 'cancelled') return 'grey';
  if (status === 'queued') return 'blue';
  // running
  return variant === 'agent' ? 'purple' : 'yellow';
}

/**
 * Create or look up a tool_run by idempotency key. Returns `{ run, created }`.
 * If `created === false`, caller should NOT charge credits or run AI again —
 * a previous trigger already did the work (or is doing it).
 */
export async function startToolRun(input: {
  uid: string;
  situationId: string | null;
  toolId: string;
  variant: ToolRun['variant'];
  idempotencyKey: string;
  triggeredBy: ToolRun['triggeredBy'];
  parentJobId?: string | null;
  model?: string;
  promptVersion?: string;
  profileVersion?: number;
}): Promise<{ run: ToolRun; created: boolean }> {
  const db = getAdminDbOrThrow();
  const col = db.collection('tool_runs');

  // Look up existing
  const existing = await col
    .where('idempotencyKey', '==', input.idempotencyKey)
    .limit(1)
    .get();
  if (!existing.empty) {
    return { run: existing.docs[0].data() as ToolRun, created: false };
  }

  const toolRunId = randomUUID();
  const now = Timestamp.now();
  const run: ToolRun = {
    toolRunId,
    uid: input.uid,
    situationId: input.situationId,
    toolId: input.toolId,
    variant: input.variant,
    idempotencyKey: input.idempotencyKey,
    status: 'running',
    semaphore: semaphoreForToolRun('running', input.variant),
    startedAt: now,
    completedAt: null,
    durationMs: null,
    model: input.model ?? null,
    promptVersion: input.promptVersion ?? null,
    profileVersion: input.profileVersion ?? null,
    creditsDeducted: 0,
    inputTokens: 0,
    outputTokens: 0,
    outputDocPath: null,
    graphUpdateIds: [],
    error: null,
    retryCount: 0,
    parentJobId: input.parentJobId ?? null,
    triggeredBy: input.triggeredBy,
  };
  await col.doc(toolRunId).set({ ...run, expiresAt: ttlTimestamp(TTL_DAYS.tool_runs) });
  return { run, created: true };
}

export async function completeToolRun(
  toolRunId: string,
  result: {
    outputDocPath?: string;
    creditsDeducted?: number;
    inputTokens?: number;
    outputTokens?: number;
    graphUpdateIds?: string[];
  } = {},
): Promise<void> {
  const db = getAdminDbOrThrow();
  const ref = db.collection('tool_runs').doc(toolRunId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const run = snap.data() as ToolRun;
  const completedAt = Timestamp.now();
  const durationMs = completedAt.toMillis() - run.startedAt.toMillis();
  await ref.update({
    status: 'completed',
    semaphore: 'green',
    completedAt,
    durationMs,
    outputDocPath: result.outputDocPath ?? run.outputDocPath,
    creditsDeducted: result.creditsDeducted ?? run.creditsDeducted,
    inputTokens: result.inputTokens ?? run.inputTokens,
    outputTokens: result.outputTokens ?? run.outputTokens,
    graphUpdateIds: result.graphUpdateIds ?? run.graphUpdateIds,
  });
}

export async function failToolRun(
  toolRunId: string,
  error: { code: string; message: string },
): Promise<void> {
  const db = getAdminDbOrThrow();
  const ref = db.collection('tool_runs').doc(toolRunId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const run = snap.data() as ToolRun;
  const completedAt = Timestamp.now();
  await ref.update({
    status: 'failed',
    semaphore: 'red',
    completedAt,
    durationMs: completedAt.toMillis() - run.startedAt.toMillis(),
    error,
  });
}

/**
 * Background job lifecycle (worker pool / function / cron).
 * Same idempotency contract as tool_runs. `lockedBy` + `lockedUntil` allow
 * multiple workers to claim safely (compare-and-swap pattern).
 */
export interface BackgroundJob {
  jobId: string;
  uid: string | null;
  kind: string;
  status: JobStatus;
  semaphore: Semaphore;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  attempt: number;
  maxAttempts: number;
  nextRunAt: Timestamp | null;
  lockedBy: string | null;
  lockedUntil: Timestamp | null;
  progress: { percent: number; message: string } | null;
  result: Record<string, unknown> | null;
  error: { code: string; message: string } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
  parentEventId: string | null;
}

export async function createJob(input: {
  uid: string | null;
  kind: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  maxAttempts?: number;
  parentEventId?: string;
}): Promise<{ job: BackgroundJob; created: boolean }> {
  const db = getAdminDbOrThrow();
  const col = db.collection('background_jobs');

  const existing = await col
    .where('idempotencyKey', '==', input.idempotencyKey)
    .limit(1)
    .get();
  if (!existing.empty) {
    return { job: existing.docs[0].data() as BackgroundJob, created: false };
  }

  const jobId = randomUUID();
  const now = Timestamp.now();
  const job: BackgroundJob = {
    jobId,
    uid: input.uid,
    kind: input.kind,
    status: 'queued',
    semaphore: 'blue',
    payload: input.payload,
    idempotencyKey: input.idempotencyKey,
    attempt: 0,
    maxAttempts: input.maxAttempts ?? 5,
    nextRunAt: now,
    lockedBy: null,
    lockedUntil: null,
    progress: null,
    result: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    parentEventId: input.parentEventId ?? null,
  };
  await col.doc(jobId).set({ ...job, expiresAt: ttlTimestamp(TTL_DAYS.background_jobs) });
  return { job, created: true };
}

export async function updateJobProgress(
  jobId: string,
  progress: { percent: number; message: string },
): Promise<void> {
  const db = getAdminDbOrThrow();
  await db.collection('background_jobs').doc(jobId).update({
    status: 'running',
    semaphore: progress.message.toLowerCase().includes('reasoning') ? 'purple' : 'yellow',
    progress,
    updatedAt: Timestamp.now(),
  });
}

export async function completeJob(
  jobId: string,
  result: Record<string, unknown> = {},
): Promise<void> {
  const db = getAdminDbOrThrow();
  await db.collection('background_jobs').doc(jobId).update({
    status: 'completed',
    semaphore: 'green',
    result,
    completedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function failJob(
  jobId: string,
  error: { code: string; message: string },
  opts: { retryDelaySeconds?: number } = {},
): Promise<void> {
  const db = getAdminDbOrThrow();
  const ref = db.collection('background_jobs').doc(jobId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const job = snap.data() as BackgroundJob;
  const attempt = job.attempt + 1;
  const exhausted = attempt >= job.maxAttempts;
  const now = Timestamp.now();
  const nextRunAt = exhausted
    ? null
    : Timestamp.fromMillis(now.toMillis() + (opts.retryDelaySeconds ?? 60) * 1000);
  await ref.update({
    status: exhausted ? 'dead_letter' : 'queued',
    semaphore: exhausted ? 'red' : 'yellow',
    error,
    attempt,
    nextRunAt,
    updatedAt: now,
  });
}

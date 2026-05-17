# PRAXIS Operational Spine

> Version 1.0 — 2026-04-25
> Status: shipped (foundational patches in v6.4.0)
> Owners: Backend / Platform

This doc is the second-most important architectural doc in the repo, after
`CONTEXT_INJECTION.md`. **Read this before adding any new trigger, agent,
worker, or tool.** Every async unit of work in PRAXIS lives in the spine.

## Purpose

PRAXIS is a multi-component distributed system: Next.js frontend, Python
FastAPI backend, Cloud Run worker pools, Cloud Functions v2, Vertex AI Agent
Engine, Cloud Scheduler, Eventarc triggers. Without a unified observability
and lifecycle layer, debugging "why didn't that grounded search poll fire?" or "why is
this user's dashboard showing stale data?" is a log-spelunking exercise.

The spine fixes that with three append-only collections, one user-scoped
notifications collection, and one shared status language.

## The four collections

### `tool_runs/{toolRunId}` (TTL: 365d)

One row per AI/tool call. Created automatically by `withCalibration()` for
every authenticated AI route. Demo-mode calls do not create rows.

```ts
{
  toolRunId: string                    // ULID
  uid: string                          // owner
  situationId: string | null
  toolId: string                       // matches tool-registry
  variant: 'oneshot' | 'streaming' | 'agent'
  idempotencyKey: string               // sha256(uid:sit:tool:trigger:payload)
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  semaphore: 'grey'|'blue'|'purple'|'yellow'|'green'|'red'
  startedAt, completedAt, durationMs
  model, promptVersion, profileVersion
  creditsDeducted, inputTokens, outputTokens
  outputDocPath: string | null         // path of the canonical tool output
  graphUpdateIds: string[]             // refs into graph_updates
  error: { code, message } | null
  triggeredBy: 'user' | 'system' | 'cron' | 'eventarc' | 'agent'
}
```

### `background_jobs/{jobId}` (TTL: 90d)

One row per worker-pool / function / cron unit of work. The unit that an
operator can retry, cancel, or watch progress on.

```ts
{
  jobId, uid, kind                     // 'search.refresh' | 'pipeline.run' | ...
  status: 'queued'|'running'|'completed'|'failed'|'dead_letter'
  semaphore
  payload: Record<string, unknown>
  idempotencyKey
  attempt, maxAttempts                 // dead-letter when attempt >= max
  nextRunAt                            // for scheduled retries
  lockedBy, lockedUntil                // CAS lock for multi-worker safety
  progress: { percent, message } | null
  result, error
  createdAt, updatedAt, completedAt
  parentEventId
}
```

### `system_events/{eventId}` (TTL: 365d)

Append-only firehose. Every component writes here. Operators query by
`severity`, `source`, `kind`, or time range. Never updated, never deleted
(until TTL).

```ts
{
  eventId
  kind: 'situation.created' | 'tool.completed' | 'job.dead_letter' | ...
  severity: 'info' | 'warn' | 'error' | 'critical'
  uid: string | null                   // null = platform event
  situationId, jobId, toolRunId        // optional links
  message, data
  source: 'frontend'|'backend'|'worker'|'function'|'agent'|'cron'
  serviceAccount                       // who emitted
  createdAt
}
```

### `users/{uid}/notifications/{id}` (TTL: 180d)

User-visible subset. Has a deep link, a semaphore color, and read/archived
state the user can flip from the UI.

## Status semaphore — single language

| Color | State | When |
|-------|-------|------|
| `grey` | inactive | Not started, draft, idle |
| `blue` | scheduled | Queued, awaiting trigger |
| `purple` | reasoning | AI / agent thinking |
| `yellow` | waiting | External API / index building / partial |
| `green` | success | Completed cleanly |
| `red` | failure | Operator or user attention required |

Render via `<SemaphoreChip />` in `src/components/app/semaphore-chip.tsx`.
Resolve from any state via `semaphoreFromJob()` / `semaphoreForToolRun()` in
`src/lib/jobs/job-service.ts`.

## API contract

### TypeScript (frontend AI routes)

```ts
import { startToolRun, completeToolRun, failToolRun, buildIdempotencyKey }
  from '@/lib/jobs/job-service';
import { emitSystemEvent, emitNotification }
  from '@/lib/events/event-service';
```

`withCalibration(toolId, creditOp)` already wires `tool_runs` automatically.
You do NOT need to call `startToolRun` manually inside a route. It is exposed
for cases where the run is created outside an HTTP handler (e.g. a backend
agent triggered by Pub/Sub).

### Python (workers + functions)

```python
from _shared.spine import (
    build_idempotency_key, create_or_get_job, complete_job, fail_job,
    emit_system_event, emit_notification,
)
```

`_shared` is vendored next to each function/worker source dir at deploy time
by `cloudbuild.yaml` (build) and `infrastructure/setup-gcp.sh` (manual).

## Idempotency contract

Every Eventarc-triggered or Pub/Sub-triggered piece of work MUST:

1. Compute `idempotencyKey = uid:situation:tool:trigger:sha256(payload)[:16]`.
2. Call `create_or_get_job` (or `startToolRun`).
3. If `created == False`, log "duplicate trigger — skipping" and return.
4. Otherwise execute the work and call `complete_job` / `fail_job`.

Trigger redelivery is the default Eventarc behaviour on transient backend
errors. Without idempotency, the second delivery double-charges credits and
double-writes graph state.

## IAM model

| Service | Service account | Roles |
|---------|----------------|-------|
| `praxis-frontend` (Cloud Run) | `praxis-frontend-sa` | datastore.user, aiplatform.user, secretmanager.secretAccessor, run.invoker (on backend) |
| `praxis-backend` (Cloud Run) | `praxis-backend-sa` | datastore.user, aiplatform.user, bigquery.dataEditor, pubsub.publisher, pubsub.subscriber, storage.objectAdmin, secretmanager.secretAccessor |
| `retired-feed-poller` (Worker pool) | `praxis-worker-sa` | datastore.user, run.invoker (on backend) |
| `on-situation-created` (Func2) | `praxis-functions-sa` | datastore.user, eventarc.eventReceiver, iam.serviceAccountTokenCreator, run.invoker (on backend AND on the function's own Cloud Run service) |
| `on-document-uploaded` (Func2) | `praxis-functions-sa` | same as above |

Critical: Cloud Functions v2 = Cloud Run service of the same name. The
Eventarc trigger calls that Cloud Run service via OIDC. The trigger SA MUST
have `roles/run.invoker` on the *specific Cloud Run service* — project-level
binding is sometimes insufficient for Eventarc. This bit Giulio with a 403
on `on-situation-created`.

## Operator console

Read-only admin view at `/app/admin/operator-console`, gated by the
`ADMIN_ALLOWLIST` env var. Polls `/api/admin/operator-console` every 5s.
Shows:

- Counters: running jobs, failed jobs, dead-letter, failed tool runs, error events
- Background jobs table with attempt/N counter and progress
- Recent tool runs with model + duration + error code
- System events filtered by severity (info / warn+ / error+)

## Activity feed

Per-user `<ActivityFeed uid={uid} situationId={sit?} />` in
`src/components/app/activity-feed.tsx`. Live via three concurrent `onSnapshot`
queries on the user's own `tool_runs`, `background_jobs`, and `notifications`.
Merges by timestamp, sorts newest first, caps at 50 rows.

Mount in: dashboard sidebar, situation detail bottom sheet, future "Notifications"
top-bar dropdown.

## Common patterns

### Add a new background trigger

1. Decide `kind` value (`<verb>.<noun>`, e.g. `narrative.refresh`).
2. Compute idempotency key from caller-supplied stable inputs.
3. `create_or_get_job(...)`; bail on duplicate.
4. `emit_system_event(kind="job.queued", ...)`.
5. Do work. Call `update_job_progress` for long-running jobs.
6. `complete_job` or `fail_job` (the latter handles retry/dead-letter).
7. `emit_notification` if user-visible.

### Add a new AI tool route

1. Wrap with `withCalibration(toolId, creditOp)`. Done — spine wiring is
   automatic.
2. Inside the handler, write the canonical output via `saveToolOutput`.
3. Optionally write graph deltas to
   `users/{uid}/situations/{sit}/graph_updates/{id}` instead of overwriting
   the canonical graph.

### Surface progress to the user

Inside a long-running job, call `update_job_progress(jobId, percent, msg)`.
The activity feed picks it up via `onSnapshot` automatically. No frontend
change needed.

## Retention policy

| Collection | TTL | Rationale |
|------------|-----|-----------|
| `system_events` | 365d | Per Giulio 2026-04-25; supports compliance audit window |
| `tool_runs` | 365d | Powers the user activity feed; matches event TTL |
| `background_jobs` | 90d | Operational only; status is captured in events on completion |
| `notifications` | 180d | User-facing; longer than ops, shorter than events |
| `audit_logs` | 365d minimum | Compliance — see `docs/COMPLIANCE.md` |
| `rate_limits` | 5 min | Already TTL'd |

TTL is enforced by Firestore. The spine helpers automatically write
`expiresAt` on document creation. Run
`bash infrastructure/setup-ttl.sh` once per environment to apply the policies.

## Deployment

```bash
# Indexes (required before first non-trivial spine query)
firebase deploy --only firestore:indexes --project=praxisbytacitus

# Rules (required for client-side reads of notifications + tool_runs)
firebase deploy --only firestore:rules --project=praxisbytacitus

# TTL policies
bash infrastructure/setup-ttl.sh

# Code (vendored _shared, dedicated SAs, etc.)
gcloud builds submit --config=cloudbuild.yaml
```

## Future extensions

See `docs/CONTINUATION.md` Section "Spine roadmap" for ordered next moves
(graph delta review UI, Cloud Tasks dispatcher, multi-session agent storage,
email notifications via SendGrid).

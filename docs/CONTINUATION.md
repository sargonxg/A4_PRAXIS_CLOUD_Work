# PRAXIS — Continuation Prompt For Future Agents

> **Last updated**: 2026-04-25 (seventh session — deploy hardening)
> **Next agent**: Codex 5.5 (or Claude Code)
> **Read first**: `CLAUDE.md`, `AGENTS.md`, `docs/OPERATIONAL_SPINE.md`, `CHANGELOG.md` Unreleased.
> **Sprint execution plan**: `docs/SPRINT_EXECUTION_PLAN_2026-04-25.md`
> **Claude tandem prompts**: `docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md`

> **2026-04-26 update**: Codex started the workspace-personalization lane.
> User preferences now include `hiddenToolIds` and `toolOrder`, Settings →
> Preferences exposes show/hide and move controls for tools, and the sidebar
> applies those preferences while showing analyst role/domain in the user
> block. Claude should avoid `src/components/app/app-sidebar.tsx`,
> `src/types/preferences.ts`, `src/hooks/use-user-preferences.ts`, and
> `src/lib/navigation/tool-preferences.ts` unless explicitly handed off.
> The old-clone pricing/reference-doc commits were integrated into current
> `main` after this update, with newer spine/context/sidebar behavior kept as
> authoritative.

---

## Current state

- **Project**: `praxisbytacitus` (`852128226674`), region `us-central1`, domain `praxis.tacitus.me`.
- **Repo**: fresh clone at `C:\Users\giuli\praxiscodexworking\A4_PRAXIS_CLOUD_Work`.
- **Version**: bumped from 6.3.1 → 6.4.0 (operational spine).
- **What just shipped in code**:
  - 14 new Firestore indexes (incl. the `situations.status` collection-group index that was crashing gdelt-poller).
  - 5 new Firestore collections + rules: `tool_runs`, `background_jobs`, `system_events`, `users/{uid}/notifications`, `alerts`, `data_ingestions`, `audit_logs` (+ `graph_updates` subcollection).
  - TS spine: `src/lib/jobs/job-service.ts`, `src/lib/events/event-service.ts`.
  - Python spine: `cloud_functions/_shared/spine.py` (vendored at deploy time).
  - `withCalibration` automatically writes a `tool_runs` row + `tool.started`/`tool.completed`/`tool.failed` events for every AI route — no per-route boilerplate.
  - `gdelt-poller`, `on_situation_created`, `on_document_uploaded` rewritten: idempotent, observable, user-notified on success and failure.
  - `<SemaphoreChip />`, `<ActivityFeed />`, `/app/admin/operator-console`, `/api/admin/operator-console`, `/api/notifications/[id]`.
  - TTL retention configured (`infrastructure/setup-ttl.sh`): events 365d, tool_runs 365d, jobs 90d, notifications 180d.
  - Dedicated SAs declared in `infrastructure/setup-gcp.sh`: `praxis-frontend-sa`, `praxis-backend-sa`, `praxis-functions-sa`, `praxis-worker-sa`.

- **Deploy verification status on 2026-04-25**:
  - Firestore composite indexes, including `situations.status`
    collection-group, are READY.
  - TTL is ACTIVE for `system_events`, `tool_runs`, `background_jobs`,
    `users/{uid}/notifications`, `audit_logs`, and `rate_limits`.
  - Firebase CLI auth is expired on the Windows host; rules deployment
    still needs a `firebase login --reauth` or a Cloud Shell deploy.
  - Cloud Build `2bcd558a-bff5-4aec-ba42-fb42b29e2e42` failed during
    frontend TypeScript validation on `/api/notifications/[id]`.
    This session fixed that route-handler signature and the follow-on
    operator-console typing errors.
  - Cloud Build `c4cc3b65-7478-4c2d-9d40-114e2cf36f25` deployed commit
    `b4c88cd` successfully. Production smoke checks passed:
    `/` 200, `/login` 200, `/onboarding` 307 to `/login`, `/api/health`
    `status: ok`.
  - `gdelt-poller` had no recent `Index probe OK` logs when checked;
    this session fixed two worker issues before redeploy: missing
    `_shared` in the Docker image and a call to nonexistent
    `/api/v1/pipeline/ingest-gdelt`.
  - Dedicated service-account migration is still incomplete in production;
    use the Cloud Shell block in the session handoff to redeploy
    `on-situation-created`, `on-document-uploaded`, and `gdelt-poller`
    with the dedicated SAs.

---

## ⚡ FIRST 30 MINUTES — handoff checklist for Codex 5.5

1. **Read in order** (cold start):
   1. `CLAUDE.md`
   2. `AGENTS.md`
   3. `docs/OPERATIONAL_SPINE.md` ← new, read before touching any async code
   4. `docs/CONTEXT_INJECTION.md`
   5. This file

2. **Verify spine is deployed** (these were authored but the user is running them):
   ```bash
   # Indexes built?
   gcloud firestore indexes composite list --database='(default)' \
     --format='table(name.basename(),state)' | grep -E 'situations|tool_runs|background_jobs|system_events'
   # Expect: state=READY for all
   
   # Rules contain new collections?
   firebase firestore:rules:get --project=praxisbytacitus | grep -E 'tool_runs|background_jobs|system_events'
   # Expect: 3+ matches
   
   # TTL policies active?
   gcloud firestore fields ttls list --database='(default)' --project=praxisbytacitus
   # Expect: 6 rows: system_events, tool_runs, background_jobs,
   # notifications, audit_logs, rate_limits
   
   # Worker pool happy?
   gcloud logging read \
     'resource.type="cloud_run_worker_pool"
      AND resource.labels.worker_pool_name="gdelt-poller"
      AND textPayload:"Index probe OK"' \
     --limit=3
   ```

3. **If any of the above is empty**, run the missing deploy step. Commands live in `docs/OPERATIONAL_SPINE.md` Section "Deployment".

4. **Smoke test the spine end-to-end**:
   - Open `/app` as Giulio in a browser.
   - Trigger any AI tool (e.g. Risk Assessment, Game Theory).
   - In Firestore console, confirm a new doc landed in `tool_runs` with `status=completed semaphore=green`.
   - Confirm a `tool.started` and `tool.completed` event in `system_events`.
   - Open `/app/admin/operator-console` — should show the run + event.

---

## Spine roadmap — ordered next moves

These are the next items Codex 5.5 should tackle, in priority order. Each is scoped to be completable in one session.

### 1. Mount the activity feed in the dashboard (1-2 hours)

`<ActivityFeed uid={user.uid} />` already exists. Mount in:
- Dashboard right rail (`src/app/app/dashboard/page.tsx`)
- Situation detail bottom sheet (`src/app/app/situations/[id]/page.tsx`) — pass `situationId` to scope
- New top-bar bell dropdown (component: `src/components/app/notification-bell.tsx`) — read unread count from `useNotifications`

### 2. Wire `tool.warning` notifications for low-confidence AI output (2 hours)

Today `withCalibration` only emits notifications on terminal failure. Extend to detect `confidence < 0.6` in tool output and emit a `kind=tool.warning, semaphore=yellow` notification: "Risk Assessment confidence is low — consider providing more sources." The hook lives in the response-status switch in `with-calibration.ts`.

### 3. Backend `/api/v1/pipeline/run` accept + emit `jobId` (3 hours)

The Eventarc-triggered functions now pass `X-PRAXIS-JOB-ID` in headers. The backend (Python FastAPI) should:
1. Read the header.
2. Call `update_job_progress(jobId, percent, message)` at each pipeline stage (extract → build → cluster → analyze → report → export).
3. The frontend activity feed picks up progress via onSnapshot automatically.

File: `backend/routers/pipeline.py`. Helper: copy a Python `_shared/spine.py`-compatible client into the backend or use a shared Python package via `pyproject.toml`.

### 4. Graph delta review UI (1-2 days)

Schema is defined in `docs/OPERATIONAL_SPINE.md` (`graph_updates` subcollection). When extraction proposes new nodes/edges, write a `graph_updates` doc with `status=proposed, confidence=0.4` rather than mutating the canonical graph. Add a "Pending updates (3)" banner to the situation page that opens a side panel listing each delta with Approve / Reject buttons.

### 5. Email notification path (1 day)

Today notifications live only in Firestore. Add a Cloud Function that triggers on `notifications` create with `semaphore in ['red','yellow']` and `kind in ['action.required','data.ingest_failed']`. Send via SendGrid (Vercel Marketplace integration is fastest path). Env var: `SENDGRID_API_KEY`. Template per `kind`. Deduplicate by `notificationId`.

### 6. Multi-session Vertex Agent storage (4 hours)

Today `users/{uid}/agentSessions/active` is a single doc — two concurrent Deep Research calls clobber each other. Migrate to:
```
users/{uid}/agentSessions/{sessionId}: {
  sessionId, situationId, startedAt, lastActivityAt, expiresAt, summary
}
```
Update `src/app/api/ai/deep-search-agent/route.ts` to look up by `(uid, situationId)` and pick the most recent non-expired session, or create a new one.

### 7. Cloud Tasks dispatcher (2 days)

Move from Cloud Run worker pool single-instance polling to Cloud Tasks fan-out. Three queues already exist (`praxis-research`, `praxis-agents`, `praxis-embeddings`). Build a backend dispatcher that:
1. Reads `background_jobs.where('status','==','queued').orderBy('nextRunAt').limit(10)`.
2. Enqueues each into the appropriate Cloud Tasks queue.
3. Worker is replaced by an HTTP endpoint that consumes a Cloud Tasks delivery, claims the job (CAS on `lockedBy/lockedUntil`), runs it, and calls `complete_job`.

Benefits: per-job retry policy, parallelism, no custom lock service.

### 8. Operator console — drill-down (1 day)

Today the operator console shows a flat table. Add:
- Click a job row → side panel with full payload, full error stack, "Retry" button (calls a new `/api/admin/jobs/{id}/retry` endpoint that bumps `status=queued, nextRunAt=now`).
- Click an event with `severity=error` → linked job + linked tool_run + recent events for the same `uid`.
- Search bar filtering events by `uid` (admin only).

### 9. BigQuery sink for spine events (4 hours)

Cloud Logging sink already exports `api_calls` to BigQuery. Add a parallel sink filter:
```
resource.type="firestore.googleapis.com/Database"
  AND protoPayload.methodName="google.firestore.v1.Firestore.Write"
  AND protoPayload.resourceName=~"projects/.+/databases/.+/documents/system_events/.+"
```
Or, simpler: add a `Firestore.onCreate('system_events/{id}')` Cloud Function that streams to BigQuery `praxis_analytics.system_events`. Schema mirrors the doc.

### 10. Stripe Meters for usage billing (1 week)

Per `docs/compass_artifact_*.md`. Define meters:
- `vertex.input_tokens` (model name dimension)
- `vertex.output_tokens`
- `vertex_agent.thinking_tokens`
- `gdelt.queries`
- `firecrawl.pages` (already retired but kept for legacy users)

Emit at every `complete_tool_run` if `creditsDeducted > 0`. Already the credits cost matches an internal cost model — Stripe meters track the real GCP cost in parallel.

---

## Open decisions (need user input)

| # | Question | Default if no answer |
|---|----------|----------------------|
| 1 | SendGrid vs Mailgun for email notifications? | Use the Vercel Marketplace integration that auto-provisions an API key. Default: SendGrid. |
| 2 | Operator console — should non-admin support people see read-only events for users they're helping? | Defer; punt to a `/api/admin/operator-console?uid=X` query gated by a separate `SUPPORT_ALLOWLIST` env var. |
| 3 | Migrate `agentSessions/active` to subcollection now (Roadmap #6) or wait for paying users to hit the bug? | Defer to first paid user complaint. |
| 4 | TTL for `audit_logs` — 365d minimum is set, but compliance may want 7y for SOC 2. | Confirm with `docs/COMPLIANCE.md`. Today set to 365d. |
| 5 | Alert email recipient for Cloud Monitoring policies. | Currently empty. Set in console: `Monitoring → Alerting → Notification channels`. |

---

## Hard rules (do not break)

1. **NEVER** call `os.environ[...]` in workers/functions — always `os.getenv(...)` with explicit validation. See `cloud_functions/gdelt_poller/worker.py` for the pattern.
2. **NEVER** add a new Eventarc trigger without an idempotency key. Duplicate trigger replays will double-charge credits.
3. **NEVER** write a new collection without adding rules + indexes in the same commit. Rules deny by default; client-side reads silently fail.
4. **NEVER** invoke a Cloud Run service without ensuring the caller SA has `roles/run.invoker` on the *specific service* (project-level grant is unreliable for Eventarc).
5. **ALWAYS** vendor `cloud_functions/_shared/` next to a function source dir at deploy time (handled automatically by `cloudbuild.yaml` and `setup-gcp.sh`, but if you do an ad-hoc `gcloud functions deploy`, copy `_shared` first).
6. **ALWAYS** include `expiresAt` when creating documents in spine collections. The TS/Python helpers do this automatically — only relevant if you write directly.
7. **ALWAYS** commit as `giuliocatanzariti@gmail.com` (no Co-Authored-By lines).

---

## Useful one-liners

```bash
# How many failed tool runs in the last hour?
gcloud firestore documents list tool_runs --database='(default)' \
  --filter='status="failed" AND startedAt > $(date -d "1 hour ago" -Iseconds)'

# Tail the latest system events as they arrive
watch -n 2 'gcloud firestore documents list system_events --limit=10 --order-by="-createdAt"'

# Manually mark a stuck job as dead-letter
gcloud firestore documents update background_jobs/{jobId} \
  --field='status=dead_letter' --field='semaphore=red'

# Cron: list all schedulers + their target SAs
gcloud scheduler jobs list --location=us-central1 \
  --format='table(name,schedule,httpTarget.uri,httpTarget.oidcToken.serviceAccountEmail)'
```

---

## Files most-edited this session (use as anchors)

- `firestore.indexes.json`, `firestore.rules`
- `src/lib/jobs/job-service.ts`, `src/lib/events/event-service.ts`
- `src/lib/api/with-calibration.ts`
- `src/hooks/use-activity-feed.ts`
- `src/components/app/{semaphore-chip,activity-feed}.tsx`
- `src/app/app/admin/operator-console/page.tsx`
- `src/app/api/admin/operator-console/route.ts`
- `src/app/api/notifications/[id]/route.ts`
- `cloud_functions/_shared/spine.py`
- `cloud_functions/{gdelt_poller,on_situation_created,on_document_uploaded}/main.py` (and `worker.py` for gdelt)
- `infrastructure/{setup-gcp.sh,setup-ttl.sh}`
- `cloudbuild.yaml`
- `docs/OPERATIONAL_SPINE.md` (new)
- `CHANGELOG.md` (Unreleased section)
- `CLAUDE.md` (handoff checklist)

If you don't recognize a file path, grep the repo — Codex 5.5 should not assume the older repo layout from before this session.

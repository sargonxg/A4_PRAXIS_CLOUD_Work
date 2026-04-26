# PRAXIS — Continuation Prompt For Future Agents

> **Last updated**: 2026-04-26 (Claude Code multi-lane sprint — corpus-search shipped; humanitarian, brainstorming-table, citation primitives, strategic roadmap queued)
> **Local clone**: `C:\Users\giuli\ANTIGRAVITY\A4_PRAXIS_CLOUD_Work` (fresh `git clone` of `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`). The older locked clone at `C:\Users\giuli\ANTIGRAVITY\A4_PRAXIS_CLOUD_TACITUS\A4_PRAXIS_CLOUD_Work` could not be removed because of an open Windows file handle; secrets were preserved at `C:\Users\giuli\ANTIGRAVITY\_praxis_env_backup_20260426\` before re-cloning.
> **Next agent**: Codex 5.5 (or Claude Code)
> **Read first**: `CLAUDE.md`, `AGENTS.md`, `docs/OPERATIONAL_SPINE.md`, `CHANGELOG.md` Unreleased, `docs/NEXT_BRICKS_2026-04-26.md`.
> **Sprint execution plan**: `docs/SPRINT_EXECUTION_PLAN_2026-04-25.md`
> **Tool audit**: `docs/tools/UX_AUDIT_2026-04-26.md`
> **Claude tandem prompts**: `docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md`

> **2026-04-26 tenth-session update (Claude Code, multi-lane sprint — Lanes A–E shipped)**:
>
> All five lanes landed as separate commits on `main`. Cloud Build deploy
> triggered at end of session — see `docs/DEPLOYMENT_LOG.md` for the build
> ID and Cloud Run revision once the deploy completes.
>
> **Lane A — Situation Corpus Retrieval API.** `POST /api/intelligence/corpus-search`
> (auth-gated, Zod-validated, demo bypass, 50-item cap) ranks evidence
> across `argus | sources | documents | graph | tool-output` layers via
> `searchSituationCorpus({uid, situationId, query, layers, limit})` in
> `src/lib/intelligence/corpus-search.ts`. Document-chunk layer leverages the
> existing Gemini text-embedding-004 hybrid ranking. Each layer fails
> closed (returns []). `src/types/corpus.ts` is the canonical retrieval
> contract. Tests at `tests/services/corpus-search.test.ts`. Step 4 of
> `docs/CORPUS_ARCHITECTURE.md` (Ask PRAXIS chat delegating to the shared
> helper) is queued as Lane F for the next session.
>
> **Lane B — Humanitarian Calibrated Route.** `/api/ai/humanitarian/route.ts`
> with full `withCalibration('humanitarian', 'ai_humanitarian')`,
> `HumanitarianSnapshotSchema` (BLUF, IPC phases, displacement, funding,
> protection, access constraints, intelligence gaps, recommended actions,
> confidence, primarySources), live grounding via `getSituationIntelligence`
> (HDX HAPI, ReliefWeb, UNHCR, OCHA FTS, UN News, GDELT) with degraded path
> when feeds fail, `saveToolOutput` persistence to `tool-data/humanitarian`
> with primarySources/dataContextLength/focus metadata. Demo-mode returns
> a labelled fixture, no live-mode fictional fallback. `ai_humanitarian`
> credit op (2 credits) added. Tool registry `aiRoute` flipped from
> `/api/ai/chat` → `/api/ai/humanitarian`. Tests at
> `tests/services/humanitarian-schema.test.ts`. Page wiring is queued as
> Lane G for the next session.
>
> **Lane C — Brainstorming Table MVP.** Synchronous prototype of
> `docs/AGENTIC_SYSTEM.md`. `/api/ai/brainstorming-table/route.ts`
> wrapped with `withCalibration('brainstorming-table', 'ai_brainstorming_table')`
> (5 credits). Six expert personas (mediator, humanitarian, legal, media,
> security, red-team) deliberate over a single question. Pulls evidence
> from `searchSituationCorpus` so every claim cites a corpus item or
> marks `sourceType="reasoning"`. `BrainstormingTableSchema` (Zod),
> `Output.object` Pro-model generation, demo fixture, persistence to
> `tools/brainstorming-table` with personas/retrievalTrace/question
> metadata. Page at `src/app/app/brainstorming-table/page.tsx` with
> question textarea, "Convene the table" CTA, persona-coloured table,
> synthesis card. Registered under simulation category, 48h staleness,
> Pro tier. Tests at `tests/services/brainstorming-table-schema.test.ts`.
> `'brainstorming-table'` added to `ToolName` union. Cloud Tasks fan-out
> and `/demo/brainstorming-table` mirror page intentionally deferred.
>
> **Lane D — Shared confidence/citation primitives + provenance panel.**
> Closes the cross-tool finding in `docs/tools/UX_AUDIT_2026-04-26.md` and
> brick #4 of `docs/NEXT_BRICKS_2026-04-26.md`. Three new primitives:
> `src/components/praxis/confidence-badge.tsx` (high/medium/low/unknown
> ICD 203/Heuer pill + `normalizeConfidence()` helper),
> `src/components/praxis/citation.tsx` (inline + chip variants with URL,
> publish date, sourceType badge), and
> `src/components/praxis/output-provenance-panel.tsx` (default-collapsed
> "Why this output?" disclosure showing tool id, generated-at, profile
> version, domain version, model, source count, retrieval query, layers
> searched, and primary-source chips). Wired into the Brainstorming
> Table page as the first consumer. Tests at
> `tests/services/confidence-badge.test.ts`. Existing tools (Risk
> Monitor, Briefing Room, Legal Tracker, Humanitarian) intentionally NOT
> migrated in this commit — those overlap with Codex-owned files.
>
> **Lane E — Strategic roadmap + persona walkthroughs.**
> `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` is the new flagship-grade
> 90-day roadmap with 30 named bricks across Calibration & Corpus, Tools
> & Workflows, Agents & Long-Running Jobs, Operational Excellence &
> Trust. `docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md` is the new
> home for persona testing — five scenario-driven walkthroughs (UN
> diplomat, humanitarian lead, legal analyst, mediator, researcher) plus
> a cross-persona heatmap showing citation/provenance gap and persistence
> vocabulary drift hit every persona.
>
> **Codex handoff prompt:** `docs/CODEX_HANDOFF_2026-04-26.md` has the
> drop-in prompt for the next Codex session. Lanes F–K queued (Ask
> PRAXIS corpus wiring, Humanitarian page wiring, Situation Health
> Card, real notification bell, tool id canonicalization, document-graph
> cross-link). File-ownership rules included.
>
> **Validation gate at end of session:**
> - `npx tsc --noEmit` clean.
> - `npm run build` clean (Next.js 16.1.6, build standalone, all routes prerender or are dynamic as expected).
> - `npm run audit:gcp` 0 hard / 0 soft.
> - `node scripts/audit-ai-routes.mjs` 55 calibrated / 4 exempt (was 53/4 entering the session — +2 from Lanes B and C).
> - `npx vitest run` 207/207 (was 168 entering the session — +39 across the four lane test files).

> **2026-04-26 ninth-session update**: Claude Code shipped the public-UX
> source-truth lane and the first-run-UX lane, plus a tool-by-tool audit
> doc and a settings/landing polish pass. Specifically: stripped retired
> vendor claims (ACLED, Firecrawl, Anthropic, Tavily, Parallel.ai) from
> landing/auth/onboarding/system-health user copy; rewrote onboarding
> live-preview and completion screens around a human calibration summary
> with the raw XML behind an Advanced disclosure; added a
> "PRAXIS works without this" explainer to Settings → Graph Backend; and
> fixed a production calibration bug in `/api/ai/legal-tracker`
> (was attributing to `commitments` with `ai_analysis` credits — now
> `legal_tracker` with `ai_legal_tracker`). New strategy doc:
> `docs/NEXT_BRICKS_2026-04-26.md` ranks the top 10 bricks for the next
> seven days; the tool-by-tool audit lives at
> `docs/tools/UX_AUDIT_2026-04-26.md` (top 5 fixes by impact: legal-tracker
> calibration is now done; remaining four are tool-id canonicalization,
> humanitarian real route, demo-leak audit, and document → graph
> cross-link). Validation: tsc clean, route audit 53/4, vitest 168 PASS.
> Late in the same session, Claude also shipped a focused
> `/app/situations/[id]` overview page (was a redirect to settings;
> now renders header + risk/Glasl + actor chips + scoped activity
> feed + quick nav into inspect/settings/dashboard) and replaced
> the last user-facing `ACLED` source claim in the Myanmar welcome
> template with UCDP. Follow-ups for that page are tracked in
> `docs/NEXT_BRICKS_2026-04-26.md` brick #7.
> Files Claude is responsible for staying off this week:
> `src/lib/auth/auth-context.tsx`, `src/components/app/app-sidebar.tsx`,
> `src/components/dashboard/recommended-tools-widget.tsx`,
> `src/components/dashboard/operational-status-panel.tsx`,
> `src/lib/navigation/tool-preferences.ts`,
> `src/lib/dashboard/tool-status-summary.ts`,
> `src/lib/dashboard/role-recommendations.ts`,
> `src/types/preferences.ts`, `src/hooks/use-user-preferences.ts`.

> **2026-04-26 Codex strategic-uplift update**: Fresh clone was recreated from
> `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`, implementation branch
> `codex/strategic-uplift-sprint1` tracks `origin/main`, and the remote is
> verified as the same GitHub repo for fetch/push. PR #1
> (`docs/strategic-uplift-sprint-plan`) has no checks and a dirty merge state,
> so Codex imported the two sprint docs onto the implementation branch rather
> than basing code on the PR branch's broad deletions. Low-risk shipped fixes:
> Legal Tracker now persists via `saveToolOutput` under `legal-tracker` instead
> of polluting `commitments`; `AiPopulate` no longer exposes internal credit
> costs in user-facing copy; geospatial authenticated failures now return an
> honest degraded empty state instead of generated demo events; Ask PRAXIS and
> landing copy now align with the Google Cloud / open-data stack; and
> `infrastructure/setup-gcp.sh` now creates the required `profile.events`
> Pub/Sub topic. New strategic spec:
> `docs/superpowers/specs/2026-04-26-brainstorming-table-media-intelligence-plan.md`
> defines the Brainstorming Table expert-agent product, context architecture,
> and media scanner / 24-hour roundup uplift. Live GCP verification is blocked
> locally until `gcloud auth login` refreshes the `giulio@tacitus.me` token;
> Firebase CLI is logged in but `firebase projects:list` failed and should be
> retried after auth refresh. Local validation after the Codex patch:
> `npx tsc --noEmit` clean, `npm run build` clean on Next 16.2.4, AI route
> audit clean (53 calibrated / 4 exempt), focused media query-builder tests
> pass, production `https://praxis.tacitus.me/`, `/login`, and `/api/health`
> return 200/ok. `npm audit --omit=dev` is improved to 0 critical / 0 high /
> 16 moderate / 2 low; remaining findings are mostly Google SDK / uuid chains
> that need separate dependency-risk review.
> Post-deploy continuation: GCP audit is fully green after enabling Cloud
> Tasks and creating `praxis-research`, `praxis-agents`, and
> `praxis-embeddings`. Cloud Build
> `8d9f5c8d-c96e-4fb9-be67-b6abc604af73` deployed the commit to production
> (`praxis-frontend-00063-h5k`, `praxis-backend-00040-rft`). Ask PRAXIS now
> has an ARGUS corpus bridge via `src/lib/argus/corpus-context.ts`, injecting
> ARGUS alerts/watch items, Sources Library entries, and relevant document
> chunks for the active situation. Firebase CLI still requires an interactive
> `firebase login --reauth`; `firebase projects:list` fails because the stored
> Firebase refresh token is invalid, but GCP deploy/audit are healthy.
> Follow-up ops verification completed after interactive reauth: Firebase CLI
> now lists project `praxisbytacitus`, Firestore rules/indexes deployed
> successfully, `npm run audit:gcp` is green with 0 hard / 0 soft findings,
> Cloud Tasks queues are running, and Cloud Run latest-ready revisions are
> `praxis-frontend-00065-nhs` / `praxis-backend-00041-g29`. Production smoke:
> `/`, `/login`, and `/api/health` return 200/ok. Infra `.sh` syntax checks
> pass under Git Bash; the default Windows WSL `bash.exe` is unavailable
> because no WSL distro is installed.

> **2026-04-26 update**: Codex started the workspace-personalization lane.
> User preferences now include `hiddenToolIds` and `toolOrder`, Settings →
> Preferences exposes show/hide and move controls for tools, and the sidebar
> plus dashboard recommendations apply those preferences while showing analyst
> role/domain in the user block. Sources Library is now a canonical
> `sources-library` customizable tool. Claude should avoid
> `src/components/app/app-sidebar.tsx`,
> `src/types/preferences.ts`, `src/hooks/use-user-preferences.ts`, and
> `src/lib/navigation/tool-preferences.ts` unless explicitly handed off.
> The old-clone pricing/reference-doc commits were integrated into current
> `main` after this update, with newer spine/context/sidebar behavior kept as
> authoritative.
> **Product plan**: `docs/PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md`
> now defines the multi-day knowledge-management, tool-quality, dashboard,
> and agent-workflow plan. Use it with the sprint plan before starting any
> broad feature pass.
> **Strategic roadmap**:
> `docs/STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md` adds the 20-item
> high-impact queue, agentic lane ownership model, Google Cloud architecture
> notes, and a Claude Code copy-paste prompt for the next implementation
> session.
> **Corpus / agents**: `docs/CORPUS_ARCHITECTURE.md` and
> `docs/AGENTIC_SYSTEM.md` now split the shared retrieval architecture and the
> agentic execution model into dedicated handoff docs.
> **User research synthesis**:
> `docs/USER_RESEARCH_SYNTHESIS_2026-04-26.md` records persona walkthroughs,
> survey comments, implemented fixes, and next UX/product bricks.

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

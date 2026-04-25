# Handoff prompt for Codex 5.5

> **Use this exact text to start the next Codex / Claude Code session.**
> Last updated: 2026-04-25, end of operational-spine session.
> Repo: `sargonxg/A4_PRAXIS_CLOUD_Work` · branch `main` · last commit `4a5e8be`.

---

## Paste this block as the first message to Codex 5.5

> You are picking up PRAXIS by TACITUS — a conflict-intelligence SaaS for UN /
> diplomatic / think-tank analysts, deployed on Google Cloud (Firebase, Cloud
> Run, Cloud Functions v2, Vertex AI). The previous session shipped a major
> operational layer ("the spine"). Your job is to validate the deploy, mount
> the new UI, and close the highest-priority gaps. Work like a senior
> staff engineer on a small team: no scope creep, no half-measures, evidence
> before assertions. Commit as `giuliocatanzariti@gmail.com` with no
> Co-Authored-By lines.
>
> **Read these files in this order before touching any code:**
>
> 1. `CLAUDE.md` (project guide)
> 2. `AGENTS.md` (hard rules, validation gate)
> 3. `CHANGELOG.md` — read the `[Unreleased] — 2026-04-25 (sixth session — operational spine)` block
> 4. `docs/OPERATIONAL_SPINE.md` ← architecture contract for everything async. Read every word.
> 5. `docs/CONTEXT_INJECTION.md` (calibration contract)
> 6. `docs/CONTINUATION.md` ← first-30-min checklist + ordered roadmap
> 7. `docs/GCP_OPERATIONS.md` (every gcloud command for the live project)
> 8. `firestore.rules` and `firestore.indexes.json`
> 9. `src/lib/jobs/job-service.ts`
> 10. `src/lib/events/event-service.ts`
> 11. `src/lib/api/with-calibration.ts` (note the auto tool_run wiring)
> 12. `cloud_functions/_shared/spine.py`
> 13. `cloud_functions/{gdelt_poller,on_situation_created,on_document_uploaded}/main.py`
> 14. `src/components/app/{semaphore-chip,activity-feed}.tsx`
> 15. `src/app/app/admin/operator-console/page.tsx`
> 16. `src/app/api/admin/operator-console/route.ts`
> 17. `infrastructure/setup-gcp.sh` and `infrastructure/setup-ttl.sh`
> 18. `cloudbuild.yaml`
>
> **Then run the deploy verification checklist** in
> `docs/CONTINUATION.md` § "FIRST 30 MINUTES":
>
> - confirm Firestore indexes are READY,
> - confirm rules contain the new collections,
> - confirm TTL policies active,
> - confirm gdelt-poller logs `Index probe OK`,
> - smoke-test one AI tool and confirm a `tool_runs` row + `system_events`
>   appear in Firestore.
>
> **If any of those fail**, fix the deploy step before writing new code.
>
> **Then pick the next item from `docs/CONTINUATION.md` § "Spine roadmap":**
>
> 1. Mount `<ActivityFeed />` in dashboard, situation detail, top-bar bell
> 2. Low-confidence tool warnings → `notifications`
> 3. Backend pipeline progress reporting via `X-PRAXIS-JOB-ID`
> 4. Graph delta review UI (`graph_updates` subcollection)
> 5. Email notifications via Vercel Marketplace SendGrid
> 6. Multi-session Vertex Agent storage
> 7. Cloud Tasks dispatcher for `background_jobs`
> 8. Operator console drill-down + retry button
> 9. BigQuery sink for `system_events`
> 10. Stripe Meters for usage billing
>
> **Hard rules** (in `docs/CONTINUATION.md` and `AGENTS.md`):
>
> - Never `os.environ[X]`; always `os.getenv(X)` with explicit validation.
> - Never add an Eventarc trigger without an idempotency key.
> - Never write a new collection without rules + indexes in the same commit.
> - Never invoke a Cloud Run service without `roles/run.invoker` on the
>   *specific service* (project-wide grant is unreliable for Eventarc).
> - Always vendor `cloud_functions/_shared/` next to a function source dir.
> - Always include `expiresAt` in spine collection writes (the helpers do this
>   automatically — do not bypass them).
>
> **Before you commit**:
>
> - `npx tsc --noEmit` passes.
> - `npm run build` passes (Linux Cloud Build is authoritative; Windows local
>   warns about node:* tracing — that's expected).
> - `node scripts/audit-ai-routes.mjs` passes (or fails with a clear new-route
>   exemption you've documented in CHANGELOG).
> - `node scripts/audit-gcp.mjs` passes.
> - `npx vitest run` passes.
> - You've added a `[Unreleased] — 2026-04-26` (or current date) entry to
>   `CHANGELOG.md` describing what you did.
>
> **Push directly to `main`** (the project does not use feature branches yet).
> Cloud Build auto-runs on push.
>
> **End-of-session output**: a short message back with: what you shipped,
> what you skipped and why, and the *one* highest-leverage next item in your
> opinion.

---

## What the team looks like (mental model)

Treat PRAXIS as if there were five engineers working it:

| Persona | Owns | Files / surfaces |
|---------|------|------------------|
| **Platform engineer** | Spine, IAM, Cloud Build, deploys | `infrastructure/`, `cloudbuild.yaml`, `cloud_functions/_shared/`, `firestore.rules`, `firestore.indexes.json` |
| **AI / agent engineer** | Calibration, tools, Vertex Agent | `src/lib/ai/`, `src/lib/api/with-calibration.ts`, `src/app/api/ai/*`, `cloud_functions/on_situation_created/`, `backend/graphify_tacitus/` |
| **Frontend engineer** | Tool pages, dashboard, activity feed, operator console | `src/app/app/`, `src/components/app/`, `src/components/landing/`, `src/hooks/` |
| **Data engineer** | Feeds, ingestion, GDELT, BigQuery | `src/lib/data-feeds/`, `cloud_functions/gdelt_poller/`, BigQuery `praxis_analytics` |
| **DevRel / docs** | CHANGELOG, README, CLAUDE.md, CONTINUATION.md, OPERATIONAL_SPINE.md | `docs/`, root markdown |

When you start a session, identify which persona's work the next item falls
under and stay in that lane unless the task explicitly crosses lanes.

---

## Brainstorming notes (proactive ideas)

Codex 5.5 should be willing to push back on any of these and propose better.

### Architectural

- **Move from polling to push** for the GDELT worker: switch to GDELT BigQuery
  public dataset + a Pub/Sub trigger on a scheduled BigQuery query. Per the
  research artifact, this is more durable and cheaper than the current
  Cloud Run worker pool.
- **Split the backend**: `praxis-backend` does pipeline + graph + analyze. As
  pipeline runs grow, move pipeline to a separate Cloud Run service so a
  long extraction does not starve a fast graph query.
- **Memory bank per situation**: today profile + situation are passed per
  call. Add `users/{uid}/situations/{sit}/memory/{moduleId}` for cross-tool
  shared scratch (e.g., the `risk-assessment` tool's verdict is reused by
  `early-warning` and `report-studio` without rerun).
- **Audit log everything sensitive**: admin domain edits already snapshot;
  extend the same pattern to credit grants, profile resets, situation
  archive/delete.

### UX

- **Status everywhere**: every situation card on the dashboard should carry
  a `<SemaphoreChip />` derived from `latest tool_run for this situation`.
  No more "what's actually happening" guessing.
- **Onboarding telemetry**: track which onboarding step users skip and why.
  Today the wizard exists but the funnel is a black box.
- **"Why this output?" inspector**: clicking the (i) icon on any AI output
  shows the calibration block, the model, the prompt version, and the SKC
  retrieval results. Massive trust signal for UN / diplomatic users.
- **Dark + light mode**: today the app is navy-on-light. Diplomats live in
  briefing rooms with soft lights — add a high-contrast dark mode.
- **Mobile situation card**: read-only mobile layout for the dashboard so a
  principal on a phone in a car can see the latest risk and one paragraph.

### Multi-agent

- **Agent registry**: today Deep Research Agent is hard-coded. Build a
  registry similar to `tool-registry.ts` so adding a new agent (Sanctions
  Agent, Treaty Compliance Agent, Geopolitical Forecast Agent) is one
  Firestore doc plus one route.
- **Agent orchestrator**: a meta-agent that decides which sub-agent to call
  based on the user's question + situation. Uses the calibration block as
  routing context.
- **Inter-agent messages**: when the Sanctions Agent finds a new violation,
  it writes a `system_events` row that the Risk Monitor agent picks up on
  next refresh. Loose coupling via the spine.

### Compliance / commercial

- **SOC 2 path**: spine TTL + audit_logs + Cloud Logging sink to BigQuery is
  the foundation. Next steps in `docs/COMPLIANCE.md`.
- **DPA template**: needed before the first paid customer signs. Use Google
  Cloud's standard template and customize.
- **UN procurement**: per `docs/compass_artifact_*.md`, the path is via a
  reseller. Worth a one-day spike to confirm.

---

## Operator decisions still pending (carry forward)

The previous session asked for these but did not block on them. Codex 5.5
should ping the user before kicking these off:

1. SendGrid vs Mailgun for emails (default: SendGrid via Vercel Marketplace).
2. Operator console — separate `SUPPORT_ALLOWLIST` for read-only support staff?
3. Migrate `agentSessions/active` doc → subcollection now or after first paid user complaint?
4. `audit_logs` retention — 365d set, but SOC 2 may want 7y.
5. Cloud Monitoring alert recipient (currently empty).

---

## Quick-reference URLs

- Production: https://praxis.tacitus.me
- GCP project: `praxisbytacitus` (852128226674)
- GitHub: https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work
- Cloud Build trigger: `praxis-frontend-and-backend` (auto on push to main)
- Firestore console:
  https://console.firebase.google.com/project/praxisbytacitus/firestore
- Cloud Run console:
  https://console.cloud.google.com/run?project=praxisbytacitus
- Operator console (live, after deploy):
  https://praxis.tacitus.me/app/admin/operator-console

---

## What you (the next agent) will accidentally try to do — and why not

| Temptation | Why not |
|------------|---------|
| Refactor `with-calibration.ts` to be cleaner | The spine wiring inside is load-bearing; touch only with a regression test |
| Remove `_shared/` vendoring and use a Python package | Cloud Functions deploys only the source dir; vendoring is the simplest correct answer |
| Make `system_events` writable from client SDK | Append-only is the contract; a malicious client could fake job completions otherwise |
| Switch the GDELT worker to a Cloud Function | The 15-min poll is fine in a worker pool today. Future move is GDELT BigQuery; do that move *whole*, not piecemeal |
| Rebrand or restyle the landing page | Brand is locked. Edit content, not chrome |
| Run a migration script in dev mode | Always `--dry-run` first; commit the dry-run output to the PR description |

Good luck.

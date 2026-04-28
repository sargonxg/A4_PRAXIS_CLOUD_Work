# PRAXIS — MONSTER TODO 2026-04-27

> **Round 6 production execution plan.** This is the implementation queue
> for `docs/STRATEGY.md`: 22 strategic items plus the current high-impact
> coding queue.
> Authored after fresh clone of `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`.
> Replaces ad-hoc round-6 lane picking with a single-pane queue covering
> durable agents, data quality, user trust, landing, async operations,
> observability, billing, and production hygiene.
> Pair with `docs/TODO_BOARD_2026-04-26.md` (brick ledger/status board),
> `docs/CODEX_HANDOFF_2026-04-27.md` (file ownership), and
> `docs/tools/CORE_TOOL_AUDIT_2026-04-27.md` (tool-by-tool $100/month core
> offer audit and one-week sprint plan). Mark each row as work lands.
> **Codex compatibility: respect file-ownership rules.**

## Operating contract

1. **Validation gate** before every push (per `AGENTS.md`):
   `npx tsc --noEmit && npm run build && npm run audit:gcp && node scripts/audit-ai-routes.mjs && npx vitest run`. Lint warnings tracked debt; rest must be green.
2. **Calibration invariant**: AI route audit must keep ≥58 calibrated / 4 exempt.
3. **No vendor regressions**: never reintroduce ACLED, Firecrawl, Tavily, Parallel.ai in user-facing copy.
4. **No silent canonical writes from agents**: graph/timeline/profile mutations go through proposal/approval queues.
5. **Co-developed with Codex**: respect file-ownership in `docs/CODEX_HANDOFF_2026-04-27.md`.
6. **Commit identity**: `giuliocatanzariti@gmail.com`, no Co-Authored-By trailer.
7. **Deploy**: `gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus`. Append revision to `docs/DEPLOYMENT_LOG.md`.

## Product and technical decision frame

- Build for policy, diplomacy, mediation, humanitarian, legal/sanctions,
  political-risk, and research users who need defensible analysis, not generic
  chat.
- The active situation is the unit of work. Tools, agents, retrieval,
  dashboards, and admin diagnostics should all resolve through it.
- Firestore remains canonical for user-facing state. Cloud SQL stores
  LangGraph checkpoints only.
- Context injection and the Operational Spine are non-negotiable contracts:
  calibrated prompts, explicit degraded states, provenance, idempotency, TTL,
  and system events are part of done.
- Agents can propose canonical graph/timeline/profile changes, but approval
  queues own mutation.

## Priority lanes

| Tier | Goal | Items |
|---|---|---|
| **T0 — Durable runtime** | LangGraph + Cloud SQL wired and resumable | #1, #2 |
| **T1 — Data quality** | Structured extraction, OCR, RAG | #3, #4, #10 |
| **T2 — UX trust** | Onboarding, user creation, demo-leak close, all-tools audit | #5, #6, #7, #8 |
| **T3 — Brand & growth** | Landing production polish | #9 |
| **T4 — Real intelligence** | Multi-session Deep Search Agent | #11 |
| **T5 — Async backbone** | Cloud Tasks dispatcher | #12 |
| **T6 — Money + comms** | Polar billing, email | #13, #14 |
| **T7 — Trust + abuse** | App Check, evals | #15, #16 |
| **T8 — Visualisation scale** | Sigma.js graph canvas | #17 |
| **T9 — Operability** | Operator console v2, BigQuery sink | #18, #19 |
| **T10 — Hygiene** | Tool-output unification, Postgres cleanup | #20, #21 |
| **T11 — Close** | Docs, deploy, smoke | #22 |

## Current high-impact queue

This is the consolidated working queue from the handoff, TODO board,
Operational Spine, and LangGraph Cloud SQL notes. Treat these as the next
explicit in-progress/queued items before pulling from the broader backlog.

| ID | Status | Priority | Area | Item | Acceptance criteria | Owner notes |
|---|---|---|---|---|---|---|
| HQ-01 | 🟡 in-progress | P0 | Database / Firestore / Cloud SQL | Finish Cloud SQL-backed LangGraph runtime hardening after Brick #1: confirm `agent_runs` schema, indexes, TTL, secret wiring, VPC/private-IP deploy path, and `/agents/health` production readiness. | `GET /agents/health` passes in Cloud Run; `agent_runs` rows include `thread_id`, `checkpointThreadId`, `status`, `lastActivityAt`, `expiresAt`; Firestore indexes deploy cleanly; failure emits `system_events` with `expiresAt`. | Codex owns backend/infra/docs. Do not turn Postgres into product state; Firestore remains the user-facing source of truth. |
| HQ-02 | ⚪ queued | P0 | LangGraph agentic runtime | Brainstorming Table -> LangGraph via Cloud Tasks `praxis-agents`, with persona turns, critique, synthesis-chair, interrupt/resume, and durable checkpoint recovery. | Run survives Cloud Run restart; analyst can edit a persona row before synthesis; final output writes canonical Firestore tool output with provenance; no canonical graph/profile mutation outside proposal queues. | Codex backend + infra, coordinate with Claude before touching `src/app/api/ai/brainstorming-table` or UI-owned files. |
| HQ-03 | ⚪ queued | P0 | Data ingestion | Document AI fallback for scanned/layout-heavy PDFs when existing extraction produces <500 chars; preserve page/heading/table metadata. | Scanned PDF produces at least 10 usable chunks; document row records `extractionMethod`; failed or costly fallback surfaces a degraded/cost signal and a `system_events` row. | Split ownership: Codex owns Cloud Function/backend path; Claude owns UI chips unless explicitly coordinated. |
| HQ-04 | ⚪ queued | P0 | Data quality / ingestion | Structured backend extraction with Pydantic-enforced ACO nodes/edges and visible failure events for malformed model output. | Malformed JSON, schema-invalid nodes, and empty extraction all fail loudly in pytest; no empty graph is silently emitted; extraction failure writes `system_events`. | Codex owns `backend/graphify_tacitus/*`. Keep tests narrow and fixture-driven. |
| HQ-05 | ⚪ queued | P0 | User / data / situation health | Situation/user/data health layer: compute stale feeds, missing profile fields, stale tool outputs, failed jobs, and degraded corpus coverage for dashboard and admin surfaces. | Health helper returns deterministic red/yellow/green/grey state; at least one unit test covers each degradation class; output can be rendered without extra Firestore round trips. | Existing queued Lane H is Codex-owned, but UI adoption is Claude territory. Keep first brick as library + tests. |
| HQ-06 | ⚪ queued | P1 | Background jobs | Cloud Tasks dispatcher drains `background_jobs` into `praxis-research`, `praxis-agents`, and `praxis-embeddings` with CAS locking and retry/dead-letter semantics. | 100 queued jobs drain in <5 minutes at parallelism 10; duplicate Cloud Tasks deliveries are idempotent; every job emits `job.queued`, terminal completion/failure events, and `expiresAt`. | Codex infra/backend. Preserve current GDELT worker-pool path until dispatcher is verified in production. |
| HQ-07 | ⚪ queued | P1 | Observability | BigQuery `system_events` sink and backfill for long-tail operational analysis. | New events appear in `praxis_analytics.system_events`; 24h of events queryable by severity/source/kind; backfill is idempotent and can be dry-run. | Codex owns Cloud Function + scripts. Schema must mirror Operational Spine fields and tolerate missing optional links. |
| HQ-08 | ⚪ queued | P1 | Secure admin console | Secure admin console v2: IAP or allowlist-gated job/event drill-down, retry CTA, linked tool run, linked job, and audit trail. | Admin can go from error event to source job/tool run in <=3 clicks; retry creates an audit row; non-admin access is denied; sensitive payloads are redacted. | Codex owns admin API/infra gating; coordinate before editing Claude-owned UI components. IAP admin gating Brick #38 can be paired here. |
| HQ-09 | ⚪ queued | P1 | Digital advisor knowledge feeding | Feed digital advisor/SKC from tool outputs, analyst notes, Source Scout, grounded search, uploaded docs, and corpus search with normalized `CorpusItem` provenance. | New tool output is retrievable by SKC without legacy fallback; citations point to a corpus item; degraded retrieval returns a visible degraded signal rather than uncited generation. | Cross-cut with Claude-owned intelligence files. Codex can own backend/data contracts and docs unless UI/API route changes are explicitly assigned. |
| HQ-10 | ⚪ queued | P1 | Landing page polish | Landing production polish for paid-launch funnel: messaging, comparison/pricing/trust bands, responsive audit, accessibility, and Lighthouse. | `/` scores at least 90 performance, 95 accessibility, 95 SEO on mobile; 360px viewport has no text overlap; reduced motion and keyboard navigation pass. | Claude owns landing files. Codex only updates docs or validation notes unless asked to coordinate implementation. |
| HQ-11 | ⚪ queued | P1 | Evals | Repo-root `evals/` harness for extraction, RAG faithfulness, and top-tool schema validity with optional Cloud Build gate. | Extraction golden set reaches >=85% precision/recall; RAG faithfulness >=95%; `_RUN_EVALS=1` can run in CI without slowing default builds. | Shared quality lane. Codex can own backend extraction evals; coordinate for frontend/tool route fixtures. |
| HQ-12 | ⚪ queued | P1 | Observability / retention | Postgres checkpoint cleanup cron using LangGraph checkpointer API and Firestore `agent_runs.expiresAt`. | Dry-run reports expired threads; live run calls `delete_thread(thread_id)`, marks `checkpointDeletedAt`, and emits cleanup summary/failure `system_events`. | Codex owns. Never use raw SQL deletes against LangGraph tables unless schema is pinned and tested. |
| HQ-13 | ⚪ queued | P0 | Paid-core tool quality | Execute the `$100/month core` flagship hardening sprint from `docs/tools/CORE_TOOL_AUDIT_2026-04-27.md`: canonical tool ids, durable expensive outputs, provenance primitives, no unlabelled demo data, and role-visible recommendations. | A new user can create a situation, upload a document, generate Dashboard/Daily Brief/Risk or Humanitarian, create Policy Memo or Briefing, red-team it, reload, and find cited artifacts still present. | Treat this as product packaging plus engineering quality, not more tool breadth. Start with the audit's Top 15 coding priorities. |
| HQ-14 | ⚪ queued | P0 | Tool persistence / provenance | Canonicalize registry id as the Firestore persistence key for flagship tools and migrate known drift (`conflict_graph`, `briefing_room`, `daily_brief`, `escalation_scan`, `policy_memo`, `media_compass`, `media_roundup`, `deep_research`). | Top 12 flagship tools read/write the same canonical key; migrated legacy rows still load; regenerated outputs survive navigation and reload. | Enables the core audit. Coordinate before touching Claude-owned UI hooks/routes. |
| HQ-15 | ⚪ queued | P1 | Decision artifacts | Version and lock the paid-core artifacts: Daily Brief, Briefing Room, Policy Memo, Dossier, Deep Research Agent, Brainstorming Table, and Advisory Council. | Expensive outputs are durable, versioned where appropriate, cite sources, show confidence/gaps, and can be exported or promoted to Report Studio. | Use `CORE_TOOL_AUDIT_2026-04-27.md` tickets T15, T17, T19, T20, T27, T31, T43, T45. |
| HQ-16 | 🟡 in-progress | P0 | Billing / entitlements | Complete Stripe-to-Polar transition: fresh OAT, three Polar products, 14-day trials, webhook secret, checkout smoke, customer portal smoke, Firestore entitlement mirror, and docs cleanup. | `/api/polar/checkout` returns a hosted checkout URL; Polar webhook updates `users/{uid}.subscription`; canceled/revoked subs downgrade to free; `/api/polar/portal` opens customer portal; no `STRIPE_*` vars are required for paid launch. | Current supplied OAT failed production and sandbox auth on 2026-04-28; regenerate from Polar org settings before live test. |
| HQ-17 | 🟡 in-progress | P0 | Firestore / corpus shape | Normalize research artifacts and tool outputs into one canonical evidence envelope, then feed it to Ask PRAXIS/SKC. | Tool outputs now expose a shared read adapter across `tool-data` and `tools` with source, situation id, tool id, freshness, confidence, version/profile metadata, and citation. Remaining: `research`, `auto-briefings`, analyst notes, and future corpus writes. | 2026-04-28 Codex continuation added `src/lib/knowledge/evidence-envelope.ts`, corpus-search backfill, SKC related-output fallback, and focused tests. Preserve Firestore as canonical user-facing state. |

---

## #1 — LangGraph runtime foundation

**Lane** 7 · **Brick** 59 · **Status** 🟢 done (Codex continuation)
**Why**: durable, auditable agent execution is the most strategic upgrade. Cloud SQL `praxisbytacitus-instance` (Postgres 16, private IP `10.101.0.3`, db `praxis_langgraph`) is now wired into the backend LangGraph foundation.
**Deliverables**:
- `backend/agents/langgraph/{checkpointing.py, schemas.py, _smoke.py}`
- `backend/agents/requirements-langgraph.txt` (`langgraph`, `langgraph-checkpoint-postgres`, `psycopg[binary,pool]`)
- Health endpoint `GET /agents/health` verifies checkpoint DB reachable
- `.setup()` migration path available for controlled checkpointer setup
- VPC egress + Cloud SQL connector wired for `praxis-backend` Cloud Run service
- Local Postgres integration test
- Firestore `agent_runs/{runId}` schema (`thread_id`, `status`, `expiresAt`, `checkpointThreadId`)
**Acceptance**: targeted `python -m pytest tests\test_langgraph_runtime.py -q` passes; health probe checks Postgres checkpointer; follow-up HQ-01 verifies production deploy behavior and retention.
**Owner notes**: Codex owns hardening and cleanup. Do not move user-facing state out of Firestore.

## #2 — Brainstorming Table → LangGraph migration

**Lane** 8 · **Brick** 18 · **Status** ⚪ queued · **Depends on** #1
**Why**: first multi-step agent with natural pause/edit/resume shape. Validates runtime end-to-end.
**Deliverables**:
- `backend/agents/langgraph/brainstorming.py` graph: persona-turn nodes → critique → synthesis-chair
- Human-in-the-loop interrupt before synthesis lock
- `/api/ai/brainstorming-table` Next.js route delegates to backend graph by `thread_id`
- Resume endpoint accepts edited persona row
- Final output still writes Firestore `tools/brainstorming-table` with provenance
- Cloud Tasks queue `praxis-agents` enqueues long-running deliberation
**Acceptance**: deliberation survives Cloud Run restart; analyst can edit a persona row before synthesis; output has full provenance trail; duplicate task delivery does not create duplicate charges or duplicate output.
**Owner notes**: Codex owns backend graph + Cloud Tasks. Coordinate before changing Claude-owned Brainstorming UI or route files.

## #3 — Structured backend extraction

**Lane** 3 · **Status** ⚪ queued · **Priority** P0
**Why**: raw JSON parsing is the #1 silent-failure surface. Bad model output should fail loudly.
**Deliverables**:
- `backend/graphify_tacitus/extract.py` returns Pydantic models (Node, Edge)
- `backend/graphify_tacitus/schemas/` finalised (cross-references `ACO v2.0` 14 entity types + 72 typed relationships)
- `backend/tests/test_extract.py`: malformed JSON, schema-invalid nodes, empty extraction
- `system_events` row on extraction failure with reason
**Acceptance**: invalid model output triggers visible failure (not empty graph); pytest green; failure emits Operational Spine-compatible `system_events`.
**Owner notes**: Codex backend lane. Keep ACO schema changes explicit and fixture-backed.

## #4 — Document AI ingestion

**Lane** 4 · **Brick** 31 · **Status** ⚪ queued
**Why**: scanned PDFs and layout-heavy reports currently extract too little text via `pdf-parse`.
**Deliverables**:
- New service module `src/lib/documents/document-ai-client.ts` (Layout Parser)
- `cloud_functions/on_document_uploaded/main.py` falls back when `pdf-parse` yields <500 chars
- Chunk metadata: page, heading, table/list hint
- Cost/degrade chip in document detail UI
- Firestore document `documents/{id}` carries `extractionMethod: 'pdf-parse' | 'document-ai'`
**Acceptance**: scanned PDF produces ≥10 usable chunks; UI shows extraction method; degraded fallback writes an observable event.
**Owner notes**: Codex owns function/backend ingestion; Claude owns document UI unless coordinated.

## #5 — Onboarding audit + 5-persona test pass

**Brick** 39 · **Status** ⚪ queued · **Priority** P0
**Why**: first-run UX defines retention. Audit must validate all 7 roles × 10 domains × 4 langs.
**Deliverables**:
- Manual walk-through: UN diplomat, humanitarian lead, legal analyst, mediator, researcher
- Each persona signs up → profile → first situation → first tool
- Capture: friction points, missing rationale messaging (Brick #51 follow-through), red-line capture coverage
- Update `docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md` with addendum
- Open `dev_backlog/` rows for every gap
- Verify `<analyst-profile>` block appears in every calibrated route's system prompt (Lane R)
**Acceptance**: every persona reaches first calibrated tool output without confusion; addendum documented; any failures become `dev_backlog` rows.
**Owner notes**: Claude owns most onboarding UI. Codex should limit itself to docs/tests unless assigned a specific owned file.

## #6 — User creation + auth flow audit

**Why**: production needs zero-defect auth. Audit covers sign-up, ensureUserProfile, 5,000-credit grant, session cookie HMAC, profile snapshot, demo cookie path.
**Deliverables**:
- Smoke matrix: Google, email/password, demo cookie, unauthorised access, expired session, multi-tab consistency
- Verify `users/{uid}/profile/analyst` written on first login (when wizard completes)
- Verify `credit_transactions/{txId}` initial credit row
- Verify `middleware.ts` JWT check rejects tampered token
- Verify `cookie-signer.ts` HMAC mismatch returns 401
- Add Playwright test `tests/e2e/auth-matrix.spec.ts`
**Acceptance**: 6 sign-up paths × 3 sessions matrix all green.
**Owner notes**: Coordinate ownership before editing auth context or middleware; preserve profile and credit bootstrap invariants.

## #7 — All-tools audit (40 tools production check)

**Brick** new (consolidates UX_AUDIT round-6 follow-through)
**Why**: tools shipped at different rounds have inconsistent empty states, citation patterns, persistence ids, demo gating.
**Deliverables**:
- For every tool in `src/lib/constants/tool-registry.ts`:
  - empty state matches `<OnboardingRequiredState />` or tool-specific empty
  - real-data path returns `<DegradedDataChip />` on feed failure (no silent generation)
  - `<ConfidenceBadge />` + `<Citation />` + `<OutputProvenancePanel />` rendered
  - `withCalibration` wraps the AI route
  - `usePersistedToolData` reads canonical `tool-data/{toolId}` (toolKey() helper from Lane J)
  - demo banner present when `isClientDemoMode()`
- Spreadsheet tracker `docs/tools/PRODUCTION_AUDIT_2026-04-27.md` with ✅/⚠️/❌ per axis × tool
**Acceptance**: ≥35 of 40 tools all-green; remaining ≤5 have spec'd fixes filed.
**Owner notes**: Mostly Claude UI/API territory. Codex can own audit docs and backend-only findings.

## #8 — Demo-leak audit close

**Brick** 29 · **Status** P0
**Why**: 5+ tools render Nordalia constants when `!isDemo`. Per-tool list in `docs/tools/UX_AUDIT_2026-04-26.md`.
**Deliverables**:
- Pattern A: gate every demo constant behind `isClientDemoMode()` OR
- Pattern B: remove + replace with `<EmptyState />` if no live data
- `grep -RIn "DEMO_\|NORDALIA_\|isClientDemoMode" src/app/app/` returns ≤30 lines (was higher)
- Add Vitest assertion that no demo constant imports happen on production tool routes
**Acceptance**: production user creating a fresh situation sees zero Nordalia copy outside `/demo/*`.
**Owner notes**: Claude owns current demo-leak closures. Codex should avoid app-page edits unless asked.

## #9 — Landing page production-grade overhaul

**Brick** new (consolidates LP1 + LP2 + Round 5 hero work)
**Why**: hero quadrant tour shipped but full conversion funnel needs polish for paid launch.
**Deliverables**:
- Hero: A/B test heroline (current vs "Defensible policy intelligence")
- AI-companion section: tighten 3-pillar copy + 4-benefit grid + 6-domain matrix
- Add comparison band: "PRAXIS vs ChatGPT vs Bloomberg" feature matrix
- Pricing band: 3 tiers (Analyst $49, Team $199, Enterprise) with correct credit math
- Trust band: client/partner logos, security badges (Google Cloud, GDPR, SOC 2 in-progress)
- Mobile responsive audit: all sections readable at 360px
- WCAG AA compliance: contrast checker + keyboard nav + reduced motion respect
- Lighthouse: ≥90 perf, ≥95 a11y, ≥95 SEO
**Acceptance**: Lighthouse mobile score ≥90/95/90/95 on `/`; 360px and desktop screenshots show no text overlap.
**Owner notes**: Claude owns landing components. Codex may contribute validation notes only unless implementation ownership changes.

## #10 — Vertex AI Search / RAG expansion

**Lane** 5 · **Brick** new
**Why**: Firestore vector layer caps at situation-local. Large public corpora and cross-situation retrieval need a managed tier.
**Deliverables**:
- `src/lib/knowledge/vertex-search-client.ts`
- Retrieval policy in `src/lib/intelligence/corpus-search.ts`:
  - Firestore vector for situation-local chunks (≤500 docs)
  - Vertex AI Search/RAG for large public/cross-situation corpora
  - grounded Google Search for current web facts
- Results normalize to `CorpusItem` (existing contract)
- Cost telemetry to BigQuery
**Acceptance**: situation with 10k+ chunks returns top-k with p95 <1s; provenance preserved.
**Owner notes**: Cross-cut with intelligence/SKC ownership. Normalize everything to existing `CorpusItem`.

## #11 — Real Search / Deep Search Agent multi-session

**Lane** 6 · **Brick** 24
**Why**: today `users/{uid}/agentSessions/active` is a single doc — concurrent Deep Research calls clobber each other.
**Deliverables**:
- Migrate to `users/{uid}/agentSessions/{sessionId}` with `(sessionId, situationId, startedAt, lastActivityAt, expiresAt, summary)`
- `src/app/api/ai/deep-search-agent/route.ts` looks up by `(uid, situationId)`, picks most recent non-expired or creates new
- Grounded Google Search results become `CorpusItem` with citations
- `<DegradedDataChip />` when search degraded
**Acceptance**: two concurrent Deep Research calls coexist; older session preserved.
**Owner notes**: Claude-owned route and intelligence files. Codex should only take backend/storage support work.

## #12 — Cloud Tasks dispatcher

**Brick** 23 · **Status** ⚪ queued · **Priority** P1
**Why**: worker pool single-instance polling doesn't scale. Three queues already exist (`praxis-research`, `praxis-agents`, `praxis-embeddings`).
**Deliverables**:
- Backend dispatcher reads `background_jobs.where('status','==','queued').orderBy('nextRunAt').limit(10)`
- Enqueues into appropriate Cloud Tasks queue based on `kind`
- Worker is HTTP endpoint that consumes a Cloud Tasks delivery, claims via CAS on `lockedBy/lockedUntil`, runs, calls `complete_job`
- Per-job retry policy + parallelism + no custom lock service
- Migration leaves `gdelt-poller` worker pool path until verified
**Acceptance**: 100 queued jobs drain in <5min with parallelism=10; terminal states and retries emit Operational Spine events with `expiresAt`.
**Owner notes**: Codex owns dispatcher/infra. Keep existing worker pool active until production drain is verified.

## #13 — Stripe Meters wiring

**Brick** 54 · **Brick** 27
**Why**: Round 5 shipped `emitMeterEvent` + `emitToolRunMetered` helpers. Need wiring into `withCalibration`.
**Deliverables**:
- `src/lib/api/with-calibration.ts` calls `emitToolRunMetered({uid, toolId, inputTokens, outputTokens, thinkingTokens, creditsDeducted})` on success
- Meters: `vertex.input_tokens`, `vertex.output_tokens`, `vertex_agent.thinking_tokens`, `gdelt.queries`
- Stripe v2 Meters API (per `compass_artifact_*.md`)
- Idempotency key per `tool_runs.{id}`
- Admin page `/app/admin/billing` shows aggregate meter usage per tenant
**Acceptance**: every successful AI route emits a meter event visible in Stripe dashboard within 60s.
**Owner notes**: Helper wiring is partially landed. Token-dimension accuracy depends on AI SDK usage capture.

## #14 — Email notification path

**Brick** 28 · **Status** ⚪ queued · **Priority** P1
**Why**: notifications today live only in Firestore. Critical alerts must escape app.
**Deliverables**:
- Cloud Function `cloud_functions/on_notification_created/main.py`
- Trigger: `notifications.create` where `semaphore in [red,yellow]` and `kind in [action.required, data.ingest_failed, tool.warning]`
- Send via Resend (already in `package.json` deps) — preferred over SendGrid
- Template per `kind` with profile-aware language
- Dedupe by `notificationId`; idempotent retry
- Env: `RESEND_API_KEY` in Secret Manager
**Acceptance**: red/yellow notification arrives in inbox within 2min; dupe suppressed.
**Owner notes**: Use Resend, not SendGrid. Dedupe by notification id and keep retries idempotent.

## #15 — App Check enforcement

**Lane** 16 · **Brick** new
**Why**: protected AI routes need real app traffic, not just stolen session cookies.
**Deliverables**:
- Phase 1: logging-only rollout. `src/lib/api/with-auth.ts` reads `X-Firebase-AppCheck` header, logs `appCheckPresent: true|false` to `system_events`
- Phase 2 (after 7-day burn-in): enforce on mutating AI routes (`/api/ai/*` POST), 403 on missing token
- `src/lib/auth/auth-context.tsx` initialises App Check with reCAPTCHA Enterprise provider
- `src/lib/firebase/admin.ts` verifies App Check token (`admin.appCheck().verifyToken()`)
- Playwright test: missing token → 403
- Documented exceptions for cron + admin paths
**Acceptance**: 7-day metrics show ≥99% of mutating-route traffic carries App Check token; enforcement flag flipped without prod alarm.
**Owner notes**: Logging-only first; enforcement requires clean telemetry and documented cron/admin exceptions.

## #16 — Eval harness

**Lane** 13 · **Brick** 35
**Why**: route audits validate plumbing, not output quality.
**Deliverables**:
- New `evals/` at repo root
- `evals/extraction/` golden set: 20 documents × ground-truth nodes/edges
- `evals/rag/` faithfulness tests: claims must cite a corpus item
- `evals/tools/` tool-output schema validity tests for top 10 tools
- Cloud Build optional gate via `_RUN_EVALS=1`
- Vertex AI Eval integration for model regression (Brick #35)
**Acceptance**: golden extraction set ≥85% precision/recall; faithfulness ≥95%; gate available in CI.
**Owner notes**: Keep default CI fast; wire evals behind `_RUN_EVALS=1`.

## #17 — Sigma.js / Graphology graph canvas

**Lane** 15 · **Brick** 16
**Why**: Conflict Graph D3 SVG breaks past ~500 nodes. Sigma.js uses WebGL.
**Deliverables**:
- Graphology adapter `src/lib/visualizations/graphology-adapter.ts`
- New `<SigmaCanvas />` in `src/components/visualizations/sigma-canvas.tsx`
- D3 fallback behind feature flag `NEXT_PUBLIC_GRAPH_ENGINE=sigma|d3`
- Node click opens `<OutputProvenancePanel />` drawer
- 90-day update sparkline (Brick 14) overlays on edges
- Layout: ForceAtlas2 for >300 nodes; force-directed for smaller
**Acceptance**: 5,000-node graph renders at 60fps; provenance drawer opens on click.
**Owner notes**: Frontend-heavy; Codex should not edit visualization components without explicit lane ownership.

## #18 — Operator Console v2 drill-down

**Brick** 25 · **Status** ⚪ queued · **Priority** P1
**Why**: today flat table; admins need root-cause path.
**Deliverables**:
- Click job row → side panel with full payload, error stack, "Retry" CTA
- New `/api/admin/jobs/{id}/retry` bumps `status=queued, nextRunAt=now`
- Click error event → linked job + linked tool_run + recent events for same uid
- Search bar filtering events by uid (admin-allowlist gated)
- Live `useSemaphoreSummary()` head row
**Acceptance**: admin can drill from `system_events` error to source job in ≤3 clicks; retry action is audit-logged and admin-gated.
**Owner notes**: Pair with IAP admin gating where practical. Redact sensitive payloads before rendering.

## #19 — BigQuery system_events sink

**Brick** 26 · **Status** ⚪ queued · **Priority** P1
**Why**: long-tail observability needs SQL access; Firestore alone won't scale aggregations.
**Deliverables**:
- Cloud Function `cloud_functions/on_system_event_created/main.py` streams to BigQuery `praxis_analytics.system_events`
- Schema mirrors Firestore doc (uid, kind, severity, situationId, toolId, message, payload, createdAt)
- Backfill script `scripts/backfill-system-events.mjs`
- Looker Studio template in `docs/dashboards/`
**Acceptance**: 24h of events queryable in BigQuery; backfill script idempotent.
**Owner notes**: Codex owns function/schema/scripts. Match `docs/OPERATIONAL_SPINE.md` fields and tolerate optional links.

## #20 — Tool output store unification

**Lane** 12 · **Brick** 1
**Why**: `tools/{toolId}` (canonical) vs `tool-data/{toolId}` (UI cache) drift causes silent staleness.
**Deliverables**:
- `src/lib/api/save-tool-output.ts` is the single canonical write helper
- `toolKey()` canonicalisation (Lane J)
- Compatibility reads in `src/lib/services/tool-data-service.ts` until migration complete
- `src/lib/knowledge/tool-output-layer.ts` reads canonical store
- Migration script `scripts/migrate-tool-data.mjs` (idempotent)
- Test: SKC retrieves newly generated outputs immediately
**Acceptance**: every AI route writes through one helper; SKC retrieval works without legacy fallback.
**Owner notes**: Cross-cut with Claude-owned service files. Avoid broad migration without tests and coordination.

## #21 — Postgres cleanup + retention

**Lane** 14
**Why**: Cloud SQL has no Firestore-style TTL. Without cleanup, checkpoint DB grows unbounded.
**Deliverables**:
- Firestore `agent_runs.expiresAt` (90d active, 30d completed brainstorming, 90d failed)
- New cron `/api/cron/cleanup-checkpoints` runs nightly
- Calls LangGraph `delete_thread(thread_id)` for expired runs (uses checkpointer API, never raw SQL)
- Marks Firestore row `checkpointDeletedAt`
- Emits `system_events` row per cleanup batch
- Cloud Scheduler config in `infrastructure/setup-gcp.sh`
**Acceptance**: dry-run shows expired threads; live run deletes them; `system_events` recorded.
**Owner notes**: Codex owns. Use LangGraph checkpointer API (`delete_thread`) instead of raw SQL.

## #22 — Final docs + deploy + smoke

**Why**: every round must close with green deploy + handoff for next agent.
**Deliverables**:
- Update `docs/CONTINUATION.md` with round-6 block
- Flip statuses in `docs/TODO_BOARD_2026-04-26.md`
- Append round-6 entries to `CHANGELOG.md` Unreleased
- Update `docs/CODEX_HANDOFF_<next-date>.md` with file ownership delta
- Trigger `gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus`
- Smoke `/`, `/login`, `/api/health` (all 200)
- Append build id + revision to `docs/DEPLOYMENT_LOG.md`
- Memory update: bump `project_praxis_tacitus.md` if architectural state changed
**Acceptance**: production at praxis.tacitus.me serves new revision; smoke green; next-agent handoff ready.

---

## Execution model

- **Sequence**: #1 has landed; harden via HQ-01, then prioritize #2, #3, #4, #12, #18, and #21.
- **Parallelism**: #3, #4, #5, #6, #7, #8, #9 are independent and can run in parallel agents.
- **Daily checkpoint**: validation gate must pass before any commit lands on `main`.
- **Codex handoff**: when finishing a brick, append a row to `CONTINUATION.md` describing what shipped and what's queued next.

## Out of scope (intentional)

- SOC 2 / DPA path (Brick 30) — human-only owner; track separately
- ACLED reintegration — vendor explicitly retired
- Vercel re-migration — Cloud Run is the deployment target
- Neo4j cluster — falls back to Firestore subcollections; cluster only if usage demands it

## Cross-cutting invariants (don't drift)

1. Every AI route stays calibrated unless documented exempt.
2. Every Firestore collection write keeps `expiresAt` aligned to TTL policy.
3. Every async unit of work emits `tool.started` / `tool.completed` / `tool.failed` events.
4. Every agent proposal writes to a queue, never canonical state.
5. Every model string flows through `src/lib/ai/providers.ts`.

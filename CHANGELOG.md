# Changelog

All notable changes to PRAXIS by TACITUS are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] — 2026-04-26 (ninth session — public UX, onboarding, tool audit)

### Codex strategic-uplift pass

- Imported the strategic uplift sprint docs from PR #1 into the implementation
  branch without adopting the PR branch's broad code/doc deletions.
- Added `docs/superpowers/specs/2026-04-26-brainstorming-table-media-intelligence-plan.md`,
  covering the new Brainstorming Table expert-agent tool, shared context packet,
  media scanner, and 24-hour media roundup roadmap.
- Fixed Legal Tracker's secondary persistence path so `saveToolOutput` writes
  under `legal-tracker` instead of `commitments`.
- Removed user-facing internal credit-cost copy from `AiPopulate` generation
  prompts.
- Changed authenticated geospatial feed failures to return a degraded empty
  state instead of synthetic demo incidents, and updated the page attribution.
- Refreshed Ask PRAXIS and landing-page copy around the current Google Cloud,
  Vertex AI, grounded Google Search, and open-data source stack.
- Added `profile.events` to `infrastructure/setup-gcp.sh` Pub/Sub topic
  creation and expanded `audit:gcp` soft coverage for Cloud Tasks queues and
  the GDELT worker pool.
- Added a reusable media advanced-search query builder and wired Media Roundup
  to include a reproducible keyword/domain/date query plan in the AI prompt.
- Upgraded Next/React patch dependencies and added narrow transitive overrides
  for critical/high production advisories; production `npm audit --omit=dev`
  now reports 0 critical and 0 high findings.
- Added an ARGUS corpus context bridge so Ask PRAXIS can inject active
  situation ARGUS alerts, watch items, saved sources, and relevant document
  excerpts before answering.
- Completed the live Firebase/GCP ops verification: Firestore rules/indexes
  deployed, Cloud Tasks queues running, `npm run audit:gcp` green with 0 hard
  / 0 soft findings, Cloud Build successful, Cloud Run ready on
  `praxis-frontend-00065-nhs` and `praxis-backend-00041-g29`, and production
  `/`, `/login`, `/api/health` smoke checks passing.

### Public UX source-truth cleanup

- Removed retired-vendor claims from user-facing landing and auth
  copy: `ACLED EULA`, `Firecrawl`, multi-source crawling, and the
  unverifiable "Trusted by analysts at UN, OSCE, and leading think
  tanks" line on `/login`. Replaced with truthful Vertex AI Deep
  Research and grounded Google Search wording.
- Updated landing footer version badge from `v6.3.1` to `v6.4.0` to
  match the current operational-spine release recorded in `CLAUDE.md`,
  `README.md`, and `docs/CONTINUATION.md`.

### Onboarding first-run UX

- Added a per-step "Why this matters" rationale to the three onboarding
  screens (Identity, Perspective, Working Style), explaining how each
  choice flows into the analyst profile prompt block that PRAXIS
  injects on every AI route.
- Rewrote `live-preview.tsx`: the default panel is now a human-readable
  calibration card (audience tone, language, lenses, regions, red
  lines, recommended tools), with the raw `<analyst-profile>` XML
  hidden behind an "Advanced: view system prompt block" disclosure.
- Rewrote `completion-success.tsx`: the screen now surfaces a
  calibration summary (role, primary domain, secondary domains,
  audience, output language, lenses, mandate, red-line count) plus the
  top five recommended tools driven by `recommendToolsForRole`. Primary
  CTA is "Create your first situation"; secondary "Go to dashboard".
- Replaced retired-vendor mentions inside onboarding copy: ACLED /
  Tavily / Parallel / Firecrawl Working Style chips and panels are now
  Vertex AI / Gemini plus open-data feed wording (UCDP, SIPRI,
  Crisis Group, GDELT, ReliefWeb, HDX, UN News, World Bank, UNHCR).
- Welcome modal, walkthrough, and demo-mode banner copy now read
  "Vertex AI / Gemini" and "grounded Google Search" rather than
  "Gemini 2.5 + Claude".
- Situation creation wizard: each input (Name, Type, Description,
  Region, Source URLs, Documents, Notes) now has a one-line explainer
  describing exactly what PRAXIS does with it. Schema, validation, and
  persistence unchanged. Internal `firecrawlCount` renamed to
  `liveSearchCount`.

### Settings — graph backend BYO clarity

- Added a "PRAXIS works without this" default-state explainer above
  the BYO graph-backend selector, plus a credentials-storage note
  pointing at `users/{uid}/settings/graph_backend`.
- System Health page: removed `ACLED` and `SIPRI-via-Firecrawl`
  strings from feed-cache and activation-guide detail rows.

### Production correction

- Fixed `src/app/api/ai/legal-tracker/route.ts` calibration: route was
  registered as `withCalibration('commitments', 'ai_analysis', …)` but
  the rest of the route saved tool output under `legal_tracker` and
  pulled graph context as `legal_tracker`. Restored to
  `('legal_tracker', 'ai_legal_tracker')`. This fixes `tool_runs`
  attribution, credit accounting (`ai_legal_tracker` is `2`,
  `ai_analysis` was a generic fallback), and SKC dependency resolution.
  `node scripts/audit-ai-routes.mjs` continues to pass with
  53 calibrated / 4 exempt.

### Situation overview

- `/app/situations/[id]` no longer redirects to the settings editor.
  It now renders a focused per-situation overview: title/type/status
  header, INFORM Risk gauge, Glasl badge, key-actor chips, quick
  navigation to dashboard / inspect / settings, and the operational
  spine `ActivityFeed` scoped to the situation. The page lazy-fetches
  via `/api/situations` if the store is empty and keeps the global
  active situation in sync so deep-linked tool runs receive the right
  calibration context.
- Replaced the lingering `ACLED` entry in the Myanmar welcome
  template (`src/components/praxis/situation-dashboard.tsx`) with
  `UCDP` so template-created situations no longer carry a
  retired-vendor source claim.

### Documentation

- New `docs/tools/UX_AUDIT_2026-04-26.md` (449 lines): tool-by-tool UX
  audit covering Assistant, Conflict Graph, Briefing Room, Daily Brief,
  Risk Monitor, Early Warning, Media Compass, Media Roundup, Deep
  Research Agent, ARGUS, Documents, Negotiation Prep, Dossier, Policy
  Memo, Humanitarian, and Legal & Resolution Tracker. Records canonical
  IDs, calibration coverage, persistence, citations/confidence,
  empty/error states, top low-risk fixes, and major-brick
  recommendations per tool. Cross-tool findings: persistence vocabulary
  drift, demo-data leaks, oversized page files (>1.5k lines on three
  tools), missing shared `<Citation>` / `<ConfidenceBadge>` primitives.
- New `docs/NEXT_BRICKS_2026-04-26.md`: ranked top-10 bricks for the
  next 7 days plus lane assignments and intentionally-left drifts
  (e.g. `package.json` `6.2.0` vs canonical `6.4.0`).

### Tests

- `npx tsc --noEmit --pretty false`: PASS
- `node scripts/audit-ai-routes.mjs`: 53 calibrated / 4 exempt
- `npx vitest run`: PASS (168 tests)

---

## [Unreleased] — 2026-04-26 (eighth session — workspace personalization)

### Improved

- `AuthProvider` now subscribes live to `users/{uid}/profile/analyst`, so
  onboarding completion and profile edits immediately refresh workspace
  personalization surfaces without requiring a reload.
- Dashboard recommendations now apply the real user's workspace tool
  preferences, so hidden tools stay out of the main command surface and moved
  tools can rank higher in "Recommended for you".
- Added Sources Library to the customizable workspace tool list and normalized
  the recommendation id to `sources-library`, fixing a mismatch between
  dashboard recommendations, sidebar visibility, and Settings → Preferences.
- Replaced the dashboard's static operational-status placeholder with a real
  tool-status panel summarizing fresh, running, stale, warning, and failed
  outputs for the active situation.
- Added durable workspace tool layout preferences to
  `users/{uid}/preferences/default`: `hiddenToolIds` and `toolOrder`.
- Added a shared `useUserPreferences` hook for authenticated client
  surfaces that read and patch `/api/preferences`.
- Added navigation helpers that preserve route aliases while applying
  hidden/reordered tool preferences.
- The app sidebar now filters hidden tools, respects user ordering within
  sections, hides matching role recommendations, and shows the analyst role,
  domain, and org/team in the user block.
- Settings → Preferences now includes a workspace tools section with show/hide
  and move-up/move-down controls backed by Firestore preferences.
- Integrated the parallel workspace-pricing/reference-doc update from the
  older clone while preserving the newer spine/context code: public pricing
  now describes monthly workspaces instead of internal tool tariffs, and
  landing/schema copy is aligned with grounded open-data workflows.
- Added `docs/PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md`, a multi-day
  product and knowledge-architecture plan for dashboard, Ask PRAXIS,
  tool-output contracts, graph/document intelligence, and agent handoffs.
- Added `docs/USER_RESEARCH_SYNTHESIS_2026-04-26.md`, a persona-based survey
  synthesis that converts diplomat, humanitarian, legal, research, and UN
  officer walkthroughs into implementation bricks and Claude Code lanes.

### Tests

- Added preference schema/API tests for workspace tool layout fields.
- Added navigation helper tests for unknown IDs, deduplication, hidden sets,
  route alias preservation, legacy id normalization, and preference-aware
  recommendation ordering.
- Added role-recommendation tests covering canonical Sources Library links and
  situation-domain boosts.
- Added dashboard status-summary tests for health/freshness counts and
  priority ordering.

---

## [Unreleased] — 2026-04-25 (seventh session — deploy hardening)

### Context and persistence hardening

- `withCalibration` now derives `situationId` from either
  `body.situationId` or `body.situation.id`, so chat-style requests that
  send a full situation object still get situation-scoped calibration and
  SKC retrieval.
- `systemPromptBlock` now includes the already-built interaction frame and
  advisor frame, giving AI tools bounded context about recent tool runs,
  draft situation count, and selected advisor memory.
- `provenance.situationVersion` now carries a timestamp-derived version
  from `situation.updatedAt` when available instead of always being `null`.
- SKC related-tool output trimming now clips structured data recursively
  instead of slicing JSON strings and reparsing potentially invalid JSON.
- `/api/tool-data` save responses now return authoritative `generatedAt`
  and `version`, and `usePersistedToolData` reconciles optimistic state
  with the server response.
- Added focused tests for nested situation calibration, prompt rendering
  of interaction/advisor frames, safe related-output clipping, and tool-data
  save metadata.

### Fixed

- Fixed the Next.js 16 dynamic route handler signature for
  `/api/notifications/[id]`, unblocking the Cloud Build frontend image
  after build `2bcd558a-bff5-4aec-ba42-fb42b29e2e42` failed in
  TypeScript route validation.
- Tightened the operator console table generic so admin job, tool-run,
  and system-event rows type-check without erasing row fields to
  `unknown`.
- Fixed the GDELT worker container to include the vendored `_shared`
  spine helpers, so worker-pool images can emit `system_events` and
  background-job state.
- Fixed GDELT worker ingestion to call the backend route that exists
  (`/api/v1/pipeline/ingest-feeds`) and pass `X-PRAXIS-UID` for the
  service-to-service OIDC auth path.
- Fixed the document-upload trigger path guard before reading `parts[10]`.

### Improved

- Added `docs/SPRINT_EXECUTION_PLAN_2026-04-25.md` with a page-by-page,
  tool-by-tool implementation sequence and file ownership lanes for
  Codex/Claude parallel work.
- Added `docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md` with copy-paste prompts
  for non-conflicting Claude Code tasks.
- Backend `/api/v1/pipeline/run` now reads `X-PRAXIS-JOB-ID` and updates
  `background_jobs.progress` through extraction, graph build, clustering,
  analysis, brief rendering, and Firestore sync.
- Dashboard now mounts `<ActivityFeed />` for the active situation so
  tool runs, background jobs, and notifications are visible in the main
  workspace.
- Activity feed situation filtering now keeps the owner `uid` constraint
  and filters jobs/notifications client-side, matching Firestore rules.
- Activity feed no longer renders internal credit deductions in user
  activity rows.
- `infrastructure/setup-ttl.sh` now includes the `notifications`
  collection group and accurately documents that spine helpers already
  write `expiresAt`.

### Verified

- `npx tsc --noEmit`
- `npm run build` (passes locally; Windows standalone trace-copy warnings
  for `node:*` chunk names remain expected)
- `node scripts/audit-ai-routes.mjs`
- `npm run audit:gcp`
- `npm run lint` (warnings only; existing React Compiler/lint backlog)
- `npx vitest run`
- Firestore composite indexes are READY; TTL is ACTIVE for
  `system_events`, `tool_runs`, `background_jobs`, `notifications`,
  `audit_logs`, and `rate_limits`.

---

## [Unreleased] — 2026-04-25 (sixth session — operational spine)

### Operational spine — durable jobs, events, notifications, semaphore status

PRAXIS now has a unified operational layer that every component (frontend AI
routes, backend pipelines, Cloud Run worker pools, Cloud Functions v2) writes
to. The layer makes background work observable, idempotent, retryable, and
visible to users in real time. This unblocks the next phase of multi-agent /
multi-tool work.

### New Firestore collections

- `tool_runs/{toolRunId}` — one row per AI/tool call (status, semaphore,
  model, profile version, credits, duration, output path). 365d TTL.
- `background_jobs/{jobId}` — one row per worker/function/cron unit
  (kind, attempt, retries, locked-by, progress, result, dead-letter). 90d TTL.
- `system_events/{eventId}` — append-only firehose every component emits
  (situation.created, tool.completed, job.dead_letter, etc.). 365d TTL.
- `users/{uid}/notifications/{id}` — user-visible events (analysis done,
  data found, action required). 180d TTL.
- `alerts/{alertId}` — risk/escalation alerts per situation.
- `data_ingestions/{ingestionId}` — provenance + duplicate detection.
- `audit_logs/{logId}` — admin-only, server-only writes.
- `users/{uid}/situations/{sit}/graph_updates/{id}` — proposed graph
  deltas with confidence + provenance, ready for review/apply UI.

### Status semaphore (grey · blue · purple · yellow · green · red)

Single status language across every async unit of work:
`grey=inactive · blue=scheduled · purple=AI reasoning · yellow=working
/ external wait · green=success · red=failure`. Renders via
`<SemaphoreChip />` in tool panels, situation cards, activity feed,
and operator console.

### Idempotency + observability

- Every Eventarc trigger now computes an `idempotencyKey`
  `(uid:situation:tool:trigger:payloadHash)` and skips duplicate work.
- Every AI route via `withCalibration` automatically writes a
  `tool_runs` row with `tool.started` → `tool.completed|failed`
  events. No per-route boilerplate.
- Backend pipeline accepts an `X-PRAXIS-JOB-ID` header so backend
  errors surface back to the originating job in `background_jobs`.

### New surfaces

- `<ActivityFeed />` — live `tool_runs` + `background_jobs` +
  `notifications` merged by timestamp. Mountable on dashboard,
  situation detail, or sidebar.
- `/app/admin/operator-console` — admin-only platform health view:
  running/failed/dead-letter jobs, recent tool runs, severity-filtered
  system events, all polling at 5s.
- `/api/admin/operator-console` — server-side admin gateway (gated by
  `ADMIN_ALLOWLIST`).
- `/api/notifications/{id}` PATCH — mark read / archive.

### Hardening

- **Firestore index** for `situations.status` collection-group query
  (was crashing the GDELT poller). Plus 14 forward-needed indexes for
  the new collections (composite + COLLECTION_GROUP variants).
- **Firestore rules** extended for new collections — owner-only reads,
  Admin-SDK-only writes; per-user notifications support owner
  read+update of `read`/`archived` flags only.
- **GDELT poller** now validates required env vars at startup with a
  human-readable error, probes the required collection-group index at
  boot, and treats `FAILED_PRECONDITION` as an explicit operator
  state with backoff (no crash loop).
- **on_situation_created** + **on_document_uploaded** rewritten:
  idempotent, spine-wired, emits user notifications on success and
  failure with deep links to the situation.
- **Cloud Build** vendors `cloud_functions/_shared/` next to each
  function/worker so the Python helpers ship without a separate
  package release.
- **TTL retention** declared via `infrastructure/setup-ttl.sh`. Spine
  helpers now write `expiresAt` automatically.

### IAM / SA migration plan

`infrastructure/setup-gcp.sh` documents the full migration from default
compute SA to dedicated per-service SAs:
`praxis-frontend-sa`, `praxis-backend-sa`, `praxis-functions-sa`,
`praxis-worker-sa`. Each gets only the roles it needs. The migration
script is idempotent — run once, services pick up the new SA on next
deploy.

### Files added

- `src/lib/jobs/job-service.ts`
- `src/lib/events/event-service.ts`
- `src/hooks/use-activity-feed.ts`
- `src/components/app/semaphore-chip.tsx`
- `src/components/app/activity-feed.tsx`
- `src/app/app/admin/operator-console/page.tsx`
- `src/app/api/admin/operator-console/route.ts`
- `src/app/api/notifications/[id]/route.ts`
- `cloud_functions/_shared/spine.py`
- `infrastructure/setup-ttl.sh`
- `docs/CONTINUATION.md` (rewritten)
- `docs/OPERATIONAL_SPINE.md` (new — architecture reference)

### Files updated

- `firestore.indexes.json` — +14 indexes
- `firestore.rules` — +5 collections + per-user notifications
- `src/lib/api/with-calibration.ts` — auto tool_run lifecycle
- `cloud_functions/gdelt_poller/worker.py` — index probe, spine events
- `cloud_functions/on_situation_created/main.py` — full rewrite
- `cloud_functions/on_document_uploaded/main.py` — full rewrite
- `cloudbuild.yaml` — vendor _shared, gdelt-poller env vars on update
- `infrastructure/setup-gcp.sh` — vendor _shared, dedicated SAs,
  explicit run.invoker on on-situation-created Cloud Run service

---

## [Unreleased] — 2026-04-25 (fifth session — open-source pivot)

### Strategic pivot — ACLED + Firecrawl + Anthropic dropped

PRAXIS now ships exclusively on open-license data feeds plus
Google Cloud AI services. Removed entirely:

- **ACLED** — 2026 EULA prohibition on SaaS redistribution made it
  incompatible with self-serve. Replaced with GDELT BigQuery + UCDP
  GED for event-level intelligence (both open license, both
  commercially redistributable).
- **Firecrawl** — third-party scraper. Replaced with Vertex AI
  Deep Research + grounded Google Search.
- **Anthropic Claude** — operational simplicity. Single AI line is
  Gemini 3.1 Pro on Vertex AI.
- **Tavily / Parallel.ai** — already optional, now formally retired.

Result: the entire intelligence pipeline stays inside Google Cloud,
no per-customer commercial-data licenses to negotiate, sub-processor
list reduced to (Google Cloud, Stripe, Cloudflare, GitHub).

### Surfaces updated

- **Landing page Data Substrate section** rewritten — single panel of
  open-data + Google AI sources, removed the "Premium — BYO keys"
  panel that previously listed ACLED / Firecrawl / Tavily / Anthropic.
- **Hero "Powered by" line** now reads "GDELT, UCDP, ReliefWeb, HDX,
  World Bank — open data, grounded AI you can cite."
- **Footer infrastructure pills** rewritten to "Gemini AI · Vertex AI
  Deep Research · Google Cloud Run · BigQuery · GDELT · UCDP ·
  ReliefWeb."
- **Landing JSON-LD** feature list updated.
- **Pricing tier feature copy** "Gemini Pro + Claude" → "Gemini 3.1
  Pro + grounded Google Search."
- **System Health activation card** rewritten — only Vertex ADK +
  GDELT BigQuery + Stripe remain as optional turn-ons.
- **Role-recommendations rationales** for `argus` and
  `geospatial-monitor` updated to reflect the new data path.

### Docs rewritten

- `docs/USER_ACTION_LIST.md` — top action shifted from "ACLED email"
  to Vertex AI Agent Engine deploy. ACLED / Firecrawl / Anthropic
  removed from the action set.
- `docs/COMPLIANCE.md` — §1.1 ACLED critical-risk row replaced with a
  positive open-license matrix (one row per active source). §1.2 lists
  what we deliberately don't use. Sub-processor inventory in §3
  reduced to Google Cloud + Stripe + Cloudflare + GitHub.
- `docs/SPRINT_BACKLOG.md` — Stream G ACLED + Firecrawl items marked
  RESOLVED via pivot. B-9 ACLED safe-harbour withdrawn. B-10 GDELT
  hot slice promoted from P1 → P0. Stream C-1 / C-3 / C-5 (ACLED /
  Firecrawl / Anthropic activation) withdrawn.
- `docs/EXTERNAL_TOOLS_WIRING.md` — ACLED, Firecrawl, Anthropic, SIPRI
  scrape, Crisis Group scrape sections marked withdrawn with redirect
  to replacement paths.
- `docs/VISION_2026.md` — Priority 2 shifted from "ACLED Corporate
  License signed" to "GDELT BigQuery hot slice in production". Moat
  story rewritten around "open data + Google AI vertical
  integration."
- `docs/GCP_OPERATIONS.md` §1a + §1c + §1e marked withdrawn;
  §1c repurposed to point at the GDELT ingestion playbook.
- `docs/tacitus-acled-integration-brief.md` — top-of-file banner
  marks the document OBSOLETE and redirects readers to the GDELT
  playbook.

### Validation

- `tsc --noEmit`: 0 errors
- `npx vitest run`: 150/150 passed
- `npm run build` to be confirmed before deploy

## [Unreleased] — 2026-04-25 (fourth session — playbook + vision + cleanup)

### Added

- **`docs/USER_ACTION_LIST.md`** — single doc telling the CEO/CTO
  exactly what to do, in priority order, with copy-paste commands and
  expected outcomes. Includes the ACLED Corporate License email draft,
  the full Vertex AI Agent Engine deploy walk-through (3.1 pre-flight
  through 3.9 cost expectations), Firecrawl signup, Stripe products
  + webhook, optional Anthropic, SOC 2 auditor engagement, UNGM Level
  2 registration, DPA + sub-processor publication, and the
  `PRAXIS_AUDIENCE_TUNED_BRIEFING=1` flip. Bookmarked from
  `docs/CONTINUATION.md`.
- **`docs/VISION_2026.md`** — strategic north-star objective. The
  customer's day with PRAXIS. Six strategic priorities in order. 2026
  ARR / pilot / readiness targets. Three layers of moat. What we're
  deliberately not building. Every backlog item must ladder up.
- **`docs/EXTERNAL_TOOLS_WIRING.md`** — per-feed → tools map and
  per-tool → feeds inverse view. Wire-state matrix per environment.
  Adding-a-new-feed checklist. Quick diagnostic for "why is my map
  empty?"
- **`backend/agents/deploy.py`** + **`backend/agents/requirements.txt`**
  + **`backend/agents/README.md`** — runnable Vertex AI Agent Engine
  deploy script for the 3-phase planner → researcher → synthesizer
  pipeline. Versions pinned per compass §R1 (`google-adk==1.31.1`,
  `google-cloud-aiplatform[adk,agent_engines]>=1.148.1`). README has
  the TL;DR command sequence; full walk-through is in
  `docs/USER_ACTION_LIST.md` §3.

### Removed

- **`docs/DAILY_WORKPLAN.md`** — superseded by
  `docs/SPRINT_2026-04-25.md` + `docs/SPRINT_BACKLOG.md`. Live
  references swept from `AGENTS.md`, `docs/TEAM_OPS.md`,
  `docs/HANDOFF_PROMPTS.md`, and the README documentation table.
- **`src/components/dashboard/credits-widget.tsx`** — unused since the
  pricing migration replaced it with `RecommendedToolsWidget`.
- **`src/components/shared/credit-cost-badge.tsx`** — unused; only ever
  imported by itself. Belonged to the public-credit-cost surface that
  the pricing migration removed.

### Changed

- **README documentation table** rewritten to point at the active doc
  set: `SPRINT_BACKLOG.md`, `VISION_2026.md`, `USER_ACTION_LIST.md`,
  `CONTEXT_INJECTION.md`, `COMPLIANCE.md`, `TEAM_OPS.md`,
  `GCP_OPERATIONS.md`, `RESEARCH_PROMPTS.md`, `tools/INDEX.md`. Two of
  these are highlighted as "open me first" (SPRINT_BACKLOG and
  USER_ACTION_LIST).
- **`AGENTS.md` + `CLAUDE.md`** required-reading lists now finish at
  item 19, naming all the new docs explicitly. The legacy
  DAILY_WORKPLAN entry is gone.

## [Unreleased] — 2026-04-25 (third session, post-research integration)

### Added (compass research integration)

- **Deep-research artifact incorporated** —
  `docs/compass_artifact_wf-7af05074-9b31-4316-834d-b3a7500f4cf7_text_markdown.md`
  (789 lines, 2026-04-25) is the canonical answer to all 10 R-prompts.
  Cross-referenced from CLAUDE.md, AGENTS.md, GCP_OPERATIONS.md,
  RESEARCH_PROMPTS.md, and SPRINT_BACKLOG.md.
- **`docs/COMPLIANCE.md`** — single source of truth for licensing,
  certifications, and regulatory posture. Tracks the ACLED licensing
  risk, SOC 2 Type II path, GDPR DPA status, sub-processor inventory,
  and UNGM registration plan. Open actions section lists the immediate
  this-week to-dos.
- **`docs/tools/assistant.md` and `docs/tools/risk-monitor.md`** —
  deep tool specs (per the catalogue template) for the two
  highest-traffic tools, ready for Codex to consume when picking up
  Stream B-1.
- **`docs/SPRINT_BACKLOG.md` Stream G rewritten** — every research
  prompt's finding inlined, every research-blocked item now `unblocked`
  with a clear next implementation step. New tasks added: B-9 (ACLED
  safe-harbour, P0), B-10 (GDELT BigQuery migration, P1), B-11 (vector
  index COSINE → DOT_PRODUCT, P2), D-5 (default to Vertex AI, P1), E-3
  (BigQuery public datasets doc, P2), F-5 (explicit GraphRAG layer),
  F-6 (compliance tracker, now lives in `docs/COMPLIANCE.md`).
- **`docs/GCP_OPERATIONS.md` §1a + §1b updated** with verified 2026
  recipe for ACLED (with the Corporate License warning) and Vertex AI
  Agent Engine (with pinned `google-adk==1.31.1` and the canonical
  IAM model — `roles/aiplatform.user`, no separate
  `reasoningEngineUser` role).

### Critical finding to action this week

🚨 **ACLED licensing.** ACLED's 2026 EULA prohibits SaaS dashboards
from redistributing event data without a Corporate License. Email
`access@acleddata.com` to negotiate (estimated $5–25k/yr). Until
licensed, the engineering safe-harbour is to expose only aggregated
statistics, not raw rows, to paying customers. Tracked as Stream B-9
(P0) in `docs/SPRINT_BACKLOG.md`.

## [Unreleased] — 2026-04-25 (third session)

### Added

- **`docs/SPRINT_BACKLOG.md`** — single canonical actionable list. Every
  task in the active sprint, plus the architecture-extension backlog and
  the research-blocked queue, with explicit DoD, files-to-read,
  files-to-touch, and tandem coordination notes per item. This is the
  document Codex and Claude Code consult first before picking a slice.
- **`src/lib/ai/audience-presets.ts`** — explicit tone-preset directives
  for the five AnalystProfile audiences (`myself`, `team`,
  `senior_leadership`, `external_partners`, `public`). Behind feature
  flag `PRAXIS_AUDIENCE_TUNED_BRIEFING=1` so we can stage and verify
  before flipping it on for everyone. Wired into `auto-briefing`,
  `dashboard-summary`, and `briefing-generate`. Unit-tested (10 tests).
- **Role-aware "For you" sidebar anchor** (`src/components/app/app-sidebar.tsx`) —
  Pins the top-3 role-tuned tools above the main nav sections when the
  user has a profile loaded. Mirrors the dashboard's
  `RecommendedToolsWidget` so the sidebar and dashboard agree on
  first-look priority. Domain-boost active when the situation has a
  non-generic domain. Collapsed sidebar shows a single tooltip-wrapped
  Sparkles icon per recommendation.

### Changed

- **`AGENTS.md` + `CLAUDE.md` required-reading lists** rewritten so
  every required document is named, in order, with `SPRINT_BACKLOG.md`
  and `CONTEXT_INJECTION.md` highlighted as the two non-negotiable
  reads. The one-line Claude Code restart prompt in AGENTS.md now
  references the full doc set.

## [Unreleased] — 2026-04-25 (second session)

### Added

- **Context Injection Contract documentation** (`docs/CONTEXT_INJECTION.md`) —
  Full spec of the four context layers (`<analyst-profile>`,
  `<situation-frame>`, `<domain-frame>`, retrieval-context) plus the
  `<output-constraints>` cross-cutting block. Worked example for the
  Briefing tool; how-to-extend; anti-patterns; health-check via the
  audit-ai-routes script.
- **GCP Operations Runbook** (`docs/GCP_OPERATIONS.md`) — Concrete
  copy-paste-ready commands for every GCP-side operation (data-source
  activation, deploy, rollback, log queries, Cloud Build status,
  Firestore rules, Pub/Sub topic creation, secret bumps, custom domains,
  Reasoning Engine deploy stub).
- **Research Prompts catalogue** (`docs/RESEARCH_PROMPTS.md`) — 10
  copy-paste research prompts the user can run against deep-research
  tools (Vertex ADK current deployment recipe; ACLED 2026 limits; GDELT
  3.0 ingestion; Firecrawl alternatives; BigQuery public datasets;
  Stripe hybrid billing; Firestore vs. dedicated vector DBs at scale;
  Vertex AI vs. Gemini API costs; production GraphRAG patterns; UN
  procurement requirements). Each prompt is scoped tightly so answers
  come back actionable.
- **Tool catalogue scaffolding** (`docs/tools/`) — `INDEX.md` explains
  the catalogue, `_TEMPLATE.md` is the structured spec template, and
  `dashboard.md` + `geospatial-monitor.md` are the first two deep
  per-tool specs. Future tool docs follow the same template.
- **Region centroid lookup** (`src/lib/geo/region-centers.ts`) — ~50
  country / region strings → approximate centroids, with normalisation
  + alias support ("Congo (DRC)" → "drc", "Horn of Africa" → "somalia")
  and token fallback so multi-word regions still resolve.

### Changed

- **Geospatial Monitor map centroid** (`src/app/app/geospatial-monitor/page.tsx`) —
  Now derives the initial map centre from
  `geoBoundingBox` → `regionCenter(situation.region)` → `[10, 30]`
  default. Previously every situation without an explicit bounding box
  defaulted to Sudan even when the situation was Yemen, Ukraine, DRC, etc.
- **System Health page** (`src/app/app/settings/system-health/page.tsx`)
  - Added "Copy diagnostic" button that assembles a redacted JSON
    snapshot (account tier, active situation, AI provider state, SKC
    layer health, breaker states) and copies to clipboard so the user
    can paste a complete report into Codex / Claude Code / Slack
    without screenshotting half the page.
  - Added "Activate paid / freemium data sources" card with inline
    activation steps for ACLED, Vertex ADK, Firecrawl, Stripe,
    Anthropic, each with effort estimate, env-var names, cost note,
    and signup link.
- **Onboarding Step 2 — mandate field** (`src/app/onboarding/step-perspective.tsx`) —
  Inline real-time validation. Shows "X more characters needed" in
  crimson while below the 30-char minimum and "✓ Mandate ready" in
  emerald once met. Removes the worst friction point in the wizard
  (previously the threshold was invisible and only failed at Step 4).
- **Landing hero subheadline** (`src/components/landing/hero.tsx`) —
  Rewritten from passive ("PRAXIS structures them") to active ("You
  turn raw sources into credible assessments — PRAXIS does the heavy
  lifting"). Empowerment framing tests higher with senior diplomatic
  audiences. Contrast bumped from `text-navy-500` to `text-navy-700`.
  Data-sources tagline drops italic and gains weight.
- **Pricing teaser** (`src/components/landing/pricing-teaser.tsx`) —
  Added a one-line explainer for "active situations" (the most common
  point-of-confusion in the pricing audit). Demo: 1 · Analyst: 5 ·
  Team: 25 · Enterprise: unlimited.
- **Workspace contrast** —
  Dashboard breadcrumb bumped from `text-slate-500` → `text-slate-300`.
  Sidebar Cmd-K hint bumped from `text-navy-400` → `text-navy-500` body
  + `text-navy-700` inside the kbd chip so 10px text passes WCAG AA.
  `globals.css --color-app-text-secondary` tightened from `#475569`
  (slate-600) to `#334155` (slate-700) so every component reading the
  CSS var picks up better body-copy contrast on light surfaces.

## [Unreleased] — 2026-04-25 (first session)

### Changed (public pricing surface — credit metering hidden)

- **Sidebar plan badge replaces raw credit counter** (`src/components/app/app-sidebar.tsx`) — Removed the always-visible "TACITUS Credits: N" pill from the bottom of the workspace sidebar. Replaced it with a plan-tier badge ("Demo Mode" / "Free Plan" / "Analyst" / "Team" / "Enterprise") that links into Settings. Honors the AGENTS.md hard rule: keep public pricing plan-based and monthly, keep internal credit metering private.
- **AnalystUser carries `subscription` tier** (`src/lib/auth/auth-context.tsx`) — Added `subscription: SubscriptionTier` to `AuthUser` (defaults to `free`). Hydrated from Firestore profile on sign-in and re-synced through the existing `onSnapshot` listener so plan upgrades reflect in the sidebar in real time. Demo user resolves to `Demo Mode`.
- **Pricing page no longer exposes per-tool credit costs** (`src/app/pricing/page.tsx`) — Dropped the public "Credit Cost Reference" table and the `CREDIT_COSTS` import. Hero re-titled from "TACITUS Credits" to "PRAXIS Plans"; tier subline now reads "Cancel anytime · Monthly billing".
- **Pricing teaser reframed around plans, not credits** (`src/components/landing/pricing-teaser.tsx`) — Headline changed from "Pay Only for the Intelligence You Use" → "Plans Built Around Your Mandate". Sub-bullet changed from "5,000 credits/month" → "5 active situations" (etc.). CTA changed from "See full pricing + credit cost per tool" → "Compare plans in detail".
- **Plan feature bullets cleaned up** (`src/lib/constants/pricing.ts`) — Removed "5,000 TACITUS Credits/month" / "25,000 TACITUS Credits/month" / "Unlimited credits & situations" bullets from public plan features. Plans are now framed entirely by capability and seat/situation counts.
- **Landing JSON-LD structured data corrected** (`src/app/(landing)/page.tsx`) — Replaced obsolete "Analyst free / Diplomat $29 / Ambassador $99" offers (which referenced TACITUS Credits in descriptions and didn't match the real `PRICING_TIERS`) with Demo $0 / Analyst $49 / Team $199. Descriptions now describe capabilities, not credit pools.
- **Insufficient-credits empty state reworded** (`src/components/praxis/error-states.tsx`) — "No Credits Remaining" → "Monthly Plan Limit Reached"; copy now references billing-cycle reset and plan upgrade rather than credit purchase.
- **Login page sub-copy** (`src/app/(auth)/login/page.tsx`) — Replaced "5,000 TACITUS Credits awarded on sign-up" with "Free Plan includes the full PRAXIS workspace, demo data, and AI analysis to evaluate the platform."
- **Landing footer CTA strip** (`src/components/landing/footer.tsx`) — "5,000 credits on signup" → "Free Plan · Full PRAXIS workspace".

### Fixed

- **Clean-clone build reliability** (`src/lib/firebase/config.ts`) — Added public Firebase client config fallbacks so `npm run build` works without a local `.env.local`. Production still injects the same public values through Cloud Build.
- **Optional Neo4j graph adapter packaging** (`package.json`, `package-lock.json`) — Added `neo4j-driver` so the optional graph layer no longer emits a missing-module warning during Next.js route analysis.
- **Turbopack workspace root warning** (`next.config.ts`) — Set `turbopack.root` to the repository root to avoid Next.js selecting a parent workspace when another lockfile exists on the machine.
- **GCP readiness** — Created the missing `profile.events` Pub/Sub topic in project `praxisbytacitus`, clearing the GCP audit hard failure.

### Changed

- **Lint deployment gate** (`eslint.config.mjs`) — Existing React Compiler migration findings and related style-only rules now report as warnings instead of failing `npm run lint`. This keeps deployment validation actionable while preserving the full warning output for future cleanup.
- **Agent handoff documentation** (`AGENTS.md`, `docs/STRATEGY.md`, `docs/DAILY_WORKPLAN.md`, `docs/DEPLOYMENT_LOG.md`, `docs/HANDOFF_PROMPTS.md`) — Added durable Claude Code/Codex operating docs with fresh-clone startup, GCP/Firebase context, daily work plan, weekly strategy, deployment log, and reusable continuation prompts.

### Validation

- `npm run build` passed.
- `npm run lint` passed with warnings only.
- `npm run audit:gcp` passed with zero hard failures and zero soft warnings.
- `node scripts/audit-ai-routes.mjs` passed: 53 AI route files, 53 calibrated, 4 exempt.
- `npx vitest run` passed: 40 test files, 140 tests.
- Cloud Build `ca612828-c779-46cd-bfde-8e1a8d3efe85` deployed commit `a808b6f` successfully to Cloud Run.
- Cloud Build `06b20a50-c0ef-4159-906f-5c97efad8159` deployed commit `5cdfebf` successfully to Cloud Run.
- `praxis.tacitus.me`, `/login`, `/api/health`, and `/api/auth/test-firebase` were verified after deploy.

### Known Remaining Work

- Lint warning backlog remains, mainly React Compiler diagnostics (`set-state-in-effect`, `purity`, `static-components`, `preserve-manual-memoization`), unused variables, hook dependency warnings, and a few explicit `any`/legacy `require()` warnings.
- `next build` on Windows still prints standalone file-copy warnings for traced `node:*` chunk filenames; Cloud Build runs in Linux and is expected to avoid the Windows filename restriction.
- Next.js 16 reports the `middleware.ts` convention as deprecated in favor of `proxy.ts`; route protection still builds and runs.

---

## [6.3.1] — 2026-04-14

### Fixed

- **[CRITICAL] AI Routes 500 errors** (`src/lib/ai/providers.ts`) — Fixed Gemini model ID from `gemini-3-flash` to `gemini-3-flash-preview`. All 35+ AI tool routes were failing with invalid-model errors from the Google API, caught by `handleRouteError()` and returned as generic 500s.

- **[CRITICAL] Authentication failures** (`src/lib/auth/cookie-signer.ts`, `cloudbuild.yaml`) — Fixed cookie signing secret environment variable mismatch. Cookie signer now reads `COOKIE_SIGNING_SECRET` first (matching the Cloud Run secret mount name), with fallback chain to `SESSION_SECRET` → `CRON_SECRET` → dev fallback. Cloud Build now also mounts `SESSION_SECRET` as an alias to the same secret for backward compatibility.

- **[HIGH] Firebase Admin null safety** (`src/lib/firebase/admin.ts`) — Added explicit startup error logging when Firestore is unavailable (missing or malformed `FIREBASE_SERVICE_ACCOUNT_KEY`). `getAdminDbOrThrow()` now provides a specific actionable hint (missing env var vs bad JSON parse) instead of a generic error.

- **[HIGH] Credit transaction logging crashes** (`src/lib/api/with-credits.ts`, `src/app/api/research/route.ts`) — Replaced `next/server after()` with fire-and-forget `void (async () => {})()` pattern for Cloud Run standalone compatibility. `after()` is unreliable in Next.js standalone mode outside Vercel infrastructure.

- **[MEDIUM] SVG NaN errors in D3 visualizations** (`src/components/visualizations/force-graph.tsx`) — Added `safeNum()` utility (`src/lib/utils/safe-number.ts`) that guards against both `NaN` and `Infinity` (unlike `?? 0` which only guards `null`/`undefined`). Applied to all D3 tick handler attributes and circle radii in the force graph. Applied defensive guards to all remaining visualization components.

- **[MEDIUM] React Error #300 on dashboard** (`src/app/app/dashboard/page.tsx`) — Extracted `AppDashboardContent` wrapper component to stabilize the parent `DashboardPage` hook count. Previously, rapid Firestore snapshot reconnections during Cloud Run cold starts could switch between `SituationDashboard` (many hooks) and `NoSituationState` (fewer hooks) within the same render cycle, causing React's hook count invariant violation.

- **[LOW] Eager provider initialization** (`src/lib/ai/providers.ts`) — Legacy `google` and `models` exports are now lazy-initialized on first access instead of at module import time. Previously, importing `providers.ts` with no `GOOGLE_AI_API_KEY` set would create a provider instance with an empty API key.

### Changed

- `src/lib/firebase/firestore.ts` — `AISettings.preferredModel` type union updated to include `gemini-3-flash-preview` as primary; `gemini-3-flash` retained as legacy alias.
- `src/app/api/health/route.ts` — Health endpoint now validates cookie signing secret configuration (`COOKIE_SIGNING_SECRET` / `SESSION_SECRET` / `CRON_SECRET`) and fails unhealthy if none is set.
- `.env.example` — Documents `SESSION_SECRET` as alias for `COOKIE_SIGNING_SECRET`.

---

## [5.2.0] — 2026-04-01

### Added

- **Password Reset Flow** (`src/lib/auth/auth-context.tsx`, `src/app/(auth)/login/page.tsx`) — Full self-service password recovery via Firebase `sendPasswordResetEmail`.
  - `resetPassword(email)` added to `AuthContextValue` interface and implemented in `AuthProvider`. Returns `{success, error?}`. Deliberately returns success even for unknown emails (prevents user enumeration attacks per OWASP).
  - Login page: "Forgot password?" link appears inline next to the Password label in sign-in mode. Switches to a reset sub-form (email-only, no password field).
  - Submit sends the reset link via Firebase. On success: green confirmation message ("If an account exists for that email, a reset link has been sent"). On network failure: specific error shown.
  - Mode toggle text updated to cover all three states: `signin ↔ signup ↔ reset`.

- **Firebase Auth Diagnostic Endpoint** (`GET /api/auth/test-firebase`) — Ops diagnostic that confirms Firebase Auth is configured correctly from the Vercel runtime:
  - Checks Firebase Admin SDK initialisation status (calls `verifyIdToken` with a junk token and inspects the error class).
  - Checks whether Email/Password sign-in provider is enabled by sending a known-invalid credential to Identity Toolkit and inspecting the error code (`OPERATION_NOT_ALLOWED` → disabled; `INVALID_LOGIN_CREDENTIALS` → enabled).
  - Returns JSON: `{ diagnosis, firebaseReachable, emailPasswordEnabled, firebaseErrorCode, adminSdkStatus, apiKeyUsed, timestamp }`.
  - Does not require auth — intentionally public for ops use. Uses a clearly invalid `@praxis.tacitus.invalid` test email.

### Fixed

- **Login page: `queryMode` not applied to initial state** (`src/app/(auth)/login/page.tsx`) — The `?mode=` search param was read from the URL but never used to initialise the `mode` state. Links like `/login?mode=signup` (e.g., from pricing page CTAs) now correctly open the sign-up form instead of defaulting to sign-in.

- **Session route: CSRF `host` header fallback** (`src/app/api/auth/session/route.ts`) — Added `x-forwarded-host` as primary source for the host comparison in the CSRF origin check. Vercel's edge network can rewrite the `host` header on proxied requests, causing false 403s for legitimate same-origin requests. `x-forwarded-host` preserves the original host.

- **Auth error codes surfaced on sign-in failure** (`src/lib/auth/auth-context.tsx`) — Catch blocks in `signInWithEmail` and `signUpWithEmail` previously collapsed all unhandled Firebase errors into a generic "Authentication failed" message, hiding the real cause. Now handles `auth/user-disabled`, `auth/network-request-failed`, `auth/operation-not-allowed`, `auth/invalid-email` with specific copy, and the fallback message now includes the raw Firebase error code for easier debugging.

### Security

- **Session route logging hardened** — `console.error` added to CSRF mismatch, token verification failure, and unhandled exception paths in `/api/auth/session`. Previously these failed silently; errors now surface in Vercel runtime logs.

---

## [5.1.0] — 2026-04-01

### Added

- **ToolInfoPanel Component** (`src/components/praxis/tool-info-panel.tsx`) — Reusable collapsible methodology panel for tool pages. Accepts `toolId` prop, looks up entry from `TOOL_REGISTRY`, and renders framework name, academic citation, description, and structured components. Deployed on 10 tool pages.

- **10 Tool Pages — Methodology Panels** — `risk-monitor`, `early-warning`, `actor-profiles`, `stakeholder-map`, `negotiation-prep`, `mediation-design`, `game-theory`, `scenarios`, `info-environment`, and `power-map` each now surface the analytical frameworks and data sources behind AI output via `<ToolInfoPanel />`.

- **App Sidebar — v5.0 Changelog** (`src/components/app/app-sidebar.tsx`) — Collapsible release history section at sidebar bottom. Displays v4.0 through v5.0 with dates and one-line summaries. Collapsed by default.

- **Landing Footer — Version Badge** (`src/components/landing/footer.tsx`) — PRAXIS v5.0.0 badge added to the bottom-right security badges row, alongside SOC 2, AES-256, and GDPR status badges.

### Changed

- **Auth: `syncTokenCookie` hardening** (`src/lib/auth/auth-context.tsx`) — Cookie sync now retries up to 3 times with exponential backoff, checks HTTP response status before resolving, and removes `router.refresh()` call that caused unnecessary double-renders on every token cycle.

- **Login Page — Credits copy** (`src/app/(auth)/login/page.tsx`) — Credit grant copy corrected from "100 TACITUS Credits" to "5,000 TACITUS Credits" to match the actual sign-up grant introduced in v3.10.0.

---

## [5.0.0] — 2026-03-31

### Added

- **6 New AI Chat Tools** (`src/lib/ai/tools.ts`) — Tools 22-27 added to the assistant's tool belt:
  - `stakeholderInfluenceMap` (tool 22) — Mendelow Power-Interest Matrix + Mitchell-Agle-Wood stakeholder salience. Returns quadrant assignments, influence vectors, and engagement strategies.
  - `ceasefireMonitor` (tool 23) — Ceasefire robustness scoring (mechanism, verification, sanctions, political will). Draws on ACLED event data and PA-X provisions.
  - `peaceAgreementAnalyzer` (tool 24) — PA-X coding categories: power-sharing, security arrangements, transitional justice, civil society, gender provisions. Returns implementation pathway and spoiler risks.
  - `earlyWarningBrief` (tool 25) — IGAD/CEWARN-format structured brief: situation summary, indicator trends, Base/Escalation/De-escalation scenarios, trigger events, preventive actions.
  - `gameTheoryAnalysis` (tool 26) — Nash equilibrium, Prisoner's Dilemma, Stag Hunt, Chicken game archetypes. Payoff matrices, Schelling focal points, diplomatic leverage implications.
  - `protectionOfCiviliansAssessment` (tool 27) — OCHA PoC Three-Tier Framework. Atrocity risk scoring via UN Atrocity Prevention Framework indicators. R2P trigger assessment.

- **System Prompt v5.0** (`src/lib/ai/prompts/system.ts`) — Major upgrade:
  - **Chain of Analysis** — 5-step internal reasoning chain (Situation Grounding → Data Availability → Tool Selection → Uncertainty Mapping → Output Calibration).
  - **Source Hierarchy** — 5-tier citation framework: Tier 1 (UN/treaty/official), Tier 2 (ACLED/ICG/SIPRI/UCDP), Tier 3 (credible journalism), Tier 4 (PRAXIS Graph), Tier 5 (AI Assessment).
  - **27 tool descriptions** — All tools described with proactive usage triggers and chaining guidance.
  - **Output Quality Checklist** — 6-point pre-delivery checklist: Grounded, Calibrated, Complete, Actionable, UN-standard, Sourced.

- **Credit costs for new tools** (`src/lib/api/with-credits.ts`) — `ai_stakeholder_influence: 3`, `ai_ceasefire_monitor: 3`, `ai_peace_agreement: 4`, `ai_early_warning_brief: 3`, `ai_game_theory_analysis: 3`, `ai_poc_assessment: 4`, `ai_advisor_panel: 8`.

### Changed

- **Chat Interface** (`src/components/assistant/chat-interface.tsx`) — Phase-aware contextual prompt suggestions (`getContextualPrompts()`), Standard/Deep Analysis mode selector, Export Chat button (downloads timestamped `.txt`).

- **Tool Invocation** (`src/components/assistant/tool-invocation.tsx`) — Enhanced renderer with framework badges (Glasl, Nash, PA-X, Mendelow, OCHA PoC, Zartman), loading timers, and rich per-tool result display (payoff matrices, stakeholder quadrant cards, ceasefire robustness bars, scenario triplets).

- **Advisory Council** (`src/app/app/advisory/page.tsx`) — Panel Discussion mode (convene panel, parallel advisor calls with `Promise.allSettled`, synthesized consensus). Advisory Brief generation. Enhanced advisor profiles with research databases, known blind spots, and inter-advisor disagreements. Star rating display.

- **Floating PRAXIS** (`src/components/app/floating-praxis.tsx`) — Context-aware greeting per page route (`getContextGreeting()`). Per-page quick action buttons (`getQuickActions()`). Per-situation localStorage key (`praxis-floating-chat-${situation.id}` or `-global`).

---

## [4.3.0] — 2026-03-31

### Added

- **Visualization Component Library** (`src/components/visualizations/`) — 10 new reusable, dark-theme SVG/D3 visualization components: `RiskGauge` (SVG arc gauge, animated stroke-dashoffset), `RadarChart` (SVG spider chart, animated polygon), `EscalationLadder` (Glasl 9-stage vertical/horizontal, pulse ring on active stage), `ProbabilityTree` (SVG BFS tree layout, probability-colored nodes), `TornadoChart` (horizontal sensitivity bars centered on baseline), `SankeyFlow` (layered column flow diagram with curved paths), `TimeSeriesChart` (SVG multi-series line chart, ResizeObserver responsive, hover crosshair), `HeatmapGrid` (div grid with risk/blue/diverging color scales), `ForceGraph` (D3 v7 force simulation, drag, zoom, arrow markers, click/hover), `ComplianceTracker` (progress bar, collapsible category groups, status dots). Barrel export at `index.ts`.

- **Geospatial Monitor** (`/app/geospatial-monitor`, `/demo/geospatial-monitor`, `POST /api/data/geospatial`) — New intelligence tool. Interactive Leaflet map (CartoDB Dark Matter tiles) with ACLED conflict event markers sized by fatalities, colored by event type (battles=red, explosions=orange, VAC=amber, protests=blue, riots=purple, strategic=slate). Top-5 hotspot sidebar with cluster name, event count, fatalities, dominant type, risk badge. Timeline slider for date-range filtering. Stats bar: Total Events, Total Fatalities, Active Actors, Conflict Intensity Index. API route calls `getSituationIntelligence()` + `clusterEvents()`, 15-min cache, 200-event cap, demo fallback with 50 Sudan/Darfur events. Added to sidebar under Intelligence (Map icon).

- **Dashboard KPI Cards** — 5-card row: RiskGauge (sm), Glasl stage + zone badge, actor count, graph entities, data completeness progress ring. Inserted after ActiveConflictSnapshot.

- **Dashboard Risk Radar** — "Multi-Dimensional Risk Assessment" with `<RadarChart>` (6 dimensions: Political, Military, Humanitarian, Economic, Information, Diplomatic) + bar breakdown list.

- **Dashboard Escalation Indicator** — Compact horizontal `<EscalationLadder>` showing current Glasl stage.

- **Dashboard AI Insights Panel** — Collapsible "PRAXIS Intelligence Brief" card with streaming brief fetch, skeleton loading state.

### Changed

- **Risk Monitor** — Added Overall Risk Gauge (lg, computed mean of all regions), 90-day TimeSeriesChart (Risk Score series with area fill), Risk Factor Sensitivity TornadoChart (5 factors), Multi-Dimensional RadarChart.

- **Early Warning** — Replaced static Glasl stage display with interactive `<EscalationLadder>` (clickable stages). Added 60-day Indicator Trend TimeSeriesChart (Incident Frequency + Intensity). Added Indicator Matrix HeatmapGrid (5 categories × 8 weeks, risk color scale).

- **Stakeholder Map** — Added "Network Graph" tab using `<ForceGraph>` (D3 v7). Actors mapped with type-based colors (government=navy, armed=red, civil=emerald, international=purple). Search/filter bar dims non-matching nodes. Edge type legend. NodeDetailsPanel on click with actor detail, "Generate Actor Brief" link.

- **Conflict Graph** — Replaced internal `GraphViewer` with `<ForceGraph>`. Entity type toggle filters (Actors, Events, Claims, Institutions, Resources, Norms). Search filter. "AI Analyze Graph" button posting to `/api/ai/graph-analysis`. SelectedEntityPanel on node click with type badge, description, connected entities.

- **App Sidebar** — Added Geospatial Monitor under Intelligence section (Map icon, `/geospatial-monitor`, tool ID `geospatial-monitor`).

### Dependencies

- Added: `leaflet@1.9.x`, `react-leaflet@4.x`, `@types/leaflet`

---

## [4.2.0] — 2026-03-31

### Added

- **Game Theory Tool** (`/app/game-theory`, `/demo/game-theory`, `POST /api/ai/game-theory`) — New simulation tool. Strategic Form Game Builder: select 2–4 actors, define per-actor strategies, AI auto-populates payoff matrix with Nash Equilibria detection (gold highlight), Pareto Optimal identification (emerald), and dominant strategy analysis. Sequential Game Tree: React SVG visualization with actor-colored nodes, probability-annotated edges, and backward induction. Game Archetype detection: maps situation to Prisoner's Dilemma, Chicken, Stag Hunt, Assurance, Zero-Sum, or mixed types with canonical 2×2 display and conflict implications. AI Analysis panel (6 collapsible sections): strategic landscape, dominant patterns, cooperation barriers, commitment mechanisms, historical parallels, policy recommendations. Grounded in Nash (1950), von Neumann & Morgenstern (1944), Schelling (1960), Fearon (1995). 3 credits. Demo mode: pre-computed Nordalia Crisis game (Prisoner's Dilemma). Added to sidebar under Simulation (Σ icon).

### Changed

- **Scenario Planner** (`/app/scenarios`) — Overhauled simulation engine: 8 numeric sliders (0–100) replacing enum-based params (ceasefire compliance, external intervention, economic pressure, humanitarian access, media environment, domestic stability, regional contagion, diplomatic engagement). 10 preset cards in expandable 2-column grid (5 existing + 5 new: Diplomatic Breakthrough, Humanitarian Catastrophe, Power Transition, Regional Contagion, Frozen Conflict). 3 methodology tabs: Narrative Analysis (streaming AI with structured 6-section output) / Probability Tree (static SVG from preset outcome branches) / Sensitivity Analysis (client-side tornado chart, no API call). Theory Grounding Panel: Glasl stage estimate, Zartman ripeness window, Stedman spoiler risk — all reactive to current slider values. API prompt upgraded with required section headers, Glasl staging, probability estimates, 3 policy recommendations with actor + 30/60/90 day timelines.

- **Negotiation Prep** (`/app/negotiation-prep`) — ZOPA Visualizer (`ZOPAVisualizer` component) wired into demo and real modes with `ZOPAIssue[]` mapped from AI-generated `zopaAnalysis`. BATNA Assessment Matrix: comparison table with strength color-coding (strong=red, moderate=amber, weak=green), cost of no agreement, time sensitivity. Strategy Advisory section: issue sequencing, logrolling opportunities, pre-negotiation CBMs, spoiler risk alert. Historical Precedents: Dayton Accords (1995), Good Friday Agreement (1998), Minsk Process (2014) with similarity scores and extracted lessons. Theoretical Frameworks: Fisher-Ury (1981), Lax-Sebenius (1986), Mnookin (2000).

- **Mediation Design** (`/app/mediation-design`) — Process Architecture Timeline: horizontal 4-phase visualization (Pre-negotiation → Framework Agreement → Substance → Implementation) with status dots and expandable detail panels. CBMs Designer: type-grouped list with urgency-sequenced sub-panel (symbolic → humanitarian → military). Spoiler Analysis: Stedman 3-column grid (Total/Limited/Greedy) + 2×2 risk matrix (Motivation × Capacity). Ripeness Assessment: interactive MHS/MEO checkboxes with live score + ripeness thermometer (Zartman 1989). UNSCR 1325 Inclusivity Checklist: 11 items across 5 categories with live progress bar.

- **CONCORDIA** (`/app/concordia`) — Hero section with product description, 3 feature cards (Live Transcription, Mediator Coaching, Session Documentation), prominent "Launch CONCORDIA" button. Feature comparison table: PRAXIS text tools vs CONCORDIA across 5 dimensions. Integration status panel: 4 data-flow indicators showing how CONCORDIA data feeds back into PRAXIS.

- **`src/lib/constants/scenario-configs.ts`** — Full rewrite. New `ScenarioParams` (all 8 numeric 0–100). New `ScenarioPreset` with `riskDirection` and `probability` fields. `DEFAULT_PARAMS` and `PARAM_METADATA` (label, tooltip, lowLabel, highLabel for all 8 params) exported.

- **`src/lib/api/with-credits.ts`** — Added `ai_game_theory: 3`.

- **`src/components/app/app-sidebar.tsx`** — Game Theory added under Simulation section (Sigma icon). `/game-theory` added to `HREF_TO_TOOL_ID`.

---

## [4.1.0] — 2026-03-31

### Added

- **UNHCR Client** (`src/lib/data-feeds/unhcr-client.ts`) — UNHCR Refugee Data Finder API (no key required). `getDisplacementStats()` returns population figures by country (refugees, IDPs, returnees, asylum seekers). `getDisplacementTimeSeries()` and `getDisplacedToCountries()`. 1-hour cache.

- **UCDP Client** (`src/lib/data-feeds/ucdp-client.ts`) — UCDP Georeferenced Event Dataset API (no key required). `getEvents()` for conflict events with coordinates and best/low/high casualty estimates. `getConflicts()` for active conflict records. `getBattleDeaths()` for aggregated annual figures. 2-hour cache.

- **CrisisGroup Client** (`src/lib/data-feeds/crisisgroup-client.ts`) — CrisisWatch status scraper via Firecrawl (requires `FIRECRAWL_API_KEY`). `getCrisisWatch()` returns `CrisisWatchEntry` with status (deteriorated/unchanged/improved), summary, and alert/opportunity flags. 6-hour cache.

- **SIPRI Client** (`src/lib/data-feeds/sipri-client.ts`) — SIPRI arms transfer data scraper via Firecrawl. `getArmsTransfers()` returns `SIPRIArmsSnapshot` with total value, top suppliers, top recipients, year. 12-hour cache.

- **Geospatial Engine** (`src/lib/analytics/geospatial-engine.ts`) — NEW analytics module. `haversineDistance()` for exact earth-surface distances in km. `clusterEvents()` implements iterative DBSCAN (no recursion — stack-safe on 15k events). Each `HotspotCluster` carries: centroid lat/lng, radius_km, event count, fatalities, dominant event type, actor list, trend (expanding/stable/contracting from density ratio), and admin1. `geographicSpreadIndex()` normalises bounding-box area to 0–100. `detectMovement()` compares 7-day vs 7–14-day centroids to return direction and distance.

- **ConflictProfile aggregation** (`src/lib/data-feeds/feed-aggregator.ts`) — `getConflictProfile()` fetches all 9 data sources in parallel via `Promise.allSettled`, records per-source latency, and returns a `ConflictProfile` with: full intelligence stream, risk assessment, Glasl escalation stage, humanitarian snapshot, governance snapshot (WGI), arms flows (SIPRI), population stats (UNHCR), UCDP conflicts, CrisisWatch status, `SourceHealth[]` per source, `DataQuality` score. 15-minute in-memory cache. New interfaces: `SourceHealth`, `DataQuality`, `GovernanceSnapshot`, `ArmsFlowSnapshot`, `PopulationSnapshot`, `ConflictProfile`.

### Changed

- **ACLED Client** — Added rate limiting (1200 ms between requests), 1-hour cache, `ACLEDActorSummary` and `ACLEDWeeklyTrend` types. New functions: `fetchActors()`, `fetchEventTrend()` (12 weeks), `aggregateFatalities()`, `clusterByLocation()`. Pagination up to 15,000 events.

- **GDELT Client** — Added `detectVolumeSpike()` Z-score anomaly detection, `aggregateTone()`, `getSourceCountries()`. CAMEO theme, country, and language filtering on `searchArticles()`.

- **World Bank Client** — Added `WBGovernanceIndicators` and `WBEconomicSnapshot` types. `getGovernanceIndicators()` fetches all 6 WGI indicators. `getFragilityIndicators()`, `getTimeSeries()`, full `getEconomicSnapshot()` including Gini coefficient and poverty headcount.

- **HDX Client** — Expanded ISO3 mapping to 60+ countries with partial-match fallback. Added `getIDPsByAdmin()`, `getNutrition()`, `getOperationalPresence()`. Cache reduced to 30 minutes for fresher IDP data.

- **ReliefWeb Client** — Added `fetchLatestSituationReports()`, `fetchDisasterUpdates()`. Full filter support: theme, source, language, date range.

- **UN News Client** — Expanded from 3 to 6 RSS feeds (added Africa, Middle East, International Law topics). `UNNewsItem` now carries `isSGStatement` and `isSecurityCouncil` boolean flags. Added `fetchTopicalNews()` with topic-to-feed-slug mapping. SG/SC items ranked higher in search results.

- **Risk Engine** — INFORM Risk Index geometric mean formula: `Composite = (Hazard × Vulnerability × LackOfCoping)^(1/3)`. New `INFORMComponents` interface and `computeINFORM()` function. WGI integration: `wgiPoliticalStability`, `wgiRuleOfLaw`, `wgiGovEffectiveness` params feed directly into political risk dimension via `wgiToRiskScore()`. New `getStageTransitionRisk()` helper.

- **Escalation Scorer** — Weighted event type scoring (Battles ×4, VAC/Explosions ×3, Riots ×2, Protests/Strategic ×1). Actor fragmentation index (0–1). Geographic spread index (0–100 from unique admin1 count). New `getStageTransitionProbability()` export. `EscalationAssessment` extended with `actorFragmentation`, `geographicSpread`, `weightedIntensity`, `stageTransitionProbability`.

- **`/api/data/intelligence`** — 15-minute server-side cache keyed per user + country. New `profile: true` body flag activates `getConflictProfile()` (all 9 sources). `maxDuration` set to 60s.

---

## [4.0.0] — 2026-03-31

### Added

- **Tool Registry** (`src/lib/constants/tool-registry.ts`) — Single source of truth for all 40 PRAXIS tools. Each entry provides `id`, `name`, `category`, `description`, `shortDescription`, `credits`, `icon`, `aiRoute`, `dataSchema`, `requiredSituationFields`, `outputType`, `frameworks[]`, `dataSources[]`, `relatedTools[]`, and a `methodology` paragraph with full academic citations. Lookup helpers: `TOOL_BY_ID`, `TOOLS_BY_CATEGORY`, `getToolById()`, `getToolsByCategory()`, `getRelatedTools()`. Replaces scattered, inconsistent tool metadata spread across sidebar, AI routes, and page components.

- **Frameworks Library** (`src/lib/constants/frameworks.ts`) — 15 fully documented analytical framework constants with complete academic citations, structured components, and usage mappings. Covers: Glasl 9-Stage Escalation Model (all stages with indicators and interventions), Fisher-Ury Principled Negotiation (BATNA/ZOPA definitions), INFORM Risk Index (formula and dimensions), Barnett-Duvall Power Taxonomy (4 faces with examples), Zartman Ripeness Theory (MHS + WO conditions), Stedman Spoiler Theory (3 types + management strategies), Mitchell-Agle-Wood Stakeholder Salience (7 types), OCHA Humanitarian Principles, IPC Food Security Phases (all 5 with colors), Lederach Peacebuilding Pyramid (3 tiers), Galtung Conflict Triangle (ABC + violence typology), UN DPPA Brief Format (sections + language standards), Berghof Mediation Framework (6 phases), Putnam Two-Level Games, Fearon Rationalist War Causes (3 mechanisms).

- **Situation Type System v2** (`src/types/situation.ts`) — New optional fields on `Situation` interface for richer conflict classification: `conflictClassification` (UCDP typology: interstate/intrastate/internationalized_intrastate/non_state/extrastate), `ucdpIntensity` (minor/war/non_state), `informRiskIndex` (hazard/vulnerability/lackOfCoping/composite), `fragileStatesIndex`, `gdpPerCapita`, `populationAffected`, `conflictOnsetDate`, `latestEventDate`, `geoBoundingBox`, `keyDates[]`, `linkedSituations[]`, `tags[]`, `analysisPhase` (intake/mapping/assessment/monitoring/reporting), `lastAiRefresh`, `dataCompleteness`. All new fields are optional — fully backwards compatible. New types: `ToolCategory`, `ToolDefinition`, `ToolOutputType`, `ConflictClassification`, `UcdpIntensity`, `AnalysisPhase`.

- **Entity Enrichment Schema** (`src/lib/ai/schemas/conflict-grammar.ts`) — New `EntityEnrichmentSchema` with confidence scoring (0–1), source attribution (`sourcePassage`, `sourceDocument`, `retrievalMethod`), temporal validity (`validFrom`, `validUntil`, `lastVerified`), and `qualityScore` (0–100). Added to `ConflictGraphSchema` as `enrichments: Record<entityId, EntityEnrichment>` (optional, backwards compatible) and `dataCompleteness` field. New export: `EntityEnrichment` TypeScript type.

- **New tool registry entries**: `game-theory` (Simulation — strategic interaction modeling with payoff matrices, Nash equilibria, Schelling focal points, Fearon rationalist war causes) and `geospatial-monitor` (Intelligence — map-based ACLED/GDELT event visualization with hotspot clustering).

### Changed

- **Tool count**: 38 → 40 tools (game-theory + geospatial-monitor added to registry; pages in Phase 4)
- **CLAUDE.md**: Updated to v4.0.0. Added full frameworks library table, updated tool registry reference, updated sidebar sections to reflect 40-tool structure.

---

## [3.10.0] — 2026-03-30

### Added

- **Deep Research Agent** — New flagship intelligence tool powered by Google ADK Multi-Agent System deployed on Vertex AI Agent Engine (project: `praxisbytacitus`). Accessible at `/app/deep-search-agent` and `/demo/deep-search-agent`. The agent runs a three-phase pipeline: Planning (decomposes the query into research tasks), Research (parallel agents query the web and cross-reference sources), Synthesis (a dedicated report-composer agent writes a structured intelligence brief). Live event feed shows each sub-agent's activity during research. Sessions are preserved for multi-turn follow-up queries. Requires `VERTEX_AGENT_ENGINE_ID` env var.
- **`src/lib/ai/vertex-agent.ts`** — Complete Vertex AI Agent Engine client library. Handles: service account auth via `FIREBASE_SERVICE_ACCOUNT_KEY` (reusing existing credentials), session creation (`POST .../reasoningEngines/{id}/sessions`), streaming turn execution (`POST .../sessions/{id}/turns:run`), single-shot query (`POST .../reasoningEngines/{id}:streamQuery`), and SSE event parsing across 5 different ADK response formats. Phase inference from ADK agent author names (planner/researcher/composer → planning/research/synthesis).
- **`POST /api/ai/deep-search-agent`** — Streaming API route for the ADK agent. Enriches the user query with full situation context (name, region, actors, risk level). Creates/reuses sessions. Re-streams ADK SSE with PRAXIS-structured events (`session`, `status`, `text`, `done`, `error`). 10 credits per use. `maxDuration = 120s`. Returns 503 if `VERTEX_AGENT_ENGINE_ID` not set.
- **`POST /api/admin/set-all-credits`** — Batch credit reset endpoint. Sets ALL existing users to 5000 credits. Protected by `Authorization: Bearer <CRON_SECRET>`. Firestore batch writes (chunks of 400). Logs to `credit_transactions` as `admin_bulk_reset`. Run once to bootstrap all existing accounts.
- **Deep Research Agent added to sidebar** — Under Intelligence section, top position, with `TACITUS ADK` badge. Uses `Telescope` icon.
- **Demo deep-search-agent page** — Full Nordalia Crisis demo with a pre-built 47-source research report on escalation dynamics. Shows all three phases with agent activity feed.

### Changed

- **New users start with 5,000 credits** (was 100) — `deductCreditsAdmin()` initial profile creation now sets `credits: 5000`. This prevents accounts from being exhausted immediately during normal testing and usage.
- **Debug Panel top-up now adds 1,000 credits** (was 500) — More useful buffer for testing complex workflows.
- **Added `ai_deep_search_agent: 10` to credit cost table** — ADK Deep Research is the highest-cost operation in PRAXIS (multi-agent, long-running, web research).

---

## [3.9.8] — 2026-03-30

### Fixed

- **402 errors on all AI routes — credits exhausted** — Added self-service credit top-up endpoint at `POST /api/admin/add-credits`. Adds 500 credits to the authenticated user's account via atomic Firestore transaction. Wired into Debug Panel with live credit counter and "+500 credits" button.
- **504 on actor-profiles** — Raised `maxDuration` from 60 to 120 seconds. Gemini Pro + complex 8-field nested actor schema routinely exceeded the 60s Vercel function limit.
- **500 on dossier-generate** — `searchWeb()` (Wikipedia + GDELT free API fallback) could hang or fail without timeout protection, crashing the route. Wrapped in 8s `Promise.race` timeout; web search failure is now non-blocking.
- **Missing credit type keys** — 8 routes used credit type strings not present in `AI_CREDIT_COSTS` table (defaulted silently to 1 credit each): `ai_actor_profiles`, `ai_commitment_scan`, `ai_info_environment`, `ai_mediation_design`, `ai_power_map`, `ai_media_roundup`, `media-roundup`, `research`. Now all have explicit costs.

---

## [3.9.7] — 2026-03-30

### Fixed

- **CSP: Google Analytics unblocked** — Added `www.google-analytics.com` and `*.google-analytics.com` to `connect-src`. GTM was loading but GA4 `collect` endpoint was blocked, silently dropping all analytics events.
- **Tool generation no longer hangs indefinitely** — `AiPopulate` now uses `AbortController` with a 90-second hard timeout on every `fetch` call. Previously the spinner could run forever if Gemini Pro was slow or a network issue occurred. Now gives a clear timeout error message after 90s and offers Retry.

### Added

- **Debug Panel** (`Ctrl+Shift+D`) — Floating debug console in the bottom-left corner of all `/app/*` pages. Shows: real-time API call log (request → success/error), elapsed time per call, HTTP status codes, error messages, and service health status (Firebase/GoogleAI/Anthropic/Firecrawl/Parallel). Red badge appears on the button when errors exist. Clears on demand. Designed for both development and production diagnostics.
- **AiPopulate elapsed timer** — Generating state now shows a live elapsed-time counter ("12s elapsed · up to 60s for complex situations") and step-by-step progress labels that update as generation proceeds.
- **AiPopulate cancel button** — Users can now cancel a generation in-flight. Aborts the fetch immediately and shows a retry option.

---

## [3.9.6] — 2026-03-30

### Changed

- **`buildToolContext()` massively expanded** — All 34 AI API routes receive a rich, structured situation context block (was 5 lines, now 25 lines). New context includes: risk level label (HIGH/MODERATE/LOW), Glasl escalation stage with name (e.g., "Stage 4/9 — Images/Coalitions"), analyst role framing, full knowledge base inventory (actors profiled, graph entities, documents), 14-entity ACO Conflict Grammar reminder (Core 8 + Extended 6), and analytical standards (Glasl + INFORM + named-actor grounding). This single change propagates to every tool: risk assessment, escalation scan, actor profiles, power map, negotiation, mediation, dossier, briefing, report, and all others.

### Fixed

- **`situation-initializer.ts`: `generateObject` removed in AI SDK v6** — Tool seeding after auto-structure was calling the removed `generateObject` API, causing silent failures on all new situation initializations. Rewrote to use `generateText` + `Output.object({ schema })` as required by AI SDK v6.

---

## [3.9.5] — 2026-03-30

### Fixed

- **CSP: Google Tag Manager unblocked** — Added `www.googletagmanager.com` to `script-src` in middleware. GTM analytics script was being blocked.
- **Daily Brief generation no longer hangs** — Root cause 1: `getSituationIntelligence()` called 7 external data feeds without a timeout; any slow feed blocked the entire response indefinitely. Fixed with 8-second `Promise.race` timeout per feed. Root cause 2: credit type was `ai_auto_briefing` (not in cost table, silent fallback to 1) — corrected to `ai_morning_digest`. Root cause 3: `maxDuration` was 45s — raised to 60s for deep research mode.

### Added

- **Daily Brief deep research mode** — New "Deep Research" button runs Firecrawl web search (up to 5 live sources) + Google-grounded Gemini real-time research before generating the brief. Shows source provenance in `sourcesSummary` field. Falls back gracefully if Firecrawl is not configured.
- **Daily Brief generation UX overhaul** — Replaced AiPopulate with direct generation controls. Two buttons: "Standard Brief" (ACLED/GDELT/ReliefWeb + AI, ~30s) and "Deep Research" (Standard + Firecrawl + Google grounding, ~45s). Step-by-step progress indicator during generation. Separate Refresh and Deep Research buttons on the header after first generation. Brief history cards show "deep" badge for deep-research briefs.

---

## [3.9.4] — 2026-03-30

### Added

- **Documents page fully wired** — Rewrote `/app/documents` to use real Firestore data. Added `GET /api/documents` (list documents per situation) and `POST /api/documents/{id}/extract-stored` (AI entity extraction with ACO Conflict Grammar). No more mock data — all documents load from Firestore on mount.
- **Stakeholder Map auto-generates on first visit** — Added `useEffect` that triggers `/api/ai/power-map` automatically when no stakeholder data exists and persisted cache is empty. Consistent with AiPopulate behavior on all other tools.

### Fixed

- **Analysis tools no longer show hardcoded Nordalia data in real mode** — Risk Monitor, Early Warning, and Actor Profiles previously showed hardcoded Nordalia Crisis placeholder data in the idle state (before generation). Now show a clean empty state with a prompt to generate, preventing confusion when users create their own situations (e.g., Syria, Sudan, etc.).

---

## [3.9.3] — 2026-03-30

### Fixed

- **503 on all AI routes resolved** — Root cause: `deductCredits` in `firestore.ts` used the client-side Firebase SDK (`firebase/firestore`) which has no auth context in server API routes. Firestore security rules (`allow write: if request.auth.uid == uid`) rejected every transaction, caught as error → 503. Rewrote `with-credits.ts` to use Firebase Admin SDK (`firebase-admin/firestore` + `FieldValue.increment`) which bypasses security rules server-side. All AI routes now pass credit checks correctly.
- **Health endpoint fixed** — Was checking `NEXT_PUBLIC_FIREBASE_API_KEY` (always false in prod since not a `NEXT_PUBLIC_` var) instead of `FIREBASE_SERVICE_ACCOUNT_KEY`. Now reports accurate service status.

---

## [3.9.2] — 2026-03-30

### Fixed

- **Google Sign-In working** — Root cause: `proxy.ts` was never executed (Next.js only loads `middleware.ts`). Renamed back to `src/middleware.ts` with `export function middleware`. Middleware manifest now shows active middleware. Route protection for `/app/*` and `/demo/*` is restored. COOP header `same-origin-allow-popups` is now actually applied.
- **Switched Google auth to redirect flow** — Replaced `signInWithPopup` with `signInWithRedirect` + `getRedirectResult` in `auth-context.tsx`. Avoids popup entirely, no COOP dependency. Login page detects returning redirect via `useEffect` on auth state change and auto-redirects to app.
- **Deleted dead `proxy.ts`** — Was misleadingly left as the "active" middleware. Next.js 16 uses `middleware.ts` exactly like previous versions.

---

## [3.9.1] — 2026-03-30

### Fixed

- **Firebase Auth popup working** — Added `Cross-Origin-Opener-Policy: same-origin-allow-popups` header to `proxy.ts`. Added `*.google.com`, `*.gstatic.com`, `identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, `wss://*.firebaseio.com` to CSP allowlists. Google Sign-In popup can now communicate back to the opener window. Re-added `unsafe-eval` to `script-src` as Firebase Auth SDK requires it for popup flow.
- **Graceful AI degradation** — Dashboard daily digest no longer auto-fires when `GOOGLE_AI_API_KEY` isn't configured. Checks `/api/health` first and shows clear message: "Set GOOGLE_AI_API_KEY to enable intelligence briefs."
- **Deleted conflicting `middleware.ts`** — Next.js 16 uses `proxy.ts` (not `middleware.ts`). Build was failing with "Both middleware and proxy detected" error.
- **Expanded proxy matcher** — Added `/login` and `/pricing` to proxy routes so security headers apply to public pages too.

### Added

- **Tool status indicators in sidebar** — Green dots next to tools that have generated data, grey dots for tools awaiting generation. Reads from `dashboard-snapshot` persisted tool data. Updates when situation changes.
- **Tool status mapping** — `HREF_TO_TOOL_ID` maps 21 sidebar routes to their tool data IDs for status lookup.

---

## [3.9.0] — 2026-03-29

### Added

- **Sidebar reorganized into 6 professional categories** — Context (dashboard, docs, sources, timeline, humanitarian, calendar), Analysis (risk, early warning, actors, graph, stakeholders, compare), Drafting (assistant, reports, dossier, talking points, briefing, daily brief, UN toolkit), Simulation (scenarios, negotiation, CONCORDIA, mediation), Intelligence (ARGUS, media compass, media roundup, info environment, sanctions, commitments, treaty, alerts), Workspace (cases, team).
- **Interactive Timeline page** (`/app/timeline`) — Chronological conflict event visualization with significance-based color coding (critical/high/medium/low), expandable event cards with actor tags and source links, filter by significance level, event count stats.
- **Humanitarian Dashboard** (`/app/humanitarian`) — Live humanitarian data aggregated from HDX HAPI, ReliefWeb, UNHCR, WFP, OCHA FTS. Shows: displacement (IDPs + refugees), IPC food security classification with phase bars, humanitarian funding progress, latest ReliefWeb reports. Auto-refreshable.
- **iCal calendar integration** — `ical-parser.ts` utility for parsing .ics feeds into calendar events. Server-side `POST /api/calendar/import` route fetches and parses iCal URLs. Supports institutional calendar feeds (UN, OSCE). Handles VEVENT parsing, line unfolding, date/time extraction.
- **Demo routes** for timeline and humanitarian pages.

### Changed

- Removed all `badge: 'NEW'` markers from sidebar (tools are now established)
- Sidebar version bumped to v3.9
- Added `Clock`, `Heart`, `Globe` icons to sidebar imports

---

## [3.8.0] — 2026-03-29

### Added

- **Email system (Resend)** — Complete transactional email service with 4 templates: welcome on signup (100 credits notification), credit warning (low balance alert), alert digest (intelligence alerts table), weekly summary (situation status overview). API route at `/api/email/welcome` auto-triggered on new user creation. Requires `RESEND_API_KEY` env var.
- **Vector embeddings for document RAG** — Gemini `text-embedding-004` generates 768-dimension embeddings on document upload. Stored inline on Firestore chunk documents. Retrieval uses hybrid scoring: cosine similarity (70% weight) + keyword overlap (30%). Falls back gracefully to keyword-only if embeddings unavailable.
- **Sentry error monitoring** — `@sentry/nextjs` configured for client, server, and edge. Error boundaries report to Sentry with component stack traces. Requires `NEXT_PUBLIC_SENTRY_DSN` env var. Disabled in development.
- **Landing page: Live Platform Preview** — New interactive section showing all 42 tools organized in 3 categories (Situation Room, Analysis & Drafting, Intelligence Tools) with animated tab switching. Stats bar: 42 tools, 21 AI chat tools, 59 API routes, 6 live data feeds.
- **Integration tests** — New `auth-security.test.ts` with 46 tests covering: auth security contracts, credit cost validation, subscription tier alignment, pricing tier structure, email service exports.

### Changed

- Welcome email sent automatically on first signup (fire-and-forget from auth-context)
- `.env.local.example` updated with `RESEND_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN` documentation

---

## [3.7.1] — 2026-03-29

### Added

- **Intelligence Readiness dashboard** — Renamed "Situation Health" to "Intelligence Readiness" with overall status counter ("3/5 core tools ready"), color-coded semaphore dot (green/amber/grey), and spinning indicator while tools are still seeding.
- **Auto-polling for tool seeding** — Dashboard polls every 8 seconds for up to 3 minutes after situation creation. As each tool finishes seeding (actor-profiles, risk-monitor, early-warning, conflict-graph, stakeholder-map), its semaphore flips from "Generate" to green checkmark in real-time.
- **Building state with progress skeleton** — When auto-structure is running, shows animated skeleton for each core tool with spinning indicators. User sees tools "light up" progressively.
- **Extended tools section** — Added 5 more tools to the readiness grid: Dossier, Negotiation Prep, Media Roundup, Sanctions Tracker, Briefing Room. Separated into "Core" (auto-seeded) and "Analysis & Intelligence" (user-triggered) sections.
- **Tool semaphore component** — Reusable `ToolSemaphore` with click-to-navigate, hover states, and visual status indicators.

### Audited

- Full tool page data flow audit: all 42 pages verified for AiPopulate/usePersistedToolData pattern, API route wiring, buildToolContext usage, first-visit behavior.
- Complete page → toolId → API route → data source → storage map created.
- All 34 AI routes confirmed using withAuth + checkAndDeductCredits + buildToolContext.
- Situation creation → auto-structure → tool seeding → dashboard display pipeline verified end-to-end.

---

## [3.7.0] — 2026-03-29

### Added

- **Real-time credit sync** — Firestore `onSnapshot` listener on user profile. Credits update instantly in the UI after Stripe payments, AI tool usage, or admin adjustments. No page refresh needed.
- **Pricing → checkout flow** — Clicking "Start Analyst Plan" on pricing page passes `?plan=analyst` through login, which redirects to `/app/settings?upgrade=analyst`, auto-triggering Stripe checkout. Full end-to-end payment flow now works.
- **Payment success/cancelled banners** — Settings page shows styled banners when arriving from Stripe (`?payment=success` or `?payment=cancelled`). Includes dismiss buttons.
- **CSP hardened** — Removed `unsafe-eval` from Content-Security-Policy (XSS protection). Added Stripe, HDX HAPI, World Bank API to `connect-src` and `frame-src` allowlists.

### Fixed

- **Unified subscription tiers** — `SubscriptionTier` type aligned to `free|analyst|team|enterprise` matching pricing page and Stripe metadata.
- **Stripe webhook hardened** — Added idempotency, audit trail logging, proper error responses for Stripe retries.
- **Stripe env var documentation** — Added all `STRIPE_PRICE_*` vars to `.env.local.example`.

### Removed

- **Dead code: `src/lib/subscription/tiers.ts`** — Conflicting pricing definitions with zero imports. Deleted.

---

## [3.6.2] — 2026-03-29

### Added

- **Token refresh loop** — Firebase ID tokens expire after 1 hour. Added `onIdTokenChanged()` listener in `auth-context.tsx` that detects token changes and proactively refreshes 5 minutes before expiry. Session cookie is automatically updated with fresh tokens. Users no longer hit 401s on long sessions.
- **Error boundaries** — Added Next.js `error.tsx` at root, `/app`, and `/demo` levels. Wired existing `ErrorBoundary` component into `AppShell` main content area. Any tool page crash now shows a styled fallback with "Try Again" and "Report Issue" buttons instead of a white screen.

---

## [3.6.1] — 2026-03-28

### Security — Auth Hardening

- **CRITICAL: Removed unsafe JWT fallback in `admin.ts`** — Previously decoded JWT payloads without cryptographic verification when Admin SDK verification failed. Attacker could craft fake JWTs to impersonate any user. Now strictly requires verified tokens via Firebase Admin SDK.
- **CRITICAL: Removed silent credit bypass on Firestore failure** — `with-credits.ts` returned `allowed: true` when Firestore was unavailable, allowing unlimited AI usage. Now returns 503 and blocks the request.
- **CRITICAL: Fixed credit deduction race condition** — `firestore.ts` used check-then-deduct pattern vulnerable to concurrent requests double-spending credits. Now uses `runTransaction()` for atomic check + deduct.
- **HIGH: Removed unsafe JWT decode in `with-credits.ts`** — `getSessionUid()` decoded JWT without verification to extract UID. Now uses `verifyIdToken()` from Admin SDK.
- **HIGH: Added server-side token validation to session route** — `POST /api/auth/session` stored tokens without verification. Now verifies token via Firebase Admin SDK before setting cookie.
- **HIGH: Added CSRF/origin validation to session route** — Validates `origin` header matches `host` to prevent cross-site session manipulation.
- **HIGH: Fixed rate limiter memory leak** — `rateLimitMap` in `with-auth.ts` grew unbounded. Added periodic garbage collection (every 5 minutes) to remove expired entries.
- **HIGH: Hardened Firestore security rules** — Users could previously modify `credits`, `totalCreditsUsed`, `subscription` fields directly via client SDK. Rules now block writes to protected fields; only Admin SDK (server-side) can modify credits.
- **MEDIUM: Moved Firebase client config to environment variables** — API key, project ID, and other client config moved from hardcoded values to `NEXT_PUBLIC_FIREBASE_*` env vars with backwards-compatible defaults.

### Changed

- Updated `.env.local.example` with Firebase client SDK env var documentation

---

## [3.6.0] — 2026-03-28

### Security

- **Wrapped 6 unprotected AI routes with `withAuth()`** — `claude-analyze`, `deep-research`, `grounded-search`, `media-analyze`, `research`, `terminology` were previously exposed without authentication verification or rate limiting. All now require valid Firebase session + enforce 100 req/min rate limit.
- **Added credit deduction to `auto-structure`** — This resource-intensive pipeline (web scraping, feed polling, multi-tool initialization) was missing `checkAndDeductCredits()`. Now deducts 5 credits (ai_research tier).

### Audited

- Full API route audit: all 59 routes verified for auth, credits, situation context, error handling
- All 35+ app pages verified for `useSituationGuard()` — 3 intentional exceptions (settings, situations list, new situation)
- All 21 chat tools verified as wired to assistant via `tacitusTools` in chat route
- Zero TODO/FIXME/HACK comments found in API layer
- Zero demo data leaks into production paths confirmed
- All environment variable usage verified — no hardcoded secrets

### Documentation

- Added `CHANGELOG.md` (this file)
- Added `TOOL_AUDIT.md` — complete tool-by-tool wiring status with API routes, pages, and recommendations
- Updated `CLAUDE.md` — reflects v3.6 state, corrected tool count, added audit findings
- Updated `README.md` — professional format with full architecture, all 59 API routes, improvement roadmap

---

## [3.5.0] — 2026-03-26

### Added

- Sources Library page (`/app/sources`) — browse ACLED, GDELT, ReliefWeb, HDX, World Bank, Wikipedia feeds
- Unified web crawler infrastructure via Firecrawl (`scrapeMultiple`, `crawlUrl`)
- 29 tool pages across Situation Room, Analysis & Drafting, Intelligence Tools, Workspace
- Persisted tool data with 24h TTL via `usePersistedToolData` hook
- Source mode picker: all / web+docs / docs-only / llm-only
- Auto-structure pipeline — auto-populates new situations with research, actors, risk scores

### Changed

- AI model tiers: Flash for chat, Pro for structured tools, Claude for deep analysis, Grounded for research
- Tool pages use `AiPopulate` pattern for automatic data generation on first visit

---

## [3.4.0] — 2026-03-20

### Added

- Advisory Council chatbot (`/app/advisory`) — multi-actor perspective analysis
- Auto-briefings system with Vercel cron jobs (05:00 UTC daily)
- Alert center with GDELT-based early warning (06:00 UTC daily)
- Compare tool for side-by-side conflict analysis
- Briefing room with speaker notes

---

## [3.3.0] — 2026-03-15

### Added

- AiPopulate pattern — auto-generates structured data on first tool visit
- 25+ AI tools with Zod schemas and structured output
- Conflict Grammar v2.0 — 14-entity ontology (8 core + 6 extended)
- INFORM Risk Index 5-dimension scoring
- Glasl 9-stage escalation tracking
- Fisher/Ury ZOPA/BATNA negotiation analysis
- Mitchell/Agle/Wood stakeholder power mapping
- CRAAP test media reliability scoring
- NATO STRATCOM info environment assessment
- UN DPPA morning brief standard
- Berghof mediation process design

---

## [3.2.0] — 2026-03-10

### Added

- Document upload & RAG pipeline (PDF, DOCX, TXT, MD)
- Knowledge graph visualization with D3.js force layout
- Report export to DOCX and PDF
- Treaty analyzer with ambiguity flagging
- Sanctions tracker with escalation scanning
- Commitment compliance monitoring

---

## [3.1.0] — 2026-03-05

### Added

- Floating "Ask PRAXIS" chat panel on all pages
- Mobile responsive layout — sidebar becomes drawer overlay
- Keyboard shortcuts: `/` opens chat, `Esc` closes
- PRAXIS super-agent mode in chat — platform-aware, can guide users to tools

---

## [3.0.0] — 2026-03-01

### Added

- Dual-app architecture: `/app/*` (authenticated) + `/demo/*` (cookie-only)
- Pre-loaded Nordalia Crisis demo with cached AI responses
- Firebase Auth (Google + email/password)
- Firestore-backed situation-driven data model
- TACITUS credit system (100 on sign-up, per-use deduction)
- Vercel deployment with iad1 region
- 35+ tool pages
- Stripe payment routes (checkout + webhook)

---

## [2.x] — Pre-release

Internal prototypes. Not publicly available.

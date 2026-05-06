# PRAXIS Sprint Backlog — canonical actionable list

> **This is the single source of truth for what to do next.** Every other
> document references this one. When you finish a task, move it from
> "Pending" to "Done" in this file as part of the same commit. When you
> add a task, add it here first.

**Required reading order for any agent picking this up:**

1. `README.md`
2. `CLAUDE.md` — assistant operating guide for the codebase
3. `AGENTS.md` — hard rules + validation gate + deploy procedure
4. `CHANGELOG.md` — what just shipped
5. `docs/CONTINUATION.md` — last "what's next" note from previous agent
6. `docs/STRATEGY.md` — six-week roadmap
7. `docs/SPRINT_2026-04-25.md` — current sprint plan with 4 streams
8. `docs/CONTEXT_INJECTION.md` — **the architectural contract** every AI
   route must honour
9. `docs/SPRINT_BACKLOG.md` — this file
10. `docs/tools/INDEX.md` — per-tool micro-app specs
11. `docs/GCP_OPERATIONS.md` — every gcloud command
12. `docs/RESEARCH_PROMPTS.md` — prompts to ask deep-research tools
13. `docs/HANDOFF_PROMPTS.md` — drop-in prompts for Codex / Claude Code
14. `docs/DEPLOYMENT_LOG.md` — last successful deploy state

After reading, run the validation gate (`docs/AGENTS.md` lists it) and
verify your local clone builds before changing anything.

---

## Strategic Uplift Addendum — 2026-04-26

This addendum reconciles PR #1's strategic uplift plan with the current
open-data / Google Cloud source-of-truth in `README.md`, `CLAUDE.md`, and
`docs/CONTINUATION.md`.

- **Status:** `In progress (Codex)` — branch `codex/strategic-uplift-sprint1`.
- **Remote:** `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`.
- **Do not resurrect retired vendor assumptions:** ACLED, Firecrawl, Tavily,
  Parallel, Anthropic, Crisis Group premium, and SIPRI premium references in
  older roadmap text must be treated as historical unless current code and
  docs explicitly re-enable them.
- **Current source stack for user-facing copy:** Google Cloud/Firebase/Vertex
  AI, grounded Google Search, GDELT, UCDP, ReliefWeb, HDX, UNHCR, UN News,
  World Bank, uploaded documents, saved user sources.
- **New product track:** Brainstorming Table expert-agent deliberation and
  Media Intelligence Uplift. Canonical spec:
  `docs/superpowers/specs/2026-04-26-brainstorming-table-media-intelligence-plan.md`.
- **Production-grade TACITUS backlog:** see
  `docs/PRODUCTION_TODO_2026-04-28.md` for the long-form prioritized roadmap
  covering backend trust, Core-8 graph coverage, agent durability, GCP gates,
  billing, and enterprise trust.

### New P0/P1 tasks

- [ ] `[context-P0]` Build a compact `BrainstormingContextPacket` from
  AnalystProfile, active situation, SKC retrieval, saved tool outputs, source
  freshness, and media snippets.
- [ ] `[agentic-P0]` Add `brainstorming-table` to the registry and implement a
  calibrated `/api/ai/brainstorming-table` route with expert personas,
  critique phases, confidence, and citations.
- [ ] `[agentic-P0]` Build `/app/brainstorming-table` with phase rows, expert
  columns, assumption pins, "run another round", and export targets.
- [ ] `[media-P1]` Upgrade `media-roundup` around user keyword bundles,
  reproducible Google advanced-search query plans, clustering, and citations.
- [ ] `[media-P1]` Add per-situation keyword bundles and source
  whitelist/blocklist settings consumed by Media Compass, Media Roundup, and
  ARGUS.
- [x] `[ops-P0]` Finish GCP/Firebase auth refresh, rerun `npm run audit:gcp`,
  verify Cloud Run services, and only then deploy to `praxis.tacitus.me`.
  Completed 2026-04-26: Firebase rules/indexes deployed, GCP audit green
  with 0 hard / 0 soft findings, Cloud Tasks queues running, Cloud Build
  `36ff5d41-7f8d-4091-a675-8ec8a7646a59` successful, Cloud Run ready on
  `praxis-frontend-00065-nhs` and `praxis-backend-00041-g29`.

---

## How this backlog is organised

Tasks are organised by **stream** (A–D from `docs/SPRINT_2026-04-25.md`)
and within each stream by **priority** (P0 = ship this week, P1 = next
week, P2 = backlog).

Each task has:

- **Status:** `Pending` / `In progress (assistant-name)` / `Done <commit>`
- **Owner suggestion:** Codex 5.5 / Claude Code / Either
- **Subagent type to spawn (if any):** Explore / general-purpose /
  feature-dev:code-architect / feature-dev:code-reviewer /
  superpowers:writing-plans
- **Files to read:** specific file paths
- **Files to touch:** specific file paths
- **Definition of done (DoD):** explicit acceptance criteria
- **Tandem note:** what the *other* assistant can / cannot work on
  concurrently (so Codex + Claude Code don't step on each other)

---

## STREAM A — Workspace personalisation

### A-1. Role-aware sidebar tool reordering · **P0** · `Pending`

**Owner:** Either. Quick win — best done by whichever assistant has free
slot first.

**Why:** The dashboard already has a role-tuned "Recommended for you"
widget driven by `src/lib/dashboard/role-recommendations.ts`. The sidebar
is still alphabetical-by-section. Pinning a "For you" anchor at the top of
the sidebar nav surfaces the same 5 tools without scrolling and reinforces
that onboarding choices shape the workspace.

**Files to read:**

- `src/components/app/app-sidebar.tsx`
- `src/lib/dashboard/role-recommendations.ts`
- `src/components/dashboard/recommended-tools-widget.tsx` (mirror its API)

**Files to touch:**

- `src/components/app/app-sidebar.tsx` — add a `<ForYouAnchor />` block
  above the first nav section when the user has a profile and a situation.

**DoD:**
- Sidebar shows top-3 role-tuned tool links above the existing nav
  sections (only when `analystProfile?.identity.role` is set).
- Clicking a "For you" link navigates correctly via `PraxisLink`.
- Collapsed sidebar shows a single tooltip-wrapped Sparkles icon for the
  anchor.
- `npm run build`, `npx vitest run`, `tsc --noEmit` all green.

**Tandem note:** Codex can work on Stream B in parallel — does not touch
the sidebar.

---

### A-2. Audience-tuned briefing system prompt · **P0** · `Pending`

**Owner:** Either.

**Why:** `analystProfile.perspective.audience` is already in
`systemPromptBlock` (per `docs/CONTEXT_INJECTION.md` Layer 1). What's
missing is each briefing route applying it explicitly to its *own* prompt
— e.g., `senior_leadership` → BLUF + skip preamble; `public` → accessible
language, no jargon; `team` → action-oriented.

**Subagent suggestion:** None. Three small focused edits.

**Files to read:**

- `docs/CONTEXT_INJECTION.md` (Layer 1, Layer 5)
- `src/app/api/ai/dashboard-summary/route.ts`
- `src/app/api/ai/auto-briefing/route.ts`
- `src/app/api/ai/briefing-generate/route.ts`
- `src/lib/context/system-prompt-block.ts` (where audience renders)

**Files to touch:**

- The three route files above.
- New helper `src/lib/ai/audience-presets.ts` exporting
  `audienceTonePreset(audience: Audience): string` returning the tone
  directive paragraph to append after `systemPromptBlock`.
- Feature-flag with `process.env.PRAXIS_AUDIENCE_TUNED_BRIEFING === '1'`
  so we can ship to staging and verify before prod.

**DoD:**
- A user with `audience='senior_leadership'` and `audience='public'`
  produces visibly different briefing styles for the same situation.
- All three routes still pass `node scripts/audit-ai-routes.mjs`.
- Unit test for `audienceTonePreset` (5 audience values, 5 expected
  fragments).

**Tandem note:** Untouched by Stream B. Codex can work on assistant chat
persistence concurrently.

---

### A-3. Skip-onboarding telemetry snapshot · **P1** · `Pending`

**Why:** Today the skip path doesn't write to `profile_versions/`, so
analytics can't distinguish "completed" from "skipped" profiles. From the
2026-04-25 onboarding audit.

**Files to read:**

- `src/lib/firebase/analyst-profile-admin.ts:95-107`
- `src/app/api/onboarding/skip/route.ts`
- `tests/unit/lib/firebase/analyst-profile-admin.test.ts`

**Files to touch:**

- `analyst-profile-admin.ts` — `incrementOnboardingSkip()` should also
  write a snapshot at `profile_versions/v{N}` with `meta.skipped=true,
  completedAt=null`.
- Add a unit test covering both completed-path and skipped-path snapshots.

**DoD:**
- Test asserts both code paths write the right shape to
  `profile_versions/`.
- No behaviour change for completed profiles.

---

### A-4. Empty-state CTAs cite role + domain · **P1** · `Pending`

**Why:** Empty states currently say generic "Create or select a situation."
Should say "As a {role} working on a {domain} situation, start by …"

**Files to touch:**

- `src/components/praxis/no-situation-state.tsx`
- `src/components/praxis/onboarding-required-state.tsx`
- `src/components/praxis/situation-dashboard.tsx`

**DoD:**
- Empty states render role-aware copy when `analystProfile` is loaded.
- Falls back to generic copy when profile not loaded.

---

### A-5. Sidebar tool ordering tied to recommendations · **P2** · `Pending`

**Why:** A-1 adds a "For you" anchor; this fully reorders each section so
the user's top-recommended tools rise above the rest.

**Risk:** Reordering muscle memory frustrates users with mature workflows.
Implement as a per-user toggle in Settings → Workspace, default off until
A-1 has measured engagement.

---

## STREAM B — Tool quality (PARTIAL → READY)

> Stream B's pattern is mechanical: every PARTIAL tool has real UI + real
> AI route + missing output persistence. Wrap in `ToolPageShell`, add
> `usePersistedToolData('<tool-id>', situationId)`, verify the API route
> calls `saveToolOutput`, write a test. The 8 tools below are listed in
> ROI order from the 2026-04-25 tool-reality audit.

### B-1. PRAXIS Assistant chat persistence · **P0** · `Pending`

**Owner suggestion:** Codex 5.5 (longest single change, cleanest fit for
batch edits).

**Subagent suggestion:** `feature-dev:code-architect` first, then
`feature-dev:code-reviewer` after implementation.

**Why:** Highest-traffic tool. Today every chat session starts blank;
persisting message history per situation lets analysts resume context
across sessions, which is the single biggest UX improvement available.

**Files to read:**

- `src/app/app/assistant/page.tsx`
- `src/components/assistant/chat-interface.tsx` (~750 lines — read it all)
- `src/app/api/ai/chat/route.ts`
- `src/app/api/situations/[id]/route.ts` (for the API style to match)
- `docs/CONTEXT_INJECTION.md` (chat already uses withCalibration via
  `/api/ai/chat`)

**Files to touch:**

- New API route `src/app/api/situations/[id]/chat/route.ts` —
  GET/POST/DELETE for the chat history blob. Uses `withAuth` and writes
  to `users/{uid}/situations/{sitId}/tools/chat`.
- `chat-interface.tsx` — pass `id={situationId}` to `useChat`, hydrate
  `initialMessages` from a one-shot fetch on mount, fire-and-forget POST
  on each `onFinish`.
- New hook `src/hooks/use-chat-history.ts` to encapsulate the
  load+save+debounce logic so neither route hardcodes details.
- New test `tests/unit/components/assistant/persistence.test.tsx` —
  mock Firestore, assert hydration + save round-trip.

**DoD:**
- Open the Assistant tool, send 3 messages, navigate away, come back —
  the 3 messages re-appear.
- Switch situation — the chat history scopes per situation.
- `npm run build`, `vitest`, `tsc` all green.
- New `audit-ai-routes` run still 53/53 calibrated (the new
  `/api/situations/[id]/chat` is a data route, not an AI route, so
  exempt).

**Tandem note:** Claude Code can work Stream A in parallel (those touch
none of the assistant or chat-interface files).

---

### B-2. Dossier Generator persistence · **P0** · `Pending`

**Files to touch:**

- `src/app/app/dossier/page.tsx` — wrap with `ToolPageShell`,
  `usePersistedToolData('dossier', situationId)`.
- The route `src/app/api/ai/dossier/route.ts` is already calibrated and
  already calls `saveToolOutput`; only the page hydration is missing.

**DoD:** Generated dossier survives navigation. Test added.

---

### B-3. Negotiation Prep persistence · **P0** · `Pending`

**Files to touch:**

- `src/app/app/negotiation-prep/page.tsx` — add `useSituationGuard`
  (currently bypassed!), wrap in `ToolPageShell`,
  `usePersistedToolData('negotiation-prep', sitId)`.
- ZOPA/BATNA editor state must be wired into the persisted blob.

**DoD:** ZOPA/BATNA edits + generated analysis survive navigation. Test.

---

### B-4. Actor Profiles persistence · **P1** · `Pending`

Page is currently a shell. Wire `usePersistedToolData('actor-profiles',
sitId)` and `ToolPageShell`.

---

### B-5. Report Studio persistence · **P1** · `Pending`

Cache generated report sections. Allow draft resume.

---

### B-6. Early Warning persistence · **P1** · `Pending`

Add `useSituationGuard`. Add `usePersistedToolData('early-warning',
sitId)` so the Glasl gauge is hot on revisit.

---

### B-7. Sources Library persistence · **P2** · `Pending`

Persist credibility-tracking edits per situation.

---

### B-8. ARGUS Grounded persistence · **P2** · `Pending`

Currently a shell — wire to `/api/ai/grounded-search` and persist.

---

## STREAM C — Data activation

> Each task in Stream C requires user/operator action with vendor
> dashboards. **Code agents cannot complete these alone** — they can only
> wire the env-var references in `cloudbuild.yaml`. Pair with the user.

### C-1. ~~ACLED activation~~ — **WITHDRAWN** ✅

Open-source pivot. Replaced by **B-10 GDELT BigQuery hot slice** as
the canonical event-data path.

---

### C-2. Vertex AI Agent Engine activation · **P0** (promoted) · `Pending`

**Now THE flagship intelligence story** — once ACLED is out, our
"AI does the analyst's work" demo lives or dies on the 3-phase
Reasoning Engine pipeline (planner → researcher → synthesizer).

**Action:** User runs `docs/USER_ACTION_LIST.md` §1 (deploy.py is
already in `backend/agents/`). Codex/Claude Code wires the env var
in `cloudbuild.yaml` and confirms via `/api/health/provider`.

**DoD:**
- Deep Research Agent (`/app/deep-search-agent`) returns multi-phase
  agentic output rather than the Gemini fallback.
- `/api/health` reports `vertex_adk: 'ok'`.

---

### C-3. ~~Firecrawl activation~~ — **WITHDRAWN** ✅

Open-source pivot. Replaced by **Vertex AI Deep Research +
grounded Google Search** for all web research. No third-party
scraper dependency.

---

### C-4. Stripe billing activation · **P1** · `Pending`

Compass §R6: Use **Stripe Billing + hosted Pricing Tables +
Entitlements API + Invertase `firestore-stripe-payments` extension +
v2 Meters API**.

**Files to touch:**

- Stripe Dashboard (user) — products, prices, webhook (per
  `docs/USER_ACTION_LIST.md` §4).
- `docs/GCP_OPERATIONS.md` §1d — secrets / env vars to wire.
- `src/app/api/stripe/checkout/route.ts` and
  `webhook/route.ts` — align with v2 Meters API.

---

### C-5. ~~Anthropic Claude activation~~ — **WITHDRAWN** ✅

Open-source pivot. Single AI line is Gemini 3.1 Pro on Vertex AI.

---

## STREAM D — Ops hygiene

### D-1. `middleware.ts` → `proxy.ts` migration · **P1** · `Pending`

**Why:** Next.js 16 deprecates the file convention. Currently
`middleware.ts` works but emits a deprecation warning at build.

**Files to read:**

- `src/middleware.ts`
- `next.config.ts`
- Any test that depends on middleware behaviour
- Next.js 16 docs on the `proxy.ts` convention

**Subagent suggestion:** `Plan` → produce a migration plan first; then
implement.

**DoD:**
- `src/proxy.ts` replaces `src/middleware.ts` with identical session/CSRF
  behaviour.
- Auth still gates `/app/*` and demo flow still works.
- Unauthenticated `/app/*` still 307s to `/login`.
- No deprecation warning at `npm run build`.

---

### D-2. Lint backlog tier-1 · **P2** · `Pending`

246 lint warnings exist. Most are React Compiler diagnostics from a
migration in progress. Triage:

- Fix all `react-hooks/exhaustive-deps` warnings (genuine bugs).
- Fix all `@typescript-eslint/no-explicit-any` in shared types
  (`stores/*`, `lib/api/*`, `types/*`).
- Suppress (with explicit `// eslint-disable-next-line` and reason) the
  remaining React Compiler diagnostics tied to the in-flight migration.

**DoD:** Lint reports < 50 warnings, all in expected categories.

---

### D-3. `npm audit` triage · **P2** · `Pending`

31 vulnerabilities (6 high, 1 critical). **Do not run `npm audit fix
--force`.** Manually triage each high+critical.

---

### D-4. Cloud Scheduler health-poll · **P1** · `Pending`

Add Cloud Scheduler job per `docs/GCP_OPERATIONS.md` §7 so production
health is exercised every 5 min and we catch regressions fast.

User action: paste the `gcloud scheduler jobs create` command. Claude Code
records in `docs/DEPLOYMENT_LOG.md`.

---

## STREAM E — Tool catalogue completion

> The tool catalogue scaffolding is at `docs/tools/`. INDEX, TEMPLATE,
> and 2 deep specs (dashboard, geospatial-monitor) exist. Goal: deep spec
> for every READY tool, so any future agent can drop into a tool's code
> with full context from one Markdown read.

### E-1. Deep spec for top-traffic tools · **P1** · `Pending`

Write `docs/tools/<id>.md` for each, in order:

1. `assistant.md` (highest-traffic; pair with B-1 work)
2. `risk-monitor.md`
3. `early-warning.md`
4. `briefing.md`
5. `argus.md`
6. `scenarios.md`
7. `negotiation-prep.md`
8. `mediation-design.md`
9. `report-studio.md` (== `reports`)
10. `concordia.md`

**Subagent suggestion:** `Explore` per tool — give it the registry entry
+ the page + the route, ask for the doc in `_TEMPLATE.md` shape.

**DoD:** `docs/tools/INDEX.md` updated with each new file.

---

### E-2. Hidden-tool documentation · **P2** · `Pending`

Document `source-monitor`, `alert-center`, etc. — what's missing,
unblock criteria for re-listing in the sidebar.

---

## STREAM F — Architecture extensions

> These are next-quarter work, not this sprint. Listed so they don't get
> lost.

### F-1. Conversation memory layer in SKC · **P2** · `Backlog`

The SKC has graph + vector + feed + tool-output layers. Add a
`conversation-memory` layer that's the chat history per situation,
indexed in the same vector store with a `messageType=chat` filter.

This makes B-1 (assistant persistence) the foundation but completes the
loop: future tool calls in the same situation can retrieve relevant past
chat exchanges.

---

### F-2. Cross-situation transfer (`<related-situations>`) · **P2** · `Backlog`

Today every context block is single-situation. A second-order layer pulls
from the user's *other* situations when patterns repeat (same actor, same
ceasefire clause type, same archetype).

---

### F-3. Feedback loop · **P2** · `Backlog`

Thumbs-up / thumbs-down on tool outputs writes to a `feedback`
subcollection. Reweights retrieval. Closes the calibration loop.

---

### F-4. MCP server (read-only) · **P2** · `Backlog`

Per `docs/STRATEGY.md` Week 6. Safe-first: situation retrieval, actor
graph retrieval, source search, canonical entity lookup, report
generation, workspace usage status. Build only after Stream B is
fully READY.

---

## STREAM G — Research-blocked tasks (NOW UNBLOCKED, 2026-04-25)

> **All 10 research prompts answered.** The deep-research artifact is at
> `docs/compass_artifact_wf-7af05074-9b31-4316-834d-b3a7500f4cf7_text_markdown.md`
> (789 lines, decision-oriented). Below: the unblocked implementation
> task per research item, with the key finding inlined so you don't have
> to re-read the artifact for every action.

### G-1. Vertex AI Agent Engine deployment ✓ unblocked → C-2

**Findings (R1):** API resource is still `ReasoningEngine`. Resource ID
is numeric in path
`projects/{PROJECT_NUMBER}/locations/us-central1/reasoningEngines/{NUMERIC_ID}`.
Pin `google-cloud-aiplatform[adk,agent_engines]>=1.148.1` and
`google-adk==1.31.1`. Cloud Run invoker SA needs `roles/aiplatform.user`
(no separate `reasoningEngineUser` role exists). Cost ≈ $0.0864/vCPU-hr +
$0.0090/GB-hr + token cost. **Working `deploy.py` already in the artifact;
copy it.** Update `docs/GCP_OPERATIONS.md` §1b to point at it.

### G-2. ACLED licensing — **RESOLVED via pivot** ✅

**Decision (2026-04-25):** Drop ACLED entirely. The compliance burden
($5–25k/yr Corporate License + per-customer attribution + EULA §7.2
controls preventing raw row download) was the wrong trade for a
self-serve SaaS launching on open data. Replaced with
**GDELT BigQuery + UCDP GED** for event-level intelligence — both
open license, both commercially redistributable, both already wired.

The old §B-9 task (ACLED safe-harbour engineering) is **withdrawn**.
The brief at `docs/tacitus-acled-integration-brief.md` is kept as
historical context but is **not** an active workstream.

### G-3. GDELT BigQuery migration ✓ unblocked

**Findings (R3):** GDELT 2.0 (still 15-min cadence, no 3.0 in 2026) is
mirrored free to BigQuery at `gdelt-bq.gdeltv2.gkg_partitioned`,
`events_partitioned`, `eventmentions_partitioned`. **First 1 TB/mo free.**
Build a derived 90-day situation-scoped table in `praxis_analytics`,
partition by `DATE(event_ts)`, cluster by `(situation_id, country_code)`.
CDC via `_PARTITIONTIME` watermark. Don't re-download raw CSV.

**New task: §B-10 (P1)** below — migrate the GDELT poller from raw HTTP
to a Cloud Scheduler-triggered BigQuery upsert.

### G-4. Web scraping — **dropped via pivot** ✅

**Decision (2026-04-25):** Replace third-party scraping (Firecrawl,
Bright Data, Apify, etc.) with **Vertex AI Deep Research +
grounded Google Search**. Removes a $83/mo SaaS dependency, removes
a sub-processor from the DPA, and keeps the entire intelligence
pipeline inside Google Cloud where our IAM and data residency story
already works.

### G-5. BigQuery public datasets — additional sources ✓

**Findings (R5):** Beyond GDELT, free first-1-TB datasets include
`bigquery-public-data.world_bank_*`, `ghcn_d` (NOAA daily summaries),
`noaa_*`, `census_bureau_*`, `who`, plus HDX via Analytics Hub. Treat
as cold-store for analytics, not for live in-app queries.

**New task: §E-3 (P2)** — write a `docs/data/BIGQUERY_PUBLIC.md` listing
the relevant datasets with sample queries, so future agents can wire them
without re-research.

### G-6. Stripe hybrid billing ✓ unblocked → C-4

**Findings (R6):** **Use Stripe Billing + hosted Pricing Tables +
Entitlements API**. Mirror subs into Firestore via the Invertase
`firestore-stripe-payments` extension. Model overages with the **v2
Meters API** (not legacy usage records). Webhook on
`customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`,
`entitlements.active_entitlement_summary.updated`.

**Action:** Update `docs/GCP_OPERATIONS.md` §1d to reference v2 Meters +
Invertase extension. Codex can pick up Stream C-4 with this in hand.

### G-7. Stay on Firestore native KNN ✓ confirmed

**Findings (R7):** Stay on Firestore native KNN at current scale. **Two
quick wins:** (a) switch from COSINE to DOT_PRODUCT with normalized
vectors (faster); (b) migrate to **Vertex AI Vector Search 2.0**
(GA 2026, GCP-native, hybrid+filter) only at ≥10M vectors per situation
or >5 QPS sustained with heavy metadata filtering. Avoid Pinecone unless
you must leave GCP.

**New task: §B-11 (P2)** — switch the existing vector index from COSINE
to DOT_PRODUCT and re-embed with L2-normalised vectors.

### G-8. Use Vertex AI (not AI Studio) ✓

**Findings (R8):** **Use Vertex AI (`aiplatform.googleapis.com`) with
ADC**. Same per-token price as AI Studio, but adds IAM, data residency,
SLA, VPC-SC — required by UN/EU buyers. At our shape: ~$28/mo for Gemini
3 Flash + ~$80–120/mo for Gemini 3.1 Pro structured calls.

**New task: §D-5 (P1)** — migrate `src/lib/ai/providers.ts` to prefer
the Vertex AI SDK over the AI Studio key when both are present. Already
controlled by `AI_PROVIDER` env var; confirm Vertex path is the
default in Cloud Run.

### G-9. SKC + explicit GraphRAG ✓ validated, extended

**Findings (R9):** Per-situation Firestore subcollection is correct.
**Add an explicit GraphRAG layer** (entities = the 8 ACO primitives)
using Microsoft's local→global pattern. Use Spanner-backed RAG Engine
for managed corpus storage. Hybrid graph+vector beats vector-only on
multi-hop ACO questions.

**New task: §F-5 (P2)** — wire GraphRAG explicitly into the SKC graph
layer per the artifact's reference diagram.

### G-10. UN procurement / SOC 2 path ✓

**Findings (R10):** Register on **UNGM at Level 2** (>$500k contracts),
get **SOC 2 Type II** (4–9 months, $25–50k all-in for a startup).
Publish a DPA covering GDPR + ISO 27018 cloud-PII. Offer **EU data
residency** (`europe-west1` or `europe-west4`). Comparable contracts:
Dataminr ~$100k+/yr, Recorded Future six-figure, Palantir Gotham
millions. **Target $50–150k/yr Enterprise tier for PRAXIS.**

**New task: §F-6 (P2)** — start a `docs/COMPLIANCE.md` tracking SOC 2
prep, draft DPA, DPIA template. Not blocker for current paid-tier launch
unless selling to UN before SOC 2 is in.

---

## NEW tasks unblocked by 2026-04-25 research

### B-9. ACLED safe-harbour — **WITHDRAWN** ✅

**Status:** Withdrawn 2026-04-25. We dropped ACLED entirely as part of
the open-source pivot — see G-2 above. The integration brief at
`docs/tacitus-acled-integration-brief.md` is historical context only.

The capacity that was going to flow into this task is redirected to
**B-10 (GDELT BigQuery hot slice)**, which becomes the canonical event
data path now that ACLED is out.

### B-10. GDELT poller → BigQuery migration · **P0** (promoted from P1) · `Pending`

**Why:** Compass R3 — free up to 1 TB/mo, 15-min cadence preserved,
zero ingestion code on our side. Cuts the `cloud_functions/gdelt_poller`
maintenance to a Cloud Scheduler-triggered BigQuery upsert.

> **Authoritative implementation playbook:**
> `docs/implementation/gdelt-ingestion-2026-04-25.md` (1036 lines,
> 2026-04-25). Detailed step-by-step covering: prerequisites + API
> enablement, two dedicated service accounts (`praxis-gdelt-poller`,
> `praxis-gdelt-reader`) with minimal IAM grants, the **two-tier pull
> pattern** (T1 direct query + T2 hot materialized slice), table DDL
> for `praxis_analytics.gdelt_situation_events` with partition + cluster
> spec, the Cloud Run Job source layout, Cloud Scheduler config,
> Firestore cache schema, error handling, and observability hooks.
> Ship T1 first, add T2 when ≥10 active situations.

**Files to read:** the playbook above, plus
`cloud_functions/gdelt_poller/main.py`, `scripts/audit-gcp.mjs`.

**Files to touch:**
- New `infrastructure/bigquery/gdelt_situation_events.sql` (DDL +
  scheduled query) per playbook §3.
- New `backend/services/gdelt/` Cloud Run Job per playbook §4.
- Cloud Scheduler trigger per playbook §5.
- Replace the legacy cloud function source per playbook §6.

**DoD:** New table populates every 15 min. App reads from it via the
existing GDELT client (small refactor — same interface). Per-situation
T1 query returns sub-200ms cached, sub-4s cold.

### B-11. Vector index COSINE → DOT_PRODUCT · **P2** · `Pending`

Re-create the Firestore vector index with `DOT_PRODUCT` distance.
Re-embed all existing chunks normalised to unit L2. Faster queries; no
behaviour change.

### D-5. Default to Vertex AI (not AI Studio) for prod · **P1** · `Pending`

Compass R8. Already supported via `AI_PROVIDER=vertex`. Verify Cloud
Run sets it; if not, set it. Add a unit test in
`tests/unit/lib/ai/providers.test.ts` that asserts the chosen path
matches the env var.

### E-3. `docs/data/BIGQUERY_PUBLIC.md` · **P2** · `Pending`

Compass R5. List relevant public BigQuery datasets with one example
query each. So future agents wire data sources without re-research.

### F-5. Explicit GraphRAG layer in SKC · **P2** · `Backlog`

Compass R9. Microsoft local→global pattern; wire into existing graph
layer; benchmark vs. vector-only on multi-hop ACO questions.

### F-6. `docs/COMPLIANCE.md` and SOC 2 prep tracker · **P2** · `Pending`

Compass R10. Start the document; track SOC 2 timeline (4–9 months);
draft DPA covering GDPR + ISO 27018; line up EU data-residency option
(`europe-west1` vs. `europe-west4`).

---

## Done in the 2026-04-25 sessions (snapshot)

| Commit | Stream | Task |
|---|---|---|
| 7b28314 | UX | Pricing migration: hide internal credit metering, sidebar plan badge |
| ce810b0 | A | Role-aware "Recommended for you" dashboard widget |
| 0b6a3c1 | meta | Sprint plan + tandem handoff scaffolding |
| 9f05783 | UX/onboarding | Contrast pass · onboarding mandate counter · system-health Copy-Diagnostic + Activate-Sources card · landing hero rewrite · pricing-teaser explainer |
| fc7b9f1 | UX/docs | Geospatial Monitor situation-aware centroid · region-centers module · `docs/tools/` scaffolding · `docs/RESEARCH_PROMPTS.md` |
| 5fb542b | docs | `docs/CONTEXT_INJECTION.md` · `docs/GCP_OPERATIONS.md` |
| dae0b48 | docs | `docs/DEPLOYMENT_LOG.md` updated · final Codex handover |

Production deployed: Cloud Build `204af7bf-730a-4c33-90c2-77d5e3976bfc`,
revisions `praxis-frontend-00046-475` + `praxis-backend-00028-z26`.

---

## Authoring rules for this file

- When you complete a task, change its `Pending` to `Done <commit>` in
  the same commit that finishes the work. Don't batch.
- When you start a task, mark it `In progress (<your-name>)` so the
  other assistant doesn't pick it up.
- When you discover a new task, add it here under the correct stream
  with full DoD before starting.
- When two tasks conflict on the same files, the lower-priority one
  blocks until the higher-priority one merges.
- This file beats every other doc when they disagree on what to do
  next. Other docs explain the why; this file is the what.

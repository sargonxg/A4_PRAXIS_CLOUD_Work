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

### C-1. ACLED activation · **P0** · `Pending`

**Why:** 15 minutes from signup to live. Immediate jump in event-timeline
quality across Risk Monitor, Geospatial Monitor, Early Warning.

**Action:** User runs `docs/GCP_OPERATIONS.md` §1a. Then Claude Code or
Codex updates `cloudbuild.yaml` `--update-secrets` and pushes a commit.

**DoD:**
- `curl -s https://praxis.tacitus.me/api/health/feeds | jq '.acled'` is
  `ok`.
- `docs/DEPLOYMENT_LOG.md` updated.

---

### C-2. Vertex AI Agent Engine activation · **P1** · `Pending`

**Blocker:** Need current 2026 deployment recipe. **Run research prompt
R1 in `docs/RESEARCH_PROMPTS.md` first.**

**Action:** User runs prompt R1 → drops result into
`docs/research/vertex-adk-2026-04-25.md` → Codex/Claude Code follows the
recipe to deploy the engine and wire the env var.

**DoD:**
- Deep Research Agent (`/app/deep-search-agent`) returns multi-phase
  agentic output rather than the Gemini fallback.
- `/api/health` reports `vertex_adk: 'ok'`.

---

### C-3. Firecrawl activation · **P1** · `Pending`

User signup at firecrawl.dev → secret in Secret Manager (steps in
`docs/GCP_OPERATIONS.md` §1c) → cloudbuild.yaml updated.

Unlocks CrisisWatch (ICG monthly outlook) + SIPRI arms transfer details
in conflict profiles.

---

### C-4. Stripe billing activation · **P1** · `Pending`

**Blocker:** Need current 2026 best-practice for hybrid (subscription +
usage) billing. **Run research prompt R6 first.**

**Files to touch (after research):**

- Stripe Dashboard (user) — products, prices, webhook.
- `docs/GCP_OPERATIONS.md` §1d — six secrets / env vars to wire.
- Likely `src/app/api/stripe/checkout/route.ts` and
  `src/app/api/stripe/webhook/route.ts` need updates to match the agreed
  pattern (metered vs. recurring + manual overage).

---

### C-5. Anthropic Claude activation · **P2** · `Pending`

Marginal ROI — Gemini 3.1 Pro fallback is already strong. Easy to turn on
when ready.

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

## STREAM G — Research-blocked tasks

Each item below requires the user to run a deep-research prompt first.
Once the result lands in `docs/research/<topic>.md`, the corresponding
implementation task moves into the active stream.

| ID | Research prompt | Implementation task |
|---|---|---|
| G-1 | R1 (Vertex ADK) | C-2 |
| G-2 | R2 (ACLED license) | Confirm SaaS redistribution legality before paid tiers |
| G-3 | R3 (GDELT 3.0) | Possibly migrate poller to BigQuery public dataset |
| G-4 | R4 (Firecrawl alternatives) | Pick scraping vendor before scaling C-3 |
| G-5 | R5 (BigQuery public datasets) | Migrate select feeds to BigQuery for cost |
| G-6 | R6 (Stripe hybrid billing) | C-4 |
| G-7 | R7 (Vector DB scale test) | Decide whether to migrate from Firestore KNN |
| G-8 | R8 (Vertex vs. Gemini API costs) | Possible provider switch at scale |
| G-9 | R9 (GraphRAG patterns) | Validate / extend the SKC architecture |
| G-10 | R10 (UN procurement) | Inform certification roadmap (SOC 2 timeline) |

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

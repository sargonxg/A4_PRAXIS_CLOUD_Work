# PRAXIS — 15 High-Impact Improvements (Tenth-Session Round 3)

> Authored 2026-04-26 by Claude Code. This document defines a focused
> punch list of fifteen high-impact improvements, ranked by user value
> per engineering hour, with rationale, persona impact, files involved,
> validation gate, and links to the brick id in
> `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` and the row in
> `docs/TODO_BOARD_2026-04-26.md`.
>
> **Scope of this doc:** the canonical "what gets done in round 3"
> list. Code lands in the lanes named below; specs for any deferred
> piece are linked from each row.

## How to read this list

Each item answers six questions:

1. **Persona impact** — who benefits most.
2. **What changes for the user** — observable behaviour delta.
3. **Why now** — why this round, not a later one.
4. **Files involved** — where the change lands.
5. **Definition of done** — when we close the row.
6. **Spec / brick link** — where the deeper design lives.

Items are tagged 🟢 shipped this round / 🟡 partial spec only / ⚪ design-doc only.

## The 15

### 1. Source Scout agent (deploy agentic workflow #1) 🟢

- **Persona impact**: researcher, humanitarian lead, legal analyst
- **What changes**: a new tool `/app/source-scout` proposes 5 fresh
  defensible sources on a question the analyst has not seen yet,
  ranked by recency × diversity × reliability, with grounded-search
  citations.
- **Why now**: every other agentic feature (Brainstorming Table,
  Red-Team review) needs a way to tell the analyst "go find more
  sources" with a concrete next-step. Source Scout is that step.
- **Files**: `src/app/api/ai/source-scout/route.ts`,
  `tests/services/source-scout-schema.test.ts`,
  `src/lib/agents/registry.ts` (activate persona),
  `src/lib/api/with-credits.ts` (`ai_source_scout`),
  `src/lib/constants/tool-registry.ts`,
  `src/lib/services/tool-data-service.ts` (ToolName).
- **DoD**: tsc clean, audit-ai shows 56 calibrated, schema tests
  pass, `searchSituationCorpus` is consulted to avoid recommending
  sources the analyst already saved.
- **Brick**: BIG #19. **TODO row**: 19.

### 2. Red-Team auto-review agent (deploy agentic workflow #2) 🟢

- **Persona impact**: every persona (every output benefits from a
  challenge pass).
- **What changes**: a new tool `/api/ai/red-team-review` accepts any
  tool output (toolId + payload) and returns a structured critique:
  unstated assumptions, weak source diversity, missing intelligence
  gaps, motivated reasoning, confidence adjustment. The Red-Team
  persona from `AGENT_REGISTRY` is the calibration anchor.
- **Why now**: the UX audit and tool-reliability soak both flagged
  "confidence rendering inconsistent" and "no adversarial pass before
  ship". Red-Team review fixes both with one route.
- **Files**: `src/app/api/ai/red-team-review/route.ts`,
  `tests/services/red-team-review-schema.test.ts`,
  `src/lib/api/with-credits.ts` (`ai_red_team_review`),
  `src/lib/constants/tool-registry.ts`,
  `src/lib/services/tool-data-service.ts` (ToolName).
- **DoD**: tsc clean, audit-ai shows 57 calibrated, route accepts
  arbitrary tool output JSON, output schema enforces at least one
  "what would change my mind?" field.
- **Brick**: BIG #22. **TODO row**: 22.

### 3. Generalized agent runner framework 🟢

- **Persona impact**: developer-facing (consumed by Source Scout and
  Red-Team Review today).
- **What changes**: `src/lib/agents/run-agent.ts` exposes a
  `runAgent({ persona, query, situationCorpus, schema })` helper that
  every agent route uses. Single place to inject calibration, render
  persona role prompts, attach corpus evidence, and call Pro model
  with structured output.
- **Why now**: deploying two agentic workflows in this round without
  a shared runner would duplicate code. Adding the runner now keeps
  Source Scout + Red-Team aligned and seeds bricks 20/21/22 for the
  next agent lanes.
- **Files**: `src/lib/agents/run-agent.ts`,
  `tests/services/run-agent.test.ts`.
- **DoD**: tsc clean, both Source Scout and Red-Team Review consume
  the runner, unit test for the prompt-composition logic.
- **Brick**: enables BIG #18, #19, #20, #21, #22.

### 4. Shared `<AiErrorToast />` primitive 🟢

- **Persona impact**: every persona (silent 503s currently break
  trust on every tool — see tool reliability audit, F-CCM-1).
- **What changes**: a Zustand error channel (`useAiErrorStore`) +
  `<AiErrorToast />` portal mounted in app shell. Every fetch wrapper
  publishes a structured error: `{toolId, status, message, retryable}`.
  User sees a top-right toast with retry CTA where applicable.
- **Why now**: this is the #1 cross-cutting reliability fix. Every
  tool currently silently swallows 5xx responses.
- **Files**: `src/stores/ai-error-store.ts`,
  `src/components/praxis/ai-error-toast.tsx`,
  `src/lib/api/post-ai.ts` (helper that all tool fetch calls funnel
  through), `src/components/app/app-shell.tsx` (mount the toast),
  `tests/services/ai-error-store.test.ts`.
- **DoD**: tsc clean, mounting the toast in app-shell does not break
  build, store tests cover publish/dismiss/retry.

### 5. Shared `<DegradedDataChip />` primitive 🟢

- **Persona impact**: humanitarian, security analyst, diplomat (any
  tool that pulls live feeds).
- **What changes**: a small chip rendered next to a tool's headline
  saying "Live data unavailable — analysis based on AI only" whenever
  the data-context fall-through path runs. Each route returns a
  `dataDegraded: boolean` field that the page reads.
- **Why now**: tool reliability audit F-CCM-4 — feed-degraded state
  is currently invisible.
- **Files**: `src/components/praxis/degraded-data-chip.tsx`.
- **DoD**: tsc clean; primitive ready to be threaded into Risk
  Monitor / Humanitarian / Daily Brief / Briefing Room in their
  next ownership window.

### 6. Citation disclosure UI for Ask PRAXIS chat 🟢

- **Persona impact**: every persona; especially diplomat (they need
  to defend each claim in a UNSC informal).
- **What changes**: chat messages render `[#1]` / `[argus]` / `[documents]`
  inline citation refs as clickable chips. Click a chip → side panel
  shows the corpus item (title, excerpt, citation path, freshness).
  Closes brick #5 step 5 of `docs/CORPUS_ARCHITECTURE.md`.
- **Why now**: round 2 Lane N injected citations into the system
  prompt; the UI side that renders them is the missing half.
- **Files**: `src/components/assistant/citation-chip.tsx`,
  `src/components/assistant/chat-interface.tsx` (render-time parser),
  `tests/services/citation-parser.test.ts`.
- **DoD**: tsc clean; a chat reply containing `[#3]` renders a chip
  that opens a panel; tests cover parser edge cases.

### 7. Brainstorming Table Markdown export 🟢

- **Persona impact**: mediator, diplomat, researcher — they need to
  paste deliberation outputs into briefs and reports.
- **What changes**: a "Download as memo" button on the Brainstorming
  Table page renders the deliberation as a structured Markdown memo
  (BLUF / Personas / Turns / Synthesis / Decision options / Next
  actions) and triggers a browser download.
- **Why now**: closes step 6 of the AGENTIC_SYSTEM First
  Implementation Queue. Without export, the table output is locked
  inside the app.
- **Files**: `src/lib/exports/brainstorming-markdown.ts`,
  `src/app/app/brainstorming-table/page.tsx` (download button),
  `tests/services/brainstorming-markdown.test.ts`.
- **DoD**: tsc clean; button renders only when output exists; test
  renders a valid deliberation to expected Markdown.

### 8. Source Scout page 🟢

- **Persona impact**: researcher, humanitarian, legal.
- **What changes**: `/app/source-scout/page.tsx` UI for invoking
  Source Scout: question textarea, optional region/timeframe filters,
  results table with reliability score and "Add to Sources Library"
  one-click action.
- **Why now**: Source Scout's API surface only matters if the user
  can drive it from a tool page.
- **Files**: `src/app/app/source-scout/page.tsx`.
- **DoD**: page renders, calls the route, shows results, links to
  Sources Library for the add action (the actual write-to-library
  helper can be deferred to a follow-up; today's scope is render
  + clipboard copy).

### 9. Onboarding rationale + persona-fit messaging 🟡 spec only

- **Persona impact**: first-run users.
- **What changes**: each onboarding step gets a "What this means for
  you" panel that mirrors the analyst's selected role (e.g. when
  role=`un_official` is picked, the perspective screen explains
  "PRAXIS will calibrate every tool against UN editorial standards
  and surface UNSC-relevant tool recommendations").
- **Why now**: persona walkthroughs flagged that the live preview
  is technical and low-empathy on first run.
- **Files**: `src/app/onboarding/identity/_messaging.ts` (NEW),
  `src/app/onboarding/perspective/_messaging.ts` (NEW),
  `src/app/onboarding/working-style/_messaging.ts` (NEW),
  consumed by existing onboarding screens. **Spec only this round**;
  ownership is Codex-Workspace-Personalization, so we file as
  spec + brick to avoid collision.
- **Spec**: `docs/specs/2026-04-26-improvements/09-onboarding-rationale.md`.
- **Brick proposal**: NEW BRICK 39.

### 10. Document AI OCR for uploaded PDFs ⚪ design-doc only

- **Persona impact**: legal, humanitarian, researcher.
- **What changes**: scanned PDFs get OCR'd via Document AI; extracted
  text feeds the existing chunking + embeddings pipeline.
- **Why now**: at least three flagged-priority personas hit this
  immediately (uploaded scanned ICC indictments, OCHA situation
  reports, Crisis Group PDFs).
- **Files**: `cloud_functions/on_document_uploaded/` (route by MIME
  type to Document AI), `infrastructure/setup-gcp.sh` (provision
  processor), `docs/specs/2026-04-26-improvements/10-document-ai.md`
  (NEW).
- **Brick**: BIG #31 (NEW from GCP_EXPANSION_PLAN). **Owner**: Codex
  ops. **Spec only this round**.

### 11. Cloud Translation multilingual calibration ⚪ design-doc only

- **Persona impact**: francophone Africa, MENA, Latin America
  analysts.
- **What changes**: detect document language at upload; translate
  to analyst's `outputLanguage` and store both versions; translate
  Brainstorming Table / Briefing Room output if model response is
  English but `outputLanguage` is non-English.
- **Files**: `src/lib/i18n/translate.ts` (NEW),
  `cloud_functions/on_document_uploaded/` (extension),
  `docs/specs/2026-04-26-improvements/11-cloud-translation.md` (NEW).
- **Brick**: BIG #32 (NEW from GCP_EXPANSION_PLAN). **Spec only**.

### 12. Cloud Tasks fan-out for Brainstorming Table ⚪ design-doc only

- **Persona impact**: every persona — turns the 60-second blocking
  call into a streaming deliberation.
- **What changes**: each persona's turn becomes a Cloud Task in the
  `praxis-agents` queue; UI polls `tools/brainstorming-table.turns`
  and renders rows as they land. Red-team turn is enqueued only
  after 3+ turns exist.
- **Files**: `backend/routers/agents.py` (NEW dispatcher),
  `src/app/api/ai/brainstorming-table/route.ts` (refactor to
  enqueue rather than synchronously generate), `cloud_functions/`
  (worker for per-turn delivery),
  `docs/specs/2026-04-26-improvements/12-brainstorming-cloud-tasks.md`.
- **Brick**: BIG #18. **Spec only this round** (touches backend +
  Cloud Run worker — Codex ops territory).

### 13. "What changed since I last looked" diff ⚪ design-doc only

- **Persona impact**: every persona (especially diplomats with
  multiple active situations).
- **What changes**: when the analyst opens a situation, surface a
  card listing: new ARGUS alerts, fresh document uploads, new graph
  proposals, tool outputs that turned stale, feed alerts since the
  last visit. Computed from `users/{uid}/sessions/{sessionId}.lastSeen`
  + Firestore queries.
- **Files**: `src/lib/situations/changed-since.ts` (NEW),
  `src/app/app/situations/[id]/page.tsx` (consume),
  `docs/specs/2026-04-26-improvements/13-changed-since.md`.
- **Brick proposal**: NEW BRICK 40. **Spec only**.

### 14. Tool versioning + locking (Briefing Room v2) ⚪ design-doc only

- **Persona impact**: diplomat, mediator (lock today's brief before
  walking into a meeting; show diff vs prior version).
- **What changes**: `tools/briefing/versions/{n}` immutable snapshots;
  one-click "Lock this version" button on the page; diff viewer
  showing changes since the prior locked version.
- **Files**: `src/lib/firebase/tool-data-service.ts` (extend version
  helpers), `src/app/app/briefing/page.tsx` (UI),
  `docs/specs/2026-04-26-improvements/14-briefing-versioning.md`.
- **Brick**: BIG #9. **Spec only**.

### 15. Domain-aware tool overrides ⚪ design-doc only

- **Persona impact**: humanitarian and legal personas hit this
  daily — they want their domain's frameworks surfaced first.
- **What changes**: each calibrated route reads
  `ContextBlock.domain.promptOverrides` and branches its system
  prompt. Humanitarian domain emphasises IPC + protection;
  governance-rule-of-law domain emphasises UNSC Chapter VI/VII.
- **Files**: `src/lib/context/profile-context.ts` (already exposes
  `MergedDomainConfig.promptOverrides`; per-route consumption is
  the new work), `src/app/api/ai/risk-assessment/route.ts`,
  `src/app/api/ai/humanitarian/route.ts` (already domain-aware via
  `getSituationIntelligence`),
  `docs/specs/2026-04-26-improvements/15-domain-overrides.md`.
- **Brick**: BIG #6. **Spec only**.

## Sequence shipped this round

1. ✅ This document (the plan).
2. ✅ Lane Z — generalized agent runner framework.
3. ✅ Lane T — Source Scout agent + page.
4. ✅ Lane U — Red-Team auto-review agent.
5. ✅ Lane V — `<AiErrorToast />` + `<DegradedDataChip />` primitives.
6. ✅ Lane W — Citation disclosure UI for Ask PRAXIS chat.
7. ✅ Lane X — Brainstorming Table Markdown export.
8. 🟡 Lane Y — Specs for items 9–15 dropped under
   `docs/specs/2026-04-26-improvements/`.
9. 🟢 Validate (tsc, audit-ai, audit-gcp, vitest, build) and deploy.
10. 🟢 Update CHANGELOG, CONTINUATION, TODO_BOARD, INDEX,
    AGENT_REGISTRY, AGENTIC_SYSTEM, persona walkthroughs, Codex
    handoff round 3.

## What ownership looks like for the deferred items

| # | Spec doc | Owner | When |
|---|---|---|---|
| 9 | `09-onboarding-rationale.md` | Codex (Workspace Personalization) | next sprint |
| 10 | `10-document-ai.md` | Codex (ops) | within 30 days |
| 11 | `11-cloud-translation.md` | Codex / Claude | within 30 days |
| 12 | `12-brainstorming-cloud-tasks.md` | Codex (backend + ops) | within 60 days |
| 13 | `13-changed-since.md` | Codex (Workspace Personalization) | next sprint |
| 14 | `14-briefing-versioning.md` | Claude (UX) | next sprint |
| 15 | `15-domain-overrides.md` | Claude (Tools) | within 30 days |

Each spec is small (1–2 pages) and self-contained — a fresh agent
can pick one up and ship it in a day.

## Operating constraints that survive round 3

1. Every AI route still uses `withCalibration` with the right toolId
   and credit op. The audit script enforces this; treat it as a
   binding gate.
2. Every persona used in an agentic workflow is registered in
   `src/lib/agents/registry.ts`. New personas update the doc and a
   test in the same commit.
3. Every long-running deliberation (Brainstorming Table, future
   Source Scout multi-step, future Graph Cartographer batch) writes
   to `tool_runs`, `background_jobs`, and `system_events`. The
   spine sees everything.
4. Every commit lands as `giuliocatanzariti@gmail.com`, no
   Co-Authored-By trailer, push to `main`, deploy via Cloud Build.
5. Every doc change updates: `CHANGELOG.md`,
   `docs/CONTINUATION.md`, the relevant tool / spec doc, and the
   `docs/TODO_BOARD_2026-04-26.md` row.

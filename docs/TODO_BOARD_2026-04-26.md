# PRAXIS Consolidated TODO Board — 2026-04-26

> Single-pane source of truth for every open brick. Updated by every
> agent that lands a commit. Read this BEFORE picking your next lane.
> Pair with `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` (canonical
> roadmap) and `docs/CODEX_HANDOFF_2026-04-26.md` (file ownership).

## Legend

| Field | Values |
|---|---|
| Status | `🟢 done`, `🟡 in-progress`, `⚪ queued`, `🔴 blocked`, `🔵 stub` |
| Owner | `claude`, `codex`, `human-only`, `unassigned` |
| Priority | `P0` (this week), `P1` (this month), `P2` (this quarter), `P3` (backlog) |

## Active sprint (Week ending 2026-05-03)

### Round 3 + 4 lanes shipped (2026-04-26)

| Lane | Status | Owner | Brick | Notes |
|---|---|---|---|---|
| Z — Agent runner framework | 🟢 done | claude | enables BIG #18-22 | `src/lib/agents/run-agent.ts` |
| T — Source Scout | 🟢 done | claude | BIG #19 | `/api/ai/source-scout` + page; persona activated |
| U — Red-Team auto-review | 🟢 done | claude | BIG #22 | `/api/ai/red-team-review` |
| V — AiErrorToast + DegradedDataChip | 🟢 done | claude | F-CCM-1, F-CCM-4 | mounted in app-shell |
| W — Citation chips | 🟢 done | claude | NEXT_BRICKS #5 step 5 | parser + CitationIndex/Layer |
| X — BT Markdown export | 🟢 done | claude | AGENTIC step 6 | "Download memo" CTA |
| LP1 — Landing hero overhaul | 🟢 done | claude | meta | hero animation + AI-companion section |
| LP2 — Lane audit | 🟢 done | claude | meta | working tree clean verified |
| AA — Bottom-right collision fix | 🟢 done | claude | screenshot fix | activity pill moved up |
| BB — Dashboard card legibility | 🟢 done | claude | screenshot fix | WidgetShell light-mode tokens |
| CC — Developer backlog | 🟢 done | claude | NEW BRICK 41 | dev_backlog/, autopub from withCalibration |
| DD — Clarifying questions | 🟢 done | claude | NEW BRICK 42 | schema + route helper + modal |
| EE — Wikipedia enrichment | 🟢 done | claude | NEW BRICK 43 | client + prompt-block helper |
| FF — Analyst notes | 🟢 done | claude | NEW BRICK 44 | CRUD + prompt-block helper |
| Y specs (×7) | 🟢 done | claude | meta | docs/specs/2026-04-26-improvements/ |

### Lanes shipped this session

| Lane | Status | Owner | Brick | Notes |
|---|---|---|---|---|
| A — corpus-search retriever | 🟢 done | claude | BIG #2 | `src/lib/intelligence/corpus-search.ts`, `/api/intelligence/corpus-search` |
| B — Humanitarian calibrated route | 🟢 done | claude | BIG #13 / NEXT_BRICKS #3 | Route + schema; page wiring queued as Lane G |
| C — Brainstorming Table MVP | 🟢 done | claude | BIG #7 | Synchronous prototype; Cloud Tasks fan-out queued as BIG #18 |
| D — Shared confidence/citation primitives | 🟢 done | claude | BIG #4 / NEXT_BRICKS #4 | Brainstorming Table is first consumer |
| E — Big-improvements roadmap + persona walkthroughs | 🟢 done | claude | meta | `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md`, `docs/personas/` |
| M — Agent registry codified | 🟢 done | claude | meta | `src/lib/agents/registry.ts`, `docs/AGENT_REGISTRY.md` |
| N — Ask PRAXIS corpus wiring | 🟢 done | claude | BIG #5 (Ask PRAXIS Workspace Operator) | Closes step 4 of `docs/CORPUS_ARCHITECTURE.md` |
| O — Multi-persona test plan | 🟢 done | claude | meta | `docs/TEST_PLAN_2026-04-26.md` |
| P — GCP expansion plan | 🟢 done | claude | meta | `docs/GCP_EXPANSION_PLAN_2026-04-26.md` |
| Q — TODO board | 🟢 done | claude | meta | This file |
| R — Tool reliability soak audit | 🟡 in-progress | claude | meta | `docs/TOOL_RELIABILITY_AUDIT_2026-04-26.md` |
| S — INDEX consolidation | 🟡 in-progress | claude | meta | `docs/INDEX.md` |

### Lanes queued for Codex (handoff doc)

| Lane | Status | Owner | Brick | Notes |
|---|---|---|---|---|
| F — Ask PRAXIS chat → searchSituationCorpus | 🟢 done | claude | BIG #2 | Originally queued for Codex; promoted into Lane N this session |
| G — Humanitarian page wiring | ⚪ queued | codex | BIG #13 | Replace `/api/ai/chat` fallback in `humanitarian/page.tsx`; add demo-fallback badge |
| H — Situation Health Card library + tests | ⚪ queued | codex | BIG #2 (roadmap) | `src/lib/situations/health.ts` |
| I — Real notification bell | ⚪ queued | codex | NEXT_BRICKS #8 | Swap `notifications.tsx` to `users/{uid}/notifications` |
| J — Tool registry id canonicalization | ⚪ queued | codex | NEXT_BRICKS #1 | `toolKey()` helper, migrate Briefing Room + Daily Brief first |
| K — Document → graph cross-link UI | ⚪ queued | codex | BIG #5 / NEXT_BRICKS #6 | Hover affordance + deep-link |

## Big bricks (90-day roadmap)

Tracking from `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md`. **30 named
bricks**; status per brick below.

### Calibration & Corpus (1–8)

| # | Brick | Status | Owner | Priority |
|---|---|---|---|---|
| 1 | Canonical Tool Output Envelope | ⚪ queued | codex | P1 |
| 2 | `/api/intelligence/corpus-search` consumers | 🟡 in-progress | claude | P0 |
| 3 | Firestore vector search pilot (other layers) | ⚪ queued | unassigned | P2 |
| 4 | Source whitelist/blocklist per situation | ⚪ queued | unassigned | P2 |
| 5 | Document → graph cross-link | 🟡 in-progress | codex (backend) + claude (UI) | P1 |
| 6 | Domain-aware tool overrides | ⚪ queued | unassigned | P2 |
| 7 | Profile-version snapshot diff | ⚪ queued | unassigned | P2 |
| 8 | Personal corpus export | ⚪ queued | unassigned | P3 |

### Tools & Workflows (9–17)

| # | Brick | Status | Owner | Priority |
|---|---|---|---|---|
| 9 | Briefing Room v2 — versioned, locked artefact | ⚪ queued | unassigned | P1 |
| 10 | Daily Brief auto-generation 06:00 local | ⚪ queued | unassigned | P1 |
| 11 | Negotiation Prep — positions and interests editor | ⚪ queued | unassigned | P2 |
| 12 | CONCORDIA — situation-grounded mediation simulation | ⚪ queued | unassigned | P2 |
| 13 | Game Theory — Schelling diagram + UNSC veto branch | ⚪ queued | unassigned | P2 |
| 14 | Risk Monitor — 90-day sparkline from version history | ⚪ queued | unassigned | P2 |
| 15 | Early Warning — stage-transition notifications | ⚪ queued | unassigned | P2 |
| 16 | Conflict Graph — split surfaces | ⚪ queued | unassigned | P2 |
| 17 | Documents — triple-pane (paragraph / entity / graph) | ⚪ queued | unassigned | P2 |

### Agents & Long-Running Jobs (18–24)

| # | Brick | Status | Owner | Priority |
|---|---|---|---|---|
| 18 | Brainstorming Table on Cloud Tasks | ⚪ queued | unassigned | P1 |
| 19 | Source Scout agent | 🔵 stub registered | unassigned | P1 |
| 20 | Graph Cartographer + delta approval queue | 🔵 stub registered | unassigned | P1 |
| 21 | Timeline Editor agent | 🔵 stub registered | unassigned | P2 |
| 22 | Red-Team agent on every report | ⚪ queued | unassigned | P2 |
| 23 | Cloud Tasks dispatcher migrating off worker pool | ⚪ queued | codex (infra) | P2 |
| 24 | Multi-session Vertex Agent storage | ⚪ queued | unassigned | P2 |

### Operational Excellence & Trust (25–30)

| # | Brick | Status | Owner | Priority |
|---|---|---|---|---|
| 25 | Operator Console v2 | ⚪ queued | codex | P1 |
| 26 | BigQuery `praxis_analytics.system_events` sink | ⚪ queued | unassigned | P2 |
| 27 | Stripe Meters for usage billing | ⚪ queued | unassigned | P2 |
| 28 | Email notification path (SendGrid) | ⚪ queued | unassigned | P1 |
| 29 | Demo-leak audit closed | ⚪ queued | unassigned | P0 |
| 30 | SOC 2 / DPA path documented | ⚪ queued | human-only | P2 |

### NEW bricks from GCP_EXPANSION_PLAN (31–38)

| # | Brick | Status | Owner | Priority |
|---|---|---|---|---|
| 31 | Document AI OCR for uploaded PDFs | ⚪ queued | unassigned | P1 |
| 32 | Cloud Translation multilingual calibration | ⚪ queued | unassigned | P1 |
| 33 | Cloud Workflows pipeline orchestration | ⚪ queued | codex (infra) | P2 |
| 34 | Cloud KMS cookie/session secret rotation | ⚪ queued | codex (infra) | P1 |
| 35 | Vertex AI Eval model regression catch | ⚪ queued | unassigned | P2 |
| 36 | Cloud Armor WAF/rate-limit at edge | ⚪ queued | codex (infra) | P2 |
| 37 | Vertex AI Pipelines embedding refresh | ⚪ queued | unassigned | P2 |
| 38 | IAP admin gating | ⚪ queued | codex (infra) | P2 |

### NEW bricks from rounds 3 + 4 (39–44)

| # | Brick | Status | Owner | Priority |
|---|---|---|---|---|
| 39 | Onboarding rationale + persona-fit messaging | ⚪ queued | codex | P1 |
| 40 | "What changed since I last looked" diff card | ⚪ queued | codex | P1 |
| 41 | Developer backlog admin UI + auto-publish on slow-tool / corpus-empty | ⚪ partial | claude | P1 — Lane CC shipped the Firestore + API; UI + extra autopub queued |
| 42 | Clarifying questions wired into 3 high-impact routes (Risk Monitor, Briefing Room, Negotiation Prep) | ⚪ partial | claude | P1 — Lane DD shipped framework; per-route adoption queued |
| 43 | Wikipedia enrichment threaded into Conflict Graph + Timeline routes | ⚪ partial | claude | P1 — Lane EE shipped client; per-route adoption queued |
| 44 | Analyst notes settings UI + corpus-search 'analyst-notes' layer | ⚪ partial | claude | P1 — Lane FF shipped the helper; UI + corpus-layer queued |

### NEW bricks from round 5 (45–54)

Plan: `docs/ROUND_5_PLAN_2026-04-26.md`

| # | Brick | Status | Owner | Priority |
|---|---|---|---|---|
| 45 | Hero quadrant tour (4-panel cycle) | 🟢 done | claude | round 5 — `hero-quadrant-tour.tsx` |
| 46 | Color system audit | 🟢 done (memo) | claude | round 5 — `COLOR_SYSTEM_AUDIT_2026-04-26.md`; per-page leaks queued |
| 47 | Brief Builder agent (agentic workflow #3) | 🟢 done | claude | round 5 — `/api/ai/brief-builder` + schema + tests |
| 48 | Conflict Graph delta panel | 🟢 done (UI shipped) | claude | round 5 — service + API + panel; canonical-graph mutate stub queued |
| 49 | Daily Brief 06:00 cron per situation | 🟢 done | claude | round 5 — `/api/cron/daily-brief` + scheduler config; gcloud apply queued |
| 50 | Sources Library priority lift | 🟢 done | claude | round 5 — preference helper + Source Scout integration + 15 tests |
| 51 | Onboarding rationale messaging | 🟢 done (helper shipped) | claude | round 5 — 7 roles × 10 domains × 4 langs; page wiring queued for codex |
| 52 | Real notification bell wired to Firestore | 🟢 done | claude | round 5 — useLiveNotifications + NotificationBell swap |
| 53 | Document → graph cross-link primitive | 🟢 done (chip shipped) | claude | round 5 — `<DocumentRefChip />` + tests; per-page wiring queued |
| 54 | Stripe Meters for usage billing | 🟢 done (helper shipped) | claude | round 5 — emitMeterEvent + emitToolRunMetered; withCalibration wiring queued |

## Test automation backlog (P-Test-X)

From `docs/TEST_PLAN_2026-04-26.md`:

| ID | Test | Status | Owner | Priority |
|---|---|---|---|---|
| P-Test-1 | Onboarding gate integration test | ⚪ queued | unassigned | P1 |
| P-Test-2 | Calibrated route system-prompt assertion | ⚪ queued | unassigned | P2 |
| P-Test-3 | Demo-flag agreement test (server vs client) | ⚪ queued | unassigned | P1 |
| P-Test-4 | Persistence id assertion per tool | ⚪ queued | unassigned | P0 (after Lane J) |
| P-Test-5 | Playwright smoke for tool four canonical paths | ⚪ queued | unassigned | P2 |
| P-Test-6 | Ask PRAXIS corpus-citation regression | ⚪ queued | unassigned | P1 |
| P-Test-7 | Brainstorming Table red-team row assertion | ⚪ queued | unassigned | P2 |

## Quick wins (drop-in any session)

These are <1 hour each. Anyone reading this with spare time can do
them; no spec required.

- Replace remaining `[ACLED]` source labels in user-facing copy
  (search `src/`, omit type names like `MinimalACLEDEvent`).
- Add a "Demo data — feeds unavailable" badge to Humanitarian when it
  falls back to `DEMO_*` constants. (Resolves a P-Test-3 friction.)
- Rename `useFirecrawl` → `useGroundedSearch` in
  `src/lib/constants/source-categories.ts`. Audit doc says this is a
  rename-only refactor.
- Migrate one tool (Risk Monitor recommended) to consume the new
  `<ConfidenceBadge />`, `<Citation />`, and `<OutputProvenancePanel />`
  primitives shipped in Lane D.
- Wire the Brainstorming Table Markdown export
  (AGENTIC_SYSTEM First Implementation Queue step 6).

## Operating procedure

Every session ends by either:

1. Updating a row in this board (mark a status, update an owner), or
2. Adding a new row when a fresh brick is identified.

Never remove rows except when a brick is split into others; preserve
the audit trail.

When a `🔴 blocked` row appears, document the blocker in the brick
spec under `docs/superpowers/specs/<date>-<brick>.md` and unassign the
owner so someone else can pick it up cold.

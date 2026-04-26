# PRAXIS Tool Reliability Soak Audit — 2026-04-26

> Authored after the tenth-session multi-lane sprint. Walks the top-10
> tools through their failure modes and files specific TODOs to make
> each one production-solid. Pair with
> `docs/tools/UX_AUDIT_2026-04-26.md` (UX baseline) and
> `docs/TEST_PLAN_2026-04-26.md` (test matrix).
>
> The lens here is **operational**: what breaks, in what order, and what
> the user sees when it does. Every tool gets one section ending in a
> short TODO list referencing `docs/TODO_BOARD_2026-04-26.md`.

## Method

Each tool is walked through five failure modes:

1. **No situation** (analyst hasn't created one yet)
2. **No profile / onboarding incomplete** (`meta.completedAt === null`)
3. **Live feeds timeout** (HDX HAPI / ReliefWeb / GDELT slow or 503)
4. **AI model quota / rate-limit** (Pro hits a 429)
5. **Persistence write fails** (Firestore transient error)

A tool passes the soak if every failure mode degrades to a clear empty
state or a 5xx with a specific message — never to fictional content,
silent stalls, or half-saved Firestore docs.

## Top-10 tool soak results

### 1. Ask PRAXIS (chat)

| Failure | Today's behaviour | Pass? |
|---|---|---|
| No situation | Streams generic answer; no situation tools called | 🟢 |
| No profile | `withCalibration` 403 — chat is exempt actually; verify the gate path is reached | 🟡 needs check |
| Feeds timeout | Falls through to model only; corpus retrieval was made fail-closed in Lane A | 🟢 |
| Model quota | Streams an error in the UI but no banner | 🟡 |
| Persistence fail | `saveToolOutput` is fire-and-forget; chat continues | 🟢 |

**TODO**: Add a banner-level error state in the chat UI when streaming
emits an error (P1, file as `tools/ask-praxis-error-state`).

### 2. Daily Brief

| Failure | Today's behaviour | Pass? |
|---|---|---|
| No situation | `<NoSituationState />` | 🟢 |
| No profile | `<OnboardingRequiredState />` | 🟢 |
| Feeds timeout | Pro model still runs; output's `sourcesSummary` may be thin | 🟢 |
| Model quota | 503 from `callProModel`; UI silent | 🔴 |
| Persistence fail | Tool id drift (`auto-briefings` / `auto-briefing` / `daily_brief`) — reload may not surface what was just generated | 🔴 |

**TODO**: Add an error toast on 503 (P1). Lane J (Codex) already owns
the id-drift fix.

### 3. Briefing Room

| Failure | Today's behaviour | Pass? |
|---|---|---|
| No situation | guard | 🟢 |
| No profile | guard | 🟢 |
| Feeds timeout | grounded sources thin; output renders | 🟢 |
| Model quota | 503; UI silent | 🔴 |
| Persistence fail | id drift (`briefing` vs `briefing_room`) | 🔴 |

**TODO**: Same as Daily Brief — error toast + Lane J id drift fix.
Plus brick #9 (versioned, locked artefact).

### 4. Risk Monitor

| Failure | Today's behaviour | Pass? |
|---|---|---|
| No situation | guard | 🟢 |
| No profile | guard | 🟢 |
| Feeds timeout | INFORM scoring degrades to AI-only with no banner — analyst can't tell the live data was missing | 🔴 |
| Model quota | 503; UI silent | 🔴 |
| Persistence fail | clean (route id matches hook id) | 🟢 |

**TODO**: When the data-feed try/catch falls through, surface a chip
that says "Live data unavailable — score based on AI analysis only"
(P1, file as `tools/risk-monitor-degraded-banner`).

### 5. Early Warning

| Failure | Today's behaviour | Pass? |
|---|---|---|
| No situation | guard | 🟢 |
| No profile | guard | 🟢 |
| Feeds timeout | renders demo `_demo.tsx` view in live mode (UX audit flagged) | 🔴 |
| Model quota | 503; UI silent | 🔴 |
| Persistence fail | id drift (3-way: registry / hook / route) | 🔴 |

**TODO**: Split renderer so live mode does not consume demo branding
(NEXT_BRICKS #5 demo-leak audit). Plus Lane J id drift fix.

### 6. Humanitarian (Lane B)

| Failure | Today's behaviour | Pass? |
|---|---|---|
| No situation | guard | 🟢 |
| No profile | guard | 🟢 |
| Feeds timeout | `dataContext` falls through to "feeds unavailable" message in the AI prompt; output marks intelligenceGaps[] | 🟢 |
| Model quota | 503; UI silent | 🔴 |
| Persistence fail | clean (Lane B writes to `tools/humanitarian` consistently) | 🟢 |
| **NEW**: page still calls `/api/ai/chat` | Lane G is queued — analyst sees unstructured output | 🟡 |

**TODO**: Lane G page wiring (Codex). Add a "Demo data — feeds
unavailable" badge to the page when DEMO_* constants render in
`!isDemo`.

### 7. Brainstorming Table (Lane C)

| Failure | Today's behaviour | Pass? |
|---|---|---|
| No situation | guard | 🟢 |
| No profile | guard | 🟢 |
| Corpus retrieval fails | route catches and logs warn; deliberation proceeds without corpus | 🟢 |
| Model quota | 503; UI shows error toast | 🟢 |
| Persistence fail | `saveToolOutput` is fire-and-forget | 🟢 |

**TODO**: Cloud Tasks fan-out (BIG #18) so a 60-second deliberation
doesn't block the request. Markdown export (AGENTIC_SYSTEM step 6).

### 8. Negotiation Prep

| Failure | Today's behaviour | Pass? |
|---|---|---|
| No situation | guard | 🟢 |
| No profile | guard | 🟢 |
| Feeds timeout | n/a (pure analysis tool) | 🟢 |
| Model quota | 503; UI silent | 🔴 |
| Persistence fail | clean | 🟢 |
| **NEW**: NORDALIA_PARTIES leak | renders Nordalia in `!isDemo` (UX audit flagged) | 🔴 |

**TODO**: Demo-leak fix (BIG #29). Brick #11 — positions/interests
editor.

### 9. Conflict Graph

| Failure | Today's behaviour | Pass? |
|---|---|---|
| No situation | guard | 🟢 |
| No profile | guard | 🟢 |
| Feeds timeout | n/a (graph from extraction) | 🟢 |
| Model quota | 503; UI silent | 🔴 |
| Persistence fail | id drift (`conflict_graph` vs `conflict-graph`) | 🔴 |

**TODO**: Lane J id drift fix. Brick #16 (split surfaces).

### 10. Legal Tracker

| Failure | Today's behaviour | Pass? |
|---|---|---|
| No situation | guard | 🟢 |
| No profile | guard | 🟢 |
| Feeds timeout | grounded sources thin; output renders | 🟢 |
| Model quota | 503; UI silent | 🔴 |
| Persistence fail | clean (calibration bug fixed in ninth session) | 🟢 |

**TODO**: Calendar feed-through (legal events → calendar tool).
Chapter VI/VII split visualisation.

---

## Cross-cutting failure-mode TODOs

| ID | Issue | Brick / fix |
|---|---|---|
| F-CCM-1 | Model quota 503 is silent across all tools | New brick: shared `<AiErrorToast />` primitive subscribing to a Zustand error channel; every route's 503 publishes to it. |
| F-CCM-2 | Persistence id drift on 5+ tools | NEXT_BRICKS #1 (Lane J — Codex). |
| F-CCM-3 | Demo data leaks in live mode on 5+ tools | BIG #29 (demo-leak audit). |
| F-CCM-4 | Feed-degraded state lacks visible chip | New brick: shared `<DegradedDataChip />` primitive; surface in Risk Monitor, Humanitarian, Daily Brief, Briefing Room when the data-context fall-through path runs. |
| F-CCM-5 | Profile-version mismatch race | Already mitigated — `withCalibration` reads profile version once at request-start; persisted with output. Track in `docs/COMPLIANCE.md`. |
| F-CCM-6 | Pro model timeout (>60s) on heavy tools | `maxDuration` is set per route (60s default, 90s on Brainstorming Table). Verify the deep tools (Deep Research, Game Theory) don't exceed. |

## Soak schedule

- **Per deploy** (every Cloud Build SUCCESS): run Phase 6 of
  `docs/TEST_PLAN_2026-04-26.md`.
- **Weekly**: walk one of the top-10 tools through the five failure
  modes. Append findings to this file.
- **Monthly**: full top-10 soak; re-baseline this audit.

When a soak finds a regression (a previously-🟢 box turns 🔴), file
the failure in `docs/TODO_BOARD_2026-04-26.md` immediately with the
tool name + failure mode + commit SHA where it likely regressed.

## Reliability principles

1. **Fail closed, not silent.** If a feed times out, say so; if a
   model quota is hit, say so. Don't pretend the tool succeeded.
2. **Never half-save.** Either write the full envelope or write
   nothing. `saveToolOutput` is idempotent; never mutate a partial
   doc.
3. **Demo and live disagree out loud.** When a tool falls back to a
   demo fixture, badge it. Never let an analyst think Nordalia is
   real.
4. **Errors are platform events.** Every 5xx writes a `tool.failed`
   row in `system_events` and emits a notification. Already in place
   via `withCalibration`.
5. **Reload always restores.** A tool the analyst just generated
   must reload to the same state. Id drift is the #1 violation today.

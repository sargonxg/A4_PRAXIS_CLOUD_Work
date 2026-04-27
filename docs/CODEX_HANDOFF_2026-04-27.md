# Codex Handoff — 2026-04-27 (after Claude Code's tenth-session, rounds 1-5)

> **READ THIS FIRST.** The next Codex session starts here. Copy the
> "Prompt" block below verbatim into Codex. Do not modify the prompt
> unless you change the queue.
>
> Local clone for Codex round 6: `C:\Users\giuli\praxiscodexworking`.
>
> GitHub auth: `gh auth status` confirms `sargonxg` logged in via
> keyring. gcloud auth: `giulio@tacitus.me` active on
> `praxisbytacitus`. Firebase: `praxisbytacitus` visible.
>
> Latest production state (verified at session close):
> - Cloud Build round 5 deploy: triggered at session end; revisions
>   land in `docs/DEPLOYMENT_LOG.md` once it completes.
> - Cloud Build round 4 (`7761707d`): SUCCESS. Frontend
>   `praxis-frontend-00077-lqg`, backend `praxis-backend-00047-vbg`
>   live before round 5 takes over.
> - Smoke `/`, `/login`, `/api/health` → 200/200/200.

---

## Prompt (paste this verbatim into Codex)

```text
You are continuing PRAXIS by TACITUS development inside the existing
local clone at C:\Users\giuli\praxiscodexworking.

Step 0 — Sync from origin/main.

  cd C:\Users\giuli\praxiscodexworking
  git pull origin main
  git status
  git log --oneline -12

Step 1 — Read these in order before touching code:

  1. CLAUDE.md
  2. AGENTS.md
  3. docs/ROUND_6_READINESS_2026-04-27.md (short current plan,
     LangGraph readiness, and human decisions)
  4. docs/CONTINUATION.md (read the tenth-session block at the top — it
     covers rounds 1-5)
  5. docs/ROUND_5_PLAN_2026-04-26.md (10 bricks 45-54 + 10 agent
     objectives + GCP/Firebase research summary + landing roadmap)
  6. docs/IMPROVEMENT_15_2026-04-26.md (round-3 plan — bricks 1-15)
  7. docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md (the canonical 90-day
     roadmap — now 54 named bricks)
  8. docs/TODO_BOARD_2026-04-26.md (single-pane status — start here to
     pick a lane)
  9. docs/TOOL_RELIABILITY_AUDIT_2026-04-26.md
 10. docs/COLOR_SYSTEM_AUDIT_2026-04-26.md (round-5 — color leak
     map + canonical token swap rules)
 11. docs/AGENT_REGISTRY.md (10 personas — 6 active, 1 orchestrator,
     3 stubs)
 12. docs/AGENTIC_SYSTEM.md (Brainstorming Table queue is steps 1-5 done)
 13. docs/CORPUS_ARCHITECTURE.md (steps 1-3 done; step 4 done in Lane N)
 14. docs/specs/2026-04-26-improvements/ (drop-in specs for round-3
     items 9-15 — Onboarding rationale, Document AI, Cloud Translation,
     Brainstorming Cloud Tasks, Changed-since diff, Briefing
     versioning, Domain overrides)
 15. CHANGELOG.md (Unreleased — covers rounds 1-5)

Step 2 — Pick ONE lane from the queue below and own it end-to-end.

File-ownership rules to respect (Claude touched these in rounds 1-5,
edit only if your lane explicitly requires):

  - src/types/corpus.ts, src/lib/intelligence/corpus-search.ts
  - src/app/api/intelligence/corpus-search/route.ts
  - src/lib/intelligence/dev-backlog/ + service.ts
  - src/app/api/intelligence/dev-backlog/route.ts
  - src/app/api/ai/{humanitarian,brainstorming-table,source-scout,
    red-team-review}/route.ts
  - src/app/app/{brainstorming-table,source-scout}/
  - src/components/praxis/{confidence-badge,citation,output-provenance-
    panel,ai-error-toast,degraded-data-chip,clarifying-questions-modal}.tsx
  - src/components/landing/{ai-companion-section,hero-quadrant-tour,
    hero-visual,hero}.tsx
  - src/components/dashboard/widget-shell.tsx (round 4 Lane BB)
  - src/lib/agents/{registry,run-agent,clarifying-questions}.ts
  - src/lib/exports/brainstorming-markdown.ts
  - src/lib/chat/citation-parser.ts
  - src/lib/enrichment/wikipedia.ts
  - src/lib/knowledge/analyst-notes.ts
  - src/lib/services/tool-data-service.ts (ToolName union — add new
    entries here when you ship a new tool)
  - src/lib/api/with-credits.ts (credit ops table)
  - src/lib/api/with-calibration.ts (round-4 backlog auto-publish)
  - src/lib/constants/tool-registry.ts (registry entries)

Codex-owned (untouched in rounds 1-5):

  - src/components/app/app-sidebar.tsx
  - src/lib/auth/auth-context.tsx (live profile sync)
  - src/components/dashboard/recommended-tools-widget.tsx — Lane BB
    color swap was minimal; the sort logic is yours
  - src/components/dashboard/operational-status-panel.tsx
  - src/lib/navigation/tool-preferences.ts
  - src/lib/dashboard/{tool-status-summary,role-recommendations}.ts
  - src/types/preferences.ts
  - src/hooks/use-user-preferences.ts
  - cloud_functions/* (operational spine)
  - infrastructure/* (Cloud Run / Cloud Build / scheduler / IAM)
  - cloudbuild.yaml
  - backend/* (Python FastAPI)
  - firestore.rules / firestore.indexes.json (rules-as-code)

Lane queue (lowest brick id first; check TODO_BOARD for status):

  Brick #29 — Demo-leak audit close (P0). 5+ tools render Nordalia
    constants in !isDemo. Per-tool list in
    docs/tools/UX_AUDIT_2026-04-26.md; pattern: gate every demo
    constant behind isClientDemoMode() OR remove it; replace with an
    empty-state if no live data yet.

  Brick #41 — Developer backlog admin UI + extra autopub. Lane CC
    shipped the Firestore + API. Add /app/admin/dev-backlog page
    consuming GET /api/intelligence/dev-backlog; render kind +
    severity filters + status flip CTA + brick-id linker. Auto-pub on
    perf.slow-tool (run > 30s) and corpus.empty hits.

  Brick #42 — Wire clarifying questions into 3 high-impact routes
    (Risk Monitor, Briefing Room, Negotiation Prep). Lane DD shipped
    the framework. Pattern: when the route's input is incomplete,
    return clarificationResponse({...}) with 1-3 questions; the page
    detects via isClarificationResponse() and renders
    <ClarifyingQuestionsModal />.

  Brick #43 — Wikipedia enrichment threaded into Conflict Graph +
    Timeline routes. Lane EE shipped getWikipediaSummary +
    getWikipediaRelated + formatWikipediaPromptBlock. Pattern: in
    each route's calibrated path, derive title from situation.name +
    fetch summary + format the block + prepend to system prompt.

  Brick #44 — Analyst notes settings UI + corpus-search 'analyst-
    notes' layer. Lane FF shipped the helper. Add
    /app/situations/[id]/notes panel + extend searchSituationCorpus
    layers to include 'analyst-notes' with the existing keyword/
    recency scoring.

  Brick #45 — Hero quadrant tour was Claude (round 5). Done.

  Brick #47 — Brief Builder agent (P1). Spec in
    docs/ROUND_5_PLAN_2026-04-26.md. New /api/ai/brief-builder using
    runAgent + 'synthesis-chair' persona. Versioned, lock-able,
    per-section provenance. ai_brief_builder credit op.

  Brick #48 — Conflict Graph delta panel (P1). Wire the
    graph_updates approval queue into the situation overview banner +
    side panel.

  Brick #49 — Daily Brief 06:00 cron (P1). Cloud Scheduler →
    /api/cron/daily-brief → iterate active situations.

  Brick #50 — Sources Library priority lift (P1). Add 'preferred' /
    'blocked' / 'neutral' field; Source Scout consults.

  Brick #51 — Onboarding rationale messaging (P0 — first-run UX).
    Spec at docs/specs/2026-04-26-improvements/09-onboarding-rationale.md.

  Brick #52 — Real notification bell (P0). Spec at NEXT_BRICKS #8.
    Replace demo Zustand state with useActivityFeed.

  Brick #53 — Document → graph cross-link UI (P1). Hover affordance
    + deep-link.

  Brick #54 — Stripe Meters for usage billing (P1). Lane CC's
    auto-publish patterns are a useful reference.

Step 3 — Validate exactly per AGENTS.md before pushing:

  npx tsc --noEmit
  npm run build
  npm run lint
  npm run audit:gcp
  node scripts/audit-ai-routes.mjs
  npx vitest run

  All must pass except lint (warnings tracked tech debt).

Step 4 — Commit + push.

  - Commit message format: feat(<area>): <subject>; body explains why
    + what + how validated. NO Co-Authored-By trailer.
  - git config user.email must be giuliocatanzariti@gmail.com.
  - Push to origin main when validation is green.

Step 5 — Document.

  - CHANGELOG.md: add a Lane <letter> or Brick <#> entry under
    Unreleased.
  - docs/CONTINUATION.md: append a tenth-session-or-later update
    block at the top.
  - docs/TODO_BOARD_2026-04-26.md: flip the brick row's status to
    🟢 done / 🟡 partial / etc.
  - docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md: append a 5-10
    minute walkthrough addendum after the lane lands.

Step 6 — Deploy to Cloud Run via Cloud Build.

  Trigger:
    gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus

  After SUCCESS, smoke-check:
    curl -s https://praxis.tacitus.me/                  -o /dev/null -w "%{http_code}\n"
    curl -s https://praxis.tacitus.me/login             -o /dev/null -w "%{http_code}\n"
    curl -s https://praxis.tacitus.me/api/health        -o /dev/null -w "%{http_code}\n"

  Append the build id + revision names to docs/DEPLOYMENT_LOG.md.

Step 7 — When you're done, leave a fresh handoff for the next agent.

  Either edit this file (CODEX_HANDOFF_2026-04-27.md) to add a
  "Round 2" prompt at the bottom, or create
  docs/CODEX_HANDOFF_<next-date>.md with your fresh queue.

Hard rules carrying over:

  1. Never break withCalibration on AI routes. The audit script must
     keep reporting "57 calibrated, 4 exempt" or higher.
  2. Never reference retired vendors (ACLED, Firecrawl, Tavily,
     Parallel.ai) in user-facing copy.
  3. Never auto-commit when typecheck / build / route audit / vitest
     fails. Lint warnings are acceptable.
  4. Never add a new Firestore collection without rules + indexes
     in the same commit.
  5. Always commit as giuliocatanzariti@gmail.com, no Co-Authored-By
     trailer.
  6. Light-mode tokens only on app surfaces — see
     docs/COLOR_SYSTEM_AUDIT_2026-04-26.md for the canonical swap
     table.
  7. Auto-publish to dev_backlog on every 4xx/5xx — Lane CC's
     withCalibration wiring already does this, but if you add a route
     that doesn't go through withCalibration, call publishBacklogEntry
     yourself on failure.
  8. Pages > 1500 lines should be split before adding features
     (Conflict Graph, Documents, Negotiation Prep are flagged).

Hard rules NEW in round 5:

  9. Every new agentic workflow registers its persona in
     src/lib/agents/registry.ts (active: true) AND adds the persona
     id to src/lib/services/tool-data-service.ts ToolName union.
  10. Every new tool route uses the runAgent() helper from Lane Z
      unless it has a deliberately-different generation path.
  11. Every new tool that pulls live data degrades to a
      <DegradedDataChip /> visible state (not a silent failure).
  12. Every new tool that may need analyst input mid-flight returns
      clarificationResponse(...) instead of guessing.
```

---

## What Codex should NOT touch (Claude-owned in rounds 1-5)

See the file-ownership rules section in the prompt above. The list is
authoritative.

## Open questions that need a human answer (from ROUND_5_PLAN)

1. **Stripe Meters integration (Brick #54)** — Vercel Marketplace
   integration or direct Stripe? **Default**: direct Stripe.
2. **Daily Brief 06:00 (Brick #49)** — analyst's local timezone or
   UTC? **Default**: analyst's local; UTC if no tz on profile.
3. **Brief Builder lock (Brick #47)** — irreversible or admin-
   overridable? **Default**: admin-overridable with audit-log row.
4. **Onboarding rationale copy (Brick #51)** — Giulio writes or
   Claude/Codex drafts? **Default**: Claude/Codex drafts; Giulio
   reviews.
5. **Vertex AI Vector Search migration trigger** — chunk count or
   query latency? **Default**: p99 latency > 800ms on documents
   layer.

## Useful one-liners

```bash
# How many AI route files now? Should be >= 57 / 4 exempt.
node scripts/audit-ai-routes.mjs

# Targeted vitest for the new lanes only (~30s).
npx vitest run tests/services/

# Search for any remaining demo-leak
grep -RIn "DEMO_\|NORDALIA_PARTIES\|isClientDemoMode" src/app/app/

# Check Firestore rules deploy
firebase firestore:rules:get --project=praxisbytacitus | head -50

# Check which Cloud Run revision serves prod
gcloud run services describe praxis-frontend --region=us-central1 \
  --project=praxisbytacitus --format='value(status.latestReadyRevisionName)'

# Pull recent backlog entries for code-agent planning
gcloud firestore documents list dev_backlog \
  --filter='status="open"' --limit=20 --order-by="-updatedAt" \
  --project=praxisbytacitus

# Trigger a fresh deploy (round 6)
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
```

## Tooling cheatsheet

The four agentic workflows that exist today (rounds 1-4):

| Tool | Endpoint | Persona | Credits |
|---|---|---|---|
| Brainstorming Table | `POST /api/ai/brainstorming-table` | 6 personas + synthesis-chair | 5 |
| Source Scout | `POST /api/ai/source-scout` | source-scout | 3 |
| Red-Team Review | `POST /api/ai/red-team-review` | red-team | 3 |
| Humanitarian | `POST /api/ai/humanitarian` | n/a (calibrated direct) | 2 |

Each follows the same pattern: withCalibration → runAgent (when
applicable) → Pro model → Output.object(schema) → saveToolOutput.

## Round-5 changes summary

- Hero animation cycles through 4 product surfaces (Conflict Graph
  → Media Monitor → Drafting Studio → User Context).
- Landing right column now shows the breadth of PRAXIS at a glance.
- Color audit memo names every leak + the canonical swap table.
- 10 new bricks (45-54) + 10 agent objectives in the round-5 plan.
- Codex handoff (this doc) is fresh and self-contained.

Welcome to PRAXIS round 6.

# Codex Handoff — 2026-04-26 (after Claude Code's tenth-session sprint)

> Drop-in prompt for the next Codex session.
> Copy the **Prompt** block below and paste it into Codex. Do not modify
> the prompt unless you change the queue.
>
> Context that informed this handoff:
> - Today's commits land Lanes A–E + persona walkthroughs (see
>   `git log --oneline -8`).
> - Local clone: `C:\Users\giuli\ANTIGRAVITY\A4_PRAXIS_CLOUD_Work`.
> - Older locked clone at `C:\Users\giuli\ANTIGRAVITY\A4_PRAXIS_CLOUD_TACITUS\`
>   was abandoned (Windows file lock prevented removal); secrets preserved at
>   `C:\Users\giuli\ANTIGRAVITY\_praxis_env_backup_20260426\`.
> - GCP / Firebase auth: `gcloud auth list` shows `giulio@tacitus.me` active,
>   project `praxisbytacitus`. `firebase projects:list` enumerates the project.
> - GitHub auth: `gh auth status` confirms `sargonxg` is logged in via keyring.
> - Validation today: `npx tsc --noEmit` clean, `audit-ai-routes` 55/4,
>   `vitest run` 207/207.

---

## Prompt (paste this verbatim into Codex)

```text
You are continuing PRAXIS by TACITUS development inside the existing local
clone at C:\Users\giuli\ANTIGRAVITY\A4_PRAXIS_CLOUD_Work.

Step 0 — Sync from origin/main (Claude just pushed five commits).

  cd C:\Users\giuli\ANTIGRAVITY\A4_PRAXIS_CLOUD_Work
  git pull origin main
  git status
  git log --oneline -8

Step 1 — Read these in order before touching code:

  1. CLAUDE.md
  2. AGENTS.md
  3. docs/CONTINUATION.md (read the tenth-session block at the top)
  4. docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md (NEW — canonical roadmap)
  5. docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md (NEW)
  6. docs/STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md
  7. docs/CORPUS_ARCHITECTURE.md (steps 1-3 are done)
  8. docs/AGENTIC_SYSTEM.md
  9. docs/tools/UX_AUDIT_2026-04-26.md
 10. CHANGELOG.md (Unreleased — tenth-session block)

Step 2 — Pick ONE lane from the queue below and own it end-to-end.
File-ownership conflicts: Claude Code touched src/lib/intelligence/*,
src/types/corpus.ts, src/app/api/intelligence/corpus-search/*,
src/app/api/ai/humanitarian/*, src/app/api/ai/brainstorming-table/*,
src/app/app/brainstorming-table/*, src/components/praxis/{confidence-badge,
citation,output-provenance-panel}.tsx, src/lib/services/tool-data-service.ts
(ToolName union), src/lib/api/with-credits.ts (added two credit ops),
src/lib/constants/tool-registry.ts (humanitarian aiRoute + brainstorming-
table entry). Workspace Personalization files are still Codex-owned (sidebar,
preferences, dashboard recommendations) — do not touch unless your lane
explicitly requires it.

Lane queue (pick exactly one, lowest first):

  Lane F — Wire Ask PRAXIS chat to call searchSituationCorpus.
    Goal: complete step 4 of docs/CORPUS_ARCHITECTURE.md. Replace the
    bespoke buildAskPraxisCorpusContext call inside src/app/api/ai/chat/
    route.ts with a call to searchSituationCorpus({ uid, situationId, query,
    layers, limit: 12 }), render returned items as a citation block in the
    chat system prompt, and surface citation IDs the chat UI can disclose.
    Follow-up brick: citation disclosure UI in src/components/assistant/.
    Definition of done: tsc clean, audit-ai-routes still passes
    (chat is exempt), vitest green, smoke-test from the running dev server
    that Ask PRAXIS now references actual corpus item titles in answers.

  Lane G — Wire Humanitarian page to /api/ai/humanitarian.
    Goal: replace the legacy /api/ai/chat fallback in
    src/app/app/humanitarian/page.tsx with a call to the new structured
    route from Lane B. Render the HumanitarianSnapshotSchema fields
    (BLUF, IPC table, displacement, funding, protection, access,
    intelligence gaps, recommended actions) using the existing
    DEMO_DISPLACEMENT/DEMO_FOOD_PHASES/DEMO_FUNDING UI as the live-mode
    presentation. Add a clear "Demo data — feeds unavailable" badge any
    time DEMO_* constants are rendered in !isDemo. Persist via
    usePersistedToolData('humanitarian', situationId).
    Definition of done: page calls the new route, demo-fallback badge in
    place, snapshot persists across navigation, screenshot in CHANGELOG.

  Lane H — Situation Health Card library + tests.
    Goal: ship the first slice of brick #2 in
    docs/STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md. Add
    src/lib/situations/health.ts exporting computeSituationHealth({uid,
    situationId}) that returns a readiness score 0-100 plus subscores
    for sources, documents, graph, timeline, feeds, and last AI run.
    Add unit tests under tests/services/situation-health.test.ts.
    Surface (read-only) on src/app/app/situations/[id]/page.tsx and
    on the dashboard right rail.
    Definition of done: tsc clean, vitest green, snapshot of the new
    card in CHANGELOG, no Codex-owned dashboard widget files were
    edited (use a new component file instead).

  Lane I — Real notification bell.
    Goal: brick #8 in docs/NEXT_BRICKS_2026-04-26.md. Swap
    src/components/shared/notifications.tsx to read
    users/{uid}/notifications via useActivityFeed for authenticated
    users; preserve demo behavior under isClientDemoMode(). Mark-read
    via PATCH /api/notifications/[id] (already exists).
    Definition of done: live notifications appear in the bell within
    5 seconds of a tool_run failure in another tab; demo continues to
    show the demo Zustand state.

  Lane J — Tool registry id canonicalization sweep.
    Goal: brick #1 from docs/NEXT_BRICKS_2026-04-26.md. Centralize
    toolKey() helper consumed by every save path, registry resolution,
    sidebar status, persisted-tool hook, and SKC dependency resolver.
    Migrate Briefing Room (briefing vs briefing_room) and Daily Brief
    (auto-briefings / auto-briefing / daily_brief) first.
    Definition of done: tsc clean, vitest green, route audit still
    passes, no regressions on Risk Monitor or Conflict Graph reload.

  Lane K — Document → graph cross-link (UI side).
    Goal: brick #6 in docs/NEXT_BRICKS_2026-04-26.md. Backend
    extraction stores documentId on ACO node provenance (Codex-owned
    work). UI side: render a hover affordance on graph nodes showing
    the originating paragraph; deep-link to Documents page with
    ?docId= scrolling to the source text.
    Definition of done: hovering an entity in /app/conflict-graph
    surfaces the originating snippet; clicking opens
    /app/documents?docId=<id>&chunkId=<id>; both work in demo mode.

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

  - CHANGELOG.md: add a Lane <letter> entry under Unreleased.
  - docs/CONTINUATION.md: append a tenth-session-or-later update block
    at the top.
  - docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md: append an addendum
    after the lane lands, walking the most-affected persona for 5-10
    minutes and noting friction.

Step 6 — Deploy to Cloud Run via Cloud Build.

  Trigger:
    gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus

  After SUCCESS, smoke-check:
    curl -s https://praxis.tacitus.me/                  -o /dev/null -w "%{http_code}\n"
    curl -s https://praxis.tacitus.me/login             -o /dev/null -w "%{http_code}\n"
    curl -s https://praxis.tacitus.me/api/health        -o /dev/null -w "%{http_code}\n"

  Update docs/DEPLOYMENT_LOG.md with the build ID, deployed commit,
  Cloud Run revision name, and any production-config gaps.

Step 7 — When you're done, write a fresh handoff block.

  - Edit docs/CODEX_HANDOFF_2026-04-26.md to add a "Round 2" prompt
    that covers what's still open.
  - Or, if it's a new day, create docs/CODEX_HANDOFF_<date>.md with
    your fresh queue.

Hard rules carrying over:

  1. Never break withCalibration on AI routes. The script must keep
     reporting "55 calibrated, 4 exempt" or higher.
  2. Never reference retired vendors (ACLED, Firecrawl, Tavily,
     Parallel.ai) in user-facing copy.
  3. Never auto-commit when typecheck / build / route audit / vitest
     fails. Lint warnings are acceptable.
  4. Never add a new Firestore collection without rules + indexes in
     the same commit.
  5. Always commit as giuliocatanzariti@gmail.com, no Co-Authored-By
     trailer.
  6. Pages > 1500 lines should be split before adding features
     (Conflict Graph, Documents, Negotiation Prep are all flagged).
```

---

## What Codex should NOT touch

- `src/lib/intelligence/corpus-search.ts` (Claude-owned, Lane A).
- `src/types/corpus.ts` (Claude-owned, Lane A).
- `src/app/api/intelligence/corpus-search/route.ts` (Claude-owned, Lane A).
- `src/app/api/ai/humanitarian/route.ts` (Claude-owned, Lane B).
- `src/app/api/ai/brainstorming-table/route.ts` (Claude-owned, Lane C).
- `src/app/app/brainstorming-table/page.tsx` (Claude-owned, Lane C).
- `src/components/praxis/confidence-badge.tsx` (Claude-owned, Lane D).
- `src/components/praxis/citation.tsx` (Claude-owned, Lane D).
- `src/components/praxis/output-provenance-panel.tsx` (Claude-owned, Lane D).

These files can be **read** freely. Edits should land in a follow-up
Claude Code session unless Codex explicitly takes over a file via this
handoff doc.

## What Codex should pick up immediately

- Workspace Personalization remains Codex-owned per the lane assignments
  in `docs/NEXT_BRICKS_2026-04-26.md`:
  `src/lib/auth/auth-context.tsx`, `src/components/app/app-sidebar.tsx`,
  `src/components/dashboard/recommended-tools-widget.tsx`,
  `src/components/dashboard/operational-status-panel.tsx`,
  `src/lib/navigation/tool-preferences.ts`,
  `src/lib/dashboard/tool-status-summary.ts`,
  `src/lib/dashboard/role-recommendations.ts`,
  `src/types/preferences.ts`, `src/hooks/use-user-preferences.ts`.
- Operational Spine: `cloud_functions/*`, `infrastructure/*`,
  `cloudbuild.yaml`, `backend/*`, `firestore.rules`,
  `firestore.indexes.json`.
- Tool registry id canonicalization (Lane J above).

## Open questions that need a human answer

1. **SendGrid vs Mailgun for email notifications?** Default: SendGrid via
   the Vercel Marketplace integration that auto-provisions an API key.
2. **Operator console — non-admin support visibility?** Default: defer.
3. **Migrate `agentSessions/active` to subcollection now or later?**
   Default: defer until first paid customer hits it.
4. **`audit_logs` retention — 365d vs 7y for SOC 2?** Confirm with
   `docs/COMPLIANCE.md`. Today: 365d.
5. **Cloud Monitoring alert email recipient.** Currently empty. Set in
   Console → Monitoring → Alerting.

## Useful one-liners

```bash
# How many AI route files now? Should be >= 55 / 4 exempt.
node scripts/audit-ai-routes.mjs

# Targeted vitest for the new lanes only (~30s).
npx vitest run tests/services/

# Search for residual /api/ai/chat fallback in tool pages.
grep -RIn "fetch('/api/ai/chat'" src/app/app/

# Check Firestore rules deploy.
firebase firestore:rules:get --project=praxisbytacitus | head -50

# Check which Cloud Run revision serves prod.
gcloud run services describe praxis-frontend --region=us-central1 \
  --project=praxisbytacitus --format='value(status.latestReadyRevisionName)'
```

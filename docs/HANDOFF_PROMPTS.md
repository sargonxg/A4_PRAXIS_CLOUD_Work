# PRAXIS Handoff Prompts

Use these prompts to restart work in Claude Code or Codex.

> **Active sprint:** see `docs/SPRINT_2026-04-25.md` for the current week-long plan, audit-backed priorities, and the four parallel work streams (A: Workspace personalisation · B: Tool quality · C: Data activation · D: Ops hygiene). When passing the baton between Codex and Claude Code, route Stream A to whichever assistant is up next, and keep Streams B–D running concurrently. The "What landed in this session" section of the sprint doc is the ground-truth state — read it first before assuming anything about pricing, dashboard widgets, or the sidebar.

## Claude Code Master Prompt

```text
You are continuing PRAXIS by TACITUS. Start from a fresh clone every time:

git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
cd A4_PRAXIS_CLOUD_Work
git status
git log --oneline -5
npm install

Before changing code, read README.md, CLAUDE.md, AGENTS.md, CHANGELOG.md, docs/CONTINUATION.md, docs/SPRINT_BACKLOG.md, docs/SPRINT_2026-04-25.md, docs/CONTEXT_INJECTION.md, docs/USER_ACTION_LIST.md, docs/VISION_2026.md, docs/COMPLIANCE.md, docs/TEAM_OPS.md, docs/STRATEGY.md, docs/DEPLOYMENT_LOG.md, docs/GCP_OPERATIONS.md, docs/RESEARCH_PROMPTS.md, docs/tools/INDEX.md, and the deep-research artifact at docs/compass_artifact_*_text_markdown.md.

Confirm GCP/Firebase context:
gcloud auth list
gcloud config set project praxisbytacitus
gcloud config set run/region us-central1
gcloud projects describe praxisbytacitus
firebase login:list

Run validation:
npm run build
npm run lint
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run

Continue the day-by-day plan in docs/DAILY_WORKPLAN.md. Keep README.md, CLAUDE.md, AGENTS.md, CHANGELOG.md, docs/CONTINUATION.md, docs/STRATEGY.md, docs/DAILY_WORKPLAN.md, and docs/DEPLOYMENT_LOG.md updated. Commit small coherent checkpoints and push so the next fresh clone has your work. Deploy to Cloud Run with gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus only after validation passes. After deploy, verify praxis.tacitus.me, /login, /onboarding, /api/health, and /api/auth/test-firebase, then record the deployed commit and Cloud Run revisions in docs/DEPLOYMENT_LOG.md.
```

## Codex Master Prompt

```text
Continue PRAXIS from the repository root. First read README.md, CLAUDE.md, AGENTS.md, CHANGELOG.md, docs/CONTINUATION.md, docs/STRATEGY.md, docs/DAILY_WORKPLAN.md, docs/DEPLOYMENT_LOG.md, docs/SPRINT_2026-04-25.md, and docs/HANDOFF_PROMPTS.md. Verify git status and recent commits. Run npm install and the validation suite: npm run build, npm run lint, npm run audit:gcp, node scripts/audit-ai-routes.mjs, npx vitest run. Work through docs/SPRINT_2026-04-25.md, keep all strategy and deployment docs current, commit small checkpoints, push to GitHub when validation passes, and deploy to Cloud Run only after validation is green. Preserve GCP/Firebase/Secret Manager/Cloud Run details and never hardcode secrets.
```

## Final Codex Handover (2026-04-25, end of two Claude Code sessions)

This is the prompt to paste into Codex 5.5 when picking up the next slice.
It is anchored in the actual state of `main` after the two Claude Code
sessions ended at commit `5fb542b`, deployed via Cloud Build
`204af7bf-730a-4c33-90c2-77d5e3976bfc` (Cloud Run revisions
`praxis-frontend-00046-475` and `praxis-backend-00028-z26`).

```text
You are continuing PRAXIS by TACITUS as Codex 5.5. Same GitHub repo
(github.com/sargonxg/A4_PRAXIS_CLOUD_Work), same main branch. Always
reclone:

  git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
  cd A4_PRAXIS_CLOUD_Work
  git log --oneline -10
  npm install

Required reading (read all before changing code):
  README.md, CLAUDE.md, AGENTS.md, CHANGELOG.md
  docs/CONTINUATION.md          ← latest "do this next"
  docs/STRATEGY.md              ← long-term roadmap
  docs/SPRINT_2026-04-25.md     ← active week-long sprint plan
  docs/CONTEXT_INJECTION.md     ← THE architectural contract; do not
                                  build a tool that doesn't honour it
  docs/GCP_OPERATIONS.md        ← every gcloud command you'll need
  docs/RESEARCH_PROMPTS.md      ← things to ask deep-research tools
  docs/tools/INDEX.md           ← per-tool micro-app specs
  docs/HANDOFF_PROMPTS.md       (this file)
  docs/DEPLOYMENT_LOG.md

State of the repo at handoff:
  Six commits this session (head = 5fb542b):
    7b28314 feat(pricing) — sidebar plan badge, hide internal credit metering
    ce810b0 feat(dashboard) — role-aware "Recommended for you" widget
    0b6a3c1 docs(sprint)   — sprint plan + tandem handoff
    9f05783 feat(ux)       — contrast pass, onboarding mandate counter,
                             system-health diagnostic + activation guide,
                             landing hero rewrite, pricing-teaser explainer
    fc7b9f1 feat(geospatial) — region-aware map centroid + tool docs scaffolding
    5fb542b docs(context) — Context Injection Contract + GCP runbook

  Production verified post-deploy:
    https://praxis.tacitus.me/         → 200
    https://praxis.tacitus.me/login    → 200
    https://praxis.tacitus.me/onboarding → 307 → /login
    /api/health → firestore + ai_provider + cookie_secret all "ok";
                   anthropic, firecrawl, vertex_adk, stripe "unconfigured"
                   (degrades gracefully — turn-on steps in
                   docs/GCP_OPERATIONS.md §1).

Your assigned stream is **Stream B — Tool quality (P0 persistence
retrofits)**. Claude Code's two sessions worked Stream A (workspace
personalisation), Stream D (UX/contrast/docs), and the architectural
documentation. Stream B files are completely untouched. Order:

  P0  PRAXIS Assistant (chat history) — ~4h
      src/app/app/assistant/page.tsx
      src/components/assistant/chat-interface.tsx
      Persist message history under
        users/{uid}/situations/{sitId}/tools/chat
      Hydrate via useEffect on mount with the saved messages array
      passed as `initialMessages` to useChat. Save on each onFinish via
      a fire-and-forget POST to a new
        /api/situations/[id]/chat
      route that writes via Firebase Admin.

  P0  Dossier Generator — ~2h
      src/app/app/dossier/page.tsx (currently a thin wrapper)
      Wrap with ToolPageShell, hydrate via
        usePersistedToolData('dossier', situationId)
      The /api/ai/dossier route already calls saveToolOutput.

  P0  Negotiation Prep — ~3h
      src/app/app/negotiation-prep/page.tsx
      Add useSituationGuard at the top (currently bypassed).
      Hydrate via usePersistedToolData('negotiation-prep', sitId).
      Verify the API route persists output (it should).
      ZOPA/BATNA editor state has to be wired into the persisted blob.

For each promotion add a unit test under
  tests/unit/components/<tool>/persistence.test.tsx
that mocks Firestore and asserts the page hydrates from the persisted
output (don't just assert it renders).

Hard rules (also in AGENTS.md):
  1. Never expose internal tool-by-tool credit costs publicly.
  2. Public pricing stays plan-based and monthly.
  3. Never hardcode secrets — Secret Manager or Cloud Run env vars only.
  4. Don't deploy before npm run build + npx vitest run + audits pass.
  5. No new graph backend (Neo4j/Falkor/TrustGraph), no MCP server, no
     new AI provider this sprint.
  6. Commits must use giuliocatanzariti@gmail.com only — no
     Co-Authored-By lines.
  7. **Every AI route must be wrapped in withCalibration**. Read
     docs/CONTEXT_INJECTION.md before touching any /api/ai/*.

Validation gate before every push:
  npm run build
  npm run lint
  npm run audit:gcp
  node scripts/audit-ai-routes.mjs   # must report 53/53 calibrated
  npx vitest run

Deploy gate (only after validation passes; only with user authorisation):
  gcloud config set project praxisbytacitus
  gcloud config set run/region us-central1
  gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
  curl -s https://praxis.tacitus.me/api/health | jq
  Record build ID + Cloud Run revisions in docs/DEPLOYMENT_LOG.md.

When you finish your slice:
  - Update CHANGELOG.md (Unreleased section, your own subheading).
  - Update docs/CONTINUATION.md with the new "next work" line and a
    one-paragraph "what's next for the other assistant" so Claude Code
    stays coordinated when it picks up next.
  - Tick off the relevant items in docs/SPRINT_2026-04-25.md Stream B.
  - Commit small coherent checkpoints, push to main.

If you need information you don't have:
  - For up-to-date GCP / vendor specifics, copy the relevant prompt
    from docs/RESEARCH_PROMPTS.md and ask the user to run it. They
    have access to deep research tools you don't.
  - For exact gcloud / Secret Manager commands, see docs/GCP_OPERATIONS.md.
```

## Tandem Handoff — Codex 5.5 ⇄ Claude Code (2026-04-25)

Use this when passing the baton between assistants mid-sprint. Both work on the same `main` branch but in non-overlapping streams; reclone every time.

```text
You are continuing PRAXIS by TACITUS in tandem with the other assistant. Same GitHub repo (sargonxg/A4_PRAXIS_CLOUD_Work), same main branch. Always reclone:

  git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
  cd A4_PRAXIS_CLOUD_Work
  git log --oneline -10
  npm install

Required reading before any code change:
  README.md, CLAUDE.md, AGENTS.md, CHANGELOG.md,
  docs/CONTINUATION.md, docs/STRATEGY.md,
  docs/DAILY_WORKPLAN.md, docs/DEPLOYMENT_LOG.md,
  docs/SPRINT_2026-04-25.md  ← the active sprint plan (audit-backed)
  docs/HANDOFF_PROMPTS.md

State of the repo as of 2026-04-25 (commits 7b28314, ce810b0, plus a small sidebar cleanup):
  - Public pricing surface no longer exposes per-tool credits or raw credit
    counts. Sidebar shows a plan-tier badge (Demo / Free / Analyst / Team /
    Enterprise) linking to /settings. AuthUser carries a `subscription`
    SubscriptionTier hydrated from Firestore.
  - Dashboard has a new role-aware "Recommended for you" widget driven by
    src/lib/dashboard/role-recommendations.ts. CreditsWidget removed from
    the dashboard grid. Domain boost active when situation.domain != generic.
  - Sidebar Source Monitor item hidden (PLACEHOLDER per audit; re-list when
    /api/ai/source-monitor exists and the page persists output).
  - Three audits ran on commit 6056aea — findings are folded into
    docs/SPRINT_2026-04-25.md (read it; do not redo the audits).

Sprint streams (work the one assigned to you; coordinate via commit messages):
  Stream A — Workspace personalisation (audience-aware briefings, role-aware
    empty states, sidebar tool re-ranking, skip-snapshot telemetry)
  Stream B — Tool quality: 8 PARTIAL → READY by adding usePersistedToolData /
    ToolPageShell wrappers. Priority order in SPRINT_2026-04-25.md.
  Stream C — Data activation: ACLED, Firecrawl, Vertex ADK, Stripe — secrets
    in Secret Manager only, never hardcoded. Activation checklist in sprint doc.
  Stream D — Ops: middleware→proxy migration, lint backlog, npm audit triage.

Hard rules (also in AGENTS.md):
  1. Never expose internal tool-by-tool credit costs publicly.
  2. Public pricing must stay plan-based and monthly.
  3. Never hardcode secrets — Secret Manager or Cloud Run env vars.
  4. Don't deploy before npm run build + npx vitest run + audits pass.
  5. Don't add Spanner / Falkor / Neo4j / TrustGraph / MCP this sprint.
  6. Commits must use giuliocatanzariti@gmail.com only — no Co-Authored-By.

Validation gate before every push:
  npm run build
  npm run lint
  npm run audit:gcp
  node scripts/audit-ai-routes.mjs
  npx vitest run

Deploy gate (only after validation passes):
  gcloud config set project praxisbytacitus
  gcloud config set run/region us-central1
  gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
  curl -sI https://praxis.tacitus.me/
  curl -s  https://praxis.tacitus.me/api/health
  curl -s  https://praxis.tacitus.me/api/auth/test-firebase
  Record deployed commit + Cloud Run revisions in docs/DEPLOYMENT_LOG.md.

When you finish your slice:
  1. Update CHANGELOG.md (Unreleased section).
  2. Update docs/CONTINUATION.md with the new "next work" line.
  3. If sprint shape changed, update docs/SPRINT_2026-04-25.md.
  4. Commit small coherent checkpoints, push to main.
  5. Leave a one-paragraph "what's next for the other assistant" note at the
     bottom of docs/CONTINUATION.md so the tandem stays coordinated.
```

## Daily Status Prompt

```text
Read docs/DEPLOYMENT_LOG.md and docs/DAILY_WORKPLAN.md, then tell me:
1. What is deployed on praxis.tacitus.me?
2. What validation last passed?
3. What is the next day-by-day task?
4. What blockers or warnings remain?
5. What should be committed, pushed, or deployed next?
```

## Deployment Prompt

```text
Validate and deploy PRAXIS to praxis.tacitus.me. Start by reading AGENTS.md, docs/CONTINUATION.md, docs/DEPLOYMENT_LOG.md, and cloudbuild.yaml. Run npm run build, npm run lint, npm run audit:gcp, node scripts/audit-ai-routes.mjs, and npx vitest run. If they pass, commit any docs/code updates, push, run gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus, verify Cloud Run revisions and praxis.tacitus.me endpoints, then update docs/DEPLOYMENT_LOG.md with the build ID, revisions, endpoint results, and remaining configuration gaps.
```


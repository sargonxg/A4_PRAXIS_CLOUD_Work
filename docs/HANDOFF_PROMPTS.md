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

## Session Restart Prompt (2026-04-25, end of four Claude Code sessions)

This is the prompt to paste into either Codex 5.5 or a new Claude Code
session to resume work. It recaps where you are, what's deployed,
where the docs live, and what to do next.

```text
You are resuming PRAXIS by TACITUS — a conflict-intelligence
operating system for policy professionals. Same GitHub repo
(github.com/sargonxg/A4_PRAXIS_CLOUD_Work), same main branch. Always
reclone:

  git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
  cd A4_PRAXIS_CLOUD_Work
  git log --oneline -10
  npm install

────────────────────────────────────────────────────────────────────
WHERE YOU ARE WORKING
────────────────────────────────────────────────────────────────────

Production: https://praxis.tacitus.me  (Cloud Run, us-central1)
Repo:       github.com/sargonxg/A4_PRAXIS_CLOUD_Work, branch=main
Local:      C:\Users\giuli\A4_PRAXIS_CLOUD_Work_fresh (Windows)
GCP project: praxisbytacitus (project number 852128226674)
Region:     us-central1
Domain:     praxis.tacitus.me  (Firebase Auth authorized)
Runtime SA: 852128226674-compute@developer.gserviceaccount.com

Latest deploy at handoff time:
  Cloud Build:      995dfad5-b80e-4cb7-a232-59fdddec49a9 (SUCCESS, 9m03s)
  Frontend rev:     praxis-frontend-00050-d4v  (ready)
  Backend  rev:     praxis-backend-00030-2vl   (ready)
  Source commit:    22dd8c9 (head at deploy)
  Subsequent:       bd46423, 6e0ac8e (doc-only, ship next deploy)

────────────────────────────────────────────────────────────────────
TECH STACK
────────────────────────────────────────────────────────────────────

Frontend  Next.js 16.1.6 (App Router, Turbopack), TS 5.9 strict,
          Tailwind v4, Radix UI, Zustand 5, Vercel AI SDK v6,
          Firebase JS SDK, Framer Motion 12, D3 v7, leaflet
Backend   Python 3.11 FastAPI, Genkit, NetworkX, graspologic
AI        Gemini 3 Flash + 3.1 Pro (default), Anthropic Claude
          (optional fallback), Vertex AI ADK Reasoning Engine
          (Deep Research Agent — deploy.py at backend/agents/)
Auth      Firebase Auth (Google OAuth + email/password + demo)
Data      Firestore (single source of truth for situations + tools),
          BigQuery praxis_analytics (GDELT slice when wired),
          Cloud Storage, Pub/Sub (profile.events topic), Secret
          Manager, Cloud Build, Artifact Registry
Deploy    cloudbuild.yaml, gcloud builds submit
Tests     vitest (150/150 passing), tsc --noEmit (clean)
Audits    npm run audit:gcp (0/0), node scripts/audit-ai-routes.mjs
          (53/53 calibrated, 4 exempt)

────────────────────────────────────────────────────────────────────
DEPENDENCIES YOU CAN ASSUME WORK
────────────────────────────────────────────────────────────────────

✓ GOOGLE_AI_API_KEY (Gemini)              live in Secret Manager
✓ FIREBASE_SERVICE_ACCOUNT_KEY            live
✓ COOKIE_SIGNING_SECRET / SESSION_SECRET  live (same secret, two names)
✓ CRON_SECRET                             live
✓ Firebase Auth authorized domain         praxis.tacitus.me ✓
✓ Pub/Sub topic profile.events            ✓
✓ BigQuery dataset praxis_analytics       ✓
✓ Cloud Storage bucket praxisbytacitus-praxis-uploads ✓

Configuration gaps (graceful degrade — turn-on steps in
docs/USER_ACTION_LIST.md):
  ~ ACLED      (Corporate License negotiation pending — see brief)
  ~ Vertex ADK (engine ID — deploy.py ready in backend/agents/)
  ~ Firecrawl  ($83/mo signup pending)
  ~ Stripe     (products + webhook pending)
  ~ Anthropic  (optional, marginal ROI)

────────────────────────────────────────────────────────────────────
DOCS YOU MUST READ ON SESSION START
────────────────────────────────────────────────────────────────────

In order:

 1. README.md                    product overview
 2. CLAUDE.md                    detailed codebase guide
 3. AGENTS.md                    hard rules + validation gate
 4. CHANGELOG.md                 what shipped recently
 5. docs/CONTINUATION.md         last "do this next" pointer
 6. docs/SPRINT_BACKLOG.md       canonical actionable list — pick from here
 7. docs/SPRINT_2026-04-25.md    week-long sprint plan with 4 streams
 8. docs/CONTEXT_INJECTION.md    THE architectural contract
 9. docs/VISION_2026.md          strategic north star
10. docs/USER_ACTION_LIST.md     things only the human user can do
11. docs/COMPLIANCE.md           licensing, certs, sub-processors
12. docs/EXTERNAL_TOOLS_WIRING.md per-feed × per-tool wiring map
13. docs/TEAM_OPS.md             multi-agent operations playbook
14. docs/GCP_OPERATIONS.md       every gcloud command you'll need
15. docs/RESEARCH_PROMPTS.md     deep-research prompt catalogue
16. docs/HANDOFF_PROMPTS.md      this file
17. docs/DEPLOYMENT_LOG.md       last successful deploy state
18. docs/tools/INDEX.md          per-tool micro-app spec catalogue
19. docs/compass_artifact_*.md   789-line research artifact
20. docs/tacitus-acled-integration-brief.md  ACLED ingestion playbook
21. docs/implementation/gdelt-ingestion-2026-04-25.md  GDELT playbook

────────────────────────────────────────────────────────────────────
ARCHITECTURE — KEY THINGS TO INTERNALISE
────────────────────────────────────────────────────────────────────

CONTEXT INJECTION CONTRACT (the heart of PRAXIS):
  Every AI route is wrapped with withCalibration(toolId, creditOpType)
  which assembles a CalibrationContext from four data sources:

    AnalystProfile  ──▶┐
    Situation       ──▶│           ┌──────────────────┐
    Domain config   ──▶├──▶ build ─▶│ systemPromptBlock │── injected into ──▶ AI
    SKC retrieval   ──▶┘           └──────────────────┘

  Every tool then calls saveToolOutput() at the end. 53/53 routes are
  calibrated; 49/49 routes persist outputs to
  users/{uid}/situations/{sitId}/tools/{toolId}.

  NEVER write a system prompt that doesn't begin with systemPromptBlock.

  Full spec: docs/CONTEXT_INJECTION.md.

ONBOARDING (3-screen wizard at /onboarding):
  Step 1 Identity     role + seniority + org + team
  Step 2 Perspective  mandate (≥30 chars) + lenses + regions + audience + domain
  Step 3 Working style sources + language + red lines + analytical style
  Step 4 Review

  Stored at users/{uid}/profile/analyst. Bumps meta.version on each
  edit; immutable snapshot at users/{uid}/profile_versions/{vN}.
  Publishes profile.events Pub/Sub for downstream embedding refresh.

DATABASE MODEL (Firestore):
  users/{uid}/
    profile (credits, subscription, role, orgId, etc.)
    profile/analyst (AnalystProfile)
    profile_versions/{vN} (immutable history)
    settings/api_keys, settings/model_preferences, settings/graph_backend
    situations/{sitId}/
      (metadata) name, type, region, actors, domain, riskScore, glaslStage
      graph/main (nodes, edges)
      tools/{toolId} (saveToolOutput target)
      documents/{id}, reports/{id}, scenarios/{id}, chats/{id},
      briefings/{id}, dossiers/{id}, talking-points/{id}, etc.
  config/domains/{id} (live-editable 11-domain taxonomy)
  config/onboarding_suggestions
  credit_transactions/{txId}

EXTERNAL FEEDS (full mapping in docs/EXTERNAL_TOOLS_WIRING.md):
  Free zero-config:  GDELT, UCDP, UNHCR, HDX, ReliefWeb, UN News, World Bank, Grounded Search
  Paid/freemium:     ACLED, Firecrawl, Anthropic, Vertex ADK, Stripe
  All gracefully degrade when env vars missing.

TOOL CATALOGUE (47 tools across 6 categories):
  Status as of 2026-04-25 audit:
    34 READY · 8 PARTIAL · 6 PLACEHOLDER
  Per-tool specs at docs/tools/<id>.md (template at _TEMPLATE.md).
  Highest-traffic deep specs already written:
    docs/tools/dashboard.md
    docs/tools/assistant.md
    docs/tools/risk-monitor.md
    docs/tools/geospatial-monitor.md

MAPS (Geospatial Monitor):
  Reads situation.region; falls back through src/lib/geo/region-centers.ts
  for centroid (50+ countries mapped). Renders ACLED events when licensed,
  else GDELT events. Hotspot clustering via DBSCAN
  (src/lib/analytics/geospatial-engine.ts).

────────────────────────────────────────────────────────────────────
WHAT TO DO FIRST
────────────────────────────────────────────────────────────────────

Run the validation gate to confirm the local clone is healthy:

  npm run build           # 0 errors
  npm run lint            # warnings allowed; 0 errors
  npm run audit:gcp       # 0 hard, 0 soft
  node scripts/audit-ai-routes.mjs  # 53/53 calibrated
  npx vitest run          # 150/150

Then open docs/SPRINT_BACKLOG.md and pick the highest-priority Pending
task that's not in conflict with what the other assistant is touching.

Recommended next slice:

  Stream B-1 (P0)  PRAXIS Assistant chat persistence (~4h, Codex)
                   Spec at docs/tools/assistant.md
  Stream B-9 (P0)  ACLED safe-harbour (~1-2h, either)
                   Playbook at docs/tacitus-acled-integration-brief.md
  Stream A-2 (P0)  Audience-tuned briefings already shipped behind
                   PRAXIS_AUDIENCE_TUNED_BRIEFING=1 — flip the env
                   var and verify in prod (5 min, user)

────────────────────────────────────────────────────────────────────
HARD RULES (from AGENTS.md, restated)
────────────────────────────────────────────────────────────────────

 1. Never expose internal tool-by-tool credit costs publicly.
 2. Public pricing stays plan-based and monthly.
 3. Never hardcode secrets — Secret Manager / Cloud Run env vars only.
 4. Don't deploy before npm run build + npx vitest run + audits pass.
 5. Every AI route must be wrapped in withCalibration. Read
    docs/CONTEXT_INJECTION.md before touching /api/ai/*.
 6. No new graph backend (Neo4j/Falkor/TrustGraph), no MCP server,
    no new AI provider this sprint without backlog ticket + user OK.
 7. Commits must use giuliocatanzariti@gmail.com only — no
    Co-Authored-By lines, no --amend of pushed commits.
 8. ACLED raw event display stays gated (ACLED_LICENSE_TIER) until
    Corporate License is signed. See docs/COMPLIANCE.md §1.1.

────────────────────────────────────────────────────────────────────
DEPLOY GATE
────────────────────────────────────────────────────────────────────

Only after validation passes AND user authorises:

  gcloud config set project praxisbytacitus
  gcloud config set run/region us-central1
  gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus

  curl -sI https://praxis.tacitus.me/                            # 200
  curl -sI https://praxis.tacitus.me/login                       # 200
  curl -sI https://praxis.tacitus.me/onboarding                  # 307 → /login
  curl -s  https://praxis.tacitus.me/api/health | jq             # status:ok
  curl -s  https://praxis.tacitus.me/api/auth/test-firebase | jq # adminSdkStatus INITIALIZED_OK

  Record build ID + Cloud Run revisions in docs/DEPLOYMENT_LOG.md.

────────────────────────────────────────────────────────────────────
END-OF-SESSION RITUAL
────────────────────────────────────────────────────────────────────

When you finish your slice:

 1. Update CHANGELOG.md (Unreleased section, your own subheading).
 2. Update docs/SPRINT_BACKLOG.md task status to Done <commit-hash>.
 3. Update docs/CONTINUATION.md with the new "do this next" line and
    a one-paragraph note for the other assistant.
 4. Commit small coherent checkpoints.
 5. Push to main.
 6. Deploy only with user authorisation.
 7. Update docs/DEPLOYMENT_LOG.md if you deployed.

If you need information you don't have, copy the relevant prompt
from docs/RESEARCH_PROMPTS.md and ask the user to run it. They have
deep-research access you don't.
```

---

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


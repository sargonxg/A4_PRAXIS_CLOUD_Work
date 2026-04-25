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

Before changing code, read README.md, CLAUDE.md, AGENTS.md, CHANGELOG.md, docs/CONTINUATION.md, docs/STRATEGY.md, docs/DAILY_WORKPLAN.md, docs/DEPLOYMENT_LOG.md, and docs/HANDOFF_PROMPTS.md.

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


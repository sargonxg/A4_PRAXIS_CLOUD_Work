# AGENTS.md - PRAXIS Agent Operating Guide

This file is for Codex, Claude Code, and any future coding agent working on PRAXIS.

## Start Every Session

Use a fresh clone or pull latest first so the agent never works from stale state:

```bash
git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
cd A4_PRAXIS_CLOUD_Work
git status
git log --oneline -5
npm install
```

If the repository already exists locally:

```bash
cd A4_PRAXIS_CLOUD_Work
git fetch origin
git status
git log --oneline -5
```

Do not overwrite uncommitted user work. If the tree is dirty, inspect it and work with it.

## Read These Files Before Changing Code

Required, in this order:

1. `README.md` — product, architecture, setup, deployment overview.
2. `CLAUDE.md` — detailed codebase guide and conventions.
3. `AGENTS.md` — this operating guide (hard rules).
4. `CHANGELOG.md` — what changed recently and what validation passed.
5. `docs/CONTINUATION.md` — last handoff note, "do this next" pointer.
6. `docs/STRATEGY.md` — long-term six-week roadmap.
7. `docs/SPRINT_2026-04-25.md` — current sprint plan with 4 streams.
8. **`docs/SPRINT_BACKLOG.md` — canonical actionable list. Pick your task from here.**
9. **`docs/CONTEXT_INJECTION.md` — the architectural contract every AI route must honour.**
10. `docs/tools/INDEX.md` — per-tool micro-app specs.
11. `docs/GCP_OPERATIONS.md` — every gcloud / Secret Manager command needed.
12. `docs/RESEARCH_PROMPTS.md` — prompts to ask deep-research tools.
13. `docs/HANDOFF_PROMPTS.md` — drop-in prompts when a session ends.
14. `docs/DEPLOYMENT_LOG.md` — last successful deploy state.
15. `docs/DAILY_WORKPLAN.md` — earlier day-by-day plan (kept for context;
    superseded by `SPRINT_2026-04-25.md` + `SPRINT_BACKLOG.md`).
16. **`docs/compass_artifact_wf-7af05074-9b31-4316-834d-b3a7500f4cf7_text_markdown.md`**
    — deep-research artifact (789 lines, 2026-04-25) answering all 10
    research prompts. **Required reading before any Stream C / Stream G
    work.** Critical finding: ACLED's 2026 EULA forbids SaaS
    redistribution without a Corporate License (see G-2 in
    `docs/SPRINT_BACKLOG.md`).

## Current Production Target

- GCP project: `praxisbytacitus`
- Project number: `852128226674`
- Region: `us-central1`
- Frontend Cloud Run service: `praxis-frontend`
- Backend Cloud Run service: `praxis-backend`
- Public domain: `https://praxis.tacitus.me`
- Artifact Registry: `us-central1-docker.pkg.dev/praxisbytacitus/praxis`
- Firebase project: `praxisbytacitus`

## Required Validation Before Deploy

Run these from repo root:

```bash
npm run build
npm run lint
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
```

Do not deploy if build or tests fail. Lint may print warnings; warnings are currently tracked technical debt, not deploy blockers.

## Deploy

```bash
gcloud auth list
gcloud config set project praxisbytacitus
gcloud config set run/region us-central1
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
```

After deploy:

```bash
gcloud run services describe praxis-frontend --region=us-central1 --format="value(status.url,status.latestReadyRevisionName)"
gcloud run services describe praxis-backend --region=us-central1 --format="value(status.url,status.latestReadyRevisionName)"
curl -sI https://praxis.tacitus.me/
curl -sI https://praxis.tacitus.me/login
curl -sI https://praxis.tacitus.me/onboarding
curl -s https://praxis.tacitus.me/api/health
curl -s https://praxis.tacitus.me/api/auth/test-firebase
```

## Documentation Discipline

After every major change, update:

- `CHANGELOG.md`
- `docs/CONTINUATION.md`
- `docs/DEPLOYMENT_LOG.md` if validation or deploy status changed
- `docs/DAILY_WORKPLAN.md` if priorities changed
- `README.md` and `CLAUDE.md` when setup, architecture, deployment, or agent workflow changes

## Commit Discipline

- Make small coherent commits.
- Do not amend previous commits unless the user explicitly asks.
- Push after validation if credentials are available, because future agents are instructed to reclone from GitHub.
- Include the deployed commit hash in `docs/DEPLOYMENT_LOG.md`.

## Hard Rules

- Do not hardcode secrets.
- Do not deploy before local validation passes.
- Do not expose internal tool-by-tool credit costs publicly.
- Do not add Spanner, Falkor, Neo4j, TrustGraph, or MCP work unless there is concrete testable value.
- Preserve Cloud Run, Firebase Auth, Firestore, Secret Manager, and Cloud Build documentation.
- Keep public pricing plan-based and monthly.
- Keep internal metering private.

## One-Line Prompt For Claude Code

Continue PRAXIS from a fresh clone: read `README.md`, `CLAUDE.md`, `AGENTS.md`, `CHANGELOG.md`, `docs/CONTINUATION.md`, `docs/SPRINT_BACKLOG.md`, `docs/SPRINT_2026-04-25.md`, `docs/CONTEXT_INJECTION.md`, `docs/tools/INDEX.md`, `docs/GCP_OPERATIONS.md`, `docs/RESEARCH_PROMPTS.md`, `docs/HANDOFF_PROMPTS.md`, and `docs/DEPLOYMENT_LOG.md`; verify `git status` and `git log --oneline -10`; run `npm install`, `npm run build`, `npm run lint`, `npm run audit:gcp`, `node scripts/audit-ai-routes.mjs`, and `npx vitest run`; pick the next available task from `docs/SPRINT_BACKLOG.md`; keep all docs updated; commit small checkpoints with `giuliocatanzariti@gmail.com` (no Co-Authored-By); push to GitHub; deploy to Cloud Run only after validation passes; record the deploy in `docs/DEPLOYMENT_LOG.md`.


# PRAXIS Handoff Prompts

Use these prompts to restart work in Claude Code or Codex.

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
Continue PRAXIS from the repository root. First read README.md, CLAUDE.md, AGENTS.md, CHANGELOG.md, docs/CONTINUATION.md, docs/STRATEGY.md, docs/DAILY_WORKPLAN.md, docs/DEPLOYMENT_LOG.md, and docs/HANDOFF_PROMPTS.md. Verify git status and recent commits. Run npm install and the validation suite: npm run build, npm run lint, npm run audit:gcp, node scripts/audit-ai-routes.mjs, npx vitest run. Work through docs/DAILY_WORKPLAN.md in order, keep all strategy and deployment docs current, commit small checkpoints, push to GitHub when validation passes, and deploy to Cloud Run only after validation is green. Preserve GCP/Firebase/Secret Manager/Cloud Run details and never hardcode secrets.
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


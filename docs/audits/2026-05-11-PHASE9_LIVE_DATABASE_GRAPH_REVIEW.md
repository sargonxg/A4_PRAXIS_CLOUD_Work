# Phase 9 Live, Database, And Graph Review

Date: 2026-05-11  
Owner: Codex  
Scope: PRAXIS production posture, database choice, Neon token handling, Firebase/GCP checks, and public/app graph polish.

## Summary

The repo is ahead of the live `praxis.tacitus.me` deployment. The public site is reachable and mapped correctly, but it is serving an older landing page. The Phase 8/9 landing and graph-polish code is pushed to `origin/main`; production needs an explicit approved frontend deploy before those changes are live.

The appropriate active Postgres path remains Google Cloud SQL Postgres. The provided Neon API token is stored in Secret Manager as `praxis-neon-api-key` and was checked read-only; the token is valid but currently returns zero Neon projects, so there is no Neon database to bind or migrate into PRAXIS during this checkpoint.

## Evidence

### Secret And Neon

- Secret Manager contains `praxis-neon-api-key`.
- Latest version state: `enabled`.
- Read-only Neon API check: token accepted, `projects=0`.
- No token value was written to source control or printed in repo docs.

### Cloud SQL Postgres

- Active project: `praxisbytacitus`.
- Instance: `praxisbytacitus-instance`.
- Version: `POSTGRES_16`.
- State: `RUNNABLE`.
- Backups: enabled.
- Public IPv4: disabled.
- Databases present: `postgres`, `praxis_langgraph`, `dialectica`, `praxis`.

### Firebase And Google Cloud

- `npm run audit:gcp`: pass, 0 hard failures, 0 soft warnings.
- `npm run audit:gcp-production-posture`: 0 hard failures, 3 soft warnings.
- Soft warnings:
  - uploads bucket public access prevention is inherited.
  - Terraform state bucket could not be inspected with the active account.
  - Cloud Armor policy existence remains a runtime-proof warning.

### Live Production

- `https://praxis.tacitus.me/` responds, but content is the older "AI Built for Statecraft" landing page.
- `https://praxis.tacitus.me/demo/indo-pacific-2026` responds through the live site, but the deployed frontend predates today's Phase 8/9 pushes.
- Cloud Run domain mapping: `praxis.tacitus.me -> ghs.googlehosted.com`, status true.
- Cloud Run frontend latest ready revision: `praxis-frontend-00304-fpd`.
- Most recent Cloud Build shown by `gcloud builds list`: 2026-05-07.

## Graph And App Checks

- Added and pushed richer graph previews in commit `da561346`.
- Queue/doc tracker pushed through `47b9a9a9`.
- Local validation passed:
  - `npm run typecheck`
  - scoped `npm run lint`
  - `npm run build`
  - `npm run audit:landing`
  - `npm run audit:no-internal-jargon-ui`
  - `npm run audit:demo-claim`
  - `npm run audit:visualization`
  - `npm run audit:graph-viewer`
  - `npm run audit:legal-pages-present`
  - `npm run audit:kg-backend`
  - `npm run audit:gcp`
  - `npm run audit:gcp-production-posture`
  - local browser smoke on `/` and `/demo/indo-pacific-2026`
  - `graphify update .`

## Decision

Use Cloud SQL Postgres as the production database for PRAXIS. Keep the Neon token only as an administrative future option until a real Neon project/database exists and a migration decision is approved.

Do not claim the new landing or graph polish is live at `praxis.tacitus.me` until the frontend is redeployed and browser-verified on the production domain.

## Next Action

Queue 16 remains in progress. The next production-facing action is an explicit approved frontend deploy using the existing frontend Cloud Build path, followed by live browser verification of:

- `/`
- `/demo/indo-pacific-2026`
- `/demo/ai-regulation-2026`
- `/demo/fb-sustainability-2026`
- `/pricing`
- `/login`

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

### 2026-05-11 Post-Push Recheck

- GitHub `main` is pushed through `8de97754`.
- Cloud Run `praxis-frontend` is still ready on `praxis-frontend-00304-fpd` with 100% traffic.
- `https://praxis.tacitus.me/`: HTTP 200, title `PRAXIS by TACITUS - AI Built for Statecraft`.
- Browser check: homepage renders `The policy workbench for grounded statecraft.`
- Browser check: homepage does not include the Phase 8/9 public demo selector copy.
- `https://praxis.tacitus.me/demo/indo-pacific-2026`: redirects into the older Syria demo surface; the page does not show `Indo-Pacific Strategic Competition 2026`.
- `https://praxis.tacitus.me/demo/ai-regulation-2026`: HTTP 307 in the live deployed frontend.
- `https://praxis.tacitus.me/pricing`: HTTP 200 and renders `PRAXIS Plans`.
- Browser console check across `/`, `/demo/indo-pacific-2026`, and `/pricing`: no console errors observed.
- `npm run audit:gcp-production-posture`: 0 hard failures, 3 soft warnings.

### 2026-05-11 Local Build And Usability Recheck

- GitHub `main` was clean and synced before verification.
- Latest local commit verified: `1fd1c60b`.
- `npm run typecheck`: pass.
- Scoped ESLint for landing, graph preview, public demo route, auth session route, and persona specs: pass.
- `COOKIE_SIGNING_SECRET=persona-smoke-cookie-secret npm run build`: pass.
- Local production server: `next start` on `http://127.0.0.1:3120`.
- `npm run smoke:personas -- --reporter=line`: 6 passed.
- Desktop and mobile browser checks loaded `/`, `/demo/indo-pacific-2026`, `/demo/ai-regulation-2026`, `/demo/fb-sustainability-2026`, `/pricing`, and `/login`.
- Local browser checks confirmed the three v5 demo contexts render their expected H1s:
  - `Indo-Pacific Strategic Competition 2026`
  - `AI Regulation 2026 - US Federal and State Landscape`
  - `Food and Beverage Regulatory and Sustainability Outlook 2026`
- Local browser console check: no console warnings or errors observed on the checked routes.
- Static product audits passed: `audit:landing`, `audit:demo-claim`, and `audit:visualization`.
- Runtime cloud posture remained healthy: `audit:gcp-production-posture` reported 0 hard failures and 3 soft warnings.

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

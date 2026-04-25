# PRAXIS Deployment Log

Use this file to keep daily deployment status visible to Codex, Claude Code, and humans.

## 2026-04-25 - Handoff Documentation Deployment

Source commit deployed:

- `5cdfebf docs: add agent handoff and deployment strategy`

Cloud Build:

- Build ID: `06b20a50-c0ef-4159-906f-5c97efad8159`
- Status: `SUCCESS`
- Duration: `8M32S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend service: `praxis-frontend`
- Frontend URL: `https://praxis-frontend-pgoyqovcza-uc.a.run.app`
- Frontend revision: `praxis-frontend-00044-tcl`
- Frontend ready: `True`
- Backend service: `praxis-backend`
- Backend URL: `https://praxis-backend-pgoyqovcza-uc.a.run.app`
- Backend revision: `praxis-backend-00027-nlk`
- Backend ready: `True`

Production verification:

- `https://praxis.tacitus.me/` returned `200 OK`.
- `https://praxis.tacitus.me/login` returned `200 OK`.
- `https://praxis.tacitus.me/onboarding` returned `307 Temporary Redirect` to `/login` for unauthenticated requests. This is expected.
- `https://praxis.tacitus.me/api/health` returned `status: ok`.
- Health checks reported:
  - Firestore: `ok`
  - AI provider: `ok`
  - Cookie secret: `ok`
  - Anthropic: `unconfigured`
  - Firecrawl: `unconfigured`
  - Vertex ADK: `unconfigured`
  - Stripe: `unconfigured`
- `https://praxis.tacitus.me/api/auth/test-firebase` confirmed:
  - Firebase reachable: `true`
  - Email/password enabled: `true`
  - Admin SDK status: `INITIALIZED_OK`

Local validation before deploy:

- `npm run build` passed.
- `npm run lint` passed with warnings only.
- `npm run audit:gcp` passed with zero hard failures and zero soft warnings.
- `node scripts/audit-ai-routes.mjs` passed: 53 AI route files, 53 calibrated, 4 exempt.
- `npx vitest run` passed: 40 test files, 140 tests.

Notes:

- This deploy updates production to include `AGENTS.md`, `docs/STRATEGY.md`, `docs/DAILY_WORKPLAN.md`, `docs/DEPLOYMENT_LOG.md`, and `docs/HANDOFF_PROMPTS.md` in the GitHub source and container build context.
- The deployed app itself remains functionally equivalent to the previous runtime deploy; this was a documentation/handoff synchronization deployment.

## 2026-04-25 - Build Stabilization Deployment

Source commit deployed:

- `a808b6f fix(build): stabilize Cloud Run deploy validation`

Cloud Build:

- Build ID: `ca612828-c779-46cd-bfde-8e1a8d3efe85`
- Status: `SUCCESS`
- Duration: `8M37S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend service: `praxis-frontend`
- Frontend URL: `https://praxis-frontend-pgoyqovcza-uc.a.run.app`
- Frontend revision: `praxis-frontend-00042-nhk`
- Frontend ready: `True`
- Backend service: `praxis-backend`
- Backend URL: `https://praxis-backend-pgoyqovcza-uc.a.run.app`
- Backend revision: `praxis-backend-00026-h82`
- Backend ready: `True`

Domain:

- Domain: `praxis.tacitus.me`
- Domain mapping ready: `True`
- Certificate provisioned: `True`
- Domain routable: `True`
- DNS record: `praxis CNAME ghs.googlehosted.com.`

Production verification:

- `https://praxis.tacitus.me/` returned `200 OK`.
- `https://praxis.tacitus.me/login` returned `200 OK`.
- `https://praxis.tacitus.me/onboarding` returned `307 Temporary Redirect` to `/login` for unauthenticated requests. This is expected.
- `https://praxis.tacitus.me/api/health` returned `status: ok`.
- Health checks reported:
  - Firestore: `ok`
  - AI provider: `ok`
  - Cookie secret: `ok`
  - Anthropic: `unconfigured`
  - Firecrawl: `unconfigured`
  - Vertex ADK: `unconfigured`
  - Stripe: `unconfigured`
- `https://praxis.tacitus.me/api/auth/test-firebase` confirmed:
  - Firebase reachable: `true`
  - Email/password enabled: `true`
  - Admin SDK status: `INITIALIZED_OK`

Firebase Auth authorized domains confirmed through Identity Toolkit config:

- `localhost`
- `praxisbytacitus.firebaseapp.com`
- `praxisbytacitus.web.app`
- `praxis.tacitus.me`
- `praxis-nextjs-tacitus.vercel.app`
- `praxis-frontend-852128226674.us-central1.run.app`

Local validation before deploy:

- `npm run build` passed.
- `npm run lint` passed with warnings only.
- `npm run audit:gcp` passed with zero hard failures and zero soft warnings.
- `node scripts/audit-ai-routes.mjs` passed: 53 AI route files, 53 calibrated, 4 exempt.
- `npx vitest run` passed: 40 test files, 140 tests.

Known production configuration gaps:

- Anthropic is unconfigured.
- Firecrawl is unconfigured.
- Vertex ADK engine ID is unconfigured; Deep Research Agent should use fallback behavior.
- Stripe is unconfigured.

## Deployment Verification Commands

```bash
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
gcloud run services describe praxis-frontend --region=us-central1 --format="value(status.url,status.latestReadyRevisionName)"
gcloud run services describe praxis-backend --region=us-central1 --format="value(status.url,status.latestReadyRevisionName)"
curl -sI https://praxis.tacitus.me/
curl -sI https://praxis.tacitus.me/login
curl -sI https://praxis.tacitus.me/onboarding
curl -s https://praxis.tacitus.me/api/health
curl -s https://praxis.tacitus.me/api/auth/test-firebase
```

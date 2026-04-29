# PRAXIS Deployment

Last updated: 2026-04-29.

Production target:

- Project: `praxisbytacitus`.
- Region: `us-central1`.
- Frontend Cloud Run service: `praxis-frontend`.
- Backend Cloud Run service: `praxis-backend`.
- Domain: `praxis.tacitus.me`.

Deploy-safety work is tracked in `docs/PRAXIS_SUPERPLAN_2026-04-29.md`,
especially the Cloud Build audit, Firestore rules/index drift control, and GCP
audit expansion tasks.

## Local Checks Before Deploy

Run the validation gate before deploying:

```bash
npx tsc --noEmit
npm run build
npm run lint
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
```

Use focused tests while developing, then the full gate before push/deploy.
Do not mark unrun checks as passed.

For local browser QA that uses login or demo mode, set
`COOKIE_SIGNING_SECRET` before starting the dev server. Example temporary
PowerShell command:

```powershell
cmd /c "set COOKIE_SIGNING_SECRET=local-dev-only&& npm run dev -- --port 3100"
```

Use a random local-only value for normal development. Do not reuse production
secrets in local docs, tests, or screenshots.

## Cloud Build Deploy

```bash
gcloud config set project praxisbytacitus
gcloud config set run/region us-central1
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
```

After deploy, verify Cloud Run revisions:

```bash
gcloud run services describe praxis-frontend --region=us-central1 \
  --format="value(status.url,status.latestReadyRevisionName)"
gcloud run services describe praxis-backend --region=us-central1 \
  --format="value(status.url,status.latestReadyRevisionName)"
```

## Production Smoke Checks

```bash
curl -sI https://praxis.tacitus.me/
curl -sI https://praxis.tacitus.me/login
curl -sI https://praxis.tacitus.me/onboarding
curl -s https://praxis.tacitus.me/api/health
curl -s https://praxis.tacitus.me/api/auth/test-firebase
```

Then browser-test the core route sequence:

1. Login.
2. Onboarding or existing profile load.
3. Situation selection/creation.
4. Dashboard.
5. Ask PRAXIS.
6. One core tool generation.
7. Export or report creation.

## Secret and IAM Notes

- Do not commit secrets.
- Runtime secrets belong in Secret Manager and are mounted by Cloud Build or
  Cloud Run.
- Production UCDP access is mounted as `UCDP_API_TOKEN` from Secret Manager
  secret `praxis-ucdp-api-token`; never hardcode the token in repo files.
- The backend must remain private.
- Frontend-to-backend calls must go through server-side Next.js API bridges.
- Firestore rules and indexes must be deployed or drift-checked with releases.

## Deeper References

- `docs/PRAXIS_SUPERPLAN_2026-04-29.md`: active deploy-safety and cloud
  hardening roadmap.
- `docs/GCP_OPERATIONS.md`: canonical copy-paste deploy, rollback, secret, IAM,
  and smoke-test commands.
- `cloudbuild.yaml`: production build/deploy pipeline.
- `infrastructure/deploy-windows.ps1`: Windows deployment helper.
- `docs/DEPLOYMENT_LOG.md`: last known deploy state.
- `TODO.md`: active deploy hardening tasks.

# PRAXIS V2 Session C C0-C1 Intake

Date: 2026-05-08
Repo: `C:\Users\giuli\praxiscodexworking`
Source prompts:

- `docs/codex-prompts/PRAXIS_V2_C0_COGNEE_LIVE.md`
- `docs/codex-prompts/PRAXIS_V2_C1_MEMORY_RECALL_IN_CALIBRATION.md`

## Result

C0 and C1 have been preserved and registered as PRAXIS V2 Session C prompts.
They were not implemented in this pass because the live Cognee service
precondition is not satisfied.

## Evidence

Expected service from C0: `praxis-cognee`.

```text
gcloud run services describe praxis-cognee --region=us-east4 --project=praxisbytacitus
ERROR: (gcloud.run.services.describe) Cannot find service [praxis-cognee]
```

Full Cloud Run service inventory in `praxisbytacitus`:

```text
NAME                  REGION       URL
dialectica-api        us-central1  https://dialectica-api-pgoyqovcza-uc.a.run.app
dialectica-web        us-central1  https://dialectica-web-pgoyqovcza-uc.a.run.app
gdelt-poller          us-central1  https://gdelt-poller-pgoyqovcza-uc.a.run.app
on-document-uploaded  us-central1  https://on-document-uploaded-pgoyqovcza-uc.a.run.app
on-situation-created  us-central1  https://on-situation-created-pgoyqovcza-uc.a.run.app
praxis-backend        us-central1  https://praxis-backend-pgoyqovcza-uc.a.run.app
praxis-frontend       us-central1  https://praxis-frontend-pgoyqovcza-uc.a.run.app
```

Repo state:

- `src/app/api/memory/[...slug]/route.ts` already proxies allowed memory paths
  and uses `google-auth-library` ID-token headers when `COGNEE_BACKEND_URL` is
  set.
- `src/lib/knowledge/memory-layer.ts` remains a disabled-safe frontend facade.
- `backend/services/cognee_memory.py` still raises `NotImplementedError` for
  live enabled memory in the monolith; live Cognee is intentionally owned by the
  isolated service.
- `infrastructure/cloudrun/praxis-cognee/` is missing.

## Blockers

- Deploy or add infrastructure for `praxis-cognee`.
- Confirm `praxis-cognee` health endpoint returns 200.
- Bind service-to-service auth, preferably `roles/run.invoker` from the
  monolith service account to `praxis-cognee`.
- Set `COGNEE_BACKEND_URL` and `COGNEE_ENABLED=true` only after the service is
  healthy.
- Run a successful `/api/admin/cognee-smoke` or equivalent owner smoke before
  C1.

## C1 Gate

C1 must not start until C0 is live and green. Wiring `MemoryLayer.recall` into
`withCalibration` before Cognee exists would reintroduce the same UI/runtime
honesty problem the night pack fixed.

# GCP / Firebase Auth And Cleanup Audit - 2026-05-13

## Scope

Live read-only audit of Google Cloud and Firebase authorization, project shape,
PRAXIS runtime resources, and low-risk cleanup candidates.

No mutating cloud cleanup was run. Repo rules still require explicit approval
before changing live cloud resources or deployments.

## Auth Health

| Check | Result |
|---|---|
| Active `gcloud` account | `giulio@tacitus.me` |
| Active `gcloud` project | `praxisbytacitus` |
| Active Cloud Run region | `us-central1` |
| Application Default Credentials | Working |
| Firebase CLI account | `giulio@tacitus.me` |
| Firebase project list | Working |

## Firebase Projects

| Project | Display name | State |
|---|---|---|
| `compassbytacitus` | COMPASSbyTACITUS | ACTIVE |
| `gen-lang-client-0734052078` | TACITUSpipeline | ACTIVE |
| `praxisbytacitus` | PRAXISbyTACITUS | ACTIVE |
| `tacitus-2dcbe` | CONCORDIAbyTACITUS | ACTIVE |
| `windtunnelbytacitus` | WINDTUNNELbyTACITUS | ACTIVE |

PRAXIS Firebase app inventory is clean: one active web app and one default
Hosting site at `praxisbytacitus.web.app`.

## Billing

Most TACITUS projects are linked to the startup credit billing account
`011452-1C91EA-384484`.

| Project | Billing posture |
|---|---|
| `praxisbytacitus` | Enabled on startup credit account |
| `dialectica-tacitus` | Enabled on startup credit account |
| `kairos-temporal-tacitus` | Enabled on startup credit account |
| `tacitus-agon-dev` | Enabled on startup credit account |
| `windtunnelbytacitus` | Enabled on startup credit account |
| `compassbytacitus` | Enabled on startup credit account |
| `concordia-liveapp` | Enabled on startup credit account |
| `tacitus-2dcbe` | Enabled on startup credit account |
| `gen-lang-client-0734052078` | Enabled on startup credit account |
| `google-mpf-mc7f341560lx` | Billing disabled |
| `plasma-talon-lt3cf` | Enabled on non-TACITUS billing account `014BB7-734838-D1BD80` |

Do not delete or relink `plasma-talon-lt3cf` or `google-mpf-mc7f341560lx`
without a separate ownership pass. They are visible but not proven to be safe
cleanup targets from the PRAXIS audit alone.

## PRAXIS Runtime

`npm run audit:gcp` passed with:

- 13 API checks.
- 2 data checks.
- 10 required secret checks.
- Pub/Sub, Cloud Tasks, Cloud Run, Worker Pool, Cloud SQL, service account, and
  Scheduler checks.
- 0 hard failures.
- 0 soft warnings.

Live Cloud Run services in `praxisbytacitus`:

| Service | Region | Ready | Notes |
|---|---|---|---|
| `praxis-frontend` | `us-central1` | yes | Current public frontend |
| `praxis-backend` | `us-central1` | yes | Backend/API runtime |
| `dialectica-api` | `us-central1` | yes | Dialectica sidecar service in PRAXIS project |
| `dialectica-web` | `us-central1` | yes | Dialectica web sidecar service |
| `on-document-uploaded` | `us-central1` | yes | Cloud Functions v2 managed service |
| `on-situation-created` | `us-central1` | yes | Cloud Functions v2 managed service |

The `gdelt-poller` worker pool is ready in `us-central1`.

Cloud SQL:

| Project | Instance | Tier | State | Region | Deletion protection |
|---|---|---|---|---|---|
| `praxisbytacitus` | `praxisbytacitus-instance` | `db-f1-micro` | RUNNABLE | `us-east4` | disabled |
| `tacitus-agon-dev` | `agon-dev` | `db-f1-micro` | RUNNABLE | `us-central1` | disabled |

## Cleanup Candidates

These are candidates, not completed deletions:

1. `praxis-firecrawl-api-key` and `praxis-parallel-api-key` still exist in
   Secret Manager even though the current runbook says those providers are
   retired from the deployed surface. Keep them until a separate secret
   retention decision is made, then destroy only after confirming no deploy
   config still mounts them.
2. Artifact Registry has historical untagged images, especially older
   `praxis/gdelt-poller` images. Clean with a retention command only after
   preserving current live digests and recent rollback images.
3. `plasma-talon-lt3cf` is still the main non-obvious project because it is
   visible under a folder and uses a non-TACITUS billing account. Treat it as
   an ownership investigation item, not an automatic cleanup item.
4. `google-mpf-mc7f341560lx` has billing disabled. It is low cost from billing
   posture alone, but ownership is not proven here.

## Commands Verified

```bash
gcloud auth application-default print-access-token --quiet
firebase projects:list --json
firebase apps:list --project praxisbytacitus --json
firebase hosting:sites:list --project praxisbytacitus --json
firebase firestore:indexes --project praxisbytacitus --json
npm run audit:gcp
```


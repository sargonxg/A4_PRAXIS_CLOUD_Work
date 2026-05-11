# GCP and Firebase Cleanup Review

Date: 2026-05-11  
Project reviewed: `praxisbytacitus`  
Operator: Codex

## Actions Taken

- Set the active `gcloud` project for the `tacitus` configuration to `praxisbytacitus`.
- Set Application Default Credentials quota project to `praxisbytacitus`.
- Stored the provided Neon API token as Secret Manager secret `praxis-neon-api-key`; it is not committed to source and is not used as the active PRAXIS database path.
- Verified Firebase CLI binding points at `praxisbytacitus`.
- Verified Firestore and Storage rules compile with `firebase deploy --only firestore:rules,firestore:indexes,storage --project praxisbytacitus --dry-run`.
- Ran `npm run auth:doctor` after the local project fix; all checks passed.
- Ran `npm run audit:gcp`; all required GCP resources passed with zero hard failures and zero soft warnings.

## Current Runtime Shape

| Area | Status | Notes |
|---|---|---|
| Firebase project | healthy | `.firebaserc` default is `praxisbytacitus`. |
| Firestore | healthy | Native database in `nam5`; rules and indexes compile. |
| Storage | healthy | Storage rules compile; Firebase bucket and app upload buckets are present. |
| Cloud Run | healthy | `praxis-frontend` and `praxis-backend` exist; min scale is default `0`, max scale is capped at `10`. |
| Cloud Functions v2 | healthy | `on-document-uploaded` and `on-situation-created` exist with max scale `1`; the deprecated HTTP `gdelt-poller` function was removed after the Worker Pool was verified ready. |
| Cloud Scheduler | paused by design | `praxis-check-alerts` and `praxis-generate-briefing` are paused. The deprecated paused `gdelt-poller` Scheduler job was removed because GDELT ingestion now runs through the Cloud Run Worker Pool. |
| Cloud SQL | intentional paid resource | `praxisbytacitus-instance` is `db-f1-micro`, Postgres 16, 10 GB, activation policy `ALWAYS`. It supports `praxis`, `praxis_langgraph`, and `dialectica`. |
| Secret Manager | healthy | PRAXIS services mount runtime secrets from Secret Manager. Secret values were not printed. |
| Neon API token | stored only | `praxis-neon-api-key` exists for future Neon administration if needed; PRAXIS remains on Cloud SQL Postgres unless a migration decision changes this. |
| Artifact Registry | healthy with cleanup candidates | PRAXIS, Cloud Functions, and Dialectica images exist. Old untagged images are cleanup candidates, but were not deleted because they can still be useful for rollback. |
| Cloud Build | idle | No ongoing builds were found. |
| Recommender | no active recommendations | Cloud Run cost and IAM recommenders returned no open recommendations in the checked locations. |

## Services Not Deleted

No project, database, bucket, secret, active Cloud Run service, or required Artifact Registry image was deleted in the first pass. A follow-up cleanup removed only the deprecated GDELT HTTP Cloud Function and its paused legacy Scheduler job after confirming the Cloud Run Worker Pool `gdelt-poller` remained `Ready`.

Reasons:

- `praxis-backend`, `praxis-frontend`, Firestore, Storage, Secret Manager, Pub/Sub, Cloud Tasks, Vertex AI, BigQuery, Cloud Build, and Cloud SQL are all referenced by the app, runbooks, or audits.
- `dialectica-api`, `dialectica-web`, and the `dialectica` Cloud SQL database are present in the PRAXIS project, but the repo still contains active Dialectica routes, adapters, and docs. They should be retired only after route telemetry and product ownership are confirmed.
- Cloud Run min scale is already `0`, so idle Cloud Run services are not a standing compute cost.
- Cloud Scheduler jobs were already paused, so there was nothing active to cancel.
- The Cloud SQL instance is the main standing cost, but disabling it would break the Postgres/LangGraph path and likely the backend.

## Follow-Up Cleanup Candidates

These are safe next candidates after explicit confirmation or telemetry evidence:

1. Artifact Registry retention: delete old untagged images after confirming rollback window. Candidate repositories: `praxis`, `dialectica`, `gcf-artifacts`.
2. Dialectica runtime consolidation: decide whether `dialectica-api` and `dialectica-web` are still needed inside `praxisbytacitus` or should move to a Dialectica-owned project.
3. Cloud SQL database split: decide whether the `dialectica` database should remain colocated with PRAXIS or move to a separate database/project.
4. Firestore resilience: decide whether to enable delete protection and point-in-time recovery before production launch.
5. Scheduler activation: keep scheduled jobs paused until cron endpoints, cron secret, and expected spend are verified in a staging/prod runbook.

## Validation Evidence

- `npm run auth:doctor`: pass.
- `npm run audit:gcp`: pass, 0 hard failures, 0 soft warnings.
- `firebase firestore:indexes --project praxisbytacitus`: pass.
- `firebase deploy --only firestore:rules,firestore:indexes,storage --project praxisbytacitus --dry-run`: pass.
- `gcloud builds list --project=praxisbytacitus --ongoing`: no ongoing builds.

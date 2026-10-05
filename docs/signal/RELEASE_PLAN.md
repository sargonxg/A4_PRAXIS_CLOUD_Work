# SIGNAL cloud release plan

Target: existing `praxis-frontend` service, project `praxisbytacitus`, region `us-central1`, public URL `https://praxis.tacitus.me/signal`.

## Baseline and rollback

Read-only baseline: production serves revision `praxis-frontend-01112-6x6` at 100% traffic, image commit `1f029bb829496a0d050f621e57d5d20a8a7d9ea6`. Preserve that revision. Roll back traffic with `gcloud run services update-traffic praxis-frontend --project=praxisbytacitus --region=us-central1 --to-revisions=praxis-frontend-01112-6x6=100`. This rolls back application traffic; retain additive SIGNAL records/indexes and review rules separately. Never delete customer evidence as rollback.

## Staging build

Versioned configuration `scripts/signal/cloudbuild.staging.yaml` clones the complete frontend pipeline with all existing build provenance, networking, resource settings and secret bindings. Deployment adds `--no-traffic --tag=signal`; public production traffic remains on its existing revision. Staging URL: `https://signal---praxis-frontend-pgoyqovcza-uc.a.run.app`. Runtime commit readback targets that tagged URL.

Staging deployment adds `SIGNAL_WORKER_BASE_URL=https://signal---praxis-frontend-pgoyqovcza-uc.a.run.app` through the existing additive `--update-env-vars`, while preserving existing `AGENT_RUN_WORKER_BASE_URL=https://praxis.tacitus.me`. Worker service-account email remains `praxis-agents-sa@praxisbytacitus.iam.gserviceaccount.com` and OIDC audience remains `https://praxis.tacitus.me`; both enqueue and verification use those same existing settings. Test Cloud Tasks on the tagged revision before promotion.

The staging configuration defaults `_DEPLOY_FIRESTORE_RULES=false`: deploying an application revision must not silently publish rules before explicit shared-database readiness checks. SIGNAL requires no security-rule changes: its browser accesses authenticated server APIs, and the existing default denial protects the new owner paths. Verify actual deployed client denial and additive indexes before accepting staging. The normal frontend rules step is best effort, so a successful Cloud Build alone is insufficient proof.

Submit only after full local gates and exact source provenance are recorded:

```bash
export CLOUDSDK_CONFIG=/workspace/.gcloud
export GOOGLE_APPLICATION_CREDENTIALS=/workspace/.gcloud/application_default_credentials.json
export PATH=/workspace/google-cloud-sdk/bin:$PATH
signal_commit="$(git rev-parse HEAD)"
gcloud builds submit . --project=praxisbytacitus \
  --config=scripts/signal/cloudbuild.staging.yaml \
  --service-account=projects/praxisbytacitus/serviceAccounts/praxis-cloudbuild-deployer@praxisbytacitus.iam.gserviceaccount.com \
  --substitutions="_BUILD_SOURCE=signal-staging,_SOURCE_REPO=sargonxg/A4_PRAXIS_CLOUD_Work,_SOURCE_BRANCH=main,_SOURCE_COMMIT=${signal_commit}"
```

Do not label a dirty source snapshot as a clean commit. Commit validated work before submission, preserve upstream history, and do not push main before staging: the enabled `frontend-main-on-push` trigger automatically deploys changes under `src/**`. The full-main trigger separately includes backend/Cloud Functions/full pipeline changes.

## Firestore indexes

`scripts/signal/firestore-indexes.py` reads only SIGNAL field overrides from the repository manifest. Default operation is REST readback/dry run; `--apply` issues supported `PATCH` requests with `updateMask=indexConfig`. It updates only `signalDesks` and `signalJobs` fields, never replaces the database index configuration or removes unrelated indexes. Existing manifest requires collection-group ascending indexes on `signalDesks.watched` and `signalJobs.status`, retaining collection indexes, and disables indexing for large evidence/review arrays and context payload fields. All 13 overrides have now been applied and read back; required indexes are READY.

```bash
python scripts/signal/firestore-indexes.py
# After the parent release checkpoint:
python scripts/signal/firestore-indexes.py --apply
python scripts/signal/firestore-indexes.py
```

Wait for READY collection-group indexes. Verify empty explicit index lists for suppressed fields. The applied-index checkpoint below records completed publication.

## Credentials and authenticated proof

Production already binds `FIREBASE_SERVICE_ACCOUNT_KEY` to `praxis-firebase-sa:latest`. Reuse this existing binding for local Firebase Admin initialization; user ADC is not compatible with the current `cert(JSON)` initialization. Existing disposable canary credentials are stored as `praxis-canary-email` and `praxis-canary-password`; inject directly into child-process environment as `TEST_FIREBASE_EMAIL` and `TEST_FIREBASE_PASSWORD`, without printing or saving values. Do not automate a personal account.

Run authenticated creation/collection/review/capsule/context/brief/export/deletion journeys against tagged staging with a disposable tenant; verify another user cannot access desks, jobs, graphs or exports; workers reject absent or wrong OIDC identity. Do not create synthetic customer data. Existing Cloud Tasks queue `agent-runs` is available. Scheduler has only the existing agent-run sweep; SIGNAL watch sweep scheduling remains a release prerequisite.

## Audit diagnosis

Local GCP audit's BigQuery check uses `gcloud alpha bq datasets describe praxis_analytics`, but this workspace SDK lacks the optional alpha component. That command fails before reaching BigQuery; read-only authenticated BigQuery REST confirms `praxis_analytics` exists in location `US`. This is a local CLI component gap, not a missing dataset. Install the signed SDK alpha component through the normal component manager or use an external command adapter; do not alter the audited repository assertion to conceal failures.

## Production acceptance

After tagged staging passes, ensure production SIGNAL tasks target `https://praxis.tacitus.me` by updating `SIGNAL_WORKER_BASE_URL` on the production-ready revision. Do not promote a revision that retains the tagged staging worker URL. Preserve all existing environment variables and secrets with additive updates. Record exact revision/image digest and commit, promote traffic deliberately, then verify public runtime commit and authenticated `/signal` end to end. Confirm baseline home, health, existing protected routes and capsule workflows still work. Report scheduler/index/rules/worker/deletion proof separately from HTTP page availability.

## Applied index checkpoint

The user authorized the release, including necessary additive SIGNAL field indexes. All 13 manifest overrides were applied through Firestore REST and read back exactly, including narratives, assessments and sourceHeads suppressions. Collection-group watched/status indexes are READY, confirmed by readback and successful real sweep/dispatch. No scheduler job has been created yet. The versioned `scripts/signal/scheduler.py` defaults to dry run and accepts `--apply` only at the production scheduling checkpoint; it injects the existing cron secret directly into the REST request in memory. Schedule is hourly UTC, matching the 24-collection default daily desk budget.

Existing account deletion enumerates all users/{uid} descendant collections recursively, so SIGNAL desks and jobs are covered without collection-specific changes. Full account deletion remains guarded by the existing rules verification flag; do not enable that flag solely for SIGNAL or conflate individual desk deletion with account erasure.

GCP audit rerun after the signed alpha component installation passes with zero hard failures and zero warnings. In this Node 24 cloud workspace, set `NODE_USE_ENV_PROXY=1` so global `fetch` uses the inherited HTTPS proxy; this resolves the Cloud SQL reader's local networking failures. All four Cloud SQL prerequisites were independently confirmed and passed the full audit.

Final index readiness readback: all 13 SIGNAL field overrides match the latest manifest and all six retained/new watched/status single-field indexes report READY. Large payload field index suppression is explicit. SIGNAL sweep queries may now use the collection-group indexes.

## First staged live acceptance

Cloud Build673b268f-fefb-4c55-8ea7-efd510441aeb / revisionpraxis-frontend-01130-dex / sourcea096cefd4438618f31cd82d7c6d81dd573f129ea succeeded with zero production traffic. The actual calibrated route proposed one unaccepted exact-span claim; the dedicated OIDC Cloud Tasks worker collected10 permissioned NASA RSS sources on its first attempt. A real second user received404 for private desk/graph/export access. Anonymous worker401, pause and complete scoped cleanup passed. Versioned safe receipt: [proofs/staging-worker-a096cefd.json](proofs/staging-worker-a096cefd.json).

The full staged evidence/editorial/mobile browser journey passed, but More navigation revealed /app/signal instead of the authenticated root /signal. Corrected candidate staging and all browser gates must pass before main publication.

For repeatable public AI/worker/isolation proof, the smoke helper supports an explicit `--production` mode only with `SIGNAL_SMOKE_BASE_URL=https://praxis.tacitus.me` and `SIGNAL_SMOKE_EXPECTED_COMMIT=<40-character release commit>`. It checks the public runtime commit/repository/main branch before secret reads or test mutations and cleans its disposable desks/jobs/identity. Default mode remains tagged staging only.

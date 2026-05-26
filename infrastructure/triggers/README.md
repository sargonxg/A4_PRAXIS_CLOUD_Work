# Cloud Build triggers — opt-in auto-deploy

This directory holds GCP Cloud Build trigger definitions. Triggers are one-time
imports; the YAML lives in the repo so the import is repeatable and audited.

Both triggers deploy only from GitHub `main`. They stamp Cloud Run with
`PRAXIS_SOURCE_*` and `PRAXIS_BUILD_*` environment variables so the live runtime
health payload can prove which GitHub commit is serving production.

## Installed Production State

As of 2026-05-26, production deploys are wired through the 2nd-gen GitHub
connection:

```text
Connection: projects/praxisbytacitus/locations/us-central1/connections/praxis-github
Repository: projects/praxisbytacitus/locations/us-central1/connections/praxis-github/repositories/A4_PRAXIS_CLOUD_Work
Trigger: frontend-main-on-push -> cloudbuild.frontend.yaml
Trigger: full-main-on-push -> cloudbuild.yaml
Build service account: praxis-cloudbuild-deployer@praxisbytacitus.iam.gserviceaccount.com
```

The first verified GitHub-sourced frontend deploy was build
`c0273ff4-cd5f-4abd-8bd2-f2237e9c1c63`, sourced from GitHub commit
`b3f901513597c4819fc92ae17695f8e9d66b2fd4`, serving Cloud Run revision
`praxis-frontend-00813-z5t`.

The latest verified GitHub-sourced frontend deploy in this setup pass was build
`2b6c951f-57ea-468d-ba22-e9ce80ee533d`, sourced from GitHub commit
`09b30f1767c83a2043b136d18109949c8bccca4e`, serving Cloud Run revision
`praxis-frontend-00815-gbt`.

Cloudflare is the authoritative DNS provider for `tacitus.me`. The production
record is currently DNS-only:

```text
praxis.tacitus.me CNAME ghs.googlehosted.com TTL 600 proxied=false
```

## One-time GitHub connection

Cloud Build 2nd-gen GitHub triggers require a repository connection before
triggers can be created.

```pwsh
gcloud projects add-iam-policy-binding praxisbytacitus `
  --member="serviceAccount:service-852128226674@gcp-sa-cloudbuild.iam.gserviceaccount.com" `
  --role="roles/secretmanager.admin"

gcloud builds connections create github praxis-github `
  --region=us-central1 `
  --project=praxisbytacitus
```

The connection command prints an OAuth URL. Open it while logged into the GitHub
account that owns or administers `sargonxg/A4_PRAXIS_CLOUD_Work`, authorize
Cloud Build, then verify:

```pwsh
gcloud builds connections describe praxis-github `
  --region=us-central1 `
  --project=praxisbytacitus `
  --format="value(installationState.stage)"
```

Expected stage: `COMPLETE`.

Then register the repository:

```pwsh
gcloud builds repositories create A4_PRAXIS_CLOUD_Work `
  --connection=praxis-github `
  --region=us-central1 `
  --project=praxisbytacitus `
  --remote-uri=https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
```

Repository resource:

```text
projects/praxisbytacitus/locations/us-central1/connections/praxis-github/repositories/A4_PRAXIS_CLOUD_Work
```

## Build Deployer Service Account

Second-generation triggers require a user-managed build service account. Do not
use the legacy `852128226674@cloudbuild.gserviceaccount.com` account as the
trigger service account; manual builds may still use it, but trigger runs reject
it.

Installed account:

```text
praxis-cloudbuild-deployer@praxisbytacitus.iam.gserviceaccount.com
```

Required project roles:

```text
roles/cloudbuild.builds.builder
roles/artifactregistry.writer
roles/run.admin
roles/iam.serviceAccountUser
roles/secretmanager.secretAccessor
roles/secretmanager.viewer
roles/cloudsql.viewer
roles/cloudtasks.viewer
roles/pubsub.viewer
roles/serviceusage.serviceUsageConsumer
roles/serviceusage.serviceUsageViewer
roles/storage.admin
roles/storage.objectViewer
```

## Frontend Main Trigger

**Behavior:** every push to `main` that changes frontend app or frontend build
files runs `cloudbuild.frontend.yaml` and promotes the resulting revision to
`praxis-frontend` Cloud Run service.

Docs-only, graphify-only, and unrelated operational notes do not deploy because
the trigger uses `includedFiles`.

### One-time install

```pwsh
gcloud builds triggers create github `
  --name=frontend-main-on-push `
  --region=us-central1 `
  --repository=projects/praxisbytacitus/locations/us-central1/connections/praxis-github/repositories/A4_PRAXIS_CLOUD_Work `
  --branch-pattern="^main$" `
  --build-config=cloudbuild.frontend.yaml `
  --included-files="src/**,public/**,Dockerfile,next.config.*,tsconfig.json,package.json,package-lock.json,cloudbuild.frontend.yaml,infrastructure/triggers/frontend-main.yaml" `
  --include-logs-with-status `
  --service-account=projects/praxisbytacitus/serviceAccounts/praxis-cloudbuild-deployer@praxisbytacitus.iam.gserviceaccount.com `
  --project=praxisbytacitus
```

## Full Main Trigger

**Behavior:** every push to `main` that changes backend, Cloud Function,
pgbouncer, or full Cloud Build files runs `cloudbuild.yaml`, rebuilding and
promoting backend, pgbouncer, and frontend images tagged with the GitHub commit
SHA.

Use this path for backend, worker, Cloud Function, Cloud SQL, secrets mounts, or
runtime infrastructure behavior. Frontend-only Ask PRAXIS/product surface
changes use `frontend-main.yaml`.

### One-time install

```pwsh
gcloud builds triggers create github `
  --name=full-main-on-push `
  --region=us-central1 `
  --repository=projects/praxisbytacitus/locations/us-central1/connections/praxis-github/repositories/A4_PRAXIS_CLOUD_Work `
  --branch-pattern="^main$" `
  --build-config=cloudbuild.yaml `
  --included-files="backend/**,cloud_functions/**,infrastructure/pgbouncer/**,infrastructure/triggers/full-main.yaml,cloudbuild.yaml" `
  --include-logs-with-status `
  --service-account=projects/praxisbytacitus/serviceAccounts/praxis-cloudbuild-deployer@praxisbytacitus.iam.gserviceaccount.com `
  --project=praxisbytacitus
```

### Verify

```pwsh
gcloud builds triggers list --project=praxisbytacitus --filter="name:(frontend-main OR full-main)"
```

Run the frontend trigger manually from the latest `main` commit when a docs-only
commit needs to prove the deployment path:

```pwsh
gcloud builds triggers run frontend-main-on-push `
  --region=us-central1 `
  --branch=main `
  --project=praxisbytacitus
```

Verify live provenance after a deploy:

```pwsh
Invoke-RestMethod https://praxis.tacitus.me/api/health/runtime | ConvertTo-Json -Depth 6
```

The `build` object should report the GitHub repository, `main` branch, commit
SHA, Cloud Build id, Cloud Run service, and Cloud Run revision.

### Manual deploy (still works)

```pwsh
gcloud builds submit `
  --config=cloudbuild.frontend.yaml `
  --project=praxisbytacitus
```

## Coordinating with Codex + Claude

Both agents commit to `main` directly. Keep commits coherent because production
deploys from matching `main` pushes. The trigger file scopes prevent docs-only
and graphify-only commits from redeploying the app.

Recommended pattern:

```text
feat(ask): unify conversation turn rail
```

Backend or infrastructure commits exercise the full production build and should
be treated as heavier release checkpoints.

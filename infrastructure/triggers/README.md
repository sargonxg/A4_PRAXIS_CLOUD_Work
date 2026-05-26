# Cloud Build triggers — opt-in auto-deploy

This directory holds GCP Cloud Build trigger definitions. Triggers are one-time
imports; the YAML lives in the repo so the import is repeatable and audited.

Both triggers deploy only from GitHub `main`. They stamp Cloud Run with
`PRAXIS_SOURCE_*` and `PRAXIS_BUILD_*` environment variables so the live runtime
health payload can prove which GitHub commit is serving production.

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
  --project=praxisbytacitus
```

### Verify

```pwsh
gcloud builds triggers list --project=praxisbytacitus --filter="name:(frontend-main OR full-main)"
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

# Lane: Cloud And Auth Operations

## Scope

- GCloud and Firebase auth.
- Application Default Credentials.
- `.firebaserc` and Firebase MCP binding.
- Cloud Run, Cloud Build, IAM, Secret Manager, Pub/Sub, Cloud Tasks, Cloud SQL.
- Deploy readiness and live runtime proof.

## No-Touch Boundaries

- Do not change IAM, secrets, billing, DNS, credentials, or deploy production without explicit user approval.
- Do not conflate local ADC failures with deployed-service outages.
- Do not delete or rotate secrets from an agent session.

## Start Reads

- `docs/CODEX_SESSION_BRIEF.md`
- `docs/GCP_OPERATIONS.md`
- `docs/OPERATIONAL_SPINE.md`
- `.firebaserc`
- `scripts/auth-doctor.ts`
- `scripts/audit-gcp.mjs`

## Validation

```powershell
gcloud config configurations list
gcloud config list --format="text"
gcloud auth list --format="table(account,status)"
gcloud auth application-default print-access-token
firebase login:list
firebase use --json
npm run auth:doctor
npm run audit:gcp
```

If ADC is stale, use browser auth:

```powershell
gcloud auth login --update-adc
gcloud auth application-default login --project=praxisbytacitus
gcloud auth application-default set-quota-project praxisbytacitus
npm run auth:doctor -- --fix
```

## Done Evidence

- Active gcloud account/project.
- ADC status.
- Firebase login/project.
- Cloud Run service status.
- Cloud Build status when relevant.
- Repo-local audit output.

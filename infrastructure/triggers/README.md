# Cloud Build triggers — opt-in auto-deploy

This directory holds GCP Cloud Build trigger definitions. Triggers are one-time
imports; the YAML lives in the repo so the import is repeatable and audited.

## frontend-main.yaml — push-to-main, opt-in via commit token

**Behavior:** every push to `main` that has the literal token `[deploy]` in the
commit message (or in any commit in the push) runs `cloudbuild.frontend.yaml`
and promotes the resulting revision to `praxis-frontend` Cloud Run service.

The token gate keeps the trigger noise-free — docs, audits, and graphify
refreshes do not redeploy. Add `[deploy]` to a commit message when the change
should ship.

### One-time install

```pwsh
gcloud builds triggers import `
  --source=infrastructure/triggers/frontend-main.yaml `
  --project=praxisbytacitus
```

### Verify

```pwsh
gcloud builds triggers list --project=praxisbytacitus --filter="name:frontend-main"
```

### Manual deploy (still works)

```pwsh
gcloud builds submit `
  --config=cloudbuild.frontend.yaml `
  --project=praxisbytacitus
```

## Coordinating with Codex + Claude

Both agents commit to `main` directly. Without the gate, every routine commit
would queue a Cloud Build run, racing each other and confusing rollout state.
The `[deploy]` token gives the human (or the agent on the human's instruction)
explicit control over when production updates.

Recommended pattern:

```text
feat(landing): wire capsule strip into cockpit header [deploy]
```

Routine work (docs, graphify, audits, work-in-progress visuals) omits the
token and stays staged on `main` until a `[deploy]` commit comes along.

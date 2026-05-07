# Scheduler Job Failure

## Signals
- Drift verifier, corpus refresh, reconciler, VIEWS, UCDP, or AA playbook jobs miss their expected window.
- Cloud Scheduler reports retry exhaustion.

## Triage
1. List scheduler jobs in `us-central1`.
2. Inspect the failed job target and recent logs.
3. Confirm required secrets and service account permissions.

## Mitigation
- Manually trigger the job only after confirming idempotence.
- Disable repeated failing jobs if they are creating duplicate writes.

## Escalation
Changes to job cadence, targets, or IAM are owner-gated until Terraform owns the scheduler path.

# 0036 - GCP Production Verification Discipline

## Status

Accepted

## Context

Pack 22 asks PRAXIS to verify the production GCP and Gemini Enterprise posture
across AI routing, Agent Engine, Cloud SQL, Firestore, Storage, observability,
Cloud Run, Scheduler, Identity, secrets, IAM, Terraform, and edge protection.
Several requested checks are safe and read-only. Others are cost-impacting or
availability-impacting and require owner approval.

The architecture bible already forbids hand-clicked infrastructure changes and
requires Terraform, canary discipline, and production evidence before readiness
claims.

## Decision

Pack 22 is implemented as a two-layer verification discipline:

- Local/read-only audits may run in the normal PRAXIS gate.
- Infrastructure-mutating or cost-impacting checks remain owner-gated and must
  run through Terraform, signed canary steps, or explicit operational runbooks.

The repo now carries a Pack 22 prompt copy, runbook bundle audit, model-matrix
coverage audit, Pack 22 evidence audit, and read-only GCP production posture
audit.

## Consequences

- Engineers can continuously verify production posture without silently
  changing cloud resources.
- PRAXIS can report honest Pack 22 progress without claiming that owner-gated
  infrastructure work is complete.
- Future closure of HA, CMEK, Cloud Armor, Agent Engine freshness, Terraform
  drift, and load-test items must update evidence docs and, where necessary,
  add narrower audits.

## Alternatives considered

- Execute every Pack 22 infrastructure request immediately. Rejected because
  it would violate owner approval, cost, Terraform, and canary constraints.
- Keep Pack 22 only as a document. Rejected because the request requires
  executable verification and durable evidence.


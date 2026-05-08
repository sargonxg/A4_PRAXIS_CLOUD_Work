# PRAXIS Phase 1 Self-Audit: Platform and Deploy

Date: 2026-05-06
Topic: G - platform and deploy
Worktree: `C:\Users\giuli\praxis-audit-platform-and-deploy`
HEAD: `ac2a7bbac66388af8a0f06f0c53324c08af0791e`

## Executive Status

Overall status: **DEGRADED**.

The core GCP inventory audit is green and production health is OK, but the
platform does not yet prove the stricter architecture-bible posture for canary
deployment, Cloud SQL HA/PITR, scheduler operations, storage policy visibility,
and structured log coverage.

## Evidence

| Check | Result | Evidence |
|---|---|---|
| `npm run audit:gcp` | PASS | 0 hard failures, 0 soft warnings |
| Production health | PASS | `https://praxis.tacitus.me/api/health` returned `status: ok`; Firestore, AI provider, cookie secret, Vertex ADK OK; Polar unconfigured |
| Cloud Run frontend | DEGRADED | Ready revision `praxis-frontend-00244-m2t`; traffic 100 percent latest revision |
| Cloud Run backend | DEGRADED | Ready revision `praxis-backend-00103-zmq`; traffic 100 percent latest revision |
| Cloud SQL | DEGRADED | `POSTGRES_16`, RUNNABLE, `availabilityType=ZONAL`, transaction log retention 7 days |
| Scheduler | DEGRADED | `praxis-check-alerts`, `praxis-generate-briefing`, and `gdelt-poller` are PAUSED |
| Cloud Storage | BLOCKED | `storage.buckets.get` denied for `gs://praxis-uploads` |
| Logging sample | PARTIAL | Latest frontend log sample had trace ids; structured `userId/caseId/requestId` proof not established |

## Findings

| ID | Severity | Title | Evidence | Remediation sketch |
|---|---|---|---|---|
| G-01 | S1 | No evidenced 5/25/100 canary phase | Cloud Run traffic is 100 percent latest revision for frontend/backend | Add canary traffic split automation or deploy log artifact before claiming canary compliance |
| G-02 | S1 | Cloud SQL below HA/PITR target | Instance is ZONAL with 7-day transaction log retention | Decide launch requirement and change through approved Terraform/cloud path |
| G-03 | S1 | Scheduler jobs paused | Three operational jobs are PAUSED | Confirm intentional pause or enable before readiness claims |
| G-04 | S2 | Storage posture blocked by permissions | `gcloud storage buckets describe` denied | Grant metadata read or document bucket posture through Terraform |
| G-05 | S2 | Structured log coverage not proven | Sample showed traces but not user/case/request fields | Add Cloud Logging sampling audit for critical route logs |

## Non-Actions

- No resources were changed.
- No deploy was performed.
- No fixes were made.

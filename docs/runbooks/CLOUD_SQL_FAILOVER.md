# Cloud SQL Failover

## Signals
- `/api/health` database checks degrade.
- Connection errors increase in Cloud Run logs.
- Cloud SQL CPU, storage, or connection utilization crosses alert thresholds.

## Triage
1. Run `npm run audit:gcp` and `npm run audit:gcp-production-posture`.
2. Inspect Cloud SQL instance health and backup configuration.
3. Check recent deploys for connection-pool changes.

## Mitigation
- Scale Cloud Run concurrency down if connection pressure is the trigger.
- Restore the previous revision if a deploy introduced connection churn.
- Use point-in-time recovery only after confirming data corruption.

## Escalation
HA, PITR retention, CMEK, or failover configuration changes are Terraform/owner-gated.

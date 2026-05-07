# Dashboards

## Signals
- On-call cannot determine service health from one place.
- Trace, logging, cost, or uptime evidence is missing from an audit.

## Triage
1. Open Cloud Run service metrics for frontend and backend.
2. Open Cloud Logging filtered by latest deploy revision.
3. Check Sentry release health if configured.

## Mitigation
- Use `npm run audit:observability-coverage` to confirm local instrumentation.
- Add missing dashboard URLs to this runbook after owner-approved dashboard creation.

## Escalation
Dashboard creation and alert routing changes are infra changes and should be tracked in Terraform or an owner-approved operations PR.

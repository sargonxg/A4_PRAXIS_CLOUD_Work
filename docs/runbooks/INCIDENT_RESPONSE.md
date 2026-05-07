# Incident Response

## Signals
- Production `/api/health` fails.
- User-visible route smoke fails.
- Error budget or cost budget alerts fire.

## Triage
1. Identify latest deploy SHA and Cloud Run revision.
2. Check `/api/health`, Cloud Run logs, and browser console smoke.
3. Classify impact: public site, authenticated app, AI provider, storage, or data integrity.

## Mitigation
- Roll back the latest Cloud Run revision if the regression is deploy-linked.
- Disable only the failing high-cost or high-risk route if the rest of the app is healthy.

## Escalation
Escalate immediately for data isolation, data loss, security, billing runaway, or model-provider outage.

# Canary Rollback

## Signals
- Canary phase error rate exceeds threshold.
- Browser smoke fails on the canary revision.
- `/api/health` degrades after traffic shift.

## Triage
1. Identify current Cloud Run traffic split.
2. Compare canary and previous revision logs.
3. Run browser smoke against production routes.

## Mitigation
- Shift 100% traffic back to the previous known-good revision.
- Record the rollback in `docs/launch/CANARY_LOG.md`.

## Escalation
Do not advance 5 -> 25 -> 100 without staging-green evidence and owner sign-off for production canary.

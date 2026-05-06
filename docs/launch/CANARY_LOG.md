# PRAXIS Canary Log

Production target: `https://praxis.tacitus.me`
Required phases: 5% -> 25% -> 100%

No Pack 14 canary phase has been started from this session. Owner approval is required before traffic shifting.

## Phase Template

| Phase | Revision | Start | End | Error rate | P95 latency | Cost/request | Synthetic checks | Sign-off |
|---|---|---|---|---:|---:|---:|---|---|
| 5% | TBD | TBD | TBD | TBD | TBD | TBD | `tsx scripts/canary-monitor.ts --phase=5` | Giulio required |
| 25% | TBD | TBD | TBD | TBD | TBD | TBD | `tsx scripts/canary-monitor.ts --phase=25` | Giulio required |
| 100% | TBD | TBD | TBD | TBD | TBD | TBD | `tsx scripts/canary-monitor.ts --phase=100` | Giulio required |

## Rollback Rule

Rollback if error rate exceeds 0.5% over 10 minutes, P95 latency exceeds 2x baseline, health checks fail, or provider cost exceeds the approved budget window.

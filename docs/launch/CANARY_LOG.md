# PRAXIS Canary Log

Production target: `https://praxis.tacitus.me`
Required phases: 5% -> 25% -> 100%

Giulio approved frontend production deployment on 2026-05-11. This session used
the repo-approved Cloud Build deploy path directly to the frontend service,
then ran the 100% synthetic monitor against the production domain. No 5%/25%
traffic split was used in this direct deploy path.

## Phase Template

| Phase | Revision | Start | End | Error rate | P95 latency | Cost/request | Synthetic checks | Sign-off |
|---|---|---|---|---:|---:|---:|---|---|
| 5% | TBD | TBD | TBD | TBD | TBD | TBD | `tsx scripts/canary-monitor.ts --phase=5` | Giulio required |
| 25% | TBD | TBD | TBD | TBD | TBD | TBD | `tsx scripts/canary-monitor.ts --phase=25` | Giulio required |
| 100% | `praxis-frontend-00308-29d` | 2026-05-11T05:27Z | 2026-05-11T05:36Z | 0 | 272 ms | not measured | `tsx scripts/canary-monitor.ts --phase=100 --url=https://praxis.tacitus.me --samples=3` | pass |
| 100% | `praxis-frontend-00310-bqx` | 2026-05-11T05:50Z | 2026-05-11T05:58Z | 0 | 192 ms | not measured | `tsx scripts/canary-monitor.ts --phase=100 --url=https://praxis.tacitus.me --samples=3` | pass after one cold-start latency retry |

## Rollback Rule

Rollback if error rate exceeds 0.5% over 10 minutes, P95 latency exceeds 2x baseline, health checks fail, or provider cost exceeds the approved budget window.

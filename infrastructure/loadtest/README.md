# PRAXIS Load Test Scaffold

Pack 14 requires a staged load test before launch. This scaffold is intentionally conservative: it can run locally or against staging, but it does not fire 10,000 production tool runs by default.

## Commands

```bash
node infrastructure/loadtest/loadtest.mjs --target=http://localhost:3000 --mode=smoke --requests=24 --concurrency=4
node infrastructure/loadtest/loadtest.mjs --target=https://staging.praxis.tacitus.me --mode=stress --path=/api/health --requests=250 --concurrency=25
```

Production-scale runs remain owner-gated. Before running against `praxis.tacitus.me`, record the approved window, budget ceiling, rollback owner, and expected quota impact in `docs/launch/CANARY_LOG.md`.

## Required v1.0 Reports

- 100 concurrent users.
- 1,000 case ingestions.
- 10,000 tool runs over one hour.
- Capacity plan for 10 / 100 / 1k / 10k daily active user tiers.
- Cost report covering Cloud Run, Cloud SQL, Firestore, Cloud Storage, Vertex AI, Cloud Tasks, Scheduler, Logging, Monitoring, and Sentry.

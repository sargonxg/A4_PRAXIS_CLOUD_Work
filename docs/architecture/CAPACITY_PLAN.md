# PRAXIS Capacity Plan

Date: 2026-05-06
Pack: 14 Production Excellence

This is the planning baseline for the staged load-test gate. It is not an owner-approved cost projection.

| DAU tier | Cloud Run frontend | Backend/API | Cloud SQL / Postgres | Vertex AI posture | Notes |
|---|---|---|---|---|---|
| 10 | min instances 0, burst 1-3 | shared frontend API routes | smallest HA-disabled dev tier or local proxy | standard quotas | Demo/private beta. |
| 100 | min 0-1, autoscale 5 | backend service min 0-1 | small production Cloud SQL with pgvector indexes | request quota review | Add alerting and daily spend watch. |
| 1,000 | min 1-2, autoscale 20 | split worker queues for ingestion/tools | HA Cloud SQL, PgBouncer, index health checks | quota reservations for Pro/embedding calls | Run hourly synthetic checks and provider cost telemetry. |
| 10,000 | regional active/active plan | dedicated workers for ingestion, tools, memos | HA plus read replicas and backup drills | committed quota/cost approval | Add Vertex AI Vector Search 2 as secondary index if vector volume or QPS crosses threshold. |

## Launch Gate

Before v1.0, run:

- `node infrastructure/loadtest/loadtest.mjs --target=https://staging.praxis.tacitus.me --mode=stress --requests=250 --concurrency=25`
- A controlled ingestion run with 1,000 documents.
- A controlled tool run batch with 10,000 executions.
- `tsx scripts/canary-monitor.ts --phase=5 --url=https://praxis.tacitus.me`

Owner approval is required before production-scale load tests.

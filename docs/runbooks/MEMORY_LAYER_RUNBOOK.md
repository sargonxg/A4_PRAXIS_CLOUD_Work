# Memory Layer Runbook

Date: 2026-05-07
Status: Disabled-first Cognee operations spine

This runbook is the repo-local operating contract for the PRAXIS Cognee memory
layer. It implements the source prompt
`C:\Users\giuli\Downloads\COGNEE_OPERATIONS.md` while preserving the current
production safety posture: Cognee is installed and auditable, but remains
disabled until owner-controlled Cloud SQL, IAM, Cloud Run, RLS, and canary gates
are complete.

## Signals

- `/api/memory/recall` returns empty hits because `COGNEE_MODE=disabled`.
- `praxis-cognee` reports 5xx errors or `/v1/health` returns 503.
- Candidate queue grows unexpectedly in `aco_cognee_link`.
- A firewall trigger blocks Cognee-derived canonical writes.
- Recall p95 exceeds 1 second for 10 minutes.
- Cross-tenant isolation tests fail.

## Environment Matrix

| Variable | Dev default | Staging/production target | Notes |
|---|---|---|---|
| `COGNEE_ENABLED` | `false` | `true` after canary | Global kill switch. |
| `COGNEE_MODE` | `disabled` | `postgres-kuzu` | Use `disabled` for rollback. |
| `COGNEE_DB_HOST` | `pgbouncer` | PgBouncer service | Same Cloud SQL instance, separate DB. |
| `COGNEE_DB_NAME` | `praxis_cognee` | `praxis_cognee` | Isolated from canonical `praxis`. |
| `COGNEE_DB_USER` | `praxis_cognee_app` | `praxis_cognee_app` | Must have zero privileges on `praxis`. |
| `COGNEE_DB_PASSWORD` | local secret | Secret Manager `praxis-cognee-db-password` | Rotate quarterly. |
| `COGNEE_KUZU_PATH` | `/var/lib/cognee/kuzu` | `/var/lib/cognee/kuzu` | GCS FUSE-backed in Cloud Run. |
| `COGNEE_KUZU_GCS_BUCKET` | empty | `gs://praxis-cognee-graph` | Snapshot source bucket. |
| `COGNEE_LLM_PROVIDER` | `vertex_ai` | `vertex_ai` | Hard runtime requirement. |
| `COGNEE_LLM_API_KEY` | `vertex-adc` | `vertex-adc` | Sentinel only, never a raw provider key. |
| `LLM_API_KEY` | `vertex-adc` | `vertex-adc` | LiteLLM compatibility sentinel. |
| `COGNEE_EMBEDDING_MODEL` | `vertex_ai/text-embedding-005` | same | Must remain Vertex. |
| `COGNEE_EMBEDDING_DIMENSIONS` | `768` | `768` | Must match PRAXIS vector tables. |
| `COGNEE_CANDIDATE_FLOOR` | `0.40` | `0.40` | Drop low-score candidates. |
| `COGNEE_PROMOTION_CEILING` | `0.60` | `0.60` | Enforced in app and DB. |
| `COGNEE_MAX_CANDIDATES_PER_DOC` | `50` | `50` | Review queue flood control. |
| `COGNEE_BACKEND_URL` | empty | private `praxis-cognee` URL | Frontend proxy target. |
| `KG_BACKEND` | `postgres` | `postgres` | Cognee is not the canonical KG backend. |

## Setup Steps

1. Run canonical Alembic migrations through
   `0014_cognee_provenance_firewall.py`.
2. Create `praxis_cognee`, `praxis_cognee_app`, extensions, and tenant helper
   with `backend/migrations/sql/cognee_database_setup.sql`.
3. Deploy `praxis-cognee` with `infrastructure/deploy-cognee.sh`.
4. After Cognee creates managed tables, run
   `backend/migrations/sql/cognee_rls_apply.sql`.
5. Grant only `praxis-frontend-sa` `roles/run.invoker` on `praxis-cognee`.
6. Set `COGNEE_BACKEND_URL` on `praxis-frontend`.
7. Apply alert policies with `infrastructure/monitoring-alerts.sh --apply`.
8. Publish dashboard `monitoring/dashboards/cognee.json`.
9. Register daily snapshot job from
   `infrastructure/scheduler/cognee-kuzu-snapshot.yaml`.

## Verification

Run local gates before any deploy:

```bash
npm run audit:cognee
npm run audit:embedding-dim
npm run audit:cognee-operations
npm run audit:firewall-coverage
```

Run focused backend tests:

```bash
pytest backend/tests/test_cognee_memory.py backend/tests/test_cognee_bridge.py backend/tests/test_cognee_firewall.py backend/tests/test_cognee_no_openai_egress.py backend/tests/test_cognee_tenant_isolation.py -q
```

After deploy, verify:

```bash
SERVICE_URL=$(gcloud run services describe praxis-cognee --region=us-central1 --format='value(status.url)')
TOKEN=$(gcloud auth print-identity-token --audiences="$SERVICE_URL")
curl -fsSL "$SERVICE_URL/healthz"
curl -fsSL "$SERVICE_URL/v1/health" -H "Authorization: Bearer $TOKEN"
```

## Daily Ops

- Check `/v1/health` for Cognee readiness and provider posture.
- Check Cloud Run request count, 5xx rate, and p95 latency for `praxis-cognee`.
- Check candidate queue:

```sql
SELECT case_id, count(*) AS n
FROM aco_cognee_link
WHERE link_kind = 'candidate'
GROUP BY case_id
ORDER BY n DESC
LIMIT 20;
```

- Check that Cognee never lands in Verdict-layer canonical graph nodes:

```sql
SELECT count(*)
FROM graph_nodes
WHERE layer = 'Verdict'
  AND provenance @> '[{"kind":"cognee"}]'::jsonb;
```

Expected result is always zero.

## Backups

- Canonical `praxis` database: covered by existing Cloud SQL backups.
- `praxis_cognee` database: covered by the same instance backups.
- Kuzu graph volume: daily snapshot through
  `infrastructure/cognee-kuzu-snapshot.sh`.

Manual Kuzu snapshot:

```bash
bash infrastructure/cognee-kuzu-snapshot.sh manual-$(date +%s)
```

The script calls `/admin/quiesce`, copies the GCS-backed Kuzu volume with
`gsutil -m rsync`, and then calls `/admin/resume`.

## Observability

- Dashboard definition: `monitoring/dashboards/cognee.json`.
- Alert extensions: `infrastructure/monitoring-alerts.sh`.
- Logs use `praxis.cognee` and must not include raw document content.
- Important log markers:
  - `cognee.recall`
  - `cognee.candidates.written`
  - `memory_layer_disabled`
  - `memory_layer_quiesced`

## Cost And Quota

- Biggest cost driver is Vertex Pro during durable `remember` and `cognify`.
- Recall should be cheap and latency-bound, not token-bound.
- Default per-tenant budget remains disabled until live cost accounting is
  connected to the existing PRAXIS budget tables.
- If Cognee consumes more than half of Vertex quota for a week, either request
  quota or split the service into a dedicated billing project.

## Rollback Procedures

Level 1 kill switch:

```bash
gcloud run services update praxis-cognee --update-env-vars="COGNEE_ENABLED=false,COGNEE_MODE=disabled" --region=us-central1
gcloud run services update praxis-frontend --update-env-vars="COGNEE_ENABLED=false,COGNEE_MODE=disabled" --region=us-central1
```

Level 2 mode flip:

```bash
gcloud run services update praxis-cognee --update-env-vars="COGNEE_MODE=neo4j" --region=us-central1
```

Level 3 removal is destructive to memory-layer data and requires owner signoff.
Do not drop `aco_cognee_link`, `praxis_cognee`, or any storage bucket during an
incident unless Giulio explicitly approves it in the PR/incident thread.

## Security Checklist

- `praxis_app` has zero privileges on `praxis_cognee`.
- `praxis_cognee_app` has zero privileges on `praxis`.
- All Cognee-managed tables have RLS enabled after `cognee_rls_apply.sql`.
- `aco_cognee_link` has RLS and `current_tenant()` policy.
- `enforce_cognee_firewall()` exists on `graph_nodes`.
- `LLM_API_KEY` is exactly `vertex-adc`; no `sk-` values in service env.
- `praxis-cognee` is `--no-allow-unauthenticated`.
- Only `praxis-frontend-sa` has invoke permission.
- `audit:cognee`, `audit:embedding-dim`, and `audit:cognee-operations` pass.
- Cross-tenant tests pass in CI.

## Failure Modes

Tenant leak:
Stop `praxis-cognee` immediately, preserve logs, identify affected tenants, and
add a regression test before redeploy.

Cognee cognify hangs:
Check Vertex 429s, lower concurrency, or temporarily use Flash only.

Kuzu corruption:
Set min/max instances to zero, restore the latest GCS snapshot, then restart.

Firewall trigger fired:
Treat as P1. The trigger blocked a bypass attempt. Fix the bypass, not the
trigger.

Empty review queue after large ingest:
Check `COGNEE_CANDIDATE_FLOOR`, Cognee data-point scores, and Vertex auth.

## Triage

1. Confirm `COGNEE_ENABLED`, `COGNEE_MODE`, and `COGNEE_BACKEND_URL`.
2. Hit `/healthz` and `/v1/health`.
3. Read Cloud Run errors for `praxis-cognee`.
4. Check `aco_cognee_link` candidate and promoted counts.
5. Run `npm run audit:cognee-operations`.

## Mitigation

- Use the Level 1 kill switch first.
- Keep canonical graph writes on Postgres through existing repositories.
- Preserve `praxis_cognee` and Kuzu buckets for later incident analysis.
- Prefer disabled fallback over partial live memory if tenant isolation is in
  doubt.

## Escalation

Page on:

- Tenant leak.
- Firewall trigger fired in production.
- Kuzu write error.
- Cross-tenant test failed.
- Cognee 5xx rate above alert threshold.

Do not page on a brief recall p95 spike unless it persists beyond the alert
window or blocks user-facing flows.

## On-Call Quick Reference

```text
Service:           praxis-cognee
Region:            us-central1
Project:           praxisbytacitus
Service account:   praxis-cognee-sa@praxisbytacitus.iam.gserviceaccount.com
Frontend proxy:    /api/memory/*
Cognee service:    /v1/memory/*
Health:            /healthz and /v1/health
Kill switch:       COGNEE_ENABLED=false, COGNEE_MODE=disabled
Postgres DB:       praxis_cognee
Bridge table:      aco_cognee_link
Snapshot script:   infrastructure/cognee-kuzu-snapshot.sh
Dashboard:         monitoring/dashboards/cognee.json
Alert script:      infrastructure/monitoring-alerts.sh
```

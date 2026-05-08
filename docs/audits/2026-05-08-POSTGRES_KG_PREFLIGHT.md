# Postgres KG Cutover Pre-Flight - 2026-05-08

## Connection Method

Blocked locally.

Local evidence:

```text
gcloud config get-value project
praxisbytacitus

gcloud auth list --filter=status:ACTIVE --format="value(account)"
giulio@tacitus.me

gcloud sql instances list --project praxisbytacitus
NAME                      CONNECTION_NAME                                    IP_ADDRESS      DATABASE_VERSION  TIER
praxisbytacitus-instance  praxisbytacitus:us-east4:praxisbytacitus-instance  ['10.101.0.3']  POSTGRES_16       db-f1-micro
```

The instance is private-IP only at `10.101.0.3`.

```text
Get-Command psql
<no local psql>

Get-Command cloud-sql-proxy
<no local Cloud SQL Auth Proxy>

gcloud sql connect praxisbytacitus-instance --user=praxis_app --database=praxis --project=praxisbytacitus --quiet
ERROR: (gcloud.sql.connect) Cloud SQL Proxy (v2) couldn't be found in PATH.
Either install the component with `gcloud components install cloud-sql-proxy`
or see https://github.com/GoogleCloudPlatform/cloud-sql-proxy/
```

Option A from B0, Cloud Shell, was not available from this local Codex shell.
Option B, local Cloud SQL Auth Proxy, is blocked because the proxy and `psql`
are not installed locally and the instance requires private network access.
Option C is the recommended unblock path: run the diagnostics from a
VPC-connected Cloud Shell, bastion, or temporary worker in the existing VPC.

## Counts

Not measured from this local shell.

| table | total | real_user_rows |
|---|---:|---:|
| graph_nodes | blocked | blocked |
| graph_edges | blocked | blocked |
| graph_embeddings | blocked | blocked |
| graph_audit | blocked | blocked |

Required SQL:

```sql
SELECT 'graph_nodes' AS table, count(*) FROM graph_nodes
UNION ALL SELECT 'graph_edges', count(*) FROM graph_edges
UNION ALL SELECT 'graph_embeddings', count(*) FROM graph_embeddings
UNION ALL SELECT 'graph_audit', count(*) FROM graph_audit;

SELECT
  count(DISTINCT owner_uid) FILTER (
    WHERE owner_uid NOT IN ('demo-uid', 'syria-2026', 'nordalia-2026')
  ) AS real_owners,
  count(DISTINCT case_id) FILTER (
    WHERE case_id NOT IN ('syria-2026', 'nordalia-2026')
  ) AS real_cases,
  count(*) FILTER (
    WHERE owner_uid NOT IN ('demo-uid', 'syria-2026', 'nordalia-2026')
      AND case_id NOT IN ('syria-2026', 'nordalia-2026')
  ) AS real_user_rows
FROM graph_nodes
WHERE status = 'committed';
```

## Latency

Not measured. The required pgvector latency query must run after connection:

```sql
EXPLAIN ANALYZE
SELECT id, embedding <=> '<sample_768_vector>'::vector AS distance
FROM graph_embeddings
ORDER BY distance ASC LIMIT 10;
```

If this query is slower than 500ms at current row count, tune the IVFFlat index
before any B1 dual-write implementation.

## Schema Sanity

Static migration read only:

- `backend/migrations/versions/0011_postgres_kg_contract.py` creates
  `graph_nodes`, `graph_edges`, `graph_embeddings`, and `graph_audit`.
- `0011` initially creates `graph_embeddings.embedding vector(1536)`.
- `backend/migrations/versions/0012_embedding_dim_alignment.py` changes
  `graph_embeddings.embedding` to `vector(768)` and adds
  `graph_embeddings_embedding_ivfflat_idx`.
- `backend/services/kg_repositories.py` validates embedding search vectors
  against `COGNEE_EMBED_DIMENSIONS`, currently expected to be the canonical
  768d path guarded by `audit:embedding-dim`.

Live schema and index health remain unmeasured until a SQL connection is
available.

## Cost Estimate (dual-write 7 days)

Decision-grade cost requires live row counts and recent mutation volume, both
currently unavailable from this local shell.

Working assumption for the eventual Case 1 plan:

- Firestore remains primary; Postgres receives secondary writes only when
  `KG_DUAL_WRITE=true`.
- Dual-write period: 7 days.
- Expected incremental cost should be low at pilot volume because the Cloud SQL
  instance already exists and additional writes are small relative to fixed
  instance cost.
- If measured mutation volume implies more than `$200` incremental cost for
  7 days, stop and get GC approval before B1.

## Decision

DECISION: BLOCKED.

CASE: not selected. `real_user_rows` is unknown.

PLAN: Do not begin B1. Run B0 from a VPC-connected environment and fill in
counts, latency, schema/index health, and the selected Case 1/2/3 plan.

Approved by: pending GC
Approval timestamp: pending

## B1 Gate

B1 dual-write graph mutations are blocked until:

1. This pre-flight is rerun with live SQL counts.
2. The selected Case is recorded.
3. `STATUS.md` marks `B0 KG preflight` approved.
4. `0012_embedding_dim_alignment.py` has been confirmed applied in the target
   database or the graph embeddings table is empty and explicitly approved for
   migration.

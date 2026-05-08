# B0 — Postgres KG cutover: pre-flight (mandatory)

## Goal

Decide the cutover strategy based on what's actually in Cloud SQL
today. **No code changes happen in B1-B3 until this file produces a
decision.**

The unknowns Codex must answer:

1. How many rows are in `graph_nodes`, `graph_edges`,
   `graph_embeddings`, `graph_audit` today?
2. Are any of those rows tied to non-demo, non-test cases?
3. What is the latency profile of pgvector cosine search at the actual
   row count?
4. What is the cost of running both Firestore + Postgres in dual-write
   mode for 30 days?

## Pre-conditions

The night-pack `01_DIAGNOSTICS.md` may have already attempted task 2
(graph_nodes count). Read `STATUS.md`. If it's recorded as `blocked`,
this file is the place to unblock it.

## Files Codex must read first

- `STATUS.md` — for the night-pack diagnostic attempt
- `backend/migrations/versions/0011_postgres_kg_contract.py`
- `backend/services/postgres.py`
- `backend/services/kg_repositories.py`
- `src/lib/knowledge/graph-layer.ts` and `vector-layer.ts`
- `BLOCKERS.md` — for the documented Cloud SQL access pattern

## Tasks

### 1. Establish a connection

The Cloud SQL instance is private-IP. Three options for a connection:

**Option A: Cloud Shell (preferred for one-off diagnostics)**

```bash
# From a Cloud Shell session in the praxisbytacitus project
gcloud sql instances list
gcloud sql connect <INSTANCE_NAME> --user=praxis_app --database=praxis
```

**Option B: Cloud SQL Auth Proxy (preferred for repeated runs)**

```bash
# Install proxy if needed
gcloud auth application-default login
./cloud_sql_proxy -instances=<INSTANCE_CONNECTION_NAME>=tcp:5432 &
psql "host=127.0.0.1 port=5432 user=praxis_app dbname=praxis"
```

**Option C: A worker pod in the existing VPC**

Defer unless A/B fail. Requires a deploy step.

Document which option was used in `STATUS.md`.

### 2. Run the diagnostic queries

Once connected:

```sql
-- Total counts
SELECT 'graph_nodes' AS table, count(*) FROM graph_nodes
UNION ALL SELECT 'graph_edges', count(*) FROM graph_edges
UNION ALL SELECT 'graph_embeddings', count(*) FROM graph_embeddings
UNION ALL SELECT 'graph_audit', count(*) FROM graph_audit;

-- Distinct owners (excluding seed/demo)
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

-- Latency profile (run after the count is known)
EXPLAIN ANALYZE
SELECT id, embedding <=> '<sample_768_vector>'::vector AS distance
FROM graph_embeddings
ORDER BY distance ASC LIMIT 10;

-- Schema sanity
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'graph_nodes' OR table_name = 'graph_embeddings'
ORDER BY table_name, ordinal_position;

-- Index health
SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN
  ('graph_nodes', 'graph_edges', 'graph_embeddings', 'graph_audit');
```

Record all outputs in `docs/audits/2026-MM-DD-POSTGRES_KG_PREFLIGHT.md`.

### 3. Decision tree

Based on the row counts, pick the cutover plan:

**Case 1: `real_user_rows == 0` (most likely)**

The Postgres KG is empty production code. The cutover plan is:

- B1: dual-write all new graph mutations to BOTH Firestore + Postgres
- Run dual-write for **7 days** to accumulate data and verify parity
- B2: switch reads to Postgres; Firestore becomes shadow
- Run shadow for **7 days** to verify no read regressions
- B3: stop writing to Firestore; mark the path deprecated

Total: ~3 weeks calendar, but only ~3 evenings of code work.

**Case 2: `real_user_rows > 0` but `< 10,000`**

Rare (because frontend doesn't write to Postgres today). If true:

- Snapshot Postgres data: `pg_dump` to a backup bucket.
- Code-review the rows: are they migrated copies, or genuinely
  Postgres-original? Likely migrated.
- Truncate Postgres tables (after backup).
- Proceed as Case 1.

**Case 3: `real_user_rows >= 10,000`**

Stop. Don't proceed without GC's explicit decision. Either:
- The data is critical → reverse the cutover plan (Postgres → Firestore
  is wrong direction).
- The data is junk → confirm with GC, truncate, continue.
- Mixed → investigate before proceeding.

### 4. Decision document

Create `docs/audits/2026-MM-DD-POSTGRES_KG_PREFLIGHT.md`:

```markdown
# Postgres KG Cutover Pre-Flight — <date>

## Connection method

<A/B/C>: <details>

## Counts

| table | total | real_user_rows |
|---|---|---|
| graph_nodes | <n> | <n> |
| graph_edges | <n> | <n> |
| graph_embeddings | <n> | <n> |
| graph_audit | <n> | <n> |

## Latency

`SELECT ... ORDER BY embedding <=> $1 LIMIT 10`:
- Plan: <paste EXPLAIN output>
- Time: <ms>

## Schema sanity

graph_nodes columns: <list>
graph_embeddings.embedding: <vector(768) or vector(1536)>

(If 1536, A0 from night pack 09_EMBEDDING_DIMENSION must have run.
Confirm and record.)

## Decision

CASE: <1, 2, or 3>

PLAN: <paste relevant case from the decision tree>

Approved by: <pending GC>
Approval timestamp: <pending>
```

### 5. Cost estimate for dual-write period

Add to the decision doc:

```markdown
## Cost estimate (dual-write 7 days)

Assumptions:
- N existing cases × M new mutations/day = X writes/day
- Firestore writes: $X.XX/M ⇒ <amount>
- Cloud SQL CPU/storage: <amount>
- Total dual-write delta: <amount>
```

If the cost is more than $200 for 7 days, flag in `STATUS.md` for GC.

### 6. Hard stop

Codex does NOT begin B1 until:

1. The decision doc is filled in.
2. `STATUS.md` shows the decision approved.
3. The case (1, 2, or 3) is named.

## Acceptance criteria

1. Connection established or `blocked: <reason>` recorded.
2. All 4 row counts measured.
3. Latency profile recorded.
4. Schema and index health captured.
5. Decision doc exists and lists the case + plan.
6. `STATUS.md` shows the approval row.
7. Cost estimate present.

## Diagnostics

```bash
test -f docs/audits/*-POSTGRES_KG_PREFLIGHT.md && echo OK
grep -q "real_user_rows" docs/audits/*-POSTGRES_KG_PREFLIGHT.md && echo OK
grep -q "DECISION\|Decision" docs/audits/*-POSTGRES_KG_PREFLIGHT.md && echo OK
grep -q "B0 KG preflight" STATUS.md && echo OK
```

## If Codex stops short

**Failure mode A**: Codex declares `blocked` without trying option C.
Re-prompt:

> "If Cloud Shell and Cloud SQL Auth Proxy both failed, document the
> exact error from each. Then propose the worker-pod approach in
> the decision doc with the deploy spec. Do not proceed to B1
> without a measurement."

**Failure mode B**: Counts come back but Codex skips latency. Re-prompt:

> "Run the EXPLAIN ANALYZE on the embedding distance query. Use a
> realistic 768-dim vector (e.g., generated from text-embedding-005
> on a sample sentence). The latency number is the input to whether
> the cutover is even viable. If the query takes >500ms at the
> current row count, the IVFFlat index needs tuning before B1."

**Failure mode C**: Codex starts B1 before approval. **Stop.**
Re-prompt:

> "Revert any B1 changes. The pre-flight doc must show approval
> before B1 starts. Show me the STATUS.md row that says approved.
> If it's missing, wait for GC."

## Commit

```
docs(B0): postgres kg cutover pre-flight

Pre-flight measurements + decision doc for the Postgres KG
cutover. Counts, latency, schema sanity, cost estimate, and
selected case (1, 2, or 3) with corresponding plan.

This file produces zero code changes. Hard-gates B1-B3 until the
decision is approved.

Refs: V2_WORK_PACK/B0_KG_PREFLIGHT.md
```

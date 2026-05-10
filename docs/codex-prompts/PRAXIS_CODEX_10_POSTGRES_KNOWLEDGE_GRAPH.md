# PRAXIS — Codex Pack 10: Postgres-First Knowledge Graph & Ingestion Backend

**Branch**: `feature/postgres-knowledge-graph`
**Depends on**: Pack 09 merged.
**Owner gate**: Do not merge to `main` without Giulio's sign-off on the architectural change.
**Estimated effort**: ~7 days (~60 engineering hours).
**Voice**: Pragmatic architect. Explain the *why* of the simplification clearly and ship a clean, verifiable migration.

---

## 0. Why this pack exists

Through packs 06-08, PRAXIS was specified with a two-store architecture: **Firestore** as the user-facing source of truth (owner-scoped, real-time, hierarchical, security-rules-enforced) and **Neo4j** as the graph engine (Cypher, native traversal, native graph algorithms). The two were kept consistent by a two-phase write protocol with a drift verifier running on Cloud Scheduler.

This is a defensible architecture. It is also, today, premature optimization. Neo4j Aura adds a paid dependency, an operational surface (backup / restore / monitoring / connection pooling separate from everything else), a deployment complexity tier, and a debugging surface that no one on the team is currently on call for. The four sample cases shipped in pack 06 (Syria, Northwind, UN CTED, Nordalia disinfo) have node counts in the low hundreds. Even pack 07's stretch goal — the 10,000-node performance test — is well within what **Postgres + pgvector + recursive CTEs + a few well-placed GIN indexes** can serve at sub-100ms query latency on an `n2-standard-4` Cloud SQL instance, for an order of magnitude less operational cost and complexity.

The pragmatic call: **make Postgres the primary knowledge graph store at v1**, keep Neo4j as an optional asynchronous secondary index for v2 if and when graph-algorithmic queries (community detection, Louvain, PageRank-on-graph) become product-critical. The existing `langgraph-checkpoint-postgres` dependency in `backend/pyproject.toml` already proves Postgres is in the operational stack.

This pack:

1. Designs a Postgres schema that holds the full ontology-bound node and edge model from pack 06, plus pgvector-indexed embeddings for semantic search.
2. Builds a clean data-access layer (asyncpg + SQLAlchemy 2.0 Core + Alembic for migrations) with repository abstractions matching the pack 06 types.
3. Rewires the LangGraph ingestion pipeline (`backend/ingestion/pipeline.py`) so its `persist_atomic` node writes Firestore + Postgres atomically (via the same two-phase pattern, just with a different secondary store).
4. Migrates the existing Neo4j-resident Syria + Nordalia + Northwind + UN CTED data to Postgres in a one-way, dry-runnable, auditable migration.
5. Implements graph-traversal queries (n-hop neighborhood, shortest path, ego subgraph, time-bounded slices) as parameterized SQL using recursive CTEs.
6. Implements semantic search over node labels and provenance text via pgvector with cosine similarity and IVFFlat indexing.
7. Rewires graph edit operations (pack 07 F6) to round-trip Postgres.
8. Updates the cytoscape adapter (pack 07 F2) so the frontend reads case graphs from a single Postgres-backed API endpoint.
9. Makes Neo4j genuinely optional via a `KG_BACKEND=postgres|neo4j|both` environment flag. Default `postgres`. The drift verifier becomes Firestore↔Postgres, with an optional Postgres→Neo4j async reflector for `both` mode.

After this pack, PRAXIS runs on a single relational database for both transactional metadata (Firestore — kept for owner-scoped ACL semantics) and the knowledge graph (Postgres). The architecture is one tier simpler, one bill cheaper, and one set of operational surfaces smaller. Neo4j becomes a v2 upgrade for the case where graph algorithms outgrow what recursive CTEs can do — a problem we do not yet have.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | Postgres schema (`graph_nodes`, `graph_edges`, `graph_embeddings`, supporting tables) deployed via Alembic; idempotent up/down migrations | `alembic upgrade head && alembic downgrade base && alembic upgrade head` exits 0 on a clean DB |
| 2 | Data access layer with typed repositories: `NodeRepo`, `EdgeRepo`, `GraphTraversalRepo`, `EmbeddingRepo` | `pytest backend/tests/test_postgres_repos.py -q` green |
| 3 | LangGraph ingestion pipeline writes to Postgres atomically with Firestore via two-phase commit | `pytest backend/tests/test_ingestion_postgres_atomicity.py -q` green; crash-injection passes |
| 4 | Existing Neo4j data migrated to Postgres for all four sample cases with zero loss | Pre/post node + edge counts identical; round-trip query parity test green |
| 5 | Graph traversal API: n-hop neighborhood, shortest path, ego subgraph, time-bounded slice — all exposed via FastAPI, all <100ms P95 on the 10k-node fixture | Perf test green |
| 6 | pgvector-backed semantic search over node labels + provenance text | Search API returns ranked results; precision-at-10 ≥ 80% on a manually labeled eval set |
| 7 | Graph edit ops (merge/split/lock/dispute/contradiction) round-trip Postgres atomically | `e2e/workbench/graph-ops-roundtrip.spec.ts` still green; data layer verified by direct SQL inspection |
| 8 | Cytoscape adapter reads from a single endpoint `/v1/cases/{caseId}/graph` backed by Postgres | Frontend tests + visual snapshot green |
| 9 | `KG_BACKEND` env flag wired (`postgres` default, `neo4j` legacy, `both` reflective). Drift verifier updated. | Smoke runs in all three modes; documented in runbook |
| 10 | New audits: `audit:postgres-schema-current`, `audit:kg-drift`, `audit:graph-query-perf` wired into `audit:gate` | Single `npm run audit:gate` exits 0 |
| 11 | Cost reduction: estimated monthly savings vs Neo4j Aura documented in `docs/architecture/COST_NOTES.md` | Owner-reviewed |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 10. I understand:
> 1. The architectural change: Postgres + pgvector becomes the primary knowledge graph store at v1; Neo4j becomes optional behind `KG_BACKEND=neo4j|both`. The default is `postgres`. I will *not* delete Neo4j code paths; I will gate them behind the env flag so the migration is reversible and the v2 upgrade path stays open.
> 2. The eight ACO primitives (Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative) are unchanged. The schema reflects them as a `primitive` column on `graph_nodes`, validated by a CHECK constraint.
> 3. Bi-temporal validity from pack 05 is first-class: `valid_from`, `valid_to`, `asserted_from`, `asserted_to` are columns, indexed.
> 4. Owner scoping: Postgres rows carry `owner_uid` and `case_id`; the API layer enforces that every query is scoped — Firestore rules already enforce this on the metadata side, but the same scoping is enforced in SQL via WHERE clauses on every read.
> 5. The two-phase commit pattern from pack 06 stays: Firestore write `status: 'pending'` → Postgres write → Firestore mark `'committed'`. The reconciler is updated to drift-check Firestore↔Postgres.
> 6. I will not break the four persona suites (pack 08), the graph ops (pack 07), the ingestion pipeline (pack 06), or the diagnostics dashboard (pack 08) at any commit boundary in this pack. Each commit leaves `audit:gate` green.
>
> Open questions for Giulio:
> - **Q1**: Postgres deployment — propose **Cloud SQL for PostgreSQL 16** with the `pgvector` extension enabled, `n2-standard-2` for staging and `n2-standard-4` with HA for production. Connection via Cloud SQL Auth Proxy from Cloud Run. Acceptable, or do you want AlloyDB / Supabase / self-hosted?
> - **Q2**: pgvector embedding model — propose `text-embedding-3-small` (1536 dim, OpenAI) for label + provenance embeddings; cheap, fast, well-tested. Embeddings stored in `graph_embeddings` separate from `graph_nodes` to keep node rows lean. Acceptable, or do you want Voyage / a local model?
> - **Q3**: Migration window — propose a single off-hours migration of the four sample cases. Neo4j stays available read-only for 30 days as fallback before the connection is removed. Acceptable?
> - **Q4**: `KG_BACKEND=both` — used only during migration validation; not a long-term mode. Once drift verification confirms parity for 30 consecutive days, we cut Neo4j over to read-only and eventually decommission. Acceptable?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| J1 | Postgres schema + Alembic migrations + pgvector setup | 7 |
| J2 | Data-access layer: repositories, transactional helpers, typed errors | 7 |
| J3 | Ingestion pipeline rewired: Firestore + Postgres two-phase commit | 8 |
| J4 | Neo4j → Postgres data migration for the four sample cases | 7 |
| J5 | Graph traversal queries (n-hop, shortest path, ego, time-bounded) | 6 |
| J6 | Semantic search via pgvector | 6 |
| J7 | Graph edit ops round-trip Postgres | 6 |
| J8 | Cytoscape adapter on the new graph API | 5 |
| J9 | `KG_BACKEND` flag, drift verifier update, perf budgets, docs, cost note | 8 |
| **Total** | | **~60** |

---

## 4. Hard rules

- The eight ACO primitives are enforced at the database layer via a `CHECK` constraint on `graph_nodes.primitive`.
- Every read query includes `case_id` and `owner_uid` predicates. Repository methods *require* these as parameters; there is no `findAll()`-shaped API.
- Every write goes through the two-phase commit protocol. There is no direct-to-Postgres write path that bypasses Firestore staging — full stop.
- Bi-temporal columns are mandatory. `asserted_from` defaults to `now()` at insert; `valid_from` may be null only with explicit caller acknowledgment.
- All migrations are reversible. Up and down both tested in CI.
- pgvector indexes use IVFFlat with `lists = sqrt(N)` heuristic, recomputed when row count crosses 10x growth thresholds.
- Connection pool is sized conservatively: `max_overflow = 10`, `pool_size = 5` per Cloud Run instance, with `pool_pre_ping = True`. Documented in `docs/runbooks/POSTGRES_CONNECTIONS.md`.
- Every query that scans more than 10k rows requires explicit annotation `# noqa: large-scan` and an EXPLAIN plan archived in code comments.
- No raw SQL in business logic. All SQL goes through the repository layer.
- The legacy Neo4j writer code is *gated*, not deleted. Removing it is a future cleanup pack.
- Model strings only in `backend/ai/providers.py`. Embedding model also lives there.

---

## 5. Prompt J1 — Postgres schema + Alembic + pgvector

### Persona
Database engineer who has shipped multi-tenant Postgres schemas in production. Knows that index choice is more consequential than table normalization at this scale, and that bi-temporal columns are non-negotiable for graph-of-knowledge applications.

### Phase 1 — Read & report

- Confirm `langgraph-checkpoint-postgres` is the only Postgres consumer currently. List its tables in `backend/migrations/` (existing).
- Confirm Alembic is set up; if not, set it up under `backend/migrations/alembic/`.
- Output `docs/architecture/POSTGRES_SCHEMA.md` describing the proposed schema before writing migrations.

### Phase 2 — Propose & confirm

Schema (preview):

```sql
CREATE EXTENSION IF NOT EXISTS pgvector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

CREATE TABLE graph_nodes (
    id            UUID PRIMARY KEY,
    case_id       UUID NOT NULL,
    owner_uid     TEXT NOT NULL,
    ontology_id   TEXT NOT NULL,
    ontology_version TEXT NOT NULL,
    primitive     TEXT NOT NULL CHECK (primitive IN
                    ('Actor','Claim','Interest','Constraint','Leverage',
                     'Commitment','Event','Narrative')),
    subtype       TEXT NOT NULL,
    label         TEXT NOT NULL,
    description   TEXT,
    layer         TEXT NOT NULL CHECK (layer IN
                    ('Source','Claim','Evidence','Verdict')),
    confidence    NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    provenance    JSONB NOT NULL DEFAULT '[]'::jsonb,
    valid_from    TIMESTAMPTZ,
    valid_to      TIMESTAMPTZ,
    asserted_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    asserted_to   TIMESTAMPTZ,
    metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
    status        TEXT NOT NULL DEFAULT 'committed'
                    CHECK (status IN ('pending','committed','merged','superseded','deleted')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    TEXT NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nodes_case_primitive  ON graph_nodes (case_id, primitive, subtype) WHERE status = 'committed';
CREATE INDEX idx_nodes_case_layer      ON graph_nodes (case_id, layer)              WHERE status = 'committed';
CREATE INDEX idx_nodes_temporal        ON graph_nodes (case_id, valid_from, valid_to);
CREATE INDEX idx_nodes_owner           ON graph_nodes (owner_uid, case_id);
CREATE INDEX idx_nodes_label_trgm      ON graph_nodes USING gin (label gin_trgm_ops);
CREATE INDEX idx_nodes_metadata_gin    ON graph_nodes USING gin (metadata jsonb_path_ops);

CREATE TABLE graph_edges (
    id              UUID PRIMARY KEY,
    case_id         UUID NOT NULL,
    ontology_id     TEXT NOT NULL,
    relation_type   TEXT NOT NULL,
    source_id       UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    target_id       UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    confidence      NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    provenance      JSONB NOT NULL DEFAULT '[]'::jsonb,
    valid_from      TIMESTAMPTZ,
    valid_to        TIMESTAMPTZ,
    asserted_from   TIMESTAMPTZ NOT NULL DEFAULT now(),
    asserted_to     TIMESTAMPTZ,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    status          TEXT NOT NULL DEFAULT 'committed',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT NOT NULL,
    CHECK (source_id <> target_id)
);

CREATE INDEX idx_edges_case_relation  ON graph_edges (case_id, relation_type) WHERE status = 'committed';
CREATE INDEX idx_edges_source         ON graph_edges (source_id);
CREATE INDEX idx_edges_target         ON graph_edges (target_id);
CREATE INDEX idx_edges_temporal       ON graph_edges (case_id, valid_from, valid_to);

CREATE TABLE graph_embeddings (
    node_id   UUID PRIMARY KEY REFERENCES graph_nodes(id) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL,
    model     TEXT NOT NULL,
    text_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_embeddings_ivfflat ON graph_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE graph_audit (
    id            UUID PRIMARY KEY,
    case_id       UUID NOT NULL,
    owner_uid     TEXT NOT NULL,
    operation     TEXT NOT NULL,                  -- 'merge','split','lock','dispute','mark-contradiction','create','update','delete'
    target_kind   TEXT NOT NULL CHECK (target_kind IN ('node','edge')),
    target_id     UUID NOT NULL,
    payload       JSONB NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    TEXT NOT NULL,
    reversible_until TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
);

CREATE INDEX idx_audit_case_created ON graph_audit (case_id, created_at DESC);
CREATE INDEX idx_audit_target       ON graph_audit (target_kind, target_id);
```

Send the proposal to Giulio. Wait for sign-off, particularly on:
- pgvector dimensionality (1536 vs 768 — depends on model choice from Q2).
- IVFFlat list count (100 is a v1 default; revisit when row count exceeds 100k).
- The `status` enum values — these encode the lifecycle from pack 07's edit operations.

### Phase 3 — Execute

- Set up `backend/migrations/alembic/` (or extend if already present).
- Author the migration `0001_initial_kg_schema.py` with the schema above.
- Author `0002_add_pgvector_indexes.py` separately (so disabling the extension is reversible).
- Test up/down on a clean local Postgres.
- Wire `backend/ingestion/db.py` with a typed engine factory using `asyncpg`.

### Phase 4 — Verify

- `alembic upgrade head` succeeds on a clean DB.
- `alembic downgrade base` succeeds.
- Insert a sample node + edge via raw SQL; constraints fire correctly on bad input.
- `pytest backend/tests/test_postgres_schema.py -q` green.

### Files to create

- `backend/migrations/alembic/versions/0001_initial_kg_schema.py`.
- `backend/migrations/alembic/versions/0002_add_pgvector_indexes.py`.
- `backend/migrations/alembic/env.py` (if missing).
- `backend/migrations/README.md`.
- `backend/ingestion/db.py`.
- `backend/tests/test_postgres_schema.py`.
- `docs/architecture/POSTGRES_SCHEMA.md`.

### Files to edit

- `backend/pyproject.toml` — add `asyncpg`, `sqlalchemy>=2.0`, `alembic`, `pgvector` (Python client).
- `backend/config.py` — Postgres connection config.

### Verification commands

```bash
# Clean DB lifecycle
alembic upgrade head
alembic downgrade base
alembic upgrade head

# Schema-level tests
pytest backend/tests/test_postgres_schema.py -q
```

---

## 6. Prompt J2 — Data access layer (repositories, transactional helpers)

### Persona
Backend engineer who has built clean repository layers over SQL before. Knows that the value is in the boundary: a typed API the rest of the code consumes; raw SQL never escapes the repository.

### Outcome

Five typed repositories exposing exactly the operations the ingestion pipeline, graph edit ops, traversal queries, and semantic search need. No more, no less.

### Files to create

- `backend/ingestion/repos/__init__.py`.
- `backend/ingestion/repos/node_repo.py` — methods: `create`, `get_by_id`, `list_by_case`, `update_status`, `merge`, `split`, `lock`, `count_by_case_primitive_subtype`.
- `backend/ingestion/repos/edge_repo.py` — methods: `create`, `get_by_id`, `list_by_case`, `list_by_endpoints`, `update_status`, `delete`.
- `backend/ingestion/repos/traversal_repo.py` — methods: `n_hop_neighborhood`, `shortest_path`, `ego_subgraph`, `time_bounded_slice`. Each implemented as a recursive CTE; covered in J5.
- `backend/ingestion/repos/embedding_repo.py` — methods: `upsert`, `search_by_vector`, `search_by_text` (computes embedding, then searches).
- `backend/ingestion/repos/audit_repo.py` — methods: `record_op`, `list_for_target`, `list_for_case_recent`.
- `backend/ingestion/repos/transactions.py` — `async def in_transaction(*ops)` helper using SQLAlchemy 2.0 `AsyncSession` with proper isolation.
- `backend/ingestion/repos/errors.py` — typed errors: `NodeNotFound`, `EdgeNotFound`, `OwnerScopeViolation`, `ConcurrentModification`, `ConstraintViolation`.
- `backend/tests/test_postgres_repos.py` — exhaustive table-driven tests for each repo method, including failure modes.

### Files to edit

- `backend/ingestion/db.py` — expose engine + session factory.
- `backend/main.py` — wire DB session middleware, manage connection lifecycle per request.

### Hard rules

- Every read method *requires* `case_id` and `owner_uid` as parameters; calling without them is a type error.
- Every write goes through `in_transaction`. There is no autocommit path.
- Connection pool stats logged to the diagnostics dashboard panel "Postgres health" (added in J9).
- All datetime values are tz-aware UTC.

### Definition of Done

- All repo methods pass their tests including failure-mode coverage.
- Connection pool behavior documented and tested under load.

### Verification commands

```bash
pytest backend/tests/test_postgres_repos.py -q
mypy backend/ingestion/repos --strict
```

---

## 7. Prompt J3 — Ingestion pipeline rewired with Firestore + Postgres two-phase commit

### Persona
Data engineer who has shipped two-phase commit before. Knows that the failure modes are the entire game: orphan-pending Firestore docs, partial Postgres writes after a crash, idempotency violations on retry.

### Outcome

The LangGraph pipeline (`backend/ingestion/pipeline.py`, established in pack 06 E8) now writes to Firestore and Postgres atomically. The reconciler runs every six hours via Cloud Scheduler. Crash injection tests pass.

### Files to edit

- `backend/ingestion/pipeline.py` — replace the `persist_atomic` node implementation:
  ```
  async def persist_atomic(state: IngestionState) -> IngestionState:
      async with in_transaction(session) as tx:
          for candidate in state.auto_committed:
              # 1. Stage in Firestore with status='pending'
              firestore_ref = await firestore_writer.stage(candidate)
              # 2. Insert into Postgres
              if candidate.kind == 'node':
                  await node_repo.create(tx, candidate.to_node_record())
              else:
                  await edge_repo.create(tx, candidate.to_edge_record())
              # 3. Mark Firestore as committed
              await firestore_writer.commit(firestore_ref)
              state.persisted_node_ids.append(candidate.id) if candidate.kind == 'node' else \
                  state.persisted_edge_ids.append(candidate.id)
          await audit_repo.record_op(tx, ...)
      return state
  ```
- `backend/ingestion/persistence/firestore_writer.py` — keep, ensure `stage` and `commit` semantics are clean.
- `backend/ingestion/persistence/postgres_writer.py` — new; wraps node + edge repos for the pipeline node.
- `backend/ingestion/persistence/transaction.py` — replace 2-phase Firestore↔Neo4j with Firestore↔Postgres.

### Files to create

- `backend/ingestion/persistence/postgres_writer.py`.
- `backend/tests/test_ingestion_postgres_atomicity.py` — including:
  - Happy path: ingest fixture, both stores have the data.
  - Crash between Firestore-pending and Postgres-write: reconciler completes Postgres write or marks Firestore failed.
  - Crash between Postgres-write and Firestore-commit: reconciler marks Firestore committed (idempotent) or rolls back Postgres if Firestore write was lost.
  - Idempotent replay: re-run the same document, no duplicate writes.
- `scripts/reconcile-firestore-postgres.ts` — replaces / extends the Neo4j drift verifier.
- `infrastructure/cloud-scheduler/reconcile-firestore-postgres.yaml` — every 6h schedule.

### Hard rules

- The legacy Neo4j writer path stays in the codebase, gated behind `KG_BACKEND in ('neo4j','both')`. When `KG_BACKEND=both`, both Postgres and Neo4j receive the write; Postgres is the source of truth and Neo4j is reflective.
- Every write is idempotent on `proposalId = sha256(case_id + document_id + extracted_span + subtype + label)` (already specified in pack 06).
- The reconciler runs in three modes: `dry-run` (default in CI), `auto-fix` (production cron), `report-only` (for ad-hoc investigation).

### Definition of Done

- `pytest backend/tests/test_ingestion_postgres_atomicity.py -q` green including crash injection.
- Cloud Scheduler entry deployed and verified on staging.
- Reconciler dry-run on staging shows zero drift after 24h of operation.

### Verification commands

```bash
pytest backend/tests/test_ingestion_postgres_atomicity.py -q
npx tsx scripts/reconcile-firestore-postgres.ts --dry-run
```

---

## 8. Prompt J4 — Migrate existing Neo4j data to Postgres

### Persona
Migration engineer. Knows that "we'll figure out the migration later" is how data gets lost. Treats the migration as a first-class artifact: scripted, dry-runnable, audited, reversible within a 30-day window.

### Outcome

The four sample cases (Syria, Northwind, UN CTED, Nordalia disinfo) are migrated from Neo4j to Postgres with zero data loss. Pre/post node and edge counts identical. Round-trip query parity verified for ten representative queries per case.

### Files to create

- `scripts/migrate-neo4j-to-postgres.ts` — orchestrator. Modes: `--dry-run`, `--case <id>`, `--all-sample-cases`, `--verify-only`.
- `backend/migration/neo4j_to_postgres/__init__.py`.
- `backend/migration/neo4j_to_postgres/extract.py` — paginated read from Neo4j Aura.
- `backend/migration/neo4j_to_postgres/transform.py` — map Neo4j node/edge shapes to the Postgres schema; fill ontology_id/version, infer subtype where missing, attach default bi-temporal fields.
- `backend/migration/neo4j_to_postgres/load.py` — batch insert into Postgres via `node_repo` / `edge_repo`.
- `backend/migration/neo4j_to_postgres/verify.py` — pre/post comparison + parity queries.
- `backend/tests/test_migration_neo4j_to_postgres.py`.
- `docs/runbooks/MIGRATE_NEO4J_TO_POSTGRES.md`.

### Hard rules

- Migration runs in transactions per case; one case migrating cannot corrupt another.
- Original Neo4j data is *not* deleted by the migration. It stays read-only for 30 days as documented fallback.
- Verification runs the ten per-case parity queries (e.g., "list all Actors with subtype StateActor" — count must match between stores).
- Audit log entries recorded for every migrated row in `graph_audit` with `operation = 'migrated_from_neo4j'`.

### Definition of Done

- Dry-run prints expected diff for each sample case; no surprises.
- Real run completes; counts match; parity queries match.
- Runbook reviewed by Giulio.

### Verification commands

```bash
npx tsx scripts/migrate-neo4j-to-postgres.ts --dry-run --all-sample-cases
npx tsx scripts/migrate-neo4j-to-postgres.ts --all-sample-cases
npx tsx scripts/migrate-neo4j-to-postgres.ts --verify-only
```

---

## 9. Prompt J5 — Graph traversal queries via recursive CTEs

### Persona
SQL engineer who has shipped graph queries on relational stores. Knows that recursive CTEs scale fine to ~100k rows per query if indexes are right, and that the work is in the indexes and the EXPLAIN plans.

### Outcome

Four traversal endpoints, all backed by parameterized recursive CTEs, all under 100ms P95 on the 10k-node fixture.

### Files to create

- `backend/ingestion/repos/traversal_repo.py` — methods:
  - `n_hop_neighborhood(case_id, owner_uid, root_id, hops, *, primitive_filter=None, layer_filter=None) -> list[NodeRecord], list[EdgeRecord]`. CTE walks outward up to `hops` (default 2, max 5). Uses `case_id` predicate and CHECKs to constrain, prevents cross-case leak.
  - `shortest_path(case_id, owner_uid, source_id, target_id, *, max_depth=8) -> list[EdgeRecord] | None`. Bidirectional BFS in SQL (two CTEs converging) for performance.
  - `ego_subgraph(case_id, owner_uid, focus_id, depth) -> CaseGraph`. Wrapper around `n_hop_neighborhood` that returns the full subgraph as nodes + edges.
  - `time_bounded_slice(case_id, owner_uid, t_start, t_end) -> CaseGraph`. Returns nodes whose `[valid_from, valid_to)` overlaps the window, plus edges between them.
- `backend/routers/graph.py` — FastAPI routes wrapping each method:
  - `GET /v1/cases/{case_id}/graph` (full case graph, paginated for >5k nodes).
  - `GET /v1/cases/{case_id}/graph/neighborhood?root={node_id}&hops={n}`.
  - `GET /v1/cases/{case_id}/graph/path?source={a}&target={b}`.
  - `GET /v1/cases/{case_id}/graph/ego?focus={node_id}&depth={n}`.
  - `GET /v1/cases/{case_id}/graph/slice?from={iso}&to={iso}`.
- `backend/tests/test_graph_traversal.py` — correctness + performance tests.

### Hard rules

- Every recursive CTE has a `WHERE case_id = $1 AND owner_uid = $2` predicate at every level. Cross-case leakage is impossible by construction.
- Every method has an EXPLAIN plan archived in code comments (recompute when query changes).
- Hops are capped (5 for `n_hop_neighborhood`, 8 for `shortest_path`). The cap is documented and tested.

### Definition of Done

- All four endpoints functional and tested.
- Perf budgets met on 10k-node fixture.
- Frontend cytoscape adapter (next prompt) uses these endpoints.

### Verification commands

```bash
pytest backend/tests/test_graph_traversal.py -q
# Perf check on 10k-node synthetic fixture:
pytest backend/tests/test_graph_traversal_perf.py -q --benchmark-only
```

---

## 10. Prompt J6 — Semantic search via pgvector

### Persona
Search engineer. Knows that pgvector with IVFFlat at this scale beats Elasticsearch in operational cost for 10x less effort, and that the work is mostly in the embedding strategy, not the indexing.

### Outcome

A semantic search endpoint that returns ranked nodes by cosine similarity over their `label + description + provenance text` embedding.

### Files to create

- `backend/ingestion/embeddings/embedder.py` — wraps the embedding provider (per Q2: `text-embedding-3-small`). Caches by `text_hash` to avoid re-embedding identical text.
- `backend/ingestion/embeddings/embed_node.py` — text composition: `f"{node.label}\n{node.description or ''}\n{provenance_text(node)}"`. Truncate to model token limit.
- Update the ingestion pipeline (`backend/ingestion/pipeline.py`) — after `persist_atomic`, schedule embedding generation via a background task (so ingestion isn't blocked by embedding latency).
- `backend/ingestion/repos/embedding_repo.py` (extend J2): `search_by_text(case_id, owner_uid, query, top_k=20, primitive_filter=None) -> list[(NodeRecord, similarity)]`.
- `backend/routers/search.py` — `GET /v1/cases/{case_id}/search?q={text}&top_k=20&primitive=Actor`. Wrapped in `withCalibration`.
- `backend/tests/test_semantic_search.py` — eval set: 50 hand-labeled (query, expected nodes) pairs across the four sample cases. Precision-at-10 ≥ 80%.

### Hard rules

- Embeddings live in `graph_embeddings`, not on `graph_nodes`. Keeps the hot table lean.
- Embedding generation is asynchronous from ingestion. A node may exist for up to 60 seconds without an embedding; semantic search gracefully degrades to label-trigram match in that window.
- Re-embedding triggers when node label/description changes; `text_hash` invalidation handles this automatically.
- Batch embedding requests at 32 nodes per call to avoid per-call provider overhead.

### Definition of Done

- Eval set precision-at-10 ≥ 80%.
- Background embedding worker stable (no orphaned embeddings).
- Search latency < 200ms P95.

### Verification commands

```bash
pytest backend/tests/test_semantic_search.py -q
# Performance:
pytest backend/tests/test_semantic_search_perf.py -q --benchmark-only
```

---

## 11. Prompt J7 — Graph edit operations round-trip Postgres

### Persona
Verification engineer. The pack-07 edit ops were specified to round-trip the graph atomically; pack 09 verified the round-trip happens against whatever store was current. This prompt makes Postgres the round-trip target.

### Outcome

Pack 07's five edit operations (merge / split / lock / dispute / mark-contradiction) write through Firestore + Postgres atomically. Audit trail in `graph_audit`.

### Files to edit

- `backend/routers/graph_edits.py` — replace Neo4j calls with `node_repo` / `edge_repo` calls (gated by `KG_BACKEND` flag).
- For each operation:
  - `merge`: insert new node, redirect edges via `edge_repo.update_endpoints`, mark old nodes `status='merged'`, write audit record.
  - `split`: insert two new nodes, partition edges, mark original `status='superseded'`, audit.
  - `lock`: update `metadata.locked = true`, audit.
  - `dispute-claim`: update `confidence = max(0.1, confidence - 0.3)`, push `disputeReason` to metadata, audit, push review-queue entry.
  - `mark-contradiction`: insert `CONTRADICTS` edge with caller-supplied rationale in `provenance`, audit.

### Hard rules

- Every operation is reversible within 24h via the `graph_audit.reversible_until` window. `POST /v1/cases/{case_id}/audit/{audit_id}/revert` performs the inverse.
- Optimistic frontend updates (per pack 09 I3) remain. Backend response carries the canonical row state for reconciliation.
- The legacy Neo4j edit path is *gated*, not removed.

### Definition of Done

- E2E (`graph-ops-roundtrip.spec.ts` from pack 09 I3) green against Postgres.
- Direct SQL inspection confirms expected row state after each operation.
- Revert tested for each op.

### Verification commands

```bash
pytest backend/tests/test_graph_edits_postgres.py -q
npx playwright test e2e/workbench/graph-ops-roundtrip.spec.ts
```

---

## 12. Prompt J8 — Cytoscape adapter on the new graph API

### Persona
Frontend engineer who has wrangled large graph payloads in JS. Knows that 10k nodes over the wire as JSON is a 5-10MB payload; pagination + summary mode is mandatory.

### Outcome

The cytoscape adapter (`src/lib/graph/cytoscape-adapter.ts`, pack 07 F2) reads from the new Postgres-backed `/v1/cases/{caseId}/graph` endpoint. Above 5k nodes, the frontend automatically requests a Summary Mode payload that clusters by `(primitive, subtype)`.

### Files to edit

- `src/lib/graph/case-graph-loader.ts` — replace whatever data source it had with a fetch to the new endpoint. Honor pagination / summary-mode signal from server.
- `src/lib/graph/cytoscape-adapter.ts` — handle Summary Mode payload (clusters expand on click; pack 07 F8 already specified the UX).
- `backend/routers/graph.py` — implement automatic Summary Mode response when `nodes_count > 5000` and `?expand=false`.
- `e2e/workbench/graph-load-large-case.spec.ts` — synthesize a 10k-node case, render, assert <2s render and <30 fps drop.

### Hard rules

- Summary Mode clustering is server-computed; client receives super-nodes + counts, not 10k rows it then groups locally.
- Expansion of a cluster is a separate API call: `GET /v1/cases/{case_id}/graph/cluster/{primitive}/{subtype}/expand`.

### Definition of Done

- 10k-node case renders within budget.
- Cluster expansion smooth.
- Visual snapshots match.

### Verification commands

```bash
npx playwright test e2e/workbench/graph-load-large-case.spec.ts
npx playwright test e2e/perf/graph-large.spec.ts
```

---

## 13. Prompt J9 — `KG_BACKEND` flag, drift verifier, perf budgets, docs, cost note

### Persona
Release engineer wrapping the architectural change cleanly. Sets the env flag, ships the docs, archives the cost analysis, leaves the gate honest.

### Outcome

The architectural change is documented, gated, observed, and budgeted.

### Files to create

- `docs/architecture/KG_BACKEND.md` — explains the three modes (`postgres`, `neo4j`, `both`), the migration timeline, the rollback procedure.
- `docs/architecture/COST_NOTES.md` — back-of-envelope monthly cost per mode at small / medium / large scale; rationale for the `postgres` default.
- `docs/runbooks/POSTGRES_OPERATIONS.md` — connection pool, vacuum, index maintenance, restore-from-backup.
- `scripts/audit-postgres-schema-current.ts` — fails CI if `alembic check` reports drift between models and applied migrations.
- `scripts/audit-kg-drift.ts` — runs the reconciler in `--dry-run` mode and exits non-zero on any drift.
- `scripts/audit-graph-query-perf.ts` — runs the four traversal endpoints against the 10k-node fixture; asserts P95 budgets.

### Files to edit

- `backend/config.py` — `KG_BACKEND` enum env var, default `postgres`.
- `backend/ingestion/persistence/transaction.py` — branch on the flag.
- `backend/main.py` — log the active mode at startup.
- `package.json` — `audit:postgres-schema-current`, `audit:kg-drift`, `audit:graph-query-perf` scripts.
- `audit:gate` chain — append the three new audits.
- `docs/architecture/SYSTEM_OVERVIEW.md` (from pack 09 H8 / pack 11) — update diagram to show Postgres as primary, Neo4j optional.
- Diagnostics dashboard panel "Drift verifier" (pack 08 G9 / pack 09 I5) — wire to the new Firestore↔Postgres reconciler output.

### Hard rules

- The cost analysis must include both compute and operational labor. Aurora is cheaper than Neo4j Aura but not free; document honestly.
- Default `KG_BACKEND=postgres` ships in this pack; `KG_BACKEND=both` is supported only in staging during the 30-day cutover window.

### Definition of Done

- All audits in `audit:gate` exit 0.
- Diagnostics dashboard reflects new drift verifier.
- Cost notes signed off by Giulio.
- 30-day-cutover plan documented in the migration runbook.

### Verification commands

```bash
npm run audit:postgres-schema-current
npm run audit:kg-drift
npm run audit:graph-query-perf
npm run audit:gate
```

---

## 14. Final verification gate

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# The new Postgres-backed audits
npm run audit:postgres-schema-current
npm run audit:kg-drift
npm run audit:graph-query-perf
npm run audit:gate

# Persona suites — must still be green after the architectural change
npm run test:e2e:personas

# Migration verification
npx tsx scripts/migrate-neo4j-to-postgres.ts --verify-only

# Graph ops round-trip via Postgres
npx playwright test e2e/workbench/graph-ops-roundtrip.spec.ts

# Performance
npx playwright test e2e/perf/graph-large.spec.ts
pytest backend/tests/test_graph_traversal_perf.py -q --benchmark-only
pytest backend/tests/test_semantic_search_perf.py -q --benchmark-only
```

All commands exit 0. Cost note signed. Drift verifier green for 24h on staging.

---

## 15. Out of scope

- Neo4j removal. The Neo4j code path stays gated for v2 reconsideration.
- Graph algorithms beyond traversal (community detection, PageRank, Louvain). Those become the v2 Neo4j-revival case.
- Multi-region Postgres replication. Single-region with HA is v1.
- Connection pooling beyond per-instance defaults. PgBouncer is a v2 if needed.
- Postgres logical replication / CDC for downstream analytics. Out of scope.
- Migration of any non-sample-case data (since v1 has no other production cases).

---

## 16. Closing note

This pack is the operational simplification that should have been v1 but wasn't because the original architecture was specced when Neo4j felt like the obvious graph database choice. With pack 06 in place, the abstraction boundary (ontology-bound nodes and edges, owner-scoped, two-phase committed) was actually database-agnostic. Postgres takes the role cleanly, costs an order of magnitude less to operate, and keeps the door open to bring Neo4j back as a v2 algorithm engine if and only if a graph-algorithmic query becomes product-critical.

The cost of doing this in pack 10 instead of pack 06: zero feature regression (same capabilities, simpler stack), some migration work (this pack), and a cleaner operational story for launch.

The cost of *not* doing this: an extra paid dependency, an extra operational surface, an extra failure mode in the two-phase commit, and a 3 AM page that nobody on the team is on call for.

Branch: `feature/postgres-knowledge-graph`. Commit prefix `kg(<area>): <prompt-id> <description>` (e.g., `kg(schema): J1 add graph_nodes table with bi-temporal columns`). PR titled `Pack 10 — Postgres-First Knowledge Graph & Ingestion Backend`.

Do not merge to `main` without:
1. All audits green.
2. Migration verified on the four sample cases.
3. Persona suites green.
4. Cost note + KG_BACKEND runbook signed by Giulio.

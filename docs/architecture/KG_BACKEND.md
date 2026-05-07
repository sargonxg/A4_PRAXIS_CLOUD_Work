# KG_BACKEND

Date: 2026-05-06

`KG_BACKEND` controls the knowledge graph backend mode.

| Mode | Meaning | Use |
|---|---|---|
| `postgres` | Postgres is the primary graph store. | Default v1 mode. |
| `neo4j` | Legacy Neo4j path is primary. | Temporary rollback or legacy validation. |
| `both` | Postgres is primary and Neo4j is reflective. | Migration validation only. |

Backend config reads `KG_BACKEND`, `GRAPH_BACKEND`, or `graph_backend`, defaulting to `postgres`.

The v1 repository layer lives in `backend/services/kg_repositories.py`:

- `NodeRepo` and `EdgeRepo` own parameterized writes to `graph_nodes` and `graph_edges`.
- `GraphTraversalRepo` exposes owner/case-scoped n-hop and shortest-path queries via recursive CTEs.
- `EmbeddingRepo` exposes pgvector semantic search while preserving owner and case predicates.

Every repository method requires `owner_uid` and `case_id`; there is no unscoped graph read API.

## Cognee Coexistence

Cognee is an optional probabilistic memory layer, not a `KG_BACKEND` mode.
It must never become the canonical graph store. The canonical ACO graph remains
Postgres-backed through `NodeRepo` / `EdgeRepo`; Cognee may only write candidate
links into `aco_cognee_link` and review metadata. Promotion into canonical
`graph_nodes` or `graph_edges` still goes through the existing repository layer
and symbolic firewall.

The current default is `COGNEE_MODE=disabled`. Production enablement requires
the isolated `praxis_cognee` database, RLS wrapper SQL, private `praxis-cognee`
Cloud Run service, Vertex ADC-only provider config, and the runbook in
`docs/runbooks/MEMORY_LAYER_RUNBOOK.md`.

Rollback procedure:

1. Set `KG_BACKEND=neo4j` on the backend service.
2. Redeploy backend.
3. Run graph smoke checks.
4. Keep Firestore canonical metadata unchanged.

Cutover procedure:

1. Run Postgres migrations.
2. Run sample-case migration in dry-run mode.
3. Run parity checks.
4. Set `KG_BACKEND=both` in staging for drift observation.
5. Set `KG_BACKEND=postgres` in production after validation.

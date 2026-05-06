# Postgres Operations

Date: 2026-05-06

## Connection Posture

- Cloud SQL Postgres is accessed through the existing backend Postgres service layer.
- Pooling stays conservative: small per-instance pools and PgBouncer compatibility.
- Do not initialize database clients at module import in frontend/serverless code.

## Migration

1. Run Alembic migration dry-run in staging.
2. Apply `0011_postgres_kg_contract.py`.
3. Verify `graph_nodes`, `graph_edges`, `graph_embeddings`, and `graph_audit`.
4. Run KG drift checks.

## Maintenance

- Monitor table growth by `owner_uid` and `case_id`.
- Revisit pgvector IVFFlat list count once row count grows by 10x.
- Keep Neo4j credentials present only when `KG_BACKEND=neo4j` or `both`.

## Incident Response

- If graph reads fail in `postgres`, switch to `KG_BACKEND=neo4j` only if the legacy index has parity.
- If writes fail after Firestore staging, run the reconciler in report mode before manual intervention.

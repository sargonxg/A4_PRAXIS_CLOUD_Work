# Cost Notes

Date: 2026-05-06

Postgres-first graph storage reduces v1 operational complexity by using the Cloud SQL stack already present for LangGraph checkpoints and backend SQL.

## Small Scale

- Cloud SQL Postgres with pgvector: one operational database tier.
- Neo4j Aura: additional paid service, separate auth, backup, monitoring, and incident path.
- Recommendation: Postgres only.

## Medium Scale

- Postgres remains appropriate for low-to-mid six-figure node counts with owner-scoped predicates and targeted indexes.
- Neo4j becomes useful if product-critical graph algorithms appear.
- Recommendation: Postgres primary, Neo4j optional reflector in staging.

## Large Scale

- If PRAXIS requires community detection, PageRank-style algorithms, motif finding, or cross-case graph science, Neo4j can return as a v2 analytical index.
- Until then, the operating cost of Neo4j exceeds its v1 product value.

Cost analysis includes engineering labor: one fewer database product means fewer dashboards, fewer credentials, fewer failure modes, and fewer 3 AM escalation paths.

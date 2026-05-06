# Postgres Knowledge Graph Schema

Date: 2026-05-06

PRAXIS now treats Postgres as the v1 primary knowledge graph store. Firestore remains the owner-scoped user metadata store; Postgres stores ontology-bound graph rows for traversal, search, edits, and audit.

## Tables

- `graph_nodes`: owner-scoped case graph nodes with ACO primitive, ontology id/version, subtype, truth layer, confidence, provenance, bi-temporal validity, metadata, and lifecycle status.
- `graph_edges`: owner-scoped relations between graph nodes, with confidence, provenance, bi-temporal validity, metadata, and status.
- `graph_embeddings`: pgvector embeddings for node label/description/provenance text. Embeddings are separated from `graph_nodes` to keep graph rows lean.
- `graph_audit`: graph operation audit trail with a 24-hour reversible window.

## Invariants

- `owner_uid` and `case_id` are required on every graph row.
- `primitive` is constrained to the eight ACO primitives.
- `layer` is constrained to Source, Claim, Evidence, or Verdict.
- Confidence is stored as 0-1 numeric.
- Validity and assertion timestamps are first-class.
- Neo4j is retained as optional secondary/index mode, not the default.

The first migration contract is `backend/migrations/versions/0011_postgres_kg_contract.py`.

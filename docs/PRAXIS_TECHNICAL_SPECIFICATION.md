# PRAXIS Technical Specification

This document is the canonical technical-specification entry point for the
three-phase PRAXIS rebuild.

## Source Documents

- `docs/phases/PRAXIS_PHASE_1_FOUNDATION.md` — Cloud SQL Postgres, Neo4j Aura, bi-temporal graph fields, model-string discipline, and CI gates.
- `docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md` — LangGraph runtime, symbolic firewall, Cypher recipes, context loader, 20-verb grammar, and Trust Score persistence.
- `docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md` — eight-surface product shell, Library split, Draft provenance, Boardroom UI, Cypher console, graph diffing, AI Act acknowledgement, and cost-cap UI.

## Non-Negotiable Contracts

1. Firestore remains canonical for user-owned product state.
2. Cloud SQL Postgres is the only relational, vector, and memory store.
3. Neo4j Aura is the only graph index.
4. Vertex AI Gemini is the only AI provider.
5. Every tenant-owned Postgres table must use `tenant_id`, RLS, and the `current_tenant()` policy helper.
6. Every graph node and edge carries bi-temporal fields: `validFrom`, `validTo`, `assertedFrom`, and `assertedTo`.
7. Every AI route is calibrated, audited, and routed through the operational spine.
8. No streaming claim reaches a user in Phase 2+ unless the symbolic firewall classifies it as graph-grounded or inferred with source receipts.

## Phase Gates

Phase 2 must not begin until `phase-1-foundation-shipped` exists on `main`.
Phase 3 must not begin until `phase-2-agentic-spine-shipped` exists on `main`.

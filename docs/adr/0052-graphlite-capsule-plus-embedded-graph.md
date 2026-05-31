# ADR 0052: GraphLite Seeds for Capsule+ Embedded Graphs

Last reviewed: 2026-05-31

## Status

Accepted for app-side implementation.

## Context

PRAXIS needs capsules that can carry an embedded ontology/graph representation:
reasoning context, situation model, source-backed claims, outputs, graph
candidates, provenance, and review state. The repo already has Capsule+ as the
portable, review-gated graph bundle and Postgres as the approved graph row
target. TrustGraph is being prepared as an optional service-side derived
context substrate.

GraphLite adds a useful third shape: an embedded graph database target that can
travel with a capsule as GQL seed material without requiring a new service.

## Decision

Add GraphLite GQL seed artifacts to Capsule+ exports.

- Keep Capsule+ as the PRAXIS-owned graph contract.
- Generate `graphlite/seed.gql` and `graphlite/README.md` inside every Capsule+
  export bundle.
- Include capsule metadata, ontology stack hints, node/edge ontology terms,
  graph nodes, graph edges, provenance, confidence, review state, and
  advisory-only markers.
- Keep GraphLite output advisory until PRAXIS review-card promotion.
- Do not add a GraphLite server, daemon, Cloud Run service, or new primary UI.

## Consequences

- Every exported capsule can carry a local embedded graph seed.
- Analysts and future workers can inspect capsule graphs offline or in an
  embedded GraphLite database.
- PRAXIS avoids another production service while still preparing for richer
  per-capsule context capture.
- Canonical graph writes remain governed by existing Capsule+ proposal and
  review/apply boundaries.

## Implementation Notes

- Capsule+ export implementation lives in `src/lib/capsule-plus/index.ts`.
- `buildGraphLiteSeedGql()` compiles the GQL seed from the validated Capsule+
  bundle.
- The GraphLite seed is intentionally an artifact, not an import-side authority.
- Postgres remains the approved graph row store; TrustGraph remains the
  optional service-side graph/ontology recall substrate.

# GraphLite Capsule Embedded Graph

Last reviewed: 2026-05-31

## Position

GraphLite is the selected embedded graph substrate for Capsule+ exports and
capsule-scoped advisory graph recall. It is not the canonical graph store.

PRAXIS uses GraphLite for portable, owner/capsule-scoped graph artifacts that
can be inspected locally or replayed into an embedded GraphLite database. The
canonical mutation boundary remains unchanged:

- Firestore ContextCapsules remain canonical for capsule state.
- Capsule+ proposals remain review-gated.
- Approved graph rows still promote through the existing PRAXIS review/apply
  path before becoming canonical Postgres graph rows.
- TrustGraph, when enabled, remains the optional derived service substrate for
  GraphRAG, ontology extraction, explainability paths, and cross-capsule recall.

## Local Install

The current upstream release path is crates.io:

```powershell
rustup default stable
cargo install gql-cli
graphlite --version
npm run doctor:graphlite
```

As of this checkpoint, the upstream README documents `cargo install gql-cli`,
which installs the `graphlite.exe` binary.

## Upstream Basis

GraphLite is Apache-2.0 licensed. The upstream project describes itself as an
embedded graph database with ISO GQL support, single-binary deployment,
Sled-backed storage, ACID transactions, and no server requirement.

References:

- GraphLite repository: https://github.com/GraphLite-AI/GraphLite
- GraphLite license: https://github.com/GraphLite-AI/GraphLite/blob/main/LICENSE
- GraphLite crate guide: https://github.com/GraphLite-AI/GraphLite/blob/main/docs/Using%20GraphLite%20as%20a%20Crate.md
- GraphLite quick start: https://github.com/GraphLite-AI/GraphLite/blob/main/docs/Quick%20Start.md

## Capsule+ Artifact

Every Capsule+ export now includes:

- `graphlite/seed.gql` - GraphLite GQL seed for the capsule graph.
- `graphlite/README.md` - operational notes and review-gate warning.

The seed creates one owner/capsule-scoped schema and graph, then inserts:

- Capsule metadata.
- Ontology stack nodes and ontology-term hints for node/edge types.
- Capsule+ graph nodes.
- Capsule+ graph edges.
- Provenance, confidence, review state, and advisory/canonical-store markers.

The seed is deliberately replayable as a local artifact, not a direct production
writer. It uses `INSERT` statements and should be run in a clean GraphLite
database or inspected before replay.

## Advisory Recall Bridge

PRAXIS now has a disabled-first GraphLite bridge contract:

- `src/lib/knowledge/graphlite-contract.ts`
- `src/lib/knowledge/graphlite-capsule-sync.ts`
- `src/lib/knowledge/context-enrichment-adapter.ts`

When `GRAPHLITE_ENABLED=true` and `GRAPHLITE_BACKEND_URL` is set, Ask PRAXIS can
call a private `praxis-graphlite-bridge` endpoint for provenance-bound capsule
graph recall. Returned hits are injected only as advisory context and every
writeback is represented as a review-card proposal. The browser never calls a
GraphLite database directly.

## Fit

GraphLite is the default choice for compact embedded capsule graphs that travel
with the capsule and do not require a deployed graph service.

GraphLite is not better than TrustGraph for service-side retrieval,
multi-tenant recall, graph path explainability, or GraphRAG orchestration. The
right shape is complementary:

- GraphLite: capsule-local, portable, inspection/debug/export artifact.
- Postgres: approved graph rows and operational joins.
- TrustGraph: optional derived service for advanced graph/ontology recall.

## Guardrails

- Never treat GraphLite output as reviewed truth by itself.
- Do not let GraphLite writes bypass PRAXIS review cards.
- Keep GraphLite artifacts owner/capsule scoped.
- Keep source, document, and run provenance on every row.
- Keep unsupported claims as proposed/review-required graph rows.

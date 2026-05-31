# ADR 0051: TrustGraph as an Optional Derived Context Substrate

Last reviewed: 2026-05-31

## Status

Accepted for safe MVP implementation.

## Context

PRAXIS needs a deeper context substrate for ContextCapsules: source segments,
ontology extraction, graph paths, tacit knowledge, retrieval explainability,
agent run receipts, and output lineage. TrustGraph provides relevant upstream
building blocks: context cores, GraphRAG, Ontology RAG, custom processors, and a
Kubernetes-oriented deployment model.

PRAXIS already has a stronger product boundary than a generic RAG stack:
Firestore ContextCapsules remain canonical, Capsule+ is the portable graph
proposal/export shape, and inferred memory/graph facts require review-card
promotion before canonical use.

## Decision

Use TrustGraph adapter-first as an optional derived context substrate.

- Keep upstream TrustGraph intact initially.
- Add a private `praxis-trustgraph-bridge` contract for capsule sync, recall,
  graph proposal, and status.
- Keep `TRUSTGRAPH_ENABLED=false` by default.
- Treat every TrustGraph result as advisory unless a PRAXIS review card is
  applied.
- Deploy TrustGraph on GKE only after the local bridge round trip is proven.
- Fork TrustGraph only if adapter-first cannot support PRAXIS tenancy, schemas,
  or processor extension.

## Consequences

- PRAXIS can start storing and recalling richer capsule context without changing
  canonical capsule ownership or review semantics.
- The app can surface TrustGraph status and graph-path receipts without implying
  canonical graph mutation.
- The bridge service becomes the trust boundary for user identity, capsule
  scoping, and OIDC-authenticated service-to-service calls.
- Production enablement requires ops proof: private ingress, service identity,
  health checks, logs, cost controls, and a rehearsed disabled-mode rollback.

## Implementation Notes

- App contract lives in `src/lib/knowledge/trustgraph-contract.ts`.
- Capsule sync compilation lives in
  `src/lib/knowledge/trustgraph-capsule-sync.ts` and covers user/tacit
  knowledge, situation, sources, documents, graph candidates, time, tools,
  objectives, products, outputs, memory, ontologies, governance, and review
  cards as advisory-only segments.
- Enrichment integration lives in `src/lib/knowledge/context-enrichment-adapter.ts`.
- Retrieval order includes advisory TrustGraph context after Cognee memory and
  before Capsule+ graph candidates.
- Public health surfaces report TrustGraph as optional/unconfigured unless both
  `TRUSTGRAPH_ENABLED=true` and `TRUSTGRAPH_BACKEND_URL` are set.
- No new service is required for app-side readiness; service creation is the
  final deployment lane after local bridge round-trip tests are green.

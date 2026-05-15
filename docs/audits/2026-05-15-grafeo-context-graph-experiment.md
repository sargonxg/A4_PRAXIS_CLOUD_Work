# Grafeo Context Graph Experiment Audit - 2026-05-15

## What Changed

- Added an experimental Context Core Lite graph builder in
  `src/lib/context/experimental-grafeo-context-graph.ts`.
- Added authenticated experimental API access at
  `/api/context/graph/experimental`.
- Added `@grafeo-db/js` as the optional native Grafeo mirror dependency.
- Added focused unit tests for deterministic policy and conflict graph capture.
- Documented the architecture boundary in
  `docs/architecture/GRAFEO_CONTEXT_GRAPH_EXPERIMENT.md`.

## What Works Now

- PRAXIS can build a deterministic Context Core Lite graph from explicit arrays
  or simple structured text lines.
- The graph captures actors, events, claims, constraints, assumptions, evidence
  gaps, source receipts, support edges, conflict edges, and analysis standards.
- The standard query pack reports unsupported claims, conflicting claims,
  assumption load, evidence gaps, temporal coverage, and policy/conflict
  constraint readiness.
- With `PRAXIS_CONTEXT_GRAPH_BACKEND=grafeo_experimental`, the graph can be
  mirrored into an in-memory Grafeo database during the request.

## Product Boundary

This does not replace the Firestore capsule/context-package MVP spine. PRAXIS
still treats Context Core Lite as the current working object. DIALECTICA by
TACITUS remains the future full context creation engine for source ingestion,
extraction, ontology/provenance graphing, versioned packages, and deeper hybrid
retrieval.

## Remaining Risks

- Grafeo persistence is experimental and should be enabled only with an explicit
  `PRAXIS_GRAFEO_CONTEXT_DIR`.
- Cloud Run behavior for native Grafeo package loading still needs a deployment
  smoke before Grafeo becomes a required runtime path.
- Ask PRAXIS does not yet call this graph route automatically; the first slice
  exposes the graph/prompt block for safe integration.
- The graph builder is deterministic and lite; it does not claim full
  DIALECTICA-grade extraction.

## Validation

- `npx vitest run tests/unit/lib/context/experimental-grafeo-context-graph.test.ts`
  passed.
- Local Grafeo mirror smoke returned `ok=true` with 12 nodes and 11 edges.

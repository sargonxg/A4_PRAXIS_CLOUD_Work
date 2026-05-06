# PRAXIS Packs 06-08 Implementation Status

Date: 2026-05-06
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Branch: `main` (local worktree)

## Pack 06 - Ontology System

Implemented in this branch:

- ACO/TACITUS core primitive substrate is exported from `src/lib/graph/core-primitives.ts`.
- Ontology definitions are implemented for conflict, mediation, governance, and narrative domains under `src/lib/ontology/`.
- Each ontology maps all core primitives: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, and Narrative.
- Registry helpers select an ontology from the active case domain and summarize primitive coverage.
- Workbench now includes an Ontology tab that displays the active ontology, node types, edge types, validators, and coverage.
- `npm run audit:ontology` validates primitive coverage and registry consistency.

Still not complete from the full pack:

- Ontology migrations into historical Firestore/Neo4j records remain a later data migration.
- Domain-specific extraction prompts and live backend validators are not yet wired into every AI route.

## Pack 07 - Graph Visualization

Implemented in this branch:

- A canonical workbench graph adapter builds graph nodes and edges from the active `CaseModule`, source receipts, actors, and truth-layer coverage.
- Workbench Graph now renders `PraxisGraphCanvas`, a single canonical graph tab with provenance coverage and selected-node details.
- The graph view is intentionally tolerant: rough context, source receipts, generated claims, and partial layers can render without hard rejection.
- `npm run audit:graph-viewer` checks that the workbench graph tab uses the canonical canvas and surfaces provenance coverage.

Still not complete from the full pack:

- Cytoscape-style advanced layout, graph diff playback, saved visual states, and live Neo4j-backed traversal remain next graph-visualization iterations.
- The current graph canvas is a product scaffold over the workbench context, not a full graph database browser.

## Pack 08 - Tools Marketplace

Implemented in this branch:

- A new curated marketplace registry exists at `src/lib/tools/marketplace/registry.ts`.
- The registry exposes exactly 16 tools across conflict, mediation, governance, narrative, and cross-ontology categories.
- Tool definitions include ontology requirements, context-health thresholds, runtime budgets, cost class, streaming flag, canary cases, and loose input/output schemas.
- The marketplace intentionally permits raw text, AI generations, context dumps, and structured output to be persisted together.
- `src/lib/tools/marketplace/run-artifact.ts` adds a tolerant Firestore-ready artifact record under `toolRunArtifacts`.
- Workbench now includes a Tools tab that filters marketplace tools by active ontology, context health, category, and max cost class.
- `npm run audit:tool-marketplace` checks the 16-tool cap, schemas, ontology references, canary coverage, and runtime budget.

Still not complete from the full pack:

- The legacy app-wide tool registry remains intact because it is still heavily imported. The new marketplace is a cleaner v1 surface layered beside it.
- Live execution routing for every marketplace tool remains a follow-up; this branch creates the registry, UI, audit, and persistence contract.

## Firewall And Persistence Boundary

The symbolic firewall remains permissive by design:

- It warns, scores, annotates, and persists claim-level trust metadata for inspectable JSON responses.
- It does not reject free-form generated text solely because provenance is incomplete.
- The new tool-run artifact model allows raw text, structured output, context dumps, and firewall reports to be stored together without over-constraining generated artifacts.

## Validation Added

- `tests/unit/lib/ontology/registry.test.ts`
- `tests/unit/lib/graph/workbench-case-graph.test.ts`
- `tests/unit/lib/tools/marketplace.test.ts`
- `tests/unit/lib/tools/run-artifact.test.ts`
- `scripts/audit-ontology-mapping.ts`
- `scripts/audit-tool-marketplace.ts`
- `scripts/audit-graph-viewer-uniqueness.ts`

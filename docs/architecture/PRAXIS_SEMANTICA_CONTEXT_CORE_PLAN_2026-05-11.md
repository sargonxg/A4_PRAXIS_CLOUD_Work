# PRAXIS Semantica Context Core Plan - 2026-05-11

## Decision

Use Semantica as the semantic-layer target for Context Core creation, but keep it behind a service boundary. PRAXIS should emit a compact Semantica-compatible context graph when a situation context is created. The Next.js app should not install Semantica's Python, transformer, vector, and graph dependencies directly.

Semantica is a strong fit for the Context Core because its public repository is explicitly centered on context graphs, ontology reasoning, provenance, conflict detection, entity resolution, semantic retrieval, and explainable AI workflows. Those are exactly the missing bridge between a user-created situation frame and a reliable Ask PRAXIS workbench.

## Implemented MVP Layer

The current creation path now emits:

- `semanticaLayer`: the adapter metadata and future service boundary.
- `semanticaContextGraph`: a portable JSON graph seed with entities, relationships, provenance, quality checks, and intended Semantica capabilities.

The graph seed is generated in `src/lib/semantica/context-core-adapter.ts` and attached by the real authenticated creation surface at `src/app/app/situations/new/page.tsx`. The `/api/situations` route sanitizes graph shape and size before persistence.

## Context Core Mapping

| PRAXIS concept | Semantica-ready representation |
| --- | --- |
| Situation Context Core | `context_core` entity |
| User Core / workflow | `user_core` and `work_ontology` entities |
| Domain lens | `domain_ontology` entity |
| Case type | `case_type` entity |
| Four-field frame | `frame_statement` entities |
| User-to-context binding | `scoped_by_user_core` relationship |
| Ontology selection | `has_domain_ontology`, `has_primary_ontology`, `has_work_ontology` relationships |

## Integration Stages

1. Adapter seed, now: every new Context Core produces a Semantica-compatible graph seed without adding runtime service dependencies.
2. Persistence, now: the sanitized seed is stored on the situation document so Ask PRAXIS and workers can find the same context root.
3. Enrichment worker, next: run Semantica as a Python or REST service that accepts the seed, resolves entities, detects conflicts, expands ontology links, and returns an enriched graph.
4. Ask PRAXIS retrieval, next: include enriched graph slices in context assembly so answers can cite frame, ontology, actor, event, claim, and source provenance.
5. Tool suggestion engine, next: use graph health and missing-node classes to recommend source research, graph mapping, memo drafting, scenario analysis, or review actions.
6. Governance, always: keep owner scoping in PRAXIS, avoid provider leakage, cap graph payloads, and treat Semantica output as advisory unless backed by source receipts.

## Service Boundary

Preferred runtime shape:

- PRAXIS Next.js app: creates, validates, stores, and reads graph seeds.
- Rust semantic core: fast deterministic validation and future graph-normalization kernels.
- Semantica worker/API: performs heavy Python graph and ML work.
- Firestore/Graph backend: stores owner-scoped graph state and provenance.
- Ask PRAXIS: consumes the prepared graph context through the existing context-provider path.

This avoids shipping transformer, FAISS, Torch, and Python graph dependencies inside the user-facing web runtime while still letting PRAXIS use Semantica's strongest capabilities.

## Next Build Queue

1. Add a server-side enrichment job that sends `semanticaContextGraph` to a Semantica REST/MCP service when credentials and runtime are configured.
2. Put `rust/semantica-core` in front of that worker for high-speed graph validation and orphan-edge detection.
3. Store enriched entities and relationships in the existing situation graph path with provenance receipts.
4. Add a Context Core health panel showing frame completeness, ontology coverage, unresolved entities, source gaps, and suggested next tools.
5. Feed graph health into Ask PRAXIS so the command plane can recommend the next action from what the user wrote.
6. Add an end-to-end test that creates a context, reloads the workbench, and confirms the context graph seed remains available.

Related acceleration plan:

- `docs/architecture/PRAXIS_RUST_ACCELERATION_PLAN_2026-05-11.md`

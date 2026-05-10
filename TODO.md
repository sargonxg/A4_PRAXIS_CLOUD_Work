# PRAXIS TODO

Last updated: 2026-05-10 (v4 cleanup pass).

This file is a thin pointer. The previous 833-line session-log TODO is archived
at `docs/_archive/2026-05-pre-v4/TODO_pre_v4.md`.

## Where current work lives

- **Vision and product model:** `docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md`.
- **Active simplification slices:** `docs/v7/STATUS.md` and `docs/v7/SLICES/`. All slices are still `proposed`; Slice 1 (foundations) is the entry point and needs Giulio sign-off before implementation.
- **Architecture invariants:** `docs/architecture/PRAXIS_ARCHITECTURE.md`.
- **What's actually shipped:** `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`.
- **Live blockers:** `BLOCKERS.md`.
- **Last validation evidence:** `STATUS.md` and `BUILD_LOG.md`.

## Immediate next steps

1. Giulio reviews and signs off on the four v4 ADRs (proposed status):
   - `docs/adr/0037-user-models-as-first-class-versioned-artifacts.md`
   - `docs/adr/0038-two-context-product-model-on-dual-ontology-layer.md`
   - `docs/adr/0039-seven-logical-graphs-one-user-facing-graph.md`
   - `docs/adr/0040-twelve-named-llm-graph-interaction-patterns.md`
2. Giulio approves v7 Slice 1 (`docs/v7/SLICES/01_foundations_experience_map.md`) to move from `proposed` to `in-progress`.
3. Once both above are unblocked, the next agent picks Slice 1's acceptance criteria and ships behind a feature flag.

## Standing rules

- Do not implement v7 slices marked `proposed` without explicit approval.
- Do not flip the model matrix to Gemini 3 without setting `PRAXIS_ALLOW_GEMINI3_TARGETS=1` and verifying Vertex availability.
- Do not touch the security boundaries listed in `CLAUDE.md`.
- Cognee stays disabled-first in production.

## v4-readiness audit suite

`npm run audit:v4-readiness` runs eight failing stubs that block the v4 phases
they correspond to. They are intentionally noisy until each phase ships.

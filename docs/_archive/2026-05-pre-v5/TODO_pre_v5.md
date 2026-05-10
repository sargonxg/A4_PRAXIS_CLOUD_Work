# Archived TODO Before v5 Phase 0

Archived on: 2026-05-10
Reason: Phase 0 trims root `TODO.md` to the v5 build plan and live blockers.

```md
# PRAXIS TODO

Last updated: 2026-05-10.

## Where current work lives

- **Vision and product model:** `docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md`.
- **Active simplification slices:** `docs/v7/STATUS.md` and `docs/v7/SLICES/`. All slices are still `proposed`; Slice 1 (foundations) is the entry point and needs Giulio sign-off before implementation.
- **Architecture invariants:** `docs/architecture/PRAXIS_ARCHITECTURE.md`.
- **What's actually shipped:** `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`.
- **Live blockers:** `BLOCKERS.md`.
- **Last validation evidence:** `STATUS.md` and `BUILD_LOG.md`.

## Immediate next steps

1. Giulio approves v7 Slice 1 (`docs/v7/SLICES/01_foundations_experience_map.md`) to move from `proposed` to `in-progress`.
2. Next agent ships Slice 1 behind a feature flag.

## Standing rules

- Do not implement v7 slices marked `proposed` without explicit approval.
- Do not flip the model matrix to Gemini 3 without setting `PRAXIS_ALLOW_GEMINI3_TARGETS=1` and verifying Vertex availability.
- Do not touch the security boundaries listed in `CLAUDE.md`.
- Cognee stays disabled-first in production.

## Repo Shape And Next-Round Readiness

This file is checked by `npm run audit:repo-shape`. The markers below are
required so the audit recognises this file as the canonical TODO.

- **graphify**: knowledge graph at `graphify-out/`. Run `graphify update .` after code edits to keep it current.
- **Knip**: dead-export detection. Not currently in `audit:gate`; run on demand when chasing unused exports.
- **audit:architecture-reference**: enforces that startup docs link to `docs/architecture/PRAXIS_ARCHITECTURE.md` and `PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`. Both are referenced via the v7 / context-core trinity above.
```

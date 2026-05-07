# PRAXIS One-Page Docs Update

Date: 2026-05-07

## What Changed

- Added `docs/architecture/PRAXIS_ONE_PAGE.md` as the concise product and architecture reference.
- Linked the one-page reference from `README.md` and `docs/implementation/WORKSPACE_TABS_CHAPTERS_FOUNDATION.md`.
- Updated `docs/architecture/WORKBENCH_SURFACES.md` to describe the real four-tab/seven-chapter workbench instead of the older twelve-tab wording.
- Extended `npm run audit:workbench` so the one-page reference and updated surface model are checked.

## What The One-Page Reference Covers

- What PRAXIS allows users to do.
- The current app architecture and code ownership split.
- How user context differs from situation context.
- How policy/conflict situation context is created.
- How raw information becomes source receipts, chunks, ACO candidates, graph nodes, research threads, memos, drafts, ACH matrices, tool runs, and boardroom briefings.
- The honest remaining production dependencies: live Cognee execution, production migrations, browser e2e expansion, and deeper advanced editing loops.

## Verification

- `npm run audit:workbench`
- `npm run audit:workspace-tabs-chapters`
- `npm run audit:architecture-reference`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `graphify update .`

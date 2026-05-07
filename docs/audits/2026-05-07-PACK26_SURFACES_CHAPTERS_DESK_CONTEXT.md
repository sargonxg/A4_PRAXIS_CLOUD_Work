# Pack 26 Surfaces Audit - Chapters, Desk, Context

Date: 2026-05-07
Prompt source: `docs/codex-prompts/PRAXIS_CODEX_26_SURFACES_CHAPTERS_DESK_CONTEXT.md`

## Baseline

- Chapters existed, but user-created cases without hand-written case modules fell back to generic placeholder paragraphs.
- Desk existed only as a generic workbench tab panel with risk/source/node metrics.
- Context Studio existed only as a generic panel and did not expose editable scope, open questions, or source-scope controls.
- Tool execution, memos, graph, boardroom, ontology, and SAT surfaces were already routed through the consolidated workbench shell.

## Implemented in this pass

- Added a shared surface derivation helper: `src/lib/workbench/surface-state.ts`.
- Added explicit Pack 26 chapter-layer metadata: `src/lib/workbench/chapter-content-layer.ts`.
- Replaced generic chapter fallback content with structured case-aware content for all five chapters.
- Replaced the Desk placeholder with an operating desk showing what changed, next actions, stale-context advisories, and open questions.
- Split Desk into the four requested command-center panels: What Changed, Next Best Actions, Stale Context, and Open Questions.
- Added owner-scoped Open Questions API and UI creation path under `users/{uid}/situations/{caseId}/open-questions`.
- Replaced the Context placeholder with a scope editor, AI scope advisory, source preferences, document-upload handoff, actor/claim/interest refinement, open questions, and authenticated context-scope save API with audit entries.
- Updated `scripts/audit-workbench.ts` so Pack 26 regressions are caught by static audit.
- Preserved the Pack 26 prompt under `docs/codex-prompts/` and extended `audit:codex-prompts`.

## Remaining work

- Agent Engine subagents for `chapter_suggester`, `desk_advisor`, and context re-genesis.
- Non-destructive re-genesis job orchestration and owner-scoped audit trail.
- Review-queue promotion API for graph proposals created from Context Studio.
- Browser-backed real synthetic-user e2e that creates a brand-new case and verifies the three surfaces against user-owned data.

## Implemented In Third Pass

- Added Pack 26 ADRs: `0040-chapters-layered-content-rendering.md` and `0041-desk-command-center-contract.md`.
- Added dedicated Playwright specs for Chapters, Desk, and Context:
  - `tests/e2e/workbench/chapters-structured-content.spec.ts`
  - `tests/e2e/workbench/desk-command-center.spec.ts`
  - `tests/e2e/workbench/context-scope-studio.spec.ts`
- Added the canonical workbench surface reference at `docs/architecture/WORKBENCH_SURFACES.md`.

## Status

Third app-facing pass complete. Context scope and open questions now have owner-scoped APIs and dedicated browser specs; Agent Engine subagents, full re-genesis orchestration, and review-queue promotion remain explicitly tracked.

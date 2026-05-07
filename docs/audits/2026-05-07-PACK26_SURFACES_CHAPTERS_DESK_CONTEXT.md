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
- Replaced generic chapter fallback content with structured case-aware content for all five chapters.
- Replaced the Desk placeholder with an operating desk showing what changed, next actions, stale-context advisories, and open questions.
- Replaced the Context placeholder with a scope editor, source URL draft area, actor/claim candidate summary, advisory questions, and a clear local-draft storage contract.
- Updated `scripts/audit-workbench.ts` so Pack 26 regressions are caught by static audit.
- Preserved the Pack 26 prompt under `docs/codex-prompts/` and extended `audit:codex-prompts`.

## Remaining work

- Durable Firestore/Postgres persistence for Context Studio scope edits.
- Agent Engine subagents for `chapter_suggester`, `desk_advisor`, and context re-genesis.
- Non-destructive re-genesis job orchestration and owner-scoped audit trail.
- Review-queue promotion API for graph proposals created from Context Studio.
- Browser-backed user-case e2e that creates a brand-new case and verifies the three surfaces against user-owned data.

## Status

First safe app slice complete. Backend and Agent Engine work remains explicitly tracked in the Pack 26 backlog.

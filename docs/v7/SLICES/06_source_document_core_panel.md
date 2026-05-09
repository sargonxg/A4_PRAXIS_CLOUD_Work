# Slice 06 - Source/Document Core Panel

**State:** in-progress
**Brief:** 01, 03
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** Slice 00, Slice 01, Slice 02, Slice 05
**Blocks:** Ask retrieval attachments, Source Scout consolidation, Output citation posture
**Estimated size:** S (under 200 LOC functional surface, plus audit/docs)

---

## Goal in one sentence

Make Source and Document Cores visible inside the Cores Library with receipts, upload/extraction/index status, coverage gaps, and Source Scout as an in-context action.

---

## In scope

- [x] Add `V7SourceDocumentCorePanel` under `src/components/v7/`.
- [x] Render the panel inside `V7CoresSurface`.
- [x] Show source receipts from the active Situation's `sourceUrls` and `customSources`.
- [x] Show document count and candidate indexing posture from the active Situation.
- [x] Show upload pipeline steps: receipt saved, text extracted, indexed for retrieval.
- [x] Show coverage gaps by actors, events, and claims.
- [x] Keep "Run Source Scout" and "Add source or document" as Cores Library actions.
- [x] Add `audit:v7-source-document-core-panel`.
- [x] Wire the audit into `audit:gate` and `audit:architecture-chain`.
- [x] Extend the v7 Playwright smoke for the panel.

## Out of scope

- New upload API.
- New extraction worker.
- New pgvector/Cognee indexing implementation.
- Inline source editor autosave.
- Runtime writes to `cores`, `source_receipts`, or document tables.

## Acceptance criteria

- [x] Cores Library renders a Source/Document Core panel.
- [x] The panel shows source receipts, upload/extraction/index posture, and coverage gaps.
- [x] Source Scout appears as a Cores Library action, not a top-level destination.
- [x] Disabled Cognee mode still has neutral source/document wording.
- [x] `npm run audit:v7-source-document-core-panel` passes.
- [x] `npm run audit:v7-cores-surface` passes.
- [x] `npm run audit:v7-shell-skeleton` passes.
- [x] `npm run audit:architecture-chain` passes.
- [x] `npx tsc --noEmit` passes.
- [x] `npm run lint` passes with existing warnings only.
- [x] `npm run build` passes.
- [x] Flag-on Playwright smoke passes.

## Rollback

Delete `src/components/v7/v7-source-document-core-panel.tsx` and `scripts/audit-v7-source-document-core-panel.ts`; remove the panel from `V7CoresSurface`; remove the audit from `package.json`, `audit:gate`, and `audit-architecture-chain`; revert the v7 Playwright smoke assertion.

## Open questions

- [ ] Should this panel mount the legacy `LibraryTab` directly or keep linking to it until v7 upload writes are ready? Default: link to existing live workbench until the ingest contract is unified.
- [ ] Which table is the final source of truth for v7 Source Core receipts before cutover? Default: preserve current source receipt paths until the backend substrate slice is scheduled.

## Notes for Codex

This slice improves user comprehension and navigation. It does not claim that v7 source/document persistence or retrieval indexing is complete.

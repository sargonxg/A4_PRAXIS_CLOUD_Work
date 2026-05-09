# Slice 05 - Cores Library Surface

**State:** in-progress
**Brief:** 01, 03
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** Slice 00, Slice 01, Slice 02, Slice 03, Slice 04
**Blocks:** Source/Document Core consolidation, Analyst Skills routing, Cutover
**Estimated size:** M (200-600)

---

## Goal in one sentence

Replace the generic `/app/cores` placeholder with a real, plain-language Cores Library surface that folds Situation, Sources, Graph/Ontology, Analyst Skills, and specialist panels into one guided destination.

---

## In scope

- [x] Add `V7CoresSurface` under `src/components/v7/`.
- [x] Render `/app/cores` with the new surface.
- [x] Render compatibility routes `/app/situation`, `/app/sources`, and `/app/advanced` into the same surface with route-specific entry framing.
- [x] Show the seven-chapter Situation spine: Stakeholders, Stakes, Episodes, Hypotheses, Tried & Failed, Open Threads, Counsel.
- [x] Show Context Cores from the existing `CONTEXT_CORES` registry.
- [x] Show source/document/graph grounding panels that link to the existing live workbench surfaces.
- [x] Show Ask-ready context repair workflows from the existing agentic workflow registry.
- [x] Show specialist panels for Graph, Ontology, Analyst Skills, ACH, Boardroom, and Settings without making them primary navigation.
- [x] Add `audit:v7-cores-surface`.
- [x] Wire the new audit into `audit:gate` and `audit:architecture-chain`.
- [x] Extend the v7 Playwright smoke to check the real Cores surface.

## Out of scope

- Rewriting the legacy workbench tabs.
- Source/document ingestion consolidation.
- Runtime writes to `cores` or `ask_threads`.
- Drag-and-drop core attachment.
- Removing compatibility routes.
- Production flag cutover.

## Acceptance criteria

- [x] `/app/cores` renders `V7CoresSurface`.
- [x] `/app/situation`, `/app/sources`, and `/app/advanced` render into `V7CoresSurface`.
- [x] The surface explains the seven-chapter policy model in plain language.
- [x] The surface displays User, Team, Situation, Source, Document, Graph, Output, and PRAXIS cores from the registry.
- [x] The surface links to existing live panels rather than duplicating them.
- [x] `npm run audit:v7-cores-surface` passes.
- [x] `npm run audit:v7-shell-skeleton` passes.
- [x] `npm run audit:architecture-chain` passes.
- [x] `npx tsc --noEmit` passes.
- [x] `npm run lint` passes with existing warnings only.
- [x] `npm run build` passes.
- [x] Flag-on Playwright smoke passes.

## Rollback

Delete `src/components/v7/v7-cores-surface.tsx` and `scripts/audit-v7-cores-surface.ts`; restore `/app/cores`, `/app/situation`, `/app/sources`, and `/app/advanced` to `V7DestinationPage`; remove `audit:v7-cores-surface` from `package.json`, `audit:gate`, and `audit-architecture-chain`; revert the v7 Playwright smoke assertion.

## Open questions

- [ ] Should compatibility routes redirect to `/app/cores?panel=...` or keep rendering entry-specific copy until cutover? Default: render entry-specific copy while the v7 flag is false by default.
- [ ] Should Specialist panels eventually mount inline under Cores, or remain links to legacy routes until each panel has a v7 wrapper? Default: link to existing live panels until Source/Document consolidation lands.

## Notes for Codex

This slice is a user-facing simplification layer. It preserves all existing deeper functionality by linking to current routes and wrappers; it does not claim the Cores runtime persistence path is complete.

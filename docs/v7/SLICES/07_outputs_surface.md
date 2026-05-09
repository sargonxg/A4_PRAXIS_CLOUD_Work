# Slice 07 - Outputs Surface

**State:** in-progress
**Brief:** 01, 04
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** Slice 00, Slice 01, Slice 02, Slice 03, Slice 04
**Blocks:** Output Core writer, export e2e, cutover
**Estimated size:** M (200-600)

---

## Goal in one sentence

Replace the generic `/app/outputs` placeholder with a simple output-production surface for memos, briefs, handovers, talking points, and export posture.

---

## In scope

- [x] Add `V7OutputsSurface` under `src/components/v7/`.
- [x] Render `/app/outputs` with the new surface.
- [x] Show templates for Handover, Decision brief, Policy memo, and Talking points.
- [x] Show My outputs buckets for memos, briefs, drafts, talking points, board packs, and exports.
- [x] Show a plain-language provenance posture: claim coverage, citation resolution, and export formats.
- [x] Reuse existing output routes and Ask entry points rather than inventing a new editor.
- [x] Add `audit:v7-outputs-surface`.
- [x] Wire the new audit into `audit:gate` and `audit:architecture-chain`.
- [x] Extend the v7 Playwright smoke to check the real Outputs surface.

## Out of scope

- New Output Core persistence.
- New export pipeline.
- Memo/Draft/Briefing editor rewrites.
- Claim-level citation enforcement in generated documents.
- Production flag cutover.

## Acceptance criteria

- [x] `/app/outputs` renders `V7OutputsSurface`.
- [x] The surface presents the four core output templates in plain language.
- [x] The surface explains provenance before final polish.
- [x] The surface links to existing Ask/editor/export paths instead of duplicating them.
- [x] `npm run audit:v7-outputs-surface` passes.
- [x] `npm run audit:v7-shell-skeleton` passes.
- [x] `npm run audit:architecture-chain` passes.
- [x] `npx tsc --noEmit` passes.
- [x] `npm run lint` passes with existing warnings only.
- [x] `npm run build` passes.
- [x] Flag-on Playwright smoke passes.

## Rollback

Delete `src/components/v7/v7-outputs-surface.tsx` and `scripts/audit-v7-outputs-surface.ts`; restore `/app/outputs` to `V7DestinationPage`; remove `audit:v7-outputs-surface` from `package.json`, `audit:gate`, and `audit-architecture-chain`; revert the v7 Playwright smoke assertion.

## Open questions

- [ ] Should the first runtime writer be memo-first or handover-first? Default: handover-first because it best demonstrates the rotation-tax thesis.
- [ ] Should v7 final-output gating block export until 100% citation coverage or warn and allow export? Default: warn and allow draft export; require full coverage only for final.

## Notes for Codex

This slice makes Outputs legible and useful as a destination, but it does not claim that the v7 Output Core persistence layer or export gates are finished.

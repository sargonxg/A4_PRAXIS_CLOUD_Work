# Slice 03 - Home Surface Preview

**State:** in-progress
**Brief:** 01
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** Slice 00, Slice 01, Slice 02
**Blocks:** Ask end-to-end, Cores Library, Outputs
**Estimated size:** S (<= 200 LOC)

---

## Goal in one sentence

Replace the generic `/app/home` placeholder with a real v7 Home preview that makes the first user action obvious: pick the active Situation, ask PRAXIS, inspect attached cores, and continue to Cores or Outputs.

---

## In scope

- [x] Add `src/components/v7/v7-home-surface.tsx`.
- [x] Render `V7HomeSurface` from `/app/home`.
- [x] Show active Situation, Ask PRAXIS CTA, context-core readiness chips, next actions, recent navigation to Cores/Outputs, and New Situation.
- [x] Keep the current dashboard and workbench unchanged.
- [x] Extend `audit:v7-shell-skeleton` so `/app/home` cannot regress to the generic placeholder.
- [x] Extend the v7 Playwright smoke to check the real Home surface and mobile nav.
- [x] Update `STATUS.md`, `FIX_LOG.md`, `CHANGELOG.md`, and `V7_EXECUTION_TODO.md`.

## Out of scope

- Ask thread persistence.
- Backend `ask_threads` migrations.
- Cores Library editor implementation.
- Output drafting/export changes.
- Any auth, Firestore, RLS, Cognee, model routing, or production flag cutover.

## Acceptance criteria

- [x] `/app/home` renders a real Home surface behind the v7 flag.
- [x] Home exposes one clear Ask PRAXIS action.
- [x] Home links to `/app/cores`, `/app/outputs`, and the current workbench.
- [x] `npm run audit:v7-shell-skeleton` passes.
- [x] `npm run audit:experience-map-coherence` passes.
- [x] `npx tsc --noEmit` passes.
- [x] `npm run build` passes.
- [x] `PRAXIS_V7_BACKEND=true NEXT_PUBLIC_PRAXIS_V7=true` Playwright smoke passes.

## Rollback

Revert `src/app/app/home/page.tsx` to `V7DestinationPage areaId="home"`, delete `src/components/v7/v7-home-surface.tsx`, and remove the Home-specific assertions from `audit:v7-shell-skeleton` and `tests/e2e/v7-shell-smoke.spec.ts`.

## Open questions

- [ ] Should Home pull next actions from a persisted orchestration queue or derive them from local context until Ask lands? Default: derive locally until Ask threads exist.

## Notes for Codex

This is still a preview surface. It proves the user-facing shape without pretending that Ask thread persistence or Cores Library editing is done.

2026-05-09 update: `docs/v7/build/01_THE_NEW_FACE.md` is now the concrete visual execution layer for this surface. The Home preview has been tightened from a dashboard-style card into an Ask-first launcher with attached Core chips, a focused multiline Ask bar, mode strip, starter skill cards, missing-context rail, and query handoff into `/app/ask`.

# PRAXIS v7 Block 2 Audit - Homepage Is Generic

Date: 2026-05-09
Branch: `inspect/v7-block2-generic-home`
Scope: INSPECT Block 2 only.

## Evidence

| Check | Result | Evidence |
|---|---|---|
| `/app/home` route exists | Pass | `src/app/app/home/page.tsx` renders `V7HomeSurface`. |
| Fresh home is generic | Pass | `docs/v7/build/SCREENSHOTS/v7-block2-home-empty-desktop.png`; text includes `No Situation selected`, `Pick or create a Situation Core to start`, User Core only, disabled tools, `Pick a Situation to see gaps`, empty Recent card. |
| Mobile empty state | Pass | `docs/v7/build/SCREENSHOTS/v7-block2-home-empty-mobile.png` at 380px. |
| Hardcoded home case names | Pass | `rg -n "Syria|syria|demoSituationFallback|Open demo Situation" src/app/app/home src/components/v7 -S` returned no matches. |
| Seeded examples | Pass in code | Added idempotent migration `backend/migrations/versions/0023_seeded_examples.py` with 10 platform example Situation Cores covering 9 ontologies plus methodology/rubric cores. Production DB was not mutated in this block. |
| Single attach state | Pass | `docs/v7/build/SCREENSHOTS/v7-block2-home-single-attach.png` after mocked local Core create. |
| Multi-attach state | Pass | `docs/v7/build/SCREENSHOTS/v7-block2-home-multi-attach.png`; warning visible: `Two Situations attached — answers will reference both.` |
| Multi-attach handoff | Pass | Browser URL after submit: `/app/ask/home-...?situationId=local-core-2&attachedCoreIds=local-core-2%2Clocal-core-1`. |
| Lighthouse desktop | Pass | Local Lighthouse run: performance 86, FCP 0.3s, LCP 2.3s, CLS 0. The large JSON report was not committed; metrics are recorded here. |

## Fixes Landed

- Made `/app/home` generic by default: no automatic first Situation fallback and no demo case fallback.
- Changed default chips to User Core only; Situation chips appear only after attachment.
- Added prominent `+ attach core` link to `/app/cores?examples=1`.
- Disabled Ask and tool cards until a Situation Core is active.
- Added generic primary/secondary CTAs: `Open a seeded Situation` and `Create new Situation`.
- Added narrow multi-attach handling in Home and handoff into `/app/ask/[threadId]`.
- Added `audit:v7-home-shape` and wired it into `audit:gate` and `audit:architecture-chain`.
- Added migration `0023_seeded_examples.py` for diverse platform examples.

## Verification

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npm run lint` | Pass with existing warnings only |
| `npm run build` | Pass |
| `npm run audit:v7-home-shape` | Pass |
| `npm run audit:v7-shell-skeleton` | Pass |
| `npm run audit:v7-inline-cores` | Pass |
| `python -m py_compile backend\migrations\versions\0023_seeded_examples.py` | Pass |
| `npx vitest run` | Pass: 153 files, 594 tests |
| `npm run audit:gate` | Fails before this block's audit at existing `audit:ai-provider-isolation` findings in `src/app/api/backend/[...path]/route.ts`, `src/components/v7/v7-core-drawer.tsx`, and `src/components/v7/v7-user-core-editor.tsx`. Parked for Block 6. |

## Parked Findings

- HIGH: Full first-class Cores picker, drag/drop, reorder persistence, and seeded-core browsing remain Block 3.
- HIGH: Real Ask runtime comparative answer over two Situation Cores remains Block 4; this block only proves URL/core-id handoff.
- HIGH: Production seeded examples require migration deployment; this block only adds the idempotent migration.
- MEDIUM: `audit:gate` remains blocked by provider-isolation drift owned by Block 6.

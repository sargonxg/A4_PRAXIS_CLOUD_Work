# PRAXIS cleanup plan

Generated 2026-05-08 from main @ 817b7eb54402c0ea7aea0a40c252eb2d4ec2dc4e. This is a plan, not an executed deletion.

## Tier 1 - review then execute first

| # | action | item | est. lines | risk | evidence |
|---|---|---|---|---|---|
| 1 | move to docs/archive or delete after visual regression | src/components/landing/_archive/* | 1243 | low-to-medium | 02-graphs/orphan-modules.md |
| 2 | delete if superseded by current gate audits | scripts/audit-phase3-product-surface.ts | 31 | low-to-medium | 03-dead-code/unused-files.md |
| 3 | delete if superseded by audit-ai-routes.mjs | scripts/audit-routes.ts | 61 | low-to-medium | 03-dead-code/unused-files.md |
| 4 | delete if no package script/history needs it | scripts/audit-spine.ts | 60 | low-to-medium | 03-dead-code/unused-files.md |
| 5 | delete or archive after current route audit covers it | scripts/audit-verb-hookup.ts | 45 | low-to-medium | 03-dead-code/unused-files.md |
| 6 | remove if map components no longer type-import Leaflet | dep @types/leaflet | n/a | low-to-medium | 03-dead-code/unused-deps-frontend.md |
| 7 | remove if markdown highlighter not runtime used | dep rehype-highlight | n/a | low-to-medium | 03-dead-code/unused-deps-frontend.md |
| 8 | remove or wire actual Cloud Tasks producer | dep @google-cloud/tasks | n/a | low-to-medium | 03-dead-code/unused-deps-frontend.md |
| 9 | remove if no popover component uses it | dep @radix-ui/react-popover | n/a | low-to-medium | 03-dead-code/unused-deps-frontend.md |
| 10 | keep archived but exclude from active product docs search/navigation | legacy docs in docs/_archive | 26502 | low-to-medium | 03-dead-code/unused-files.md |

## Tier 2 - consolidate after Tier 1 is green

| # | action | item | est. effort | risk | evidence |
|---|---|---|---|---|---|
| T2-1 | extract shared route executor | repeated calibrated AI route structure | 1-2 evenings | medium | 04-duplications/code-clones.md |
| T2-2 | merge helper logic | boardroom mutation routes | half day | low | 04-duplications/code-clones.md |
| T2-3 | canonicalize labels | Agent Engine subagent claims if C2 Option B | half day | low | 05-hotspots/lying-labels.md |
| T2-4 | consolidate route docs | public/internal API docs | half day | low | 06-surface-area/undocumented-routes.md |
| T2-5 | split large modules | largest AI/workbench/dashboard files | multi-PR | medium | 05-hotspots/oversized-files.md |

## Tier 3 - GC decisions

- B0-B3: pick and approve Postgres KG cutover case before dual-write or read-path cleanup.
- C0/C1: deploy Cognee service before exposing memory recall in calibration.
- C2: deploy Agent Engine artifacts or rename subagent labels to calibrated pipeline.
- Marketplace run route: keep as compatibility, or return 410 once no consumers remain.
- Archived landing/components: delete, move to docs archive, or keep as heritage assets.

## Tier 4 - investigate, do not act

See 08-unknowns.md.

## Estimated impact

If Tier 1 and Tier 2 ship after review: remove or archive thousands of non-runtime lines, remove several candidate dependencies, reduce route-helper duplication, and make the public/internal API map easier to reason about. Exact bundle/build impact must be measured after each cleanup PR.

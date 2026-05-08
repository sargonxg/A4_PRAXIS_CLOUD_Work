# PRAXIS cleanup plan

Generated 2026-05-08 from main @ 817b7eb54402c0ea7aea0a40c252eb2d4ec2dc4e. This started as a plan; execution notes are captured in `10-cleanup-execution.md`.

## Tier 1 - review then execute first

| # | action | item | est. lines | risk | evidence |
|---|---|---|---|---|---|
| 1 | retained intentionally; README added | src/components/landing/_archive/* | 1243 | low-to-medium | Pack 04 asked to preserve retired landing components |
| 2 | removed from active tree; retained marker evidence | scripts/audit-phase3-product-surface.ts | 31 | low-to-medium | 03-dead-code/unused-files.md |
| 3 | removed from active tree; retained marker evidence | scripts/audit-routes.ts | 61 | low-to-medium | 03-dead-code/unused-files.md |
| 4 | removed from active tree; retained marker evidence | scripts/audit-spine.ts | 60 | low-to-medium | 03-dead-code/unused-files.md |
| 5 | removed from active tree; retained marker evidence | scripts/audit-verb-hookup.ts | 45 | low-to-medium | 03-dead-code/unused-files.md |
| 6 | removed after active import check | dep @types/leaflet | n/a | low-to-medium | 03-dead-code/unused-deps-frontend.md |
| 7 | removed after active import check | dep rehype-highlight | n/a | low-to-medium | 03-dead-code/unused-deps-frontend.md |
| 8 | removed after active import check; Cloud Tasks remains architectural, package should return with first producer | dep @google-cloud/tasks | n/a | low-to-medium | 03-dead-code/unused-deps-frontend.md |
| 9 | removed after active import check | dep @radix-ui/react-popover | n/a | low-to-medium | 03-dead-code/unused-deps-frontend.md |
| 10 | removed from active tree; recoverable from git history | legacy docs in docs/_archive | 26502 | low-to-medium | 03-dead-code/unused-files.md |

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

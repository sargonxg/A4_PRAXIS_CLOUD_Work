# Cleanup Execution - 2026-05-08

This pass applies the first safe cleanup tranche from the comprehensive codebase audit while preserving current and planned PRAXIS functionality.

## Archived From Active Scripts

The following historical phase audits were moved from `scripts/` to `docs/_archive/audit-scripts/2026-05-08/` and renamed to `.ts.txt` so they remain readable but are excluded from TypeScript compilation:

- `audit-phase3-product-surface.ts.txt`
- `audit-routes.ts.txt`
- `audit-spine.ts.txt`
- `audit-verb-hookup.ts.txt`

Reason: these files are not referenced by `package.json` or the active audit gate. Their evidence value is preserved in the archive, while the active script surface now reflects the current gate.

## Retained Intentionally

`src/components/landing/_archive/` was not deleted. Pack 04 explicitly asked to keep retired landing sections in an archive for possible future reuse. A README now marks the folder as intentionally retained and inactive.

## Dependency Cleanup

The cleanup checked active imports before removing dependencies. The active map surface uses `react-map-gl/maplibre`; the old Leaflet stack was not imported by active app/backend code.

Removed dependency candidates:

- `@radix-ui/react-popover`
- `rehype-highlight`
- `@google-cloud/tasks`
- `leaflet`
- `react-leaflet`
- `@types/leaflet`

Kept planned/runtime-critical families:

- MapLibre / `react-map-gl`
- Cognee boundary code
- backend routers and services
- graph / KG migration code
- notification services
- archived documentation

## Follow-Up

Next cleanup should consolidate duplicated route plumbing, not delete feature surfaces:

- shared cron secret guard
- shared boardroom route guard
- shared research case validation helper
- shared calibrated AI route executor where the route contracts are stable

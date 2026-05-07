# Pack 29 Visualization Wave Audit

Date: 2026-05-07

## Implemented

- Added `PraxisGraphView` as the canonical four-mode visualization shell.
- Preserved `PraxisGraphCanvas` as the oval SVG default.
- Added lazy-loaded force, timeline, and map projections.
- Wired the visualization shell into the Graph tab and chapter-3 graph content.
- Extended `WorkbenchGraphNode` with optional timeline and geospatial metadata.
- Added license, bundle, and visualization contract audits.
- Added ADR 0046 and the map tile hosting runbook.

## Verification Targets

- `npm run audit:visualization`
- `npm run audit:license-sbom`
- `npm run audit:route-bundle-budget`
- `npm run typecheck`
- `npm run build`
- `npx playwright test tests/e2e/visualization`

## Known Product Boundary

Map coordinates are derived regional anchors unless a graph node carries precise source coordinates. The UI labels this posture so the map remains useful without overstating evidence quality.

# Map Tile Hosting Runbook

Date: 2026-05-07

## Current V1 Posture

PRAXIS uses MapLibre through `react-map-gl/maplibre` for the workbench map projection. The map is an orientation layer for graph nodes; it is not evidence-grade geolocation unless the node carries precise source coordinates.

## Environment

- Preferred tile provider: MapTiler free/dataviz style.
- Runtime variable: `NEXT_PUBLIC_MAPTILER_KEY`.
- Local fallback: MapLibre demo tiles, suitable only for development and public demo orientation.

## Production Setup

1. Create or reuse a MapTiler key scoped to `praxis.tacitus.me`.
2. Add `NEXT_PUBLIC_MAPTILER_KEY` to the frontend runtime environment.
3. Redeploy the frontend.
4. Open `/app/workbench/syria-2026?tab=graph&layout=map` and confirm tile attribution, markers, and popup copy render.

## PMTiles Path

For offline or cost-controlled deployments, host PMTiles in Cloud Storage behind Cloud CDN and replace the MapTiler style URL with a MapLibre style that points at the PMTiles source. Keep public-access prevention and signed release uploads enabled for the bucket.

## Evidence Labels

Derived anchors must remain labelled in the UI. A derived point is acceptable for overview orientation, but generated memos and graph assertions must cite source spans separately.

## Guardrails

- `npm run audit:route-bundle-budget` ensures map libraries stay in lazy graph islands.
- `npm run audit:license-sbom` checks the visualization library license posture.
- `npm run audit:visualization` checks that the map remains wired into the canonical workbench graph view.

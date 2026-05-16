# ADR 0046: Visualization Library Decision Matrix

Date: 2026-05-07

## Status

Accepted

## Context

Pack 29 adds richer graph visualization inside existing PRAXIS workbench surfaces. The product already has a canonical SVG graph canvas, so this wave must extend the same `WorkbenchGraph` rather than create a second graph data model or new top-level routes.

## Decision

PRAXIS will keep `PraxisGraphCanvas` as the canonical oval SVG view and add three lazy-loaded projections behind `PraxisGraphView`:

| Mode | Library | License posture | Why |
| --- | --- | --- | --- |
| Oval | Existing SVG/React | Project code | Stable, accessible, SSR-safe default. |
| Force | `react-force-graph-2d` | MIT | Fast exploratory canvas layout without replacing the canonical graph. |
| Timeline | `vis-timeline` + `vis-data` | MIT/Apache-compatible | Mature chronological projection for dated graph nodes and receipts. |
| Map | `maplibre-gl` + `react-map-gl/maplibre` | BSD-3-Clause | Open map renderer with no Mapbox lock-in. |

All canvas/WebGL-heavy modes are loaded with `next/dynamic(..., { ssr: false })` and guarded by `audit:route-bundle-budget`.

## Consequences

- The Graph tab and chapter-3 graph surface expose the same four-mode toggle.
- `WorkbenchGraphNode` now carries optional `occurredAt` and `geo` fields. Missing precise coordinates can be represented as derived regional anchors and must be labelled as such.
- Production can use `NEXT_PUBLIC_MAPTILER_KEY` for MapTiler tiles. Without that key, MapLibre falls back to demo tiles for non-critical orientation.
- `audit:visualization`, `audit:license-sbom`, and `audit:route-bundle-budget` protect the implementation contract.

## Rejected Options

- Replacing the existing SVG with a single force graph: rejected because Pack 29 explicitly preserves the current SVG and because the SVG remains the most reliable accessible default.
- Creating new visualization routes: rejected because the wave belongs inside existing workbench surfaces.
- Mapbox GL JS: rejected to avoid proprietary lock-in and because MapLibre satisfies the v1 map need.

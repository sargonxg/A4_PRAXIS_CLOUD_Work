# Geospatial Monitor

**ID:** `geospatial-monitor`  ·  **Category:** intelligence  ·  **Status:** PARTIAL

> Map-based view of armed-conflict events for the active situation. Pulls
> ACLED / GDELT / UCDP, geocodes them, clusters into hotspots via DBSCAN,
> overlays a timeline scrubber. Centred on the situation's region.

## Route

- **Page:** `src/app/app/geospatial-monitor/page.tsx`
- **API:** `POST /api/data/geospatial` — `src/app/api/data/geospatial/route.ts`
- **Sidebar:** Intelligence

## Inputs (read)

### From `AnalystProfile`

| Field | Usage |
|---|---|
| `identity.role` | (currently inert — TODO: filter event types by role: a humanitarian sees protection events first, a sanctions analyst sees violations first) |
| `perspective.lenses` | (TODO: weight event severity rendering by selected lenses) |

### From the active `Situation`

| Field | Usage |
|---|---|
| `region` | Used as `country` filter on the geospatial API. Falls back through `regionCenter()` lookup (`src/lib/geo/region-centers.ts`) for the initial map centroid when `geoBoundingBox` is missing. |
| `geoBoundingBox` | If present, derives map centre as `{(north+south)/2, (east+west)/2}`. Highest priority. |
| `id` | Cache key for `useEffect` re-fetch on situation change |

### Live feeds

- **ACLED** (when `ACLED_API_KEY` + `ACLED_EMAIL` set) — event-by-event with
  fatality counts and lat/lng.
- **GDELT** — fallback event signal when ACLED returns empty.
- **UCDP GED** — historical georeferenced events.

## Outputs (persist)

- **Firestore:** _(currently not persisted — Status PARTIAL.)_ Once promoted
  to READY this should write a snapshot of `{ events: [...], hotspots: [...],
  fetchedAt }` under `users/{uid}/situations/{sitId}/tools/geospatial-monitor`
  via `saveToolOutput()` so the map can hydrate hot from cache instead of
  re-fetching ACLED on every mount.
- **Pub/Sub:** none currently.

## Frameworks

- **DBSCAN** clustering (`src/lib/analytics/geospatial-engine.ts`) for hotspot
  detection. Density-based, no preset cluster count, robust to noise.
- **ACLED Event Typology** for event-type rendering and filtering.

## Data sources

- ACLED — events with fatalities, actor names, sub-event types
- GDELT — instability index, mention volume, secondary signal
- UCDP GED — historical events, particularly useful for >12-month windows

## AI model

- _None directly._ The Geospatial Monitor is a data-visualisation tool, not
  an AI tool. AI use happens upstream when a Risk Monitor or Early Warning
  call summarises the same events.

## UX behaviour

- Loads via `useSituationGuard()` and refetches on situation change.
- Map centre logic (after 2026-04-25 fix): bounding box → `regionCenter(region)` → wide default `[10, 30]`.
- Timeline scrubber filters events by date range.
- Hotspot list highlights top-5 clusters by event count + fatality density.

## Extension surface

- **Add support for a new region:** add an entry to `src/lib/geo/region-centers.ts`. Two lines, lat/lng only.
- **Add an event-type filter:** extend the controls strip in the page; filter logic already lives in the page state (see `eventTypeFilter`).
- **Persist + hot-hydrate (PARTIAL → READY):** wrap the page in
  `ToolPageShell` and call `usePersistedToolData('geospatial-monitor', sitId)`.
  Save a snapshot at the end of each successful fetch via `saveToolOutput`.
  Pattern is identical to Risk Monitor (`src/app/app/risk-monitor/page.tsx`).

## Operations

- **Required env vars:** none — works with grounded-search fallback.
- **Recommended env vars:** `ACLED_API_KEY`, `ACLED_EMAIL` for event-level
  precision. See `docs/SPRINT_2026-04-25.md` Stream C for activation.
- **Stale-after:** 24h (registry `staleAfterHours`)
- **Cost characteristics:** ACLED is ~1 req per 12s on the academic tier;
  cache aggressively. The route already uses TTL caching.
- **Common failure modes:** map tile load failures (Leaflet from OSM); ACLED
  rate-limit 429 if cache TTL is too low.

## Open questions / TODO

- Persist outputs (PARTIAL → READY).
- Heatmap layer in addition to clustering.
- Allow per-event-type colour overrides per analyst lens.
- Add direct deep-link from a hotspot to the related actors in
  Stakeholder Map.

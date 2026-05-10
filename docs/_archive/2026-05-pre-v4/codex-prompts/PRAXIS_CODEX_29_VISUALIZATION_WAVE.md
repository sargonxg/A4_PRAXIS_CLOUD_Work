# PRAXIS — Codex Pack 29: Visualization Wave (Force Graph + Timeline + Map)

**File**: `PRAXIS_CODEX_29_VISUALIZATION_WAVE.md`
**Branch**: `feature/visualization-wave`
**Depends on**: Packs 26-28 merged. v1.5.0 tagged. Twelve workbench tabs real. Twelve subagents on Vertex AI Agent Engine. Full 9-ontology stack live.
**Estimated effort**: ~3 days (~25 engineering hours), one day per library.
**Target release**: v1.5.1
**Voice**: Senior frontend engineer who has watched analysts squint at oval SVG diagrams and ask "can I see when this happened?" or "where on the map did this happen?" and known the answer is one production-ready library and a clean integration away. Doesn't add a fourth view to confuse the user; lets each existing surface speak in the visual language that fits its data.

---

## 0. Why this pack exists

After Pack 26-28 closes the twelve workbench surfaces, PRAXIS renders the case graph through `src/components/graph/PraxisGraphCanvas.tsx` — a 166-line SVG component that lays out nodes around an oval table. It works for ≤30 nodes. It breaks down at 50+. Real conflict-and-diplomacy cases routinely produce 60+ Actors, 40+ Claims, 100+ Events. The graph viewer becomes a wall of overlapping circles and the user disengages.

Three categories of data PRAXIS already produces are also under-served by the current rendering:

**Temporal data** — every UCDP event, every ceasefire commitment, every escalation, every memo timestamp — is squashed into the graph viewer's atemporal layout. The user has no way to see "what happened in August" or "when did the coalition shift" without manually scanning. PRAXIS's `Event` and `Commitment` ACO primitives carry timestamps; the graph layout discards them.

**Geographic data** — UCDP-GED events come with lat/lon (Pack 17). Displacement patterns, conflict zones, humanitarian access, sanctions geographies, border disputes — half of conflict-and-diplomacy work is geographic. PRAXIS describes geography textually but cannot show it.

**Large coalition graphs** — pack 21's `governance.coalition-map` and `narrative.disinformation-network-mapper` produce networks of 100-500 nodes naturally. The SVG oval cannot render these legibly.

The OSS sourcing report (Pack 30 dependency) identified three permissively-licensed libraries that close these gaps within a day each:

1. **react-force-graph (MIT, ~2,955★)**: replaces the oval-table SVG with a WebGL/Canvas force-directed renderer that scales to thousands of nodes with built-in zoom/pan/drag/selection. Bundle ~50 KB gzipped (use `react-force-graph-2d`, not the 3D variant which pulls Three.js).
2. **vis-timeline (Apache-2.0 OR MIT, ~196k weekly downloads)**: drop-in interactive timeline with point/range items, groups, drag-to-edit, infinite zoom from millisecond to year. Maps PRAXIS's `Event`/`Commitment` ACO primitives onto items; ontology onto groups.
3. **MapLibre GL JS (BSD-3-Clause)**: GPU-accelerated vector maps, the open-source successor to Mapbox GL JS. Renders UCDP-GED point events, country-level choropleths, GeoJSON country shapes for actor-of-interest highlighting.

Three structural decisions keep this pack disciplined:

**(A) No new top-level tabs.** The existing `Graph` tab gets a toggle ("Oval / Force / Map" — or "Layout" submenu) at the surface level. The `Chapters` tab's chapter-3 (Conflict Graph) gets the same toggle inline. The Timeline becomes a panel inside the existing `Desk` tab's "What Changed" section AND a toggle in the Graph tab; it's not a top-level navigation entry. The Map view appears only when the case has geocoded data; otherwise the toggle is greyed.

**(B) Each library replaces nothing — it sits alongside the existing renderer.** The user picks the visualization that fits the question. The SVG `PraxisGraphCanvas` stays as the default and the small-case view; the force-graph activates for cases ≥30 nodes; the timeline activates when temporal context matters; the map activates when geocoded data exists. No data migration, no schema change.

**(C) All three libraries consume the same `WorkbenchGraph` shape that the existing SVG canvas consumes.** No backend changes. The canvas → force-graph swap is purely a rendering decision; the data fetching is unchanged.

After this pack: the user opens a Sudan case with 80 nodes, switches the Graph tab to "Force layout", drags the network to inspect coalition structure, switches to "Timeline" to see the August escalation, switches to "Map" to see where in West Darfur the events occurred — all from one tab, all from the same data, all without leaving the workbench.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | `react-force-graph-2d` integrated as a sibling to `PraxisGraphCanvas`; new component `PraxisForceGraph.tsx` consumes the existing `WorkbenchGraph` data shape | E2E test: case with ≥80 nodes renders force-directed layout; zoom/pan/drag work; click opens entity panel via existing handler |
| 2 | Visualization toggle inside existing Graph tab and Chapters chapter-3: "Oval", "Force", "Timeline", "Map" — last two greyed when data unavailable | Visual snapshot test of toggle states |
| 3 | `vis-timeline` integrated as `PraxisTimeline.tsx`; renders Event + Commitment + Constraint ACO primitives as items, ontology IDs as groups | E2E: 30-event case renders timeline with grouped tracks; click event opens existing entity panel |
| 4 | `MapLibre GL JS` + `react-map-gl/maplibre` integrated as `PraxisMap.tsx`; renders UCDP-GED point events + GeoJSON country highlights for actors-of-interest | E2E: Sudan case shows ~20 UCDP event dots + Sudan country polygon highlighted |
| 5 | Tile source decision committed: MapTiler free-tier API key as default; PMTiles self-hosted instructions documented | Map renders without runtime errors; documentation in `docs/runbooks/MAP_TILE_HOSTING.md` |
| 6 | All three visualizations correctly use Next.js 16 SSR guards (`'use client'` + `dynamic()` with `ssr: false`) — no hydration errors | Build passes; no console warnings on page load |
| 7 | Bundle impact bounded: `react-force-graph-2d` ~50 KB gz, `vis-timeline` ~70 KB gz, `maplibre-gl` ~250 KB gz; total ~370 KB additional gz across three lazy-loaded routes | Lighthouse CI report shows route-level bundle deltas within budget |
| 8 | Visual snapshot tests for each new component at small (10 nodes), medium (50), large (200) data sizes | Snapshot tests committed |
| 9 | One ADR: 0046 (per-data-shape visualization library decision matrix — when to add WebGL/canvas/SVG, when to defer) | ADR reviewed |
| 10 | License compliance verified: react-force-graph MIT, vis-timeline Apache-2.0 OR MIT, maplibre-gl BSD-3-Clause; SBOM updated | `npm run audit:license-sbom` (extends existing license audit) green |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 29. I understand:
> 1. **No new top-level tabs.** Force, Timeline, and Map are visualization modes accessed from the existing `Graph` tab + the existing `Chapters` chapter-3.
> 2. **No backend changes.** All three libraries consume the existing `WorkbenchGraph` shape from `src/lib/graph/workbench-case-graph.ts`. Map adds geocoded-event filtering on the existing Postgres `graph_nodes` query (events with lat/lon in metadata).
> 3. **The SVG `PraxisGraphCanvas` is preserved unchanged.** Force-graph and timeline are siblings, not replacements. The user picks the layout per case.
> 4. **All three libraries are MIT / Apache-2.0 / BSD-3** — verified in the OSS sourcing report (artifact `compass_artifact_wf-89dfc1f8`). The license audit is extended in this pack to enforce on every CI run.
> 5. **SSR discipline:** every canvas/WebGL component uses `'use client'` + `dynamic(() => import(...), { ssr: false })`. Failure to do so produces hydration errors in Next.js 16.
> 6. **Bundle discipline:** lazy-load each library only on the route(s) that use it. Do not import at top-level.
> 7. **The 9 ontologies × 12 surfaces architecture is unchanged.** This pack adds rendering options inside existing surfaces, not new surfaces.
>
> Open questions for Giulio:
> - **Q1**: Toggle UX — propose: a single dropdown "Layout: [Oval | Force | Timeline | Map]" in the existing graph-tab toolbar; sets state in URL query param `?layout=force` so the choice survives refresh and is shareable. Acceptable, or different UX (e.g., 4 buttons)?
> - **Q2**: When does each layout activate by default? Propose: Oval default for cases <30 nodes; Force default for cases ≥30 nodes; Timeline shown as inline panel on Desk tab regardless; Map button greyed unless case has ≥3 geocoded events. Acceptable?
> - **Q3**: Map tile source — propose: MapTiler free tier as default (requires `NEXT_PUBLIC_MAPTILER_KEY` env var, generous free tier of 100k tile loads/month), with documentation for PMTiles self-hosting via Cloud Storage + Cloud CDN as the production-scale alternative. Acceptable?
> - **Q4**: 3D force-graph — propose: skip; use `react-force-graph-2d` only. The 3D variant pulls Three.js (~600 KB gzipped) for marginal benefit. Acceptable?
> - **Q5**: Run order — propose: Day 1 force-graph, Day 2 timeline, Day 3 map. Each ships independently behind its own toggle state; no dependency between the three. Acceptable?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---:|
| CC1 | Foundations: visualization toggle pattern, SSR/dynamic-import infrastructure, license SBOM extension | 4 |
| CC2 | react-force-graph-2d integration: PraxisForceGraph component, ACO color/icon mapping, hover/click wiring | 8 |
| CC3 | vis-timeline integration: PraxisTimeline component, Event/Commitment/Constraint mapping, group-by-ontology | 7 |
| CC4 | MapLibre GL JS integration: PraxisMap component, UCDP event layer, GeoJSON country highlights | 8 |
| CC5 | ADR + integration tests + bundle audit + verification | 3 |
| **Total** | | **~30** |

---

## 4. Hard rules

- **No new top-level tabs.** Use existing `Graph` tab toggles + existing `Desk` tab inline panel.
- **No data shape changes.** Existing `WorkbenchGraph` is the input contract for all three libraries. Existing Postgres `graph_nodes` query is extended with optional geocoded filter, not redesigned.
- **License floor: MIT / Apache-2.0 / BSD-3-Clause / ISC only.** Any transitive license drift fails CI. Verified per the OSS sourcing report.
- **SSR safety: every canvas/WebGL component uses `dynamic(() => import(...), { ssr: false })`** in Next.js 16. Hydration errors = build fails.
- **Bundle budget: each library lazy-loaded on its route(s) only.** Top-level bundle delta ≤10 KB gz per library.
- **No new graphical primitives.** All three libraries are full visualizations consuming existing data; toggle UI uses existing Card/Button/Dropdown primitives.
- **Existing `PraxisGraphCanvas` SVG renderer preserved unchanged.** It remains the default for small cases.
- **All prior invariants from packs 03-28 hold.**

---

## 5. Prompt CC1 — Foundations: toggle pattern + SSR + license SBOM

### Persona
Frontend architect. Defines the visualization-mode dispatch once.

### Phase 1 — Read & report

- Inspect existing `src/components/graph/PraxisGraphCanvas.tsx` and `src/lib/graph/workbench-case-graph.ts` (already read).
- Inspect existing `WorkbenchTabContent.tsx` Graph dispatch.
- Inspect existing chapter-3 conflict-graph rendering in `src/components/workbench/chapters/structured/ConflictGraphStructured.tsx` (Pack 26 Z2).
- Inspect existing license audit infrastructure (if shipped).
- Output `docs/audits/2026-NN-NN-VISUALIZATION_FOUNDATIONS.md`.

### Phase 2 — Propose & confirm

```ts
// src/types/visualization.ts
export type GraphLayoutMode = 'oval' | 'force' | 'timeline' | 'map';

export interface GraphLayoutCapabilities {
  oval: { available: boolean; reason?: string };
  force: { available: boolean; reason?: string };
  timeline: { available: boolean; reason?: string };
  map: { available: boolean; reason?: string };
}

// src/lib/graph/layout-capability.ts
export function computeLayoutCapabilities(graph: WorkbenchGraph): GraphLayoutCapabilities {
  const eventNodeCount = graph.nodes.filter(n => n.primitive === 'Event' || n.primitive === 'Commitment').length;
  const geocodedNodeCount = graph.nodes.filter(n => n.metadata?.lat != null && n.metadata?.lon != null).length;
  return {
    oval: { available: true },
    force: { available: graph.nodes.length >= 5 },
    timeline: { available: eventNodeCount >= 3, reason: eventNodeCount < 3 ? 'Need ≥3 Event/Commitment nodes' : undefined },
    map: { available: geocodedNodeCount >= 3, reason: geocodedNodeCount < 3 ? 'Need ≥3 geocoded events' : undefined },
  };
}

// src/lib/graph/default-layout.ts
export function selectDefaultLayout(graph: WorkbenchGraph): GraphLayoutMode {
  if (graph.nodes.length < 30) return 'oval';
  return 'force';
}
```

Toggle component:

```tsx
// src/components/graph/GraphLayoutToggle.tsx (composes existing Dropdown / Button primitives)
export function GraphLayoutToggle({ caps, current, onChange }: Props) {
  // Dropdown rendering 4 modes; greys disabled modes with tooltip showing cap.reason
}
```

Dispatcher:

```tsx
// src/components/graph/PraxisGraphView.tsx
export function PraxisGraphView({ graph }: { graph: WorkbenchGraph }) {
  const [mode, setMode] = useUrlQueryState<GraphLayoutMode>('layout', () => selectDefaultLayout(graph));
  const caps = computeLayoutCapabilities(graph);
  return (
    <div>
      <GraphLayoutToggle caps={caps} current={mode} onChange={setMode} />
      {mode === 'oval' && <PraxisGraphCanvas graph={graph} />}
      {mode === 'force' && <PraxisForceGraph graph={graph} />}
      {mode === 'timeline' && <PraxisTimeline graph={graph} />}
      {mode === 'map' && <PraxisMap graph={graph} />}
    </div>
  );
}
```

License audit extension:

```ts
// scripts/audit-license-sbom.ts
// Walks node_modules and python deps; verifies every license is in the allowlist
// (MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, CC-BY-4.0, Unlicense, 0BSD).
// Fails CI on any GPL, AGPL, LGPL, CC-BY-NC, CC-BY-SA, custom non-commercial, or unclear license.
```

Wait for sign-off on toggle UX, default-layout heuristics, and SBOM allowlist.

### Phase 3 — Execute

- Author types in `src/types/visualization.ts`.
- Author capability + default-layout helpers.
- Author `GraphLayoutToggle` and `PraxisGraphView` (dispatcher).
- Update `WorkbenchTabContent.tsx` Graph tab dispatch + Chapters chapter-3 to use the dispatcher.
- Author `scripts/audit-license-sbom.ts` and add to CI.

### Phase 4 — Verify

- Existing oval rendering unchanged.
- Toggle renders correctly with disabled states.
- License audit green on existing dependencies.
- Type-parity audit green.

---

## 6. Prompt CC2 — react-force-graph-2d integration

### Persona
Senior frontend engineer who has worked with canvas rendering before. Knows that the value comes from clean `nodeCanvasObject` painting, not from layout magic.

### Phase 1 — Read & report

- Inspect existing `WorkbenchGraphNode` and `WorkbenchGraphEdge` shapes.
- Inspect existing ACO color palette in `PraxisGraphCanvas.tsx` (`NODE_COLORS` record).
- Inspect existing entity panel + click-handler wiring.
- Output `docs/audits/2026-NN-NN-FORCE_GRAPH_INTEGRATION.md`.

### Phase 2 — Propose & confirm

Install:
```bash
npm i react-force-graph-2d
```

Component:

```tsx
// src/components/graph/PraxisForceGraph.tsx
'use client';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d').then(m => m.default),
  { ssr: false, loading: () => <ForceGraphSkeleton /> }
);

const NODE_COLORS: Record<TacitusCorePrimitive, string> = {
  Actor: '#7C3AED',
  Claim: '#B45309',
  Interest: '#0EA5E9',
  Constraint: '#DC2626',
  Leverage: '#F59E0B',
  Commitment: '#059669',
  Event: '#0891B2',
  Narrative: '#9333EA',
};

export function PraxisForceGraph({ graph, onNodeClick }: { graph: WorkbenchGraph; onNodeClick: (n: WorkbenchGraphNode) => void }) {
  const data = useMemo(() => mapWorkbenchGraphToForceGraph(graph), [graph]);
  return (
    <div className="h-[600px] w-full">
      <ForceGraph2D
        graphData={data}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.label;
          const fontSize = 12 / globalScale;
          ctx.fillStyle = NODE_COLORS[node.primitive] ?? '#475569';
          ctx.beginPath();
          ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
          ctx.fill();
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = '#0F172A';
          ctx.fillText(label, node.x + 8, node.y + 4);
        }}
        nodeRelSize={6}
        linkColor={() => '#CBD5E1'}
        linkDirectionalArrowLength={4}
        onNodeClick={onNodeClick}
        cooldownTicks={100}
        onEngineStop={(simulation) => persistLayoutPositions(graph.caseId, simulation)}
      />
    </div>
  );
}
```

Adapter:

```ts
// src/lib/graph/force-graph-adapter.ts
export function mapWorkbenchGraphToForceGraph(graph: WorkbenchGraph): ForceGraphData {
  return {
    nodes: graph.nodes.map(n => ({
      id: n.id,
      label: n.label,
      primitive: n.primitive,
      ontologyId: n.ontologyId,
      // optional cached x/y from previous layout
      x: n.metadata?.layout?.x,
      y: n.metadata?.layout?.y,
    })),
    links: graph.edges.map(e => ({
      source: e.from,
      target: e.to,
      label: e.label,
    })),
  };
}
```

Wait for sign-off on the visual treatment + persistence behavior.

### Phase 3 — Execute

- Install dep with exact-version pin.
- Author `PraxisForceGraph.tsx`, adapter, layout-persistence helper.
- Optional: persist `x`/`y` to `graph_nodes.metadata.layout` via existing case-write pattern (firewall-safe, additive metadata).
- Wire to `PraxisGraphView` dispatcher.

### Phase 4 — Verify

- 200-node fixture renders smoothly (stable 30 FPS).
- Click-to-open-entity-panel works.
- SSR build passes.
- Bundle size delta within budget.

### Files

- `src/components/graph/PraxisForceGraph.tsx`.
- `src/components/graph/ForceGraphSkeleton.tsx` (loading state, existing primitives).
- `src/lib/graph/force-graph-adapter.ts`.
- `src/lib/graph/layout-persistence.ts` (optional cache).
- Visual snapshot tests at 10 / 50 / 200 nodes.

---

## 7. Prompt CC3 — vis-timeline integration

### Persona
Frontend engineer.

### Outcome

Install:
```bash
npm i vis-timeline vis-data
```

Component:

```tsx
// src/components/graph/PraxisTimeline.tsx
'use client';
import { useEffect, useRef } from 'react';
import { Timeline, DataSet } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';

export function PraxisTimeline({ graph, onItemClick }: { graph: WorkbenchGraph; onItemClick: (n: WorkbenchGraphNode) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = new DataSet(mapGraphToTimelineItems(graph));
    const groups = new DataSet(mapOntologiesToTimelineGroups(graph));
    timelineRef.current = new Timeline(containerRef.current, items, groups, {
      orientation: 'top',
      showCurrentTime: true,
      stack: true,
      zoomMin: 1000 * 60 * 60,        // 1 hour minimum zoom
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 5,  // 5 years max
    });
    timelineRef.current.on('select', (props) => {
      const node = graph.nodes.find(n => n.id === props.items[0]);
      if (node) onItemClick(node);
    });
    return () => timelineRef.current?.destroy();
  }, [graph, onItemClick]);

  return <div ref={containerRef} className="h-[420px] w-full" />;
}
```

Mappers:

```ts
// src/lib/graph/timeline-adapter.ts
export function mapGraphToTimelineItems(graph: WorkbenchGraph): TimelineItem[] {
  return graph.nodes
    .filter(n => n.primitive === 'Event' || n.primitive === 'Commitment' || n.primitive === 'Constraint')
    .filter(n => n.metadata?.startsAt != null)
    .map(n => ({
      id: n.id,
      group: n.ontologyId,
      content: n.label,
      start: n.metadata.startsAt,
      end: n.metadata.endsAt,             // optional
      type: n.metadata.endsAt ? 'range' : 'point',
      className: `praxis-timeline-${n.primitive.toLowerCase()}`,  // for Tailwind/CSS overrides
    }));
}

export function mapOntologiesToTimelineGroups(graph: WorkbenchGraph): TimelineGroup[] {
  const ontologies = new Set(graph.nodes.map(n => n.ontologyId).filter(Boolean));
  return Array.from(ontologies).map(id => ({
    id,
    content: ONTOLOGY_LABELS[id] ?? id,
  }));
}
```

CSS scoping: place vis-timeline's own CSS inside a CSS module or scope it to a `.praxis-timeline-root` class so its globals don't bleed into the rest of the app.

### Files

- `src/components/graph/PraxisTimeline.tsx`.
- `src/lib/graph/timeline-adapter.ts`.
- `src/components/graph/timeline.css` (scoped overrides).
- Wire into `PraxisGraphView` dispatcher.
- Wire as inline panel inside Desk tab's "What Changed" section (Pack 26 Z4).
- Visual snapshot tests at 10 / 50 events.

### Verify

- 50-event fixture renders with grouped tracks.
- Drag-to-zoom works.
- Click event opens entity panel.
- SSR build passes.

---

## 8. Prompt CC4 — MapLibre GL JS integration

### Persona
Frontend engineer with light geospatial experience.

### Outcome

Install:
```bash
npm i maplibre-gl react-map-gl
```

Component:

```tsx
// src/components/graph/PraxisMap.tsx
'use client';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('react-map-gl/maplibre').then(m => m.Map), { ssr: false });
const Source = dynamic(() => import('react-map-gl/maplibre').then(m => m.Source), { ssr: false });
const Layer = dynamic(() => import('react-map-gl/maplibre').then(m => m.Layer), { ssr: false });

import 'maplibre-gl/dist/maplibre-gl.css';

const TILE_STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;

export function PraxisMap({ graph, onFeatureClick }: { graph: WorkbenchGraph; onFeatureClick: (n: WorkbenchGraphNode) => void }) {
  const events = useMemo(() => mapGraphToEventGeoJSON(graph), [graph]);
  const countries = useMemo(() => mapActorsToCountryHighlights(graph), [graph]);
  const initialView = useMemo(() => computeInitialViewport(events), [events]);

  return (
    <div className="h-[600px] w-full">
      <Map
        initialViewState={initialView}
        mapStyle={TILE_STYLE_URL}
        onClick={(e) => {
          const feature = e.features?.[0];
          if (feature?.properties?.nodeId) {
            const node = graph.nodes.find(n => n.id === feature.properties.nodeId);
            if (node) onFeatureClick(node);
          }
        }}
        interactiveLayerIds={['praxis-events', 'praxis-country-highlight']}
      >
        <Source id="praxis-countries" type="geojson" data={countries}>
          <Layer id="praxis-country-highlight" type="fill" paint={{ 'fill-color': '#7C3AED', 'fill-opacity': 0.15 }} />
        </Source>
        <Source id="praxis-events-source" type="geojson" data={events}>
          <Layer
            id="praxis-events"
            type="circle"
            paint={{
              'circle-radius': 6,
              'circle-color': '#0891B2',
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#FFFFFF',
            }}
          />
        </Source>
      </Map>
    </div>
  );
}
```

Adapter:

```ts
// src/lib/graph/map-adapter.ts
export function mapGraphToEventGeoJSON(graph: WorkbenchGraph): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: graph.nodes
      .filter(n => n.primitive === 'Event' && n.metadata?.lat != null && n.metadata?.lon != null)
      .map(n => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [n.metadata.lon, n.metadata.lat] },
        properties: { nodeId: n.id, label: n.label },
      })),
  };
}

export function mapActorsToCountryHighlights(graph: WorkbenchGraph): GeoJSON.FeatureCollection {
  // Map Actor.metadata.iso_a3 to a server-cached countries GeoJSON via a lookup.
  // Use existing rigour-style country normalization (Pack 30 backend pick if shipped).
  ...
}
```

Tile-source decision:
- Default: MapTiler free tier (`NEXT_PUBLIC_MAPTILER_KEY` env var). Free tier covers ~100k tile loads/month. Document at `docs/runbooks/MAP_TILE_HOSTING.md`.
- Production scale: Self-hosted PMTiles via Cloud Storage + Cloud CDN. Documented as the migration path.

### Files

- `src/components/graph/PraxisMap.tsx`.
- `src/lib/graph/map-adapter.ts`.
- `public/data/countries-iso-a3.geojson` (small simplified country shapes; ~500 KB, gzipped).
- `docs/runbooks/MAP_TILE_HOSTING.md`.
- Wire into `PraxisGraphView` dispatcher.
- Visual snapshot tests at 5 / 30 / 80 events.

### Verify

- Sudan-region fixture renders with ~20 UCDP event dots clustered correctly.
- Sudan country polygon highlighted when Government of Sudan is in case as Actor.
- Click event opens entity panel.
- Map style loads from MapTiler (or falls back gracefully if API key absent).
- SSR build passes.

---

## 9. Prompt CC5 — ADR + integration tests + bundle audit + verification

### ADR

- `0046-visualization-library-decision-matrix.md` — explains why force-graph (canvas) for graphs, vis-timeline (DOM) for timelines, MapLibre (WebGL) for maps; when each activates; cost-benefit per library; SSR pattern; bundle budgets; license posture.

### Integration tests

- E2E `tests/e2e/visualization/force-graph-toggle.spec.ts`: open Sudan case → switch to Force layout → drag node → verify layout updates → click node → verify entity panel.
- E2E `tests/e2e/visualization/timeline-display.spec.ts`: open case with 30+ events → switch to Timeline → verify groups + items → click item → verify entity panel.
- E2E `tests/e2e/visualization/map-display.spec.ts`: open case with geocoded events → switch to Map → verify dots + country highlight → click dot → verify entity panel.

### Bundle audit

- `scripts/audit-route-bundle-budget.ts` — extends Lighthouse CI to fail on per-route bundle budget violations.
  - `/app/workbench/[caseId]?layout=oval`: existing budget unchanged.
  - `/app/workbench/[caseId]?layout=force`: +60 KB gz max.
  - `/app/workbench/[caseId]?layout=timeline`: +80 KB gz max.
  - `/app/workbench/[caseId]?layout=map`: +280 KB gz max.

### Final verification

```bash
npm run typecheck && npm run lint && npm run test
npm run audit:license-sbom
npm run audit:route-bundle-budget
npm run audit:gate

npx playwright test tests/e2e/visualization/

npm run lh:ci

git tag v1.5.1
```

---

## 10. Out of scope

- 3D force-graph — not justified by data shapes.
- Cytoscape.js — Sprint 2 if compound graphs / formal layout algorithms become a need (defined in Pack 30+).
- deck.gl — Sprint 2 if 50k+ event scatterplots become a need.
- kepler.gl — rejected per OSS sourcing report (98 MB unpacked, Redux required).
- Editing items via drag in the timeline — read-only for v1; editing routes through the existing entity panel + firewall.
- Map-based filtering of the graph — Sprint 2.
- Real-time collaboration on graph layout positions — Sprint 2.

---

## 11. Closing note

Three permissively-licensed, battle-tested libraries. Three days of work. A graph that scales to 200 nodes legibly, a timeline that surfaces the temporal arc, a map that shows the geography. No new tabs. No backend changes. No data migrations. Existing surfaces speak in the visual language that fits their data.

The architecture bible's invariants hold. The OSS sourcing report's license discipline is enforced in CI. The user opens a Sudan case at 9:14am and sees the August escalation in three clicks.

Branch: `feature/visualization-wave`. Commit prefix `viz(<library>): CC<N> <description>`. PR titled `Pack 29 — Visualization Wave (Force Graph + Timeline + Map)`.

After merge, tag `v1.5.1`. Pack 30 follows with the document-extraction wave (Docling + GLiNER + GraphRAG).

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_29_VISUALIZATION_WAVE.md`

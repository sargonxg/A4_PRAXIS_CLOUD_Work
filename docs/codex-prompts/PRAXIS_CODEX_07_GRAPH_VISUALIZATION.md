# PRAXIS — Codex Pack 07: Graph Visualization & Interactive Exploration

**Branch**: `feature/graph-visualization`
**Depends on**: Pack 06 merged.
**Owner gate**: Do not merge to `main` without Giulio's sign-off.
**Estimated effort**: ~4 days (~42 engineering hours).

---

## 0. Why this pack exists

The single biggest gap between PRAXIS-as-promise and PRAXIS-as-product is that **the user cannot see the graph they are building**. The current `src/components/graph/graph-viewer.tsx` is 397 lines of a force-directed sketch. It does not know about ontology subtypes (pack 06), it does not show truth layers (pack 05), it does not let the user filter by time, confidence, or actor. There is no node detail panel. There is no edit mode. There is no view persistence. Every page that needs to "show the graph" today either reuses this minimal viewer or rolls its own — there are at least three near-duplicate viewers across the codebase.

That is the wrong direction. The graph is the **artifact** PRAXIS produces. If the user cannot read it, manipulate it, share a saved view of it, the product has no center.

This pack ships one canonical graph viewer — `src/components/graph/PraxisGraphCanvas.tsx` — built on Cytoscape.js, ontology-aware, truth-layer-aware, with five named layouts, filters that compose, a side panel that shows full provenance, edit operations gated by role, view persistence per case, and performance budgets that hold up to ~10,000 nodes. Every other viewer in the codebase becomes a thin wrapper over this one component, or is deleted.

The visual style is informed by the existing PRAXIS design system. Nothing about this pack invents a new design language. It applies the language to a much harder surface (interactive graphs at scale) and gets that right.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | One canonical graph component (`PraxisGraphCanvas`) used everywhere in the workbench that needs to render a graph | `grep -r 'cytoscape' src/` shows imports only inside `src/components/graph/`; other call sites import `<PraxisGraphCanvas />` |
| 2 | Cytoscape.js + `react-cytoscapejs` installed; pinned versions; bundle impact measured | `package.json` has cytoscape pinned; `npm run analyze` shows the graph chunk is code-split and lazy-loaded |
| 3 | Ontology-aware styling: each subtype gets a distinct icon + color; truth layers (Source/Claim/Evidence/Verdict) get distinct stroke styles; confidence drives node opacity | Visual snapshot tests for each ontology |
| 4 | Five layouts: Force (cose-bilkent), Hierarchical (dagre), Ego-network, Timeline (custom), Layered-by-truth-layer (custom) | E2E: switch layouts, no crash, layout converges in < 1.5s for 500 nodes |
| 5 | Filter panel: by primitive, by subtype, by truth layer, by confidence range, by time window, by ontology relation type | Filter changes update the visible subgraph in < 100ms for 1k nodes |
| 6 | Node detail side panel: provenance entries, claims, contradictions, edge list, edit history | Click any node → panel opens with all six tabs populated |
| 7 | Edit operations: merge two nodes, split one node, mark contradiction, lock node, dispute claim — every operation logs to audit trail and round-trips Firestore + Neo4j atomically | Each operation has a unit test + integration test |
| 8 | Saved views: a user can save a filtered + laid-out view of the graph and return to it later; views are per-case, owner-scoped | Save view → sign out → sign in → view restored |
| 9 | Performance: 10,000 nodes / 25,000 edges renders smoothly on a 2020 MacBook Pro at sustained 30fps in Force layout; cold-mount under 800ms; memory under 350MB | Performance test in `e2e/perf/graph-large.spec.ts` |
| 10 | Accessibility: keyboard navigation, screen reader labels, color-blind-safe palette with optional pattern fill | Axe scan on graph canvas reports no violations |
| 11 | Audit gate: `audit:graph-viewer-uniqueness`, `audit:graph-perf-budget` | `npm run audit:gate` includes both |

---

## 2. Pre-work confirmation note (Codex must send before writing code)

> I have read pack 07. I understand:
> 1. The single canonical viewer is `src/components/graph/PraxisGraphCanvas.tsx`. Every other graph render in the workbench either uses this component or is deleted.
> 2. Library: **Cytoscape.js** + `react-cytoscapejs`, with `cytoscape-cose-bilkent`, `cytoscape-dagre`, and `cytoscape-popper` extensions. I will pin versions.
> 3. Styling is driven by the active ontology (pack 06): each subtype has a deterministic style derived from `OntologySubtype.icon` and a generated palette. Truth layer styles are orthogonal (stroke pattern). Confidence drives opacity.
> 4. Edit operations write through the same atomic Firestore + Neo4j path the ingestion pipeline (pack 06) uses. No bypass.
> 5. Saved views live at `users/{uid}/situations/{caseId}/views/{viewId}` in Firestore.
> 6. Performance budgets are hard: 10k nodes at 30fps Force layout is the production bar. If I cannot hit it, I propose alternatives (level-of-detail mode, virtualization, summary mode) before merging.
> 7. The component is lazy-loaded. The Cytoscape bundle does NOT ship in the initial JS payload of the landing page or non-graph routes.
>
> Open questions for Giulio:
> - **Q1**: Library choice — recommend Cytoscape.js. Alternatives considered: Sigma.js (faster on huge graphs but weaker styling primitives and React integration), `react-force-graph` (beautiful WebGL but harder to do per-subtype styling and dagre layouts). I will use Cytoscape unless you object.
> - **Q2**: Edit operations — propose role-gated by case role: `owner` and `editor` can edit, `viewer` and `commentator` cannot. Same model as the existing case-permissions doc. Confirm.
> - **Q3**: Saved view sharing — view-by-link with read-only access for any user the case is shared with; view URL is `/app/workbench/<caseId>?tab=graph&view=<viewId>`. Public-link sharing is OUT of this pack. Confirm.
> - **Q4**: Performance fallback — when node count exceeds 10k, switch automatically to "Summary Mode" (cluster nodes by subtype, show one super-node per cluster, expand on click). Acceptable?

Wait for answers.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| F1 | Install Cytoscape, scaffold `PraxisGraphCanvas`, lazy-load wiring | 4 |
| F2 | Data adapter: graph state → Cytoscape elements; ontology + truth-layer styling | 6 |
| F3 | Five layouts, with named-view defaults | 4 |
| F4 | Filter panel (primitive, subtype, layer, confidence, time, relation) | 5 |
| F5 | Node detail side panel (six tabs) | 5 |
| F6 | Edit operations (merge, split, contradiction, lock, dispute) with audit trail | 6 |
| F7 | Saved views: persist + restore + share-by-link | 4 |
| F8 | Performance: large-graph mode, virtualization, level-of-detail, Summary Mode | 5 |
| F9 | Accessibility, audit gate, deletion of legacy viewers | 3 |
| **Total** | | **~42** |

---

## 4. Hard rules (apply to every prompt)

- The Cytoscape import path is `import Cytoscape from 'cytoscape'` (or via the React wrapper) and is allowed ONLY inside `src/components/graph/`. ESLint rule enforces this.
- The viewer is dynamically imported via `next/dynamic` with `ssr: false` and is wrapped in a Suspense boundary with a non-blocking skeleton.
- Edit operations call the same backend routes used by ingestion (no separate "frontend-only" graph mutation paths). Every mutation goes through `withCalibration` and the symbolic firewall.
- Every visual mapping (color, icon, stroke) is **derived** from the ontology — never hard-coded per subtype-id. Adding a new subtype in pack 06 should not require any change in pack 07 to render correctly.
- Firestore reads are owner-scoped. The data adapter never queries above `users/{uid}/situations/{caseId}/`.
- No client-side aggregation queries that scan more than 5,000 documents. For larger cases, the adapter calls a backend endpoint that returns a paginated, summarized view.
- Saved views are tested for both round-trip correctness (save → reload → identical visual state) and forward-compatibility (a view saved in v1 of the schema loads in v2 with sensible defaults).
- All animations are `prefers-reduced-motion` aware.

---

## 5. Prompt F1 — Install Cytoscape, scaffold the canonical viewer, lazy-load it

### Persona
You are a senior frontend engineer who has integrated three different graph libraries into production apps. You know that the bundle cost of Cytoscape can sink the landing page if you import it eagerly. You set up the lazy-load on day one.

### Outcome
- Cytoscape and its extensions are installed at pinned versions.
- `PraxisGraphCanvas` exists as a working stub that renders a hard-coded 5-node graph for any caller, with no styling logic yet.
- The viewer is lazy-loaded; importing the workbench tab does not pull Cytoscape into the initial bundle.

### Files to create
- `src/components/graph/PraxisGraphCanvas.tsx` — props: `caseId: string`, `ontologyId: OntologyId`, `viewId?: string`, `onNodeClick?: (id) => void`, `readOnly?: boolean`. For now, renders a 5-node mock.
- `src/components/graph/cytoscape-loader.ts` — registers extensions: `cose-bilkent`, `dagre`, `popper`. Exports `getCytoscape()` returning the configured Cytoscape constructor. This is the ONLY module that calls `cytoscape.use(...)`.
- `src/components/graph/index.ts` — barrel export.
- `src/components/graph/__tests__/PraxisGraphCanvas.test.tsx` — render test (jsdom + Cytoscape stub).
- `src/lib/lazy/graph-canvas.tsx` — `next/dynamic` wrapper with skeleton.

### Files to edit
- `package.json` — add deps:
  ```
  "cytoscape": "3.30.x",
  "react-cytoscapejs": "2.0.x",
  "cytoscape-cose-bilkent": "4.1.x",
  "cytoscape-dagre": "2.5.x",
  "cytoscape-popper": "4.0.x"
  ```
  All pinned to a minor; major-version bumps require RFC.
- `next.config.ts` — confirm dynamic-import code-splitting is on.
- `eslint.config.mjs` — add a rule forbidding `cytoscape` imports outside `src/components/graph/`.

### Hard rules
- The lazy wrapper MUST be the only path callers use. Direct imports of `PraxisGraphCanvas` from non-graph files are an ESLint error.
- The skeleton shown during load is the existing PRAXIS skeleton style; no new design token.
- Bundle analyzer screenshot included in PR description.

### Definition of Done
- `npm run typecheck` clean.
- `npm run analyze` shows the graph bundle as a separate chunk (`graph-canvas.<hash>.js`).
- `npm run test src/components/graph` green.
- Visiting `/app/workbench/<caseId>?tab=graph` shows the 5-node mock; navigating away unmounts the canvas (verify in React DevTools).

### Verification commands
```bash
npm run typecheck
npm run lint
npm run test -- src/components/graph
npm run analyze
```

---

## 6. Prompt F2 — Data adapter + ontology and truth-layer styling

### Persona
You are a visualization engineer with a typography background. You know that a graph with 8 colors looks loud, a graph with 24 colors looks broken. You design the palette as a controlled extension of the PRAXIS design tokens, not as a separate world.

### Outcome
- A pure adapter `graphStateToElements(graph: CaseGraph): cytoscape.ElementDefinition[]` lives in `src/lib/graph/cytoscape-adapter.ts`.
- A pure styler `styleForOntology(ontology: Ontology): cytoscape.Stylesheet[]` lives in `src/lib/graph/ontology-style.ts`.
- The 5-node mock from F1 is replaced with real graph data fetched from Firestore for a given case.

### Files to create
- `src/lib/graph/cytoscape-adapter.ts` — converts the `CaseGraph` shape (nodes + edges as defined by pack 06's `OntologyBoundNode` and `OntologyBoundEdge`) into Cytoscape's ElementDefinition format. Pure function, fully tested.
- `src/lib/graph/ontology-style.ts` — generates a Cytoscape stylesheet from an `Ontology`. Maps:
  - Node shape ← primitive (Actor=ellipse, Event=diamond, Claim=round-rectangle, Narrative=barrel, etc.)
  - Node fill color ← deterministic palette derived from `subtype.id` hash, constrained to the PRAXIS palette
  - Node icon ← `subtype.icon` (Lucide icon name) rendered into a Cytoscape data-uri sprite
  - Node opacity ← `node.confidence` mapped 0.4 → 1.0
  - Node border style ← `node.layer` (Source=solid 1px, Claim=solid 2px, Evidence=dashed 2px, Verdict=double 3px)
  - Edge color ← relation-type hash, constrained to a muted palette
  - Edge style ← cardinality (one-to-many=solid, many-to-many=dashed)
  - Edge label ← relation-type human label
- `src/lib/graph/case-graph-loader.ts` — fetches `users/{uid}/situations/{caseId}/nodes` and `.../edges`, joins, returns `CaseGraph`. Owner-scoped query. Falls back to backend summary endpoint if node count > 5000.
- `src/lib/graph/__tests__/cytoscape-adapter.test.ts` — adapter tests.
- `src/lib/graph/__tests__/ontology-style.test.ts` — generator tests; visual snapshot.

### Files to edit
- `src/components/graph/PraxisGraphCanvas.tsx` — wire adapter + styler. Loads the case graph on mount, converts, applies stylesheet, mounts.
- `tailwind.config.ts` (or design-tokens) — confirm the muted palette tokens used by the styler are exposed.

### Hard rules
- The styler is **deterministic**: same ontology in → same stylesheet out. No randomness, no Date-dependent values.
- Color palette is the PRAXIS token set, not a fresh palette. The styler maps subtype hashes onto an ordered list of token-defined colors. If subtype count exceeds palette size, the styler cycles with a warning logged.
- Color-blind safety: every fill color has a paired pattern fill (loaded from `public/graph-patterns/`), toggleable via `?colorblind=1` query or the user's preference setting.
- The icon sprite is generated once per ontology version, cached to localStorage with a version key.

### Definition of Done
- Visual snapshot tests pass for the four ontologies (Conflict, Mediation, Governance, Narrative).
- Loading the Syria case (post-pack-06 migration) renders ~50 nodes correctly subtype-styled, layer-bordered, confidence-faded.
- Color-blind toggle visibly changes patterns on test fixtures.

### Verification commands
```bash
npm run test -- src/lib/graph src/components/graph
npx playwright test e2e/visual/graph-canvas-snapshots.spec.ts
```

---

## 7. Prompt F3 — Five layouts with named-view defaults

### Persona
You are a graph layout researcher who has implemented timeline layouts before. You know dagre is for DAGs, cose-bilkent for general force, that ego-networks need radial constraints, and that timeline layouts must respect bi-temporal validity (pack 05).

### Outcome
Five layouts work. The user can switch between them from a small toolbar. Each layout has a default zoom and pan setting saved to the case-default view.

### Files to create
- `src/lib/graph/layouts/force.ts` — `cose-bilkent` config, tuned for 500-5000 nodes.
- `src/lib/graph/layouts/hierarchical.ts` — `dagre` config, top-down or left-right based on graph kind.
- `src/lib/graph/layouts/ego-network.ts` — concentric layout around a focus node; props: `focusNodeId`, `depth`. Default depth 2.
- `src/lib/graph/layouts/timeline.ts` — custom: x-axis = time (use `validFrom` for nodes; if absent, use `assertedFrom`), y-axis = primitive band. Edges drawn over time. Drops nodes without temporal data with a count-based "X non-temporal nodes hidden" indicator.
- `src/lib/graph/layouts/layered-by-truth-layer.ts` — custom: four horizontal bands (Source / Claim / Evidence / Verdict), nodes placed in their band, edges drawn vertically across bands.
- `src/components/graph/LayoutToolbar.tsx` — 5 buttons, keyboard-accessible.
- `src/lib/graph/layouts/__tests__/timeline.test.ts` — verify temporal placement.
- `src/lib/graph/layouts/__tests__/layered.test.ts` — verify band assignment.

### Files to edit
- `src/components/graph/PraxisGraphCanvas.tsx` — accept `layout` prop, expose `setLayout`. Default to Force for cases < 200 nodes; Layered-by-truth-layer for cases ≥ 200 (forces user to think in layers when graph is dense).

### Hard rules
- Layout convergence target: < 1.5 seconds for 500 nodes on Force; < 800ms for the deterministic layouts (Hierarchical, Layered, Ego). If a run exceeds the budget, log a perf event to `audit/perf-events`.
- Switching layouts animates with `prefers-reduced-motion` respect. Animation duration capped at 600ms.
- Timeline layout's time-axis has tick marks rendered as a Cytoscape background image, generated from the case's actual time range.

### Definition of Done
- Five layouts switchable in E2E test for the Syria case; all converge under budget.
- Timeline layout correctly orders the 5-7 known-dated Syria events.
- Layered layout puts Verdict-layer nodes on the top band.

### Verification commands
```bash
npm run test -- src/lib/graph/layouts
npx playwright test e2e/workbench/graph-layouts.spec.ts
```

---

## 8. Prompt F4 — Filter panel (primitive / subtype / layer / confidence / time / relation)

### Persona
You are an information designer who treats filters as the user's primary tool for taming a 5000-node graph. You make filters compose visibly, persistently, and reversibly.

### Outcome
A right-side filter panel lets the user narrow what's visible. Filters compose (AND across categories, OR within). Active filters render as removable chips above the canvas. Reset button clears all.

### Files to create
- `src/components/graph/FilterPanel.tsx` — six grouped controls:
  1. **Primitive** — 8 toggle chips (Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative).
  2. **Subtype** — chips per active ontology's subtypes; folds open per primitive.
  3. **Truth layer** — 4 chips (Source / Claim / Evidence / Verdict).
  4. **Confidence range** — dual-thumb slider, 0.0 → 1.0, default `[0.4, 1.0]` (matching the pack-06 review-floor and auto-commit thresholds).
  5. **Time window** — date range picker; defaults to `[case.createdAt, now]`. Filters on `validFrom` ∩ `validTo`.
  6. **Relation type** — chips per relation in active ontology.
- `src/components/graph/FilterChips.tsx` — active filters as removable chips above canvas.
- `src/lib/graph/filter-engine.ts` — pure function `applyFilters(graph: CaseGraph, filters: FilterState): CaseGraph`. No side effects, fully testable.
- `src/lib/graph/__tests__/filter-engine.test.ts` — composition tests, edge cases (empty result, all filtered, time-window boundary).

### Files to edit
- `src/components/graph/PraxisGraphCanvas.tsx` — apply filter state to elements before passing to Cytoscape. Use Cytoscape's batch mode for filter updates.
- The graph tab page — adds the filter panel to the layout.

### Hard rules
- Filter changes apply in < 100ms for 1000 nodes. Use `cy.batch(() => { ... })` to bulk-toggle node visibility instead of re-mounting elements.
- Filters do NOT delete nodes; they hide them via `display: 'none'` style. Saved views capture the filter state, not a pruned graph.
- Filter state is stored in URL query params (`?primitives=Actor,Claim&layers=Verdict&confMin=0.7`) so filter views are shareable by URL even before the saved-view feature ships.

### Definition of Done
- All filters work individually and in composition.
- Filter perf test green on a 2000-node fixture.
- URL round-trip: apply filters → copy URL → paste in new tab → same filters active.

### Verification commands
```bash
npm run test -- src/lib/graph/filter-engine src/components/graph/FilterPanel
npx playwright test e2e/workbench/graph-filters.spec.ts
```

---

## 9. Prompt F5 — Node detail side panel (six tabs)

### Persona
You are an editor who knows that a graph node without provenance is a rumor. You design the side panel so the user can audit any claim in three clicks: click node → click Provenance tab → see source.

### Outcome
Clicking any node opens a side panel with six tabs:
1. **Overview** — primitive, subtype, label, description, confidence, layer, validity window, key edges.
2. **Provenance** — full provenance entries with linkable document refs and span quotes.
3. **Claims** — every Claim node connected to this node (if it's an Actor, Event, etc.).
4. **Contradictions** — explicit `CONTRADICTS` edges and inferred contradictions (computed from validators).
5. **Edges** — full adjacency: in-edges, out-edges, with relation types.
6. **History** — edit log: who created it, who modified it, every audit-trail entry.

### Files to create
- `src/components/graph/NodeDetailPanel.tsx` — tabbed panel.
- `src/components/graph/panels/OverviewTab.tsx`
- `src/components/graph/panels/ProvenanceTab.tsx`
- `src/components/graph/panels/ClaimsTab.tsx`
- `src/components/graph/panels/ContradictionsTab.tsx`
- `src/components/graph/panels/EdgesTab.tsx`
- `src/components/graph/panels/HistoryTab.tsx`
- `src/lib/graph/contradiction-finder.ts` — derives contradictions from validators + explicit edges.
- Tests for each panel.

### Files to edit
- `src/components/graph/PraxisGraphCanvas.tsx` — wire `tap` on nodes → opens panel.

### Hard rules
- Provenance entries link out to the source document at the right page/span. Clicking opens the document viewer (existing `src/components/documents/`) with the span highlighted.
- The History tab queries `audit/{caseId}/{nodeId}` (the audit trail introduced by pack 06). It paginates; never fetches more than 50 entries at a time.
- All six tabs are independently lazy-loaded; opening Overview does not fetch History data.
- The panel is keyboard-accessible: Tab cycles fields, arrow keys cycle tabs, Esc closes.

### Definition of Done
- Click any node in any of the four sample cases → panel populated, all six tabs work, no console errors.
- Provenance click → opens document viewer with span highlighted.
- Contradictions tab shows the seeded contradiction in `northwind-mediation` (Alex's Position contradicts Jordan's mediator-only BATNA assessment).
- Axe scan on the panel reports zero violations.

### Verification commands
```bash
npm run test -- src/components/graph/panels
npx playwright test e2e/workbench/graph-node-panel.spec.ts
```

---

## 10. Prompt F6 — Edit operations (merge / split / contradiction / lock / dispute)

### Persona
You are an engineer who has shipped collaborative editing before. You know that "let any user edit anything" is how graphs become inconsistent. You gate edits by role, version every mutation, and write through the same atomic path the ingestion pipeline uses.

### Outcome
Five edit operations work end-to-end:
- **Merge** two nodes the user believes are duplicates.
- **Split** one node into two when the user realizes it conflated entities.
- **Mark contradiction** between two nodes (creates a `CONTRADICTS` edge with user-supplied rationale).
- **Lock** a node so no further automated edits modify it.
- **Dispute** a Claim — flags it for review, downgrades confidence, surfaces in the review queue.

Each operation is gated by the user's case role, atomic across Firestore + Neo4j, fully audit-logged, reversible.

### Files to create
- `src/lib/graph/edits/merge-nodes.ts`
- `src/lib/graph/edits/split-node.ts`
- `src/lib/graph/edits/mark-contradiction.ts`
- `src/lib/graph/edits/lock-node.ts`
- `src/lib/graph/edits/dispute-claim.ts`
- `src/components/graph/EditMenu.tsx` — right-click / long-press context menu on a node.
- `src/components/graph/edits/MergeDialog.tsx` — disambiguation UI: pick canonical label, merge strategy for conflicting fields.
- `backend/routers/graph_edits.py` — FastAPI routes for each operation. Each runs through `withCalibration`, the symbolic firewall, and the atomic Firestore + Neo4j writer from pack 06.
- `backend/tests/test_graph_edits.py` — including the crash-injection test on each operation.
- `src/lib/graph/edits/__tests__/edit-engine.test.ts` — TS unit tests, role-gating tests.
- `e2e/workbench/graph-edits.spec.ts` — full edit flow per operation.

### Files to edit
- Case-permissions module — confirm `owner`, `editor`, `commentator`, `viewer` roles. Edit operations require `owner` or `editor`.
- `src/components/graph/PraxisGraphCanvas.tsx` — add `readOnly` prop wired to role check. Edit menu only renders if `!readOnly`.

### Hard rules
- Every operation is **reversible** within 24 hours via the audit trail. Operations older than 24 hours require a Giulio-approved manual revert.
- Merge writes a new node, redirects all incoming/outgoing edges, soft-deletes the old nodes (keeps them in Firestore with `status: 'merged-into:<newId>'` for audit). Neo4j has the merged node only; old nodes are removed transactionally.
- Split is the inverse and just as audit-heavy. The user must specify which fields go to which output node; no auto-split.
- Lock is a property on the node, not a separate node. Locked nodes reject ingestion candidates that would modify them; the firewall logs the rejection.
- Dispute downgrades confidence by 0.3 (clamped at 0.1 floor) and pushes a review-queue entry that surfaces in the workbench.

### Definition of Done
- All five operations work in E2E for the Syria case.
- Role-gating: as a `viewer`, edit menu does not render; backend rejects direct calls with 403.
- Crash injection: kill the process mid-merge; reconciler completes; no orphan edges.
- Audit trail entries readable via the History tab (built in F5).

### Verification commands
```bash
npm run test -- src/lib/graph/edits
pytest backend/tests/test_graph_edits.py -q
npx playwright test e2e/workbench/graph-edits.spec.ts
npx tsx scripts/verify-firestore-neo4j-sync.ts  # run after edit tests
```

---

## 11. Prompt F7 — Saved views: persist + restore + share-by-link

### Persona
You are a product engineer who knows that a graph view a user spent 20 minutes constructing and cannot save is a graph view that has ruined the user's day. You ship persistence on day one.

### Outcome
- Users can save the current canvas state (layout + filters + camera + active focus node) as a named view.
- Views are listed in the workbench `?tab=graph` sub-tab.
- Views restore exactly: same layout, same filters, same zoom, same pan.
- Sharing: a view URL `/app/workbench/<caseId>?tab=graph&view=<viewId>` opens the view for any user with case-read access.

### Files to create
- `src/lib/graph/views/view-state.ts` — Zod schema for `SavedGraphView`: `id`, `caseId`, `ownerUid`, `name`, `layoutId`, `filterState`, `cameraState`, `focusNodeId`, `colorBlind`, `createdAt`, `updatedAt`, `schemaVersion: 1`.
- `src/lib/graph/views/save-view.ts`, `load-view.ts`, `list-views.ts`, `delete-view.ts`.
- `backend/ontology/views.py` — Pydantic mirror.
- `backend/routers/graph_views.py` — CRUD routes.
- `src/components/graph/SavedViewsList.tsx`
- `src/components/graph/SaveViewDialog.tsx`
- Tests for round-trip correctness, forward-compat from v1 to a future v2.
- `e2e/workbench/graph-saved-views.spec.ts`

### Files to edit
- `firestore.rules` — add `users/{uid}/situations/{caseId}/views/{viewId}` rules. Owner read/write, case-collaborator read.
- `firestore.indexes.json` — index on `views.updatedAt desc`.

### Hard rules
- Views are owner-scoped storage but accessible by any user the case is shared with (read-only). Editing a shared view is allowed only by the view's owner.
- View URL params override saved state: if the URL has `?primitives=Actor` and the view was saved without that filter, the URL takes precedence (allows quick filter overrides without modifying the view).
- The forward-compat test seeds a v1 view doc with extra/missing fields and asserts it loads with sensible defaults.

### Definition of Done
- Save → reload page → restore: pixel-snapshot match within tolerance.
- Sign out → sign in → view list populated.
- Share view URL with a second test user (case-collaborator) → opens correctly read-only.
- Forward-compat test green.

### Verification commands
```bash
npm run test -- src/lib/graph/views
pytest backend/tests/test_graph_views.py -q
npx playwright test e2e/workbench/graph-saved-views.spec.ts
```

---

## 12. Prompt F8 — Performance: large-graph mode, virtualization, level-of-detail, Summary Mode

### Persona
You are a performance engineer who has profiled Cytoscape on 50k-node graphs. You know that node count is the easy axis — edge count and label rendering are the hard ones. You build instrumented budgets and a Summary Mode for cases that exceed them.

### Outcome
- 10k nodes / 25k edges renders smoothly at 30fps Force layout on a 2020 MacBook Pro.
- Cold-mount under 800ms for cases up to 1k nodes; under 2s for 10k.
- Memory under 350MB for 10k-node case.
- Above 10k nodes, Summary Mode auto-engages: nodes cluster by subtype, one super-node per cluster, expand on click.

### Files to create
- `src/lib/graph/perf/level-of-detail.ts` — when zoom < threshold, hide labels; when zoom > threshold, show full labels.
- `src/lib/graph/perf/summary-mode.ts` — clustering: group by `(primitive, subtype)`, render one super-node per group with size proportional to group size; on click, expand.
- `src/lib/graph/perf/budget-tracker.ts` — measures cold-mount, layout time, fps, memory; logs to `audit/perf-events` and surfaces a perf badge in the canvas corner if budgets exceeded.
- `e2e/perf/graph-large.spec.ts` — synthesizes a 10k-node graph fixture, mounts the canvas, asserts budgets met. Runs in CI on a known-config runner with thresholds tuned to that runner.
- `scripts/audit-graph-perf-budget.ts` — CI script: runs the perf test and exits 1 on budget violation.

### Files to edit
- `src/components/graph/PraxisGraphCanvas.tsx` — wire LoD, Summary-Mode auto-engage, budget tracker.
- `package.json` — add `audit:graph-perf-budget` script. Append to `audit:gate`.

### Hard rules
- Summary Mode is opt-out, not opt-in: above 10k nodes the user starts in Summary Mode and can manually expand. The full-render mode shows a warning if engaged on > 10k.
- Edge bundling is OFF by default for correctness. A future pack may add it.
- Perf budgets in `src/lib/graph/perf/budgets.ts`; constants are checked by both the test and the runtime tracker so they cannot drift.

### Definition of Done
- 10k-node test green on CI runner.
- Manual smoke on a 2020 MBP renders fluidly.
- Summary Mode toggle works; clusters expand correctly.
- Budget violations log perf events.

### Verification commands
```bash
npm run audit:graph-perf-budget
npx playwright test e2e/perf/graph-large.spec.ts
```

---

## 13. Prompt F9 — Accessibility, audit gate, deletion of legacy viewers

### Persona
You are a release engineer doing the unglamorous final cleanup. You know that the second your viewer ships, every other half-broken viewer in the codebase becomes a maintenance liability. You delete them.

### Outcome
- Every legacy graph viewer in the codebase is replaced by `<PraxisGraphCanvas />` or deleted.
- Accessibility audit passes: keyboard nav, screen reader labels, color-blind alternatives.
- `audit:graph-viewer-uniqueness` enforces that only one Cytoscape integration exists.

### Files to create / find-and-delete
- Audit existing graph rendering surfaces. Confirmed candidates from current repo scan:
  - `src/components/graph/graph-viewer.tsx` (397 lines) — replace with re-export of `PraxisGraphCanvas`.
  - `src/components/graph/relationship-matrix.tsx` — keep (matrix view, not graph viewer); confirm.
  - `src/components/graph/timeline-slider.tsx` — replace with the Timeline layout from F3; delete.
  - `src/components/graph/entity-panel.tsx` — replace with the Node Detail Panel from F5; delete or migrate.
  - `src/components/graph/cypher-console.tsx` — keep as a separate developer surface (not a viewer).
- Any other component matching `*graph*viewer*`, `*conflict-graph*`, `*case-graph*` — audit and consolidate.
- `scripts/audit-graph-viewer-uniqueness.ts` — fails CI if ANY component file other than `PraxisGraphCanvas` imports from `cytoscape` (with the loader exception).
- `e2e/a11y/graph-canvas-axe.spec.ts` — Axe scan of canvas in all four sample cases.
- `docs/graph/VIEWER_GUIDE.md` — single source of truth for how to render a graph in PRAXIS.

### Files to edit
- All call sites of legacy viewers — switch to `<PraxisGraphCanvas />`.
- `audit:gate` chain — append `audit:graph-viewer-uniqueness` and `audit:graph-perf-budget`.
- ESLint config — finalize the cytoscape-import-restriction rule.

### Hard rules
- No "transitional" state where two viewers coexist for more than a single PR. Either the call site uses the new viewer or it does not render a graph.
- Color-blind palette is on by default for users whose browsers report `prefers-color-scheme: cb` (rare but real); always available via the in-canvas toggle.
- Every interactive element (zoom, layout button, filter, edit menu) is reachable by keyboard with a visible focus ring.

### Definition of Done
- Codebase audit: `grep -r 'cytoscape' src/` shows imports only inside `src/components/graph/` and `src/lib/graph/`.
- Axe scans clean.
- All four sample cases (Syria / Northwind / UN CTED / Nordalia disinfo) navigate via keyboard end-to-end.
- `npm run audit:gate` exits 0.

### Verification commands
```bash
npm run audit:graph-viewer-uniqueness
npm run audit:graph-perf-budget
npx playwright test e2e/a11y/graph-canvas-axe.spec.ts
npm run audit:gate
```

---

## 14. Final verification gate

```bash
npm run typecheck
npm run lint
npm run test
npm run audit:gate

pytest backend/ -q
mypy backend/ --strict

# Visual & interaction
npx playwright test e2e/visual/graph-canvas-snapshots.spec.ts
npx playwright test e2e/workbench/graph-layouts.spec.ts
npx playwright test e2e/workbench/graph-filters.spec.ts
npx playwright test e2e/workbench/graph-node-panel.spec.ts
npx playwright test e2e/workbench/graph-edits.spec.ts
npx playwright test e2e/workbench/graph-saved-views.spec.ts

# Perf
npx playwright test e2e/perf/graph-large.spec.ts

# Accessibility
npx playwright test e2e/a11y/graph-canvas-axe.spec.ts

# Drift
npx tsx scripts/verify-firestore-neo4j-sync.ts
```

---

## 15. Out of scope

- 3D / VR / AR rendering of graphs.
- Real-time collaborative editing (presence cursors, conflict resolution beyond last-write-wins for non-graph fields). Graph mutation via the operations defined here is single-user-at-a-time per node.
- Edge bundling and advanced visual aggregation beyond Summary Mode.
- Public sharing of views (anonymous read-only links). View URLs require auth.
- Custom layout algorithms beyond the 5 shipped.
- Embedding the graph viewer outside PRAXIS (no public iframe widget).

---

## 16. Closing note for the agent

This pack is the user's primary surface for the typed graph that pack 06 builds. It must feel polished, fast, and trustworthy. A laggy or visually noisy graph viewer would undermine the entire structuring-knowledge premise; a beautiful but stylistically chaotic one would dilute the design language.

You will know you have done this right when a user opens a 2k-node Conflict case for the first time, switches to Layered-by-truth-layer, sees that the Verdicts cluster cleanly at the top with traced provenance down to Sources, and says "oh, I see how my situation actually decomposes."

Branch: `feature/graph-visualization`. Commit prefix `graph(<area>): <prompt-id> <description>` (e.g., `graph(layout): F3 timeline layout with bi-temporal validity`). PR titled `Pack 07 — Graph Visualization & Interactive Exploration`.

Do not merge to `main` without Giulio's sign-off.

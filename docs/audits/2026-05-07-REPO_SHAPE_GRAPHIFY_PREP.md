# PRAXIS Repo Shape And Graphify Prep

Date: 2026-05-07
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Branch: `main`

## Purpose

Prepare the repository for the next large improvement round by refreshing the
code graph, recording the current coupling map, separating safe cleanup from
risky deletion, and adding an audit guard for graphify/doc handoff freshness.

## Graphify Refresh

Command:

```bash
graphify update .
```

Result:

- `graphify-out/graph.json`: 5,147 nodes, 8,517 edges.
- `graphify-out/GRAPH_REPORT.md`: refreshed from the current code.
- `graphify-out/manifest.json`: refreshed.
- `graphify-out/graph.html`: removed by graphify because the graph now exceeds
  the 5,000-node HTML visualization safety limit.

This is expected. For this repo size, `graph.json` and `GRAPH_REPORT.md` are
the current authoritative graphify outputs. Interactive HTML should be
regenerated only for a narrowed subgraph or with an explicit visualization
limit override.

## Current God Nodes

The refreshed graph shows these high-coupling abstractions:

1. `cn()` - shared UI class composition.
2. `withAuth()` - authenticated Next.js route boundary.
3. `getAdminDbOrThrow()` - Firebase Admin access.
4. `handleRouteError()` - route error normalization.
5. `withCalibration()` - AI route calibration/context contract.
6. `useSituationGuard()` - situation-bound UI access.
7. `saveToolOutput()` - durable tool-output persistence.
8. `FirestoreSync` - graph persistence/sync.
9. `isServerDemoMode()` - demo/real mode split.
10. `NoSituationState()` - real-app empty-state surface.

## Surprising Connections Worth Watching

- `scripts/audit-tool-contracts.ts` calls both `hrefForTool()` and
  `getToolOperatingContract()`, so route drift and tool contract drift are now
  intentionally tied together.
- `scripts/generate-tool-docs.ts` calls both `getToolOperatingContract()` and
  `getToolContextBlueprint()`, so generated tool docs should be refreshed after
  changing contracts, context blueprints, or route taxonomy.
- `scripts/smoke-extraction-pipeline.py` reaches
  `backend/services/context_genesis/pipeline.py`, making extraction-pipeline
  smoke coverage a useful backend architecture canary.

## Dead-Code Review

`knip --reporter json` was run as an exploratory scan. It reported many
unused files/exports, but the result is intentionally treated as advisory
because this repo contains:

- manually invoked migration scripts,
- generated or registry-discovered tool pages,
- reusable UI components kept for upcoming surfaces,
- route modules discovered by Next.js rather than direct imports,
- compatibility aliases for legacy tool URLs and data shapes.

No broad deletion was performed from the Knip output. The next cleanup round
should handle candidates one category at a time with a route/build/test proof
after each removal.

## Cleanup Completed In This Pass

- Removed stale `graphify-out/graph.html` from the tracked generated outputs
  because graphify skipped HTML generation for the current 5,147-node graph.
- Updated `audit:master-charter` so it requires `graph.html` only when the
  graph is within the HTML visualization limit.
- Added `npm run audit:repo-shape` to guard graphify output presence, graph
  size sanity, report sections, and this handoff document.
- Added `audit:repo-shape` to `audit:gate`.
- Updated the top-level handoff docs to point future agents at this checkpoint.

## Next Extensive Improvement Round

Recommended order:

1. Deploy and smoke Pack 30/31 worker services:
   `extract-docling`, `extract-ner-gliner`, `extract-graphrag`,
   `sanctions-yente`, `simulate-policy-abm`.
2. Add a durable authenticated browser fixture so `/app/*` user flows can be
   tested beyond the public demo and auth redirects.
3. Continue replacing placeholder/stub runtime paths only where a real user can
   hit them: reports API, graph-update apply/revert, and worker-backed tool
   runs are higher value than unused export cleanup.
4. Run Knip by category and remove only files proven unreachable by route,
   registry, generated docs, and build/test checks.
5. Create a narrowed graphify visualization for the app shell/workbench/tools
   subgraph so humans can navigate the current architecture without exceeding
   the HTML graph limit.

## Verification Contract

Run before the next major branch/commit:

```bash
npm run audit:repo-shape
npm run audit:master-charter
npm run audit:routes
npm run typecheck
npm run build
```

For production-facing changes, also run a browser smoke against
`https://praxis.tacitus.me` and commit the evidence under `docs/audits/`.

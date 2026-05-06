# PRAXIS Structure Plan — 2026-05-06

This plan follows the second Codex audit of the app, docs, tool registry, cockpit, and database footprint. It is intentionally practical: keep the system shippable, reduce duplicate surfaces, and make every paid database justify its place in the runtime.

## Current Decisions

- **Firestore is the canonical product database.** User state, situations, tool outputs, graph facts, credits, admin snapshots, and real-time UI state stay there.
- **Cloud SQL Postgres is only for LangGraph checkpoints.** The live instance is `praxisbytacitus-instance` in `us-east4`, private IP only, Postgres 16, `db-f1-micro`, 10 GB, database `praxis_langgraph`. Cloud Run backend is wired with `LANGGRAPH_CHECKPOINT_BACKEND=postgres` and `/agents/health` exercises the checkpointer.
- **Cloud SQL is not yet earning its full keep.** The Next.js tool pages still run synchronously through AI SDK routes. Durable LangGraph execution is present in the backend foundation, but not yet the main execution path for the cockpit/tools.
- **Spanner is dormant.** The repo contains Spanner Graph adapter code and setup scripts, but the live Spanner API is disabled in the checked project. Do not enable Spanner or run `infrastructure/setup-spanner.sh` without an explicit cost decision.
- **BigQuery and Cloud Storage are supporting infrastructure.** BigQuery owns analytics; Cloud Storage owns uploads/artifacts. Neither should become interactive app state.
- **Cockpit is the app home.** `/app` redirects to `/app/cockpit`; the cockpit should remain the top-level working surface, with dashboard and tools underneath it.

## Immediate Cleanup Landed

- Replaced stale `/app/docs` static page with a redirect to `/app/tools?show_archive=1`. The removed page hardcoded the old 21-tool world and duplicated the registry-generated tool docs.
- Fixed `scripts/audit-gcp.mjs` list parsing so Windows `gcloud` output does not make the live `praxis_langgraph` database look missing.
- Updated stale README/CLAUDE tool counts to describe the current 55 registered surfaces and the hero/archive split.
- Kept tool routing centered on `src/lib/tools/tool-navigation.ts`, `src/lib/tools/tool-path-taxonomy.ts`, and `src/lib/constants/tool-registry.ts`.

## Target App Structure

| Layer | Owner Files | Rule |
|---|---|---|
| App home | `src/app/app/cockpit/page.tsx` | First working screen for policy files, cases, and demo templates. |
| Executive dashboard | `src/app/app/dashboard/page.tsx` | Situation health, status, next best actions, and live summaries. |
| Tool workspace | `src/app/app/tools/page.tsx` | Registry-driven catalogue: 12 hero tools first, 43 archive/specialist tools behind `show_archive=1`. |
| Tool registry | `src/lib/constants/tool-registry.ts` | Single inventory of tool ids, labels, categories, API routes, pages, credit posture, and maturity. |
| Navigation | `src/lib/tools/tool-navigation.ts` | Single href resolver. No page should invent its own legacy path mapping. |
| Workflow taxonomy | `src/lib/tools/tool-path-taxonomy.ts` | Single hero/archive grouping source. |
| Tool contracts | `src/lib/tools/tool-operating-contracts.ts` and audit scripts | Machine-check page/API/schema/route expectations. |
| Persistent UI state | `src/lib/firebase/*`, hooks, stores | Firestore-backed where it must survive navigation or user sessions. |
| Durable agents | `backend/agents/langgraph/*` | LangGraph checkpointing only; summaries and operator views mirror to Firestore. |

## Database And Cost TODO

1. **P0 — Decide Cloud SQL purpose within this sprint.**
   If Brainstorming Table / durable agent work is the next milestone, keep Cloud SQL and wire the first production agent to it. If not, export and shut down/remove the instance after owner approval. Do not let it sit as paid infrastructure for a future-only path.

2. **P0 — Inventory the extra `dialectica` database.**
   The live Cloud SQL instance also contains a `dialectica` database. It does not add a separate instance charge by itself, but it is an unknown schema on a paid instance. Inspect tables, owners, and last activity before any deletion.

3. **P0 — Add a cost guard to Spanner docs/scripts.**
   Keep `GRAPH_BACKEND=firestore` as default. Add explicit “requires approval” language to Spanner setup docs/scripts before anyone can accidentally provision 100 processing units for a dormant graph backend.

4. **P1 — Finish LangGraph cleanup and retention.**
   Implement the checkpoint cleanup job through LangGraph checkpointer APIs, mirror `checkpointDeletedAt` to Firestore `agent_runs`, and surface failures in `system_events`.

5. **P1 — Make operator console show database health.**
   Add Cloud SQL checkpoint status, last `/agents/health` result, Cloud Tasks queue state, and recent scheduler status to `/app/admin/operator-console`.

## App/Cockpit TODO

1. **P0 — Keep `/app/cockpit` as the only home.**
   Any old “docs as app map” or duplicate dashboard entry should redirect to cockpit, dashboard, or tools.

2. **P0 — Make the sidebar consume shared route definitions.**
   The sidebar currently has hand-maintained groupings. Move its app links toward the same route/tool sources used by the tools workspace.

3. **P1 — Collapse overlapping dashboard surfaces.**
   Dashboard should answer “what is happening and what should I do next”; cockpit should answer “which file/template/workflow am I in”; tools should answer “which capability do I need now.”

4. **P1 — Promote only proven tools into the hero loop.**
   Keep the 12-tool hero loop tight. Archive tools can stay available, but they should not crowd the main product path until their contract, route, persistence, and output quality are green.

5. **P2 — Remove demo/prod ambiguity.**
   Demo case fixtures, Syria showcase chapters, and production situation flows should share components where possible but keep separate data loaders and labels.

## Codebase TODO

1. **P0 — Keep generated docs generated.**
   Do not hand-edit `docs/tools/generated/*`; run `npm run generate:tool-docs` after registry changes.

2. **P0 — Keep audit scripts in the build gate.**
   Required local gate: `npx tsc --noEmit`, `npm run lint -- --quiet`, `npm run audit:routes`, `npm run audit:tool-contracts`, `npm run audit:tools`, `npm run audit:verify`, `npm run verify-tools`, `npm run build`.

3. **P1 — Reduce per-tool bespoke glue.**
   New tools should start from the contract/registry/context/persistence pattern. Existing tools that bypass `tool-navigation`, `withCalibration`, or `usePersistedToolData` should be upgraded as they are touched.

4. **P1 — Split future premium backbones from current product.**
   Dialectica, Spanner, premium graph reasoning, and ADK/Agent Engine should be marked as current, dormant, or future in code comments and docs. Avoid user-facing claims that imply all premium backbones are already active.

5. **P2 — Archive superseded plans.**
   There are still historical docs with 40/48-tool assumptions. Keep them as dated artifacts, but current docs should point to this plan, `STRATEGY.md`, and the generated registry docs.

## Validation Gates

- `npm run audit:gcp` must pass without false SQL negatives.
- `/app/docs` must redirect to `/app/tools?show_archive=1`.
- `/app/tools?show_archive=1` must show all 55 registered surfaces without duplicate React keys.
- `/app/cockpit`, `/app/dashboard`, and `/app/tools` must remain the three primary app surfaces.
- Cloud SQL stays only if a durable agent path is actively shipping; otherwise owner approval is required before any destructive cost-control action.

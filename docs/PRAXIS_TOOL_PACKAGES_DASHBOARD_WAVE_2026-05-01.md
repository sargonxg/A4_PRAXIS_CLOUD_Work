# PRAXIS Tool Packages Dashboard Wave - 2026-05-01

## Objective

Make the workspace easier to understand as a professional operating system:
every user gets the generic PRAXIS context workspace, then a specialist package
based on the situation workflow path.

This wave focuses on the active product scope:

- generic core tools;
- conflict / political analyst path;
- visible but clearly staged future packages.

## Implemented

- Added package summaries to `src/lib/tools/tool-path-taxonomy.ts`.
- Promoted GraphOps into the generic core workspace because canonical graph
  health, evidence, temporal assertions, and repair suggestions are now part of
  the context backbone.
- Added `ToolPackagesPanel` to the real dashboard.
- Updated `CoreToolsWidget` to read the generic core package instead of the old
  hardcoded MVP list.
- Added unit coverage for dashboard package summaries.

## Dashboard Behavior

The dashboard now shows:

- Core workspace: common context, sources, documents, graph, timeline, Ask
  PRAXIS, briefing, report, and research capabilities.
- Active specialist path: conflict / political analyst tools, including early
  warning, risk, actor profiles, stakeholder map, geospatial monitor,
  commitments, media/info environment, ARGUS, policy memo, talking points, and
  dossier.
- Additional packages: country desk, mediator/envoy, humanitarian access,
  legal/sanctions, political risk, policy research, media/disinformation,
  stabilization, and election/governance paths marked as next or future.

## Next 10 Improvements

1. Add a dedicated Tools Workspace page with package filters, readiness badges,
   search, and per-tool health.
2. Add package-specific onboarding: if a situation is conflict/political, ask
   the missing questions required by early warning, risk, actors, sources, and
   graph tools.
3. Make the sidebar visually distinguish core, active specialist, and future
   specialist tools without hiding advanced tools from power users.
4. Add package readiness scoring: context completeness, evidence coverage,
   graph health, source coverage, and saved-output coverage.
5. Add package-level "generate first useful output" actions: Daily Read, Risk
   Scan, Actor Map, Policy Memo, and Talking Points.
6. Add Ask PRAXIS package awareness so the assistant can say which tool should
   handle a user request and can patch package-visible outputs.
7. Add per-package audit logs: tool run, source used, graph proposal created,
   draft generated, export created.
8. Add package-level saved views for analysts: "monitoring mode",
   "briefing mode", "drafting mode", and "research mode".
9. Add admin/operator coverage for package health across all situations.
10. Add GraphOps package gating: graph-dependent tools should show a warning
    when canonical graph evidence or temporal coverage is weak.

## Verification

Run after edits:

```powershell
npx vitest run tests\unit\lib\tools\tool-path-taxonomy.test.ts
npx tsc --noEmit --pretty false
npm run audit:tool-contracts
npm run build
```

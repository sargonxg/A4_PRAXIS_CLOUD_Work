# PRAXIS Next 10 Improvements - 2026-05-01

## Ranking Logic

This list is ranked by product impact and whether the change strengthens the
live AI/tool backbone instead of adding isolated UI polish.

## Next 10

1. Package readiness scoring on the dashboard.
   - Status: implemented in this wave.
   - Why: users need to know which tool packages are actually ready, saved,
     context-complete, and AI-wired before trusting generated outputs.
2. Registry/tool-status drift elimination.
   - Status: implemented in this wave.
   - Why: GraphOps was visible in the workspace but not registered as a formal
     tool; the bulk status endpoint also used a static list. Registered tools
     are now the source of truth for status coverage.
3. GraphOps as a first-class core tool.
   - Status: implemented in this wave.
   - Why: the graph backbone is central to PRAXIS. Graph health, proposals,
     evidence coverage, and temporal assertions must be exposed as a normal
     tool, not hidden maintenance.
4. Dedicated Tools Workspace page.
   - Status: next.
   - Scope: package filters, tool search, readiness badges, output freshness,
     graph dependency warnings, and "run next" actions.
5. Package-specific onboarding.
   - Status: next.
   - Scope: conflict/political situations should ask the missing questions
     needed by early warning, risk, actors, sources, graph, and drafting tools.
6. Graph-dependent tool gating.
   - Status: next.
   - Scope: conflict graph, timeline, actor profiles, stakeholder map, risk,
     and executive intelligence should warn when graph evidence or temporal
     coverage is weak.
7. Ask PRAXIS package awareness.
   - Status: next.
   - Scope: Ask PRAXIS should know the active package, recommend the right
     tool for a request, and write corrections into tool-specific outputs.
8. Unified package actions.
   - Status: next.
   - Scope: Daily Read, Source Scout, Risk Scan, Actor Map, Policy Memo, and
     Talking Points should be visible as package-level next actions.
9. Active-path AI route uplift.
   - Status: next.
   - Scope: raise Conflict Graph, Deep Search Agent, Policy Memo, Executive
     Intelligence, Source Scout, and Talking Points from 6/12 route-quality
     scores toward the 10/12 baseline.
10. Operator/admin package health.
    - Status: next.
    - Scope: admin view of package readiness across situations, failed tool
      runs, stale outputs, missing context, and graph maintenance pressure.

## Verification Evidence

- `graphops` is now in `TOOL_REGISTRY`.
- `/api/tool-status` now derives bulk coverage from `TOOL_REGISTRY`.
- Dashboard package cards now compute readiness from saved tool outputs,
  context readiness, and AI/data route wiring.
- Generated tool docs and backlog now report 54 registered tools.

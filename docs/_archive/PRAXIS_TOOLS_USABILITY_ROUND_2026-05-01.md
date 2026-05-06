# PRAXIS Tools Usability Round - 2026-05-01

## Objective

Make the app easier for a real user to operate from the dashboard and Tools
Workspace: not just "what is missing", but "what should I do next".

## 10 Solid Targets

1. Convert package readiness into concrete next actions.
   - Status: shipped with `getToolPackageActions()`.
2. Add graph dependency warnings for tools that read or write the canonical
   graph.
   - Status: shipped in package readiness warnings.
3. Add source dependency warnings for live intelligence packages.
   - Status: shipped in package readiness warnings.
4. Add document dependency warnings for drafting/document-production packages.
   - Status: shipped in package readiness warnings.
5. Track stale tool IDs, not only stale counts.
   - Status: shipped in package readiness output.
6. Add shared tool navigation so dashboard and workspace links agree.
   - Status: shipped with `hrefForTool()`.
7. Show package actions on `/app/tools`.
   - Status: shipped on active package summaries.
8. Show package actions on the dashboard package cards.
   - Status: shipped in `ToolPackagesPanel`.
9. Keep action ranking deterministic and testable.
   - Status: shipped with unit coverage.
10. Keep the user's next move visible without requiring them to understand the
    full tool taxonomy.
    - Status: first pass shipped; remaining work is package-level run buttons
      that invoke generation directly from the workspace.

## Remaining Functional Follow-Ups

- Add direct package-level run actions: Daily Read, Risk Scan, Actor Map,
  Policy Memo, and Talking Points.
- Make GraphOps warnings use richer evidence/temporal coverage once those
  metrics are exposed in a cheap status endpoint.
- Add package-specific onboarding questions when the active situation is thin.
- Teach Ask PRAXIS to recommend package actions and write corrections into the
  right saved tool output.

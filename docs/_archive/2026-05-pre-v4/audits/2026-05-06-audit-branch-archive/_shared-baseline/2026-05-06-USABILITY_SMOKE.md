# PRAXIS Usability Smoke

Date: 2026-05-06
Repo: `C:\Users\giuli\praxiscodexworking`
Base URL tested: `http://localhost:3107`

## Scope

This smoke pass checks the app as a user would touch it:

- Landing page navigation and section anchors.
- Landing hero visual, static motion fallback, and DIALECTICA 3D ontology graph.
- Demo login into the unified Workbench.
- Context Studio, Ontology System, Graph Visualization, Tools Marketplace, and Memo Studio.
- Four persona flows for analyst, diplomat, mediator, and researcher.

## Evidence

- `PLAYWRIGHT_BASE_URL=http://localhost:3107 npx playwright test "tests/e2e/app-usability-smoke.spec.ts" --reporter=line` passed: 2/2.
- `PLAYWRIGHT_BASE_URL=http://localhost:3107 npx playwright test "tests/e2e/landing-smoke.spec.ts" "tests/e2e/personas" --reporter=line` passed: 5/5.
- `npx tsc --noEmit` passed after the browser-smoke additions.

## Notes

- The prior analyst persona test expected the old generic `Graph` panel shape.
  The live graph tab now renders `Graph Visualization`, so the test fixture now
  accepts the current graph heading and verifies the visible graph canvas,
  graph-node stats, and truth-layer summary.
- Development-mode React can emit an `eval()` CSP console message. It is
  filtered in the smoke test as dev-only noise; production builds do not use
  that React debug path.

## Remaining Gaps

- This is not the charter's 10-run CI persona streak.
- This is not a production-authenticated smoke against `praxis.tacitus.me`.
- Mobile visual regression screenshots and production deploy evidence remain
  separate launch-gate tasks.

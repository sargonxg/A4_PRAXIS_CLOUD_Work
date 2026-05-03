# PRAXIS Consolidated Tool Audit

Date: 2026-05-01  
Workspace: `C:\Users\giuli\praxiscodexworking`  
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## Decision

PRAXIS now uses twelve primary user-facing tool surfaces. The older specialized
pages are preserved as supporting pages, but they no longer dominate primary
navigation or first-run recommendations.

1. Situation Dashboard
2. Context Builder
3. Executive Intelligence
4. Research & Sources
5. Conflict Graph
6. GraphOps
7. Boardroom / Brainstorming Table
8. Briefing
9. Policy Memo
10. Scenarios
11. Negotiation Prep
12. Treaty Analyzer

## Audit Findings

- The codebase had four competing tool structures: the full registry, tool
  groups, workflow package taxonomy, and a hardcoded sidebar. This made the app
  look larger and less coherent than the actual reliable workflow.
- The reliable product backbone is context -> sources/documents -> Firestore
  graph -> visualizations -> Ask PRAXIS/briefing.
- Many specialized tools are still useful, but they are better treated as
  supporting capabilities inside Research & Sources, Actors & Stakeholders, or
  Briefing Studio.
- Grounded research could multiply Google/Vertex calls by running a broad
  query plus several focused query batches. Premium server API keys could also
  be used for all users when present in the environment.

## Implemented

- Added `src/lib/constants/consolidated-tools.ts` as the canonical operating-loop
  map, including legacy-tool absorption and cost posture.
- Registered Context Builder as a first-class operational tool, and aligned
  hero registry anchors, app pages, API/data routes, context blueprints,
  readiness checks, and sidebar status ids with the 12-tool policy.
- Added specialized development groups for research, graph/ontology,
  mediation, signals, and briefing/legal tools. These preserve specialist
  pages while clearly marking them outside the primary 12-hero workspace.
- Rebuilt the sidebar around the consolidated workflow while preserving direct
  routes to legacy pages.
- Surfaced the specialized development groups in `/app/tools` and the
  dashboard Tool Packages panel.
- Refocused package taxonomy and core tool groups on the ten anchors.
- Normalized role recommendations so legacy IDs point to consolidated anchors.
- Simplified situation creation from ten workflow choices to five primary
  missions.
- Simplified the no-situation state to emphasize the real workspace backbone.
- Reduced default grounded-search fanout and required explicit opt-in before
  server-level Parallel/Firecrawl keys are used for all users.
- Added regression tests enforcing the 12-hero surface policy, registered
  anchors, legacy mapping, and active package focus.

## Cost Guardrail

Default research depth is now light:

- Google-grounded research uses two query batches by default.
- Standard depth uses three.
- Deep depth uses five plus up to two focused query batches.
- Server-level Parallel/Firecrawl keys require
  `PRAXIS_ENABLE_SERVER_PREMIUM_RESEARCH=1` or an explicit
  `allowServerPremiumProviders` request option.
- User-provided Tavily/Parallel/Firecrawl keys still work when configured.

## Validation

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with existing warning backlog, no errors.
- `npx vitest run`: passed, 95 files and 457 tests.
- `npm run build`: passed.
- `npm run audit:tool-contracts`: passed, 55/55 tools.
- `npm run audit:routes`: passed, 62 calibrated AI routes and 5 exempt.
- `npm run audit:tools`: passed and regenerated the 2026-05-01 audit.
- `npm run audit:gcp`: passed, 0 hard failures and 0 soft warnings.
- `npm run generate:tool-backlog`: passed and regenerated the sprint backlog.
- `npm run generate:tool-docs`: passed, 55 generated tool specs.
- `graphify update .`: passed, 3253 nodes and 3998 edges.
- Browser smoke on `http://localhost:3100/demo/tools`: passed; consolidated
  sidebar rendered, Context Builder appeared as a primary tool, and the
  specialized development groups rendered behind the primary heroes.

# PRAXIS Consolidated Tool Audit

Date: 2026-05-01  
Workspace: `C:\Users\giuli\praxiscodexworking`  
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## Decision

PRAXIS now uses ten primary user-facing tool surfaces. The older specialized
pages are preserved as supporting pages, but they no longer dominate primary
navigation or first-run recommendations.

1. Situation Dashboard
2. Context Builder
3. Ask PRAXIS
4. Research & Sources
5. Documents
6. GraphOps
7. Conflict Graph
8. Timeline & Signals
9. Actors & Stakeholders
10. Briefing Studio

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

- Added `src/lib/constants/consolidated-tools.ts` as the canonical ten-surface
  map, including legacy-tool absorption and cost posture.
- Rebuilt the sidebar around the consolidated workflow while preserving direct
  routes to legacy pages.
- Refocused package taxonomy and core tool groups on the ten anchors.
- Normalized role recommendations so legacy IDs point to consolidated anchors.
- Simplified situation creation from ten workflow choices to five primary
  missions.
- Simplified the no-situation state to emphasize the real workspace backbone.
- Reduced default grounded-search fanout and required explicit opt-in before
  server-level Parallel/Firecrawl keys are used for all users.
- Added regression tests enforcing ten-or-fewer primary surfaces, registered
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
- `npx vitest run`: passed, 95 files and 456 tests.
- `npm run build`: passed.
- `npm run audit:tool-contracts`: passed, 54/54 tools.
- `npm run audit:routes`: passed, 62 calibrated AI routes and 5 exempt.
- `npm run audit:tools`: passed and regenerated the 2026-05-01 audit.
- `npm run audit:gcp`: passed, 0 hard failures and 0 soft warnings.
- Browser smoke on `http://localhost:3100/demo/tools`: passed; consolidated
  sidebar rendered, no framework overlay, package counts showed 9/10 active
  tools and 5-6 future package tools.

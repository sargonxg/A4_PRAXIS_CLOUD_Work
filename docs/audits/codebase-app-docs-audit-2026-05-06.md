# PRAXIS Codebase, App, And Docs Audit - 2026-05-06

## Scope

Reviewed the current Next.js app surface, tool registry, audit scripts, generated tool docs, README/agent docs, and local browser behavior for `/app/tools?show_archive=1`.

## Findings Fixed

- README and CLAUDE guide still described the app as 38+/40+ tool pages. The registry now defines 55 registered tool surfaces: 12 hero workflow tools and 43 archived specialist tools.
- Tool workspace archive links fell back to non-existent routes for several registry ids: `actor-profiles`, `alert-center`, `brief-builder`, `deep-research`, and `red-team-review`.
- `scripts/verify-tools.ts` referenced stale route names such as `/api/ai/risk`, `/api/ai/scenarios`, `/api/ai/mediation`, `/api/ai/sanctions`, and `/api/ai/commitments`.
- `scripts/audit-tool-contracts.ts` only understood `/api/ai/*` routes and hardcoded a small page alias table, so it marked valid dashboard/alert/archive destinations as missing.
- Generated tool specs had stale workflow path membership data and repeated same-path memberships for tools that appeared in both `core` and `primary` tiers.
- `src/components/syria/ask-praxis.tsx` tripped the React compiler immutability lint rule by mutating a streaming buffer inside render-managed state updates.

## Current Audit Results

- AI route calibration: `62 AI route files, 62 calibrated, 5 exempt`.
- Tool contract audit: `55/55` registered tools pass route/page/contract checks.
- Tool registry verification: 12 hero tools, 43 archived tools, 54 registered API routes present. `team` intentionally has no API route.
- Tool quality audit: 62 AI routes audited; 2 routes currently meet the strict `>=10/12` scoring threshold. The remaining gaps are mostly deeper schema/quality dimensions, not missing route wiring.

## Browser Check

Verified `http://localhost:3000/app/tools?show_archive=1&case=syria` with agent-browser:

- Page loads with meaningful content.
- No Next.js error overlay.
- Duplicate React key errors for `generic-core` are resolved.
- Corrected archive rows link to live app destinations:
  - Actor Profiles -> `/app/actors`
  - Alert Center -> `/app/alerts`
  - Brief Builder -> `/app/briefing`
  - Deep Research Agent -> `/app/deep-search-agent`
  - Executive Intelligence -> `/app/dashboard`
  - Red-Team Review -> `/app/assistant`

The remaining development-console warning is the expected React DevTools/CSP `unsafe-eval` warning in Next.js dev mode, not a production build error.

## Verification Run

- `npx tsc --noEmit`
- `npm run lint -- --quiet`
- `npm run audit:routes`
- `npm run audit:tool-contracts`
- `npm run audit:tools`
- `npm run audit:verify`
- `npm run verify-tools`
- `npm run build`
- `graphify update .`


# PRAXIS Daily Work Plan

This plan gives future agents a concrete day-by-day path. Update it whenever priorities change.

## Daily Startup Checklist

```bash
git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
cd A4_PRAXIS_CLOUD_Work
git status
git log --oneline -5
npm install
```

Read:

- `README.md`
- `CLAUDE.md`
- `AGENTS.md`
- `docs/CONTINUATION.md`
- `docs/STRATEGY.md`
- `docs/DAILY_WORKPLAN.md`
- `docs/DEPLOYMENT_LOG.md`
- `CHANGELOG.md`

Run before editing when practical:

```bash
npm run build
npm run lint
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
```

## Day 1 - Production Verification And Handoff

Status: completed on 2026-04-25.

- Deploy current validated source to Cloud Run.
- Verify `praxis.tacitus.me`, `/login`, `/onboarding`, `/api/health`, and `/api/auth/test-firebase`.
- Confirm Cloud Run revisions are ready.
- Confirm Firebase Auth authorized domains include `praxis.tacitus.me`.
- Create `AGENTS.md`, strategy docs, daily plan, deployment log, and prompt handoff docs.

## Day 2 - Shared Hook And React Compiler Cleanup

Goal: reduce warnings that can hide real bugs without broad UI rewrites.

- Fix `use-conflict-data.ts`, `use-tool-status.ts`, `useToolData.ts`, and `use-persisted-tool-data.ts`.
- Prefer derived state or async callbacks over synchronous setState in effect bodies.
- Keep behavior unchanged.
- Run `npm run lint`, `npm run build`, and `npx vitest run`.

## Day 3 - Middleware To Proxy Migration

Goal: align with Next.js 16 while preserving auth behavior.

- Inspect `src/middleware.ts`.
- Migrate to `src/proxy.ts` only if Next.js 16 supports the same matcher/session behavior in this project.
- Verify unauthenticated `/app/*` redirects to `/login`.
- Verify demo routes still work.
- Run build and route smoke checks.

## Day 4 - Pricing And Entitlement Audit

Goal: one plan model everywhere.

- Audit `src/lib/constants/pricing.ts`, Stripe checkout/webhook routes, settings UI, user profile subscription fields, and entitlement checks.
- Document all plan IDs and Stripe lookup keys.
- Add helper tests for entitlement decisions.
- Keep public pricing monthly and plan-based.

## Day 5 - Tool Registry Alignment

Goal: route IDs, registry IDs, sidebar IDs, and Firestore tool document IDs match.

- Audit `src/lib/constants/tool-registry.ts`.
- Compare sidebar routes, `/api/ai/*` routes, `saveToolOutput`, `usePersistedToolData`, and `scripts/audit-ai-routes.mjs`.
- Fix hyphen/underscore mismatches.
- Hide nonfunctional placeholders.

## Day 6 - Dashboard And Onboarding Propagation

Goal: onboarding choices influence actual workspace behavior.

- Trace AnalystProfile usage from onboarding completion to `withCalibration`.
- Improve dashboard sections around role, situation, source context, recommended tools, and next actions.
- Add clear empty states for no situation, incomplete onboarding, and missing sources.

## Day 7 - Agent Expertise Content

Goal: make expert agents concrete.

- Add docs and prompt blocks for:
  Policy Analyst, Diplomatic Advisor, Conflict Analyst, Media/Disinformation Analyst, Sanctions/Legal Analyst, Humanitarian Access Analyst, Scenario Planner, Negotiation/Mediation Advisor.
- Ensure each agent reads canonical situation context and AnalystProfile.
- Add tests or audit checks where possible.

## Weekly Review Checklist

At the end of each week:

- Update `CHANGELOG.md`.
- Update `docs/CONTINUATION.md`.
- Update `docs/DEPLOYMENT_LOG.md`.
- Update this file with completed and next work.
- Commit and push.
- Deploy only after validation passes.


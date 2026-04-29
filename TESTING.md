# PRAXIS Testing

Last updated: 2026-04-29.

Testing has two goals:

1. Prove the code still builds and route contracts are intact.
2. Prove real users can complete valuable workflows without confusion,
   silent failures, empty outputs, or trust gaps.

The current multi-agent testing roadmap is in
`docs/PRAXIS_SUPERPLAN_2026-04-29.md`, especially Phase 4. That plan is the
source of truth for new Playwright, route-smoke, persona, persistence,
provenance, mobile, and slow-network testing work.

The latest persona QA evidence is in
`docs/PRAXIS_SOPHISTICATED_PERSONA_WAVE_2026-04-29.md`. It raises the bar from
smoke checks to serious user workflows and includes a 35-item roadmap for
AI-trust, export, demo-routing, landing, and deployment-parity testing.

## Automated Checks

```bash
npx tsc --noEmit
npm run build
npm run lint
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
```

Focused checks:

```bash
npx vitest run <test-file>
playwright test tests/e2e/golden-path.spec.ts
playwright test tests/e2e/capabilities-api.spec.ts
```

Backend checks live under `backend/tests` and should be run when touching the
Python service, graph pipeline, backend auth, or agent runtime.

## Current Verified Baseline

On 2026-04-29:

- `npx tsc --noEmit`: passed.
- `npx vitest run tests/unit/lib/ai/situation-intelligence-schema.test.ts`:
  passed for geopolitical, corporate conflict, policy memo, and invalid
  strategic-insight schema cases.
- `npx vitest run tests/tools/situation-intelligence.smoke.test.ts tests/unit/lib/ai/situation-intelligence-schema.test.ts tests/unit/lib/dashboard/role-recommendations.test.ts`:
  passed for route calibration, canonical persistence, weak input, invalid
  schema handling, output schema, and recommendation/registry behavior.
- `npm run build`: passed; Next.js still warns that `middleware` should become
  `proxy`.
- `npm run lint`: passed with existing warnings and no errors.
- `npm run audit:routes`: passed, 61 AI routes calibrated and 5 exempt.
- `npm run audit:gcp`: passed, 0 hard failures and 0 soft warnings.
- `npx vitest run tests/unit/lib/api/with-calibration.test.ts`: passed,
  including shared AI safeguards for malformed JSON, excessive chat history,
  and oversized request bodies before credits or model calls.

Full Vitest, Playwright, and backend pytest still need to be run for any
production deploy checkpoint after this documentation pass.

## Manual Persona Testing

Test as:

- First-time user.
- Serious customer.
- Returning user.
- Power user.
- Admin/operator.
- Security reviewer.
- Non-technical user.

Record exact route, action, expected behavior, actual behavior, console/network
errors, persistence path, and whether the output is useful, cited, saved, and
reloadable.

## Critical Flows

- Auth and session lifecycle.
- Onboarding and profile persistence.
- Situation creation and domain classification.
- Dashboard first value.
- Dashboard Executive Intelligence panel: live AI generation, weak-input
  failure, persisted reopen, graph node click-through, provenance panel,
  confidence panel, and timestamped JSON export.
- Ask PRAXIS over current situation and saved outputs.
- Shared AI safeguards: oversized payloads return `413`, malformed JSON returns
  `400`, and these failures happen before credits, tool runs, or model calls.
- Tool generation through the shared `ToolPageShell`/`AiPopulate` path.
- Document upload and retrieval.
- Graph staged proposal approval.
- Briefing/report generation and export.
- Admin diagnostics and operator console.
- Provider health with missing optional credentials.

## Browser QA Rules

- Watch browser console and network requests.
- Test loading, empty, error, unauthenticated, unauthorized, and slow-network
  states.
- Verify mobile layout for core workflows.
- Never call a flow tested if it was only inspected statically.
- Local demo/auth browser QA requires `COOKIE_SIGNING_SECRET`. For one
  temporary dev-server process, use:
  `cmd /c "set COOKIE_SIGNING_SECRET=local-dev-only&& npm run dev -- --port 3100"`.
  For normal local development, set a persistent non-production value in
  `.env.local` or your shell profile. Do not reuse the production secret.

## Latest Browser Smoke

On 2026-04-29 with `agent-browser 0.26.0`:

- `http://localhost:3100/` loaded with content and no Next.js error overlay.
- `/app/dashboard` unauthenticated redirected to
  `/login?redirect=%2Fapp%2Fdashboard`.
- Missing `COOKIE_SIGNING_SECRET` caused `/api/auth/session` demo login to
  return 500, which is expected fail-closed behavior but blocks local demo QA.
- Restarting the dev server with a process-scoped `COOKIE_SIGNING_SECRET`
  allowed demo session creation.
- `/login?mode=demo` entered `/demo/dashboard`.
- `/app/dashboard` with a demo session redirected to `/demo/dashboard`.
- Demo dashboard rendered the Nordalia workspace and sidebar without a
  framework error overlay.
- Follow-up persona QA found and fixed a demo trust gap: the dashboard daily
  brief no longer shows an admin-facing AI-provider configuration message in
  demo mode, and the demo banner no longer uses stale competitive positioning.
  The same wave also cleaned the dashboard intelligence-feed empty state so it
  no longer instructs demo users to configure retired provider-specific
  credentials, and aligned the demo welcome modal with the current Nordalia
  sample-workspace story. Details:
  `docs/PRAXIS_PERSONA_QA_WAVE_2026-04-29.md`.
- Validation for that wave: targeted stale-string `rg` returned no matches,
  `npx tsc --noEmit` passed, targeted ESLint passed with no errors, browser
  recheck passed on `/demo/dashboard`, and `npm run build` passed with only the
  known Next.js middleware-to-proxy warning.
- Sophisticated persona wave 2 then checked local and live landing/demo
  surfaces, audited AI trust risks through subagents, and started fixes for
  sanctions source gating and export provenance. See
  `docs/PRAXIS_SOPHISTICATED_PERSONA_WAVE_2026-04-29.md`.

Authenticated real-user Executive Intelligence browser QA remains open because
no real test login/session was provided in this run.

## Deeper References

- `docs/PRAXIS_SUPERPLAN_2026-04-29.md`.
- `docs/PERSONA_TEST_PLAN_2026-04-28.md`.
- `docs/TOOL_QUALITY_AUDIT_2026-04-28.md`.
- `docs/golden-path.md`.
- `playwright.config.ts`.
- `vitest.config.ts`.
- `TODO.md`.

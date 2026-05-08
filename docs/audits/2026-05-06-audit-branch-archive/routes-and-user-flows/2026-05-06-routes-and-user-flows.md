# PRAXIS Phase 1 Self-Audit: Routes and User Flows

Date: 2026-05-06
Scope: Topic A, routes-and-user-flows only
Worktree: `C:\Users\giuli\praxis-audit-routes-and-user-flows`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Owner write scope: this file and `docs/audits/2026-05-06-routes-and-user-flows.json`
Spend: $0 paid AI/API calls

## Sources Read

- `C:\Users\giuli\Downloads\PRAXIS_ARCHITECTURE.md`
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_00_MASTER_CHARTER.md`
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_03_WORKBENCH_ARCHITECTURE.md` through `PRAXIS_CODEX_14_PRODUCTION_EXCELLENCE.md`
- `docs/audits/2026-05-06-COMPREHENSIVE.md`
- Repo route/auth sources under `src/app`, `src/proxy.ts`, `src/lib/auth`, and route audit scripts

`/mnt/skills/user/praxis-conventions/SKILL.md` was checked and is unavailable.

## Executive Summary

Production is not blank and the primary public/demo path is usable: landing, pricing, legal pages, login, and the demo workbench rendered in browser without app console errors. Unauthenticated protected app/API routes generally gate as expected.

The main Phase 1 route contract drift is not basic availability; it is that the shipped demo and auth entry flows are not the documented flows. The architecture says `/demo/syria-2024` is a signed-out public read-only route and `/login` is magic-link/waitlist centered. The app currently routes the demo through `/login?mode=demo&example=syria-2026` into `/app/workbench/syria-2026`, and `/login` is Google plus email/password plus demo.

## Route Table

| Route | Contract expectation | Repo evidence | Production HTTP | Browser evidence | Result |
| --- | --- | --- | --- | --- | --- |
| `/` | Public landing | `src/app/(landing)/page.tsx` | 200 | H1: "The policy workbench for grounded statecraft." No app console errors. | PASS |
| `/login` | Waitlist or magic-link entry | Email/password, Google, reset, signup, demo controls | 200 | H1: "TACITUS"; no magic-link CTA visible. | DRIFT |
| `/pricing` | Public pricing | `src/app/pricing/page.tsx` | 200 | HTTP verified only. | PASS |
| `/privacy` | Public legal | `src/app/privacy/page.tsx` | 200 | HTTP verified only. | PASS |
| `/terms` | Public legal | `src/app/terms/page.tsx` | 200 | HTTP verified only. | PASS |
| `/app` | Authenticated app index | `src/app/app/page.tsx` redirects to `/app/workbench` | 307 `/login?redirect=%2Fapp` | Not followed as real user. | PASS |
| `/app/workbench` | Authenticated workbench / case picker | `src/app/app/workbench/page.tsx` | 307 to demo login query | Browser auto-demo ended in workbench with demo case. | PASS WITH DRIFT |
| `/app/workbench/[caseId]` | Authenticated case shell | `src/app/app/workbench/[caseId]/page.tsx` | Gated unless demo/auth session | Demo browser rendered Syria case with tabs and context health. | PASS DEMO |
| `/app/dashboard` | Legacy redirect to workbench | `src/app/app/dashboard/page.tsx` redirects | 307 to demo login query | HTTP verified only. | PASS |
| `/app/admin` | Owner-only admin | `src/app/app/admin/layout.tsx` blocks non-admin content | 307 `/login?redirect=%2Fapp%2Fadmin` signed out | Demo session showed "Admin session required"; admin content not visible. | PASS |
| `/onboarding` | Authenticated first-login/profile flow | `src/app/onboarding/page.tsx` | 307 `/login` signed out | Real user flow blocked; no test account. | BLOCKED |
| `/demo` | Public demo route | `src/app/demo/page.tsx` redirects to app workbench | 307 `/login?mode=demo&example=syria-2026` | Browser auto-demo ended at `/app/workbench/syria-2026?tab=chapters`. | DRIFT |
| `/demo/syria-2024` | Signed-out read-only public demo | Route file missing | 307 `/login?mode=demo&example=syria-2026` | Browser ended at `/app/workbench/syria-2026?tab=chapters`. | FAIL CONTRACT |
| `/api/auth/session` | Public session status | Cookie-aware GET | 200 `{"user":null}` signed out | HTTP verified local/prod. | PASS |
| `/api/capabilities` | Authenticated capability matrix | `withAuth` | 401 signed out | HTTP verified local/prod. | PASS |
| `/api/admin/*` sample | Authenticated/admin | `withAuth` plus `requireAdmin` on admin writes/domains | 401 signed out | HTTP verified `/api/admin/me`, `/domains`, `/diagnostics`. | PASS |
| `/api/health` | Public uptime | Public health check | 200 | HTTP verified. | PASS |
| `/api/health/feeds` | Operational diagnostics should be scoped | Public detailed feed status | 200 with feed names/statuses | HTTP verified. | REVIEW |
| `/api/health/provider` | Provider diagnostics | `withAuth` | 401 signed out | HTTP verified. | PASS |

## Flow Scorecard

| Flow | Score | Evidence |
| --- | ---: | --- |
| Public landing comprehension | 4/5 | Production `/` renders cleanly with visible PRAXIS positioning and no app console errors. |
| Signed-out login | 3/5 | Login renders and offers working-looking controls, but documented magic-link primary flow is absent. |
| Public demo entry | 2/5 | Browser reaches a useful demo workbench, but only via login-created demo session and `/app/workbench/syria-2026`, not direct `/demo/syria-2024`. |
| Protected app gate | 4/5 | Signed-out `/app/*` routes redirect to login; demo-eligible routes include demo query parameters. |
| Real authenticated onboarding | BLOCKED | No Firebase test user or secrets provided; not exercised. |
| Admin gate | 4/5 | Signed out redirects to login; demo session sees "Admin session required"; admin APIs return 401 signed out. |
| API auth/cost gate | 4/5 | Static audit reports 66 AI route files calibrated; sampled auth APIs 401 signed out. Paid AI POSTs not exercised by design. |
| Local dev availability | 2/5 | Selected local route checks worked only after using installed-worktree binaries, `NODE_PATH`, and webpack mode. |

## Findings

The typed JSON findings are in `docs/audits/2026-05-06-routes-and-user-flows.json`.

Blocking findings:

- `routes-flows-001` (S1): Public demo contract still resolves through login and the app workbench instead of a signed-out `/demo/syria-2024` route.
- `routes-flows-002` (S2): Login route does not implement the documented magic-link primary entry flow.

Non-blocking findings:

- `routes-flows-003` (S2): Authenticated app route surface is broader than the sealed eight-route architecture map.
- `routes-flows-004` (S3): Unauthenticated health routes are inconsistent about operational detail exposure.

Blocked checks:

- `routes-flows-005` (BLOCKED): Real Firebase user, onboarding completion, admin-verified session, and paid/user-secret flows were not testable.
- `routes-flows-006` (BLOCKED): Assigned sibling worktree lacks dependencies; local dev needed installed-worktree binaries and was not a representative standalone checkout.

## Artifacts

- Production HTTP route probe: public routes 200; `/app/*` protected routes 307; sampled protected APIs 401; `/api/health` 200.
- Production browser probe: landing, login, app workbench auto-demo, `/demo`, and `/demo/syria-2024`; no app console errors observed.
- Mobile browser probe: `/login?mode=demo&example=syria-2026` ended at `/app/workbench/syria-2026?tab=chapters` and rendered the Syria case.
- Admin browser probe: demo session at `/app/admin` rendered "Admin session required" and did not expose admin content.
- Static audits run with installed-worktree binaries: `audit-workbench: ok`, `audit-landing: ok`, `audit-master-charter: passed`, `audit-legal-pages-present: passed`, `audit-ai-routes: OK - 66 AI route files`.

## Blockers And Limits

- No real user credentials, admin principal, or test secrets were available. Authenticated user-owned flows are marked BLOCKED rather than inferred from demo mode.
- No paid AI/API calls were made. AI POST routes were inspected statically and sampled only for unauthenticated gate behavior.
- This sibling worktree has no `node_modules`. `npm run dev` failed. Local selected route checks used `C:\Users\giuli\praxiscodexworking\node_modules\.bin\next.cmd`, `NODE_PATH=C:\Users\giuli\praxiscodexworking\node_modules`, and `next dev --webpack -p 3026`.
- The local webpack workaround emitted OpenTelemetry dependency warnings including missing `@opentelemetry/exporter-jaeger`; those were recorded as dev-environment evidence, not app-code changes.

## Confidence

Confidence is high for signed-out production route status, public/demo browser rendering, static route inventory, and documented contract drift. Confidence is medium for local dev availability because the assigned worktree is intentionally dependency-light and required a workaround. Confidence is low for real authenticated/onboarding/admin-verified flows because no test credentials were provided.

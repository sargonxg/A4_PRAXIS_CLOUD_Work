# PRAXIS Phase 1 Self-Audit: Onboarding and Personas

Date: 2026-05-06
Topic: F - onboarding and personas
Worktree: `C:\Users\giuli\praxis-audit-onboarding-and-personas`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Branch: `audit/onboarding-and-personas-20260506`
HEAD: `ac2a7bbac66388af8a0f06f0c53324c08af0791e`

## Scope

This audit was read-only except for these two files:

- `docs/audits/2026-05-06-onboarding-and-personas.json`
- `docs/audits/2026-05-06-onboarding-and-personas.md`

No app fixes, installs, pushes, or deploys were performed.

Source documents reviewed:

- `docs/architecture/PRAXIS_ARCHITECTURE.md`
- `docs/codex-prompts/PRAXIS_CODEX_04_LANDING_AND_ENTRY_REBUILD.md`
- `docs/codex-prompts/PRAXIS_CODEX_09_VERIFICATION_AND_ADMIN.md`
- `docs/codex-prompts/PRAXIS_CODEX_11_MEMO_STUDIO_AND_LAUNCH.md`
- `docs/codex-prompts/PRAXIS_CODEX_14_PRODUCTION_EXCELLENCE.md`
- `docs/audits/2026-05-06-COMPREHENSIVE.md`

## Executive Status

Overall status: **RED**.

The codebase has useful onboarding and persona scaffolding, but the Phase 1 bar is not met:

- The persona suite exists, but production execution is currently **3/4**, not green.
- GitHub Actions does not show a persona CI workflow or a 10-run green streak.
- `/demo/syria-2024` is specified by the architecture as a public read-only demo, but it is absent in the route tree and redirects to login in production.
- The 60-second wow flow is specified in the architecture/packs, but there is no `60-second-wow` E2E test or implementation surface proving Welcome -> sample case -> first memo -> DOCX.
- Empty-state components exist, but the repo has only static hook checks and smoke docs, not a full empty-state sweep ledger.
- Lighthouse/public-demo accessibility cannot be meaningfully verified until the public demo route exists.

## Persona Suite

Observed files:

- `tests/e2e/personas/diplomat.spec.ts`
- `tests/e2e/personas/mediator.spec.ts`
- `tests/e2e/personas/analyst.spec.ts`
- `tests/e2e/personas/researcher.spec.ts`
- `tests/e2e/personas/_shared/persona-fixtures.ts`

Observed scripts:

- `package.json`: `smoke:personas`
- `package.json`: `test:e2e:personas`

The architecture/master-charter target is stronger than the current suite: Diplomat-Syria, Mediator-Northwind, Analyst-Sahel, Researcher-Nordalia with 10 consecutive green CI runs. The present suite covers Syria for diplomat/analyst and Nordalia for mediator/researcher; no Northwind or Sahel persona spec was found.

### Production Persona Run

Because the assigned worktree has no `node_modules`, the first sibling-binary attempt failed on `@playwright/test` resolution. With `NODE_PATH` pointed to `C:\Users\giuli\praxiscodexworking\node_modules`, the suite ran against production:

```powershell
PLAYWRIGHT_BASE_URL=https://praxis.tacitus.me `
NODE_PATH=C:\Users\giuli\praxiscodexworking\node_modules `
C:\Users\giuli\praxiscodexworking\node_modules\.bin\playwright.cmd test tests/e2e/personas --reporter=line --output=%TEMP%\praxis-audit-personas-pw
```

Result: **3 passed, 1 failed**.

Failure:

- Spec: `tests/e2e/personas/analyst.spec.ts`
- Assertion: `data-testid="praxis-graph-canvas"` visible
- Actual production snapshot: the graph tab rendered an accessible image named `Canonical PRAXIS graph`, but the expected `praxis-graph-canvas` test id was not present.

This means the suite is not production-green as written. The failure may be a stale test hook rather than a user-visible broken graph, but it still invalidates the persona green-streak claim.

## CI Green-Streak

GitHub credentials were available.

Observed workflows:

- `calibration-drift`

Observed `main` runs:

- `calibration-drift`, success, 2026-05-04, run `25326872759`
- `calibration-drift`, success, 2026-04-27, run `25002984849`

No persona workflow was present in `.github/workflows`, and `gh run list --branch main` returned only calibration-drift runs. The required 10-run persona green streak is **not evidenced**.

## 60-Second Wow Flow

Target from architecture/Pack 14:

`Welcome -> sample case -> first memo -> DOCX`, under 60-90 seconds, covered by `e2e/onboarding/60-second-wow.spec.ts`.

Observed:

- `src/app/onboarding/page.tsx` implements a profile wizard.
- `src/components/onboarding/welcome-modal.tsx` and `walkthrough.tsx` exist.
- `tests/e2e/onboarding.spec.ts` covers login/profile completion and first situation creation.
- No `tests/e2e/onboarding/60-second-wow.spec.ts` exists.
- No `SixtySecondWow` orchestrator was found.

Status: **Fail**. The flow is specified but not testable.

## Empty-State Posture

Positive evidence:

- `src/components/praxis/empty-state.tsx` has `data-testid="praxis-empty-state"`.
- `src/components/shared/empty-state.tsx` has `data-testid="shared-empty-state"`.
- `src/components/praxis/no-situation-state.tsx` offers workflow-specific CTAs.
- `src/components/praxis/onboarding-required-state.tsx` gives an onboarding CTA.
- `src/components/praxis/tool-error-boundary.tsx` exposes retry and `role="alert"`.
- `src/components/praxis/loading-states.tsx` uses `role="status"` and `aria-live="polite"`.
- `scripts/audit-ux-polish.ts` checks a selected set of empty/loading/error hooks.

Limit:

There is no comprehensive surface-by-surface empty/loading/error ledger in this worktree equivalent to Pack 09's requested `2026-05-06-EMPTY_STATES.md`. Current posture is **partial**, not complete.

## Public Demo Route

Architecture target:

- `/demo/syria-2024` public, signed-out, read-only, watermarked.

Observed route tree:

- `src/app/demo/page.tsx`
- `src/app/demo/layout.tsx`
- `src/app/demo/error.tsx`
- No `src/app/demo/syria-2024/page.tsx`

Observed production behavior:

| URL | Result |
|---|---|
| `https://praxis.tacitus.me/demo/syria-2024` | `307` to `/login?mode=demo&example=syria-2026` |
| `https://praxis.tacitus.me/demo` | `307` to `/login?mode=demo&example=syria-2026` |
| `https://praxis.tacitus.me/login?mode=demo&example=syria-2026` | `200` |

Status: **Fail**. A demo-login path exists, but not the public no-auth `/demo/syria-2024` route.

## Lighthouse and Accessibility

Observed:

- No `lighthouserc.json` file.
- No `lh:ci` script in `package.json`.
- `axe-core` appears in `package-lock.json`, but no demo-specific axe/accessibility Playwright spec was found.
- Prior local docs record landing/persona smoke and added accessibility hooks, but not public `/demo/syria-2024` Lighthouse/accessibility proof.

Status: **Fail / blocked**. Public demo Lighthouse/accessibility feasibility is blocked by the missing public route and missing LHCI wiring.

## Findings

| ID | Severity | Finding | Evidence | Recommended next action |
|---|---|---|---|---|
| F-01 | S0 | Persona CI green-streak requirement is not evidenced and production persona suite is red. | Only `calibration-drift` workflow exists; production persona run failed 1/4. | Add required persona workflow, align cases with spec, fix/update graph test hook, record 10 green CI runs. |
| F-02 | S0 | Public `/demo/syria-2024` route does not exist as specified. | Route file absent; production returns 307 to login demo. | Implement or explicitly defer the public signed-out read-only demo. |
| F-03 | S1 | 60-second wow flow is specified but not testable. | `60-second-wow.spec.ts` absent; existing onboarding test only covers profile setup. | Build the orchestrator/test or mark it deferred. |
| F-04 | S1 | Lighthouse/accessibility proof is not feasible for public demo. | No route, no `lh:ci`, no `lighthouserc.json`. | Add public route first, then LHCI and demo axe checks. |
| F-05 | S2 | Empty-state posture is partial. | Reusable states and static audit exist, but no complete sweep ledger. | Create the surface-by-surface empty/loading/error ledger and expand `audit:ux-polish`. |

## Verification Log

- `git rev-parse HEAD`: `ac2a7bbac66388af8a0f06f0c53324c08af0791e`
- `git branch --show-current`: `audit/onboarding-and-personas-20260506`
- `gh auth status`: authenticated as `sargonxg`
- `gh workflow list --all`: only `calibration-drift`
- `gh run list --branch main --limit 20`: two successful calibration-drift runs only
- `Invoke-WebRequest https://praxis.tacitus.me/demo/syria-2024`: `307` to `/login?mode=demo&example=syria-2026`
- Production persona Playwright run: `3 passed, 1 failed`

## Blockers and Non-Actions

- The assigned sibling worktree has no `node_modules`; no dependencies were installed.
- No local dev server was started.
- No app code was changed.
- No push or deploy was performed.

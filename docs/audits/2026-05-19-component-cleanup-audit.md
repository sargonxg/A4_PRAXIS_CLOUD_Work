# Component Cleanup Audit - 2026-05-19

## Scope

Evidence-led cleanup for the Tasklet app surface after the retired persona E2E suite and older source/onboarding UI paths were removed.

## Deleted

- `src/components/praxis/onboarding-required-state.tsx`
  - Final scan found no live source or test imports.
  - Remaining references were stale documentation claims that tools rendered this component directly.
  - Current contract remains server-side `withCalibration` plus `useSituationGuard()` gating; calibrated tool UI must not render while onboarding is incomplete.
- `src/components/sources/source-picker.tsx`
  - Final scan found no live source or test imports.
  - Remaining references were comments in source-category/data-contract files.
  - `SOURCE_CATEGORIES` remains as the runtime/persistence category contract because onboarding scaffolding still imports it.

## Kept

- `src/components/praxis/tasklet-praxis-workbench.tsx`
  - Active main cockpit surface.
  - Current capsule context contract is `capsule-context-dropzone` plus `capsule-browser-modal`.
- Repository, capsule browser/dropzone, Ask runtime, app shell, and navigation components.
  - These remain current Tasklet product surfaces and are covered by focused contract tests and audit gates.
- `src/lib/constants/source-categories.ts`
  - Still imported by onboarding case scaffolding and persisted situation contracts.

## Audit Repairs

- `.github/workflows/persona-smoke.yml` keeps the GitHub check name but now runs `npm run smoke:tasklet-app`.
- `package.json` adds `smoke:personas` as a compatibility alias to `smoke:tasklet-app`.
- `scripts/audit-tasklet-mvp-foundation.ts` now requires `capsule-context-dropzone` and `capsule-browser-modal` instead of the retired `capsule-context-picker`.

## Risk Notes

- `src/types/situation.ts` keeps `customSources` for backward compatibility with existing data.
- The deleted components should not be restored unless a live route imports them again and adds matching tests.
- Untracked launch-readiness/legal files were intentionally left outside this cleanup scope.

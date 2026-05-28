# Lane: Dependencies And Toolchain

## Scope

- `package.json` and `package-lock.json`.
- Framework/toolchain updates: Next, React, TypeScript, Playwright, Firebase, Genkit, AI SDK, Sentry, Tailwind.
- `npm audit`, peer dependency compatibility, lockfile churn.
- Global tool updates only when they affect the repo workflow.

## No-Touch Boundaries

- Do not mix dependency upgrades with unrelated feature work.
- Do not run `npm audit fix --force` without an explicit migration plan.
- Do not update major framework versions without checking release notes and existing config.

## Start Reads

- `docs/CODEX_SESSION_BRIEF.md`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `playwright.config.ts`
- `docs/testing/AUTHENTICATED_RUNTIME_TEST_LANE.md`

## Validation

```powershell
npm outdated --depth=0
npm audit --audit-level=high
npm run typecheck
npm run test
npm run build
```

For browser/tooling updates, add:

```powershell
npm run smoke:tasklet-app
```

## Done Evidence

- Packages changed.
- Why each package changed.
- Peer dependency and lockfile impact.
- Audit delta.
- Typecheck/test/build results.

# Slice 02 - Flagged v7 App Shell Skeleton

**State:** in-progress
**Brief:** 01
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** Slice 00, Slice 01
**Blocks:** Home destination, Ask end-to-end, Situation/Sources/Outputs simplification
**Estimated size:** M (200-600)

---

## Goal in one sentence

Expose the simplified v7 command layer behind a disabled feature flag without replacing the current PRAXIS app shell.

---

## In scope

- [x] Expose `praxisV7` in `/api/health/features` with 60s cache headers.
- [x] Add `praxisV7` to the client feature flag boundary.
- [x] Add `src/components/v7/v7-command-shell.tsx` using the four-surface experience map and agentic workflow registry.
- [x] Mount the v7 command shell on the dashboard only when `features.praxisV7.enabled === true`.
- [x] Add thin route shells for `/app/home`, `/app/ask`, `/app/cores`, and `/app/outputs`, with `/app/situation`, `/app/sources`, and `/app/advanced` kept as compatibility routes into Cores.
- [x] Guard the new destination routes in `src/proxy.ts` so the flag-off state falls back to the current dashboard.
- [x] Keep the default production state off.
- [x] Add `audit:v7-shell-skeleton` and wire it into `audit:gate`.

## Out of scope

- Replacing `AppShell`, `AppSidebar`, or `Header`.
- Creating separate `/app/v7/*` routes.
- Redirecting legacy routes.
- Changing auth, Firestore, RLS, migrations, Cognee, or model routing.
- Making Ask PRAXIS a persistent thread surface.

## Acceptance criteria

- [x] v7 shell is hidden when the flag is off.
- [x] v7 shell is available from the dashboard when the flag is on.
- [x] v7 shell uses the existing experience map and workflow registry.
- [x] Four v7 destination routes render behind the flag; compatibility routes render behind the same guard.
- [x] `npm run audit:v7-shell-skeleton` passes.
- [x] `npm run audit:experience-map-coherence` passes.
- [x] `npx tsc --noEmit` passes.
- [x] `npm run build` passes after this slice.
- [x] Browser smoke with flag on: `PRAXIS_V7_BACKEND=true` + `npx playwright test tests/e2e/v7-shell-smoke.spec.ts`.

## Rollback

Remove `src/components/v7/v7-command-shell.tsx`, `src/components/v7/v7-destination-page.tsx`, and the v7 `src/app/app/{home,ask,cores,outputs}/page.tsx` files plus compatibility route shells; remove the conditional dashboard mount, remove `praxisV7` from the feature flag API/client, remove the proxy v7 route guard, and remove `audit:v7-shell-skeleton` from `package.json` and `scripts/audit-architecture-chain.ts`.

## Open questions

- [ ] Should the v7 shell graduate from dashboard-only to a dedicated `/app/home` route? Default: yes in the next slice, after this preview remains stable.
- [x] Should the mobile nav use the v7 destinations while the sidebar stays legacy? Default resolved: yes, but only the four primary surfaces behind the same flag.

## Notes for Codex

This is a preview skeleton, not the finished v7 IA. It proves the design direction inside the real app without risking the current workbench.

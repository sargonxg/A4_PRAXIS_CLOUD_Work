# 2026-05-08 Z1/Z2 Export And Demo Transition Pass

## Scope

Implemented the safe local slice from `PRAXIS_V2_Z1_EXPORT_E2E.md` and `PRAXIS_V2_Z2_DEMO_TRANSITION.md`.

## Built

- Preserved both prompts under `docs/codex-prompts/` and extended `audit:codex-prompts` with Z1/Z2 marker checks.
- Strengthened the live briefing export path at `/api/export` with cover metadata, executive summary, body sections, numbered source references, calibration footer, and `export.briefing` telemetry.
- Strengthened boardroom deliberation export at `/api/boardroom/deliberations/[deliberationId]/export` with title-slide metadata, critical claims/hypotheses, Q&A prep, sources appendix, map/chart applicability note, clearer client export progress, and `export.boardroom` telemetry.
- Added public demo claim CTA and `/api/situations/copy-from-demo` so a signed-in user can copy the Syria demo into their own workspace with the canonical graph seeded.
- Added a one-time `source=demo` workbench banner after a demo copy.
- Added `audit:export-coverage` and `audit:demo-claim`, both wired into `audit:gate`.

## Verified Locally

- `npm run audit:export-coverage`
- `npm run audit:demo-claim`
- `npm run audit:codex-prompts`
- `npm run typecheck`
- Scoped ESLint on touched files

## Remaining Live Gates

- Browser E2E download validation for briefing and boardroom DOCX/Markdown.
- Authenticated production/staging copy test for `/api/situations/copy-from-demo`.
- Telemetry confirmation in Cloud Logging after deployment.

# Pack 28 Audit — Surfaces Wave 3

Date: 2026-05-07

## Implemented

- Draft tab no longer falls through the placeholder workbench panel. It now renders a briefing-assembly surface with memo selection, cover-page editing, appendix selection, redaction settings, and Markdown/DOCX/PDF export controls.
- New-user case creation now presents two entry modes: AI-assisted scaffold or manual wizard. The AI-assisted mode calls `/api/cases/scaffold`, renders a review card, and only applies accepted actors/claims/source categories into the existing review-and-create step.
- Graph, ACH, Tools, Memos, Boardroom, and Ontology now receive additive empty/thin-state guidance from a shared density/action contract. Populated cases continue rendering their existing surfaces.
- Pack 28 is now stored under `docs/codex-prompts/` and enforced by `scripts/audit-codex-prompts.ts`.
- `scripts/audit-workbench.ts` now checks the Draft surface, AI-first scaffold files, and empty-state guidance contract.

## Honest Boundaries

- The Draft export is a client-side package using existing `docx`/`jspdf` libraries and an embedded manifest. Server-side artifact persistence, signed C2PA chain generation, and workspace export collections are still tracked as follow-up.
- `/api/cases/scaffold` uses a deterministic local scaffolder. The Vertex Agent Engine `case_scaffolder` deployment, eval harness, and runtime cost ceilings remain backend follow-up work.
- Accepted scaffold candidates are treated as user-reviewed creation inputs in the existing situation payload. A full review-queue/firewall two-phase commit path for each proposed actor/claim is not yet implemented.

## Verification Targets

- `npm run audit:workbench`
- `npm run audit:codex-prompts`
- `npm run typecheck`
- `npm run build`
- `PLAYWRIGHT_BASE_URL=<env> npx playwright test tests/e2e/app-usability-smoke.spec.ts`

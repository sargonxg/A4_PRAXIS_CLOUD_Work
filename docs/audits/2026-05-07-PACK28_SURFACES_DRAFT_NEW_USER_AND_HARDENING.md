# Pack 28 Audit — Surfaces Wave 3

Date: 2026-05-07

## Implemented

- Draft tab no longer falls through the placeholder workbench panel. It now renders a briefing-assembly surface with memo selection, cover-page editing, appendix selection, redaction settings, and Markdown/DOCX/PDF export controls.
- New-user case creation now presents two entry modes: AI-assisted scaffold or manual wizard. The AI-assisted mode calls `/api/cases/scaffold`, renders a review card, and only applies accepted actors/claims/source categories into the existing review-and-create step.
- Graph, ACH, Tools, Memos, Boardroom, and Ontology now receive additive empty/thin-state guidance from a shared density/action contract. Populated cases continue rendering their existing surfaces.
- Pack 28 is now stored under `docs/codex-prompts/` and enforced by `scripts/audit-codex-prompts.ts`.
- `scripts/audit-workbench.ts` now checks the Draft surface, AI-first scaffold files, and empty-state guidance contract.

## Implemented In Second Pass

- Draft exports now call an authenticated case export endpoint before download. Real users persist a `draft-briefing-package` manifest under the case export collection with checksum, selected memo ids, appendix ids, redaction summary, and `c2pa-ready-manifest` metadata; demo users receive the same response shape without storage writes.
- AI-first case creation now records an authenticated scaffold audit event when a user applies a proposal. The audit stores accepted/rejected counts and discarded candidates while keeping graph promotion on the normal downstream review path.
- `scripts/audit-workbench.ts` now enforces the draft export API/store, scaffold audit API/store, and the UI bridge from case creation to scaffold audit persistence.
- ADRs added: `0037-draft-briefing-assembly-contract.md` and `0038-ai-first-case-creation-pattern.md`.

## Honest Boundaries

- The Draft export is still a client-side package using existing `docx`/`jspdf` libraries. Authenticated export manifests are now persisted, but server-rendered binary artifacts, signed C2PA chain generation, and durable binary storage remain follow-up.
- `/api/cases/scaffold` uses a deterministic local scaffolder. The Vertex Agent Engine `case_scaffolder` deployment, eval harness, and runtime cost ceilings remain backend follow-up work.
- Accepted scaffold candidates are treated as user-reviewed creation inputs in the existing situation payload and now emit a scaffold audit event. A full review-queue/firewall two-phase commit path for each proposed actor/claim is not yet implemented.
- The new-user end-to-end browser spec is currently a demo-safe activation proxy. Full magic-link synthetic-user CI remains follow-up.

## Implemented In Third Pass

- Added prompt-numbered ADRs `0044-draft-as-briefing-assembly-contract.md` and `0045-ai-first-case-creation-pattern.md` alongside implementation ADRs 0037/0038.
- Added dedicated Playwright specs:
  - `tests/e2e/workbench/draft-briefing-assembly.spec.ts`
  - `tests/e2e/onboarding/ai-first-case-creation.spec.ts`
  - `tests/e2e/onboarding/new-user-end-to-end.spec.ts`
- Expanded `src/lib/workbench/empty-state-actions.ts` into a role x ontology guided action matrix with explicit review coverage for 4 roles x 5 ontologies x 6 guided tabs.
- Added `docs/architecture/WORKBENCH_SURFACES.md` as the canonical twelve-tab surface map.

## Verification Targets

- `npm run audit:workbench`
- `npm run audit:codex-prompts`
- `npm run typecheck`
- `npm run build`
- `npx playwright test tests/e2e/workbench/chapters-structured-content.spec.ts tests/e2e/workbench/desk-command-center.spec.ts tests/e2e/workbench/context-scope-studio.spec.ts tests/e2e/workbench/library-faceted-browse.spec.ts tests/e2e/workbench/research-source-scout.spec.ts tests/e2e/workbench/ontology-interactive.spec.ts tests/e2e/workbench/draft-briefing-assembly.spec.ts tests/e2e/onboarding/ai-first-case-creation.spec.ts tests/e2e/onboarding/new-user-end-to-end.spec.ts`
- `PLAYWRIGHT_BASE_URL=<env> npx playwright test tests/e2e/app-usability-smoke.spec.ts`

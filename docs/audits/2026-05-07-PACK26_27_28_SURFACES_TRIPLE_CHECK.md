# Pack 26-28 Surfaces Triple Check

Date: 2026-05-07

Prompt sources:

- `C:\Users\giuli\Downloads\PRAXIS_CODEX_26_SURFACES_CHAPTERS_DESK_CONTEXT.md`
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_27_SURFACES_LIBRARY_RESEARCH_ONTOLOGY.md`
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_28_SURFACES_DRAFT_NEW_USER_AND_HARDENING.md`

## Executive Status

The twelve workbench surfaces are now app-facing, audited, and browser-testable. This third pass closed documentation and verification gaps rather than pretending the remaining backend Agent Engine work is complete.

## Closed In This Pass

| Pack | Gap Found | Resolution |
|---|---|---|
| 26 | Requested ADRs 0040/0041 were missing. | Added `docs/adr/0040-chapters-layered-content-rendering.md` and `docs/adr/0041-desk-command-center-contract.md`. |
| 26 | Dedicated browser specs for Chapters, Desk, Context were missing. | Added `chapters-structured-content`, `desk-command-center`, and `context-scope-studio` Playwright specs. |
| 27 | Requested ADRs 0042/0043 were missing. | Added `docs/adr/0042-library-tab-as-artifact-faceted-view.md` and `docs/adr/0043-research-as-ingestion-front-door.md`. |
| 27 | Dedicated browser specs for Library, Research, Ontology were missing. | Added `library-faceted-browse`, `research-source-scout`, and `ontology-interactive` Playwright specs. |
| 28 | Prompt-numbered ADRs 0044/0045 were missing, despite implementation ADRs 0037/0038. | Added pack-numbered ADRs preserving the Draft and AI-first creation contracts. |
| 28 | Dedicated Draft and new-user activation specs were missing. | Added `draft-briefing-assembly`, `ai-first-case-creation`, and `new-user-end-to-end` Playwright specs. |
| 28 | Empty-state guidance was too generic for the role x ontology requirement. | Expanded `empty-state-actions.ts` with role profiles, ontology profiles, guided-tab builders, and a 4 role x 5 ontology x 6 tab review set. |
| 28 BB9 | Canonical workbench surface map was missing. | Added `docs/architecture/WORKBENCH_SURFACES.md`. |

## Remaining Honest Boundaries

- `chapter_suggester`, `desk_advisor`, `research_planner`, and `case_scaffolder` still need live Vertex Agent Engine deployments, eval freshness checks, cost ceilings, and trace coverage before they should be described as fully production-live agents.
- Context re-genesis is staged and non-destructive at the app/API level, but full backend application of staged candidates through Context Genesis remains follow-up.
- Ontology add/remove is owner-scoped and audited, but graph node migration after removing a secondary ontology remains review-gated follow-up.
- Draft export manifests persist now; server-rendered binary storage and signed C2PA credentials remain backend follow-up.
- The new-user end-to-end Playwright spec is a demo-safe activation proxy. A real synthetic-user CI flow with magic-link auth, isolated workspace data, and full Context Genesis remains the production-grade version.

## Verification Added

- `tests/e2e/workbench/chapters-structured-content.spec.ts`
- `tests/e2e/workbench/desk-command-center.spec.ts`
- `tests/e2e/workbench/context-scope-studio.spec.ts`
- `tests/e2e/workbench/library-faceted-browse.spec.ts`
- `tests/e2e/workbench/research-source-scout.spec.ts`
- `tests/e2e/workbench/ontology-interactive.spec.ts`
- `tests/e2e/workbench/draft-briefing-assembly.spec.ts`
- `tests/e2e/onboarding/ai-first-case-creation.spec.ts`
- `tests/e2e/onboarding/new-user-end-to-end.spec.ts`

## Audit Confidence

High for app-facing surface coverage and regression detection. Medium for backend Agent Engine parity because the remaining live deployments are intentionally documented as follow-up rather than faked in the app.

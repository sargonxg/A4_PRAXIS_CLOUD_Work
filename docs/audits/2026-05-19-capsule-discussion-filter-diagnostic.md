# Capsule Discussion Filter Diagnostic

Date: 2026-05-19
Scope: Add-to-discussion, selected-text attach, drag/drop capsule flow, public homepage, authenticated homepage, `/app/capsules`, and `/app/repository`.

## Findings

- `TaskletPraxisWorkbench` remains the shared surface for the public homepage, authenticated `/app`, `/app/capsules`, and `/app/repository`. This keeps the pre-login and post-login home aligned instead of adding another capsule picker.
- The add-to-discussion path is intentionally simple: each `CapsuleCard` exposes `Add`, `Inspect`, and `Improve`, and draggable cards can still be dropped into the Context Chain dropzone.
- The selected-text attach flow remains separate from add-to-discussion. It saves the selected excerpt to the active capsule and then exposes follow-up actions such as Ask PRAXIS, source-check, memo note, and clear selection without auto-running analysis.
- The modal browser remains a secondary add path. It now receives the same taxonomy filter bar used by the repository section rather than maintaining separate type/domain controls.
- The canonical taxonomy source remains `src/lib/product/context-capsules.ts`. UI filtering continues to use `resolveCapsuleTaxonomy(...)` and count chips from `buildCapsuleTaxonomyStats(...)`; no parallel taxonomy schema was added.

## UI Cleanup

- The capsule repository section now has one canonical taxonomy surface: search query, Types, Domains, Policy Teams, and Clear.
- Removed the competing standalone type row, the repeated policy-team creation preset row, and the modal-specific type/domain rows.
- Type filtering now matches `taxonomy.types`; domain filtering matches `taxonomy.domains`; policy-team filtering matches `taxonomy.policyTeams`.
- Search still covers title/label, capsule id, summary/detail, tags, taxonomy labels/ids, source/document refs, tools, outputs, and product refs.

## Route Notes

- Public homepage: uses the shared workbench and starter capsule summaries with compact cards and three-column public layout.
- Authenticated `/app`: uses the same shared workbench; the side detail panel only appears outside repository/factory page states.
- `/app/capsules`: remains `Capsule Factory` with Catalog, Ontology/Graph, Sources, Temporality, Conflict/Actors, Output/Handover, and Runs lanes.
- `/app/repository`: remains a real authenticated route and keeps the capsule list narrow beside the document repository panel.

## Validation

- Added component contract coverage for a single taxonomy filter bar, policy-team filter state, modal filter reuse, dense card behavior, and removal of duplicate filter rows.
- The catalog audit lane verified that starter definitions already resolve into Types, Domains, and Policy Teams and that existing product tests cover taxonomy statistics and repair states.
- `npx vitest run tests/unit/components/tasklet-workbench-contract.test.ts tests/unit/lib/product/context-capsules.test.ts tests/unit/lib/genkit/capsule-factory-flow.test.ts` passed with 50 tests.
- `npx tsc --noEmit` passed.
- Browser smoke on `http://localhost:3000/` loaded the shared workbench with one taxonomy bar and capsule cards. Authenticated routes `/app`, `/app/capsules`, and `/app/repository` redirected to login in the unauthenticated local browser, as expected without `TEST_FIREBASE_EMAIL` / `TEST_FIREBASE_PASSWORD`.

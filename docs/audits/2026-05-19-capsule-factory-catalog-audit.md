# Capsule Factory and Catalog Audit

Date: 2026-05-19
Scope: `/app/capsules`, Ask PRAXIS capsule discussion flow, capsule persistence, starter taxonomy, and Capsule Factory runtime contracts.

## Working Paths

- `/app/capsules` resolves to `TaskletPraxisWorkbench` with `initialPanel="capsules"`, so the factory remains inside the existing cockpit rather than becoming a parallel product.
- Ask discussion sends through `/api/conversations/{conversationId}/turns` with `capsuleId`, `contextPackageId`, `appliedCapsules`, `currentPath`, and `activeContextStack`.
- Conversation records are created through `/api/conversations`, preserving `appliedCapsules` for reloadable conversation URLs.
- Capsule state persists under `users/{uid}/capsules/{capsuleId}` via `/api/context/capsules` and `/api/context/capsules/{capsuleId}`.
- Capsule attachments, selected spans, notes, memories, history, evaluations, and diffs are already exposed through existing capsule subroutes.
- Agent runs are linked by `capsuleId` through `/api/agents/runs` and displayed in the capsule agent lane.
- Output capsule persistence remains separate under output-capsule storage and is referenced from the capsule/runtime run path rather than embedded into card UI.
- Starter capsules now resolve through the canonical `CAPSULE_TAXONOMY_AXES`, `buildCapsuleTaxonomyStats`, and `resolveCapsuleTaxonomy` helpers.

## Broken, Placeholder, or Thin Paths

- DIALECTICA, KAIROS, and AGON are PRAXIS-native review lanes only in this wave. They do not call external repos or mutate capsule state directly.
- There is no apply endpoint for lane diffs yet. That is acceptable until a real review-confirmed diff object needs persistence.
- Capsule cards previously carried too much detail; long descriptions, tools, outputs, and inspection text belong in the inspector sheet.
- Existing document repository inspection is functional but still source/document oriented; it does not yet show a complete source-to-claim graph.

## Missing Inspectability

- A user should be able to inspect ontology/graph, sources, temporality, conflict/actors, tools, outputs, and open gaps from the capsule inspector without scanning card body text.
- Factory lane outputs need visible review status: draft, reviewed, applied, rejected. Wave 1 only adds the review-draft contract and UI entry points.
- Conversation receipts should expose which factory lane influenced a response when the `capsule-factory` worker is used.

## Required Tests

- Unit: starter taxonomy coverage for Types, Domains, and Policy Teams, including unknown/custom repair states.
- Unit: Capsule Factory Genkit synthesis schema accepts DIALECTICA, KAIROS, and AGON `laneImprovements` with `requiresConfirmation: true`.
- Component contract: `/app/capsules` renders as Capsule Factory with the sidebar lanes and reviewable builder-lane prompts.
- E2E: `/app/capsules` desktop card grid, mobile stacking, taxonomy selection, inspector map, and Ask conversation preservation of `appliedCapsules`.

## Implementation Boundary

Wave 1 keeps mutations behind the existing capsule APIs. Factory lane suggestions are reviewable prompts and schema objects, not direct writes. If apply becomes necessary, add one narrow review-confirmed factory diff endpoint rather than one endpoint per lane.

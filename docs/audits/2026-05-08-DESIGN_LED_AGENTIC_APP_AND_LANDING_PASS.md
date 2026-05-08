# PRAXIS Design-Led Agentic App And Landing Pass

Date: 2026-05-08

## Scope

Implemented the first design-led agentic app slice from `docs/roadmap/PRAXIS_DESIGN_LED_AGENTIC_APP_PLAN_2026-05-08.md` and mirrored the same product model into the public landing page.

## Shipped Structure

- `src/lib/agentic-workflows/registry.ts` defines guided workflows, required context, output kind, save location, route targets, and confirmation posture.
- `src/lib/product/experience-map.ts` defines Home, Ask PRAXIS, Situation Model, Sources, Outputs, and Advanced, with route mapping and mobile priority.
- `src/components/dashboard/ask-praxis-home.tsx` makes Ask PRAXIS the authenticated dashboard's first surface.
- `src/components/app/mobile-bottom-nav.tsx` adds mobile Home, Ask, Sources, Outputs, and More navigation. Sources opens the Library substrate tab; Outputs opens the Draft chapter through `openChapter`.
- `src/components/landing/agentic-app-section.tsx` mirrors the same registry and experience map on the landing page.

## Capability Preservation Rule

The simplification pass intentionally preserves the existing functionality and code paths. It changes the user's first surface, not the underlying capability set:

- Home and Ask PRAXIS become the front door.
- Sources, Situation Model, Outputs, and Advanced map to existing workbench tabs, chapters, tools, ACH, Boardroom, Memo Studio, Draft, exports, settings, and admin routes.
- The tool marketplace, graph/ontology surfaces, source receipts, memo/draft editors, boardroom, and advanced settings remain reachable behind the simplified structure.
- Runtime claims still follow the separate reconciliation note: target-state capabilities must not be described as live until implemented and evidenced.

Coordination check: `docs/audits/2026-05-08-AUDIT_BRANCH_GAP_RECONCILIATION.md` exists as a separate reconciliation artifact. This pass does not edit it.

## Ask PRAXIS Technical Foundation

The simplified app depends on a stronger answer engine, not a thinner one. This pass adds `src/lib/ai/ask-praxis-context.ts` as the reusable context pack for Ask PRAXIS:

- answer quality contract with evidence hierarchy, answer shape, gaps, and next-step rules
- active Situation source posture, including attached source URLs and custom sources
- citation-ready situation corpus formatting from the shared retriever
- Situation Model graph snapshot summary with node/edge counts and priority graph facts

`src/app/api/ai/chat/route.ts` now injects this context pack into Ask PRAXIS before streaming. `scripts/audit-ask-praxis-primary.ts` verifies that the chat route continues to use the context pack.

## Context Core Model And Tool Incorporation

The follow-up architecture pass adds `src/lib/product/context-core-map.ts` and `docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md` so the simplification is tracked as code and documentation, not loose product language.

The model states that PRAXIS can work in general platform mode through the PRAXIS Core, or it can bind the same capabilities to specific context cores:

- User Core for profile, preferences, saved situations, and owner scope.
- Team Core for future authorized multi-user workspaces.
- Situation Core for the active case frame.
- Source Core and Document Core for receipts, uploaded material, retrieval fragments, and optional Cognee memory.
- Graph Core for canonical and advisory graph context.
- Output Core for briefs, memos, drafts, handovers, and exports.

`getSimplifiedCapabilityLedger()` now maps every consolidated capability to the user-facing area, preserved specialist tool IDs, required context cores, primary output, live AI capability, and current posture. This preserves the existing tool work while making the simplified app legible: the user starts from Home and Ask PRAXIS, while the code can still route into Sources, Situation Model, Outputs, GraphOps, Boardroom, ACH, Memo Studio, export, admin, and advanced tools.

`scripts/audit-simplified-capability-ledger.ts` verifies:

- every required context core exists
- every consolidated tool maps to at least one context core
- user-core and team-core are represented
- optional Cognee memory is explicitly accounted for without claiming it is always live
- specialized tool development groups still point back to consolidated capabilities
- every simplified capability preserves existing tool/functionality paths

## Landing Alignment

The landing page now leads with:

- Open a Situation.
- Ask PRAXIS.
- Produce the handover.
- Product workflow: Open, Ask, Model, Source, Produce, Inherit.
- Design-led agentic app section backed by the same app registry.

Public first-run copy avoids exposed internal backend jargon in the rendered landing entry components.

## Verification

Passed:

- `npm run audit:landing`
- `npm run audit:no-internal-jargon-ui`
- `npm run audit:experience-map-coherence`
- `npm run audit:ask-praxis-primary`
- `npm run audit:mobile-primary-flows`
- `npm run audit:simplified-capability-ledger`
- `npm run audit:dashboard`
- `npm run audit:workbench`
- `npm run audit:workspace-tabs-chapters`
- `npm run audit:surface-registry-coherence`
- `npm run audit:ux-polish`
- `npm run audit:context-aware-coverage`
- `npm run audit:tool-marketplace`
- `npx vitest run tests/unit/lib/ai/ask-praxis-context.test.ts`
- `npx eslint src/lib/ai/ask-praxis-context.ts src/app/api/ai/chat/route.ts scripts/audit-ask-praxis-primary.ts tests/unit/lib/ai/ask-praxis-context.test.ts`
- `npx eslint src/components/workbench/chapter-renderer.tsx tests/e2e/app-usability-smoke.spec.ts tests/e2e/personas/_shared/persona-fixtures.ts`
- `$env:PLAYWRIGHT_BASE_URL='http://localhost:3020'; npm run smoke:app-usability`
- `npm run typecheck`
- `npm run build`

Browser checked locally on the existing dev server at `http://localhost:3020`:

- `/` desktop and mobile: landing headline, product workflow, design-led app section, and example-case flow render.
- `/app/dashboard` desktop: Ask PRAXIS first surface renders before the older dashboard panels.
- `/app/dashboard` mobile: bottom nav exposes Home, Ask, Sources, Outputs, More; Ask PRAXIS panel opens.
- `/app/workbench/syria-2026`: context, library, ontology, graph, tools, memos, draft, and export surfaces pass the app usability smoke.
- `/app/workbench`: case picker contrast passes with a demo session.

## Known Non-Blocking Observation

The existing local dev server logs the React development-mode CSP `eval()` warning. The production build passes, and the warning states React does not use that path in production mode.

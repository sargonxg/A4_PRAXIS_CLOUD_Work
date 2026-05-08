# Slice 01 - Foundations: Experience Map And Workflow Registry

**State:** proposed
**Brief:** 01, 02, 03
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** none
**Blocks:** Slice 02 App shell skeleton, Slice 04 Ask end-to-end
**Estimated size:** M (200-600)

---

## Goal in one sentence

Add the thin v7 product layer that maps the existing PRAXIS app into Home, Ask, Situation, Sources, Outputs, and Advanced, plus a typed registry for agentic workflows.

---

## In scope

- [ ] Add `src/lib/product/experience-map.ts`.
- [ ] Add `src/lib/agentic-workflows/registry.ts`.
- [ ] Map every existing major app surface to a v7 area.
- [ ] Declare the initial workflow catalog from Brief 02.
- [ ] Add a focused audit such as `audit:experience-map-coherence`.
- [ ] Update `docs/v7/STATUS.md`, `CHANGELOG.md`, and relevant docs.

## Out of scope

- Replacing the app shell.
- Deleting existing routes.
- Changing Firestore rules, RLS, migrations, firewall invariants, or ontology primitives.
- Enabling Cognee in production.
- Building Team Core UI.

## Acceptance criteria

- [ ] Existing Workbench, Graph, Ontology, Library, Research, Tools, ACH, Boardroom, Memo Studio, Draft, Settings, and Admin surfaces remain reachable.
- [ ] Every workflow declares input context, routes/tools, output kind, save location, and tier.
- [ ] `npm run build` passes.
- [ ] Focused audit passes.
- [ ] Relevant existing audits pass.

## Rollback

Remove the new v7 mapping/registry files and focused audit. Since this slice should not change runtime navigation or storage, rollback should be a code deletion only.

## Open questions

- [ ] Should Team Cores appear in the experience map as hidden/flagged? Default: no UI in v7, schema-only if approved.
- [ ] Should Advanced include all legacy routes or only workbench-adjacent routes? Default: include all reachable app routes but keep hidden from first-view UX.

## Notes for Codex

Use the existing product surface registry and workbench chapter flow as source material. Do not create a parallel product universe; this is a map over what already exists.

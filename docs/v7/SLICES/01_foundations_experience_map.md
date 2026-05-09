# Slice 01 - Foundations: Experience Map And Workflow Registry

**State:** in-progress
**Brief:** 01, 02, 03
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** Slice 00
**Blocks:** Slice 02 App shell skeleton, Slice 04 Ask end-to-end
**Estimated size:** M (200-600)

---

## Goal in one sentence

Add the thin v7 product layer that maps the existing PRAXIS app into Home, Ask, Cores Library, and Outputs, plus a typed registry for agentic workflows.

---

## In scope

- [x] Add `src/lib/product/experience-map.ts`.
- [x] Add `src/lib/agentic-workflows/registry.ts`.
- [x] Map every existing major app surface to a v7 area.
- [x] Declare the initial workflow catalog from Brief 02.
- [x] Add a focused audit such as `audit:experience-map-coherence`.
- [x] Add focused unit tests for the four-surface map and agentic workflow registry.
- [x] Update `docs/v7/STATUS.md`, `CHANGELOG.md`, and relevant docs.

## Out of scope

- Replacing the app shell.
- Deleting existing routes.
- Changing Firestore rules, RLS, migrations, firewall invariants, or ontology primitives.
- Enabling Cognee in production.
- Building Team Core UI.

## Acceptance criteria

- [x] Existing Workbench, Graph, Ontology, Library, Research, Tools, ACH, Boardroom, Memo Studio, Draft, Settings, and Admin surfaces remain reachable through the current route tree and v7 map.
- [x] Every workflow declares input context, routes/tools, output kind, save location, and tier.
- [x] `npm run build` passes.
- [x] Focused audit passes.
- [x] Relevant focused unit tests pass.
- [x] Relevant existing audits pass through `audit:gate` until the known `audit:gcp` reauth blocker.

## Rollback

Remove the new v7 mapping/registry files and focused audit. Since this slice should not change runtime navigation or storage, rollback should be a code deletion only.

## Open questions

- [ ] Should Team Cores appear in the experience map as hidden/flagged? Default: no UI in v7, schema-only if approved.
- [x] Should Advanced include all legacy routes or only workbench-adjacent routes? Default resolved: Advanced is not a primary surface; legacy power routes map to Cores Library specialist panels.

## Notes for Codex

Use the existing product surface registry and workbench chapter flow as source material. Do not create a parallel product universe; this is a map over what already exists.

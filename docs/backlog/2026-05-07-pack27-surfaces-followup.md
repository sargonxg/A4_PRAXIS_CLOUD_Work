# Pack 27 Follow-Up Backlog

Owner: Giulio / PRAXIS engineering
Target release: surface hardening wave after Pack 27 first slice

## P0

- Wire Library to a shared Firestore artifact read model used by both Library and Context Library.
- Add re-genesis ingestion from Research results with rate limiting, review queue entries, and no silent graph writes.
- Add owner-scoped ontology mutation API for secondary ontology add/remove through firewall and two-phase commit.

## P1

- Deploy `research_planner` to Vertex Agent Engine, add eval set, and connect the Research staged-plan panel to live planner output.
- Add saved-claims service/API so Library saved claims are durable and not only derived from current case context.
- Add work product export listing and re-download actions from the existing export persistence path.

## P2

- Add dedicated Playwright tests:
  - `tests/e2e/workbench/library-faceted-browse.spec.ts`
  - `tests/e2e/workbench/research-source-scout.spec.ts`
  - `tests/e2e/workbench/ontology-interactive.spec.ts`
- Add performance timing checks for Library, Research, and Ontology tab TTI.
- Add cost telemetry around live Research runs.

## P3

- Add richer artifact detail panels with source snippets, claim trust-score history, memo diffs, and export provenance manifests.

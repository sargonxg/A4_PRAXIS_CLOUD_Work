# Pack 27 Follow-Up Backlog

Owner: Giulio / PRAXIS engineering
Target release: surface hardening wave after Pack 27 first slice

## P0

- Wire Library to the full shared Firestore artifact read model used by both Library and Context Library, including uploaded documents, memo versions, and exports.
- Connect staged Research ingest records to the Context Genesis orchestrator approval flow so reviewed sources can create Source-layer nodes.
- Add two-phase graph migration for ontology add/remove when removed secondary ontologies have typed graph nodes.

## P1

- Deploy `research_planner` to Vertex Agent Engine, add eval set, and switch the deterministic Research plan route to the live subagent once freshness checks exist.
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

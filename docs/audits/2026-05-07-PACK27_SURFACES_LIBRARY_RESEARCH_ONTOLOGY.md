# Pack 27 Surfaces Audit - Library, Research, Ontology

Date: 2026-05-07
Prompt source: `docs/codex-prompts/PRAXIS_CODEX_27_SURFACES_LIBRARY_RESEARCH_ONTOLOGY.md`

## Baseline

- Library and Research rendered through the generic workbench placeholder panel.
- Ontology had a useful static schema viewer, but did not expose active ontology status, validator pass-rate detail, primitive coverage, or recommended tool mappings.
- Existing backend services exist for documents, sources, claims, memos, work products, and research, but the complete Pack 27 route set and re-genesis orchestration are not yet production complete.

## Implemented in this pass

- Added `LibraryTab` as a faceted artifact browser for sources, documents, saved claims, memo versions, and exports.
- Added `ResearchTab` as a Source Scout surface with query builder, source-set picker, staged plan, candidate results, and non-destructive ingest staging.
- Added `/api/cases/[caseId]/research` to return deterministic demo results and use the existing Google-grounded research path for signed-in users when available.
- Extended `OntologySchemaViewer` with active ontology cards, validator pass-rate detail, primitive coverage, recommended tool links, and source-affinity hints.
- Added deterministic helpers for Library, Research, and Ontology status derivation.
- Extended `audit:workbench` and `audit:codex-prompts` for Pack 27 coverage.

## Implemented in second pass

- Added owner-scoped saved-claims persistence at `/api/cases/[caseId]/saved-claims` and wired Library to merge durable saved claims with derived graph/context claims.
- Added `/api/cases/[caseId]/research/plan` as the deterministic `research_planner` integration surface until Vertex Agent Engine deployment is live.
- Added `/api/cases/[caseId]/research/ingest` to stage selected research results into a review queue as non-destructive `re_genesis` candidates with a 3/day case limit.
- Added `/api/cases/[caseId]/ontologies` for owner-scoped ontology lens add/remove, audit logging, and advisory firewall posture. Graph migrations remain review-gated.
- Wired Research ingest buttons to the staging API and Ontology add/remove controls to the ontology route with demo-safe preview behavior.
- Extended `audit:workbench` so saved-claims, research-plan, research-ingest, and ontology mutation routes are now required Pack 27 contract files.

## Remaining work

- Shared Firestore read model that unifies Library and Context Library with live listeners beyond the saved-claims slice.
- Full Context Genesis orchestrator support for applying staged Research ingest records after review.
- `research_planner` deployment on Vertex Agent Engine and eval freshness checks; current route is deterministic and app-facing.
- Full two-phase graph migration for ontology add/remove when existing nodes are typed against a removed secondary ontology.
- Dedicated e2e suites for `library-faceted-browse`, `research-source-scout`, and `ontology-interactive` once backend mutation paths are live.

## Status

Second app slice complete. The three tabs now serve real user workflows with owner-scoped persistence/staging APIs while still avoiding silent graph writes.

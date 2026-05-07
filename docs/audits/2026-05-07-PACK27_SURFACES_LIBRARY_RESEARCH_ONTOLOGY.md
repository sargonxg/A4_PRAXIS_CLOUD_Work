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

## Remaining work

- Shared Firestore read model that unifies Library and Context Library with live listeners.
- Durable saved-claims browser backed by a user-owned saved-claims service and API.
- Re-genesis write path for Research ingest, including 3/day rate limiting and review queue promotion.
- `research_planner` deployment on Vertex Agent Engine and eval freshness checks.
- Owner-scoped add/remove secondary ontology backend route with firewall and two-phase commit.
- Dedicated e2e suites for `library-faceted-browse`, `research-source-scout`, and `ontology-interactive` once backend mutation paths are live.

## Status

First safe app slice complete. The three tabs now serve real user workflows without silent graph writes or fake backend claims.

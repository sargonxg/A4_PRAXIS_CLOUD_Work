# ADR 0043: Research As Ingestion Front Door

## Status

Accepted

## Context

Pack 27 asks Research to expose Source Scout and staged collection planning while preserving the invariant that research results never silently write to the graph.

## Decision

Research is the workbench front door for source discovery and staged non-destructive ingestion. Query planning and candidate retrieval can be deterministic or AI-assisted, but selected candidates are staged as `re_genesis` review items. Applying those candidates to the graph remains a review/firewall operation.

## Consequences

Users can search and stage sources without leaving the workbench. The case graph is protected from unreviewed external-source writes, and the future `research_planner` subagent can improve plans without changing the mutation contract.

## Alternatives Considered

- Auto-ingest every search result. Rejected because it violates graph provenance and firewall discipline.
- Keep Research as a link to generic web search. Rejected because PRAXIS needs case-aware source selection and staged ingestion.

# ADR 0042: Library Tab As Artifact-Faceted View

## Status

Accepted

## Context

Pack 27 requires Library to become the canonical case artifact browser. It must show sources, documents, saved claims, memo versions, and exports without introducing a separate data model from Context Library.

## Decision

Library is an artifact-faceted workbench view over the same case record. It merges derived case artifacts with owner-scoped saved claims and export manifests, then filters by artifact type and free-text search. The Context tab remains the scope-editing view; Library is the retrieval and browsing view.

## Consequences

Users can find accumulated case material from one tab while the write paths stay owner-scoped. Live listener convergence with Context Library remains a backend/read-model follow-up, but the UI contract and API surfaces are now explicit.

## Alternatives Considered

- Build Library as a standalone document manager. Rejected because it would duplicate Context Library semantics.
- Show only source receipts. Rejected because Pack 27 explicitly defines Library as an all-artifact browser.

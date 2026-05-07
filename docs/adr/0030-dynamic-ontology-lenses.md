# 0030 Dynamic Ontology Lenses

## Status

Accepted

## Context

Pack 20 adds professional-domain coverage beyond the original Conflict,
Mediation, Governance, and Narrative ontologies. The architecture invariant is
that ontologies are lenses over the eight TACITUS/ACO primitives, not new
substrates. Adding a new primitive would require a database migration,
firewall update, graph contract change, and broad refactor.

## Decision

Register five new ontology lenses: Human Rights, Economic / Sanctions,
Humanitarian, Legal / Treaty, and Security / Defense. Each lens declares node
subtypes mapped to the existing eight primitives, edge types over those
primitives, deterministic validators, domains, and forward-looking recommended
tool ids.

The TypeScript registry is the frontend source of truth for workbench and
marketplace fit. Backend Pydantic mirrors exist for the five Pack 20 lenses so
backend validation and future ingestion services can depend on the same
ontology boundary.

Cases may expose an optional `ontologyIds` list and `primaryOntologyId`, bounded
by application helpers to at most three active ontologies. `ontologyId` remains
for backwards compatibility and acts as the primary ontology in current flows.

## Consequences

- The ACO primitive set remains unchanged.
- Existing cases continue to work through `ontologyId`.
- New professional roles can receive better default ontology suggestions
  without adding new top-level app surfaces.
- Pack 21 can attach specialist tools to the new ontology ids without changing
  the registry shape.
- Multi-ontology write-path enforcement remains a follow-up until the review
  queue and deeper firewall coverage are fully production-proven.

## Alternatives considered

- Add new primitives for rights, sanctions, humanitarian needs, legal
  provisions, and military capabilities. Rejected because it violates the
  substrate invariant and creates unnecessary migration risk.
- Keep the new domains as marketplace tags only. Rejected because it would not
  give ingestion, graph validation, or case setup a typed vocabulary.
- Make every case multi-ontology immediately. Rejected for now because existing
  flows are stable around a primary `ontologyId`; the bounded list can be
  adopted incrementally.

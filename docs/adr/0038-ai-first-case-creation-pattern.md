# ADR 0038: AI-First Case Creation Pattern

## Status

Accepted

## Context

Pack 28 asks PRAXIS to make new-user setup materially easier: a user should describe an objective and receive a proposed case frame, actors, claims, source categories, and ontology lenses before entering the workbench. The proposal must remain user-reviewed and must not silently write graph facts.

## Decision

Add AI-assisted case creation as an entry mode beside the manual wizard. The scaffold route returns deterministic proposed candidates today, the UI lets users accept or reject actors and claims, and applying the scaffold records an authenticated audit event. Accepted items are copied into the existing situation creation payload and notes; downstream graph promotion still goes through the normal review and firewall path.

## Consequences

New users get a faster first useful case without weakening ontology invariants. The audit trail records what was accepted and discarded. Vertex Agent Engine `case_scaffolder`, eval freshness, cost telemetry, and per-item review queue commits remain explicit backend follow-up work.

## Alternatives Considered

- Auto-persist every scaffold actor and claim into the graph. Rejected because generated candidates need user review and normal symbolic-firewall handling.
- Keep only the manual wizard. Rejected because it fails the Pack 28 activation target for users starting from an objective rather than a fully prepared case frame.

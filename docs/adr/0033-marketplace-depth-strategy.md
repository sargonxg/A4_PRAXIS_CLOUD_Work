# ADR 0033: Marketplace Depth Strategy

## Status

Accepted.

## Context

Pack 21 expands PRAXIS from the Pack 18 marketplace foundation to a deeper
marketplace aligned with the nine ontology lenses established by Pack 20. The
source prompt contains a count conflict: it requires 30 new tools and 52 total
tools, but the detailed candidate list names 36 new tools.

## Decision

PRAXIS will preserve the explicit 52-tool cap for v1.2. The shipped Pack 21
foundation registers 30 new tools: 20 specialist tools for the five Pack 20
ontology lenses, 7 cross-cutting tools, and 3 conflict-depth tools. The six
additional original-ontology depth candidates remain deferred until a later cap
or substitution decision.

All tools stay inside Tool Contract v2, use ContextProvider-backed foundation
runs, retain tolerant raw/context/structured persistence, and require SKILL.md
files with the canonical nine ordered sections.

## Consequences

- The marketplace speaks natively to human-rights, economic/sanctions,
  humanitarian, legal/treaty, and security/defense workflows.
- The UI grows to 52 tools without adding new top-level application routes.
- Existing model-backed-handler debt remains visible; this ADR does not claim
  every specialist handler is production-grade AI execution.
- Audits now enforce 52 tools, ordered skills, executable canaries, composition
  references, and ontology recommendation recall.

## Alternatives Considered

- Ship all 36 detailed candidates and exceed the 52-tool cap. Rejected because
  it contradicts Pack 21's stated marketplace cap.
- Ship only the five new ontology tool sets. Rejected because Pack 21 also
  requires cross-cutting depth that benefits every persona.
- Wait for owner clarification before any code. Rejected because the 52-tool cap
  gives a conservative implementation boundary and the deferred six are now
  documented explicitly.

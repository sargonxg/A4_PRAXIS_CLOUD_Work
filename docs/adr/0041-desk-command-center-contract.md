# ADR 0041: Desk Command Center Contract

## Status

Accepted

## Context

Pack 26 defines Desk as the user's operating center, not another metric panel. It must show what changed, what action to take next, whether context is stale, and which questions remain unresolved.

## Decision

Desk is a four-panel command center composed from existing workbench primitives: What Changed, Next Best Actions, Open Questions, and Stale Context. AI recommendations remain advisory; context-health and freshness hints do not block tools, drafting, or user-entered context.

## Consequences

The first tab after Chapters gives users a clear path forward. The surface can work deterministically today while leaving `desk_advisor` deployment as a backend enhancement.

## Alternatives Considered

- Keep Desk as a static summary card. Rejected because it does not direct a user through the app.
- Block actions when context is thin. Rejected because Pack 12/26 treat weak context as advisory rather than prohibitive.

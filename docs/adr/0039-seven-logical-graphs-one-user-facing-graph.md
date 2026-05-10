# 0039 - Seven Logical Graphs Behind One User-Facing Graph

## Status

Proposed

## Context

The architecture separates multiple graph concerns: evidence, analytical
claims, provenance, episodes, user work state, drafts, and operational traces.
Exposing those as separate top-level products would make the MVP feel
fragmented and technical.

## Decision

Keep one user-facing graph experience while preserving logical graph layers
behind it. The MVP emphasizes the canonical evidence and analytical layers,
with additional logical layers surfaced only when they support a specific
workflow.

## Consequences

- The UI should show one coherent graph canvas or graph panel.
- Candidate, staged, accepted, and rejected states must be visually distinct.
- Provenance and bi-temporal scoping stay available without becoming separate
  products.
- Later graph federation remains possible without disrupting the MVP surface.

## Alternatives Considered

- Expose every graph as its own user-facing surface. This is too complex for
  the MVP.
- Collapse all graph semantics into one untyped graph. This loses auditability.
- Defer graph work entirely. This weakens PRAXIS's core differentiation.

## References

- `docs/architecture/PRAXIS_ARCHITECTURE.md`
- `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`
- `docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md`

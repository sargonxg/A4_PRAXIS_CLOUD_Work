# 0040 - Twelve Named LLM Graph Interaction Patterns

## Status

Proposed

## Context

PRAXIS uses LLMs to help analysts reason over sources, graph context, methods,
and drafts. If each route invents its own graph interaction style, the system
becomes hard to audit and difficult to improve.

## Decision

Adopt named LLM/graph interaction patterns as the architecture direction for
methods and agentic workflows. Phase 0 creates the audit placeholder
`audit:llm-pattern-coverage`; later phases must replace the placeholder with a
real coverage audit as methods ship.

The initial named-pattern set is intentionally Proposed until Phase 1 and
method implementation prove the exact taxonomy.

## Consequences

- Method prompts and handlers should declare their graph interaction pattern.
- Audits can enforce coverage once the taxonomy is implemented.
- The app can explain why an answer was generated as retrieval, extraction,
  synthesis, critique, drafting, or another named pattern.

## Alternatives Considered

- Let every method define its own implicit graph behavior. This is not
  auditable enough.
- Lock the full taxonomy before implementation. This risks freezing the wrong
  names before the method set is implemented.
- Defer the concept entirely. That would make Phase 5 harder to review.

## References

- `docs/architecture/PRAXIS_ARCHITECTURE.md`
- `docs/architecture/PRAXIS_VISION_v4_03_BUILD.md`
- `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`

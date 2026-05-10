# ADR 0053: Twelve named LLM-graph interaction patterns (L1-L12)

Date: 2026-05-10
Status: Proposed (awaiting Giulio sign-off)

## Context

PRAXIS's 53+ AI routes interact with the canonical graph in many shapes:

- Some routes read entities and emit a structured analysis.
- Some routes propose graph patches (advisory writes).
- Some routes synthesise across episodes for a timeline answer.
- Some routes purely retrieve and rank without writing.
- Some routes invoke a subagent that owns its own retrieval.

Today the interaction shape per route is implicit. Reviewing whether a tool
honours the calibration contract requires reading its handler. There is no
named taxonomy of LLM-graph interactions; every audit script invents its own
heuristic.

## Decision

Define a fixed taxonomy of **twelve LLM-graph interaction patterns**
(L1-L12), and require every Method (every AI route or composed workflow) to
declare its pattern. The audit `audit:llm-pattern-coverage` enforces the
declaration; v4 Phase 1 freezes the L1-L12 set.

The exact L1-L12 names are deliberately not pinned in this ADR — they are
the deliverable of the v4 ontology module (M1) and need product-side input
to name well. This ADR commits to:

1. There are twelve and only twelve patterns. New patterns require an ADR
   amendment.
2. Every Method declares exactly one pattern.
3. Patterns cover at minimum: read-only retrieval, structured-output
   analysis, advisory graph patch, episode synthesis, multi-step subagent
   delegation, calibrated drafting, citation grounding, and timeline
   construction. The remaining four slots are for v4 ontology work.

4. Each pattern declares: input context cores it may read, output kind it
   produces, whether it can propose graph patches, and which subagents it
   may delegate to.

5. The existing `withCalibration` contract continues to gate every Method
   regardless of pattern.

## Consequences

- Every Method becomes self-describing under audit; reviewers can verify
  contract conformance from the registration alone.
- Composed workflows in `src/lib/agentic-workflows/` declare their
  composition as a sequence of L-patterns rather than as opaque code.
- New methods are pressured into one of the twelve buckets, which forces
  the platform to keep the tool surface coherent rather than sprawling.
- Pattern enforcement cannot fully ship until the L1-L12 names land in
  the ontology module; until then `audit:llm-pattern-coverage` stays a
  failing stub (Phase E).

## Alternatives Considered

- **Free-form pattern names.** Rejected: collapses to no taxonomy at all.
- **Two patterns (read-only vs writes-graph).** Rejected: too coarse to
  be useful for review or composition.
- **Unbounded numbered set.** Rejected: tax of L-patterns is meaningful
  only if it's small enough to memorise.

## References

- `src/app/api/ai/` — current AI route inventory.
- `src/lib/api/with-calibration.ts` — calibration contract.
- ADR 0034 (Composition chain governance).
- ADR 0033 (Marketplace depth strategy).

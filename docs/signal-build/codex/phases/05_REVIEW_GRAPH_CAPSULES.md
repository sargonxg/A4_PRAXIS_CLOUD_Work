# Phase 05 - review, provenance graph and native capsules

Additional required reading: [research/TEMPORAL_CONTEXT_GRAPH.md](../../research/TEMPORAL_CONTEXT_GRAPH.md), [research/ANALYTICAL_METHOD.md](../../research/ANALYTICAL_METHOD.md). Use these as design inputs; verify current provider/repository contracts in this checkout.

Implement review of exact proposal versions with authenticated reviewer identity and rationale. Preserve accepted, rejected and unresolved decisions. An accepted reading says what that source reports; separate event verification, authenticity, coordination and intent judgments require their own evidence and decisions. A source update creates a new proposal or invalidation event, not silent rewriting of an accepted claim.

Build a rebuildable graph projection from canonical typed assertions: sources/revisions, evidence, claims, actors, topics, narratives, events and assessments as available. Edges carry predicates, provenance and inference/review state. Quotations, explicit links and syndication clusters are observable relations. Similar text may create a reuse candidate; it cannot create a causal influence or coordination edge. Include disagreement and contrary evidence. Implement scoped pagination and a graph-to-evidence inspector with an equivalent list.

Create a SIGNAL extension/profile adapter to the repository's actual native capsule contracts. Preserve User, Situation, Tool and Output roles. Reuse source-receipt types and existing review/claim-ledger services. Map country rules, cues, distinctions, exceptions, unknowns and revision triggers to the existing cognitive types; do not flatten them into a generic summary. Adapter tests must prove native import/export, source/review preservation and legacy round-trip behavior.

Compile a bounded desk context through the current compiler with objective, role, scope, asOf and size limits. Preserve the compiler's receipt, source versions/digests and capsule version. Proposed or rejected context cannot quietly become accepted memory. Clearly mark the kit's `praxis-signal-extension/0.1` harness export as adapter-required.

Acceptance: rejected history survives; stale evidence/hash reviews fail; a second tenant cannot traverse private graph nodes or retrieve their source snippets; projection reconstruction is repeatable; a selected edge opens the exact revision/span. Native capsule round-trip and compiler receipt tests pass. Historical approved outputs still resolve their old source/context revisions after a change.

# PRAXIS Conflict Grammar v1.0.0

`conflict-grammar-v1` is the canonical DIALECTICA ontology used by PRAXIS
for graph extraction, analyst review, and reasoning recipes. The source of
truth is `schemas/conflict-grammar-v1.json`; TypeScript Zod and Python
Pydantic models are generated from it with `npm run schema:gen`.

## Version Policy

The schema uses SemVer.

- Patch versions may clarify descriptions or add optional metadata fields.
- Minor versions may add enum values that do not invalidate existing v1 data.
- Major versions may add or remove primitives, relationship types, or required
  fields.

Current version: `1.0.0`.

## The 8 Primitives

PRAXIS v1 deliberately uses 8 primitives:

1. `Actor` - any entity with agency.
2. `Claim` - a stated assertion, demand, position, grievance, or right.
3. `Interest` - an underlying objective or need.
4. `Constraint` - a factor limiting freedom of action.
5. `Leverage` - a concrete pressure point or source of influence.
6. `Commitment` - an agreement, pledge, obligation, or policy commitment.
7. `Event` - a dated occurrence that changes or evidences the situation.
8. `Narrative` - a frame or interpretation propagated by actors or media.

The prior 14-type drift is folded into metadata:

- `Institution` becomes `Actor.subtype = "institution"` or
  `Constraint.subtype = "institutional"`.
- `Norm` becomes `Constraint.subtype = "norm"` or a commitment metadata field.
- `Resource` becomes `Interest.subtype = "resource"` or leverage metadata.
- `Risk` becomes a derived score, not a canonical node.
- `Policy` becomes `Commitment.subtype = "policy_commitment"`.
- `Grievance` becomes `Claim.subtype = "grievance"`.

This keeps extraction stable while preserving analytical expressiveness.

## Confidence

Every node and edge carries a numeric confidence in `[0, 1]` plus a categorical
`confidence_level`:

- `EXTRACTED`: directly stated in source text.
- `INFERRED`: reasonable deduction from explicit text.
- `AMBIGUOUS`: multiple interpretations possible; analyst review needed.
- `ASSESSED`: analyst or AI judgment based on pattern recognition.

Numeric confidence is used by graph algorithms. The categorical level is used
for UI explanation and analyst review queues.

## Provenance

Nodes and edges may carry `source_span`:

```ts
{
  documentId: string;
  charStart: number;
  charEnd: number;
  excerpt: string; // <= 500 chars
  retrievedAt: string; // ISO 8601
  retrievalMethod: 'grounded_search' | 'firecrawl' | 'feed' | 'upload' | 'manual';
}
```

Prompt A3 makes this field mandatory on every live extracted node and edge.
A2 introduces the shape so frontend and backend cannot drift.

## Relationships

The relationship vocabulary is locked to 42 typed edges. Generated Python code
exports uppercase keys such as `CLAIMS` and a canonical snake-case alias such
as `claims`. LLM extraction may emit snake-case names; validation normalizes
them before graph construction.

Relationship compatibility is source/target typed. `SEMANTICALLY_SIMILAR_TO`
is the only wildcard edge.

## Confidence Propagation

Reasoning recipes use the conservative lower-bound rule:

```text
path_confidence = min(node_confidences) * product(edge_confidences)
```

This prevents a long path from looking stronger than its weakest assertion and
penalizes every uncertain link in the chain.

# PRAXIS, DIALECTICA, KAIROS, and AGON Alignment

Date: 2026-05-12

This note records the intended product boundary for the next architecture
round.

## Direction

PRAXIS should stay focused on the user-facing policy workbench: user context,
Situation Cores, Ask PRAXIS, analysis workflows, memo writing, review, and
handover. It should not become the primary ingestion engine or the canonical
place where all raw knowledge is structured.

DIALECTICA should become the knowledge and ingestion layer PRAXIS can call
behind the scenes. The preferred upstream repo is:

- `https://github.com/sargonxg/A2_DIALECTICAbyTACITUS`

KAIROS and AGON should feed DIALECTICA rather than PRAXIS directly:

- `https://github.com/sargonxg/KAIROS-temporal-vision-TACITUS`
- `https://github.com/sargonxg/AGON`

## Layer Responsibilities

| Layer | Owns | Should not own |
|---|---|---|
| PRAXIS | User intent, user/situation calibration, policy analysis, writing, review workflows, task state, UI, and final outputs | Raw multi-source ingestion, canonical graph construction, high-volume extraction, temporal indexing |
| DIALECTICA | Ingestion, deterministic extraction, typed graph primitives, provenance, confidence, graph queries, reasoning recipes, and reviewable graph deltas | User-facing policy workspace complexity or product-specific UX state |
| KAIROS | Temporal/event vision, event sequence extraction, time-aware signals, video/image/time-series context | PRAXIS task UX or memo workflow |
| AGON | Exceptional graphs, conflict/competition structure, strategic relationship data, graph-enrichment signals | PRAXIS user/session state |

## Recommended Contract

PRAXIS should consume DIALECTICA through a narrow adapter rather than importing
raw repo internals:

1. `ingest(source | document | url | dataset)` returns a run id and staged
   candidates.
2. `query(context, question, filters)` returns cited nodes, edges, passages,
   confidence, and temporal scope.
3. `proposeGraphDelta(caseId, candidates)` returns reviewable graph edits,
   never direct unreviewed mutations.
4. `runRecipe(recipeId, caseId, inputs)` returns structured reasoning output
   with provenance and uncertainty.
5. `explainTrace(runId)` returns why a node, edge, source, or answer exists.

PRAXIS should persist only the user-facing selection, review decision, memo
state, and task state. DIALECTICA should own the durable evidence structure.

## Guardrails

- Keep owner/user scoping explicit at the PRAXIS adapter boundary.
- Treat every KAIROS/AGON-derived item as provenance-bearing evidence, not as
  unqualified truth.
- Do not let LLMs write canonical graph state without deterministic validation
  and human or policy-gated review.
- Prefer structured outputs, typed primitives, hashes, timestamps, and source
  receipts over free-form text handoffs.
- Make hallucination reduction measurable: source coverage, contradiction
  count, graph-delta review rate, unsupported-claim rate, and citation
  retrieval precision.

## Honest Assessment

This is a good direction. It keeps PRAXIS from becoming an overloaded monolith
and gives policy LLMs a stronger substrate than prompt-only retrieval. The
risk is over-coupling: if PRAXIS depends on DIALECTICA internals too early, both
products will slow down. The right next step is a small, versioned API contract
and one end-to-end proof: source/document enters DIALECTICA, becomes typed
evidence, PRAXIS asks a policy question, and the answer cites the graph with a
reviewable delta instead of hallucinated claims.

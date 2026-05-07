# Community Synthesizer

## Purpose
Use GraphRAG-style batch synthesis to identify document communities and produce low-confidence, reviewable ACO claim candidates.

## When To Use
Use this on larger accepted corpora when analysts need community summaries, cross-document themes, or graph proposals that are too broad for a single prompt window.

## When Not To Use
Do not use it for live first-token interactions, deterministic tool runs, or automatic graph persistence. It is batch-oriented and explicit-invocation only.

## Inputs
- `case_id`: Case receiving synthesized candidates.
- `chunks`: Accepted source chunks with ids, source ids, and text.
- `ontology_ids`: Active PRAXIS ontologies.
- `max_communities`: Optional cap for synthesis breadth.

## Outputs
- `community_summaries`: Synthesized summaries capped at confidence 0.6.
- `aco_nodes`: Proposed Claim-layer nodes marked `synthesized=true`.
- `aco_edges`: Proposed relations, when available.
- `review_required`: Always true.

## Context Requirements
Requires accepted chunks with provenance and a case context snapshot. Context health should surface advisories but must not silently block a batch run.

## Composition
Can consume output from `extract.entities.gliner` and can chain into `cross.brief-exporter` after human review accepts candidates.

## Examples
Run on a large diplomatic cable bundle to surface repeated negotiation constraints and actor coalitions as reviewable community claims.

## Pitfalls
GraphRAG output is synthesized, not verified. Keep confidence capped, keep claims out of the Verdict layer, and route every candidate through the review queue.

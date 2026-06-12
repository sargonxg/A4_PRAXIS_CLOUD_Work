# Graph/Memory Layer — State of the Art (2026-06-12)

Engineering survey commissioned to ground ContextCapsule graph enrichment
(the F-series slices). Full citations inline. Summarized; the design
decisions adopted for PRAXIS are in the final section.

## Key findings

### Temporal knowledge graphs (Zep/Graphiti — reference design)
- Every edge carries four timestamps: `created_at`/`expired_at`
  (transaction time) and `valid_at`/`invalid_at` (event time).
  Superseded facts are invalidated, never deleted — the graph stays
  queryable "as of" any point on either timeline.
  (arXiv:2501.13956; getzep.com/ai-agents/temporal-knowledge-graph)
- Graphiti edges store a natural-language `fact` string, its embedding,
  and links to source episodes. Contradictions: hybrid search finds
  conflicting candidates, an LLM decides update vs invalidate; retrieval
  itself is LLM-free (~300ms P95). (neo4j.com Graphiti deep dive)
- Hindsight (arXiv:2512.12818) adds belief networks with
  evidence-updated confidence — closest analogue to ACO ASSESSED tier.

### GraphRAG evolution
- LazyGraphRAG is the cost/quality winner: no LLM at index time;
  query-time subquery refinement + budgeted LLM relevance assessment +
  claim-level extraction before synthesis. 96/96 comparison wins at 0.1%
  of GraphRAG indexing cost. (microsoft.com/research LazyGraphRAG)
- What drives quality: hierarchical community summaries (global
  questions), query-time iterative deepening with budget, and
  chunk→claim→answer as the pipeline shape.
- Honest caveat: graph gains concentrate on multi-hop/global/sensemaking
  queries, not local factoid QA (arXiv:2506.06331, arXiv:2506.05690).

### Agentic memory architectures
- Converged taxonomy: episodic/semantic/procedural tiers.
- Letta: memory blocks + sleep-time compute; memory revisions persisted
  "with informative commit messages" — reasoning traces on revisions,
  git-style. (letta.com blog: memory-blocks, sleep-time-compute)
- Mem0: ADD/UPDATE/DELETE/NOOP consolidation; its graph variant adds
  only ~2% — structure alone is marginal without temporal/provenance
  semantics. (arXiv:2504.19413)
- A-Mem: Zettelkasten notes with retroactive "memory evolution" —
  old notes' summaries update as the network grows. (arXiv:2502.12110)
- Nobody stores full reasoning traces on graph elements in production —
  edge-level rationale is PRAXIS's differentiation opportunity.

### Reasoning-annotated graphs
- Nanopublications: assertion graph + provenance graph + publication
  info — "claim with receipt"; PROV-K extends to assertions derived
  from ensembles of supporting AND conflicting evidence.
  (IJDL 2025 s00799-025-00431-x; CEUR Vol-3937 paper10)
- PROV-O compliance-argument-graphs: LLM invocations and human
  interventions as first-class PROV activities. (arXiv:2604.04103)
- MArgE support/attack argument trees give transparent rationale for
  claims (arXiv:2508.02584); RDF-star/Wikidata qualifiers are the
  mechanical precedent for statement-level metadata.

### Ontology-grounded LLM reasoning — measurable gains
- OG-RAG (EMNLP 2025): ontology-grounded hypergraph context → +55% fact
  recall, +40% correctness vs standard RAG. (arXiv:2412.15235)
- LOGicalThought: +11.8% average; biggest gains on negation (+10.2%),
  implication (+13.2%), defeasible reasoning (+5.5%) — the reasoning
  modes conflict analysis stresses. (arXiv:2510.01530)
- Mechanism: constrain retrieval to ontology-conformant clusters AND
  verify output against ontology constraints post-generation. Use ACO
  at both ends.

## Adopted design decisions (F-series)

- **F1 (schema/service)** — implements recommendations 1, 2, 3, 5:
  1. Bi-temporal edges: `recordedAt`/`invalidatedAt` (transaction time)
     alongside existing event-time validity; `supersededBy` chain;
     `invalidationReason` enum (CONTRADICTED | SOURCE_RETRACTED |
     TEMPORAL_EXPIRY | HUMAN_OVERRIDE). Invalidation, never deletion.
  2. `rationale` + `derivedFrom: claimIds[]` on INFERRED/ASSESSED
     nodes/edges — nanopublication pattern collapsed into properties.
  3. First-class CONTRADICTS edges carrying judge rationale; both sides
     kept; human review gate when both sides ≥ INFERRED.
  4. PROV-style activity records (`generatedBy`: model+version or
     user id, timestamp, decision) on extraction runs and review-gate
     decisions.
- **F2 (visualization)** — ontology lens overlays (ACO relation
  categories), bi-temporal scrubber ("as we knew it" vs "as it was"),
  edge "why" panel (rationale + receipts + supersession history).
- **F3 (answer attribution)** — Ask answers link claims to the capsule
  nodes/sources that produced them.
- **Later candidates**: community summaries over GraphLite projections
  (rec 4), belief nodes with evidence-updated confidence (rec 6),
  query-time lazy enrichment budget (rec 7), sleep-time capsule
  reflection with commit messages (rec 8).

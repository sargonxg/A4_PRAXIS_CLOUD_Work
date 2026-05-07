# ADR 0047: Extraction Layering Plus GraphRAG Batch

## Status
Accepted

## Context
Pack 30 introduces heavier document extraction dependencies: Docling for parse
quality, GLiNER for high-recall entity candidates, and Microsoft GraphRAG for
batch community synthesis. These dependencies are useful, but they should not
expand the main FastAPI runtime, weaken PRAXIS symbolic firewall rules, or add
license ambiguity.

## Decision
PRAXIS will run Docling, GLiNER, and GraphRAG as three isolated Cloud Run
workers under `services/`. The main backend owns orchestration and persistence.
Workers return structured candidates only.

The pipeline order is fixed:

1. `fetch`
2. `parse`
3. `chunk`
4. `recall_ner`
5. `precision_extract`
6. `firewall_write`

GLiNER recall feeds precision extraction but does not write graph objects.
GraphRAG is explicit-invocation batch synthesis through
`cross.community-synthesizer`; every output is synthesized, confidence-capped,
and review-queue routed.

ACLED code paths are retired from active source because the Pack 30 posture is
permissive-license-first and UCDP remains the conflict event data baseline.

## Consequences
- The main API keeps a smaller dependency and security surface.
- Heavy extraction workers can be scaled, rebuilt, and budgeted independently.
- GraphRAG summaries become useful review candidates without being treated as
verified graph facts.
- Audits now check worker presence, skill registration, prompt storage, cost
telemetry markers, and retired ACLED source references.

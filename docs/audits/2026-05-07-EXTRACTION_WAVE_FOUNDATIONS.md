# Pack 30 Extraction and GraphRAG Wave Foundations

## Scope

This pass implements the Pack 30 foundation: isolated extraction workers,
context-genesis pipeline contracts, marketplace tool entries, permissive license
posture, prompt storage, and audit coverage.

## Implemented

- Docling worker scaffold at `services/extract-docling` with `/parse`.
- GLiNER worker scaffold at `services/extract-ner-gliner` with `/extract` and
  ontology label files for the nine active ontology ids.
- GraphRAG worker scaffold at `services/extract-graphrag` with `/synthesize`.
- Main-backend orchestration contracts under `backend/services/context_genesis`.
- Docling-aware chunker that keeps tables atomic.
- Precision extraction prompts that use GLiNER recall as verification context.
- GraphRAG-to-ACO adapter that caps synthesized community summaries at
  confidence `0.6` and routes them as pending review candidates.
- Marketplace tools `extract.entities.gliner` and
  `cross.community-synthesizer` in the existing `cross` category.
- ADR 0047 and conflict data source documentation.
- Active ACLED code paths removed from `src`, `backend`, `scripts`, and `tests`.

## GLiNER cost reduction

GLiNER recall is expected to reduce precision-extraction prompt volume by
screening candidate spans before the LLM verification pass. The deterministic
benchmark script `scripts/bench-gliner-cost-reduction.py` records the accounting
model used by CI. Live worker deployment should emit:

- `gliner_candidates_total`
- `precision_extract_calls_total`
- `precision_extract_tokens_total`

## GraphRAG batch ceiling

GraphRAG is explicit-invocation only, batch-oriented, and capped by Cloud Run
worker configuration. The first production deployment should add per-run cost
records and alert on `graphrag_batch_cost_usd`.

## Review queue

All synthesized GraphRAG candidates are marked `synthesized=true`,
`review_status=pending`, and `confidence<=0.6`. They must pass the symbolic
firewall and human review before durable graph persistence.

## Cost telemetry

`monitoring/dashboards/gliner-cost-reduction.json` defines the Pack 30 metric
contract. It is a local dashboard contract until worker deployment binds these
metrics to Cloud Monitoring.

## Remaining Deployment Work

- Build and deploy the three worker images to Cloud Run.
- Wire production service URLs into the backend environment.
- Add live Cloud Monitoring panels and budget alerts from the local dashboard
  contract.
- Run a real corpus benchmark comparing baseline extraction cost against the
  GLiNER recall plus precision extraction path.

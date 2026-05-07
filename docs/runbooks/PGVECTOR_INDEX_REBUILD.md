# PGVector Index Rebuild

## Signals
- Semantic search latency spikes.
- Query plans stop using vector indexes.
- Embedding drift or dimension mismatch appears in audits.

## Triage
1. Confirm embedding dimensions in `MODEL_MATRIX.json`.
2. Run KG backend and drift audits.
3. Inspect index definitions and query plans in staging before production.

## Mitigation
- Rebuild vector indexes during a low-traffic window.
- Disable semantic retrieval fallback only if retrieval quality is unsafe.

## Escalation
Do not change embedding dimensions or activate Vertex Vector Search primary mode without an ADR.

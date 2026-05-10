# Archived scripts

One-shot migrations and benchmarks preserved for historical reference. None
of these are referenced from `package.json`. Do not run them blind.

- `migrate-bitemporal.ts` — one-shot bi-temporal data migration.
- `migrate-documents-to-sources.ts` — one-shot document→source migration.
- `migrate-tool-outputs-to-tools.ts` — one-shot tool-output schema migration.
- `migrate-truth-layers.ts` — one-shot truth-layer migration.
- `bench-gliner-cost-reduction.py` — local cost benchmark for GLiNER extraction.
- `smoke-extraction-pipeline.py` — local smoke test for extraction pipeline.

If a migration needs to run again, copy it back to `scripts/`, register it in
`package.json`, and treat it as a fresh script.

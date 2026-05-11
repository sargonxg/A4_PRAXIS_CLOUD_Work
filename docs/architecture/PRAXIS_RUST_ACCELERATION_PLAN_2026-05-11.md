# PRAXIS Rust Acceleration Plan - 2026-05-11

## Decision

Use Rust for hot-path validation, graph normalization, policy-workbench indexing, and future worker kernels. Do not force Rust into the Next.js UI. The deployed app should stay simple: TypeScript creates and stores context, Rust-backed workers can later accelerate high-volume graph and retrieval operations behind APIs.

## First Component

`rust/semantica-core` is a small Rust library for validating PRAXIS Semantica context graph seeds. It is intentionally independent from the frontend build today.

Current capabilities:

- Parse Semantica-compatible Context Core JSON.
- Enforce schema version, node limits, edge limits, unique entity ids, and required context root.
- Detect orphan relationships.
- Return a compact readiness result for future worker pipelines.

## Where Rust Belongs

| Area | Rust role | Why |
| --- | --- | --- |
| Context graph validation | Validate and normalize graph seeds before enrichment | Deterministic, fast, safe at high volume |
| Entity linking pre-pass | String matching, candidate blocking, duplicate checks | CPU-bound and latency-sensitive |
| Source ingestion | Hashing, chunk boundaries, language-independent text hygiene | High-throughput document work |
| Retrieval ranking | Feature extraction and graph-neighborhood scoring | Tight loops, predictable memory |
| Export packaging | Deterministic JSON-LD / provenance bundles | Integrity and reproducibility |

## Service Shape

1. Next.js app creates `semanticaContextGraph`.
2. API persists the sanitized seed on the situation.
3. Worker reads the seed and calls Rust validation before Semantica enrichment.
4. Semantica/Python enriches ontology, provenance, conflict checks, and semantic retrieval.
5. Rust can post-process enriched graphs for stable scoring, dedupe, and export manifests.

## Guardrails

- Rust components must be callable from backend workers or service APIs, not imported into random UI code.
- Rust outputs must remain JSON contracts that TypeScript can test.
- Any Rust crate added to deployment must have a matching smoke/audit command.
- User-facing claims should say "semantic layer" unless Semantica/Rust details are needed for operator docs.

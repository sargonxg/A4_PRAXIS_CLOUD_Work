# ADR 0048: Analytics, Sanctions, and Simulation as Cross-Cutting Tools

## Status
Accepted

## Context
Pack 31 adds three analytical capabilities that share a marketplace registration
pattern but do not share the same runtime profile:

- Network analytics are small, CPU-bound graph algorithms.
- Sanctions matching depends on yente and an OpenSearch-compatible index.
- Policy simulation can run longer scenario batches and needs timeout control.

## Decision
PRAXIS registers `analyze.network`, `match.sanctions`, and
`simulate.policy_abm` as cross-cutting tools using the existing `cross`
category in code. The pack language says `cross-cutting`, but the app's
canonical category type is `cross`; no new category is introduced.

Deployment shape:

- `analyze.network`: in-process backend service using NetworkX and Louvain.
- `match.sanctions`: Cloud Run sidecar backed by OpenSearch through yente.
- `simulate.policy_abm`: Cloud Run worker with an explicit scenario timeout.

Cost ceilings:

- `analyze.network`: CPU-only, target <= $0.001 per invocation.
- `match.sanctions`: target <= $0.01 per actor query.
- `simulate.policy_abm`: target <= $0.30 per 100-step run.

Output discipline:

- Network analytics write additive `graph_nodes.metrics` only.
- Sanctions matches persist only to owner-scoped Actor metadata and require
  human review for compliance decisions.
- Mesa output is always described as a scenario stress-test, not a prediction
  or forecast.

## Consequences
The workbench gains serious graph analytics, sanctions/PEP matching, and
scenario stress-testing while keeping PRAXIS invariants intact: owner scoping,
symbolic firewall discipline, explicit provenance, and no new ontology or graph
primitive.


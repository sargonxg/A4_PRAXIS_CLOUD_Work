# ADR 0049: Cognee Memory Layer Disabled-First

Date: 2026-05-07
Status: Accepted

## Context

PRAXIS already has canonical ACO graph storage, vector retrieval, feed snapshots,
and tool-output memory. The Cognee architecture brief proposes an additional
agent-memory plane for session recall, long-term associative recall, and
candidate extraction from messy documents.

Adding a new memory plane is only acceptable if it does not weaken PRAXIS's
canonical graph contract, tenant isolation, provider discipline, or symbolic
firewall.

## Decision

Cognee is accepted as a disabled-first, probabilistic memory layer.

- It defaults to `COGNEE_ENABLED=false` and `COGNEE_MODE=disabled`.
- `backend/services/cognee_memory.py` is the only backend module allowed to
  import the Cognee SDK.
- Cognee data lives outside the canonical graph and can only touch PRAXIS
  through `aco_cognee_link`.
- Cognee-derived candidates are capped at `0.600` confidence.
- Cognee-derived canonical nodes may only be `Claim` or `Source`.
- Cognee-derived `Verdict` writes are rejected by a database trigger.
- Cognee must use Vertex routing and the `vertex-adc` sentinel, not a raw
  OpenAI-compatible key.

## Consequences

The first implementation slice is mostly guardrails: config, migrations,
wrapper boundaries, audits, docs, and unit tests. Live SDK calls, Cloud Run
deployment, `praxis_cognee` database provisioning, Workbench UI, and migration
of existing materials remain separate implementation/operations tasks.

This keeps production safe while making future Cognee work testable against
explicit invariants.

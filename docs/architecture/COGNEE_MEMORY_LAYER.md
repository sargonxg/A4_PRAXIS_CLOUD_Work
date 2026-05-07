# Cognee Memory Layer

Date: 2026-05-07
Status: Disabled-first implementation scaffold
Sources: `C:\Users\giuli\Downloads\COGNEE_ARCHITECTURE.md`,
`C:\Users\giuli\Downloads\COGNEE_IMPLEMENTATION.md`

Cognee is integrated as a probabilistic agent-memory layer beside the existing
PRAXIS graph, vector, feed, and tool-output layers. It can improve recall and
candidate extraction, but it is not the canonical ACO graph and must never write
directly to `graph_nodes` or `graph_edges`.

## Binding Boundaries

- `backend/services/cognee_memory.py` is the only backend module allowed to
  import the Cognee SDK.
- `src/lib/knowledge/memory-layer.ts` is the browser-facing facade. It treats
  disabled or unavailable Cognee as empty recall, not a hard application failure.
- `backend/services/cognee_bridge.py` writes only `aco_cognee_link` candidates
  and review decisions.
- Canonical graph writes still go through `NodeRepo` / `EdgeRepo` and the
  symbolic firewall.
- Cognee-derived candidates are capped at `0.600` confidence and may promote
  only to `Claim` or `Source`, never `Verdict`.

## Deployment Posture

Cognee defaults to disabled. Production may only enable it after the isolated
`praxis_cognee` database, service account, Cloud Run service, Vertex routing,
RLS wrapping, and rollback procedure from the operations doc are verified.

Supported modes:

- `disabled`: current default; stable empty shapes.
- `postgres-kuzu`: intended default after rollout, using a single-writer Cognee
  service for Kuzu.
- `neo4j`: fallback mode, isolated to a separate `cognee` database.
- `postgres-only-vector`: degraded emergency recall mode.

## Current Implementation Slice

This pass lands the disabled-first implementation spine:

- backend Cognee config and disabled-safe health.
- `aco_cognee_link` canonical bridge migration.
- database trigger rejecting unsafe Cognee-derived canonical graph writes.
- run-once SQL for the isolated `praxis_cognee` database and RLS wrapping of
  Cognee-managed tables.
- authenticated FastAPI memory routes at `/api/v1/memory/*`.
- authenticated Next.js proxy routes at `/api/memory/*`.
- server-side credit metering for live Cognee recall/cognify operations.
- frontend recall/remember client helpers for future UI surfaces.
- deploy script scaffold for the private `praxis-cognee` Cloud Run service.
- Workbench Memory tab for recall and candidate review in disabled-safe mode.
- GCP setup script additions for Cognee secrets, buckets, service account, and
  baseline IAM.
- operations runbook, snapshot script, scheduler manifest, Cloud Monitoring
  dashboard definition, and alert-policy extension for `praxis-cognee`.
- direct-import audit for Cognee SDK isolation.
- embedding-dimension audit locking Cognee to Vertex `text-embedding-005`
  with 768 dimensions.
- operations audit enforcing the service paths, env aliases, snapshot assets,
  monitoring assets, and kill-switch posture.
- firewall audit markers for the Cognee provenance trigger.
- unit tests for disabled behavior, no direct OpenAI/Anthropic egress,
  candidate confidence capping, tenant scoping, and firewall migration coverage.

## API Contract

The browser calls `/api/memory/{health,remember,recall,forget,candidates,promote,reject}`.
That route is protected by `withAuth` and forwards to either:

- `COGNEE_BACKEND_URL` using Cloud Run OIDC for the isolated Cognee service, or
- the private FastAPI backend at `/api/v1/memory/*` for disabled-mode local and
  staging checks.

Disabled mode is deliberately asymmetric:

- `recall` returns `{ hits: [], status: "memory_layer_disabled" }`.
- `remember` returns HTTP 503 `memory_layer_disabled` so callers do not assume
  persistence happened.

## Remaining Enablement Gates

Do not set `COGNEE_ENABLED=true` in production until:

1. `backend/migrations/sql/cognee_database_setup.sql` has been run by an owner.
2. Cognee-managed tables have been wrapped by
   `backend/migrations/sql/cognee_rls_apply.sql`.
3. `praxis-cognee` is deployed as a private Cloud Run service with
   `praxis-cognee-sa`.
4. Vertex ADC and Secret Manager values are verified from the service runtime.
5. Memory recall/remember canaries pass with cross-tenant negative tests.
6. Rollback to `COGNEE_MODE=disabled` is rehearsed.

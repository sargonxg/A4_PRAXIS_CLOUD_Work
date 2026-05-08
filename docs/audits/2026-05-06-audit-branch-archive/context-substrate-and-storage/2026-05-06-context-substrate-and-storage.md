# PRAXIS Phase 1 Topic C Self-Audit: Context Substrate And Storage

Date: 2026-05-06
Worktree: `C:\Users\giuli\praxis-audit-context-substrate-and-storage`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Scope: audit only. No app fixes, no push, no deploy. Writes limited to this `.md` and the paired `.json`.

## Bottom Line

Status: **PARTIAL / BLOCKED**

The four-layer context contracts and static tool-context isolation checks are real. The requested local TypeScript audits pass when run with the installed sibling PRAXIS toolchain. The storage layer is not proven live: production Firestore/Neo4j drift is blocked by missing Firebase Admin credentials, DB SQL/RLS checks are blocked by missing `pytest` and unavailable `DATABASE_URL`, and the Firestore/Postgres two-phase commit reconciler remains specified/backlogged rather than implemented.

## Source-Of-Truth Read

Reviewed:

- `docs/architecture/PRAXIS_ARCHITECTURE.md`
- `docs/codex-prompts/PRAXIS_CODEX_00_MASTER_CHARTER.md`
- `docs/codex-prompts/PRAXIS_CODEX_10_POSTGRES_KNOWLEDGE_GRAPH.md`
- `docs/codex-prompts/PRAXIS_CODEX_12_CONTEXT_ARCHITECTURE.md`
- `docs/codex-prompts/PRAXIS_CODEX_13_TOOL_CONTEXT_INTEROP.md`
- `docs/audits/2026-05-06-COMPREHENSIVE.md`
- `docs/audits/2026-05-06-REALITY_CHECK.md`
- `docs/audits/2026-05-06-MASTER_CHARTER_STATUS.md`
- `docs/architecture/POSTGRES_SCHEMA.md`
- `docs/architecture/KG_BACKEND.md`

The docs agree on the desired model: User / Workspace / Case / Conversation context, advisory `withContextAware`, tool access through `ContextProvider`, Postgres + pgvector primary KG, owner/case predicates, bi-temporal fields, and drift checks. The shipped evidence is narrower: static contracts and repository scaffolding exist; production migration/cutover, live parity, and subagent orchestration remain open.

## Audit Commands

Because this sibling worktree has no `node_modules`, plain `npm run ...` initially failed with `tsx is not recognized`. Per operational note, I reran the scripts from `C:\Users\giuli\praxiscodexworking\node_modules\.bin` against this assigned worktree.

| Command | Result | Evidence |
|---|---:|---|
| `audit:context-types-parity` | PASS | `Context type parity audit passed.` |
| `audit:context-aware-coverage` | PASS | `Context-aware coverage audit passed.` |
| `audit:tool-context-isolation` | PASS | `Tool context isolation audit passed.` |
| `audit:kg-backend` | PASS | `KG backend audit passed.` |
| `audit:kg-drift` | PASS, example only | `mode=example-contract`, `compared=2`, Syria and Nordalia both zero drift. |
| `verify-neo4j-sync --production` | BLOCKED | Firebase Admin failed: `FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set`. |
| `pytest backend/tests/test_kg_repositories.py` | BLOCKED | No `pytest` in ambient Python or sibling backend venv. |
| `pytest backend/tests/test_postgres_smoke.py backend/tests/test_phase1_schema.py` | BLOCKED | No `pytest`; tests also require `DATABASE_URL` for live DB verification. |

## Four-Layer Context Substrate

| Layer | Status | Evidence | Gap |
|---|---:|---|---|
| User | PARTIAL | `src/types/context.ts` and `backend/services/context_layers.py` mirror `UserContext`; type parity audit passes. | Runtime `buildUserContext` derives from `AuthenticatedUser` and defaults preferences; persisted profile/preferences are not proven in the snapshot path. |
| Workspace | PARTIAL | `WorkspaceContext` and `WorkspaceGuideline` include `storageRef` and `embeddingNodeId`. | Runtime `buildWorkspaceContext` returns empty guidelines/glossary/methodology docs. Workspace document retrieval is not proven. |
| Case | PARTIAL | `buildContextSnapshot` loads non-demo situations via `getSituationAdmin(user.uid, situationId)` and computes context health. | Graph counts come from situation metadata; this audit did not prove live Postgres graph reads. |
| Conversation | PASS | Signed `X-Praxis-Conversation-Token` uses HMAC and `timingSafeEqual`; unsigned context is production-disabled unless explicitly allowed. | Session-scoped by design; no durable persistence expected. |
| Composite advisory | PASS | `withContextAware` sets health/weakest/advisory headers; `withCalibration` passes `contextSnapshot` and no longer hard-blocks on context health. | Context Preparer runtime remains open. |

## ContextProvider Isolation

Status: **PASS for marketplace foundation runner; PARTIAL for broader tool universe.**

Static audit passes. `src/lib/tools/marketplace/runner.ts` consumes `ToolRunContext` and has no direct Firestore/Postgres/fetch access. `src/app/api/tools/marketplace/run/route.ts` builds `ContextSnapshot`, injects `createContextProvider({ snapshot }).forTool(tool)`, and sends that to `buildMarketplaceToolRun`.

Noted boundary: the marketplace route and `run-artifact.ts` do direct Firestore reads/writes for artifact history and persistence. That looks like a persistence boundary rather than handler context access, but the audit script is narrow and does not prove every legacy AI route uses ContextProvider.

## Postgres / pgvector / Owner Scope

Status: **PARTIAL static pass, live blocked.**

Static evidence:

- `backend/migrations/versions/0001_baseline.py` creates `vector`, `pg_trgm`, `pgcrypto`, and `current_tenant()`.
- `backend/migrations/versions/0011_postgres_kg_contract.py` creates `graph_nodes`, `graph_edges`, `graph_embeddings`, and `graph_audit`.
- `graph_nodes` and `graph_edges` require `owner_uid` and `case_id`.
- Nodes and edges include `valid_from`, `valid_to`, `asserted_from`, and `asserted_to`.
- `backend/services/kg_repositories.py` requires owner/case predicates for node listing, traversal, shortest path, and semantic search.

Blocked:

- No live `DATABASE_URL` / SQL verification.
- No executable Python tests because `pytest` is unavailable.
- No proof that Cloud SQL has the KG migration, extensions, RLS, or data loaded.

Drift found:

- `graph_embeddings.embedding` is `vector(1536)` in `0011_postgres_kg_contract.py`.
- Current model matrix and architecture default embeddings to `text-embedding-005` at 768 dimensions.
- General `embeddings` and `agent_memory` migrations use `vector(768)`.

This is a real schema/model drift risk that `audit:kg-backend` does not catch.

## Two-Phase Commit / Reconciler / Drift

Status: **FAIL / incomplete.**

Pack 10 and the architecture bible require Firestore `pending` -> Postgres write -> Firestore `committed`, plus a reconciler. The backlog still lists the Firestore/Postgres two-phase commit reconciler and parity snapshots as open. Grep found docs/runbook references, but no implementation evidence for a Firestore/Postgres reconciler.

Default `audit:kg-drift` passes only in example-contract mode:

- `syria-2026`: 42 nodes, 69 edges, drift 0.
- `nordalia-2026`: 61 nodes, 39 edges, drift 0.

Production drift is blocked because Firestore Admin credentials are unavailable locally.

## Neo4j Production Config Posture

Status: **DRIFT / blocked.**

Static config posture is Postgres-first:

- `src/lib/kg/backend.ts` defaults to `postgres`, while retaining `neo4j` and `both`.
- `backend/config.py` defaults `graph_backend` to `postgres` and `neo4j_uri` to empty.

Doc posture is inconsistent:

- The architecture bible says no Neo4j in v1.
- The handoff and Phase 1 docs still describe Neo4j Aura / Secret Manager as production graph-index posture.
- Prior Phase 1 preflight recorded `NEO4J_URI` as missing.

No live Neo4j Secret Manager or Aura connectivity check was performed in this self-audit. Treat Neo4j as unproven and source-of-truth-drifted until the docs are reconciled.

## Findings

| ID | Severity | Finding | Status |
|---|---:|---|---|
| C-001 | S1 | Production context/storage parity is not verified: Firebase Admin, DB SQL, Cloud SQL extensions/RLS, and production drift are blocked. | OPEN |
| C-002 | S1 | Firestore/Postgres two-phase commit and reconciler are specified but not implemented. | OPEN |
| C-003 | S2 | Four-layer context has type parity, but persisted user/workspace hydration is thin. | OPEN |
| C-004 | S2 | KG embedding dimensionality drift: `graph_embeddings vector(1536)` vs current 768-dim Vertex embedding default. | OPEN |
| C-005 | S2 | Neo4j production posture is contradictory across docs/config and not live-verified. | OPEN |

## Layer Pass/Fail Summary

| Area | Result |
|---|---:|
| Type parity | PASS |
| Context-aware advisory middleware | PASS |
| Marketplace ContextProvider isolation | PASS |
| Context persistence richness | PARTIAL |
| Postgres KG static schema/repository contract | PASS |
| Live Postgres schema/RLS/extensions | BLOCKED |
| pgvector posture | DRIFT |
| Owner/case scoping static posture | PASS |
| Bi-temporal static posture | PASS |
| Two-phase commit/reconciler | FAIL |
| Default example drift | PASS |
| Production drift | BLOCKED |
| Neo4j production config | DRIFT / BLOCKED |

# B1 — Dual-write graph mutations

## Goal

After B0 approves the cutover plan, this file makes every frontend
graph mutation write to BOTH Firestore (current path, unchanged) AND
Postgres (target path, additive). Reads still come from Firestore.
This is the safety period: if Postgres writes break, Firestore keeps
serving.

## Pre-conditions

1. B0 decision doc shows Case 1 or Case 2 with `real_user_rows == 0`
   (after backup if applicable).
2. Migration `0012_embedding_dim_alignment.py` from night-pack 09 has
   been run (graph_embeddings is vector(768)).
3. `KG_BACKEND` env var documented; production not yet flipped.

## Files Codex must read first

- `src/lib/knowledge/graph-layer.ts`
- `src/app/api/graph/populate/route.ts`
- `src/app/api/graph/approve-staged/route.ts`
- `backend/services/kg_repositories.py`
- `backend/migrations/versions/0012_embedding_dim_alignment.py`

## Tasks

### 1. Postgres write client in Next

Create `src/lib/knowledge/postgres-graph-client.ts`. The Next API
routes need a way to call Postgres. Options:

**Option A: Direct `pg` connection from Next**. Adds a Postgres
client dependency to the frontend. Connection pooling lives in the
serverless runtime — tricky.

**Option B: Call backend FastAPI endpoint**. Backend already has a
Postgres client. New endpoint `/api/v1/kg/dual-write` accepts the
graph mutation payload and writes via `kg_repositories`.

**Recommended: Option B** — keeps Postgres connection management in
the backend where it belongs.

Add to FastAPI:

```python
# backend/routers/kg.py
from fastapi import APIRouter, Depends
from backend.services.kg_repositories import GraphNodeRepo, GraphEdgeRepo

router = APIRouter(prefix="/api/v1/kg", tags=["kg"])

@router.post("/dual-write/upsert-nodes")
async def upsert_nodes(payload: UpsertNodesRequest, ctx = Depends(get_user_ctx)):
    repo = GraphNodeRepo()
    return await repo.upsert_many(
        owner_uid=ctx.uid,
        case_id=payload.case_id,
        org_id=ctx.org_id,
        nodes=payload.nodes,
    )

@router.post("/dual-write/upsert-edges")
async def upsert_edges(payload: UpsertEdgesRequest, ctx = Depends(get_user_ctx)):
    repo = GraphEdgeRepo()
    return await repo.upsert_many(
        owner_uid=ctx.uid,
        case_id=payload.case_id,
        org_id=ctx.org_id,
        edges=payload.edges,
    )

@router.post("/dual-write/upsert-embeddings")
async def upsert_embeddings(payload: UpsertEmbeddingsRequest, ctx = Depends(get_user_ctx)):
    # Validates dim==768, writes via repo.
    ...
```

`get_user_ctx` reads the auth token forwarded from Next (existing
backend auth pattern).

### 2. Dual-write helper in Next

```typescript
// src/lib/knowledge/dual-write.ts

import type { GraphNode, GraphEdge, GraphEmbedding } from '@/types/graph';

interface DualWriteOptions {
  caseId: string;
  orgId: string;
  uid: string;
  authToken: string;
}

/**
 * Perform a graph mutation on both Firestore (primary, awaited) and
 * Postgres (secondary, fire-and-forget with logging).
 *
 * Postgres failures DO NOT block the user — they are logged and a
 * background reconciler can retry. The primary path stays Firestore
 * during the dual-write window.
 */
export async function dualWriteUpsertNodes(
  nodes: GraphNode[],
  opts: DualWriteOptions,
  primaryWriter: (nodes: GraphNode[]) => Promise<void>,
): Promise<void> {
  // 1. Primary: Firestore (awaited)
  await primaryWriter(nodes);

  // 2. Secondary: Postgres (best-effort)
  if (process.env.KG_DUAL_WRITE !== 'true') return;

  try {
    const url = `${process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL}/api/v1/kg/dual-write/upsert-nodes`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.authToken}`,
      },
      body: JSON.stringify({ case_id: opts.caseId, nodes }),
      // Short timeout so we don't slow the user down
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error('dual-write postgres upsert-nodes failed', {
        status: res.status, caseId: opts.caseId,
      });
      // Enqueue retry — see task 4
      await enqueueDualWriteRetry({
        kind: 'upsert-nodes',
        caseId: opts.caseId,
        nodes,
        opts,
      });
    }
  } catch (err) {
    console.error('dual-write postgres upsert-nodes threw', err);
    await enqueueDualWriteRetry({ kind: 'upsert-nodes', caseId: opts.caseId, nodes, opts });
  }
}

// Same shape for upsertEdges, upsertEmbeddings, deleteNodes, etc.
```

### 3. Wire dual-write into mutation routes

In `src/app/api/graph/populate/route.ts`:

```typescript
// existing primary write
await populateSituationGraph(uid, caseId, payload);

// new dual-write
import { dualWriteUpsertNodes, dualWriteUpsertEdges } from '@/lib/knowledge/dual-write';

await dualWriteUpsertNodes(payload.nodes, {
  caseId, orgId: user.orgId, uid, authToken,
}, async () => { /* primary already done above */ });

await dualWriteUpsertEdges(payload.edges, { ... }, async () => {});
```

Same for `approve-staged`, any direct node/edge edits, and embedding
writes from the document upload path.

### 4. Retry queue

Failures during dual-write must NOT be lost. Two options:

**Option A: Cloud Tasks** — proper async queue, durable retries.
Recommended for production.

**Option B: Firestore backlog collection** — write a record to
`graph_dual_write_backlog/{id}` and a scheduled function drains it.
Simpler.

For v2 launch, use Option B. Codex creates:

```typescript
// src/lib/knowledge/dual-write-retry.ts
export async function enqueueDualWriteRetry(payload: {
  kind: 'upsert-nodes' | 'upsert-edges' | 'upsert-embeddings' | 'delete-nodes';
  caseId: string;
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  embeddings?: GraphEmbedding[];
  opts: DualWriteOptions;
}): Promise<void> {
  const db = adminFirestore();
  await db.collection('graph_dual_write_backlog').add({
    ...payload,
    enqueuedAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  });
}
```

A scheduled Cloud Function (or Cloud Run job) drains the backlog every
5 minutes:

```typescript
// scripts/drain-dual-write-backlog.ts
// Pulls up to 100 entries, retries each, marks success or
// increments attempts. After 10 attempts, moves to dead-letter.
```

GC schedules this in Cloud Scheduler.

### 5. Parity audit

`scripts/audit-dual-write-parity.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * For a sample of cases, compare node/edge counts between Firestore
 * and Postgres. Flag any case where the difference exceeds 5%.
 *
 * Runs nightly during the dual-write window. Failures here trigger
 * an investigation, not a deploy block.
 */

// Iterate 100 random cases (or all if fewer).
// For each:
//   - count Firestore graph nodes
//   - call backend GET /api/v1/kg/parity/{caseId} which counts Postgres
//   - compute drift
// Report > 5% drift cases.
```

This audit is **not** in `audit:gate` because it requires a real DB
connection. It runs as a scheduled job in production.

### 6. Feature flag

`KG_DUAL_WRITE=true` in production env. Off in dev/test by default.
Codex documents this in `STATUS.md` as a deploy-step requirement.

When `false`, the dual-write helpers no-op after the primary write.

### 7. Audit: `audit:dual-write-coverage`

Static-marker audit: every graph-mutating route in `src/app/api/graph/`
calls a `dualWrite*` helper.

```typescript
// scripts/audit-dual-write-coverage.ts
// For src/app/api/graph/**/route.ts where the file contains
// 'POST'/'PUT'/'PATCH'/'DELETE', confirm `dualWrite` import + call.
```

Add to `audit:gate`.

## Acceptance criteria

1. FastAPI dual-write endpoints exist.
2. Next dual-write helpers in `src/lib/knowledge/dual-write.ts`.
3. Every graph mutation route calls a dual-write helper.
4. Retry queue collection exists; drain script exists.
5. Parity audit script exists.
6. `KG_DUAL_WRITE` env flag documented.
7. `audit:dual-write-coverage` passes.
8. Manual smoke: with `KG_DUAL_WRITE=true`, populate a graph for a
   test case, then query both Firestore and Postgres — same node/edge
   counts within 5%.

## Diagnostics

```bash
test -f src/lib/knowledge/dual-write.ts && echo OK
test -f backend/routers/kg.py && echo OK
grep -q "dualWrite" src/app/api/graph/populate/route.ts && echo OK
grep -q "dualWrite" src/app/api/graph/approve-staged/route.ts && echo OK
test -f scripts/drain-dual-write-backlog.ts && echo OK
npm run audit:dual-write-coverage && echo OK
```

## If Codex stops short

**Failure mode A**: Postgres writes block the user. Re-prompt:

> "Dual-write to Postgres must NOT block the user. Confirm the
> primary Firestore write is awaited and the Postgres write is
> wrapped in `try/catch` with a 5s timeout that doesn't propagate
> failure to the response. The user sees no slowdown."

**Failure mode B**: Failures are logged but never retried. Re-prompt:

> "Confirm `enqueueDualWriteRetry` is called in BOTH the
> non-2xx branch AND the catch block. Confirm
> `graph_dual_write_backlog` rows accumulate when Postgres is
> deliberately offline (e.g., wrong host). Confirm the drain
> script processes them when Postgres comes back."

**Failure mode C**: Embeddings are dual-written at 1536d while
Postgres expects 768d. Re-prompt:

> "Pre-condition: night-pack 09_EMBEDDING_DIMENSION migration must
> have run. Confirm `EMBEDDING_DIMENSION === 768` in the dual-write
> path. If a 1536d vector hits the upsert, the API returns 422 and
> the entry goes to dead-letter. Show me the validation."

## Commit

```
feat(B1): dual-write graph mutations to Postgres

Every frontend graph mutation now writes to Firestore (primary,
awaited) and Postgres (secondary, best-effort with retry queue).
KG_DUAL_WRITE=true in production turns on the secondary; off in
dev. FastAPI gains /api/v1/kg/dual-write/* endpoints.

Failures route to graph_dual_write_backlog for scheduled drain.
Parity audit script flags drift > 5% for investigation.

audit:dual-write-coverage protects the contract.

Refs: V2_WORK_PACK/B1_DUAL_WRITE_GRAPH.md
```

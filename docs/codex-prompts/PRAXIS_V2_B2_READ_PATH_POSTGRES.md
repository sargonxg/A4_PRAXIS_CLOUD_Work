# B2 — Read path migration to Postgres

## Goal

After 7 days of clean dual-write (B1) with parity audit < 5% drift,
flip graph reads from Firestore to Postgres. Firestore stays as
fallback — if Postgres reads fail, the route reads Firestore. After
another 7 days clean, B3 retires the Firestore write path.

## Pre-conditions

1. B1 has run for ≥7 days in production with `KG_DUAL_WRITE=true`.
2. Parity audit shows < 5% drift on every active case.
3. `graph_dual_write_backlog` is empty (or near-empty — < 10 entries).
4. Latency profile from B0 shows pgvector queries acceptable
   (< 200ms p95 at current row counts).

## Files Codex must read first

- `src/lib/knowledge/graph-layer.ts`
- `src/lib/knowledge/situation-knowledge-core.ts`
- `src/lib/knowledge/vector-layer.ts`
- `src/app/api/graph/[caseId]/route.ts` (and any similar reads)
- `src/lib/api/with-calibration.ts` — calls `retrieveForProfile`
- `backend/services/kg_repositories.py`

## Tasks

### 1. Postgres read endpoints

Add to FastAPI:

```python
# backend/routers/kg.py

@router.get("/read/graph/{case_id}")
async def read_graph(case_id: str, ctx = Depends(get_user_ctx)):
    nodes = await GraphNodeRepo().list_for_case(ctx.uid, case_id, ctx.org_id)
    edges = await GraphEdgeRepo().list_for_case(ctx.uid, case_id, ctx.org_id)
    return {"nodes": nodes, "edges": edges}

@router.post("/read/embeddings/search")
async def search_embeddings(payload: SearchRequest, ctx = Depends(get_user_ctx)):
    """Cosine-similarity search over graph_embeddings."""
    return await GraphEmbeddingRepo().search(
        owner_uid=ctx.uid,
        case_id=payload.case_id,
        org_id=ctx.org_id,
        query_vector=payload.query_vector,
        limit=payload.limit ?? 10,
    )
```

Both return data shaped to match what the Firestore reader returns,
so the call site doesn't need to know the source.

### 2. Reader abstraction

Create `src/lib/knowledge/graph-reader.ts`:

```typescript
import type { GraphNode, GraphEdge } from '@/types/graph';

interface ReadOptions {
  uid: string;
  caseId: string;
  orgId: string;
  authToken: string;
}

interface GraphReadResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  source: 'firestore' | 'postgres';
}

const PRIMARY = process.env.KG_READ_PRIMARY ?? 'firestore';
// 'firestore' (B1 state) or 'postgres' (B2 state)

export async function readGraph(opts: ReadOptions): Promise<GraphReadResult> {
  if (PRIMARY === 'postgres') {
    try {
      const result = await readFromPostgres(opts);
      return { ...result, source: 'postgres' };
    } catch (err) {
      console.error('postgres read failed, falling back to firestore', err);
      const result = await readFromFirestore(opts);
      return { ...result, source: 'firestore' };
    }
  }

  // PRIMARY === 'firestore'
  return { ...(await readFromFirestore(opts)), source: 'firestore' };
}

async function readFromPostgres(opts: ReadOptions) {
  const url = `${process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL}/api/v1/kg/read/graph/${encodeURIComponent(opts.caseId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${opts.authToken}` },
    signal: AbortSignal.timeout(2000),
  });
  if (!res.ok) throw new Error(`postgres read ${res.status}`);
  return await res.json();
}

async function readFromFirestore(opts: ReadOptions) {
  // existing Firestore graph-layer code, called as before
  // ...
}
```

Same shape for `searchEmbeddings`.

### 3. Migrate call sites

Find every consumer of the existing Firestore graph read:

```bash
rg "graph-layer|graphLayer\\." src/ -l
rg "VectorLayer\\.search|vectorLayer\\.search" src/ -l
```

Replace direct calls with `readGraph(...)` / `searchEmbeddings(...)`.

The most important call site: `withCalibration` → `retrieveForProfile`
→ `SituationKnowledgeCore.retrieve` → `VectorLayer.search`. Trace this
chain and replace the leaf-level Firestore search with the abstraction.

### 4. Source telemetry

Every `readGraph` call records the `source` field in structured logs.
This lets you see, post-cutover, what % of reads came from Postgres
vs Firestore (the latter being the fallback). Healthy steady-state:
> 99% Postgres.

Codex emits a structured log:

```typescript
console.log(JSON.stringify({
  event: 'graph.read',
  caseId, source: result.source, latencyMs: Date.now() - start,
}));
```

These get parsed by the structured logging work in D0.

### 5. Shadow-read audit

For 7 days post-cutover, run a comparison: every Postgres read also
shadow-reads Firestore and compares the result shapes. Mismatches go
to a log for investigation.

This is opt-in (`KG_SHADOW_READ=true`) because it doubles the read
cost. Only run during the shadow-verification window.

```typescript
async function readWithShadow(opts: ReadOptions) {
  if (process.env.KG_SHADOW_READ !== 'true') return readGraph(opts);

  const [primary, shadow] = await Promise.allSettled([
    readGraph(opts),
    readFromFirestore(opts).catch((e) => ({ error: e })),
  ]);

  if (primary.status === 'fulfilled' && shadow.status === 'fulfilled' && !('error' in shadow.value)) {
    const drift = computeDrift(primary.value, shadow.value);
    if (drift > 0) {
      console.warn(JSON.stringify({
        event: 'graph.shadow-drift',
        caseId: opts.caseId, drift, primarySource: primary.value.source,
      }));
    }
  }

  return primary.status === 'fulfilled' ? primary.value : Promise.reject(primary.reason);
}
```

### 6. Flip the flag

Production env: `KG_READ_PRIMARY=postgres`. This is a one-line change
in Cloud Run env (Secret Manager update + redeploy). GC handles the
flip; Codex prepares the change.

### 7. Audit: `audit:graph-reader-coverage`

Static-marker: no consumer of graph-layer/vector-layer reads
Firestore directly. All reads go through the abstraction.

```typescript
// scripts/audit-graph-reader-coverage.ts
// Walk src/. Forbidden: direct calls to firestore graph paths.
// Required: imports from @/lib/knowledge/graph-reader.
```

## Acceptance criteria

1. FastAPI read endpoints exist and return correctly-shaped data.
2. `graph-reader.ts` abstraction in place.
3. All call sites migrated.
4. `KG_READ_PRIMARY` env documented.
5. Shadow-read mode available with `KG_SHADOW_READ=true`.
6. `audit:graph-reader-coverage` passes.
7. After flipping `KG_READ_PRIMARY=postgres` in dev, a typical case
   loads from Postgres with no user-visible regression.
8. Source telemetry logged.

## Diagnostics

```bash
test -f src/lib/knowledge/graph-reader.ts && echo OK
test -f backend/routers/kg.py && echo OK
grep -q "graph-reader" src/lib/api/with-calibration.ts && echo OK
npm run audit:graph-reader-coverage && echo OK
KG_READ_PRIMARY=postgres npm run build && echo OK

# Manual: open a test case, observe network tab. Should hit
# /api/v1/kg/read/graph/<caseId>, not Firestore directly.
```

## If Codex stops short

**Failure mode A**: Migration misses a call site, breaking that
specific tool. Re-prompt:

> "Run `rg 'firestore.*graph|graph_layer\\.|graphStore\\.' src/`.
> Every result must either be replaced with graph-reader, or
> annotated with a comment explaining why it stays direct (e.g.,
> a migration helper). Show me each."

**Failure mode B**: Postgres errors trigger fallback but the user
gets stale data. Re-prompt:

> "Add a small banner: when readGraph returns source='firestore'
> AND PRIMARY==='postgres', log a structured event so we can
> investigate. Don't show the banner to the user — just instrument."

**Failure mode C**: Shadow-read mode doubles latency. Re-prompt:

> "Confirm shadow-read is opt-in via env var, not on by default.
> Confirm in production logs that KG_SHADOW_READ is unset. The mode
> is only for the 7-day verification window."

## Commit

```
feat(B2): postgres read path with firestore fallback

Graph reads now go through src/lib/knowledge/graph-reader.ts which
respects KG_READ_PRIMARY env. When set to 'postgres', reads come
from FastAPI /api/v1/kg/read/* endpoints with a 2s timeout and
firestore fallback on failure.

Source telemetry logs every read for post-cutover analytics.
Shadow-read mode (KG_SHADOW_READ=true) compares postgres vs
firestore for the verification window.

audit:graph-reader-coverage prevents direct firestore reads.

Refs: V2_WORK_PACK/B2_READ_PATH_POSTGRES.md
```

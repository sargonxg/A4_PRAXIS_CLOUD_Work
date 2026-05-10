# B3 — Retire Firestore graph write path

## Goal

After 7 days of clean Postgres reads (B2) — `< 0.1%` shadow drift, no
user-reported regressions, source telemetry showing > 99% Postgres —
stop writing to Firestore. The Firestore graph collection becomes
read-only and is eventually deleted.

This file is the smallest in the B sequence but the highest-confidence:
the dual-write/dual-read period has already proven the system can
operate on Postgres alone.

## Pre-conditions

1. B2 ran for 7+ days with `KG_READ_PRIMARY=postgres`.
2. Source telemetry shows `firestore` reads only as fallback (< 1%).
3. Shadow drift telemetry shows < 0.1% for 7 consecutive days.
4. No user-reported graph regressions in the period.
5. `STATUS.md` has explicit GC sign-off: "B3 approved".

If any pre-condition fails, **stop**.

## Tasks

### 1. Stop writing to Firestore

In `src/lib/knowledge/dual-write.ts`, gate the primary writer behind
a flag:

```typescript
const FIRESTORE_WRITES = process.env.KG_FIRESTORE_WRITES ?? 'on';
// 'on' (B1+B2 state) | 'off' (B3 state)

export async function dualWriteUpsertNodes(
  nodes: GraphNode[],
  opts: DualWriteOptions,
  primaryWriter: (nodes: GraphNode[]) => Promise<void>,
): Promise<void> {
  if (FIRESTORE_WRITES === 'on') {
    await primaryWriter(nodes);
  }
  // Postgres write — now the actual primary
  if (FIRESTORE_WRITES === 'off') {
    // Make the Postgres write awaited (was best-effort).
    await postgresWriter(nodes, opts);
  } else {
    // Still best-effort during transition
    postgresWriter(nodes, opts).catch((err) => {
      enqueueDualWriteRetry({ ... });
    });
  }
}
```

Production env: `KG_FIRESTORE_WRITES=off`.

### 2. Read fallback also flipped

In `graph-reader.ts`, when `KG_FIRESTORE_WRITES === 'off'` and
Postgres read fails, fall back to **the cache** or return an error
to the user — not to Firestore (which is now stale).

```typescript
if (PRIMARY === 'postgres') {
  try {
    return await readFromPostgres(opts);
  } catch (err) {
    if (FIRESTORE_WRITES === 'off') {
      // Postgres is the source of truth; firestore is stale.
      throw new Error('graph read failed');
    }
    // Transition state: firestore still has writes, can fall back.
    return await readFromFirestore(opts);
  }
}
```

### 3. Mark Firestore graph collections deprecated

In `firestore.rules`, add a comment:

```javascript
// DEPRECATED 2026-MM-DD — graph writes moved to Postgres in B3.
// Reads stay open for emergency fallback through 2026-NN-01,
// after which this match block is removed.
match /users/{uid}/situations/{situationId}/graph/{document=**} {
  allow read: if canReadSituation(...);
  allow write: if false;  // <-- B3: reject all writes
}
```

The graph subcollection now reads from Postgres in normal operation;
Firestore documents become a fossil.

### 4. Backup before deletion (optional, but recommended)

Run a `gcloud firestore export` of the graph collections to GCS before
removing them. Stored in `gs://praxis-backups/firestore-graph-{date}/`.
Retain for 90 days. GC schedules; Codex documents the command.

### 5. Documentation

Update `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`:

```markdown
## Graph backend

CURRENT (post-B3):
- Reads: Postgres `graph_nodes`, `graph_edges`, `graph_embeddings`
  via FastAPI `/api/v1/kg/read/*`
- Writes: Postgres via FastAPI `/api/v1/kg/dual-write/*` (legacy
  endpoint name kept for compat; the "dual" is now historical)
- Firestore graph collections: read-only, fossil, scheduled for
  deletion on <date>

PREVIOUS (pre-B3):
- Reads: Firestore `users/{uid}/situations/{sitId}/graph/*`
- Writes: same path
- Postgres KG: dark infrastructure, schema only
```

### 6. Audit: `audit:no-firestore-graph-writes`

Static-marker: every `dualWrite*` call site must pass through the
flag-gated helper, not directly to Firestore.

```typescript
// scripts/audit-no-firestore-graph-writes.ts
// Forbidden patterns:
//   firestore().collection('users').*situations.*graph.*set
//   firestore().collection('users').*situations.*graph.*update
//   firestore().collection('users').*situations.*graph.*add
// Allowed: only inside src/lib/knowledge/dual-write.ts and helpers.
```

### 7. Cost cleanup

After ~30 days of Firestore being read-only, run a delete script:

```bash
# scripts/delete-firestore-graph.sh — RUN ONLY AFTER 30 DAYS
gcloud firestore bulk-delete --collection-ids="graph" --async
```

GC executes when ready. Codex puts the script in place but does NOT
execute.

## Acceptance criteria

1. `KG_FIRESTORE_WRITES=off` in production env.
2. Firestore graph rules reject writes.
3. Postgres write is awaited (no longer best-effort) when flag is off.
4. Read fallback no longer goes to Firestore when flag is off.
5. Backup performed before any deletion.
6. `audit:no-firestore-graph-writes` passes (allowing the helper).
7. Documentation updated.

## Diagnostics

```bash
grep "KG_FIRESTORE_WRITES" .env.example STATUS.md && echo OK
grep "DEPRECATED" firestore.rules && echo OK
npm run audit:no-firestore-graph-writes && echo OK

# Manual: with KG_FIRESTORE_WRITES=off in dev, populate a graph,
# confirm only Postgres has the new rows. Open Firestore console
# for that case — graph subcollection is unchanged from before.
```

## If Codex stops short

**Failure mode A**: Codex flips writes off without checking
preconditions. **Stop and roll back.** Re-prompt:

> "B3 has explicit pre-conditions in its header. Show me the
> evidence each is satisfied: 7-day clean window, < 0.1% drift, GC
> sign-off. If any is missing, revert to KG_FIRESTORE_WRITES=on
> immediately and document in STATUS.md."

**Failure mode B**: Postgres write fails after flag flip and the user
loses data. Re-prompt:

> "When KG_FIRESTORE_WRITES=off, the Postgres write is the only
> persistence path. Confirm it's awaited (not best-effort).
> Confirm failures bubble up as a 5xx response so the user is
> notified and can retry. The dead-letter queue still exists for
> recovery."

## Commit

```
chore(B3): retire firestore graph writes

After 7 days of clean Postgres reads + writes via dual-write
infrastructure, KG_FIRESTORE_WRITES=off in production. Postgres
becomes the sole source of truth.

Firestore graph collections become read-only fossils;
firestore.rules updated with DEPRECATED comments. Backup before
deletion. Schedule for full deletion in 30 days.

audit:no-firestore-graph-writes prevents direct writes to the
fossil paths.

Refs: V2_WORK_PACK/B3_RETIRE_FIRESTORE_GRAPH.md
```

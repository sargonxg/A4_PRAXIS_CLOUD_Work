# Spec — LangGraph Runtime Foundation (Brick #1, Lane 7)

> Drop-in spec for Codex round-6 to land the durable-agent runtime.
> Authored 2026-04-27 by Claude Code; backend Python work is Codex-owned.
> Source plan: `docs/MONSTER_TODO_2026-04-27.md` Brick #1 +
> `docs/DEEP_RESEARCH_ACTION_PLAN_2026-04-27.md` Lane 7 +
> `docs/LANGGRAPH_CLOUDSQL_CHECKPOINTING.md` (provisioned infrastructure).

## Goal

Add a durable, resumable, auditable agent execution layer to PRAXIS by
wiring the already-provisioned Cloud SQL Postgres `praxisbytacitus-instance`
as the LangGraph checkpoint store. This unblocks Brick #2 (Brainstorming
Table migration) and every future multi-step agent workflow.

## Non-goals (explicitly out of scope for this brick)

- Migrating any existing workflow to LangGraph (separate brick per workflow).
- Mutating canonical graph/timeline state from agents (always proposals).
- Adding Vertex AI Agent Engine to the runtime — Vertex ADK Deep Search
  Agent stays a separate path.
- Public-IP Cloud SQL — the org policy `constraints/sql.restrictPublicIp`
  is enforced and stays.

## Inputs (already provisioned — verified by `npm run audit:gcp`)

| Resource | Value |
|---|---|
| Cloud SQL instance | `praxisbytacitus-instance` |
| Connection name | `praxisbytacitus:us-east4:praxisbytacitus-instance` |
| Region / zone | `us-east4` / `us-east4-a` |
| Database | `praxis_langgraph` |
| User | `praxis_langgraph` |
| Password secret | `praxis-langgraph-db-password` |
| Service account | `praxis-agents-sa@praxisbytacitus.iam.gserviceaccount.com` |
| Cloud Tasks queue | `praxis-agents` |

## Open decision (needs Giulio confirmation before merge)

**Q1**: New `praxis-agents` Cloud Run service vs hosting the first graph
inside existing `praxis-backend`?
- **Recommendation**: keep first graph inside `praxis-backend`. One fewer
  deploy target, simpler IAM, and `praxis-backend` already has VPC
  egress. Promote to a dedicated service when usage demands it.

## Files Codex should create

```
backend/agents/
├── __init__.py
├── langgraph/
│   ├── __init__.py
│   ├── checkpointing.py         # PostgresSaver factory from env / Secret Manager
│   ├── schemas.py               # Pydantic state + event schemas
│   └── _smoke.py                # local integration test entry-point
├── pyproject.toml               # add `langgraph`, `langgraph-checkpoint-postgres`, `psycopg[binary,pool]`
```

## Files Codex should modify

```
backend/main.py                  # add /agents/health route
backend/config.py                # add LANGGRAPH_* env keys (already partially listed in docs/LANGGRAPH_CLOUDSQL_CHECKPOINTING.md)
backend/Dockerfile               # add psycopg native deps if needed
cloudbuild.yaml                  # if a separate `praxis-agents` service is added
infrastructure/setup-langgraph-cloudsql.sh  # already exists; verify
```

## API contract

### `GET /agents/health`

Response:
```json
{
  "ok": true,
  "checkpointer": {
    "backend": "postgres",
    "host": "10.101.0.3",
    "database": "praxis_langgraph",
    "schemaSetup": true,
    "lastCheckedAt": "2026-04-27T12:00:00Z"
  }
}
```

- 200 when checkpoint DB is reachable and schema is set up.
- 503 when DB unreachable; emit `system_events` row with kind `agents.health.failed`.

### Internal Python contract

`backend/agents/langgraph/checkpointing.py` exposes:

```python
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool

def get_checkpointer() -> PostgresSaver:
    """Lazily create a PostgresSaver bound to the praxis_langgraph DB.
    Calls .setup() once per process so the first invocation creates
    the checkpoint tables (idempotent).
    """
```

Configuration is read from environment:
- `LANGGRAPH_DB_HOST=10.101.0.3`
- `LANGGRAPH_DB_PORT=5432`
- `LANGGRAPH_DB_NAME=praxis_langgraph`
- `LANGGRAPH_DB_USER=praxis_langgraph`
- `LANGGRAPH_DB_PASSWORD_SECRET=praxis-langgraph-db-password`

Cloud Run access is via the Cloud SQL connector or VPC egress to the
`default` network (Cloud SQL is private-IP only).

## Firestore agent_run schema

Add `users/{uid}/situations/{sid}/agent_runs/{runId}` (no rules change
required if existing rules already cover everything under `situations`).
Schema (canonical TypeScript shape; Codex can mirror in Python):

```ts
interface AgentRun {
  runId: string;
  uid: string;
  situationId: string | null;
  toolId: string;
  workflow: 'brainstorming-table' | 'brief-builder' | 'source-scout' | 'deep-search-agent' | string;
  status: 'queued' | 'running' | 'awaiting-human' | 'completed' | 'failed' | 'cancelled';
  checkpointThreadId: string;          // LangGraph thread_id
  startedAt: Timestamp;
  lastActivityAt: Timestamp;
  expiresAt: Timestamp;                 // TTL: 90d active, 30d completed brainstorming, 90d failed
  completedAt: Timestamp | null;
  checkpointDeletedAt: Timestamp | null;
  error?: { code: string; message: string };
  summary?: string;
  semaphore: 'green' | 'yellow' | 'red';
}
```

Indexes (add to `firestore.indexes.json` together with rules — Codex-owned):
- `agent_runs` collection-group index on `(uid, status, lastActivityAt desc)`
- `agent_runs` collection-group index on `(uid, expiresAt asc)` for the
  cleanup cron in Brick #21.

## Acceptance

- `npm run audit:gcp` continues green; Cloud SQL + IAM rows already pass.
- Local integration test with a Postgres container:
  - Spawn graph, save 1 checkpoint, kill process, restart, resume — same
    state.
- Health probe returns 200 from a deployed `praxis-backend` revision.
- No raw SQL writes in the cleanup cron (Brick #21) — use checkpointer
  `delete_thread(thread_id)` API only.

## How this hands off to Brick #2 (Brainstorming Table migration)

Once `get_checkpointer()` returns a working PostgresSaver, Brick #2 can:

1. Define the deliberation graph in `backend/agents/langgraph/brainstorming.py`
   with one node per persona turn + critique + synthesis.
2. Use a human-in-the-loop interrupt before the synthesis-chair node so
   analysts can edit a persona row.
3. Expose `POST /agents/brainstorming-table/start`, `POST /resume`, and
   `GET /run/{runId}` from `praxis-backend`.
4. Update `src/app/api/ai/brainstorming-table/route.ts` to call the
   backend and persist the canonical output to Firestore
   `tools/brainstorming-table` once the graph terminates.
5. Cloud Tasks queue `praxis-agents` enqueues long-running deliberations
   so the HTTP request returns immediately with a `runId`.

## Cleanup ownership (Brick #21 follow-up)

A nightly cron `/api/cron/cleanup-checkpoints` (Next.js) reads expired
`agent_runs` from Firestore, calls a backend endpoint
`DELETE /agents/runs/{threadId}` which proxies to the LangGraph
checkpointer's `delete_thread`. Every batch emits a `system_events` row.

## References

- LangGraph Postgres saver: `https://reference.langchain.com/python/langgraph.checkpoint.postgres/PostgresSaver`
- LangGraph persistence: `https://docs.langchain.com/oss/python/langgraph/persistence`
- Cloud SQL private IP: `https://cloud.google.com/sql/docs/postgres/private-ip`
- Provisioned infrastructure summary: `docs/LANGGRAPH_CLOUDSQL_CHECKPOINTING.md`
- Strategic context: `docs/MONSTER_TODO_2026-04-27.md` Brick #1 + #2.

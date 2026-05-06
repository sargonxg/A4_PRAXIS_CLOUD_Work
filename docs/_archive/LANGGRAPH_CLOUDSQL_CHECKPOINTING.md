# LangGraph Cloud SQL Checkpointing

> Status: provisioned, not yet wired into runtime code
> Last updated: 2026-04-27
> Project: `praxisbytacitus`

PRAXIS will use Cloud SQL for PostgreSQL as the durable checkpoint store for
LangGraph-based agent workflows. Firestore remains the user/application source
of truth. Postgres is only for agent execution state: checkpoints, writes,
interrupt/resume state, and short-lived workflow metadata that LangGraph needs
to recover from process restarts.

## Why This Structure

LangGraph checkpointing is a runtime concern, not user-facing product state.
The official LangGraph Postgres saver provides a production checkpointer and
creates/migrates its own checkpoint tables when `.setup()` is called. Cloud SQL
is the right Google-native backing store for that because it gives durable
transactions, private networking, backups, IAM-gated access, and operational
visibility without forcing PRAXIS to build a custom Firestore checkpointer.

Firebase SQL Connect / Data Connect is not the right first integration point
for LangGraph checkpoints. Data Connect is valuable when PRAXIS wants typed
client/server access to relational product data through Firebase-managed
schemas/connectors. The current repo does not contain `dataconnect.yaml`,
schema files, or connector files, so `firebase deploy --only dataconnect`
must not be run yet.

References:

- LangGraph persistence:
  `https://docs.langchain.com/oss/python/langgraph/persistence`
- LangGraph Postgres saver:
  `https://reference.langchain.com/python/langgraph.checkpoint.postgres/PostgresSaver`
- Cloud SQL private IP:
  `https://cloud.google.com/sql/docs/postgres/private-ip`
- Cloud SQL best practices:
  `https://cloud.google.com/sql/docs/postgres/best-practices`
- Firebase SQL Connect deploy flow:
  `https://firebase.google.com/docs/sql-connect/manage-schemas-and-connectors#normal-deployment`

## Provisioned Resources

| Resource | Value |
|---|---|
| Cloud SQL instance | `praxisbytacitus-instance` |
| Connection name | `praxisbytacitus:us-east4:praxisbytacitus-instance` |
| Region / zone | `us-east4` / `us-east4-a` |
| Database version | PostgreSQL 16 |
| Edition / tier | Enterprise / `db-f1-micro` |
| Network | `default` VPC |
| Public IP | disabled |
| Private IP | `10.101.0.3` |
| Private service range | `praxis-private-services` |
| Database | `praxis_langgraph` |
| User | `praxis_langgraph` |
| Password secret | `praxis-langgraph-db-password` |
| Agent service account | `praxis-agents-sa@praxisbytacitus.iam.gserviceaccount.com` |

`praxis-agents-sa` and `praxis-backend-sa` have:

- `roles/cloudsql.client`
- Secret Manager access to `praxis-langgraph-db-password`

## Organization Policy Note

The project enforces `constraints/sql.restrictPublicIp`. That is good.
Do not remove or weaken it. The Firebase console error about public IP means
the console path tried to create a public-IP Cloud SQL instance. The correct
pattern is a private-IP-only instance:

```bash
gcloud sql instances create praxisbytacitus-instance \
  --project=praxisbytacitus \
  --database-version=POSTGRES_16 \
  --region=us-east4 \
  --edition=ENTERPRISE \
  --tier=db-f1-micro \
  --network=default \
  --no-assign-ip
```

Use `infrastructure/setup-langgraph-cloudsql.sh` or
`infrastructure/setup-langgraph-cloudsql.ps1` instead of the console wizard.

## Runtime Ownership

The planned service boundary is:

| Layer | Store |
|---|---|
| LangGraph checkpoints | Cloud SQL Postgres |
| Agent run summary | Firestore `users/{uid}/situations/{sid}/agent_runs/{runId}` |
| Tool outputs | Firestore `users/{uid}/situations/{sid}/tools/{toolId}` |
| Compatibility UI cache | Firestore `tool-data/{toolId}` until migrated |
| Operational lifecycle | Firestore `tool_runs`, `background_jobs`, `system_events`, notifications |
| Graph/timeline proposals | Firestore approval queues, not direct canonical writes |

Postgres must not become a second product database. If a user should see it,
filter it, export it, or audit it, store a summary/canonical copy in Firestore.

## Environment Contract

Future `praxis-agents` / backend runtime should use these names:

```bash
LANGGRAPH_CHECKPOINT_BACKEND=postgres
LANGGRAPH_DB_INSTANCE_CONNECTION_NAME=praxisbytacitus:us-east4:praxisbytacitus-instance
LANGGRAPH_DB_HOST=10.101.0.3
LANGGRAPH_DB_PORT=5432
LANGGRAPH_DB_NAME=praxis_langgraph
LANGGRAPH_DB_USER=praxis_langgraph
LANGGRAPH_DB_PASSWORD_SECRET=praxis-langgraph-db-password
```

For Cloud Run private-IP access, deploy the service with VPC egress to the
same `default` network or use the Cloud SQL connector/instance attachment.
Do not add a public IP or authorized networks.

## First Runtime Implementation

Recommended package path:

```text
backend/agents/langgraph/
  checkpointing.py      # creates PostgresSaver from env/Secret Manager
  brainstorming.py      # first graph
  schemas.py            # Pydantic state/event schemas
```

Recommended dependencies:

```text
langgraph
langgraph-checkpoint-postgres
psycopg[binary,pool]
```

The first time the checkpointer is used, call `.setup()` so LangGraph creates
and migrates the checkpoint tables. Do this in a controlled startup/migration
path, not on every request.

## Cleanup And Retention

Firestore already has TTL policies for operational spine collections. Cloud SQL
does not have Firestore-style document TTL. Retention needs an explicit job.

Recommended cleanup policy:

- Keep active/checkpointed agent threads for 90 days after `lastActivityAt`.
- Keep completed low-risk Brainstorming Table checkpoints for 30 days after
  canonical output is written to Firestore.
- Keep failed/interrupted agent checkpoints for 90 days for debugging.
- Never delete Firestore canonical tool outputs as part of Postgres cleanup.

Implementation path:

1. Store every LangGraph `thread_id` in Firestore `agent_runs/{runId}` with
   `expiresAt`, `status`, and `checkpointThreadId`.
2. Nightly cron queries expired `agent_runs`.
3. For each expired completed run, call LangGraph checkpointer
   `delete_thread(thread_id)` and mark the Firestore row `checkpointDeletedAt`.
4. Emit a `system_events` row for cleanup success/failure.

Do not run raw SQL deletes against unknown LangGraph tables unless the package
schema is pinned and tested. Prefer the checkpointer API.

## Verification Commands

```bash
gcloud sql instances describe praxisbytacitus-instance \
  --project=praxisbytacitus \
  --format="yaml(name,state,databaseVersion,region,ipAddresses,settings.ipConfiguration)"

gcloud sql databases list \
  --instance=praxisbytacitus-instance \
  --project=praxisbytacitus

gcloud sql users list \
  --instance=praxisbytacitus-instance \
  --project=praxisbytacitus

gcloud secrets versions list praxis-langgraph-db-password \
  --project=praxisbytacitus

npm run audit:gcp
```

Expected: instance `RUNNABLE`, only PRIVATE IP, database/user present, password
secret enabled, GCP audit green.

## Open Implementation Work

1. Add `praxis-agents` Cloud Run service or decide to host the first graph in
   `praxis-backend`.
2. Add LangGraph dependencies to the chosen Python runtime.
3. Implement Postgres checkpointer initialization.
4. Add Brainstorming Table graph with pause/resume.
5. Add agent run Firestore schema/rules/indexes.
6. Add cleanup cron route/job for expired checkpoint threads.
7. Add integration tests with local Postgres.

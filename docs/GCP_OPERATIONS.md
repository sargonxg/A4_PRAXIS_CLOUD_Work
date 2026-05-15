# PRAXIS GCP Operations Runbook

Concrete, copy-paste-able commands for the GCP / Firebase / Cloud Run / Secret
Manager operations Codex and Claude Code cannot run themselves but the user
can. Every command is scoped to project `praxisbytacitus` and region
`us-central1`.

> **Authentication assumed.** Run `gcloud auth login` and `firebase login`
> once before working through this file.

Current auth checkpoint (2026-05-13): `gcloud`, Application Default
Credentials, and Firebase CLI auth all worked for `giulio@tacitus.me`.
`npm run audit:gcp` passed with 0 hard failures and 0 soft warnings. The dated
evidence ledger is `docs/audits/2026-05-13-gcp-firebase-auth-cleanup.md`.

---

## 1. Activate paid / freemium data sources

The order below is the same as `docs/SPRINT_2026-04-25.md` Stream C — fastest
user value first.

Current production note (2026-05-06): core Gemini/Vertex provider health and
Vertex AI Agent Engine are active in production. Firecrawl and Parallel are
retired from the deployed app surface; grounded Google Search, GDELT, UCDP,
ReliefWeb, HDX, UN News, World Bank, uploaded sources, Cloud SQL, and Neo4j are
the supported foundation. Polar remains optional until its Secret Manager values
are mounted; `/app/settings/system-health` shows the live status for each
integration.

### 1a. ~~ACLED~~ — **withdrawn 2026-04-25**

PRAXIS no longer ingests ACLED. The 2026 EULA's prohibition on SaaS
redistribution made it incompatible with our open-source-only stance.
Event-level intelligence is now served from **GDELT BigQuery**
(see §1c below) and **UCDP GED** (zero config).

### 1b. Vertex AI Agent Engine (Deep Research Agent, ~1–2 h)

> Recipe verified against the 2026-04-25 deep-research artifact at
> `docs/compass_artifact_wf-7af05074-9b31-4316-834d-b3a7500f4cf7_text_markdown.md`
> §R1. Read that section before running these commands — it has the
> current package versions and IAM model.

1. Enable APIs:
   ```bash
   gcloud services enable aiplatform.googleapis.com storage.googleapis.com --project=praxisbytacitus
   ```
2. Create a staging bucket for the agent code archive:
   ```bash
   gsutil mb -p praxisbytacitus -l us-central1 gs://praxisbytacitus-agent-staging
   ```
3. Pin Python deps (one-time, in `backend/agents/requirements.txt`):
   ```
   google-cloud-aiplatform[adk,agent_engines]>=1.148.1
   google-adk==1.31.1
   google-genai>=1.0.0
   ```
4. Deploy a 3-phase Reasoning Engine using `deploy.py` from the compass
   artifact §1.3 (planner → researcher → synthesizer pattern). Resource
   path will look like
   `projects/852128226674/locations/us-central1/reasoningEngines/<NUMERIC_ID>`.
   Capture the numeric ID after creation:
   ```python
   import vertexai
   vertexai.init(project="praxisbytacitus", location="us-central1")
   for e in vertexai.Client().agent_engines.list():
       print(e.api_resource.name)
   ```
5. Store the **numeric ID only** (not the full path) as a secret:
   ```bash
   echo -n "<numeric-id>" | gcloud secrets create praxis-vertex-adk-engine-id \
     --data-file=- --project=praxisbytacitus
   gcloud secrets add-iam-policy-binding praxis-vertex-adk-engine-id \
     --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor" \
     --project=praxisbytacitus
   ```
6. Grant the Cloud Run runtime SA permission to invoke the engine:
   ```bash
   gcloud projects add-iam-policy-binding praxisbytacitus \
     --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```
   (There is **no separate `roles/aiplatform.reasoningEngineUser`**;
   `roles/aiplatform.user` is the canonical invoker role as of April 2026.)
7. Keep `VERTEX_AGENT_ENGINE_ID=praxis-vertex-adk-engine-id:latest` mounted in
   `cloudbuild.yaml` `--set-secrets` for the frontend.
8. Verify: `curl -s https://praxis.tacitus.me/api/health | jq '.checks.vertex_adk'`.

### 1c. GDELT BigQuery hot slice (free <1 TB/mo, ~2 h)

Authoritative playbook:
**`docs/implementation/gdelt-ingestion-2026-04-25.md`** (1,036 lines).
TL;DR:

```bash
gcloud services enable bigquery.googleapis.com bigquerydatatransfer.googleapis.com cloudscheduler.googleapis.com --project=praxisbytacitus

bq query --use_legacy_sql=false --max_rows=1 \
'SELECT GKGRECORDID FROM `gdelt-bq.gdeltv2.gkg_partitioned`
 WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR) LIMIT 1'
```

Then create the two service accounts (`praxis-gdelt-poller`,
`praxis-gdelt-reader`) with minimal IAM grants per playbook §2,
apply the `praxis_analytics.gdelt_situation_events` DDL per §3, build
the Cloud Run Job per §4, schedule per §5. Cap at $2–5/month at MVP
scale.

### 1d. Polar billing (~2 h, active launch path)

Polar is the active subscription provider. Stripe references below are legacy
research notes only and should not be used for launch unless the billing
provider decision changes again.

Required secrets:

```bash
gcloud secrets create praxis-polar-access-token --replication-policy=automatic
gcloud secrets create praxis-polar-webhook-secret --replication-policy=automatic
gcloud secrets create praxis-polar-product-analyst --replication-policy=automatic
gcloud secrets create praxis-polar-product-team --replication-policy=automatic
```

Cloud Run env names:

- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_SERVER=production`
- `POLAR_SUCCESS_URL=https://praxis.tacitus.me/app/settings?payment=success&provider=polar&checkout_id={CHECKOUT_ID}`
- `POLAR_PRODUCT_ANALYST`
- `POLAR_PRODUCT_TEAM`
- `POLAR_PRODUCT_ENTERPRISE` if institution becomes self-serve

Webhook endpoint:

- `https://praxis.tacitus.me/api/polar/webhook`

Subscribe to subscription lifecycle events and `order.paid`. The app mirrors
entitlements into `users/{uid}` and reads them from Firestore through
`src/lib/api/tier.ts`.

### 1e. Research providers

Secrets now created in project `praxisbytacitus`:

- `praxis-db-password` -> `DATABASE_PASSWORD` / `LANGGRAPH_DB_PASSWORD`
- `NEO4J_URI` -> `NEO4J_URI` (alias of the active Dialectica Neo4j URI)
- `dialectica-neo4j-user` -> `NEO4J_USER`
- `dialectica-neo4j-password` -> `NEO4J_PASSWORD`
- `dialectica-neo4j-database` -> `NEO4J_DATABASE`

Retired provider secrets such as Firecrawl and Parallel are not mounted by the
current Cloud Build configs. Reintroducing those vendors requires a new phase
decision and an updated model/provider audit.

Recommended use:

- Free users: Google/Vertex + open fallbacks.
- Promo/Analyst/Team/Enterprise: Google/Vertex with grounded Google Search,
  corpus retrieval, source uploads, and governed data feeds.
- Heavy research, extraction, and graph-backed tasks: credit-costed in the route
  layer and audited by `/api/health`.

### 1f. Stripe (legacy)

1. In the Stripe Dashboard:
   - Create products **PRAXIS Analyst** ($49/mo) and **PRAXIS Team** ($199/mo).
   - For each, create a recurring price; copy the price ID
     (`price_…`).
   - Configure a webhook pointing at `https://praxis.tacitus.me/api/stripe/webhook`
     that listens for `customer.subscription.*`, `invoice.*`,
     `payment_intent.failed`. Copy the webhook signing secret
     (`whsec_…`).
2. ```bash
   for var in stripe-secret stripe-webhook-secret; do
     echo "TODO: paste value for $var, then press Ctrl-D"
     gcloud secrets create praxis-$var --data-file=- --project=praxisbytacitus
     gcloud secrets add-iam-policy-binding praxis-$var \
       --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor" \
       --project=praxisbytacitus
   done
   ```
3. Add to `cloudbuild.yaml` `--update-secrets`:
   `STRIPE_SECRET_KEY=praxis-stripe-secret:latest,STRIPE_WEBHOOK_SECRET=praxis-stripe-webhook-secret:latest`
4. Add as plain env vars (price IDs are non-secret):
   `STRIPE_PRICE_ANALYST=price_xxx,STRIPE_PRICE_TEAM=price_yyy`.

### 1e. ~~Anthropic Claude~~ — withdrawn 2026-04-25

Open-source / single-AI-line pivot. Gemini 3.1 Pro on Vertex AI is
the entire AI surface.

---

## 2. Standard deploy procedure

Every change committed to `main` should pass the validation gate first.

```bash
# 1. Validation gate — all must pass
npm run build
npm run lint
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run

# 2. Cloud Build deploy (≈8 minutes)
gcloud config set project praxisbytacitus
gcloud config set run/region us-central1
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus

# 3. Capture the build ID (printed at the start of the gcloud builds output)
BUILD_ID=<paste>

# 4. Verify Cloud Run revisions
gcloud run services describe praxis-frontend --region=us-central1 \
  --format="value(status.url,status.latestReadyRevisionName)"
gcloud run services describe praxis-backend --region=us-central1 \
  --format="value(status.url,status.latestReadyRevisionName)"

# 5. Smoke-test production endpoints
curl -sI https://praxis.tacitus.me/                      # 200 OK
curl -sI https://praxis.tacitus.me/login                  # 200 OK
curl -sI https://praxis.tacitus.me/onboarding            # 307 → /login
curl -s  https://praxis.tacitus.me/api/health | jq
curl -s  https://praxis.tacitus.me/api/auth/test-firebase | jq

# 6. Append to docs/DEPLOYMENT_LOG.md (commit ID, build ID, revisions,
#    health output, configuration gaps remaining).
```

---

## 2a. LangGraph Cloud SQL Checkpoint Store

Authoritative playbook: this section plus
`docs/specs/2026-04-27-langgraph-runtime/README.md`.

Use this for durable PRAXIS agents. Do not use the Firebase console flow that
tries to create a public-IP Cloud SQL instance; the project correctly blocks
that with `constraints/sql.restrictPublicIp`.

One-time setup or verification:

```bash
bash infrastructure/setup-langgraph-cloudsql.sh
```

Windows PowerShell:

```powershell
.\infrastructure\setup-langgraph-cloudsql.ps1
```

Verify:

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
```

Expected: Postgres 16 instance is `RUNNABLE`, has only a PRIVATE IP, databases
`praxis` and `praxis_langgraph` exist, users `praxis_app` and
`praxis_langgraph` exist, and password secrets have enabled versions.

Production database layout on the existing private-IP instance:

- Instance: `praxisbytacitus:us-east4:praxisbytacitus-instance`
- Phase 1 app database: `praxis`
- Phase 1 app user: `praxis_app`
- Phase 1 app password secret: `praxis-db-password`
- Legacy LangGraph database retained for compatibility: `praxis_langgraph`

Cloud Run mounts the Cloud SQL socket for the existing instance and PgBouncer
points at `/cloudsql/praxisbytacitus:us-east4:praxisbytacitus-instance`.

Firebase SQL Connect / Data Connect:

```bash
firebase dataconnect:services:list --project=praxisbytacitus
```

Do not run `firebase deploy --only dataconnect` until this repo contains
`dataconnect.yaml`, schema files, and connector files.

---

## 2b. Agent Run Cloud Tasks Dispatch

The Queue 5 dispatch boundary uses Cloud Tasks to call the private no-op agent
worker route:

```text
POST /api/agents/runs/[runId]/dispatch
  -> Cloud Tasks queue
  -> POST /api/agents/runs/[runId]/execute
```

Default queue target:

```text
projects/praxisbytacitus/locations/us-central1/queues/agent-runs
```

Required production environment:

```text
AGENT_RUNTIME_DATABASE_URL or PRAXIS_DATABASE_URL or DATABASE_URL
AGENT_RUN_WORKER_BASE_URL=https://praxis.tacitus.me
AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL=<cloud-tasks-invoker-service-account>
AGENT_RUN_WORKER_OIDC_AUDIENCE=<execute-route-audience>
```

Only set these when overriding defaults:

```text
AGENT_RUN_TASKS_PROJECT=praxisbytacitus
AGENT_RUN_TASKS_LOCATION=us-central1
AGENT_RUN_TASKS_QUEUE=agent-runs
```

Local smoke can use `AGENT_RUN_WORKER_SHARED_SECRET`, but production should use
Cloud Tasks OIDC and a trusted service account.

Create or verify the queue:

```bash
gcloud services enable cloudtasks.googleapis.com --project=praxisbytacitus

gcloud tasks queues describe agent-runs \
  --location=us-central1 \
  --project=praxisbytacitus

# If missing:
gcloud tasks queues create agent-runs \
  --location=us-central1 \
  --project=praxisbytacitus \
  --max-dispatches-per-second=5 \
  --max-concurrent-dispatches=10 \
  --max-attempts=3
```

The initial worker does not run models or tools. It only persists:

```text
queued -> running -> succeeded
```

---

## 3. Rollback

If the latest deploy is broken:

```bash
# List recent revisions
gcloud run revisions list --service=praxis-frontend \
  --region=us-central1 --limit=10

# Pin traffic to a known-good revision
gcloud run services update-traffic praxis-frontend \
  --to-revisions=praxis-frontend-00043-xyz=100 --region=us-central1

# Same for backend if needed
gcloud run services update-traffic praxis-backend \
  --to-revisions=praxis-backend-00026-h82=100 --region=us-central1
```

Cloud Build itself cannot be rolled back; re-run the build for the previous
commit if you need fresh containers:

```bash
git checkout <good-commit>
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
git checkout main
```

---

## 4. Logs and debugging

### Tail Cloud Run logs

```bash
gcloud run services logs tail praxis-frontend --region=us-central1
gcloud run services logs tail praxis-backend  --region=us-central1
```

### Query logs by error level (last hour)

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND
   resource.labels.service_name="praxis-frontend" AND
   severity>=ERROR' \
  --project=praxisbytacitus \
  --freshness=1h \
  --limit=50 \
  --format=json
```

### Cloud Build status

```bash
gcloud builds list --project=praxisbytacitus --limit=10
gcloud builds describe $BUILD_ID --project=praxisbytacitus
gcloud builds log $BUILD_ID --project=praxisbytacitus
```

---

## 5. Firestore rules + index management

### Deploy rules and indexes

```bash
firebase use praxisbytacitus
firebase deploy --only firestore:rules,firestore:indexes
```

### List existing indexes

```bash
firebase firestore:indexes --project=praxisbytacitus
```

### Verify a specific situation document

```bash
gcloud firestore export gs://praxisbytacitus-firestore-backups/$(date +%F) \
  --collection-ids=users --project=praxisbytacitus
```

(For ad-hoc inspection use the Firebase Console → Firestore.)

---

## 6. Pub/Sub topics — current expected set

The GCP audit script (`scripts/audit-gcp.mjs`) verifies these exist. As of
2026-04-25:

```
profile.events
```

If a future feature adds a topic, create it with:

```bash
gcloud pubsub topics create <topic-name> --project=praxisbytacitus
```

And update `scripts/audit-gcp.mjs` so the audit catches drift.

---

## 7. Monitoring + alerting

### Health-endpoint smoke from Cloud Scheduler (recommended)

```bash
gcloud scheduler jobs create http praxis-health-poll \
  --schedule="*/5 * * * *" \
  --uri="https://praxis.tacitus.me/api/health" \
  --http-method=GET \
  --location=us-central1 \
  --project=praxisbytacitus
```

This won't alert on its own — it only ensures consistent traffic. For
alerting wire a Cloud Monitoring uptime check on the same URL with a
notification channel (email or PagerDuty).

---

## 8. Common procedures

### Bump a single secret

```bash
echo -n "<new-value>" | gcloud secrets versions add <secret-name> \
  --data-file=- --project=praxisbytacitus
# Cloud Run picks up the new version on next revision deploy.
gcloud run services update praxis-frontend --region=us-central1 \
  --update-secrets=<ENV_VAR>=<secret-name>:latest --project=praxisbytacitus
```

### Add a custom domain

```bash
gcloud run domain-mappings create --service=praxis-frontend \
  --domain=<your-domain> --region=us-central1 --project=praxisbytacitus
```

### Re-seed the 11 domain documents in Firestore

```bash
npx tsx scripts/seed-domains.ts
```

(idempotent — safe to re-run after schema bumps).

---

## 9. Useful admin URLs

- Cloud Run console: https://console.cloud.google.com/run?project=praxisbytacitus
- Cloud Build console: https://console.cloud.google.com/cloud-build?project=praxisbytacitus
- Secret Manager: https://console.cloud.google.com/security/secret-manager?project=praxisbytacitus
- Firestore: https://console.firebase.google.com/project/praxisbytacitus/firestore
- Firebase Auth: https://console.firebase.google.com/project/praxisbytacitus/authentication/users
- Vertex AI Agents: https://console.cloud.google.com/vertex-ai/reasoning-engines?project=praxisbytacitus
- BigQuery (analytics): https://console.cloud.google.com/bigquery?project=praxisbytacitus&d=praxis_analytics

---

## 10. When to ask a human (you, Giulio)

The following steps cannot be automated by an agent:

- Stripe product / price ID creation (vendor UI)
- Vertex AI Reasoning Engine first-time deploy (per project, requires a
  one-time IAM consent)
- Domain DNS records (Squarespace / Cloudflare / etc.)
- Firebase Auth provider toggles (Console UI)
- Optional vendor signups (vendor UI) only after a scoped product decision
- ACLED key request (vendor approves manually)

For everything else, an agent (Codex or Claude Code) should be able to
self-serve from the validation + deploy commands above.

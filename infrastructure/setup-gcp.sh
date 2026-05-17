#!/bin/bash
# PRAXIS — One-time GCP project setup
# Run once per project. Idempotent (safe to re-run).
set -e

PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER="852128226674"
REGION="us-central1"
if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi
echo "Setting up PRAXIS on GCP project: $PROJECT_ID"

# ── Enable APIs ──────────────────────────────────────────────────────────────
echo "Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  bigquery.googleapis.com \
  pubsub.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudscheduler.googleapis.com \
  sqladmin.googleapis.com \
  servicenetworking.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  firebase.googleapis.com \
  identitytoolkit.googleapis.com \
  eventarc.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com

# ── Artifact Registry ────────────────────────────────────────────────────────
echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create praxis \
  --repository-format=docker \
  --location=us-central1 \
  --description="PRAXIS Docker images" \
  2>/dev/null || echo "Repository already exists"

# ── BigQuery ─────────────────────────────────────────────────────────────────
echo "Creating BigQuery dataset..."
bq mk --dataset "${PROJECT_ID}:praxis_analytics" 2>/dev/null || echo "Dataset already exists"

bq mk --table "${PROJECT_ID}:praxis_analytics.pipeline_runs" \
  "run_id:STRING,user_id:STRING,situation_id:STRING,nodes:INTEGER,edges:INTEGER,duration_ms:INTEGER,status:STRING,timestamp:TIMESTAMP" \
  2>/dev/null || echo "Table pipeline_runs already exists"

bq mk --table "${PROJECT_ID}:praxis_analytics.extractions" \
  "extraction_id:STRING,user_id:STRING,situation_id:STRING,source_type:STRING,source_file:STRING,nodes:INTEGER,edges:INTEGER,input_tokens:INTEGER,output_tokens:INTEGER,duration_ms:INTEGER,timestamp:TIMESTAMP" \
  2>/dev/null || echo "Table extractions already exists"

# ── Pub/Sub Topics ───────────────────────────────────────────────────────────
echo "Creating Pub/Sub topics..."
# Pub/Sub topics with in-repo publishers/subscribers.
# - profile.events: profile lifecycle + embedding refresh subscriber
# - praxis.events: application event fan-out; Cloud Tasks remains run dispatch
for topic in profile.events praxis.events; do
  gcloud pubsub topics create "$topic" --project="$PROJECT_ID" 2>/dev/null || true
done

# ── LangGraph Cloud SQL checkpoint store ─────────────────────────────────────
if [ -f "infrastructure/setup-langgraph-cloudsql.sh" ]; then
  echo "Ensuring LangGraph Cloud SQL checkpoint store..."
  PROJECT_ID="${PROJECT_ID}" bash infrastructure/setup-langgraph-cloudsql.sh
fi

# ── Cloud Storage ────────────────────────────────────────────────────────────
echo "Creating Cloud Storage bucket..."
gsutil mb -l us-central1 "gs://${PROJECT_ID}-praxis-uploads" 2>/dev/null || echo "Bucket already exists"
gsutil uniformbucketlevelaccess set on "gs://${PROJECT_ID}-praxis-uploads"

# ── Cloud Scheduler ──────────────────────────────────────────────────────────
echo "Creating Cloud Scheduler jobs..."
BACKEND_SA="${PROJECT_ID}@appspot.gserviceaccount.com"
# Resolve the real backend URL dynamically (Cloud Run URL includes a hash suffix)
BACKEND_URL=$(gcloud run services describe praxis-backend --region="${REGION}" --format="value(status.url)" 2>/dev/null || echo "")
FRONTEND_URL=$(gcloud run services describe praxis-frontend --region="${REGION}" --format="value(status.url)" 2>/dev/null || echo "")

# NOTE: gdelt-poller is now a Cloud Run Worker Pool (continuous, no Scheduler job needed).
# If a legacy Cloud Scheduler job named gdelt-poller exists, delete it:
#   gcloud scheduler jobs delete gdelt-poller --location=us-central1

# Resolve CRON_SECRET for scheduler jobs
CRON_SECRET=$(gcloud secrets versions access latest --secret=praxis-cron-secret --project="${PROJECT_ID}" 2>/dev/null || echo "changeme")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# ── Cloud Scheduler: Daily Alert Check (06:00 UTC) ──────────────────────
echo "Creating Cloud Scheduler job: praxis-check-alerts..."
gcloud scheduler jobs create http praxis-check-alerts \
  --location="${REGION}" \
  --schedule="0 6 * * *" \
  --uri="${FRONTEND_URL}/api/cron/check-alerts" \
  --http-method=GET \
  --headers="Authorization=Bearer ${CRON_SECRET}" \
  --oidc-service-account-email="${COMPUTE_SA}" \
  --oidc-token-audience="${FRONTEND_URL}" \
  --description="Daily conflict alert check at 06:00 UTC" \
  --quiet 2>/dev/null || \
gcloud scheduler jobs update http praxis-check-alerts \
  --location="${REGION}" \
  --schedule="0 6 * * *" \
  --uri="${FRONTEND_URL}/api/cron/check-alerts" \
  --http-method=GET \
  --headers="Authorization=Bearer ${CRON_SECRET}" \
  --oidc-service-account-email="${COMPUTE_SA}" \
  --quiet

# ── Cloud Scheduler: Daily Briefing Generation (05:00 UTC) ───────────────
echo "Creating Cloud Scheduler job: praxis-generate-briefing..."
gcloud scheduler jobs create http praxis-generate-briefing \
  --location="${REGION}" \
  --schedule="0 5 * * *" \
  --uri="${FRONTEND_URL}/api/cron/generate-briefing" \
  --http-method=GET \
  --headers="Authorization=Bearer ${CRON_SECRET}" \
  --oidc-service-account-email="${COMPUTE_SA}" \
  --oidc-token-audience="${FRONTEND_URL}" \
  --description="Daily intelligence briefing generation at 05:00 UTC" \
  --quiet 2>/dev/null || \
gcloud scheduler jobs update http praxis-generate-briefing \
  --location="${REGION}" \
  --schedule="0 5 * * *" \
  --uri="${FRONTEND_URL}/api/cron/generate-briefing" \
  --http-method=GET \
  --headers="Authorization=Bearer ${CRON_SECRET}" \
  --oidc-service-account-email="${COMPUTE_SA}" \
  --quiet

# ── Secret Manager — create placeholder secrets ───────────────────────────────
# cloudbuild.yaml references these secrets. Create them now (you'll fill in values next).
echo "Creating Secret Manager secrets (placeholders — you must fill these in)..."

for secret in \
  praxis-firebase-sa \
  praxis-google-ai-key \
  praxis-cron-secret \
  praxis-cookie-secret \
  praxis-cognee-db-password \
  praxis-cognee-llm-api-key \
  praxis-cognee-encryption-key \
  praxis-pubsub-push-secret; do
  gcloud secrets create "$secret" --replication-policy=automatic 2>/dev/null \
    || echo "Secret $secret already exists"
done

if ! gcloud secrets versions access latest --secret=praxis-cognee-llm-api-key --project="${PROJECT_ID}" >/dev/null 2>&1; then
  printf 'vertex-adc' | gcloud secrets versions add praxis-cognee-llm-api-key --data-file=-
fi

echo ""
echo "  ⚠️  Fill in the secrets now:"
echo "  printf 'YOUR_JSON_HERE' | gcloud secrets versions add praxis-firebase-sa --data-file=-"
echo "  printf 'AIzaSy...' | gcloud secrets versions add praxis-google-ai-key --data-file=-"
echo "  printf 'my-cron-secret' | gcloud secrets versions add praxis-cron-secret --data-file=-"
echo "  printf 'my-cookie-secret-32chars' | gcloud secrets versions add praxis-cookie-secret --data-file=-"
echo "  openssl rand -base64 24 | gcloud secrets versions add praxis-cognee-db-password --data-file=-"
echo "  printf 'vertex-adc' | gcloud secrets versions add praxis-cognee-llm-api-key --data-file=-"
echo "  openssl rand -base64 32 | gcloud secrets versions add praxis-cognee-encryption-key --data-file=-"
echo "  openssl rand -base64 32 | gcloud secrets versions add praxis-pubsub-push-secret --data-file=-"
echo ""

# ── IAM Permissions ──────────────────────────────────────────────────────────
echo "Setting IAM permissions..."

# Cloud Build service account (needed to pull secrets during build)
CB_SA="${PROJECT_ID}@cloudbuild.gserviceaccount.com"
# App Engine / default service account (used by Cloud Run services)
SA="${PROJECT_ID}@appspot.gserviceaccount.com"

# Grant Cloud Build SA access to secrets
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet 2>/dev/null || true

for role in \
  roles/aiplatform.user \
  roles/bigquery.dataEditor \
  roles/datastore.user \
  roles/pubsub.subscriber \
  roles/pubsub.publisher \
  roles/storage.objectAdmin \
  roles/secretmanager.secretAccessor \
  roles/iam.serviceAccountTokenCreator \
  roles/cloudfunctions.invoker \
  roles/eventarc.eventReceiver \
  roles/run.invoker \
  roles/logging.logWriter \
  roles/monitoring.metricWriter; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA}" \
    --role="$role" \
    --quiet 2>/dev/null || true
done

# Cloud Run service account also needs Secret Manager access
CR_SA="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CR_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet 2>/dev/null || true

# ── Cognee memory service account, buckets, and IAM ─────────────────────────
COGNEE_SA="praxis-cognee-sa@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud iam service-accounts create praxis-cognee-sa \
  --display-name="PRAXIS Cognee Memory Service" \
  --project="${PROJECT_ID}" \
  --quiet 2>/dev/null || echo "Cognee service account already exists"

for role in \
  roles/aiplatform.user \
  roles/cloudsql.client \
  roles/logging.logWriter \
  roles/monitoring.metricWriter; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${COGNEE_SA}" \
    --role="$role" \
    --quiet 2>/dev/null || true
done

for secret in praxis-cognee-db-password praxis-cognee-llm-api-key praxis-cognee-encryption-key praxis-neo4j-password; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:${COGNEE_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="${PROJECT_ID}" \
    --quiet 2>/dev/null || true
done

for bucket in praxis-cognee-graph praxis-cognee-graph-backups; do
  gsutil mb -p "${PROJECT_ID}" -l "${REGION}" -b on "gs://${bucket}" 2>/dev/null || echo "Bucket ${bucket} already exists"
  gsutil uniformbucketlevelaccess set on "gs://${bucket}" >/dev/null 2>&1 || true
  gsutil iam ch "serviceAccount:${COGNEE_SA}:objectAdmin" "gs://${bucket}" >/dev/null 2>&1 || true
done

# ── Vendor shared spine helper into each function source dir ────────────────
# The _shared package gives functions/workers a uniform job/event API. Cloud
# Functions deploys only the source dir, so we copy it in before each deploy.
if [ -d "cloud_functions/_shared" ]; then
  for target in cloud_functions/gdelt_poller cloud_functions/on_situation_created cloud_functions/on_document_uploaded; do
    rm -rf "${target}/_shared"
    cp -r cloud_functions/_shared "${target}/_shared"
    echo "  Vendored _shared into ${target}"
  done
fi

# ── Deploy Cloud Functions ───────────────────────────────────────────────────
echo "Deploying Cloud Functions..."
# Resolve the actual backend URL (Cloud Run uses a hash suffix, not project name)
CF_BACKEND_URL=$(gcloud run services describe praxis-backend --region="${REGION}" --format="value(status.url)" 2>/dev/null || echo "")
if [ -z "${CF_BACKEND_URL}" ]; then
  echo "⚠️  praxis-backend not deployed — deploy backend first, then re-run"
else
  echo "  Backend URL: ${CF_BACKEND_URL}"

  # Grant Firestore service account Eventarc permissions (required for nam5 triggers)
  FIRESTORE_SA="service-${PROJECT_NUMBER}@gcp-sa-firestore.iam.gserviceaccount.com"
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${FIRESTORE_SA}" \
    --role="roles/eventarc.eventReceiver" \
    --quiet 2>/dev/null || true

  # on_situation_created — Firestore trigger (nam5 multi-region)
  if [ -d "cloud_functions/on_situation_created" ]; then
    gcloud functions deploy on-situation-created \
      --gen2 \
      --runtime=python311 \
      --region="${REGION}" \
      --source=cloud_functions/on_situation_created \
      --entry-point=on_situation_created \
      --trigger-event-filters="type=google.cloud.firestore.document.v1.created" \
      --trigger-event-filters="database=(default)" \
      --trigger-event-filters-path-pattern="document=users/{uid}/situations/{sitId}" \
      --trigger-location=nam5 \
      --trigger-service-account="${SA}" \
      --set-env-vars="PRAXIS_BACKEND_URL=${CF_BACKEND_URL}" \
      --service-account="${SA}" \
      --memory=256Mi \
      --timeout=300s \
      --quiet 2>/dev/null && echo "  ✓ on-situation-created deployed" || echo "  ⚠️  on-situation-created deploy failed"

    # Cloud Functions v2 = Cloud Run service of the same name. The Eventarc
    # trigger calls the underlying Cloud Run service via OIDC. The trigger SA
    # MUST have roles/run.invoker on that specific Cloud Run service or the
    # request returns 403 ("not authenticated"). Project-level run.invoker is
    # not always sufficient for Eventarc-triggered Gen2 functions.
    gcloud run services add-iam-policy-binding on-situation-created \
      --region="${REGION}" \
      --member="serviceAccount:${SA}" \
      --role="roles/run.invoker" \
      --project="${PROJECT_ID}" \
      --quiet 2>/dev/null || echo "  ⚠️  could not grant run.invoker on on-situation-created"
  fi

  # on_document_uploaded — Firestore trigger (nam5 multi-region)
  if [ -d "cloud_functions/on_document_uploaded" ]; then
    gcloud functions deploy on-document-uploaded \
      --gen2 \
      --runtime=python311 \
      --region="${REGION}" \
      --source=cloud_functions/on_document_uploaded \
      --entry-point=on_document_uploaded \
      --trigger-event-filters="type=google.cloud.firestore.document.v1.created" \
      --trigger-event-filters="database=(default)" \
      --trigger-event-filters-path-pattern="document=users/{uid}/situations/{sitId}/documents/{docId}" \
      --trigger-location=nam5 \
      --set-env-vars="PRAXIS_BACKEND_URL=${CF_BACKEND_URL}" \
      --service-account="${SA}" \
      --memory=256Mi \
      --timeout=300s \
      --quiet 2>/dev/null && echo "  ✓ on-document-uploaded deployed" || echo "  ⚠️  on-document-uploaded deploy failed"
  fi

fi

# ── Cloud Run Worker Pool: GDELT poller ──────────────────────────────────
echo "Deploying gdelt-poller worker pool..."
BACKEND_URL=$(gcloud run services describe praxis-backend --region="${REGION}" --format="value(status.url)" 2>/dev/null || echo "")
gcloud beta run worker-pools deploy gdelt-poller \
  --image="us-central1-docker.pkg.dev/${PROJECT_ID}/praxis/gdelt-poller" \
  --region="${REGION}" \
  --min-instances=1 \
  --max-instances=1 \
  --cpu=1 \
  --memory=512Mi \
  --no-cpu-throttling \
  --set-env-vars="PRAXIS_BACKEND_URL=${BACKEND_URL},POLL_INTERVAL_SECONDS=900" \
  --service-account="${COMPUTE_SA}" \
  2>/dev/null || echo "Worker pool create failed — you may need: gcloud config set run/launch-stage BETA"

echo ""

# ── Grant frontend SA invoke permission on the backend ───────────────────────
# The backend is --no-allow-unauthenticated; only the frontend service account
# (Compute default SA) is allowed to call it via OIDC token.
FRONTEND_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud run services add-iam-policy-binding praxis-backend \
  --region="${REGION}" \
  --member="serviceAccount:${FRONTEND_SA}" \
  --role="roles/run.invoker" \
  --project="${PROJECT_ID}" \
  2>/dev/null || true

# ═══════════════════════════════════════════════════════════════
# v3.0 ADDITIONS — Run this section after initial setup
# ═══════════════════════════════════════════════════════════════

# ── Firestore Vector Indexes ─────────────────────────────────
echo "Creating Firestore vector indexes (768-dim, gemini-embedding-2)..."

gcloud firestore indexes composite create \
  --collection-group=embeddings \
  --query-scope=COLLECTION \
  --field-config=field-path=embedding,vector-config='{"dimension":"768","flat":"{}"}' \
  --field-config=field-path=situationId,order=ASCENDING \
  --database="(default)" 2>/dev/null || echo "  embeddings index already exists"

gcloud firestore indexes composite create \
  --collection-group=tool-embeddings \
  --query-scope=COLLECTION \
  --field-config=field-path=embedding,vector-config='{"dimension":"768","flat":"{}"}' \
  --field-config=field-path=situationId,order=ASCENDING \
  --database="(default)" 2>/dev/null || echo "  tool-embeddings index already exists"

gcloud firestore indexes composite create \
  --collection-group=feed-embeddings \
  --query-scope=COLLECTION \
  --field-config=field-path=embedding,vector-config='{"dimension":"768","flat":"{}"}' \
  --field-config=field-path=situationId,order=ASCENDING \
  --database="(default)" 2>/dev/null || echo "  feed-embeddings index already exists"

# ── Firestore Graph Indexes ──────────────────────────────────
echo "Creating Firestore graph query indexes..."

gcloud firestore indexes composite create \
  --collection-group=edges \
  --query-scope=COLLECTION \
  --field-config=field-path=source,order=ASCENDING \
  --field-config=field-path=type,order=ASCENDING \
  --database="(default)" 2>/dev/null || echo "  edges(source,type) index already exists"

gcloud firestore indexes composite create \
  --collection-group=edges \
  --query-scope=COLLECTION \
  --field-config=field-path=target,order=ASCENDING \
  --field-config=field-path=type,order=ASCENDING \
  --database="(default)" 2>/dev/null || echo "  edges(target,type) index already exists"

gcloud firestore indexes composite create \
  --collection-group=nodes \
  --query-scope=COLLECTION \
  --field-config=field-path=type,order=ASCENDING \
  --field-config=field-path=confidence,order=ASCENDING \
  --database="(default)" 2>/dev/null || echo "  nodes(type,confidence) index already exists"

# ── Cloud Tasks Queues ───────────────────────────────────────
echo "Creating Cloud Tasks queues..."

gcloud tasks queues create praxis-research \
  --location=us-central1 \
  --max-concurrent-dispatches=10 \
  --max-dispatches-per-second=5 \
  --max-attempts=5 \
  --min-backoff=30s \
  --max-backoff=300s \
  2>/dev/null || echo "  praxis-research queue already exists"

gcloud tasks queues create praxis-agents \
  --location=us-central1 \
  --max-concurrent-dispatches=5 \
  --max-dispatches-per-second=2 \
  --max-attempts=3 \
  2>/dev/null || echo "  praxis-agents queue already exists"

gcloud tasks queues create praxis-embeddings \
  --location=us-central1 \
  --max-concurrent-dispatches=20 \
  --max-dispatches-per-second=10 \
  2>/dev/null || echo "  praxis-embeddings queue already exists"

# ── BigQuery Extended Tables ─────────────────────────────────
echo "Creating extended BigQuery analytics tables..."

bq mk --table "${PROJECT_ID}:praxis_analytics.tool_usage" \
  "user_id:STRING,situation_id:STRING,tool_id:STRING,action:STRING,credits_used:INTEGER,response_time_ms:INTEGER,model:STRING,tokens_in:INTEGER,tokens_out:INTEGER,timestamp:TIMESTAMP" \
  2>/dev/null || echo "  tool_usage table already exists"

bq mk --table "${PROJECT_ID}:praxis_analytics.feed_queries" \
  "feed:STRING,country:STRING,query_hash:STRING,result_count:INTEGER,latency_ms:INTEGER,cached:BOOLEAN,error:STRING,timestamp:TIMESTAMP" \
  2>/dev/null || echo "  feed_queries table already exists"

bq mk --table "${PROJECT_ID}:praxis_analytics.agent_runs" \
  "agent_type:STRING,user_id:STRING,situation_id:STRING,status:STRING,sources_queried:INTEGER,findings:INTEGER,tokens_used:INTEGER,duration_ms:INTEGER,tools_updated:STRING,timestamp:TIMESTAMP" \
  2>/dev/null || echo "  agent_runs table already exists"

bq mk --table "${PROJECT_ID}:praxis_analytics.skc_queries" \
  "user_id:STRING,situation_id:STRING,tool_id:STRING,graph_nodes:INTEGER,vector_results:INTEGER,feed_sources:INTEGER,related_tools:INTEGER,total_context_tokens:INTEGER,latency_ms:INTEGER,timestamp:TIMESTAMP" \
  2>/dev/null || echo "  skc_queries table already exists"

bq mk --table "${PROJECT_ID}:praxis_analytics.embedding_operations" \
  "user_id:STRING,situation_id:STRING,operation:STRING,chunk_count:INTEGER,model:STRING,latency_ms:INTEGER,timestamp:TIMESTAMP" \
  2>/dev/null || echo "  embedding_operations table already exists"

# ── Enable Cloud Tasks API ───────────────────────────────────
gcloud services enable cloudtasks.googleapis.com 2>/dev/null || true

echo ""
echo "✓ v3.0 extensions complete:"
echo "  - 3 Firestore vector indexes (768-dim embeddings)"
echo "  - 3 Firestore graph query indexes"
echo "  - 3 Cloud Tasks queues (research, agents, embeddings)"
echo "  - 5 BigQuery analytics tables"

# ── Observability: BigQuery sink for API call logs ────────────────────────
echo "Setting up API call log sink to BigQuery..."

# Create api_calls table (praxis_analytics dataset is already created above)
bq mk --table "${PROJECT_ID}:praxis_analytics.api_calls" \
  "timestamp:TIMESTAMP,route:STRING,uid:STRING,situation_id:STRING,tool_name:STRING,latency_ms:INTEGER,credits_deducted:INTEGER,status:INTEGER,error:STRING,provider_fallback:BOOLEAN,trace_id:STRING" \
  2>/dev/null || echo "  Table api_calls already exists"

# Create Cloud Logging sink → BigQuery
gcloud logging sinks create praxis-api-calls-sink \
  "bigquery.googleapis.com/projects/${PROJECT_ID}/datasets/praxis_analytics" \
  --log-filter='resource.type="cloud_run_revision"
    AND resource.labels.service_name=("praxis-frontend" OR "praxis-backend")
    AND jsonPayload.message="api_call"' \
  --project="${PROJECT_ID}" \
  2>/dev/null || echo "  Sink praxis-api-calls-sink already exists"

# Grant the sink's writer service account BigQuery dataEditor on the dataset
SINK_SA=$(gcloud logging sinks describe praxis-api-calls-sink --project="${PROJECT_ID}" --format="value(writerIdentity)" 2>/dev/null || echo "")
if [ -n "$SINK_SA" ]; then
  bq add-iam-policy-binding \
    --member="${SINK_SA}" \
    --role="roles/bigquery.dataEditor" \
    "${PROJECT_ID}:praxis_analytics" \
    2>/dev/null || true
  echo "  Granted ${SINK_SA} bigquery.dataEditor on praxis_analytics"
fi

echo "✓ GCP setup complete for project: $PROJECT_ID"
echo ""
echo "  NEXT STEPS:"
echo "  1. Fill in the Secret Manager secrets (see prompts above)"
echo "  2. Run: gcloud builds submit --config=cloudbuild.yaml"
echo "  3. Or:  bash infrastructure/deploy.sh"
echo "  4. After backend deploys, re-run this script to update Cloud Function env vars"

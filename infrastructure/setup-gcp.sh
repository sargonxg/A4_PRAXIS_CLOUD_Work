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
for topic in praxis.pipeline praxis.extract praxis.ingest praxis.alert; do
  gcloud pubsub topics create "$topic" 2>/dev/null || echo "Topic $topic already exists"
done

# ── Cloud Storage ────────────────────────────────────────────────────────────
echo "Creating Cloud Storage bucket..."
gsutil mb -l us-central1 "gs://${PROJECT_ID}-praxis-uploads" 2>/dev/null || echo "Bucket already exists"
gsutil uniformbucketlevelaccess set on "gs://${PROJECT_ID}-praxis-uploads"

# ── Cloud Scheduler ──────────────────────────────────────────────────────────
echo "Creating Cloud Scheduler jobs..."
BACKEND_SA="${PROJECT_ID}@appspot.gserviceaccount.com"
BACKEND_URL="https://praxis-backend-${PROJECT_ID}-uc.a.run.app"

GDELT_FUNCTION_URL=$(gcloud functions describe gdelt-poller --region="${REGION}" --format="value(url)" 2>/dev/null || echo "")
if [ -n "$GDELT_FUNCTION_URL" ]; then
  gcloud scheduler jobs create http gdelt-poller \
    --schedule="*/15 * * * *" \
    --uri="${GDELT_FUNCTION_URL}" \
    --http-method=POST \
    --oidc-service-account-email="${BACKEND_SA}" \
    --oidc-token-audience="${GDELT_FUNCTION_URL}" \
    --location=us-central1 \
    2>/dev/null || echo "Scheduler job gdelt-poller already exists"
else
  echo "⚠️  gdelt-poller Cloud Function not deployed yet — deploy it first, then re-run to create scheduler"
fi

# ── Cloud Scheduler: Daily Alert Check (06:00 UTC) ──────────────────────
echo "Creating Cloud Scheduler job: praxis-check-alerts..."
gcloud scheduler jobs create http praxis-check-alerts \
  --location="${REGION}" \
  --schedule="0 6 * * *" \
  --uri="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app/api/cron/check-alerts" \
  --http-method=GET \
  --headers="Authorization=Bearer ${CRON_SECRET:-changeme}" \
  --oidc-service-account-email="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --oidc-token-audience="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app" \
  --description="Daily conflict alert check" \
  --quiet 2>/dev/null || \
gcloud scheduler jobs update http praxis-check-alerts \
  --location="${REGION}" \
  --schedule="0 6 * * *" \
  --uri="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app/api/cron/check-alerts" \
  --http-method=GET \
  --oidc-service-account-email="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --quiet

# ── Cloud Scheduler: Daily Briefing Generation (05:00 UTC) ───────────────
echo "Creating Cloud Scheduler job: praxis-generate-briefing..."
gcloud scheduler jobs create http praxis-generate-briefing \
  --location="${REGION}" \
  --schedule="0 5 * * *" \
  --uri="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app/api/cron/generate-briefing" \
  --http-method=GET \
  --headers="Authorization=Bearer ${CRON_SECRET:-changeme}" \
  --oidc-service-account-email="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --oidc-token-audience="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app" \
  --description="Daily intelligence briefing generation" \
  --quiet 2>/dev/null || \
gcloud scheduler jobs update http praxis-generate-briefing \
  --location="${REGION}" \
  --schedule="0 5 * * *" \
  --uri="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app/api/cron/generate-briefing" \
  --http-method=GET \
  --oidc-service-account-email="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --quiet

# ── Secret Manager — create placeholder secrets ───────────────────────────────
# cloudbuild.yaml references these secrets. Create them now (you'll fill in values next).
echo "Creating Secret Manager secrets (placeholders — you must fill these in)..."

for secret in \
  praxis-firebase-sa \
  praxis-google-ai-key \
  praxis-cron-secret \
  praxis-cookie-secret; do
  gcloud secrets create "$secret" --replication-policy=automatic 2>/dev/null \
    || echo "Secret $secret already exists"
done

echo ""
echo "  ⚠️  Fill in the secrets now:"
echo "  printf 'YOUR_JSON_HERE' | gcloud secrets versions add praxis-firebase-sa --data-file=-"
echo "  printf 'AIzaSy...' | gcloud secrets versions add praxis-google-ai-key --data-file=-"
echo "  printf 'my-cron-secret' | gcloud secrets versions add praxis-cron-secret --data-file=-"
echo "  printf 'my-cookie-secret-32chars' | gcloud secrets versions add praxis-cookie-secret --data-file=-"
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

# ── Deploy Cloud Functions ───────────────────────────────────────────────────
echo "Deploying Cloud Functions..."
BACKEND_URL="https://praxis-backend-$(gcloud run services describe praxis-backend --region=$REGION --format='value(status.url)' 2>/dev/null | sed 's|https://||' || echo 'NOT_DEPLOYED_YET')"

# on_situation_created — Firestore trigger
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
    --set-env-vars="PRAXIS_BACKEND_URL=${BACKEND_URL}" \
    --memory=256Mi \
    --timeout=300s \
    --quiet 2>/dev/null || echo "⚠️  on-situation-created deploy skipped (deploy backend first)"
fi

# on_document_uploaded — Firestore trigger
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
    --set-env-vars="PRAXIS_BACKEND_URL=${BACKEND_URL}" \
    --memory=256Mi \
    --timeout=300s \
    --quiet 2>/dev/null || echo "⚠️  on-document-uploaded deploy skipped (deploy backend first)"
fi

# gdelt_poller — HTTP trigger (called by Cloud Scheduler)
if [ -d "cloud_functions/gdelt_poller" ]; then
  gcloud functions deploy gdelt-poller \
    --gen2 \
    --runtime=python311 \
    --region="${REGION}" \
    --source=cloud_functions/gdelt_poller \
    --entry-point=gdelt_poller \
    --trigger-http \
    --no-allow-unauthenticated \
    --set-env-vars="PRAXIS_BACKEND_URL=${BACKEND_URL}" \
    --memory=512Mi \
    --timeout=540s \
    --quiet 2>/dev/null || echo "⚠️  gdelt-poller deploy skipped (deploy backend first)"
fi

echo ""

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

echo "✓ GCP setup complete for project: $PROJECT_ID"
echo ""
echo "  NEXT STEPS:"
echo "  1. Fill in the Secret Manager secrets (see prompts above)"
echo "  2. Run: gcloud builds submit --config=cloudbuild.yaml"
echo "  3. Or:  bash infrastructure/deploy.sh"
echo "  4. After backend deploys, re-run this script to update Cloud Function env vars"

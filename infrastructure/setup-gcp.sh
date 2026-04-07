#!/bin/bash
# PRAXIS — One-time GCP project setup
# Run once per project. Idempotent (safe to re-run).
set -e

PROJECT_ID=$(gcloud config get-value project)
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
  storage.googleapis.com

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
  2>/dev/null || echo "Table already exists"

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

gcloud scheduler jobs create http gdelt-poller \
  --schedule="*/15 * * * *" \
  --uri="${BACKEND_URL}/api/v1/feeds/gdelt-poll" \
  --http-method=POST \
  --oidc-service-account-email="${BACKEND_SA}" \
  --location=us-central1 \
  2>/dev/null || echo "Scheduler job gdelt-poller already exists"

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
  roles/storage.objectAdmin \
  roles/secretmanager.secretAccessor \
  roles/iam.serviceAccountTokenCreator; do
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

echo ""
echo "✓ GCP setup complete for project: $PROJECT_ID"
echo ""
echo "  NEXT STEPS:"
echo "  1. Fill in the Secret Manager secrets (see prompts above)"
echo "  2. Run: gcloud builds submit --config=cloudbuild.yaml"
echo "  3. Or:  bash infrastructure/deploy.sh"

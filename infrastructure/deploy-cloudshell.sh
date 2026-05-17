#!/bin/bash
# PRAXIS — Deploy from Cloud Shell (builds locally, no Cloud Build IAM issues)
# Run this directly in Google Cloud Shell.
set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
REPO="us-central1-docker.pkg.dev/${PROJECT_ID}/praxis"

if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: No GCP project set."
  exit 1
fi

echo "========================================="
echo " PRAXIS Cloud Shell Deploy"
echo " Project: $PROJECT_ID"
echo "========================================="
echo ""

# ── Ensure Artifact Registry repo exists ────────────────────────────────────
echo "[1/8] Ensuring Artifact Registry repo exists..."
gcloud artifacts repositories create praxis \
  --repository-format=docker \
  --location="${REGION}" \
  --description="PRAXIS Docker images" 2>/dev/null || true

# ── Configure docker auth ────────────────────────────────────────────────────
echo "[2/8] Configuring Docker auth for Artifact Registry..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# ── Build + push backend ─────────────────────────────────────────────────────
BACKEND_IMAGE="${REPO}/praxis-backend:latest"
echo "[3/8] Building backend image (this takes ~3 min)..."
docker build -t "${BACKEND_IMAGE}" ./backend

echo "[4/8] Pushing backend image..."
docker push "${BACKEND_IMAGE}"

# ── Deploy backend to Cloud Run ──────────────────────────────────────────────
echo "[5/8] Deploying backend to Cloud Run..."
gcloud run deploy praxis-backend \
  --image "${BACKEND_IMAGE}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},GCP_REGION=${REGION}" \
  --set-secrets "FIREBASE_SERVICE_ACCOUNT_KEY=praxis-firebase-sa:latest,GOOGLE_AI_API_KEY=praxis-google-ai-key:latest"

# ── Get backend URL ──────────────────────────────────────────────────────────
BACKEND_URL=$(gcloud run services describe praxis-backend \
  --region="${REGION}" \
  --format='value(status.url)')
echo ""
echo "  Backend URL: ${BACKEND_URL}"
echo ""

# ── Build + push frontend ────────────────────────────────────────────────────
FRONTEND_IMAGE="${REPO}/praxis-frontend:latest"
echo "[6/8] Building frontend image (this takes ~5 min)..."
docker build \
  --build-arg "NEXT_PUBLIC_PRAXIS_BACKEND_URL=${BACKEND_URL}" \
  -t "${FRONTEND_IMAGE}" \
  .

echo "[7/8] Pushing frontend image..."
docker push "${FRONTEND_IMAGE}"

# ── Deploy frontend to Cloud Run ─────────────────────────────────────────────
echo "[8/8] Deploying frontend to Cloud Run..."
gcloud run deploy praxis-frontend \
  --image "${FRONTEND_IMAGE}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --set-secrets "FIREBASE_SERVICE_ACCOUNT_KEY=praxis-firebase-sa:latest,GOOGLE_AI_API_KEY=praxis-google-ai-key:latest,CRON_SECRET=praxis-cron-secret:latest,COOKIE_SIGNING_SECRET=praxis-cookie-secret:latest"

# ── Done ─────────────────────────────────────────────────────────────────────
FRONTEND_URL=$(gcloud run services describe praxis-frontend \
  --region="${REGION}" \
  --format='value(status.url)')

echo ""
echo "========================================="
echo " PRAXIS deployed successfully!"
echo "========================================="
echo ""
echo "  Frontend:       ${FRONTEND_URL}"
echo "  Backend:        ${BACKEND_URL}"
echo "  Backend health: ${BACKEND_URL}/health"
echo ""
echo "  Test: curl ${BACKEND_URL}/health"

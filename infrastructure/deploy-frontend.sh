#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="praxisbytacitus"
REGION="us-central1"
REPO="us-central1-docker.pkg.dev/${PROJECT_ID}/praxis"
SERVICE="praxis-frontend"

# Get backend URL
BACKEND_URL=$(gcloud run services describe praxis-backend \
  --region="${REGION}" --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "$BACKEND_URL" ]; then
  echo "WARNING: Backend not deployed yet. Deploy backend first."
  echo "Using placeholder URL — frontend won't connect to backend."
  BACKEND_URL="https://praxis-backend-placeholder.run.app"
fi

echo "Building frontend with BACKEND_URL=${BACKEND_URL}..."
docker build \
  --build-arg NEXT_PUBLIC_PRAXIS_BACKEND_URL="${BACKEND_URL}" \
  -t "${REPO}/${SERVICE}:latest" .

echo "Pushing to Artifact Registry..."
docker push "${REPO}/${SERVICE}:latest"

echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE}" \
  --image="${REPO}/${SERVICE}:latest" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10 \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT_KEY=firebase-sa-key:latest,GOOGLE_AI_API_KEY=google-ai-api-key:latest,CRON_SECRET=cron-secret:latest,COOKIE_SIGNING_SECRET=cookie-signing-secret:latest"

FRONTEND_URL=$(gcloud run services describe "${SERVICE}" --region="${REGION}" --format='value(status.url)')
echo ""
echo "Frontend deployed: ${FRONTEND_URL}"

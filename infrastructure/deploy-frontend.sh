#!/bin/bash
# Deploy only the Next.js frontend to Cloud Run
set -e

PROJECT_ID=$(gcloud config get-value project)
BACKEND_URL=${NEXT_PUBLIC_PRAXIS_BACKEND_URL:-"https://praxis-backend-${PROJECT_ID}-uc.a.run.app"}

echo "Deploying PRAXIS frontend to GCP project: $PROJECT_ID"
echo "Backend URL: $BACKEND_URL"

cd "$(dirname "$0")/.."

docker build \
  --build-arg NEXT_PUBLIC_PRAXIS_BACKEND_URL="$BACKEND_URL" \
  -t "gcr.io/${PROJECT_ID}/praxis-frontend" \
  .

docker push "gcr.io/${PROJECT_ID}/praxis-frontend"

gcloud run deploy praxis-frontend \
  --image "gcr.io/${PROJECT_ID}/praxis-frontend" \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

FRONTEND_URL=$(gcloud run services describe praxis-frontend --region=us-central1 --format='value(status.url)')
echo "Frontend deployed: $FRONTEND_URL"

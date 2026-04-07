#!/bin/bash
# PRAXIS — One-command deployment via Cloud Build
set -e

PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Deploying PRAXIS to GCP project: $PROJECT_ID"
echo "This will build and deploy both frontend and backend to Cloud Run."
echo ""

gcloud builds submit --config=cloudbuild.yaml

echo ""
echo "✓ Deployment complete!"
echo ""
FRONTEND_URL=$(gcloud run services describe praxis-frontend --region=us-central1 --format='value(status.url)' 2>/dev/null || echo "not deployed")
BACKEND_URL=$(gcloud run services describe praxis-backend --region=us-central1 --format='value(status.url)' 2>/dev/null || echo "not deployed")

echo "  Frontend: $FRONTEND_URL"
echo "  Backend:  $BACKEND_URL"
echo "  Backend health: $BACKEND_URL/health"

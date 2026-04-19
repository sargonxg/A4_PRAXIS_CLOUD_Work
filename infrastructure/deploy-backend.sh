#!/bin/bash
# Deploy only the Python backend to Cloud Run
set -e

PROJECT_ID=$(gcloud config get-value project)
echo "Deploying PRAXIS backend to GCP project: $PROJECT_ID"

cd "$(dirname "$0")/../backend"
# Backend is private: only the Cloud Run frontend service account can invoke it.
# Frontend → backend is authenticated via OIDC (see backend/auth.py::verify_oidc).
gcloud run deploy praxis-backend \
  --source . \
  --region us-central1 \
  --no-allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "GCP_PROJECT_ID=${GCP_PROJECT_ID:-$PROJECT_ID},GCP_REGION=us-central1" \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT_KEY=praxis-firebase-sa:latest,GOOGLE_AI_API_KEY=praxis-google-ai-key:latest"

BACKEND_URL=$(gcloud run services describe praxis-backend --region=us-central1 --format='value(status.url)')
echo "Backend deployed: $BACKEND_URL"
echo "Health check: $BACKEND_URL/health"

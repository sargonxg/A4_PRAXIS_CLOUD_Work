#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-${PROJECT:-praxisbytacitus}}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-praxis-cognee}"
REPOSITORY="${REPOSITORY:-praxis}"
SHORT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo local)"
IMAGE="${IMAGE:-${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE}:${SHORT_SHA}}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-praxis-cognee-sa@${PROJECT_ID}.iam.gserviceaccount.com}"
KUZU_BUCKET="${KUZU_BUCKET:-praxis-cognee-graph}"
VPC_CONNECTOR="${VPC_CONNECTOR:-praxis-vpc-connector}"

gcloud builds submit backend \
  --project="${PROJECT_ID}" \
  --tag="${IMAGE}" \
  --machine-type=e2-highcpu-8 \
  --timeout=20m

gcloud run deploy "${SERVICE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --image="${IMAGE}" \
  --platform=managed \
  --service-account="${SERVICE_ACCOUNT}" \
  --no-allow-unauthenticated \
  --min-instances=1 \
  --max-instances=1 \
  --concurrency=4 \
  --cpu=2 \
  --memory=4Gi \
  --timeout=300 \
  --set-env-vars="COGNEE_ENABLED=true,COGNEE_MODE=postgres-kuzu,COGNEE_KUZU_PATH=/var/lib/cognee/kuzu,COGNEE_LLM_PROVIDER=vertex_ai,COGNEE_LLM_API_KEY=vertex-adc,LLM_API_KEY=vertex-adc,COGNEE_EMBEDDING_MODEL=vertex_ai/text-embedding-005,COGNEE_EMBEDDING_DIMENSIONS=768,COGNEE_PROMOTION_CEILING=0.60,COGNEE_MAX_CANDIDATES_PER_DOC=50,GRAPH_BACKEND=postgres,KG_BACKEND=postgres" \
  --set-secrets="COGNEE_DB_PASSWORD=praxis-cognee-db-password:latest,NEO4J_PASSWORD=praxis-neo4j-password:latest" \
  --add-volume="name=cognee-kuzu,type=cloud-storage,bucket=${KUZU_BUCKET}" \
  --add-volume-mount="volume=cognee-kuzu,mount-path=/var/lib/cognee/kuzu" \
  --vpc-connector="${VPC_CONNECTOR}" \
  --vpc-egress=private-ranges-only

gcloud run services describe "${SERVICE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format="value(status.url)"

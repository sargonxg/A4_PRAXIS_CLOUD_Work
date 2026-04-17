#!/bin/bash
set -e
PROJECT_ID="${GCP_PROJECT_ID:-praxisbytacitus}"
LOCATION="${VERTEX_LOCATION:-us-central1}"
STAGING_BUCKET="gs://${PROJECT_ID}-vertex-staging"

# Ensure staging bucket exists
gsutil mb -l "$LOCATION" "$STAGING_BUCKET" 2>/dev/null || true

# Deploy via Python
python infrastructure/deploy_agent.py \
  --project-id "$PROJECT_ID" \
  --location "$LOCATION" \
  --staging-bucket "$STAGING_BUCKET" \
  --output-secret praxis-agent-engine-id

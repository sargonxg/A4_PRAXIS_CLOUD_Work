#!/bin/bash
# PRAXIS — Map custom domain praxis.tacitus.me to Cloud Run frontend
set -e
PROJECT_ID="${GCP_PROJECT_ID:-praxisbytacitus}"
REGION="${REGION:-us-central1}"
DOMAIN="praxis.tacitus.me"
SERVICE="praxis-frontend"

gcloud run domain-mappings create \
  --service="$SERVICE" \
  --domain="$DOMAIN" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "Mapping may already exist"

echo ""
echo "DNS records to add to tacitus.me:"
gcloud run domain-mappings describe \
  --domain="$DOMAIN" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="table(status.resourceRecords[].name,status.resourceRecords[].type,status.resourceRecords[].rrdata)" \
  2>/dev/null || echo "(Run again after mapping propagates)"

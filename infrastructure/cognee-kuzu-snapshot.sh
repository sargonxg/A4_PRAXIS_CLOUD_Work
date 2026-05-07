#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-praxisbytacitus}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-praxis-cognee}"
SOURCE_BUCKET="${COGNEE_KUZU_GCS_BUCKET:-gs://praxis-cognee-graph}"
BACKUP_BUCKET="${COGNEE_KUZU_BACKUP_BUCKET:-gs://praxis-cognee-graph-backups}"
LABEL="${1:-snapshot-$(date -u +%Y%m%dT%H%M%SZ)}"
DESTINATION="${BACKUP_BUCKET}/${LABEL}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found"
  exit 2
fi

if ! command -v gsutil >/dev/null 2>&1; then
  echo "gsutil not found"
  exit 2
fi

SERVICE_URL="$(gcloud run services describe "${SERVICE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format='value(status.url)')"

TOKEN="$(gcloud auth print-identity-token --audiences="${SERVICE_URL}")"

resume() {
  curl -fsSL -X POST "${SERVICE_URL}/admin/resume" \
    -H "Authorization: Bearer ${TOKEN}" >/dev/null || true
}
trap resume EXIT

curl -fsSL -X POST "${SERVICE_URL}/admin/quiesce" \
  -H "Authorization: Bearer ${TOKEN}" >/dev/null

gsutil -m rsync -r "${SOURCE_BUCKET}" "${DESTINATION}"
echo "snapshot: ${DESTINATION}"

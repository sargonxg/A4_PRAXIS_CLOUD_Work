#!/usr/bin/env bash
#
# Grant the Cloud Build service account the minimum read-only roles needed for
# scripts/audit-gcp.mjs to pass in the `preflight-audit-gcp` build step.
#
# Run once per GCP project. After it succeeds, flip the Cloud Build substitution
# _AUDIT_GCP_SKIP=0 (either in cloudbuild.yaml or at trigger level) so the audit
# actually enforces. See cloudbuild.yaml:preflight-audit-gcp.
#
# Roles granted (all view-only):
#   roles/run.viewer                         — Cloud Run APIs + services list
#   roles/secretmanager.viewer               — secret describe (existence only)
#   roles/storage.objectViewer               — GCS bucket describe
#   roles/bigquery.metadataViewer            — BigQuery dataset describe
#   roles/pubsub.viewer                      — Pub/Sub topics describe
#   roles/serviceusage.serviceUsageConsumer  — `services list` + Firestore rules
#
# Usage:
#   ./infrastructure/grant-cloudbuild-audit-iam.sh                # uses defaults
#   PROJECT_ID=my-proj ./infrastructure/grant-cloudbuild-audit-iam.sh
#
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-praxisbytacitus}"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "Granting audit roles to ${CLOUD_BUILD_SA} on project ${PROJECT_ID}..."

ROLES=(
  "roles/run.viewer"
  "roles/secretmanager.viewer"
  "roles/storage.objectViewer"
  "roles/bigquery.metadataViewer"
  "roles/pubsub.viewer"
  "roles/serviceusage.serviceUsageConsumer"
)

for role in "${ROLES[@]}"; do
  echo "  + ${role}"
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="${role}" \
    --condition=None \
    --quiet >/dev/null
done

echo ""
echo "Done. Verify with:"
echo "  gcloud projects get-iam-policy ${PROJECT_ID} \\"
echo "    --flatten='bindings[].members' \\"
echo "    --filter=\"bindings.members:${CLOUD_BUILD_SA}\" \\"
echo "    --format='value(bindings.role)'"
echo ""
echo "Then flip _AUDIT_GCP_SKIP=0 in cloudbuild.yaml (or at trigger level) so"
echo "the preflight-audit-gcp step enforces missing-resource failures."

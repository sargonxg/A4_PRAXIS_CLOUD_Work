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
CLOUD_BUILD_SAS=(
  "${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
  "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
)

echo "Granting audit roles on project ${PROJECT_ID}..."

ROLES=(
  "roles/run.viewer"
  "roles/secretmanager.viewer"
  "roles/storage.objectViewer"
  "roles/bigquery.metadataViewer"
  "roles/pubsub.viewer"
  "roles/serviceusage.serviceUsageConsumer"
  "roles/serviceusage.serviceUsageViewer"
  "roles/cloudtasks.viewer"
  "roles/cloudsql.viewer"
  "roles/cloudscheduler.viewer"
  "roles/iam.serviceAccountViewer"
)

for sa in "${CLOUD_BUILD_SAS[@]}"; do
  echo "Service account: ${sa}"
  for role in "${ROLES[@]}"; do
    echo "  + ${role}"
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
      --member="serviceAccount:${sa}" \
      --role="${role}" \
      --condition=None \
      --quiet >/dev/null
  done
done

echo ""
echo "Done. Verify with:"
echo "  gcloud projects get-iam-policy ${PROJECT_ID} \\"
echo "    --flatten='bindings[].members' \\"
echo "    --filter=\"bindings.members:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com\" \\"
echo "    --format='value(bindings.role)'"
echo ""
echo "If the audit checks bucket metadata, grant bucket-level reader too:"
echo "  for sa in ${CLOUD_BUILD_SAS[*]}; do \\"
echo "    gcloud storage buckets add-iam-policy-binding gs://${PROJECT_ID}-praxis-uploads \\"
echo "      --member=\"serviceAccount:\${sa}\" \\"
echo "      --role=\"roles/storage.legacyBucketReader\" \\"
echo "      --project=${PROJECT_ID}; \\"
echo "  done"
echo ""
echo "Then flip _AUDIT_GCP_SKIP=0 in cloudbuild.yaml (or at trigger level) so"
echo "the preflight-audit-gcp step enforces missing-resource failures."

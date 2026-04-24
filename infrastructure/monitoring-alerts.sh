#!/usr/bin/env bash
# Cloud Monitoring alert policy templates for PRAXIS.
#
# Creates three baseline alert policies that most production teams would
# expect on day one:
#   1. Cloud Run 5xx burn   — errors > 5% over 10m window on either service
#   2. Cloud Run latency    — p95 > 10s over 5m
#   3. Secret Manager miss  — any GetSecret call returning NOT_FOUND
#
# Usage:
#   infrastructure/monitoring-alerts.sh --apply        # creates the policies
#   infrastructure/monitoring-alerts.sh --list         # prints existing policies
#   infrastructure/monitoring-alerts.sh --delete-all   # DESTRUCTIVE — removes policies tagged "managed-by:praxis"
#
# Requires a notification channel. Pass its id via NOTIFICATION_CHANNEL env var,
# or the script prints the command to create one first.

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-praxisbytacitus}"
MODE="${1:-}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install https://cloud.google.com/sdk/docs/install"
  exit 2
fi

if [[ -z "$MODE" ]]; then
  echo "Usage: $0 --apply | --list | --delete-all"
  exit 1
fi

case "$MODE" in
  --list)
    gcloud alpha monitoring policies list \
      --project="$PROJECT_ID" \
      --filter='userLabels.managed_by="praxis"' \
      --format='table(displayName,conditions[0].displayName,enabled)'
    exit 0
    ;;
  --delete-all)
    POLICIES=$(gcloud alpha monitoring policies list \
      --project="$PROJECT_ID" \
      --filter='userLabels.managed_by="praxis"' \
      --format='value(name)')
    if [[ -z "$POLICIES" ]]; then
      echo "No managed-by=praxis policies found."
      exit 0
    fi
    echo "Deleting policies:"
    echo "$POLICIES"
    for p in $POLICIES; do
      gcloud alpha monitoring policies delete "$p" --project="$PROJECT_ID" --quiet
    done
    exit 0
    ;;
  --apply)
    : # continue
    ;;
  *)
    echo "Unknown mode: $MODE"
    exit 1
    ;;
esac

if [[ -z "${NOTIFICATION_CHANNEL:-}" ]]; then
  cat <<'HELP'
NOTIFICATION_CHANNEL env var is required. Example — create an email channel:

  gcloud alpha monitoring channels create \
    --display-name="PRAXIS oncall email" \
    --type=email \
    --channel-labels=email_address=oncall@tacitus.me

Then export NOTIFICATION_CHANNEL to the returned channel name (projects/…).

HELP
  exit 1
fi

TMPDIR_ROOT=$(mktemp -d)
trap 'rm -rf "$TMPDIR_ROOT"' EXIT

apply_policy() {
  local FILE="$1"
  gcloud alpha monitoring policies create \
    --project="$PROJECT_ID" \
    --policy-from-file="$FILE"
}

# Policy 1 — Cloud Run 5xx burn (per-service)
for SERVICE in praxis-frontend praxis-backend; do
  FILE="${TMPDIR_ROOT}/5xx_${SERVICE}.json"
  cat > "$FILE" <<EOF
{
  "displayName": "PRAXIS — ${SERVICE} 5xx burn >5% (10m)",
  "combiner": "OR",
  "userLabels": { "managed_by": "praxis" },
  "conditions": [
    {
      "displayName": "5xx ratio > 5% over 10 minutes",
      "conditionThreshold": {
        "filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${SERVICE}\" metric.labels.response_code_class=\"5xx\"",
        "comparison": "COMPARISON_GT",
        "thresholdValue": 0.05,
        "duration": "600s",
        "aggregations": [{
          "alignmentPeriod": "60s",
          "perSeriesAligner": "ALIGN_RATE",
          "crossSeriesReducer": "REDUCE_MEAN"
        }]
      }
    }
  ],
  "notificationChannels": ["${NOTIFICATION_CHANNEL}"],
  "alertStrategy": { "autoClose": "1800s" }
}
EOF
  apply_policy "$FILE"
  echo "[alerts] Applied 5xx burn policy for ${SERVICE}"
done

# Policy 2 — Cloud Run p95 latency
FILE="${TMPDIR_ROOT}/latency.json"
cat > "$FILE" <<EOF
{
  "displayName": "PRAXIS — Cloud Run p95 latency >10s (5m)",
  "combiner": "OR",
  "userLabels": { "managed_by": "praxis" },
  "conditions": [
    {
      "displayName": "p95 latency > 10s over 5 minutes",
      "conditionThreshold": {
        "filter": "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\"",
        "comparison": "COMPARISON_GT",
        "thresholdValue": 10000,
        "duration": "300s",
        "aggregations": [{
          "alignmentPeriod": "60s",
          "perSeriesAligner": "ALIGN_PERCENTILE_95",
          "crossSeriesReducer": "REDUCE_MAX"
        }]
      }
    }
  ],
  "notificationChannels": ["${NOTIFICATION_CHANNEL}"],
  "alertStrategy": { "autoClose": "1800s" }
}
EOF
apply_policy "$FILE"
echo "[alerts] Applied Cloud Run p95 latency policy"

# Policy 3 — Secret Manager GetSecret NOT_FOUND
FILE="${TMPDIR_ROOT}/secrets.json"
cat > "$FILE" <<EOF
{
  "displayName": "PRAXIS — Secret Manager GetSecret 404 spike",
  "combiner": "OR",
  "userLabels": { "managed_by": "praxis" },
  "conditions": [
    {
      "displayName": "GetSecret NOT_FOUND > 1/min over 5 minutes",
      "conditionThreshold": {
        "filter": "metric.type=\"secretmanager.googleapis.com/secret_version/access_count\" metric.labels.response_code=\"NOT_FOUND\"",
        "comparison": "COMPARISON_GT",
        "thresholdValue": 1,
        "duration": "300s",
        "aggregations": [{
          "alignmentPeriod": "60s",
          "perSeriesAligner": "ALIGN_RATE"
        }]
      }
    }
  ],
  "notificationChannels": ["${NOTIFICATION_CHANNEL}"],
  "alertStrategy": { "autoClose": "1800s" }
}
EOF
apply_policy "$FILE"
echo "[alerts] Applied Secret Manager access policy"

echo "[alerts] Done. Run with --list to verify."

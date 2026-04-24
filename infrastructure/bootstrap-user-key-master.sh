#!/usr/bin/env bash
# Bootstrap the `praxis-user-key-master` Secret Manager secret.
#
# Idempotent: creates the secret only if absent, adds an initial version with
# a fresh 32-byte AES key (base64), and grants the Cloud Run frontend/backend
# service account `roles/secretmanager.secretAccessor` so the running
# containers can read it at startup.
#
# Usage:
#   infrastructure/bootstrap-user-key-master.sh                 # prod — touches Secret Manager
#   infrastructure/bootstrap-user-key-master.sh --local         # writes a base64 key to .env.local (gitignored)
#   infrastructure/bootstrap-user-key-master.sh --rotate        # adds a new version; old versions stay enabled for decrypt
#
# NEVER commit the key or print it to stdout in CI logs.

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-praxisbytacitus}"
SECRET_NAME="praxis-user-key-master"
FRONTEND_SA="${PROJECT_ID}-compute@developer.gserviceaccount.com"
BACKEND_SA="${PROJECT_ID}-compute@developer.gserviceaccount.com"

MODE="${1:-prod}"

generate_key() {
  # 32 random bytes → base64 (AES-256 key)
  python3 - <<'PY'
import base64, os, sys
sys.stdout.write(base64.b64encode(os.urandom(32)).decode())
PY
}

if [[ "$MODE" == "--local" ]]; then
  LOCAL_ENV=".env.local"
  if grep -q '^USER_KEY_MASTER=' "$LOCAL_ENV" 2>/dev/null; then
    echo "[bootstrap] USER_KEY_MASTER already present in $LOCAL_ENV — leaving unchanged."
    exit 0
  fi
  KEY="$(generate_key)"
  echo "USER_KEY_MASTER=${KEY}" >> "$LOCAL_ENV"
  echo "[bootstrap] Wrote USER_KEY_MASTER to $LOCAL_ENV (gitignored). Do NOT commit this file."
  exit 0
fi

# Prod / rotate paths
if ! command -v gcloud >/dev/null 2>&1; then
  echo "[bootstrap] gcloud CLI not found on PATH. Install https://cloud.google.com/sdk/docs/install and re-run."
  exit 2
fi

echo "[bootstrap] Project: ${PROJECT_ID}"
echo "[bootstrap] Secret: ${SECRET_NAME}"

if ! gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "[bootstrap] Creating secret ${SECRET_NAME}..."
  gcloud secrets create "$SECRET_NAME" \
    --project="$PROJECT_ID" \
    --replication-policy="automatic" \
    --labels="app=praxis,purpose=user-api-key-envelope"
fi

if [[ "$MODE" == "--rotate" ]]; then
  echo "[bootstrap] Adding new version (rotation)..."
  generate_key | gcloud secrets versions add "$SECRET_NAME" --project="$PROJECT_ID" --data-file=-
else
  # Add an initial version only if there isn't one already
  if ! gcloud secrets versions list "$SECRET_NAME" --project="$PROJECT_ID" --limit=1 --format="value(name)" | grep -q .; then
    echo "[bootstrap] Adding initial version..."
    generate_key | gcloud secrets versions add "$SECRET_NAME" --project="$PROJECT_ID" --data-file=-
  else
    echo "[bootstrap] Secret already has at least one version — skipping initial add."
  fi
fi

echo "[bootstrap] Granting secretAccessor to ${FRONTEND_SA}"
gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${FRONTEND_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None >/dev/null

if [[ "$FRONTEND_SA" != "$BACKEND_SA" ]]; then
  echo "[bootstrap] Granting secretAccessor to ${BACKEND_SA}"
  gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:${BACKEND_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None >/dev/null
fi

echo "[bootstrap] Done. Next: redeploy so Cloud Run mounts USER_KEY_MASTER via --set-secrets (see cloudbuild.yaml)."

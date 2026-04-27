#!/usr/bin/env bash
# PRAXIS — LangGraph Cloud SQL setup
# Idempotent. Creates/verifies private-IP-only Postgres for LangGraph checkpoints.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-praxisbytacitus}"
PROJECT_NUMBER="${PROJECT_NUMBER:-852128226674}"
NETWORK="${NETWORK:-default}"
REGION="${REGION:-us-east4}"
INSTANCE="${INSTANCE:-praxisbytacitus-instance}"
DATABASE="${DATABASE:-praxis_langgraph}"
DB_USER="${DB_USER:-praxis_langgraph}"
SECRET="${SECRET:-praxis-langgraph-db-password}"
RANGE_NAME="${RANGE_NAME:-praxis-private-services}"
AGENT_SA="praxis-agents-sa@${PROJECT_ID}.iam.gserviceaccount.com"
BACKEND_SA="praxis-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Project: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}" >/dev/null

echo "Enabling APIs..."
gcloud services enable \
  sqladmin.googleapis.com \
  servicenetworking.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com \
  --project="${PROJECT_ID}"

echo "Ensuring private service range..."
if ! gcloud compute addresses describe "${RANGE_NAME}" --global --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud compute addresses create "${RANGE_NAME}" \
    --global \
    --purpose=VPC_PEERING \
    --prefix-length=16 \
    --network="${NETWORK}" \
    --project="${PROJECT_ID}"
fi

echo "Ensuring private services access peering..."
if ! gcloud services vpc-peerings list --network="${NETWORK}" --project="${PROJECT_ID}" \
  --format="value(service)" | grep -q "servicenetworking.googleapis.com"; then
  gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --ranges="${RANGE_NAME}" \
    --network="${NETWORK}" \
    --project="${PROJECT_ID}"
fi

echo "Ensuring Cloud SQL instance ${INSTANCE}..."
if ! gcloud sql instances describe "${INSTANCE}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud sql instances create "${INSTANCE}" \
    --project="${PROJECT_ID}" \
    --database-version=POSTGRES_16 \
    --region="${REGION}" \
    --edition=ENTERPRISE \
    --tier=db-f1-micro \
    --storage-type=SSD \
    --storage-size=10GB \
    --availability-type=ZONAL \
    --network="${NETWORK}" \
    --no-assign-ip \
    --backup-start-time=03:00
fi

PUBLIC_IP="$(gcloud sql instances describe "${INSTANCE}" --project="${PROJECT_ID}" --format="value(settings.ipConfiguration.ipv4Enabled)")"
if [[ "${PUBLIC_IP}" != "False" && "${PUBLIC_IP}" != "false" ]]; then
  echo "ERROR: ${INSTANCE} has public IPv4 enabled. This violates PRAXIS policy." >&2
  exit 1
fi

echo "Ensuring database ${DATABASE}..."
if ! gcloud sql databases list --instance="${INSTANCE}" --project="${PROJECT_ID}" \
  --format="value(name)" | grep -qx "${DATABASE}"; then
  gcloud sql databases create "${DATABASE}" --instance="${INSTANCE}" --project="${PROJECT_ID}"
fi

echo "Ensuring DB password secret..."
if ! gcloud secrets describe "${SECRET}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud secrets create "${SECRET}" --replication-policy=automatic --project="${PROJECT_ID}"
fi

if [[ "${ROTATE_LANGGRAPH_DB_PASSWORD:-0}" == "1" ]] || \
   ! gcloud secrets versions list "${SECRET}" --project="${PROJECT_ID}" --filter="state=enabled" --format="value(name)" | grep -q .; then
  PASSWORD="$(openssl rand -base64 32 | tr '/+=' 'ABC')"
  printf "%s" "${PASSWORD}" | gcloud secrets versions add "${SECRET}" --data-file=- --project="${PROJECT_ID}"
else
  PASSWORD="$(gcloud secrets versions access latest --secret="${SECRET}" --project="${PROJECT_ID}")"
fi

echo "Ensuring DB user ${DB_USER}..."
if ! gcloud sql users list --instance="${INSTANCE}" --project="${PROJECT_ID}" \
  --format="value(name)" | grep -qx "${DB_USER}"; then
  gcloud sql users create "${DB_USER}" --instance="${INSTANCE}" --project="${PROJECT_ID}" --password="${PASSWORD}"
elif [[ "${ROTATE_LANGGRAPH_DB_PASSWORD:-0}" == "1" ]]; then
  gcloud sql users set-password "${DB_USER}" --instance="${INSTANCE}" --project="${PROJECT_ID}" --password="${PASSWORD}"
fi

echo "Ensuring service account ${AGENT_SA}..."
if ! gcloud iam service-accounts describe "${AGENT_SA}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create praxis-agents-sa \
    --display-name="praxis-agents-sa" \
    --project="${PROJECT_ID}"
fi

echo "Granting Cloud SQL and Secret Manager access..."
for sa in "${AGENT_SA}" "${BACKEND_SA}"; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${sa}" \
    --role="roles/cloudsql.client" \
    --quiet >/dev/null
  gcloud secrets add-iam-policy-binding "${SECRET}" \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:${sa}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet >/dev/null
done

echo ""
echo "LangGraph Cloud SQL setup complete."
gcloud sql instances describe "${INSTANCE}" --project="${PROJECT_ID}" \
  --format="table(name,databaseVersion,region,state,ipAddresses[0].type,ipAddresses[0].ipAddress,settings.ipConfiguration.ipv4Enabled)"

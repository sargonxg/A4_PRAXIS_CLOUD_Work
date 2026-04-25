# PRAXIS Maintenance & Operations Guide

This document covers routine maintenance tasks, security rotations, and initial operational setup for the PRAXIS platform.

---

## 🔐 Secret Rotation

To maintain security, it is recommended to rotate service account keys and API keys periodically.

### 1. Firebase Admin SDK (`praxis-firebase-sa`)
The `praxis-firebase-sa` secret contains the JSON key for the `firebase-adminsdk-fbsvc` service account.

1.  **Google Cloud Console** → **IAM & Admin** → **Service Accounts**.
2.  Locate `firebase-adminsdk-fbsvc@praxisbytacitus.iam.gserviceaccount.com`.
3.  Go to the **Keys** tab.
4.  **Delete** the old/compromised key.
5.  **Add Key** → **Create new key** → **JSON** → **Download**.
6.  **Update Secret Manager**:
    ```bash
    gcloud secrets versions add praxis-firebase-sa \
      --project=praxisbytacitus \
      --data-file=/path/to/new-firebase-sa.json
    ```

### 2. Google AI API Key (`praxis-google-ai-key`)
Used for Gemini model invocations (unless using Vertex AI via ADC).

1.  **Google AI Studio** → **API Keys**.
2.  Regenerate the API key.
3.  **Update Secret Manager**:
    ```bash
    echo -n "YOUR_NEW_AIZA_KEY" | gcloud secrets versions add praxis-google-ai-key \
      --project=praxisbytacitus --data-file=-
    ```

### 3. Firebase App Check (reCAPTCHA Enterprise)
The `AQ.Ab8RN6I...` value is public by design and stays in `cloudbuild.yaml`. Confirm the site/key id in **Firebase Console** → **App Check**. Rotation is only required if explicitly requested.

---

## 🔑 User API-Key Security (Envelope Encryption)

PRAXIS uses envelope encryption to store user-provided API keys (Anthropic, OpenAI, etc.).

### 1. Bootstrap the Envelope Master Key
The `praxis-user-key-master` secret must exist for encryption/decryption to work.

```bash
chmod +x infrastructure/bootstrap-user-key-master.sh

# Production: creates secret + grants IAM access to service accounts
bash infrastructure/bootstrap-user-key-master.sh

# Local dev: adds USER_KEY_MASTER to .env.local
bash infrastructure/bootstrap-user-key-master.sh --local
```

### 2. Migrate Legacy API-key data
If you have users with plaintext keys from an older version, run the migration script:

```bash
# Set environment variables for the script
export USER_KEY_MASTER="$(gcloud secrets versions access latest --secret=praxis-user-key-master --project=praxisbytacitus)"
export FIREBASE_SERVICE_ACCOUNT_KEY="$(gcloud secrets versions access latest --secret=praxis-firebase-sa --project=praxisbytacitus)"

# 1. Dry-run
npm run migrate:user-api-keys

# 2. Apply migration (writes encrypted docs + deletes legacy plaintext)
npm run migrate:user-api-keys -- --commit
```

---

## 🚀 Deployment & Configuration

### 1. Full Deploy
```bash
./infrastructure/deploy.sh
```

### 2. Google Maps Integration (Optional)
To enable live Google Maps in geospatial tools:
1.  Generate a **Maps JavaScript API key** in GCP Console.
2.  Restrict it to `https://praxis.tacitus.me/*` and `http://localhost:3000/*`.
3.  Deploy with the key:
    ```bash
    gcloud builds submit --project=praxisbytacitus \
      --substitutions=_GOOGLE_MAPS_KEY="AIzaSy...YOUR_MAPS_KEY"
    ```

### 3. Admin Allowlist
To grant yourself access to `/app/admin/*` diagnostics:
```bash
gcloud run services update praxis-frontend \
  --region=us-central1 \
  --update-env-vars=ADMIN_ALLOWLIST="YOUR_FIREBASE_UID"
```

### 4. Seed Advisor Config
Ensures the landing page and advisor tools have the correct specialist data:
```bash
npm run seed:advisors
```

---

## 📊 Monitoring & Alerts

### 1. Create Notification Channel
```bash
gcloud alpha monitoring channels create \
  --project=praxisbytacitus \
  --display-name="PRAXIS oncall" \
  --type=email \
  --channel-labels=email_address=YOU@YOURDOMAIN
```

### 2. Apply Alert Policies
```bash
# Get the channel ID from the previous command output
NOTIFICATION_CHANNEL="projects/praxisbytacitus/notificationChannels/..." \
  bash infrastructure/monitoring-alerts.sh --apply
```
This applies 5xx burn, p95 latency, and Secret Manager 404 alert policies.

---

## 📈 Analytics Persistence

To enable BigQuery telemetry for the Diagnostics page:

```bash
bq mk --project_id=praxisbytacitus --dataset praxisbytacitus:praxis_analytics 2>/dev/null || true

bq mk --table --project_id=praxisbytacitus \
  praxisbytacitus:praxis_analytics.tool_invocations \
  uid_hash:STRING,tool_id:STRING,profile_version:INTEGER,credits_delta:INTEGER,duration_ms:INTEGER,status:INTEGER,created_at:TIMESTAMP
```

---

## ✅ Verification

After maintenance or deployment, walk through `docs/golden-path.md` or run automated smokes:

```bash
# Unauth smoke (landing + gates)
npm run smoke:public

# Full authenticated smoke (requires TEST_FIREBASE_EMAIL/PASSWORD)
npm run smoke:golden-path
```

# PRAXIS GCP Operations Runbook

Concrete, copy-paste-able commands for the GCP / Firebase / Cloud Run / Secret
Manager operations Codex and Claude Code cannot run themselves but the user
can. Every command is scoped to project `praxisbytacitus` and region
`us-central1`.

> **Authentication assumed.** Run `gcloud auth login` and `firebase login`
> once before working through this file.

---

## 1. Activate paid / freemium data sources

The order below is the same as `docs/SPRINT_2026-04-25.md` Stream C — fastest
user value first.

### 1a. ACLED (free academic, ~15 min)

1. Sign up at https://developer.acleddata.com/ — create an account, then
   request an API key. You'll get an email with a numeric `key` and the
   email used as `email`.
2. Store both in Secret Manager:
   ```bash
   echo -n "<your-acled-key>" | gcloud secrets create praxis-acled-api-key \
     --data-file=- --project=praxisbytacitus
   echo -n "<your-acled-email>" | gcloud secrets create praxis-acled-email \
     --data-file=- --project=praxisbytacitus
   ```
3. Grant the Cloud Run service account access to the secrets:
   ```bash
   gcloud secrets add-iam-policy-binding praxis-acled-api-key \
     --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor" \
     --project=praxisbytacitus
   gcloud secrets add-iam-policy-binding praxis-acled-email \
     --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor" \
     --project=praxisbytacitus
   ```
4. Edit `cloudbuild.yaml` and add the secret-mounted env vars to the
   frontend deploy step:
   ```yaml
   --update-secrets=ACLED_API_KEY=praxis-acled-api-key:latest,ACLED_EMAIL=praxis-acled-email:latest
   ```
5. Trigger a build: `gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus`.
6. Verify: `curl -s https://praxis.tacitus.me/api/health/feeds | jq '.acled'`.

### 1b. Vertex AI Agent Engine (Deep Research Agent, ~1–2 h)

> See research prompt R1 in `docs/RESEARCH_PROMPTS.md` for a current,
> verified deployment recipe — the GA product moves fast and the steps below
> may need amendment.

1. Enable the API:
   ```bash
   gcloud services enable aiplatform.googleapis.com --project=praxisbytacitus
   ```
2. Deploy a Reasoning Engine via the Python ADK (see
   `backend/agents/deep_research_agent.py` if present, or follow the recipe
   from research prompt R1).
3. Capture the engine ID returned:
   ```bash
   echo -n "<engine-id>" | gcloud secrets create praxis-vertex-adk-engine-id \
     --data-file=- --project=praxisbytacitus
   gcloud secrets add-iam-policy-binding praxis-vertex-adk-engine-id \
     --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor" \
     --project=praxisbytacitus
   ```
4. Grant the runtime service account `roles/aiplatform.user`:
   ```bash
   gcloud projects add-iam-policy-binding praxisbytacitus \
     --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```
5. Add `VERTEX_AGENT_ENGINE_ID=praxis-vertex-adk-engine-id:latest` to the
   frontend `--update-secrets` flag in `cloudbuild.yaml`.
6. Verify: `curl -s https://praxis.tacitus.me/api/health | jq '.vertex_adk'`.

### 1c. Firecrawl ($20–50 / mo, ~30 min)

1. Sign up at https://www.firecrawl.dev/ — create an account, get an API key.
2. ```bash
   echo -n "<key>" | gcloud secrets create praxis-firecrawl-api-key \
     --data-file=- --project=praxisbytacitus
   gcloud secrets add-iam-policy-binding praxis-firecrawl-api-key \
     --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor" \
     --project=praxisbytacitus
   ```
3. Add `FIRECRAWL_API_KEY=praxis-firecrawl-api-key:latest` to
   `cloudbuild.yaml`.

### 1d. Stripe (~2 h, when ready to monetize)

1. In the Stripe Dashboard:
   - Create products **PRAXIS Analyst** ($49/mo) and **PRAXIS Team** ($199/mo).
   - For each, create a recurring price; copy the price ID
     (`price_…`).
   - Configure a webhook pointing at `https://praxis.tacitus.me/api/stripe/webhook`
     that listens for `customer.subscription.*`, `invoice.*`,
     `payment_intent.failed`. Copy the webhook signing secret
     (`whsec_…`).
2. ```bash
   for var in stripe-secret stripe-webhook-secret; do
     echo "TODO: paste value for $var, then press Ctrl-D"
     gcloud secrets create praxis-$var --data-file=- --project=praxisbytacitus
     gcloud secrets add-iam-policy-binding praxis-$var \
       --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor" \
       --project=praxisbytacitus
   done
   ```
3. Add to `cloudbuild.yaml` `--update-secrets`:
   `STRIPE_SECRET_KEY=praxis-stripe-secret:latest,STRIPE_WEBHOOK_SECRET=praxis-stripe-webhook-secret:latest`
4. Add as plain env vars (price IDs are non-secret):
   `STRIPE_PRICE_ANALYST=price_xxx,STRIPE_PRICE_TEAM=price_yyy`.

### 1e. Anthropic Claude (~15 min, optional)

1. https://console.anthropic.com/ → create API key.
2. ```bash
   echo -n "sk-ant-..." | gcloud secrets create praxis-anthropic-api-key \
     --data-file=- --project=praxisbytacitus
   gcloud secrets add-iam-policy-binding praxis-anthropic-api-key \
     --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor" \
     --project=praxisbytacitus
   ```
3. Add `ANTHROPIC_API_KEY=praxis-anthropic-api-key:latest` to
   `cloudbuild.yaml`.

---

## 2. Standard deploy procedure

Every change committed to `main` should pass the validation gate first.

```bash
# 1. Validation gate — all must pass
npm run build
npm run lint
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run

# 2. Cloud Build deploy (≈8 minutes)
gcloud config set project praxisbytacitus
gcloud config set run/region us-central1
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus

# 3. Capture the build ID (printed at the start of the gcloud builds output)
BUILD_ID=<paste>

# 4. Verify Cloud Run revisions
gcloud run services describe praxis-frontend --region=us-central1 \
  --format="value(status.url,status.latestReadyRevisionName)"
gcloud run services describe praxis-backend --region=us-central1 \
  --format="value(status.url,status.latestReadyRevisionName)"

# 5. Smoke-test production endpoints
curl -sI https://praxis.tacitus.me/                      # 200 OK
curl -sI https://praxis.tacitus.me/login                  # 200 OK
curl -sI https://praxis.tacitus.me/onboarding            # 307 → /login
curl -s  https://praxis.tacitus.me/api/health | jq
curl -s  https://praxis.tacitus.me/api/auth/test-firebase | jq

# 6. Append to docs/DEPLOYMENT_LOG.md (commit ID, build ID, revisions,
#    health output, configuration gaps remaining).
```

---

## 3. Rollback

If the latest deploy is broken:

```bash
# List recent revisions
gcloud run revisions list --service=praxis-frontend \
  --region=us-central1 --limit=10

# Pin traffic to a known-good revision
gcloud run services update-traffic praxis-frontend \
  --to-revisions=praxis-frontend-00043-xyz=100 --region=us-central1

# Same for backend if needed
gcloud run services update-traffic praxis-backend \
  --to-revisions=praxis-backend-00026-h82=100 --region=us-central1
```

Cloud Build itself cannot be rolled back; re-run the build for the previous
commit if you need fresh containers:

```bash
git checkout <good-commit>
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
git checkout main
```

---

## 4. Logs and debugging

### Tail Cloud Run logs

```bash
gcloud run services logs tail praxis-frontend --region=us-central1
gcloud run services logs tail praxis-backend  --region=us-central1
```

### Query logs by error level (last hour)

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND
   resource.labels.service_name="praxis-frontend" AND
   severity>=ERROR' \
  --project=praxisbytacitus \
  --freshness=1h \
  --limit=50 \
  --format=json
```

### Cloud Build status

```bash
gcloud builds list --project=praxisbytacitus --limit=10
gcloud builds describe $BUILD_ID --project=praxisbytacitus
gcloud builds log $BUILD_ID --project=praxisbytacitus
```

---

## 5. Firestore rules + index management

### Deploy rules and indexes

```bash
firebase use praxisbytacitus
firebase deploy --only firestore:rules,firestore:indexes
```

### List existing indexes

```bash
firebase firestore:indexes --project=praxisbytacitus
```

### Verify a specific situation document

```bash
gcloud firestore export gs://praxisbytacitus-firestore-backups/$(date +%F) \
  --collection-ids=users --project=praxisbytacitus
```

(For ad-hoc inspection use the Firebase Console → Firestore.)

---

## 6. Pub/Sub topics — current expected set

The GCP audit script (`scripts/audit-gcp.mjs`) verifies these exist. As of
2026-04-25:

```
profile.events
```

If a future feature adds a topic, create it with:

```bash
gcloud pubsub topics create <topic-name> --project=praxisbytacitus
```

And update `scripts/audit-gcp.mjs` so the audit catches drift.

---

## 7. Monitoring + alerting

### Health-endpoint smoke from Cloud Scheduler (recommended)

```bash
gcloud scheduler jobs create http praxis-health-poll \
  --schedule="*/5 * * * *" \
  --uri="https://praxis.tacitus.me/api/health" \
  --http-method=GET \
  --location=us-central1 \
  --project=praxisbytacitus
```

This won't alert on its own — it only ensures consistent traffic. For
alerting wire a Cloud Monitoring uptime check on the same URL with a
notification channel (email or PagerDuty).

---

## 8. Common procedures

### Bump a single secret

```bash
echo -n "<new-value>" | gcloud secrets versions add <secret-name> \
  --data-file=- --project=praxisbytacitus
# Cloud Run picks up the new version on next revision deploy.
gcloud run services update praxis-frontend --region=us-central1 \
  --update-secrets=<ENV_VAR>=<secret-name>:latest --project=praxisbytacitus
```

### Add a custom domain

```bash
gcloud run domain-mappings create --service=praxis-frontend \
  --domain=<your-domain> --region=us-central1 --project=praxisbytacitus
```

### Re-seed the 11 domain documents in Firestore

```bash
npx tsx scripts/seed-domains.ts
```

(idempotent — safe to re-run after schema bumps).

---

## 9. Useful admin URLs

- Cloud Run console: https://console.cloud.google.com/run?project=praxisbytacitus
- Cloud Build console: https://console.cloud.google.com/cloud-build?project=praxisbytacitus
- Secret Manager: https://console.cloud.google.com/security/secret-manager?project=praxisbytacitus
- Firestore: https://console.firebase.google.com/project/praxisbytacitus/firestore
- Firebase Auth: https://console.firebase.google.com/project/praxisbytacitus/authentication/users
- Vertex AI Agents: https://console.cloud.google.com/vertex-ai/reasoning-engines?project=praxisbytacitus
- BigQuery (analytics): https://console.cloud.google.com/bigquery?project=praxisbytacitus&d=praxis_analytics

---

## 10. When to ask a human (you, Giulio)

The following steps cannot be automated by an agent:

- Stripe product / price ID creation (vendor UI)
- Vertex AI Reasoning Engine first-time deploy (per project, requires a
  one-time IAM consent)
- Domain DNS records (Squarespace / Cloudflare / etc.)
- Firebase Auth provider toggles (Console UI)
- Anthropic / Firecrawl signups (vendor UI)
- ACLED key request (vendor approves manually)

For everything else, an agent (Codex or Claude Code) should be able to
self-serve from the validation + deploy commands above.

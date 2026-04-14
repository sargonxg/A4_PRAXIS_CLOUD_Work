# PRAXIS — Production Troubleshooting Guide

> For Cloud Run deployments of `praxis-frontend` and `praxis-backend`
> Project: `praxisbytacitus` · Region: `us-central1`

---

## Quick Health Check

```bash
curl https://praxis.tacitus.me/api/health
```

Expected response (all green):
```json
{
  "status": "ok",
  "checks": {
    "firestore": "ok",
    "ai_provider": "ok",
    "cookie_secret": "ok",
    "anthropic": "ok | unconfigured",
    "firecrawl": "ok | unconfigured"
  }
}
```

If `status` is `"degraded"`, check which key is `"error"` and follow the relevant section below.

---

## Common 500 Errors

### All AI Tool Routes Return 500

**Cause**: Invalid Gemini model ID or missing `GOOGLE_AI_API_KEY`.

**Check Cloud Run logs**:
```bash
gcloud run services logs read praxis-frontend --region=us-central1 --limit=50 --project=praxisbytacitus
```

Look for: `No AI provider configured` or `invalid model` errors.

**Verify Secret Manager**:
```bash
gcloud secrets versions access latest --secret=praxis-google-ai-key --project=praxisbytacitus | head -c 20
```

**Current model IDs** (as of v6.3.1):
- Flash: `gemini-3-flash-preview`
- Pro: `gemini-3.1-pro-preview`
- Embedding: `gemini-embedding-2-preview`

---

### All Authenticated Routes Return 401

**Cause**: Cookie signing secret mismatch between what signed the cookie and what verifies it.

**Expected secret read order** (`cookie-signer.ts`):
1. `COOKIE_SIGNING_SECRET` (primary — mounted from `praxis-cookie-secret`)
2. `SESSION_SECRET` (alias — also mounted from `praxis-cookie-secret`)
3. `CRON_SECRET` (fallback)
4. `dev-fallback-change-me` (local dev only)

**Verify secrets are mounted**:
```bash
gcloud run services describe praxis-frontend --region=us-central1 --format="value(spec.template.spec.containers[0].env)" --project=praxisbytacitus
```

Look for `COOKIE_SIGNING_SECRET` and `SESSION_SECRET` in the output.

**Fix**: If secrets changed, re-deploy:
```bash
./infrastructure/deploy-frontend.sh
```

---

### Credits System Returns 503

**Cause**: Firebase Admin SDK failed to initialize — Firestore unavailable.

**Check logs for**:
```
[firebase-admin] ⚠️  Firestore is NOT available.
```

**Diagnose**:
```bash
gcloud secrets versions access latest --secret=praxis-firebase-sa --project=praxisbytacitus | python3 -m json.tool > /dev/null && echo "Valid JSON" || echo "INVALID JSON"
```

If invalid JSON: the secret value has escaped newlines or extra quotes. Re-set it:
```bash
# From the downloaded .json key file:
gcloud secrets versions add praxis-firebase-sa --data-file=./firebase-service-account.json --project=praxisbytacitus
```

**Verify Firestore connectivity**:
```bash
curl https://praxis.tacitus.me/api/health | jq '.checks.firestore'
```

---

### Credit Transaction Logging Failures

These appear in logs as:
```
[credits] Failed to record transaction: ...
```

These are **non-blocking** — the AI response was already sent. The credit was deducted but the transaction log entry failed. This is cosmetic and doesn't affect functionality.

If frequent: check Firestore quota limits in the GCP console.

---

## Verifying Secret Manager Configuration

```bash
# List all secrets
gcloud secrets list --project=praxisbytacitus

# Check a secret has a latest version
gcloud secrets versions list praxis-firebase-sa --project=praxisbytacitus
gcloud secrets versions list praxis-google-ai-key --project=praxisbytacitus
gcloud secrets versions list praxis-cron-secret --project=praxisbytacitus
gcloud secrets versions list praxis-cookie-secret --project=praxisbytacitus
```

Expected secrets: `praxis-firebase-sa`, `praxis-google-ai-key`, `praxis-cron-secret`, `praxis-cookie-secret`

---

## Checking Cloud Run Logs for Firebase Initialization

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="praxis-frontend" AND textPayload:"firebase-admin"' \
  --project=praxisbytacitus \
  --limit=20 \
  --format="value(textPayload)"
```

**Good**: `[firebase-admin] Initialized successfully with service account`
**Bad**: `[firebase-admin] ⚠️  Firestore is NOT available`

---

## Cold Start Elimination

Cloud Run with `--min-instances 0` will have cold starts. For `praxis-frontend`, the Firebase Admin SDK initialization runs on cold start and takes ~500ms.

To reduce cold starts:
```bash
# Set minimum instances to 1 (incurs cost)
gcloud run services update praxis-frontend \
  --min-instances=1 \
  --region=us-central1 \
  --project=praxisbytacitus
```

---

## Deploying Fixes

```bash
# Full redeploy (backend + frontend via Cloud Build)
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus

# Frontend only (faster, ~5min)
./infrastructure/deploy-frontend.sh

# View build logs
gcloud builds list --project=praxisbytacitus --limit=5
gcloud builds log <BUILD_ID> --project=praxisbytacitus
```

---

## Post-Deploy Verification Checklist

- [ ] `curl https://praxis.tacitus.me/api/health` → `status: ok`
- [ ] Login with Google → session cookie set → `/app/dashboard` loads
- [ ] Dashboard renders without React errors in browser console
- [ ] Click any tool → Regenerate → AI response returns (not 500)
- [ ] Cloud Run logs show `[firebase-admin] Initialized successfully`
- [ ] No `Firestore is NOT available` warnings in logs

# PRAXIS — Full deploy script for Windows PowerShell
# Prerequisites: gcloud CLI, Docker Desktop (running)
# Run from the repo root: .\infrastructure\deploy-windows.ps1
#
# First time only: gcloud auth login
#                  gcloud config set project praxisbytacitus

$ErrorActionPreference = "Stop"

$PROJECT_ID = "praxisbytacitus"
$REGION     = "us-central1"
$REPO       = "us-central1-docker.pkg.dev/$PROJECT_ID/praxis"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " PRAXIS Windows Deploy"                   -ForegroundColor Cyan
Write-Host " Project: $PROJECT_ID"                    -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ── Check Docker is running ──────────────────────────────────────────────────
Write-Host "[0/9] Checking Docker..." -ForegroundColor Yellow
try { docker info | Out-Null } catch {
    Write-Host "ERROR: Docker Desktop is not running. Start it and try again." -ForegroundColor Red
    exit 1
}
Write-Host "      Docker OK" -ForegroundColor Green

# ── Enable APIs ──────────────────────────────────────────────────────────────
Write-Host "[1/9] Enabling GCP APIs..." -ForegroundColor Yellow
gcloud services enable `
    run.googleapis.com `
    artifactregistry.googleapis.com `
    cloudbuild.googleapis.com `
    secretmanager.googleapis.com `
    firestore.googleapis.com `
    aiplatform.googleapis.com `
    bigquery.googleapis.com `
    storage.googleapis.com `
    --project $PROJECT_ID
Write-Host "      APIs enabled" -ForegroundColor Green

# ── Create Artifact Registry repo ───────────────────────────────────────────
Write-Host "[2/9] Creating Artifact Registry repo..." -ForegroundColor Yellow
$repoExists = gcloud artifacts repositories list `
    --location=$REGION --project=$PROJECT_ID `
    --filter="name:praxis" --format="value(name)" 2>$null
if (-not $repoExists) {
    gcloud artifacts repositories create praxis `
        --repository-format=docker `
        --location=$REGION `
        --project=$PROJECT_ID `
        --description="PRAXIS Docker images"
    Write-Host "      Repo created" -ForegroundColor Green
} else {
    Write-Host "      Repo already exists" -ForegroundColor Green
}

# ── Configure Docker auth ────────────────────────────────────────────────────
Write-Host "[3/9] Configuring Docker auth for Artifact Registry..." -ForegroundColor Yellow
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
Write-Host "      Docker auth configured" -ForegroundColor Green

# ── Secret Manager: create secrets if they don't exist ──────────────────────
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " SECRET MANAGER SETUP"                    -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$secrets = @("praxis-firebase-sa", "praxis-google-ai-key", "praxis-cron-secret", "praxis-cookie-secret")
foreach ($secret in $secrets) {
    $exists = gcloud secrets describe $secret --project=$PROJECT_ID 2>$null
    if (-not $exists) {
        gcloud secrets create $secret --replication-policy=automatic --project=$PROJECT_ID
        Write-Host "  Created secret: $secret" -ForegroundColor Green
    } else {
        Write-Host "  Secret exists:  $secret" -ForegroundColor Gray
    }
}

# Check which secrets need values
Write-Host ""
$needsFirebase = $true
$needsGemini   = $true

try {
    $v = gcloud secrets versions list praxis-firebase-sa --project=$PROJECT_ID --filter="state=enabled" --format="value(name)" 2>$null
    if ($v) { $needsFirebase = $false }
} catch {}

try {
    $v = gcloud secrets versions list praxis-google-ai-key --project=$PROJECT_ID --filter="state=enabled" --format="value(name)" 2>$null
    if ($v) { $needsGemini = $false }
} catch {}

# Firebase SA
if ($needsFirebase) {
    Write-Host ""
    Write-Host "  FIREBASE SERVICE ACCOUNT KEY NEEDED" -ForegroundColor Red
    Write-Host "  1. Go to: https://console.firebase.google.com/project/praxisbytacitus/settings/serviceaccounts/adminsdk"
    Write-Host "  2. Click 'Generate new private key' -> Download JSON"
    Write-Host "  3. Enter the full path to that file below:"
    $saPath = Read-Host "  Path to firebase-service-account.json"
    if (Test-Path $saPath) {
        $saJson = Get-Content $saPath -Raw
        $saJson | gcloud secrets versions add praxis-firebase-sa --data-file=- --project=$PROJECT_ID
        Write-Host "  Firebase SA loaded into Secret Manager" -ForegroundColor Green
    } else {
        Write-Host "  File not found: $saPath" -ForegroundColor Red
        exit 1
    }
}

# Google AI Key
if ($needsGemini) {
    Write-Host ""
    Write-Host "  GOOGLE AI KEY NEEDED" -ForegroundColor Red
    Write-Host "  Get it from: https://aistudio.google.com/app/apikey"
    $geminiKey = Read-Host "  Paste your Google AI API key (AIzaSy...)"
    if ($geminiKey) {
        $geminiKey | gcloud secrets versions add praxis-google-ai-key --data-file=- --project=$PROJECT_ID
        Write-Host "  Google AI key loaded" -ForegroundColor Green
    } else {
        Write-Host "  No key entered — skipping (AI features will be limited)" -ForegroundColor Yellow
    }
}

# Cron + Cookie secrets (auto-generate if missing)
$needsCron = $true
$needsCookie = $true
try {
    $v = gcloud secrets versions list praxis-cron-secret --project=$PROJECT_ID --filter="state=enabled" --format="value(name)" 2>$null
    if ($v) { $needsCron = $false }
} catch {}
try {
    $v = gcloud secrets versions list praxis-cookie-secret --project=$PROJECT_ID --filter="state=enabled" --format="value(name)" 2>$null
    if ($v) { $needsCookie = $false }
} catch {}

if ($needsCron) {
    $cronSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    $cronSecret | gcloud secrets versions add praxis-cron-secret --data-file=- --project=$PROJECT_ID
    Write-Host "  Cron secret auto-generated" -ForegroundColor Green
}
if ($needsCookie) {
    $cookieSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    $cookieSecret | gcloud secrets versions add praxis-cookie-secret --data-file=- --project=$PROJECT_ID
    Write-Host "  Cookie secret auto-generated" -ForegroundColor Green
}

# ── Grant Cloud Run SA access to secrets ────────────────────────────────────
Write-Host ""
Write-Host "[4/9] Granting Cloud Run SA access to Secret Manager..." -ForegroundColor Yellow
$PROJECT_NUM = "852128226674"
$CR_SA = "$PROJECT_NUM-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$CR_SA" `
    --role="roles/secretmanager.secretAccessor" `
    --quiet 2>$null
Write-Host "      IAM set" -ForegroundColor Green

# ── Build + push backend ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/9] Building backend Docker image (~3 min)..." -ForegroundColor Yellow
$BACKEND_IMAGE = "$REPO/praxis-backend:latest"
docker build -t $BACKEND_IMAGE ./backend
Write-Host "      Backend image built" -ForegroundColor Green

Write-Host "[6/9] Pushing backend image..." -ForegroundColor Yellow
docker push $BACKEND_IMAGE
Write-Host "      Backend image pushed" -ForegroundColor Green

# ── Deploy backend ───────────────────────────────────────────────────────────
Write-Host "[7/9] Deploying backend to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy praxis-backend `
    --image $BACKEND_IMAGE `
    --region $REGION `
    --project $PROJECT_ID `
    --allow-unauthenticated `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --min-instances 0 `
    --max-instances 10 `
    --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID,GCP_REGION=$REGION" `
    --set-secrets "FIREBASE_SERVICE_ACCOUNT_KEY=praxis-firebase-sa:latest,GOOGLE_AI_API_KEY=praxis-google-ai-key:latest"

$BACKEND_URL = gcloud run services describe praxis-backend `
    --region=$REGION --project=$PROJECT_ID `
    --format="value(status.url)"
Write-Host "      Backend live: $BACKEND_URL" -ForegroundColor Green

# ── Build + push frontend ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[8/9] Building frontend Docker image (~5 min)..." -ForegroundColor Yellow
$FRONTEND_IMAGE = "$REPO/praxis-frontend:latest"
docker build `
    --build-arg "NEXT_PUBLIC_PRAXIS_BACKEND_URL=$BACKEND_URL" `
    -t $FRONTEND_IMAGE `
    .
Write-Host "      Frontend image built" -ForegroundColor Green

Write-Host "[9/9] Pushing + deploying frontend..." -ForegroundColor Yellow
docker push $FRONTEND_IMAGE

gcloud run deploy praxis-frontend `
    --image $FRONTEND_IMAGE `
    --region $REGION `
    --project $PROJECT_ID `
    --allow-unauthenticated `
    --memory 1Gi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 10 `
    --set-secrets "FIREBASE_SERVICE_ACCOUNT_KEY=praxis-firebase-sa:latest,GOOGLE_AI_API_KEY=praxis-google-ai-key:latest,CRON_SECRET=praxis-cron-secret:latest,COOKIE_SIGNING_SECRET=praxis-cookie-secret:latest"

$FRONTEND_URL = gcloud run services describe praxis-frontend `
    --region=$REGION --project=$PROJECT_ID `
    --format="value(status.url)"

# ── Done ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " PRAXIS DEPLOYED SUCCESSFULLY!"           -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  $FRONTEND_URL"   -ForegroundColor Cyan
Write-Host "  Backend:   $BACKEND_URL"    -ForegroundColor Cyan
Write-Host ""
Write-Host "  Health check:"
Write-Host "  curl $BACKEND_URL/health"
Write-Host ""

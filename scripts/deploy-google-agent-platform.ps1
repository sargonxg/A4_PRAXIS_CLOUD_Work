param(
  [switch]$ApproveCloudMutation
)

$ErrorActionPreference = "Stop"

if (-not $ApproveCloudMutation) {
  Write-Error "Refusing to deploy Google Agent Platform resources without -ApproveCloudMutation."
}

$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

npm run auth:doctor -- --fix
npm run doctor:google-agent-platform
npm run audit:google-agent-platform -- --predeploy

gcloud services enable aiplatform.googleapis.com storage.googleapis.com bigquery.googleapis.com cloudtasks.googleapis.com --project=praxisbytacitus

$bucketName = "praxisbytacitus-agent-staging"
$bucketExists = gcloud storage buckets describe "gs://$bucketName" --format="value(name)" 2>$null
if (-not $bucketExists) {
  gcloud storage buckets create "gs://$bucketName" --project=praxisbytacitus --location=us-central1
}

Push-Location backend\agents
try {
  if (-not (Test-Path .venv)) {
    python -m venv .venv
  }
  .\.venv\Scripts\python.exe -m pip install -r requirements.txt
  .\.venv\Scripts\adk.exe deploy agent_engine `
    --project=praxisbytacitus `
    --region=us-central1 `
    --staging_bucket="gs://$bucketName" `
    --display_name="PRAXIS Data Controller" `
    --adk_app=praxis_data_controller.agent.app `
    praxis_data_controller
}
finally {
  Pop-Location
}

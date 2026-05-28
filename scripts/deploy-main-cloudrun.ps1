[CmdletBinding()]
param(
  [string]$Project = 'praxisbytacitus',
  [string]$Region = 'us-central1',
  [string]$Config = 'cloudbuild.frontend.yaml',
  [string]$BaseUrl = 'https://praxis.tacitus.me',
  [string]$BuildSource = 'manual-codex-main-safe',
  [string]$SourceRepo = 'sargonxg/A4_PRAXIS_CLOUD_Work',
  [string]$SourceBranch = 'main',
  [string]$GoogleMapsKey = $env:NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
)

$ErrorActionPreference = 'Stop'

function Assert-LastExitOk {
  param(
    [string]$Action
  )
  if ($LASTEXITCODE -ne 0) {
    throw "$Action failed with exit code $LASTEXITCODE."
  }
}

Write-Host 'Checking git state for main deploy...'
$HeadCommit = (& git rev-parse HEAD).Trim()
Assert-LastExitOk 'git rev-parse HEAD'

$Branch = (& git rev-parse --abbrev-ref HEAD).Trim()
Assert-LastExitOk 'git rev-parse --abbrev-ref HEAD'
if ($Branch -ne 'main') {
  throw "Refusing to deploy from branch '$Branch'. Check out main first."
}

& git fetch origin main
Assert-LastExitOk 'git fetch origin main'

$AheadBehind = (& git rev-list --left-right --count origin/main...HEAD).Trim()
Assert-LastExitOk 'git rev-list origin/main...HEAD'
if ($AheadBehind -ne "0`t0" -and $AheadBehind -ne '0 0') {
  throw "Refusing to deploy because local main differs from origin/main ($AheadBehind). Push or pull first."
}

$SubstitutionItems = @(
  "_BUILD_SOURCE=$BuildSource",
  "_SOURCE_REPO=$SourceRepo",
  "_SOURCE_BRANCH=$SourceBranch",
  "_SOURCE_COMMIT=$HeadCommit",
  "_GOOGLE_MAPS_KEY=$GoogleMapsKey"
)
$Substitutions = $SubstitutionItems -join ','

Write-Host "Submitting Cloud Build for $HeadCommit..."
& gcloud builds submit "--config=$Config" "--project=$Project" --substitutions $Substitutions
Assert-LastExitOk 'gcloud builds submit'

Write-Host 'Waiting for Cloud Run to expose the new runtime health payload...'
Start-Sleep -Seconds 20

$RuntimeHealthUrl = "$BaseUrl/api/health/runtime"
$Runtime = Invoke-RestMethod -Method Get -Uri $RuntimeHealthUrl -Headers @{ 'Cache-Control' = 'no-cache' } -TimeoutSec 30
$ServedCommit = $Runtime.build.commit
if (-not $ServedCommit) {
  $ServedCommit = $Runtime.commit
}

if ($ServedCommit -ne $HeadCommit) {
  throw "Cloud Run served commit mismatch. Expected $HeadCommit but $RuntimeHealthUrl reported $ServedCommit."
}

Write-Host "Cloud Run served commit matches main: $ServedCommit"

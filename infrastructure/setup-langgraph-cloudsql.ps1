# PRAXIS — LangGraph Cloud SQL setup for Windows PowerShell
# Idempotent. Creates/verifies private-IP-only Postgres for LangGraph checkpoints.
$ErrorActionPreference = "Stop"

$PROJECT_ID = $env:PROJECT_ID
if (-not $PROJECT_ID) { $PROJECT_ID = "praxisbytacitus" }
$NETWORK = $env:NETWORK
if (-not $NETWORK) { $NETWORK = "default" }
$REGION = $env:REGION
if (-not $REGION) { $REGION = "us-east4" }
$INSTANCE = $env:INSTANCE
if (-not $INSTANCE) { $INSTANCE = "praxisbytacitus-instance" }
$DATABASE = $env:DATABASE
if (-not $DATABASE) { $DATABASE = "praxis_langgraph" }
$DB_USER = $env:DB_USER
if (-not $DB_USER) { $DB_USER = "praxis_langgraph" }
$SECRET = $env:SECRET
if (-not $SECRET) { $SECRET = "praxis-langgraph-db-password" }
$RANGE_NAME = $env:RANGE_NAME
if (-not $RANGE_NAME) { $RANGE_NAME = "praxis-private-services" }
$AGENT_SA = "praxis-agents-sa@$PROJECT_ID.iam.gserviceaccount.com"
$BACKEND_SA = "praxis-backend-sa@$PROJECT_ID.iam.gserviceaccount.com"

Write-Host "Project: $PROJECT_ID"
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Enabling APIs..."
gcloud services enable `
  sqladmin.googleapis.com `
  servicenetworking.googleapis.com `
  secretmanager.googleapis.com `
  compute.googleapis.com `
  --project=$PROJECT_ID

Write-Host "Ensuring private service range..."
$range = gcloud compute addresses describe $RANGE_NAME --global --project=$PROJECT_ID --format="value(name)" 2>$null
if (-not $range) {
  gcloud compute addresses create $RANGE_NAME `
    --global `
    --purpose=VPC_PEERING `
    --prefix-length=16 `
    --network=$NETWORK `
    --project=$PROJECT_ID
}

Write-Host "Ensuring private services access peering..."
$peering = gcloud services vpc-peerings list --network=$NETWORK --project=$PROJECT_ID --format="value(service)" | Select-String -SimpleMatch "servicenetworking.googleapis.com"
if (-not $peering) {
  gcloud services vpc-peerings connect `
    --service=servicenetworking.googleapis.com `
    --ranges=$RANGE_NAME `
    --network=$NETWORK `
    --project=$PROJECT_ID
}

Write-Host "Ensuring Cloud SQL instance $INSTANCE..."
$instanceExists = gcloud sql instances describe $INSTANCE --project=$PROJECT_ID --format="value(name)" 2>$null
if (-not $instanceExists) {
  gcloud sql instances create $INSTANCE `
    --project=$PROJECT_ID `
    --database-version=POSTGRES_16 `
    --region=$REGION `
    --edition=ENTERPRISE `
    --tier=db-f1-micro `
    --storage-type=SSD `
    --storage-size=10GB `
    --availability-type=ZONAL `
    --network=$NETWORK `
    --no-assign-ip `
    --backup-start-time=03:00
}

$publicIp = gcloud sql instances describe $INSTANCE --project=$PROJECT_ID --format="value(settings.ipConfiguration.ipv4Enabled)"
if ($publicIp -ne "False" -and $publicIp -ne "false") {
  throw "$INSTANCE has public IPv4 enabled. This violates PRAXIS policy."
}

Write-Host "Ensuring database $DATABASE..."
$dbExists = gcloud sql databases list --instance=$INSTANCE --project=$PROJECT_ID --format="value(name)" | Where-Object { $_ -eq $DATABASE }
if (-not $dbExists) {
  gcloud sql databases create $DATABASE --instance=$INSTANCE --project=$PROJECT_ID
}

Write-Host "Ensuring DB password secret..."
$secretExists = gcloud secrets describe $SECRET --project=$PROJECT_ID --format="value(name)" 2>$null
if (-not $secretExists) {
  gcloud secrets create $SECRET --replication-policy=automatic --project=$PROJECT_ID
}

$rotate = $env:ROTATE_LANGGRAPH_DB_PASSWORD -eq "1"
$secretVersion = gcloud secrets versions list $SECRET --project=$PROJECT_ID --filter="state=enabled" --format="value(name)" | Select-Object -First 1
if ($rotate -or -not $secretVersion) {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  $password = [Convert]::ToBase64String($bytes).Replace('+','A').Replace('/','B').Replace('=','C')
  $password | gcloud secrets versions add $SECRET --data-file=- --project=$PROJECT_ID
} else {
  $password = gcloud secrets versions access latest --secret=$SECRET --project=$PROJECT_ID
}

Write-Host "Ensuring DB user $DB_USER..."
$userExists = gcloud sql users list --instance=$INSTANCE --project=$PROJECT_ID --format="value(name)" | Where-Object { $_ -eq $DB_USER }
if (-not $userExists) {
  gcloud sql users create $DB_USER --instance=$INSTANCE --project=$PROJECT_ID --password=$password
} elseif ($rotate) {
  gcloud sql users set-password $DB_USER --instance=$INSTANCE --project=$PROJECT_ID --password=$password
}

Write-Host "Ensuring service account $AGENT_SA..."
$saExists = gcloud iam service-accounts describe $AGENT_SA --project=$PROJECT_ID --format="value(email)" 2>$null
if (-not $saExists) {
  gcloud iam service-accounts create praxis-agents-sa `
    --display-name="praxis-agents-sa" `
    --project=$PROJECT_ID
}

Write-Host "Granting Cloud SQL and Secret Manager access..."
foreach ($sa in @($AGENT_SA, $BACKEND_SA)) {
  gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$sa" `
    --role="roles/cloudsql.client" `
    --quiet | Out-Null
  gcloud secrets add-iam-policy-binding $SECRET `
    --project=$PROJECT_ID `
    --member="serviceAccount:$sa" `
    --role="roles/secretmanager.secretAccessor" `
    --quiet | Out-Null
}

Write-Host ""
Write-Host "LangGraph Cloud SQL setup complete." -ForegroundColor Green
gcloud sql instances describe $INSTANCE --project=$PROJECT_ID `
  --format="table(name,databaseVersion,region,state,ipAddresses[0].type,ipAddresses[0].ipAddress,settings.ipConfiguration.ipv4Enabled)"

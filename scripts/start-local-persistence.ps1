param([int]$Port = 3020)
$ErrorActionPreference = 'Stop'
if ($env:K_SERVICE) { throw 'This script is local-only.' }
if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { throw "Port $Port is occupied; choose a free port. Existing processes are preserved." }
$env:PRAXIS_LOCAL_EMULATORS = 'true'
$env:NEXT_PUBLIC_PRAXIS_LOCAL_EMULATORS = 'true'
$env:GCLOUD_PROJECT = 'demo-praxis-local'
$env:GCP_PROJECT_ID = 'demo-praxis-local'
$env:NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-praxis-local'
$env:FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
$env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
$env:NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
$env:NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
$env:NEXT_PUBLIC_FIREBASE_APPCHECK_ENABLED = 'false'
$env:COOKIE_SIGNING_SECRET = 'synthetic-local-persistence-cookie-secret-only'
$env:NEXT_TELEMETRY_DISABLED = '1'
& node 'node_modules/next/dist/bin/next' dev --hostname 127.0.0.1 --port $Port --webpack
exit $LASTEXITCODE

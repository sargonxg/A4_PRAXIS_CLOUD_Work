# PRAXIS Doctor - 2026-05-19

- Run ID: `doctor-20260519T051239730Z`
- Base URL: `https://praxis.tacitus.me`
- Project: `praxisbytacitus`
- Region: `us-central1`
- Branch: `main`
- Commit: `3616be79b1e5d4999506c51f3b74147b1a6de21e`
- Cloud Run revision: `praxis-frontend-00611-9sg`
- Summary: PASS=26, WARN=3, FAIL=1, BLOCKED=0

## Checks

| Status | Lane | Check | Summary |
| --- | --- | --- | --- |
| PASS | repo-and-deployability | repo-branch | Repo is on main |
| PASS | repo-and-deployability | repo-commit | Commit SHA resolved |
| WARN | repo-and-deployability | repo-dirty-state | Working tree has uncommitted changes |
| PASS | repo-and-deployability | repo-origin-sync | origin/main...HEAD = 0	0 |
| PASS | repo-and-deployability | typecheck | npm run typecheck passed |
| FAIL | repo-and-deployability | build | npm run build exited 1 |
| PASS | repo-and-deployability | lint | npm run lint passed |
| PASS | repo-and-deployability | vitest-run-tests-unit-lib-agent-runtime-tests-unit-lib-health | npx vitest run tests/unit/lib/agent-runtime tests/unit/lib/health passed |
| PASS | repo-and-deployability | audit-ai-routes-mjs | node scripts/audit-ai-routes.mjs passed |
| PASS | repo-and-deployability | audit-repo-shape | npm run audit:repo-shape passed |
| PASS | repo-and-deployability | audit-gcp | npm run audit:gcp passed |
| PASS | repo-and-deployability | audit-gate | npm run audit:gate passed |
| PASS | local-cloud-auth | auth-doctor | npm run auth:doctor passed |
| PASS | gcp-firebase-infrastructure | cloud-run-praxis-frontend | praxis-frontend serving praxis-frontend-00611-9sg |
| PASS | gcp-firebase-infrastructure | cloud-run-private-sql-networking | Cloud Run has private networking for the attached Cloud SQL instance |
| PASS | gcp-firebase-infrastructure | agent-worker-runtime-env | Agent worker dispatch URL and auth env are configured |
| PASS | gcp-firebase-infrastructure | agent-run-queue | gcloud tasks queues describe agent-runs --location=us-central1 --project=praxisbytacitus passed |
| PASS | gcp-firebase-infrastructure | cloud-sql-instance | gcloud sql instances describe praxisbytacitus-instance --project=praxisbytacitus passed |
| PASS | gcp-firebase-infrastructure | firestore-database | gcloud firestore databases describe --database="(default)" --project=praxisbytacitus passed |
| PASS | gcp-firebase-infrastructure | secret-manager-cookie | gcloud secrets describe praxis-cookie-secret --project=praxisbytacitus passed |
| PASS | gcp-firebase-infrastructure | secret-manager-cron | gcloud secrets describe praxis-cron-secret --project=praxisbytacitus passed |
| PASS | gcp-firebase-infrastructure | pubsub-profile-events | gcloud pubsub topics describe profile.events --project=praxisbytacitus passed |
| PASS | gcp-firebase-infrastructure | pubsub-praxis-events | gcloud pubsub topics describe praxis.events --project=praxisbytacitus passed |
| PASS | gcp-firebase-infrastructure | scheduler-jobs | gcloud scheduler jobs list --location=us-central1 --project=praxisbytacitus passed |
| PASS | gcp-firebase-infrastructure | agent-service-account | gcloud iam service-accounts describe [REDACTED_SERVICE_ACCOUNT] --project=praxisbytacitus passed |
| PASS | live-production-health | production-home | HTTP 200 from https://praxis.tacitus.me |
| PASS | live-production-health | production-login | HTTP 200 from https://praxis.tacitus.me/login |
| WARN | live-production-health | health-core | HTTP 200 from https://praxis.tacitus.me/api/health |
| PASS | live-production-health | health-runtime | HTTP 200 from https://praxis.tacitus.me/api/health/runtime |
| WARN | authenticated-full-canary | canary-write-gate | Canary writes disabled: PRAXIS_DOCTOR_WRITE_CANARY=1, PRAXIS_CANARY_EMAIL or TEST_FIREBASE_EMAIL, PRAXIS_CANARY_PASSWORD or TEST_FIREBASE_PASSWORD |

## Evidence And Remediation

### PASS repo-branch

Evidence:

- `main`

### PASS repo-commit

Evidence:

- `3616be79b1e5d4999506c51f3b74147b1a6de21e`

### WARN repo-dirty-state

Evidence:

- `M docs/audits/2026-05-19-launch-readiness.json M docs/audits/2026-05-19-launch-readiness.md M scripts/audit-capsule-contract.ts M src/app/api/ai/chat/route.ts M src/app/api/context/resolve/route.ts M src/app/api/health/features/route.ts M src/components/praxis/tasklet-praxis-workbench.tsx M src/lib/ai/context-kernel.ts M src/lib/genkit/flows/capsule-factory.ts M src/lib/genkit/schemas/capsule-factory.ts M tests/unit/lib/genkit/capsule-factory-flow.test.ts ?? docs/audits/2026-05-19-database-seren`

### PASS repo-origin-sync

Evidence:

- `0 0`

### PASS typecheck

Evidence:

- `> tacitus-app@6.4.1 typecheck > tsc --noEmit`

### FAIL build

Evidence:

- `> tacitus-app@6.4.1 build > next build Suggestion: Wait for the build to complete.`

Remediation:

- `npm run build`

### PASS lint

Evidence:

- `> tacitus-app@6.4.1 lint > eslint C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work\scripts\audit-ai-provider-isolation.ts 1:10 warning 'existsSync' is defined but never used. Allowed unused vars must match /^_/u @typescript-eslint/no-unused-vars C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work\src\app\api\situations\route.ts 47:10 warning 'isRecord' is defined but never used. Allowed unused vars must match /^_/u @typescript-eslint/no-unused-vars C:\Users\giuli\ANTIGRAVI`

### PASS vitest-run-tests-unit-lib-agent-runtime-tests-unit-lib-health

Evidence:

- `[1m[46m RUN [49m[22m [36mv4.1.1 [39m[90mC:/Users/giuli/ANTIGRAVITY/PRAXISMAY2026/A4_PRAXIS_CLOUD_Work[39m [2m Test Files [22m [1m[32m13 passed[39m[22m[90m (13)[39m [2m Tests [22m [1m[32m47 passed[39m[22m[90m (47)[39m [2m Start at [22m 01:15:38 [2m Duration [22m 12.92s[2m (transform 4.87s, setup 711ms, import 33.77s, tests 1.35s, environment 5ms)[22m`

### PASS audit-ai-routes-mjs

Evidence:

- `OK - 60 AI route files, 60 calibrated, 10 exempt (static-marker).`

### PASS audit-repo-shape

Evidence:

- `> tacitus-app@6.4.1 audit:repo-shape > tsx scripts/audit-repo-shape.ts Repo shape audit passed. (static-marker)`

### PASS audit-gcp

Evidence:

- `> tacitus-app@6.4.1 audit:gcp > node scripts/audit-gcp.mjs OK [api] Vertex AI API enabled OK [api] Firestore API enabled OK [api] Cloud Run API enabled OK [api] Cloud Build API enabled OK [api] Pub/Sub API enabled OK [api] Cloud Functions API enabled OK [api] Cloud Scheduler API enabled OK [api] Cloud Tasks API enabled OK [api] Cloud SQL Admin API enabled OK [api] Service Networking API enabled OK [api] Secret Manager API enabled OK [api] BigQuery API enabled OK [api] Artifact Registry API enabl`

### PASS audit-gate

Evidence:

- `> tacitus-app@6.4.1 audit:gate > npm run typecheck && npm run build && npm run audit:routes && npm run audit:capsule-contract && npm run audit:capsule-memory-contract && npm run audit:output-capsule-storage && npm run audit:agent-process-contract && npm run audit:agent-runtime-proof && npm run audit:knowledge-library-contract && npm run audit:named-stack-contract && npm run audit:graph-proposal-review-contract && npm run audit:architecture-chain && npm run audit:repo-shape && npm run audit:archi`

### PASS auth-doctor

Evidence:

- `> tacitus-app@6.4.1 auth:doctor > tsx scripts/auth-doctor.ts OK gcloud CLI: installed OK gcloud active account: giulio@tacitus.me OK gcloud project config: praxisbytacitus OK gcloud project access: praxisbytacitus OK Application Default Credentials: valid OK Firebase CLI login: Logged in as giulio@tacitus.me OK Firebase project binding: praxisbytacitus`

### PASS cloud-run-praxis-frontend

Evidence:

- `{"service":"praxis-frontend","latestReadyRevisionName":"praxis-frontend-00611-9sg","traffic":[{"revisionName":"praxis-frontend-00611-9sg","percent":100,"latestRevision":true}],"ready":"True"}`

### PASS cloud-run-private-sql-networking

Evidence:

- `{"cloudSqlAttached":true,"directVpcEgress":true,"connectorEgress":false,"vpcEgress":"private-ranges-only"}`

### PASS agent-worker-runtime-env

Evidence:

- `{"workerBaseUrl":true,"workerOidc":true,"workerSecretFallback":false}`

### PASS agent-run-queue

Evidence:

- `name: projects/praxisbytacitus/locations/us-central1/queues/agent-runs rateLimits: maxBurstSize: 100 maxConcurrentDispatches: 1000 maxDispatchesPerSecond: 500.0 retryConfig: maxAttempts: 100 maxBackoff: 3600s maxDoublings: 16 minBackoff: 0.100s state: RUNNING`

### PASS cloud-sql-instance

Evidence:

- `availableMaintenanceVersions: - POSTGRES_16_13.R20260319.00_11 backendType: SECOND_GEN connectionName: praxisbytacitus:us-east4:praxisbytacitus-instance createTime: '2026-04-27T01:27:56.130Z' databaseInstalledVersion: POSTGRES_16_13 databaseVersion: POSTGRES_16 etag: 40c0d7cd7b17343dcf70a5d37e42593ccfeb9d8f8e159af098106c75ad50a68e gceZone: us-east4-a geminiConfig: activeQueryEnabled: false entitled: false googleVacuumMgmtEnabled: false indexAdvisorEnabled: false oomSessionCancelEnabled: true inc`

### PASS firestore-database

Evidence:

- `appEngineIntegrationMode: DISABLED concurrencyMode: PESSIMISTIC createTime: '2026-03-22T15:19:16.119019Z' databaseEdition: STANDARD deleteProtectionState: DELETE_PROTECTION_DISABLED earliestVersionTime: '2026-05-19T04:28:32.174933Z' etag: INrQp5nPxJQDMPSV+ZPz+pMD freeTier: true keyPrefix: s locationId: nam5 name: projects/praxisbytacitus/databases/(default) pointInTimeRecoveryEnablement: POINT_IN_TIME_RECOVERY_DISABLED realtimeUpdatesMode: REALTIME_UPDATES_MODE_ENABLED type: FIRESTORE_NATIVE uid`

### PASS secret-manager-cookie

Evidence:

- `createTime: '2026-04-07T08:17:46.521837Z' etag: '"164eda6b17fc8e"' name: projects/852128226674/secrets/praxis-cookie-secret replication: automatic: {}`

### PASS secret-manager-cron

Evidence:

- `createTime: '2026-04-07T08:17:45.058498Z' etag: '"164eda6b01c613"' name: projects/852128226674/secrets/praxis-cron-secret replication: automatic: {}`

### PASS pubsub-profile-events

Evidence:

- `name: projects/praxisbytacitus/topics/profile.events`

### PASS pubsub-praxis-events

Evidence:

- `name: projects/praxisbytacitus/topics/praxis.events`

### PASS scheduler-jobs

Evidence:

- `Listed 0 items.`

### PASS agent-service-account

Evidence:

- `displayName: praxis-agents-sa email: [REDACTED_SERVICE_ACCOUNT] etag: MDEwMjE5MjA= name: projects/praxisbytacitus/serviceAccounts/[REDACTED_SERVICE_ACCOUNT] oauth2ClientId: '102747481615041284250' projectId: praxisbytacitus uniqueId: '102747481615041284250'`

### PASS production-home

Evidence:

- `{"status":200}`

### PASS production-login

Evidence:

- `{"status":200}`

### WARN health-core

Evidence:

- `{"status":"ok","timestamp":"2026-05-19T05:28:48.189Z","checks":{"firestore":"ok","ai_provider":"ok","cookie_secret":"ok","vertex_adk":"ok","cognee_memory":"unconfigured","polar":"unconfigured"},"safeguards":{"authenticatedRateLimitPerMinute":100,"aiRequestLimits":{"maxBytes":750000,"maxMessages":50,"maxTextChars":250000},"highCostAiRoutesRequireAuth":true,"calibratedAiRoutesStartToolRuns":true,"genkitProvider":"vertex","genkitLocation":"us-central1","cogneeMemoryEnabled":false,"cogneeMode":"disa`

### PASS health-runtime

Evidence:

- `{"status":"ok","summary":"Systems ready","checkedAt":"2026-05-19T05:28:48.377Z","debugHref":"/app/settings?tab=system","checks":[{"id":"frontend","label":"Frontend runtime","status":"ok","latencyMs":65},{"id":"firestore","label":"Firestore","status":"ok"},{"id":"backend","label":"Private backend","status":"ok"},{"id":"agent_ledger","label":"Deep work queue","status":"ok"},{"id":"agent_queue","label":"Agent task queue","status":"ok","latencyMs":65},{"id":"agent_worker","label":"Agent worker dispa`

### WARN canary-write-gate

Evidence:

- `{"tag":"praxis-doctor-canary-20260519T051239730Z","email":null}`

Remediation:

- `Set PRAXIS_DOCTOR_WRITE_CANARY=1`
- `Set PRAXIS_CANARY_EMAIL and PRAXIS_CANARY_PASSWORD for the isolated canary account`

## Canary Artifacts

- blocked: doctor-canary-workflow `praxis-doctor-canary-20260519T051239730Z`

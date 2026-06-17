# PRAXIS Doctor - 2026-06-17

- Run ID: `doctor-20260617T024908008Z`
- Base URL: `https://praxis.tacitus.me`
- Project: `praxisbytacitus`
- Region: `us-central1`
- Branch: `main`
- Commit: `74750be36c5440135a591c1774bbd10130c2bfee`
- Cloud Run revision: `praxis-frontend-01006-wmd`
- Diagnostics status: `blocked`
- Stale diagnostic artifacts: `2`
- Summary: PASS=27, WARN=4, FAIL=0, BLOCKED=1

## Red Flags

| Severity | Lane | Finding | Summary |
| --- | --- | --- | --- |
| warn | security-dependency | Dependency advisory summary | 34 advisory group(s) require forced or breaking updates |
| blocked | needs-auth | Local cloud auth | npm run auth:doctor exited 1; local only while production runtime and agentic-search health are ready. |
| warn | canary-gated | Authenticated canary gate | Canary writes disabled: PRAXIS_DOCTOR_WRITE_CANARY=1, PRAXIS_CANARY_EMAIL or TEST_FIREBASE_EMAIL, PRAXIS_CANARY_PASSWORD or TEST_FIREBASE_PASSWORD |
| warn | stale-artifact | Stale diagnostic artifacts | 2 saved doctor/eval artifact(s) do not match HEAD or the latest ready Cloud Run revision. |

## Checks

| Status | Lane | Check | Summary |
| --- | --- | --- | --- |
| PASS | repo-and-deployability | repo-branch | Repo is on main |
| PASS | repo-and-deployability | repo-commit | Commit SHA resolved |
| WARN | repo-and-deployability | repo-dirty-state | Working tree has uncommitted changes |
| PASS | repo-and-deployability | repo-origin-sync | origin/main...HEAD = 0	0 |
| PASS | repo-and-deployability | typecheck | npm run typecheck passed |
| PASS | repo-and-deployability | build | npm run build passed |
| PASS | repo-and-deployability | lint | npm run lint passed |
| PASS | repo-and-deployability | vitest-run-tests-unit-lib-agent-runtime-tests-unit-lib-health | npx vitest run tests/unit/lib/agent-runtime tests/unit/lib/health passed |
| PASS | repo-and-deployability | audit-ai-routes-mjs | node scripts/audit-ai-routes.mjs passed |
| PASS | repo-and-deployability | audit-repo-shape | npm run audit:repo-shape passed |
| PASS | repo-and-deployability | audit-gcp | npm run audit:gcp passed |
| PASS | repo-and-deployability | audit-gate | npm run audit:gate passed |
| WARN | repo-and-deployability | package-audit-summary | 34 advisory group(s) require forced or breaking updates |
| BLOCKED | local-cloud-auth | auth-doctor | npm run auth:doctor exited 1 |
| PASS | gcp-firebase-infrastructure | cloud-run-praxis-frontend | praxis-frontend serving praxis-frontend-01006-wmd |
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
| PASS | live-production-health | health-agentic-search | HTTP 200 from https://praxis.tacitus.me/api/health/agentic-search |
| WARN | authenticated-full-canary | canary-write-gate | Canary writes disabled: PRAXIS_DOCTOR_WRITE_CANARY=1, PRAXIS_CANARY_EMAIL or TEST_FIREBASE_EMAIL, PRAXIS_CANARY_PASSWORD or TEST_FIREBASE_PASSWORD |

## Evidence And Remediation

### PASS repo-branch

Evidence:

- `main`

### PASS repo-commit

Evidence:

- `74750be36c5440135a591c1774bbd10130c2bfee`

### WARN repo-dirty-state

Evidence:

- `M CLAUDE.md M docs/audits/LATEST-DEEP_PRESHIP_CHECKLIST.json M docs/audits/LATEST-DEEP_PRESHIP_CHECKLIST.md M docs/audits/LATEST-capsule-consolidation-audit.json M docs/audits/LATEST-capsule-consolidation-audit.md M docs/audits/LATEST-capsule-database-audit.json M docs/audits/LATEST-capsule-database-audit.md M docs/audits/LATEST-capsule-depth-audit.json M docs/audits/LATEST-capsule-depth-audit.md M docs/audits/LATEST-capsule-graphlite-projections-audit.json M docs/audits/LATEST-capsule-graphlite`

### PASS repo-origin-sync

Evidence:

- `0 0`

### PASS typecheck

Evidence:

- `> tacitus-app@6.5.0 typecheck > tsc --noEmit`

### PASS build

Evidence:

- `> tacitus-app@6.5.0 build > next build ▲ Next.js 16.2.6 (Turbopack) - Experiments (use with caution): · serverActions Creating an optimized production build ... ✓ Compiled successfully in 30.5s Running TypeScript ... Finished TypeScript in 26.9s ... Collecting page data using 7 workers ... Generating static pages using 7 workers (0/168) ... Generating static pages using 7 workers (42/168) Generating static pages using 7 workers (84/168) Generating static pages using 7 workers (126/168) ✓ Generat`

### PASS lint

Evidence:

- `> tacitus-app@6.5.0 lint > eslint`

### PASS vitest-run-tests-unit-lib-agent-runtime-tests-unit-lib-health

Evidence:

- `[1m[46m RUN [49m[22m [36mv4.1.1 [39m[90mC:/Users/giuli/tacitus-products/praxis[39m [2m Test Files [22m [1m[32m27 passed[39m[22m[90m (27)[39m [2m Tests [22m [1m[32m124 passed[39m[22m[90m (124)[39m [2m Start at [22m 22:51:13 [2m Duration [22m 9.66s[2m (transform 4.02s, setup 320ms, import 26.57s, tests 948ms, environment 5ms)[22m`

### PASS audit-ai-routes-mjs

Evidence:

- `OK - 61 AI route files, 61 calibrated, 10 exempt (static-marker).`

### PASS audit-repo-shape

Evidence:

- `> tacitus-app@6.5.0 audit:repo-shape > tsx scripts/audit-repo-shape.ts Repo shape audit passed. (static-marker)`

### PASS audit-gcp

Evidence:

- `> tacitus-app@6.5.0 audit:gcp > node scripts/audit-gcp.mjs OK [api] Vertex AI API enabled OK [api] Firestore API enabled OK [api] Cloud Run API enabled OK [api] Cloud Build API enabled OK [api] Pub/Sub API enabled OK [api] Cloud Functions API enabled OK [api] Cloud Scheduler API enabled OK [api] Cloud Tasks API enabled OK [api] Cloud SQL Admin API enabled OK [api] Service Networking API enabled OK [api] Secret Manager API enabled OK [api] BigQuery API enabled OK [api] Artifact Registry API enabl`

### PASS audit-gate

Evidence:

- `> tacitus-app@6.5.0 audit:gate > tsx scripts/audit-runner.ts gate [audit-runner] starting gate (9 steps) [audit-runner] dropped duplicate audit leaves: [audit-runner] - audit:path-coverage -> audit:path-tool-coverage: duplicate package alias removed; path-tool coverage remains the durable leaf [audit-runner] TypeScript: npm run typecheck > tacitus-app@6.5.0 typecheck > tsc --noEmit [audit-runner] Production build: npm run build > tacitus-app@6.5.0 build > next build ▲ Next.js 16.2.6 (Turbopack) `

### WARN package-audit-summary

Evidence:

- `{"total":67,"forcedOrBreaking":34}`

Remediation:

- `Review npm audit --json before forced or SemVer-major dependency changes.`

### BLOCKED auth-doctor

Evidence:

- `> tacitus-app@6.5.0 auth:doctor > tsx scripts/auth-doctor.ts OK gcloud CLI: installed OK gcloud active account: giulio@tacitus.me OK gcloud project config: praxisbytacitus OK gcloud project access: praxisbytacitus FAIL Application Default Credentials: ERROR: (gcloud.auth.application-default.print-access-token) There was a problem refreshing your current auth tokens: Reauthentication failed. cannot prompt during non-interactive execution. OK Firebase CLI login: Logged in as giulio@tacitus.me OK F`

Remediation:

- `gcloud auth application-default login --project=praxisbytacitus`
- `firebase login --reauth`
- `npm run auth:doctor -- --fix`

### PASS cloud-run-praxis-frontend

Evidence:

- `{"service":"praxis-frontend","latestReadyRevisionName":"praxis-frontend-01006-wmd","traffic":[{"revisionName":"praxis-frontend-01006-wmd","percent":100,"latestRevision":true}],"ready":"True"}`

### PASS cloud-run-private-sql-networking

Evidence:

- `{"cloudSqlAttached":true,"directVpcEgress":true,"connectorEgress":false,"vpcEgress":"private-ranges-only"}`

### PASS agent-worker-runtime-env

Evidence:

- `{"workerBaseUrl":true,"workerOidc":true,"workerSecretFallback":false}`

### PASS agent-run-queue

Evidence:

- `name: projects/praxisbytacitus/locations/us-central1/queues/agent-runs rateLimits: maxBurstSize: 10 maxConcurrentDispatches: 5 maxDispatchesPerSecond: 2.0 retryConfig: maxAttempts: 3 maxBackoff: 300s maxDoublings: 16 minBackoff: 60s state: RUNNING`

### PASS cloud-sql-instance

Evidence:

- `availableMaintenanceVersions: - POSTGRES_16_14.R20260319.07_04 backendType: SECOND_GEN connectionName: praxisbytacitus:us-east4:praxisbytacitus-instance createTime: '2026-04-27T01:27:56.130Z' databaseInstalledVersion: POSTGRES_16_13 databaseVersion: POSTGRES_16 etag: f3c73ab6a9c6ed6089d3e7d9c510d2e93a7e81c2494653eebd326e7b3e73c514 gceZone: us-east4-a geminiConfig: activeQueryEnabled: false entitled: false googleVacuumMgmtEnabled: false indexAdvisorEnabled: false oomSessionCancelEnabled: true inc`

### PASS firestore-database

Evidence:

- `appEngineIntegrationMode: DISABLED concurrencyMode: PESSIMISTIC createTime: '2026-03-22T15:19:16.119019Z' databaseEdition: STANDARD deleteProtectionState: DELETE_PROTECTION_DISABLED earliestVersionTime: '2026-06-17T01:56:18.441640Z' etag: IKCmmKGjjZUDMPSV+ZPz+pMD freeTier: true keyPrefix: s locationId: nam5 name: projects/praxisbytacitus/databases/(default) pointInTimeRecoveryEnablement: POINT_IN_TIME_RECOVERY_DISABLED realtimeUpdatesMode: REALTIME_UPDATES_MODE_ENABLED type: FIRESTORE_NATIVE uid`

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

- `ID LOCATION SCHEDULE (TZ) TARGET_TYPE STATE praxis-agent-runs-sweep us-central1 */15 * * * * (Etc/UTC) HTTP ENABLED`

### PASS agent-service-account

Evidence:

- `displayName: praxis-agents-sa email: [REDACTED_SERVICE_ACCOUNT] etag: MDEwMjE5MjA= name: projects/praxisbytacitus/serviceAccounts/[REDACTED_SERVICE_ACCOUNT] oauth2ClientId: '102747481615041284250' projectId: praxisbytacitus uniqueId: '102747481615041284250'`

### PASS production-home

Evidence:

- `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/chunks/0mkwon~zrafqq.css" nonce="mAC+M5TX//V98gOZs1ybAQ==" data-precedence="next"/><link rel="stylesheet" href="/_next/static/chunks/038il8mta7f6-.css" nonce="mAC+M5TX//V98gOZs1ybAQ==" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" nonce="mAC+M5TX//V98gOZs1ybAQ==" href="/_next/static/chunks/0za5jky`

### PASS production-login

Evidence:

- `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/chunks/0mkwon~zrafqq.css" nonce="0TVm5ZFFrv514A4JH3TxPg==" data-precedence="next"/><link rel="stylesheet" href="/_next/static/chunks/038il8mta7f6-.css" nonce="0TVm5ZFFrv514A4JH3TxPg==" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" nonce="0TVm5ZFFrv514A4JH3TxPg==" href="/_next/static/chunks/0za5jky`

### WARN health-core

Evidence:

- `{"status":"ok","timestamp":"2026-06-17T02:56:29.578Z","checks":{"firestore":"ok","ai_provider":"ok","cookie_secret":"ok","vertex_adk":"ok","cognee_memory":"unconfigured","graphlite_context":"unconfigured","trustgraph_context":"unconfigured","polar":"unconfigured"},"safeguards":{"authenticatedRateLimitPerMinute":100,"aiRequestLimits":{"maxBytes":750000,"maxMessages":50,"maxTextChars":250000},"highCostAiRoutesRequireAuth":true,"calibratedAiRoutesStartToolRuns":true,"genkitProvider":"vertex","genki`

### PASS health-runtime

Evidence:

- `{"status":"ok","summary":"Systems ready","checkedAt":"2026-06-17T02:56:29.802Z","debugHref":"/app/settings?tab=system","build":{"source":"manual-codex-main-safe","repository":"sargonxg/A4_PRAXIS_CLOUD_Work","branch":"main","commit":"74750be36c5440135a591c1774bbd10130c2bfee","buildId":"a2bdb912-82f9-4ef2-ab45-1df5bcea2ed3","revision":"praxis-frontend-01006-wmd","service":"praxis-frontend"},"checks":[{"id":"frontend","label":"Frontend runtime","status":"ok","latencyMs":70},{"id":"firestore","label`

### PASS health-agentic-search

Evidence:

- `{"status":"ready","summary":"Agentic search ready","checkedAt":"2026-06-17T02:56:29.860Z","missing":[],"checks":[{"id":"ledger","label":"Cloud SQL run ledger","status":"ready","names":["AGENT_RUNTIME_DATABASE_URL","PRAXIS_DATABASE_URL","DATABASE_URL"],"missing":[],"detail":"AgentRun ledger can persist runs, events, tool calls, approvals, and artifacts.","required":true},{"id":"cloud_tasks_queue","label":"Cloud Tasks queue","status":"ready","names":["AGENT_RUN_TASKS_PROJECT","AGENT_RUN_TASKS_LOCA`

### WARN canary-write-gate

Evidence:

- `{"tag":"praxis-doctor-canary-20260617T024908008Z","email":null}`

Remediation:

- `Set PRAXIS_DOCTOR_WRITE_CANARY=1`
- `Set PRAXIS_CANARY_EMAIL and PRAXIS_CANARY_PASSWORD for the isolated canary account`

## Canary Artifacts

- blocked: doctor-canary-workflow `praxis-doctor-canary-20260617T024908008Z`

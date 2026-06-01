# PRAXIS Doctor - 2026-05-31

- Run ID: `doctor-20260531T212037986Z`
- Base URL: `https://praxis.tacitus.me`
- Project: `praxisbytacitus`
- Region: `us-central1`
- Branch: `main`
- Commit: `92212a94c7962a1a342f1653b903e4195f68e3b7`
- Cloud Run revision: `praxis-frontend-00959-rkp`
- Diagnostics status: `blocked`
- Stale diagnostic artifacts: `7`
- Summary: PASS=28, WARN=3, FAIL=0, BLOCKED=1

## Red Flags

| Severity | Lane | Finding | Summary |
| --- | --- | --- | --- |
| warn | security-dependency | Dependency advisory summary | 5 advisory group(s) require forced or breaking updates |
| blocked | needs-auth | Local cloud auth | npm run auth:doctor exited 1; local only while production runtime and agentic-search health are ready. |
| warn | canary-gated | Authenticated canary gate | Canary writes disabled: PRAXIS_DOCTOR_WRITE_CANARY=1, PRAXIS_CANARY_EMAIL or TEST_FIREBASE_EMAIL, PRAXIS_CANARY_PASSWORD or TEST_FIREBASE_PASSWORD |
| warn | stale-artifact | Stale diagnostic artifacts | 7 saved doctor/eval artifact(s) do not match HEAD or the latest ready Cloud Run revision. |

## Checks

| Status | Lane | Check | Summary |
| --- | --- | --- | --- |
| PASS | repo-and-deployability | repo-branch | Repo is on main |
| PASS | repo-and-deployability | repo-commit | Commit SHA resolved |
| PASS | repo-and-deployability | repo-dirty-state | Working tree is clean |
| PASS | repo-and-deployability | repo-origin-sync | origin/main...HEAD = 0	0 |
| PASS | repo-and-deployability | typecheck | npm run typecheck passed |
| PASS | repo-and-deployability | build | npm run build passed |
| PASS | repo-and-deployability | lint | npm run lint passed |
| PASS | repo-and-deployability | vitest-run-tests-unit-lib-agent-runtime-tests-unit-lib-health | npx vitest run tests/unit/lib/agent-runtime tests/unit/lib/health passed |
| PASS | repo-and-deployability | audit-ai-routes-mjs | node scripts/audit-ai-routes.mjs passed |
| PASS | repo-and-deployability | audit-repo-shape | npm run audit:repo-shape passed |
| PASS | repo-and-deployability | audit-gcp | npm run audit:gcp passed |
| PASS | repo-and-deployability | audit-gate | npm run audit:gate passed |
| WARN | repo-and-deployability | package-audit-summary | 5 advisory group(s) require forced or breaking updates |
| BLOCKED | local-cloud-auth | auth-doctor | npm run auth:doctor exited 1 |
| PASS | gcp-firebase-infrastructure | cloud-run-praxis-frontend | praxis-frontend serving praxis-frontend-00959-rkp |
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

- `92212a94c7962a1a342f1653b903e4195f68e3b7`

### PASS repo-dirty-state

Evidence:

- `clean`

### PASS repo-origin-sync

Evidence:

- `0 0`

### PASS typecheck

Evidence:

- `> tacitus-app@6.4.1 typecheck > tsc --noEmit`

### PASS build

Evidence:

- `> tacitus-app@6.4.1 build > next build ▲ Next.js 16.2.6 (Turbopack) - Experiments (use with caution): · serverActions Creating an optimized production build ... ✓ Compiled successfully in 48s Running TypeScript ... Finished TypeScript in 55s ... Collecting page data using 7 workers ... Generating static pages using 7 workers (0/167) ... Generating static pages using 7 workers (41/167) Generating static pages using 7 workers (83/167) Generating static pages using 7 workers (125/167) ✓ Generating `

### PASS lint

Evidence:

- `> tacitus-app@6.4.1 lint > eslint`

### PASS vitest-run-tests-unit-lib-agent-runtime-tests-unit-lib-health

Evidence:

- `[1m[46m RUN [49m[22m [36mv4.1.1 [39m[90mC:/Users/giuli/A4_PRAXIS_CLOUD_Work[39m [2m Test Files [22m [1m[32m23 passed[39m[22m[90m (23)[39m [2m Tests [22m [1m[32m93 passed[39m[22m[90m (93)[39m [2m Start at [22m 17:24:52 [2m Duration [22m 13.63s[2m (transform 4.54s, setup 387ms, import 40.67s, tests 1.09s, environment 7ms)[22m`

### PASS audit-ai-routes-mjs

Evidence:

- `OK - 61 AI route files, 61 calibrated, 10 exempt (static-marker).`

### PASS audit-repo-shape

Evidence:

- `> tacitus-app@6.4.1 audit:repo-shape > tsx scripts/audit-repo-shape.ts Repo shape audit passed. (static-marker)`

### PASS audit-gcp

Evidence:

- `> tacitus-app@6.4.1 audit:gcp > node scripts/audit-gcp.mjs OK [api] Vertex AI API enabled OK [api] Firestore API enabled OK [api] Cloud Run API enabled OK [api] Cloud Build API enabled OK [api] Pub/Sub API enabled OK [api] Cloud Functions API enabled OK [api] Cloud Scheduler API enabled OK [api] Cloud Tasks API enabled OK [api] Cloud SQL Admin API enabled OK [api] Service Networking API enabled OK [api] Secret Manager API enabled OK [api] BigQuery API enabled OK [api] Artifact Registry API enabl`

### PASS audit-gate

Evidence:

- `> tacitus-app@6.4.1 audit:gate > tsx scripts/audit-runner.ts gate [audit-runner] starting gate (32 steps) [audit-runner] TypeScript: npm run typecheck > tacitus-app@6.4.1 typecheck > tsc --noEmit [audit-runner] Production build: npm run build > tacitus-app@6.4.1 build > next build ▲ Next.js 16.2.6 (Turbopack) - Experiments (use with caution): · serverActions Creating an optimized production build ... ✓ Compiled successfully in 54s Running TypeScript ... Finished TypeScript in 71s ... Collecting `

### WARN package-audit-summary

Evidence:

- `{"total":5,"forcedOrBreaking":5}`

Remediation:

- `Review npm audit --json before forced or SemVer-major dependency changes.`

### BLOCKED auth-doctor

Evidence:

- `> tacitus-app@6.4.1 auth:doctor > tsx scripts/auth-doctor.ts OK gcloud CLI: installed OK gcloud active account: giulio@tacitus.me OK gcloud project config: praxisbytacitus OK gcloud project access: praxisbytacitus FAIL Application Default Credentials: ERROR: (gcloud.auth.application-default.print-access-token) There was a problem refreshing your current auth tokens: Reauthentication failed. cannot prompt during non-interactive execution. OK Firebase CLI login: Logged in as giulio@tacitus.me OK F`

Remediation:

- `gcloud auth application-default login --project=praxisbytacitus`
- `firebase login --reauth`
- `npm run auth:doctor -- --fix`

### PASS cloud-run-praxis-frontend

Evidence:

- `{"service":"praxis-frontend","latestReadyRevisionName":"praxis-frontend-00959-rkp","traffic":[{"revisionName":"praxis-frontend-00959-rkp","percent":100,"latestRevision":true}],"ready":"True"}`

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

- `availableMaintenanceVersions: - POSTGRES_16_13.R20260319.00_14 backendType: SECOND_GEN connectionName: praxisbytacitus:us-east4:praxisbytacitus-instance createTime: '2026-04-27T01:27:56.130Z' databaseInstalledVersion: POSTGRES_16_13 databaseVersion: POSTGRES_16 etag: 5e6d0ceb310dc4bd5b4020fb6636fea5ff5e1c77d785895c6bb103e12d4e54ab gceZone: us-east4-a geminiConfig: activeQueryEnabled: false entitled: false googleVacuumMgmtEnabled: false indexAdvisorEnabled: false oomSessionCancelEnabled: true inc`

### PASS firestore-database

Evidence:

- `appEngineIntegrationMode: DISABLED concurrencyMode: PESSIMISTIC createTime: '2026-03-22T15:19:16.119019Z' databaseEdition: STANDARD deleteProtectionState: DELETE_PROTECTION_DISABLED earliestVersionTime: '2026-05-31T20:33:31.785711Z' etag: ILW14aK95JQDMPSV+ZPz+pMD freeTier: true keyPrefix: s locationId: nam5 name: projects/praxisbytacitus/databases/(default) pointInTimeRecoveryEnablement: POINT_IN_TIME_RECOVERY_DISABLED realtimeUpdatesMode: REALTIME_UPDATES_MODE_ENABLED type: FIRESTORE_NATIVE uid`

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

- `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/chunks/0mkwon~zrafqq.css" nonce="AxHp/NAdEMMwQ90nId9nog==" data-precedence="next"/><link rel="stylesheet" href="/_next/static/chunks/171jp08371xyf.css" nonce="AxHp/NAdEMMwQ90nId9nog==" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" nonce="AxHp/NAdEMMwQ90nId9nog==" href="/_next/static/chunks/0buu2wb`

### PASS production-login

Evidence:

- `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preload" href="/_next/static/media/70bc3e132a0a741e-s.p.1409xf.ylxg8g.woff2" as="font" crossorigin="" type="font/woff2"/><link rel="preload" href="/_next/static/media/83afe278b6a6bb3c-s.p.0q-301v4kxxnr.woff2" as="font" crossorigin="" type="font/woff2"/><link rel="preload" href="/_next/static/media/e4505858a30c79c2-s.p.14m88r~v.m-cq.woff2" as="font" crossorig`

### WARN health-core

Evidence:

- `{"status":"ok","timestamp":"2026-05-31T21:33:45.083Z","checks":{"firestore":"ok","ai_provider":"ok","cookie_secret":"ok","vertex_adk":"ok","cognee_memory":"unconfigured","graphlite_context":"unconfigured","trustgraph_context":"unconfigured","polar":"unconfigured"},"safeguards":{"authenticatedRateLimitPerMinute":100,"aiRequestLimits":{"maxBytes":750000,"maxMessages":50,"maxTextChars":250000},"highCostAiRoutesRequireAuth":true,"calibratedAiRoutesStartToolRuns":true,"genkitProvider":"vertex","genki`

### PASS health-runtime

Evidence:

- `{"status":"ok","summary":"Systems ready","checkedAt":"2026-05-31T21:33:45.259Z","debugHref":"/app/settings?tab=system","build":{"source":"frontend-main-on-push","repository":"sargonxg/A4_PRAXIS_CLOUD_Work","branch":"main","commit":"92212a94c7962a1a342f1653b903e4195f68e3b7","buildId":"b3336eaa-fcf1-4407-bcbd-af26aa219b05","revision":"praxis-frontend-00959-rkp","service":"praxis-frontend"},"checks":[{"id":"frontend","label":"Frontend runtime","status":"ok","latencyMs":66},{"id":"firestore","label"`

### PASS health-agentic-search

Evidence:

- `{"status":"ready","summary":"Agentic search ready","checkedAt":"2026-05-31T21:33:45.331Z","missing":[],"checks":[{"id":"ledger","label":"Cloud SQL run ledger","status":"ready","names":["AGENT_RUNTIME_DATABASE_URL","PRAXIS_DATABASE_URL","DATABASE_URL"],"missing":[],"detail":"AgentRun ledger can persist runs, events, tool calls, approvals, and artifacts.","required":true},{"id":"cloud_tasks_queue","label":"Cloud Tasks queue","status":"ready","names":["AGENT_RUN_TASKS_PROJECT","AGENT_RUN_TASKS_LOCA`

### WARN canary-write-gate

Evidence:

- `{"tag":"praxis-doctor-canary-20260531T212037986Z","email":null}`

Remediation:

- `Set PRAXIS_DOCTOR_WRITE_CANARY=1`
- `Set PRAXIS_CANARY_EMAIL and PRAXIS_CANARY_PASSWORD for the isolated canary account`

## Canary Artifacts

- blocked: doctor-canary-workflow `praxis-doctor-canary-20260531T212037986Z`

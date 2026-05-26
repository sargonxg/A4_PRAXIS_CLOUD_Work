# PRAXIS Doctor - 2026-05-26

- Run ID: `doctor-20260526T181935647Z`
- Base URL: `https://praxis.tacitus.me`
- Project: `praxisbytacitus`
- Region: `us-central1`
- Branch: `main`
- Commit: `c3638815dd4d1ba0a4cf53e0a48ffc12e93e5644`
- Cloud Run revision: `unknown`
- Diagnostics status: `blocked`
- Stale diagnostic artifacts: `5`
- Summary: PASS=8, WARN=2, FAIL=0, BLOCKED=2

## Red Flags

| Severity | Lane | Finding | Summary |
| --- | --- | --- | --- |
| warn | security-dependency | Dependency advisory summary | 2 advisory group(s) require forced or breaking updates |
| blocked | needs-auth | Local cloud auth | npm run auth:doctor exited 1; local only while production runtime and agentic-search health are ready. |
| warn | canary-gated | Authenticated canary gate | Canary writes disabled: PRAXIS_DOCTOR_WRITE_CANARY=1, PRAXIS_CANARY_EMAIL or TEST_FIREBASE_EMAIL, PRAXIS_CANARY_PASSWORD or TEST_FIREBASE_PASSWORD |
| warn | stale-artifact | Stale diagnostic artifacts | 5 saved doctor/eval artifact(s) do not match HEAD or the latest ready Cloud Run revision. |

## Checks

| Status | Lane | Check | Summary |
| --- | --- | --- | --- |
| PASS | repo-and-deployability | repo-branch | Repo is on main |
| PASS | repo-and-deployability | repo-commit | Commit SHA resolved |
| PASS | repo-and-deployability | repo-dirty-state | Working tree is clean |
| PASS | repo-and-deployability | repo-origin-sync | origin/main...HEAD = 0	0 |
| WARN | repo-and-deployability | package-audit-summary | 2 advisory group(s) require forced or breaking updates |
| BLOCKED | local-cloud-auth | auth-doctor | npm run auth:doctor exited 1 |
| PASS | live-production-health | production-home | HTTP 200 from https://praxis.tacitus.me |
| PASS | live-production-health | production-login | HTTP 200 from https://praxis.tacitus.me/login |
| WARN | live-production-health | health-core | HTTP 200 from https://praxis.tacitus.me/api/health |
| PASS | live-production-health | health-runtime | HTTP 200 from https://praxis.tacitus.me/api/health/runtime |
| PASS | live-production-health | health-agentic-search | HTTP 200 from https://praxis.tacitus.me/api/health/agentic-search |
| BLOCKED | authenticated-full-canary | canary-write-gate | Canary writes disabled: PRAXIS_DOCTOR_WRITE_CANARY=1, PRAXIS_CANARY_EMAIL or TEST_FIREBASE_EMAIL, PRAXIS_CANARY_PASSWORD or TEST_FIREBASE_PASSWORD |

## Evidence And Remediation

### PASS repo-branch

Evidence:

- `main`

### PASS repo-commit

Evidence:

- `c3638815dd4d1ba0a4cf53e0a48ffc12e93e5644`

### PASS repo-dirty-state

Evidence:

- `clean`

### PASS repo-origin-sync

Evidence:

- `0 0`

### WARN package-audit-summary

Evidence:

- `{"total":2,"forcedOrBreaking":2}`

Remediation:

- `Review npm audit --json before forced or SemVer-major dependency changes.`

### BLOCKED auth-doctor

Evidence:

- `> tacitus-app@6.4.1 auth:doctor > tsx scripts/auth-doctor.ts OK gcloud CLI: installed OK gcloud active account: giulio@tacitus.me OK gcloud project config: praxisbytacitus OK gcloud project access: praxisbytacitus FAIL Application Default Credentials: ERROR: (gcloud.auth.application-default.print-access-token) There was a problem refreshing your current auth tokens: Reauthentication failed. cannot prompt during non-interactive execution. OK Firebase CLI login: Logged in as giulio@tacitus.me OK F`

Remediation:

- `gcloud auth application-default login --project=praxisbytacitus`
- `firebase login --reauth`
- `npm run auth:doctor -- --fix`

### PASS production-home

Evidence:

- `{"status":200}`

### PASS production-login

Evidence:

- `{"status":200}`

### WARN health-core

Evidence:

- `{"status":"ok","timestamp":"2026-05-26T18:19:50.774Z","checks":{"firestore":"ok","ai_provider":"ok","cookie_secret":"ok","vertex_adk":"ok","cognee_memory":"unconfigured","polar":"unconfigured"},"safeguards":{"authenticatedRateLimitPerMinute":100,"aiRequestLimits":{"maxBytes":750000,"maxMessages":50,"maxTextChars":250000},"highCostAiRoutesRequireAuth":true,"calibratedAiRoutesStartToolRuns":true,"genkitProvider":"vertex","genkitLocation":"us-central1","cogneeMemoryEnabled":false,"cogneeMode":"disa`

### PASS health-runtime

Evidence:

- `{"status":"ok","summary":"Systems ready","checkedAt":"2026-05-26T18:19:50.959Z","debugHref":"/app/settings?tab=system","build":{"source":"frontend-main-on-push","repository":"sargonxg/A4_PRAXIS_CLOUD_Work","branch":"main","commit":"b3f901513597c4819fc92ae17695f8e9d66b2fd4","buildId":"c0273ff4-cd5f-4abd-8bd2-f2237e9c1c63","revision":"praxis-frontend-00813-z5t","service":"praxis-frontend"},"checks":[{"id":"frontend","label":"Frontend runtime","status":"ok","latencyMs":74},{"id":"firestore","label"`

### PASS health-agentic-search

Evidence:

- `{"status":"ready","summary":"Agentic search ready","checkedAt":"2026-05-26T18:19:51.022Z","missing":[],"checks":[{"id":"ledger","label":"Cloud SQL run ledger","status":"ready","names":["AGENT_RUNTIME_DATABASE_URL","PRAXIS_DATABASE_URL","DATABASE_URL"],"missing":[],"detail":"AgentRun ledger can persist runs, events, tool calls, approvals, and artifacts.","required":true},{"id":"cloud_tasks_queue","label":"Cloud Tasks queue","status":"ready","names":["AGENT_RUN_TASKS_PROJECT","AGENT_RUN_TASKS_LOCA`

### BLOCKED canary-write-gate

Evidence:

- `{"tag":"praxis-doctor-canary-20260526T181935647Z","email":null}`

Remediation:

- `Set PRAXIS_DOCTOR_WRITE_CANARY=1`
- `Set PRAXIS_CANARY_EMAIL and PRAXIS_CANARY_PASSWORD for the isolated canary account`

## Canary Artifacts

- blocked: doctor-canary-workflow `praxis-doctor-canary-20260526T181935647Z`

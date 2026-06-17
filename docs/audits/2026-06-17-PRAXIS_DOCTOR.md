# PRAXIS Doctor - 2026-06-17

- Run ID: `doctor-20260617T033301630Z`
- Base URL: `https://praxis.tacitus.me`
- Project: `praxisbytacitus`
- Region: `us-central1`
- Branch: `main`
- Commit: `ed0f572a5940788d225712634c6947078e315830`
- Cloud Run revision: `unknown`
- Diagnostics status: `warn`
- Stale diagnostic artifacts: `1`
- Summary: PASS=11, WARN=3, FAIL=0, BLOCKED=0

## Red Flags

| Severity | Lane | Finding | Summary |
| --- | --- | --- | --- |
| warn | security-dependency | Dependency advisory summary | 34 advisory group(s) require forced or breaking updates |
| warn | stale-artifact | Stale diagnostic artifacts | 1 saved doctor/eval artifact(s) do not match HEAD or the latest ready Cloud Run revision. |

## Checks

| Status | Lane | Check | Summary |
| --- | --- | --- | --- |
| PASS | repo-and-deployability | repo-branch | Repo is on main |
| PASS | repo-and-deployability | repo-commit | Commit SHA resolved |
| WARN | repo-and-deployability | repo-dirty-state | Working tree has uncommitted changes |
| PASS | repo-and-deployability | repo-origin-sync | origin/main...HEAD = 0	0 |
| WARN | repo-and-deployability | package-audit-summary | 34 advisory group(s) require forced or breaking updates |
| PASS | local-cloud-auth | auth-doctor | npm run auth:doctor passed |
| PASS | live-production-health | production-home | HTTP 200 from https://praxis.tacitus.me |
| PASS | live-production-health | production-login | HTTP 200 from https://praxis.tacitus.me/login |
| WARN | live-production-health | health-core | HTTP 200 from https://praxis.tacitus.me/api/health |
| PASS | live-production-health | health-runtime | HTTP 200 from https://praxis.tacitus.me/api/health/runtime |
| PASS | live-production-health | health-agentic-search | HTTP 200 from https://praxis.tacitus.me/api/health/agentic-search |
| PASS | authenticated-full-canary | canary-write-gate | Canary writes enabled for praxis-golden-path-ci+20260617@tacitus.me |
| PASS | authenticated-full-canary | canary-authenticated-golden-path | Authenticated canary passed for praxis-golden-path-ci+20260617@tacitus.me: capsule praxis-doctor-canary-20260617T033301630Z, Ask thread praxis-doctor-canary-20260617T033301630Z-thread, AgentRun 96f311bc-fce8-4cf1-8cff-12b9f693e300, output memo_studio, memo praxis-doctor-canary-20260617T033301630Z__policy-memo, cleanup planned |
| PASS | authenticated-full-canary | canary-agent-run-stream | AgentRun 96f311bc-fce8-4cf1-8cff-12b9f693e300 stream verified after Cloud Tasks execution. |

## Evidence And Remediation

### PASS repo-branch

Evidence:

- `main`

### PASS repo-commit

Evidence:

- `ed0f572a5940788d225712634c6947078e315830`

### WARN repo-dirty-state

Evidence:

- `M CLAUDE.md M docs/audits/2026-06-17-PRAXIS_DOCTOR.json M docs/audits/2026-06-17-PRAXIS_DOCTOR.md M graphify-out/.graphify_root M graphify-out/GRAPH_REPORT.md M graphify-out/graph.json M graphify-out/manifest.json M src/components/capsules/viewers/CapsuleGraphViewer.tsx M src/components/capsules/workbench/CapsuleGraphSection.tsx M src/lib/context/capsule-workbench-view-model.ts M src/lib/product/context-capsules.ts M tests/unit/components/praxis/capsule-studio-contract.test.ts M tests/unit/lib/c`

### PASS repo-origin-sync

Evidence:

- `0 0`

### WARN package-audit-summary

Evidence:

- `{"total":67,"forcedOrBreaking":34}`

Remediation:

- `Review npm audit --json before forced or SemVer-major dependency changes.`

### PASS auth-doctor

Evidence:

- `> tacitus-app@6.5.0 auth:doctor > tsx scripts/auth-doctor.ts OK gcloud CLI: installed OK gcloud active account: giulio@tacitus.me OK gcloud project config: praxisbytacitus OK gcloud project access: praxisbytacitus OK Application Default Credentials: valid OK Firebase CLI login: Logged in as giulio@tacitus.me OK Firebase project binding: praxisbytacitus`

### PASS production-home

Evidence:

- `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/chunks/0mkwon~zrafqq.css" nonce="mIp4xQ3rTPmTOAmW046QMQ==" data-precedence="next"/><link rel="stylesheet" href="/_next/static/chunks/038il8mta7f6-.css" nonce="mIp4xQ3rTPmTOAmW046QMQ==" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" nonce="mIp4xQ3rTPmTOAmW046QMQ==" href="/_next/static/chunks/0za5jky`

### PASS production-login

Evidence:

- `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/chunks/0mkwon~zrafqq.css" nonce="dDusyIk+GCOthX5JxzCSfA==" data-precedence="next"/><link rel="stylesheet" href="/_next/static/chunks/038il8mta7f6-.css" nonce="dDusyIk+GCOthX5JxzCSfA==" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" nonce="dDusyIk+GCOthX5JxzCSfA==" href="/_next/static/chunks/0za5jky`

### WARN health-core

Evidence:

- `{"status":"ok","timestamp":"2026-06-17T03:33:14.580Z","checks":{"firestore":"ok","ai_provider":"ok","cookie_secret":"ok","vertex_adk":"ok","cognee_memory":"unconfigured","graphlite_context":"unconfigured","trustgraph_context":"unconfigured","polar":"unconfigured"},"safeguards":{"authenticatedRateLimitPerMinute":100,"aiRequestLimits":{"maxBytes":750000,"maxMessages":50,"maxTextChars":250000},"highCostAiRoutesRequireAuth":true,"calibratedAiRoutesStartToolRuns":true,"genkitProvider":"vertex","genki`

### PASS health-runtime

Evidence:

- `{"status":"ok","summary":"Systems ready","checkedAt":"2026-06-17T03:33:14.793Z","debugHref":"/app/settings?tab=system","build":{"source":"manual-codex-main-safe","repository":"sargonxg/A4_PRAXIS_CLOUD_Work","branch":"main","commit":"ed0f572a5940788d225712634c6947078e315830","buildId":"9fc49f44-7815-4b4d-ba71-50c1bb81758c","revision":"praxis-frontend-01007-x49","service":"praxis-frontend"},"checks":[{"id":"frontend","label":"Frontend runtime","status":"ok","latencyMs":85},{"id":"firestore","label`

### PASS health-agentic-search

Evidence:

- `{"status":"ready","summary":"Agentic search ready","checkedAt":"2026-06-17T03:33:14.845Z","missing":[],"checks":[{"id":"ledger","label":"Cloud SQL run ledger","status":"ready","names":["AGENT_RUNTIME_DATABASE_URL","PRAXIS_DATABASE_URL","DATABASE_URL"],"missing":[],"detail":"AgentRun ledger can persist runs, events, tool calls, approvals, and artifacts.","required":true},{"id":"cloud_tasks_queue","label":"Cloud Tasks queue","status":"ready","names":["AGENT_RUN_TASKS_PROJECT","AGENT_RUN_TASKS_LOCA`

### PASS canary-write-gate

Evidence:

- `{"tag":"praxis-doctor-canary-20260617T033301630Z","email":"praxis-golden-path-ci+20260617@tacitus.me"}`

### PASS canary-authenticated-golden-path

Evidence:

- `{"tag":"praxis-doctor-canary-20260617T033301630Z","email":"praxis-golden-path-ci+20260617@tacitus.me","capsuleId":"praxis-doctor-canary-20260617T033301630Z","threadId":"praxis-doctor-canary-20260617T033301630Z-thread","runId":"96f311bc-fce8-4cf1-8cff-12b9f693e300","runStatus":"succeeded","outputDestination":"memo_studio","outputHref":"/app?panel=memo&memoId=praxis-doctor-canary-20260617T033301630Z__policy-memo&outputCapsuleId=run-96f311bc-fce8-4cf1-8cff-12b9f693e300-options-memo","memoId":"praxi`
- `{"tag":"praxis-doctor-canary-20260617T033301630Z","steps":[{"step":"public-home","status":"PASS","httpStatus":200,"detail":"Public prompt surface reachable before login."},{"step":"firebase-login","status":"PASS","httpStatus":200,"detail":"Firebase accepted the canary user praxis-golden-path-ci+20260617@tacitus.me."},{"step":"app-session","status":"PASS","httpStatus":200,"detail":"App session cookie established."},{"step":"authenticated-session-read","status":"PASS","httpStatus":200,"detail":"Au`

### PASS canary-agent-run-stream

Evidence:

- `{"runId":"96f311bc-fce8-4cf1-8cff-12b9f693e300","httpStatus":200,"eventBytes":54382,"preview":"id: 9f155dec-ac8a-42bc-b94d-fda4d1015aad\nevent: run.queued\ndata: {\"id\":\"9f155dec-ac8a-42bc-b94d-fda4d1015aad\",\"runId\":\"96f311bc-fce8-4cf1-8cff-12b9f693e300\",\"ownerUid\":\"oWhpebuCGubyvB6j3EpOgZRGWZU2\",\"capsuleId\":\"praxis-doctor-canary-20260617T033301630Z\",\"eventType\":\"run.queued\",\"fromStatus\":null,\"toStatus\":\"queued\",\"message\":\"Agent run queued for later dispatch.\",\"data\`

## Canary Artifacts

- planned: doctor-canary-workflow `praxis-doctor-canary-20260617T033301630Z`
- planned: context-capsule `praxis-doctor-canary-20260617T033301630Z`
- planned: conversation-thread `praxis-doctor-canary-20260617T033301630Z-thread`
- planned: agent-run `96f311bc-fce8-4cf1-8cff-12b9f693e300`
- planned: memo-draft `praxis-doctor-canary-20260617T033301630Z__policy-memo`

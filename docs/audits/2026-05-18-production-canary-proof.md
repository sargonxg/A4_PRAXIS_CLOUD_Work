# Production Canary Proof - 2026-05-18

Production target: `https://praxis.tacitus.me`

Status: **blocked before write-enabled canary**

## Scope

This run implemented the read-only production proof phase and stopped before
browser login or write tests because the dedicated canary credentials were not
available in the process environment or repo-local `.env*` files.

No production canary records were created in this run.

## Read-Only Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Repo branch | pass | `main` |
| Repo sync | pass | `origin/main...HEAD = 0 0` |
| Commit | pass | `ec0819545ac947736e3871a40445f62c67485e1b` |
| Runtime health live | pass | `npm run audit:runtime-health-live` |
| GCP audit | pass with one soft warning | `npm run audit:gcp`; hard failures: `0`; soft warnings: `1` |
| PRAXIS doctor | pass with canary warning | `npm run doctor:praxis`; PASS=`19`, WARN=`2`, FAIL=`0`, BLOCKED=`0` |

Live runtime evidence from `audit:runtime-health-live`:

- `/api/health` status: `ok`
- `/api/health/runtime` status: `ok`
- Frontend ready revision: `praxis-frontend-00579-zh9`
- Backend ready revision: `praxis-backend-00123-6gx`
- Retired `gdelt-poller` worker pool: `absent`

Runtime health payload from `praxis-doctor`:

- `frontend`: `ok`
- `firestore`: `ok`
- `backend`: `ok`
- `agent_ledger`: `ok`
- `agent_platform`: `ok`

GCP audit evidence:

- Enabled APIs checked: `13`
- Data resources checked: `2`
- Secrets checked: `10`
- Pub/Sub topics checked: `2`
- Cloud Tasks queues checked: `3`
- Runtime services checked: `2`
- Cloud SQL checks: `4`
- IAM checks: `1`
- Scheduler checks: `1`
- Hard failures: `0`
- Soft warnings: `1` (`runtime-proof`)

## Canary Blocker

The write-enabled canary gate is blocked because these values were not present:

- `PRAXIS_DOCTOR_WRITE_CANARY=1`
- `PRAXIS_CANARY_EMAIL` or `TEST_FIREBASE_EMAIL`
- `PRAXIS_CANARY_PASSWORD` or `TEST_FIREBASE_PASSWORD`

The latest doctor artifact recorded the blocked canary workflow tag:

- `praxis-doctor-canary-20260518T025442637Z`

## Not Run

The following steps were intentionally not run because they require the
dedicated canary account and production writes:

- Browser login with the canary account.
- Ask PRAXIS normal prompt submission.
- Deep/current/source-heavy prompt submission and durable AgentRun proof.
- `/agents/[runId]` proof for a created run.
- Disposable document upload into a canary capsule.
- Ask source/claim grounding proof against the uploaded document.
- Memo Studio handoff proof.

## Improvement Decision

No Ask/runtime UI or product behavior changes were applied in this run. The
plan requires fixes to be grounded in issues observed during the write-enabled
browser canary, and that canary could not be executed without credentials.

## Resume Command

After setting the dedicated canary credentials, resume with:

```bash
$env:PRAXIS_DOCTOR_WRITE_CANARY='1'
$env:PRAXIS_CANARY_EMAIL='<canary-email>'
$env:PRAXIS_CANARY_PASSWORD='<canary-password>'
npm run audit:runtime-health-live
npm run audit:gcp
npm run doctor:praxis
```

Then run the browser canary against `https://praxis.tacitus.me` and append the
created canary record IDs to this audit or a new dated audit file.

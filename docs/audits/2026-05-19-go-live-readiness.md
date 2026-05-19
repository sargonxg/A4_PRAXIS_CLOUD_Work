# PRAXIS Go-Live Readiness Ledger

Generated: 2026-05-19T05:20:00.000Z
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
Branch: `main`
Final implementation checkpoint: this committed ledger revision

## Summary

This ledger records the go-live state after the Capsule Factory review/apply and runtime-proof wave. Status values are `pass`, `warn`, `blocked`, or `fail`.

| Status | Area | Evidence | Next action |
| --- | --- | --- | --- |
| pass | Public pages | `npm run build` completed and listed `/`, `/login`, `/pricing`, `/learn`, `/release-notes`, and legal routes. PRAXIS Doctor also received HTTP 200 from `https://praxis.tacitus.me` and `/login`. | Keep live checks in the doctor lane. |
| blocked | Authenticated browser flow | `npm run test:auth-runtime:live` stopped at preflight with missing `TEST_FIREBASE_EMAIL` and `TEST_FIREBASE_PASSWORD`. | Provide the already-onboarded disposable Firebase user env vars and rerun. |
| pass | `/app` | `npm run build` lists `/app` as a static app route. | Verify with authenticated browser smoke once credentials are present. |
| pass | `/app/capsules` | `npm run build` lists `/app/capsules`; focused tests pass for Capsule Factory lanes, review states, one taxonomy filter bar, and no duplicate filter rows. | Keep as Capsule Factory surface. |
| pass | `/app/repository` | `npm run build` lists `/app/repository`; existing contract tests keep repository as a real cockpit route. | Keep repository route; no new top-level page. |
| pass | `/app/settings` | `npm run build` lists `/app/settings`; PRAXIS Doctor live system checks reached health/runtime lanes. | Keep detailed repair hints under Settings/System. |
| pass | `/agents/[runId]` | `npm run build` lists `/agents/[runId]`; agent workspace contract tests and runtime proof tests pass. | Verify from authenticated smoke once credentials are present. |
| pass | Health/runtime APIs | PRAXIS Doctor reports HTTP 200 for `/api/health` and `/api/health/runtime`; `npm run audit:agent-runtime-proof` passed static/runtime contract checks. | Resolve runtime-proof warnings before claiming fully production-ready worker execution from local shell. |
| pass | API route inventory | `npm run audit:api-route-inventory` generated `docs/audits/2026-05-19-api-route-inventory.md` and `.json` for all 210 routes. | Do not delete compatibility/deletion-candidate routes until inventory plus rg/tests/graph prove no usage. |
| pass | Launch headers | `$env:PRAXIS_LAUNCH_LIVE_HEADERS='1'; npm run audit:launch-readiness` passed with 41 pass, 0 warn, 0 fail. | Keep regenerated launch-readiness artifacts. |
| pass | Cloud Run | PRAXIS Doctor reports `praxis-frontend` serving revision `praxis-frontend-00611-9sg`. | Deploy current HEAD only after final clean validation and fetch. |
| pass | Cloud Tasks | PRAXIS Doctor passed `gcloud tasks queues describe agent-runs --location=us-central1 --project=praxisbytacitus`. | Keep worker auth env verified before live dispatch claims. |
| pass | Cloud SQL | PRAXIS Doctor passed `gcloud sql instances describe praxisbytacitus-instance --project=praxisbytacitus`; `npm run audit:gcp` later passed inside `npm run audit:gate`. | Keep runtime env warnings visible until local worker env is configured. |
| pass | Firebase rules/auth | PRAXIS Doctor passed `auth:doctor`, Firestore database describe, and Firebase CLI login checks. | Authenticated smoke remains blocked by missing test user env vars. |
| warn | Agent runtime proof env | `npm run audit:agent-runtime-proof` passed but warned local shell lacks `AGENT_RUNTIME_DATABASE_URL`, worker base URL/auth env, live Genkit config, and ADK Agent Engine config. | Set local proof env or rely on cloud doctor for production env evidence. |
| pass | Typecheck | `npm run typecheck` passed. | Required before commit/push. |
| pass | Build | `npm run build` passed. | Required before commit/push. |
| pass | Vitest | `npx vitest run` passed: 207 files, 872 tests. | Required before commit/push. |
| pass | Standalone GCP audit | `npm run audit:gcp` passed inside `npm run audit:gate` with 0 hard failures and 1 runtime-proof soft warning. | Resolve local runtime env warnings before claiming local worker dispatch is production-ready. |
| pass | Full gate | `npm run audit:gate` passed after the earlier concurrent `next build` process finished. | Keep this as the current ship gate evidence. |
| blocked | Full PRAXIS doctor command | `npm run doctor:praxis -- --mode=full` timed out from the shell after 300s, but wrote `2026-05-19-PRAXIS_DOCTOR.md/json` with PASS=23, WARN=4, FAIL=3 against earlier dirty state. | Rerun after final clean tree if a clean doctor receipt is required. |
| pass | Deep pre-ship blocker cleanup | `npm run audit:deep-preship` now reports 140 PASS, 1 WARN, 0 BLOCKED after stream resume, frontend state, package-audit, and named E2E coverage updates. | Remaining warning is the allowed Gemini 2.5 fallback marker in model policy/tests. |
| pass | Staged graph route archive | `npm run audit:route-cleanup-map` now reports archive candidate=0 and delete candidate=0; `/api/graph/approve-staged` and `/api/graph/staging-stream` return archived 410 responses with `/api/graph/proposals` replacement guidance. | Keep compatibility proof before any physical route deletion. |

## Authenticated Flow Blocker

The requested browser-authenticated smoke is implemented as a failing preflight rather than a silent skip. Current blocker:

- `TEST_FIREBASE_EMAIL` missing
- `TEST_FIREBASE_PASSWORD` missing
- Application Default Credentials require non-interactive reauth with `gcloud auth application-default login --project=praxisbytacitus`

Command:

```powershell
npm run test:auth-runtime:live
```

Result: `blocked`.

## Capsule Factory State

- Review states are typed as `draft`, `reviewed`, `applied`, and `rejected`.
- Factory review diffs use the existing `/api/context/capsules/[capsuleId]/diff` boundary.
- Applying a diff requires explicit confirmation and writes through the existing capsule versioning path.
- The UI shows proposed changes before apply across ontology/graph, sources, temporality, conflict/actors, output/handover, and run receipts.

## Runtime Proof State

The existing cockpit now shows sanitized runtime proof inside active capsule/run areas:

- active capsule
- source count
- last Ask receipt
- queued agent run id
- worker/run status
- latest mirrored event
- memo/output link

No internal costs, secrets, provider keys, or raw worker auth details are exposed in the normal-user strip.

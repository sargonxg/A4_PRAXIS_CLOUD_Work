# PRAXIS authentication, account cleanup, and billing readiness

Date: September 30, 2026. This is a local implementation and operational evidence ledger. The main release ledger owns later deployed revisions and live user journey results.

## Implemented contracts

### Authentication and sessions

- Protected handlers execute once. An operation failure cannot retry through an authentication fallback after partial writes.
- Signed cookies carry navigation and onboarding hints. A saved user snapshot never authorizes an API request.
- Firebase Admin verifies the token and revocation state. Explicit invalid, expired, revoked, disabled, and deleted identity errors return 401 and clear the server cookie.
- When privileged Admin lookup is unavailable, the fallback first verifies the token signature and then checks the same live Firebase account with `accounts:lookup`. UID, disabled state, and `validSince` versus verified `auth_time` are checked. Lookup failures cannot authorize a request.
- Authentication/provider outages return 503, keep the cookie for a later verified retry, and execute no protected handler.
- Session GET verifies current identity and recalculates admin access. Session POST preserves the same rejection/outage distinction. An onboarding skip from a different UID is not reused.
- After current identity verification, session POST initializes a missing owner profile and deterministic `credit_transactions/signup-{uid}` receipt in one Firestore transaction. New accounts receive 1,000 starter tokens once; existing balances/settings and deleting/deleted markers are preserved. A surviving grant receipt with a missing profile restores zero tokens. A configured store outage returns 503 without replacing the cookie. Credential-free development may establish identity without storage, while protected persistence operations remain unavailable.
- Client profile hydration never creates an owner, grants credits, or writes the signup ledger. It reads the server-created profile and updates safe identity/login fields only; deleting account receipts remain readable without client writes. Session refresh permits pending cleanup users to reach Settings while ordinary protected writes remain blocked.
- The obsolete unconditional `/api/email/welcome` request was removed because no welcome route exists. Fresh-account QA must use no-mail account creation or intercept Firebase verification delivery; ordinary email signup still attempts its verification email.
- The client refreshes one rejected token and clears an invalid/deleted identity. A transient backend outage preserves the Firebase login without exposing an unverified app session. Existing token refresh machinery remains canonical.
- Email signup attempts a verification email. Normal analysis does not require email verification; privileged access keeps its separate verification and allowlist rules.
- New sample sessions are retired. Surviving signed samples are read-only and cannot submit funded AI or write requests.
- Normal protected server handlers also check the current account deletion marker. Account-state outages fail closed. GET/DELETE `/api/account` remain available for cleanup receipt reads and retries.

### Billing

- Paid plans come only from server-configured Polar product IDs. Customer metadata cannot promote an unknown product into a paid tier.
- Signed raw-body webhook validation and delivery-ID deduplication remain in place.
- Subscription changes use source modification/event timestamps. Older events and attempts to reactivate the same terminally revoked subscription are ignored.
- A future active/trialing period can grant its allowance once. A distinct update in the same period preserves the spent balance. Existing Polar records adopt their stored period rather than refilling on migration.
- Missing, deleting, and deleted owners cannot be recreated or upgraded by a late webhook.
- Paid Polar tiers require a valid future period and an eligible status. Revoked, past-due, unpaid, paused, incomplete, unknown, and expired records resolve to free. A scheduled cancellation retains access until its valid paid period ends.
- Manual/institutional grants and expiry-aware promotions remain supported. This lane did not activate checkout, create a purchase, alter provider credentials, or change the free monthly ledger.

### Account deletion

DELETE is gated by `PRAXIS_ACCOUNT_ERASURE_RULES_VERIFIED=true`. Keep it unset until the exact Firestore and Storage guards have been released, cross-service Storage permission is verified, and live owner-write checks pass. A frontend deployment alone is insufficient.

When enabled, deletion first marks `users/{uid}.accountDeletionStatus=deleting` transactionally. A renewing Polar subscription must be canceled first. The marker is server-managed and blocks ordinary server work, client writes, paid entitlement grants, and late agent mirrors.

Cleanup covers:

| Store | Scope and implementation |
| --- | --- |
| Firestore user subtree | Discover descendants, including missing parents with surviving chunks; delete capsules, versions, Ask turns, context stacks, memos, outputs, sources, knowledge and operational children. |
| Legacy root records | Owner-filtered root capsules/versions, credits, conflicts, reports, tool runs, jobs, events, alerts, ingestions and rate-limit records. |
| Storage | Exactly `users/{uid}/` in the configured bucket. A returned object outside the prefix is rejected. |
| Runtime SQL | Root-owned `eraseOwnerRuntimeData` transaction and fixed owner-scoped table inventory. |
| Document SQL mirror | Its exact `DOCUMENT_DATABASE_URL`/fallback pool; parameterized deletion from `document_ingestion_records`. |
| Ask SQL memory | Its exact `ASK_THREAD_DATABASE_URL`/fallback pool; owner thread deletion cascades turns. |

Each request has a document/object deletion budget and a cleanup deadline. A partial failure or remaining budget returns 202 with `success=false`, pending store names, and a durable receipt. The UI keeps the session available for retry. SQL stores that are not configured are explicitly recorded as unconfigured.

Firebase Auth is removed after primary cleanup. The user record becomes a minimal UID deletion marker and cleanup receipt, preventing late account recreation. Auth deletion failures remain retryable. The implementation does not claim provider-wide erasure or backup deletion.

Explicit retained records include Polar webhook deduplication/provider accounting, platform security logs and backups under operator/provider retention, and deliberately promoted shared ontology records. No fixed statutory retention period is invented. Configured Neo4j, Cognee or external Vertex index stores without a verified erasure adapter are reported as pending operator cleanup, rather than complete.

Late agent run, event, tool-call and approval mirrors read the owner marker and write in the same Firestore transaction. Root coordinates worker leases and memo guards; the document lane coordinates final document/checkpoint transactions and the upload preflight. Cross-store operations still require a disposable live lifecycle check.

## Local verification receipts

Evidence directory: `output/playwright/practical-refinement-20260930/`.

| Evidence | Result |
| --- | --- |
| `auth-wrapper-red.txt` / `auth-wrapper-green.txt` | Original duplicate execution/snapshot fallback regressions: 10 failed before, 11 passed after. |
| `auth-session-red.txt` / `auth-session-green.txt` | Current session identity regressions: eight failed before; combined auth/session group passed afterward. |
| `current-token-green.txt`, `auth-billing-green.txt` | Current signature/account/revocation proof, transient outage and billing tests. Later sample/delete-state cases extend these checks. |
| `billing-integrity-red.txt` / `billing-integrity-green.txt` | 18 failed before; 24 passed after trusted mapping, ordering, allowance and tier fixes. |
| `owner-erasure-green.txt` | Nine tests: recursive/orphan descendants, >500 credits, exact storage ownership, partial SQL/Auth failures, bounded retry, subscriptions and optional stores. |
| `late-mirror-red.txt` / `late-mirror-green.txt` | Twelve regressions failed before; 15 mirror/contract tests passed after transactional owner guards. |
| `cloud-eslint.txt`, `cloud-typecheck-final.txt` | Scoped lint clean and a passing integration typecheck at that checkpoint. Root runs the final combined repository gates. |
| `firebase-rules-local-plan.json` | Local rule source hashes; no network request or mutation. |
| `cloud-focused-final.txt` | Final combined cloud-lane regression group; use its recorded count/exit result. |
| `starter-grant-red.txt` / `starter-grant-green.txt` | Missing helper failed before; four focused signup/session/readiness files and 24 tests passed after the server-owned atomic grant. |
| `starter-grant-eslint.txt` | Scoped signup, client hydration and session lint result. |
| `firebase-rules-script-green.txt` | Guarded release and Cloud Build source/hash structure checks. |

Additional focused tests verify separate SQL pools and the Rules release guard. Tests use fixtures and mocks; they do not prove production account deletion or paid checkout.

The final combined cloud group passed 14 files and 120 tests before the additional starter-grant cases. Independent review confirmed the grant transaction, verified-session ordering, outage behavior and removal of client grants. Previously deployed rules may still permit the legacy 5,000-credit client profile shape; verify the exact new rules release and a fresh-account journey before claiming production enforcement of the new 1,000-token allowance.

## Current operational evidence and release path

- At 13:44 UTC, the public runtime health checks passed on revision `praxis-frontend-01082-nkw`, commit `4480650999b5bd2808b55cba58f16e5a9a83d343`. This is a dated observation, not a claim about a later release.
- Existing local Google credentials could not refresh (`invalid_grant`). No token was obtained, interactive sign-in started, or credential changed.
- Local Polar required configuration was absent. Deployed Polar products, mounts, purchase and cancellation remain unproven.
- Test credential presence does not prove a disposable identity. This lane has not deleted an account or run lifecycle writes against it.
- Current GitHub frontend builds provide a release route independent of local Google sign-in. No existing Actions workflow deploys Firebase rules. `cloudbuild.yaml` records a historical CLI preflight permission limitation; it is not current proof of every REST permission.
- `cloudbuild.frontend.yaml` uses `--set-secrets` with no Polar mounts. This can replace separately mounted billing secrets; the release owner must preserve configured mounts before enabling paid checkout.

`scripts/deploy-firebase-rules.mjs` provides a guarded REST route using existing Google credentials/Cloud Build identity, without changing credentials or IAM. `--plan` prints local hashes. Default mode reads releases and compiles sources. Exact project, known bucket and expected source hashes are required. `--apply` creates rulesets, updates only the checked releases, and reads back release/source hashes into a redacted receipt.

The full route checks that the Firebase Storage service agent already has `roles/firebaserules.firestoreServiceAgent`; it fails before publication if the grant cannot be verified. `--only=firestore` supports a standalone Firestore release while Storage and account deletion remain unpublished/disabled. Hashes normalize CRLF to LF so the same committed source matches Windows and Linux checkouts. Use the hash receipt from the exact release source; do not silently substitute changed rules.

The frontend Cloud Build configuration now includes an independent `verify-publish-firestore-rules` step after the existing preflights. It installs the repository's pinned Google Auth dependency in an isolated temporary prefix, with bounded installation and execution time, and attempts only Firestore publication through the build's existing identity. A permission/configuration/source mismatch produces an explicit pending log and redacted receipt; it permits the frontend build and never sets the erasure flag or changes IAM. The current source hash is pinned in the build substitution and checked by a structural test. The build log records `FIREBASE_RULES_RECEIPT`; do not infer rules success from the overall frontend build result.

Rules readback confirms published source, not propagation or user-level behavior. Root must verify owner create with 1,000 starter credits, active owner uploads, deleting-owner denial, inability to clear the marker, and normal account/Ask/capsule persistence after propagation. Keep runtime, checkout, rules publication and authenticated lifecycle results separate.

## Official references checked

- [Firebase session revocation](https://firebase.google.com/docs/auth/admin/manage-sessions)
- [Identity Platform account lookup](https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/lookup) and [UserInfo.validSince](https://cloud.google.com/identity-platform/docs/reference/rest/v1/UserInfo)
- [Polar subscription event sequences](https://polar.sh/docs/integrate/webhooks/events) and [subscription status/period fields](https://polar.sh/docs/api-reference/subscriptions/get)
- [Firebase Rules management and cross-service permissions](https://firebase.google.com/docs/rules/manage-deploy)
- [Rules creation](https://firebase.google.com/docs/reference/rules/rest/v1/projects.rulesets/create), [release update](https://firebase.google.com/docs/reference/rules/rest/v1/projects.releases/patch) and [source tests](https://firebase.google.com/docs/reference/rules/rest/v1/projects/test)

## Self-review

Accuracy: 4/5; focused regressions and source contracts substantiate local behavior, while production lifecycle, paid billing and deployed Rules propagation are explicitly unverified. Completeness: 4/5; primary owner stores and late agent mirrors are covered, but optional provider erasure adapters and cross-store live races remain pending. Clarity: 4/5; one current-token verifier and one owner cleanup entrypoint keep responsibilities explicit, though the separate release gate is an operator dependency. Actionability: 4/5; reproducible tests, hashes and a read-default release script are available; valid deploy credentials and a disposable identity are still needed. Conciseness: 4/5; evidence stays in receipts and this ledger rather than user-facing analysis flows. Overall: 4.0/5.

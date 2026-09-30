# PRAXIS authentication, account cleanup, and billing readiness

September 30, 2026. This ledger separates implemented contracts, earlier production proof and pending activation. The integrated merged-source gate and fresh production build passed; corrective deployment and fresh live acceptance remain pending in the [release record](2026-09-30-praxis-live-release.md).

Historical source `9e95085f` passed account/session and Rules guard journeys but failed queued memo persistence on an absent optional publication date. That local correction needs another deployed worker journey. Production Polar identity, active merchant, dedicated Practitioner product/webhook and secure runtime secret mounts are verified. Checkout remains disabled while the corrective release proceeds; the fresh build after final settings copy passed with exit 0 at 2026-09-30T22:09:25.634Z. No purchased lifecycle or complete account erasure is proven.

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
- Manual/institutional grants and expiry-aware promotions remain supported. Provider setup and deployed paid availability are tracked separately below; no purchased subscription lifecycle is claimed.

### Account deletion

DELETE requires `PRAXIS_ACCOUNT_ERASURE_RULES_VERIFIED=true`. The deployment configuration and last recorded revision keep it `false`. Exact Firestore/Storage publication, cross-service Storage access and user-level Rules propagation are now recorded below. Bounded cleanup/retry/final Auth-erasure lifecycle proof remains pending; keep deletion disabled until that check passes. A frontend deployment or Rules source readback alone is insufficient.

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

## Historical local verification receipts

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
| `deploy-config-preservation-green.txt` | Three structural tests passed: update-only environment/secrets flags, unchanged signing mounts, and explicit erasure disablement. |
| `firebase-rules-script-green.txt` | Guarded release and Cloud Build source/hash structure checks. |

Additional focused tests verify separate SQL pools and the Rules release guard. Tests use fixtures and mocks; they do not prove production account deletion or paid checkout.

The final combined cloud group passed 14 files and 120 tests before the additional starter-grant cases. Independent review confirmed the grant transaction, verified-session ordering, outage behavior and removal of client grants. The historical legacy client profile shape permitted 5,000 credits. The subsequent live synthetic-account Rules canary verified server initialization and its ledger at exactly 1,000 tokens, denial of legacy 5,000-credit creation, and denial of client credit escalation.

## Verified Google and Firebase operations

Earlier `invalid_grant` and ADC quota-project errors were local operator failures, not production-outage evidence. The user refreshed Google sign-in. Publication used process-scoped `GOOGLE_CLOUD_QUOTA_PROJECT=praxisbytacitus`, preserving global Google configuration and credentials.

| Evidence | Verified result and boundary |
| --- | --- |
| Historical application | Build `d7d99db1-a0d2-4ff9-9525-04f82dcc0982`, source `9e95085f`, revision `praxis-frontend-01084-s8p`, 100% ordinary traffic at coordinator readback. Not acceptance of the next merged source. |
| Operator Rules publication | `operator-both-rules-release-9e95085f.json`: both sources compiled, published and read back at 18:27:44 UTC; rollback identities retained. |
| Firestore hash | `f742d194d5ea2868c8efc496cf630386d67b5cdb59dfec84ae20e7c00deed4ba` |
| Storage hash | `61ee883cbbea13a3acedc089db91ff3fbc6d677398467820e15994f2eeabff37` |
| Storage cross-service grant | Only `roles/firebaserules.firestoreServiceAgent` added to `service-852128226674@gcp-sa-firebasestorage.iam.gserviceaccount.com`; role/binding and successful preflight verified. |
| CI publisher grant | Enabled GA custom role `projects/praxisbytacitus/roles/praxisFirebaseRulesPublisher`, bound unconditionally to `praxis-cloudbuild-deployer@praxisbytacitus.iam.gserviceaccount.com`. Exactly five permissions below. |
| Exact CI identity read/test | No-source Cloud Build `0d988eed-e4c6-45a1-bc06-0a5a92d2cf01` matched both served hashes and compiled both sources without errors; `ci-rules-read-preflight-receipt.json`. It performed no publication or application deployment. |
| Real client guards | `live-rules-propagation-1790795176330-168a9c3c.json`: all 55 checks passed, including active owner persistence/Storage, one 1,000-token starter grant, credit escalation denial and deleting-owner/marker protection. No complete erasure performed. |

The earlier application builds failed reading Rules with missing `firebaserules.releases.get`; no publication occurred during those failed preflights. Later operator publication is separate from the successful read-only CI test.

| Publisher operation | Scoped permission |
| --- | --- |
| Read and read back release | `firebaserules.releases.get` |
| Read ruleset source | `firebaserules.rulesets.get` |
| Compile/test | `firebaserules.rulesets.test` |
| Create immutable ruleset | `firebaserules.rulesets.create` |
| Update existing release | `firebaserules.releases.update` |

Read/test execution is proven. Create/update access is verified by IAM metadata and requires a successful publishing build for execution proof. The custom role excludes Rules deletion, new-release creation and executable permissions. Existing grants supply project/API access; exact project, target and hash restrictions come from the guarded publisher. The [trigger runbook](../../infrastructure/triggers/README.md) and [IAM runbook](../runbooks/IAM_ROLES.md) own the wider identities.

### Publication and deployment contract

`scripts/deploy-firebase-rules.mjs` defaults to source read/hash/compile. `--plan` is local only; explicit `--apply` creates checked rulesets, updates checked existing releases and reads back normalized LF source hashes into a redacted receipt. Both-service mode also verifies the Storage cross-service grant. `--only=firestore` neither publishes Storage nor enables erasure.

The frontend build includes a Firestore publication step. Its outcome must be read from the exact final build; an overall green build does not substitute for its receipt. Identical source bytes may receive a new ruleset identity. Preserve source hashes and separate publication IDs.

Cloud Run deployment uses `--update-env-vars` and `--update-secrets`, preserving unlisted operator settings and existing signing mounts. It does not fill missing Polar configuration. Account erasure remains explicitly false.

## Practitioner billing activation

| Setup stage | Verified or pending |
| --- | --- |
| Mode and organization | Production token verified; sandbox returned 401. Organization `1a123382-417b-43b4-b382-8bb10788393d`; merchant status confirmed active. |
| Token storage | Enabled Secret Manager version `projects/852128226674/secrets/polar-access-token/versions/1`; scoped secretAccessor grant to `praxis-frontend-sa@praxisbytacitus.iam.gserviceaccount.com`. Secret values are never recorded. |
| Product | Dedicated `c2716588-59a5-46dc-8e04-2a923db4f6b1`, PRAXIS Practitioner, managed/unarchived, USD 4,900 cents per month, interval count 1. Unrelated CONCORDIA and the other four preexisting products remain unchanged. |
| Signing webhook | `be046682-216a-4c0a-8770-2ee37c94a160`: exact `https://praxis.tacitus.me/api/billing/webhook` URL, raw format, enabled, seven required subscription events. Genuine secret persisted directly as enabled `projects/852128226674/secrets/praxis-polar-webhook-secret/versions/1`; narrow runtime secretAccessor grant verified. |
| Runtime mounts | `praxis-frontend-01086-kff`, 100% traffic: both version-1 secret references, `POLAR_PRODUCT_ANALYST` set to the dedicated product, `POLAR_SERVER=production`, `PRAXIS_ENABLE_PAID_CHECKOUT=false`. Preserved upstream source `7a56d338` and existing settings. Corrective source and checkout activation remain pending. |
| Commercial proof | Hosted checkout creation/flow, portal, genuine signed delivery and entitlement lifecycle still need receipts. No purchase, cancellation or refund has been proven. |
| Team | Unavailable. Seat/member/shared-team provisioning is unimplemented; no Team product ID or checkout activation. |

The historical 18:56 UTC inspection found the runtime token/webhook/product inputs absent. The provider setup and subsequent mount checkpoint supersede that absence; they do not prove hosted checkout or a paid subscription. Initial token persistence succeeded even though its helper rejected a project-number resource name; retain that failed assertion and the later verified metadata receipt rather than resubmitting the credential.

| Supported plan | Contract |
| --- | --- |
| Practitioner (internal `analyst`) | USD 49/month, one fixed 4,900-cent price, month interval count 1; 250,000 allowance per eligible paid period, granted once. Broader workspace/export/support promises need separate proof. |
| Team | Proposed only. No self-service provisioning or shared-workspace acceptance. |

The ignored helper `operator-polar-setup.cjs` uses installed SDK 0.46.7 and defaults to read-only planning. Apply requires exact production organization and a memory-only signing-secret persistence callback. It creates the supported product/raw webhook with subscription created, updated, active, canceled, uncanceled, revoked and past-due events. It validates reusable records, records created IDs before continuing, disables automatic write retries and exposes only redacted metadata. It does not create subscriptions or charge a card. Reconcile uncertain creates before retry; rollback is explicit.

The signing callback persists only to `praxis-polar-webhook-secret` and returns its version resource; the real secret never enters files, output or shell arguments. Supported-plan readiness and availability are per plan, so Team absence must not block an otherwise verified Practitioner portal.

| Provider operation | Endpoint | Scope |
| --- | --- | --- |
| Organization read | `GET /v1/organizations/` or `/{id}` | `organizations:read` or `organizations:write` |
| Product inventory / create | `GET /v1/products/`; `POST /v1/products/` | `products:read` / `products:write` |
| Webhook inventory / create | `GET /v1/webhooks/endpoints`; `POST /v1/webhooks/endpoints` | `webhooks:read` / `webhooks:write` |
| Checkout | `POST /v1/checkouts/` | `checkouts:write` |
| Portal session | `POST /v1/customer-sessions/` | `customer_sessions:write` |

Offline SDK/schema and fake-client checks cover read-only defaults, the mandatory secret-persistence gate, redaction, reuse, rollback and recovery journals. They are not paid lifecycle evidence.

Provider setup receipt `operator-polar-provider-setup-1790804201239.json` is timestamped 21:36:41.264 UTC. Read-only probe `operator-polar-stored-probe-1790804261349.json` at 21:37:41.349 UTC confirmed active merchant, six products and one correctly configured webhook. `polar-webhook-secret-runtime-access.json` records the narrow secret grant; `polar-runtime-mount-revision.txt` records the mount revision. Redacted read-only `polar-runtime-readback-1790804823411.json` at 21:47:03.409 UTC verifies upstream source `7a56d338`, revision `01086-kff` at 100%, both version-1 references, production mode, dedicated product, false checkout flag and absent Team product. Corrective final-source readback remains pending.

The combined billing group passed 46 focused tests and scoped lint; independent review approved runtime plan-availability coupling. The first dedicated product request returned 422 because an organization token rejects a redundant `organization_id` body field. The retry removes only that field from OAT-scoped product/webhook creates; preflight and readback still require the exact organization. Failed attempts and create journals remain retained. The [official create contract](https://polar.sh/docs/api-reference/webhooks/endpoints/create) requires organization ID except for organization tokens, matching that live validation error.

Genuine signed subscription delivery and purchased lifecycle remain unproven. [Polar sandbox documentation](https://polar.sh/docs/integrate/webhooks/endpoints) describes real sandbox purchases, subscriptions, cancellations and refunds triggering signed events; no callable test-event endpoint was found in SDK 0.46.7. A locally generated signature or simulated payment would not establish provider delivery. Sandbox identity/configuration is a separate operator input.

## Ask-to-memo context boundary

The local boundary normalizes unsaved version-zero context to null capsule ID/version. Positive saved pins must resolve to the exact owner, capsule ID and version before writes. Twenty-six focused tests and scoped lint passed. The integrated gate then passed 440 files/2,396 tests; corrective deployed context persistence remains separate.

## Account erasure gate

Keep `PRAXIS_ACCOUNT_ERASURE_RULES_VERIFIED=false` until a disposable live lifecycle proves every configured owner store, bounded cleanup, partial-failure retries, late-worker/upload denial and final Auth removal. Both Rules publication and 55 guard checks are proven, but the frontend Firestore-only publication step cannot prove Storage publication or full cleanup.

Optional Neo4j, Cognee and external Vertex indexes require a verified cleanup adapter or an explicit pending operator receipt. Retention remains the documented tombstone/receipt, provider accounting/deduplication, platform logs/backups and deliberately promoted shared records. Existing signed URLs have independent expiry. No provider-wide or backup-erasure claim follows from this work.

## Official references checked

- [Firebase session revocation](https://firebase.google.com/docs/auth/admin/manage-sessions)
- [Identity Platform account lookup](https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/lookup) and [UserInfo.validSince](https://cloud.google.com/identity-platform/docs/reference/rest/v1/UserInfo)
- [Polar subscription event sequences](https://polar.sh/docs/integrate/webhooks/events) and [subscription status/period fields](https://polar.sh/docs/api-reference/subscriptions/get)
- [Firebase Rules management and cross-service permissions](https://firebase.google.com/docs/rules/manage-deploy)
- [Rules creation](https://firebase.google.com/docs/reference/rules/rest/v1/projects.rulesets/create), [release update](https://firebase.google.com/docs/reference/rules/rest/v1/projects.releases/patch) and [source tests](https://firebase.google.com/docs/reference/rules/rest/v1/projects/test)
- [Firebase IAM permission meanings](https://firebase.google.com/docs/projects/iam/permissions) and [Rules predefined roles](https://docs.cloud.google.com/iam/docs/roles-permissions/firebaserules)
- [Polar organization tokens](https://polar.sh/docs/integrate/oat), [organization reads](https://polar.sh/docs/api-reference/organizations/list), [product creation](https://polar.sh/docs/api-reference/products/create), and [webhook creation](https://polar.sh/docs/api-reference/webhooks/endpoints/create)

## Review boundary

Local regressions and metadata readback support the stated contracts. The integrated merged-source gate passed (440 files/2,396 tests; zero skips). Final settings balance/activity copy passed 17 focused tests and scoped lint; fresh production build passed with exit 0 at 2026-09-30T22:09:25.634Z (final-build-receipt.json). Publishing CI execution, corrective authenticated worker continuation, complete erasure and paid lifecycle remain separate acceptance checks. No token values are present in this document.

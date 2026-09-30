# PRAXIS runtime and authentication evidence — 2026-09-29

PRAXIS was available on its production domain during the initial read-only audit. Its
served commit matched local `HEAD`, Firebase allowed email/password sign-in on
that domain, and the runtime dependency checks passed. This proves availability
and configuration; it does not prove every authenticated user workflow works.
The coordinating agent reran real user journeys and found the upload/save/read
failures recorded below. The current release must not be described as fully
working from its healthy endpoints alone.

## Audit scope and boundaries

- Observation window: approximately 23:22–23:43 UTC on 2026-09-29.
- Repository: `C:\Users\giuli\tacitus-products\praxis`.
- Cloud project/region: `praxisbytacitus` / `us-central1`.
- Production domain: `https://praxis.tacitus.me`.
- Read-only cloud, HTTP, GitHub, source and prior-artifact inspection. No deploy,
  traffic change, configuration change, account creation, credential rotation,
  database write, or authenticated canary was performed by this auditor.
- Existing `gcloud` user authentication was used with explicit project flags.
  No ADC/login operations were performed. Credential values were never printed.
- The initial audit added only this document. The coordinator then explicitly
  assigned the two local persistence/read repairs recorded below. Preexisting
  changes and the other agents' fixes were preserved.

## Deployed release

| Evidence | Verified value |
| --- | --- |
| Local HEAD and served source commit | `163469a7f0984d0096f0c67c4265305542865b3d` |
| Cloud Run latest ready/created revision | `praxis-frontend-01076-92d` |
| Production traffic | 100% to `praxis-frontend-01076-92d` |
| Ready transition | `2026-09-29T22:27:10.664809Z` |
| Regional Cloud Build | `d933ede6-b1ed-4d15-b9e5-36c2f7df0ca4`, `SUCCESS` |
| Build finished | `2026-09-29T22:27:14.411134Z` |
| Build/image commit | Matches `163469a7f0984d0096f0c67c4265305542865b3d` |
| Service/image | `praxis-frontend`; `us-central1-docker.pkg.dev/praxisbytacitus/praxis/praxis-frontend:163469a7f0984d0096f0c67c4265305542865b3d` |
| Resources | 1 CPU, 2 GiB memory, concurrency 8, minimum 1 / maximum 10 instances |
| Existing canary tag | `praxis-frontend-01050-kaj`; this old tagged URL is not the current production release |
| Cached remote-tracking comparison | `origin/main...HEAD` returned `0 0`; no fetch/push was performed by this auditor |

Both `gcloud run services describe` and the served `/api/health/runtime` response
independently identified this commit, revision and build. Cloud Run was ready
and its production route had 100% traffic. These values must be rechecked after
any subsequent release.

## Availability and access controls

| Live unauthenticated request | Observed result |
| --- | --- |
| `/` | HTTP 200 |
| `/login` | HTTP 200 |
| `/app` | Redirected to `/login?redirect=%2Fapp` |
| `/app/capsules/builder` | Redirected to login with the builder return path |
| `/api/context/capsules` | HTTP 401 |
| `/api/agents/runs` | HTTP 401 |
| `/api/auth/session` | HTTP 200 with no authenticated user |
| `/api/health` | HTTP 200, `status: ok` |
| `/api/health/runtime` | HTTP 200, `status: ok`, `Systems ready` |

The runtime endpoint reported healthy frontend, Firestore, private backend,
agent ledger, task queue, worker dispatch and agent platform. The general
health endpoint reported Firestore, AI provider, cookie secret and Vertex ADK
as `ok`. Optional Cognee, GraphLite, TrustGraph and Polar integrations were
unconfigured. Optional integrations are not prerequisites for the scoped Ask
and capsule workflows; the health response does not establish paid-product
billing readiness.

These are read-only GET checks. They verify unauthenticated rejection and
dependencies, not owner isolation or authorization for writes. In particular,
they do not validate capsule POST/update ownership, cross-user access, document
read tenancy, or the effect of the coordinator's local repairs.

## Firebase configuration

The current Identity Toolkit project configuration was read directly with an
existing `gcloud` access token and the request header
`X-Goog-User-Project: praxisbytacitus`. The initial request without that header
failed due to a missing quota project; adding the header succeeded without any
credential/configuration mutation.

Verified configuration:

- Project configuration: `projects/852128226674/config`.
- Email sign-in enabled; password required.
- Improved email privacy / enumeration protection enabled.
- Authorized domains include `praxis.tacitus.me`, `localhost`,
  `praxisbytacitus.firebaseapp.com`, `praxisbytacitus.web.app`,
  `praxis-nextjs-tacitus.vercel.app`, and
  `praxis-frontend-852128226674.us-central1.run.app`.

`/api/auth/test-firebase` returned HTTP 200, Firebase reachable and Admin SDK
initialized. Its deliberate bad-credential probe received a blocked-empty-
referer response; that diagnostic alone is weaker evidence than a real login.
The direct project-configuration read verifies that email/password is enabled.
Only a real browser login verifies the complete user path.

## Browser-test mechanism and existing journey receipts

The repository has an existing disposable Firebase account mechanism documented
in `docs/runbooks/DISPOSABLE_FIREBASE_GOLDEN_PATH_USER.md`. The shared Playwright
helper uses `TEST_FIREBASE_EMAIL` / `TEST_FIREBASE_PASSWORD`, falling back to
`PRAXIS_CANARY_EMAIL` / `PRAXIS_CANARY_PASSWORD`. Presence of all four variables
and the public Firebase web API key was verified after `@next/env` loading;
values were not printed. No new account is needed merely to start a live proof.

The prior release receipt and ignored Playwright artifacts establish narrower
historical evidence:

| Existing evidence | Scope and limitation |
| --- | --- |
| `release-capsule-tests.json` | One expected / zero unexpected tests, 68.6 seconds, beginning `2026-09-29T20:57:04.445Z`; older `e5038b4d` / revision `01075-c65` |
| Capsule creation/review proof | Real login and TXT/PDF/DOCX upload, review decisions, real optional Ask response and history persistence are covered by the current capsule-studio test; an independent rerun must bind its receipt to the current revision |
| `release-agent-proof.json` | Run `477d6dd1-5b28-490b-9846-7c1d27b8a2d3` failed: `All three uploaded documents must reach the agent evidence pack`; attachment preservation was true |
| `release-conversation-proof.json` | Earlier conversation-to-builder proof failed because the expected synthetic marker was missing; this is not a current passing receipt |

The coordinator owns fresh live proof of login, real writing/Ask, capsule
attachment without rewriting its saved references, conversation-to-capsule
handoff, source-grounded recall, and deep research through review to a visible
saved memo. Shared-account canaries should run serially to avoid contaminating
one another's active workspace or history.

## GitHub checks

At commit `163469a7`, `verify-main` passed, but `persona-smoke` failed:

- Verify run: `36638702467`, completed successfully.
- Persona run: `36638702558`, failure at `Run Tasklet app smoke suite`.
- Disposable credential verification, build and app startup passed.
- Exact failing assertion: `tests/e2e/golden-path.spec.ts:156`, heading
  `/Build a policy capsule/i` expected visible.
- Current builder source (`src/app/app/capsules/builder/page.tsx`) instead renders
  `Give your next answer better context.`
- Authenticated-app smoke, authenticated golden path and live agentic canary
  were skipped after the failing step. They must not be reported as passed.
- CI logs also report unconfigured Firebase Admin credentials on the local CI
  app; this is distinct from production's healthy Firestore/Admin SDK checks.

This stale heading assertion needs correction and a new smoke result. The
same workflow also failed on older `e5038b4d`; the prior `06246386` persona smoke
was green. Cloud Build success therefore does not establish all CI is green.

## Logs and remaining evidence gaps

The initial two read-only Cloud Logging queries, each limited to 100 entries
with a two-hour freshness window, returned zero matches before the coordinator's
new live failures:

1. Frontend service logs at `severity >= ERROR` across revisions.
2. Current revision `praxis-frontend-01076-92d` logs matching ERROR, stderr,
   text `Error` / `failed`, or structured error level.

No matching entries in this window is useful operational evidence, not proof
that all requests succeed. Model evidence failures, stale UI state, wrong
references and missing persistence can return successful HTTP responses.

Fresh queries after the new browser journeys supersede the earlier quiet-log
observation:

| Time (UTC) | Current revision evidence |
| --- | --- |
| `23:27:43.979295` | `/api/context/capsules` HTTP 503, latency 23.897 seconds |
| `23:27:44.643658` | `/api/documents/upload` HTTP 503, latency 23.233 seconds; the conversation builder showed `Upload failed (503). Retry this file.` |
| `23:28:07.855869` | `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory` |
| `23:32:55.241272` | Firestore rejected undefined `runtime.answerEnvelope.sourceCards.0.pageRef` |
| `23:32:56.192872` | Firestore rejected undefined `answerEnvelope.sourceCards.0.pageRef` |
| `23:34:45.674643` | `/api/memos/DuWekjcCOUFF2tMyI1lq__policy-memo` HTTP 500 |
| `23:34:45.816024` | `FAILED_PRECONDITION: The query requires an index` during memo lookup |

Both 503 requests and the fatal heap log correlate to instance suffix
`ee1a4a4bd5e9d485` on `praxis-frontend-01076-92d`. GC logs show approximately
1,022 MB in use immediately before the V8 heap failure, although the container
has a 2 GiB limit. No `NODE_OPTIONS` environment override was present. This is
a proven JavaScript heap failure; no separate container-memory-limit kill was
established. Later successful uploads demonstrate recovery, not elimination
of the memory fault. The coordinator owns the inventory-memory repair.

The coordinator also reported that agent run
`3f83be1d-cc68-4750-97d8-b598c2af296f` succeeded with source receipts and preserved
attachment, but the saved memo GET then returned 500. The agent's succeeded
status is therefore insufficient to claim the full visible-output journey
passed. Its receipt is in
`output/playwright/user-readiness-20260929/agent-run.json`.

### Assigned local repairs and validation

These changes are local at this receipt; this audit did not deploy them.

- `src/lib/firebase/ask-thread-service.ts` exports the existing recursive
  `omitUndefinedMetadata` helper. The chat route now uses it for situation
  turns, conversation turns and conversation summaries. This covers both
  failing answer-envelope paths, preserves source provenance and array
  positions, and preserves native Firestore values. Existing error reporting
  remains active; no global Firestore ignore setting was enabled.
- `src/lib/firebase/memo-service.ts` recognizes only canonical IDs that end in
  `__` plus a known `MemoTemplateIdSchema` value and roundtrip through
  `memoDocumentId`. It reads the existing deterministic
  `users/{uid}/situations/{caseId}/memos/{memoId}` path, verifies the stored
  owner/id/case/template, and returns memo metadata plus versions. This avoids
  the missing collection-group index for newly saved canonical memos. The
  existing owner-filtered historical lookup remains for noncanonical IDs and
  rejects records outside the requested user's path. No index or cloud resource
  was created. The historical fallback still depends on its existing index.
- Focused verification: 16 tests passed across
  `tests/unit/lib/firebase/ask-thread-service.test.ts` and
  `tests/unit/lib/firebase/memo-service.test.ts`; scoped ESLint and
  `git diff --check` passed. The fixtures cover both source-card paths, missing
  page locators, provenance/array binding, native increments, exact canonical
  memo reads without a query index, source receipts and version blocks,
  case IDs containing `__`, mismatched identities, and historical compatibility.

Full integration/release validation and new live receipts remain owned by the
coordinator. Passing local regressions does not prove the deployed faults have
been repaired.

The older failed conversation artifact also contains generated restricted/UN
classification and author-role boilerplate. No corresponding literal string
was found in current `src`, `prompts` or `backend` sources. This is an observed
old output-quality issue; current reproduction and prompt attribution remain
unproven and belong in the coordinating agent's output review.

Completion gates before claiming the scoped product works for users:

1. Fresh real-browser journey receipts for the served revision, including
   downstream source recall and persistent outputs.
2. The persona smoke selector repaired and the affected proof rerun.
3. Regression and live verification of any local security/state fixes after
   they are released; local changes are not shipped merely because this
   baseline runtime is healthy.
4. Conversation source upload, saved chat continuity and reopening the saved
   research memo must all pass after the memory/persistence/read fixes are
   released, with visible output and evidence receipts inspected.

No write/admin access, paid billing setup, load-test capacity, disaster recovery
exercise, or optional provider readiness is established by this audit.

## Persisted output inspection — 2026-09-30 00:08 UTC

Existing `gcloud` read access allowed a direct Firestore GET of the explicitly
scoped synthetic canary memo and its versions, despite the legacy API failure.
Stored owner, memo ID and case ID matched the requested scope. Two versions were
present; the current version was `DuWekjcCOUFF2tMyI1lq__policy-memo-v2`. No memo,
credential, account, index or cloud resource was modified. Sanitized receipt:
`output/playwright/user-readiness-20260929/memo-inspection.json` (ignored).

The saved text labels the Example Council scenario as synthetic, preserves the
`2026-10-01` deadline, and says funding is unconfirmed. Four cited public links
resolved successfully: Kenyan Lens commentary, Ethical Trading Initiative
responsible-purchasing guidance, an NHIMG privacy-policy FAQ, and the Centre for
Effective Services implementation guide. ETI and CES offer relevant operational
examples; the sources require statement-level review before reuse.

The output is **a draft requiring review, not publication-ready**. It puts
operating procedures, budget allocations and configurations under commitment
verification; its own appended critique correctly calls that an implementation
indicator mismatch and export blocker, but the edit is not applied. It also
attributes UNGP Principles 17–21 to the cited NHIMG page, where neither `UNGP`
nor `UN Guiding Principles` was found in the retrieved content. The expanded
institution name asserted for NHIMG was not corroborated there.

These findings are scoped to the primary paragraph block `live-memo-draft`,
title `Draft memo with inline citations`: the category error and attribution
are in its memo text before `Sourceability self-critique:`. The correction is
suggested afterward, not applied. Neither version contains `multi-agent-final`
(`Final revised memo`) or `drafting-agent-output` (`Drafting agent output before
red-team revision`). Those belong to a different `multi_agent_review` workflow;
its final output was not inspected here. The separate task/source/gap/review
blocks are audit receipts, not themselves a writing defect.

The footer's zero-unsupported-claims ledger covers three sourced QA-context
paragraphs, not every model-generated memo statement. The broader grounding
receipt has nine flags, including headings and three substantive statements.
This inspection does not establish a comparative quality improvement or a
successful browser memo-open journey. A reviewer must apply the primary-draft
corrections, verify exact source passages and inspect the revised visible memo
before external use.

## Local generated-memo review consistency repair

The ordinary research-memo worker now checks the primary `draftText` before
saving a memo or output capsule. It hashes the primary body with Web Crypto
SHA-256 after normalizing CRLF to LF and trimming outer whitespace. The
`outputReview` receipt records generated-span counts and findings separately
from the `input_evidence` sourceability ledger. Those input counts do not
approve the generated text. The identical receipt follows memo, version,
primary block, output capsule payload and run metadata. An explicit null
prepared report clears any older run grounding report when verification is
disabled or unavailable.

Generated memos always save with status `review`, `reviewRequired: true`, and
`exportReady: false`. A zero-flag grounding check is diagnostic; it cannot
approve category choices or factual attributions. The model's critique is a
separate `live-memo-critique` feedback block, explicitly unapplied. Checking one
selected claim does not approve the whole body. Edited bodies retain the
original receipt hash and remain review-required. Direct and nested
`artifactMetadata.outputReview` block metadata survive the existing save API.

Local regression evidence: 74 tests pass across worker, memo persistence,
output review, export readiness, proof-summary, and API serializer tests. The
actual `toAgentRunOutput` plus Zod schema and JSON roundtrip preserve checked,
disabled, and legacy-unknown receipts and the input-evidence scope. Scoped ESLint and
scoped `git diff --check` pass. RED tests reproduced the previous selected-claim
override, unknown verifier acceptance, discarded save receipt and unblocked
proof despite generated flags. This local result does not prove deployment,
an improved final analytical product, or body-bound human approval. Full
validation and browser/release evidence belong to the integrating session.

Self-evaluation of this bounded slice: accuracy 4/5 (tested receipt consistency,
no new live run); completeness 4/5 (whole-body approval is intentionally not
implemented); clarity 4/5 (scope and unapplied feedback are explicit, legacy
documents need the integrating UI's handling); actionability 4/5 (local source
is reviewable, release validation remains); conciseness 4/5 (one shared receipt,
no new provider calls). Overall 4.0/5. The next practical improvement is
browser validation of the receipt. The assessment
keeps the user's requested usable draft distinct from publication readiness.

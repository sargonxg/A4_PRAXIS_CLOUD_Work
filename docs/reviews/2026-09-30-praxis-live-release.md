# PRAXIS release record: September 30, 2026

Status: the integrated local gate and fresh production build passed. Commit/push, corrective deployment and authenticated live acceptance remain pending. Historical journey results below belong to earlier named sources.

The next release combines the memo-persistence and truthful-receipt fixes in local checkpoint `90806daf` with upstream chat-first work at `7a56d33822c2e0aa28e25fec792bcb1750f524ac`. It applies the requested [anti-slop review](https://github.com/miqdadbadjuber/anti-slop): shorter copy, fewer repeated explanations, clear actions, useful visuals, and mobile/accessibility checks within the TACITUS design. Final source and deployment identities will be recorded after validation.

## Validation and release status

| Gate | Current evidence / required next proof |
| --- | --- |
| Corrective source | Optional memo metadata is sanitized before Firestore writes; strict regressions preserve body, version, source and review lineage. Economical/fallback labels and resolved capsule/distinct-source counts are corrected locally. Ask-to-memo preserves only exact owner/id/version pins; 26 focused boundary tests and scoped lint passed. |
| Dependencies | Next.js 16.3.7 and the minimal `@grpc/grpc-js` 1.14.5 override/lockfile patch are present. The integrated gate passed against the merged source; dependency findings retain their own dated audit receipts. |
| Merged-source validation | Passed aggregate build/typecheck, architecture, repository, route, capsule, agent, GCP, surface and simplification checks; GCP had zero hard/soft warnings. ESLint: zero errors/five existing warnings. AI route audit passed. Full Vitest: 440 files/2,396 tests, all passed, zero skips. Fresh build after the final settings copy passed at 22:09:25.634 UTC. |
| Deployment | Exact GitHub-source build, revision/traffic readback, runtime proof and Rules publication evidence are pending for this release. |
| Real user journeys | Repeat signup, capsule creation, TXT/PDF/DOCX review/reuse, capsule-aware Ask/history, actual model routes, writing review/exports and queued research through memo correction/save/reopen/logout against the final source. Retain failed attempts and original outputs. |
| Practitioner billing | Dedicated PRAXIS $49/month product, enabled raw seven-event webhook and both version-1 secret mounts verified. Mount revision `praxis-frontend-01086-kff` preserved upstream source `7a56d338`; checkout stays false. Corrective runtime, hosted checkout and signed subscription lifecycle remain pending. Team is unavailable. |
| Account erasure | `PRAXIS_ACCOUNT_ERASURE_RULES_VERIFIED=false`. Rules guards passed; bounded cross-store cleanup, retries and final Auth removal remain unproven. |

## Integrated local validation

`final-source-gate.json` records zero exit codes for repository shape, aggregate gate, lint, AI routes and full tests, completed at 22:04:35 UTC. Logs: `final-gate-repo-shape.log`, `final-gate-gate.log`, `final-gate-lint.log`, `final-gate-ai-routes.log`, `final-gate-tests.log`.

The final settings copy now shows actual spendable balance for free and paid accounts. Its monthly activity counter does not imply 31,000 available tokens or a refill. Seventeen focused tests and scoped lint passed after the integrated gate. The fresh production build passed with exit 0 at `2026-09-30T22:09:25.634Z`, recorded in `final-build-receipt.json` and `final-build.log`. Commit/push, deployment and corrective live journeys are not yet recorded.

## Provider setup and mount checkpoint

At 21:36:41 UTC, `operator-polar-provider-setup-1790804201239.json` verified product `c2716588-59a5-46dc-8e04-2a923db4f6b1` (PRAXIS Practitioner, USD 4,900 cents/month, interval count 1) and raw enabled webhook `be046682-216a-4c0a-8770-2ee37c94a160` at the exact billing URL with seven subscription events. The signing secret was stored as enabled version `projects/852128226674/secrets/praxis-polar-webhook-secret/versions/1`.

The 21:37:41 UTC read-only probe `operator-polar-stored-probe-1790804261349.json` confirmed the active merchant, six products, one webhook and unchanged five preexisting products. Narrow frontend secret access was verified. Mount revision `praxis-frontend-01086-kff` served 100% while preserving upstream source `7a56d338`, both version-1 secret references, the Practitioner ID and production mode. The redacted read-only receipt `polar-runtime-readback-1790804823411.json` at 21:47:03.409 UTC confirms those bindings and no Team product mount. `PRAXIS_ENABLE_PAID_CHECKOUT=false`; this configuration revision is not the corrective application release or paid lifecycle proof.

## Historical accepted release: `9e95085f`

The coordinator observed this source serving ordinary traffic on September 30. Recheck the live source before treating it as current.

| Release evidence | Verified value |
| --- | --- |
| Application source | `9e95085f60e85bae8b4877f5548d6efd39dea79c` |
| Cloud Run revision / traffic | `praxis-frontend-01084-s8p` / 100% at readback |
| Cloud Build | `d7d99db1-a0d2-4ff9-9525-04f82dcc0982`; nine successful steps |
| Image digest | `sha256:9ca680797f66ddd91ed17bbae0843e7fbe9d3115cdb0d45f41b89305ea88300f` |
| GitHub checks | verify-main `36756461962`; persona `36756462152`; both passed |
| Final local gate | 426 files / 2,174 tests; zero failures/skips; production build/typecheck passed; lint had zero errors and five existing warnings |
| Runtime / cloud preflight | Seven healthy checks; zero GCP hard failures and one Scheduler warning |

| Real-service journey on this source | Result and retained evidence |
| --- | --- |
| Main user path | Passed login, library, private notes capsule, latest-version Save and use, actual Vertex Ask/history, exact-body review, Markdown/DOCX downloads and paragraph text, edit invalidation, obsolete-export rejection, onboarding, owner isolation, relogin and mobile layout. `approved-refinement-live.json`, tag `1790793469421-9912a685`. |
| Visible signup | Passed Create workspace, Firebase signup, server bootstrap, onboarding and relogin; exactly one 1,000-token starter grant. `visible-signup-live.json`. |
| Three model routes | Economical `gemini-3.1-flash-lite`, Balanced `gemini-3.5-flash`, Complex `gemini-3.1-pro-preview` actually ran on Vertex without fallback and saved histories. `model-policy-live.json`. Execution does not establish analytical quality. |
| TXT/PDF/DOCX reuse | Passed extraction, source/document identity, reject/apply/reload, saved version 3, attachment, source recall, history and mobile library. No external sources, executed tools or agent dispatch. `approved-upload-live.json`, tag `1790794632163-77bfced5`. |
| Queued research memo | Failed at Firestore persistence: optional `sourceReceipts[0].publishedDate` was `undefined`. Run `fd913c21-8906-46b9-8fb2-b2ee7ffa1197` and `failed-9e95085f-memo-persist-*` remain retained. The local serializer fix needs a new deployed worker journey. |

Agent review found unsupported pilot recommendations in Balanced/Complex output. Original answers and quote-based corrections remain in the [quality evaluation](2026-09-30-praxis-quality-evaluation.md). Independent human scores and measured capsule benefit remain absent.

## Firebase Rules evidence

| Evidence | Result and boundary |
| --- | --- |
| Firestore source hash | `f742d194d5ea2868c8efc496cf630386d67b5cdb59dfec84ae20e7c00deed4ba` |
| Storage source hash | `61ee883cbbea13a3acedc089db91ff3fbc6d677398467820e15994f2eeabff37` |
| Operator publication | Both sources compiled, published and read back; rollback identities retained in `operator-both-rules-release-9e95085f.json`. |
| Scoped access | Storage cross-service grant and five-permission CI Rules publisher role verified. Details are in the [account/billing record](2026-09-30-praxis-auth-account-billing-readiness.md). |
| Exact CI identity read/test | No-source build `0d988eed-e4c6-45a1-bc06-0a5a92d2cf01` read both served sources, matched hashes and compiled without errors. `ci-rules-read-preflight-receipt.json`. Create/update execution needs a successful publishing build. |
| User guard checks | All 55 passed: starter-grant/escalation controls, active Firestore/app/Storage use, deleting-owner denial, marker protection and protected-route `409 account_deleting`. `live-rules-propagation-1790795176330-168a9c3c.json`. The synthetic fixture is preserved; complete erasure was not performed. |

Source hashes, publication identities, permission propagation and application journeys are separate evidence. Re-publishing identical bytes may create another ruleset identity; record both.

## Earlier checkpoints and remaining proof

Initial refinement source `2441af6ccecc343d7201ef31e75993c32422128c` ran as `praxis-frontend-01083-hls`, build `c1d042d7-1c6c-4e65-90af-62c432af6bd5`. Its Rules preflight failed with missing `firebaserules.releases.get`; no Rules write occurred. Operator Google refresh and scoped IAM changes later resolved publication. Local ADC expiry did not establish a production outage.

Earlier gates of 2,162 and 2,171 tests preceded the final 2,174-test gate. The Next.js 16.3.6 correction and failed/intermediate assertions remain historical evidence. The serial supervisor has ended; the final release needs a fresh funded acceptance run. No credentials or browser auth-state exports are retained.

Remaining proof includes failed-run settlement/refund idempotency, cancellation and interrupted/concurrent execution, email verification/reset/expiry recovery, complete erasure, OCR/scanned PDFs, native Word formatting, representative-user accessibility/usability, matched analyst-quality studies, paid lifecycle, restore and load testing. Healthy endpoints and synthetic happy paths do not close these gates.

Evidence directory: `output/playwright/practical-refinement-20260930/` (ignored local receipts). The [implementation ledger](2026-09-30-praxis-implementation-ledger.md) maps all 80 recommendations; the [comprehensive analysis](2026-09-30-praxis-improvement-analysis.md) sets priorities and acceptance criteria. [September 29 acceptance](2026-09-29-praxis-production-acceptance.md) remains a separate dated baseline.

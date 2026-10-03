# Cognitive Capsule implementation and publication

Current published application: **`1f029bb829496a0d050f621e57d5d20a8a7d9ea6`**, revision **`praxis-frontend-01112-6x6`**, **100% traffic** at **https://praxis.tacitus.me**. Final source passed 2,851 tests and all five strengthened live journeys. The final receipt below supersedes the historical serving checkpoints.

The October 2 master plan is preserved byte-for-byte in the repository. The [implementation ledger](../build/COGNITIVE_CAPSULE_IMPLEMENTATION_LEDGER.md) inventories every section, wave and first execution task, including the plan's later/conditional phases. The historical checkpoints below record the first execution pack. The [mandatory continuation](../build/COGNITIVE_CAPSULE_CONTINUATION_2026-10-03.md) extends Studio, interviewing, graph review/composition, historical context, specialists, hosted private distribution, CLI/MCP, evidence exports and evaluation contracts. Publication evidence for that continuation is recorded separately below. Neither implementation nor publication establishes empirical model performance improvement.

## First-pack verified source (historical)

- Full suite: **457 files, 2,712 tests passed** on the final implementation.
- Production build and TypeScript: passed on final runtime/compiler/interview/Studio source.
- Full ESLint: zero errors; five pre-existing UI navigation warnings. Final touched source ESLint: zero errors/warnings.
- Full `audit:gate`: passed, including routes, capsule/agent/architecture/surface/runtime/simplification lanes. Separate repository shape, architecture-reference, AI route and GCP readiness checks passed.
- GCP readiness: zero hard failures or soft warnings. This uses existing user auth; local Firebase/ADC provider configuration remains a separate environment limitation.
- Cognitive library V8 coverage: **80.73% statements, 90.09% lines, 67.75% branches, 77.63% functions**, 62 focused tests. Lower branch coverage is a limitation; aggregate percentages do not replace behavioral acceptance.
- Production dependency audit: 17 remaining findings (3 low, 14 moderate), **zero high/critical**. Full audit retains five high findings in development tooling; no forced framework downgrade was applied.
- Graphify AST refresh: 19,444 nodes / 42,578 edges; Terraform/SQL parser extras unavailable. Existing graph/config/audit changes are excluded from published source; originals were preserved before refresh/audits.
- Code review corrected applicability, procedure controls, evidence closure, escaped budgets, source replay locks, actual inspector wiring, Fork preservation, Combine errors, group review confirmation, and interview reference feedback.

The source plan intentionally retains three Markdown hard-break spaces; all implementation diff whitespace checks pass. Its Git attribute disables newline conversion so the committed document matches the supplied file exactly.

## First-pack publication evidence (historical)

Local checks, pushed source, Cloud Build, revision/traffic, public health and authenticated journeys are distinct evidence. The following checkpoints precede the mandatory continuation.

The initial `dcc4905d` publication attempt, Cloud Build `6e7023e9-cc63-4098-8ea4-774669ca5678`, stopped before image creation or traffic changes. Cloud SDK SQL reads returned malformed HTTP 400 responses under the build identity, including both stable and locally matching SDK versions. Direct SQL Admin v1beta4 reads under that same identity succeeded for the instance, databases and users in diagnostic build `77d6a707-7eed-4ede-97f0-d0a7bd87756f`. The audit now uses that authenticated read-only REST path, still rejects denied/missing/malformed results, caches its checks, and never prints access tokens. Two focused regression tests and ESLint passed. No IAM or stored credentials were changed.

The first serving release, source `e13159b69c6972d19051611ca6bb8cc0faa7efef`, built successfully in Cloud Build `2682f7d8-733f-4b24-9677-4dc578fe6bc5` and produced image `sha256:b7a242b6495c189e3f842af048f26264a0bfb3136c10272d77486f25b4cafcc3`, revision `praxis-frontend-01103-p2x`. Traffic was explicitly moved to that revision after tagged health checks; runtime health confirmed the commit. The authenticated canary signed in, created a private synthetic capsule and opened the actual Expertise inspector. Proposal capture returned HTTP 500. Scoped Cloud Run logs confirmed a nested `undefined` review field was rejected by Firestore. This is a failed functional acceptance, despite green health and build checks.

The persistence correction serializes review-card writes and validated cognitive capsule content through the existing JSON-safe boundary. It preserves strict Firestore settings. A strict-write regression first reproduced the exact error, then passed across transactional correction/interview capture, the compatibility write, need-evidence and edit acceptance. The focused cognition/service/route suite passed 134 tests. Live provider tests allow 420 seconds for the complete journey. Final corrected publication evidence follows below.

Corrected-source verification: **458 test files / 2,715 tests passed**; production build, TypeScript, full lint and touched-file lint passed. Production dependencies retain 3 low and 14 moderate findings with zero high/critical. Graphify refreshed to 19,454 nodes / 42,592 edges / 929 communities, with the same missing SQL/Terraform parser extras. Generated graph HTML was moved into ignored local evidence.

### Corrected published checkpoint

- Served application source: `d5efb79ac4e0abe8df0a0c929e8f198f32d1b7a6`, pushed to `main`.
- Successful Cloud Build: `c0f9440d-1aee-4c14-82fe-9cfb6ff8a192`, finished `2026-10-03T07:05:05Z`.
- Image: `sha256:ac48255e461b24dfb9c7edc0579b831a34d8e8685b0470065a9b2c0504b809f1`.
- Revision: `praxis-frontend-01104-85z`, image digest verified against Cloud Build. Tagged runtime returned the exact commit/revision before traffic changed.
- Public traffic: **100%** on that revision. `https://praxis.tacitus.me/api/health/runtime` returned status `ok` and the exact source/build/revision. Homepage and health returned 200; anonymous cognition returned 401. `audit:runtime-health-live` passed.
- Full `audit:gate`, repository shape, architecture-reference, separate GCP and AI-route audits passed on corrected source. Existing audit contents were restored after saving local execution evidence.
- Live protection and authenticated capture/export: **2 tests passed in 19.7 seconds**, including private synthetic capsule creation, actual inspector mounting, distinction capture, need-evidence decision, edit acceptance, capsule version 2 / cognition version `1.1.0`, storage reload, actual browser download and semantic package roundtrip. Original documents were absent from the package.
- Responsive assertions passed at **1280, 768, 390 and 360 pixels**, with no document/inspector/expertise horizontal overflow. Desktop and 360-pixel screenshots were also inspected visually.
- Chat attachment showed the exact persisted **v2** capsule. The opt-in real Ask attempt returned **429** with the UI message that the account's available AI allowance was used. Provider generation, answer quality and persisted exact-version answer receipts therefore remain **unverified**. Credits, credentials and account limits were not changed.
- A separate test-only defect was corrected: Chromium emits download events without a normal page response event. The test now checks HTTP metadata independently and validates the actual clicked download. No application code changed for this correction.
- Local CLI pack → validate → local-registry publish → install passed with a synthetic fixture. This is local distribution proof; no hosted registry publication is claimed. Semantic fixture digest: `sha256:2ca5fb251ce49607532ed67529187690c1404fa0ea755485db77bd4f1f06339d`.
- Original/preserved plan SHA-256 match: `e9936c90ba4a244e6e8bc2f1c8c00f4f054c44d875f11faabee303568c446556`.

Ignored local evidence is under `output/cognitive-capsule-2026-10-03/`: `persistence-full-tests.log`, `persistence-gate.log`, `persistence-public-runtime.json`, `persistence-live-health.log`, `accepted-live-browser.log`, downloaded packages and responsive screenshots. `verified-live-browser.log` and its trace capture the exhausted-allowance result. `corrected-live-browser` captures the earlier download-response test stall. Traces may contain authenticated private QA state; they are not public repository artifacts.

After authorized test-account capacity is available, run the remaining provider acceptance:

```powershell
$env:PLAYWRIGHT_BASE_URL='https://praxis.tacitus.me'
$env:PRAXIS_LIVE_AI_SMOKE='1'
npx playwright test tests/e2e/cognitive-capsule.spec.ts --workers=1 --trace=retain-on-failure --output=output/cognitive-provider-acceptance
```

The subsequent evidence/test documentation checkpoint is distinct from served application source; it requires no new application deployment.

## Explicit remaining scope

This paragraph describes the first-pack release above. The subsequent mandatory continuation implements owner-private hosted registry and dependency installation, graph inspection/review and composition, adaptive interviewing, separate historical attachment contexts, expanded specialists, authenticated CLI/MCP, DocumentIR/SHACL exports and the DIALECTICA draft/native export bridge. Its distinct validation and publication evidence is recorded in [the continuation checkpoint](../build/COGNITIVE_CAPSULE_CONTINUATION_2026-10-03.md). Organization membership governance, sealed-use licensing, marketplace/commerce, AG-UI/A2A and production transparency/key infrastructure retain their explicit conditional status; no such deployment is claimed.

The five benchmark tasks are synthetic contracts. RAG requires a retrieval callback; plain graph ablation excludes expertise/language/procedure/case layers. Representative provider runs, evidence-ID verification and blinded human assessment are required before claiming improved model performance. Structural tests and a later individual live Ask are not such a benchmark.

## Selective-review continuation — verified publication (historical)

The mandatory implementation continuation was served at **https://praxis.tacitus.me**, source **`dd546b5f568b6c5b733ec5074973f89e725ec6b5`**, revision **`praxis-frontend-01109-j2b`**, **100% traffic**. Cloud Build **`7875be65-5308-456e-8b5c-1fcb897ec169`** succeeded; its produced digest **`sha256:fba820b6e5d13d2fd4f5bbb741751fa47dae72e1fd7b3ffdb4f4e195f354dd2e`** matches the serving revision. Tagged and public runtime confirmed exact source/build/revision. Homepage/health returned 200; anonymous cognition/private-registry calls returned 401. Live health audit passed; one transient degraded sample was followed by two all-`ok` checks.

Corrected source passed **477 files / 2,851 tests**, **121 focused tests**, production build/typecheck/lint and all required audit gates. Five inherited lint warnings remain. Production dependencies retain 3 low/14 moderate/0 high/0 critical findings; five development-only high advisories remain. All 59 saved pre-existing audit files match their restored copies, and unrelated configuration/Graphify files remain excluded from release source.

All **five live Playwright journeys passed in approximately two minutes on this exact revision**: anonymous protection; authenticated capture/review/reload/Chat/package roundtrip; selective typed graph review; profile/private-registry publication/install/update/idempotency/CAS/impact/deprecation; and conflict-preserving composition. Composition verifies a 400 incomplete-record guard, approval of only selected complete records/profile, retained pending legacy rows, stale 409, one-item edit without implicit approval, reload and mobile use. Capture overflow checks passed at 1280/768/390/360 pixels, with desktop/mobile screenshots inspected. Private authenticated traces, packages and screenshots remain ignored under `output/live-cognitive-01109*`.

Firestore/Storage rules are published and source-hash readback verified; all three reviewed index exemptions completed and match remote configuration. Independent client-rule propagation acceptance is not claimed. Erasure remains disabled, and no account allowance or credentials were changed. DIALECTICA draft-only compiler/native-export source is separately pushed and remote-verified at `e60bb0525e802ddb0216f1a3ad20695122bd9081`, with no cloud deployment or canonical promotion.

The [continuation record](../build/COGNITIVE_CAPSULE_CONTINUATION_2026-10-03.md) documents the implemented mandatory scope and exact evidence boundaries. Provider smoke stayed disabled after the legitimate canary allowance was exhausted. Actual generated-answer acceptance, representative model ablations, blinded expert efficacy, optional Docling comparison, gold parser benchmarks and external SHACL execution remain unverified. Explicitly conditional distribution/commerce/governance phases are not claimed. The documentation receipt is a later commit; it does not replace the served application SHA.

## Final serving release and acceptance

- Application: **`1f029bb829496a0d050f621e57d5d20a8a7d9ea6`**, pushed to `main`; **https://praxis.tacitus.me**.
- Cloud Build: **`52c8ad9a-bb33-40cd-b4e6-702cc283be59`**, successful.
- Image: **`sha256:b9290398c7281752a98f889383cd5feb23d1db92c358b56cad3eaa4857c9369f`**.
- Revision: **`praxis-frontend-01112-6x6`**, **100% traffic**. The selected revision matches the actual build digest and ID; source labels alone and latest-revision ordering are insufficient because on-push builds run concurrently.
- Tagged and public runtime: exact source/build/revision and status `ok`. Homepage/health 200; anonymous cognition/private registry 401. `audit:runtime-health-live` passed with both health endpoints `ok`.
- Repeated source gates: **477 files / 2,851 tests**, build/types/lint and every required audit passed. Five inherited lint warnings remain; GCP has zero failures/warnings. Graphify: 19,827 nodes / 43,959 edges / 933 communities. Dependency files are unchanged; previously recorded findings remain applicable.
- Final live suite: **all five strengthened journeys passed in 1.9 minutes** on this exact revision, with provider smoke off. Relevant loads/review refreshes/reloads retain one graph/chat/interview panel. Invalid names fail browser pattern validation; valid hyphenated names pass. Capture/package, graph, registry lifecycle and selective composition checks all passed.
- Desktop/mobile screenshots were visually inspected. All five traces show no pattern/key messages or page exceptions. Existing notifications returned console 401s in registry (six) and composition (seven); notification-service acceptance remains separate.

Final QA fixed two further defects. The registry HTML pattern required an escaped hyphen for Chromium's Unicode-set matching. Revision 01110 then exposed duplicate graph/chat panels after saved-version reloads because three React siblings shared the same key; its suite passed three and failed two. Type-prefixed keys preserve one instance per panel and capsule. An actual-component Chromium reproduction grows old graph/chat instances from one to fifteen across eight saved-version cycles, while the corrected component remains singular with zero duplicate-key errors. The final live suite checks those counts directly and removes the earlier graph `.first()` workaround. Earlier passes are not transferred across revisions.

Ignored final evidence is `output/live-cognitive-01112-summary.md`, `output/live-cognitive-01112.log`, private artifacts under `output/live-cognitive-01112/` and source/deployment receipts under `output/cognitive-capsule-2026-10-03/reload-*`. Raw authenticated traces and packages remain private. All 59 pre-existing audit files were restored byte-for-byte; unrelated configuration/Graphify files remain excluded. Rules/index publication/readbacks and disabled erasure remain as recorded above. DIALECTICA source `e60bb0525e802ddb0216f1a3ad20695122bd9081` again matches remote `main`; no engine deployment or canonical promotion occurred.

This publishes the mandatory implementation continuation and its bounded workflow acceptance. Provider efficacy, generated-answer acceptance, representative ablations, blinded expert benchmarks, optional parser/external SHACL acceptance and explicitly conditional governance/commerce/distribution phases remain unverified or deferred as specified. The later documentation receipt is distinct from the served application source.

# Cognitive Capsule implementation and publication

The October 2 master plan is preserved byte-for-byte in the repository. The [implementation ledger](../build/COGNITIVE_CAPSULE_IMPLEMENTATION_LEDGER.md) inventories every section, wave and first execution task, including the plan's later/conditional phases. This release implements the first execution pack and extends it through reviewed Studio capture, six guided interview modes, Chat correction lessons, context compilation, typed memo handoffs and local portability/distribution foundations. It does not establish full-roadmap completion or model performance improvement.

## Verified source

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

## Publication evidence

Deployment and live journey results will be appended after observing the serving release. Local checks, pushed source, Cloud Build, revision/traffic, public health and authenticated journeys are distinct evidence.

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

Hosted registry, organization membership governance, dependency installation UI, sealed-use licensing, marketplace/commerce, AG-UI/A2A, production transparency/key infrastructure, complete DIALECTICA-side ingestion/compiler convergence, a full cognitive graph editor and adaptive model interviewing remain future acceptance. The memo workflow executes a specialist/writer/red-team path; the eight worker views are not eight separately deployed workers.

The five benchmark tasks are synthetic contracts. RAG requires a retrieval callback; plain graph ablation excludes expertise/language/procedure/case layers. Representative provider runs, evidence-ID verification and blinded human assessment are required before claiming improved model performance. Structural tests and a later individual live Ask are not such a benchmark.

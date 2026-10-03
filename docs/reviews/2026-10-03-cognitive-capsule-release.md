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

## Explicit remaining scope

Hosted registry, organization membership governance, dependency installation UI, sealed-use licensing, marketplace/commerce, AG-UI/A2A, production transparency/key infrastructure, complete DIALECTICA-side ingestion/compiler convergence, a full cognitive graph editor and adaptive model interviewing remain future acceptance. The memo workflow executes a specialist/writer/red-team path; the eight worker views are not eight separately deployed workers.

The five benchmark tasks are synthetic contracts. RAG requires a retrieval callback; plain graph ablation excludes expertise/language/procedure/case layers. Representative provider runs, evidence-ID verification and blinded human assessment are required before claiming improved model performance. Structural tests and a later individual live Ask are not such a benchmark.

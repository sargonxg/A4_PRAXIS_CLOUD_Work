# PRAXIS user readiness — 2026-09-30

Status: final source deployed; all four serial core user journeys passed. Final cloud-log inspection awaits restored local Google authentication.
Scope: access/login, questions and writing with attached ContextCapsules, and
separate capsule creation, review and reuse inside the existing Home and Capsules surfaces.

## Current verdict

The final repair source is `4480650999b5bd2808b55cba58f16e5a9a83d343`.
The [production acceptance record](2026-09-29-praxis-production-acceptance.md)
is the source of truth for its build, served revision, CI and real-service results.
Passing health or local tests alone does not establish user readiness.

The initial baseline was `163469a7` / `praxis-frontend-01076-92d`.
The repair sequence `91a7d03c`, `c5148a9a`, `15b04385` and `41e61387`
was deployed and inspected. Its real-service failures remain dated evidence:
direct questions dispatched unwanted agents; empty context revived saved context;
a composed method disappeared; raw receipts omitted the actual provider; and
working notes longer than 1,500 characters caused a heap crash.
The final source addresses those failures. All four fresh acceptance journeys
passed on that exact served source; earlier partial passes were not reused.
See the [runtime audit](2026-09-29-praxis-runtime-evidence.md) and
[acceptance plan](2026-09-29-praxis-user-journeys-plan.md) for the initial investigation.
The preexisting local live-release document remains historical evidence.

## Reviewed implementation

| Problem | Resulting behavior | Main boundary |
| --- | --- | --- |
| Stale account state and request races | Owner-scoped drafts, caches and attachment state; hydration gates and cancellation before sends or writes | Home chat, guide conversation and active-context hook |
| Large capsule inventories | Firestore queries project inventory metadata; full details load when selected; no automatic bulk starter creation | Capsule service, inventory API and workbench |
| Separate builders lacked a shared durable draft | Private canonical save validates owned sources and preserves source IDs; purpose/output preferences remain author instructions | Builder draft service, wizard and Ask handoff |
| Rebuild discarded review decisions | Fingerprints use actual source text and preferences; transactions preserve unchanged decisions and retained document refs | Capsule service |
| Empty Home revived context or direct questions queued agents | Empty selection stays empty; stable owner/thread history; shared restrictions govern routing, streaming tools, calibration and worker retrieval | Ask execution preference, chat route and worker |
| Saved method disappeared beside default context | Explicit dock compositions reload from their saved pointer without bumping canonical evidence/version; legacy migration and Clear remain supported | Workspace context-stack route |
| Switching capsules carried the earlier label/version | Cross-ID swaps reset inherited display metadata; GET/PUT reconcile the governing label and missing version while preserving evidence, explicit pins and dock composition | Active-context stack helper and workspace route |
| Raw chat omitted execution identity and simple recall demanded setup | Successful provider/model receipts use the actual SDK model; supplied-only prompts retain selected evidence and trust frames while omitting internal health/setup blocks | Ask stream helper and calibration |
| Long working notes crashed uploads | Chunking emits the final tail once and always advances; invalid size/overlap options reject before processing | Document service |
| Simple recall inherited a memo schema and speculative judgments | Current question and requested length control the reply; saved output schemas remain artifact preferences | Ask answer policy and context injection |
| A negative research instruction still dispatched research | Explicit negative research invocations keep the answer direct; external-only restrictions preserve requested local document analysis | Ask execution preference |
| Ask writes and saved memo reads failed | Optional undefined fields are removed consistently; canonical memos resolve directly through their owner/case path with scoped legacy compatibility | Ask thread and memo services |
| Generated writing was falsely treated as approved | One body-bound review receipt follows the saved artifacts; edits invalidate prior body review; feedback stays distinguishable from applied corrections | Output review, worker, memo service and writing surface |

Independent agent review accepted the final code fixes. No new primary navigation,
canonical store or agent framework was introduced. The
[analyst guide](../product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md) explains
policy, briefing and narrative workflows; the
[runtime architecture](../architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md)
defines ownership and the existing queue/approval/output boundary.
The [tooling research](2026-09-29-praxis-tooling-research.md) uses dated official
docs and GitHub evidence to prioritize runtime reliability and real output
evaluation before major SDK migrations.

## Final local verification

The final source passed build, typecheck, all non-GCP audit groups,
390 test files and 1,830 tests with zero skips, lint with zero errors and seven
tracked warnings, and dependency audit with 44 moderate/three low findings and
no high/critical findings. Independent diff review accepted all final source/test
paths. Local GCP auditing is blocked by expired interactive auth. The exact-source
Cloud Build resource preflight passed with 37 OK results, zero hard failures and
one soft Scheduler warning. Final privileged runtime-log inspection still awaits
restored sign-in; the production acceptance record retains the remote receipts.
No whole-repository coverage percentage was measured.

The AST-only source graph was refreshed to 17,901 nodes / 39,832 edges without
model/API calls. Optional six Terraform/four SQL parsers remain absent. Graph
artifacts and unrelated local configuration are excluded from the release.
Evidence is retained under `output/playwright/user-readiness-20260929/`.

## Limits and further evidence

Generated memos remain `reviewRequired:true`, `exportReady:false`.
Source diagnostics do not approve an entire draft. An earlier saved synthetic
memo inspection identified a commitment-versus-implementation error: review
feedback must not substitute for correcting the body. Final memo bodies and
review hashes were inspected on the served release; operator/agent-assisted
primary-body corrections persist, invalidate the earlier review and retain
source lineage. This does not approve the draft or prove generator accuracy.

The fresh generated draft also contained funding-stage and citation-attribution
errors. The corrected body removes those deductions and uses uploaded documents
for the synthetic example. Substantiation from two public institutions remains
incomplete; the acceptance record distinguishes operation from source fidelity.

Still unproven: fresh signup/verification/reset, expiry/deletion and two-real-account
switching; paid entitlements/purchases; inventory pagination and capacity; OCR and
long-document limits; duplicate/interrupted worker recovery; and measured gains
in policy or narrative quality. Existing-account login and unit account-isolation
regressions do not prove that complete lifecycle. Optional JEV stays disabled.

Use the concrete continuation prompts in the
[production acceptance record](2026-09-29-praxis-production-acceptance.md).

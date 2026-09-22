# PRAXIS: product readiness and capsule-to-analysis plan

Date: 2026-09-20. Scope: assessment and proposed work, not implementation approval.

## Decision

PRAXIS has a deployed, functioning agent-runtime foundation and substantial capsule UX. It is a credible guided-pilot product. Broad paid self-service readiness is not established. The highest-value work is to complete and measure two connected workflows: customer material to reviewed capsule, and reviewed capsule to useful analysis and reusable knowledge.

Do not use the June 24 readiness score as today's score. Important defects were fixed afterward, and current CI provides stronger live runtime evidence. Do not substitute another numerical readiness score for missing quality, retention, and operating evidence.

## Evidence checked today

| Area | Current evidence | Limit |
|---|---|---|
| Production | Home and pricing render; health endpoints return 200. Runtime reports `09b70535f6c17319b476c6c9e5c91d71947e0bee`, revision `praxis-frontend-01062-2tf`. | Public navigation and HTTP checks are not a fresh-user authenticated browser test. |
| Release | Live commit equals remote main. Latest checkpoint is July 8. Local checkout is nine commits behind; remote files were inspected with `git show origin/main:...`. | No merge, pull, deploy, or source edits performed. Existing `.serena/project.yml` change preserved. |
| CI | `verify-main` passed July 8 on deployed SHA. Daily `persona-smoke` passed September 20 and the previous five listed days. | Workflow names alone do not prove output quality. |
| Live canary | September 20 run `35521931396` reports capsule activation, authenticated Ask, AgentRun creation/dispatch/approval/worker completion, stream checks, memo persistence, and original-thread readback passing. | Run is explicitly created by the canary; this does not prove Ask automatically routes deep work correctly. Memo persistence uses a synthetic pack. Thread check verifies conversation ID, not the actual returned agent-result turn. |
| Browser golden path | Authenticated UI tests exist and CI passes. | The generation/export/boardroom golden path intercepts key API responses with fixtures. Keep these UI tests, but add a real integrated product proof. |
| Runtime health | Cloud Tasks queue is actively checked. Ledger, backend, worker and platform status mostly derive from configuration presence. | A green summary is broader than its dependency probes. Live canary supplies additional execution evidence. |
| Billing | `/api/health` reports `polar: unconfigured`; public pricing explicitly says checkout is not configured. | No checkout or purchase attempted. |
| Optional graph/memory | Cognee, GraphLite and TrustGraph report unconfigured. | These optional adapters are not prerequisites for the first sellable workflow. |
| Analysis evaluation | Existing comparison report is explicitly `deterministic-contract-eval`; scorer awards points for supplied boolean capability flags. | Its 67.5-point delta is not a measured advantage over a real general-purpose model. |
| DIALECTICA | Local and remote main match `3887db3`; README describes a local executable loop plus hosted MCP surface. | README explicitly defers live model calls, durable storage/jobs, tenant-aware hosted authorization and PRAXIS frontend integration. Hosted deployment was not independently verified. |
| Cloud operations | Read-only scheduler/service queries attempted. | gcloud token refresh requires reauthentication. IAM, scheduler inventory, logs, backup/restore and cloud cost were not verified. |

Evidence links:

- [Live runtime](https://praxis.tacitus.me/api/health/runtime)
- [Live health](https://praxis.tacitus.me/api/health)
- [Pricing](https://praxis.tacitus.me/pricing)
- [September 20 CI/canary](https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/actions/runs/35521931396)
- [Deployed-commit verification](https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/actions/runs/28952864137)
- `scripts/praxis-doctor.ts`, `tests/e2e/golden-path.spec.ts`
- `src/lib/health/runtime-health.ts`, `src/lib/agent-runtime/research-eval.ts`
- Remote main: `STATUS.md`, `docs/architecture/CAPSULE_ATTACHABLE_DOCK_BUILD.md`, `docs/architecture/CAPSULE_ONTOLOGY_SEMANTIC_STRUCTURE.md`
- DIALECTICA: `README.md`, `AGENTS.md`, `docs/SOURCE_OF_TRUTH.md`, `docs/NEXT_CODE_BUILD_PLAN.md`

No new production users, capsules, runs, purchases, or cloud resources were created in this assessment. Existing CI results were read. No full build/test suite was rerun.

## Existing strengths to build on

The current code and release history include Ask, four typed capsule slots, source/claim panels, capsule inspection and facets, versioned data structures, review proposals, private forks with reset trust state, boardroom context selection, durable queued runs, approval controls, drafting/export routes, and DIALECTICA import contracts. July added generation transparency and adoption provenance. June fixes addressed help/work separation, run context capture, and temporal sorting; July addressed onboarding skip and Inspect behavior.

The task is to join and harden these capabilities, not start the platform over.

## Product brief

Working customer hypothesis: a small policy research, geopolitical-risk, or public-affairs team with recurring briefing obligations, its own documents, and a reviewer who must defend conclusions. Validate this hypothesis before broadening to unrelated professions or institutional procurement.

Core promise: turn your sources and expertise into reusable, reviewed context; use it to produce defensible briefs, options and updates; preserve what the team learns.

First three jobs:

1. Build a living issue dossier from documents, URLs, notes and analyst corrections.
2. Produce a decision brief: what happened, why it matters, competing explanations, feasible options, uncertainties and next actions.
3. Update the brief when evidence changes, showing which claims and recommendations are affected.

The desired experience is a visible improvement in the analyst's work, with less repeated briefing of the model. Capsule terminology should become useful through that experience. Users should not need to understand ontologies or fill all four slots before their first result.

## Pillar 1: capsule creation and maintenance

### Intake and elicitation

- Support the first pilot's actual PDF/DOCX/URL/text material, with extraction status, page/section anchors and retry. Add OCR, tables and multilingual handling where the pilot corpus requires them; show unsupported input clearly.
- Capture the analytical question, jurisdiction, time horizon, audience and intended decision. Ask targeted follow-ups about missing constraints and institutional knowledge.
- Record source identity, content hash, publication/retrieval date, access/rights, sensitivity, ownership and extraction confidence. Preserve immutable evidence spans.
- Deduplicate documents and syndicated sources. Distinguish independent corroboration from repeated copies of one assertion.

### Reviewable knowledge

- Propose actors/entities, claims, events, commitments, definitions, competing interpretations, open questions and expert heuristics.
- Keep observed fact, attributed assertion, analyst judgment, assumption and generated hypothesis distinct. A source supports what it actually establishes, not every conclusion made from it.
- Show the supporting passage next to each material proposed claim. Support accept, edit, reject and approve-with-caveat without hand-editing JSON.
- Record review author/date, scope, expiry and reasons. Prevent an imported or forked approval from becoming the new owner's approval automatically.
- Treat document text and shared capsule instructions as untrusted content. Enforce tool rights, privacy and promotion permissions in server code.

### Living capsules

- Version source and knowledge changes; enable useful diffs, rollback and version pinning for reproducible analyses.
- Separate event time, publication time and the time PRAXIS learned something. Surface stale or retracted evidence and dependent claims.
- Propose updates and show affected outputs. Review material changes before promotion; prevent generated text from feeding back as independent evidence.
- Make source quality, evidential support and freshness inspectable. A large graph or a high metadata-completeness score is not proof of truth.
- Finish the narrow DIALECTICA adapter: live extraction proposals, durable owner-scoped build jobs, editable PRAXIS review, integrity verification, import/export compatibility and idempotent promotion receipts.

Acceptance: a pilot analyst can upload a small real source pack, correct one extraction, reject one claim, save a capsule, reuse it, add a changed source, review a diff and reproduce an earlier answer against its earlier capsule version.

## Pillar 2: useful policy and political analysis

Each serious brief should expose the question and scope, key judgments, evidence and counterevidence, assumptions, actors and incentives, constraints, timeline, options and tradeoffs, implementation barriers, scenarios, indicators and open questions. Use the subset appropriate to the task; do not force every answer into a long template.

For political analysis, include institutional rules, coalitions, veto players, interests, implementation capacity and uncertainty. Do not let the user's preferred outcome or writing voice alter the underlying evidence.

For ideas, generate several plausible options, explain the mechanism and prerequisites, test them against stakeholder incentives and operational constraints, and distinguish imaginative proposals from supported predictions. Useful creativity is both expansive and testable.

Provide source-only and source-plus-current-research modes. Explain unavailable retrieval and evidence gaps. Citation presence must not be treated as citation entailment. Preserve meaningful minority or alternative interpretations without imposing artificial balance.

Confidence in the evidential basis and probability of a future event are different concepts. Avoid unsupported numerical precision. Where forecasts are made, record outcomes and assess calibration over time.

## The agent harness to finish

The existing runtime should implement and prove this bounded loop:

`question -> scoped plan -> versioned context selection -> gap research -> claim verification -> analysis -> independent challenge -> revision -> user review -> artifact -> proposed capsule update`

Required checks, whether already partially implemented or new:

- Immutable run inputs: capsule versions, retrieval receipts, model/prompt/tool versions and effective permissions.
- Task-relevant retrieval across capsules and documents; explicit conflict precedence; no cross-tenant retrieval leakage.
- Existing prompt-budget controls extended with inspectable evidence selection and omitted-context receipts. Preserve constraints and key evidence under load; a graph that never affects retrieval will not improve answers.
- Separate source checking from stylistic criticism. Give the challenger explicit failure criteria and preserve substantive disagreements.
- Hard time, tool-call, token and spend budgets, cancellation, retry/idempotency, durable checkpoints, approval expiry and recovery after process restart.
- Genuine progress and partial results, with clear recovery when providers, parsing, queues or tools fail.
- Server-enforced authority boundaries. Read/research/propose can be automatic within scope; external actions and canonical knowledge changes follow the product's approval rules.

Use multiple agents when a task benefits from independent checking or parallel research. Add agent roles only when evaluation shows a quality or latency benefit.

## Proof of quality

Build a small expert-authored benchmark before expanding the catalog. Proposed first set: 30-50 realistic tasks across the first three customer jobs, including contradictory sources, outdated evidence, sparse evidence, multilingual ambiguity and malicious instructions in documents.

Compare the same model and question under controlled conditions:

1. Basic prompting.
2. The same raw documents.
3. The same material compiled into reviewed capsules.
4. Capsules plus the bounded research/review workflow.

Give conditions comparable search access and budgets; record cost/latency tradeoffs. Blind expert reviewers to condition. Measure factual correctness, material unsupported claims, citation entailment, omissions, temporal accuracy, counterargument quality, decision usefulness and required editing time. Repeat enough cases to assess variability. Keep regression tasks separate from prompt-tuning examples.

Proposed pilot goals, to validate rather than present as achieved: a clear expert preference for capsule-backed outputs, meaningfully lower editing time, no fabricated citations in the release set, and no silent unsupported claims in an output labeled ready. Publish denominators and failures, not only averages.

## First-use and repeat-use experience

- Offer three obvious starting actions inside the existing cockpit: ask a question, use a curated capsule, or build from my material.
- Auto-suggest a method and output format. Let users edit the four roles without requiring four setup decisions.
- Show a sample finished brief before signup and a useful starter result quickly afterward. Proposed usability target: first useful result within five minutes for a small supported input.
- Lead answers with the conclusion, then evidence, caveats and actions. Keep detailed agent traces expandable.
- Make claim-to-passage inspection, revision, export and saving improvements natural next actions.
- Start with 5-10 excellent maintained capsule examples for the target customer. A 205-item starter catalog does not by itself establish expert quality.
- Build the return reason around meaningful changes to a user's dossier and saved work. Monitoring needs opt-in scope, source freshness, deduplication, spend controls and actionable notifications.
- Test keyboard use, screen readers, mobile reading, loading/error states, stalled uploads and interruption recovery.

## Commercial and operating readiness

### Required before broad paid self-service

- Activate and test billing, entitlements, cancellations, failed payments, duplicate/out-of-order webhooks and billing recovery. Existing signature verification and duplicate-event handling are a foundation.
- Verify every advertised plan entitlement. Current public pricing is Practitioner $49/month and Team $199/month with per-seat wording; test willingness to pay and unit economics before treating those prices as validated.
- Provide clear usage allowances and measure cost per useful deliverable, heavy-user margin and support effort.
- Prove tenant isolation across uploads, retrieval, runs, exports and shares; test untrusted source/capsule injection, malicious files and URL ingestion controls.
- Prove retention/deletion, export, revocation of share links, backup restore, log redaction, incident alerts and rollback. Explain data handling and model-provider use accurately.
- Review dependency advisories: today's CI doctor warns of 29 advisory groups requiring forced or breaking updates. This is triage evidence, not a claim that every item is exploitable in production.
- Verify scheduler expiry/recovery jobs. Canary cleanup is still reported as planned; define actual cleanup/retention and isolate synthetic activity from product analytics.
- Replace configuration-only health assertions with correctly named checks and selected dependency probes. Retain the real canary.
- Track completion rate, latency, source failures, abandoned runs, first-use activation, capsule reuse, weekly analyst retention and paid conversion.

### Team and institutional expansion

Shared libraries need genuine organization membership, roles, review ownership, permissions, comments, activity history and handover. Enterprise SSO, contractual residency, private deployments and procurement controls should be delivered against an actual customer requirement. Public claims must distinguish available behavior from configurable or future options.

## Execution order and exit gates

| Order | Work package | Exit evidence |
|---|---|---|
| 1 | Establish truthful product proof and a target customer | Real-document browser journey, actual Ask-triggered run, actual returned result turn, source inspection and exported generated content; pilot problem and expert rubric agreed. |
| 2 | Complete source-to-reviewed-capsule workflow | Durable scoped intake, source anchors, editable decisions, versioning and lossless DIALECTICA adapter round trip. |
| 3 | Demonstrate analysis advantage | Controlled live comparisons plus blind expert review; errors improve and editing time falls relative to raw documents. |
| 4 | Package a guided paid pilot | Curated starters, low-friction onboarding, three excellent output workflows, support and tested billing/entitlements. |
| 5 | Harden for self-service and teams | Tenant/security/recovery proof, cost and latency budgets, retention evidence and dependable shared work. |

These are dependent milestones, not a delivery-date estimate. Some UX, evaluation and billing work can proceed alongside engine integration. Do not promise a timeline before sizing the live DIALECTICA and persistence work.

Start with a handful of design partners and real recurring work. Track accepted briefs and capsules reused on a later task, not just messages sent or accounts created. The main competitive hypothesis is cumulative, reviewable institutional context that measurably improves subsequent work.

## Work to defer

Avoid expanding the general tool catalog, adding top-level product surfaces, activating every graph/memory adapter, introducing more storage systems, launching a public capsule marketplace, or building broad autonomous external actions before the two core workflows pass their gates. AGON/KAIROS can contribute through the established adapter boundary when they improve a measured task.

Maintain PRAXIS as the visible product. DIALECTICA owns its ingestion/build/review records; PRAXIS retains canonical user-facing capsule/library state. Reconcile through versioned proposals and promotion receipts. Existing PRAXIS V3 and DIALECTICA bundle contracts should be mapped and tested, not treated as identical formats.

## Assessment limits

No new authenticated production browser journey was executed. No model-quality benchmark, user interview, revenue/retention measurement, dependency exploitability review, or cloud-control-plane audit was completed. Recommendations above are explicit product/build proposals; gaps labeled as unverified are not claims that functionality is absent.

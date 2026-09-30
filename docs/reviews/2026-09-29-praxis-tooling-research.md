# PRAXIS tooling research — 2026-09-29

Scoped decision memo for the existing Ask PRAXIS, capsule builder and policy-writing workflows. Public sources were retrieved on **2026-09-29**, approximately 23:22–23:31 UTC. This research used `research-ops`, `exa-search` and `agent-self-evaluation`. It changed no runtime code, dependency, configuration, credential or cloud resource.

Local wording was refreshed on **2026-09-30** against the current source and acceptance documents. Public version/source observations retain their September 29 retrieval date; this refresh made no public-source or live-service calls.

The latest local behavior inspection used source `4480650999b5bd2808b55cba58f16e5a9a83d343`. The stored final acceptance index was checked locally against that same source; no browser or live-service calls were repeated by this researcher.

## Decision

Keep the current runtime and improve its proof, recovery and analytical quality. PRAXIS already has the components needed for a streamlined analyst workflow: Firebase login, capsule attachment, reviewed capsule proposals, bounded Ask tools, queued AgentRuns, source receipts and saved memo output. Additional agent frameworks would add another state and recovery boundary before those journeys are fully demonstrated.

This is a research recommendation supported by the coordinator's current operational evidence. The [user-readiness receipt](2026-09-29-praxis-user-readiness.md) tracks repairs; the [production acceptance receipt](2026-09-29-praxis-production-acceptance.md) owns the served release, complete results and limits. The preexisting local `2026-09-29-praxis-live-release.md` remains historical evidence.

The local `output/playwright/user-readiness-20260929/final-acceptance-index.json`, summarized in the [production acceptance record](2026-09-29-praxis-production-acceptance.md), records **PASS** for all four serial phases on source `44806509`: capsule studio, Home Ask/save, conversation-to-capsule, and agent/memo/logout. End runtime was healthy at **2026-09-30 07:40:43.555 UTC**. The final journey saved and reopened operator/agent-assisted corrections to the primary memo with citations retained and the prior review outdated; responsive Close and actual logout/protected-route isolation passed. This proves the tested operating loop. It does not establish generator accuracy, correct source attribution, measured capsule improvement, or independent end-user validation. A fresh Cloud Run log window and separate control-plane inspection remain with the release lane pending restored Google sign-in; no clean-log claim is made here.

## Verified local facts

- [Canonical runtime architecture](../architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md) assigns product context to ContextCapsules/Firestore, run state and approvals to the Cloud SQL ledger, dispatch to Cloud Tasks, bounded typed work to Genkit, and selected long-running work to ADK. Provider sessions and traces do not replace product state.
- `src/lib/ai/ask-answer-stream.ts` already limits Ask to six steps and reserves the final step for an answer. Do not re-propose implementing a basic tool loop.
- `readAskModelIdentity()` reads `provider` and `modelId` from the same constructed model object used for Ask generation. The chat route records that identity for each fallback attempt; routing labels, client settings and intended model tiers are not proof of which model executed. The final operational receipt includes actual provider/model provenance; model identity does not verify an answer's claims.
- `ask-execution-preference.ts` shares explicit execution restrictions with routing and tools. Direct/no-agent instructions override agent selections, and negative invocations such as “do not run/do/perform/conduct research” constrain execution. An external-only research prohibition preserves expressly requested local analysis of attached documents; quoted examples and conceptual mentions do not become execution restrictions. Supplied-only turns exclude unrelated workspace retrieval and sample graph fallback while retaining selected capsule evidence. The provided-evidence-only directive forbids external retrieval and invented source receipts. The final canaries exercised direct/supplied-context turns; broader prompt coverage remains a regression/evaluation concern.
- `ask-answer-policy.ts` appends the current-question contract after work-intent/method prompts for restricted supplied-context turns. Recall, restatement and extraction should return the requested supplied values briefly, retaining missing/ambiguous/synthetic caveats without unrequested judgments, recommendations or setup questions. Capsule-builder formats and JSON schemas are saved preferences for requested artifacts; they do not force every recall turn into a memo. Explicitly requested analysis or writing retains its artifact and review requirements. Brief recall passed the final operational journey; generalized answer quality is not measured by that pass.
- `swapCapsuleRef()` clears omitted label/version metadata when changing capsule IDs. `/api/workspace/context-stack` GET/PUT reconciles the governing capsule's label and missing version against the owner-resolved canonical capsule, preserving explicitly pinned versions, other dock roles/composition and evidence refs. The final browser journey passed visible attachment, saved reload and memo-return identity checks; it does not prove arbitrary composition/load behavior.
- The [streamlining review](2026-09-29-praxis-streamlining.md) already records responsive builder changes, grounded Google Search selection, substantive citation segments, recoverable save errors, history-race repairs and completed-run metadata work. They are existing work, not new research recommendations.
- `src/lib/agent-runtime/postgres.ts` has owner-scoped run idempotency and dispatch claims; `cloud-tasks.ts` uses deterministic task names. Worker functions short-circuit succeeded runs. These mechanisms do **not establish** that two deliveries executing concurrently or a lost response after a successful artifact write cannot duplicate effects; that requires targeted proof.
- `scripts/eval-agentic-research.ts` labels its output `deterministic-contract-eval`. `research-eval.ts` compares configured boolean capabilities against a configured baseline; it does not measure generated answers or prove that capsules improve policy analysis.
- `.github/workflows/persona-smoke.yml` already has authenticated smoke checks and a scheduled/manual live canary. `scripts/praxis-doctor.ts` creates a synthetic capsule directly; this differs from exercising real document intake, proposal review and saved capsule reopening through the builder.
- The [canonical backend integrations guide](../architecture/PRAXIS_BACKEND_AGENT_INTEGRATIONS.md) points to the TypeScript AgentRun/Cloud Tasks runtime and current acceptance receipt. It marks Python ADK and earlier LangGraph/checkpoint scaffolding as optional integrations or experiments, rather than a separate public research application. Use this guide for the current boundary; the backend README remains an older entrypoint.
- The generated-writing repair retains a body-bound review receipt across memo/version/block/output/run artifacts. Input-evidence sourceability counts remain separately scoped, and edits invalidate the earlier body's review. Final operational checks passed artifact consistency and edited-body review invalidation. Saving citations, zero input-evidence flags or an unapplied critique cannot approve the whole generated draft; corrected writing remained review-required and export-blocked.

## Version evidence, not an upgrade instruction

Installed values below are from the checked-in `package-lock.json`; Python ADK is the source pin in `backend/agents/requirements.txt`, not an assertion about the deployed environment. Registry values are the `latest` dist-tag observed during retrieval, not a compatibility assessment.

| Component | Local lock/pin | Public version observed September 29 | Evidence |
| --- | --- | --- | --- |
| AI SDK core | `6.0.286` | Registry `latest`: `7.0.122`; stable 6.x release observed: `6.0.296` | [7.0.122 release](https://github.com/vercel/ai/releases/tag/ai%407.0.122), [6.0.296 release](https://github.com/vercel/ai/releases/tag/ai%406.0.296) |
| Google Vertex AI SDK provider | `4.0.201` | Registry `latest`: `5.0.98` | [Registry metadata](https://registry.npmjs.org/%40ai-sdk%2Fgoogle-vertex) |
| React AI SDK client | `1.2.12` | Registry `latest`: `4.0.125` | [Registry metadata](https://registry.npmjs.org/%40ai-sdk%2Freact) |
| Genkit JavaScript | `1.42.0` | Registry `latest`: `1.42.0` | [JavaScript release](https://github.com/genkit-ai/genkit/releases/tag/genkit%401.42.0) |
| Genkit plugins | Vertex: `1.42.0`; Google GenAI: `1.35.0` | Plugin parity was not assessed | Local lockfile; do not infer parity from the core version |
| Python ADK | `1.31.1` | GitHub latest release: `2.10.0`, published September 25 | [ADK Python release](https://github.com/google/adk-python/releases/tag/v2.10.0) |
| Playwright test | `1.59.1` | Registry/GitHub: `1.63.0`, published September 4 | [Release notes](https://github.com/microsoft/playwright/releases/tag/v1.63.0) |
| Next.js | `16.3.5` | Registry `latest`: `16.3.7`, published September 29 | [Registry metadata](https://registry.npmjs.org/next) |

Genkit's repository has multiple language and CLI releases. Its `/releases/latest` returned Python `py/v0.12.0`; CLI `1.43.0` is a separate release. Neither means JavaScript core `1.43.0` is available. npm lists Genkit `1.42.0` publication on September 1; GitHub lists its release on September 2. These are distinct publication records.

The installed React SDK is still used by `src/components/runs/run-timeline.tsx`; `legacy-data-stream.ts` explicitly supports that client. A client upgrade needs transport-contract coverage. The [AI SDK 7 migration guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0) documents ESM-only packages, changed step/result semantics and telemetry registration, and several API migrations. Current unversioned examples may describe SDK 7 behavior; verify against SDK 6 before copying them into this checkout.

## Four concrete recommendations

| Priority | Adopt or defer | Existing owner | Concrete acceptance evidence |
| --- | --- | --- | --- |
| 1. Now | Adopt a release journey that exercises both product pillars | Existing Playwright tests, authenticated runtime lane and current production acceptance receipt | Real Firebase login → direct Ask/write honoring no-agent and supplied-only instructions → attach saved capsule → later persisted recall; separately TXT/PDF/DOCX or conversation/idea → proposal → edited review → save/reopen → attach → sourced Ask; deliberate research completes through approval to an editable saved memo with inspectable source references and body-review lineage |
| 2. Now | Adopt focused recovery and duplicate-effect verification | Existing capsule APIs, Cloud SQL run ledger and Cloud Tasks worker | Same operation after a lost response returns the persisted result; two authenticated worker deliveries cannot create duplicate memo/capsule outputs or bypass review; cancellation and interrupted work resolve visibly |
| 3. Next | Adopt a small real-provider policy-quality dataset | Existing Genkit flows, sourceability ledger and research evaluation harness | Same questions/model/source snapshot run with and without the reviewed capsule; analyst rubric and receipts show what improved and what did not |
| 4. Later, scoped | Evaluate ADK continuation and compatible maintenance updates; defer SDK 7 and new frameworks | Existing ADK bridge, PRAXIS run ledger and dependency maintenance lane | One interrupted selected agent resumes with the same owner, capsule version and approvals; every saved output/receipt remains in PRAXIS; version changes pass the existing user journeys |

### 1. Reuse the authenticated testing tools already present

The official [Playwright authentication guide](https://playwright.dev/docs/auth) recommends separate accounts per parallel worker when tests modify shared server state. For this small live lane, a single disposable account and serialized mutations are adequate; parallelize only with isolated accounts or inputs. Do not count a skipped authenticated test or a mocked provider response as live proof.

Retain the current scheduled canary. Reuse the actual three-format builder test at release checkpoints so source IDs, review decisions, reopening and later Ask are checked together. Record the served commit/revision, model identity from the execution object, source/tool activity, capsule/run/memo IDs and final persisted assertions in the same receipt. Include an explicit direct/supplied-only turn that cannot queue an agent or retrieve unrelated saved/public evidence. The test should fail on an empty answer, missing evidence pointers, stale attachment, absent saved output, inconsistent body-review lineage or unknown terminal state. A successful provider request or saved artifact alone does not establish useful reviewed writing.

Playwright `1.63.0` adds named locks for shared test resources. This is useful later if the suite expands; serializing the small live lane on the installed version solves the immediate repeated loop without upgrading solely for that feature.

### 2. Finish recovery within the existing durable boundary

Google's [Cloud Tasks duplicate-execution guidance](https://cloud.google.com/tasks/docs/common-pitfalls#duplicate_execution) explicitly says duplicates can occur. A deterministic task name deduplicates enqueueing; it does not guarantee exclusive execution or exactly-once application writes.

Inference from the existing code and the streamlining review: prioritize lost-response reconciliation and concurrent-delivery proof over another queue or workflow engine. Use a stable operation identity scoped to the authenticated owner and durable lookup of completed results. Inspect whether execution ownership, conditional ledger updates and artifact identities cover retries across worker instances. This is a focused verification/hardening recommendation, not a confirmed production incident from this research.

Keep human-reviewed proposal promotion separate from retry handling. A retry must preserve the reviewed decision and source identifiers rather than regenerating canonical state. [HTTP target tasks](https://cloud.google.com/tasks/docs/creating-http-target-tasks) also document handler timeouts and token validation; long analysis must preserve visible progress and recovery within those limits.

### 3. Measure the analytical value of capsules

Official [Genkit JavaScript evaluation](https://genkit.dev/docs/js/evaluation/) supports datasets, flow evaluation and evaluation of extracted traces. [ADK evaluation criteria](https://google.github.io/adk-docs/evaluate/criteria/) cover tool trajectories and response quality. Start with existing Genkit infrastructure, rather than adding an evaluation service.

Use six to ten synthetic or public policy cases: a short decision memo, conflicting official sources, actor/claim narrative comparison, a time-sensitive claim, an intentionally rejected capsule proposal, and a missing-evidence question. Hold the executed model identity, question, allowed tools and source snapshot constant across a plain-source baseline and a reviewed-capsule variant; record fallback identity rather than assuming the requested tier ran. Include a supplied-only case to detect model-prior assertions, unrelated workspace retrieval or external search. Score citation-to-claim fidelity, policy relevance, commitment versus implementation, allocation versus expenditure, unknown versus absent funding, separation of evidence from assumptions, handling of contradictory narratives, useful options, and writing clarity. Include repeated runs and latency; report failures as well as gains.

Prioritize evidence retrieval and saved-body inspection before claiming quality improvement. Provider-attributed grounding segments are not original source passages. Use the existing uploaded-document and source-linked retrieval paths to retain bounded original excerpts with source identity and location; compare material claims against those passages, not only a URL or model summary. Synthetic case facts must stay attributed to supplied context, while an external citation supports only the general proposition its original source establishes. Misnamed institutions, incomplete source substantiation and missing passages remain explicit review gaps.

Deterministic schema/ownership/receipt checks remain release gates. Inspect the saved primary body and its hash-bound review, not only input-evidence counts or appended critique. Retain corrected bodies and edit/reopen lineage; do not infer publication readiness from zero input-evidence flags. Score original generated bodies separately from operator/agent-assisted editor corrections: an improved saved version proves editing and persistence, not generator accuracy. Human review of a small set and optional model-judge scores are quality evidence; a model judge is not a factual oracle. Do not publish a numerical claim that capsules improve analytical quality until generated artifacts, evidence and scoring are retained for inspection.

### 4. Adopt continuation only for a demonstrated long-running need

The [ADK resume guide](https://google.github.io/adk-docs/runtime/resume/) explains resumable workflow configuration, persisted events and completed tool results; custom agents need explicit checkpoints. It documents this capability in ADK Python 1.x, so a major ADK upgrade is not automatically necessary to test it. ADK Python `2.10.0`, observed on September 29, introduces additional efficiency-evaluation metrics, but its release is not proof that a deployed PRAXIS path needs migration.

Try one existing queued agent behind the PRAXIS ledger if interruption is a real failure mode. Preserve owner checks, review gates, source receipts and output references. Defer a separate ADK JavaScript/Go stack, new LangGraph expansion, generic browser agents, A2UI/generated UI and a second canonical memory store until a concrete user journey requires them. [Genkit durable streaming](https://genkit.dev/docs/go/durable-streaming/) discovered during research is explicitly documented for **Go preview**; it is not evidence of a drop-in JavaScript durability solution.

For a later compatible maintenance patch, evaluate AI SDK `6.0.296`: its release notes fix preservation of tool metadata and provider metadata on stream chunks, which is relevant to PRAXIS receipts. Validate actual Google-grounded citations and the legacy React stream adapter before promoting it. Plan SDK 7 as a separate migration because of the documented stream, result and telemetry changes. Do not combine a major migration with live workflow recovery.

## TACITUS positioning inspiration

The fetched [TACITUS homepage](https://www.tacitus.me/) is titled **“AI you can check · Context Capsules for serious knowledge work”** and describes PRAXIS as the **“AI analyst workbench for statecraft, policy, and mediation.”** Its public framing emphasizes inspectable reasoning. This is positioning evidence, not evidence that every claimed engine path is integrated or live-proven. Extraction captured metadata/navigation/footer and may omit client-rendered sections; no visual homepage audit was performed here.

Recommendation: preserve the [public copy contract](../product/PRAXIS_PUBLIC_COPY_CONTRACT_2026-06-09.md): ask the question, attach sources or saved context, review the evidence and assumptions, and leave with a useful written product. For policymakers, offer a decision brief with options and caveats. For analysts, make a claim inspectable through its source. For narrative analysis, separate actor statements, inferred frames and contradictory evidence. Context capsules should carry reviewed context between those tasks without introducing another top-level app or implying that saved context verifies itself.

## Research self-check

Overall **4.2/5**: recommendations fit the existing architecture and dated primary-source evidence. The scoped operating loop passed in the coordinator's exact-source receipts; generator/source accuracy and measured analytical improvement remain unproven.

| Axis | Score | Evidence and limit |
| --- | --- | --- |
| Accuracy | 4 | Version claims use registry and per-package release records; public docs can drift and local dependency pins do not prove deployed versions. |
| Completeness | 4 | Covers current SDK/Genkit/ADK, durable delivery, testing, final operational receipts and TACITUS positioning; does not perform a deployed dependency inventory, visual TACITUS audit or measured quality comparison. |
| Clarity | 5 | Local facts, inference, recommendations and version boundaries are explicit. |
| Actionability | 4 | Four recommendations have existing owners and acceptance evidence; implementation remains outside this research-only file ownership. |
| Conciseness | 4 | Version/source detail enables review but makes this longer than the user-facing status. |

Highest-impact next step: retain the passing journey gate, then improve original-passage retrieval and inspect generated bodies with the small quality corpus. Prove duplicate/lost-response recovery separately. Self-check: an operating tool and a corrected saved product do not establish generator accuracy; report both the current operational pass and its quality limits.

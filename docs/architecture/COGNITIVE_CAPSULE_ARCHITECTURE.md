# Cognitive Capsule architecture

Source specification: [Cognitive Capsule master plan](../product/COGNITIVE_CAPSULE_MASTER_PLAN_2026-10-02.md). Implementation accounting: [implementation ledger](../build/COGNITIVE_CAPSULE_IMPLEMENTATION_LEDGER.md).

## Product contract

A Cognitive Capsule is portable expert context and practice: facts, evidence, distinctions, cues, heuristics, language rules, procedures, cases, and explicit limits. It is an expert cognitive scaffold. Structural validation checks representation and relationships; it does not establish factual truth or expert certification.

PRAXIS owns asking, drafting, capsule inspection, expert elicitation, human review, and agent orchestration inside the existing Home and Capsules workbench. DIALECTICA owns ingestion, normalization, extraction, identity resolution, ontology alignment, temporal/provenance modeling, and context compilation through a narrow versioned adapter. The registry distributes immutable packages. The agent runtime executes bounded workflows with PRAXIS-owned runs, approvals, receipts, and working state.

## Inventory and compatibility

Baseline inspected: `8ff509b8`, matching the specification's reviewed revision. `graphify-out/GRAPH_REPORT.md` describes 18,626 nodes and 40,978 edges extracted from `01a95497`; it is a navigation aid, not current implementation proof. No `graphify-out/wiki/index.md` was present. A graph query identified the capsule-service, capsule-v3, agent-context-packet, workbench, and worker communities; the mappings below were checked against source.

Two existing models must remain distinct:

1. `PraxisCapsule` in `src/lib/context/capsule-service.ts` stores the user-facing canonical envelope at `users/{uid}/capsules/{capsuleId}`. Its schema is numeric V1/V2/V3 and its capsule version is an integer. Read normalization preserves compatibility.
2. `ContextCapsule` in `src/types/context-capsule.ts` and `src/lib/capsules/storage.ts` uses the separate top-level `capsules` collection, semantic versions, content hashes, composition references, and published immutable versions. It is an existing package/registry contract, not the workbench's canonical envelope.

Add a versioned cognitive extension to the workbench envelope. Do not relabel every existing V3 capsule as V4, overwrite the semantic-version model, or run a migration to display typed proposals. Old tacit arrays remain supported. Adapter outputs preserve their source text and become `proposal` / `needs_review`; missing conditions, examples, evidence, or authority remain missing. A reviewed capsule-level status does not certify every converted heuristic.

| Current object | Purpose | Keep / modify / deprecate | Target object | Migration |
| --- | --- | --- | --- | --- |
| Eight TACITUS primitives | Domain-world substrate | Keep | Namespaced world nodes | Preserve Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative |
| `PraxisCapsule` | Owner-scoped canonical context | Modify additively | Envelope plus versioned cognitive extension | Read adapter; explicit reviewed updates only |
| `ContextCapsule` semantic versions | Immutable package composition | Keep and adapt | Registry package reference | Preserve semver/hash contracts and compatibility API |
| V2/V3 `claimLedger` | Claim support and source links | Keep and adapt | Epistemic statements and evidence relationships | Retain support, dates, receipts, caveats, and claim IDs |
| `humanTacitKnowledge` arrays | Expert notes | Keep and adapt | Typed cues, heuristics, distinctions, constraints, practice notes | Proposed objects; never invent conditions or imply individual review |
| `reasoningScaffold` | Public method and caveats | Keep public content | Explicit argument/rationale layer | Exclude hidden model chain-of-thought and private notes from shared views |
| `temporality`, `causality` | Time validity and causal links | Keep and adapt | Temporal/causal statements | Preserve correlation versus causation and invalidation |
| `CanonicalSourceReceipt` | Retrieval/source provenance | Keep and align | Source records and evidence spans | Preserve receipt/source IDs, content hash, quote, retrieval date, and method |
| `SpatialCitationRef` | Page/layout anchors | Keep | Evidence locator | Preserve document/chunk/page/coords and quote hash |
| `embeddedGraph` | Optional graph projection | Keep derived | World and cognitive graph projections | Preserve advisory/review boundaries; no new database |
| Graph `generatedBy`, `derivedFrom`, `confidenceKind` | Traceable generation and inference | Keep | Knowledge provenance | Preserve activity, actor, source lineage, and inference labels |
| `sourceSpine` | Sources, gaps, freshness | Keep | Evidence/provenance layer | Keep independence separate from repetition |
| `agentOperatingContract` | Tools, limits, checkpoints | Keep and extend | Procedure/norm/attention policy | Permissions constrain execution; capsule text cannot grant tools |
| `outputContracts` | Artifact and citation requirements | Keep | Output capsule/procedure contract | Preserve review/citation requirements |
| Review cards | Proposal approval/rejection | Modify | Typed proposal review | Reuse owner checks, transactions, snapshots, and stale-base checks |
| Cognee/memory posture | Advisory recall | Keep advisory | Noncanonical evidence/proposal input | Human review before canonical promotion |
| Context slots and associated capsules | Context composition | Keep | Resolved capsule dependencies | Preserve exact version pins; add digest locks without fallback |
| `marketplaceProfile` | Reuse/distribution metadata | Modify when registry matures | Trust dimensions and package metadata | No inferred certification or commerce activation |
| V3/dry-run evaluations | Structural/proxy scorecards | Keep with labels | Representative tasks and ablation records | Never report proxy scores as measured model uplift |

## Logical layers

Keep ten logical namespaces: world; epistemic; argument/rationale; expertise/tacit knowledge; language/pragmatics; procedure/method; temporal/causal; case/precedent; norm/constraint; provenance. Their in-memory objects and portable projections may share physical storage without collapsing their semantics into eight world primitives.

Statements have stable IDs and explicit subject, predicate, object, evidence, provenance, validity, review, and interpretation/rationale fields. Distinguish an actor's assessment, a source's report, and the proposition assessed. A report that officials suspect an actor does not prove attribution. Language belongs on relationship qualifiers as well as terminology nodes: speech act, modal force, negation, authority, audience, register, and commitment strength.

Typed expert objects represent conditions, exceptions, checks, forbidden inferences, rationale, examples, counterexamples, applicability scope, and review provenance. Cases record the analogy and where it breaks. Procedures define inputs, ordered steps, gates, outputs, and stop conditions. Validation must reject dangling references, reversed validity periods, unsupported promoted statements, malformed evidence locators, and contradictory review/provenance states. Missing evidence on a proposal is visible; it is not silently synthesized.

## Implementation seams

| Surface | Existing implementation | Extension seam |
| --- | --- | --- |
| Envelope persistence | `capsule-service.ts`: create, import, sanitize, bump, fork, combine | Explicitly preserve validated cognitive fields on every path |
| Patch validation | `capsule-schema.ts`: `CapsuleEnvelopePatchSchema`; service `normalizeReviewEnvelopePatch` | Add cognitive patch allowlist and schema; unknown fields currently reject |
| Review | Service create/apply/reject cards, version snapshots, `proposalBase` field hashes | Typed proposals, edit-and-accept, need-evidence, preserved stale guards |
| Review UI | `CapsuleReviewQueueSection.tsx` | Existing POST to `/api/context/capsules/{id}/graph/nodes` handles approve/reject; extend a concrete authenticated route |
| Studio | `CapsuleWorkbenchPanel.tsx`, `CapsuleTacitKnowledgeSection.tsx` | Rich read-only expertise inspection inside the existing capsule surface |
| Expert intake | `capsule-architect.ts`, `/api/capsules/assist/[action]` | Architect takes source material and elicitation, produces review cards; add typed interview proposals |
| Interviewer role | `CAPSULE_V3_AGENT_ROLES`, `buildCapsuleV3AgentReviewCards` | Existing role declaration is not an executed interview loop; implement bounded questions and typed responses |
| Teach by correction | `capsule-closed-loop-learning.ts` | Preserve feedback/document/use proposal behavior; add distinctions, exceptions, checks, and counterexamples |
| Context | `context-injection.ts`, `agent-context-packet.ts`, `agent-context-salience.ts` | Task/worker-specific cognitive selection with budgets, omissions, evidence and counterevidence |
| Run receipts | `evidence-pack.ts`, `capsule-read-receipt.ts`, `AgentReadContract` | Freeze resolved versions/digests, compiler/view hashes, sources, tools, and model configuration |
| Runtime | `workflow-plan.ts`, worker/state/Postgres/approval/tool registry | Typed run-scoped blackboard and specialist views; preserve existing durable runtime |
| Package | Capsule+ ZIP export/import; DIALECTICA package adapter | Extend portable cognitive JSON-LD with semantic round-trip and canonical/derived separation |
| Registry | Legacy storage/resolve/publish/fork | Publisher/name identity, exact digest resolution, install/update/withdraw, dependency impact |
| CLI | No `cli/` or `packages/praxis-cli/` at baseline | Small separate client sharing domain libraries/API; do not bundle Next.js |
| Evaluation | `research-eval.ts`, `dry-run-eval.ts`, backend capsule eval | Explicit synthetic golden cases, real ablations, task metrics and model/provider receipts |

## Human review and canonicality

LLMs extract and propose; symbolic code validates, links, checks and constrains; humans confirm, reject, qualify and promote. Canonical capsule knowledge and temporary run knowledge are separate. Agent discoveries enter run-scoped working objects and then `CapsuleChangeProposal` records. They do not write reviewed capsule facts directly.

Accepting a proposal enters draft knowledge with the review decision attached. It does not publish a package, prove the claim, confer certification, or permit an external action. Edits must be revalidated. Need-evidence remains unresolved; rejection leaves canonical knowledge untouched. Keep evidence, dates, rationale, reviewer identity, stale proposal protection, and previous snapshots.

## Context compilation and execution

The compiler selects task-relevant cognitive layers, supporting and contradictory evidence, applicable expert rules and exceptions, terminology, procedures, precedents, constraints, and missing information. Research, entity resolution, domain analysis, language review, writing, and red-team workers receive different views. Each view records selected IDs, omissions, limits, and a reproducible digest. Advisory objects stay visibly advisory.

Use the existing durable AgentRun ledger and bounded runtime. A complete run context lock records exact resolved capsule versions and digests, dependency locks, compiler version, view digest, tool permissions, and model configuration. The existing receipt/hash foundations are partial and should be extended, not replaced. A shared blackboard contains typed WorkingClaim, EvidenceCandidate, Question, Hypothesis, ActorCandidate, EntityResolution, TimelineEvent, Contradiction, SourceGap, AnalysisProposal, GraphProposal, DraftBlock, and ReviewIssue objects referenced by IDs.

## Portability, registry, and deferred work

Canonical authored knowledge, review records, evidence/provenance, and dependency locks must remain separate from disposable indexes, embeddings, database seeds, compiled prompts, and caches. Portable cognitive projections need deterministic JSON-LD round-trip tests and package digests. Existing Sigstore/in-toto interfaces are not cryptographic verification proof; signing and verification require actual implementation and evidence.

Build registry/version/dependency/quality infrastructure before marketplace commerce. Show authorship, human review, source backing, expert review, provenance, freshness, method documentation, structural validation, and measured evaluations separately. Cognitive depth levels 0–7 describe coverage and practice, not truth confidence.

MCP remains a tool/resource boundary. AG-UI maps existing run events later; A2A waits for stable capsule and workflow contracts. Sealed-use access and licensed commercial modes are future access-control features and cannot promise extraction prevention. No new graph database, runtime framework, commerce rollout, or public certification follows automatically from this architecture.

## Acceptance and release evidence

Synthetic golden cases must test diplomatic speech-act strength, time-dependent actor identity, public-finance stage distinctions, conditional heuristics with exceptions, and teach-by-correction. Test schema invalidity, provenance, evidence, validity, dangling references, advisory promotion boundaries, JSON-LD round-trip, reviewed persistence, and worker-specific compiled context. Real model ablations compare generic prompting, documents, graph, expertise, and language/case/method layers with provider/model/task receipts.

Keep local checks, source commit, pushed source, cloud revision, traffic, public health, and authenticated persisted journeys distinct. Publishing the frontend is not proof that all 16 implementation waves, registry operations, runtime workers, provider integrations, or marketplace functions are complete. The ledger records baseline gaps separately from implementation and acceptance evidence.

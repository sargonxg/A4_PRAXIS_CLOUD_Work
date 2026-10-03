# Cognitive Capsule implementation ledger

Source: [the full master plan](../product/COGNITIVE_CAPSULE_MASTER_PLAN_2026-10-02.md). Architecture: [Cognitive Capsule architecture](../architecture/COGNITIVE_CAPSULE_ARCHITECTURE.md).

## Status boundary

This inventory records the inspected `8ff509b8` baseline before production edits. It covers every numbered specification section (0–109), all implementation waves (0–16), and the first execution pack. Baseline status is intentionally retained when implementation occurs; release entries below must identify new source, tests, deployment and journeys separately. `Partial foundation` means related existing code was read, not that the target behavior is complete. `Design requirement` means an architectural constraint, not a runtime capability. `Missing at baseline` means no implementation satisfying the section was found in the inventoried seams. `Later / conditional` follows the specification's explicit defer/sequence language.

Baseline evidence:

- Canonical owner-scoped numeric capsule envelope: `src/lib/context/capsule-service.ts`, `capsule-v2.ts`, `capsule-v3.ts`, `capsule-schema.ts`.
- Separate semver package model: `src/types/context-capsule.ts`, `src/lib/capsules/storage.ts`, `resolve.ts`.
- Evidence: `src/types/source-receipt.ts`, `spatial-source.ts`; graph provenance and claim receipts in V3/service.
- Workbench: `src/components/capsules/CapsuleWorkbenchPanel.tsx` and `workbench/*`.
- Intake: `capsule-architect.ts`, `/api/capsules/assist/[action]`, `capsule-closed-loop-learning.ts`.
- Context: `context-injection.ts`, `agent-context-packet.ts`, `agent-context-salience.ts`.
- Runtime: `src/lib/agent-runtime/{types,workflow-plan,worker,state,postgres,capsule-read-receipt,evidence-pack,tool-registry}.ts`.
- Package: `src/lib/capsule-plus/index.ts`, `src/lib/context/dialectica-capsule-import.ts`.
- Evaluations: `src/lib/agent-runtime/research-eval.ts`, `src/lib/capsules/dry-run-eval.ts`; these include structural/proxy scorecards, not verified model uplift.
- Graphify navigation was stale at `01a95497`; source was checked directly. No wiki index was present.

## All specification sections

| Section | Baseline status | Evidence / implementation destination |
| --- | --- | --- |
| 0. READ THIS FIRST | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 1. PRODUCT NORTH STAR | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 2. THE KEY DESIGN CHANGE | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 3. DO NOT BUILD ONE GIANT GRAPH | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 4. WORLD GRAPH | Partial foundation | V3 graph/claim/tacit/time/method foundations; typed multi-layer cognition still required |
| 5. EPISTEMIC GRAPH | Partial foundation | V3 graph/claim/tacit/time/method foundations; typed multi-layer cognition still required |
| 6. ARGUMENT AND RATIONALE GRAPH | Partial foundation | V3 graph/claim/tacit/time/method foundations; typed multi-layer cognition still required |
| 7. EXPERTISE / TACIT KNOWLEDGE GRAPH | Partial foundation | V3 graph/claim/tacit/time/method foundations; typed multi-layer cognition still required |
| 8. LANGUAGE / PRAGMATICS GRAPH | Missing at baseline | V3 graph/claim/tacit/time/method foundations; typed multi-layer cognition still required |
| 9. LANGUAGE MUST ALSO LIVE ON EDGES | Missing at baseline | V3 graph/claim/tacit/time/method foundations; typed multi-layer cognition still required |
| 10. EXAMPLE: DIPLOMATIC LANGUAGE | Missing at baseline | V3 graph/claim/tacit/time/method foundations; typed multi-layer cognition still required |
| 11. EXAMPLE: ARMED-GROUP IDENTITY | Missing at baseline | V3 graph/claim/tacit/time/method foundations; typed multi-layer cognition still required |
| 12. PROCEDURAL / METHOD GRAPH | Partial foundation | V3 graph/claim/tacit/time/method foundations; typed multi-layer cognition still required |
| 13. CASE / PRECEDENT GRAPH | Missing at baseline | V3 graph/claim/tacit/time/method foundations; typed multi-layer cognition still required |
| 14. EXPERT METACOGNITION | Partial foundation | V3 graph/claim/tacit/time/method foundations; typed multi-layer cognition still required |
| 15. COGNITIVE MEMORY MODEL | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 16. CAPSULE TYPES | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 17. CAPSULE COMPOSITION | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 18. CAPSULE BUILDER: THE FIRST MAJOR PRODUCT | Partial foundation | CapsuleWorkbenchPanel; tacit/review/graph sections; architect elicitation; no executed expert interview loop |
| 19. CAPSULE STUDIO MODES | Partial foundation | CapsuleWorkbenchPanel; tacit/review/graph sections; architect elicitation; no executed expert interview loop |
| 20. CRITICAL DECISION INTERVIEW | Partial foundation | CapsuleWorkbenchPanel; tacit/review/graph sections; architect elicitation; no executed expert interview loop |
| 21. TEACH-BY-CORRECTION | Partial foundation | CapsuleWorkbenchPanel; tacit/review/graph sections; architect elicitation; no executed expert interview loop |
| 22. CAPSULE CHAT | Partial foundation | CapsuleWorkbenchPanel; tacit/review/graph sections; architect elicitation; no executed expert interview loop |
| 23. CAPSULE STUDIO VISUAL STRUCTURE | Partial foundation | CapsuleWorkbenchPanel; tacit/review/graph sections; architect elicitation; no executed expert interview loop |
| 24. GRAPH INSPECTION | Partial foundation | CapsuleWorkbenchPanel; tacit/review/graph sections; architect elicitation; no executed expert interview loop |
| 25. FIRST-CLASS STATEMENTS | Partial foundation | Claim ledger, graph element provenance, CanonicalSourceReceipt, SpatialCitationRef; unified statements pending |
| 26. GRAPH VALIDATION | Partial foundation | Claim ledger, graph element provenance, CanonicalSourceReceipt, SpatialCitationRef; unified statements pending |
| 27. SOURCE EVIDENCE | Partial foundation | Claim ledger, graph element provenance, CanonicalSourceReceipt, SpatialCitationRef; unified statements pending |
| 28. PROVENANCE | Partial foundation | Claim ledger, graph element provenance, CanonicalSourceReceipt, SpatialCitationRef; unified statements pending |
| 29. EXPLICIT RATIONALE, NOT HIDDEN MODEL CHAIN-OF-THOUGHT | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 30. PORTABLE CAPSULE FORMAT | Partial foundation | Capsule+ ZIP and DIALECTICA .capsule adapters exist; cognitive portable projection and digest round-trip pending |
| 31. CANONICAL VS DERIVED CONTENT | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 32. PORTABLE GRAPH | Partial foundation | Capsule+ ZIP and DIALECTICA .capsule adapters exist; cognitive portable projection and digest round-trip pending |
| 33. CAPSULE LIBRARY | Partial foundation | Legacy semver storage/resolve and V3 profile; full registry, trust dimensions, signing, depth acceptance pending |
| 34. REGISTRY BEFORE MARKETPLACE | Partial foundation | Legacy semver storage/resolve and V3 profile; full registry, trust dimensions, signing, depth acceptance pending |
| 35. CAPSULE DEPENDENCIES | Partial foundation | Legacy semver storage/resolve and V3 profile; full registry, trust dimensions, signing, depth acceptance pending |
| 36. MARKETPLACE | Later / conditional | Legacy semver storage/resolve and V3 profile; full registry, trust dimensions, signing, depth acceptance pending |
| 37. MARKETPLACE TRUST | Partial foundation | Legacy semver storage/resolve and V3 profile; full registry, trust dimensions, signing, depth acceptance pending |
| 38. EXPERT INTELLECTUAL PROPERTY | Later / conditional | Legacy semver storage/resolve and V3 profile; full registry, trust dimensions, signing, depth acceptance pending |
| 39. SIGNING AND ATTESTATION | Partial foundation | Legacy semver storage/resolve and V3 profile; full registry, trust dimensions, signing, depth acceptance pending |
| 40. CAPSULE QUALITY: REPLACE THE SINGLE SCORE | Partial foundation | Legacy semver storage/resolve and V3 profile; full registry, trust dimensions, signing, depth acceptance pending |
| 41. COGNITIVE DEPTH LADDER | Partial foundation | Legacy semver storage/resolve and V3 profile; full registry, trust dimensions, signing, depth acceptance pending |
| 42. AGENT WORKFLOWS: CAPSULES MUST ACTUALLY CHANGE PERFORMANCE | Partial foundation | workflow-plan/worker/tool-registry durable foundations; cognition-specific views and typed blackboard pending |
| 43. TRIAGE SUPERVISOR | Partial foundation | workflow-plan/worker/tool-registry durable foundations; cognition-specific views and typed blackboard pending |
| 44. WORKER ROLES | Partial foundation | workflow-plan/worker/tool-registry durable foundations; cognition-specific views and typed blackboard pending |
| 45. WORKER-SPECIFIC CONTEXT VIEWS | Partial foundation | workflow-plan/worker/tool-registry durable foundations; cognition-specific views and typed blackboard pending |
| 46. SHARED WORKING BLACKBOARD | Missing at baseline | workflow-plan/worker/tool-registry durable foundations; cognition-specific views and typed blackboard pending |
| 47. CANONICAL CAPSULE IS NEVER THE BLACKBOARD | Design requirement | workflow-plan/worker/tool-registry durable foundations; cognition-specific views and typed blackboard pending |
| 48. MULTI-AGENT EXAMPLE | Missing at baseline | workflow-plan/worker/tool-registry durable foundations; cognition-specific views and typed blackboard pending |
| 49. WORKFLOW SPECIFICATION | Partial foundation | workflow-plan/worker/tool-registry durable foundations; cognition-specific views and typed blackboard pending |
| 50. MCP | Partial foundation | workflow-plan/worker/tool-registry durable foundations; cognition-specific views and typed blackboard pending |
| 51. AG-UI | Later / conditional | Explicit sequencing: registry/quality first; sealed-use, AG-UI and A2A later |
| 52. A2A | Later / conditional | Explicit sequencing: registry/quality first; sealed-use, AG-UI and A2A later |
| 53. PRAXIS CLI — BUILD AN MVP NOW | Missing at baseline | No cli/ or packages/praxis-cli at baseline; separate shared-domain/API client required |
| 54. CLI ARCHITECTURE | Design requirement | No cli/ or packages/praxis-cli at baseline; separate shared-domain/API client required |
| 55. LOCAL CAPSULE WORKFLOW | Missing at baseline | No cli/ or packages/praxis-cli at baseline; separate shared-domain/API client required |
| 56. WHERE STANDARD AI FALLS SHORT | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 57. SYMBOLIC REASONING: WHERE IT HELPS | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 58. NEURO-SYMBOLIC TACITUS RULE | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 59. CONTEXT COMPILER | Partial foundation | context-injection, agent-context-packet/salience, evidence-pack and read-contract hashes; full cognitive compilation/lock pending |
| 60. ATTENTION POLICY | Partial foundation | context-injection, agent-context-packet/salience, evidence-pack and read-contract hashes; full cognitive compilation/lock pending |
| 61. CONTEXT VIEW | Partial foundation | context-injection, agent-context-packet/salience, evidence-pack and read-contract hashes; full cognitive compilation/lock pending |
| 62. RUN CONTEXT LOCK | Partial foundation | context-injection, agent-context-packet/salience, evidence-pack and read-contract hashes; full cognitive compilation/lock pending |
| 63. LIVING CAPSULES | Partial foundation | Review cards and closed-loop-learning proposals; typed cognitive edit/accept/reject/need-evidence pending |
| 64. CAPSULE REVIEW MODEL | Partial foundation | Review cards and closed-loop-learning proposals; typed cognitive edit/accept/reject/need-evidence pending |
| 65. REVIEW SHOULD TEACH THE CAPSULE | Partial foundation | Review cards and closed-loop-learning proposals; typed cognitive edit/accept/reject/need-evidence pending |
| 66. EVALUATION | Partial foundation | research-eval and dry-run-eval proxy foundations; representative provider ablations/blind-spot proof pending |
| 67. CAPSULE ABLATION TESTING | Partial foundation | research-eval and dry-run-eval proxy foundations; representative provider ablations/blind-spot proof pending |
| 68. EXPERT BLIND-SPOT TEST | Missing at baseline | research-eval and dry-run-eval proxy foundations; representative provider ablations/blind-spot proof pending |
| 69. GOLDEN CASES | Partial foundation | research-eval and dry-run-eval proxy foundations; representative provider ablations/blind-spot proof pending |
| 70. DOCUMENT INGESTION | Partial foundation | See mapped existing seam below; target acceptance remains open |
| 71. GRAPH TECHNOLOGY | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 72. RDF / JSON-LD | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 73. SHACL | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 74. WEB ANNOTATION | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 75. CAPSULE PACKAGE INTEROPERABILITY | Design requirement | Capsule+ ZIP and DIALECTICA .capsule adapters exist; cognitive portable projection and digest round-trip pending |
| 76. REGISTRY STORAGE | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 77. PRAXIS CURRENT CODE: EVOLVE, DO NOT RESTART | Partial foundation | See mapped existing seam below; target acceptance remains open |
| 78. NEW COGNITIVE SCHEMA | Missing at baseline | New src/lib/cognitive-capsule contracts; retain outer numeric V3 and separate semver package model |
| 79. SCHEMA VERSION | Design requirement | New src/lib/cognitive-capsule contracts; retain outer numeric V3 and separate semver package model |
| 80. V4 TACIT KNOWLEDGE TYPES | Missing at baseline | New src/lib/cognitive-capsule contracts; retain outer numeric V3 and separate semver package model |
| 81. EXPERT CUE TYPE | Missing at baseline | New src/lib/cognitive-capsule contracts; retain outer numeric V3 and separate semver package model |
| 82. HEURISTIC TYPE | Missing at baseline | New src/lib/cognitive-capsule contracts; retain outer numeric V3 and separate semver package model |
| 83. DISTINCTION TYPE | Missing at baseline | New src/lib/cognitive-capsule contracts; retain outer numeric V3 and separate semver package model |
| 84. LANGUAGE RULE TYPE | Missing at baseline | New src/lib/cognitive-capsule contracts; retain outer numeric V3 and separate semver package model |
| 85. CASE TYPE | Missing at baseline | New src/lib/cognitive-capsule contracts; retain outer numeric V3 and separate semver package model |
| 86. CAPSULE STUDIO IMPLEMENTATION | Partial foundation | Existing Capsule Studio/architect/review/history foundations; typed cognitive workflow pending |
| 87. CAPSULE CHAT AGENT ROLES | Partial foundation | Existing Capsule Studio/architect/review/history foundations; typed cognitive workflow pending |
| 88. CHAT → STRUCTURED PROPOSAL | Partial foundation | Existing Capsule Studio/architect/review/history foundations; typed cognitive workflow pending |
| 89. GRAPH PROPOSAL UX | Partial foundation | Existing Capsule Studio/architect/review/history foundations; typed cognitive workflow pending |
| 90. CAPSULE DIFF | Partial foundation | Existing Capsule Studio/architect/review/history foundations; typed cognitive workflow pending |
| 91. CAPSULE DEPENDENCY IMPACT | Partial foundation | Existing Capsule Studio/architect/review/history foundations; typed cognitive workflow pending |
| 92. CLI FIRST IMPLEMENTATION WAVE | Missing at baseline | No cli/ or packages/praxis-cli at baseline; separate shared-domain/API client required |
| 93. AGENT RUNTIME: DO NOT ADD A NEW FRAMEWORK | Partial foundation | See mapped existing seam below; target acceptance remains open |
| 94. AGENT WORKING STATE TYPES | Missing at baseline | New run-scoped typed working state and ID-referenced communications required |
| 95. WORKER COMMUNICATION | Missing at baseline | New run-scoped typed working state and ID-referenced communications required |
| 96. AGENT TOOL PERMISSIONS | Partial foundation | See mapped existing seam below; target acceptance remains open |
| 97. CONTEXT PORTABILITY | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 98. COMPANY STRATEGY | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 99. MOAT | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 100. IMPLEMENTATION MASTER PLAN | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 101. FIRST CODEX EXECUTION PACK | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 102. ACCEPTANCE SCENARIO ONE — DIPLOMACY | Missing at baseline | Synthetic golden fixtures and executable acceptance tests required; forbidden behaviors remain constraints |
| 103. ACCEPTANCE SCENARIO TWO — ARMED GROUPS | Missing at baseline | Synthetic golden fixtures and executable acceptance tests required; forbidden behaviors remain constraints |
| 104. ACCEPTANCE SCENARIO THREE — PUBLIC FINANCE | Missing at baseline | Synthetic golden fixtures and executable acceptance tests required; forbidden behaviors remain constraints |
| 105. ACCEPTANCE SCENARIO FOUR — EXPERT HEURISTIC | Missing at baseline | Synthetic golden fixtures and executable acceptance tests required; forbidden behaviors remain constraints |
| 106. ACCEPTANCE SCENARIO FIVE — TEACH-BY-CORRECTION | Missing at baseline | Synthetic golden fixtures and executable acceptance tests required; forbidden behaviors remain constraints |
| 107. WHAT NOT TO DO | Missing at baseline | Synthetic golden fixtures and executable acceptance tests required; forbidden behaviors remain constraints |
| 108. DEFINITION OF SUCCESS | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |
| 109. FINAL PRODUCT VISION | Design requirement | Architecture contract; preserve existing PRAXIS/DIALECTICA and canonical review boundaries |

## Implementation waves

| Wave | Baseline status | Required result / seam |
| --- | --- | --- |
| 0 Architecture convergence | Inventory complete; architecture documented | Preserve numeric user envelope vs semver package model; map all concepts and boundaries |
| 1 Cognitive schema | Missing at baseline | Typed statements/expertise/language/cases/procedures/provenance/review and validation |
| 2 V3 cognitive adapter | Missing at baseline | Loss-aware proposal conversion; old arrays remain supported; no inferred human review |
| 3 Cognitive graph | Missing at baseline | Typed in-memory graph, queries, validation, JSON-LD semantic round-trip |
| 4 Capsule Studio MVP | Partial foundation | Existing Capsule surface plus six rich expertise groups and grounded inspection |
| 5 Expert interviewer | Role declaration only | Bounded interview produces typed proposals, not canonical mutations |
| 6 Teach by correction | Partial foundation | Existing feedback proposals plus typed distinction/exception/check/counterexample |
| 7 Evidence unification | Partial foundation | Preserve source receipts, quote hashes and spatial locators in unified evidence spans |
| 8 Context compiler | Partial foundation | Task/worker-specific cognition views with token budgets, omissions and counterevidence |
| 9 Run context lock | Partial foundation | Exact resolved digests, dependencies, compiler/view hashes, tools/model configuration |
| 10 Shared agent blackboard | Missing at baseline | Run-scoped typed objects and references; proposals separate from canonical capsule |
| 11 Specialist workers | Partial foundation | Reuse durable runtime/tool gates; execute worker-specific views and typed results |
| 12 CLI MVP | Missing at baseline | Separate CLI, authenticated API adapters and local package commands |
| 13 Portable package | Partial foundation | Existing Capsule+ ZIP extended with cognitive layers and verified content digests |
| 14 Capsule registry | Partial foundation | Identity/version/digest/rights/dependency/installation/withdrawal behavior |
| 15 Evaluation | Proxy foundations only | Five synthetic golden scenarios; true layer ablations and blind-spot tasks with receipts |
| 16 Marketplace | Later / conditional | Registry/quality/trust first; commercial functions require their own acceptance |

## First execution pack

| Task | Baseline / documentation status | Acceptance |
| --- | --- | --- |
| 1 Required reads and inventory | Complete inventory | Required architecture/model/storage/resolve/source/spatial seams inspected |
| 2 Architecture with mapping table | Documented here and companion | Current object, purpose, disposition, target and migration for each main model |
| 3 Types only | Missing at baseline | Required named cognitive contracts; no production route changes in initial types task |
| 4 Validation schemas/tests | Missing at baseline | Conditions, exceptions, dates, provenance, review, invalid statements and missing evidence |
| 5 V3 adapter | Missing at baseline | Preserve arrays; converted expertise is proposal / needs_review |
| 6 In-memory CognitiveGraph | Missing at baseline | Required add/query/validate methods; no database choice |
| 7 JSON-LD | Missing at baseline | Semantic round-trip tests |
| 8 Read-only Expertise panel | Missing at baseline | Cues/patterns/heuristics/distinctions/exceptions/questions inside existing capsule surface |
| 9 Interviewer proposals | Missing at baseline | Existing role produces typed proposal objects; no direct mutation |
| 10 Proposal review | Partial foundation | Accept, edit+accept, reject, need evidence; accepted knowledge enters draft |

## Implementation and release evidence

Add dated checkpoint entries only after verification. Each entry must distinguish implementation files, focused/full test evidence, source commit, pushed source, deployed revision and traffic, public health, authenticated durable journeys, and deferred target acceptance. The baseline tables remain a record of what existed before this work, not a claim about the final published release.

### October 3 implementation checkpoint

The source plan is preserved byte-for-byte. Every numbered section above remains in the inventory; the following table records the current result across its implementation waves. These are implementation statuses, not claims that every long-term acceptance condition is achieved.

| Wave | Current implementation | Remaining acceptance or scope |
| --- | --- | --- |
| 0 Architecture convergence | Numeric V3 envelope and optional `cognitive-capsule/vNext` contract mapped; no migration | DIALECTICA-side compiler convergence needs a separate cross-repository implementation |
| 1 Cognitive schema | Strict types/Zod, portable JSON Schema, human review/time/condition constraints | Domain ontology curation remains human work |
| 2 V3 adapter | Loss-aware legacy conversion to proposed / needs_review records | No automatic conversion to expert-reviewed truth |
| 3 Cognitive graph | Typed in-memory queries, reference validation, JSON-LD roundtrip | Full cognitive graph editing/visual inspection remains partial |
| 4 Studio | Existing inspector Expertise disclosure, capture/review/provenance/filter/export | Live authenticated/browser proof recorded separately below |
| 5 Expert interviewer | Six guided deterministic interview modes; explicit missing answers; proposal-only server persistence | Adaptive model interviewer and broad domain interviewing quality remain unproven |
| 6 Teach by correction | Completed capsule-grounded Chat answers can capture a human-authored distinction proposal | Other correction kinds and automated output-diff elicitation remain partial |
| 7 Evidence unification | Receipt/spatial adapters, selectors and parser-neutral DocumentIR | Upstream DIALECTICA ingestion convergence and every parser's geometry are not proven |
| 8 Context compiler | Worker-specific accepted views, separate unapplied guarded rules, scope/time/conditions, counterevidence, atomic rendered budgets | Grounded task-fact extraction and attention quality require provider evaluation |
| 9 Run context lock | Capsule/source/view/compiler/tool/model digests frozen before generation; replay rejects drift | Hosted dependency resolution is not implemented |
| 10 Shared blackboard | Run-scoped typed objects, references and immutable replay | Canonical capsule promotion always remains a human-reviewed operation |
| 11 Specialists | Existing memo workflow executes specialist→writer→red-team with typed handoffs | All eight named roles are supported view contracts, not eight independent deployed workers; provider quality remains unproven |
| 12 CLI | Local inspect/validate/graph/diff/pack/unpack/structural-eval and authenticated existing Ask/run clients | Public npm distribution and cross-platform installer acceptance remain open |
| 13 Package | Deterministic native ZIP, semantic/file hashes, defensive import, JSON-LD and detached Ed25519 attestations | Trust is caller-supplied; no production signing keys or transparency verification claimed |
| 14 Registry | Private local immutable versions, exact dependency locks, install/fork/deprecate and rights/cycle checks | Hosted registry, organization membership governance, dependency UX and sealed-use licensing remain later work |
| 15 Evaluation | Five synthetic task contracts; provider ablation harness; actual retrieval callback required for RAG; plain graph excludes expertise | Representative provider runs, verified citations, blinded human scoring and performance improvement remain unestablished |
| 16 Marketplace | Sequenced after registry/quality/trust | Commerce, pricing, publisher administration and payment acceptance deferred by the plan |

The first execution pack has concrete source for all ten tasks. Task 8 extends the existing inspector; tasks 9–10 add bounded elicitation and explicit human decisions. Fork preserves cognition/provenance; Combine refuses cognitive inputs until a conflict-preserving merge exists. Legacy prose remains supported. No new primary navigation or upstream automatic canonical writes were introduced.

Review found and corrected typed condition omissions, missing reference validation, escaped prompt budget growth, actual-inspector wiring, fork data loss and unsupported combine behavior. Regression tests preserve these boundaries. Structural quality dimensions and depth are not factual confidence or demonstrated model performance.

Release gates, pushed revision, deployment, traffic and observed journeys are recorded in the dated release report. Baseline audit files and unrelated Graphify/configuration edits are excluded from the publication source.

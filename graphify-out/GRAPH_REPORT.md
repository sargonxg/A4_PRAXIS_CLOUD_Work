# Graph Report - A4_PRAXIS_CLOUD_Work  (2026-10-06)

## Scoped AST refresh — 2026-11-07

Official graphifyy 0.9.76 AST extraction refreshed the local policy-task CLI, helper, tests and fixture on the branch based on `4b77dcd3`. No LLM/API calls ran.

Current scoped graph: 20579 nodes and 46915 stored edges. Unrelated node and edge records are preserved; only the five code/fixture paths were refreshed; documentation and other graph records retain their prior snapshot. The full-graph commit marker and community summaries below retain the prior snapshot, rather than claiming a full current-main rebuild.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 20561 nodes · 45935 edges · 950 communities (800 shown, 150 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 1278 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `80ab84f8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).
- World explorer working-tree refresh: official graphifyy0.9.76 AST update with final incremental rebuild of `world-research.ts`, its unit tests and the browser screenshot test, followed by deterministic `graphify cluster-only . --no-label --no-viz`. Zero API calls/new LLM tokens; existing inferred evidence retained. All three final source fingerprints and AST manifest hashes match current frozen bytes. World API/AI routes, scheduler, provider services, UI and tests remain represented.

## Community Hubs (Navigation)
- next
- saveToolOutput
- tasklet-praxis-workbench.tsx
- context-capsules.ts
- ContextBuilderRoom.tsx
- scripts
- capsule-v3.ts
- situation-initializer.ts
- vitest
- TaskletPraxisWorkbench
- worker.ts
- ontology/registry.ts
- auth-context.tsx
- capsule-workbench-view-model.ts
- capsule-service.ts
- cn
- COGNITIVE_CAPSULE_MASTER_PLAN_2026-10-02.md
- signal/domain.ts
- path/types.ts
- ai/chat/route.ts
- react
- world-service.ts
- cognitive-capsule/service.ts
- getCapsule
- types/domain.ts
- CapsuleExpertisePanel.tsx
- library.ts
- praxis-doctor.ts
- AskStreamPanel.tsx
- json
- evidence-pack.ts
- praxis-chat.tsx
- datetime
- auth.ts
- agent-runtime/postgres.ts
- cognitive-capsule/evaluation.ts
- createCapsuleReviewCard
- agent-runtime/types.ts
- CapsuleWorkbenchPanel.tsx
- ask-answer-envelope.ts
- CapsuleGraphViewer.tsx
- ref_node_crypto
- run-authenticated-runtime-lane.ts
- output-review.ts
- user-keys.ts
- tenant_session
- pytest
- specialists.ts
- runtime-data-plane.ts
- model-runtime-policy.ts
- blackboard/index.ts
- build_from_json
- cognitive-capsule/schema.ts
- signal/schema.ts
- dependencies
- PRAXIS — Architecture Bible
- account-settings-page.tsx
- PRAXIS — STATUS
- capsule-plus/index.ts
- capsule-closed-loop-learning.ts
- capsule-v2.ts
- CapsuleBuilderWizard.tsx
- dialectica-capsule-import.ts
- notifications/registry.py
- profile-events.ts
- onboarding-return.test.tsx
- profile-context.ts
- handover-package/route.ts
- runtime.ts
- pydantic
- asyncio
- cognee_memory.py
- assistant/next-moves.ts
- types/index.ts
- agent-context-salience.ts
- active-context-stack.ts
- AskQueuedAgentRunPanel.tsx
- CapsuleLibraryCard.tsx
- model-matrix.ts
- src/app/page.tsx
- from-ask-pack/route.ts
- capsule-details-service.ts
- gcloud
- knowledge/context-engine.ts
- capsule-quality-ranking.ts
- audit-route-cleanup-map.ts
- getModel
- context-builder-plan.ts
- feed-aggregator.ts
- context-kernel.ts
- boardroom-workspace.tsx
- AGENTS.md
- wikidata_sparql.py
- research-graph/index.ts
- context-injection.ts
- ask-orchestrator.ts
- ActiveContextStackState
- flows.py
- signal-workspace.tsx
- FastAPI
- memo-service.ts
- AskWorkspacePage.tsx
- AnswerQualityStrip.tsx
- draft-assembly-state.ts
- graph-updates-service.ts
- [token]/route.ts
- library-service.ts
- situations.ts
- agent-runtime/tool-registry.ts
- os
- context-snapshot.ts
- flows/capsule-factory.ts
- work-intent-router.ts
- polar-webhook.ts
- ontology_system.py
- docling_parser.py
- cleanString
- _healthy_snapshot
- Changelog
- useAgentRunSnapshots.ts
- context/capsules/route.ts
- documents-service.ts
- analyst-profile-admin.ts
- CapsuleImportButton.tsx
- common.py
- agents/registry.ts
- deep-search-agent/route.ts
- agent-context-verifier.ts
- ask-context-bar.tsx
- temporal-timeline.ts
- audit-agent-runtime-proof.ts
- config.ts
- PraxisCapsuleLibraryCard
- normalizeCapsuleIntakeContract
- case-scaffold.ts
- with-credits.ts
- coverage-globe.ts
- typing
- Skeleton
- capsule-schema.ts
- context.ts
- upload/route.ts
- situations/route.ts
- capsule-quality.ts
- context-enrichment-adapter.ts
- sourcing.ts
- agent-context-packet.ts
- properties
- audit-capsule-consolidation.ts
- turns/route.ts
- audit-deep-preship.ts
- memo-checks.ts
- cognitive-capsule/types.ts
- knowledge/index.ts
- capsule-version-resolution.ts
- AnswerSourcesPanel.tsx
- conflict-grammar.ts
- dialectica/route.ts
- Evidence And Remediation
- capsule-quality-review.ts
- marketplace/registry.ts
- ContextCapsuleClaim
- routers/pipeline.py
- 10 Specific Things To Build
- graph-layer.ts
- tabs.py
- extract.py
- Cleanup & Infra Implementation Plan
- PRAXIS anti-slop review, 30 September 2026
- Round 3 — 15-improvement sprint (Lanes M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z + LP1 + LP2)
- emit.ts
- app-search.ts
- capsule-gate.ts
- graphops.ts
- case-module.ts
- PRAXIS authentication, account cleanup, and billing readiness
- overrides
- flows/sourceability.ts
- routers/graph.py
- sats.py
- recipes/base.py
- system-prompt-block.ts
- run_recipe
- types/context-capsule.ts
- memoArtifactFromMemoPayload
- helpers.ts
- hosted-registry.ts
- notifications.tsx
- schemas/context-capsule.ts
- one-click-context-builder.tsx
- PRAXIS codebase cleanup plan
- proof-summary.ts
- created-work/service.ts
- trustgraph-contract.ts
- analyst-profile.ts
- entity-extraction.ts
- Evidence And Remediation
- memo-handover-preview.test.tsx
- shared-contracts.ts
- test_jev_adapter.py
- consolidated-tools.ts
- web-research.ts
- graph-views.ts
- with-firewall.ts
- output-capsules.test.ts
- connectors.ts
- corpus-search.ts
- tasklet-workbench-conversation.ts
- sourceability-request.ts
- trust-posture.ts
- ladybug-projection.ts
- core-library.ts
- reasoning-loop.ts
- federated-app-search.ts
- audit-capsule-database.ts
- world-research.ts
- checkout/route.ts
- capsules/storage.ts
- flows/classify-path.ts
- workbench-case-graph.ts
- PRAXIS Canonical App Structure
- check-landing-bundle.ts
- PRAXIS Tasklet-Style Agent Runtime Plan
- admin-gate.ts
- properties
- agent-runtime/schema.ts
- agent-packet/route.ts
- notifications.py
- capsule-service.test.ts
- output-capsules/types.ts
- sats.ts
- tasklet-workbench-contract.test.ts
- routers/analyze.py
- graph-populate.ts
- ContextCapsule Policy Research Guide
- situation-context-health.ts
- audit-tasklet-mvp-foundation.ts
- boardroom/schema.ts
- tool-context-blueprints.ts
- resolveCapsuleTaxonomy
- tool-package-readiness.ts
- instrument-visual-contract.test.ts
- PRAXIS Agentic Workflow Release Plan
- Neo4jAdapter
- PRAXIS Ask Same-Window Chat And Artifacts Plan
- agentic-search-health.ts
- runtime-health.ts
- v3-surface-classification.ts
- uniqueStrings
- memory.py
- PRAXIS — Policy, Diplomacy, and Political Intelligence Platform by TACITUS
- PRAXIS by TACITUS — Context-Capsule Marketplace & Agentic Workspace Improvement Plan
- Textual Pitch Deck
- PRAXIS SIGNAL global narrative intelligence project
- workspace.py
- situation_health.py
- preferences.ts
- yente_client.py
- PRAXIS Testing
- capsules/resolve.ts
- capsule-architect.ts
- evidence-review.ts
- evaluate-policy-narrative-quality.ts
- context-core-map.ts
- tool-path-taxonomy.ts
- Per-Prompt Notes
- clarifying-questions.ts
- PRAXIS anti-slop review, 2026-09-30
- analysis-baselines.test.mjs
- genkit/index.ts
- PRAXIS Conflict Analyst Product Proposal
- audit-launch-readiness.ts
- dry-run-eval.ts
- PraxisCapsule
- context-aware.ts
- context_capsule.py
- PRAXIS Production Readiness Audit
- Five-minute private SIGNAL demo
- additionalProperties
- admin.ts
- capsule-factory-flow.test.ts
- drafting/export.ts
- context-capsules.test.ts
- sync-ecc-to-codex.mjs
- case-registry.ts
- AskAnswerEnvelope
- PRAXIS Context Injection Contract
- marketplace/run/route.ts
- Actor
- google-agent-platform/readiness.ts
- audit-public-surface.ts
- canonical.ts
- generate-tool-sprint-backlog.ts
- dialectica-capsule-idempotency.test.ts
- ref_node_child_process
- capsule-starters.ts
- error-boundary.tsx
- TrustGraph Context Substrate
- GCP_OPERATIONS.md
- PRAXIS Operational Spine
- capability-registry.ts
- nodes/route.ts
- context-kernel.test.ts
- parseDialecticaCapsulePackageFromParts
- praxis_data_controller/agent.py
- graphlite-contract.ts
- capsule-list-picker.test.tsx
- memory-layer.ts
- source-receipt-normalizer.ts
- firestore.ts
- Store
- Findings
- PRAXIS Design System
- PRAXIS: product readiness and capsule-to-analysis plan
- PRAXIS improvement analysis — 2026-09-30
- audit-context-health.ts
- audit-genkit-coverage.mjs
- backfill-capsule-research-dossiers.ts
- diff/route.ts
- changes/route.ts
- login/page.tsx
- adk-bridge.ts
- runner.ts
- capsule-architect-service.test.ts
- ontology/base.py
- prompt-health.ts
- PRAXIS Public Launch And Agentic Readiness Plan
- server.mjs
- START_HERE.md
- parseDataStreamError
- PRAXIS Deep Pre-Ship Checklist Audit
- type
- research-eval.ts
- schemas/__init__.py
- google-agent-platform-cloud-check.ts
- staging-worker-smoke.mjs
- networkx
- next-moves/route.ts
- postgres-execution.test.ts
- core-objects.ts
- risk-indicators/route.ts
- FakeCollection
- compilerOptions
- gliner_pre_pass.py
- readiness/route.ts
- 100. IMPLEMENTATION MASTER PLAN
- clean
- rights
- chat.ts
- canonical-graph.ts
- RetrievalOrchestrator
- context-enrichment-adapter.test.ts
- FakeCollection
- backend/main.py
- vertex_rag.py
- PRAXIS Document-Centric Agentic Research Plan
- CapsuleAgentView.tsx
- PRAXIS streamlining and workflow repairs — 2026-09-29
- Memory Layer Runbook
- Tool Entries
- verify-tools.ts
- devDependencies
- signal/evaluation.ts
- [...slug]/route.ts
- open-questions-store.ts
- fix-this-first-panel.tsx
- situation-intelligence/route.ts
- LocalCapsuleRegistry
- app-red-flags.ts
- output-capsules/storage.ts
- stage-targets.ts
- conversations-isolation.test.ts
- FakeCollection
- core-library.test.ts
- FakeCollection
- PRAXIS release record: September 30, 2026
- constants/tool-registry.ts
- Layout Grammar
- PRAXIS Agent Runtime Architecture
- red_team_analyst/runner.py
- verify-design-shipped.mjs
- SIGNAL world explorer: source and catalog research
- Ontology-First Capsule Workbench + Cohort Hardening — Design & Codex Brief
- extract-docling/main.py
- ExtractionCache
- negotiation_mediation.py
- audit-capsule-backfill-readiness.ts
- Agent Context Serialization Research for PRAXIS Capsules
- graph-service.ts
- pricing/page.tsx
- getAdminDbOrThrow
- AgentsWorkingStrip.tsx
- context-health-score.ts
- context_layers.py
- manifest.json
- test_sync_creates_nodes
- writer/ask/route.ts
- audits/README.md
- PRAXIS Deep Pre-Ship Checklist Audit
- package.json
- PRAXIS Compliance Tracker
- Incorporated
- PRAXIS tooling research — 2026-09-29
- 2. Still to ship (ordered by leverage)
- audit-cognee-isolation.ts
- grounding-metadata.ts
- cognee_aco_models/base.py
- truth_layers.py
- 2. Gaps and recommendations (priority order)
- collectors.ts
- Raw Gate Output
- [Unreleased] — 2026-04-26 (tenth session — Claude Code multi-lane sprint)
- MCP Task Profiles
- PRAXIS — CODEX Playbook & Improvement Roadmap
- research/README.md
- Dashboard
- {{Tool Name}}
- docx
- properties
- pricing.ts
- capsule-suggestions.ts
- tasklet-style-runtime.ts
- email-service.ts
- Claim
- migrate-user-api-keys.mjs
- Constraint
- 13. Codex execution backlog (Phases 0–1, file-level)
- FakeCollection
- PRAXIS Multi-Tenant Data Model
- document-postgres.ts
- 56. WHERE STANDARD AI FALLS SHORT
- Spec #1 — Cleanup & Infra
- instant-context.ts
- audit-capsule-depth.ts
- ContextCapsule — Attachable Capsule & Dock: Technical Build Recommendation
- audit-embedding-dim.ts
- audit-release-notes.ts
- circuit-breaker.ts
- export-docx/route.ts
- activity-panel.tsx
- provenance-graph.ts
- rationale.ts
- Policy and narrative quality evaluation
- PRAXIS Legacy Assistant Chat
- loadtest.mjs
- PRAXIS by TACITUS
- legacy
- audit-canonical-names.ts
- memos/search/route.ts
- recent-policy-work-page.tsx
- exa-agentic-search.ts
- dialectica-backbone.ts
- PRAXIS — Builder Handover (Architect Brief + CODEX Prompt Queue)
- capsules.ts
- human-review-panel.test.tsx
- audit-runner.test.ts
- Round 4 — Visual fixes + dev backlog + clarifying questions + Wikipedia + analyst notes
- Cognitive Capsule architecture
- compose-capsules-demo.tsx
- 101. FIRST CODEX EXECUTION PACK
- drafting-action/route.ts
- Capsule and Agentic Workflow Review - 2026-06-24
- Codex: start from this extracted folder
- Temporal graph and continuing context
- The portal and the paid deliverable
- COLLECTOR_ACCESS.md
- Implementable analysis method
- SOLO_FOUNDER_EXECUTION.md
- PRAXIS Design Rules — locked
- format.ts
- user-core-onboarding-card.tsx
- audit-tool-contracts.ts
- codegen-schema.ts
- Context Preparer
- Memo Drafter
- deploy-firebase-rules.mjs
- Output Refiner
- Source Augmenter
- Tool Skill Template
- Analyze Network
- Actor Alignment Shift
- Cease-Fire Monitor
- Commitment Check
- Escalation Ladder
- Escalation Timeline
- Leverage Trace
- Analysis of Competing Hypotheses
- Assumption Mapper
- Brief Exporter
- Causal Loop Diagram
- Community Synthesizer
- Context Health Explainer
- Contradiction Finder
- Devil's Advocate
- Indicators Tracker
- Key Assumptions Check
- Memo Create
- Memo Refresh
- Outside-In Thinking
- Premortem
- Red Team Analysis
- Scenario Projector
- Stakeholder Power Interest
- Timeline Comparator
- Beneficial Ownership Map
- Designation Tracer
- Evasion Pattern Detector
- Sanctions Impact Model
- Extract Entities (GLiNER)
- Coalition Map
- Mandate Traceback
- Veto Probability
- Pattern Detector
- Treaty Body Engagement
- UPR Cycle Mapper
- Violation Tracker
- AA Trigger Monitor
- Access Map
- Cluster Coordinator
- Needs Aggregator
- Jurisdictional Analyzer
- Precedent Finder
- Provision Tracer
- Reservation Effect Mapper
- Match Sanctions
- Mediation Brief
- Position vs Interest
- ZOPA Finder
- Counter-Narrative Finder
- Fact-Check Traceback
- Frame Cascade
- Alliance Cohesion Map
- Capability Assessor
- Escalation Modeler
- Posture Tracker
- Simulate Policy ABM
- PathPicker.tsx
- sources-preference.ts
- auto-structure.ts
- analyst-notes.ts
- collectTextContrastFailures
- ask-context-readiness.test.tsx
- futurist-ai-lab-contract.test.ts
- PRAXIS TODO
- forced_displacement.py
- 6. The recalibrated symbolic firewall
- strategic_competition.py
- [Unreleased] — 2026-04-25 (sixth session — operational spine)
- library-state.ts
- Round 5 — Hero quadrant tour + 10 new bricks + Codex handoff doc
- Capsule Database Audit
- PRAXIS Ask + ContextCapsule Cockpit Plan
- PRAXIS Foundation Coherence Check
- PRAXIS implementation ledger — 2026-09-30
- PRAXIS Audit Runner And TODO Triage
- PRAXIS chat-first experience plan — 2026-09-30
- audit-admin-only-internals.ts
- audit-ai-provider-isolation.ts
- audit-app-search-contract.ts
- audit-no-normal-user-archive.ts
- PRAXIS Tool Catalogue
- generate-tool-docs.ts
- analysis.ach-hypothesis/SKILL.md
- analysis.coalition-detector/SKILL.md
- analysis.commitment-tracker/SKILL.md
- analysis.contradiction-finder/SKILL.md
- analysis.frame-narrative/SKILL.md
- analysis.position-vs-interest/SKILL.md
- analysis.scenario-projector/SKILL.md
- analysis.stakeholder-power-interest/SKILL.md
- drafting.memo-drafter/SKILL.md
- research.deep-research-agent/SKILL.md
- profile-weighted-retrieval.ts
- capsule-factory-route-consolidation.test.ts
- Google Agent Platform For PRAXIS
- sanctions_economic_statecraft.py
- context.py
- Historical: PRAXIS Codex Night Pack — STATUS (2026-05-08)
- Authenticated Runtime Test Lane
- marketing-home-contract.test.ts
- CapsuleReviewQueueSection.test.tsx
- Agents
- get_settings
- Grafeo Context Graph Experiment
- GraphLite Capsule Embedded Graph
- 17. Decision tree — where does new code go?
- PRAXIS Architecture Live-App Alignment
- Agent ownership map — Claude × Codex on PRAXIS
- 16. CAPSULE TYPES
- Key findings
- Copy-ready continuation prompts
- Multilingual processing and evaluation protocol
- SIGNAL build progress
- Production integration specification
- SIGNAL operator runbook
- sanctions-yente/main.tf
- properties
- audit-capsule-workspace-legibility.mjs
- context-capsule-cognitive-assist-route.test.ts
- global-entity-index.ts
- CapsuleBuilderWizard.test.tsx
- postgres-sweep.test.ts
- PRAXIS Vertex AI Agent Engine — backend
- Fable ↔ Codex Pair Protocol (MANDATORY)
- scenario-forks.ts
- 11. Tools (L4 part 2) — the marketplace
- 18. Centralization, evolution, and discipline
- audit-capsule-graphlite-projections.ts
- PRAXIS KPI Pipeline
- PRAXIS Agentic Workflow Explained
- chat-pinned-evidence.test.ts
- PRAXIS Agentic Search Diagnostic
- 8. Simple-but-powerful UX — the pre/post-login simplification (CRITICAL)
- PRAXIS Public Copy Contract - 2026-06-09
- Codex controller for PRAXIS SIGNAL
- Canonical SIGNAL data contracts
- extract-docling/main.tf
- extract-graphrag/main.tf
- src/app/layout.tsx
- extract-ner-gliner/main.tf
- simulate-policy-abm/main.tf
- PRAXIS Conflict Grammar v1.0.0
- audit-ai-functionality.ts
- audit-capsule-inventory.ts
- audit-design.mjs
- audit-graph-proposal-review-contract.ts
- PRAXIS Security
- un-terminology.ts
- ask-praxis-clean-routing.test.ts
- ical-parser.ts
- capsule-workspace-visual-diagnostics.spec.ts
- 0022 - Red Team Analyst Subagent
- 0036 - GCP Production Verification Discipline
- ADR 0051: TrustGraph as an Optional Derived Context Substrate
- Ontology Backend Frontend Map
- DIALECTICA PRAXIS Context Contract
- Dead Surface Inventory
- Lane: Cloud And Auth Operations
- Lane: Dependencies And Toolchain
- Lane: Frontend QA And Product Surface
- Lane: Runtime And Agent Spine
- 15. COGNITIVE MEMORY MODEL
- 45. WORKER-SPECIFIC CONTEXT VIEWS
- PRAXIS Context And Policy Chat Diagnostic
- PRAXIS Product Documentation Index
- PRAXIS Simplification + Agentic Kernel Ledger
- Codex Cloud alternative
- MCP and access: keep the first setup small
- SIGNAL build and release progress
- ok
- Next 20 Improvements After Capsule Composer
- 10. Coalition Detector
- 11. Commitment Tracker
- 12. Memo Drafter
- 1. Ask PRAXIS
- 2. Context Builder
- 3. Grounded Research
- 4. Stakeholder Map
- 5. Position vs Interest
- 6. Scenario Projector
- 7. Analysis of Competing Hypotheses
- 8. Contradiction Finder
- 9. Frame Narrative
- sweep/route.ts
- audit-architecture-chain.ts
- audit-named-stack-contract.ts
- audit-orchestrator-writes.ts
- AskTurnPlanPanel.tsx
- audit-substrate-writers.ts
- audit-workspace-tabs-chapters.ts
- Red Team Analyst
- cypher/route.ts
- PRAXIS v3 Surface Classification
- PRAXIS Model Selection
- slash-commands.ts
- [3.7.0] — 2026-03-29
- search-query.ts
- [3.9.6] — 2026-03-30
- ask-context-bar-contract.test.ts
- deletion.ts
- [Unreleased] — 2026-04-25 (first session)
- signal/README.md
- Contributing to PRAXIS
- Deep Research Route Consolidation
- backfill-capsule-graph-stats.ts
- Capsule Quality Ranking
- 7. EXPERTISE / TACIT KNOWLEDGE GRAPH
- PRAXIS capsule and homepage implementation checkpoint
- Agent Engine Incident
- AI Provider Health
- Canary Rollback
- Cloud SQL Failover
- Local cognitive capsule packages and PRAXIS CLI
- Dashboards
- Databricks TACITUS Analytics Runbook
- Disposable Firebase Golden-Path User
- Firestore Rules Incident
- Identity Platform Incident
- Incident Response
- Load Handling
- PGVector Index Rebuild
- Postgres Operations
- Scheduler Job Failure
- Secret Rotation
- Storage Recovery
- Subagent Rollback
- Terraform Operations
- Acceptance gates and evidence
- Global source-pack design
- PRAXIS Attachable Tool Contract
- audit-agentic-search-proof.ts
- audit-ask-same-window-contract.ts
- audit-next-moves.ts
- audit-purpose-surface.ts
- audit-research-graph.ts
- canary-monitor.ts
- client.ts
- evidence-summary.ts
- tool-data-shapes.test.ts
- truth-layers.ts
- agent_context.md
- context-capsule-spans-route.test.ts
- [Unreleased] — 2026-04-25 (seventh session — deploy hardening)
- ADR 0049: Cognee Memory Layer Disabled-First
- ADR 0050: Context Capsule Unified Schema
- Conflict Data Sources
- Cost Notes
- PRAXIS Launch Readiness Audit
- Codex Orchestration Playbook
- PRAXIS Product Health Dashboard
- PRAXIS Technical Specification
- 1. PRODUCT NORTH STAR
- PRAXIS user readiness — 2026-09-30
- OpenSanctions Data Licensing
- praxis-chat-onboarding-recovery-contract.test.ts
- Runtime template - extract what the source says
- kpis.sql
- sanctions-opensearch/main.tf
- audit-agent-process-contract.ts
- audit-ai-routes.mjs
- audit-architecture-reference.ts
- audit-ask-cockpit-runtime.ts
- audit-capsule-memory-contract.ts
- audit-capsule-v3.ts
- audit-knowledge-library-contract.ts
- audit-output-capsule-storage.ts
- features/route.ts
- opengraph-image.tsx
- analytical-methods.ts
- capsule-cores.ts
- aco-copy.ts
- [Unreleased] — 2026-04-25 (fourth session — playbook + vision + cleanup)
- cluster.py
- PRAXIS Architecture Decision Records
- Postgres Knowledge Graph Schema
- PRAXIS Agentic Research Eval
- PRAXIS Agentic Research Eval
- PRAXIS Agentic Research Eval
- PRAXIS Agentic Research Eval
- PRAXIS Agentic Research Eval
- Capsule Depth Audit
- PRAXIS Canary Log
- PRAXIS Load Test Scaffold
- anchorStatus
- assertedBy
- citationId
- documentId
- end
- id
- label
- page
- predicate
- quote
- rationaleRef
- reviewState
- sourceVersion
- speechAct
- stance
- start
- strength
- subject
- type
- wordingRef
- praxis-backend.ts
- redactMarketplaceFoundationJson
- activity.ts
- draft-export.ts
- memos-id-route.test.ts
- active-conflict Ontology Changelog
- counter-terrorism Ontology Changelog
- cyber-hybrid Ontology Changelog
- forced-displacement Ontology Changelog
- frozen-conflict Ontology Changelog
- humanitarian-crisis Ontology Changelog
- negotiation-mediation Ontology Changelog
- political-transition Ontology Changelog
- sanctions-economic-statecraft Ontology Changelog
- strategic-competition Ontology Changelog
- [3.5.0] — 2026-03-26
- [3.7.1] — 2026-03-29
- [3.9.7] — 2026-03-30
- [5.1.0] — 2026-04-01
- [Unreleased] — 2026-04-25 (third session)
- [Unreleased] — 2026-04-26 (eighth session — workspace personalization)
- API Route Cleanup Map
- Capsule Consolidation Audit
- PRAXIS Tool Operating Contract Audit - 2026-05-31
- 19. CAPSULE STUDIO MODES
- `praxis_telemetry.events`
- bootstrap-user-key-master.sh
- cognee-kuzu-snapshot.sh
- monitoring-alerts.sh
- language
- layer
- name
- prefix
- quoteHash
- uri
- validFrom
- run-agent.ts
- PRAXIS production acceptance — 2026-09-30
- neo4j-sync.ts
- context-capsule-source-gap-promotion-route.test.ts
- safety_deny_list.md
- work/README.md
- verification.md
- 2026-05-19-agentic-runtime-readiness.md
- 2026-05-19-obsolete-code-candidates.md
- 2026-05-19-visible-surface-preservation.md
- 2026-05-30-capsule-backfill-readiness-audit.md
- 2026-05-30-capsule-research-dossiers-audit.md
- 2026-05-31-agentic-search-redflags.md
- 2026-05-31-capsule-graphlite-projections-audit.md
- LATEST-capsule-backfill-readiness-audit.md
- LATEST-capsule-graphlite-projections-audit.md
- LATEST-capsule-inspect-visibility-audit.md
- LATEST-capsule-research-dossiers-audit.md
- lanes/README.md
- PRAXIS_AGENTIC_KERNEL_CONTINUATION_PROMPT_2026-05-28.md
- PRAXIS_MAIN_DEPLOY_VERIFICATION_PROMPT_2026-05-28.md
- signal-build/AGENTS.md
- AGENTS_APPENDIX.md
- ASSESSMENT_DELTA.md
- COMPARE_NARRATIVES.md
- DRAFT_BRIEF.md
- fixtures/README.md
- DECISIONS.md
- PRAXIS Canonical Tool Library
- global.d.ts
- deploy-views.sh
- deploy.sh
- deploy-agent-engine.sh
- deploy-backend.sh
- deploy-cloudshell.sh
- deploy-cognee.sh
- deploy-frontend.sh
- grant-cloudbuild-audit-iam.sh
- setup-domain.sh
- setup-gcp.sh
- setup-langgraph-cloudsql.sh script
- setup-neo4j.sh
- setup-ttl.sh
- cloud-run-permissive-worker/README.md
- verify-deployment.sh
- postcss.config.mjs
- sync-ecc-to-codex.sh script
- sanctions-yente/README.md
- knowledge/README.md
- country-card/blocks.ts
- executive-summary/blocks.ts
- mediation-brief/blocks.ts
- talking-points/blocks.ts
- un-1-pager/blocks.ts
- env.d.ts
- operations.md
- builder/page.tsx
- praxis-backend
- PRAXIS optional backend agent integrations
- PRAXIS Documentation Map
- [3.8.0] — 2026-03-29
- [4.2.0] — 2026-03-31
- 0. READ THIS FIRST

## God Nodes (most connected - your core abstractions)
1. `vitest` - 501 edges
2. `next` - 320 edges
3. `cn()` - 265 edges
4. `handleRouteError()` - 238 edges
5. `TaskletPraxisWorkbench()` - 224 edges
6. `withAuth()` - 195 edges
7. `zod` - 186 edges
8. `getAdminDbOrThrow()` - 178 edges
9. `react` - 170 edges
10. `scripts` - 142 edges

## Surprising Connections (you probably didn't know these)
- `R4 — Ontology registry as data, not code (medium)` --references--> `OntologyId`  [INFERRED]
  docs/architecture/CAPSULE_ONTOLOGY_SEMANTIC_STRUCTURE.md → src/lib/ontology/types.ts
- `10.2 The provider` --references--> `ContextProvider`  [INFERRED]
  docs/architecture/PRAXIS_ARCHITECTURE.md → src/lib/tools/context-provider.ts
- `2. The mental model in one diagram` --references--> `ContextProvider`  [INFERRED]
  docs/architecture/PRAXIS_ARCHITECTURE.md → src/lib/tools/context-provider.ts
- `3.2 The four context layers are the only context` --references--> `ContextProvider`  [INFERRED]
  docs/architecture/PRAXIS_ARCHITECTURE.md → src/lib/tools/context-provider.ts
- `Message Stream Contract` --references--> `AskAnswerEnvelope`  [INFERRED]
  docs/product/PRAXIS_ASK_SAME_WINDOW_CHAT_AND_ARTIFACTS_PLAN_2026-05-23.md → src/lib/ai/ask-answer-envelope.ts

## Import Cycles
- None detected.

## Communities (950 total, 150 thin omitted)

### Community 0 - "next"
Cohesion: 0.01
Nodes (204): What I Reviewed, next, zod, runtime, GET, POST, ArtifactEntry, IntentSchema (+196 more)

### Community 1 - "saveToolOutput"
Cohesion: 0.03
Nodes (232): Lane B — Humanitarian calibrated route (NEW), ai, maxDuration, POST, ActorEnrichmentSchema, DEMO_RESPONSE, maxDuration, POST (+224 more)

### Community 2 - "tasklet-praxis-workbench.tsx"
Cohesion: 0.02
Nodes (118): CapsuleInspectionDialog(), actionIcons, AgentActionDrawer(), AgentApprovalSummary, agentReadinessClass(), _AgentRegistryCard(), agentRiskClass(), AgentRunDetail (+110 more)

### Community 3 - "context-capsules.ts"
Cohesion: 0.02
Nodes (173): ACO_CONTEXT_CAPTURE_PRIMITIVES, buildCapsuleCogneeSeedDocuments(), buildReasoningGuideSourcePack(), buildResearchDossierSourceSpine(), buildSourceOntologyBindings(), buildStarterClaimLedgerSeeds(), buildStarterCogneeProfile(), buildStarterContextCaptureProfile() (+165 more)

### Community 4 - "ContextBuilderRoom.tsx"
Cohesion: 0.05
Nodes (59): @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, AdvancedExplanationPanel(), AdvancedExplanationPanelProps, CapsuleBoard(), capsuleToSlots(), emptyBoard() (+51 more)

### Community 5 - "scripts"
Cohesion: 0.01
Nodes (142): scripts, admin:check, audit:admin-only-internals, audit:agent-process-contract, audit:agent-runtime-proof, audit:agentic-search, audit:agentic-search-proof, audit:agentic-search:write (+134 more)

### Community 6 - "capsule-v3.ts"
Cohesion: 0.04
Nodes (95): ContextCapsuleOutputContract, average(), buildCapsuleV3AgentReviewCards(), buildClaimLedger(), buildClaimLedgerFromClaims(), buildCogneeAdvisoryReviewCard(), buildDefaultReviewCards(), buildEvaluation() (+87 more)

### Community 7 - "situation-initializer.ts"
Cohesion: 0.04
Nodes (81): Conventions, CATEGORY_SEARCH_TERMS, maxDuration, POST, maxDuration, maxDuration, POST, maxDuration (+73 more)

### Community 8 - "vitest"
Cohesion: 0.03
Nodes (72): vitest, failures, REMOVED_ROUTE_FILES, root, EXPECTED_TOOLS, root, routeSource, chat (+64 more)

### Community 9 - "TaskletPraxisWorkbench"
Cohesion: 0.03
Nodes (87): Current Diagnosis, Phase 1 - Stop Surface Drift, What already exists, What is hurting the experience, Phase8WowLanding(), agentRunStatusFromEvent(), appendMemoSection(), buildFactoryReviewDiff() (+79 more)

### Community 10 - "worker.ts"
Cohesion: 0.05
Nodes (138): Safe Next Build, resolveRunCognitiveAttachments(), boundedGaps(), CapsuleFactoryDeps, CapsuleFactoryDraftOutput, createCapsuleFactoryReviewCards(), factoryEvidence(), runCapsuleFactoryDraft() (+130 more)

### Community 11 - "ontology/registry.ts"
Cohesion: 0.03
Nodes (95): args, backendFrontendMapDocPath, baseOwlPath, capsuleMarkers, capsuleService, contestationNodeIds, markers, missingCapsuleMarkers (+87 more)

### Community 12 - "auth-context.tsx"
Cohesion: 0.03
Nodes (87): [5.2.0] — 2026-04-01, Added, Fixed, Security, cmdk, framer-motion, zustand, AppLayout() (+79 more)

### Community 13 - "capsule-workbench-view-model.ts"
Cohesion: 0.05
Nodes (123): CapsuleQualityBreakdownId, addGraphBoundaryLayer(), addGraphLiteProjection(), arrayText(), arrayUnknown(), asRecord(), buildAgentWorkflow(), buildAnatomy() (+115 more)

### Community 14 - "capsule-service.ts"
Cohesion: 0.03
Nodes (103): CompositionConflict, CapsuleArchitectProposal, CapsuleEnvelopePatch, AdvisoryMemoryReviewCandidateInput, AppliedGraphProposal, applyCoreHealthToReadiness(), applyReadinessToHealth(), buildStarterSnapshot() (+95 more)

### Community 15 - "cn"
Cohesion: 0.03
Nodes (114): Shared Primitives, From `AnalystProfile`, class-variance-authority, @radix-ui/react-tooltip, capsuleParts, currentCapabilityAnchors, LearnPage(), metadata (+106 more)

### Community 16 - "COGNITIVE_CAPSULE_MASTER_PLAN_2026-10-02.md"
Cohesion: 0.02
Nodes (103): 102. ACCEPTANCE SCENARIO ONE — DIPLOMACY, 103. ACCEPTANCE SCENARIO TWO — ARMED GROUPS, 104. ACCEPTANCE SCENARIO THREE — PUBLIC FINANCE, 105. ACCEPTANCE SCENARIO FOUR — EXPERT HEURISTIC, 106. ACCEPTANCE SCENARIO FIVE — TEACH-BY-CORRECTION, 107. WHAT NOT TO DO, 108. DEFINITION OF SUCCESS, 109. FINAL PRODUCT VISION (+95 more)

### Community 17 - "signal/domain.ts"
Cohesion: 0.06
Nodes (97): AnalysisRequestSchema, calibratedHandler, maxDuration, POST, runtime, capabilities(), DELETE, GET (+89 more)

### Community 18 - "path/types.ts"
Cohesion: 0.04
Nodes (60): failures, { PATH_IDS }, { PATH_SEEDS }, { PRAXIS_GENKIT_PATH_TOOL_IDS }, registeredPathToolIds, require, GET(), PathPickerProps (+52 more)

### Community 19 - "ai/chat/route.ts"
Cohesion: 0.04
Nodes (108): @ai-sdk/google, @ai-sdk/google-vertex, maxDuration, maxDuration, agentRunSnapshotFromAnswerEnvelope(), AiSettings, AskFrameworkStepReceipt, AskToolInvocationReceipt (+100 more)

### Community 20 - "react"
Cohesion: 0.07
Nodes (71): lucide-react, react, CapsuleAgentView, CapsuleGraphViewer, CapsuleInspectionExperience(), Tab, TABS, CapsuleGraphViewerProps (+63 more)

### Community 21 - "world-service.ts"
Cohesion: 0.04
Nodes (71): Routes Still Using AI SDK Directly, Extension surface, maxDuration, POST(), runtime, GET, runtime, externalUrl() (+63 more)

### Community 22 - "cognitive-capsule/service.ts"
Cohesion: 0.04
Nodes (72): dynamic, GET, PATCH, POST, readBody(), RouteContext, routeError(), CapsuleExpertInterview() (+64 more)

### Community 23 - "getCapsule"
Cohesion: 0.11
Nodes (63): apply, main(), VersionBucket, DELETE, POST, POST, POST, saveCapsuleBuilderDraft() (+55 more)

### Community 24 - "types/domain.ts"
Cohesion: 0.07
Nodes (38): DomainPickerProps, NextMove, NextMovesContext, LENS_CATALOG, LensDef, buildFullLensWeights(), bustDomainCache(), cache (+30 more)

### Community 25 - "CapsuleExpertisePanel.tsx"
Cohesion: 0.05
Nodes (63): Authorship(), CapsuleCognitiveGraphPanel(), Conditions(), describeCognitiveStatement(), EvidenceExcerpt(), filterCognitiveStatements(), GraphInventory, humanize() (+55 more)

### Community 26 - "library.ts"
Cohesion: 0.06
Nodes (73): CapsuleLibrary(), CapsuleLibraryProps, CapsuleLibraryWithTry(), handleTryCapsule(), CategoryChip(), FacetSelect(), readableDate(), reviewStateLabel() (+65 more)

### Community 27 - "praxis-doctor.ts"
Cohesion: 0.06
Nodes (67): ArtifactFreshnessSummary, AuditArtifactSnapshot, buildArtifactFreshness(), buildCanaryPlan(), buildDoctorReport(), CANARY_ANALYST_PROFILE, CanaryArtifact, canaryHttpStatus() (+59 more)

### Community 28 - "AskStreamPanel.tsx"
Cohesion: 0.06
Nodes (66): AgentResultTurnHeader(), AnswerFollowUpPanel(), appendOrchestrationEvent(), appendTimelineContent(), appendTimelineStage(), AskCoreBrick, askGapPromotionKey(), AskGapPromotionState (+58 more)

### Community 29 - "json"
Cohesion: 0.04
Nodes (30): _fixture_path(), main(), to_cypher(), estimate_reduction(), test_priority_ontology_golden_sets_are_versioned_and_well_formed(), test_document_pipeline_cost_benchmark_exceeds_target(), main(), main() (+22 more)

### Community 30 - "evidence-pack.ts"
Cohesion: 0.04
Nodes (71): buildAgentReadContractFromReceipt(), buildCapsuleReadReceiptFromAsk(), buildCapsuleReadReceiptFromEvidencePack(), buildCapsuleReadReceiptFromRun(), CapsuleReceiptGovernanceOptions, CapsuleReceiptOntologyStack, governanceFields(), nonnegativeInt() (+63 more)

### Community 31 - "praxis-chat.tsx"
Cohesion: 0.05
Nodes (65): JevReviewControl(), AnswerAgentActivity(), ChatBubble(), ChatMessage, ChatProposal, ConversationCapsuleButton(), ExportToEditorButton(), isProfileMutationIntent() (+57 more)

### Community 32 - "datetime"
Cohesion: 0.08
Nodes (14): AgentEvent, AgentRun, AgentRunError, ACODataPoint, Actor, Claim, Commitment, Constraint (+6 more)

### Community 33 - "auth.ts"
Cohesion: 0.05
Nodes (34): @playwright/test, assertProtectedRoute(), coreRoutes, expectSingleExpertisePanels(), openOwnerInspector(), hasAuthCredentials, APP_OR_ONBOARDING(), authenticateFirebaseCanary() (+26 more)

### Community 34 - "agent-runtime/postgres.ts"
Cohesion: 0.05
Nodes (99): 3. Direct and queued branches both exist, dynamic, nextDispatchAttempt(), POST, RouteContext, dynamic, POST, dynamic (+91 more)

### Community 35 - "cognitive-capsule/evaluation.ts"
Cohesion: 0.05
Nodes (65): Cognitive and document parser evaluation, Optional actual parser comparison, Parser-independent DocumentIR, main(), ABLATION_PROFILES, AblationProfile, BenchmarkContextLock, BenchmarkProvider (+57 more)

### Community 36 - "createCapsuleReviewCard"
Cohesion: 0.09
Nodes (71): addInventoryBucket(), applyGraphEdgeProposal(), applyGraphNodeProposal(), approveAdvisoryMemoryCandidate(), assertAiGraphRationale(), buildAppliedGraphProjectionPatch(), buildCapsuleInventorySummary(), buildGraphProposalMemoryPosturePatch() (+63 more)

### Community 37 - "agent-runtime/types.ts"
Cohesion: 0.05
Nodes (69): Acceptance Criteria, ADK Ownership, Capsule Factory Decision, Current ADK State, Current Genkit State, Executive Position, Genkit Ownership, Non-Goals For The Next Wave (+61 more)

### Community 38 - "CapsuleWorkbenchPanel.tsx"
Cohesion: 0.03
Nodes (78): react-dom, capsulePlus, capsuleRoute, capsuleService, capsulesRoute, chatRoute, contextCapsules, contextInjection (+70 more)

### Community 39 - "ask-answer-envelope.ts"
Cohesion: 0.05
Nodes (73): handleCopy(), SourceabilitySupportLabel, answerContextReadiness(), AskAgenticDepthRecommendation, AskAnswerQualitySummary, AskContextDiagnostics, AskContextProvenanceChipKind, AskContextRepairAction (+65 more)

### Community 40 - "CapsuleGraphViewer.tsx"
Cohesion: 0.05
Nodes (61): react-force-graph-2d, applyGraphStyling(), buildForceGraphData(), buildNodeLabelMap(), buildTemporalBounds(), CapsuleGraphConfidenceKind, CapsuleGraphGeneratedBy, CapsuleGraphInvalidationReason (+53 more)

### Community 41 - "ref_node_crypto"
Cohesion: 0.07
Nodes (57): createPraxisMcpServer(), cursor, id, PRAXIS_MCP_MUTATIONS, PraxisMcpSchemas, PraxisMcpToolName, PraxisMcpTools, registryRef (+49 more)

### Community 42 - "run-authenticated-runtime-lane.ts"
Cohesion: 0.13
Nodes (20): agentRuntime, args, AuthRuntimePreflightCheck, AuthRuntimePreflightResult, capture(), continueOnFailure, evaluateAuthenticatedRuntimePreflight(), Lane (+12 more)

### Community 43 - "output-review.ts"
Cohesion: 0.11
Nodes (29): dynamic, GET, runtime, HumanReviewPanel(), AgentContextGroundingReport, normalizeLoadedMemo(), primaryMemoBody(), isCurrentMemoHumanApproval() (+21 more)

### Community 44 - "user-keys.ts"
Cohesion: 0.05
Nodes (62): GET, maxDuration, runtime, DELETE, maxDuration, PUT, RouteContext, runtime (+54 more)

### Community 45 - "tenant_session"
Cohesion: 0.08
Nodes (61): get_graph(), get_graph_subgraph(), get_situation_frame(), list_briefings(), list_cases(), list_dialectica_runs(), list_drafts(), list_memos() (+53 more)

### Community 46 - "pytest"
Cohesion: 0.06
Nodes (24): FirewallDecision, _needle(), validate_cypher(), verify_claim(), clear_state(), FakeNeo4j, test_cypher_injection_is_blocked(), test_graph_grounded_claim_passes() (+16 more)

### Community 47 - "specialists.ts"
Cohesion: 0.09
Nodes (48): appendWorkingObject(), assertRunContextReplay(), attachedReference(), attachmentHeader(), compileLockedRole(), createBlackboard(), freezeRunContext(), RunContextLock (+40 more)

### Community 48 - "runtime-data-plane.ts"
Cohesion: 0.08
Nodes (42): collectCloudSqlIntrospection(), collectFirestoreSamples(), main(), outDir, root, samplePath(), stamp, AiProviderPosture (+34 more)

### Community 49 - "model-runtime-policy.ts"
Cohesion: 0.15
Nodes (25): failures, health, policy, warnings, ASK_MODEL_POLICY, ASK_RUNTIME_OPTIONS, AskRuntimeMode, AskRuntimeStatus (+17 more)

### Community 50 - "blackboard/index.ts"
Cohesion: 0.04
Nodes (71): CompilationSchema, digest, id, ids, ReceiptSchema, BlackboardSchema, CognitiveBlackboard, common (+63 more)

### Community 51 - "build_from_json"
Cohesion: 0.07
Nodes (36): escalation_assessment(), faction_map(), graph_diff(), hidden_linkages(), _infer_event_escalation_impact(), intelligence_gaps(), _is_concept_node(), _is_file_node() (+28 more)

### Community 52 - "cognitive-capsule/schema.ts"
Cohesion: 0.06
Nodes (49): Portable constraints, validDate(), decideKnowledge(), COGNITIVE_LAYERS, COGNITIVE_SCHEMA_VERSION, cognitiveJsonSchema(), CognitiveNodeSchema, CognitiveStatementSchema (+41 more)

### Community 53 - "signal/schema.ts"
Cohesion: 0.06
Nodes (55): colors, descriptions, FallbackNetwork(), Scene, SignalEvidenceNetwork(), SignalInspectionSelection, areas, categories (+47 more)

### Community 54 - "dependencies"
Cohesion: 0.03
Nodes (69): dependencies, ai, @ai-sdk/google, @ai-sdk/google-vertex, @ai-sdk/react, class-variance-authority, clsx, cmdk (+61 more)

### Community 55 - "PRAXIS — Architecture Bible"
Cohesion: 0.03
Nodes (72): 0. How to read this document, 10.1 The types, 10.2 The provider, 10.3 Persistence, 10. Context (L4 part 1) — the four-layer substrate, 12.1 The seven subagents, 12.2 Why Vertex AI Agent Engine, 12.3 The deployment shape (+64 more)

### Community 56 - "account-settings-page.tsx"
Cohesion: 0.05
Nodes (49): dynamic, SettingsPage(), AccountRecord, AccountSettingsPage(), load(), ActionButton(), AdminRuntimeHealthPayload, AgenticSearchPayload (+41 more)

### Community 57 - "PRAXIS — STATUS"
Cohesion: 0.03
Nodes (66): 2026-05-10 — repo cleanup, 2026-05-10 — v5 MVP Phase 0, 2026-05-15 — ADK + Genkit Runtime Integration Map, 2026-05-15 — ADK Research Memo Bridge Contract, 2026-05-15 — Agent Runtime Mirror For Genkit + ADK, 2026-05-15 — Aggressive Tasklet Cleanup Checkpoint, 2026-05-15 — Ask PRAXIS Capsule AI Readiness Panel, 2026-05-15 — Canonical ContextCapsule Agent Runtime Direction (+58 more)

### Community 58 - "capsule-plus/index.ts"
Cohesion: 0.05
Nodes (76): ADR 0052: GraphLite Seeds for Capsule+ Embedded Graphs, Consequences, Context, Decision, Implementation Notes, Status, dynamic, isRecord() (+68 more)

### Community 59 - "capsule-closed-loop-learning.ts"
Cohesion: 0.08
Nodes (59): GET, POST, SourceabilityVerdict, appendCaveat(), appendDocumentClaims(), applyFeedbackToClaimLedger(), applyUsageToClaimLedger(), asRecord() (+51 more)

### Community 60 - "capsule-v2.ts"
Cohesion: 0.07
Nodes (65): buildCapsuleAgentPayload(), buildCapsuleImproveProposals(), CapsuleAgentPayload, CapsuleForkability, CapsuleImproveAction, CapsuleImproveProposal, CapsuleReviewStatus, CapsuleVisibilityV2 (+57 more)

### Community 61 - "CapsuleBuilderWizard.tsx"
Cohesion: 0.07
Nodes (52): 2. What we have done so far (honest current state), @monaco-editor/react, BuilderStepId, CapsuleBuilderWizard(), patchCapsule(), patchCausalLink(), patchTimelineAnchor(), runArchitect() (+44 more)

### Community 62 - "dialectica-capsule-import.ts"
Cohesion: 0.13
Nodes (28): getModelIdForTask(), buildDialecticaCapsuleImportPlan(), buildDialecticaCapsuleImportPreview(), claimCaveat(), claimProvenanceRefs(), cleanStringArray(), confidenceOrNull(), DIALECTICA_KNOWN_LAYERS (+20 more)

### Community 63 - "notifications/registry.py"
Cohesion: 0.03
Nodes (63): EdgeRepo, EmbeddingRepo, GraphEdgeRecord, GraphNodeRecord, GraphTraversalRepo, NodeRepo, dispatch_pending_deliveries(), initial_channel_status() (+55 more)

### Community 64 - "profile-events.ts"
Cohesion: 0.11
Nodes (22): @google-cloud/pubsub, dynamic, POST(), verifyPubSubPushAuth(), compactAttributes(), decodePubSubJsonEnvelope(), getPubSubClient(), isPushEnvelope() (+14 more)

### Community 65 - "onboarding-return.test.tsx"
Cohesion: 0.07
Nodes (39): Decision 3 — Roles, CallbackCard(), LoginCallbackContent(), LoginCallbackPage(), getPasswordStrength(), LoginForm(), OnboardingPage(), OnboardingWizard() (+31 more)

### Community 66 - "profile-context.ts"
Cohesion: 0.06
Nodes (54): ActiveCapsuleRef, deriveInteractionFrame(), summarizeOutput(), toIso(), truncate(), AttachedCapsuleContext, buildCalibratedContext(), buildDefaultRetrievalQuery() (+46 more)

### Community 67 - "handover-package/route.ts"
Cohesion: 0.09
Nodes (46): buildDocx(), buildPdf(), dynamic, GET, json(), loadPinnedCapsule(), loadPlan(), POST (+38 more)

### Community 68 - "runtime.ts"
Cohesion: 0.07
Nodes (33): POST, buildSuggestionRationale(), CATEGORY_LABELS, getMethodById(), getMethodSourceTool(), getMethodSuggestions(), MethodCategory, MethodDefinition (+25 more)

### Community 69 - "pydantic"
Cohesion: 0.10
Nodes (5): CorporateStrategicAnalysisOntology, DomesticPolicyAnalysisOntology, ForeignPolicyResearchOntology, confidence_cap_for_tier(), SourceTierDefinition

### Community 70 - "asyncio"
Cohesion: 0.05
Nodes (28): capped_confidence(), CogneeCandidate, promote_link(), reject_link(), write_candidate_links(), _escape(), _format_labels(), increment_counter() (+20 more)

### Community 71 - "cognee_memory.py"
Cohesion: 0.10
Nodes (41): add(), _base_payload(), _candidate_id(), _candidate_metadata(), _candidate_score(), _candidate_source_id(), _candidate_text(), _candidate_to_hit() (+33 more)

### Community 72 - "assistant/next-moves.ts"
Cohesion: 0.13
Nodes (25): POST, attachedFromContext(), candidate(), dedupeMoves(), domainFromContext(), getNextMoves(), inferHealthScore(), labelFor() (+17 more)

### Community 73 - "types/index.ts"
Cohesion: 0.05
Nodes (56): Report, ReportSchema, ReportSection, ReportSectionSchema, ApiError, ApiRequest, ApiResponse, ChatMessage (+48 more)

### Community 74 - "agent-context-salience.ts"
Cohesion: 0.10
Nodes (59): ADVISORY_REVIEW_STATES, AgentContextBudget, arrayOfRecords(), arrayOfStrings(), BUDGETS, buildReasoningPaths(), capCausalConfidence(), CAUSAL_RELATIONSHIPS (+51 more)

### Community 75 - "active-context-stack.ts"
Cohesion: 0.04
Nodes (80): Verified local facts, 2. P1: signed-out copy must match the login requirement, fixed, 7. P2: repeated public explanations, consolidated, GuidePage(), metadata, requestExamples, steps, AskContextBar (+72 more)

### Community 76 - "AskQueuedAgentRunPanel.tsx"
Cohesion: 0.07
Nodes (50): dynamic, POST, dynamic, freshRetryMetadata(), hasElapsedDeadline(), POST, RETRY_EXECUTION_ARTIFACTS, AgentEventProofFacts() (+42 more)

### Community 77 - "CapsuleLibraryCard.tsx"
Cohesion: 0.14
Nodes (20): CapsuleLibraryCard(), CapsuleLibraryCardAddAction, CapsuleLibraryCardBadge, CapsuleLibraryCardCounts, CapsuleLibraryCardDragAction, CapsuleLibraryCardGraph, CapsuleLibraryCardMetric, CapsuleLibraryCardProps (+12 more)

### Community 78 - "model-matrix.ts"
Cohesion: 0.13
Nodes (19): auditModelMatrixCoverage(), AuditModelMatrixCoverageResult, checkForbiddenModelId(), findForbiddenSourceMatches(), FORBIDDEN_MODEL_PATTERNS, isTextFile(), SANCTIONED_TASK_MODELS, walkFiles() (+11 more)

### Community 79 - "src/app/page.tsx"
Cohesion: 0.38
Nodes (5): Public pages, operatorJsonLd, Page(), softwareJsonLd, PraxisMarketingHome()

### Community 80 - "from-ask-pack/route.ts"
Cohesion: 0.08
Nodes (44): artifactMetadataLines(), buildArtifactMetadata(), buildOutputCapsuleInput(), collectSourceReceiptIds(), excerpt(), PackSchema, POST, RequestSchema (+36 more)

### Community 81 - "capsule-details-service.ts"
Cohesion: 0.07
Nodes (46): CreateEvaluationSchema, dynamic, GET, LinksSchema, POST, RouteContext, ScorecardSchema, CapsuleDetail (+38 more)

### Community 82 - "gcloud"
Cohesion: 0.05
Nodes (45): Active Enforcement, Canonical references, Current Production Shape, Deeper References, Historical / Subsumed Directions, PRAXIS Architecture, Product Surface Doctrine, Removed (+37 more)

### Community 83 - "knowledge/context-engine.ts"
Cohesion: 0.04
Nodes (57): Lane A — Situation corpus retrieval API (NEW), Corpus Sources, Current Implementation, Google Cloud Path, Implementation Order, Objective, PRAXIS Corpus Architecture, Target API (+49 more)

### Community 84 - "capsule-quality-ranking.ts"
Cohesion: 0.05
Nodes (51): 10. CODEX prompt queue (run in order, one prompt = one checkpoint), advancedSource, componentSource, Finding, findings, inspectionSource, librarySource, outDir (+43 more)

### Community 85 - "audit-route-cleanup-map.ts"
Cohesion: 0.07
Nodes (51): ApiRouteCategory, ApiRouteInventoryEntry, authPostureFor(), buildApiRouteInventory(), calibrationStatusFor(), callerEvidenceFor(), categorizeRoute(), formatApiRouteInventoryMarkdown() (+43 more)

### Community 86 - "getModel"
Cohesion: 0.05
Nodes (70): AI Model Tiers (Gemini 3.5 Ask primary + Gemini 2.5 fallbacks), Anti-Patterns to Refuse, AI model, EventSchema, maxDuration, POST, ResponseSchema, runtime (+62 more)

### Community 87 - "context-builder-plan.ts"
Cohesion: 0.13
Nodes (20): getPolicyWorkflowPath(), POLICY_WORKFLOW_PATHS, PolicyWorkflowPathId, buildChecklist(), buildContextBuilderPlan(), buildDeepResearchPrompt(), buildNextActions(), buildRunSequence() (+12 more)

### Community 88 - "feed-aggregator.ts"
Cohesion: 0.06
Nodes (43): [4.1.0] — 2026-03-31, Added, Changed, GET(), maxDuration, SituationAlert, GET(), maxDuration (+35 more)

### Community 89 - "context-kernel.ts"
Cohesion: 0.07
Nodes (51): Local PRAXIS Findings, CapsuleClaimLedgerItem, CapsuleGroundingReceipt, CapsuleMemoryReceipt, CapsuleSourceRefreshDocket, CapsuleSourceRefreshDocketItem, CapabilityDefinition, CapabilityId (+43 more)

### Community 90 - "boardroom-workspace.tsx"
Cohesion: 0.06
Nodes (53): BoardroomLoadingSkeleton(), BoardroomPage(), BoardroomWorkspace, AgentRunSummary, arrayFromPath(), BOARDROOM_AGENT_IDS, BOARDROOM_ROSTER, BoardroomAgent (+45 more)

### Community 92 - "wikidata_sparql.py"
Cohesion: 0.08
Nodes (25): _decompose(), ResearchState, run_research_state_machine(), ResearchRunRequest, run_research(), _sse(), stream_research_report(), _fallback_result() (+17 more)

### Community 93 - "research-graph/index.ts"
Cohesion: 0.09
Nodes (51): BigQueryEventTimelineInput, BigQueryEventTimelineValidation, BigQueryTemplate, blockedReasonMessage(), buildBlockedResearchGraphReceipt(), buildEventTimelineBigQueryTemplate(), buildGdeltDocQuery(), buildGdeltDocUrl() (+43 more)

### Community 94 - "context-injection.ts"
Cohesion: 0.10
Nodes (39): High: Boardroom can truncate away the dock prompt layer, Medium: Dock prompt text is not escaped like the system prompt block, CognitiveAttachmentSource, ActiveContextBlocks, buildAdvisoryMemoryPromptBlock(), buildAssociatedCapsulesPromptBlock(), buildBuilderDraftPromptBlock(), buildCapsuleContext() (+31 more)

### Community 95 - "ask-orchestrator.ts"
Cohesion: 0.03
Nodes (127): Phase 3 - Add An AskTurnPlan Before Generation, What I Would Do Next, In Order, 1. Ask Supervisor, 2. Capsule Reader, 3. Workflow Planner, 4. Research Scout, 5. Evidence Curator / Sourceability Reviewer, 6. Domain Lens Agents (+119 more)

### Community 96 - "ActiveContextStackState"
Cohesion: 0.09
Nodes (31): 10. Success criteria, 1. Goal, 2. Current state (verified), 3. Decisions (approved by user 2026-06-26), 4.2 Chat route change (the gate), 4.4 Frontend, 4. Architecture, 5. Error handling (+23 more)

### Community 97 - "flows.py"
Cohesion: 0.06
Nodes (18): ACOExtractionOutput, build_agentic_research_flow_plan(), emit_agent_run_flow_event(), _register_flows(), agentic_research_flow(), run_agentic_research_flow(), run_extraction(), SituationBrief (+10 more)

### Community 98 - "signal-workspace.tsx"
Cohesion: 0.07
Nodes (40): SIGNAL integration map, SignalPage(), SignalFeedbackPanel(), Brief, BriefCard(), CaptureForm(), Card(), CoverageStatus() (+32 more)

### Community 99 - "FastAPI"
Cohesion: 0.07
Nodes (15): _init_firebase(), verify_firebase_token(), verify_service_token(), _mock_request(), test_verify_firebase_token_accepts_oidc_with_praxis_uid(), test_verify_firebase_token_raises_401_for_invalid_token(), test_verify_firebase_token_raises_401_when_no_token(), test_verify_firebase_token_returns_uid_for_valid_token() (+7 more)

### Community 100 - "memo-service.ts"
Cohesion: 0.11
Nodes (37): Assigned local repairs and validation, GET, MemoQuerySchema, POST, SaveMemoSchema, omitUndefinedMetadata(), approveMemoBody(), artifactMetadata() (+29 more)

### Community 101 - "AskWorkspacePage.tsx"
Cohesion: 0.08
Nodes (42): AppPageHeader(), AppPageHeaderProps, HeaderAction, HeaderLink(), AskRunReadinessPanel(), AskWorkspacePage(), handleUserModelChange(), AskWorkspacePageProps (+34 more)

### Community 102 - "AnswerQualityStrip.tsx"
Cohesion: 0.36
Nodes (8): AnswerQualityStrip(), formatContextReadiness(), formatDeepRun(), iconForAction(), QualityPill(), computeEvidenceCoverage(), AskContextReadinessState, AskQueuedDeepRunStatus

### Community 103 - "draft-assembly-state.ts"
Cohesion: 0.10
Nodes (28): citationMarker(), collectFootnotes(), createMemoVersion(), memoBlocksToMarkdown(), memoBlocksToPlainText(), MemoExportInput, buildMemoBlocksForCase(), getMemoTemplate() (+20 more)

### Community 104 - "graph-updates-service.ts"
Cohesion: 0.11
Nodes (33): BodySchema, maxDuration, POST, ProposalSchema, POST, POST, buildAskPraxisExtensions(), groundedSearchFetchSessionCounters (+25 more)

### Community 105 - "[token]/route.ts"
Cohesion: 0.39
Nodes (7): CapsuleShare, dynamic, GET, isExpired(), POST, resolveShare(), RouteContext

### Community 106 - "library-service.ts"
Cohesion: 0.11
Nodes (47): buildDigestPrompt(), POST, AttachDocumentSchema, dynamic, POST, RouteContext, dynamic, GET (+39 more)

### Community 107 - "situations.ts"
Cohesion: 0.06
Nodes (49): GET(), POST(), RouteContext, cache, FeedAlert, GET, parseWindowHours(), RouteContext (+41 more)

### Community 108 - "agent-runtime/tool-registry.ts"
Cohesion: 0.04
Nodes (49): AGENT_TOOL_REGISTRY, AgentToolApprovalPolicy, AgentToolDefinition, AgentToolPersistenceTarget, ApprovalGateInputSchema, ApprovalGateOutputSchema, ArtifactListSchema, BoardExecutivePackInputSchema (+41 more)

### Community 109 - "os"
Cohesion: 0.06
Nodes (29): document_retrieval_tool(), graph_query_tool(), web_search_tool(), build_agent(), main(), langsmith_enabled(), DocumentRef, NerEntity (+21 more)

### Community 110 - "context-snapshot.ts"
Cohesion: 0.18
Nodes (12): copy(), emptyContext(), MemoContextInput, MemoContextSnapshot, MemoContextSnapshotSchema, NullableReference, readMemoContextSnapshot(), recordMemoContextSnapshot() (+4 more)

### Community 111 - "flows/capsule-factory.ts"
Cohesion: 0.07
Nodes (40): FactoryTelemetryPath, SourceSnippet, CapsuleFactoryApplyTargetSchema, CapsuleFactoryCogneeModeSchema, CapsuleFactoryCoreKindSchema, CapsuleFactoryDocumentSchema, CapsuleFactoryDraftCoreSchema, CapsuleFactoryEcosystemContributorSchema (+32 more)

### Community 112 - "work-intent-router.ts"
Cohesion: 0.08
Nodes (39): appendSuppliedContextAnswerPolicy(), SUPPLIED_CONTEXT_ANSWER_POLICY, AskContextReceipt, AskExecutionPreference, filterAskToolsForExecution(), PROVIDED_CONTEXT_TOOL_IDS, readAskMessages(), resolveAskExecutionPreference() (+31 more)

### Community 113 - "polar-webhook.ts"
Cohesion: 0.14
Nodes (19): dynamic, POST(), runtime, applyPolarSubscriptionPatch(), booleanValue(), creditAllowanceForPlan(), isoDateValue(), objectValue() (+11 more)

### Community 114 - "ontology_system.py"
Cohesion: 0.07
Nodes (25): ontology_cache_debug(), _ontology_stack(), _candidate_key(), detect_ontology_gap(), OntologyGapProposal, _sample_quotes(), _suggested_fields(), UngroundedPattern (+17 more)

### Community 115 - "docling_parser.py"
Cohesion: 0.11
Nodes (27): Chunk, chunk_docling_document(), flush(), _extract_items(), _kind(), _order_key(), _page(), _split_long_text() (+19 more)

### Community 116 - "cleanString"
Cohesion: 0.13
Nodes (37): buildAgentOperatingContract(), buildCandidateExtension(), buildContextCaptureOntologyBinding(), buildContextCaptureProfile(), buildGrounding(), buildMemoryPosture(), causalRelationFromUnknown(), cleanString() (+29 more)

### Community 117 - "_healthy_snapshot"
Cohesion: 0.22
Nodes (16): AnalystProfileHealthInput, CorpusCoverageHealthInput, DegradationKind, FeedHealthInput, HealthState, JobHealthInput, ToolOutputHealthInput, _healthy_snapshot() (+8 more)

### Community 118 - "Changelog"
Cohesion: 0.03
Nodes (61): 2026-04-30 — Tool operating system foundation, 2026-05-01 — Tools workspace continuation, 2026-05-03 — Syria graph-grounded research handoff, [2.x] — Pre-release, [3.0.0] — 2026-03-01, [3.1.0] — 2026-03-05, [3.2.0] — 2026-03-10, [3.3.0] — 2026-03-15 (+53 more)

### Community 119 - "useAgentRunSnapshots.ts"
Cohesion: 0.06
Nodes (55): @ai-sdk/react, CompactRunTimeline(), InlineApprovalDecision(), phaseDotClassName(), phaseFromEvent(), PHASES, RunTimeline(), RunTimelinePhase (+47 more)

### Community 120 - "context/capsules/route.ts"
Cohesion: 0.09
Nodes (26): ActivateSchema, CombineSchema, CoreRefsSchema, CreateSchema, dynamic, ForkSchema, GET, ImportCoreSchema (+18 more)

### Community 121 - "documents-service.ts"
Cohesion: 0.07
Nodes (31): dynamic, GET, RouteContext, POST, GET, CapsuleEvidencePackDeps, getEmbeddingModel(), hasServerAiProvider() (+23 more)

### Community 122 - "analyst-profile-admin.ts"
Cohesion: 0.06
Nodes (45): BASE_COOKIE_OPTIONS, cookieOptionsForRequest(), GET(), POST(), readExistingOnboardingSkippedCookie(), COOKIE_OPTIONS, POST, COOKIE_OPTIONS (+37 more)

### Community 123 - "CapsuleImportButton.tsx"
Cohesion: 0.15
Nodes (25): CapsuleImportButton(), confirmImport(), handleFile(), CapsuleImportResult, FieldError, FieldErrorList(), formatList(), ImportPhase (+17 more)

### Community 124 - "common.py"
Cohesion: 0.10
Nodes (26): run(), build_graph(), confidence(), label(), metadata(), neighbors_with_relation(), node_type(), nodes_by_type() (+18 more)

### Community 125 - "agents/registry.ts"
Cohesion: 0.11
Nodes (28): Lane M — Agent registry codified, main(), activePersonas(), ADVISOR_RUNTIME_BY_ID, advisorRuntimeSeeds(), AdvisorSeedConfig, AGENT_REGISTRY, criticPersonas() (+20 more)

### Community 126 - "deep-search-agent/route.ts"
Cohesion: 0.06
Nodes (43): DeepResearchRequestSchema, deprecatedHeaders(), maxDuration, RequestResearchDepth, RequestResearchMode, DeepSearchAgentRequestSchema, maxDuration, POST (+35 more)

### Community 127 - "agent-context-verifier.ts"
Cohesion: 0.08
Nodes (43): buildGroundingVerificationForText(), AgentContextGroundingMap, AgentContextPacketResult, AgentContextSelectionResult, NormalizedClaimCard, ReasoningPath, SelectedAgentContext, AgentContextFlaggedSpan (+35 more)

### Community 128 - "ask-context-bar.tsx"
Cohesion: 0.10
Nodes (36): [Unreleased], 1. What "attachable capsule" must mean technically, 2. Current state (verified shipped as of 2026-06-11), actionClassName(), ApprovalInboxButton, AskContextBar(), attachCapsuleToSlot(), attachContext() (+28 more)

### Community 129 - "temporal-timeline.ts"
Cohesion: 0.13
Nodes (41): BROKEN OR RISKY, CapsuleTemporalViewerItem, anchorItems(), arrayOfRecords(), buildTemporalTimeline(), capsuleCausalEdges(), capsuleTemporality(), CAUSAL_RELATIONS (+33 more)

### Community 130 - "audit-agent-runtime-proof.ts"
Cohesion: 0.05
Nodes (34): access, files, fixtures, ids, markdown, phases, register, release (+26 more)

### Community 131 - "config.ts"
Cohesion: 0.06
Nodes (45): firebase, ApprovalInboxButton(), ApprovalInboxItem(), hydrateRunContexts(), PendingAgentApproval, recordValue(), RunApprovalContext, stringValue() (+37 more)

### Community 132 - "PraxisCapsuleLibraryCard"
Cohesion: 0.07
Nodes (66): AgentFailureForensicsPanel(), agentRunStatusClass(), AgentStatusRail(), buildCapsuleEnrichmentReceipt(), buildCapsuleUsefulnessRating(), _capsuleAdoptionSourceCoverage(), CapsuleBrowserDialog(), capsuleCategory() (+58 more)

### Community 133 - "normalizeCapsuleIntakeContract"
Cohesion: 0.13
Nodes (20): buildCapsuleArtifactIndex(), buildCapsuleContextPack(), buildCapsuleQualityReceipt(), createCapsuleIngestionReceipt(), dedupeArtifactIndexItems(), deriveIntakeReviewGate(), getCapsuleConnector(), intakeEvidenceIds() (+12 more)

### Community 134 - "case-scaffold.ts"
Cohesion: 0.07
Nodes (33): 0030 Dynamic Ontology Lenses, Alternatives considered, Consequences, Context, Decision, Status, CustomSource, SOURCE_CATEGORIES (+25 more)

### Community 135 - "with-credits.ts"
Cohesion: 0.10
Nodes (22): [3.6.1] — 2026-03-28, Changed, Security — Auth Hardening, POST, AI_CREDIT_COSTS, checkAndDeductCredits(), checkAndDeductCreditsForUid(), deniedUsage() (+14 more)

### Community 136 - "coverage-globe.ts"
Cohesion: 0.08
Nodes (33): Dataset contract, Interpret results honestly, Run the bounded offline evaluator, SIGNAL analyst labeling and evaluation, three, Scene, SignalCoverageGlobe(), totalLabels (+25 more)

### Community 137 - "typing"
Cohesion: 0.02
Nodes (35): get_checkpointer(), init_checkpointer(), NoopAsyncSaver, health_check(), build_graph(), RedTeamAnalystState, build_registry(), FlowRegistration (+27 more)

### Community 138 - "Skeleton"
Cohesion: 0.11
Nodes (25): AgentWorkspacePage(), AgentWorkspacePageProps, TaskletPraxisWorkbench, WorkbenchLoadingSkeleton(), CapsuleLibraryWithTry, CapsulesPage(), CapsulesPageProps, LibraryLoadingSkeleton() (+17 more)

### Community 139 - "capsule-schema.ts"
Cohesion: 0.06
Nodes (47): fromV3(), CapsuleQualityResult, CapsuleAnyVersionSchema, CapsuleClaimCausalLinksSchema, CapsuleClaimPatchSchema, CapsuleEnvelopePatchSchema, CapsuleReadinessBlock, CapsuleReadinessTier (+39 more)

### Community 140 - "context.ts"
Cohesion: 0.07
Nodes (39): CaseTypeDefinition, OntologyId, CapsuleCogneeSeedDocument, CapsuleCogneeSeedPack, CapsuleOntologyBindingProfile, CapsuleSourceOntologyBinding, ContextProvider, ContextProviderInput (+31 more)

### Community 141 - "upload/route.ts"
Cohesion: 0.12
Nodes (28): ALLOWED_EXTENSIONS, cleanFormValue(), computeReceiptConfidence(), confirmOwnerAfterStorageWrite(), documentLimitResponse(), documentWriteUnavailableResponse(), isDocumentWriteUnavailable(), JsonUploadBody (+20 more)

### Community 142 - "situations/route.ts"
Cohesion: 0.08
Nodes (38): Domain Taxonomy — 11 domains, live Firestore config, BodySchema, POST, cleanContextNotes(), cleanUrl(), ESCALATION_TRENDS, GET, isEscalationTrend() (+30 more)

### Community 143 - "capsule-quality.ts"
Cohesion: 0.06
Nodes (67): 3.1 Creation — co-pilot + document-first + progressive depth, 3.3 Embedded graph · dynamic ontology · semantic layer, 3.4 Display / workbench — legible knowledge object, 3.5 Usage / consumption — capsule as first-class context, 3.6 Analysis & quality 2.0, 3.7 Learning — closed loop under governance, 3. Target capability upgrades (the substance), buildCapsuleReadinessCounts() (+59 more)

### Community 144 - "context-enrichment-adapter.ts"
Cohesion: 0.08
Nodes (29): Proposed Serialization Spec, Section Structure, Serialization Rules, KernelMemoryItem, advisoryHitToMemoryItem(), attachEnrichment(), buildEnrichedTurnCapsule(), CogneeEnrichmentProvider (+21 more)

### Community 145 - "sourcing.ts"
Cohesion: 0.09
Nodes (34): CapsuleDryRunEvalInput, buildCapsuleSourcingPlan(), CapsuleContextRetrievalDeps, CapsuleContextRetrievalInput, CapsuleContextRetrievalResult, CapsuleSourcingLane, CapsuleSourcingLaneId, CapsuleSourcingPlan (+26 more)

### Community 146 - "agent-context-packet.ts"
Cohesion: 0.10
Nodes (45): 1. Agent Context Packet v1 is injected into the Ask prompt, appendAgentContextPacketToPromptBlock(), buildAgentContextPacket(), BuildAgentContextPacketInput, buildGroundingMap(), buildRenderContext(), capsuleTemporality(), claimUseRuleFor() (+37 more)

### Community 147 - "properties"
Cohesion: 0.05
Nodes (40): enum, type, maxLength, minLength, type, default, items, maxItems (+32 more)

### Community 148 - "audit-capsule-consolidation.ts"
Cohesion: 0.06
Nodes (31): acceptedPostConsolidationCatalogWaves, auditDir, averagePromptLength, counts, expectedCounts, failures, jsonPath, mdPath (+23 more)

### Community 149 - "turns/route.ts"
Cohesion: 0.08
Nodes (45): cleanDocId(), ConversationTurnRouteContext, ConversationTurnSchema, deriveConversationTitle(), dynamic, maxDuration, POST, requestedAgenticSearchPremium() (+37 more)

### Community 150 - "audit-deep-preship.ts"
Cohesion: 0.05
Nodes (38): add(), allSource, auditDir, bannedModelMarkers, baseOwl, bySection, Check, checks (+30 more)

### Community 151 - "memo-checks.ts"
Cohesion: 0.13
Nodes (24): AskPraxisDelegateResult, buildMemoClaimCheckQuestion(), buildMemoClaimCheckResult(), checkMemoLanguageConstraints(), confidenceForSupportLabel(), deriveMemoExportGate(), exportGateDetail(), findAudienceToneViolations() (+16 more)

### Community 152 - "cognitive-capsule/types.ts"
Cohesion: 0.07
Nodes (35): CognitiveComposition, composeCognitiveCapsules(), compositionConflicts(), CompositionParentLock, CompositionRecordOrigin, IndexedRecord, normalize(), recordsOf() (+27 more)

### Community 153 - "knowledge/index.ts"
Cohesion: 0.05
Nodes (43): GET, EMBEDDING_DIMENSION, EMBEDDING_MODEL, EmbeddingDimension, chunkText(), EMBEDDING_DIMENSIONS, generateEmbedding(), generateEmbeddings() (+35 more)

### Community 154 - "capsule-version-resolution.ts"
Cohesion: 0.12
Nodes (35): GET, getActiveStackDb(), getActiveStackPointer(), getActiveStackRef(), hasExplicitSelection(), isExplicitClear(), PUT, reconcileGoverningCapsuleRef() (+27 more)

### Community 155 - "AnswerSourcesPanel.tsx"
Cohesion: 0.14
Nodes (26): AnswerSourceGapChips(), AnswerSourcesPanel(), AnswerSourcesPanelProps, buildAnswerSourcesPanelModel(), buildClaimChips(), buildCommentaryLines(), buildSourceEntries(), buildSummaryLine() (+18 more)

### Community 156 - "conflict-grammar.ts"
Cohesion: 0.06
Nodes (37): ACO_ENTITY_TYPES, Actor, ActorSchema, BaseEntitySchema, Claim, ClaimSchema, Commitment, CommitmentSchema (+29 more)

### Community 157 - "dialectica/route.ts"
Cohesion: 0.10
Nodes (30): buildImportSummary(), dynamic, importLegacyDialecticaContextPackage(), importSpec3DialecticaPackage(), isDialecticaZipContentType(), isRecord(), isSpec3JsonPackage(), jsonPackageParts() (+22 more)

### Community 158 - "Evidence And Remediation"
Cohesion: 0.05
Nodes (37): BLOCKED auth-doctor, Canary Artifacts, Checks, Evidence And Remediation, PASS agent-run-queue, PASS agent-service-account, PASS agent-worker-runtime-env, PASS audit-ai-routes-mjs (+29 more)

### Community 159 - "capsule-quality-review.ts"
Cohesion: 0.10
Nodes (36): buildCapsuleQualityReviewAnalysis(), buildCapsuleQualityReviewDigest(), buildDeterministicCapsuleQualityReviewProposals(), CapsuleQualityReviewAnalysis, capsuleQualityReviewCardInput(), CapsuleQualityReviewDeficit, capsuleQualityReviewGeneratedBy(), CapsuleQualityReviewProposal (+28 more)

### Community 160 - "marketplace/registry.ts"
Cohesion: 0.08
Nodes (32): Retrieval Contract, missingOnly, renderSkill(), title(), COST_RANK, filterMarketplaceTools(), contract(), generatedContractForTool() (+24 more)

### Community 161 - "ContextCapsuleClaim"
Cohesion: 0.09
Nodes (22): 0. North star, 3.2 Content — claim ledger 2.0 (temporal · causal · receipted · typed), 4. Phased roadmap (CAP-1 … CAP-7), 5. CODEX work packets, 6. Capsule validation gate (run before each PR / deploy), 7. Sequential CODEX prompts (paste in order), 8. Done-state definition, CAP-1 — Capsules in the Ask context stack (+14 more)

### Community 162 - "routers/pipeline.py"
Cohesion: 0.09
Nodes (13): push_to_neo4j(), to_cypher(), to_graphml(), to_html(), to_json(), ingest_gdelt_retired(), ingest_url(), IngestUrlRequest (+5 more)

### Community 163 - "10 Specific Things To Build"
Cohesion: 0.10
Nodes (20): 10 Specific Things To Build, 10. Trust, Packaging, And Paid Pilot Layer, 1. Conflict Case Capsule Bundles, 3. Source Connector And Receipt Layer, 4. Conflict Scene Graph, 5. Analytica Framework Runner, 6. Conflict Agent Team, 7. Cognee Conflict Memory (+12 more)

### Community 164 - "graph-layer.ts"
Cohesion: 0.13
Nodes (12): buildAdjacency(), computeBetweennessCentrality(), computeDensity(), detectCommunities(), findShortestPath(), getMostCentralNode(), FirestoreGraphLayer, Neo4jGraphLayer (+4 more)

### Community 165 - "tabs.py"
Cohesion: 0.11
Nodes (19): coach_context(), CoachRequest, delete_source(), get_graph_node(), get_graph_timeline(), get_situation_frame(), get_source_detail(), get_tab_graph() (+11 more)

### Community 166 - "extract.py"
Cohesion: 0.13
Nodes (15): extract_conflict_text(), extract_from_document(), extract_from_url(), _make_id(), _parse_llm_response(), _strip_html(), ExtractionEdge, ExtractionNode (+7 more)

### Community 167 - "Cleanup & Infra Implementation Plan"
Cohesion: 0.08
Nodes (25): Testing and Gates, Cleanup & Infra Implementation Plan, Task 10: Wire backend pytest stage into Cloud Build, Task 11: Wire smoke check into Cloud Build as final step, Task 12: Split `tasklet-praxis-workbench.tsx` — Extract `WorkbenchHeader`, Task 13: Split workbench — Extract `CapsuleColumn`, Task 14: Split workbench — Extract `RuntimePanel`, Task 15: Split workbench — Extract `EvidenceDrawer` (+17 more)

### Community 168 - "PRAXIS anti-slop review, 30 September 2026"
Cohesion: 0.08
Nodes (21): Direction and purpose, Findings and changes, Measured copy reduction, Page families reviewed, PRAXIS anti-slop review, 30 September 2026, Publication checkpoint, Self-evaluation of this PRAXIS pass, Validation and limits (+13 more)

### Community 169 - "Round 3 — 15-improvement sprint (Lanes M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z + LP1 + LP2)"
Cohesion: 0.15
Nodes (14): Lane LP1 — Landing page hero animation + product copy overhaul, Lane LP2 — Audit of previous lanes, Lane M — Agent registry codified (this round), Lane T — Source Scout agent (agentic workflow #1), Lane U — Red-Team auto-review agent (agentic workflow #2), Lane V — `<AiErrorToast />` + `<DegradedDataChip />` shared primitives, Lane W — Citation parser + chip primitives for Ask PRAXIS chat, Lane X — Brainstorming Table Markdown export (+6 more)

### Community 170 - "emit.ts"
Cohesion: 0.07
Nodes (48): Browser Events, Downstream KPI Pipeline, Enforcement, Event Shape, PRAXIS Structured Telemetry, Server Events, orgIdOf(), POST (+40 more)

### Community 171 - "app-search.ts"
Cohesion: 0.05
Nodes (57): appSearchRoute, appShell, failures, federatedSearch, globalSearch, header, mobile, primaryNav (+49 more)

### Community 172 - "capsule-gate.ts"
Cohesion: 0.17
Nodes (14): CapsuleGateResult, checkCapsuleAgainstRequiredCores(), checkCapsuleForTool(), ALLOWED_KINDS, asGateKindArray(), parseCapsuleGateResponse(), readCapsuleGateError(), coreIdsForKind() (+6 more)

### Community 173 - "graphops.ts"
Cohesion: 0.13
Nodes (26): GraphData, GraphUpdateProposal, normalizeCanonicalGraph(), buildGraphContextPack(), byType(), hasEvidence(), generateGraphRepairSuggestions(), GraphRepairSuggestion (+18 more)

### Community 174 - "case-module.ts"
Cohesion: 0.07
Nodes (35): neo4j-driver, main(), readArgs(), GET(), maxDuration, runtime, COMING_SOON_CASES, getLandingCaseCards() (+27 more)

### Community 175 - "PRAXIS authentication, account cleanup, and billing readiness"
Cohesion: 0.06
Nodes (31): Account deletion, Account erasure gate, Ask-to-memo context boundary, Authentication and sessions, Billing, Callback correction and validation, Current acceptance boundary, Historical local verification receipts (+23 more)

### Community 176 - "overrides"
Cohesion: 0.06
Nodes (34): @xmldom/xmldom, overrides, axios, dompurify, fast-xml-parser, @fastify/busboy, follow-redirects, @google-cloud/firestore (+26 more)

### Community 177 - "flows/sourceability.ts"
Cohesion: 0.10
Nodes (30): dynamic, POST, RequestSchema, runtime, SourceSnippetSchema, cautiousRewrite(), citationWarningsFor(), cleanList() (+22 more)

### Community 178 - "routers/graph.py"
Cohesion: 0.06
Nodes (13): entity_timeline(), export_graph(), get_actor_profile(), get_graph(), get_path(), get_visualization(), GraphBackendConfig, GraphQueryRequest (+5 more)

### Community 179 - "sats.py"
Cohesion: 0.18
Nodes (15): test_ach_matrix_accepts_pack_15_shape(), test_red_team_report_caps_synthesized_confidence(), ACHEvidence, ACHHypothesis, ACHMatrix, ACHRanking, ACHScore, KACAssumption (+7 more)

### Community 180 - "recipes/base.py"
Cohesion: 0.11
Nodes (12): AcoOutput, _community_to_review_block(), _entity_to_node(), graphrag_to_aco(), _mapped_id(), _relationship_to_edge(), _stable_id(), BaseRecipe (+4 more)

### Community 181 - "system-prompt-block.ts"
Cohesion: 0.14
Nodes (28): Layer 2 — `<situation-frame>`  *(what is being analysed)*, AGENT_CONTEXT_PACKET_USE_BLOCK, CapsuleFrameAgentOperatingContract, CapsuleFrameClaim, CapsuleFrameOntologyBinding, CapsuleFrameSourceReceipt, CapsuleFrameValidityWindow, CapsulePromptFrame (+20 more)

### Community 182 - "run_recipe"
Cohesion: 0.13
Nodes (10): run_recipe(), reason(), ReasonRequest, test_commitment_check_flags_fragility_from_violation_event(), test_counter_narrative_returns_divergent_citation_sets(), test_interest_vs_position_finds_shared_interest_opening(), graph(), test_leverage_trace_returns_ranked_path() (+2 more)

### Community 183 - "types/context-capsule.ts"
Cohesion: 0.07
Nodes (31): Ontology-Library Gaps to Fill, CapsuleCausality, CapsuleCausalLink, CapsuleCausalRelation, CapsuleEmbeddedGraphEdge, CapsuleEmbeddedGraphNode, CapsuleEmbeddedGraphProjection, CapsuleEval (+23 more)

### Community 184 - "memoArtifactFromMemoPayload"
Cohesion: 0.11
Nodes (26): asRecord(), firstMemoArtifactMetadata(), memoArtifactBodyToBlocks(), memoArtifactFromAskPack(), memoArtifactFromCreatedWork(), memoArtifactFromMemoPayload(), memoIdFromHref(), numberFieldFromUnknown() (+18 more)

### Community 185 - "helpers.ts"
Cohesion: 0.09
Nodes (33): activeCapsulesFromContextStack(), capsuleRoleLabel(), capsuleToChip(), MobileCapsuleLane(), applyCapsuleCard(), applyUserCapsule(), handleCapsuleDragEnd(), markContextApplied() (+25 more)

### Community 186 - "hosted-registry.ts"
Cohesion: 0.09
Nodes (34): dynamic, GET, dynamic, GET, dynamic, GET, POST, HostedRegistryEntry (+26 more)

### Community 187 - "notifications.tsx"
Cohesion: 0.17
Nodes (17): categoryConfig, formatRelative(), NotificationBell(), NotificationDisplayConfig, typeConfig, BackendNotification, categoryToType(), fromBackend() (+9 more)

### Community 188 - "schemas/context-capsule.ts"
Cohesion: 0.07
Nodes (29): CapsuleLivePreview(), CapsuleLivePreviewProps, readable(), safeJson(), CapsuleCausalitySchema, CapsuleEmbeddedGraphProjectionSchema, CapsuleEmbeddedGraphReviewStateSchema, CapsuleEvalSchema (+21 more)

### Community 189 - "one-click-context-builder.tsx"
Cohesion: 0.12
Nodes (29): BuilderCell(), InlineQuickContextBuilder(), BuilderFact(), LiteList(), OneClickContextBuilder(), PolicyWorkflowPath, canCreateWithMode(), clampScore() (+21 more)

### Community 190 - "PRAXIS codebase cleanup plan"
Cohesion: 0.06
Nodes (30): API route inventory, `/app/contexts` residue, Auth and onboarding pages, Boardroom and advanced labs, Dead and unused code candidates, Direct AI tools, Executive summary, Full route and page inventory (+22 more)

### Community 191 - "proof-summary.ts"
Cohesion: 0.17
Nodes (30): ConversationReceiptSummary(), appliedCapsuleLabels(), arrayOfRecords(), artifactIdsFromHref(), asRecord(), buildDegradedStates(), buildImprovementActions(), buildProofSummaryFromAgentRun() (+22 more)

### Community 192 - "created-work/service.ts"
Cohesion: 0.16
Nodes (31): agentRunToCreatedWork(), CreatedWorkInternal, CreatedWorkKind, CreatedWorkListInput, CreatedWorkResponse, CreatedWorkServiceDeps, CreatedWorkSummary, dedupeCreatedWork() (+23 more)

### Community 193 - "trustgraph-contract.ts"
Cohesion: 0.12
Nodes (28): createDefaultTrustGraphEnrichmentProvider(), buildTrustGraphCapsuleSegments(), buildTrustGraphCapsuleSyncRequest(), cleanArray(), compactSegmentText(), normalizeCoreRefs(), NormalizedCoreRefs, readRecord() (+20 more)

### Community 194 - "analyst-profile.ts"
Cohesion: 0.15
Nodes (15): GET, ChipLibrary, FALLBACK_CHIPS, getMandateChips(), getRedLineChips(), scrubProfilePII(), ANALYST_DOMAIN_IDS, AnalystProfileSchema (+7 more)

### Community 195 - "entity-extraction.ts"
Cohesion: 0.09
Nodes (34): ACOEntityType, ConfidenceLevel, PRIMITIVE_SUBTYPES, SourceSpanSchema, buildDocumentCausalLinks(), buildDocumentFirstClaims(), buildDocumentFirstEmbeddedGraph(), buildDocumentTimelineAnchors() (+26 more)

### Community 196 - "Evidence And Remediation"
Cohesion: 0.06
Nodes (30): Canary Artifacts, Checks, Evidence And Remediation, PASS agent-run-queue, PASS agent-service-account, PASS agent-worker-runtime-env, PASS auth-doctor, PASS cloud-run-praxis-frontend (+22 more)

### Community 197 - "memo-handover-preview.test.tsx"
Cohesion: 0.08
Nodes (27): Capsule and memo versioning, Deterministic capsule preparation and persistence correction, Experimental context handover: research and implementation, Explicit remaining work, Focused local verification, Implemented package contract, Package files and integrity, Preview and download API (+19 more)

### Community 198 - "shared-contracts.ts"
Cohesion: 0.10
Nodes (29): AppSearchAuditResult, auditAppSearchContracts(), AuditInput, graphFreshness(), isAllowedHref(), readGraphReport(), readHeadCommit(), ROUTE_FILES (+21 more)

### Community 199 - "test_jev_adapter.py"
Cohesion: 0.17
Nodes (17): _answers(), JevAdapter, JevConfig, JevResult, _number(), _request(), _text(), response() (+9 more)

### Community 200 - "consolidated-tools.ts"
Cohesion: 0.10
Nodes (18): CONSOLIDATED_ANCHOR_TOOL_IDS, CONSOLIDATED_TOOL_IDS, CONSOLIDATED_TOOLS, consolidatedToolForLegacyId(), getSpecializedToolDevelopmentGroups(), LEGACY_TO_CONSOLIDATED, SPECIALIZED_TOOL_DEVELOPMENT_GROUPS, SpecializedToolDevelopmentGroup (+10 more)

### Community 201 - "web-research.ts"
Cohesion: 0.06
Nodes (58): DEMO_SCOUT, maxDuration, POST, ProposedSourceSchema, SourceScoutSchema, WebSearchResult, buildLiveSourcePack(), cleanExcerpt() (+50 more)

### Community 202 - "graph-views.ts"
Cohesion: 0.12
Nodes (27): CitationProps, SourceSpan, GraphEdge, GraphNode, GraphContextPack, allView(), episodicView(), eventTime() (+19 more)

### Community 203 - "with-firewall.ts"
Cohesion: 0.12
Nodes (24): attachFirewallHeaders(), CLAIM_KEYS, ClaimGrounding, extractFirewallClaims(), walk(), FirewallClaimDecision, FirewallContext, FirewallStatus (+16 more)

### Community 204 - "output-capsules.test.ts"
Cohesion: 0.07
Nodes (22): canTransitionOutputCapsule(), BasePayloadSchema, BoardExecutivePackPayloadSchema, CardPayloadSchema, CompositePackPayloadSchema, CountryOnePagerPayloadSchema, DailyReadPayloadSchema, OptionsMemoPayloadSchema (+14 more)

### Community 205 - "connectors.ts"
Cohesion: 0.16
Nodes (27): abstractFromInvertedIndex(), arrayValue(), asRecord(), clampLimit(), clampTrust(), CONNECTOR_ENV, ConnectorEnvMeta, FIRECRAWL_ID (+19 more)

### Community 206 - "corpus-search.ts"
Cohesion: 0.12
Nodes (36): asRecord(), clampExcerpt(), clampLimit(), layerWeight(), pickString(), reliabilityToConfidence(), retrieveArgus(), retrieveDocuments() (+28 more)

### Community 207 - "tasklet-workbench-conversation.ts"
Cohesion: 0.13
Nodes (22): AssistantMarkdown(), openSavedConversation(), setGuideField(), answerEnvelopeFromDataStreamLine(), buildConversationPath(), ChatMessage, ConversationCapsuleChip, emptyGuideChatState() (+14 more)

### Community 208 - "sourceability-request.ts"
Cohesion: 0.24
Nodes (14): selectedSourceabilityText(), buildMemoSourceabilityRequest(), clampIndex(), cleanId(), MemoSourceabilityRequest, MemoSourceabilityResult, MemoSourceSnippet, normalizeText() (+6 more)

### Community 209 - "trust-posture.ts"
Cohesion: 0.13
Nodes (24): cleanParam(), dynamic, GET(), resolveCapsule(), claimSupport(), clamp(), computeTrustPosture(), daysSince() (+16 more)

### Community 210 - "ladybug-projection.ts"
Cohesion: 0.16
Nodes (28): buildLadybugProjectionFromGraphJsonLd(), cleanString(), collectJsonLdRecords(), compareById(), confidenceForRecord(), dedupeEdges(), edgesForRecord(), entityTypeOf() (+20 more)

### Community 211 - "core-library.ts"
Cohesion: 0.15
Nodes (30): asRecord(), capsuleToCore(), composeCoreLibrary(), core(), CoreLibraryDeps, CoreLibraryFilters, coreStatusFromDocument(), filterCoreLibrary() (+22 more)

### Community 212 - "reasoning-loop.ts"
Cohesion: 0.11
Nodes (22): McpToolDescriptor, normalizeMcpPart(), RegisteredMcpAgentTool, registerMcpToolForAgentRuntime(), approvalThresholdFromRun(), buildOutputFormatterReasoningLoop(), buildResearchMemoReasoningLoop(), isRecord() (+14 more)

### Community 213 - "federated-app-search.ts"
Cohesion: 0.11
Nodes (29): AppSearchResponse, AppSearchResult, appSearchResult(), appSearchResultCount(), appSearchResults(), arrayFrom(), buildFederatedSearchResults(), capsuleResult() (+21 more)

### Community 214 - "audit-capsule-database.ts"
Cohesion: 0.07
Nodes (21): auditDir, computeGraphStats(), CountRow, Finding, findings, graphEdgeCounts, graphNodeCounts, GraphStats (+13 more)

### Community 215 - "world-research.ts"
Cohesion: 0.11
Nodes (24): calibratedHandler, errorResponse(), headers, maxDuration, POST, prepared, runtime, SIGNAL_WORLD_CATALOG (+16 more)

### Community 216 - "checkout/route.ts"
Cohesion: 0.17
Nodes (18): CheckoutSchema, dynamic, POST, dynamic, POST, getCheckoutAvailability(), BillablePlan, createPolarClient() (+10 more)

### Community 217 - "capsules/storage.ts"
Cohesion: 0.19
Nodes (26): buildCapsule(), canReadCapsule(), CapsuleListInput, CapsuleRecord, capsulesCollection(), CapsuleScope, CapsuleStorageDeps, CapsuleWriteError (+18 more)

### Community 218 - "flows/classify-path.ts"
Cohesion: 0.11
Nodes (32): buildOutputForProfile(), buildPathCatalogue(), clamp01(), classifyPathFlow, ClassifyPathFlowInput, ClassifyPathFlowInputSchema, ClassifyPathFlowOutput, ClassifyPathFlowOutputSchema (+24 more)

### Community 219 - "workbench-case-graph.ts"
Cohesion: 0.10
Nodes (17): NODE_COLORS, labelForType(), normalizeDate(), toTimelineGroups(), toTimelineItems(), buildWorkbenchCaseGraph(), clampConfidence(), derivedGeo() (+9 more)

### Community 220 - "PRAXIS Canonical App Structure"
Cohesion: 0.07
Nodes (28): Agent Run Flow, App Layers, Build Waves, Canonical Data Model, Cloud Run First, GKE Later, ContextCapsule Product Contract, Core Services, Current Working Path (+20 more)

### Community 221 - "check-landing-bundle.ts"
Cohesion: 0.07
Nodes (25): assetPaths, candidateFiles, CLIENT_MANIFESTS, existingManifests, kb, limitKb, NEXT_DIR, ROOT (+17 more)

### Community 222 - "PRAXIS Tasklet-Style Agent Runtime Plan"
Cohesion: 0.07
Nodes (28): 1. Daily Brief Agent, 2. Research Memo Agent, 3. Watchlist Agent, Browser And Code Execution, Build Order, Definition Of "Works Better", Executive Decision, First Three Agents (+20 more)

### Community 223 - "admin-gate.ts"
Cohesion: 0.19
Nodes (17): access, gate, maxDuration, POST, runtime, DEFAULT_ADMIN_EMAILS, getAdminEmailAllowlist(), getAdminGateStatus() (+9 more)

### Community 224 - "properties"
Cohesion: 0.07
Nodes (27): type, additionalProperties, maxLength, minLength, type, oneOf, default, items (+19 more)

### Community 225 - "agent-runtime/schema.ts"
Cohesion: 0.05
Nodes (69): dynamic, GET, isCloudSqlConnectivityError(), ledgerError(), POST, requestedManualVersion(), resolveCapsule(), dynamic (+61 more)

### Community 226 - "agent-packet/route.ts"
Cohesion: 0.11
Nodes (27): advisoryRows(), AgentPacketGroundingClaim, AgentPacketRiskFlag, BUDGET_TIERS, buildUiGroundingMap(), dedupeRiskFlags(), deriveRiskFlags(), displayId() (+19 more)

### Community 227 - "notifications.py"
Cohesion: 0.17
Nodes (14): dispatch_notification_deliveries(), DispatchRequest, get_notification_preferences(), get_notifications(), notification_registry(), PreferencesRequest, put_notification_preferences(), send_test_notification() (+6 more)

### Community 228 - "capsule-service.test.ts"
Cohesion: 0.09
Nodes (16): AttachSchema, dynamic, POST, RouteContext, stageRegistryCapsuleInstallation(), attachCapsuleRefs(), buildContextCapsuleV3(), detachCapsuleRefs() (+8 more)

### Community 229 - "output-capsules/types.ts"
Cohesion: 0.12
Nodes (29): destinationForTemplate(), labelCore(), planOutputCapsuleRun(), PlanOutputCapsuleRunInput, clamp01(), evaluateOutputCapsuleQuality(), composeOutputCapsules(), CreateOutputCapsuleInput (+21 more)

### Community 230 - "sats.ts"
Cohesion: 0.07
Nodes (27): ACHConclusion, ACHConclusionSchema, ACHEvidence, ACHEvidenceSchema, ACHHypothesis, ACHHypothesisSchema, ACHMatrix, ACHMatrixSchema (+19 more)

### Community 231 - "tasklet-workbench-contract.test.ts"
Cohesion: 0.07
Nodes (26): activeContextStackHelperSource, advancedSource, answerQualityStripSource, applyCapsuleToStackSource, askArtifactPreviewSource, askQueuedAgentRunPanelPath, askStreamPanelSource, capsuleLibraryCardSource (+18 more)

### Community 232 - "routers/analyze.py"
Cohesion: 0.12
Nodes (13): render_situation_brief(), render_situation_brief_json(), diff_snapshots(), DiffRequest, get_brief_json(), get_brief_markdown(), get_escalation(), get_factions() (+5 more)

### Community 233 - "graph-populate.ts"
Cohesion: 0.13
Nodes (28): Phase 3 — Conflict Graph stage-then-approve (commit `0e21c55`), maxDuration, POST, runtime, EnrichedEntity, enrichEntity(), fetchWikipediaSummary(), WikipediaSummary (+20 more)

### Community 234 - "ContextCapsule Policy Research Guide"
Cohesion: 0.07
Nodes (27): Allowance and account control, Ask Traceability Panel, Assess analytical quality, Availability and help, Build and reuse context separately, Build Order, Capsule Anatomy, Capsule Workbench (+19 more)

### Community 235 - "situation-context-health.ts"
Cohesion: 0.17
Nodes (23): agenticMemoryHealth(), availableLayers(), buildSituationContextHealthPrompt(), computeScore(), computeSituationContextHealth(), ContextHealthDimension, ContextHealthFinding, ContextHealthFindingKind (+15 more)

### Community 236 - "audit-tasklet-mvp-foundation.ts"
Cohesion: 0.11
Nodes (18): expectExcludes(), expectIncludes(), failures, read(), root, sitemapPaths, metadata, generateMetadata() (+10 more)

### Community 237 - "boardroom/schema.ts"
Cohesion: 0.08
Nodes (39): BRAINSTORMING_PERSONA_IDS, BOARDROOM_DOCK_ROLES, BoardroomCapsuleDockPayload, BoardroomCapsuleDockPayloadSchema, BoardroomCapsuleDockSlotPayload, BoardroomCapsuleDockSlotPayloadSchema, buildBoardroomCapsuleDockPayloadFromStack(), isDockRole() (+31 more)

### Community 238 - "tool-context-blueprints.ts"
Cohesion: 0.08
Nodes (46): dynamic, GET(), enrichCalibrationWithToolBackbone(), getToolById(), ACTIVE_PATH_LABELS, buildToolContextBlueprintPrompt(), databaseBlueprint(), degradedReasons() (+38 more)

### Community 239 - "resolveCapsuleTaxonomy"
Cohesion: 0.09
Nodes (31): buildCapsuleLibraryOverview(), capsuleMatchesDomain(), capsuleMatchesPolicyTeam(), capsuleMatchesType(), domainOrPolicyTeamMatchesCapsule(), _filterPublicCapsules(), filterStarterCapsules(), filterUserCapsules() (+23 more)

### Community 240 - "tool-package-readiness.ts"
Cohesion: 0.13
Nodes (24): hrefForSituationSettings(), hrefForTool(), dedupeActions(), defaultAction(), defaultPackageActions(), getToolPackageActions(), prettyToolName(), ToolPackageAction (+16 more)

### Community 241 - "instrument-visual-contract.test.ts"
Cohesion: 0.07
Nodes (26): appHeader, appLoading, appShell, appSidebar, boardroom, button, design, docs (+18 more)

### Community 242 - "PRAXIS Agentic Workflow Release Plan"
Cohesion: 0.09
Nodes (22): Ask Bar Release Slice, Capsule Tool Surface, Definition Of Done, Lane 0: Ask Bar And Visible Routing, Lane 1: Capsule Reader Agent, Lane 2: Workflow Planner And Agent Registry, Lane 3: Sourceability Claim Ledger, Lane 4: Output/PDF Workflow (+14 more)

### Community 243 - "Neo4jAdapter"
Cohesion: 0.12
Nodes (5): create_graph_adapter(), GraphAdapter, Neo4jAdapter, _safe_cypher_identifier(), test_graph_adapter_mock()

### Community 244 - "PRAXIS Ask Same-Window Chat And Artifacts Plan"
Cohesion: 0.11
Nodes (18): 1. One Ask PRAXIS Window, 2. Chat First, Receipts Progressive, 3. Artifacts Are Message Parts, 4. One Canonical Ask Client, 5. One Canonical Ask Route, Acceptance Criteria, Executive Decision, First Implementation Slice (+10 more)

### Community 245 - "agentic-search-health.ts"
Cohesion: 0.11
Nodes (20): buildRedflagArtifact(), collectAppSearchProof(), redflag, report, routeFailures, shouldWriteArtifacts, dynamic, GET() (+12 more)

### Community 246 - "runtime-health.ts"
Cohesion: 0.15
Nodes (20): GET, GET(), runtime, RUNTIME_HEALTH_SECURITY_HEADERS, safeRuntimeHealth(), buildRuntimeHealthSummary(), checkAgentTaskQueue(), checkAgentTaskQueueViaMetadata() (+12 more)

### Community 247 - "v3-surface-classification.ts"
Cohesion: 0.10
Nodes (27): ConsolidatedToolDefinition, PrimaryNavItem, PRODUCT_SURFACE_IDS, PRODUCT_SURFACE_TOOL_IDS, PRODUCT_SURFACES, ProductSurface, ProductSurfaceId, applyToolPreferences() (+19 more)

### Community 248 - "uniqueStrings"
Cohesion: 0.16
Nodes (28): applyCatalogWideReasonedGraphVariation(), applyHumanGatedPolicyJudgmentPhaseBRewrite(), buildCatalogReasonedBoundaryEdgeTemplates(), buildCatalogReasonedBoundaryNodeTemplates(), buildCatalogReasonedEdgeTemplates(), buildCatalogReasonedNodeTemplates(), buildHumanGatedPolicyJudgmentPhaseBEdgeTemplates(), buildHumanGatedPolicyJudgmentPhaseBNodeTemplates() (+20 more)

### Community 249 - "memory.py"
Cohesion: 0.13
Nodes (14): CloudLoggingJsonFormatter, configure_logging(), forget(), list_candidates(), memory_health(), promote(), PromoteRequest, recall() (+6 more)

### Community 250 - "PRAXIS — Policy, Diplomacy, and Political Intelligence Platform by TACITUS"
Cohesion: 0.07
Nodes (28): ACO v2.0 — Agentic Conflict Ontology, Agent Handoff, Analytical Frameworks (15), Architecture, Authentication, Backend Trust Boundary, Cognee Memory Layer, Current Executive Intelligence Slice (+20 more)

### Community 251 - "PRAXIS by TACITUS — Context-Capsule Marketplace & Agentic Workspace Improvement Plan"
Cohesion: 0.09
Nodes (24): 0. How to read this document, 10. Recommended launch capsule set (8–10, domain-anchored), 11. Security, trust & compliance, 12. Phased roadmap, 14. Risks & open questions, 1. Executive summary, 2. Current state (ground truth) and the honest gaps, 3.1 Capsule data model (extends, not replaces, ADR 0050) (+16 more)

### Community 252 - "Textual Pitch Deck"
Cohesion: 0.08
Nodes (24): Business Model, Current Proof, Elevator Pitch, Funding Needs, Market And Wedge, Moat, PRAXIS Funding And Pitch Pack, Problem (+16 more)

### Community 253 - "PRAXIS SIGNAL global narrative intelligence project"
Cohesion: 0.08
Nodes (25): 10 The graph and canonical record, 11 How context capsules make SIGNAL useful, 12 Metrics and alerts that can be defended, 13 The production architecture, 14 Real time operations without a global collection bill, 15 Deliverables customers can use, 16 Pricing hypotheses and a solo founder cost model, 17 Commercial validation and the first ninety days (+17 more)

### Community 254 - "workspace.py"
Cohesion: 0.14
Nodes (10): confirm_workspace_suggestion(), dismiss_workspace_suggestion(), _event_from_log(), _event_from_suggestion(), _sse(), _sse_event_name(), SuggestionActionRequest, workspace_events() (+2 more)

### Community 255 - "situation_health.py"
Cohesion: 0.32
Nodes (15): _age(), _as_utc(), compute_situation_health(), _corpus_health(), _feed_health(), _grey_dimension(), HealthDimension, HealthFinding (+7 more)

### Community 256 - "preferences.ts"
Cohesion: 0.13
Nodes (16): GET, PATCH, PatchSchema, getPreferences(), PatchSchema, PATH(), savePreferences(), LANGUAGES (+8 more)

### Community 257 - "yente_client.py"
Cohesion: 0.22
Nodes (9): ActorNode, build_owner_scoped_actor_metadata_update(), match_actor(), normalize_actor(), SanctionsMatch, test_actor_normalization_maps_organization_schema(), test_actor_normalization_maps_person_schema(), test_sanctions_metadata_update_is_owner_scoped_and_reviewable() (+1 more)

### Community 258 - "PRAXIS Testing"
Cohesion: 0.22
Nodes (8): Automated Checks, Browser QA Rules, Critical Flows, Current Verified Baseline, Deeper References, Latest Browser Smoke, Manual Persona Testing, PRAXIS Testing

### Community 259 - "capsules/resolve.ts"
Cohesion: 0.15
Nodes (22): canonicalize(), canonicalizeCapsuleContent(), CapsuleLoader, CapsuleResolutionStep, deepMerge(), isPlainObject(), loadCapsuleFromFirestore(), mergeCapsules() (+14 more)

### Community 260 - "capsule-architect.ts"
Cohesion: 0.15
Nodes (25): buildArchitectCausality(), buildArchitectReviewCards(), buildArchitectTacitKnowledge(), buildArchitectTemporality(), buildCapsuleArchitectProposal(), buildTacitKnowledgeQuestions(), CapsuleArchitectBuildInput, CapsuleArchitectElicitationInput (+17 more)

### Community 261 - "evidence-review.ts"
Cohesion: 0.15
Nodes (23): actionsForStatus(), buildClaimEvidenceReport(), buildEvidenceReviews(), buildSectionQuestions(), ClaimEvidenceReview, ClaimEvidenceStatus, countSentences(), countWords() (+15 more)

### Community 262 - "evaluate-policy-narrative-quality.ts"
Cohesion: 0.18
Nodes (13): buildAnalystRubric(), buildQualityPair(), captureSchema, caseSchema, Condition, fixtureSchema, parseQualityOptions(), QUALITY_SYSTEM_PROMPT (+5 more)

### Community 263 - "context-core-map.ts"
Cohesion: 0.10
Nodes (21): AREA_IDS, CONSOLIDATED_TOOL_CONTEXT_CORES, CONTEXT_CORES, ContextCoreDefinition, ContextCoreOwnerScope, CORE_BY_ID, getContextCore(), getContextCoresForTool() (+13 more)

### Community 264 - "tool-path-taxonomy.ts"
Cohesion: 0.17
Nodes (22): ACTIVE_TOOL_PATH_IDS, buildPathFromPolicy(), DIALECTICA_PREMIUM_FUTURE, GENERIC_CORE_PATH, GENERIC_CORE_TOOL_IDS, getActiveToolPaths(), getDashboardToolPackageSummaries(), getRecommendedToolIdsForWorkflowPath() (+14 more)

### Community 265 - "Per-Prompt Notes"
Cohesion: 0.08
Nodes (25): 01_DIAGNOSTICS, 02_MARKETPLACE_HONESTY, 03_CALIBRATION_INVARIANT, 04_COGNEE_UI_HONESTY, 05_CHAPTER_CODE_SPLIT, 06_LIBRARY_INGEST_CONSOLIDATION, 07_ONBOARDING_GATE, 08_THIN_CASE_CALIBRATION (+17 more)

### Community 266 - "clarifying-questions.ts"
Cohesion: 0.18
Nodes (13): ClarificationRequest, ClarificationRequestSchema, clarificationResponse, ClarificationResponseSchema, ClarifyingAnswer, ClarifyingAnswersBundle, ClarifyingAnswersBundleSchema, ClarifyingAnswerSchema (+5 more)

### Community 267 - "PRAXIS anti-slop review, 2026-09-30"
Cohesion: 0.08
Nodes (24): 10. P2: advanced connector targets, corrected in the combined source, 11. P2: builder privacy wording, narrowed in the combined source, 12. P2: advanced implementation vocabulary, recommendation, 13. P2: writing review language and version limits, mostly preserve, 14. P2: onboarding remains optional and recoverable, preserve and verify, 15. P2: library and inspection already contain purposeful structure, preserve, 16. P2: pricing and legal readability must retain substance, 17. Source reduction and validation (+16 more)

### Community 268 - "analysis-baselines.test.mjs"
Cohesion: 0.13
Nodes (16): affectedDependents(), attentionChange(), digest(), manifestDelta(), namespace(), pinMap(), rankedEmbeddingCandidates(), baseline() (+8 more)

### Community 269 - "genkit/index.ts"
Cohesion: 0.13
Nodes (17): genkit, @genkit-ai/google-cloud, @genkit-ai/google-genai, validateSituationIntelligence(), situationIntelligenceFlow, SituationIntelligenceFlowInput, SituationIntelligenceFlowInputSchema, ai (+9 more)

### Community 270 - "PRAXIS Conflict Analyst Product Proposal"
Cohesion: 0.12
Nodes (16): Analytic Tradecraft And Frameworks, Conflict Data And Monitoring, Executive Position, Market Pattern, PRAXIS Conflict Analyst Product Proposal, Product Principles, Recommended Build Order, Research Inputs (+8 more)

### Community 271 - "audit-launch-readiness.ts"
Cohesion: 0.15
Nodes (22): assertLiveHeaders(), body(), collectFiles(), collectLiveHeaderEvidence(), evaluateLaunchReadiness(), FileMap, findPublicEnvNames(), hasFile() (+14 more)

### Community 272 - "dry-run-eval.ts"
Cohesion: 0.08
Nodes (39): buildSeedOperations(), CapsuleSeedOperation, loadFirestore(), main(), seedLaunchCapsules(), CapsuleEvalClaimSchema, CapsuleEvalSampleSchema, DryRunEvalRequestSchema (+31 more)

### Community 273 - "PraxisCapsule"
Cohesion: 0.06
Nodes (46): Field Mapping, CapsuleSlotRow(), CapsuleStripHeader(), saveAssociatedCapsules(), dotFilled(), KIND_DOT_FILLED, KIND_LABEL, KIND_ORDER (+38 more)

### Community 274 - "context-aware.ts"
Cohesion: 0.16
Nodes (20): allowUnsignedConversationHeader(), buildCaseContext(), buildContextAdvisories(), buildContextSnapshot(), buildUserContext(), buildWorkspaceContext(), ContextAwareResult, inferWeakestLayer() (+12 more)

### Community 275 - "context_capsule.py"
Cohesion: 0.16
Nodes (20): AliasModel, CapsuleAuthor, CapsuleEval, CapsuleEvalLastRun, CapsuleEvalThresholds, CapsuleGuardrails, CapsuleImport, CapsuleOutput (+12 more)

### Community 276 - "PRAXIS Production Readiness Audit"
Cohesion: 0.10
Nodes (20): Agentic Workflow Readiness, Bottom Line, Capsules and Repository, DONE, Evidence Base, Executive Summary, Graphics and UX, Later: 1 to 2 months (+12 more)

### Community 277 - "Five-minute private SIGNAL demo"
Cohesion: 0.29
Nodes (6): 0:00–1:00 — Brasil, Portuguese, 1:00–2:00 — Review and inspect, 2:00–3:00 — Native context, 3:00–4:00 — Continuing assessment and cited brief, 4:00–5:00 — Japan and a custom theatre, Five-minute private SIGNAL demo

### Community 278 - "additionalProperties"
Cohesion: 0.10
Nodes (23): default, items, maxItems, type, default, items, maxItems, type (+15 more)

### Community 279 - "admin.ts"
Cohesion: 0.03
Nodes (73): firebase-admin, ACCOUNT_PATCH_FIELDS, cleanAccountPatch(), DELETE, GET, PATCH, serializeFirestoreData(), GET() (+65 more)

### Community 280 - "capsule-factory-flow.test.ts"
Cohesion: 0.16
Nodes (15): capsuleResearchPlanFlow, capsuleSynthesisFlow, capsuleWritingProfileFlow, deterministicResearchPlan(), deterministicWritingProfile(), queryFrom(), withFactoryTelemetry(), BRIEF_RE (+7 more)

### Community 281 - "drafting/export.ts"
Cohesion: 0.16
Nodes (18): POST, WorkProductExportSchema, buildDraftingTemplate(), DRAFTING_OUTPUT_TARGETS, DraftingOutputTargetId, DraftingTemplate, TEMPLATES, buildShareableWorkProductLink() (+10 more)

### Community 282 - "context-capsules.test.ts"
Cohesion: 0.08
Nodes (33): COCKPIT_CAPSULE_LIBRARY, COCKPIT_COMBINATION_RECIPES, COCKPIT_TOOL_SUGGESTIONS, COCKPIT_USER_ARCHETYPES, findCapsuleTemplate(), POLICY_NEED_TABS, PolicyNeedTab, buildCapsuleTaxonomyStats() (+25 more)

### Community 283 - "sync-ecc-to-codex.mjs"
Cohesion: 0.06
Nodes (22): adminTabRedirects, bareRoutes, nextConfig, repoRoot, withBundleAnalyzer, @next/bundle-analyzer, ALLOWED_H1_FILES, offenders (+14 more)

### Community 284 - "case-registry.ts"
Cohesion: 0.11
Nodes (18): CASE_REGISTRY, CaseArchetype, getActorClaims(), getActorFromCase(), getActorInterests(), getActorRelationships(), getCaseEventsSorted(), getCaseOntology() (+10 more)

### Community 285 - "AskAnswerEnvelope"
Cohesion: 0.18
Nodes (12): SourceabilityVerdictBadges(), sourceabilityVerdictBadgeTone(), SourceabilityVerdictTone, VERDICT_TONES, SourceabilityClaimVerdict, SourceabilityLedgerSummary, AskAnswerEnvelope, AskAnswerEnvelopeStreamPayload (+4 more)

### Community 286 - "PRAXIS Context Injection Contract"
Cohesion: 0.12
Nodes (16): Anti-patterns to avoid, Evolution roadmap, Health-check the contract, How a single AI call assembles the prompt, How the contract stays warm, How to add a new tool that respects the contract, Layer 1 — `<analyst-profile>`  *(who is asking)*, Layer 3 — `<domain-frame>`  *(what kind of work this is)* (+8 more)

### Community 287 - "marketplace/run/route.ts"
Cohesion: 0.17
Nodes (17): dynamic, GET, LooseObject, POST, RunBodySchema, FirewallReport, buildToolRunArtifact(), firestoreToolRunArtifactWriter (+9 more)

### Community 288 - "Actor"
Cohesion: 0.11
Nodes (20): Actor, Event, Cell, DesignationEvent, DisruptionOperation, NetworkNode, OperationalCapability, ThreatClaim (+12 more)

### Community 289 - "google-agent-platform/readiness.ts"
Cohesion: 0.13
Nodes (19): CliMode, env, manifest, report, root, add(), assessGoogleAgentPlatformReadiness(), buildGoogleAgentPlatformManifest() (+11 more)

### Community 290 - "audit-public-surface.ts"
Cohesion: 0.10
Nodes (16): appIndex, appShell, boardroom, chatShell, dockerfile, failures, marketingHome, policyMissions (+8 more)

### Community 291 - "canonical.ts"
Cohesion: 0.13
Nodes (16): canonical, docsDir, entries, JSON_PATH, markdown, MD_PATH, OUT_DIR, summary (+8 more)

### Community 292 - "generate-tool-sprint-backlog.ts"
Cohesion: 0.14
Nodes (21): buildRows(), CRITICAL_IDS, { getToolContextBlueprint }, { getToolOperatingContract }, {
  getToolPathMembership,
  isToolInActiveGenericOrPoliticalPath,
}, graphicsTask(), inspectPage(), latestAuditPath() (+13 more)

### Community 293 - "dialectica-capsule-idempotency.test.ts"
Cohesion: 0.16
Nodes (6): FakeCollection, FakeDoc, FakeFirestore, FakeSnapshot, fixtureRoot, ImportedCapsuleInput

### Community 294 - "ref_node_child_process"
Cohesion: 0.06
Nodes (24): checks, sql, failures, graphPath, handoffPaths, reportPath, root, todoPath (+16 more)

### Community 295 - "capsule-starters.ts"
Cohesion: 0.18
Nodes (11): actor, ADMIN_ALLOWLIST, main(), CACHE_TTL_MS, CAPSULE_STARTERS_COLLECTION_PATH, CAPSULE_STARTERS_HISTORY_COLLECTION_PATH, getCapsuleStarterDefinition(), listCapsuleStarterDefinitions() (+3 more)

### Community 296 - "error-boundary.tsx"
Cohesion: 0.11
Nodes (13): [3.6.2] — 2026-03-29, Added, @sentry/nextjs, AppError(), RootError(), ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState (+5 more)

### Community 297 - "TrustGraph Context Substrate"
Cohesion: 0.25
Nodes (7): App-Side Readiness, Bridge Contract, Capsule Mapping, Deployment Path, Position, TrustGraph Context Substrate, Upstream Basis

### Community 298 - "GCP_OPERATIONS.md"
Cohesion: 0.10
Nodes (20): 1. Activate paid / freemium data sources, 1. Validation gate — all must pass, 1a. ~~source-linked event reporting~~ — **withdrawn 2026-04-25**, 1b. Vertex AI Agent Engine (Deep Research Agent, ~1–2 h), 1c. Retired structured-feed ingestion, 1d. Polar billing (~2 h, active launch path), 1e. Research providers, 1f. Stripe (legacy) (+12 more)

### Community 299 - "PRAXIS Operational Spine"
Cohesion: 0.10
Nodes (20): Activity feed, Add a new AI tool route, API contract, `background_jobs/{jobId}` (TTL: 90d), Common patterns, Deployment, Future extensions, IAM model (+12 more)

### Community 300 - "capability-registry.ts"
Cohesion: 0.13
Nodes (17): aiRoutesDir, failures, firstWave, root, routeNames, superTools, CAPABILITIES, CapabilityExecutor (+9 more)

### Community 301 - "nodes/route.ts"
Cohesion: 0.10
Nodes (17): dynamic, EdgeActionSchema, EdgePayloadSchema, GeneratedBySchema, graphDiffHash(), POST, RouteContext, dynamic (+9 more)

### Community 302 - "context-kernel.test.ts"
Cohesion: 0.15
Nodes (5): persistSuggestedActionReceipt(), FakeCollection, FakeDoc, FakeFirestore, FakeSnapshot

### Community 303 - "parseDialecticaCapsulePackageFromParts"
Cohesion: 0.25
Nodes (14): DialecticaCapsuleImportError, isRecord(), normalizeEpisodes(), optionalZipJson(), optionalZipText(), parseDialecticaCapsulePackageFromParts(), parseDialecticaCapsuleZip(), parseDialecticaManifest() (+6 more)

### Community 304 - "praxis_data_controller/agent.py"
Cohesion: 0.15
Nodes (8): build_tools(), capsule_context_reader(), review_card_proposer(), vertex_rag_retrieval(), Deploy Shape, Official Sources, PRAXIS Data Controller ADK Agent, Tool Boundaries

### Community 305 - "graphlite-contract.ts"
Cohesion: 0.12
Nodes (21): createDefaultGraphLiteEnrichmentProvider(), buildGraphLiteCapsuleSyncRequest(), buildGraphLiteCollectionId(), buildGraphLiteWorkspaceId(), cleanGraphLiteIdentifier(), GRAPHLITE_CLI_CRATE, GRAPHLITE_CLI_VERSION, GraphLiteAdvisoryHitSchema (+13 more)

### Community 306 - "capsule-list-picker.test.tsx"
Cohesion: 0.18
Nodes (11): capsules, click(), Element, elements(), find(), focus, open(), render() (+3 more)

### Community 307 - "memory-layer.ts"
Cohesion: 0.17
Nodes (15): capCogneeConfidence(), cogneeDatasetFor(), formatAdvisoryCandidate(), isCogneeEnabledForClient(), isRecord(), MemoryLayer, MemoryLayerHealth, MemoryLayerMode (+7 more)

### Community 308 - "source-receipt-normalizer.ts"
Cohesion: 0.14
Nodes (23): hostFromUrl(), isRecord(), normalizeConfidence(), normalizeCoords(), normalizeKind(), normalizeReliability(), normalizeRetrievalMethod(), normalizeSourceReceipt() (+15 more)

### Community 309 - "firestore.ts"
Cohesion: 0.12
Nodes (11): AskRuntimeOption, DEFAULT_MODEL_PREFERENCE, ModelPreferenceValue, AI_CREDIT_COSTS, AISettings, CreditTransaction, deductCredits(), getCreditBalance() (+3 more)

### Community 311 - "Findings"
Cohesion: 0.10
Nodes (19): AI Provider, Architecture, BLOCKED / HIGH / capsule-thread-agent-continuity, BLOCKED / HIGH / firebase-admin-credentials-blocked, BLOCKED / MEDIUM / firestore-sample-blocked, Cloud SQL Schema, FAIL / CRITICAL / cloud-tasks-worker-auth-missing, FAIL / HIGH / vertex-project-missing (+11 more)

### Community 312 - "PRAXIS Design System"
Cohesion: 0.10
Nodes (19): Agent Accent Panels, Capsule Chain Nodes, Cartographic Grid, Civic Atelier Components, Civic Atelier Foundations, Context Chain, Core Tokens, Dossier Spine (+11 more)

### Community 313 - "PRAXIS: product readiness and capsule-to-analysis plan"
Cohesion: 0.10
Nodes (19): Assessment limits, Commercial and operating readiness, Decision, Evidence checked today, Execution order and exit gates, Existing strengths to build on, First-use and repeat-use experience, Intake and elicitation (+11 more)

### Community 314 - "PRAXIS improvement analysis — 2026-09-30"
Cohesion: 0.10
Nodes (20): 10. Agent execution and recovery, 11. Privacy, collaboration and institutional governance, 12. Pricing, support and expectations, 13. Accessibility, responsiveness and performance, 14. Codebase and documentation simplicity, 15. Quality measurement and operation, 1. Evidence accuracy and analytical trust, 2. Positioning and public content (+12 more)

### Community 315 - "audit-context-health.ts"
Cohesion: 0.13
Nodes (16): actionOrder, expectedActionOrder, failures, root, scenarios, source, buildContextHealthReport(), buildNextActions() (+8 more)

### Community 316 - "audit-genkit-coverage.mjs"
Cohesion: 0.12
Nodes (19): aiRoutesRoot, aiSdkRows, genkitRows, matchingRoutes(), migratedTargets, minimumTargets, missingTargets, remainingTargets (+11 more)

### Community 317 - "backfill-capsule-research-dossiers.ts"
Cohesion: 0.48
Nodes (6): inspectUser(), main(), needsBackfill(), parseArgs(), StarterBackfillStatus, summarize()

### Community 318 - "diff/route.ts"
Cohesion: 0.17
Nodes (20): buildCapsuleFieldDiffs(), DiffRow, dynamic, flattenCoreRefs(), GET, isRecord(), listDiffRows(), loadCapsuleVersion() (+12 more)

### Community 319 - "changes/route.ts"
Cohesion: 0.39
Nodes (5): GET, changed(), diffGraphSnapshots(), GraphDiff, GraphSnapshot

### Community 320 - "login/page.tsx"
Cohesion: 0.22
Nodes (11): LoginPage(), PENDING_CONTEXT_CAPSULE_OUTPUT_KEY, PENDING_CONTEXT_CAPSULE_PATH_KEY, PENDING_CONTEXT_CAPSULE_PROMPT_KEY, PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY, PENDING_TASKLET_PROMPT_KEY, Element, elements() (+3 more)

### Community 321 - "adk-bridge.ts"
Cohesion: 0.19
Nodes (18): AdkAgentKind, AdkDryRunMirrorDeps, AdkDryRunMirrorResult, AdkRunContext, AdkRunEvent, AdkRunInput, buildAdkPromptFromContextCapsule(), cleanContext() (+10 more)

### Community 322 - "runner.ts"
Cohesion: 0.16
Nodes (17): getMarketplaceHandlerContract(), advisorySummary(), buildMarketplaceToolRun(), buildMemoStructuredOutput(), buildSatStructuredOutput(), MarketplaceToolRunResult, nextActions(), rankACH() (+9 more)

### Community 323 - "capsule-architect-service.test.ts"
Cohesion: 0.15
Nodes (4): FakeCollection, FakeDoc, FakeFirestore, FakeSnapshot

### Community 324 - "ontology/base.py"
Cohesion: 0.26
Nodes (4): CaseOntologyDefinition, OntologyEdgeType, OntologyNodeType, OntologyValidator

### Community 325 - "prompt-health.ts"
Cohesion: 0.19
Nodes (17): Thin-case handling, dynamic, GET(), POST(), promptHealthSpec(), summarizeSnapshot(), buildPromptHealthReport(), buildSuggestedFlow() (+9 more)

### Community 326 - "PRAXIS Public Launch And Agentic Readiness Plan"
Cohesion: 0.11
Nodes (18): Cloud SQL Postgres, Cognee / Graph Layer, ContextCapsule Repository, Current Checkpoint, Documents, Sources, And Storage, Firebase / Firestore, Launch Score Target, Non-Negotiables (+10 more)

### Community 327 - "server.mjs"
Cohesion: 0.11
Nodes (32): collect(), discoveryURL(), capsuleSnapshot(), exportBrief(), gdeltTime(), graphProjection(), hash(), normalizeSource() (+24 more)

### Community 328 - "START_HERE.md"
Cohesion: 0.11
Nodes (14): Ordered build sessions, 1 Check tools, 2 Get the real repository, 3 Prepare the isolated worktree, 4 Start the first build session, 5 Resume and check progress, Fast path from any extraction folder, Official references checked 5 October 2026 (+6 more)

### Community 329 - "parseDataStreamError"
Cohesion: 0.18
Nodes (18): 5. Track B — Preventive Cohort Hardening (parallel), B1. Legacy/new-user audit + fixes, B2. Fix build errors, B3. Regression tests for both cohorts, HelpAgent(), buildHelpPrompt(), sendHelp(), HelpMessage (+10 more)

### Community 330 - "PRAXIS Deep Pre-Ship Checklist Audit"
Cohesion: 0.14
Nodes (14): 13. Notifications system, 14. Operator view — the transparency surface, 16. CI / audit scripts, 17. End-to-end product tests, 18. Frontend polish, 19. Performance and latency targets, 1. Database, migrations, RLS, connection pool, 2. Cognee substrate wrapper (+6 more)

### Community 331 - "type"
Cohesion: 0.14
Nodes (19): default, items, maxItems, type, default, items, maxItems, type (+11 more)

### Community 332 - "research-eval.ts"
Cohesion: 0.19
Nodes (16): EvalPayload, main(), renderMarkdown(), AGENTIC_RESEARCH_EVAL_SCENARIOS, AgenticResearchEvalScenarioId, AgenticResearchEvalScorecard, average(), buildDefaultAgenticResearchEvalRun() (+8 more)

### Community 333 - "schemas/__init__.py"
Cohesion: 0.07
Nodes (33): build(), ACOEdge, ACONode, Actor, Claim, Commitment, ConfidenceLevel, Constraint (+25 more)

### Community 334 - "google-agent-platform-cloud-check.ts"
Cohesion: 0.14
Nodes (15): add(), Check, checkCommand(), checks, requiredServices, run(), services, Status (+7 more)

### Community 335 - "staging-worker-smoke.mjs"
Cohesion: 0.22
Nodes (18): cleanup(), decodeDocument(), decodeField(), fail(), firebaseExchange(), firestoreRest(), {getAuth}, {GoogleAuth} (+10 more)

### Community 336 - "networkx"
Cohesion: 0.11
Nodes (23): analyze_graph(), compute_centrality(), detect_communities(), graph_from_records(), k_core_decomposition(), load_case_graph(), NetworkAnalysisResult, RankedNode (+15 more)

### Community 337 - "next-moves/route.ts"
Cohesion: 0.26
Nodes (16): collectionRef(), GET, PATCH, POST, cleanEmphasis(), cleanHref(), cleanStatus(), cleanText() (+8 more)

### Community 338 - "postgres-execution.test.ts"
Cohesion: 0.22
Nodes (7): Canonical v3 Sections, 1. The four pillars of a capsule (Users · Tools · Output · Situation), claim, mocks, NOW, QueryLedger, Row

### Community 339 - "core-objects.ts"
Cohesion: 0.18
Nodes (18): BaseCore, ContextStack, CoreKind, CoreProvenance, CoreStatus, DocumentCore, GraphCore, MemoryCore (+10 more)

### Community 340 - "risk-indicators/route.ts"
Cohesion: 0.18
Nodes (11): IndicatorSchema, maxDuration, POST, ResponseSchema, RiskIndicatorsResponse, runtime, COMMON_INDICATORS, DomainKey (+3 more)

### Community 341 - "FakeCollection"
Cohesion: 0.14
Nodes (4): FakeCollection, FakeDoc, FakeFirestore, FakeSnapshot

### Community 342 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 343 - "gliner_pre_pass.py"
Cohesion: 0.20
Nodes (10): extract_document_candidates(), prepare_l1_candidates(), _dedupe(), detect_entities(), EntitySpan, _fallback_detect(), _labels_for(), _load_model() (+2 more)

### Community 344 - "readiness/route.ts"
Cohesion: 0.23
Nodes (10): AXES, axesFromReadiness(), clamp01(), cleanParam(), dynamic, GET(), RadarAxis, resolveCapsule() (+2 more)

### Community 345 - "100. IMPLEMENTATION MASTER PLAN"
Cohesion: 0.11
Nodes (18): 100. IMPLEMENTATION MASTER PLAN, WAVE 0 — ARCHITECTURE CONVERGENCE, WAVE 10 — SHARED AGENT BLACKBOARD, WAVE 11 — SPECIALIST WORKERS, WAVE 12 — CLI MVP, WAVE 13 — PORTABLE PACKAGE, WAVE 14 — CAPSULE REGISTRY, WAVE 15 — EVALUATION (+10 more)

### Community 346 - "clean"
Cohesion: 0.26
Nodes (13): capsuleIntakeFlow, clean(), core(), deterministicIntake(), deterministicSynthesis(), dominantProposalSource(), normalizeIntake(), normalizeSources() (+5 more)

### Community 347 - "rights"
Cohesion: 0.11
Nodes (18): maxLength, minLength, type, mode, maxLength, minLength, type, enum (+10 more)

### Community 348 - "chat.ts"
Cohesion: 0.18
Nodes (15): CapsuleCognitiveChat(), inspect(), interview(), submit(), Message, modeLabels, Preview, CAPSULE_INSPECTION_COMMANDS (+7 more)

### Community 349 - "canonical-graph.ts"
Cohesion: 0.19
Nodes (17): BiTemporalFields, BiTemporalFieldsSchema, buildTemporalAssertionsFromGraph(), CANONICAL_GRAPH_SCHEMA_VERSION, evidenceFromMetadata(), GraphEvidenceEnvelope, GraphEvidenceEnvelopeSchema, NODE_SOURCE_VALUES (+9 more)

### Community 350 - "RetrievalOrchestrator"
Cohesion: 0.20
Nodes (3): estimateTokens(), RetrievalOrchestrator, GraphLayer

### Community 351 - "context-enrichment-adapter.test.ts"
Cohesion: 0.13
Nodes (6): buildContextEnrichmentReceipt(), createDisabledTemporalGraphProvider(), FakeCollection, FakeDoc, FakeFirestore, FakeSnapshot

### Community 352 - "FakeCollection"
Cohesion: 0.14
Nodes (4): FakeCollection, FakeDoc, FakeFirestore, FakeSnapshot

### Community 353 - "backend/main.py"
Cohesion: 0.05
Nodes (22): agents_health(), case_ontology_debug(), cognee_admin_quiesce(), cognee_admin_resume(), cognee_service_health(), _emit_agents_health_failure(), health(), healthz() (+14 more)

### Community 354 - "vertex_rag.py"
Cohesion: 0.23
Nodes (6): VertexRagClient, VertexRagConfig, VertexRagContext, VertexRagRetrieveResult, test_vertex_rag_client_builds_retrieve_contexts_payload(), test_vertex_rag_client_is_disabled_safe_by_default()

### Community 355 - "PRAXIS Document-Centric Agentic Research Plan"
Cohesion: 0.12
Nodes (16): Agentic Structure, Concrete Next Ticket, Diagnosis, Executive Read, Lane 1 - Memo Studio Sourceability Action, Lane 2 - Evidence Pack v2, Lane 3 - Live Research Memo Agent Dry Run, Lane 4 - Ask Traceability Panel (+8 more)

### Community 356 - "CapsuleAgentView.tsx"
Cohesion: 0.23
Nodes (14): AgentPacketTier, CapsuleAgentPacketResponse, CapsuleAgentView(), CapsuleAgentViewContent(), CapsuleAgentViewEmpty(), CapsuleAgentViewError(), CapsuleAgentViewLoading(), CountTile() (+6 more)

### Community 357 - "PRAXIS streamlining and workflow repairs — 2026-09-29"
Cohesion: 0.12
Nodes (15): Changes, Delivery self-evaluation, Evidence, Final verification, Live verification follow-up, PRAXIS streamlining and workflow repairs — 2026-09-29, Remaining release verification, Scope and release state (+7 more)

### Community 358 - "Memory Layer Runbook"
Cohesion: 0.12
Nodes (16): Backups, Cost And Quota, Daily Ops, Environment Matrix, Escalation, Failure Modes, Memory Layer Runbook, Mitigation (+8 more)

### Community 359 - "Tool Entries"
Cohesion: 0.12
Nodes (16): Analysis of Competing Hypotheses, Ask PRAXIS, Canonical PRAXIS Tool Library, Coalition Detector, Commitment Tracker, Context Builder, Contradiction Finder, Frame Narrative (+8 more)

### Community 360 - "verify-tools.ts"
Cohesion: 0.18
Nodes (14): colorize(), COLORS, { existsSync }, EXPECTED_HERO_TOOL_IDS, { join }, localRouteExists(), main(), ResultStatus (+6 more)

### Community 361 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, @modelcontextprotocol/sdk, @next/bundle-analyzer, @playwright/test, tailwindcss, @tailwindcss/postcss (+9 more)

### Community 362 - "signal/evaluation.ts"
Cohesion: 0.23
Nodes (14): Claim, completeCorrect(), correct(), evaluateSignal(), fields, lanes, literal(), matched() (+6 more)

### Community 363 - "[...slug]/route.ts"
Cohesion: 0.11
Nodes (31): ALLOWED_BACKEND_PATHS, DELETE, GET, isAllowedBackendPath(), localBackendFallback(), maxDuration, POST, proxyBackendRequest() (+23 more)

### Community 364 - "open-questions-store.ts"
Cohesion: 0.16
Nodes (16): SanctionsMeasure, 2. Conflict Dynamic Ontology Pack, BodySchema, POST(), RouteContext, collectionRef(), createOpenQuestion(), listOpenQuestions() (+8 more)

### Community 365 - "fix-this-first-panel.tsx"
Cohesion: 0.14
Nodes (10): CORE_LABEL, CORE_REPAIR_CTA, CORE_REPAIR_HREF, FixThisFirstPanel(), FixThisFirstPanelProps, RequiredCoreKind, Props, State (+2 more)

### Community 366 - "situation-intelligence/route.ts"
Cohesion: 0.17
Nodes (12): buildUserInput(), POST, scenarioTypesAreComplete(), SituationIntelligenceRequest, IntelligenceEdgeSchema, IntelligenceNodeSchema, SituationIntelligence, SituationIntelligenceSchema (+4 more)

### Community 367 - "LocalCapsuleRegistry"
Cohesion: 0.21
Nodes (7): Cognitive CLI and MCP, assertIdentity(), authorize(), LocalCapsuleRegistry, cognition(), input(), registry()

### Community 368 - "app-red-flags.ts"
Cohesion: 0.20
Nodes (16): agenticResearchFlag(), AgenticSearchInput, AppDiagnosticGroup, AppDiagnosticRedFlag, AppDiagnosticSource, AppDiagnosticStatus, AppDiagnosticSummary, AppDiagnosticSummaryInput (+8 more)

### Community 369 - "output-capsules/storage.ts"
Cohesion: 0.27
Nodes (15): capsuleOutputsCollection(), cleanId(), cleanIso(), cleanText(), dbOf(), getOutputCapsule(), listOutputCapsules(), numberOr() (+7 more)

### Community 370 - "stage-targets.ts"
Cohesion: 0.17
Nodes (11): getMarketplaceStageTarget(), getStageTarget(), HERO_TARGETS, MARKETPLACE_STAGE_TARGETS, MarketplaceHeroToolId, MarketplaceStageChapter, MarketplaceStageTarget, MarketplaceStagedContext (+3 more)

### Community 371 - "conversations-isolation.test.ts"
Cohesion: 0.15
Nodes (5): FakeCollection, FakeDoc, FakeFirestore, FakeSnapshot, mocks

### Community 372 - "FakeCollection"
Cohesion: 0.15
Nodes (4): FakeCollection, FakeDoc, FakeFirestore, FakeSnapshot

### Community 373 - "core-library.test.ts"
Cohesion: 0.18
Nodes (4): FakeCollection, FakeDoc, FakeFirestore, FakeSnapshot

### Community 374 - "FakeCollection"
Cohesion: 0.15
Nodes (4): FakeCollection, FakeDoc, FakeFirestore, FakeSnapshot

### Community 375 - "PRAXIS release record: September 30, 2026"
Cohesion: 0.06
Nodes (29): Contract, Later integration, Optional JEV review adapter, Sources, [3.10.0] — 2026-03-30, Added, Changed, Accepted CSS-only checkpoint: 01a95497 (+21 more)

### Community 376 - "constants/tool-registry.ts"
Cohesion: 0.14
Nodes (15): Added, EntityEnrichment, ARCHIVE_TOOLS, getRelatedTools(), getToolsByCategory(), HERO_TOOLS, TOOL_BY_ID, TOOL_ID_ALIASES (+7 more)

### Community 377 - "Layout Grammar"
Cohesion: 0.13
Nodes (15): Anti-Patterns, Cartographic Grid, Civic Atelier Primitives, Context Chain, Dossier Spine, Implementation Order, Layout Grammar, Living Context Rail (+7 more)

### Community 378 - "PRAXIS Agent Runtime Architecture"
Cohesion: 0.12
Nodes (16): ADK vs Genkit Boundary, AgentRun Lifecycle, Approval Model, Documentation Anchors, Eval Strategy, Event Taxonomy, Executive Contract, No-Go Rules (+8 more)

### Community 379 - "red_team_analyst/runner.py"
Cohesion: 0.30
Nodes (5): main(), is_safe_framing(), run_red_team_analysis(), test_red_team_runner_returns_synthesized_safe_report(), test_red_team_runner_sanitizes_operational_framing()

### Community 380 - "verify-design-shipped.mjs"
Cohesion: 0.31
Nodes (8): evaluate(), fetchLive(), LIVE_ASSERTIONS, main(), ROOT, SOURCE_ASSERTIONS, SOURCE_FILES, sourceText()

### Community 381 - "SIGNAL world explorer: source and catalog research"
Cohesion: 0.12
Nodes (15): Contracts inspected, Directory reachability, Economic provider contract, Firsthand network observations and reproducible evidence, Global Voices attribution basis and bounds, Headline candidates and rights, Implemented initial provider panel, Independent publisher follow-up (+7 more)

### Community 382 - "Ontology-First Capsule Workbench + Cohort Hardening — Design & Codex Brief"
Cohesion: 0.13
Nodes (15): 1. Goal, 2. Constraints & non-goals, 3. Architecture (current → target), 4. Track A — Ontology-First Inspector (lead), 6. Execution model (how Claude drives Codex), 7. Open risks, A1. Build the new IA, A2. "Build the ontology" actions (the loop) (+7 more)

### Community 383 - "extract-docling/main.py"
Cohesion: 0.23
Nodes (8): _convert(), _download_gcs_uri(), _get_converter(), healthz(), parse(), ParseRequest, ParseResponse, _persist_json()

### Community 385 - "negotiation_mediation.py"
Cohesion: 0.18
Nodes (10): Interest, AgendaItem, BATNA, MediationInterest, MediationSession, Mediator, Party, Position (+2 more)

### Community 386 - "audit-capsule-backfill-readiness.ts"
Cohesion: 0.12
Nodes (13): advanced, Check, checks, failed, inspection, outDir, packageJson, research (+5 more)

### Community 387 - "Agent Context Serialization Research for PRAXIS Capsules"
Cohesion: 0.20
Nodes (9): 1. Graph Serialization for LLM Reasoning, 2. Ontology Grounding, 3. Provenance and Confidence, 4. Salience and Subgraph Selection, 6. Verification Surface: What the Agent Sees, Agent Context Serialization Research for PRAXIS Capsules, Executive Summary, Risks and Open Questions (+1 more)

### Community 388 - "graph-service.ts"
Cohesion: 0.31
Nodes (14): GET, POST, addEdges(), addNodes(), findPivotActors(), getEntityDistribution(), getGraph(), getGraphEvolution() (+6 more)

### Community 389 - "pricing/page.tsx"
Cohesion: 0.16
Nodes (10): metadata, PricingPage(), CheckoutPayload, CheckoutPlan, PricingCheckoutButton(), PricingCheckoutButtonProps, SessionPayload, INTERNAL_COST_DISCLOSURE_NOTICE (+2 more)

### Community 390 - "getAdminDbOrThrow"
Cohesion: 0.04
Nodes (76): Fixed, AnalystProfile — Calibration Contract, 3.8 Every AI route is wrapped, What PRAXIS Already Has, POST, POST, GET, ConversationRouteContext (+68 more)

### Community 391 - "AgentsWorkingStrip.tsx"
Cohesion: 0.21
Nodes (13): AgentsWorkingStrip(), countApprovalGates(), countTools(), dotClass(), latestMeaningfulEvent(), narrateEvent(), normalizeEvents(), RunLink() (+5 more)

### Community 392 - "context-health-score.ts"
Cohesion: 0.22
Nodes (13): assertContextReady(), ContextHealthGateError, average(), clamp(), computeContextHealthScore(), ContextHealthDimensionId, ContextHealthDimensionScore, ContextHealthScore (+5 more)

### Community 393 - "context_layers.py"
Cohesion: 0.29
Nodes (9): CaseContext, ContextAdvisory, ContextSnapshot, ContextSpec, ConversationContext, PreparedContext, UserContext, WorkspaceContext (+1 more)

### Community 394 - "manifest.json"
Cohesion: 0.12
Nodes (15): capsule_id, category, cores, created_at, depends_on, layers_present, owner_uid, provenance_root_hash (+7 more)

### Community 395 - "test_sync_creates_nodes"
Cohesion: 0.06
Nodes (8): sync_situation(), DialecticaClient, _is_read_only_cypher(), Neo4jClient, _safe_label(), _with_bitemporal(), test_sync_creates_nodes(), test_tenant_isolation_rejects_writes_in_query()

### Community 396 - "writer/ask/route.ts"
Cohesion: 0.07
Nodes (31): Codex Continuation — 2026-04-29 AI safeguards and health visibility, Codex Continuation — 2026-04-29 executive situation intelligence, Codex Continuation — 2026-04-29 grounded-search intelligence spine, Codex Continuation — 2026-04-29 persona QA demo trust wave, Codex Continuation — 2026-04-29 roadmap and root runbooks, Codex Continuation — 2026-04-29 sophisticated persona and AI trust wave, Codex Continuation — backend trust boundary + Core-8 graph coverage, Codex Continuation — Evidence envelope + SKC retrieval hardening (+23 more)

### Community 397 - "audits/README.md"
Cohesion: 0.10
Nodes (16): Diagnostics Evidence, Issues Found And Fixed, PRAXIS Full UX, Agentic, Capsule, And Legal Diagnostic, Product Quality Notes, Remaining Red Flags, Scope, Documentation Cleanup Decision, PRAXIS Red Flags And Improvement Plan (+8 more)

### Community 398 - "PRAXIS Deep Pre-Ship Checklist Audit"
Cohesion: 0.13
Nodes (14): 13. Notifications system, 14. Operator view — the transparency surface, 16. CI / audit scripts, 17. End-to-end product tests, 18. Frontend polish, 19. Performance and latency targets, 1. Database, migrations, RLS, connection pool, 2. Cognee substrate wrapper (+6 more)

### Community 399 - "package.json"
Cohesion: 0.02
Nodes (126): R8 — Language/register layer for outputs (later, product-led), name, private, version, clsx, d3, fast-xml-parser, @genkit-ai/vertexai (+118 more)

### Community 400 - "PRAXIS Compliance Tracker"
Cohesion: 0.13
Nodes (14): 1.1 Sources actively used and their license posture, 1.2 Sources we deliberately DO NOT use, 1.3 Attribution discipline (live in production), 1.4 the selected situation source library, 1. Data licensing — Google-grounded and user-source stack, 2.1 SOC 2 Type II — in scope, not started, 2.2 ISO 27001 / 27018 — deferred until SOC 2 in flight, 2.3 GDPR — DPA published (+6 more)

### Community 401 - "Incorporated"
Cohesion: 0.13
Nodes (15): Browser Automation Lane, Clerk As Auth, Dark Tasklet Clone Aesthetic, Generic FastAPI-First App Split, Guardrails, Incorporated, New Canonical Additions, Not Adopted (+7 more)

### Community 402 - "PRAXIS tooling research — 2026-09-29"
Cohesion: 0.13
Nodes (15): 1. Reuse the authenticated testing tools already present, 2. Finish recovery within the existing durable boundary, 3. Measure the analytical value of capsules, 4. Adopt continuation only for a demonstrated long-running need, Decision, Developer map maintenance, Four concrete recommendations, PRAXIS tooling research — 2026-09-29 (+7 more)

### Community 403 - "2. Still to ship (ordered by leverage)"
Cohesion: 0.13
Nodes (14): 0. The Bet, 1. Shipped in this session, 2.1 Workbench drag-and-drop core composer  *(highest leverage)*, 2.2 Editor like a real Word document, 2.3 Page consolidation / "remove old pages", 2.4 Ask PRAXIS expansion, 2.5 Tools and contexts called by specific name; library audit, 2.6 Administration panel — full knowledge for admins (+6 more)

### Community 404 - "audit-cognee-isolation.ts"
Cohesion: 0.13
Nodes (14): allowedCogneeImportFiles, backendMain, bridgeMigration, cogneeRlsSql, cogneeSetupSql, contextCapsules, deployCognee, failures (+6 more)

### Community 405 - "grounding-metadata.ts"
Cohesion: 0.18
Nodes (13): buildInlineCitationMap(), citationByIdIndex(), ClaimGroundingInput, ClaimGroundingResult, cleanText(), GroundingChunk, GroundingMetadata, GroundingSupport (+5 more)

### Community 406 - "cognee_aco_models/base.py"
Cohesion: 0.18
Nodes (11): AcoDataPoint, Commitment, Leverage, Narrative, CeasefireCommitment, FinancingChannel, ResilienceCommitment, MonitoringMechanism (+3 more)

### Community 407 - "truth_layers.py"
Cohesion: 0.20
Nodes (5): infer_truth_layer(), ProvenanceRef, ProvenanceSpan, TruthLayer, TruthLayerNode

### Community 408 - "2. Gaps and recommendations (priority order)"
Cohesion: 0.15
Nodes (13): 1. Verdict on the current structure, 2. Gaps and recommendations (priority order), 3. What NOT to do, 4. Sequencing with the build queue, ContextCapsule — Ontology & Semantic Structure: Assessment + Recommendations, R1 — Close the entity-type gap between capsule graphs and ACO (high), R2 — Stable semantic identity for graph nodes (high), R3 — Claim ↔ graph ↔ source triangle (high) (+5 more)

### Community 409 - "collectors.ts"
Cohesion: 0.09
Nodes (29): authorityFor(), bounded(), decodeEntities(), extractedBody(), fetchOriginalSource(), isPublicSourceAddress(), OriginalPassageStatus, OriginalSourcePassage (+21 more)

### Community 410 - "Raw Gate Output"
Cohesion: 0.14
Nodes (13): AI route calibration audit, Audit gate, Build, Forbidden Gemini grep, Landing bundle, LATEST Baseline Audit, Lint, Mobile landing E2E (+5 more)

### Community 411 - "[Unreleased] — 2026-04-26 (tenth session — Claude Code multi-lane sprint)"
Cohesion: 0.17
Nodes (12): Codex strategic-uplift pass, Documentation, Lane D — Shared confidence/citation primitives + provenance panel, Lane E — Strategy: large-scale improvement roadmap + persona walkthroughs, Lanes O–S — Strategy / test / GCP / TODO / index docs, Onboarding first-run UX, Production correction, Public UX source-truth cleanup (+4 more)

### Community 412 - "MCP Task Profiles"
Cohesion: 0.15
Nodes (13): Agent Role Hints, Build, Cloud, Codex Operating System, Daily, Diagnose, External Action Rule, Frontend (+5 more)

### Community 413 - "PRAXIS — CODEX Playbook & Improvement Roadmap"
Cohesion: 0.14
Nodes (14): 0. The product in one paragraph, 1. Read order (do this before touching code), 3. Validation gate (run before every deploy / PR), 4. Vision → live-state gap map, 5. Prioritized roadmap, 6. Per-surface work packets (CODEX-actionable), 7. Documentation hygiene rules (keep the repo legible), 8. Quick reference (+6 more)

### Community 414 - "research/README.md"
Cohesion: 0.15
Nodes (10): Phase 00 - establish the real integration baseline, Additional research and implementation decisions, Decisions from the additional research, Keep stable narratives separate from topic batches, Make the handoff portable, Preserve analytical distinctions, Reuse retrieval before adding infrastructure, Treat collection access as a configurable dependency (+2 more)

### Community 415 - "Dashboard"
Cohesion: 0.15
Nodes (12): AI model, Dashboard, Data sources, Extension surface, Frameworks, From SKC layers, From the active `Situation`, Inputs (read) (+4 more)

### Community 416 - "{{Tool Name}}"
Cohesion: 0.14
Nodes (13): AI model, Data sources, Extension surface, Frameworks, From `AnalystProfile` (via `withCalibration`), From SKC layers, From the active `Situation`, Inputs (read) (+5 more)

### Community 417 - "docx"
Cohesion: 0.19
Nodes (13): docx, jspdf, mammoth, generateDocx(), generatePdf(), addFooter(), ensureSpace(), loadReport() (+5 more)

### Community 418 - "properties"
Cohesion: 0.14
Nodes (14): confidenceKind, derivedFrom, generatedBy, provenance, reviewedAt, reviewedBy, sourceRefs, additionalProperties (+6 more)

### Community 419 - "pricing.ts"
Cohesion: 0.18
Nodes (8): PRAXIS_ASK_CREDIT_COST, PRAXIS_STARTER_TOKEN_ALLOWANCE, PLAN_USAGE_BUCKETS, PricingTier, starterAskAllowance, initializeServerUserProfile(), VerifiedProfileIdentity, identity

### Community 420 - "capsule-suggestions.ts"
Cohesion: 0.24
Nodes (12): agentCapsuleBoost(), agentChangeSummary(), AskCapsuleSuggestion, AskCapsuleSuggestionInput, categoryPromptBoost(), hasAny(), overlapScore(), rankAskCapsuleSuggestions() (+4 more)

### Community 421 - "tasklet-style-runtime.ts"
Cohesion: 0.21
Nodes (12): firstAgentBlueprint(), FORBIDDEN_PRIMARY_RUNTIME_ADDITIONS, PRAXIS_DEFERRED_BROWSER_AUTOMATION_LANE, PRAXIS_FIRST_AGENT_BLUEPRINTS, PRAXIS_TASKLET_STYLE_STACK, PraxisAgentBlueprint, PraxisAgentKind, PraxisAgentRuntimeDecision (+4 more)

### Community 422 - "email-service.ts"
Cohesion: 0.40
Nodes (9): resend, baseTemplate(), EmailPayload, getResend(), send(), sendAlertDigestEmail(), sendCreditWarningEmail(), sendWeeklySummaryEmail() (+1 more)

### Community 423 - "Claim"
Cohesion: 0.15
Nodes (12): Claim, TerritorialClaim, AttributionClaim, RecognitionClaim, AccessCorridor, AffectedPopulation, AidDeliveryCommitment, DeliveryConstraint (+4 more)

### Community 424 - "migrate-user-api-keys.mjs"
Cohesion: 0.24
Nodes (11): args, buildAad(), COMMIT, deleteLegacy(), encrypt(), getMasterKey(), initFirestore(), LEGACY_MAP (+3 more)

### Community 425 - "Constraint"
Cohesion: 0.20
Nodes (8): Constraint, EscalationEvent, Frontline, HumanitarianAccessConstraint, NonStateArmedGroup, State, AdministrativeBoundary, FrozenLineOfContact

### Community 426 - "13. Codex execution backlog (Phases 0–1, file-level)"
Cohesion: 0.09
Nodes (23): 2026-04-29 — Subagent audit wave: persistence, exports, and deploy gates, [3.6.0] — 2026-03-28, Added, Audited, Documentation, Fixed, Notes, Security (+15 more)

### Community 427 - "FakeCollection"
Cohesion: 0.20
Nodes (3): FakeCollection, FakeDoc, FakeFirestore

### Community 428 - "PRAXIS Multi-Tenant Data Model"
Cohesion: 0.15
Nodes (12): Current state (as of session start), Decision 1 — Org model, Decision 2 — Case ownership, Decision 4 — Invite mechanism, Decision 5 — Migration, Decisions, Implementation plan, Out of scope for this session (+4 more)

### Community 429 - "document-postgres.ts"
Cohesion: 0.33
Nodes (8): pg, ensureSchema(), eraseOwnerDocumentMirror(), getDatabaseUrl(), getPool(), isDocumentSqlMirrorConfigured(), mirrorDocumentIngestionSql(), mocks

### Community 430 - "56. WHERE STANDARD AI FALLS SHORT"
Cohesion: 0.15
Nodes (13): 56. WHERE STANDARD AI FALLS SHORT, Armed conflict, Cyber incident response, Diplomacy, Humanitarian analysis, Intelligence analysis, Investment analysis, Law (+5 more)

### Community 431 - "Spec #1 — Cleanup & Infra"
Cohesion: 0.15
Nodes (12): 1. CI hardening (`cloudbuild.yaml`), 2. Repo hygiene, 3. Auth + dead-code purge, 4. Workbench split (`tasklet-praxis-workbench.tsx`, 2,132 lines), Acceptance Criteria, Goal, Out of Scope, Risks (+4 more)

### Community 432 - "instant-context.ts"
Cohesion: 0.12
Nodes (24): 4.1 New unit: Instant Context builder, TurnCapsule, buildCapsule(), buildInstantContextCapsule(), buildInstantCoreRefs(), buildSourcingPolicy(), buildTemporality(), cleanSignal() (+16 more)

### Community 433 - "audit-capsule-depth.ts"
Cohesion: 0.17
Nodes (12): auditDir, capsuleReports, categories, check(), counts, expected, failures, genericFragments (+4 more)

### Community 434 - "ContextCapsule — Attachable Capsule & Dock: Technical Build Recommendation"
Cohesion: 0.20
Nodes (9): 2.1 Slot semantics (already shipped — freeze them), 2.2 Pinning and versioning, 2.3 Attach flows (all write through the same helpers), 2.4 Compilation budget, 2. The dock: recommended target architecture, 3. Capsule portability (the "attachable anywhere" story), 4. Build sequence (maps to HANDOVER P-queue), 5. Anti-patterns (refuse in review) (+1 more)

### Community 435 - "audit-embedding-dim.ts"
Cohesion: 0.15
Nodes (12): config, configPath, disallowedModelStringHits, listFiles(), missingConfigMarkers, missingVectorMarkers, providerPath, requiredConfigMarkers (+4 more)

### Community 436 - "audit-release-notes.ts"
Cohesion: 0.15
Nodes (10): appVersion, appVersionSource, buildDate, buildNumber, changelog, failures, packageJson, releasePageSource (+2 more)

### Community 437 - "circuit-breaker.ts"
Cohesion: 0.18
Nodes (7): GET, CircuitBreaker, CircuitBreakerConfig, geminiBreaker, getAllBreakerDetails(), getAllBreakerStates(), groundedSearchBreaker

### Community 438 - "export-docx/route.ts"
Cohesion: 0.28
Nodes (11): bodyParagraph(), divider(), heading(), meta(), paragraphize(), POST, sourceabilityExportGate(), text() (+3 more)

### Community 439 - "activity-panel.tsx"
Cohesion: 0.24
Nodes (11): ActivityPanel(), ElapsedTime(), FilterMode, formatElapsed(), OperationRow(), StatusIcon(), ActiveOperation, ActivityStore (+3 more)

### Community 440 - "provenance-graph.ts"
Cohesion: 0.35
Nodes (10): clamp01(), computePathConfidence(), ConfidenceCarrier, confidenceFromString(), createProvenanceStep(), listProvenanceSteps(), normalizeNumericConfidence(), provenanceCollection() (+2 more)

### Community 441 - "rationale.ts"
Cohesion: 0.21
Nodes (11): IDENTITY_BY_ROLE, IDENTITY_FALLBACK, OnboardingRationale, PERSPECTIVE_BY_DOMAIN, PERSPECTIVE_FALLBACK, rationaleForIdentity(), rationaleForPerspective(), rationaleForWorkingStyle() (+3 more)

### Community 442 - "Policy and narrative quality evaluation"
Cohesion: 0.17
Nodes (12): Defined comparison and acceptance, Delivery self-evaluation, Faithful recall and remaining inference gaps, Final-source answer fidelity, Final-source worker memo review, Historical harness evidence, Historical metadata defects and local correction, Historical production answers: agent review (+4 more)

### Community 443 - "PRAXIS Legacy Assistant Chat"
Cohesion: 0.15
Nodes (12): Data sources, Frameworks, From `AnalystProfile` (via `withCalibration`), From the active `Situation`, Inputs (read), Live feeds (per tool), Open questions / TODO, Operations (+4 more)

### Community 444 - "loadtest.mjs"
Cohesion: 0.18
Nodes (10): args, concurrency, failures, latencies, oneRequest(), pending, report, requests (+2 more)

### Community 445 - "PRAXIS by TACITUS"
Cohesion: 0.17
Nodes (12): Agent Guidance, App Shape, Deploy, GitHub Repository Best Practices Used Here, Key Docs, Local Setup, PRAXIS by TACITUS, Product Model (+4 more)

### Community 446 - "legacy"
Cohesion: 0.17
Nodes (12): maximum, minimum, type, additionalProperties, properties, required, type, capsuleVersion (+4 more)

### Community 447 - "audit-canonical-names.ts"
Cohesion: 0.21
Nodes (11): audit(), { DOMAIN_IDS }, EXPECTED_DOMAIN_IDS, isShortLabelOk(), main(), NameCollision, NameMismatch, { PRAXIS_CANONICAL_TOOLS } (+3 more)

### Community 448 - "memos/search/route.ts"
Cohesion: 0.30
Nodes (11): dynamic, GET, MemoSearchResult, normalizeMemoSearchResult(), numberField(), QuerySchema, searchHaystack(), snippetsFor() (+3 more)

### Community 449 - "recent-policy-work-page.tsx"
Cohesion: 0.26
Nodes (9): RecentWorkPage(), CreatedWorkItem, formatDate(), isRecord(), RecentPolicyWorkPage(), load(), stringField(), SAMPLE_POLICY_ARTIFACTS (+1 more)

### Community 450 - "exa-agentic-search.ts"
Cohesion: 0.27
Nodes (10): buildExaAgenticSearchRequest(), EXA_SEARCH_ENDPOINT, EXA_SEARCH_TYPES, ExaAgenticSearchInput, ExaAgenticSearchResult, ExaSearchType, normalizedDomains(), normalizeExaSearchType() (+2 more)

### Community 451 - "dialectica-backbone.ts"
Cohesion: 0.23
Nodes (10): DIALECTICA_CAPABILITIES, DIALECTICA_DEMO_SCENARIO, DIALECTICA_NAMED_GRAPHS, DIALECTICA_PRIMITIVES, DialecticaCapability, dialecticaCoveragePercent(), DialecticaDemoScenario, DialecticaNamedGraph (+2 more)

### Community 452 - "PRAXIS — Builder Handover (Architect Brief + CODEX Prompt Queue)"
Cohesion: 0.20
Nodes (9): 1. The objective, 3. Architecture invariants (do not break), 4. Workstream A — Make each capsule genuinely great (highest priority), 5. Workstream B — Repository as the extensible capsule library, 6. Workstream C — Generation transparency and source attention, 7. Workstream D — Graphic coherence (simple, gentle, a bit futuristic), 8. Workstream E — Continuous cleanup, 9. Validation gate + deploy (every checkpoint) (+1 more)

### Community 453 - "capsules.ts"
Cohesion: 0.42
Nodes (7): attachSignalContext(), buildSignalNativeCapsule(), literalHash(), sameHash(), signalNativeEnvelope(), signalSourceReceipt(), compile()

### Community 454 - "human-review-panel.test.tsx"
Cohesion: 0.24
Nodes (11): approveButton(), approved, change(), Element, elements(), find(), props(), ready() (+3 more)

### Community 455 - "audit-runner.test.ts"
Cohesion: 0.17
Nodes (11): capsuleBackfill, capsuleConsolidation, capsuleDepth, capsuleGraphLite, capsuleInspectVisibility, capsuleResearchDossiers, deepPreship, packageJson (+3 more)

### Community 456 - "Round 4 — Visual fixes + dev backlog + clarifying questions + Wikipedia + analyst notes"
Cohesion: 0.22
Nodes (9): Lane AA — Bottom-right collision + Screenshot gitignore, Lane BB — Dashboard card legibility, Lane CC — Developer backlog system, Lane DD — Clarifying Questions framework, Lane EE — Wikipedia enrichment client, Lane FF — Analyst Notes (natural-language knowledge retention), Round 4 validation, Round 4 — Visual fixes + dev backlog + clarifying questions + Wikipedia + analyst notes (+1 more)

### Community 457 - "Cognitive Capsule architecture"
Cohesion: 0.17
Nodes (11): Acceptance and release evidence, Cognitive Capsule architecture, Context compilation and execution, Human review and canonicality, Implementation seams, Inventory and compatibility, Logical layers, Portability, registry, and deferred work (+3 more)

### Community 458 - "compose-capsules-demo.tsx"
Cohesion: 0.22
Nodes (10): Recent history (manual log), ACCENT_BG, ACCENT_INK, ComposeCapsulesShowcase(), ComposeCard(), Connector(), LEFT, MiniCapsule (+2 more)

### Community 459 - "101. FIRST CODEX EXECUTION PACK"
Cohesion: 0.18
Nodes (11): 101. FIRST CODEX EXECUTION PACK, TASK 1, TASK 10, TASK 2, TASK 3, TASK 4, TASK 5, TASK 6 (+3 more)

### Community 460 - "drafting-action/route.ts"
Cohesion: 0.24
Nodes (9): DraftingActionRequestSchema, maxDuration, POST, applyDraftingAction(), DRAFTING_ACTIONS, DraftingActionId, DraftingActionInput, DraftingActionResult (+1 more)

### Community 461 - "Capsule and Agentic Workflow Review - 2026-06-24"
Cohesion: 0.12
Nodes (15): 2. Ask orchestration is real and tested, 4. Capsule context is hardened for missing and legacy profiles, 5. The `/app/capsules` agent-context panel exists in code, Broken or Risky, Capsule and Agentic Workflow Review - 2026-06-24, High: Boardroom visible dock is not guaranteed to be the authoritative run binding, Ladybug Feasibility, Medium: Model matrix policy needs clarification (+7 more)

### Community 462 - "Codex: start from this extracted folder"
Cohesion: 0.18
Nodes (8): Codex: start from this extracted folder, Establish the working boundary, Install the instruction kit, Read and locate, Work through completion, 0.2 - expanded research and portable entry, Build kit release notes, PRAXIS SIGNAL build kit

### Community 463 - "Temporal graph and continuing context"
Cohesion: 0.18
Nodes (8): Phase 01 - canonical contracts and durable storage, Phase 05 - review, provenance graph and native capsules, Assessment delta, Canonical records and projections, Capsule extension and manifest, Four clocks, Production acceptance, Temporal graph and continuing context

### Community 464 - "The portal and the paid deliverable"
Cohesion: 0.18
Nodes (8): Phase 02 - authenticated global desk interface, Phase 06 - continuing assessments and deliverable briefs, Demonstration acceptance, Desk home, Evidence and review, Graph and dossier, Reviewable brief, The portal and the paid deliverable

### Community 465 - "COLLECTOR_ACCESS.md"
Cohesion: 0.18
Nodes (7): Phase 03 - collection, source capture and health, Phase 07 - durable watched desks and bounded real-time operation, Phase 09 - targeted image, audio and video evidence, Collector acceptance, Collector access and geography, Geography contract, Text pilot source ladder

### Community 466 - "Implementable analysis method"
Cohesion: 0.18
Nodes (9): Phase 04 - useful, source-bound multilingual analysis, Attention changes, Attributed propositions, Dependency and assessment changes, Frames and persuasion, Implementable analysis method, Observable circulation, Retrieval and duplicate handling (+1 more)

### Community 467 - "SOLO_FOUNDER_EXECUTION.md"
Cohesion: 0.18
Nodes (8): Phase 10 - staging proof and reviewable release, Phase 11 - leave an operable product, Capacity and cost controls, Customer conversations, One commercially useful desk first, Sequence, Solo founder execution and purchase test, Success and stopping criteria

### Community 468 - "PRAXIS Design Rules — locked"
Cohesion: 0.18
Nodes (10): Anti-patterns we will refuse, How to apply, PRAXIS Design Rules — locked, Rule 1 — Two actions per page, Rule 2 — No emoji icons, Rule 3 — Typographic register, Rule 4 — Empty states ≤ 6 words, Rule 5 — No gradient blobs, no neon, no glow buttons (+2 more)

### Community 469 - "format.ts"
Cohesion: 0.20
Nodes (3): date-fns, formatDiplomaticDate(), formatRelativeTime()

### Community 470 - "user-core-onboarding-card.tsx"
Cohesion: 0.28
Nodes (8): UserCoreOnboardingCard, CapsuleCreateResponse, OUTPUT_OPTIONS, ROLE_OPTIONS, slug(), UserCoreOnboardingCard(), buildUserCore(), dismiss()

### Community 471 - "audit-tool-contracts.ts"
Cohesion: 0.27
Nodes (10): ContractAuditRow, { getToolOperatingContract }, { hrefForTool }, main(), mark(), pageExists(), render(), routeExists() (+2 more)

### Community 472 - "codegen-schema.ts"
Cohesion: 0.22
Nodes (10): ConfidenceLevel, ConflictGrammarSource, Primitive, pyList(), q(), Relationship, repoRoot, schemaPath (+2 more)

### Community 473 - "Context Preparer"
Cohesion: 0.18
Nodes (10): Composition, Context Preparer, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 474 - "Memo Drafter"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Memo Drafter, Outputs, Pitfalls, Purpose (+2 more)

### Community 475 - "deploy-firebase-rules.mjs"
Cohesion: 0.13
Nodes (13): eslintConfig, noForbiddenModels, require, ALLOWED, eslint, eslint-config-next, BUCKETS, main() (+5 more)

### Community 476 - "Output Refiner"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Output Refiner, Outputs, Pitfalls, Purpose (+2 more)

### Community 477 - "Source Augmenter"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Source Augmenter (+2 more)

### Community 478 - "Tool Skill Template"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Tool Skill Template (+2 more)

### Community 479 - "Analyze Network"
Cohesion: 0.18
Nodes (10): Analyze Network, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 480 - "Actor Alignment Shift"
Cohesion: 0.18
Nodes (10): Actor Alignment Shift, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 481 - "Cease-Fire Monitor"
Cohesion: 0.18
Nodes (10): Cease-Fire Monitor, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 482 - "Commitment Check"
Cohesion: 0.18
Nodes (10): Commitment Check, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 483 - "Escalation Ladder"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Escalation Ladder, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 484 - "Escalation Timeline"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Escalation Timeline, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 485 - "Leverage Trace"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Leverage Trace, Outputs, Pitfalls, Purpose (+2 more)

### Community 486 - "Analysis of Competing Hypotheses"
Cohesion: 0.18
Nodes (10): Analysis of Competing Hypotheses, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 487 - "Assumption Mapper"
Cohesion: 0.18
Nodes (10): Assumption Mapper, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 488 - "Brief Exporter"
Cohesion: 0.18
Nodes (10): Brief Exporter, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 489 - "Causal Loop Diagram"
Cohesion: 0.18
Nodes (10): Causal Loop Diagram, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 490 - "Community Synthesizer"
Cohesion: 0.18
Nodes (10): Community Synthesizer, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 491 - "Context Health Explainer"
Cohesion: 0.18
Nodes (10): Composition, Context Health Explainer, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 492 - "Contradiction Finder"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Contradiction Finder, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 493 - "Devil's Advocate"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Devil's Advocate, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 494 - "Indicators Tracker"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Indicators Tracker, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 495 - "Key Assumptions Check"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Key Assumptions Check, Outputs, Pitfalls, Purpose (+2 more)

### Community 496 - "Memo Create"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Memo Create, Outputs, Pitfalls, Purpose (+2 more)

### Community 497 - "Memo Refresh"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Memo Refresh, Outputs, Pitfalls, Purpose (+2 more)

### Community 498 - "Outside-In Thinking"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Outside-In Thinking, Pitfalls, Purpose (+2 more)

### Community 499 - "Premortem"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Premortem, Purpose (+2 more)

### Community 500 - "Red Team Analysis"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Red Team Analysis (+2 more)

### Community 501 - "Scenario Projector"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Scenario Projector (+2 more)

### Community 502 - "Stakeholder Power Interest"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Stakeholder Power Interest (+2 more)

### Community 503 - "Timeline Comparator"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Timeline Comparator (+2 more)

### Community 504 - "Beneficial Ownership Map"
Cohesion: 0.18
Nodes (10): Beneficial Ownership Map, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 505 - "Designation Tracer"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Designation Tracer, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 506 - "Evasion Pattern Detector"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Evasion Pattern Detector, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 507 - "Sanctions Impact Model"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Sanctions Impact Model (+2 more)

### Community 508 - "Extract Entities (GLiNER)"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Extract Entities (GLiNER), Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 509 - "Coalition Map"
Cohesion: 0.18
Nodes (10): Coalition Map, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 510 - "Mandate Traceback"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Mandate Traceback, Outputs, Pitfalls, Purpose (+2 more)

### Community 511 - "Veto Probability"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Veto Probability (+2 more)

### Community 512 - "Pattern Detector"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pattern Detector, Pitfalls, Purpose (+2 more)

### Community 513 - "Treaty Body Engagement"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Treaty Body Engagement (+2 more)

### Community 514 - "UPR Cycle Mapper"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, UPR Cycle Mapper (+2 more)

### Community 515 - "Violation Tracker"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Violation Tracker (+2 more)

### Community 516 - "AA Trigger Monitor"
Cohesion: 0.18
Nodes (10): AA Trigger Monitor, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 517 - "Access Map"
Cohesion: 0.18
Nodes (10): Access Map, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 518 - "Cluster Coordinator"
Cohesion: 0.18
Nodes (10): Cluster Coordinator, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 519 - "Needs Aggregator"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Needs Aggregator, Outputs, Pitfalls, Purpose (+2 more)

### Community 520 - "Jurisdictional Analyzer"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Jurisdictional Analyzer, Outputs, Pitfalls, Purpose (+2 more)

### Community 521 - "Precedent Finder"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Precedent Finder, Purpose (+2 more)

### Community 522 - "Provision Tracer"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Provision Tracer, Purpose (+2 more)

### Community 523 - "Reservation Effect Mapper"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Reservation Effect Mapper (+2 more)

### Community 524 - "Match Sanctions"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Match Sanctions, Outputs, Pitfalls, Purpose (+2 more)

### Community 525 - "Mediation Brief"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Mediation Brief, Outputs, Pitfalls, Purpose (+2 more)

### Community 526 - "Position vs Interest"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Position vs Interest, Purpose (+2 more)

### Community 527 - "ZOPA Finder"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, When Not To Use (+2 more)

### Community 528 - "Counter-Narrative Finder"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Counter-Narrative Finder, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 529 - "Fact-Check Traceback"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Fact-Check Traceback, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 530 - "Frame Cascade"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Frame Cascade, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 531 - "Alliance Cohesion Map"
Cohesion: 0.18
Nodes (10): Alliance Cohesion Map, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 532 - "Capability Assessor"
Cohesion: 0.18
Nodes (10): Capability Assessor, Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 533 - "Escalation Modeler"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Escalation Modeler, Examples, Inputs, Outputs, Pitfalls, Purpose (+2 more)

### Community 534 - "Posture Tracker"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Posture Tracker, Purpose (+2 more)

### Community 535 - "Simulate Policy ABM"
Cohesion: 0.18
Nodes (10): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, Simulate Policy ABM (+2 more)

### Community 536 - "PathPicker.tsx"
Cohesion: 0.24
Nodes (9): FrameworkChain(), LENS_AXES, PATH_TINT, PathPicker(), PreviewPanel(), RadialLensChart(), SAMPLE_BY_PATH, SPRING (+1 more)

### Community 537 - "sources-preference.ts"
Cohesion: 0.42
Nodes (7): applySourcePreferences(), normalizeHost(), preferenceForUrl(), ProposalLike, SavedSource, SourcePreference, __test__

### Community 538 - "auto-structure.ts"
Cohesion: 0.38
Nodes (10): autoStructureDocument(), buildSpans(), inferActors(), inferKeyClaims(), inferLooseDate(), inferSourceType(), inferTimelineCandidates(), inferTitle() (+2 more)

### Community 539 - "analyst-notes.ts"
Cohesion: 0.33
Nodes (9): addAnalystNote(), AnalystNote, AnalystNoteSchema, deleteAnalystNote(), formatAnalystNotesBlock(), listAnalystNotes(), notesRef(), __test__ (+1 more)

### Community 540 - "collectTextContrastFailures"
Cohesion: 0.24
Nodes (7): collectTextContrastFailures(), composite(), contrastRatio(), effectiveBackground(), parseColor(), relativeLuminance(), legalPages

### Community 541 - "ask-context-readiness.test.tsx"
Cohesion: 0.27
Nodes (9): attachedStack(), bar(), drawer(), Element, elements(), find(), named(), runtime (+1 more)

### Community 542 - "futurist-ai-lab-contract.test.ts"
Cohesion: 0.18
Nodes (10): chatShell, globals, landingPage, marketingHome, ogImage, praxisChat, primaryNav, root (+2 more)

### Community 543 - "PRAXIS TODO"
Cohesion: 0.18
Nodes (11): 2026-06-12 session — shipped and follow-ups, Current Build Queue, Current continuation priorities, Current Priority Queue, Existing MVP Follow-Ups, Future Architecture Direction, Immediate Next Steps, Live Production Blockers (+3 more)

### Community 544 - "forced_displacement.py"
Cohesion: 0.25
Nodes (6): DisplacedGroup, DurableSolutionCommitment, HostCommunity, ProtectionClaim, ReturnConstraint, Route

### Community 545 - "6. The recalibrated symbolic firewall"
Cohesion: 0.29
Nodes (7): 6.1 The principle, 6.3 The advisory layer (Soft tier — informative, never blocking), 6.4 The synthesized layer (AI proposals, always labeled), 6.5 What the firewall is for, 6.6 Implementation, 6.7 What is NOT the firewall's job, 6. The recalibrated symbolic firewall

### Community 546 - "strategic_competition.py"
Cohesion: 0.22
Nodes (7): AllianceCommitment, DeterrenceClaim, EscalationLadder, RedLine, SignalingEvent, StrategicActor, Added

### Community 547 - "[Unreleased] — 2026-04-25 (sixth session — operational spine)"
Cohesion: 0.20
Nodes (10): Files added, Files updated, Hardening, IAM / SA migration plan, Idempotency + observability, New Firestore collections, New surfaces, Operational spine — durable jobs, events, notifications, semaphore status (+2 more)

### Community 548 - "library-state.ts"
Cohesion: 0.27
Nodes (8): buildLibraryArtifacts(), deriveClaims(), LibraryArtifact, LibraryArtifactType, SourceImportReceipt, truncate(), SavedClaim, SavedClaimSchema

### Community 549 - "Round 5 — Hero quadrant tour + 10 new bricks + Codex handoff doc"
Cohesion: 0.25
Nodes (8): Brick #45 — Hero quadrant tour (CODE), Brick #46 — Color system audit (DOC + verified), Bricks #47-54 — second sweep (CODE shipped), Bricks #47-54 — Specs only (NEW BRICKS in roadmap), Codex handoff, Round 5 — Hero quadrant tour + 10 new bricks + Codex handoff doc, Round 5 plan, Round 5 validation (final)

### Community 550 - "Capsule Database Audit"
Cohesion: 0.20
Nodes (9): Architecture Suggestions, Capsule Database Audit, Domains, Findings, Graph Stats, Multilateral Syria Flagship Records, Source Stats, Totals (+1 more)

### Community 551 - "PRAXIS Ask + ContextCapsule Cockpit Plan"
Cohesion: 0.20
Nodes (9): CapsuleLite, ContextCapsule Roadmap, Current Live Slice, Full ContextCapsule, Next Build Queue, PRAXIS Ask + ContextCapsule Cockpit Plan, Product Rule, Runtime Position (+1 more)

### Community 552 - "PRAXIS Foundation Coherence Check"
Cohesion: 0.20
Nodes (10): Canonical Documents, Codebase Alignment, Current Gaps, Documentation Cleanup Policy, Engineering Gate For Each Session, PRAXIS Foundation Coherence Check, Required Next Build Order, Senior Engineering Guidance (+2 more)

### Community 553 - "PRAXIS implementation ledger — 2026-09-30"
Cohesion: 0.20
Nodes (10): Delivery evidence and limitations, Delivery states, Documentation and operator entrypoints, Evidence and policy-method regression cases, PRAXIS implementation ledger — 2026-09-30, Recommendation coverage register (current dispositions), Release boundary and integrated evidence, Remaining dependencies and proof (+2 more)

### Community 554 - "PRAXIS Audit Runner And TODO Triage"
Cohesion: 0.25
Nodes (7): Accepted Copy / Test Fixtures, Audit Runner, Implemented In This Branch, PRAXIS Audit Runner And TODO Triage, Remaining Gap, Ticketed, TODO And Stub Triage

### Community 555 - "PRAXIS chat-first experience plan — 2026-09-30"
Cohesion: 0.22
Nodes (9): Acceptance and evidence gates, Authorized outcome and preserved baseline, File ownership, Implementation checklist, Integration evidence from the inventory/runtime lane, Power beneath the simple surface, PRAXIS chat-first experience plan — 2026-09-30, Simple route and journey contract (+1 more)

### Community 556 - "audit-admin-only-internals.ts"
Cohesion: 0.20
Nodes (7): adminBlock, advancedBlock, failures, INTERNAL_PATHS, navSrc, root, workspaceBlock

### Community 557 - "audit-ai-provider-isolation.ts"
Cohesion: 0.22
Nodes (9): allowedFiles, allowedModels, extname(), failures, root, runtimePrefixes, searchedExt, skippedDirs (+1 more)

### Community 558 - "audit-app-search-contract.ts"
Cohesion: 0.22
Nodes (9): checkFile(), failures, federatedSearch, forbiddenExternalMarkers, globalSearch, readRequired(), root, route (+1 more)

### Community 559 - "audit-no-normal-user-archive.ts"
Cohesion: 0.20
Nodes (8): failures, FORBIDDEN_PREFIXES, FORBIDDEN_SUFFIXES, full, hrefMatches, root, src, workspaceBlock

### Community 560 - "PRAXIS Tool Catalogue"
Cohesion: 0.25
Nodes (7): Authoring guidance for future docs, Changes since 2026-04-25, Coverage, How to read a tool doc, PRAXIS Tool Catalogue, Status legend, Tools with deep docs in this folder

### Community 561 - "generate-tool-docs.ts"
Cohesion: 0.29
Nodes (9): bullet(), { getToolContextBlueprint }, { getToolOperatingContract }, { getToolPathMembership }, main(), renderIndex(), renderToolDoc(), task() (+1 more)

### Community 562 - "analysis.ach-hypothesis/SKILL.md"
Cohesion: 0.20
Nodes (9): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, When Not To Use (+1 more)

### Community 563 - "analysis.coalition-detector/SKILL.md"
Cohesion: 0.20
Nodes (9): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, When Not To Use (+1 more)

### Community 564 - "analysis.commitment-tracker/SKILL.md"
Cohesion: 0.20
Nodes (9): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, When Not To Use (+1 more)

### Community 565 - "analysis.contradiction-finder/SKILL.md"
Cohesion: 0.20
Nodes (9): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, When Not To Use (+1 more)

### Community 566 - "analysis.frame-narrative/SKILL.md"
Cohesion: 0.20
Nodes (9): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, When Not To Use (+1 more)

### Community 567 - "analysis.position-vs-interest/SKILL.md"
Cohesion: 0.20
Nodes (9): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, When Not To Use (+1 more)

### Community 568 - "analysis.scenario-projector/SKILL.md"
Cohesion: 0.20
Nodes (9): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, When Not To Use (+1 more)

### Community 569 - "analysis.stakeholder-power-interest/SKILL.md"
Cohesion: 0.20
Nodes (9): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, When Not To Use (+1 more)

### Community 570 - "drafting.memo-drafter/SKILL.md"
Cohesion: 0.20
Nodes (9): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, When Not To Use (+1 more)

### Community 571 - "research.deep-research-agent/SKILL.md"
Cohesion: 0.20
Nodes (9): Composition, Context Requirements, Examples, Inputs, Outputs, Pitfalls, Purpose, When Not To Use (+1 more)

### Community 572 - "profile-weighted-retrieval.ts"
Cohesion: 0.19
Nodes (17): cosine(), mapChunk(), retrieveForProfile(), scoreWithSourcePosture(), clamp(), DEFAULT_FEED_RELIABILITY, fallbackPosture(), getSourcePosture() (+9 more)

### Community 573 - "capsule-factory-route-consolidation.test.ts"
Cohesion: 0.22
Nodes (8): RepositoryPage(), appShellSource, capsuleRouteSource, capsuleServiceSource, floatingPraxisSource, navigation, publicShellSource, workbenchSource

### Community 574 - "Google Agent Platform For PRAXIS"
Cohesion: 0.22
Nodes (8): Approved Cloud Setup Commands, Current Build Lane, Google Agent Platform For PRAXIS, Local Preflight, Macro RAG Repositories, Official Sources, Product Rule, Production Preflight

### Community 575 - "sanctions_economic_statecraft.py"
Cohesion: 0.29
Nodes (5): ComplianceCommitment, DesignationEvent, EconomicPressureClaim, EvasionRoute, SanctionedActor

### Community 576 - "context.py"
Cohesion: 0.48
Nodes (4): test_user_model_fields_accept_seed_shape(), OutputPreferences, SourcePreferences, UserModelFields

### Community 577 - "Historical: PRAXIS Codex Night Pack — STATUS (2026-05-08)"
Cohesion: 0.10
Nodes (21): Approvals Required, B0 KG Preflight Approval, Baselines And Checks, Blockers, Bundle Baseline, C2 Agent Engine Decision, Cognee Copy Inventory, Failures And Recoveries (+13 more)

### Community 578 - "Authenticated Runtime Test Lane"
Cohesion: 0.22
Nodes (8): Agentic Runtime Checks, Authenticated Runtime Test Lane, Full Lane, GitHub Actions Setup, Live Cloud Runtime Posture, Local App Smoke, One-Time Shell Setup, Product Surface Checks

### Community 579 - "marketing-home-contract.test.ts"
Cohesion: 0.20
Nodes (9): appHomePath, chatShellPath, floatingPraxisPath, legacyLandingPath, marketingHomePath, praxisChatPath, primaryNavPath, publicHomePath (+1 more)

### Community 580 - "CapsuleReviewQueueSection.test.tsx"
Cohesion: 0.24
Nodes (5): button(), Element, elements(), runtime, text()

### Community 581 - "Agents"
Cohesion: 0.22
Nodes (9): Agents, Codex ECC Baseline, Current Slice Work, graphify, Hard Rules, Operational references (consult when relevant), Read Before Code, Start Every Session (+1 more)

### Community 582 - "get_settings"
Cohesion: 0.05
Nodes (26): close_checkpointer(), _conninfo(), get_checkpointer(), health_check(), _resolve_password(), _increment(), run_smoke(), SmokeState (+18 more)

### Community 583 - "Grafeo Context Graph Experiment"
Cohesion: 0.22
Nodes (8): Adoption Rule, API, Boundary, Current Pipeline, Grafeo Context Graph Experiment, Ontology Presets, Runtime, Standard Queries

### Community 584 - "GraphLite Capsule Embedded Graph"
Cohesion: 0.22
Nodes (8): Advisory Recall Bridge, Capsule+ Artifact, Fit, GraphLite Capsule Embedded Graph, Guardrails, Local Install, Position, Upstream Basis

### Community 585 - "17. Decision tree — where does new code go?"
Cohesion: 0.22
Nodes (9): 17.1 New concept in the situation domain (e.g., "ceasefire violation," "BATNA"), 17.2 New piece of context (e.g., "user's preferred citation format"), 17.3 New analytical capability (e.g., "fact-check Russian-language sources"), 17.4 New AI capability that doesn't fit a tool's request/response shape (e.g., "translate memo blocks to French"), 17.5 New surface in the UI (e.g., "a global search bar"), 17.6 New data store (e.g., "a graph database for high-fanout queries"), 17.7 New external integration (e.g., "import documents from Google Drive"), 17.8 New infrastructure resource (e.g., "BigQuery for analytics") (+1 more)

### Community 586 - "PRAXIS Architecture Live-App Alignment"
Cohesion: 0.12
Nodes (15): Active Status Ledger, Architecture Audit Chain Parity, Current Local Gate, Known Reference/API Shape Drift, Partially Implemented Target State, PRAXIS Architecture Live-App Alignment, Required Correction, Shipped And Enforced (+7 more)

### Community 587 - "Agent ownership map — Claude × Codex on PRAXIS"
Cohesion: 0.22
Nodes (8): Agent ownership map — Claude × Codex on PRAXIS, Claude owns, Codex owns, Cross-references between agents, Deploy gate, Hard rule, Shared (either may extend), Surface map

### Community 588 - "16. CAPSULE TYPES"
Cohesion: 0.22
Nodes (9): 16. CAPSULE TYPES, Casebook Capsule, Expertise Capsule, Language Capsule, Method Capsule, Organization Capsule, Output Capsule, Role Capsule (+1 more)

### Community 589 - "Key findings"
Cohesion: 0.22
Nodes (8): Adopted design decisions (F-series), Agentic memory architectures, Graph/Memory Layer — State of the Art (2026-06-12), GraphRAG evolution, Key findings, Ontology-grounded LLM reasoning — measurable gains, Reasoning-annotated graphs, Temporal knowledge graphs (Zep/Graphiti — reference design)

### Community 590 - "Copy-ready continuation prompts"
Cohesion: 0.22
Nodes (8): 1. Complete optional JEV review, 2. Complete the capsule lifecycle and scale, 3. Finish accounts, free/paid entitlements and paid-pilot operations, 4. Prove analytical value and writing delivery, Commercial sequence, Copy-ready continuation prompts, PRAXIS: two-pillar product assessment, Release evidence

### Community 591 - "Multilingual processing and evaluation protocol"
Cohesion: 0.22
Nodes (7): Phase 08 - operate a text-first paid desk, Benchmark relevance, Build the actual gold set, Candidate retrieval providers, Multilingual processing and evaluation protocol, Preserve originals, Release decision

### Community 592 - "SIGNAL build progress"
Cohesion: 0.22
Nodes (8): Baseline and discovered paths, Current checkpoint, Decisions, Handoff, Phase status, Remaining access, SIGNAL build progress, Verification log

### Community 593 - "Production integration specification"
Cohesion: 0.22
Nodes (8): Boundaries and current source reference, Capture and analysis sequence, Definition of a text pilot, Production integration specification, Responsibility map, Route and service shape, Security and operational behavior, Source updates and invalidation

### Community 594 - "SIGNAL operator runbook"
Cohesion: 0.22
Nodes (9): Allowance exhaustion and capacity, Changed or withdrawn evidence; stale context, Collector or provider failure, Incident ownership, Observe first, Queue recovery, Shared public world observations, SIGNAL operator runbook (+1 more)

### Community 595 - "sanctions-yente/main.tf"
Cohesion: 0.39
Nodes (8): Terraform module: infrastructure/terraform/modules/sanctions-yente, google_cloud_run_v2_service.sanctions_yente, output.url, var.image, var.project_id, var.region, var.service_account, var.yente_index_url

### Community 596 - "properties"
Cohesion: 0.22
Nodes (9): additionalProperties, properties, required, type, geometry, height, width, x (+1 more)

### Community 597 - "audit-capsule-workspace-legibility.mjs"
Cohesion: 0.22
Nodes (7): allowlisted, combined, requiredMarkers, ROOT, sources, targets, violations

### Community 598 - "context-capsule-cognitive-assist-route.test.ts"
Cohesion: 0.22
Nodes (7): capture, context, Handler, input, mocks, post(), user

### Community 599 - "global-entity-index.ts"
Cohesion: 0.36
Nodes (8): getCrossContextEntities(), getEntitiesForSituation(), GlobalEntity, GlobalEntityMention, indexEntities(), makeEntityId(), normalize(), searchGlobalEntities()

### Community 600 - "CapsuleBuilderWizard.test.tsx"
Cohesion: 0.31
Nodes (7): changePurpose(), click(), Element, elements(), render(), runtime, textContent()

### Community 601 - "postgres-sweep.test.ts"
Cohesion: 0.28
Nodes (5): eventRowFromParams(), insertedEvents(), mockQueries(), mocks, NOW

### Community 602 - "PRAXIS Vertex AI Agent Engine — backend"
Cohesion: 0.25
Nodes (7): Costs, Files, IAM (one-time), LangGraph Runtime Plan, PRAXIS Vertex AI Agent Engine — backend, TL;DR deploy, Troubleshooting

### Community 603 - "Fable ↔ Codex Pair Protocol (MANDATORY)"
Cohesion: 0.33
Nodes (6): Brief template, Codex (via the `codex-rescue` agent) — executor, Fable ↔ Codex Pair Protocol (MANDATORY), Fable (this session) — planner & reviewer, Hard rules, The loop

### Community 604 - "scenario-forks.ts"
Cohesion: 0.47
Nodes (5): createScenarioFork(), forksCollection(), listScenarioForks(), ScenarioFork, ScenarioMutation

### Community 605 - "11. Tools (L4 part 2) — the marketplace"
Cohesion: 0.25
Nodes (8): 11.1 Tool Contract v2, 11.2 The marketplace UI, 11.3 The 52 v1.2 marketplace tools, 11.4 Adding a new tool, 11.5 Composition, 11.6 Tool runs as artifacts, 11. Tools (L4 part 2) — the marketplace, ToolRun

### Community 606 - "18. Centralization, evolution, and discipline"
Cohesion: 0.25
Nodes (8): 18.1 Single sources of truth, 18.2 The four-phase pattern for every change, 18.3 Audit scripts as living guards, 18.4 Architecture Decision Records, 18.5 Persona suites as the production bar, 18.6 Cost discipline, 18.7 Documentation as code, 18. Centralization, evolution, and discipline

### Community 607 - "audit-capsule-graphlite-projections.ts"
Cohesion: 0.25
Nodes (5): Finding, findings, namedGraphs, outDir, report

### Community 608 - "PRAXIS KPI Pipeline"
Cohesion: 0.25
Nodes (7): Assets, Deployment Runbook, Document Upload Fail Rate, Live Status, PRAXIS KPI Pipeline, Telemetry Dropout, Tool Run Fail Rate

### Community 609 - "PRAXIS Agentic Workflow Explained"
Cohesion: 0.25
Nodes (7): How Outputs Return With Proof, How Triage Selects the Team, Policy-Agent Roster, PRAXIS Agentic Workflow Explained, What Happens, Why Capsules Make It Smarter, Why It Is More Trustworthy

### Community 610 - "chat-pinned-evidence.test.ts"
Cohesion: 0.33
Nodes (4): Handler, mocks, snapshot, user

### Community 611 - "PRAXIS Agentic Search Diagnostic"
Cohesion: 0.25
Nodes (7): Blockers And Diagnostics, Current Flow, Grounding Modes, PRAXIS Agentic Search Diagnostic, Remaining Work, Runtime Inventory, Visible Process Rail

### Community 612 - "8. Simple-but-powerful UX — the pre/post-login simplification (CRITICAL)"
Cohesion: 0.25
Nodes (8): 8.0 What's wrong today (review of the live UI), 8.1 Design principles (apply everywhere), 8.2 New public (logged-out) Home — `src/app/page.tsx`, 8.3 New signed-in Home — `src/app/app/page.tsx`, 8.4 Categorize the "extra" (what moves out of the default view), 8.5 Other UX upgrades, 8.6 Acceptance criteria for the simplification, 8. Simple-but-powerful UX — the pre/post-login simplification (CRITICAL)

### Community 613 - "PRAXIS Public Copy Contract - 2026-06-09"
Cohesion: 0.29
Nodes (7): Context, Current User-Facing Contract, Decision, PRAXIS Public Copy Contract - 2026-06-09, Ship Checklist, Test And Audit Guards, Where Deeper Terms Belong

### Community 614 - "Codex controller for PRAXIS SIGNAL"
Cohesion: 0.25
Nodes (7): Build loop, Codex controller for PRAXIS SIGNAL, Domain rules, Engineering rules, Instruction order, Outcome, Phase completion

### Community 615 - "Canonical SIGNAL data contracts"
Cohesion: 0.25
Nodes (7): API and worker invariants, Canonical SIGNAL data contracts, Context and artifacts, Geography, desks and panels, Interpretation and review, Ledger and graph, Sources and locators

### Community 616 - "extract-docling/main.tf"
Cohesion: 0.43
Nodes (7): Terraform module: infrastructure/terraform/modules/extract-docling, google_cloud_run_v2_service.extract_docling, output.url, var.image, var.project_id, var.region, var.service_account

### Community 617 - "extract-graphrag/main.tf"
Cohesion: 0.43
Nodes (7): Terraform module: infrastructure/terraform/modules/extract-graphrag, google_cloud_run_v2_service.extract_graphrag, output.url, var.image, var.project_id, var.region, var.service_account

### Community 618 - "src/app/layout.tsx"
Cohesion: 0.25
Nodes (5): ebGaramond, inter, jetbrainsMono, metadata, viewport

### Community 619 - "extract-ner-gliner/main.tf"
Cohesion: 0.43
Nodes (7): Terraform module: infrastructure/terraform/modules/extract-ner-gliner, google_cloud_run_v2_service.extract_ner_gliner, output.url, var.image, var.project_id, var.region, var.service_account

### Community 620 - "simulate-policy-abm/main.tf"
Cohesion: 0.43
Nodes (7): Terraform module: infrastructure/terraform/modules/simulate-policy-abm, google_cloud_run_v2_service.simulate_policy_abm, output.url, var.image, var.project_id, var.region, var.service_account

### Community 621 - "PRAXIS Conflict Grammar v1.0.0"
Cohesion: 0.25
Nodes (7): Confidence, Confidence Propagation, PRAXIS Conflict Grammar v1.0.0, Provenance, Relationships, The 8 Primitives, Version Policy

### Community 622 - "audit-ai-functionality.ts"
Cohesion: 0.32
Nodes (7): failures, packageJson, read(), requireAnyIncludes(), requireIncludes(), root, warnings

### Community 623 - "audit-capsule-inventory.ts"
Cohesion: 0.32
Nodes (7): activeRaw, archivedLegacyRaw, assert(), read(), requireIncludes(), root, summary

### Community 624 - "audit-design.mjs"
Cohesion: 0.29
Nodes (7): ALLOWED_BUTTON_VARIANTS, main(), ROOT, STRICT, TARGETS, violations, walk()

### Community 625 - "audit-graph-proposal-review-contract.ts"
Cohesion: 0.25
Nodes (7): approveRoute, capsulePlus, failures, graphProposeRoute, graphService, rejectRoute, root

### Community 626 - "PRAXIS Security"
Cohesion: 0.25
Nodes (7): Core Rules, Deeper References, Incident Response, Launch Acceptance Criteria, PRAXIS Security, Review Checklist, Trust Boundary

### Community 627 - "un-terminology.ts"
Cohesion: 0.25
Nodes (4): TERMINOLOGY_MAP, TerminologyCategory, TerminologyEntry, UN_TERMINOLOGY

### Community 628 - "ask-praxis-clean-routing.test.ts"
Cohesion: 0.33
Nodes (5): askToolsSource, chatRouteSource, exaSource, repoRoot, researchGraphSource

### Community 629 - "ical-parser.ts"
Cohesion: 0.39
Nodes (7): fetchICalFeed(), INSTITUTIONAL_FEEDS, ParsedCalendarEvent, parseICal(), parseICalDate(), unescapeICal(), unfold()

### Community 631 - "0022 - Red Team Analyst Subagent"
Cohesion: 0.29
Nodes (6): 0022 - Red Team Analyst Subagent, Alternatives Considered, Consequences, Context, Decision, Status

### Community 632 - "0036 - GCP Production Verification Discipline"
Cohesion: 0.29
Nodes (6): 0036 - GCP Production Verification Discipline, Alternatives considered, Consequences, Context, Decision, Status

### Community 633 - "ADR 0051: TrustGraph as an Optional Derived Context Substrate"
Cohesion: 0.29
Nodes (6): ADR 0051: TrustGraph as an Optional Derived Context Substrate, Consequences, Context, Decision, Implementation Notes, Status

### Community 634 - "Ontology Backend Frontend Map"
Cohesion: 0.40
Nodes (4): Agent-Readable Additions, Backend Specialization Mapping, Core Contract, Ontology Backend Frontend Map

### Community 635 - "DIALECTICA PRAXIS Context Contract"
Cohesion: 0.29
Nodes (6): Context Core Lite, DIALECTICA Future Export, DIALECTICA PRAXIS Context Contract, Mapping Rule, Modes, Product Boundary

### Community 636 - "Dead Surface Inventory"
Cohesion: 0.40
Nodes (4): Component Candidates, Dead Surface Inventory, Deletion Performed, Route Inventory

### Community 637 - "Lane: Cloud And Auth Operations"
Cohesion: 0.29
Nodes (6): Done Evidence, Lane: Cloud And Auth Operations, No-Touch Boundaries, Scope, Start Reads, Validation

### Community 638 - "Lane: Dependencies And Toolchain"
Cohesion: 0.29
Nodes (6): Done Evidence, Lane: Dependencies And Toolchain, No-Touch Boundaries, Scope, Start Reads, Validation

### Community 639 - "Lane: Frontend QA And Product Surface"
Cohesion: 0.29
Nodes (6): Done Evidence, Lane: Frontend QA And Product Surface, No-Touch Boundaries, Scope, Start Reads, Validation

### Community 640 - "Lane: Runtime And Agent Spine"
Cohesion: 0.29
Nodes (6): Done Evidence, Lane: Runtime And Agent Spine, No-Touch Boundaries, Scope, Start Reads, Validation

### Community 641 - "15. COGNITIVE MEMORY MODEL"
Cohesion: 0.29
Nodes (7): 15. COGNITIVE MEMORY MODEL, Episodic memory, Expert-pattern memory, Metacognitive memory, Pragmatic memory, Procedural memory, Semantic memory

### Community 642 - "45. WORKER-SPECIFIC CONTEXT VIEWS"
Cohesion: 0.29
Nodes (7): 45. WORKER-SPECIFIC CONTEXT VIEWS, Domain Specialist receives, Entity Resolver receives, Language Analyst receives, Red Team receives, Researcher receives, Writer receives

### Community 643 - "PRAXIS Context And Policy Chat Diagnostic"
Cohesion: 0.29
Nodes (6): Diagnosis, Implemented In This Pass, Next Improvements To Implement, PRAXIS Context And Policy Chat Diagnostic, Product Principle, Scope

### Community 644 - "PRAXIS Product Documentation Index"
Cohesion: 0.29
Nodes (7): App Spine, Build Queue, Current Canonical Direction, Older Documentation Policy, PRAXIS Product Documentation Index, Read These First, Runtime Spine

### Community 645 - "PRAXIS Simplification + Agentic Kernel Ledger"
Cohesion: 0.29
Nodes (6): Current Checkpoint, Live Verification Targets, Phase Ledger, PRAXIS Simplification + Agentic Kernel Ledger, Required Gate Set, Verification Log - 2026-05-28

### Community 646 - "Codex Cloud alternative"
Cohesion: 0.29
Nodes (6): Account setup, Choose Cloud when it helps, Codex Cloud alternative, First Cloud task, Network and access, Paste this environment preparation request

### Community 647 - "MCP and access: keep the first setup small"
Cohesion: 0.29
Nodes (6): Access checkpoints, Future SIGNAL tools, MCP and access: keep the first setup small, Optional tools, Recommended documentation MCP, Required capabilities

### Community 648 - "SIGNAL build and release progress"
Cohesion: 0.25
Nodes (7): Operational limits and follow-up, Published geographic visualization and feedback refinement, Resume, Safe release receipts, SIGNAL build and release progress, Validation evidence, Verified initial text-pilot release

### Community 649 - "ok"
Cohesion: 0.12
Nodes (18): Latest Validation Checkpoint, Local, Staging, And Production Readiness Matrix, Cognitive Capsule implementation and publication, Corrected published checkpoint, Explicit remaining scope, Final serving release and acceptance, First-pack publication evidence (historical), First-pack verified source (historical) (+10 more)

### Community 650 - "Next 20 Improvements After Capsule Composer"
Cohesion: 0.33
Nodes (5): Acceptance Standard, Batch B: 10 More After That, Guardrails, Next 20 Improvements After Capsule Composer, Recommended Ship Order

### Community 651 - "10. Coalition Detector"
Cohesion: 0.29
Nodes (7): 10. Coalition Detector, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 652 - "11. Commitment Tracker"
Cohesion: 0.29
Nodes (7): 11. Commitment Tracker, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 653 - "12. Memo Drafter"
Cohesion: 0.29
Nodes (7): 12. Memo Drafter, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 654 - "1. Ask PRAXIS"
Cohesion: 0.29
Nodes (7): 1. Ask PRAXIS, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 655 - "2. Context Builder"
Cohesion: 0.29
Nodes (7): 2. Context Builder, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 656 - "3. Grounded Research"
Cohesion: 0.29
Nodes (7): 3. Grounded Research, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 657 - "4. Stakeholder Map"
Cohesion: 0.29
Nodes (7): 4. Stakeholder Map, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 658 - "5. Position vs Interest"
Cohesion: 0.29
Nodes (7): 5. Position vs Interest, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 659 - "6. Scenario Projector"
Cohesion: 0.29
Nodes (7): 6. Scenario Projector, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 660 - "7. Analysis of Competing Hypotheses"
Cohesion: 0.29
Nodes (7): 7. Analysis of Competing Hypotheses, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 661 - "8. Contradiction Finder"
Cohesion: 0.29
Nodes (7): 8. Contradiction Finder, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 662 - "9. Frame Narrative"
Cohesion: 0.29
Nodes (7): 9. Frame Narrative, Cores it needs, Frameworks, Limits, Methodology, Output, What it does

### Community 663 - "sweep/route.ts"
Cohesion: 0.50
Nodes (4): maxDuration, POST(), runtime, sweepSignalWatches()

### Community 664 - "audit-architecture-chain.ts"
Cohesion: 0.29
Nodes (6): alignment, architecture, coreGate, failures, packageJson, root

### Community 665 - "audit-named-stack-contract.ts"
Cohesion: 0.29
Nodes (6): attachRoute, capsuleRoute, capsuleService, failures, root, stackRoute

### Community 666 - "audit-orchestrator-writes.ts"
Cohesion: 0.29
Nodes (6): files, markers, missingMarkers, root, source, textParts

### Community 667 - "AskTurnPlanPanel.tsx"
Cohesion: 0.80
Nodes (4): AskTurnPlanPanel(), continuationActionForTurnPlan(), formatPlanToken(), PlanChip()

### Community 668 - "audit-substrate-writers.ts"
Cohesion: 0.29
Nodes (6): files, markers, missingFiles, missingMarkers, root, source

### Community 669 - "audit-workspace-tabs-chapters.ts"
Cohesion: 0.29
Nodes (6): files, markers, missingFiles, missingMarkers, root, source

### Community 670 - "Red Team Analyst"
Cohesion: 0.29
Nodes (6): Evaluation, Guardrails, Inputs, Outputs, Purpose, Red Team Analyst

### Community 671 - "cypher/route.ts"
Cohesion: 0.57
Nodes (4): POST, CypherValidationResult, tenantScopeCypher(), validateReadOnlyCypher()

### Community 672 - "PRAXIS v3 Surface Classification"
Cohesion: 0.29
Nodes (6): Current Primary Nav Classification, Demo Route Decision, PRAXIS v3 Surface Classification, Purpose, Tool Capsule Gallery V1, v3 Label Mapping

### Community 673 - "PRAXIS Model Selection"
Cohesion: 0.33
Nodes (5): Current Posture, Pack 15 Decisions, PRAXIS Model Selection, Source Of Truth, Task Kinds

### Community 674 - "slash-commands.ts"
Cohesion: 0.29
Nodes (4): AskMode, AskSlashCommand, COMMANDS, ParsedAskCommand

### Community 675 - "[3.7.0] — 2026-03-29"
Cohesion: 0.50
Nodes (4): [3.7.0] — 2026-03-29, Added, Fixed, Removed

### Community 676 - "search-query.ts"
Cohesion: 0.52
Nodes (5): buildAdvancedMediaSearchQuery(), buildSituationMediaKeywords(), cleanToken(), MediaSearchQueryInput, quote()

### Community 677 - "[3.9.6] — 2026-03-30"
Cohesion: 0.67
Nodes (3): [3.9.6] — 2026-03-30, Changed, Fixed

### Community 678 - "ask-context-bar-contract.test.ts"
Cohesion: 0.29
Nodes (6): askContextBarPath, chatShellPath, floatingPraxisPath, inlineBuilderPath, praxisChatPath, root

### Community 679 - "deletion.ts"
Cohesion: 0.25
Nodes (9): deleteSignalDesk(), isDeskGeneratedCapsule(), revokeSignalSnapshotExports(), Collection, Data, harness, Ref, Snap (+1 more)

### Community 680 - "[Unreleased] — 2026-04-25 (first session)"
Cohesion: 0.33
Nodes (6): Changed, Changed (public pricing surface — credit metering hidden), Fixed, Known Remaining Work, [Unreleased] — 2026-04-25 (first session), Validation

### Community 681 - "signal/README.md"
Cohesion: 0.09
Nodes (19): Further geographic improvements, Geographic coverage contract, Private feedback workflow, Release and task evidence, SIGNAL improvement backlog, Founder measurements, Release operator, Remaining risk ownership (+11 more)

### Community 682 - "Contributing to PRAXIS"
Cohesion: 0.33
Nodes (5): Commit style, Contributing to PRAXIS, Local quickstart, Validation gate (run before every PR), Working on the codebase

### Community 683 - "Deep Research Route Consolidation"
Cohesion: 0.33
Nodes (5): Decision, Deep Research Route Consolidation, Deep research vs deep search agent, Deprecation Strategy, Guardrail

### Community 684 - "backfill-capsule-graph-stats.ts"
Cohesion: 0.40
Nodes (5): BackfillArgs, BackfillCapsuleDoc, BackfillRow, main(), parseArgs()

### Community 685 - "Capsule Quality Ranking"
Cohesion: 0.33
Nodes (5): Capsule Quality Ranking, Review Proposal Target Counts, Use, Weakest 20, Weakest Signal Counts

### Community 686 - "7. EXPERTISE / TACIT KNOWLEDGE GRAPH"
Cohesion: 0.33
Nodes (6): 7.1 Cue, 7.2 Distinction, 7.3 Heuristic, 7.4 Pattern, 7.5 Red Flag, 7. EXPERTISE / TACIT KNOWLEDGE GRAPH

### Community 687 - "PRAXIS capsule and homepage implementation checkpoint"
Cohesion: 0.33
Nodes (5): Delivered locally, Method references, PRAXIS capsule and homepage implementation checkpoint, Still required before release / sale, Verification

### Community 688 - "Agent Engine Incident"
Cohesion: 0.33
Nodes (5): Agent Engine Incident, Escalation, Mitigation, Signals, Triage

### Community 689 - "AI Provider Health"
Cohesion: 0.33
Nodes (5): AI Provider Health, Escalation, Mitigation, Signals, Triage

### Community 690 - "Canary Rollback"
Cohesion: 0.33
Nodes (5): Canary Rollback, Escalation, Mitigation, Signals, Triage

### Community 691 - "Cloud SQL Failover"
Cohesion: 0.33
Nodes (5): Cloud SQL Failover, Escalation, Mitigation, Signals, Triage

### Community 692 - "Local cognitive capsule packages and PRAXIS CLI"
Cohesion: 0.33
Nodes (5): Existing PRAXIS API commands, Integrity and resource limits, Local cognitive capsule packages and PRAXIS CLI, Local commands, Private local registry

### Community 693 - "Dashboards"
Cohesion: 0.33
Nodes (5): Dashboards, Escalation, Mitigation, Signals, Triage

### Community 694 - "Databricks TACITUS Analytics Runbook"
Cohesion: 0.33
Nodes (5): Databricks TACITUS Analytics Runbook, DIALECTICA Boundary, First Proof, Local Profile, PRAXIS Boundary

### Community 695 - "Disposable Firebase Golden-Path User"
Cohesion: 0.33
Nodes (5): Add GitHub Actions Secrets, Create Or Rotate The User, Disposable Firebase Golden-Path User, Rotation And Incident Response, Validate

### Community 696 - "Firestore Rules Incident"
Cohesion: 0.33
Nodes (5): Escalation, Firestore Rules Incident, Mitigation, Signals, Triage

### Community 697 - "Identity Platform Incident"
Cohesion: 0.33
Nodes (5): Escalation, Identity Platform Incident, Mitigation, Signals, Triage

### Community 698 - "Incident Response"
Cohesion: 0.33
Nodes (5): Escalation, Incident Response, Mitigation, Signals, Triage

### Community 699 - "Load Handling"
Cohesion: 0.33
Nodes (5): Escalation, Load Handling, Mitigation, Signals, Triage

### Community 700 - "PGVector Index Rebuild"
Cohesion: 0.33
Nodes (5): Escalation, Mitigation, PGVector Index Rebuild, Signals, Triage

### Community 701 - "Postgres Operations"
Cohesion: 0.33
Nodes (5): Connection Posture, Incident Response, Maintenance, Migration, Postgres Operations

### Community 702 - "Scheduler Job Failure"
Cohesion: 0.33
Nodes (5): Escalation, Mitigation, Scheduler Job Failure, Signals, Triage

### Community 703 - "Secret Rotation"
Cohesion: 0.33
Nodes (5): Escalation, Mitigation, Secret Rotation, Signals, Triage

### Community 704 - "Storage Recovery"
Cohesion: 0.33
Nodes (5): Escalation, Mitigation, Signals, Storage Recovery, Triage

### Community 705 - "Subagent Rollback"
Cohesion: 0.33
Nodes (5): Escalation, Mitigation, Signals, Subagent Rollback, Triage

### Community 706 - "Terraform Operations"
Cohesion: 0.33
Nodes (5): Escalation, Mitigation, Signals, Terraform Operations, Triage

### Community 707 - "Acceptance gates and evidence"
Cohesion: 0.33
Nodes (5): Acceptance gates and evidence, Evaluation target, Evidence recording, Minimum complete journey, Required production behavior

### Community 708 - "Global source-pack design"
Cohesion: 0.33
Nodes (5): Collector defaults, Geography and aliases, Global source-pack design, Pack maturity, Source-pack fields

### Community 709 - "PRAXIS Attachable Tool Contract"
Cohesion: 0.33
Nodes (5): Core Kinds, Output Kinds, PRAXIS Attachable Tool Contract, Render Targets, Rule

### Community 710 - "audit-agentic-search-proof.ts"
Cohesion: 0.33
Nodes (5): Check, checks, failures, orchestrator, root

### Community 711 - "audit-ask-same-window-contract.ts"
Cohesion: 0.47
Nodes (5): failures, read(), requireExcludes(), requireIncludes(), root

### Community 712 - "audit-next-moves.ts"
Cohesion: 0.33
Nodes (4): CONSUMERS, failures, root, src

### Community 713 - "audit-purpose-surface.ts"
Cohesion: 0.33
Nodes (4): failures, memoDesk, root, workbench

### Community 714 - "audit-research-graph.ts"
Cohesion: 0.40
Nodes (5): checkFile(), failures, read(), researchGraphSource, root

### Community 715 - "canary-monitor.ts"
Cohesion: 0.47
Nodes (5): arg(), CanaryPhase, main(), percentile(), Sample

### Community 716 - "client.ts"
Cohesion: 0.47
Nodes (5): ClientFeatureFlags, DEFAULT_FEATURES, normalizeFeatures(), useCogneeEnabled(), useFeatureFlags()

### Community 717 - "evidence-summary.ts"
Cohesion: 0.47
Nodes (4): ConfidenceVote, EvidenceConfidence, normalizeEvidenceConfidence(), rollupConfidence()

### Community 718 - "tool-data-shapes.test.ts"
Cohesion: 0.33
Nodes (5): ActorSeedSchema, GraphSeedSchema, RiskSeedSchema, StakeholderSeedSchema, TimelineEventSchema

### Community 719 - "truth-layers.ts"
Cohesion: 0.33
Nodes (3): ProvenanceRef, TruthLayer, TruthLayerNode

### Community 720 - "agent_context.md"
Cohesion: 0.33
Nodes (5): CONTRACT, FACTS BY TRUST, OPEN QUESTIONS, REASONING SCAFFOLD, SITUATION FRAME

### Community 721 - "context-capsule-spans-route.test.ts"
Cohesion: 0.33
Nodes (3): bumpCapsuleVersion, getCapsule, setSpan

### Community 722 - "[Unreleased] — 2026-04-25 (seventh session — deploy hardening)"
Cohesion: 0.40
Nodes (5): Context and persistence hardening, Fixed, Improved, [Unreleased] — 2026-04-25 (seventh session — deploy hardening), Verified

### Community 724 - "ADR 0049: Cognee Memory Layer Disabled-First"
Cohesion: 0.40
Nodes (4): ADR 0049: Cognee Memory Layer Disabled-First, Consequences, Context, Decision

### Community 725 - "ADR 0050: Context Capsule Unified Schema"
Cohesion: 0.40
Nodes (4): ADR 0050: Context Capsule Unified Schema, Consequences, Context, Decision

### Community 726 - "Conflict Data Sources"
Cohesion: 0.40
Nodes (4): Active Baseline, Conflict Data Sources, Pack 30 Extraction Policy, Retired Active Sources

### Community 727 - "Cost Notes"
Cohesion: 0.40
Nodes (4): Cost Notes, Large Scale, Medium Scale, Small Scale

### Community 728 - "PRAXIS Launch Readiness Audit"
Cohesion: 0.40
Nodes (4): Checks, Failures, PRAXIS Launch Readiness Audit, Warnings

### Community 729 - "Codex Orchestration Playbook"
Cohesion: 0.40
Nodes (4): Codex Orchestration Playbook, Five Patterns, Handoff Format, PRAXIS Gates

### Community 730 - "PRAXIS Product Health Dashboard"
Cohesion: 0.40
Nodes (4): Current Gate, Interpretation, PRAXIS Product Health Dashboard, Required Tiles

### Community 731 - "PRAXIS Technical Specification"
Cohesion: 0.40
Nodes (4): Non-Negotiable Contracts, Phase Gates, PRAXIS Technical Specification, Source Documents

### Community 732 - "1. PRODUCT NORTH STAR"
Cohesion: 0.40
Nodes (5): 1.1 DIALECTICA, 1.2 Capsule Library / Registry, 1.3 PRAXIS, 1.4 Agent Runtime, 1. PRODUCT NORTH STAR

### Community 733 - "PRAXIS user readiness — 2026-09-30"
Cohesion: 0.40
Nodes (5): Current verdict, Final local verification, Limits and further evidence, PRAXIS user readiness — 2026-09-30, Reviewed implementation

### Community 734 - "OpenSanctions Data Licensing"
Cohesion: 0.40
Nodes (4): Commercial Production, Development And Evaluation, Engineering Boundary, OpenSanctions Data Licensing

### Community 736 - "Runtime template - extract what the source says"
Cohesion: 0.40
Nodes (4): Application inputs, Instruction, Runtime template - extract what the source says, Validation after response

### Community 739 - "kpis.sql"
Cohesion: 0.60
Nodes (3): `praxis_telemetry.kpis_daily`, `praxis_telemetry.route_health_daily`, `praxis_telemetry.tool_health_daily`

### Community 740 - "sanctions-opensearch/main.tf"
Cohesion: 0.40
Nodes (4): Terraform module: infrastructure/terraform/modules/sanctions-opensearch, output.deployment_note, var.project_id, var.region

### Community 741 - "audit-agent-process-contract.ts"
Cohesion: 0.50
Nodes (4): failures, read(), requireIncludes(), root

### Community 742 - "audit-ai-routes.mjs"
Cohesion: 0.40
Nodes (4): EXEMPT, fails, files, walk()

### Community 743 - "audit-architecture-reference.ts"
Cohesion: 0.40
Nodes (3): failures, requiredFiles, root

### Community 744 - "audit-ask-cockpit-runtime.ts"
Cohesion: 0.50
Nodes (4): expectIncludes(), failures, read(), root

### Community 745 - "audit-capsule-memory-contract.ts"
Cohesion: 0.50
Nodes (4): failures, read(), requireIncludes(), root

### Community 746 - "audit-capsule-v3.ts"
Cohesion: 0.50
Nodes (4): failures, read(), requireIncludes(), root

### Community 747 - "audit-knowledge-library-contract.ts"
Cohesion: 0.50
Nodes (4): failures, read(), requireIncludes(), root

### Community 748 - "audit-output-capsule-storage.ts"
Cohesion: 0.50
Nodes (4): failures, read(), requireIncludes(), root

### Community 749 - "features/route.ts"
Cohesion: 0.40
Nodes (3): dynamic, FeatureFlags, FeatureFlagState

### Community 750 - "opengraph-image.tsx"
Cohesion: 0.40
Nodes (3): alt, contentType, size

### Community 752 - "analytical-methods.ts"
Cohesion: 0.50
Nodes (4): AnalyticalMethod, applyAnalyticalMethod(), METHODS, CapsuleStarterSource

### Community 753 - "capsule-cores.ts"
Cohesion: 0.40
Nodes (4): CAPSULE_CORE_BY_KEY, CAPSULE_CORES, CapsuleCoreDef, CapsuleCoreKey

### Community 754 - "aco-copy.ts"
Cohesion: 0.40
Nodes (4): ACO_COPY, ACO_THESIS_COPY, ACO_WORKED_EXAMPLE, AcoEntityCopy

### Community 760 - "[Unreleased] — 2026-04-25 (fourth session — playbook + vision + cleanup)"
Cohesion: 0.50
Nodes (4): Added, Changed, Removed, [Unreleased] — 2026-04-25 (fourth session — playbook + vision + cleanup)

### Community 762 - "PRAXIS Architecture Decision Records"
Cohesion: 0.50
Nodes (3): Current ADR Set, Format, PRAXIS Architecture Decision Records

### Community 763 - "Postgres Knowledge Graph Schema"
Cohesion: 0.50
Nodes (3): Invariants, Postgres Knowledge Graph Schema, Tables

### Community 764 - "PRAXIS Agentic Research Eval"
Cohesion: 0.50
Nodes (3): Fixed Scenarios, Notes, PRAXIS Agentic Research Eval

### Community 765 - "PRAXIS Agentic Research Eval"
Cohesion: 0.50
Nodes (3): Fixed Scenarios, Notes, PRAXIS Agentic Research Eval

### Community 766 - "PRAXIS Agentic Research Eval"
Cohesion: 0.50
Nodes (3): Fixed Scenarios, Notes, PRAXIS Agentic Research Eval

### Community 767 - "PRAXIS Agentic Research Eval"
Cohesion: 0.50
Nodes (3): Fixed Scenarios, Notes, PRAXIS Agentic Research Eval

### Community 768 - "PRAXIS Agentic Research Eval"
Cohesion: 0.50
Nodes (3): Fixed Scenarios, Notes, PRAXIS Agentic Research Eval

### Community 769 - "Capsule Depth Audit"
Cohesion: 0.50
Nodes (3): Capsule Depth Audit, Coverage, Failures

### Community 770 - "PRAXIS Canary Log"
Cohesion: 0.50
Nodes (3): Phase Template, PRAXIS Canary Log, Rollback Rule

### Community 771 - "PRAXIS Load Test Scaffold"
Cohesion: 0.50
Nodes (3): Commands, PRAXIS Load Test Scaffold, Required v1.0 Reports

### Community 772 - "anchorStatus"
Cohesion: 0.50
Nodes (4): default, enum, type, anchorStatus

### Community 773 - "assertedBy"
Cohesion: 0.50
Nodes (4): maxLength, minLength, type, assertedBy

### Community 774 - "citationId"
Cohesion: 0.50
Nodes (4): maxLength, minLength, type, citationId

### Community 775 - "documentId"
Cohesion: 0.50
Nodes (4): maxLength, minLength, type, documentId

### Community 776 - "end"
Cohesion: 0.50
Nodes (4): maximum, minimum, type, end

### Community 777 - "id"
Cohesion: 0.50
Nodes (4): maxLength, minLength, type, id

### Community 778 - "label"
Cohesion: 0.50
Nodes (4): maxLength, minLength, type, label

### Community 779 - "page"
Cohesion: 0.50
Nodes (4): exclusiveMinimum, maximum, type, page

### Community 780 - "predicate"
Cohesion: 0.50
Nodes (4): maxLength, minLength, type, predicate

### Community 781 - "quote"
Cohesion: 0.50
Nodes (4): quote, maxLength, minLength, type

### Community 782 - "rationaleRef"
Cohesion: 0.50
Nodes (4): rationaleRef, maxLength, minLength, type

### Community 783 - "reviewState"
Cohesion: 0.50
Nodes (4): reviewState, default, enum, type

### Community 784 - "sourceVersion"
Cohesion: 0.50
Nodes (4): sourceVersion, maxLength, minLength, type

### Community 785 - "speechAct"
Cohesion: 0.50
Nodes (4): speechAct, maxLength, minLength, type

### Community 786 - "stance"
Cohesion: 0.50
Nodes (4): stance, default, enum, type

### Community 787 - "start"
Cohesion: 0.50
Nodes (4): start, maximum, minimum, type

### Community 788 - "strength"
Cohesion: 0.50
Nodes (4): strength, maxLength, minLength, type

### Community 789 - "subject"
Cohesion: 0.50
Nodes (4): subject, maxLength, minLength, type

### Community 790 - "type"
Cohesion: 0.50
Nodes (4): type, maxLength, minLength, type

### Community 791 - "wordingRef"
Cohesion: 0.50
Nodes (4): wordingRef, maxLength, minLength, type

### Community 795 - "redactMarketplaceFoundationJson"
Cohesion: 0.67
Nodes (3): FOUNDATION_MARKERS, redactMarketplaceFoundationJson(), redactMarketplaceFoundationMarkers()

### Community 797 - "draft-export.ts"
Cohesion: 0.67
Nodes (3): DraftExportInput, DraftExportRecord, DraftExportSchema

### Community 827 - "[3.5.0] — 2026-03-26"
Cohesion: 0.67
Nodes (3): [3.5.0] — 2026-03-26, Added, Changed

### Community 828 - "[3.7.1] — 2026-03-29"
Cohesion: 0.67
Nodes (3): [3.7.1] — 2026-03-29, Added, Audited

### Community 831 - "[3.9.7] — 2026-03-30"
Cohesion: 0.67
Nodes (3): [3.9.7] — 2026-03-30, Added, Fixed

### Community 832 - "[5.1.0] — 2026-04-01"
Cohesion: 0.67
Nodes (3): [5.1.0] — 2026-04-01, Added, Changed

### Community 833 - "[Unreleased] — 2026-04-25 (third session)"
Cohesion: 0.67
Nodes (3): Added, Changed, [Unreleased] — 2026-04-25 (third session)

### Community 836 - "[Unreleased] — 2026-04-26 (eighth session — workspace personalization)"
Cohesion: 0.67
Nodes (3): Improved, Tests, [Unreleased] — 2026-04-26 (eighth session — workspace personalization)

### Community 840 - "19. CAPSULE STUDIO MODES"
Cohesion: 0.67
Nodes (3): 19. CAPSULE STUDIO MODES, Mode A — Start from sources, Mode B — Interview an expert

### Community 846 - "language"
Cohesion: 0.67
Nodes (3): maxLength, type, language

### Community 847 - "layer"
Cohesion: 0.67
Nodes (3): enum, type, layer

### Community 848 - "name"
Cohesion: 0.67
Nodes (3): pattern, type, name

### Community 849 - "prefix"
Cohesion: 0.67
Nodes (3): maxLength, type, prefix

### Community 850 - "quoteHash"
Cohesion: 0.67
Nodes (3): quoteHash, maxLength, type

### Community 851 - "uri"
Cohesion: 0.67
Nodes (3): uri, maxLength, type

### Community 852 - "validFrom"
Cohesion: 0.67
Nodes (3): validFrom, pattern, type

### Community 854 - "run-agent.ts"
Cohesion: 0.07
Nodes (32): Lane C — Brainstorming Table MVP (NEW), Lane N — Ask PRAXIS wired to the shared corpus retriever, Batch A: 10 More Improvements, BriefBuilderSchema, BriefSectionSchema, DecisionPointSchema, DEMO_BRIEF, maxDuration (+24 more)

### Community 855 - "PRAXIS production acceptance — 2026-09-30"
Cohesion: 0.40
Nodes (5): Documentation and continuation, Live user acceptance, PRAXIS production acceptance — 2026-09-30, Product and quality boundaries, Release and evidence scope

### Community 952 - "builder/page.tsx"
Cohesion: 0.60
Nodes (4): CapsuleBuilderLoadingSkeleton(), CapsuleBuilderPage(), CapsuleBuilderWizard, dynamic

### Community 954 - "PRAXIS optional backend agent integrations"
Cohesion: 0.50
Nodes (4): Current boundaries, Files under backend/agents/, PRAXIS optional backend agent integrations, Validate and deploy an optional integration

### Community 960 - "PRAXIS Documentation Map"
Cohesion: 0.50
Nodes (4): Current Entrypoints, Current Product Truth, Documentation Hygiene, PRAXIS Documentation Map

### Community 962 - "[3.8.0] — 2026-03-29"
Cohesion: 0.67
Nodes (3): [3.8.0] — 2026-03-29, Added, Changed

### Community 965 - "[4.2.0] — 2026-03-31"
Cohesion: 0.67
Nodes (3): [4.2.0] — 2026-03-31, Added, Changed

## Knowledge Gaps
- **7238 isolated node(s):** `SignalWorldResearchOutputSchema`, `SignalWorldResearchInput`, `gateway`, `input`, `observation` (+7233 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 8829 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **150 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `next`, `saveToolOutput`, `tasklet-praxis-workbench.tsx`, `context-capsules.ts`, `capsule-v3.ts`, `situation-initializer.ts`, `worker.ts`, `ontology/registry.ts`, `auth-context.tsx`, `capsule-workbench-view-model.ts`, `cn`, `signal/domain.ts`, `path/types.ts`, `ai/chat/route.ts`, `react`, `world-service.ts`, `cognitive-capsule/service.ts`, `getCapsule`, `types/domain.ts`, `sources-preference.ts`, `library.ts`, `analyst-notes.ts`, `CapsuleExpertisePanel.tsx`, `ask-context-readiness.test.tsx`, `futurist-ai-lab-contract.test.ts`, `praxis-chat.tsx`, `evidence-pack.ts`, `praxis-doctor.ts`, `agent-runtime/postgres.ts`, `cognitive-capsule/evaluation.ts`, `agent-runtime/types.ts`, `CapsuleWorkbenchPanel.tsx`, `ask-answer-envelope.ts`, `CapsuleGraphViewer.tsx`, `ref_node_crypto`, `output-review.ts`, `user-keys.ts`, `specialists.ts`, `runtime-data-plane.ts`, `model-runtime-policy.ts`, `blackboard/index.ts`, `cognitive-capsule/schema.ts`, `capsule-plus/index.ts`, `capsule-closed-loop-learning.ts`, `profile-weighted-retrieval.ts`, `capsule-factory-route-consolidation.test.ts`, `CapsuleBuilderWizard.tsx`, `profile-events.ts`, `onboarding-return.test.tsx`, `profile-context.ts`, `handover-package/route.ts`, `runtime.ts`, `marketing-home-contract.test.ts`, `CapsuleReviewQueueSection.test.tsx`, `assistant/next-moves.ts`, `active-context-stack.ts`, `AskQueuedAgentRunPanel.tsx`, `CapsuleLibraryCard.tsx`, `model-matrix.ts`, `from-ask-pack/route.ts`, `capsule-details-service.ts`, `knowledge/context-engine.ts`, `capsule-quality-ranking.ts`, `audit-route-cleanup-map.ts`, `context-capsule-cognitive-assist-route.test.ts`, `getModel`, `feed-aggregator.ts`, `CapsuleBuilderWizard.test.tsx`, `postgres-sweep.test.ts`, `context-builder-plan.ts`, `research-graph/index.ts`, `context-injection.ts`, `ask-orchestrator.ts`, `ActiveContextStackState`, `chat-pinned-evidence.test.ts`, `signal-workspace.tsx`, `memo-service.ts`, `AskWorkspacePage.tsx`, `draft-assembly-state.ts`, `library-service.ts`, `agent-runtime/tool-registry.ts`, `context-snapshot.ts`, `flows/capsule-factory.ts`, `work-intent-router.ts`, `polar-webhook.ts`, `ask-praxis-clean-routing.test.ts`, `useAgentRunSnapshots.ts`, `context/capsules/route.ts`, `documents-service.ts`, `analyst-profile-admin.ts`, `agents/registry.ts`, `deep-search-agent/route.ts`, `agent-context-verifier.ts`, `ask-context-bar.tsx`, `temporal-timeline.ts`, `audit-agent-runtime-proof.ts`, `config.ts`, `case-scaffold.ts`, `with-credits.ts`, `coverage-globe.ts`, `Skeleton`, `capsule-schema.ts`, `context.ts`, `upload/route.ts`, `situations/route.ts`, `capsule-quality.ts`, `sourcing.ts`, `agent-context-packet.ts`, `turns/route.ts`, `memo-checks.ts`, `cognitive-capsule/types.ts`, `knowledge/index.ts`, `capsule-version-resolution.ts`, `AnswerSourcesPanel.tsx`, `conflict-grammar.ts`, `dialectica/route.ts`, `capsule-quality-review.ts`, `cypher/route.ts`, `marketplace/registry.ts`, `search-query.ts`, `ask-context-bar-contract.test.ts`, `deletion.ts`, `emit.ts`, `app-search.ts`, `capsule-gate.ts`, `graphops.ts`, `case-module.ts`, `flows/sourceability.ts`, `memoArtifactFromMemoPayload`, `hosted-registry.ts`, `schemas/context-capsule.ts`, `one-click-context-builder.tsx`, `proof-summary.ts`, `trustgraph-contract.ts`, `analyst-profile.ts`, `memo-handover-preview.test.tsx`, `shared-contracts.ts`, `consolidated-tools.ts`, `web-research.ts`, `graph-views.ts`, `with-firewall.ts`, `output-capsules.test.ts`, `evidence-summary.ts`, `tool-data-shapes.test.ts`, `corpus-search.ts`, `tasklet-workbench-conversation.ts`, `context-capsule-spans-route.test.ts`, `ladybug-projection.ts`, `trust-posture.ts`, `reasoning-loop.ts`, `sourceability-request.ts`, `federated-app-search.ts`, `world-research.ts`, `checkout/route.ts`, `capsules/storage.ts`, `flows/classify-path.ts`, `admin-gate.ts`, `praxis-chat-onboarding-recovery-contract.test.ts`, `agent-runtime/schema.ts`, `agent-packet/route.ts`, `capsule-service.test.ts`, `tasklet-workbench-contract.test.ts`, `situation-context-health.ts`, `audit-tasklet-mvp-foundation.ts`, `boardroom/schema.ts`, `tool-context-blueprints.ts`, `resolveCapsuleTaxonomy`, `tool-package-readiness.ts`, `instrument-visual-contract.test.ts`, `agentic-search-health.ts`, `runtime-health.ts`, `v3-surface-classification.ts`, `preferences.ts`, `capsules/resolve.ts`, `capsule-architect.ts`, `evidence-review.ts`, `evaluate-policy-narrative-quality.ts`, `tool-path-taxonomy.ts`, `clarifying-questions.ts`, `genkit/index.ts`, `audit-launch-readiness.ts`, `dry-run-eval.ts`, `PraxisCapsule`, `context-aware.ts`, `admin.ts`, `capsule-factory-flow.test.ts`, `drafting/export.ts`, `context-capsules.test.ts`, `AskAnswerEnvelope`, `memos-id-route.test.ts`, `marketplace/run/route.ts`, `google-agent-platform/readiness.ts`, `audit-public-surface.ts`, `dialectica-capsule-idempotency.test.ts`, `ref_node_child_process`, `capability-registry.ts`, `nodes/route.ts`, `context-kernel.test.ts`, `graphlite-contract.ts`, `capsule-list-picker.test.tsx`, `memory-layer.ts`, `source-receipt-normalizer.ts`, `changes/route.ts`, `login/page.tsx`, `adk-bridge.ts`, `runner.ts`, `capsule-architect-service.test.ts`, `parseDataStreamError`, `research-eval.ts`, `google-agent-platform-cloud-check.ts`, `next-moves/route.ts`, `postgres-execution.test.ts`, `run-agent.ts`, `readiness/route.ts`, `context-capsule-source-gap-promotion-route.test.ts`, `RetrievalOrchestrator`, `context-enrichment-adapter.test.ts`, `CapsuleAgentView.tsx`, `signal/evaluation.ts`, `[...slug]/route.ts`, `situation-intelligence/route.ts`, `app-red-flags.ts`, `output-capsules/storage.ts`, `conversations-isolation.test.ts`, `core-library.test.ts`, `FakeCollection`, `constants/tool-registry.ts`, `pricing/page.tsx`, `getAdminDbOrThrow`, `AgentsWorkingStrip.tsx`, `writer/ask/route.ts`, `package.json`, `grounding-metadata.ts`, `collectors.ts`, `docx`, `pricing.ts`, `capsule-suggestions.ts`, `tasklet-style-runtime.ts`, `document-postgres.ts`, `instant-context.ts`, `export-docx/route.ts`, `provenance-graph.ts`, `rationale.ts`, `exa-agentic-search.ts`, `dialectica-backbone.ts`, `capsules.ts`, `human-review-panel.test.tsx`, `audit-runner.test.ts`, `deploy-firebase-rules.mjs`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `handleRouteError()` (e.g. with `Fixed` and `What I Reviewed`) actually correct?**
  _`handleRouteError()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SignalWorldResearchOutputSchema`, `SignalWorldResearchInput`, `gateway` to the rest of the system?**
  _7238 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.014437417969216083 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `saveToolOutput`, `tasklet-praxis-workbench.tsx`, `ContextBuilderRoom.tsx`, `situation-initializer.ts`, `auth-context.tsx`, `cn`, `signal/domain.ts`, `path/types.ts`, `react`, `world-service.ts`, `cognitive-capsule/service.ts`, `CapsuleExpertisePanel.tsx`, `library.ts`, `AskStreamPanel.tsx`, `praxis-chat.tsx`, `agent-runtime/postgres.ts`, `agent-runtime/types.ts`, `CapsuleWorkbenchPanel.tsx`, `CapsuleGraphViewer.tsx`, `output-review.ts`, `user-keys.ts`, `signal/schema.ts`, `account-settings-page.tsx`, `capsule-plus/index.ts`, `capsule-factory-route-consolidation.test.ts`, `CapsuleBuilderWizard.tsx`, `profile-events.ts`, `onboarding-return.test.tsx`, `handover-package/route.ts`, `active-context-stack.ts`, `AskQueuedAgentRunPanel.tsx`, `src/app/page.tsx`, `from-ask-pack/route.ts`, `capsule-details-service.ts`, `knowledge/context-engine.ts`, `getModel`, `feed-aggregator.ts`, `boardroom-workspace.tsx`, `ask-orchestrator.ts`, `signal-workspace.tsx`, `memo-service.ts`, `AskWorkspacePage.tsx`, `graph-updates-service.ts`, `[token]/route.ts`, `library-service.ts`, `situations.ts`, `src/app/layout.tsx`, `polar-webhook.ts`, `useAgentRunSnapshots.ts`, `context/capsules/route.ts`, `documents-service.ts`, `analyst-profile-admin.ts`, `ask-context-bar.tsx`, `config.ts`, `with-credits.ts`, `coverage-globe.ts`, `Skeleton`, `upload/route.ts`, `situations/route.ts`, `turns/route.ts`, `sweep/route.ts`, `capsule-version-resolution.ts`, `dialectica/route.ts`, `cypher/route.ts`, `Cleanup & Infra Implementation Plan`, `emit.ts`, `app-search.ts`, `case-module.ts`, `flows/sourceability.ts`, `hosted-registry.ts`, `notifications.tsx`, `analyst-profile.ts`, `web-research.ts`, `trust-posture.ts`, `world-research.ts`, `checkout/route.ts`, `admin-gate.ts`, `agent-runtime/schema.ts`, `agent-packet/route.ts`, `capsule-service.test.ts`, `graph-populate.ts`, `audit-tasklet-mvp-foundation.ts`, `features/route.ts`, `tool-context-blueprints.ts`, `opengraph-image.tsx`, `agentic-search-health.ts`, `runtime-health.ts`, `preferences.ts`, `dry-run-eval.ts`, `PraxisCapsule`, `admin.ts`, `drafting/export.ts`, `sync-ecc-to-codex.mjs`, `marketplace/run/route.ts`, `nodes/route.ts`, `diff/route.ts`, `changes/route.ts`, `login/page.tsx`, `prompt-health.ts`, `next-moves/route.ts`, `run-agent.ts`, `readiness/route.ts`, `[...slug]/route.ts`, `open-questions-store.ts`, `fix-this-first-panel.tsx`, `situation-intelligence/route.ts`, `pricing/page.tsx`, `getAdminDbOrThrow`, `AgentsWorkingStrip.tsx`, `writer/ask/route.ts`, `package.json`, `docx`, `export-docx/route.ts`, `builder/page.tsx`, `memos/search/route.ts`, `recent-policy-work-page.tsx`, `drafting-action/route.ts`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `TaskletPraxisWorkbench()` (e.g. with `Product Surface Doctrine` and `Executive Contract`) actually correct?**
  _`TaskletPraxisWorkbench()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Should `saveToolOutput` be split into smaller, more focused modules?**
  _Cohesion score 0.028261711188540456 - nodes in this community are weakly interconnected._

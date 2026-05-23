# Featured Expert Picks V2, Cognee, and Embedded Graph Plan

Date: 2026-05-23
Status: First implementation slice started
Owner: PRAXIS capsule and context system

## Purpose

Make Featured Expert Picks feel like real policy work kits, not a shelf of attractive starter cards. A v2 pick should help a real person do a real job: frame a situation, attach sources, choose a thinking device, generate a reviewable output, and leave behind an inspectable graph and memory trail. It must stay inside the existing Ask PRAXIS and capsule repository surfaces.

This plan also starts the Cognee and embedded graph implementation safely:

- Firestore ContextCapsules remain canonical.
- Cognee remains optional, disabled-first, and advisory.
- Embedded graph rows are Postgres-first review proposals, not automatic facts.
- Dynamic ontologies are capsule-specific overlays and review hints, not agent-mutated ontology files.

## Current Repo Baseline

As of this pass, `main` already contains a strong capsule foundation:

- `src/lib/product/context-capsules.ts` has `CAPSULE_STARTER_CATALOG_VERSION = '2026-05-22-real-work-capsules-v9'`.
- The catalog contains 169 starter capsules with categories across situation, tool, output, and user roles.
- `realWorkStarter(...)` already gives v2 capsules source packs, human review gates, real-work user jobs, Cognee caution, graph/SQL proposal language, and no-affiliation disclaimers.
- `src/components/praxis/tasklet-praxis-workbench.tsx` already renders compact Ask capsule suggestions, a full capsule inspector sheet, Featured Expert Picks, intellectual device picks, and repository grid behavior.
- `src/lib/capsule-plus/index.ts` already defines `CAPSULE_PLUS_RUNTIME_LABEL = 'Postgres embedded graph'`, graph node/edge/proposal schemas, review states, and export/import bundles.
- `src/lib/knowledge/context-enrichment-adapter.ts` already builds enriched turn capsules with Firestore canonical status, optional Cognee recall, and deferred Graphiti.
- `src/lib/knowledge/memory-layer.ts` already centralizes Cognee dataset scoping as `ownerUid__caseId`.
- `backend/services/cognee_memory.py` is disabled-safe, service-owned, ontology-aware, tenant-scoped, and refuses live SDK work in the monolith.
- `backend/services/ontology_system.py` already has base ontology composition, ten case types, work ontology selection, data-point class loading, and resolver descriptors.

The first implementation slice in this change adds capsule-level ontology overlays and embedded graph seeds to starter definitions, snapshots, prompt blocks, and the inspector.

## Researched Inputs

Official and primary sources used to shape this plan:

- Cognee Python `cognify`: https://docs.cognee.ai/python-api/cognify
- Cognee Python `add`: https://docs.cognee.ai/python-api/add
- Cognee API `cognify`: https://docs.cognee.ai/api-reference/cognify/cognify
- Cognee distributed execution and graph search: https://docs.cognee.ai/guides/distributed-execution
- Cognee Google ADK integration with sessionized tools: https://docs.cognee.ai/integrations/google-adk-integration
- OCHA humanitarian access: https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess
- UN Guidance on Mediation of Ceasefires: https://peacemaker.un.org/en/documents/guidance-mediation-ceasefires
- UN Guidance for Effective Mediation: https://peacemaker.un.org/en/documents/united-nations-guidance-effective-mediation-0
- OECD evidence-informed policy making: https://www.oecd.org/gov/evidence-informed-policy-making.htm
- World Bank political economy analysis resources: https://www.worldbank.org/en/topic/governance/brief/political-economy-analysis
- WHO risk communication and community engagement: https://www.who.int/teams/risk-communication
- IMF debt sustainability analysis: https://www.imf.org/en/Publications/DSA
- FATF risk-based approach: https://www.fatf-gafi.org/en/topics/risk-based-approach.html
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- European Commission AI Act overview: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
- OMB M-24-10 federal AI governance: https://www.whitehouse.gov/omb/briefing-room/2024/03/28/omb-releases-implementation-guidance-following-president-bidens-executive-order-on-artificial-intelligence/
- UNHCR emergency handbook: https://emergency.unhcr.org/
- IOM Displacement Tracking Matrix: https://dtm.iom.int/

## Product Definition

A Featured Expert Pick V2 is a bundle, not a single card.

Each pick should contain:

- User capsule: the person doing the job, their mandate, tone, red lines, review threshold, and output expectations.
- Situation capsule: the issue, actors, time window, source pack, uncertainty, and decision horizon.
- Tool capsule: the thinking device that structures the work before any answer is drafted.
- Output capsule: the artifact the user actually needs, such as a senior brief, options memo, donor sitrep, board pack, compliance note, or implementation roadmap.
- Source pack: two to five high-reliability official, multilateral, regulator, standard-setter, or public-library sources.
- Dynamic ontology overlay: base case types, work ontology, node hints, graph node/edge seed, Cognee mode, and promotion rules.
- Review gates: what must be human reviewed before use, graph promotion, Cognee remember, SQL projection, export, or external reliance.

## What Shipped In This Slice

The first implementation slice is intentionally metadata-first:

- `CapsuleStarterOntologyOverlay` was added to starter definitions.
- Every generated starter now gets:
  - `overlayId`
  - `baseOntologyIds`
  - `workOntologyId`
  - `ontologyNodeHints`
  - `graphNodeTypes`
  - `graphEdgeTypes`
  - `sourceAffinity`
  - Cognee advisory mode and search modes
  - graph seed templates
  - promotion rules
  - forbidden claim rules
- `buildCapsuleStarterPromptBlock(...)` now injects ontology overlay, graph seed, Cognee mode, and promotion rules into the agent read contract.
- Starter snapshots now persist the overlay when capsules are saved or backfilled.
- The capsule inspector now shows dynamic ontology, Cognee mode, and embedded graph seed information.
- Contract tests now assert these overlays exist and remain visible.

This is not a live Cognee enablement. It is the safe substrate that lets later recall and write-candidate work consume capsule-specific ontology and graph instructions.

## V2 Featured Expert Picks

The featured shelf should prefer complete policy work kits. These are the first v2 bundles to curate and/or add.

### 1. Humanitarian Access and Famine Brief

User:
- `starter-user-un-humanitarian-access-officer`

Situation:
- `starter-situation-sudan-famine-access-civilian-protection`

Tool:
- `starter-tool-humanitarian-access-negotiation-checklist`
- Secondary: `starter-tool-source-reliability-triangulation-ladder`

Output:
- `starter-output-humanitarian-donor-sitrep`

Source lanes:
- OCHA access guidance
- OCHA country operation page
- IPC acute food insecurity analysis
- Sphere Handbook

Graph overlay:
- Base ontologies: `humanitarian-crisis`, `forced-displacement`, `negotiation-mediation`
- Node hints: AffectedPopulation, AccessCorridor, ProtectionRisk, NeedsAssessment, DeliveryConstraint, Party, Position
- Graph seed: population, access constraint, delivery actor, party, source, claim, risk, open question
- Forbidden claims: operational route instructions, unreviewed attribution, legal findings, population estimates outside source date

Useful work product:
- Donor sitrep with needs, access, response, gaps, protection risks, and asks.

### 2. Cabinet Policy Options and Implementation Roadmap

User:
- `starter-user-cabinet-policy-advisor`

Situation:
- `starter-situation-procurement-integrity-major-projects`
- Secondary candidates: AI procurement, public sector ransomware, water allocation, disaster recovery finance

Tool:
- `starter-tool-policy-option-triage-matrix`
- Secondary: `starter-tool-implementation-feasibility-gate`

Output:
- `starter-output-policy-implementation-roadmap`
- Secondary: `starter-output-ministerial-question-period-brief`

Source lanes:
- OECD public governance
- OECD evidence-informed policy making
- World Bank procurement
- PlainLanguage.gov
- GOV.UK content design

Graph overlay:
- Base ontologies: `political-transition`, `negotiation-mediation`
- Work ontology: `domestic-policy-analysis`
- Graph seed: decision, rule, actor, risk, source, deadline, output
- Forbidden claims: pretending an option is legally cleared, treating cost estimates as verified, hiding implementation blockers

Useful work product:
- One recommendation with options, tradeoffs, owners, dependencies, risks, timeline, and clearance gaps.

### 3. Corporate Supply Chain ESG and Board Risk Pack

User:
- `starter-user-corporate-supply-chain-esg-lead`

Situation:
- `starter-situation-eastern-drc-minerals-protection-risk`
- Secondary: `starter-situation-forced-labor-import-supply-chain-risk`

Tool:
- `starter-tool-corporate-exposure-heatmap`
- Secondary: `starter-tool-counterparty-ownership-escalation-tree`

Output:
- `starter-output-board-decision-memo-pack`
- Secondary: `starter-output-sanctions-exposure-note`

Source lanes:
- OECD responsible business conduct due diligence
- UN Guiding Principles on Business and Human Rights
- FATF risk-based approach
- OFAC sanctions list service
- EU Sanctions Map

Graph overlay:
- Base ontologies: `sanctions-economic-statecraft`, `strategic-competition`, `humanitarian-crisis`
- Work ontology: `corporate-strategic-analysis`
- Graph seed: supplier, counterparty, source, claim, exposure, control owner, risk, decision
- Forbidden claims: legal advice, sanctions determination, assurance/certification language, unsupported ownership conclusions

Useful work product:
- Board pack with exposure heatmap, controls, evidence gaps, owner actions, and review caveats.

### 4. AI Procurement Governance and Assurance

User:
- New or curated: `starter-user-ai-procurement-governance-lead`

Situation:
- `starter-situation-corporate-ai-procurement-assurance`
- Secondary: `starter-situation-ai-governance-procurement`

Tool:
- New: `starter-tool-ai-procurement-assurance-redline`
- Existing secondary: `starter-tool-legal-mandate-redline-check`

Output:
- New or curated: `starter-output-ai-procurement-risk-brief`
- Secondary: `starter-output-principals-decision-memo`

Source lanes:
- NIST AI RMF
- European Commission AI Act
- OMB M-24-10
- OECD AI principles or AI policy observatory
- Internal procurement policy if attached by the user

Graph overlay:
- Base ontologies: `cyber-hybrid`, `political-transition`
- Work ontology: `domestic-policy-analysis` or `corporate-strategic-analysis`
- Graph seed: AI system, provider, use case, risk, rule, control, source, decision, open question
- Forbidden claims: compliance certification, legal advice, privacy/security clearance, vendor assurance without evidence

Useful work product:
- Procurement risk brief with use case, risk class, controls, required evidence, procurement blockers, and approval gates.

### 5. Public Health Emergency Trust and Infodemic Brief

User:
- New: `starter-user-public-health-emergency-planner`

Situation:
- `starter-situation-public-health-infodemic-emergency-trust`

Tool:
- `starter-tool-public-narrative-risk-premortem`
- Secondary: `starter-tool-evidence-freshness-staleness-clock`

Output:
- New: `starter-output-public-health-rcce-brief`
- Secondary: `starter-output-crisis-daily-senior-brief`

Source lanes:
- WHO risk communication and community engagement
- WHO emergency response materials
- Local public health source attached by user
- PlainLanguage.gov or GOV.UK content design for public communication

Graph overlay:
- Base ontologies: `humanitarian-crisis`, `cyber-hybrid`
- Work ontology: `domestic-policy-analysis`
- Graph seed: audience, claim, source, risk, narrative, response owner, open question
- Forbidden claims: medical advice, unsupported outbreak statistics, stigmatizing language, public instructions outside official guidance

Useful work product:
- Public health trust brief with audience, key concern, verified facts, rumor risk, response line, owner, and review status.

### 6. Debt Distress and IMF Program Watch

User:
- New: `starter-user-macro-fiscal-policy-analyst`

Situation:
- `starter-situation-debt-distress-imf-program-watch`

Tool:
- `starter-tool-fiscal-space-debt-stress-screen`
- Secondary: `starter-tool-policy-option-triage-matrix`

Output:
- New: `starter-output-macro-fiscal-options-note`
- Secondary: `starter-output-principals-decision-memo`

Source lanes:
- IMF debt sustainability analysis
- World Bank debt statistics
- Ministry of finance source if user attaches one
- OECD or World Bank public finance implementation guidance

Graph overlay:
- Base ontologies: `sanctions-economic-statecraft`, `political-transition`
- Work ontology: `foreign-policy-research` or `domestic-policy-analysis`
- Graph seed: debt indicator, creditor, program condition, fiscal risk, source, decision, open question
- Forbidden claims: investment advice, market forecasts, sovereign credit conclusions, unsupported macro estimates

Useful work product:
- Options note that separates debt facts, program status, fiscal space, social risk, creditor constraints, and decision options.

### 7. Election Integrity and Public Confidence

User:
- `starter-user-investigative-research-analyst`

Situation:
- `starter-situation-election-observation-information-integrity`

Tool:
- `starter-tool-source-reliability-triangulation-ladder`
- Secondary: `starter-tool-public-narrative-risk-premortem`

Output:
- Existing: `electoral-risk-card` and `narrative-monitor`
- New: `starter-output-election-confidence-brief`

Source lanes:
- OSCE/ODIHR election observation handbook
- International IDEA electoral processes
- Official election commission source if user attaches one

Graph overlay:
- Base ontologies: `political-transition`, `cyber-hybrid`
- Work ontology: `foreign-policy-research` or `domestic-policy-analysis`
- Graph seed: claim, official result, observation finding, narrative risk, source, contradiction, open question
- Forbidden claims: fraud allegations without source threshold, voter advice, unsupported attribution, inflammatory public language

Useful work product:
- Confidence brief separating official facts, observation findings, allegations, narrative risk, and verification gaps.

### 8. Migration Reception Capacity and Protection

User:
- `starter-user-field-program-manager`
- New secondary: `starter-user-local-service-delivery-lead`

Situation:
- `starter-situation-migration-border-reception-capacity`

Tool:
- `starter-tool-policy-option-triage-matrix`
- Secondary: `starter-tool-data-gap-interrogatory-builder`

Output:
- `starter-output-policy-implementation-roadmap`
- Secondary: `starter-output-humanitarian-donor-sitrep`

Source lanes:
- UNHCR operational data
- IOM DTM
- UNHCR emergency handbook
- Local service capacity data attached by user

Graph overlay:
- Base ontologies: `forced-displacement`, `humanitarian-crisis`, `political-transition`
- Work ontology: `domestic-policy-analysis`
- Graph seed: population, route, service, capacity, protection claim, source, decision, risk
- Forbidden claims: individual legal advice, unsupported population estimates, enforcement instructions, stigmatizing language

Useful work product:
- Service capacity note with flows, bottlenecks, protection obligations, options, costs, and owner tasks.

## New Capsule Backlog

Add only after the current overlay and inspector contracts are stable.

User capsules:

- `starter-user-ai-procurement-governance-lead`
- `starter-user-public-health-emergency-planner`
- `starter-user-macro-fiscal-policy-analyst`
- `starter-user-local-service-delivery-lead`
- `starter-user-foundation-grantmaking-program-officer`
- `starter-user-mediation-support-officer`

Tool capsules:

- `starter-tool-ai-procurement-assurance-redline`
- `starter-tool-rights-impact-risk-screen`
- `starter-tool-budget-fiscal-exposure-model`
- `starter-tool-review-card-promotion-queue`
- `starter-tool-dynamic-ontology-fit-check`
- `starter-tool-grant-theory-of-change-stress-test`

Output capsules:

- `starter-output-ai-procurement-risk-brief`
- `starter-output-public-health-rcce-brief`
- `starter-output-macro-fiscal-options-note`
- `starter-output-election-confidence-brief`
- `starter-output-local-service-capacity-note`
- `starter-output-grant-decision-memo`

Situation capsules:

- `starter-situation-critical-minerals-community-consent-permitting`
- `starter-situation-local-government-service-continuity-crisis`
- `starter-situation-climate-adaptation-finance-pipeline`
- `starter-situation-ai-public-service-deployment-assurance`
- `starter-situation-public-health-border-measures-trust`
- `starter-situation-urban-heat-health-service-risk`

Each new starter must use `realWorkStarter(...)`, at least two source pack entries, source excerpts, review gates, compatible capsules, and an ontology overlay. Do not add new top-level navigation or app routes.

## Dynamic Ontology Design

The overlay is a per-capsule runtime hint that sits above the existing ontology system. It does not replace `backend/services/ontology_system.py`.

Implemented overlay fields:

- `overlayId`: stable capsule overlay id.
- `baseOntologyIds`: one to three case types from the existing backend taxonomy.
- `workOntologyId`: `foreign-policy-research`, `domestic-policy-analysis`, or `corporate-strategic-analysis`.
- `graphNodeTypes`: Capsule+ compatible node types, such as Actor, Claim, Source, Risk, Event, Rule, Decision, Output, Deadline, Commitment.
- `graphEdgeTypes`: Capsule+ compatible edge types, such as SUPPORTED_BY, CONTRADICTS, INVOLVES, CONSTRAINS, DEPENDS_ON, TRIGGERS_REVIEW.
- `ontologyNodeHints`: richer ontology extraction hints, such as AffectedPopulation, AccessCorridor, ProtectionRisk, SanctionsMeasure, ThreatActor, Party, BATNA.
- `sourceAffinity`: starter source ids that should guide extraction and recall.
- `cognee`: advisory mode, dataset scope, search modes, prompt hint, and confidence cap.
- `graphSeed`: proposal label, node templates, edge templates, evidence requirements, and review gate.
- `promotionRules`: what must be true before any candidate can be applied.
- `forbiddenClaims`: claim classes that must stop for expert review.

Next implementation:

- Add `src/lib/product/capsule-ontology-overlays.ts` if the overlay helper grows too large for `context-capsules.ts`.
- Add backend mirror types in `backend/types/context.py` only if backend APIs need to accept overlays directly.
- Add a pure function that maps overlay `baseOntologyIds` to `ontology_stack_for_case_types(...)`.
- Add an audit to ensure every Featured Expert Pick has a specific overlay and not only the generic fallback.
- Add a UI review card that shows ontology fit, missing node classes, and proposed ontology evolution without mutating OWL files.

Do not let agents mutate ontology files. The existing ontology evolution loop should remain non-mutating and proposal-only.

## Cognee Implementation Plan

### Current Contract

Current code is correctly cautious:

- `COGNEE_ENABLED=false` and disabled modes must produce stable empty shapes.
- Frontend and Next routes must not import the Cognee SDK.
- `backend/services/cognee_memory.py` is the only backend module allowed to import Cognee.
- Live `remember`, `add`, `cognify`, `memify`, and `search` are owned by the isolated `praxis-cognee` service, not the monolith.
- Cognee candidates are advisory and capped at `0.600` confidence before review.
- Cognee-derived material must not become Verdict nodes or canonical graph state.

### Phase C0: Inventory and Health

Before enabling anything:

- Check `/api/health` and `/api/health/features`.
- Confirm `COGNEE_ENABLED`, `COGNEE_MODE`, `COGNEE_BACKEND_URL`, Vertex provider settings, and Cloud Run service identity.
- Run `npm run audit:cognee`.
- Run backend tests for tenant isolation.
- Confirm no frontend or Next route imports `cognee`.

Exit criteria:

- If Cognee is unconfigured, the UI says disabled/unconfigured and still works.
- If Cognee is configured, recall canary passes and cross-tenant negative tests pass.

### Phase C1: Recall Only

Use existing code:

- `src/lib/knowledge/context-enrichment-adapter.ts`
- `src/lib/knowledge/memory-layer.ts`
- `src/app/api/memory/[...slug]/route.ts`
- `cogneeDatasetFor({ ownerUid, caseId })`

Behavior:

- Ask PRAXIS sends query, owner id, and capsule id.
- The isolated Cognee service searches the owner-capsule dataset.
- Results return as advisory memory hits.
- The inspector shows memory hit count and source ids.
- The answer prompt labels hits as advisory, not truth.

Recommended Cognee search modes:

- `CHUNKS` for sourceable recall and provenance.
- `GRAPH_COMPLETION` for relationship-aware context after source receipts exist.
- `SUMMARIES` for high-level capsule handoff.
- `NATURAL_LANGUAGE` only for conversational retrieval, not graph promotion.

Exit criteria:

- No answer changes canonical capsule state.
- Every memory hit is tagged advisory.
- Missing or failed Cognee returns disabled/degraded, not a hard app failure.

### Phase C2: Write Candidates, Not Writes

Add a review-gated candidate flow:

- A user closes a research thread, uploads a document, or explicitly asks to remember something.
- PRAXIS creates a memory candidate review card.
- The review card names source ids, document ids, capsule id, owner id, overlay id, candidate confidence, and forbidden-claim checks.
- Only after approval does the backend call the isolated service.

Use Cognee APIs behind the service adapter:

- `add` for source documents.
- `cognify` for graph-like extraction where ontology stack and custom prompt are needed.
- `remember` for long-lived memory summaries when appropriate.
- Do not expose raw Cognee calls to frontend code.

Exit criteria:

- `remember` cannot happen silently from Ask suggestions.
- Candidate confidence is capped at 0.600.
- Every accepted candidate has a source receipt, document id, or run receipt.
- Rejected candidates remain auditable but cannot be reused as facts.

### Phase C3: Ontology-Aware Cognify

When a candidate is approved for extraction:

- Resolve the capsule overlay.
- Map `baseOntologyIds` to backend case types.
- Resolve `ontology_stack_for_case_types(primary, secondary)`.
- Pass ontology paths and data point classes through the isolated Cognee service.
- Use the overlay `customPromptHint` to keep extraction bounded.
- Store results as graph proposals or memory candidate receipts, not canonical graph rows.

Exit criteria:

- Extraction result says which ontology stack was used.
- Each candidate includes source provenance.
- Unsupported material becomes OpenQuestion or Risk, never canonical Claim.
- Direct graph writes remain impossible without the graph proposal approval route.

### Phase C4: Improve Feedback

Use Cognee `improve` only for reviewed interaction feedback:

- Positive: accepted review card, applied output, or confirmed useful memory.
- Negative: rejected candidate, unsupported recall, stale source, wrong ontology fit.
- Feedback must include owner id, capsule id, overlay id, source ids, and review decision.

Exit criteria:

- Feedback cannot leak across tenants.
- Feedback is not a substitute for source evidence.

## Embedded Graph Plan

Use the existing Capsule+ path as the embedded graph contract.

Do:

- Keep `src/lib/capsule-plus/index.ts` as the local Postgres embedded graph schema.
- Use `CapsulePlusGraphProposalSchema` for staged nodes and edges.
- Use graph proposal approval/rejection routes for canonical application.
- Keep graph node types bounded to the Capsule+ enum unless a migration expands it.
- Use ontology node hints as extraction hints, not DB schema values.

Do not:

- Add Kuzu or another embedded graph DB.
- Let Cognee write `graph_nodes` or `graph_edges` directly.
- Treat graph centrality, ontology match, or recall as evidence.
- Promote Verdict or legal conclusion nodes from Cognee.

Graph proposal object should include:

- `proposalId`
- `capsuleId`
- `ownerUid`
- `graphVersion`
- `ontologyStackId`
- `reviewCardId`
- proposed nodes
- proposed edges
- unsupported claims
- review state
- created timestamp

Promotion gates:

- Owner scoped.
- Capsule scoped.
- Source receipt or document/run receipt present.
- Unsupported claims resolved or left as open questions.
- Human reviewer approves.
- Confidence and freshness visible.

## UI Plan

No new top-level app surface.

Use existing surfaces:

- Ask composer chips for suggested capsules.
- Capsule repository grid for browsing.
- Capsule inspector sheet for detail.
- Existing factory, improvement, and source review lanes.

Add to inspector:

- Dynamic ontology overlay tab section.
- Embedded graph seed detail.
- Cognee advisory/disabled/degraded mode.
- Source affinity list.
- Review-card promotion status.
- "Ask", "Improve safely", and "Add" actions already present.

Add to Featured Expert Picks:

- Show v2 bundles as complete lanes:
  - User
  - Situation
  - Tool
  - Output
  - Source readiness
  - Ontology/graph readiness
- Keep card click opening the inspector.
- Keep Add human-gated.
- Do not auto-compose or auto-remember based on hover, suggestion, or click.

## Tests and Audits

Focused tests:

- `npm run test -- tests/unit/lib/product/context-capsules.test.ts`
- `npm run test -- tests/unit/components/tasklet-workbench-contract.test.ts`
- `npm run test -- tests/unit/lib/context/capsule-service.test.ts`
- `npm run test -- tests/unit/lib/capsule-plus/capsule-plus.test.ts`
- `npm run test -- tests/unit/api/graph-memory-review-contract.test.ts`
- `npm run typecheck`
- `npm run build`

Audits:

- `npm run audit:capsule-depth`
- `npm run audit:capsule-contract`
- `npm run audit:capsule-memory-contract`
- `npm run audit:cognee`
- `npm run audit:deep-preship` before claiming platform readiness

Backend checks when Python environment is available:

- `pytest backend/tests/test_ontology_system.py`
- `pytest backend/tests/test_cognee_tenant_isolation.py`
- `pytest backend/tests/test_ontology_evolution.py`
- `pytest backend/tests/test_metrics_contract.py`

Live checks before production claim:

- Latest Cloud Build is `SUCCESS`.
- Latest Cloud Run frontend revision has 100 percent traffic.
- `https://praxis.tacitus.me/` returns 200.
- `https://praxis.tacitus.me/login` returns 200.
- `https://praxis.tacitus.me/api/health` returns 200.
- `https://praxis.tacitus.me/api/health/runtime` returns 200.
- `https://praxis.tacitus.me/api/health/agentic-search` returns 200.
- `PLAYWRIGHT_BASE_URL=https://praxis.tacitus.me npm run smoke:public` passes.

## Implementation Lanes

### Lane A: Source Research and Capsule Specs

Owner: capsule/content agent

Tasks:

- Confirm source packs for the eight v2 bundles above.
- Add missing user, tool, situation, and output capsules through `realWorkStarter(...)`.
- Keep each source pack to official, multilateral, regulator, standard-setter, or public-library sources.
- Avoid affiliation claims.
- Add source freshness rules to `richProfile.evidenceRequirements`.

Files:

- `src/lib/product/context-capsules.ts`
- `tests/unit/lib/product/context-capsules.test.ts`
- `scripts/audit-capsule-depth.ts` only if audit expectations expand

### Lane B: Overlay Schema and Snapshots

Owner: capsule/runtime agent

Status: first slice started

Tasks:

- Keep `CapsuleStarterOntologyOverlay` stable.
- Split overlay mapping into its own file if `context-capsules.ts` grows too large.
- Persist overlays in starter snapshots.
- Add normalization for incoming older or custom snapshots.
- Add audit coverage for Featured Expert Pick overlays.

Files:

- `src/lib/product/context-capsules.ts`
- `src/lib/context/capsule-service.ts`
- `tests/unit/lib/context/capsule-service.test.ts`

### Lane C: Inspector and Featured Picks UX

Owner: frontend agent

Tasks:

- Make Featured Expert Picks show complete v2 bundle readiness.
- Keep the card grid full-width and inspectable.
- Show ontology overlay, Cognee mode, source affinity, graph seed, promotion rules, and forbidden claims in the inspector.
- Keep mobile as bottom/full-screen sheet.

Files:

- `src/components/praxis/tasklet-praxis-workbench.tsx`
- `tests/unit/components/tasklet-workbench-contract.test.ts`
- `tests/e2e/capsule-workspace-visual-diagnostics.spec.ts`

### Lane D: Cognee Recall and Write-Candidate Flow

Owner: memory/backend agent

Tasks:

- Keep recall disabled-safe.
- Add overlay id and search modes to recall request metadata.
- Add memory candidate review cards.
- Route approved write candidates through isolated `praxis-cognee`.
- Add service response receipts with ontology stack and source ids.

Files:

- `src/lib/knowledge/context-enrichment-adapter.ts`
- `src/lib/knowledge/memory-layer.ts`
- `src/app/api/memory/[...slug]/route.ts`
- `backend/services/cognee_memory.py`
- `backend/services/cognee_bridge.py`
- backend memory tests

### Lane E: Embedded Graph Proposals

Owner: graph/backend agent

Tasks:

- Convert overlay graph seeds into `CapsulePlusGraphProposalSchema` draft rows.
- Add sourceability checks before proposals can be reviewed.
- Show unsupported claims in review cards.
- Keep graph approval/rejection through existing routes.
- Add tests that Cognee candidates cannot become canonical rows directly.

Files:

- `src/lib/capsule-plus/index.ts`
- `src/app/api/graph/proposals/[id]/approve/route.ts`
- `src/app/api/graph/proposals/[id]/reject/route.ts`
- `tests/unit/api/graph-memory-review-contract.test.ts`

### Lane F: Evaluation and Deployment

Owner: ship agent

Tasks:

- Run focused tests, typecheck, build, and audits.
- Commit on `main` only after verifying no unrelated dirty files are present.
- Push `main`.
- Deploy frontend with `npm run deploy:frontend:cloud`.
- Verify live `praxis.tacitus.me` health and public smoke tests.

## Acceptance Criteria

Feature acceptance:

- Featured Expert Picks are complete bundles with real user, situation, tool, output, source, ontology, and graph posture.
- Every v2 pick answers "who is this for, what work does it help, which sources matter, what output is ready, and what must be reviewed?"
- The inspector exposes source packs, excerpts, core refs, tools, outputs, review gates, AI guidance, compatible capsules, usefulness rating, Ask/Improve/Add actions, ontology overlay, Cognee mode, and embedded graph seed.
- Suggestions remain human-gated and never auto-apply.

Cognee acceptance:

- Disabled mode is honest and stable.
- Recall mode is advisory and source-labeled.
- Write-candidate mode is review-gated.
- No frontend or Next route imports the Cognee SDK.
- No Cognee-derived row bypasses graph proposal review.

Graph acceptance:

- Embedded graph proposal rows are owner and capsule scoped.
- Unsupported claims remain visible.
- Postgres-first Capsule+ stays the graph path.
- No new Kuzu or separate embedded graph DB is introduced.

Ontology acceptance:

- Every Featured Expert Pick has a specific overlay.
- Overlay maps to existing backend case types and work ontologies.
- Agents can propose ontology gaps, but cannot mutate OWL or canonical ontology files.
- Ontology fit is a routing and extraction aid, not evidence.

## No-Touch Rules

- Do not add a new top-level app page or primary navigation item.
- Do not make Cognee canonical.
- Do not auto-remember or auto-promote from Ask suggestions.
- Do not let graph proposals skip human review.
- Do not direct-import Cognee SDK outside `backend/services/cognee_memory.py`.
- Do not introduce Kuzu or any new graph database.
- Do not claim live Cognee unless service inventory, config, health, and tenant tests prove it.
- Do not overwrite user-owned capsule edits or version history.

## Next Commit Scope

The next code commit after this plan should be small and testable:

1. Finish overlay test coverage in `capsule-service`.
2. Add an audit requiring overlays on Featured Expert Picks.
3. Curate the eight v2 bundles in the Featured Expert Picks shelf.
4. Add one missing capsule from each category using `realWorkStarter(...)`:
   - AI procurement governance lead
   - AI procurement assurance redline
   - AI procurement risk brief
   - Critical minerals community consent and permitting
5. Run focused tests, typecheck, build, and deploy only after green validation.

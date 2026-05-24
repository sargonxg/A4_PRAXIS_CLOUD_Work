# PRAXIS Conflict Analyst Product Proposal

Date: 2026-05-23
Status: Proposal
Scope: Make PRAXIS by TACITUS a sellable conflict-analysis machine for policy, defense/defence, humanitarian, mediation, security-risk, and defense-tech practitioners.

## Executive Position

PRAXIS should not try to beat Palantir, Primer, Babel Street, Recorded Future, ACLED, or Crisis Group at their own exact products. The wedge should be narrower and sharper:

> A capsule-native conflict analyst workbench that turns live sources, user documents, analyst tradecraft, Cognee recall, and review-gated graphs into reusable situation models and decision-ready outputs.

The strongest sellable difference is that PRAXIS can be the analyst's "context engine": it remembers the case, keeps sources and uncertainty inspectable, structures the conflict as actors/events/claims/commitments/indicators, and produces briefings through explicit analytic frameworks rather than generic chat.

This plan keeps PRAXIS inside the existing Ask/capsule/workbench surfaces. It does not add a new top-level product surface, does not make Cognee canonical, and does not support operational targeting or tactical instructions.

## Research Inputs

### Conflict Data And Monitoring

- ACLED API exposes event data with actor, interaction, location, source, civilian targeting, event type, fatalities, and other structured fields. ACLED also provides CAST forecasts and conflict-exposure methodology.
- UCDP provides disaggregated georeferenced event datasets, dyadic and actor datasets, conflict issues, and conflict termination datasets.
- GDELT Cloud conflict data creates structured conflict records from story clusters, modeled on ACLED-style taxonomy but independently generated and marked beta.
- ReliefWeb API exposes humanitarian reports, disasters, countries, sources, and taxonomies.
- HDX HAPI provides standardized humanitarian indicators with warning/error transparency and country-focused API datasets.
- FEWS NET API exposes food-security, market, trade, IPC phase, population, and spatial datasets with scenario and date filters.
- NASA FIRMS exposes active fire data that can be used as a weak signal only when carefully caveated and corroborated.
- CrisisWatch, CFR Global Conflict Tracker, and other trackers show that users value monthly trend status, risk alerts, deterioration/improvement labels, and concise decision-maker updates.

### Analytic Tradecraft And Frameworks

- CIA's structured analytic techniques primer frames intelligence analysis around complexity, incomplete information, ambiguous information, and cognitive limits.
- ODNI ICD 203 emphasizes analytic standards, source and method quality, uncertainty, objectivity, and review.
- NATO AJP-2 public excerpts describe OSINT as systematic collection, processing, and exploitation of publicly available information, feeding PMESII and ASCOPE operating-environment analysis.
- UNDP CDA frames conflict analysis as structured, evidence-based understanding of context for decisions, early warning, and conflict sensitivity.
- USAID CAF 2.0 focuses on conflict risks, drivers, peace/security goals, how programs interact with conflict factors, and do-no-harm implications.
- OECD fragility work uses multidimensional economic, environmental, human, political, security, and societal dimensions.

### Market Pattern

- Primer emphasizes search over proprietary and public information, extracted entities/claims/relationships, exact source spans, recurring briefings, secure collaboration, and API integration for defense/intelligence users.
- Babel Street emphasizes always-on multilingual OSINT streams, curated topics/locations, enrichment, geo-enabled metadata, and rapid reporting.
- Palantir emphasizes an operational ontology, human-in-the-loop actions, audit/lineage, agents on top of governed data, and secure defense deployment.
- Recorded Future emphasizes threat intelligence, many sources, expert context, and connecting dots for risks before they happen.

PRAXIS should borrow the best product lessons without copying the category: persistent monitoring, source spans, ontology, human review, audit trail, team collaboration, exportable outputs, and secure deployment.

## Product Principles

1. Keep "Ask PRAXIS" as the front door.
2. Treat capsules as reusable analyst work kits, not decorative cards.
3. Treat Cognee as advisory recall and candidate generation, never canonical truth.
4. Treat embedded graphs as review-gated situation models, not autonomous facts.
5. Make uncertainty, source gaps, contradictions, and confidence visible.
6. Make outputs concrete: daily brief, escalation watch, actor dossier, ceasefire matrix, humanitarian access note, capability-gap brief, board/principals memo.
7. Keep defense-tech posture analytic and non-kinetic: no targeting, tactical advice, weapon employment, or sensitive operational instructions.
8. Sell to teams through repeatable workflows, not generic AI chat.

## 10 Specific Things To Build

### 1. Conflict Case Capsule Bundles

Create v2 "Featured Expert Picks" as full conflict case bundles: user capsule, situation capsule, tool capsule, output capsule, source pack, ontology overlay, Cognee mode, graph seed, and review gates.

The bundle is the product unit. A buyer should be able to say "open the ceasefire desk" or "start the defense capture watch" and PRAXIS should immediately load the right analyst posture, sources, ontology, Cognee memory policy, graph seed, agent team, and output pathway.

Bundle schema:

- `bundleId`: stable id for the Featured Expert Pick.
- `analystJob`: the person or team doing the work.
- `caseFrame`: geography, actors, decision horizon, and risk posture.
- `starterIds`: user, situation, tool, and output capsule ids.
- `sourceConnectors`: official/public connectors and private library lanes.
- `ontologyOverlayId`: conflict-specific overlay with graph seed.
- `cogneePolicy`: recall mode, write-candidate rule, search modes, and confidence cap.
- `agentTeam`: default agents and handoff order.
- `reviewGates`: claims, graph proposals, memory writes, exports, and external-use gates.
- `outputs`: the sellable artifacts produced by the bundle.

#### Bundle A: Ceasefire Monitoring And Verification Desk

- User: mediation support officer, ceasefire analyst, mission analyst, or diplomatic desk officer.
- Situation: proposed or active ceasefire with ambiguous commitments, alleged violations, disputed monitoring sources, and political incentives to over-claim.
- Tool capsules: ceasefire monitoring and verification matrix, commitment tracker, sourceability matrix, estimative confidence table.
- Output capsules: ceasefire incident matrix, legal/mandate compliance note, principals update, negotiation prep book.
- Sources: UN Peacemaker ceasefire guidance, UN mission/public statements, OCHA where humanitarian access is implicated, ACLED/UCDP for incident context, user-uploaded agreement text.
- Ontology focus: Party, Commitment, Clause, Monitor, Incident, Allegation, VerificationSource, DisputeChannel, Timeline, OpenQuestion.
- Cognee: recall prior clauses, actor aliases, rejected allegations, monitoring language, and previous human review decisions; write only approved clause summaries or incident-review candidates.
- Agent team: Source Scout -> Event Coder -> Commitment Analyst -> Sourceability Reviewer -> Mediation Prep Agent -> Red-Team Analyst -> Output Formatter.
- Hard gates: never label a violation, compliance finding, chain-of-command fact, or legal conclusion without source and expert review.

#### Bundle B: Humanitarian Access And Protection Brief

- User: humanitarian access officer, protection analyst, donor desk, field program manager, or crisis-policy lead.
- Situation: conflict-affected area with access constraints, civilian protection risk, displacement, service gaps, and political sensitivity.
- Tool capsules: humanitarian access negotiation checklist, source reliability ladder, do-no-harm/conflict-sensitivity screen.
- Output capsules: donor sitrep, access constraint brief, protection-risk note, field handover.
- Sources: OCHA, ReliefWeb, HDX HAPI, UNHCR, IOM DTM, FEWS NET/IPC when food security is relevant, user-uploaded partner reports.
- Ontology focus: AffectedPopulation, AccessCorridor, Checkpoint, DeliveryConstraint, ProtectionRisk, ServiceGap, NeedsAssessment, ImplementingActor.
- Cognee: recall case-specific access constraints, recurring place names, previously accepted needs statements, and stale estimates that should not be reused.
- Agent team: Source Scout -> Humanitarian/Protection Analyst -> Indicator Watch Officer -> Sourceability Reviewer -> Red-Team Analyst -> Output Formatter.
- Hard gates: no operational route instructions, no population estimates without date/source, no attribution of intent without corroboration.

#### Bundle C: Civilian Harm And Conflict Exposure Brief

- User: civilian-protection analyst, policy adviser, humanitarian advocacy team, risk officer, or research desk.
- Situation: violence trends need to be translated into civilian exposure, source confidence, and decision implications.
- Tool capsules: conflict exposure matrix, sourceability matrix, event-coding review, confidence calibration.
- Output capsules: civilian exposure brief, source annex, trend dashboard card.
- Sources: ACLED exposure methodology, ACLED/UCDP event records, WorldPop or population estimates through trusted sources, ReliefWeb/OCHA reports, user-uploaded field notes.
- Ontology focus: CivilianPopulation, Event, ExposureEstimate, FatalityClaim, Source, GeoPrecision, ReportingDelay, BiasRisk.
- Cognee: recall prior exposure baselines, local geography aliases, coding caveats, and reviewed event-cluster summaries.
- Agent team: Event Coder -> Indicator Watch Officer -> Sourceability Reviewer -> Red-Team Analyst -> Output Formatter.
- Hard gates: exposure estimates remain estimates; reporting delays and source bias must be visible.

#### Bundle D: Gray-Zone And Hybrid Influence Monitor

- User: strategic communications analyst, defense policy team, election-security analyst, or corporate risk desk.
- Situation: coordinated narratives, cyber-adjacent influence, coercive economic/diplomatic signals, or ambiguous escalation below open conflict.
- Tool capsules: narrative risk premortem, actor leverage/veto map, ACH, indicator watchlist.
- Output capsules: gray-zone watch brief, narrative-risk card, response-options memo.
- Sources: official statements, sanctions/foreign ministry releases, trusted media, GDELT/grounded search as weak signals, CISA/NIST where cyber resilience matters.
- Ontology focus: Narrative, Claim, Amplifier, SponsorHypothesis, TargetAudience, InfluenceVector, CounterNarrativeRisk, Indicator.
- Cognee: recall recurring narratives and rejected attribution hypotheses; do not remember unreviewed influence attributions.
- Agent team: Source Scout -> Actor Profiler -> Scenario Forecaster -> Sourceability Reviewer -> Red-Team Analyst.
- Hard gates: no unsupported attribution, no surveillance posture, no instructions for manipulation or counter-influence operations.

#### Bundle E: Critical Infrastructure Disruption Watch

- User: infrastructure risk analyst, continuity lead, defense-tech planner, or public-sector crisis lead.
- Situation: attacks, sabotage, ransomware, natural hazards, or conflict spillovers affecting energy, ports, telecoms, water, hospitals, or transport.
- Tool capsules: infrastructure dependency map, scenario indicator watchlist, sourceability matrix.
- Output capsules: service-continuity brief, infrastructure disruption dashboard, recovery-priority memo.
- Sources: official incident statements, CISA/NIST, sector regulator sources, ReliefWeb/OCHA in crisis zones, NASA FIRMS as corroboration-only, public infrastructure datasets.
- Ontology focus: Asset, Service, Dependency, DisruptionEvent, RestorationConstraint, Owner, ImpactedPopulation, Risk.
- Cognee: recall known dependencies, prior incidents, named assets, and recovery claims; memory writes require source receipts.
- Agent team: Source Scout -> Indicator Watch Officer -> Scenario Forecaster -> Sourceability Reviewer -> Output Formatter.
- Hard gates: no exploit details, no facility vulnerability instructions, no unsupported outage attribution.

#### Bundle F: Maritime Chokepoint And Shipping-Risk Watch

- User: maritime policy analyst, logistics risk team, insurer, sanctions desk, or defense policy desk.
- Situation: maritime disruption, coercion, attacks, detentions, rerouting, insurance pressure, sanctions exposure, or legal posture.
- Tool capsules: maritime incident law separator, scenario watchlist, sanctions exposure triage.
- Output capsules: maritime risk brief, shipping exposure dashboard, principals memo.
- Sources: IMO, UKMTO/official maritime advisories where available, UN/foreign ministry statements, ACLED/GDELT as event signals, user-uploaded shipment or exposure data.
- Ontology focus: Vessel, Chokepoint, Port, Incident, Advisory, InsurerRisk, SanctionsExposure, LegalClaim, RouteConstraint.
- Cognee: recall vessel/route aliases, prior advisories, exposure notes, and reviewed incident summaries.
- Agent team: Source Scout -> Event Coder -> Sanctions/Exposure Analyst -> Sourceability Reviewer -> Red-Team Analyst.
- Hard gates: no vessel tracking for harm, no tactical movement recommendations, no legal determinations without review.

#### Bundle G: Election Violence And Public Confidence Brief

- User: election observer, democracy analyst, public confidence team, regional desk, or security-risk analyst.
- Situation: election-period violence, fraud allegations, disinformation, protest risk, public-confidence stress, and official-result disputes.
- Tool capsules: election sourceability ladder, narrative risk premortem, confidence calibration.
- Output capsules: election confidence brief, incident trend card, public-language review.
- Sources: OSCE/ODIHR, International IDEA, official electoral commission sources, ACLED/UCDP/GDELT for event signals, trusted observer reports.
- Ontology focus: ElectoralBody, PollingEvent, ObservationFinding, Allegation, OfficialResult, ViolenceEvent, NarrativeRisk, ConfidenceDriver.
- Cognee: recall prior allegations, accepted observation findings, and stale official-result snapshots.
- Agent team: Source Scout -> Event Coder -> Sourceability Reviewer -> Red-Team Analyst -> Output Formatter.
- Hard gates: no unsupported fraud finding, no voter advice, no inflammatory public-language output.

#### Bundle H: Defense-Tech Capability Gap And Procurement Watch

- User: defense-tech founder, capture lead, product strategist, mission engineering team, or investor diligence analyst.
- Situation: public capability needs, solicitations, CSOs, SBIR/STTR, OTAs, procurement forecasts, and mission-context fit.
- Tool capsules: capability-gap map, bid/no-bid fit matrix, stakeholder/approval path map.
- Output capsules: defense capture memo, opportunity watchlist, proposal-outline pack.
- Sources: SAM.gov opportunities and awards, DIU/AFWERX/ONR/NAVAIR or public program pages, agency forecasts, acquisition policy references, user-uploaded capability docs.
- Ontology focus: CapabilityGap, Requirement, ProcurementOpportunity, Agency, ProgramOffice, CustomerPain, CompetitorPartner, EvidenceOfNeed, ComplianceGate.
- Cognee: recall company capabilities, rejected fit claims, opportunity history, and prior customer-language patterns; write approved capability summaries only.
- Agent team: Defense Capture Analyst -> Source Scout -> Actor/Stakeholder Profiler -> Sourceability Reviewer -> Red-Team Analyst -> Output Formatter.
- Hard gates: no classified inference, no procurement legal advice, no claims of customer intent without source, no operational use guidance.

#### Bundle I: Sanctions, Counterparty, And Supply-Chain Exposure Pack

- User: sanctions counsel, corporate risk lead, ESG lead, supply-chain analyst, financial crime team, or board-risk team.
- Situation: exposure to sanctioned actors, high-risk counterparties, conflict minerals, forced labor, evasion routes, or dual-use supply-chain pressure.
- Tool capsules: sanctions exposure triage, counterparty ownership escalation tree, corporate exposure heatmap.
- Output capsules: sanctions exposure note, board risk pack, compliance review annex.
- Sources: OFAC, EU sanctions map, UK OFSI, UN sanctions lists, FATF, OpenSanctions/Yente as matching aid, user-uploaded vendor data.
- Ontology focus: Counterparty, BeneficialOwner, SanctionsMeasure, Jurisdiction, SupplyChainNode, Shipment, ExposureClaim, ControlOwner, EscalationGate.
- Cognee: recall reviewed counterparty aliases, false positives, accepted exposure summaries, and source-specific caveats.
- Agent team: Sanctions/Exposure Analyst -> Source Scout -> Sourceability Reviewer -> Red-Team Analyst -> Output Formatter.
- Hard gates: no legal advice, no definitive sanctions determination, no assurance/certification language without counsel review.

#### Bundle J: Mediation Negotiation Prep And Spoiler-Risk Pack

- User: mediation support officer, diplomatic adviser, NGO peacemaker, foundation program officer, or back-channel support team.
- Situation: parties have public positions, private interests are uncertain, spoilers exist, and process options require careful language.
- Tool capsules: BATNA/ZOPA ripeness map, actor leverage/veto map, joint fact-finding protocol, red-team assumptions.
- Output capsules: negotiation prep book, stakeholder map, talking points, process-options memo.
- Sources: UN Peacemaker, public party statements, peace agreement texts, official mediator statements, Crisis Group/think-tank context as secondary, user-uploaded notes.
- Ontology focus: Party, Mediator, Interest, Position, BATNA, ZOPA, Spoiler, ConfidenceBuildingMeasure, AgendaItem, ProcessOption.
- Cognee: recall prior party language, accepted interest hypotheses, process red lines, and rejected assumptions; store only reviewed mediation notes.
- Agent team: Mediation Prep Agent -> Actor Profiler -> Sourceability Reviewer -> Red-Team Analyst -> Handover Builder.
- Hard gates: inferred interests must stay labeled as inference, and sensitive negotiation notes must be private by default.

Implementation targets:

- Add `CONFLICT_CASE_BUNDLE_SPECS` in `src/lib/product/context-capsules.ts` or a new `src/lib/product/conflict-case-bundles.ts`.
- Bind bundle specs to Featured Expert Picks in `src/components/praxis/tasklet-praxis-workbench.tsx`.
- Persist chosen bundle id and overlay id in the starter snapshot.
- Add bundle completeness tests in `tests/unit/lib/product/context-capsules.test.ts`.
- Add source/agent/Cognee visibility checks in `tests/unit/components/tasklet-workbench-contract.test.ts`.

Agent run pattern:

- User selects bundle.
- Ask PRAXIS loads active bundle prompt block.
- Agent team creates an AgentRun plan with roles and gates.
- Source Scout reads connectors/private sources and creates receipts.
- Specialist agents propose nodes, edges, indicators, and output sections.
- Sourceability and Red-Team agents review before export.
- Handover/Output Formatter packages the result.

Acceptance:

- Every bundle answers: who is the analyst, what is the situation, which framework runs, what output is produced, what sources are used, and what must be reviewed.
- Every bundle has an explicit Cognee policy, agent team, ontology overlay, graph seed, and output artifact.
- Every bundle can degrade to source receipts and manual review when Cognee or a connector is disabled.

### 2. Conflict Dynamic Ontology Pack

Expand capsule ontology overlays for conflict-specific work without letting agents mutate canonical ontology files.

The dynamic ontology pack should be a layered pack, not one giant schema. Each capsule gets a small overlay that chooses the relevant modules.

Base layer:

- `Source`: source id, publisher, source type, URL/document id, retrieval time, freshness, license/terms note, reliability tier.
- `Claim`: claim text, claim type, subject, source links, confidence, contradiction status, review state.
- `Actor`: canonical name, aliases, actor type, geography, affiliations, confidence, source receipts.
- `Event`: date/time, location, event type, actors, source, coding system, reporting-delay caveat.
- `Risk`: risk statement, affected object, likelihood language, confidence, source and indicator links.
- `Indicator`: observable signal, threshold, baseline, latest value, source, owner, update cadence.
- `OpenQuestion`: unknown, why it matters, required source type, owner.

Conflict modules:

- Armed conflict module: Faction, UnitOrForce, AreaOfControl, Frontline, Incident, CivilianTargetingClaim, FatalityClaim, GeoPrecision, ReportingDelay.
- Mediation/ceasefire module: Party, Mediator, Commitment, Clause, Monitor, VerificationSource, ViolationAllegation, DisputeChannel, ConfidenceBuildingMeasure.
- Humanitarian/protection module: AffectedPopulation, AccessCorridor, Checkpoint, DeliveryConstraint, ProtectionRisk, NeedsAssessment, ServiceGap, ImplementingActor.
- Influence/gray-zone module: Narrative, Amplifier, SponsorHypothesis, TargetAudience, InfluenceVector, CyberAdjacentSignal, CounterNarrativeRisk.
- Infrastructure/maritime module: Asset, Service, Dependency, Chokepoint, Vessel, Port, Advisory, DisruptionEvent, RestorationConstraint.
- Election integrity module: ElectoralBody, PollingEvent, ObservationFinding, OfficialResult, FraudAllegation, ViolenceEvent, PublicConfidenceSignal.
- Defense-capture module: CapabilityGap, Requirement, ProcurementOpportunity, ProgramOffice, CustomerPain, EvidenceOfNeed, FitGap, ComplianceGate.
- Sanctions/supply-chain module: Counterparty, BeneficialOwner, SanctionsMeasure, Jurisdiction, SupplyChainNode, Shipment, ExposureClaim, ControlOwner.

Core edge types:

- Evidence edges: SUPPORTED_BY, CONTRADICTS, DERIVED_FROM, REPORTED_BY, UPDATED_BY.
- Actor edges: SUPPORTS, OPPOSES, FUNDS, SUPPLIES, INFLUENCES, AFFILIATED_WITH, MEDIATES_BETWEEN.
- Event edges: INVOLVES, OCCURRED_AT, AFFECTS, ESCALATES, DE_ESCALATES, FOLLOWS, ALLEGED_BY.
- Commitment edges: COMMITS_TO, MONITORED_BY, VERIFIED_BY, DISPUTED_BY, VIOLATION_ALLEGED_BY.
- Risk edges: TRIGGERS, CONSTRAINS, DEPENDS_ON, MITIGATED_BY, REQUIRES_REVIEW.
- Procurement edges: MAPS_TO_REQUIREMENT, ADDRESSES_CAPABILITY_GAP, OWNED_BY, FUNDED_BY, BLOCKED_BY.
- Review edges: PROPOSED_BY_AGENT, APPROVED_BY_USER, REJECTED_BY_USER, NEEDS_EXPERT_REVIEW.

Review gates by edge family:

- `SUPPORTED_BY`: source receipt required.
- `CONTRADICTS`: both claims and sources must be visible.
- `VIOLATION_ALLEGED_BY`: allegation language only until expert review.
- `FUNDS` or `SUPPLIES`: source threshold and red-team check required.
- `MAPS_TO_REQUIREMENT`: public procurement/source requirement required.
- `APPROVED_BY_USER`: owner-scoped human action required.

Cognee role:

- Recall uses the overlay id, bundle id, source ids, and dataset `ownerUid__caseId`.
- Cognee `recall` can retrieve prior reviewed context, actor aliases, rejected claims, and previous outputs.
- Cognee `cognify` can propose nodes and edges using the selected overlay, but results become graph proposals only.
- Cognee `remember` is allowed only after a memory candidate review card is approved.
- Cognee `improve` should learn from accepted/rejected graph proposals and memory cards.
- Cognee candidate confidence stays capped and cannot become canonical evidence.

Agent team role:

- Source Scout creates or updates `Source` receipts.
- Event Coder proposes `Event`, `Incident`, `GeoPrecision`, and coding caveats.
- Actor Profiler proposes `Actor`, `Faction`, `SponsorHypothesis`, and alias merges.
- Commitment Analyst proposes `Commitment`, `Clause`, `Monitor`, and verification gaps.
- Humanitarian/Protection Analyst proposes access, population, protection, and needs nodes.
- Indicator Watch Officer proposes `Indicator`, `Trigger`, and baseline updates.
- Scenario Forecaster proposes scenario branches and risk drivers, not facts.
- Defense Capture Analyst proposes `CapabilityGap`, `Requirement`, `ProcurementOpportunity`, and fit/gap rows.
- Sanctions/Exposure Analyst proposes `Counterparty`, `SanctionsMeasure`, `ExposureClaim`, and escalation gates.
- Sourceability Reviewer validates evidence edges and unsupported claims.
- Red-Team Analyst challenges assumptions, missing alternatives, and overconfident edges.

Pipeline:

- Capsule bundle selected.
- Overlay module stack resolved.
- Ask PRAXIS builds prompt block with ontology, Cognee policy, and review gates.
- Source Scout reads source connectors and private attachments.
- Cognee recall returns advisory prior context.
- Specialist agents propose graph nodes/edges and output sections.
- Sourceability and red-team agents review proposals.
- User approves, rejects, or edits review cards.
- Approved graph rows remain Postgres/Firestore canonical according to existing boundaries.
- Approved memory cards may be sent to the isolated Cognee service.

Implementation targets:

- Continue the existing overlay model in `src/lib/product/context-capsules.ts`.
- Split to `src/lib/product/capsule-ontology-overlays.ts` if it grows large.
- Map overlays to backend ontology descriptors in `backend/services/ontology_system.py`.
- Add `src/lib/product/conflict-ontology-pack.ts` as the code home if the pack becomes reusable across starter generation, agent prompts, audits, and UI.
- Add an audit requiring every conflict bundle to declare module stack, node classes, edge classes, Cognee policy, and agent team.

Acceptance:

- Each conflict bundle has a specific overlay.
- Ontology hints feed extraction and review cards.
- No ontology file is mutated by an agent.
- Every proposed node and edge has source, agent, Cognee, or user provenance.
- Cognee can propose memory/graph candidates, but cannot approve them.
- Agent teams work through the existing AgentRun ledger and approval gates.

### 3. Source Connector And Receipt Layer

Build a source intake layer for conflict work that normalizes event feeds, reports, official documents, and user uploads into source receipts.

Priority connectors:

- ACLED events and CAST forecasts.
- UCDP GED and actor/dyad datasets.
- GDELT story/conflict events as weak/beta signals.
- ReliefWeb reports and source taxonomy.
- HDX HAPI humanitarian indicators.
- FEWS NET food-security and market data.
- NASA FIRMS active fire as corroboration-only thermal anomaly signal.
- SAM.gov opportunities and award records for defense-tech capture workflows.

Implementation targets:

- Existing source/document/capsule routes first.
- New connector modules only where needed; keep outputs as receipts and candidate rows.
- No connector writes canonical graph facts directly.

Acceptance:

- Every imported datum has source id, publisher, retrieval time, freshness, license/terms note, and confidence posture.
- Stale data is visible in the UI.
- User can include/exclude connectors per capsule.

### 4. Conflict Scene Graph

Turn each conflict capsule into an inspectable "scene graph" of actors, events, claims, commitments, sources, indicators, and risks.

The graph should support:

- Actor map.
- Timeline.
- Claims and contradictions.
- Commitment/ceasefire matrix.
- Indicator watchlist.
- Source coverage map.
- Confidence and freshness overlays.
- Proposed graph changes pending review.

Implementation targets:

- `src/lib/capsule-plus/index.ts`
- graph proposal routes
- `src/components/praxis/tasklet-praxis-workbench.tsx`

Acceptance:

- Analysts can inspect why a node exists.
- Every promoted edge traces to source receipts or human review.
- Graph can be exported as a Capsule+ bundle.

### 5. Analytica Framework Runner

Create a visible "Analytica" layer: structured analytic techniques that turn a capsule into a work product.

First frameworks:

- ACH for competing hypotheses.
- Indicator and warning watchlist.
- PMESII/ASCOPE operating-environment map.
- DIME/diplomatic-economic-information-military policy lever map.
- Actor leverage/veto map.
- Ceasefire commitment verification matrix.
- Sourceability and contradiction matrix.
- Red-team assumption challenge.
- Do-no-harm/conflict-sensitivity screen.
- Estimative confidence calibration.

Implementation targets:

- Tool capsules in `context-capsules.ts`.
- Agent tool registry and policy agent intent mapping.
- Output schemas for each framework.

Acceptance:

- User can run a framework from a capsule.
- The output includes inputs, assumptions, source gaps, confidence, dissent, and next actions.

### 6. Conflict Agent Team

Expand policy agents into a conflict-focused team while preserving the existing AgentRun ledger, Cloud Tasks dispatch, mirrored events, and approval gates.

Agents:

- Source Scout: finds official and high-reliability sources.
- Event Coder: proposes ACLED/UCDP-like event rows from sources.
- Actor Profiler: builds actor dossiers with caveats.
- Indicator Watch Officer: monitors thresholds and trend changes.
- Scenario Forecaster: creates scenario branches and update triggers.
- Sourceability Reviewer: audits source/claim alignment.
- Red-Team Analyst: challenges assumptions and missing alternatives.
- Mediation Prep Agent: structures negotiation prep and spoiler risks.
- Humanitarian/Protection Analyst: checks access, needs, displacement, and protection constraints.
- Defense Capture Analyst: maps public capability needs, procurement notices, and fit/gap logic without operational targeting.

Implementation targets:

- `src/lib/product/policy-agents.ts`
- `src/lib/agent-runtime/*`
- `src/components/ask/AskStreamPanel.tsx`

Acceptance:

- Every agent run shows inputs, selected tools, source posture, approval gates, and final artifact link.
- Risky graph/capsule/write actions require approval.

### 7. Cognee Conflict Memory

Use Cognee as an advisory memory and extraction accelerator for case-specific conflict knowledge.

Modes:

- Recall only: retrieve past case context and source summaries.
- Candidate remember: user-approved memory cards only.
- Ontology-aware cognify: use capsule overlay and OWL/custom model to extract candidate entities/relations.
- Improve: learn from accepted/rejected review cards.

Implementation targets:

- `src/lib/knowledge/context-enrichment-adapter.ts`
- `src/lib/knowledge/memory-layer.ts`
- `backend/services/cognee_memory.py`

Acceptance:

- Dataset scope remains `ownerUid__caseId`.
- Cognee hits are labeled advisory.
- Cognee cannot create Verdict nodes or canonical graph rows.
- Failed/unconfigured Cognee degrades gracefully.

### 8. Warning And Opportunity Radar

Build a capsule-scoped radar for "what changed since last read?"

Signals:

- Event count delta.
- Civilian targeting delta.
- New actor or faction mention.
- New commitment or violation allegation.
- Deteriorating humanitarian access.
- Food-security phase or price change.
- New official statement or mandate change.
- New procurement/capability opportunity.
- New contradiction between sources.
- Forecast vs observed divergence.

Implementation targets:

- Source connector layer.
- AgentRun scheduled jobs.
- Capsule health/readiness UI.

Acceptance:

- Every alert says: signal, source, baseline, delta, confidence, why it matters, and what to review.
- Alerts can produce a daily brief or principals memo.

### 9. Defense-Tech Capture And Mission-Fit Workbench

Create a sellable lane for defense-tech practitioners that is adjacent to conflict analysis but does not become tactical operations.

Jobs:

- Track public requirements, solicitations, CSOs, SBIR/STTR, SAM.gov opportunities, and procurement forecasts.
- Map opportunities to capability gaps, mission problem statements, stakeholders, competitors/partners, and evidence of need.
- Create capture briefs, qualification matrices, compliance checklists, and proposal outlines.
- Link conflict and policy context to market demand without giving targeting or operational instructions.

Implementation targets:

- New capsule bundle: `Defense-tech capability gap and procurement watch`.
- Connector: SAM.gov opportunities and award receipts.
- Output capsules: capture brief, bid/no-bid memo, capability-gap map.

Acceptance:

- A defense startup can enter a capability area and receive a reviewed opportunity map, fit score, source-backed capture brief, and next-step checklist.

### 10. Trust, Packaging, And Paid Pilot Layer

Turn the above into something teams can buy.

Paid pilot packaging:

- 3 case capsules loaded with customer sources.
- 5 scheduled briefs per week.
- 10 reviewed graph proposals.
- 1 procurement/capability radar.
- 1 analyst training session.
- 1 export pack: PDF/DOCX/PPTX/Markdown plus source annex.

Enterprise requirements:

- Team permissions.
- Audit logs.
- Source and model receipts.
- Admin policy for connectors and memory.
- Human-in-loop gates.
- Data retention controls.
- Self-hosted or cloud deployment path.
- Eval report showing PRAXIS versus generic LLM on sourceability, uncertainty, persistence, and artifact quality.

Implementation targets:

- Existing auth/team/settings surfaces.
- Existing eval harness.
- Existing deploy and health checks.

Acceptance:

- A buyer sees exactly what was ingested, remembered, inferred, proposed, approved, exported, and billed.

## Recommended Build Order

### Week 1: Productized Conflict Capsules

- Add 10 v2 conflict case bundles.
- Add source packs and ontology overlays.
- Add inspector readiness display for bundle completeness.
- Add contract tests requiring complete bundles.

### Week 2: Analytica Framework Runner

- Add the first five framework runners: ACH, sourceability, indicator watchlist, actor leverage, ceasefire verification.
- Add outputs that are directly exportable.
- Add unit tests for prompt blocks and output schemas.

### Week 3: Source Receipts And Radar

- Add ACLED, ReliefWeb, HDX HAPI, FEWS NET, and SAM.gov connector adapters as receipt-producing modules.
- Add stale/fresh/source confidence display.
- Add a "what changed" capsule radar prototype.

### Week 4: Cognee Recall And Scene Graph Prototype

- Enable disabled-safe Cognee recall canary.
- Feed recall hits into Ask as advisory context.
- Convert selected extraction output into review-gated Capsule+ graph proposals.
- Add visual graph/timeline inspection inside existing capsule inspector or workbench lane.

## What Not To Build

- No standalone OSINT dashboard as the first move.
- No autonomous targeting or tactical military recommendation feature.
- No direct social-media surveillance product as the wedge.
- No silent memory writes.
- No direct Cognee-to-canonical-graph writes.
- No claims that beta or weak sources are verified facts.
- No new top-level navigation unless the existing cockpit cannot hold the workflow.

## Why This Can Sell

The buyer pain is not only "find more information." It is:

- Too many feeds.
- Weak source discipline.
- No persistent case memory.
- Hard to explain confidence.
- Hard to reuse prior work.
- Hard to brief leaders quickly.
- Hard to convert source chaos into a decision artifact.
- Hard to prove why the AI said something.

PRAXIS should sell the workflow: build the case capsule, ingest sources, run Analytica frameworks, inspect the graph, review memory/graph proposals, and export a decision-ready brief with receipts.

## Success Metrics

- Time to first source-backed conflict brief under 10 minutes for a prepared capsule.
- At least 90 percent of generated claims linked to source receipts or explicitly marked unsupported.
- 100 percent of graph writes review-gated.
- 100 percent of Cognee recall labeled advisory.
- At least five sellable outputs: daily brief, escalation watch, actor dossier, ceasefire matrix, defense capture memo.
- Pilot customer can reuse a capsule for at least three follow-up asks without rebuilding context.

## Source List

- ACLED API: https://acleddata.com/api-documentation/acled-endpoint
- ACLED CAST: https://acleddata.com/api-documentation/cast-endpoint
- ACLED conflict exposure: https://acleddata.com/platform/conflict-exposure-calculator
- UCDP downloads: https://ucdp.uu.se/downloads/
- GDELT Cloud conflict data: https://docs.gdeltcloud.com/features/conflict-data
- ReliefWeb API: https://apidoc.reliefweb.int/endpoints
- HDX HAPI: https://hdx-hapi.readthedocs.io/
- FEWS NET API: https://help.fews.net/fdw/fews-net-api
- NASA FIRMS API: https://firms.modaps.eosdis.nasa.gov/api/
- CIA structured analytic techniques: https://www.cia.gov/resources/csi/books-monographs/a-tradecraft-primer/
- ODNI ICD 203: https://www.dni.gov/files/documents/ICD/ICD-203.pdf
- NATO AJP-2 public PDF: https://coi.nato.int/EWCOI/EW%20COI%20Shared%20Documents/EMO%20DOCTRINE%20PREP/AJP%20HARMONIZATION/AJP-2%20EDB%20V1%20E.pdf
- UNDP conflict and development analysis: https://www.undp.org/publications/conducting-conflict-and-development-analysis
- USAID CAF 2.0 summary: https://cnxus.org/resource/conflict-assessment-framework-2-0/
- OECD conflict and fragility: https://www.oecd.org/en/topics/conflict-and-fragility.html
- Cognee cognify: https://docs.cognee.ai/core-concepts/main-operations/cognify
- Cognee recall: https://docs.cognee.ai/core-concepts/main-operations/recall
- Cognee search: https://docs.cognee.ai/core-concepts/main-operations/search
- Primer AI: https://primer.ai/
- Babel Street OSINT streams: https://www.babelstreet.com/babel-street-data/data-offerings
- Palantir AIP/ontology references: https://www.palantir.com/docs/foundry/aip/overview/
- SAM.gov opportunities API: https://open.gsa.gov/api/get-opportunities-public-api/

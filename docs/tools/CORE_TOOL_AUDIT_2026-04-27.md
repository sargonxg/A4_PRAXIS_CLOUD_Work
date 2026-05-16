# PRAXIS Core Tool Audit - 2026-04-27

> Product audit and one-week coding sprint plan for a $100/month core PRAXIS
> offer. Docs-only audit. Sources inspected: `src/lib/constants/tool-registry.ts`,
> `docs/tools/*`, `docs/STRATEGY.md`, `docs/MONSTER_TODO_2026-04-27.md`,
> `docs/personas/*`, and onboarding rationale/chip docs.

## Core Offering Definition

The $100/month core PRAXIS offer should be a single-seat professional
intelligence workspace for users who need defensible conflict, diplomacy,
humanitarian, legal, political-risk, and research outputs without buying an
enterprise team deployment.

Core promise:

- One active analyst profile with role, mandate, audience, language, red lines,
  and preferred source discipline applied to every AI route.
- Situation-first workspace: every tool reads the active situation, writes a
  durable output, and can be reused by other tools.
- 12-15 flagship workflows that feel complete, persistent, cited, and exportable.
- Long-tail specialist tools are available, but clearly marked as beta or
  specialist until they meet the same persistence/provenance standard.
- Operational trust: empty states, degraded data, stale feeds, failed jobs, and
  missing context are visible rather than hidden behind confident prose.

Pricing implication: at $100/month, the product cannot feel like 52 unrelated
demos. It must feel like a compact operating system: Dashboard -> Sources /
Documents -> Analysis -> Decision Artifact -> Red Team -> Export.

### Core Flagship Bundle

The paid core should market and harden these first:

| Workflow | Flagship tools | Why it belongs in core |
|---|---|---|
| Morning awareness | Dashboard, Daily Brief, Calendar Monitor, Alert Center | Daily habit and retention loop. |
| Evidence base | Documents, Sources Library, Source Scout, Source Monitor | Trust and reusable knowledge. |
| Situation structure | Conflict Graph, Actor Profiles, Stakeholder Map, Timeline | Turns a file into an analytical model. |
| Risk and warning | Risk Monitor, Early Warning, Humanitarian, Geospatial Monitor | Operational value for most roles. |
| Decision support | Policy Memo, Briefing Room, Talking Points, Report Studio | What users can send upward. |
| Mediation and strategy | Negotiation Prep, Brainstorming Table, Scenarios, CONCORDIA | Differentiated from generic AI. |
| Accountability and constraints | Legal Tracker, Human Rights, Sanctions, Commitments | High-stakes use cases with strong willingness to pay. |
| Quality control | Red-Team Review, Advisory Council, Assistant | Makes outputs safer and more defensible. |

## Role-To-Tool Matrix

Primary means first five tools shown in sidebar/recommendations. Secondary
means next tools in the workflow.

| Worker type | Primary tools | Secondary tools | Core job-to-be-done |
|---|---|---|---|
| UN / OSCE political officer | Dashboard, Daily Brief, Briefing Room, Calendar Monitor, Legal Tracker | Risk Monitor, Stakeholder Map, Talking Points, Red-Team Review | Prepare a defensible readout before senior consultations. |
| Bilateral diplomat / country desk | Dashboard, Policy Memo, Stakeholder Map, Talking Points, Compare | Calendar Monitor, Sources Library, Briefing Room, Assistant | Turn fast-moving events into a cable, option note, or ministerial position. |
| Mediator / envoy support | Negotiation Prep, CONCORDIA, Brainstorming Table, Actor Profiles, Stakeholder Map | Mediation Designer, Game Theory, Commitments, Red-Team Review | Map positions, interests, red lines, process moves, and spoilers. |
| Humanitarian access / protection lead | Humanitarian, Risk Monitor, Geospatial Monitor, Sources Library, Daily Brief | Legal Tracker, Human Rights, Calendar Monitor, Report Studio | Build an OCHA-style operational picture with protection and access constraints. |
| IHL / accountability / sanctions analyst | Legal Tracker, Human Rights, Sanctions, Commitments, Treaty Analyzer | Documents, Calendar Monitor, Actor Profiles, Briefing Room | Track obligations, violations, proceedings, and compliance deadlines. |
| Political-risk / private-sector analyst | Risk Monitor, Economic Impact, External Actors, Sanctions, Scenario Planner | Geospatial Monitor, Source Monitor, Policy Memo, Report Studio | Assess exposure, market/security risk, and plausible future paths. |
| Think-tank / policy researcher | Documents, Deep Research Agent, Dossier, Compare, Source Scout | Conflict Graph, Media Roundup, Policy Memo, Report Studio | Produce cited long-form analysis and comparative lessons. |
| Media / disinformation analyst | Info Environment, Media Compass, Media Roundup, Source Monitor, ARGUS | Source Scout, Actor Profiles, Red-Team Review, Dossier | Explain narratives, outlet reliability, framing shifts, and influence operations. |
| Stabilization / peacebuilding program lead | Peacebuilding Index, Humanitarian, Risk Monitor, Actor Profiles, Policy Memo | Economic Impact, Scenario Planner, Sources Library, Report Studio | Prioritize interventions and monitor progress against peacebuilding pillars. |
| Election / governance specialist | Electoral Risk, Risk Monitor, Calendar Monitor, Stakeholder Map, Human Rights | Media Roundup, Source Scout, Policy Memo, Talking Points | Anticipate election violence, institutional stress, and response options. |

## Tool-By-Tool Audit

Legend: `Gap` names the highest product gap for the $100/month core offer.
`Ticket` is a concrete coding queue item, not a docs task.

| Tool | Mission | Ambition for core | AI leverage | Known gap | Specific code ticket |
|---|---|---|---|---|---|
| Dashboard | Situation overview and recommended next actions. | Become the analyst's command center, not a summary page. | Flash summary, role-aware recommendations, health/degradation synthesis. | Needs shared situation/data health and stronger "what changed" lane. | `T01`: add `src/lib/health/situation-health.ts`, wire Dashboard widgets to stale feeds, failed jobs, missing profile fields, and corpus coverage. |
| Documents | Upload and extract source material into situation knowledge. | Explainability spine: every claim links back to document/page/paragraph. | Entity extraction, OCR/layout parsing, corpus chunking. | Scanned PDFs and graph provenance remain weak. | `T02`: Document AI fallback at upload when extracted text <500 chars; persist `extractionMethod`, page, heading, table/list hints. |
| Sources Library | Curated source base with credibility scoring. | Source discipline center for every grounded output. | CRAAP scoring, source discovery, preference weighting. | Scores do not consistently propagate into media/source tools. | `T03`: normalize source records and expose a shared source reliability lookup used by Media Compass, Media Roundup, Source Scout, and Assistant. |
| Timeline | Chronological event map with escalation overlay. | Shared event backbone for briefs, warning, legal deadlines, and scenarios. | Event extraction, trigger detection, Glasl tagging. | Registry points at risk route; event persistence/versioning is unclear. | `T04`: create canonical `timeline_events` tool output contract and route/helper that accepts AI-extracted, feed, and legal/calendar events. |
| Humanitarian | OCHA-style humanitarian snapshot. | Be the flagship core tool for OCHA/NGO users. | Fuse HDX/ReliefWeb/UNHCR with calibrated analysis and gaps. | Prior audit said no dedicated route; registry now has `/api/ai/humanitarian`, but persistence/provenance still needs hardening. | `T05`: ensure `/api/ai/humanitarian` writes `tools/humanitarian`, shows extraction/feed degraded chips, and adds per-figure citations. |
| Calendar Monitor | Diplomatic and risk-window calendar. | Shared deadline/risk window layer across all tools. | Ripeness analysis, event relevance, legal/diplomatic window detection. | Uses chat route and is siloed from Legal Tracker/Commitments. | `T06`: ingest `upcomingLegalEvents`, commitment deadlines, and briefing dates into Calendar via canonical event adapter. |
| Conflict Graph | ACO knowledge graph of actors, claims, interests, events, narratives. | The structural model every serious PRAXIS workflow reads. | ACO extraction, relationship typing, graph metrics. | Hyphen/underscore persistence drift; weak document-to-node provenance. | `T07`: make registry id `conflict-graph` canonical across route/hook/save path; add node provenance drawer linked to document chunks. |
| Risk Monitor | INFORM-style multi-dimensional risk score. | Scheduled, cited risk trendline with explainable drivers. | Composite scoring, source-grounded indicators, trend synthesis. | Demo/live leakage and no confidence band on composite. | `T08`: remove live-mode demo region grid, add version history sparkline and confidence/source panel. |
| Early Warning | Glasl escalation tracking and de-escalation windows. | Alerting engine for stage transitions. | ACLED/GDELT patterning, tone signals, forecast rationale. | Demo renderer and three-way tool id mismatch. | `T09`: canonicalize `early-warning`, split live renderer from demo, schedule 6h recomputation with transition notifications. |
| Actor Profiles | Actor capability, interest, constraints, leverage dossiers. | Shared actor model for negotiation, sanctions, graph, and briefs. | Deep actor synthesis, stakeholder salience, interest mapping. | Outputs are not reliably consumed downstream. | `T10`: expose `actor_profiles` read helper and feed Negotiation Prep, Stakeholder Map, External Actors, and Dossier from it. |
| Stakeholder Map | Power/legitimacy/urgency network. | Diplomatic map of who matters and why. | Relationship extraction, salience classification, power taxonomy. | Needs provenance and better alignment with Conflict Graph. | `T11`: share graph entity canonical names and citations with Conflict Graph; add update proposal queue for actor relationship edits. |
| Compare | Comparative conflict analysis. | Fast "what case is this most like" decision aid. | Most-similar-cases selection and lessons synthesis. | Runs through chat; reference case basis can feel opaque. | `T12`: persist comparison cases with selection rationale, source citations, and reusable case links. |
| Info Environment | Narrative and influence operation assessment. | Explain how the information battlefield is shifting. | Narrative clustering, IO taxonomy, sentiment/framing analysis. | Needs tighter integration with Media Compass/Roundup. | `T13`: create shared narrative/frame schema consumed by Info Environment, Media Roundup, and Dossier. |
| Power Map | Power relationships and leverage mapping. | Turn "who can move whom" into a strategy map. | Barnett-Duvall power classification, leverage extraction. | Long-tail tool; no core workflow ownership. | `T14`: make Power Map consume Actor Profiles and External Actors outputs; persist leverage edges to graph proposals. |
| Assistant | Conversational interface over PRAXIS. | Situation notebook that can retrieve, cite, and promote outputs. | Tool calling, retrieval, grounded search, drafting. | Chat history not durable; citations are prompt-level not UI-level. | `T15`: persist chat turns under `tools/assistant` with citation/tool-call panels and "promote to Report Studio" action. |
| Report Studio | Long-form report drafting. | Core export surface for serious users. | Section drafting, hybrid AI/manual editing. | Must consume saved tool outputs and preserve provenance. | `T16`: report builder reads canonical tool output layer and inserts citation-backed sections from Dashboard, Risk, Legal, Humanitarian, and Dossier. |
| Dossier Generator | Actor/topic dossier. | Addressable, versioned research artifact. | Long-form synthesis, scenarios, gaps, recommendations. | Live renderer still demo-shaped; no dossier list/versioning. | `T17`: split live renderer from demo, add `dossiers/{dossierId}` list with topic/actor addressability and version history. |
| Talking Points | Brief spoken lines for meetings. | One-click conversion from analysis to usable language. | Audience calibration, diplomatic phrasing, red-line enforcement. | Needs to pull facts from selected source artifact. | `T18`: add "generate from selected tool output" path with source artifact id and citations. |
| Briefing Room | Slide/brief generation. | Locked, versioned meeting artifact. | Slide synthesis, speaker notes, audience tone. | Tool id drift and briefing-type picker not schema-real. | `T19`: unify id to `briefing`, branch schema by briefing type, add lock/version/diff workflow. |
| Daily Brief | 24h delta summary. | Daily habit loop at 06:00 local. | Delta detection, summarization, action recommendations. | Three ids in play; localStorage history. | `T20`: canonicalize to one id, server-side scheduled generation, 30-day version timeline, notification on material change. |
| UN Toolkit | UN drafting and terminology support. | Low-cost utility suite for UN-facing users. | UN style, resolution language, terminology conversion. | Shared calibration slots need documentation and export polish. | `T21`: add explicit subtool metadata and export/copy affordances with citations to UN source docs where applicable. |
| Scenario Planner | Alternative futures and pathways. | Risk/decision bridge from analysis to action. | Scenario generation, signposts, probability framing. | Streaming output needs durable artifacts. | `T22`: persist each scenario set with signposts, indicators, assumptions, and revision history. |
| Negotiation Prep | ZOPA/BATNA/red-line mapping. | Signature mediator workflow. | Interest/position extraction, deal-space synthesis. | Live mode can show the selected situation parties; actor profile output not consumed. | `T23`: drive parties from `situation.actors` + saved Actor Profiles; replace one-shot output with editable positions/interests grid. |
| Brief Builder | Agentic brief workflow. | Make multi-step synthesis editable before final. | Synthesis-chair persona, critique and assembly. | Needs durable agent runtime/provenance. | `T24`: migrate to LangGraph/Cloud Tasks after Brainstorming Table pattern lands. |
| Red-Team Review | Critique outputs before briefing upward. | Mandatory QA on every important artifact. | Structured analytic challenge, dissenting view, evidence gap detection. | Not wired as a universal action. | `T25`: add artifact-level "Run Red Team" action from Briefing, Policy Memo, Dossier, Report Studio, and Daily Brief. |
| Source Scout | Find and rank source coverage. | Source acquisition workflow for every new situation. | Agent persona, grounded search, credibility/relevance scoring. | Needs source additions to feed Sources Library automatically with approval. | `T26`: Source Scout proposals write to a review queue, then accepted sources update Sources Library and retrieval preferences. |
| Brainstorming Table | Multi-expert deliberation table. | Signature $100/month differentiator for policy teams. | Persona turns, critique, synthesis, confidence and dissent. | Needs durable run, interrupt/resume, edit-before-synthesis. | `T27`: LangGraph + Cloud Tasks implementation with checkpoint recovery and canonical `tools/brainstorming-table` output. |
| CONCORDIA | Mediation simulation/chat. | Practice room for shuttle diplomacy and process strategy. | Role-play grounded in actors and prior tools. | Not auto-primed from Actor Profiles/Negotiation Prep. | `T28`: prime simulation context from Actor Profiles, Negotiation Prep, Commitments, and red lines. |
| Mediation Designer | Process architecture and CBM planning. | Turn analysis into a mediation plan. | Process design, sequencing, spoiler mitigation. | Overlaps with CONCORDIA/Negotiation Prep without shared data. | `T29`: share process-plan schema and allow export to Policy Memo, Briefing Room, and Commitments. |
| Game Theory | Strategic interaction modeling. | Compact strategy sandbox for advisors/mediators. | Payoff reasoning, move/countermove analysis. | Needs explainable assumptions and editable payoff table. | `T30`: add editable payoff assumptions and citation-backed actor preference inputs from Actor Profiles. |
| Deep Research Agent | Multi-phase research pipeline. | Premium research run that survives tab close. | Planning, search, synthesis, source grounding. | No multi-session durable storage; collides with `deep-research`. | `T31`: move sessions to `users/{uid}/agentSessions/{sessionId}` and persist final synthesis under `tools/deep-search-agent`. |
| ARGUS Intelligence | URL/web intelligence extraction. | Turn found material into permanent situation knowledge. | Crawl, extraction, confidence scoring. | Demo tabs in live mode; output not promoted to Documents. | `T32`: ARGUS run can create Document rows and graph extraction proposals; hide demo-only tabs in live mode. |
| Media Compass | Outlet bias/reliability map. | Situation-specific source reliability layer. | Bias/reliability assessment, source mapping. | Duplicate routes and static source list dominate. | `T33`: choose one route, one persistence key, and compute outlets from Sources Library + recent coverage. |
| Media Roundup | Current framing and quotes by outlet. | Narrative diff for media/influence analysts. | Article clustering, tone/theme extraction. | Client-side heuristics and hard-coded media DB. | `T34`: replace string heuristics with route-provided frame schema and shared outlet reliability registry. |
| Sanctions Tracker | Sanctions exposure and designations. | Core legal/economic constraint tool. | Designation matching, sanctions-effect synthesis. | Needs current source provenance and actor linking. | `T35`: map sanctioned entities to canonical Actor Profiles and show source authority/date per designation. |
| Commitment Tracker | Ceasefire/agreement commitment monitoring. | Compliance ledger for mediation/legal workflows. | Commitment extraction, violation tracking, deadline alerts. | Calendar and Legal Tracker integration weak. | `T36`: commitments emit calendar deadlines and graph edges through proposal queue. |
| Treaty Analyzer | Treaty obligations and instruments. | Legal constraint reference for serious users. | Treaty parsing, compliance synthesis. | Needs source document provenance and cross-link to Legal Tracker. | `T37`: share legal obligation schema with Legal Tracker and add official-source links per instrument. |
| Alert Center | Scheduled alerts and notifications. | Converts PRAXIS from pull to push product. | Risk/feed trigger summarization. | Firestore-only notifications; email path queued. | `T38`: add email notification function for red/yellow alerts with dedupe and audit events. |
| ARGUS Grounded | Grounded deep research stream. | Should merge with Deep Research or ARGUS family. | Grounded search and synthesis. | Confusing overlap with Deep Research Agent and ARGUS. | `T39`: product-decision ticket: rename, merge, or hide until differentiated; separate persistence from `deep-search-agent`. |
| Geospatial Monitor | Map event geography and hotspots. | Visual risk/event lens for security/humanitarian users. | Geocoding, event summarization, hotspot analysis. | Data route and role filters need maturity. | `T40`: add role/domain event filters and persist map snapshots with source/date provenance. |
| Case Library | Reference conflict cases. | Comparative memory and onboarding/demo base. | Case retrieval and structured comparison. | Static library unless connected to Compare/Dossier. | `T41`: expose case citations and "send to Compare" action; standardize case dimensions with Compare. |
| Team Hub | Collaboration hub. | Not core single-seat; team upsell. | Future collaboration summaries, comments, version history. | Placeholder. | `T42`: hide or mark as Team-plan preview in core until RBAC/comment/versioning exists. |
| Advisory Council | Ten expert AI perspectives. | Premium multi-perspective review. | Persona ensemble, red-team, domain expert framing. | Overlaps with Brainstorming Table without artifact persistence. | `T43`: persist advisory runs and add "send selected advisors to Brainstorming Table" pattern. |
| Settings | Account and AI/output configuration. | Where users see profile, sources, exports, and safety settings. | Custom instructions and model tier selection. | Commercial surface should hide private credit internals unless intentional. | `T44`: align Settings with core plan: export defaults, citation style, red lines, source preferences, profile completeness. |
| Policy Memo | Policy options memo with Putnam/SWOT analysis. | Flagship decision artifact for $100/month. | Options generation, feasibility/risk scoring, precedents. | Putnam win-set promise not visible enough; versioning absent. | `T45`: render Level I/II win-set visual, add memo version history, export to Report Studio. |
| Human Rights Monitor | IHL/IHRL violations and accountability. | Core for NGO/legal/humanitarian users. | Violation classification, perpetrator attribution, accountability tracks. | Needs strong citations and Legal Tracker linkage. | `T46`: per-violation source/evidence table and cross-link to ICC/ICJ/UNSC items in Legal Tracker. |
| Electoral Violence Risk | Election-phase violence risk. | Specialist core for election/governance users. | Phase-based risk factors, indicator synthesis. | Needs Calendar and Media integration. | `T47`: create election timeline with pre/election/post windows, media rhetoric signals, and alert triggers. |
| External Actor Monitor | Proxy, diaspora, foreign support mapping. | Explains outside leverage and escalation. | Sponsor/proxy classification, involvement modes. | Needs actor graph and sanctions/economic cross-links. | `T48`: write external actor relationships as graph proposals and feed Sanctions/Economic Impact. |
| Peacebuilding Index | Six-pillar post-conflict scorecard. | Stabilization program dashboard. | Pillar scoring, benchmark synthesis. | Long-tail; must not be generic score prose. | `T49`: add indicator source table per pillar and trend/version history. |
| Economic Impact | GDP/trade/sanctions/reconstruction cost modeling. | Political-risk and stabilization value driver. | Economic cost modeling, peace dividend estimates. | Needs source/data caveats and integration with Sanctions. | `T50`: add source-backed economic assumptions table and sanctions impact linkage. |
| Legal & Resolution Tracker | ICC/ICJ/UNSC/resolution compliance. | Flagship legal constraint workflow. | Legal issue extraction, compliance tracking, milestones. | Prior audit found calibration drift; now verify fix and add citations. | `T51`: assert `withCalibration('legal_tracker')`, add per-resolution/case source URL and push upcoming events to Calendar. |
| Source Monitor | Automated source scan alerts. | Retention loop for analysts tracking known sources. | Relevance scoring and new-publication alerts. | Hidden/cron-like; needs user-facing source health. | `T52`: add source health panel, custom source persistence, and notification wiring for high-relevance publications. |

## Cross-Tool Product Findings

1. The biggest paid-core risk is not tool breadth; it is uneven tool maturity.
   The current 52-tool registry must be grouped into flagship, specialist, beta,
   and admin/hidden surfaces.
2. Tool persistence remains a product-killing issue. Registry ids, server write
   ids, hook ids, and route ids must converge before marketing serious saved
   workflows.
3. Provenance must be visible, not just embedded in prompts. Every flagship
   output needs citations, confidence, source recency, and intelligence gaps.
4. Demo/live separation is still a trust issue. A $100/month buyer should never
   see the selected situation-like constants in a real situation unless clearly labelled demo.
5. Expensive runs must become durable artifacts. Deep Research, Dossier,
   Briefing, Policy Memo, Brief Builder, Brainstorming Table, and Advisory runs
   should survive reloads, be versioned, and be exportable.
6. Role calibration is strategically strong in onboarding, but the UI should
   prove it: recommended tools, default templates, source boosts, and red-line
   behavior need visible traces.
7. The Operational Spine is the right engineering direction. Tool runs, jobs,
   events, TTL, retry states, and degraded states should be part of flagship
   acceptance criteria, not internal observability.

## One-Week Sprint Plan

Objective: make the $100/month core feel credible by improving the first-run
path and the highest-value artifacts, without adding more tools.

### Day 1 - Canonical IDs and Core Packaging

- Freeze core taxonomy: `flagship`, `specialist`, `beta`, `workspace/admin`.
- Implement `TOOL_PERSISTENCE_KEY`/`toolKey()` so registry id is the canonical
  Firestore key.
- Write migration map for known drift: `conflict_graph`, `briefing_room`,
  `daily_brief`, `escalation_scan`, `policy_memo`, `media_compass`,
  `media_roundup`, `deep_research`.

### Day 2 - Persistence for Expensive Artifacts

- Make Deep Research Agent, Policy Memo, Briefing Room, Dossier, and Assistant
  reload from canonical persisted outputs.
- Add version history for Policy Memo and Briefing Room.
- Stop overwriting previous outputs without a visible version.

### Day 3 - Provenance and Degraded States

- Standardize `<Citation>`, `<ConfidenceBadge>`, and
  `<OutputProvenancePanel>` for flagship tools.
- Add visible degraded chips for feed failures and stale data.
- Remove or label demo fallback data on Risk Monitor, Early Warning,
  Negotiation Prep, ARGUS, Humanitarian, and Conflict Graph.

### Day 4 - Evidence Spine

- Land Document AI fallback and structured extraction validation.
- Add document chunk provenance to Conflict Graph nodes.
- Make Source Scout accepted proposals update Sources Library.

### Day 5 - Decision Artifacts

- Policy Memo: render Putnam Level I/II win-set visual and source-backed
  option table.
- Briefing Room: real briefing-type branching, lock/version/diff.
- Daily Brief: server-side 06:00 generation and 30-day timeline.

### Day 6 - Mediation / Strategy Differentiator

- Brainstorming Table LangGraph/Cloud Tasks durable run.
- Negotiation Prep editable positions/interests/red-lines grid.
- Red-Team Review action available from every decision artifact.

### Day 7 - Health, QA, and Paid-Core Readiness

- Situation/data health helper feeds Dashboard and Admin Console v2.
- Run top-tool schema/eval harness for flagship outputs.
- Update landing/pricing copy to sell the core bundle, not a 52-tool list.

## Top 15 Coding Priorities

| Rank | Priority | Why it matters |
|---|---|---|
| 1 | Canonical tool persistence key across registry, routes, hooks, and migration. | Saved outputs must reload reliably before anything else matters. |
| 2 | Situation/data health helper with stale feeds, failed jobs, missing profile fields, and degraded corpus coverage. | Dashboard becomes trustworthy and operational. |
| 3 | Document AI fallback for scanned/layout-heavy PDFs. | Real policy/humanitarian PDFs become usable. |
| 4 | Structured ACO extraction validation with loud failures. | Prevents silent empty/invalid graph state. |
| 5 | Provenance panel and citation/confidence primitives across flagship tools. | Makes outputs defensible enough to brief upward. |
| 6 | Deep Research Agent multi-session persistence. | Protects high-cost research runs from tab close/reload. |
| 7 | Brainstorming Table LangGraph + Cloud Tasks durable runtime. | Ships the most differentiated agentic workflow. |
| 8 | Briefing Room lock/version/diff plus real briefing-type schema branching. | Converts a generated deck into a meeting artifact. |
| 9 | Policy Memo Putnam win-set visual and version history. | Makes the advertised framework visible and valuable. |
| 10 | Humanitarian route/page persistence with per-figure citations and degraded feed states. | Raises a high-value persona workflow to paid quality. |
| 11 | Negotiation Prep live actor/profile integration and editable grid. | Removes demo leakage and improves mediator value. |
| 12 | Calendar integration from Legal Tracker and Commitments. | Turns legal/process deadlines into situational awareness. |
| 13 | Source Scout -> Sources Library approval flow. | Converts research into durable source discipline. |
| 14 | Red-Team Review as universal artifact action. | Adds safety and analytical rigor to every paid output. |
| 15 | Email/high-priority notification path for Alert Center and Source Monitor. | Creates retention outside the app. |

## Sprint Exit Criteria

- A new user with a complete analyst profile can create a situation, upload a
  document, generate a Dashboard/Daily Brief, run Risk or Humanitarian, create
  a Policy Memo or Briefing, red-team it, reload the page, and find every
  artifact still present with citations.
- Top 12 flagship tools have canonical persistence keys and no unlabelled demo
  data in live mode.
- Expensive tools have durable runs or versioned artifacts.
- Dashboard reports missing/degraded/stale conditions explicitly.
- Docs and monster queue point implementation agents to this audit.

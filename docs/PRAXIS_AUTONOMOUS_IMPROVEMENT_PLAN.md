# PRAXIS Autonomous Improvement Plan

Date: 2026-05-01  
Workspace: `C:\Users\giuli\praxiscodexworking`  
Branch: `main`  
Production: `https://praxis.tacitus.me`
Research synthesis: `docs/PRAXIS_DEEP_RESEARCH_SYNTHESIS_2026-05-01.md`
Latest execution wave: Context Builder workspace

## 2026-05-01 Research Ingest - Monster Backlog

The user-provided production research artifact was ingested into
`docs/PRAXIS_DEEP_RESEARCH_SYNTHESIS_2026-05-01.md`. The actionable thesis is:
PRAXIS wins by turning user and AI context into typed, source-grounded conflict
grammar objects, then using those objects for boardroom agents, graph reasoning,
auditable outputs, and future Dialectica premium graph capabilities.

Highest-priority backlog now driving execution:

1. First-class Context Builder for user-specific situation creation and missing
   context repair. Status: implemented in this wave at `/app/context-builder`.
2. Typed source receipts and citation objects across Source Scout, boardroom,
   reports, and deep research.
3. Four-expert boardroom artifact with explicit dissent preservation.
4. Graph-ready conflict grammar schemas for actors, claims, interests,
   constraints, leverage, commitments, events, and narratives.
5. Human-reviewed graph mutation queue with PROV-O-style provenance records.
6. Returning-user "what changed" digest.
7. Hybrid retrieval plan spanning documents, source library, event feeds, graph,
   and web search.
8. Dialectica adapter boundary behind feature flags with Firestore fallback.
9. OpenTelemetry/OpenInference trace spine for AI/tool calls.
10. Compliance/data-boundary roadmap for sensitive policy and security users.

## Phase 1 - What PRAXIS Is Today

Confirmed from code, not assumed:

- PRAXIS is a Next.js 16 App Router application with a private Python FastAPI
  backend, Firebase Auth, Firestore, Cloud Run, Cloud Build, Vertex/Gemini AI,
  GDELT/UCDP/ReliefWeb/HDX/UN News/World Bank-style open-data integrations,
  Firecrawl support, document parsing, and graph-oriented situation memory.
- The product has two experiences:
  - `/demo/*`: isolated Nordalia sample workspace.
  - `/app/*`: authenticated real workspace with user-created situations.
- Core user flow:
  1. sign in,
  2. complete analyst profile onboarding,
  3. create/select a situation,
  4. add source/context inputs,
  5. run calibrated tools,
  6. save tool outputs,
  7. reuse those outputs through dashboard, graph, reports, advisors, and Ask
     PRAXIS.
- Important architecture contracts:
  - Every serious AI route should use `withCalibration`.
  - Prompt context is assembled from analyst profile, situation, domain, and
    Situation Knowledge Core retrieval.
  - Tool outputs should persist through the Firestore tool-data path.
  - High-value work should be observable through the operational spine.

## Phase 2 - Customer-Fit Scouting

| User | Actual workflow today | What PRAXIS can improve | Valuable UI/tool | Data needed | Output they would pay for |
|---|---|---|---|---|---|
| UN political affairs officer / diplomat | Daily source triage, actor posture, senior briefing, talking points | Compress source review into a cited political operating picture | Situation launchpad, source scout, early warning, actor profiles, policy memo | Official statements, reports, media, actors, dates, prior commitments | Daily political read with risks, actor shifts, and recommended diplomatic next steps |
| Mediator / envoy team | Map parties, interests, spoilers, process options, CBMs | Turn scattered notes into negotiation space and process design | Stakeholder map, negotiation prep, mediation design, boardroom experts | Parties, demands, grievances, prior agreements, mediator mandate | Mediation prep pack with interests, spoilers, CBMs, sequencing, draft lines |
| Intelligence analyst | Track hypotheses, sources, confidence, indicators, timelines | Make assumptions, evidence gaps, and confidence explicit | Competing hypotheses, timeline reasoning, source receipts, graph view | Signals, source reliability, actor/event data, historical context | Cited assessment with indicators, confidence, collection gaps, and alternative hypotheses |
| Defense planner / influence analyst | Monitor escalation, capabilities, logistics, narratives, adversary options | Connect events, actors, geography, information environment, and red-team scenarios | Early warning, geospatial, info environment, red-team review, scenario builder | Incidents, deployments, terrain, public doctrine, narratives, media sources | Options memo with escalation pathways, risks, influence environment, and decision triggers |
| Enterprise crisis strategy lead | Understand exposure, scenarios, stakeholder risks, executive comms | Convert political/security uncertainty into board-ready options | Executive intelligence, risk monitor, scenario planner, talking points | Assets/interests, regions, counterparties, sanctions, media, market/policy signals | Executive risk brief with scenarios, triggers, mitigations, and source basis |

## Phase 3 - Product Audit

Immediate UX improvements:

1. Make empty states mission-specific and tied to real workflows.
2. Show what inputs are needed before first AI output.
3. Show first pay-worthy deliverables per workflow.
4. Make returning-user stale/missing context obvious.
5. Show clear source and graph readiness on dashboard and tools.

Decision-support improvements:

1. Add assumptions register per situation.
2. Add competing hypotheses panel.
3. Add decision memo generator tied to source receipts.
4. Add "what changed since last session" digest.
5. Add decision triggers and watch indicators per workflow.

AI/agent improvements:

1. Make four-advisor boardroom runs first-class saved artifacts.
2. Add agent/tool trace visibility.
3. Add source-search plans before expensive research.
4. Require structured outputs for every major decision tool.
5. Add red-team/blue-team escalation workflow.

Visualization improvements:

1. Timeline/event reasoning view tied to sources.
2. Actor/stakeholder map with interests, leverage, and confidence.
3. Source coverage and evidence diversity heatmap.
4. Graph diffs for returning users.
5. Scenario tree with indicators and decision points.

Workflow/productization improvements:

1. Mission playbooks for each workflow path.
2. Guided context builder from blank situation to first useful output.
3. Tool package readiness and recommended next action per workflow.
4. Exportable boardroom/briefing artifact.
5. Premium Dialectica graph adapter path.

## Phase 4 - Technical Audit

Frontend:

- The App Router structure is broad and mature, with 40+ app routes and many
  tool pages. Shared wrappers exist, but not every page uses the same shell.
- Some pages still have lint warnings for unused values and React hook
  dependency/state-in-effect patterns.
- Empty states are improving but still need more mission-specific guidance.

API routes:

- Most AI routes are calibrated and save outputs.
- Route audit scripts exist and should keep blocking new uncalibrated routes.
- The fastest product leverage is not adding more AI routes; it is making
  existing outputs easier to trust, compare, save, and export.

State/auth/data:

- Firebase Auth and Firestore are primary for real users.
- Demo mode is isolated and should stay visibly separate.
- Situation fields already support workflow path, source URLs, notes, domain,
  source category preferences, custom sources, graph counts, document counts,
  and tool-output persistence.

Graph/timeline/simulation:

- Firestore remains canonical graph storage, with derived graph backends
  planned or optional.
- GraphOps and context health exist and should become more user-facing.
- Timeline extraction exists but needs stronger UI connection to source and
  decision reasoning.

Deployment:

- Cloud Build frontend-only and full deploy paths exist.
- Production checks include health, Firebase auth test, and browser smoke.

## Phase 5 - Build Waves

Critical improvements:

1. Mission-specific workflow playbooks in onboarding and dashboard.
2. Context Builder page that makes missing inputs actionable.
3. Boardroom Run artifact for four-expert deliberation.
4. Search-plan and source-receipt UX across AI outputs.
5. Returning-user "what changed" digest.

Secondary improvements:

1. Assumptions register.
2. Competing hypotheses panel.
3. Decision memo generator with source receipts.
4. Graph diff/maintenance review.
5. Better tool shell adoption across remaining pages.

Exploratory product bets:

1. Dialectica premium ontology adapter.
2. Red-team/blue-team scenario room.
3. Influence operations narrative board.
4. Defense planning event/capability map.
5. Institution/team shared knowledge graph.

## Implemented In This Wave

### Mission Playbooks

Changed:

- Extended `src/lib/constants/policy-workflow-paths.ts` with:
  - actual workflow,
  - valuable UI,
  - paid output,
  - first-run question,
  - required inputs.
- Updated `/app/situations/new` so workflow selection and review show the
  practical mission playbook, not only a label.
- Updated `NoSituationState` so a blank workspace offers concrete mission
  templates.
- Updated the dashboard Situation Launchpad so an existing situation reminds
  the user what deliverable the chosen workflow is trying to produce.
- Added regression tests for workflow playbook completeness.

Why it matters:

- New users understand what PRAXIS is for before they create a situation.
- The situation wizard asks for context in terms of real professional outputs.
- Returning users see the workflow's first boardroom question and required
  inputs from the dashboard.
- This supports customer discovery because every path now states what a buyer
  would actually pay to receive.

How to test:

1. Open `/app/situations/new`.
2. Select each workflow path and confirm the playbook text changes.
3. Review the situation and confirm the workflow playbook panel is present.
4. Visit a tool without an active situation and confirm the empty state offers
   mission templates.
5. Open dashboard for a situation with `workflowPath` and confirm the
   launchpad shows paid output, first-run question, and required inputs.

Future improvements:

- Persist the first-run question into a boardroom run template.
- Use required inputs to power a true Context Builder checklist.
- Generate a suggested Deep Search prompt from each workflow path.
- Add workflow-specific source receipt quality bars.

## Phase 6 - Defense / Diplomacy Adaptations

Viable adaptations:

| Adaptation | UI change | Backend/data change | AI prompt/tool change | Easiest high-value version |
|---|---|---|---|---|
| Conflict mapping | Add workflow-specific actor/relationship checklist | Reuse graph entities and source receipts | Ask for actors, claims, interests, commitments | Add context builder checklist |
| Early warning | Show trigger indicators and stale signals | Use timeline/feed/tool outputs | Require indicators, confidence, and source dates | Add returning-user change digest |
| Sanctions/leverage | Add leverage and sanctions matrix | Reuse actors, sources, sanctions tool output | Structured designation/evasion schema | Add decision memo section |
| Negotiation prep | Add party-interest-spoiler board | Reuse stakeholder and advisor outputs | Ask four advisors for process risk | Boardroom run artifact |
| Information environment | Add narrative/source diversity panel | Reuse media/info outputs | Structured claims/amplifiers schema | Source receipt and contradiction UI |
| Red-team / blue-team | Add scenario room | Save scenario branches | Separate adversary/friendly assumptions | Red-team review artifact |
| Political risk briefing | Add executive risk memo | Reuse risk, scenario, source outputs | Structured risk/trigger/options schema | Decision memo generator |
| Strategic options memo | Add options comparison | Save assumptions and choices | Require pros/cons/risks/evidence | Policy memo upgrade |

## Phase 7 - Documentation

This document is the working autonomous plan. Related docs to update in later
waves:

- `docs/USER_WORKFLOWS.md`: turn the customer-fit table into user-facing
  workflow specs.
- `docs/TECHNICAL_NOTES.md`: summarize shell adoption, AI output contracts,
  and route/tool audit findings.
- `README.md`: update only when the product surface or setup changes materially.

## Phase 8 - Validation Plan

Run after this wave:

- `npx vitest run tests/unit/lib/constants/policy-workflow-paths.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run lint`
- `npm run build`

Known residual risk:

- This wave improves guided flows and product clarity; it does not yet create
  a persisted boardroom-run artifact or context-builder checklist.

## Best Next 10 Improvements

1. Build `/app/context-builder` for profile, sources, documents, graph,
   assumptions, tool outputs, and advisor memory.
2. Add boardroom run artifacts with advisor turns, dissent, synthesis,
   citations, graph references, and user decision.
3. Add source-search plan UI and source receipt chips to every AI result.
4. Add returning-user "what changed since last session" digest.
5. Add assumptions register linked to tools and reports.
6. Add competing hypotheses panel with evidence for/against.
7. Upgrade decision memo generator around options, risks, evidence, and
   recommended action.
8. Add graph diff review and analyst-approved graph mutation queue.
9. Add workflow-specific Deep Search prompts generated from mission playbooks.
10. Add Dialectica premium adapter interfaces behind a feature flag.

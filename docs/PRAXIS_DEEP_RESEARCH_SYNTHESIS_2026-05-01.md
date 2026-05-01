# PRAXIS Deep Research Synthesis - 2026-05-01

Source: user-provided production planning research artifact in the Codex session on 2026-05-01.

Purpose: convert the research into an execution backlog for praxis.tacitus.me. This is not a demo roadmap. It is the working product spine for a decision-support system used by diplomats, mediators, security analysts, humanitarian operators, and strategic teams.

## Core Thesis

PRAXIS should be differentiated by structured reasoning over a conflict grammar with provenance. The winning product is not another chatbot or generic search layer. It is a persistent situation workspace where user-provided and AI-discovered context becomes typed actors, claims, interests, constraints, leverage, commitments, events, and narratives, then flows into boardroom agents, graph reasoning, source receipts, and exportable decision products.

## Product Architecture Implications

1. Keep Firestore as the standard-tier system of record while preventing Firestore-specific assumptions from leaking into product code.
2. Treat Dialectica as a premium graph backend adapter, not a rewrite or migration cliff.
3. Use typed context objects and source receipts before adding another AI surface.
4. Make user-specific situation context a first-class product flow: onboarding, context builder, graph population, boardroom run, export.
5. Preserve disagreement in the four-expert boardroom through explicit critic/dissent structure.
6. Add observability and cost accounting around every AI/tool call.
7. Store provenance separately from facts so mutation review, audit, and export remain clean.
8. Keep the app deployable and self-serve; do not require forward-deployed engineering to get value.

## Monster TODO

### Critical Improvements

1. Context Builder workspace for every active situation.
   - What changed in this wave: route-level planner and UI shipped at `/app/context-builder`.
   - Why it matters: users can see what PRAXIS needs before trusting AI output.
   - How to test: create or select a situation, open Context Builder, verify checklist, missing context, tool sequence, and research prompt.
   - Future improvement: allow inline editing of situation fields and source priorities from the page.

2. Typed source receipts as a canonical data structure.
   - Build `Citation` and `SourceReceipt` schemas for answer spans, source metadata, retrieval method, confidence, hash, and timestamp.
   - Replace ad hoc citation rendering in boardroom, source scout, reports, and deep research.

3. Four-expert boardroom run artifact.
   - Store chair framing, four advisor outputs, synthesis, dissent, citations, tool calls, cost, and latency.
   - Make dissent a required output, not a collapsed prose paragraph.

4. Graph-ready conflict grammar.
   - Define first-class TypeScript and Zod schemas for Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, and Narrative.
   - Require major AI routes to output graph-ready primitives when applicable.

5. Mutation review and provenance.
   - Proposed graph changes should enter a review queue.
   - Approved mutations should write a provenance activity with human or agent attribution.

### Secondary Improvements

1. Returning-user "what changed" digest for every situation.
2. Command palette for tool discovery and mission packages.
3. Hybrid retrieval plan: source-library, document corpus, structured event feeds, graph traversal, and reciprocal rank fusion.
4. Assumptions register and competing hypotheses panel.
5. Exportable brief/memo with embedded source receipt JSON.
6. Tool output freshness and source-staleness warnings on dashboard and production pages.
7. Situation-level data boundary checklist for classified, ITAR/EAR, CUI, personal data, and sensitive humanitarian data.
8. Public/private dataset licensing registry for ACLED, UCDP, GDELT, PA-X, sanctions lists, IATI, and UN Treaty Collection.
9. Boardroom trace view using OpenTelemetry/OpenInference-compatible spans.
10. Evaluation harness for citations, dissent preservation, factual grounding, and multi-hop reasoning.

### Exploratory Bets

1. Dialectica adapter behind feature flags with graceful degradation to Firestore.
2. CozoDB/Datalog proof of concept for transitive commitments and contradiction detection.
3. LazyGraphRAG or GraphRAG indexing for premium global queries.
4. ULTRA-style link prediction for suggested missing graph edges, always gated by human review.
5. Scenario forks with graph diffs and time-travel reasoning.
6. HippoRAG-style situation memory over long-running cases.
7. Multilingual source ingestion with translation provenance.
8. Geospatial event layer over ACLED/GDELT/UCDP/HDX data.
9. SOC 2 and ISO 27001 readiness backlog for policy/security customers.
10. Public conflict-grammar export format for partners and future Dialectica integration.

## Immediate Execution Waves

### Wave A - Context Creation

Status: in progress.

Targets:
- Add a first-class Context Builder route.
- Surface context health, missing inputs, first boardroom question, tool sequence, and a reusable deep-research handoff prompt.
- Link the route from the sidebar and situation launchpad.
- Add unit coverage for planner behavior.

### Wave B - Source Receipts

Status: in progress.

Implemented in this follow-on wave:
- Added a canonical frontend receipt type with receipt id, source id,
  retrieval method, reliability, confidence, span quote, content hash, and
  optional graph/tool/advisor references.
- Extended the Source Scout receipt builder so generated receipts include the
  canonical fields while remaining compatible with existing outputs.
- Added a client-safe normalizer for older saved receipt shapes.
- Added a reusable `<SourceReceiptList />` component and wired it into Source
  Scout and the shared provenance panel.
- Added unit tests for canonical receipt generation and legacy normalization.

Remaining targets:
- Add inline citation chips for narrative/report text spans.
- Wire source receipt panels into briefing, policy memo, and boardroom outputs.
- Persist receipt objects in future `ToolOutputEnvelope` records without
  flattening them to display-only chips.

### Wave C - Boardroom Artifact

Targets:
- Define `BoardroomRun` schema.
- Store four advisor outputs, synthesis, dissent, citations, and tool call trace.
- Add a readable boardroom run view.
- Add "preserve disagreement" prompt contract and tests.

### Wave D - Graph Mutation Review

Targets:
- Define mutation proposal schema.
- Add pending/rejected/approved review UI.
- Write provenance records for approved changes.
- Prepare adapter boundary for Dialectica/Cozo without requiring either backend now.

### Wave E - Demo and Promo Readiness

Status: in progress.

Implemented in this follow-on wave:
- Added an in-app Demo Guide route for recording a concise PRAXIS walkthrough
  across dashboard, Context Builder, Source Scout, GraphOps, boardroom, and
  briefing.
- Added sidebar access to the guide so demo operators do not need an external
  script.
- Added provenance/trust framing to the Advisory output through
  `ToolOutputFrame`.
- Extended persisted tool data access so custom pages can read metadata,
  source receipts, profile version, and tool run id from canonical envelopes.

Remaining targets:
- Add a public landing-page CTA that can send evaluators directly into the
  guided demo flow after demo login.
- Add compact evidence summary bars to briefing, boardroom, reports, and
  assistant tool calls.
- Label or replace mock report sources before recording customer-facing video.

## Deep Research Prompts Needed Next

1. "Compare current production patterns for citation/source receipt UX in Perplexity Enterprise, NotebookLM Enterprise, Anthropic Citations, CoCounsel, and STORM/Co-STORM. Return data structures, UI patterns, anti-patterns, and implementation recommendations for PRAXIS."
2. "Design a TypeScript/Zod conflict grammar for diplomacy and security analysis covering Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative, FiscalFlow, LegalClause, and AdvisorReasoningStep. Include JSON-LD export mapping and PROV-O provenance."
3. "Research OpenTelemetry/OpenInference instrumentation for Next.js 16, Vercel AI SDK, Gemini/Vertex AI, Anthropic, and tool calls. Return a low-risk PRAXIS implementation plan with cost controls."
4. "Evaluate LangGraph vs Vertex ADK vs direct AI SDK orchestration for a four-expert boardroom with dissent preservation, streaming UI, checkpointing, Firestore persistence, and human approval gates."
5. "Research Firestore vector search, Vertex AI Search, BigQuery vector search, BM25, reciprocal rank fusion, GraphRAG, LazyGraphRAG, HippoRAG, and CozoDB for a staged PRAXIS retrieval architecture."
6. "Define a SOC 2 / ISO 27001 / FedRAMP Moderate readiness roadmap for a diplomacy/security SaaS that handles sensitive but unclassified user data."
7. "Identify data-source licenses and ingestion constraints for ACLED, UCDP-GED, GDELT, ICEWS, PA-X, OFAC, EU sanctions, UK OFSI, UN sanctions, IATI, HDX, UN Treaty Collection, Wikidata, V-Dem, World Bank, IMF, SIPRI, and GeoNames."
8. "Analyze competitor workflows in Palantir AIP/Foundry, Primer, Recorded Future, Sayari, FiscalNote, Relativity, Perplexity Enterprise, NotebookLM Enterprise, Hebbia, Harvey, and CoCounsel. Focus on what PRAXIS should copy, avoid, and differentiate."
9. "Design a Dialectica adapter interface for PRAXIS with feature flags, Firestore fallback, Cozo/Datalog premium backend, migration/downgrade behavior, and capability errors."
10. "Build an evaluation rubric and seed benchmark for PRAXIS answers: factual grounding, citation precision, source diversity, dissent preservation, uncertainty calibration, multi-hop graph reasoning, and decision usefulness."

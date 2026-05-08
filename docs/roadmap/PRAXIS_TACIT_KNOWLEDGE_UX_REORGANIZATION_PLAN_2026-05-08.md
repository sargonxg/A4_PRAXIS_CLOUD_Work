# PRAXIS Tacit Knowledge UX Reorganization Plan

Date: 2026-05-08

Status: proposal for Giulio approval

Repository: `C:\Users\giuli\praxiscodexworking`

## Executive Intent

PRAXIS should become easier to understand without becoming less powerful.

The product should no longer feel like a collection of tabs, tools, graphs, memos, and experiments. It should feel like one clear application:

> PRAXIS captures the tacit structure of policy analysis so a Situation can be inherited by the next analyst and safely used by AI.

The existing codebase already contains the important pieces: Workbench, Context, Library, Research, Ontology, Graph, Tools, Memos, Draft, ACH, Boardroom, Ask PRAXIS, Cognee boundary code, trust/evidence surfaces, source receipts, graph primitives, marketplace contracts, SAT tools, and export paths. This plan reorganizes those pieces around a clearer customer story and a more investable UX.

## Three-Pass Product Test

### Pass 1: Customer Test

A user should understand PRAXIS in one sentence:

> Open a Situation, improve its context, and produce a trusted handover or brief.

They should not need to understand Cognee, GraphRAG, ACO, ontology versions, provider routing, or marketplace foundations. Those remain product infrastructure.

### Pass 2: Investor Test

An investor should see a hard wedge:

- Rotation tax is expensive and measurable.
- Files transfer; tacit desk knowledge does not.
- PRAXIS captures that tacit context into a structured Situation model.
- The same model improves human handover and AI generation accuracy.
- The platform expands through tools once the core handover wedge is proven.

### Pass 3: Engineering Test

The plan should reuse the shipped system:

- Keep current routes and components where possible.
- Add aliases and orchestration before deleting surfaces.
- Preserve Cognee/context creation backstage.
- Preserve the tool marketplace as advanced capability.
- Make Ask PRAXIS the guide that binds the app together.
- Keep graph, ontology, source receipts, memo, draft, ACH, and boardroom functionality.

## Product Positioning

### Current Risk

PRAXIS has a lot of capability, but the UX can make everything look equally important. That creates three problems:

- Users do not know where to start.
- Customers see a sophisticated toolset before they see a business problem.
- Investors may see product sprawl instead of a wedge.

### New Position

PRAXIS is the TACITUS policy-context layer:

- It turns documents, notes, sources, claims, tools, and analyst reasoning into a portable Situation model.
- It structures that model around policy episodes and seven reusable chapters.
- It uses Cognee/context infrastructure to keep the model retrievable and updateable.
- It uses Ask PRAXIS to explain, diagnose, improve, and produce work from the model.

## TACITUS Policy Context Model

Every Situation should have the same seven TACITUS chapters. These are not extra tabs. They are the canonical knowledge model that current tabs, graph, ontology, tools, and outputs feed.

| Chapter | Purpose | Existing Code To Reuse |
| --- | --- | --- |
| Stakeholders | Actors, interests, leverage, relationships, behavioral patterns, actor shorthand. | `src/components/workbench/graph/GraphIntelligencePanels.tsx`, `src/lib/graph/workbench-case-graph.ts`, actor/profile AI routes, ontology primitives. |
| Stakes | What is at risk, success/failure definitions, policy stakes, humanitarian/security/economic/legal stakes. | Situation frame fields, ontology lenses, dashboard readiness, case metadata, memo templates. |
| Episodes | Policy/conflict episodes with start/end conditions, nested phases, active actors, stale/live claim boundaries. | Timeline events, graph event primitives, `Event`/episode-like constants, Graph tab timeline, source date metadata. |
| Hypotheses | Working frames, competing explanations, assumptions, evidence for/against. | ACH, SAT toolkit, hypothesis helpers, Research, saved claims, red-team routes. |
| Tried & Failed | Negative space: what was attempted, why it failed, dead ends, blocked paths. | Open questions, research threads, memo notes, boardroom deliberation outcomes, tool-run artifacts. |
| Open Threads | Blockers, unresolved questions, stale context, decisions pending, collection gaps. | Desk panels, open-questions API, stale context panel, research plan route. |
| Counsel | Standing recommendations, principal instructions, current advice, handover-ready judgments. | Memo Studio, Draft, Boardroom synthesis, export routes, brief-builder/briefing routes. |

## Episode Primitive Direction

Policy work is episodic, not just chronological. PRAXIS should treat an episode as a first-class policy-context object.

Minimum shape:

```ts
type PolicyEpisode = {
  id: string;
  caseId: string;
  title: string;
  summary: string;
  parentEpisodeId?: string;
  predecessorIds: string[];
  successorIds: string[];
  startCondition: string;
  endCondition?: string;
  temporalStatus: 'pre' | 'active' | 'closing' | 'closed' | 'reopened';
  activeActorIds: string[];
  scopedClaimIds: string[];
  sourceReceiptIds: string[];
  confidence: number;
  reviewState: 'raw' | 'candidate' | 'reviewed' | 'canonical';
};
```

This can be introduced as an application model before changing the core ACO ontology. The ACO/ontology change should be a later ADR-backed migration.

## Target UX Structure

The visible app should collapse to five primary areas. Existing functionality remains, but is grouped around user intent.

| New Area | User Question | Existing Surfaces Reused |
| --- | --- | --- |
| Desk | What changed, what is weak, and what should I do next? | Current Desk chapter, dashboard command center, open questions, stale context, next actions. |
| Situation Model | What does the desk know and believe? | Context, Ontology, Graph, policy/conflict anatomy, stakeholder analysis, timeline, map, chapter model. |
| Sources | What evidence and context has PRAXIS structured? | Library, Research, DocumentUploadInline, source receipts, saved claims, source picker. |
| Actions | What can PRAXIS do with this Situation? | ToolMarketplace, SAT/ACH, calibrated AI tools, GraphOps, Boardroom entry points, advanced recipes. |
| Outputs | What can I hand over or brief? | MemoStudio, DraftTab, export routes, Boardroom synthesis, reports, handover generator. |

The current four substrate tabs and seven work chapters remain technically valid. The UX should make them feel like one guided product instead of twelve competing surfaces.

## Ask PRAXIS As The Product Guide

Ask PRAXIS should become the persistent guide across the application. It should sit beside every Situation, understand the current area/chapter, and offer concrete actions.

### Ask PRAXIS Should Do Four Jobs

| Job | User-Facing Examples | Existing Code To Reuse |
| --- | --- | --- |
| Explain | "Explain this stakeholder map." "What does confidence 0.42 mean?" "Why is this episode stale?" | `src/components/assistant/*`, Ask PRAXIS routes, citation chips, evidence drawer, graph panels. |
| Diagnose | "What is missing?" "Which chapter is weakest?" "Which claims are stale?" | Desk next actions, context health, open questions, library/research state, ontology coverage. |
| Improve | "Improve the Stakeholders chapter." "Extract tried-and-failed from this source." "Create open questions." | Context tab, Library ingest, Research ingest, saved claims, Cognee pending writes, mutation confirm cards. |
| Produce | "Generate handover." "Update the brief." "Draft counsel for leadership." | Memo Studio, Draft, Briefing Updater, Handover Generator, export routes. |

### Ask PRAXIS Interaction Pattern

Every area should expose a small set of intent buttons:

- Explain this
- Improve context
- Find weak claims
- Update from source
- Run core action
- Generate handover

Ask PRAXIS should answer with citations, confidence, chapter/episode scope, and clear next actions. It should not only chat.

## Cognee And Context Creation

Cognee stays important, but should be backstage.

### User Language

Use:

- Improve context
- Structure sources
- Extract claims
- Update Situation Model
- Find related context
- Context coverage

Avoid:

- Cognee
- memify
- memory recall
- GraphRAG handoff
- substrate jargon

### Runtime Contract

Preserve the current boundary:

- `backend/services/cognee_memory.py` remains the Cognee boundary.
- Feature flags keep Cognee disabled-safe.
- Uploads and research can queue pending context writes.
- Context creation should surface as progress in the UI even when Cognee is unavailable.
- User-visible state should say what changed in the Situation Model, not which backend primitive ran.

### Context Creation Flow

1. User uploads, pastes, researches, or runs a tool.
2. PRAXIS saves a source receipt or work artifact.
3. PRAXIS extracts candidate claims, actors, interests, events, and episode hints.
4. PRAXIS maps candidates into the seven TACITUS chapters.
5. PRAXIS labels each item as raw, candidate, reviewed, or canonical.
6. Ask PRAXIS explains what changed and recommends the next action.

## Core Actions

The broad marketplace remains as advanced infrastructure, but the user-facing default should become eight core actions.

| Core Action | Primary Promise | Existing Capability To Compose |
| --- | --- | --- |
| Assumption Auditor | Find hidden assumptions in Hypotheses and Counsel. | ACH/SAT, Red Team, saved claims, hypothesis state. |
| Source Checker | Revalidate sources and flag stale or weak claims. | Library, source receipts, Source Scout, evidence drawer. |
| Briefing Updater | Convert a new event/source into a structured delta. | Research ingest, Memo Studio, Draft, briefing routes. |
| Red Team | Produce the strongest counter-assessment. | Red-team route/agent, ACH, Boardroom personas. |
| Stakeholder Probe | Project likely actor moves with sourced reasoning. | Stakeholder map, actor brief/enrichment, graph relationships. |
| Episode Closer | Check whether an episode's closing conditions are met. | Timeline/events, open questions, graph/event primitives. |
| Consistency Checker | Find contradictions across chapters, sources, or prior positions. | Tool registry, saved claims, evidence drawer, context provider. |
| Handover Generator | Produce the successor brief from the Situation Model. | Memo templates, Draft, Boardroom synthesis, export routes. |

These should be shown before the marketplace. The marketplace becomes "Advanced recipes" and "Team recipes."

## Phase Plan

### Phase 0: Decision And Naming Lock

Goal: align product language before code churn.

Changes:

- Adopt "Situation Desk" as the first-view product surface.
- Adopt "Situation Model" for the seven TACITUS chapters.
- Adopt "Sources", "Actions", and "Outputs" as the remaining top-level areas.
- Update docs and copy rules so Cognee/context internals are not user-facing.

Reuse:

- `docs/architecture/PRAXIS_ONE_PAGE.md`
- `docs/architecture/WORKBENCH_SURFACES.md`
- `AGENTS.md`
- `CLAUDE.md`

Acceptance:

- Root docs and handoff docs use the same product nouns.
- No user-facing doc claims that PRAXIS is just a marketplace or generic policy workbench.

### Phase 1: Navigation And First-View Simplification

Goal: make the app obvious within 30 seconds.

Changes:

- Simplify authenticated navigation to Desk, Situation Model, Sources, Actions, Outputs.
- Keep existing routes alive, but route users through the five-area mental model.
- Make `/app/workbench` the canonical working surface.
- Add contextual links to advanced Boardroom, ACH, Graph, Ontology, and marketplace details from the relevant area.

Reuse:

- `src/components/app/app-sidebar.tsx`
- `src/lib/navigation/product-surfaces.ts`
- `src/components/workbench/chapter-renderer.tsx`
- `src/components/workbench/workbench-tabs.tsx`
- current route files under `src/app/app/*`

Acceptance:

- New user sees a clear starting point.
- Advanced tools remain reachable.
- No route deletion in this phase.
- Build and route audits pass.

### Phase 2: Seven-Chapter Situation Model Shell

Goal: make tacit policy context visible.

Changes:

- Add a Situation Model view that renders the seven TACITUS chapters.
- Map existing source, graph, ontology, memo, ACH, and open-question state into chapter summaries.
- Add chapter completeness, trust posture, source count, open questions, stale items, and "Improve context" action.

Reuse:

- `ContextTab`
- `LibraryTab`
- `OntologySchemaViewer`
- `WorkbenchGraphPanel`
- `GraphIntelligencePanels`
- `buildWorkbenchSurfaceState`
- `open-questions` APIs
- `saved-claims` APIs

Acceptance:

- Every Situation displays all seven chapters, even when empty.
- Each chapter has designed empty state and next action.
- No chapter silently promotes generated claims to canonical facts.

### Phase 3: Episode Layer

Goal: reduce stale-context failures and make policy time legible.

Changes:

- Add app-level `PolicyEpisode` types and rendering.
- Derive initial episodes from timeline events, source dates, case key dates, and user notes.
- Add episode filters to claims, sources, hypotheses, and outputs.
- Add nested episode UI: parent/child, predecessor/successor, active/closed.

Reuse:

- timeline data in Graph tab
- event primitives
- map/timeline panels
- source receipt dates
- graph nodes/edges

Acceptance:

- Claims can show live/stale/episode-scoped status.
- Ask PRAXIS can answer "what changed between episodes?"
- No ontology migration required until the model proves useful in UI.

### Phase 4: Ask PRAXIS As Persistent Guide

Goal: make AI guide the application, not sit beside it as generic chat.

Changes:

- Add persistent Ask PRAXIS panel/drawer across Desk, Situation Model, Sources, Actions, and Outputs.
- Pass current area, chapter, episode, selected source/claim/node, and available actions into Ask PRAXIS.
- Add structured response cards for explanation, diagnosis, action proposal, and generated output.
- Use confirmation cards before any mutation.

Reuse:

- `src/components/assistant/chat-interface.tsx`
- `citation-chip.tsx`
- `mutation-confirm-card.tsx`
- `suggested-prompts.tsx`
- `tool-invocation.tsx`
- Ask PRAXIS / advisor-chat / calibrated AI routes
- context-aware provider and calibration wrappers

Acceptance:

- Ask PRAXIS can explain every primary area.
- Ask PRAXIS recommends next actions from actual case state.
- Ask PRAXIS can launch or stage core actions.
- Mutating actions require user confirmation.

### Phase 5: Context Creation And Cognee Backstage

Goal: keep Cognee/context creation but make it understandable.

Changes:

- Add a Context Coverage panel that shows what PRAXIS has structured.
- Replace memory/Cognee copy with context creation language.
- Show source receipts, extracted candidates, chapter mappings, and pending writes.
- When Cognee is disabled, preserve the visible "Source receipt saved / context queued" path without promising live memory.

Reuse:

- `/api/health/features`
- `/api/memory/[...slug]`
- `backend/services/cognee_memory.py`
- `DocumentUploadInline`
- `LibraryTab`
- `ResearchTab`
- pending Cognee write flows

Acceptance:

- Users understand what changed after an upload or research action.
- Cognee is not visible as product jargon.
- Context creation still works with disabled-safe fallbacks.

### Phase 6: Core Actions Over Marketplace Breadth

Goal: make tools legible and sellable.

Changes:

- Promote eight core actions as the default Actions page.
- Keep the 57-tool recipe library as advanced mode.
- Each core action must state input, output, trust basis, and save location.
- Handover Generator becomes the hero action.

Reuse:

- `ToolMarketplace`
- `src/lib/constants/tool-registry.ts`
- marketplace stage targets
- SAT/ACH components
- Memo/Draft/Boardroom routes
- calibrated AI tool routes

Acceptance:

- A new user sees eight clear actions, not a dense marketplace.
- Existing tools remain searchable/reachable.
- Non-AI structural actions are labeled honestly.
- Core actions save outputs into chapters or Outputs.

### Phase 7: Handover And Outputs

Goal: make the wedge demo undeniable.

Changes:

- Add Handover Generator output built from seven chapters and episode scope.
- Add successor profiles: new analyst, senior principal, field officer, leadership briefer.
- Make every handover section traceable to sources, claims, episodes, or open questions.
- Route handover output into Memo Studio and Draft for editing/export.

Reuse:

- `MemoStudio`
- memo templates registry
- `DraftTab`
- export routes
- Boardroom synthesis
- evidence drawer and citation chips

Acceptance:

- User can generate a credible handover in under two minutes from a populated demo case.
- Handover includes "what we believe", "why", "what changed", "what failed", "what to watch", and "what the successor should ask first".
- Every claim is trust-marked or labeled as synthesized/advisory.

### Phase 8: Landing, Demo, And Investor Readiness

Goal: align public story with the actual app.

Changes:

- Landing page leads with tacit knowledge and desk inheritance.
- Demo opens directly into a populated Situation Desk.
- Investor demo path: Desk -> Situation Model -> Episodes -> Handover Generator -> trust-marked output.
- Replace broad marketplace framing with core actions and context model.

Reuse:

- landing components and hero animation
- public demo route
- Syria/Northwind/Nordalia case modules
- graph visualization
- trust/evidence UI

Acceptance:

- Investor can understand the product in five minutes.
- Demo does not depend on hidden setup.
- Product copy matches live capability.

### Phase 9: Hardening And Metrics

Goal: prove the product improves analyst inheritance.

Changes:

- Add metrics for time-to-handover, chapter completeness, context coverage, source freshness, and trust-marked output ratio.
- Add browser tests for the five-area flow.
- Add audit for user-facing Cognee/internal jargon.
- Add audit for route/surface coherence under the new naming.

Reuse:

- existing audit scripts
- operational metrics routes
- e2e workbench tests
- context-aware and trust audits

Acceptance:

- Build, key audits, and smoke tests pass.
- No user-facing first-screen dead ends.
- Metrics show whether the Situation is inheritable.

## UI Layout Direction

### Desktop

- Left: five-area navigation.
- Center: current Situation surface.
- Right: collapsible Ask PRAXIS guide.
- Top: Situation switcher, context coverage, export/handover action.

### Mobile

- Read-first layout.
- Desk summary first.
- Situation Model chapters as stacked sections.
- Ask PRAXIS as bottom sheet.
- Actions collapsed behind explicit buttons.

### Visual Language

- Serious operational UI, not marketing cards.
- Fewer nested panels.
- High-contrast text.
- One strong graph/episode visualization per Situation.
- Trust affordances consistent everywhere.

## What Not To Do

- Do not delete Cognee boundary code.
- Do not delete Graph, Ontology, ACH, Boardroom, Memo, Draft, or marketplace code.
- Do not expose all advanced functionality equally on first view.
- Do not call deterministic recipes "AI reasoning" in user-facing UI.
- Do not let Ask PRAXIS mutate canonical facts without confirmation.
- Do not add a third-party marketplace before the eight core actions are clear.

## First Implementation Wave For Approval

Recommended first approved wave:

1. Add product-naming constants for Desk, Situation Model, Sources, Actions, Outputs.
2. Simplify navigation and first-view hierarchy without deleting routes.
3. Add seven-chapter Situation Model shell using current data.
4. Add persistent Ask PRAXIS guide affordance with contextual prompts.
5. Add Handover Generator placeholder flow that composes existing Memo/Draft/export infrastructure.
6. Update landing/demo copy to "desk inheritance" and "tacit policy context" language.
7. Add audits to prevent Cognee/internal jargon and surface sprawl from returning.

This wave should be small enough to ship safely and large enough to make PRAXIS feel like one coherent product.

## Success Definition

PRAXIS is ready for a design partner when a new user can:

1. Open a demo Situation.
2. Understand the seven chapters within five minutes.
3. See what context is strong, weak, stale, or missing.
4. Ask PRAXIS what to do next.
5. Generate a trust-marked handover.
6. Trace important claims back to sources and episodes.

That is the investable product: not more tools, but portable policy judgment.

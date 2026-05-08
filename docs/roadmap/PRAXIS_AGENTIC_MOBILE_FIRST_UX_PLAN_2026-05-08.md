# PRAXIS Agentic Mobile-First UX Plan

Date: 2026-05-08

Status: proposal for Giulio approval

Builds on: `docs/roadmap/PRAXIS_TACIT_KNOWLEDGE_UX_REORGANIZATION_PLAN_2026-05-08.md`

Repo: `C:\Users\giuli\praxiscodexworking`

Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`

## One-Line Product Target

PRAXIS should feel like a powerful AI desk officer:

> Select a workspace, open or create a Situation, chat with Ask PRAXIS, and let guided agentic workflows build context, audit claims, update briefs, and generate handovers.

The sophisticated TACITUS technology remains underneath: policy episodes, context creation, Cognee, source receipts, graph/ontology, trust-marked claims, memos, drafts, boardroom, ACH, tools, and exports. The user should experience one simple guided product.

## What Changes From The Previous Plan

The previous plan established the right product architecture: TACITUS Situation Model, seven chapters, episodes, Ask PRAXIS, Cognee backstage, core actions, and handover as the wedge.

This plan makes it more usable:

- Start with **workspace selection** and **Ask PRAXIS**, not a dense workbench.
- Make the UI **agentic by default**: PRAXIS proposes workflows, asks clarifying questions, executes with confirmation, and shows progress.
- Keep the existing workbench as the deep operating room, but make it reachable from simple guided workflows.
- Make mobile a first-class experience, not a compressed desktop.
- Convert "many tools" into a small set of visible workflows backed by the existing tool registry and routes.

## Design Tests

### Test 1: First-Time User

A new user should not need to learn the app map first.

They should see:

1. Choose workspace.
2. Choose or create Situation.
3. Ask PRAXIS: "What are you trying to do?"
4. Suggested workflows:
   - Understand this Situation
   - Improve context
   - Update a brief
   - Generate handover
   - Red-team assessment
   - Prepare meeting

### Test 2: Mobile User

A mobile user should be able to:

1. Open a Situation.
2. Ask "what changed?"
3. Review the answer with citations.
4. Upload or save a source.
5. Generate a handover or short brief.
6. Send/export it.

They should not need a graph canvas, full marketplace grid, or multi-column table to get value.

### Test 3: Investor Demo

An investor should understand the business in five minutes:

1. Policy desks lose tacit knowledge during rotation.
2. PRAXIS captures that tacit knowledge into a TACITUS Situation Model.
3. Ask PRAXIS guides analysts and models through that model.
4. Agentic workflows produce trusted handovers and updates.
5. The technical moat is context quality: episodes, trust, source receipts, graph/ontology, and Cognee-backed retrieval.

## External UX Principles Used

These are product principles, not dependencies:

- Progressive disclosure: show simple actions first, reveal advanced controls only when relevant.
- Task-led application design: organize around what the user is trying to accomplish, not around internal modules.
- Mobile concision: mobile surfaces should prioritize short, high-value content and avoid decorative or dense views.
- Export and handoff reliability: when work needs to continue elsewhere, make export simple and dependable rather than forcing every advanced function into the app.

Reference examples:

- Nielsen Norman Group, mobile enterprise apps and progressive disclosure: https://media.nngroup.com/media/reports/free/Mobile_Intranets_and_Enterprise_Apps.pdf
- Nielsen Norman Group, application design and linked controls: https://media.nngroup.com/media/reports/free/Application_Design_Showcase_2nd_edition.pdf

## Current Code To Leverage

Do not rebuild from scratch. Wrap and reorganize the existing system.

| Existing Capability | Keep / Reuse | New UX Role |
| --- | --- | --- |
| `src/components/assistant/chat-interface.tsx` | Keep | Persistent Ask PRAXIS conversation surface. |
| `src/components/assistant/citation-chip.tsx` | Keep | Citations inside Ask PRAXIS answers and generated outputs. |
| `src/components/assistant/mutation-confirm-card.tsx` | Keep | Confirm before PRAXIS changes context, stages claims, or creates outputs. |
| `src/components/assistant/suggested-prompts.tsx` | Keep | Workflow suggestions and next action prompts. |
| `src/components/assistant/tool-invocation.tsx` | Keep | Visible workflow progress and tool-call trace. |
| `src/lib/navigation/product-surfaces.ts` | Adapt | Collapse exposed navigation into simple product areas. |
| `src/components/app/app-sidebar.tsx` | Adapt | Desktop navigation becomes compact and intent-led. |
| `src/components/workbench/chapter-renderer.tsx` | Keep | Deep workbench rendering layer, launched from workflows. |
| `src/components/workbench/DeskTab.tsx` | Keep | Feeds Situation Desk and Ask PRAXIS state. |
| `ContextTab`, `LibraryTab`, `ResearchTab` | Keep | Back the "Improve context" and "Add sources" workflows. |
| `OntologySchemaViewer`, `WorkbenchGraphPanel`, `GraphIntelligencePanels` | Keep | Back Situation Model and visual explainers. |
| `ToolMarketplace` | Adapt | Advanced recipe library; core actions shown first. |
| `MemoStudio`, `DraftTab` | Keep | Outputs workspace and Handover Generator destination. |
| `ACHWorkbench` | Keep | Hypotheses and Assumption Auditor engine. |
| Boardroom routes/components | Keep | Prepare Meeting and Red Team workflows. |
| Cognee boundary and `/api/memory` | Keep | Context creation and retrieval backstage. |
| Trust/evidence drawers | Keep | Universal trust skin for answers and outputs. |

## New UX Information Architecture

### Desktop Shell

Desktop should have four persistent zones:

1. **Workspace rail**
   - Workspace switcher
   - Situation switcher
   - Create Situation
   - Recent Situations

2. **Main canvas**
   - Defaults to Ask PRAXIS Home
   - Shows workflow cards, Situation summary, and current output

3. **Ask PRAXIS guide**
   - Persistent right drawer on desktop
   - Collapsible
   - Knows selected Situation, chapter, episode, source, or output

4. **Deep work surfaces**
   - Workbench, graph, ontology, marketplace, boardroom, memo, draft
   - Opened from workflows and "Advanced" links

### Mobile Shell

Mobile should not copy the desktop layout.

Use five bottom actions:

1. Home
2. Ask
3. Sources
4. Outputs
5. More

Mobile defaults:

- Situation summary is first.
- Ask PRAXIS is a bottom sheet / full-screen chat.
- Graph becomes an explainable snapshot, not a dense canvas.
- Tool marketplace becomes workflow list, not grid.
- Outputs become cards with download/share actions.
- Advanced controls move behind "More".

## Ask PRAXIS Agentic Behaviors

Ask PRAXIS should stop being generic chat and become the application controller.

### Core Behaviors

| Behavior | What It Does | Guardrail |
| --- | --- | --- |
| Explain | Explains the current screen, chapter, source, claim, graph node, episode, or output. | Always cite available sources or say context is thin. |
| Diagnose | Finds weak chapters, stale claims, missing sources, unresolved questions, and contradictions. | Never mutates data. |
| Plan | Proposes a workflow with steps, expected output, cost/latency posture, and required confirmation. | User must approve. |
| Act | Runs approved workflow steps through existing APIs/tools. | Uses `mutation-confirm-card` for writes. |
| Review | Shows what changed, what was saved, what remains candidate/reviewed/canonical. | No silent canonical graph promotion. |
| Produce | Generates handovers, briefs, memos, and deltas with trust/evidence UI. | Output marks synthesized claims. |

### Ask PRAXIS Context Packet

Every Ask PRAXIS turn should receive a compact state packet:

```ts
type AskPraxisContextPacket = {
  workspaceId: string;
  caseId?: string;
  activeArea: 'home' | 'ask' | 'situation-model' | 'sources' | 'actions' | 'outputs' | 'advanced';
  activeChapter?: 'stakeholders' | 'stakes' | 'episodes' | 'hypotheses' | 'tried_failed' | 'open_threads' | 'counsel';
  activeEpisodeId?: string;
  selectedSourceId?: string;
  selectedClaimId?: string;
  selectedGraphNodeId?: string;
  contextCoverage: {
    sourceReceipts: number;
    reviewedClaims: number;
    candidateClaims: number;
    episodes: number;
    openQuestions: number;
    staleItems: number;
  };
  availableWorkflows: AgenticWorkflowId[];
};
```

This packet should be built from existing workbench state and context helpers, not from a new parallel store.

## Agentic Workflow Catalog

The user should see workflows, not tools.

### Workflow 1: Understand This Situation

User intent: "I am new. Brief me."

Steps:

1. Read Situation summary, seven chapters, sources, graph, open questions.
2. Explain current context coverage.
3. Identify top actors, current stakes, active episodes, core hypotheses, and blockers.
4. Offer next actions.

Existing code:

- Desk panels
- GraphIntelligencePanels
- Ontology viewer
- saved claims
- source receipts
- Ask PRAXIS route

Output:

- "What to know first" card
- "What is thin" card
- "What to ask next" card

### Workflow 2: Improve Context

User intent: "Make this Situation smarter."

Steps:

1. Diagnose missing chapters and weak evidence.
2. Ask whether the user wants to upload, paste, research, or use existing sources.
3. Save source receipts.
4. Extract candidate claims/actors/events/episode hints.
5. Map candidates to TACITUS chapters.
6. Show review queue.

Existing code:

- DocumentUploadInline
- LibraryTab
- ResearchTab
- `/api/documents/upload`
- `/api/cases/[caseId]/research/ingest`
- Cognee pending writes
- source receipts

Output:

- Context Coverage update
- Candidate review cards
- Ask PRAXIS explanation of what changed

### Workflow 3: Generate Handover

User intent: "Prepare the next analyst."

Steps:

1. Ask for successor profile if unknown.
2. Pull seven chapters and active episodes.
3. Include tried-and-failed and open threads prominently.
4. Produce handover.
5. Save to Outputs and open in Memo/Draft.

Existing code:

- MemoStudio
- DraftTab
- memo templates
- export routes
- citation chips
- evidence drawer

Output:

- Successor handover
- source/trust map
- export-ready draft

### Workflow 4: Update Brief From New Source

User intent: "Something happened. Update our view."

Steps:

1. Accept source, note, or event.
2. Save source receipt.
3. Detect affected chapters and episodes.
4. Generate structured delta.
5. Offer to update memo/draft/counsel.

Existing code:

- Research ingest
- Briefing routes
- MemoStudio
- DraftTab
- open questions
- timeline/event helpers

Output:

- "What changed" card
- affected claims
- updated brief section

### Workflow 5: Red-Team Assessment

User intent: "Challenge our view."

Steps:

1. Identify current hypothesis/counsel.
2. Pull supporting claims and weak evidence.
3. Generate strongest counterargument.
4. Create questions or ACH rows.
5. Save as advisory output.

Existing code:

- ACHWorkbench
- Red Team route/agent
- Boardroom persona logic
- saved claims

Output:

- red-team memo
- assumption list
- evidence gaps

### Workflow 6: Prepare Meeting

User intent: "Help me brief a principal or team."

Steps:

1. Ask audience and meeting objective.
2. Pull counsel, stakes, open threads, and recent changes.
3. Generate talking points and likely questions.
4. Optionally open Boardroom for simulated pushback.

Existing code:

- Boardroom
- talking-points route
- MemoStudio
- Draft
- audience preferences

Output:

- meeting brief
- likely questions
- dissent/caveats

### Workflow 7: Source And Claim Review

User intent: "Can we trust this?"

Steps:

1. Review source receipts and claim provenance.
2. Flag stale, unsupported, low-confidence, or contradictory claims.
3. Offer fixes: add source, mark stale, create open question, run Source Checker.

Existing code:

- EvidenceDrawer
- source receipts
- saved claims
- trust score
- Source Scout
- LibraryTab

Output:

- trust review
- prioritized source gaps

## Core Actions Layer

The visible Actions page should show eight cards, backed by existing tools/routes:

1. Handover Generator
2. Briefing Updater
3. Assumption Auditor
4. Source Checker
5. Red Team
6. Stakeholder Probe
7. Episode Closer
8. Consistency Checker

Each card must show:

- What it does
- What context it will use
- What it will produce
- Whether it uses AI, structural logic, or both
- Where the output will be saved

The current recipe library remains under "Advanced recipes".

## Mobile Product Requirements

### Mobile Must Support

- Workspace selection
- Situation selection
- Ask PRAXIS chat
- Situation summary
- Context coverage
- Source upload or link save
- Handover generation
- Brief update review
- Claim/source citation inspection
- Output export/share

### Mobile Can Defer

- Full graph editing
- Dense ontology management
- Full marketplace browsing
- Boardroom multi-agent transcript editing
- ACH matrix editing
- Advanced admin/settings

### Mobile Interaction Rules

- One primary action per screen.
- No wide tables.
- No nested cards inside cards.
- Use bottom sheets for citations, trust details, and workflow steps.
- Use compact episode timeline chips instead of full timeline canvas.
- Use graph snapshots and actor lists instead of full graph manipulation.
- Ask PRAXIS must always be reachable with one tap.

## Phased Implementation Plan

### Phase 0: Approval And Product Lock

Goal: freeze the UX direction before code churn.

Codex instructions:

- Read this plan and the previous TACITUS plan.
- Do not delete existing route surfaces.
- Create a short implementation checklist in `TODO.md` or a dated audit before edits.
- Confirm working tree is clean.

Acceptance:

- Giulio approves the five-area, Ask-first, mobile-first direction.

### Phase 1: Experience Map And Naming Layer

Goal: create a thin product layer over existing code.

Code tasks:

- Add `src/lib/product/experience-map.ts`.
- Define areas: `home`, `ask`, `situation-model`, `sources`, `actions`, `outputs`, `advanced`.
- Map existing surfaces/routes/tools into those areas.
- Add copy constants for user-facing labels.
- Update docs to treat old surface names as implementation details.

Files to inspect first:

- `src/lib/navigation/product-surfaces.ts`
- `src/lib/workbench/chapter-flow.ts`
- `src/components/app/app-sidebar.tsx`
- `src/components/workbench/chapter-renderer.tsx`

Acceptance:

- No runtime behavior changes yet.
- Typecheck passes.
- New map makes every existing surface reachable through the simplified UX model.

### Phase 2: Simplified App Shell

Goal: make first screen simple.

Code tasks:

- Add or adapt a workspace/situation picker first view.
- Make Ask PRAXIS Home the default empty-state experience.
- Desktop nav shows five clear areas plus Advanced.
- Mobile nav shows Home, Ask, Sources, Outputs, More.
- Keep existing routes as deep links.

Reuse:

- current app sidebar
- workbench picker
- situation routes
- onboarding/case creation components

Acceptance:

- New user can choose workspace/situation without seeing the full workbench map.
- Existing workbench route still works.
- Mobile viewport has no overlapping text or horizontal overflow.

### Phase 3: Persistent Ask PRAXIS Guide

Goal: make Ask PRAXIS the main controller.

Code tasks:

- Add persistent Ask PRAXIS drawer/sheet component.
- Reuse `chat-interface.tsx`, `suggested-prompts.tsx`, `tool-invocation.tsx`, `citation-chip.tsx`, and `mutation-confirm-card.tsx`.
- Build `AskPraxisContextPacket` from current situation/workbench state.
- Add suggested prompts based on area and context coverage.

Acceptance:

- Ask PRAXIS appears on desktop and mobile.
- It knows current Situation and active area.
- It can explain the current screen and suggest workflow cards.
- Mutating proposals use confirmation cards.

### Phase 4: Agentic Workflow Cards

Goal: expose workflows before tools.

Code tasks:

- Add workflow registry under `src/lib/agentic-workflows/`.
- Define the seven workflows listed above.
- Each workflow maps to existing APIs/tools/components.
- Show workflow cards on Ask PRAXIS Home and Actions.
- Start with deterministic scaffolding where live AI route is not ready, but label honestly.

Acceptance:

- User sees workflows, not a tool grid.
- Existing marketplace remains reachable as Advanced recipes.
- No marketplace functionality is deleted.

### Phase 5: Situation Model Home

Goal: make TACITUS chapters visible and useful.

Code tasks:

- Add a Situation Model overview component.
- Render the seven chapters.
- For each chapter show: summary, coverage, claims, sources, episode scope, open questions, improve-context action.
- Pull from existing graph/source/open-question/memo/research state.

Acceptance:

- Every case has the same chapter structure.
- Thin cases have useful empty states.
- Populated demo cases show immediate value.

### Phase 6: Episode-Scoped UX

Goal: make policy episodes an obvious TACITUS advantage.

Code tasks:

- Add app-level episode type and UI helpers.
- Derive episode chips from current timeline/event/source data.
- Let user filter Ask PRAXIS answers and chapter views by episode.
- Add "stale outside current episode" claim indicator where possible.

Acceptance:

- User can switch current episode.
- Ask PRAXIS can answer "what changed in this episode?"
- No ACO/ontology migration in this phase unless explicitly approved.

### Phase 7: Handover Generator As Hero

Goal: make the investable wedge real.

Code tasks:

- Add Handover workflow UI.
- Ask for successor profile.
- Generate structured handover from seven chapters.
- Save into Outputs.
- Open in MemoStudio/Draft for editing/export.

Acceptance:

- Handover includes what we believe, why, what changed, tried-and-failed, open threads, counsel, and next questions.
- Claims use citation/trust affordances.
- Demo flow completes on desktop and mobile.

### Phase 8: Mobile Polish

Goal: make mobile genuinely useful.

Code tasks:

- Add mobile-specific layout for Ask PRAXIS and workflow cards.
- Convert dense panels into summary cards and bottom sheets.
- Ensure touch-friendly controls and readable contrast.
- Add mobile visual tests for Desk, Ask, Sources, Outputs, and Situation Model.

Acceptance:

- Mobile user can ask, upload/save source, review citations, and generate handover.
- No horizontal overflow.
- No hidden critical CTA.
- Graph/ontology advanced views degrade gracefully.

### Phase 9: Investor Demo Path

Goal: align landing, demo, and product.

Code tasks:

- Update landing/demo copy around tacit knowledge, desk inheritance, episode-scoped context, and trusted handover.
- Demo CTA opens directly into Ask PRAXIS Home for a populated Situation.
- Add "Try a handover" demo path.
- Add short guided tour for investors.

Acceptance:

- Investor can understand the product in five minutes.
- Demo shows context creation, episode logic, Ask PRAXIS, and handover.
- No internal Cognee/GraphRAG jargon in first-run flow.

### Phase 10: Audits And Guardrails

Goal: prevent the app from sprawling again.

Code tasks:

- Add `audit:experience-map-coherence`.
- Add `audit:ask-praxis-presence`.
- Add `audit:mobile-primary-flows`.
- Extend `audit:cognee-ui-honesty`.
- Add "advanced surface still reachable" checks.

Acceptance:

- Every route maps to one product area.
- Ask PRAXIS is reachable from the primary app shell.
- Mobile primary flows have tests.
- Advanced routes are not deleted or orphaned.

## Codex Implementation Rules

Future Codex agents should follow these rules exactly.

1. Read before coding:
   - `docs/roadmap/PRAXIS_AGENTIC_MOBILE_FIRST_UX_PLAN_2026-05-08.md`
   - `docs/roadmap/PRAXIS_TACIT_KNOWLEDGE_UX_REORGANIZATION_PLAN_2026-05-08.md`
   - `docs/architecture/PRAXIS_ONE_PAGE.md`
   - `docs/architecture/WORKBENCH_SURFACES.md`
   - `AGENTS.md`
   - `CLAUDE.md`

2. Do not delete existing capabilities in the simplification wave.

3. Build wrappers and maps first:
   - product area map
   - workflow registry
   - Ask PRAXIS context packet
   - mobile shell behavior

4. Keep existing deep surfaces reachable:
   - Workbench
   - Graph
   - Ontology
   - Library
   - Research
   - Tools
   - ACH
   - Boardroom
   - Memo Studio
   - Draft

5. Do not expose backend jargon:
   - Cognee
   - GraphRAG
   - substrate
   - deterministic-foundation
   - internal model/provider names

6. Use existing assistant primitives before adding new UI primitives.

7. Every agentic workflow must declare:
   - input context
   - steps
   - API/tool calls
   - output artifact
   - save location
   - mutation confirmation requirement
   - AI/structural/deterministic tier

8. Every phase must include mobile acceptance checks.

9. Every phase must preserve audit gate posture:
   - `npm run build`
   - relevant `audit:*` scripts
   - new focused audit for the changed area

10. If a change requires altering firewall invariants, RLS, Firestore rules, ontology primitives, or production migrations, stop and ask Giulio before implementation.

## What Success Looks Like

### For A User

"I opened PRAXIS, selected my Situation, asked what mattered, uploaded one source, and PRAXIS told me what changed and generated a cited handover."

### For A Mobile User

"I checked the desk from my phone before a meeting, asked what changed, reviewed cited claims, and shared a brief."

### For An Investor

"This is not another AI chat app. It is a context layer that captures policy judgment, preserves desk memory, and makes AI generation safer."

### For Engineering

"We reused the code we already built, reduced exposed complexity, added an agentic orchestration layer, and kept advanced surfaces available without overwhelming first-time users."

## Approval Recommendation

Approve Phase 1 through Phase 4 as the first implementation wave:

1. Experience map and naming layer.
2. Simplified app shell.
3. Persistent Ask PRAXIS guide.
4. Agentic workflow cards.

This creates the visible product transformation without risky data-model changes. Situation chapters, episode scoping, and handover generation can then land on top of the simplified shell.

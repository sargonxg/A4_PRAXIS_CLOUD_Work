# PRAXIS Design-Led Agentic App Plan

Date: 2026-05-08

Status: proposal for Giulio approval

Builds on:

- `docs/roadmap/PRAXIS_TACIT_KNOWLEDGE_UX_REORGANIZATION_PLAN_2026-05-08.md`
- `docs/roadmap/PRAXIS_AGENTIC_MOBILE_FIRST_UX_PLAN_2026-05-08.md`
- `docs/architecture/PRAXIS_ONE_PAGE.md`
- `docs/architecture/WORKBENCH_SURFACES.md`

Repo: `C:\Users\giuli\praxiscodexworking`

Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`

## Product Standard

PRAXIS must feel like a top-tier modern application: calm, simple, fast, beautiful, and obviously powerful.

The user should not see the complexity first. The user should feel:

1. I know where I am.
2. I know what PRAXIS knows.
3. I know what PRAXIS recommends.
4. I can ask PRAXIS to do the next step.
5. I can trust, review, and export the result.

The technical solution remains deep: TACITUS policy context, episodes, trust-marked claims, Cognee-backed context creation, graph and ontology, source receipts, tools, ACH, Boardroom, Memo Studio, Draft, exports, and agentic workflows. But we sell the simple experience:

> Select a workspace. Open a Situation. Ask PRAXIS. Produce a trusted handover.

## Design References And Principles

This plan follows stable product design principles:

- Apple design guidance emphasizes clarity, direct manipulation, and making content primary: https://developer.apple.com/design/tips/
- Material adaptive guidance emphasizes adapting navigation and layout to screen size instead of shrinking desktop UI onto mobile: https://developer.android.com/codelabs/adaptive-material-guidance
- Material navigation guidance favors simple structure when user needs are simple: https://m1.material.io/patterns/navigation.html

Translated into PRAXIS:

- Show fewer choices first.
- Keep one primary action visible.
- Put advanced systems one level deeper.
- Make AI guidance always available.
- Use mobile-specific layouts, not compressed desktop.
- Let source/trust detail appear when the user asks or when risk is high.

## The New Mental Model

PRAXIS should be organized around four layers:

1. **Home**: choose workspace, choose Situation, see recent work.
2. **Ask PRAXIS**: the command plane and guide.
3. **Situation Model**: the TACITUS knowledge model of the desk.
4. **Outputs**: handovers, briefs, memos, drafts, exports.

Everything else supports those layers:

- Sources improve the Situation Model.
- Actions are guided workflows, not a raw marketplace.
- Graph and ontology explain structure.
- Cognee creates and retrieves context backstage.
- Boardroom and ACH become advanced agentic workflows.
- Memo Studio and Draft become output editors.

## North-Star User Flow

### First 30 Seconds

The app opens to a calm, premium Home screen:

1. Workspace switcher.
2. Situation switcher.
3. One prominent Ask PRAXIS input.
4. Three suggested workflows:
   - Understand this Situation
   - Improve context
   - Generate handover
5. A compact context coverage line:
   - Sources
   - Claims
   - Episodes
   - Open threads
   - Trust posture

No tool grid. No ontology jargon. No marketplace wall. No admin-looking panels.

### First 5 Minutes

The user can:

1. Ask "what should I know first?"
2. See a clear answer with citations and confidence.
3. Upload or paste one source.
4. Watch PRAXIS update context coverage.
5. Generate a handover or briefing delta.

This should be the demo path and the product path.

## Experience Architecture

### Primary Areas

| Area | User Need | Existing Capability Underneath |
| --- | --- | --- |
| Home | Pick workspace/Situation and resume work. | Current dashboard, workbench picker, situations routes, onboarding/case creation. |
| Ask | Ask, plan, run, review, and produce. | Assistant primitives, calibrated AI routes, context-aware wrappers, tool invocation UI. |
| Situation | Understand the TACITUS Situation Model. | Context, Graph, Ontology, Desk, Research, Library, episodes, open questions. |
| Sources | Add evidence and improve context. | Library, Research, DocumentUploadInline, source receipts, Cognee pending writes. |
| Outputs | Produce and export work. | MemoStudio, DraftTab, Boardroom synthesis, export routes, reports. |
| Advanced | Power user access. | Tools, ACH, graph operations, ontology management, boardroom rooms, admin/settings. |

### What This Means For Current Workbench

The Workbench is still valuable. It becomes the deep operating room. The first user experience becomes simpler:

- Home and Ask PRAXIS are the front door.
- Situation Model summarizes the current workbench data.
- Deep tabs and chapters are opened when a workflow needs them.
- Advanced routes remain available and searchable.

## Visual Design Direction

### Overall Feeling

PRAXIS should feel like:

- a senior analyst's command desk
- a calm intelligence notebook
- a premium AI copilot
- a precise research and handover system

It should not feel like:

- an admin console
- a SaaS settings dashboard
- a tool marketplace homepage
- a graph database demo
- a collection of experiments

### Visual Rules

1. **One primary action per surface**
   Usually Ask PRAXIS or Generate Handover.

2. **High contrast text**
   No faint gray body copy. Secondary text must still meet readable contrast.

3. **Few panels**
   Avoid cards inside cards. Use bands, sections, drawers, and bottom sheets.

4. **Content first**
   The Situation, answer, source, claim, or output is the hero, not the chrome.

5. **Quiet premium palette**
   Avoid one-note beige, purple-blue, or dark slate. Use a restrained neutral base with purposeful accent colors:
   - trust
   - warning
   - citation
   - episode
   - action

6. **Motion with meaning**
   Animations should show context being structured, episodes being scoped, or workflow progress. No decorative motion that slows comprehension.

7. **Responsive by design**
   Desktop is spacious; mobile is task-first.

## Ask PRAXIS As The Command Plane

Ask PRAXIS should be the primary interaction model. It should not only answer. It should guide, plan, and execute with review.

### Ask PRAXIS Modes

| Mode | User Sees | System Does |
| --- | --- | --- |
| Explain | "What does this mean?" | Explains current Situation, episode, actor, claim, source, or output. |
| Diagnose | "What is weak?" | Finds stale claims, thin chapters, missing sources, contradictions, open threads. |
| Plan | "How should I proceed?" | Produces a workflow plan with steps, expected output, and risk/cost posture. |
| Act | "Do it." | Calls existing tools/APIs with progress and confirmation. |
| Review | "What changed?" | Shows saved artifacts, candidate claims, context updates, and remaining gaps. |
| Produce | "Make the handover/brief." | Generates output into Memo/Draft/Outputs with citations and trust. |

### Ask PRAXIS Home Prompts

Default prompts should be simple and job-focused:

- What should I know first?
- What changed since the last update?
- Improve this Situation's context.
- Generate a handover.
- Update the brief from a new source.
- Red-team the current assessment.
- Prepare me for a meeting.

### Ask PRAXIS Output Components

Use existing assistant primitives first:

- `chat-interface.tsx`
- `message-bubble.tsx`
- `citation-chip.tsx`
- `suggested-prompts.tsx`
- `tool-invocation.tsx`
- `mutation-confirm-card.tsx`

Add only thin wrappers if needed:

- `WorkflowPlanCard`
- `ContextCoverageCard`
- `HandoverPreviewCard`
- `EpisodeScopeChip`
- `TrustSummaryStrip`

## TACITUS Situation Model UI

The TACITUS Situation Model is the structured policy context PRAXIS builds and maintains.

### Seven Chapters

1. Stakeholders
2. Stakes
3. Episodes
4. Hypotheses
5. Tried & Failed
6. Open Threads
7. Counsel

### Chapter Card Design

Each chapter should show:

- one-sentence summary
- confidence/trust posture
- source count
- live episode scope
- open questions
- "Improve" action
- "Ask about this" action

The chapter detail view should show:

- claims
- sources
- dissent
- stale items
- related actors/events
- generated outputs that depend on this chapter

### Episode UX

Episodes are a TACITUS differentiator. Make them visible but simple.

Use:

- horizontal episode chips
- active/current episode indicator
- nested episode reveal
- "what changed in this episode?" Ask PRAXIS action
- stale claim warning when a claim belongs to an older episode

Avoid:

- full chronology tables on first view
- graph database language
- complex temporal controls before the user needs them

## Agentic Workflow System

The user should pick a goal. PRAXIS should run a workflow.

### Workflow UX Pattern

Every workflow follows the same pattern:

1. **Intent**
   PRAXIS confirms what the user wants.

2. **Context**
   PRAXIS shows what data it will use.

3. **Plan**
   PRAXIS shows steps and asks for confirmation.

4. **Run**
   PRAXIS streams progress.

5. **Review**
   PRAXIS shows what changed and what remains uncertain.

6. **Save**
   PRAXIS saves to the right output or candidate queue.

### Core Workflows

| Workflow | Primary User | Output |
| --- | --- | --- |
| Understand Situation | New analyst, rotating desk officer, investor demo | First-read brief and context map. |
| Improve Context | Analyst, researcher | Updated Situation Model candidates. |
| Update Brief | Analyst, principal briefer | Delta brief from a new source/event. |
| Generate Handover | Rotating analyst, team lead | Successor handover. |
| Red-Team Assessment | Senior analyst, reviewer | Counter-assessment and assumptions. |
| Prepare Meeting | Principal briefer, team lead | Talking points and likely questions. |
| Review Sources And Claims | Analyst, reviewer | Trust/source gap report. |
| Create Work Product | Analyst, drafter | Memo, draft, or export-ready package. |

### Workflow Registry

Codex should add a typed registry before adding new UI:

```ts
type AgenticWorkflow = {
  id: string;
  label: string;
  shortLabel: string;
  intent: string;
  primaryArea: 'home' | 'ask' | 'situation' | 'sources' | 'outputs' | 'advanced';
  mobilePriority: 'primary' | 'secondary' | 'advanced';
  requiredContext: Array<'workspace' | 'situation' | 'sources' | 'chapters' | 'episodes' | 'claims'>;
  outputKind: 'answer' | 'context_update' | 'memo' | 'draft' | 'handover' | 'briefing' | 'review_queue';
  tier: 'calibrated-ai' | 'structural' | 'hybrid';
  routes: string[];
  existingComponents: string[];
  confirmationRequired: boolean;
};
```

Suggested file:

- `src/lib/agentic-workflows/registry.ts`

## Mobile-First Product

Mobile is not secondary. For many policy users, mobile is the meeting-prep and field-check surface.

### Mobile First Screen

Mobile opens to:

1. Situation name
2. one-line status
3. Ask PRAXIS input
4. three workflow buttons
5. context coverage strip
6. latest output / what changed

### Mobile Navigation

Bottom nav:

1. Home
2. Ask
3. Sources
4. Outputs
5. More

More contains:

- Situation Model
- Advanced tools
- Graph
- Boardroom
- ACH
- Settings

### Mobile Design Rules

- No dense grid.
- No wide tables.
- No horizontal scrolling.
- No tiny gray explanatory text.
- Use bottom sheets for citations, trust details, and workflow steps.
- Use accordions for chapter details.
- Use compact chips for episodes.
- Use source cards instead of tables.
- Use one-tap export/share.

### Mobile MVP Workflows

Mobile must support:

- Ask what changed.
- Generate handover.
- Upload/save source.
- Review citations.
- Update brief.
- See output status.

Mobile may defer:

- full graph editing
- full ontology editing
- ACH matrix editing
- Boardroom transcript editing
- full marketplace browsing

## Design System Work

### New Design Tokens

Add or refine tokens for:

- surface background
- elevated surface
- primary action
- subtle border
- strong text
- muted text with accessible contrast
- trust high / medium / low
- episode active / past / stale
- candidate / reviewed / canonical

### Component Rules

Prefer:

- command bars
- drawers
- bottom sheets
- segmented controls
- chips
- compact cards
- sticky action footers
- citation popovers/sheets

Avoid:

- nested cards
- huge dashboards before context
- decorative blobs/orbs
- large marketing-style hero sections inside the app
- tool grids as the first experience

## How Existing Functionality Is Preserved

This plan keeps the product's deep systems:

- Workbench remains the deep workspace.
- Graph and Ontology explain Situation structure.
- Library and Research feed Sources.
- Cognee and memory routes remain context infrastructure.
- ToolMarketplace remains advanced recipes.
- ACH remains the Hypotheses engine.
- Boardroom remains advanced deliberation.
- MemoStudio and Draft remain output editors.
- Admin and settings remain available.
- Existing routes remain reachable.

The difference is hierarchy:

- Simple first.
- Agentic guidance second.
- Deep controls third.

## Codex Implementation Plan

### Phase 1: Design And Experience Map

Goal: establish the design-led product skeleton without breaking routes.

Tasks:

- Create `src/lib/product/experience-map.ts`.
- Create `src/lib/agentic-workflows/registry.ts`.
- Create product labels for Home, Ask, Situation, Sources, Outputs, Advanced.
- Add route-to-area mapping for every current app route.
- Add mobile priority metadata.

Files to inspect:

- `src/lib/navigation/product-surfaces.ts`
- `src/lib/workbench/chapter-flow.ts`
- `src/components/app/app-sidebar.tsx`
- `src/components/workbench/chapter-renderer.tsx`
- `src/components/tools/ToolMarketplace.tsx`

Acceptance:

- No UI route is orphaned.
- Advanced functionality remains mapped.
- Typecheck passes.

### Phase 2: Premium App Shell

Goal: make the app feel like a top-level product.

Tasks:

- Refactor the authenticated shell into a simpler structure.
- Desktop: workspace rail, main canvas, Ask PRAXIS drawer.
- Mobile: bottom nav with Home, Ask, Sources, Outputs, More.
- Use high-contrast text and restrained chrome.
- Add an app-level command bar.

Files to inspect:

- `src/components/app/app-sidebar.tsx`
- app layout files under `src/app/app`
- workbench landing page
- dashboard command center

Acceptance:

- First screen is not a tool grid.
- Mobile has no horizontal overflow.
- The main CTA is Ask PRAXIS or Generate Handover.

### Phase 3: Ask PRAXIS Home

Goal: make Ask PRAXIS the default way to begin.

Tasks:

- Build `AskPraxisHome` using existing assistant primitives.
- Show workflow buttons and context coverage.
- Add "resume where you left off" output cards.
- Add safe empty states for no Situation / no sources / no claims.

Files to reuse:

- `src/components/assistant/chat-interface.tsx`
- `src/components/assistant/suggested-prompts.tsx`
- `src/components/assistant/tool-invocation.tsx`
- `src/components/assistant/citation-chip.tsx`

Acceptance:

- User can start without knowing the app map.
- Ask PRAXIS can explain what to do next.
- Empty states are useful and beautiful.

### Phase 4: Workflow Orchestration UI

Goal: turn tools into guided agentic workflows.

Tasks:

- Add workflow cards.
- Add workflow plan and progress components.
- Wire initial workflows to existing routes/components.
- Keep mutating steps behind confirmation.

Initial workflows:

- Understand Situation
- Improve Context
- Generate Handover
- Update Brief

Acceptance:

- Each workflow shows input, plan, progress, output, and save location.
- Structural/deterministic workflows are labeled honestly.
- No canonical graph writes happen silently.

### Phase 5: Situation Model UI

Goal: make TACITUS context visible but simple.

Tasks:

- Create `SituationModelOverview`.
- Render seven chapter cards.
- Add episode chips.
- Add trust/source/open-thread indicators.
- Link chapter actions to Ask PRAXIS workflows.

Reuse:

- ContextTab
- GraphIntelligencePanels
- OntologySchemaViewer
- open questions
- saved claims
- library/research state

Acceptance:

- A user can understand the Situation in one screen.
- A mobile user can scan chapters quickly.
- Advanced graph/ontology remains one tap away.

### Phase 6: Handover Generator

Goal: create the product's wow moment.

Tasks:

- Add Handover workflow.
- Ask for successor profile.
- Compose from seven chapters, episode scope, sources, open threads, and counsel.
- Save to Outputs.
- Open in MemoStudio/Draft.

Acceptance:

- Handover is useful from a demo case.
- It is trust-marked and exportable.
- It works on mobile.

### Phase 7: Context Creation Polish

Goal: make Cognee/context creation feel magical but honest.

Tasks:

- Add Context Coverage strip.
- Show "PRAXIS structured X claims, Y actors, Z episodes".
- Replace backend jargon with user language.
- Add pending/queued states when Cognee is disabled or asynchronous.

Acceptance:

- User understands what happened after upload/research.
- No visible "Cognee", "GraphRAG", "substrate", or internal mode jargon.
- Feature flag behavior remains honest.

### Phase 8: Visual Polish And Motion

Goal: make it beautiful without becoming decorative.

Tasks:

- Tighten typography scale.
- Remove low-contrast copy.
- Reduce nested panels.
- Add purposeful workflow progress motion.
- Add episode/context structuring animation where useful.
- Polish mobile spacing and touch targets.

Acceptance:

- App feels premium, not admin-like.
- Mobile surfaces look designed, not collapsed.
- Visuals help comprehension.

### Phase 9: Audits And Tests

Goal: keep the simplification from regressing.

Tasks:

- `audit:experience-map-coherence`
- `audit:ask-praxis-primary`
- `audit:mobile-primary-flows`
- `audit:no-internal-jargon-ui`
- e2e smoke for mobile Home -> Ask -> Handover
- e2e smoke for desktop Home -> Situation -> Sources -> Outputs

Acceptance:

- Build passes.
- Repo-shape/master-charter pass.
- New UX audits pass.
- No advanced surface is deleted or orphaned.

## Codex Rules For This Work

1. Do not replace the app. Reorganize it.
2. Do not delete deep features unless Giulio explicitly approves.
3. Build maps and wrappers before moving routes.
4. Use existing assistant components first.
5. Treat mobile as a first-class target in every phase.
6. Keep Ask PRAXIS visible or one tap away.
7. Hide internal tech names from first-run UX.
8. Preserve source/trust/review discipline.
9. Every workflow must have a save location.
10. Every mutation must be reviewable or confirmed.
11. Every new surface must have empty/loading/error states.
12. Every phase must update docs and add or extend an audit.

## First Implementation Slice To Approve

Approve this first:

1. Experience map and workflow registry.
2. Premium app shell plan in code.
3. Ask PRAXIS Home.
4. Mobile bottom navigation.
5. Four initial workflow cards.
6. Context Coverage strip.
7. UX audits for route mapping, Ask PRAXIS presence, mobile primary flows, and internal jargon.

This slice gives PRAXIS the new feel without risking the deeper architecture.

## Final Product Bar

The app is successful when a policy user can say:

> I do not need to learn PRAXIS first. I open my Situation, ask PRAXIS, and it guides me to the right context, source, action, or output.

The investor version:

> PRAXIS is the policy AI knowledge layer: it captures tacit desk context and turns it into trusted, episode-aware handovers and briefings.

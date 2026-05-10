# PRAXIS by TACITUS — MVP Build Package
# File 3 of 3 — Frontend + Ship Build Prompts

**Audience:** Claude Code, Codex, Antigravity agents executing frontend and ship phases
**Purpose:** paste-ready prompts for Phases 4-9 (Surfaces, Methods, Drafting, Demo Seeding, Landing, Polish & Ship)
**Date:** 2026-05-10 · **Status:** Authoritative
**Read alongside:** File 1 (Operating Guide) · File 2 (Backend Build Prompts)

---

## Phase 4 — Frontend Surfaces (Wave 2, parallel-safe with Phases 2 and 3)

Phase 4 has five sub-phases (4A through 4E) that can run within a single agent stream sequentially, since they share the surface scaffolding. Run 4A first (Contexts page is the foundation other surfaces link to). Then 4B-4E in any order.

### Phase 4A — Contexts surface with 8-panel sidebar

```
Phase 4A of the v5 MVP build: build the unified Contexts surface with the
8-panel sidebar at /contexts and /contexts/[id].

READ FIRST:
1. docs/build/AGENT_OPERATING_GUIDE.md (full)
2. docs/architecture/PRAXIS_VISION_v5_01_PRODUCT.md §3 (Context Management
   page) and §3.1-3.8 (the 8 panels)
3. docs/architecture/PRAXIS_VISION_v5_02_ARCHITECTURE.md §3 and §6
4. src/app/_archive/app/{cases,situations,workbench}/ (the archived pre-v5
   routes — components in workbench/_components/ are the reusable parts
   to migrate)
5. src/components/ (existing component library)
6. src/lib/firebase/situations.ts (canonical situations service)

GOAL:
Build /contexts (list page) and /contexts/[caseId] (the unified Context
page with 8-panel sidebar). Migrate workbench tab components into the new
shell; do not re-implement them.

DELIVERABLES:

1. src/app/contexts/page.tsx (NEW). Lists the user's owned Contexts plus
   the 3 demo Contexts (Indo-Pacific, AI Regulation, F&B Sustainability).
   Cards show: name, ontology stack badges, source count, last-modified,
   work episode active, Context Health indicator. "Create new Context"
   button opens a 30-second wizard modal.

2. src/app/contexts/[caseId]/layout.tsx (NEW). Two-pane layout:
   - Left rail: 8-panel sidebar with Frame, Sources, Extraction Lenses,
     Work Process, Timeline, Graph, Drafts, Methods used.
   - Right pane: active panel content.
   - Top bar: Context name, work episode dropdown, breadcrumbs back to
     /contexts.

3. src/app/contexts/[caseId]/page.tsx — defaults to Frame panel.

4. Eight panel components under src/components/contexts/panels/:

   FramePanel.tsx — four canonical fields (what's happening, why does
     it matter, what would change the assessment, what is the policy
     question). Auto-saves on blur. Frame Health indicator. Editable
     metadata: geography, primary actors (auto-populated), assumptions,
     gaps.

   SourcesPanel.tsx — three sub-tabs: Documents (uploaded), Research
     (web-pulled), Vetted Feeds (subscribed open data). Each row: tier
     badge (T0-T7 with color), title, language, published date, retrieved
     date, graph node count, draft citation count. Drag-and-drop upload
     zone. Click row → side panel with parsed content + provenance trail.
     URL paste box → routes to Document pipeline.

   ExtractionLensesPanel.tsx — read-only by default. Shows active
     domain ontology stack with per-primitive coverage (Actors: 47,
     Claims: 112, ...). Lists inactive lenses (Sanctions, Legal, etc.)
     with "available v1.5" tooltips. Power-user controls (add lens,
     remove lens, swap primary) gated behind a "show advanced" toggle.

   WorkProcessPanel.tsx — the new architectural surface. Renders the
     active work ontology fields as an editable form (not a dump of
     subtypes). Sections: Role & Supervision, Audience, Workstreams,
     Active Cycle, Constraints, Decisions Being Supported. The form
     fields are typed by the active work ontology (Foreign Policy
     Research, Domestic Policy Analysis, Corporate Strategic Analysis).
     Saves to Firestore users/{uid}/situations/{caseId}/work-context.

   TimelinePanel.tsx — Cytoscape or simple horizontal timeline component
     showing two strands: situation episodes (above axis), work episodes
     (below axis). Bi-temporal slider for "as of" scoping. Click an
     episode to scope every other panel to that point in time.

   GraphPanel.tsx — Cytoscape.js canvas of the canonical graph. Nodes
     color-coded by primitive, sized by centrality, shaped by ontology
     subtype. Layout options: force-directed (default), hierarchical,
     timeline. Filter controls: by primitive, by tier, by ontology lens,
     by episode scope. "Show candidate layer" toggle reveals AI-extracted
     candidates with dashed outline + lower opacity. Click candidate to
     accept/reject/edit. Empty state: "Drag a PDF into Sources to
     populate this graph."

   DraftsPanel.tsx — list of drafts produced from this Context. Sortable
     by template type, work episode, last-modified, status. Each row
     links to /draft/[draftId]. "Create new draft" button picks template
     and routes to /draft/new?caseId=...&template=...

   MethodsUsedPanel.tsx — history of every Method run in this Context.
     Re-runnable. Forkable into a new run. Filterable by category, date,
     cost, work episode. "View full run" link to a Method-run detail
     view.

5. src/components/contexts/CreateContextWizard.tsx — 30-second 4-step
   modal wizard:
   Step 1: Name and brief description.
   Step 2: Pick primary domain ontology (auto-suggested from name; can
     override). Show top 3 candidates from the 3 MVP domain ontologies.
   Step 3: Pick work ontology (auto-suggested from active User Model).
   Step 4: Write the four-field frame (placeholder text per work
     ontology to guide).
   Submit → creates Firestore docs at users/{uid}/situations/{caseId}/
     metadata + work-context. Redirects to /contexts/[caseId].

6. Integration with existing components:
   - Re-use src/components/workbench/_components/* where they already
     work for a panel. Don't reinvent.
   - Use TanStack Query for all Firestore reads.
   - Use Tailwind 4 + Radix UI primitives. Match existing visual language.

CONSTRAINTS:
- DO NOT re-implement work that exists in src/components/workbench/.
  Migrate, don't rewrite.
- DO NOT delete src/app/_archive/app/workbench/. It stays archived as
  reference until v1.5.
- DO NOT add a new graph visualization library. Cytoscape.js stays.
- DO NOT add a tab for "Reports" — reports merge into Drafts panel for
  v5; the v4 reports/drafts duality is collapsed.

VERIFICATION:
  npm run lint
  npx tsc --noEmit
  npm run build
  npm run audit:routes                    # /contexts surface registered
  npm run audit:no-internal-jargon-ui     # UI labels are user-facing
  npm run audit:experience-map-coherence

Smoke test:
  Local dev. Sign in. Navigate to /contexts. See list with 3 demo
  Contexts (assuming Phase 7 demo seeding has populated them; if not,
  list will be empty initially — that's expected before Wave 4).
  Click into Indo-Pacific demo. Verify all 8 sidebar panels render
  without errors. Frame panel auto-saves on edit. Sources drag-drop
  accepts a PDF. Graph panel renders Cytoscape canvas. Timeline shows
  two strands. Work Process renders the Foreign Policy Research
  ontology fields.

COMPLETION CRITERIA:
- /contexts route shipped, lists user Contexts.
- /contexts/[caseId] route with 8-panel sidebar.
- All 8 panel components implemented (some may show empty states until
  Phase 7 seeds data).
- Create wizard works end-to-end.
- audit:routes green.
- No console errors on the dev server.

BRANCH: feat/v5-4a-contexts-surface
PR TITLE: feat(v5-4a): Contexts surface with 8-panel sidebar at /contexts/[id]
REFERENCES: ADR-0038, ADR-0039.
```

### Phase 4B — User Models surface

```
Phase 4B of the v5 MVP build: build the User Models library and editor at
/users and /users/[modelId].

READ FIRST:
1. docs/build/AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v5_01_PRODUCT.md §7 (User Model
   library)
3. src/types/user-model.ts (from Phase 1A)
4. src/lib/users/seeds/ (3 seeded User Models from Phase 1A)

GOAL:
Build /users (library with public seeded models + private user-owned
models) and /users/[modelId] (editor with full User Model fields).

DELIVERABLES:

1. src/app/users/page.tsx — two sections:
   - "My models" — private models the user owns (forks).
   - "Public library" — the 3 seeded models (FP Analyst, Domestic Policy
     Analyst, Corporate Strategic Analyst). Each card shows name, role,
     summary, "Use this model" button (sets as active) and "Fork" button
     (creates private copy).

2. src/app/users/[modelId]/page.tsx — structured form editor with tabs:
   Identity / Mandate / Methodology / Style / Standing Assumptions /
   Prohibited Frames / Sources / Audience Defaults. Uses RJSF (React
   JSON Schema Form) backed by user-model JSON schema.

3. src/lib/users/api.ts — typed CRUD operations on Firestore
   users/{uid}/user-models/{modelId}/current. Public seeds read from
   src/lib/users/seeds/ (in-memory; not Firestore).

4. Header user-picker integration: the User dropdown on /app reads from
   the active User Model. Switching models updates active.

CONSTRAINTS:
- DO NOT implement User Model versioning (append-only history). MVP uses
  Firestore current/draft only. Versioning is v1.5.
- DO NOT implement /users/compare. The killer demo surface is v1.5 (see
  ADR-0037).
- DO NOT allow editing the public library models. Only forks of them.

VERIFICATION:
  npm run lint && npx tsc --noEmit && npm run build
  npm run audit:user-model-versioning   (basic shape check passes for
                                          MVP)

Smoke test: Sign in, go to /users, fork the Foreign Policy Analyst model,
edit one field, save, switch to it via the header picker, verify it's
active.

COMPLETION CRITERIA:
- /users library with public + private sections.
- /users/[modelId] editor with all User Model fields.
- Forking from public to private works.
- Active User Model integration with /app header.

BRANCH: feat/v5-4b-user-models-surface
PR TITLE: feat(v5-4b): User Models library and editor
REFERENCES: ADR-0037.
```

### Phase 4C — Methods marketplace

```
Phase 4C of the v5 MVP build: build the Methods marketplace at /methods
and the per-Method detail page at /methods/[methodId].

READ FIRST:
1. docs/build/AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v5_01_PRODUCT.md §4 (Methods
   marketplace)
3. src/lib/tools/registry/ (the 52 existing tools — most of these get
   re-categorized in this phase or stay as v1.5 catalog entries)
4. src/lib/tools/suggestion/role-affinity.ts (the suggestion engine)
5. skills/tools/ (SKILL.md files for tools)

GOAL:
Build the unified Methods marketplace with three category filters
(AI / Research / Deterministic), suggestion strip, search, and
schema-driven Method detail/run pages. UI label is "Methods" (code
keeps "tool").

DELIVERABLES:

1. src/app/methods/page.tsx — marketplace home with:
   - Top: suggestion strip with 3 recommended Methods for the active
     User × Context. Each card: name, one-line description, cost class,
     ontology fit badge ("Ready" / "Needs more sources" / "Wrong
     ontology"), Run button.
   - Search bar with typeahead.
   - Three category filters (All / AI / Research / Deterministic).
   - Card grid of all registered Methods. Card shows: name, description,
     category badge, ontology fit, recent runs by current user. Click →
     /methods/[methodId].

2. src/app/methods/[methodId]/page.tsx — Method detail and run page:
   - Header: name, category badge, cost class, latency budget.
   - About this Method: rendered SKILL.md content.
   - Input form: schema-driven via RJSF, populated from the Method's
     declared input schema.
   - Run button → executes Method, streams output, persists to active
     Context's Methods-used history.
   - Composition links: "This Method can chain into: [Memo Drafter,
     Frame Cascade, ...]" — clickable to launch a sequence.
   - Recent runs by current user list.

3. src/lib/tools/categorize.ts — assigns each registered Method to one
   of three categories. Top 10 MVP Methods (the ones implemented in
   Phase 5) are categorized as:
   - AI: Position-vs-Interest Decoder, Scenario Projector, ACH, Memo
     Drafter, Frame & Narrative Analyzer, Contradiction Finder
   - Research: Deep Research Agent
   - Deterministic: Stakeholder Power-Interest Map, Coalition Detector,
     Commitment Tracker

   The other ~42 v4-era tools get categorized but flagged as "v1.5
   catalog" (greyed in MVP UI; not surfaced in suggestion strip).

4. src/components/methods/MethodCard.tsx, MethodFitBadge.tsx,
   SuggestionStrip.tsx, MethodInputForm.tsx (RJSF wrapper), MethodRun
   View.tsx (streaming output display).

5. src/lib/tools/suggestion/role-affinity.ts — verify it produces good
   3-Method recommendations for each persona × Context combination
   (FP Analyst × Indo-Pacific = Stakeholder Map, Frame Cascade, Memo
   Drafter; etc.).

CONSTRAINTS:
- DO NOT delete the 52 existing tools. Re-categorize. Hide v1.5 ones.
- DO NOT build a public Method marketplace where users charge. v2
  feature.
- DO NOT show model names (gemini-3.1-pro) in the UI. Use cost class
  ("medium cost") or task kind ("complex reasoning") if anything.

VERIFICATION:
  npm run audit:tool-contract-v2
  npm run audit:tool-skills-present
  npm run audit:tool-context-isolation
  npm run audit:tool-suggestion-eval     # recall@3 ≥ 80%

Smoke test: /methods loads with suggestion strip showing 3 Methods.
Click a Method, fill input form, run it, see streamed output.

COMPLETION CRITERIA:
- /methods marketplace with 3 categories + search + suggestion strip.
- /methods/[methodId] schema-driven detail and run page.
- Top 10 MVP Methods categorized; v1.5 catalog flagged.
- audit:tool-suggestion-eval recall@3 ≥ 80%.

BRANCH: feat/v5-4c-methods-marketplace
PR TITLE: feat(v5-4c): Methods marketplace with 3 categories + suggestion engine
REFERENCES: ADR-0038.
```

### Phase 4D — Ask homepage at /app

```
Phase 4D of the v5 MVP build: build the new Ask homepage at /app with
two pickers (User and Context), six modes, agent plan preview, slash
commands, and transparent agent loop.

READ FIRST:
1. docs/build/AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v5_01_PRODUCT.md §1 (homepage)
   and §6 (Ask bar)
3. docs/architecture/PRAXIS_VISION_v5_01_PRODUCT.md §9 (first 5 minutes —
   the WOW journey this surface delivers)

GOAL:
Build the new authenticated home at /app: two-picker hero, the Ask bar
with six modes, intent classifier with plan preview, slash commands,
file attachment routing, transparent agent loop with claim-level
provenance.

DELIVERABLES:

1. src/app/app/page.tsx — the homepage. Layout per §1 of the product
   spec. Three pickers? No — just two: USER and CONTEXT. Plus the bar.
   Plus 4 recent-Contexts cards. Plus 4 utility links (Browse Methods,
   Manage Contexts, Manage Models, Drafts).

2. src/components/ask/AskBar.tsx — the centerpiece. Multi-line input,
   placeholder rotation through 3 example questions per active Context,
   five mode tabs (Quick / Deep / Research / Memo / Auto). On enter or
   Run click, transitions to plan-preview state.

3. src/components/ask/AgentPlanPreview.tsx — shown after intent
   classification. Renders: mode, planned tools, citing-source-count,
   estimated cost, estimated latency. Buttons: Confirm, Edit, Cancel.
   Auto-confirm grace period (1.5s) for Quick mode unambiguous intents.

4. src/lib/ai/ask/intent-classifier.ts — Gemini 3 Flash structured-output
   call returning {intent, mode, toolPlan: string[], estimatedCostUsd:
   number, estimatedLatencyMs: number}. ~200ms target.

5. src/components/ask/StreamingResponse.tsx — renders the streamed
   output with claim-level provenance:
   - Every claim is wrapped in <Claim source-id graph-node-id confidence>
   - Hover Claim: side-panel slides in with source receipt summary +
     graph node detail + color-coded confidence dot (green ≥0.8, yellow
     0.5-0.8, red <0.5)
   - Markdown rendering for body; structured citations as numbered
     footnotes.

6. src/lib/ai/ask/slash-commands.ts — parser and dispatcher for:
   /research, /memo, /brief, /ach, /scenarios, /cite, /refresh,
   @method-name (inline tool invocation).

7. src/components/ask/FileAttachment.tsx — drag-drop and paste handler.
   Drag PDF → Document pipeline. Paste URL → single-document Document
   pipeline. Type query → Research pipeline.

8. src/components/ask/CaptureLoop.tsx — the [I] step. Small footer
   after every Deep/Research/Memo response: "Save this framing as a
   standing assumption / methodology preference / source preference on
   your active User Model?" One-click acceptance, writes to active User
   Model's draft.

9. /api/ai/ask/route.ts — the unified Ask endpoint that:
   - Runs intent classification (or accepts explicit mode)
   - Returns the plan in step [B]
   - On confirmation, executes the plan via the appropriate subagents
     and Methods
   - Streams the response with claim-level provenance metadata

CONSTRAINTS:
- DO NOT bypass the agent plan preview. Every Deep/Research/Memo run
  shows the plan before executing (Quick can auto-run after grace).
- DO NOT skip the [I] capture loop. It's how Pillar 2 grows.
- DO NOT add a third picker (Ontology). Per ADR-0038, ontology is hidden
  by default; it surfaces in /contexts/[id] sidebar Extraction Lenses.

VERIFICATION:
  npm run audit:ask-praxis-primary
  npm run audit:experience-map-coherence
  npm run audit:no-internal-jargon-ui
  npm run lh:ci                          # Lighthouse on /app

Smoke test: Type "What changed in Indo-Pacific dynamics this month?" in
the bar, see plan preview within 1s with mode and tool plan, click
Confirm, see streamed structured response with hoverable claims, see
the [I] capture footer at the end.

COMPLETION CRITERIA:
- /app homepage shipped per §1 product spec.
- Intent classifier returns valid plan in P95 ≤ 500ms.
- Slash commands and file attachment routing work.
- Claim-level provenance hover-popovers work.
- [I] capture loop persists to User Model draft.

BRANCH: feat/v5-4d-ask-homepage
PR TITLE: feat(v5-4d): Ask homepage with intent classifier + transparent agent loop
REFERENCES: ADR-0038, ADR-0040.
```

### Phase 4E — Drafting Studio shell

```
Phase 4E of the v5 MVP build: build the Drafting Studio shell at /draft
and /draft/[draftId]. This is the surface skeleton; the 5 templates and
section-level AI actions land in Phase 6.

READ FIRST:
1. docs/build/AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v5_01_PRODUCT.md §5 (Drafting Studio)
3. src/components/memo/ (existing memo components — most reusable)
4. src/lib/memo/ (existing memo logic — extend, don't replace)

GOAL:
Build the Drafting Studio inbox at /draft and the long-form composition
surface at /draft/[draftId]. Wire up template selection, two-pane layout
(editor + context panel), Lexical block editor, export to DOCX and
Markdown.

DELIVERABLES:

1. src/app/draft/page.tsx — Drafting inbox. Lists user's drafts with
   filters (template type, work episode, status, last-modified).

2. src/app/draft/[draftId]/page.tsx — composition surface, two-pane:
   - Left pane: Lexical editor with block structure per active template.
   - Right pane: context panel showing Sources, Graph nodes, Episodes,
     active User Model summary, Actions.
   - Top bar: template picker, work episode dropdown, save/export buttons.

3. src/components/draft/DraftingShell.tsx — the two-pane layout
   component.

4. src/components/draft/ContextPanel.tsx — right pane:
   - Sources: list of Context's sources, draggable into prose.
   - Graph nodes: searchable list of graph nodes, draggable.
   - Episodes: list with bi-temporal "scope to this" toggle.
   - User Model summary: name, style, citation format.
   - Actions: Save draft, Export DOCX, Export Markdown.

5. src/components/draft/BlockEditor.tsx — Lexical-based block editor
   integrating with the template's block structure (defined in Phase 6).

6. src/lib/draft/api.ts — Firestore CRUD on users/{uid}/situations/
   {caseId}/drafts/{draftId}/. Auto-save every 5 seconds.

7. src/lib/draft/export.ts:
   - exportToDocx(draftId): uses the docx skill from /mnt/skills/public/
     docx/SKILL.md. Properly formatted Word doc.
   - exportToMarkdown(draftId): clean Markdown, citation footnotes.

8. /api/draft/* routes:
   - POST /api/draft/create with {caseId, templateId} → returns draftId
   - GET /api/draft/[draftId] → loads draft
   - PUT /api/draft/[draftId] → autosaves draft
   - POST /api/draft/[draftId]/export?format=docx|markdown → returns
     blob/download URL

CONSTRAINTS:
- DO NOT implement the 5 templates yet. That's Phase 6. For now,
  scaffolding only — the template picker can show "Phase 6 deliverable"
  placeholders.
- DO NOT implement section-level AI actions yet. Phase 6.
- DO NOT add a new editor library. Lexical stays.

VERIFICATION:
  npm run audit:routes (verify /draft and /draft/[draftId])
  npm run lint && npx tsc --noEmit && npm run build

Smoke test: Sign in, navigate to /draft, click "New draft", select a
Context, see the two-pane layout. Save draft. Reload; draft persists.

COMPLETION CRITERIA:
- /draft inbox lists drafts.
- /draft/[draftId] two-pane composition surface.
- Lexical editor functional.
- Auto-save works.
- DOCX and Markdown export work (with placeholder content for now;
  templates land in Phase 6).

BRANCH: feat/v5-4e-drafting-shell
PR TITLE: feat(v5-4e): Drafting Studio shell at /draft and /draft/[draftId]
REFERENCES: ADR-0038.
```

---

## Phase 5 — Methods implementation (Wave 3, parallel-safe with Phase 6)

Phase 5 implements the 10 MVP Methods. Use this **template prompt** for each Method, substituting the Method-specific spec from the table after.

### Phase 5 template prompt (apply per Method)

```
Phase 5 of the v5 MVP build: implement the {METHOD_NAME} Method.

READ FIRST:
1. docs/build/AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v5_03_METHODS_AND_DRAFTING.md §{N}
   (the {METHOD_NAME} spec — purpose, input, output, L-pattern, demo
   examples)
3. src/lib/tools/registry/ (existing Method registry pattern)
4. skills/tools/ (existing SKILL.md files — note the 9-section structure)
5. src/lib/api/with-auth.ts and the standard AI route shape (File 1 §3)

GOAL:
Implement {METHOD_NAME} as a registered Method with full Tool Contract v2,
SKILL.md documentation, role-affinity entry, and a canary fixture test.
Method must run end-to-end against any of the 3 demo Contexts.

DELIVERABLES:

1. src/lib/tools/registry/{CATEGORY}.{METHOD_ID}.ts — Tool Contract v2
   manifest:
   - id: '{METHOD_ID}'
   - name: '{METHOD_NAME}'
   - category: '{AI|Research|Deterministic}'
   - description: one-line user-facing description
   - inputSchema: Zod schema for inputs
   - outputSchema: Zod schema for outputs
   - lPatterns: ['L{n}', ...] from L1-L12
   - costClass: 'free|cheap|medium|expensive'
   - latencyBudgetP95Ms: number
   - ontologyRequirements: { domain: ['{ontologyId}'], work: optional }
   - composition: { canChainInto: ['{otherMethodId}'], canConsumeFrom:
     ['{otherMethodId}'] }
   - handler: async (input, snapshot) => output

2. skills/tools/{METHOD_ID}/SKILL.md — 9 canonical sections:
   - Purpose
   - When to use
   - When NOT to use
   - Input contract
   - Output contract
   - Examples (with output snippets for each of the 3 demo Contexts
     where applicable)
   - Composition with other Methods
   - Cost and latency
   - Pattern (L{n}) and rationale

3. src/lib/tools/suggestion/role-affinity.ts entry — list which
   personas × Context combinations should trigger this Method in the
   suggestion strip.

4. tests/methods/{METHOD_ID}.test.ts — canary fixture test running
   against a fixture Context (one of the 3 demo Contexts). Asserts
   output schema conformance, basic correctness on known input.

5. /api/methods/{METHOD_ID}/run/route.ts (or extend the unified
   /api/methods/run endpoint) — wires the Method to HTTP, applies the
   standard AI route shape (File 1 §3).

CONSTRAINTS:
- DO NOT bypass ContextProvider. The Method handler reads from the
  ContextSnapshot only.
- DO NOT call any LLM directly. Use providers via the model matrix.
- DO NOT skip the symbolic firewall on writes.
- DO NOT introduce a new L-pattern. Only L1-L12.

VERIFICATION:
  npm run audit:tool-contract-v2
  npm run audit:tool-skills-present
  npm run audit:tool-context-isolation
  npm run audit:llm-pattern-coverage
  npx tsc --noEmit && npm run build
  npm run test -- tests/methods/{METHOD_ID}.test.ts

Smoke test: Run the Method against the {DEMO_CONTEXT} fixture via
/methods/[methodId] in the dev server. Verify the output renders
correctly and citations are clickable.

COMPLETION CRITERIA:
- Method registered, schema-validated input/output.
- SKILL.md complete (9 sections).
- Role-affinity entry present.
- Canary fixture test green.
- Smoke test passes against the {DEMO_CONTEXT}.

BRANCH: feat/v5-5-{METHOD_ID}
PR TITLE: feat(v5-5): {METHOD_NAME} Method implementation
REFERENCES: ADR-0040 (L-pattern declaration).
```

### The 10 MVP Methods to instantiate (apply template above to each)

Run the template prompt 10 times, substituting:

| # | METHOD_ID | METHOD_NAME | CATEGORY | L-PATTERNS | DEMO_CONTEXT |
|---|---|---|---|---|---|
| 1 | `research.deep-research-agent` | Deep Research Agent | Research | L2, L3, L9 | All 3 |
| 2 | `analysis.stakeholder-power-interest` | Stakeholder Power-Interest Map | Deterministic (with optional L8 for relationship inference) | L8 | All 3 |
| 3 | `analysis.frame-narrative` | Frame & Narrative Analyzer | AI | L6 | Indo-Pacific (sovereignty/self-determination); F&B (greenwashing/transparency) |
| 4 | `analysis.position-vs-interest` | Position-vs-Interest Decoder | AI | L4 | AI Regulation (industry positions vs interests); Indo-Pacific (state positions vs interests) |
| 5 | `analysis.scenario-projector` | Scenario Projector | AI | L5 | All 3 |
| 6 | `analysis.ach-hypothesis` | ACH Hypothesis Generator | AI | L4, L9 | All 3 |
| 7 | `drafting.memo-drafter` | Memo Drafter | AI | L12 (wraps Memo Drafter subagent from Phase 3) | All 3 |
| 8 | `analysis.contradiction-finder` | Contradiction Finder | AI | L9 | All 3 |
| 9 | `analysis.coalition-detector` | Coalition Detector | Deterministic (Louvain community detection on Actor-relationship subgraph) | none (deterministic) | All 3 |
| 10 | `analysis.commitment-tracker` | Commitment Tracker | AI + Deterministic | L7 (extraction) + deterministic lifecycle | F&B (sustainability pledges); Indo-Pacific (treaty commitments); AI Regulation (regulatory pledges) |

**Important detail per Method** (each agent reads §10-19 of File 3 v5 vision for the full spec when it lands; for now the table above is the contract):

- **Deep Research Agent**: wraps the Research pipeline from Phase 2B. Input: `{caseId, question, depth: 'shallow'|'deep'}`. Output: structured report (executive summary, key findings, source matrix, gaps, contradictions, follow-ups). Latency P95 ≤ 60s. Cost ≤ $0.30.

- **Stakeholder Power-Interest Map**: deterministic algorithm. Input: `{caseId}`. Reads Actor nodes from situation graph; computes power score (centrality + leverage edges) and interest score (claim/interest density). Output: 2D coordinates per actor + coalition clusters (Louvain). SVG visualization.

- **Frame & Narrative Analyzer**: L6 narrative projection over the Narrative Graph layer. Input: `{caseId, dateRange}`. Output: frame clusters, dominant frames per actor, framing shift timeline.

- **Position-vs-Interest Decoder**: L4 abductive. Input: `{caseId, actorId | actorIds[]}`. For each actor, surfaces: stated positions (from Claim nodes), inferred underlying interests (from Interest nodes + abductive reasoning over context). Output: position-interest table with explanation per row.

- **Scenario Projector**: L5 counterfactual. Input: `{caseId, horizon: '30d'|'90d'|'1y', forcingVariables[]}`. Output: 3 scenarios with indicators, probabilities (subjective), signposts to watch. Stored in Scenario layer of graph (layer flag from migration 0027).

- **ACH Hypothesis Generator**: L4 + L9 in combination. Input: `{caseId, question}`. Generates 4-7 competing hypotheses, builds evidence × hypothesis matrix, highlights diagnosticity, produces most-likely-hypothesis with rationale.

- **Memo Drafter**: L12. Wraps the Memo Drafter subagent deployed in Phase 3. Input: `{caseId, templateId, customInstructions?}`. Output: structured memo blocks with citations. Routes through Vertex Agent Engine.

- **Contradiction Finder**: L9. Input: `{caseId, scope: 'all'|'recent'|'episode:{episodeId}'}`. Finds Claims that mutually contradict, ranked by stake. Output: contradiction list with sources and confidence per side.

- **Coalition Detector**: deterministic Louvain on Actor relationships. Input: `{caseId, weightingScheme: 'leverage'|'claim-overlap'|'commitment-shared'}`. Output: communities + cohesion scores + bridges between communities.

- **Commitment Tracker**: L7 extraction (from agreements/treaties/pledges in sources) plus deterministic lifecycle state machine (proposed → agreed → implemented → breached → lapsed). Input: `{caseId, scope: 'all' | 'episode:{episodeId}'}`. Output: commitments table with state, breach analysis, accountability surface.

Each Method is approximately 0.5-1 day of work for one agent. Run the 10 prompts in any order; they don't interact. Phase 5 ends when all 10 are merged with green audits.

---

## Phase 6 — Drafting Studio templates and section-level AI actions (Wave 3)

```
Phase 6 of the v5 MVP build: implement the 5 MVP Drafting templates and
the 5 section-level AI actions that operate on draft blocks.

READ FIRST:
1. docs/build/AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v5_01_PRODUCT.md §5 (Drafting Studio)
3. src/components/draft/ (Phase 4E shell)
4. src/lib/memo/templates/ (existing template structures)
5. /mnt/skills/public/docx/SKILL.md (the docx skill — read fully if your
   environment has skill access)

GOAL:
Implement 5 MVP Drafting templates with structured block schemas and
default content. Implement 5 section-level AI actions (Tighten, Rewrite,
Add citation, Add scenario, Continue) that operate on selected blocks
via the Output Refiner subagent.

DELIVERABLES:

1. src/lib/memo/templates/{templateId}/blocks.ts (NEW × 5):
   - un-1-pager (Title, Date, BLUF, Background, Current Dynamics, Key
     Actors, Risks, Recommendation)
   - country-card (Title, Snapshot, Demographics, Political Landscape,
     Economic Indicators, Security, Sources)
   - talking-points (Title, Audience Note, Headline Points (3-5), Q&A
     Anticipations (3-5), Closing)
   - mediation-brief (Title, Session Goal, Parties, Positions vs
     Interests, BATNA Analysis, Suggested Sequence, Risks)
   - executive-summary (Title, Bottom Line, Context, Findings (3-5),
     Implications, Recommendation)

   Each template defines:
   - Section ordered list
   - Per-section: required/optional, max length, validation rules,
     default LLM-fill prompt fragment, citation policy
   - Header/footer formatting

2. src/lib/memo/templates/templates.json — central registry of all 5
   templates with metadata (audience defaults, common use cases, demo
   Context affinity).

3. src/components/draft/SectionAIActions.tsx — context menu with 5
   actions per block:
   - Tighten — reduce by ~30%, preserve facts.
   - Rewrite [register] — pick from {diplomatic, analytical, accessible,
     executive}.
   - Add citation for X — surface available sources, insert footnote.
   - Add scenario — insert an alternative scenario block.
   - Continue from prior block — extend narrative coherently.

   Each action calls /api/draft/[draftId]/refine?action=... which routes
   to the Output Refiner subagent (Phase 3 deployment).

4. src/components/draft/InlineCitation.tsx — drag-drop a Source from the
   right-hand context panel into the prose:
   - Drop creates an inline footnote anchor.
   - Footnote auto-formats per active User Model citation style
     (footnoted/parenthetical/endnote).
   - Hover shows source span + graph node provenance + confidence.

5. /api/draft/[draftId]/refine/route.ts — accepts action + selected
   block content + scope. Calls Output Refiner subagent. Returns refined
   content + diff. Two-phase commit on save.

6. /api/draft/[draftId]/auto-fill/route.ts — accepts templateId.
   Generates outline (L12 prompt for outline structure), then fills
   each section in parallel using Memo Drafter. Returns completed draft
   blocks. Total latency P95 ≤ 30s for 5-section template.

7. Update Phase 4E template picker to show the 5 real templates instead
   of placeholders.

CONSTRAINTS:
- DO NOT bypass User Model style adaptation. Every refinement preserves
  facts AND adapts style per active User Model.
- DO NOT skip citation grounding. Every Add citation action requires a
  source receipt to anchor.
- DO NOT add tracked changes review/accept workflow. Lexical built-in
  history is fine for MVP. Audit-grade tracking is v1.5.

VERIFICATION:
  npm run audit:drafting-templates-present   # all 5 registered
  npx tsc --noEmit && npm run build
  npm run test -- tests/draft/

Smoke test:
  Open /draft, create new draft from Indo-Pacific Context with un-1-pager
  template. Click "Auto-fill from context". See structured 1-pager in
  ≤30s with citations. Right-click BLUF, click Tighten — see tightened
  version in ≤4s with same citations. Drag a source from the right
  panel into Background — see inline footnote. Export DOCX — verify
  Word doc downloads, properly formatted with footnotes.

COMPLETION CRITERIA:
- 5 templates registered, validated by audit.
- 5 section-level AI actions functional via Output Refiner.
- Auto-fill from context works in ≤30s.
- Inline citation drag-drop works.
- DOCX export properly formatted.

BRANCH: feat/v5-6-drafting-templates
PR TITLE: feat(v5-6): five MVP Drafting templates + five section-level AI actions
REFERENCES: ADR-0038, ADR-0040 (L11, L12).
```

---

## Phase 7 — Demo Content Seeding (Wave 4, depends on Waves 1-3 complete)

```
Phase 7 of the v5 MVP build: seed the three demo Contexts with real,
verifiable, working content. This is the foundation of the public WOW.

READ FIRST:
1. docs/build/AGENT_OPERATING_GUIDE.md (full)
2. docs/architecture/PRAXIS_VISION_v5_01_PRODUCT.md §2.2 (the 3 demo
   Contexts) and §9 (the first 5 minutes — what the demo must deliver)
3. The three persona specs in File 1 §1 of this build package

GOAL:
Three demo Contexts loaded with real source receipts, populated graphs,
realistic episodes, and 9 cached demo responses (3 questions × 3
contexts) for the public landing's instant-load demo.

DELIVERABLES:

1. seed scripts: scripts/seed-demos/ (NEW directory):
   - seed-indo-pacific.ts — populates the Indo-Pacific Strategic
     Competition 2026 demo Context.
   - seed-ai-regulation.ts — populates the AI Regulation US demo
     Context.
   - seed-fb-sustainability.ts — populates the F&B Sustainability
     demo Context.
   - seed-user-models.ts — writes the 3 seeded User Models to the
     demo-account Firestore (not user accounts).
   - seed-cached-responses.ts — generates and stores 9 cached demo
     responses for instant-load.

2. Real source content for each demo Context:

   INDO-PACIFIC: ≥30 source receipts including:
   - 5+ ICG reports on Indo-Pacific dynamics (2024-2026)
   - 3+ RAND analyses
   - 5+ Foreign Affairs / Foreign Policy articles
   - 5+ Reuters/Nikkei news items on Quad/AUKUS/Taiwan dynamics
   - World Bank governance indicators for top 10 IP states
   - V-Dem regime classifications
   - 10+ Wikidata-anchored major actor records
   - 3+ academic papers (Foreign Affairs, ISA, JIRD)

   Use real publicly-accessible sources. PDF copies stored in Cloud
   Storage at gs://praxisbytacitus-demo-sources/indo-pacific/. Source
   receipts in Firestore at users/_demo/situations/indo-pacific-2026/
   sources/.

   Resulting graph: ~30 actors, ~80+ claims, ~25+ commitments, ~10+
   events (including 8-12 episodes).

   AI REGULATION US: ≥30 source receipts including:
   - White House EOs on AI (text + analyses)
   - NIST AI RMF documents
   - State laws: CA SB 1047 (and successors), NY, IL, CO, TX
   - EU AI Act for comparison
   - Industry comments to NIST/OMB rulemakings (OpenAI, Anthropic,
     Google, Microsoft, Meta, IBM)
   - Civil society letters (EFF, ACLU, AI Now, Mozilla)
   - Brookings, AEI, CAP, Heritage, R Street analyses
   - GAO/CRS reports on AI policy

   Resulting graph: ~40 actors, ~100+ claims, ~30+ commitments, ~15
   events (12-15 episodes).

   F&B SUSTAINABILITY: ≥30 source receipts including:
   - FDA labeling rulemakings and updates
   - USDA/EPA filings
   - GHG protocol disclosures from F&B majors (Nestlé, PepsiCo,
     Unilever, Tyson, Cargill, ADM, Mars, Coca-Cola)
   - GRI/SASB/TCFD/ISSB sustainability filings (latest cycle)
   - NGO campaign materials (EWG, CSPI, FTW)
   - Retailer ESG commitments (Walmart, Costco, Whole Foods)
   - Industry analyst reports (Rabobank Food & Agribusiness, McKinsey)
   - Investor stewardship votes

   Resulting graph: ~35 actors, ~80+ claims, ~30+ commitments
   (sustainability pledges are gold here), ~10 events.

3. Episode timelines per Context (~10 episodes each, situation +
   work strands):
   - Indo-Pacific: situation episodes for major events (Quad summits,
     AUKUS announcements, Taiwan elections, leadership transitions);
     work episodes for the FP Analyst's research cycle (think tank
     publication cycles, conference presentations, op-ed cycles).
   - AI Regulation: situation episodes for EO signings, NIST releases,
     state law passages, federal hearings, court rulings; work episodes
     for the Domestic Policy Analyst's legislative cycle (hearing prep,
     coalition meetings, regulatory comment deadlines).
   - F&B Sustainability: situation episodes for FDA rulemakings,
     industry sustainability commitments, NGO campaigns, investor
     stewardship votes; work episodes for the Corporate Strategic
     Analyst's stakeholder engagement cycle (board briefings, investor
     calls, industry association cycles).

4. Cached demo responses (9 = 3 questions × 3 contexts):
   For each demo Context, three pre-rendered AI responses to common
   questions:
   - Indo-Pacific:
     Q1: "What's changed in Indo-Pacific dynamics this month?"
     Q2: "Show me the stakeholder power-interest map."
     Q3: "Draft a 1-page think-tank country card on Taiwan dynamics."
   - AI Regulation:
     Q1: "What's the current state of US federal AI regulation?"
     Q2: "Map industry positions vs underlying interests on AI safety."
     Q3: "Draft a legislative briefing for a Senate staffer on
          AI regulation pre-emption."
   - F&B Sustainability:
     Q1: "Track sustainability commitments by F&B majors and compliance."
     Q2: "Map stakeholder positions on FDA labeling reform."
     Q3: "Draft a board briefing on F&B regulatory & ESG exposure."

   Each cached response is a fully-formed structured AI output stored at
   gs://praxisbytacitus-demo-cached/{contextId}/{questionId}.json with
   format-as-stream-response shape. Loads in <200ms.

5. Demo-account Firestore population:
   - users/_demo/profile/ — demo user profile
   - users/_demo/situations/{indo-pacific-2026, ai-regulation-2026,
     fb-sustainability-2026}/ — full Context structure
   - users/_demo/user-models/{foreign-policy-analyst, domestic-policy-
     analyst, corporate-strategic-analyst}/current — the 3 seeded models

   Demo account is read-only via Firestore rules (signed-out demo).

6. Smoke test scripts: scripts/seed-demos/verify.ts — verifies:
   - Each demo Context has ≥30 source receipts.
   - Each Context's graph has the expected actor/claim/commitment counts.
   - Each Context's timeline has ≥8 situation episodes + ≥3 work
     episodes.
   - All 9 cached responses load in <200ms.
   - Public demo at /demo/[contextId] renders without auth.

CONSTRAINTS:
- DO NOT use synthetic / generated source content. Real publicly-
  accessible sources only. Cite the URL in source metadata.
- DO NOT use copyrighted content beyond fair-use snippets. Source
  receipts should excerpt only the relevant byte spans.
- DO NOT seed under a real user's account. Use users/_demo/ exclusively.
- ALL 3 seeded User Models match the personas locked in File 1 §1.

VERIFICATION:
  npm run scripts:seed-demos
  npm run scripts:verify-demos
  npm run test:e2e -- demo/indo-pacific demo/ai-regulation demo/
                       fb-sustainability

Functional test:
  Open /demo/indo-pacific-2026 in incognito (signed out). Verify:
  - Context page loads with all 8 sidebar panels.
  - Sources panel shows ≥30 real source receipts with tier badges.
  - Graph panel renders ~30 actors with relationships.
  - Timeline panel shows situation + work episodes.
  - Methods panel shows 10 MVP Methods.
  - Click Stakeholder Power-Interest Map: cached response loads
    instantly.
  - Type "What's changed in Indo-Pacific dynamics this month?":
    cached response loads in <2s.

COMPLETION CRITERIA:
- 3 demo Contexts seeded with ≥30 real sources each.
- 3 demo User Models in users/_demo.
- 9 cached responses pre-rendered.
- Public demo accessible at /demo/[contextId] without auth.
- 5-minute first-WOW journey completes successfully end-to-end.

BRANCH: feat/v5-7-demo-content
PR TITLE: feat(v5-7): three demo Contexts + cached responses + demo User Models
REFERENCES: ADR-0039.
```

---

## Phase 8 — Public Landing Page rebuild (Wave 5)

```
Phase 8 of the v5 MVP build: rebuild the public landing page at / with
the live demo experience.

READ FIRST:
1. docs/build/AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v5_01_PRODUCT.md §8 (public landing)
3. src/app/(landing)/ (existing landing components — most reusable)

GOAL:
Rebuild / with the hero (live demo bar with two pickers + cached
responses), three section explainers, pricing, and trust elements. The
visitor experiences the product before sign-up.

DELIVERABLES:

1. src/app/(landing)/page.tsx — full rebuild:
   - Hero: two pickers (User pre-selected to FP Analyst with options;
     Context pre-selected to Indo-Pacific with options including AI
     Regulation, F&B Sustainability), Ask bar with 3 example questions
     placeholder rotation, Run button. NO sign-up wall.
   - Section 1: "Two contexts, one engine" — short animation showing
     same question across 3 personas producing 3 different answers.
   - Section 2: "The right tools for the work" — grid of 10 MVP Methods
     each with one-line description.
   - Section 3: "Drafting that fits the work" — side-by-side comparison
     of generic LLM draft vs PRAXIS draft on the same UNSC briefing.
   - Pricing CTA: link to /pricing.
   - Trust strip: customer logos (placeholder until real ones).
   - Footer: docs, privacy, terms, security, contact.

2. /demo/[contextId] route — read-only Context view, watermarked, signed-
   out, instant-load cached responses for the 3 seeded questions.

3. Performance: Lighthouse score ≥90 on mobile and desktop. Hero
   loads in <1s on a cold cache (Cloud CDN + edge caching).

4. Conversion tracking: Google Analytics 4 + key event tracking for
   "demo question asked", "Method run", "sign-up clicked".

CONSTRAINTS:
- DO NOT advertise the architecture (ontology layer, seven graphs, 12
  patterns). Visitors don't care.
- DO NOT add a sign-up wall on the demo. The visitor experiences the
  product first.
- DO NOT use stock photography. Custom illustrations or no imagery.

VERIFICATION:
  npm run audit:legal-pages-present
  npm run lh:ci          # Lighthouse score ≥90
  npx playwright test e2e/landing.spec.ts

Smoke test: Open / in incognito. Type a demo question. See cached
response in <2s. Click "Sign up". Magic-link arrives.

COMPLETION CRITERIA:
- /  rebuild shipped with live demo.
- /demo/[contextId] read-only routes work.
- Lighthouse ≥90 on hero.
- Sign-up flow works end-to-end.

BRANCH: feat/v5-8-public-landing
PR TITLE: feat(v5-8): public landing page rebuild with live demo
REFERENCES: ADR-0038.
```

---

## Phase 9 — Polish & Ship (Wave 5)

```
Phase 9 of the v5 MVP build: polish, pricing/Stripe, persona suites in
CI, audit chain final pass, canary deployment to production.

READ FIRST:
1. docs/build/AGENT_OPERATING_GUIDE.md (full — especially §8 Completion
   checklist)
2. tests/e2e/personas/ (existing persona test suites — Diplomat-Syria
   and Researcher-Nordalia. These are the templates to adapt to the new
   demo Contexts.)
3. docs/runbooks/ (deployment runbooks)

GOAL:
Ship-ready MVP. All audits green. Two persona suites green for 10
consecutive runs. Stripe checkout for Solo and Team. Settings, admin,
mobile-responsive polish. Canary 5%/25%/100% deploy with auto-rollback
on regression.

DELIVERABLES:

1. tests/e2e/personas/diplomat-indo-pacific.spec.ts (NEW) — adapted from
   Diplomat-Syria. End-to-end persona journey:
   - Sign in as Foreign Policy Analyst persona.
   - Land on /app, see Indo-Pacific Context active.
   - Run Deep Research on a real question.
   - Run Stakeholder Power-Interest Map.
   - Open Drafting Studio, generate UN 1-pager, tighten BLUF, export
     DOCX.
   - Verify all assertions on response quality and structure.

2. tests/e2e/personas/researcher-ai-regulation.spec.ts (NEW) — adapted
   from Researcher-Nordalia. End-to-end persona journey for Domestic
   Policy Analyst on AI Regulation Context.

3. CI pipeline updates: persona suites must run on every commit and
   pass 10 consecutive times before merge to main allowed.

4. Pricing surface:
   - src/app/pricing/page.tsx with tier comparison table.
   - Stripe checkout integration for Solo ($30/mo) and Team ($120/seat,
     min 3 seats). Use Stripe checkout sessions; the meters API for
     usage-based AI overages defers to v1.5.
   - Webhook handler at /api/stripe/webhook to update Firestore
     subscription status.

5. Settings surface:
   - src/app/settings/page.tsx — preferences (timezone, default User
     Model, default Context), API keys (placeholder for v1.5
     connectors), billing (Stripe portal link), notifications, account
     deletion.

6. Admin surface:
   - src/app/admin/page.tsx — owner-only diagnostics. Cost dashboard
     per User × Context × Method, error logs, Vertex Agent Engine
     deployment health, audit trail explorer, user list, plan
     management. Hidden from non-admin users.

7. Mobile responsive polish:
   - All routes work on mobile widths (320px+).
   - The bar collapses, pickers stack, sidebar collapses to a drawer.
   - Drafting Studio is read-only on mobile (writing on a phone is not
     a target use case for MVP).

8. Final audit pass:
   - Full audit:gate green for 7 consecutive days on main.
   - All 90+ items in File 1 §8 completion checklist verified.

9. Canary deployment:
   - Cloud Run revision deployed at 5% traffic for 12 hours.
   - Monitor error rate, P95 latency, cost.
   - Auto-rollback trigger: error rate >2% over 5 minutes, P95 latency
     regression >50%, cost spike >150% of baseline.
   - If canary clean: 25% for 24 hours, then 100%.

10. Documentation final pass:
    - README.md updated with v5 vision summary + screenshots.
    - CHANGELOG.md v5.0 release entry.
    - STATUS.md declares MVP shipped.
    - All 4 ADRs (0037-0040) signed and Accepted.
    - tacitus-ontology MIT package published to GitHub at v1.0.

CONSTRAINTS:
- DO NOT skip the canary phases. 5% → 25% → 100% with monitoring
  between each.
- DO NOT enable Stripe Meters API. Solo and Team are flat-priced in
  MVP.
- DO NOT mark MVP done if any persona suite fails. 10 consecutive
  green runs required.

VERIFICATION:
The full File 1 §8 completion checklist must pass. Every item.

  npm run audit:gate                # green
  npm run test:e2e:personas         # 10 consecutive green
  npm run test                       # all unit tests green
  cd backend && pytest               # all backend tests green
  npx playwright test e2e/           # all E2E green
  npm run lh:ci                      # Lighthouse ≥90

  Manual:
  - First-WOW journey end-to-end on production: 5 minutes from landing
    to a working uploaded-PDF Context.
  - Sign up via magic link → reach /app → ask a question → see response
    → save draft → export DOCX.
  - Pricing page → Stripe checkout → return to /app with Solo plan
    active.

COMPLETION CRITERIA:
- All 90+ items in File 1 §8 checklist green.
- 5%, 25%, 100% canary stages all clean.
- First paying customer can sign up and use the product end-to-end.

BRANCH: feat/v5-9-polish-and-ship
PR TITLE: feat(v5-9): MVP polish, persona suites, Stripe, canary deploy — SHIP IT
REFERENCES: All four ADRs (0037-0040).
```

---

## Final wave checkpoint — MVP shippable

When Phase 9 is fully verified, the MVP is shippable. Run through File 1 §8 once more. Open a release PR, tag v5.0.0, and ship.

The first paying customer can sign up and reach the WOW within 5 minutes. The team is ready for the next wave (v1.5 — see PRAXIS_VISION_v5_04_BUILD_PLAN.md for the v1.5 roadmap).

---

## Closing note for agents

The architecture is the moat. The discipline is the velocity. Read the v5 vision files before any prompt. Run the audit chain before any PR. Do not invent. Do not bypass. Do not rush.

When in doubt, re-read File 1 §9 — the "when in doubt" rules. They resolve most ambiguity.

Build the MVP. Ship it. Watch the first WOW happen.

---

*End of File 3 of 3. End of MVP build package.*

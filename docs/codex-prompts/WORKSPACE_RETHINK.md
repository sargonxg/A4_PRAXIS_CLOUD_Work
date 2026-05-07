# PRAXIS — Workspace Rethink: Tabs, Chapters, and the AI Wiring Fabric

**Audience:** founder, design partner, lead engineer, Codex/Claude Code build agents
**Companion docs:** `TABS_BUILD_GUIDE.md`, `CHAPTERS_BUILD_GUIDE.md`
**Supersedes the surface model in:** `CHAPTERS_ARCHITECTURE.md`, `CHAPTERS_IMPLEMENTATION.md`, `CHAPTERS_CODEX_INSTRUCTIONS.md`
**Preserves the data layer in:** `COGNEE_ARCHITECTURE.md`, `COGNEE_IMPLEMENTATION.md`, `COGNEE_OPERATIONS.md` (firewall, RLS, tenant isolation, dataset naming, migrations 0011–0015 — all unchanged)

---

## 0. Why this rethink

Two things are wrong with the previous spec.

**First**, it collapsed two genuinely different concepts under one label, "Chapter". The substrate of a case — sources, ontology, graph, situation — is not the same kind of thing as the analytical tools the analyst uses on top of it. Substrate is always there; tools are picked up and put down. Treating them as a flat marketplace flattened a real distinction the analyst already feels.

**Second**, it under-used Cognee. The previous spec had Cognee as a memory store: `remember`, `recall`, `improve`. But Cognee is much more capable than that. With our ACO ontology passed as an OWL file (or as Pydantic DataPoints), Cognee runs ontology-validated knowledge graph extraction directly out of the `cognify()` pipeline — meaning the candidate ACO primitives, the embeddings, the temporal graph, and the multi-mode search are all things Cognee gives us natively. The previous spec had us reimplementing parts of this in `extract_structured/` and `extract_graphrag/`. The right answer is to lean on Cognee for the substrate-building work and reserve our code for the analyst's surface and the orchestration logic.

This document is the architectural reset. The two companion docs operationalize it tab-by-tab and chapter-by-chapter.

---

## 1. The dual model

### Tabs — substrate
Persistent strip across the top of the workspace. Four tabs, always present, never removable, never reorderable. Their order encodes the canonical flow: situation → sources → ontology → graph.

| Tab        | What it controls |
|------------|------------------|
| **Context**  | The situation frame. The case's first-person narrative anchor. |
| **Library**  | Sources, ingestion status, provenance. Cognee `add` + `cognify` runs here. |
| **Ontology** | The ACO primitives. The Cognee-bridge candidate review queue. The promotion checkpoint. |
| **Graph**    | The canonical conflict graph. Visualization, navigation, subgraph filtering. |

A Tab opens as an overlay over the desk; closing returns the analyst to the same desk state. Tabs are not in the marketplace — every analyst always has all four, in the same order.

### Chapters — tools
Composable panes the analyst arranges on their desk. Seven chapters in v1 — Desk is always-on, the other six are togglable, hideable, reorderable.

| Chapter      | What it does |
|--------------|---------------|
| **Desk**     | Always-on home pane. KPIs, AI suggestions, recent activity. The launchpad. |
| **Research** | Iterative inquiry over the case substrate. The chapter that builds memory coverage. **Primacy.** |
| **Memos**    | Saved analytical products from DIALECTICA, ACH, or freeform. Re-runnable, editable, version-tracked. |
| **Draft**    | Active writing surface with live citation lookup. The deliverable canvas. |
| **ACH**      | Heuer's Analysis of Competing Hypotheses, scored against graph evidence. |
| **Tools**    | DIALECTICA recipe runner — twelve graph-grounded reasoning patterns. |
| **Boardroom** | Briefing composition with provenance footnotes. |

### The Desk
The screen between Tab visits. A grid of Chapter panes the analyst composes. Workspace templates seed which Chapters appear. Personal preferences override.

The **Tab strip is always visible at the top**, even when a Tab is open as overlay. Substrate is always one click away.

---

## 2. Visual layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ PRAXIS · Syria Transition 2026 · Health 78% · ⚙ orchestrator: idle    │  workspace header
├──────────────────────────────────────────────────────────────────────┤
│  Context · Library · Ontology · Graph              ⌘K  · settings    │  TAB STRIP
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─ Desk ────────────────────┐  ┌─ Research (active) ──────────────┐ │
│  │ KPIs                      │  │ Question: "HTS governance posture"│ │
│  │ AI suggestions (3 new)    │  │ 5 hits · cite from Library         │ │
│  └───────────────────────────┘  └───────────────────────────────────┘ │
│                                                                       │
│  ┌─ Memos ────────────────────┐  ┌─ Draft ──────────────────────────┐ │
│  │ Stakeholder map →          │  │ Q1 Outlook · 4 inline citations   │ │
│  │ Contradiction scan →       │  │ "...HTS has consolidated cabinet  │ │
│  └────────────────────────────┘  │  authority [cite] but face[..]   │ │
│                                  └───────────────────────────────────┘ │
│              < + add a chapter to your desk >                         │
└──────────────────────────────────────────────────────────────────────┘
```

When the analyst clicks a Tab — say, **Ontology** — that Tab slides over the desk:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Context · [ Ontology ] · Library · Graph                ✕ close      │
├──────────────────────────────────────────────────────────────────────┤
│  Actors 16 · Claims 12 · Interests 8 · Constraints 6 · ...           │
│                                                                       │
│  Candidates pending  (8)        Recently promoted (12)               │
│  ┌──────────────────────┐       ┌──────────────────────┐             │
│  │ "SDF withdrew from   │       │ Actor: HTS political  │             │
│  │  Raqqa in May 2025"  │       │ wing                  │             │
│  │  [Promote] [Reject]  │       │ confidence 0.55       │             │
│  └──────────────────────┘       └──────────────────────┘             │
└──────────────────────────────────────────────────────────────────────┘
```

Three deliberate UX choices:

- **Tab strip is always visible.** Substrate is one click away from any chapter.
- **Chapters do not unmount when a Tab opens.** Their state survives. Tab opening is overlay, not navigation.
- **Orchestrator status is in the header.** When Cognee is ingesting, when LangGraph is reasoning, when a recipe is running, the analyst sees a small status pulse. Trust comes from visibility.

---

## 3. The substrate strategy — Cognee does the heavy lifting

The previous spec had us calling Cognee for memory only and writing our own extractors against Vertex Gemini for ACO candidates. That was strictly more code than necessary. Cognee already does ontology-grounded extraction. The new strategy:

**Phase A — ingest.** When the analyst uploads a source through the Library Tab, the backend calls `cognee.add(file, node_set=["case_<id>"])`. Tenant isolation continues via the dataset naming `{owner_uid}__{case_id}`; the `node_set` adds a per-case scope inside that.

**Phase B — cognify with ACO ontology.** The backend calls `cognee.cognify()` with three configuration choices that materially change what Cognee does:

1. `ontology_file_path="praxis_aco.owl"` — our ACO ontology expressed as OWL (Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative as classes, with sub-classes per analytical refinement). Cognee's `RDFLibOntologyResolver` then validates every entity against this ontology, fuzzy-matches by name, canonicalizes URIs, and tags each node with `ontology_valid: True | False`.
2. `temporal_cognify=True` — events are time-aware. This is not optional for conflict analysis; the difference between "HTS controlled Idlib in 2017" and "HTS controlled Idlib in 2025" is the analysis. Cognee builds time-stamped edges; our search queries can constrain by date.
3. Custom Pydantic DataPoints for the eight ACO primitives — defined in `backend/services/cognee_aco_models.py`. This gives us strongly-typed extraction with fields like `Actor.role`, `Claim.confidence_self_reported`, `Event.start_date`. Cognee returns Pydantic-validated objects, not loose JSON.

**Phase C — write candidates.** What Cognee extracts is then written to our existing `aco_cognee_link` table as `link_kind='candidate'`. The Ontology Tab's review queue reads from this table. The promotion path (analyst clicks Promote → bridge writes `graph_nodes` row with confidence ≤ 0.6, layer ∈ {Claim, Source}) is unchanged — the firewall is preserved verbatim.

**Phase D — memify.** When a research thread closes, the backend calls `cognee.memify()` on the case dataset. This is Cognee's graph-refinement primitive: it prunes stale nodes, strengthens frequently-connected paths, reweights edges based on usage. It runs in seconds on a per-case dataset.

**Phase E — search.** The Chapters use `cognee.search()` with mode-routing:

| Caller             | Mode                | Why |
|--------------------|---------------------|-----|
| Research recall    | `GRAPH_COMPLETION`  | "What does the graph say about X?" — graph-aware Q&A |
| ACH suggest evidence | `GRAPH_COMPLETION` | "Evidence for/against this hypothesis" |
| Tools recipes      | `INSIGHTS`          | "Surface unexpected connections" — for ContradictionScan, NarrativeArc |
| Draft cite         | `CHUNKS`            | "Give me the raw passage" |
| Memo source-back   | `CHUNKS`            | "Which exact passage grounds this claim?" |
| Boardroom synth    | `SUMMARIES`         | "Summarize this topic with citations" |
| Desk Q&A widget    | `NATURAL_LANGUAGE`  | "Ask anything about the case" |

Every search call uses `save_interaction=True`. This is the continuous-learning loop: Cognee logs every query and (if the analyst dismisses or accepts a result) trains its retriever for the case. After two weeks of use on a real case, recall quality is materially higher than day one.

**What we drop with this strategy:**

- The code in `backend/services/extract_structured/` for ACO extraction. Replaced by Cognee + ACO Pydantic DataPoints.
- The code in `backend/services/extract_graphrag/`. Replaced by `cognee.search(mode=GRAPH_COMPLETION)`.
- Hand-rolled embedding pipelines via pgvector. Cognee handles via its embedding layer.
- The "candidate dedup" code we'd need otherwise. Cognee's ontology resolver canonicalizes — duplicates collapse at extraction time, not after.

**What we keep:**

- The canonical `graph_nodes`/`graph_edges` tables. They remain the analyst's source of truth.
- The bridge table `aco_cognee_link` and the firewall trigger.
- Tenant isolation (Cognee dataset name + Postgres `app.tenant_id` + RLS).
- All migrations 0011 → 0015.

This is a meaningful simplification of our codebase, traded for a deeper dependency on Cognee. Given Cognee is open-source under Apache 2.0 with 12k+ stars and we'd be re-implementing a subset of what they do, it is the correct trade.

---

## 4. The agent stack — LangGraph orchestrates, Vertex Gemini reasons

PRAXIS already has agent infrastructure: `backend/agents/langgraph/`, `deep_research/`, `red_team_analyst/`, `analyst_persona/`, `moderator/`, `firewall/`. The rethink consolidates and clarifies, but does not replace.

**Decision: LangGraph remains the orchestration layer.**

Why: it's already in the stack; it has best-in-class state management and time-travel debugging via LangSmith; it is model-agnostic (Vertex Gemini works fine); checkpointing matches research-thread semantics naturally; and it composes with Vertex Gemini structured output for individual reasoning steps.

What we evaluated and rejected for v1:

- **Google ADK.** Cleanest deployment story to Vertex AI Agent Engine, native A2A protocol for cross-framework agent interop, hierarchical agent tree as a built-in primitive. But: net-new framework in the stack with no existing agents using it, the A2A interop benefit is forward-looking and we don't have third-party agent partners yet. **Designate as v2 candidate** when we want PRAXIS to be discoverable as an A2A peer (e.g., an analyst's external agent querying us).
- **CrewAI.** Lower learning curve, but role-based crews don't fit our case (we have specific named agents with defined behaviour, not loose role descriptions).
- **OpenAI Agents SDK.** Locks to OpenAI; we use Vertex Gemini per skill conventions.
- **AutoGen.** Conversational GroupChat doesn't match our event-driven workflow.
- **Vertex AI Agent Engine standalone.** Managed runtime is great but we need workflow logic before runtime.

**Decision: Vertex Gemini for inference, with explicit model strings.**

`gemini-3-flash` for cheap fast steps (extraction, summarization, recipe stubs).
`gemini-3.1-pro-preview` for the heavy reasoning steps (Research synthesis, DIALECTICA recipes that span the graph, ContradictionScan, RedTeamCounterclaim).

These are the only two model strings allowed per the workspace skill conventions and any deviation is a CI failure.

**Decision: MCP as the tool layer, A2A as a v2 surface.**

PRAXIS exposes itself as an MCP server (`backend/mcp/praxis_server.py` — new in P9.0) so external clients (Claude, ChatGPT, IDE assistants) can query a case via standardized tools: `praxis.list_cases`, `praxis.recall(case_id, query)`, `praxis.get_graph_subgraph`, `praxis.list_research_threads`. This is forward-compatible. When ADK 1.0 + A2A becomes the standard for cross-vendor agent comms, we wrap our MCP server with an A2A endpoint and we're discoverable.

### The LangGraph orchestrator

A new service at `backend/services/workspace_orchestrator/`. Built on LangGraph, deployed as a Cloud Run service (or as a long-running task within the existing FastAPI app behind a feature flag). It is the spine that threads substrate to chapters.

**State** — for each active case, a `CaseOrchestrationState` TypedDict containing: active workspace, recently-mutated substrate keys, recently-active chapter, pending suggestions, token budget remaining.

**Triggers** — Postgres `LISTEN/NOTIFY` channel `workspace_events` fired by triggers on `source_receipts`, `situation_frames`, `aco_cognee_link`, `research_threads`, `dialectica_runs`. The orchestrator's listener loop receives events and routes to the appropriate subgraph.

**Subgraphs** (the actual agent work):

| Subgraph                   | Trigger                                  | Backed by existing                       | Output |
|----------------------------|------------------------------------------|------------------------------------------|--------|
| `on_situation_frame_saved` | situation_frames upsert                  | `analyst_persona` agent                  | 3 suggested research questions → Desk feed |
| `on_source_ingested`       | source_receipts insert                   | wraps `cognee.cognify`                   | extraction status; new candidates queue notification |
| `on_candidates_accumulated` | aco_cognee_link insert (debounced)       | new dedup subgraph using cognee.INSIGHTS | dedup suggestions for Ontology Tab |
| `on_thread_closed`         | research_threads.status → 'closed'       | new                                      | calls cognee.memify; recomputes health; pushes Desk update |
| `on_dialectica_completed`  | dialectica_runs insert                   | `red_team_analyst`                       | counter-claim memo proposal |
| `on_graph_density_threshold` | graph_nodes count crosses thresholds     | new                                      | recipe recommendation for Tools chapter |
| `on_briefing_drafted`      | briefings update                         | `analyst_persona`                        | structure suggestion + citation auto-fill |

Each subgraph is small (3–6 nodes), uses `gemini-3-flash` by default, escalates to `gemini-3.1-pro-preview` only on the explicit "synthesize" step. Total token budget is enforced per case per day; default 50k tokens, configurable; 80% warning, 100% pause until next reset.

**Frontend wire-up** — Server-Sent Events at `GET /v1/workspace/events?case_id=...`. The workspace shell subscribes once, receives scoped events with chapter / tab routing keys, dispatches to a pub-sub on the client. Existing components in `src/components/assistant/` (`chat-interface.tsx`, `mutation-confirm-card.tsx`, `suggested-prompts.tsx`, `tool-invocation.tsx`) provide the visual primitives — we wire them to orchestrator events instead of inventing new components.

**Audit, transparency, control** — every orchestrator action is logged to `workspace_orchestrator_log` with the prompt, the model, the cost, the outcome. The analyst clicks any suggestion in the Desk feed → side panel shows the underlying agent trace. Settings has a global "Pause AI suggestions" toggle. Dismissals feed back into Cognee via `save_interaction(positive=False)` — the orchestrator stops suggesting similar patterns for that case.

### The contract

Three rules bind the entire system:

1. **Substrate is mutated only through Tabs.** Library is the only path that calls `cognee.add`. Ontology is the only path that calls `cognee_bridge.promote_link()` and writes to `graph_nodes`. Context is the only path that writes `situation_frames`. Graph is read-only in v1.
2. **Chapters consume substrate, produce work products.** Research produces `research_threads`. Memos produces `memos`. ACH produces `ach_*`. Tools produces `dialectica_runs`. Boardroom produces `briefings`. Draft produces `drafts`.
3. **The orchestrator writes only to its own tables and to candidate queues.** It writes to `workspace_suggestions`, `workspace_orchestrator_log`, and `aco_cognee_link` (candidate kind), and through `cognee.*` to memory. It does not write to canonical work-product tables. The analyst's products belong to the analyst.

Enforced via three CI scripts in `scripts/`:
- `audit-cognee-isolation.ts` (existing) — only `backend/services/cognee_memory.py` imports `cognee`
- `audit-tab-chapter-imports.ts` (new) — Chapters do not import each other's internals; Tabs are the only writers to substrate tables
- `audit-orchestrator-writes.ts` (new) — `backend/services/workspace_orchestrator/` does not write to canonical work-product tables

---

## 5. Priority order

The founder named three chapters explicitly: **Research, Memos, Draft.** The build order reflects this. Substrate Tabs come second — the Library Tab ships in a thin form alongside Research (you can't research without sources) but the rich versions of Library, Ontology, Graph come after.

| Phase | Surface | Why this order |
|-------|---------|----------------|
| P9.0 | Foundation: Tabs/Chapters split, workspace shell, orchestrator skeleton, MCP server stub, thin Library upload | Nothing else works without this |
| P9.1 | **Research chapter** | Primacy. The chapter that creates memory coverage and distinguishes PRAXIS from a document store. Ships with `deep_research` agent wrapped as LangGraph subgraph |
| P9.2 | **Memos chapter** | Capture and re-run; the substrate for Draft and Boardroom |
| P9.3 | **Draft chapter** | The deliverable canvas. Provenance becomes a paragraph |
| P9.4 | Context Tab (full) | The case's anchor; orchestrator suggests questions on save |
| P9.5 | Library Tab (full) | Source upload, ingestion progress with Cognee status, provenance edit, re-extract |
| P9.6 | Ontology Tab | Candidates queue with auto-grouping, primitive completeness, recently-promoted ledger |
| P9.7 | Graph Tab | Cognee visualize integration, subgraph filters, click-node provenance |
| P9.8 | ACH chapter | Hypotheses, cells, suggest-evidence via cognee.GRAPH_COMPLETION |
| P9.9 | Tools (DIALECTICA) chapter | All 12 recipes as LangGraph subgraphs |
| P9.10 | Boardroom chapter | Briefing composition, citation footnotes, export |
| P9.11 | Orchestrator hardening | Budget enforcement, audit log surface, dismissal learning, pause control, MCP server full surface |

Three milestones map to product moments:

- **End of P9.3** — analyst can run a full case from frame to draft. Demo bar for first prospect calls.
- **End of P9.7** — substrate UI complete. Demo bar for the Syria case visual story.
- **End of P9.11** — the orchestrator is real and the MCP server is exposed. Bar for "AI-native" marketing.

---

## 6. Onboarding spine

The five-step hero remains the funnel. The mapping to the new model:

| Step | Hero question | Surface |
|------|---------------|---------|
| 1 | What is happening, why does it matter, what would change the line? | **Context Tab** (overlay opens automatically on first case) |
| 2 | Which sources support the case file, where is evidence still thin? | **Library Tab** (overlay opens after Step 1) |
| — | divider — Context health · Sources · Ontology · Graph density · Memory coverage | header strip |
| 3 | How do actors, events, claims, constraints, and commitments connect? | **Graph Tab** (Cognee has populated the graph by now via cognify) |
| 4 | Which graph-grounded recipes turn evidence into policy judgment? | **Tools Chapter** (added to desk on Step 3 completion) |
| 5 | What can the analyst brief, save, edit, and defend with provenance? | **Boardroom Chapter** (added to desk on Step 4 completion) |

The progression is now visible to the analyst: Tab → Tab → Tab → Chapter → Chapter. Steps 1–3 build substrate. Steps 4–5 produce work. That mirrors the dual model.

The **Research Chapter** is added to the desk on completion of Step 2 (the analyst has sources, so Research is unlocked). Memos and Draft chapters appear on the desk after Step 4. This staging gives a clean narrative: substrate fills → tools appear → deliverables produced.

---

## 7. What this looks like for the Syria demo

The Syria 2026 demo workspace is the litmus test. When a user clicks "Try the Syria demo," the system:

1. Clones the demo template under the user's `owner_uid`, with a new `case_id`.
2. Re-emits the Cognee ingestion under the user's tenant — `cognee.add()` against the cached source PDFs in `gs://praxis-demo-corpus/syria-2026/`, then `cognee.cognify(ontology_file_path=praxis_aco.owl, temporal_cognify=True)` populates the user's tenant-scoped Cognee dataset (~30 seconds with cached extraction).
3. The workspace shell mounts with the four Tabs + the chapters specified by the `syria-transition-2026` template (all 7).
4. The Context Tab is pre-populated with the Syria situation frame.
5. The Library Tab shows 12 sources, each with `embeddings_count > 0` and Cognee ingestion complete.
6. The Ontology Tab shows ~140 candidates extracted (a mix of `ontology_valid=True` and `False`), with ~30 already promoted; the analyst can promote/reject more.
7. The Graph Tab renders ~60 nodes / ~110 edges via Cognee's visualize API anchored to the canonical `graph_nodes` data.
8. The Research chapter shows three threads — two open, one closed (which means `memify` already ran and `memory_coverage` = 20).
9. The Memos chapter shows two saved memos (one StakeholderMap, one ContradictionScan).
10. The Boardroom chapter shows one briefing, exported as PDF.
11. The Draft chapter shows one open draft with four inline citations.
12. The orchestrator immediately surfaces three suggested next-actions in the Desk feed: "Run RedTeamCounterclaim on the closed thread," "Promote 12 pending Actor candidates," "Add a fourth research thread on AANES territorial dynamics."

The user lands in a workspace that already feels lived-in. They can immediately edit, run, dismiss, or extend. The substrate is all there. The orchestrator is already proposing.

This is what *make all really work* looks like at the demo bar.

---

## 8. Phased deployment plan

| Phase | Goal | Feature flag | Exit criterion |
|-------|------|--------------|----------------|
| P9.0 | Foundation | `workspace.tabs_chapters_v2` | Tab strip + chapter desk render; orchestrator service deploys; MCP stub responds |
| P9.1 | Research chapter + Cognee.search wiring | `chapter.research`, `orchestrator.research` | Open thread, recall returns hits, close fires `cognee.memify`, orchestrator suggests next question |
| P9.2 | Memos chapter | `chapter.memos` | Save-from-DIALECTICA → memo created; memo edit → re-run; pin/unpin |
| P9.3 | Draft chapter | `chapter.draft` | Selection → cognee.search(CHUNKS) → inline citation; export to .docx via skill |
| P9.4 | Context Tab full | `tab.context` | Tab overlay; situation frame edit; Cognee remember on save; orchestrator suggests questions |
| P9.5 | Library Tab + Cognee.cognify pipeline | `tab.library`, `cognee.aco_ontology` | Source upload, cognify with ACO OWL ontology, candidates appear in Ontology |
| P9.6 | Ontology Tab + dedup subgraph | `tab.ontology` | Candidates queue, promote/reject, auto-grouping suggestion via cognee.INSIGHTS |
| P9.7 | Graph Tab + Cognee visualize | `tab.graph` | Force-directed view, click-node provenance via cognee.search(CHUNKS), subgraph filter by ACO primitive |
| P9.8 | ACH chapter | `chapter.ach` | Hypotheses CRUD; suggest-evidence via cognee.GRAPH_COMPLETION; red_team_analyst counter-hypothesis |
| P9.9 | Tools (DIALECTICA) — 12 recipes as LangGraph subgraphs | `chapter.tools` | All 12 recipes registered, run dialog, save-as-memo |
| P9.10 | Boardroom chapter | `chapter.boardroom` | Briefing composition, citation footnotes, export to .pdf/.docx/.pptx |
| P9.11 | Orchestrator hardening + MCP server full surface | `orchestrator.full`, `mcp.public` | Budget enforcement, audit log surface, dismissal learning, pause control, MCP tools complete |

Each phase is one PR, one feature flag, one deploy. Rollback is one flag. P9.0–P9.3 deliver a usable product (frame → research → memo → draft); the rest is enrichment.

---

## 9. Acceptance criteria

The rethink is "done" on a fresh deploy when all of the following are true:

1. **Workspace shell** renders a Tab strip with **exactly four** tabs (Context, Library, Ontology, Graph). No tab in the marketplace.
2. **Chapter picker** shows seven chapters; six are togglable; Desk is always-on.
3. **Tab opens are overlay**, not navigation; closing returns to the same Chapter desk state.
4. **Workspace Orchestrator** is deployed and visible in the workspace header (`idle | working | paused`).
5. **Cognee owns substrate-building**: every source uploaded triggers `cognee.add` + `cognee.cognify` with `ontology_file_path=praxis_aco.owl` and `temporal_cognify=True`. Verified by inspecting the Cognee dataset for any case.
6. **Search modes are routed correctly**: a request from the Research chapter uses `GRAPH_COMPLETION`; a request from Draft uses `CHUNKS`; a request from Tools/ContradictionScan uses `INSIGHTS`. Verified by reading `workspace_orchestrator_log`.
7. **save_interaction=True** is set on every search call. Verified by inspecting Cognee's interaction log for any case.
8. **MCP server** responds to `praxis.list_cases`, `praxis.recall`, `praxis.get_graph_subgraph`. Tested against a real Claude Code session.
9. **The Syria demo, cloned to a new tenant**, populates all four Tabs with content, seeds Research/Memos/Draft chapters with active state, and the orchestrator emits three suggestions in the Desk feed within 10 seconds of clone completion.
10. **Token budget** is enforced: a synthetic test case exceeding 50k orchestrator tokens in 24h pauses the orchestrator until reset. The analyst's own actions are not affected.
11. **Pausing the orchestrator** from settings stops all auto-suggestions within 30s; resuming brings them back; nothing is lost.
12. **CI audit scripts pass**: `audit-cognee-isolation`, `audit-tab-chapter-imports`, `audit-orchestrator-writes`, `audit-embedding-dim`, plus the existing firewall trigger test (a malicious test that tries to insert a `confidence=0.9` Cognee-provenance node still fails at the database level).

These are the bars. `TABS_BUILD_GUIDE.md` and `CHAPTERS_BUILD_GUIDE.md` translate them into per-surface direction Codex can execute.

---

## 10. The summary that fits on one slide

```
                    PRAXIS Workspace v2
                         │
          ┌──────────────┴──────────────┐
        TABS                         CHAPTERS
   (substrate, always)         (tools, composable)
          │                              │
   Context                              Desk      (always-on)
   Library    ──> Cognee.add+cognify    Research  (PRIMACY)
   Ontology   ──> review ACO candidates Memos
   Graph      ──> Cognee visualize      Draft
                                        ACH
                                        Tools (DIALECTICA, 12 recipes)
                                        Boardroom

                  Workspace Orchestrator
                  (LangGraph + Vertex Gemini)
                          │
              listens to substrate events
              routes to per-chapter subgraphs
              exposes via SSE + MCP
              never writes to canonical tables
```

Build it that way and the app will shine on its own.

— end of rethink —

# PRAXIS — Chapters Build Guide

**Companion to:** `WORKSPACE_RETHINK.md`, `TABS_BUILD_GUIDE.md`
**Audience:** Codex/Claude Code build agents, with the human reviewing PRs

This guide is the per-Chapter build direction. Chapters are the analyst's tools — composable panes on the desk that consume substrate (from Tabs) and produce work products. **Priority order, per the founder's instruction: Research → Memos → Draft.** Everything else supports those three.

Each chapter is reviewed in the same template:

1. **Objective** — what the chapter is for
2. **What's already in the codebase** — components and services to wrap, not replace
3. **What Cognee does for us** — search modes routed, learning loop wired
4. **What LangGraph does for us** — the agent subgraph(s) backing the chapter
5. **Frontend** — what the chapter pane looks like and how it behaves
6. **Backend** — endpoints, data flow
7. **Codex direction** — high-level instruction with constraints
8. **Acceptance criteria** — what proves the chapter works

A few rules apply to all chapters:

- Chapters live in `src/chapters/<id>/` with manifest, component, api, tests.
- Chapters render as panes on the desk; they do not own routes; the workspace shell composes them.
- Chapters consume `CaseContext` via `useCaseContext()` and the workspace SSE channel via `useOrchestratorEvents(surfaceKey)`.
- Chapters write only to their own work-product tables (Research → `research_threads`; Memos → `memos`; etc.). They never write to substrate tables. CI enforces.
- Every Cognee search call uses `save_interaction=True`. The continuous learning loop is on by default.
- Every agent run is logged to `workspace_orchestrator_log` with prompt, model, cost, outcome.

---

## Chapter 1 — Desk (always-on)

### Objective

The Desk is the home pane. It is what the analyst sees first when they open a case. It compresses the case into four numbers and three suggestions. It is also the surface for the orchestrator's "ask me anything" widget — a `cognee.search(mode=NATURAL_LANGUAGE)` Q&A box that the analyst uses for quick lookups without opening Research.

### What's already in the codebase

`src/components/desk/cost-cap-panel.tsx`, `src/components/desk/what-changed-panel.tsx` (existing — these are likely the cost cap and recent-changes UI). `src/components/dashboard/` (existing — the legacy dashboard route). `src/components/assistant/chat-interface.tsx`, `suggested-prompts.tsx` (reused for the Q&A widget).

The Desk chapter wraps these; it does not delete them.

### What Cognee does for us

Two search modes:

- **`NATURAL_LANGUAGE`** for the Q&A widget. The analyst types "what does the case say about HTS governance?" and Cognee returns a synthesized answer with cited nodes. This is the path that makes the case feel queryable end-to-end without leaving the desk.
- **`SUMMARIES`** for the daily digest. Once per day (or on demand), the orchestrator runs `cognee.search(mode=SUMMARIES, query="changes since yesterday")` and writes a brief activity summary to `workspace_suggestions`.

`save_interaction=True` on the Q&A so dismissed answers train Cognee not to repeat them.

### What LangGraph does for us

**Subgraph: `desk_synthesis`** (lives in `backend/services/workspace_orchestrator/subgraphs/desk.py`).

Runs on a 30-minute timer per active case (active = the analyst has interacted within 24h):

1. Fetch case context (KPIs, recent activity, pending suggestions).
2. Call `analyst_persona` with a prompt to generate the top-3 next actions ("3 candidates pending review in Ontology", "1 thread closed yesterday improved coverage by 15pp", "Draft has 4 untouched citations").
3. Write to `workspace_suggestions` with `target_chapter='desk'`.

Cost target: < 500 tokens per run. The 30-minute cadence keeps daily cost under 25k tokens per case.

### Frontend

The Desk pane is the always-first chapter on the desk. Layout:

**Top — KPI strip.** Four numbers: `Sources`, `Open research threads`, `Memos`, `Health %`. Each is a small card with the number and a sparkline showing trend over last 7 days.

**Middle — Q&A widget.** A single text input, "Ask anything about this case." On submit, calls `cognee.search(mode=NATURAL_LANGUAGE)` and renders the answer with citation chips (using the existing `src/components/assistant/citation-chip.tsx`). Recent questions persist in a dropdown.

**Bottom — Suggestions feed.** The orchestrator's top-3 next actions, each as a card with a "Do it" button that deep-links to the relevant chapter or tab.

**Left rail (collapsible) — Recent activity.** Wraps the existing `what-changed-panel.tsx`. Lists the last 10 case events with timestamps.

### Backend

- `GET /v1/chapters/desk/summary?case_id=...` — KPIs, recent activity, top suggestions.
- `POST /v1/chapters/desk/ask` — Q&A endpoint. Streams via SSE. Calls `cognee.search(mode=NATURAL_LANGUAGE, save_interaction=True)`.
- `POST /v1/chapters/desk/dismiss-suggestion/{id}` — analyst dismisses; orchestrator learns.

### Codex direction

> Build the Desk chapter. KPI strip, Q&A widget, suggestions feed, recent-activity rail.
>
> Q&A wires `cognee.search(mode=NATURAL_LANGUAGE, save_interaction=True)` via the `cognee_memory.py` wrapper. Reuse `chat-interface.tsx`, `citation-chip.tsx`, `suggested-prompts.tsx` from `src/components/assistant/`.
>
> Suggestions feed reads `workspace_suggestions` filtered to `target_chapter='desk'`. The `desk_synthesis` orchestrator subgraph runs on a 30-minute timer.
>
> Wrap `cost-cap-panel.tsx` and `what-changed-panel.tsx` from existing `src/components/desk/` — do not delete the legacy routes; redirect them in P9.0.

### Acceptance criteria

- KPIs reflect the latest CaseContext within 30 seconds of any substrate change.
- Q&A widget returns an answer in < 4 seconds for typical questions on a populated case.
- Suggestions feed shows up to 3 cards, each with a working deep-link.
- Dismissed suggestions don't re-appear identically — Cognee's learning loop is verified.

---

## Chapter 2 — Research (PRIMACY)

### Objective

Research is the chapter that creates memory coverage. The founder named it primacy: once context is built, every other chapter performs better, and Research is the chapter that operationalizes the corpus from "uploaded files" to "actually understood." It is the only chapter that calls `cognee.memify()`. It is the only chapter that maintains a multi-turn Cognee session per thread. The health metric `memory_coverage` is computed on closed Research threads.

### What's already in the codebase

`backend/agents/deep_research/` (existing — a deep research agent, almost certainly the right backbone). `backend/agents/langgraph/` (existing LangGraph setup). `src/components/assistant/chat-interface.tsx`, `tool-invocation.tsx` (assistant components for the recall UI).

The deep research agent is wrapped as a LangGraph subgraph and called from this chapter. The chapter UI is new but heavily reuses assistant components.

### What Cognee does for us

Three things, all critical:

**1. `cognee.search(mode=GRAPH_COMPLETION, save_interaction=True, session_id=thread.cognee_session_id)`** for every recall turn within a thread. `GRAPH_COMPLETION` is graph-aware Q&A — it doesn't just retrieve passages, it traverses the graph, including ontology relationships, to compose an answer. The `session_id` makes the recall multi-turn — Cognee remembers the conversation, so the analyst can ask "and what about the constraints?" without restating the topic.

**2. `cognee.memify(dataset=case_dataset)`** on thread close. This refines the case's graph: prunes stale nodes, strengthens frequently-traversed edges, derives new edges where the resolution implies them. The graph that exists after a closed research thread is materially better than the graph before.

**3. `save_interaction(positive=True, signal=resolution)`** when the thread closes with a high-confidence resolution. This is the explicit feedback Cognee uses for its auto-optimization. Closing a thread with confidence 0.9 and a resolution like "AANES did not formally agree to disarmament in Q1" is a strong positive signal that future searches on AANES disarmament should weight this conclusion.

The combination of `memify` + `save_interaction` is what makes the founder's "primacy of research" architecturally real: every closed thread permanently makes the case smarter.

### What LangGraph does for us

**Subgraph: `research_thread_run`** (lives in `backend/services/workspace_orchestrator/subgraphs/research.py`).

This is the heaviest subgraph in the system. It wraps the existing `deep_research` agent. State is checkpointed via LangGraph's persistence (one checkpoint per thread, indexed by thread_id) so the analyst can leave and return.

State machine:

1. **plan** — given the question and the situation frame, plan a multi-step search strategy. `gemini-3.1-pro-preview`.
2. **search_loop** (cyclical): for each planned step, call `cognee.search(mode=GRAPH_COMPLETION)` and optionally `web_search` (existing tool). Aggregate into a working memory.
3. **synthesize** — compose an answer with citations to specific graph nodes and source passages. `gemini-3.1-pro-preview`.
4. **suggest_followups** — propose 2–3 follow-up questions the analyst should consider next. `gemini-3-flash`.
5. **end** — return the result; persist the recall turn to `research_threads.recall_history`.

The `search_loop` is where most cost lands. Cap at 5 iterations per recall turn. Any iteration that returns < 3 hits exits the loop early.

**Subgraph: `on_thread_closed`** (separate, fires on the close event):

1. Call `cognee.memify(dataset=case_dataset)`.
2. Call `cognee.search(save_interaction=True, positive=True, signal=resolution)` with the resolution text.
3. Recompute health metrics.
4. Push updated `memory_coverage` to the workspace SSE.

### Frontend

The Research pane is the most interactive chapter. Layout:

**Top — Threads list.** Vertical scroll of all threads in this case. Active threads at top. Each row: question (truncated), status (`open` / `iterating` / `closed`), source count, recall count, last-updated. Click a thread to make it active.

**Middle — Active thread workspace.** Three sub-areas:

- **Question header.** The thread question, editable inline. A status badge.
- **Recall transcript.** Chronological list of recall turns. Each turn shows the analyst's query, then the agent's answer with citations (chips), then the agent's suggested follow-ups (clickable to chain into the next turn). Reuses `chat-interface.tsx`.
- **Recall input.** A text box with "Ask the case" placeholder. Submit kicks off `research_thread_run` subgraph; the answer streams back via SSE.

**Bottom — Close-thread panel.** Becomes prominent when the analyst has done at least 2 recall turns. Two fields: **Resolution** (markdown, "what did I conclude?") and **Confidence** (slider 0–1, "how strongly?"). One button: **Close thread → improve memory.** This fires `on_thread_closed`. The button label is the founder's exact framing.

**Right rail — Suggested questions.** Driven by the orchestrator's `on_situation_frame_saved` and `on_thread_closed` outputs (closed threads suggest follow-ups for new threads). Each suggested question has "Open as thread" — click and a new thread is created with the question as the title.

### Backend

- `GET /v1/chapters/research/threads?case_id=...` — list threads with status.
- `POST /v1/chapters/research/threads` — create a thread with a question, returns thread ID with `cognee_session_id` initialized.
- `POST /v1/chapters/research/threads/{id}/recall` — submit a recall query. Streams response via SSE. Persists turn to `recall_history`.
- `POST /v1/chapters/research/threads/{id}/close` — close with resolution + confidence. Triggers `on_thread_closed`. Returns updated `health.memory_coverage`.
- `POST /v1/chapters/research/threads/{id}/reopen` — reopen a closed thread (rare; useful when new sources arrive).

The recall endpoint must:
- Pass `session_id=thread.cognee_session_id` to Cognee for multi-turn continuity.
- Wrap the agent run in a token budget check; return 429 if budget exceeded with a clear message.
- Stream tokens back to the frontend via SSE for responsive UX.

### Codex direction

> Build the Research chapter. This is the highest-priority chapter. Take extra care.
>
> Wrap the existing `backend/agents/deep_research/` agent as a LangGraph subgraph at `backend/services/workspace_orchestrator/subgraphs/research.py`. Use LangGraph's checkpointing — one checkpoint per thread, indexed by `thread_id`, so the analyst can leave a half-finished recall and return.
>
> Recall calls `cognee.search(mode=GRAPH_COMPLETION, save_interaction=True, session_id=thread.cognee_session_id)`. Multi-turn continuity is non-negotiable — without it the chapter is just RAG.
>
> Close-thread calls `cognee.memify(dataset=tenant_dataset)` and `save_interaction(positive=True, signal=resolution)`. Both are required. If either fails, return 503 retryable; do not mark the thread closed.
>
> Frontend uses `chat-interface.tsx`, `citation-chip.tsx`, `tool-invocation.tsx` from `src/components/assistant/`. Stream responses via SSE.
>
> The close button label is exactly: "Close thread → improve memory." This is the founder's framing.
>
> Verify: closing a thread on the Syria demo case bumps `health.memory_coverage` by exactly 20 percentage points (1/5 of the target).

### Acceptance criteria

- Multi-turn recall: ask "What does the case say about HTS?" then "And the constraints on its governance?" — the second answer is contextual to the first (Cognee session preserves state).
- Close a thread; within 30 seconds `health.memory_coverage` updates and the next recall on a related topic returns higher-quality results (verifiable with a fixture query).
- A thread can be left half-completed and reopened later with state intact.
- The agent run respects the per-case token budget; exceeding it produces a clean 429 with a helpful message.
- Cross-tenant test: tenant A's thread cannot recall content from tenant B's case (CI runs `backend/tests/test_chapter_research_isolation.py` on every PR).

---

## Chapter 3 — Memos

### Objective

Memos are the durable form of analytical work. When the analyst finishes a DIALECTICA recipe, scores an ACH matrix, or has a sharp thought during research, they save it as a memo. Memos are editable, re-runnable (when sourced from a recipe), and they feed Boardroom briefings and Draft citations. Every memo is itself remembered by Cognee, so future searches surface prior memo work.

### What's already in the codebase

`src/components/memo/MemoStudio.tsx` (existing — a memo editor). `src/components/editor/tiptap-editor.tsx`, `work-product-editor.tsx` (existing rich-text editors). `backend/services/agent_memory.py` (existing — likely an agent-side memory adapter we can repurpose).

`MemoStudio.tsx` is the editing canvas; the chapter wraps it with chapter-level state.

### What Cognee does for us

Two integrations:

**1. Memo as memory** — every saved memo is also stored in Cognee via `cognee.remember(memo_text, source_kind="memo", node_set=[f"case_{case_id}"])`. This means future research recall can cite prior memos. After a few weeks of work on a case, the memos themselves become a research asset.

**2. Memo as graph node** — memos become first-class nodes in the case graph, connected to the DIALECTICA runs / ACH matrices / research threads they were sourced from. The Graph Tab can show the analyst's own analytical work as graph structure, not just the case's raw entities.

### What LangGraph does for us

**Subgraph: `on_dialectica_completed`** writes a "save as memo" suggestion to `workspace_suggestions` with auto-generated title and abstract. The analyst clicks once and the memo is created with the run as its source.

**Subgraph: `memo_assist`** (lives in `backend/services/workspace_orchestrator/subgraphs/memo.py`) — invoked from the chapter UI as a chat-side panel:

- "Tighten this paragraph" → `gemini-3-flash` rewrite.
- "What did I say about X in earlier memos?" → `cognee.search(mode=CHUNKS, query=X, source_kind=memo)` returns prior memo passages.
- "Cite this claim" → `cognee.search(mode=CHUNKS, query=claim_text)` returns supporting graph nodes.

### Frontend

The Memos pane has two view modes — list and edit.

**List view:**

- Vertical list of memos. Each row: title, source (recipe name / ACH ID / freeform), last-updated, pinned indicator.
- Filter by source type (recipe, ACH, freeform).
- Search box — full-text plus `cognee.search(mode=CHUNKS, source_kind=memo)`.
- "New memo" button — creates a freeform memo.

**Edit view:**

- Header: title (editable), source link (e.g., "From DIALECTICA: ContradictionScan run on 2026-04-20"), pin/unpin.
- Body: `MemoStudio.tsx` editor (markdown / tiptap). Inline citation chips that link to graph nodes and source passages.
- **Re-run** button (visible only when sourced from a recipe). Re-fires the recipe with the same inputs but the latest graph state. Memo body is updated; previous version archived.
- **Memo assist** side panel (collapsible) — chat with `memo_assist` subgraph for tightening, citing, cross-referencing.

### Backend

- `GET /v1/chapters/memos?case_id=...` — list.
- `POST /v1/chapters/memos` — create a memo (freeform or sourced).
- `PUT /v1/chapters/memos/{id}` — update.
- `POST /v1/chapters/memos/{id}/re-run` — re-fire the source recipe; update body; archive prior version to `memo_versions` table.
- `POST /v1/chapters/memos/{id}/assist` — chat-style endpoint backing the assist panel.

Persistence is `memos` table (already in migration 0015). Add `memo_versions` for re-run history.

### Codex direction

> Build the Memos chapter. List + edit views. Wrap `src/components/memo/MemoStudio.tsx` for the editor.
>
> Every save calls `cognee.remember(memo_text, source_kind="memo", node_set=[f"case_{case_id}"])` so memos become searchable. Failures non-fatal; queue replay.
>
> The "Save as memo" suggestion comes from the `on_dialectica_completed` subgraph and is rendered as a card the analyst confirms in one click.
>
> Re-run for sourced memos: re-fire the recipe via the Tools chapter's run endpoint, replace the body, archive the prior version.
>
> Memo assist panel uses the `memo_assist` subgraph and reuses `chat-interface.tsx` from assistant components.

### Acceptance criteria

- Saving a memo writes a row and a Cognee node within 5 seconds; future research recall on the memo's topic includes the memo as a hit.
- Re-running a sourced memo updates the body and archives the prior version.
- Memo assist's "what did I say about X earlier" returns prior memo passages, not source-document passages.

---

## Chapter 4 — Draft

### Objective

Draft is the analyst's deliverable canvas. It's where prose turns into a memo, a briefing, a paper. The defining feature is **selection-driven citation**: the analyst writes a sentence, selects a phrase, and the chapter pulls back the case's evidence for that phrase via Cognee — graph node, source passage, or prior memo — and inserts it as an inline citation. This is the surface where provenance becomes a paragraph.

### What's already in the codebase

`src/components/editor/tiptap-editor.tsx`, `work-product-editor.tsx` (existing rich-text editors — likely tiptap). `src/components/assistant/citation-chip.tsx` (existing citation chip — perfect for inline citations).

The chapter wraps tiptap. No new editor framework needed.

### What Cognee does for us

**`cognee.search(mode=CHUNKS, save_interaction=True)`** on the selected text. CHUNKS mode returns raw passages with their source attribution — exactly what a citation needs. The analyst sees 3–5 candidate citations; picking one inserts the chip with stable references to the source ID and (if applicable) the graph node ID.

Two extensions:

- For richer recall, the chapter can also call `cognee.search(mode=GRAPH_COMPLETION)` for "what's the case's position on X?" — useful when the analyst is writing a stance-claiming sentence and wants the synthesized graph view, not just a raw passage.
- For "pull from memos," call `cognee.search(mode=CHUNKS, source_kind=memo)` to surface prior analytical writing instead of source documents.

### What LangGraph does for us

**Subgraph: `draft_assist`** (lives in `backend/services/workspace_orchestrator/subgraphs/draft.py`):

- On idle (analyst stops typing for 8s), assess whether the last paragraph has citations. If not, surface a soft suggestion: "This paragraph makes claims without citations — find sources?"
- On request, call `cognee.search` with the selection.
- Compose a brief "where does this claim sit in the case graph?" panel using `gemini-3-flash`.

Cost target: < 300 tokens per assist. The chapter can run at high volume during writing — this must be cheap.

### Frontend

The Draft pane is editor-dominant.

**Editor canvas** — tiptap-based `work-product-editor.tsx`, with markdown export, full-screen toggle, word count.

**Selection toolbar** (appears on text selection):

- **Find citation** — calls `cognee.search(mode=CHUNKS)` with the selected text. Modal shows top 5 hits with source attribution and a quote preview. Click a hit → inserts inline citation chip at the cursor (`citation-chip.tsx`).
- **Pull from memos** — same flow but `source_kind=memo`.
- **Show in graph** — opens the Graph Tab filtered to nodes matching the selection.

**Idle assist** (subtle, lower-right corner):

- Small banner when `draft_assist` detects an uncited paragraph. One click → opens "find citation" with the paragraph as query.

**Document outline** (left rail, collapsible):

- Auto-extracted heading structure for navigation.

**Export** (top right):

- "Export as .docx" — uses the `/mnt/skills/public/docx/` skill.
- "Export as .pdf" — uses `/mnt/skills/public/pdf/` skill.
- "Send to Boardroom" — converts the draft into a Boardroom briefing skeleton.

Inline citations render as chips with the source reference. Hovering a chip shows the cited passage and a deep-link.

### Backend

- `GET /v1/chapters/drafts?case_id=...` — list.
- `POST /v1/chapters/drafts` — create.
- `PUT /v1/chapters/drafts/{id}` — update body.
- `POST /v1/chapters/drafts/{id}/cite` — body: `{query: text}`. Calls Cognee. Returns top-k hits.
- `POST /v1/chapters/drafts/{id}/export?format=docx|pdf` — triggers skill-based export. Returns a download URL.

The cite endpoint must:
- Pass `save_interaction=True` so dismissed hits don't recur.
- Return source IDs and graph node IDs the frontend can store in `inline_citations[]`.
- Stay under 1.5 seconds for typical queries — this is in the writing flow.

### Codex direction

> Build the Draft chapter. Wrap `src/components/editor/work-product-editor.tsx` (tiptap-based).
>
> Selection toolbar: "Find citation," "Pull from memos," "Show in graph." Citation insertion uses `cognee.search(mode=CHUNKS, save_interaction=True)` and renders as `src/components/assistant/citation-chip.tsx`.
>
> The `draft_assist` subgraph runs on 8-second idle and proposes citations for uncited paragraphs. Use `gemini-3-flash` only — this fires often.
>
> Export uses the `/mnt/skills/public/docx/` and `/mnt/skills/public/pdf/` skills.
>
> "Send to Boardroom" converts the draft into a Boardroom briefing skeleton — sections derived from headings, body paragraphs become section bodies, citations carry over.
>
> Persisted citation references must be stable: `{source_id, graph_node_id, cognee_chunk_id}`. The frontend must be able to re-render the citation even if the underlying chunk has been re-indexed.

### Acceptance criteria

- Selection → "Find citation" → 5 hits returned in < 1.5s — the writer's flow is preserved.
- Inserted citation chip shows the cited passage on hover; click deep-links to source.
- Export to .docx produces a file with footnoted citations referencing source IDs.
- Idle assist surfaces uncited paragraphs without being intrusive (debounced, dismissible).

---

## Chapter 5 — ACH

### Objective

Heuer's Analysis of Competing Hypotheses, scored against the case graph. The analyst lists hypotheses, scores each piece of graph evidence on a -2 to +2 diagnosticity scale, and the chapter computes which hypothesis survives the evidence. The differentiator vs. paper-and-spreadsheet ACH: evidence is graph-grounded (not free-form), and Cognee surfaces missed evidence the analyst didn't think to score.

### What's already in the codebase

`src/components/sats/ACHMatrix.tsx`, `ACHWorkbench.tsx` (existing — the structured analytic technique components, including the ACH matrix). The hypothesis + cell tables are in migration 0015.

Wrap the workbench. The chapter is a thin layer on top.

### What Cognee does for us

**`cognee.search(mode=GRAPH_COMPLETION, query=hypothesis_text)`** for the "suggest evidence" affordance. Given a hypothesis like "The transition will fail by Q4 2026," Cognee returns graph nodes that support or contradict — the analyst reviews and adds them to the matrix.

`mode=INSIGHTS` is also useful here — for a given hypothesis, "find unexpected supporting / contradicting nodes" surfaces evidence the analyst would otherwise miss.

### What LangGraph does for us

**Subgraph: `ach_suggest_hypotheses`** — wraps the existing `red_team_analyst` agent. Given the situation frame and the graph, propose 3–4 competing hypotheses. The analyst picks which to add to the matrix. `gemini-3.1-pro-preview`.

**Subgraph: `ach_suggest_evidence`** — given a hypothesis, run `cognee.search(mode=GRAPH_COMPLETION)` and `mode=INSIGHTS`, dedupe, return top 8 candidates with proposed diagnosticity. `gemini-3-flash` for diagnosticity assessment.

### Frontend

ACH pane is matrix-dominant.

**Top — Question.** "What is the analytical question?" Editable.

**Middle — Matrix.** Hypotheses as columns, evidence rows. Each cell is a -2..+2 diagnosticity widget plus a note field. Reuse `ACHMatrix.tsx`. Row labels are graph node names (clickable to Graph Tab).

**Right rail — Add hypothesis / Add evidence.**

- "Suggest hypotheses" → calls `ach_suggest_hypotheses`, returns 3–4 cards, click to add.
- "Suggest evidence for [hypothesis]" → calls `ach_suggest_evidence`, returns 8 cards, click to add row + cell pre-scored.
- Manual add — text input that searches graph nodes (existing `source-picker.tsx` pattern).

**Bottom — Score panel.** Shows per-hypothesis consistency score (sum of cell diagnosticities), highlights the surviving hypothesis. "Save as memo" → creates a memo summarizing the matrix.

### Backend

- `GET /v1/chapters/ach?case_id=...` — current state.
- `POST /v1/chapters/ach/hypotheses` — add hypothesis.
- `PUT /v1/chapters/ach/cell` — score a cell.
- `POST /v1/chapters/ach/suggest-hypotheses` — invoke `ach_suggest_hypotheses`.
- `POST /v1/chapters/ach/suggest-evidence` — body: `{hypothesis_id}`. Invokes `ach_suggest_evidence`.
- `POST /v1/chapters/ach/score` — recompute consistency scores.

### Codex direction

> Build the ACH chapter. Wrap `src/components/sats/ACHWorkbench.tsx`.
>
> Add two suggest endpoints backed by orchestrator subgraphs: `ach_suggest_hypotheses` wraps the existing `red_team_analyst`; `ach_suggest_evidence` runs `cognee.search(mode=GRAPH_COMPLETION)` and `mode=INSIGHTS` then proposes cells.
>
> Consistency score formula: simple sum of diagnosticity per hypothesis column. Highlight hypothesis with highest score. "Save as memo" creates a memo with the matrix as a markdown table.

### Acceptance criteria

- Suggest-hypotheses returns 3+ plausible competing hypotheses for the Syria case.
- Suggest-evidence for a hypothesis returns at least 5 graph nodes with proposed diagnosticity; analyst can accept or override.
- Save-as-memo produces a memo with the matrix and the surviving hypothesis.

---

## Chapter 6 — Tools (DIALECTICA)

### Objective

Twelve named graph-grounded reasoning recipes that turn evidence into policy judgment. Each recipe is a LangGraph subgraph that takes the case graph (or a subset) plus the situation frame as input, runs a structured reasoning pattern, and produces a judgment + rationale + provenance. Recipes are: StakeholderMap, ContradictionScan, ConstraintLeverageMap, CommitmentTracker, NarrativeArc, AmbiguityAudit, RedTeamCounterclaim, CounterfactualBranch, EvidenceGapFinder, PolicyOptionGenerator, RiskWeighting, DecisionMemoSynth.

### What's already in the codebase

The agents under `backend/agents/` (especially `red_team_analyst`, `analyst_persona`, `moderator`) are the building blocks. Each recipe likely composes 1–2 agents. The DIALECTICA philosophy and recipe naming come from the founder's existing architecture work.

### What Cognee does for us

Different recipes use different search modes:

| Recipe                  | Cognee mode             |
|-------------------------|------------------------|
| StakeholderMap          | GRAPH_COMPLETION + INSIGHTS |
| ContradictionScan       | INSIGHTS                |
| ConstraintLeverageMap   | GRAPH_COMPLETION        |
| CommitmentTracker       | GRAPH_COMPLETION + temporal filter |
| NarrativeArc            | INSIGHTS + temporal     |
| AmbiguityAudit          | CHUNKS                  |
| RedTeamCounterclaim     | INSIGHTS + GRAPH_COMPLETION |
| CounterfactualBranch    | GRAPH_COMPLETION (with hypothetical override) |
| EvidenceGapFinder       | INSIGHTS                |
| PolicyOptionGenerator   | SUMMARIES + GRAPH_COMPLETION |
| RiskWeighting           | GRAPH_COMPLETION        |
| DecisionMemoSynth       | SUMMARIES               |

Every recipe call uses `save_interaction=True` and `node_set=[f"case_{case_id}"]` to scope.

### What LangGraph does for us

Each recipe is a LangGraph subgraph at `backend/services/workspace_orchestrator/subgraphs/recipes/<recipe_id>.py`. They share a `BaseRecipe` Protocol with `run(input) → output` and standard nodes for `gather`, `reason`, `format`. Heavy recipes (ContradictionScan, RedTeamCounterclaim, NarrativeArc, CounterfactualBranch, PolicyOptionGenerator, DecisionMemoSynth) use `gemini-3.1-pro-preview`. Light recipes use `gemini-3-flash`.

The `moderator` agent orchestrates multi-step recipes — it sequences agent calls within a recipe (e.g., RedTeamCounterclaim runs `red_team_analyst` then `analyst_persona` for synthesis).

### Frontend

Tools pane has three view modes — gallery, run, history.

**Gallery view** (default):

- 12 recipe cards in a grid. Each card: name, one-line description, minimum graph requirements ("requires ≥ 10 nodes"), recent-runs count.
- Each card lights up green if the case meets the minimum requirements.
- Click a card → "run dialog."

**Run dialog:**

- Recipe name, description.
- Input form: graph node selector (default: "all relevant"), recipe-specific params (e.g., for CounterfactualBranch, "what if Constraint X were lifted?").
- Estimated cost (token estimate).
- "Run" button.

**History view:**

- Vertical list of past runs across all recipes.
- Each row: recipe, timestamp, judgment summary, cost, "view," "save as memo," "re-run."
- "View" opens the full output in a modal — judgment, rationale (markdown), provenance (graph nodes used, with click-through).

### Backend

- `GET /v1/chapters/tools/recipes` — list registered recipes with status (enabled, requires_min_nodes met).
- `POST /v1/chapters/tools/run` — body: `{recipe_id, inputs}`. Streams progress via SSE. Persists to `dialectica_runs`.
- `GET /v1/chapters/tools/runs/{id}` — fetch a run with full output.
- `POST /v1/chapters/tools/runs/{id}/save-as-memo` — convert to a memo.

The run endpoint must enforce per-recipe token caps and the case-level orchestrator budget.

### Codex direction

> Build the Tools chapter and 12 DIALECTICA recipes.
>
> Each recipe is a separate LangGraph subgraph at `backend/services/workspace_orchestrator/subgraphs/recipes/<recipe_id>.py`. Implement the `BaseRecipe` Protocol with `run()`. Reuse `red_team_analyst`, `analyst_persona`, `moderator` agents where applicable.
>
> Cognee mode routing per the table in this doc. Every call uses `save_interaction=True` and `node_set` scoping.
>
> Frontend: gallery + run dialog + history. Reuse `tool-invocation.tsx` from assistant components for the streaming progress UI.
>
> Save-as-memo creates a `memos` row with `source_dialectica_run_ids=[run_id]`. Re-run from a memo re-fires the recipe; the memo auto-updates and version-archives.
>
> The recipe registry is auto-discovered by file glob — adding a 13th recipe is one new file in the subgraphs directory.

### Acceptance criteria

- All 12 recipes registered: `GET /tools/recipes` returns 12 entries.
- Run StakeholderMap on the Syria demo (60 nodes); completes in < 30s with judgment + rationale + 5+ provenance node references.
- Save-as-memo round-trip: run recipe → save → edit memo → re-run → memo updates with version archived.
- Token budget enforced; over-budget returns 429 with "pause until reset" message.

---

## Chapter 7 — Boardroom

### Objective

Boardroom is the briefing surface — where memos and DIALECTICA runs become a defensible deliverable for principals. Briefings have a structure (title, audience, sections), each section has citation footnotes back to graph nodes and source passages, and export goes to .pdf, .docx, or .pptx. The differentiator: every footnote is live-linked to the case graph; a reviewer can click a footnote in the exported PDF and (if they have access to the case) jump directly to the cited node.

### What's already in the codebase

`src/components/briefing/brief-blocks-panel.tsx` (existing — likely the section block UI). The skills at `/mnt/skills/public/{pdf,docx,pptx}/` for export.

Wrap the brief-blocks panel.

### What Cognee does for us

**`cognee.search(mode=SUMMARIES, query=section_topic, audience=audience_type)`** — given a section topic and an audience (principal, team, external), return a synthesized summary with citations. The audience parameter tunes verbosity.

**`cognee.search(mode=CHUNKS, query=footnote_target)`** — for each citation footnote, fetch the exact source passage to display in the export.

### What LangGraph does for us

**Subgraph: `boardroom_compose`** — wraps `analyst_persona`. Given a set of memos, propose a briefing structure (title, audience, 4–6 sections with stub bodies). The analyst edits.

**Subgraph: `boardroom_section_synth`** — given a section topic and the case context, write the section body with citations. Called on demand from the section block UI.

### Frontend

Boardroom pane has three view modes — list, compose, export.

**List view:**

- Vertical list of briefings with title, audience, section count, last-updated, exported flag.
- "New briefing" button.

**Compose view:**

- Title and audience selector (principal / team / external).
- Section blocks — each block is a heading + body + citations panel. Reuse `brief-blocks-panel.tsx`.
- "Add section" — manual or via `boardroom_compose` suggestion.
- Per-section "Write with AI" button → fires `boardroom_section_synth`.
- Live citation footnote rendering — citations render as numbered superscripts in the body, full citation list at the bottom.
- "Pull from memo" — converts a memo into a section.

**Export view:**

- Format selector (.pdf, .docx, .pptx).
- Audience-specific formatting toggle.
- Preview pane.
- "Download" button.

### Backend

- `GET /v1/chapters/boardroom?case_id=...` — list briefings.
- `POST /v1/chapters/boardroom/briefings` — create.
- `PUT /v1/chapters/boardroom/briefings/{id}` — update.
- `POST /v1/chapters/boardroom/briefings/{id}/sections/{idx}/synth` — invoke `boardroom_section_synth`.
- `POST /v1/chapters/boardroom/briefings/{id}/export` — body: `{format}`. Returns a download URL.

Export must:
- Resolve every citation to a source URL or graph node ID.
- Embed the citation list as numbered footnotes (PDF, DOCX) or speaker notes (PPTX).
- Use the appropriate skill at `/mnt/skills/public/`.

### Codex direction

> Build the Boardroom chapter. Wrap `src/components/briefing/brief-blocks-panel.tsx`.
>
> Briefing composition: structure proposal via `boardroom_compose` subgraph (wraps `analyst_persona`); section synthesis via `boardroom_section_synth` (uses Cognee SUMMARIES mode).
>
> Export uses the appropriate skill from `/mnt/skills/public/`. Citations render as numbered footnotes (PDF/DOCX) or speaker notes (PPTX).
>
> "Pull from memo" copies a memo into a section, preserving citation references.

### Acceptance criteria

- Compose-flow: open compose view → AI proposes structure → analyst edits → AI synthesizes one section → export to PDF in < 30s.
- All citations in the exported PDF are numbered footnotes; clicking deep-links work when viewed inside PRAXIS.
- The Syria demo briefing exports as a 5-page PDF with 12+ citations.

---

## Cross-chapter concerns

### Workspace marketplace

The Chapter picker (in workspace settings) shows the seven chapters with toggles. Hiding a chapter does not delete its data — re-enabling brings everything back. The toggle state is persisted to `workspaces.enabled_chapters`.

### Cross-chapter dependencies

Chapters depend on each other only through `CaseContext`. They do not import each other's components or services. The picker warns the analyst when they hide a chapter that another chapter "expects" — e.g., hiding Memos warns "Boardroom uses memos as section sources; hide anyway?"

### Chapter-level token budgets

In addition to the case-level orchestrator budget, each chapter has a per-action cost cap. Research recall is capped at 4k tokens per turn. DIALECTICA recipes are capped at 8k tokens per run. Memo assist is capped at 1k. These caps are enforced in the LangGraph subgraphs and surfaced to the analyst as "estimated cost: 1.2k tokens" before the run.

### CI for chapter discipline

Three audit scripts on every PR:

- `audit-cognee-isolation.ts` (existing) — only the wrapper imports cognee.
- `audit-tab-chapter-imports.ts` (new) — chapters do not import tabs and vice versa.
- `audit-chapter-substrate-writes.ts` (new) — chapters do not write to substrate tables.

Plus, per-chapter:

- `<Chapter>.contract.test.ts` — manifest is well-formed.
- `<Chapter>.gating.test.ts` — gating state machine.
- `backend/tests/test_chapter_<id>_isolation.py` — cross-tenant.

### MCP exposure

Each chapter's read endpoints are exposed via the MCP server:

- `praxis.list_research_threads(case_id)`
- `praxis.list_memos(case_id)`
- `praxis.list_drafts(case_id)`
- `praxis.list_briefings(case_id)`
- `praxis.list_dialectica_runs(case_id)`

This makes the analyst's work products queryable from external clients. Forward-compatible with A2A.

— end of Chapters build guide —

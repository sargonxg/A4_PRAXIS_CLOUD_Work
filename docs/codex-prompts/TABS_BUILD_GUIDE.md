# PRAXIS — Tabs Build Guide

**Companion to:** `WORKSPACE_RETHINK.md`, `CHAPTERS_BUILD_GUIDE.md`
**Audience:** Codex/Claude Code build agents, with the human reviewing PRs

This guide is the per-Tab build direction. Tabs are the substrate layer — the case's world. Four tabs: **Context**, **Library**, **Ontology**, **Graph**. Each tab is reviewed in the same template:

1. **Objective** — what the tab is for, in one paragraph
2. **What's already in the codebase** — the existing components and services to wrap, not replace
3. **What Cognee does for us** — the substrate-building work the tab delegates to Cognee
4. **What LangGraph does for us** — the orchestrator subgraph that fires when this tab's substrate changes
5. **Frontend** — what the tab looks like and how it behaves
6. **Backend** — endpoints, data flow, integration points
7. **Codex direction** — high-level instruction with constraints; no full code, Codex picks the implementation
8. **Acceptance criteria** — what proves the tab works

A few rules apply to all four tabs:

- The Tab strip is rendered by `WorkspaceShell.tsx`. Tabs do not render their own strip.
- Tab content lives in `src/tabs/<id>/` (a new directory, parallel to `src/chapters/`). Same auto-discovery pattern as chapters: each tab folder ships `manifest.ts` + `<Id>Tab.tsx` + `index.ts`.
- A tab is opened as an **overlay**, not a route. The workspace URL does not change. Closing returns to the desk state preserved underneath.
- Each tab has exactly one orchestrator subgraph that fires when its substrate changes. The subgraph writes to `workspace_suggestions` and `workspace_orchestrator_log`, never to substrate tables directly.
- Every Cognee call uses the existing wrapper at `backend/services/cognee_memory.py` (extended to expose `cognify`, `memify`, and the new search-mode router).
- Tenant isolation is non-negotiable: every Cognee call passes the dataset name `{owner_uid}__{case_id}`; every Postgres call wraps in `tenant_session(tenant_id)`.

---

## Tab 1 — Context

### Objective

The Context Tab is the case's first-person narrative anchor. It captures the situation frame — what is happening, why it matters, what would change the line, and the policy question — and makes that frame queryable by every chapter and every search. The frame is not free-form notes; it is structured, four-field, and the case's most important compression. The orchestrator turns each frame save into proposed research questions.

### What's already in the codebase

`src/components/situations/` (existing — likely the legacy situations editor; verify on inspection). `src/components/onboarding/case-creation-wizard.tsx` already has frame-style fields. `backend/services/situation_health.py` already computes a quality score on the frame. The Pydantic models for the frame are already used in case creation.

Wrap and refactor — do not delete the legacy components in this PR. They will be removed in P9.7 cleanup.

### What Cognee does for us

When the analyst saves a situation frame, the backend calls `cognee.remember()` with the frame text **and a custom `Situation` DataPoint type** so that the frame appears in the case's knowledge graph as a first-class node. This means:

- Every subsequent `cognee.search()` against the case automatically uses the situation frame as graph context — searches are situation-aware out of the box.
- The frame node is connected to all subsequent extracted entities, so a search for "what does the case say about HTS" includes "the case is framed around the post-Assad transition" implicitly.
- `cognee.search(mode=NATURAL_LANGUAGE)` against "what is this case about?" returns the frame, near-verbatim, because Cognee resolves to the situation node directly.

Define the `Situation` DataPoint in `backend/services/cognee_aco_models.py`:

```
class Situation(DataPoint):
    what_is_happening: str
    why_it_matters: str
    what_would_change_the_line: str
    policy_question: str
    metadata: dict = {"index_fields": ["what_is_happening", "policy_question"]}
```

### What LangGraph does for us

**Subgraph: `on_situation_frame_saved`** (lives in `backend/services/workspace_orchestrator/subgraphs/situation_frame.py`).

When the orchestrator receives a `situation_frame_upserted` event:

1. Fetch the frame.
2. Run a `gemini-3-flash` step to assess frame quality (are the four fields substantive? are there missing dimensions?). This wraps the existing `analyst_persona` agent.
3. Run a `gemini-3.1-pro-preview` step to generate three candidate research questions, each tied to a specific frame field (e.g., "what would change the line" → "What evidence would falsify the assumption that X?").
4. Write the questions to `workspace_suggestions` with `target_chapter='research'` and a confidence score.
5. Write a quality-coach hint to `workspace_suggestions` with `target_tab='context'` (e.g., "Why-it-matters reads thin — three sentences typical").

The subgraph runs once per save, debounced 5 seconds (so rapid edits don't spam suggestions). Cost target: < 800 tokens per run.

### Frontend

The Context Tab opens as an overlay over the desk. The layout is two columns on desktop, single column on mobile.

**Left column** — the four-field editor. Each field is a `<textarea>` with a character target (e.g., "200–600 chars" for "what is happening"). A live "save" indicator. A small quality score shown by the orchestrator below the editor: a 0–100 number with a click-through to the orchestrator's quality-coach panel.

**Right column** — three components stacked:

1. **Frame quality coach** — a chat-style side panel using the existing `src/components/assistant/chat-interface.tsx`. The orchestrator's quality hints appear here as suggested prompts. The analyst can chat freely about the frame ("help me sharpen the policy question") and the coach uses `gemini-3-flash` to suggest rewrites. Coach edits are not auto-applied — they're proposed via `mutation-confirm-card.tsx`, the analyst approves or dismisses.
2. **Suggested research questions** — three cards from the orchestrator's `on_situation_frame_saved` output. Each card has "Open as research thread" — click and the Research chapter opens with the question pre-filled.
3. **Frame as graph node** — a tiny diagram showing the situation node and its current connections in the Cognee graph. Five connections max — "this frame currently anchors 12 nodes in the graph" with a click-through to the Graph Tab filtered to those nodes.

**Empty state** — when the case has no frame yet, the editor is shown alongside a single CTA: "Take 90 seconds. The four fields below shape every other surface of this app. Skip later if you must, fill now if you can."

### Backend

- `PUT /v1/tabs/context/situation-frame?case_id=...` — upsert the frame, persist to `situation_frames`, call `cognee.remember()` with the `Situation` DataPoint, fire the `situation_frame_upserted` event on the `workspace_events` channel.
- `GET /v1/tabs/context/situation-frame?case_id=...` — read the frame.
- `POST /v1/tabs/context/coach` — chat-style endpoint backing the right-column coach. Streams via SSE. Calls `gemini-3-flash` with the frame as context.

The endpoint must:
- Treat Cognee failures as non-fatal — if `cognee.remember()` fails, the frame is still saved, an entry is added to `cognee_pending_writes` for later replay, and the user sees a small warning ("memory layer offline; frame saved locally").
- Trigger the orchestrator event regardless of Cognee state.

### Codex direction

> Build the Context Tab. The user opens it from the Tab strip and it overlays the desk. Implement the four-field structured frame editor on the left and the three-component right column (chat coach via existing assistant components, suggested research questions, graph-anchor mini view).
>
> The backend endpoint persists to `situation_frames` (RLS via `tenant_session`), then asynchronously calls `cognee.remember()` with a new `Situation` DataPoint defined in `backend/services/cognee_aco_models.py`. Treat Cognee failures as non-fatal; queue a retry row in `cognee_pending_writes`.
>
> Wire the LangGraph subgraph `on_situation_frame_saved`: it reads the frame, calls `gemini-3-flash` for quality scoring, calls `gemini-3.1-pro-preview` for three research-question proposals, writes to `workspace_suggestions`. The frontend right column subscribes to suggestions via the existing SSE channel.
>
> Reuse `src/components/assistant/chat-interface.tsx`, `mutation-confirm-card.tsx`, `suggested-prompts.tsx`. Do not invent a new chat component.

### Acceptance criteria

- Saving a frame writes a row to `situation_frames`, fires the orchestrator event, and within 30 seconds three research-question suggestions appear in the right column.
- The frame is queryable via `cognee.search(mode=NATURAL_LANGUAGE, query="what is this case about?")` and the answer references the frame text.
- The chat coach responds in under 3 seconds for typical prompts.
- With Cognee disabled, the frame still saves and a warning is shown.
- Tab open/close is instant — the overlay does not unmount the chapter desk underneath.

---

## Tab 2 — Library

### Objective

The Library Tab is the case's source of truth in the document sense — every PDF, transcript, article, and primary document the analyst has ingested for this case. It is the entry point of the substrate pipeline: when the analyst drops a file here, Cognee turns it into a knowledge graph node-set tied to this case. The tab shows ingestion progress in real time, surfaces extraction quality, and lets the analyst manage provenance ratings.

### What's already in the codebase

`src/components/sources/source-picker.tsx` (existing — a source-picker dropdown likely used by ACH/Memos to attach sources). `src/components/evidence/` (likely an evidence cards layout). `backend/services/chunker/` (existing chunker, kept). `backend/services/feed_clients/` (existing — for RSS-style ingestion). `backend/services/extract_structured/` and `extract_graphrag/` will be **largely deprecated** and replaced by the Cognee pipeline; keep them in the repo until P9.6 cleanup.

The existing `source-picker.tsx` is reused by Chapters that consume sources. The Library Tab itself is a new component at `src/tabs/library/LibraryTab.tsx`.

### What Cognee does for us

The Library Tab is where Cognee earns its keep. Three calls, in sequence, on each upload:

1. **`cognee.add(file, dataset=tenant_dataset, node_set=[f"case_{case_id}"])`** — ingests the file. Cognee handles 38+ formats (PDF, DOCX, transcripts, audio, even images via OCR). Returns immediately with a job handle; ingestion is async.
2. **`cognee.cognify(ontology_file_path="praxis_aco.owl", temporal_cognify=True, custom_data_points=[Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative])`** — runs the ECL pipeline (Extract, Cognify, Load): chunking, LLM extraction with our ACO Pydantic models, ontology validation against our OWL file, graph construction, vector indexing. Returns a job ID. Status pushed via the orchestrator.
3. **(later, on thread close)** **`cognee.memify()`** — refines the graph after sufficient ingestion. Called by the Research chapter, not the Library, but the Library shows the resulting `embeddings_count`, `nodes_extracted`, `candidates_pending` per source.

The ACO OWL file lives at `backend/data/ontologies/praxis_aco.owl`. It's a hand-curated OWL 2 file that declares the 8 ACO classes plus their sub-classes (`Actor → State, NonState, Individual, Coalition`, `Event → Kinetic, Diplomatic, Economic, Information`, etc.). Fuzzy match cutoff is set to `0.85` via `MATCHING_STRATEGY=fuzzy` in env. When Cognee extracts an entity name like "Hayat Tahrir al-Sham" against an OWL individual `HTS`, the resolver canonicalizes to the OWL URI.

The custom Pydantic DataPoints in `backend/services/cognee_aco_models.py` carry domain fields:

- `Actor` has `actor_type` (state/non-state/individual/coalition), `region`, `affiliations`
- `Claim` has `polarity` (assertion/denial), `confidence_self_reported`, `claimed_by_actor_id`
- `Event` has `start_date`, `end_date`, `location`, `event_type`
- `Constraint` has `constraint_type` (legal/material/political), `binding_strength`
- `Leverage` has `leverage_type`, `applies_to_actor_id`
- `Commitment` has `commitment_text`, `due_date`, `status`
- `Interest` has `interest_type`, `held_by_actor_id`
- `Narrative` has `narrative_text`, `championed_by_actor_id`

These are the schemas Cognee fills with structured output. The result: a richly typed knowledge graph from a single `cognify()` call, with no custom extractor code on our side.

### What LangGraph does for us

**Subgraph: `on_source_ingested`** (lives in `backend/services/workspace_orchestrator/subgraphs/source_ingested.py`).

Triggered when `source_receipts.cognee_document_id` is set (i.e., Cognee has finished ingestion):

1. Pull the per-source extraction stats from Cognee (`nodes_extracted`, `ontology_valid_pct`, `chunks_count`).
2. If `ontology_valid_pct < 0.6`, write a quality warning to `workspace_suggestions` with `target_tab='library'` ("`source_X` had low ontology match; consider re-extraction with stricter prompt or source quality check").
3. If `nodes_extracted == 0`, surface a critical warning ("`source_X` extracted no nodes — likely OCR failure or empty content").
4. If extraction was successful, fire `candidates_accumulated` event for the Ontology Tab subgraph to handle.

This subgraph is fast and cheap — `gemini-3-flash` only, < 200 tokens per run.

### Frontend

Library Tab opens as overlay. Layout is a single column on mobile, a master-detail (list left, detail right) on desktop.

**Source list** (left or top):

- Each row: title, type icon, ingestion status (`uploading`, `cognifying`, `ready`, `error`), provenance badge (`verified`, `self-reported`, `unverified`), embeddings count, nodes extracted, last-updated.
- Status pulse — when Cognee is mid-`cognify`, the row shows a progress bar (Cognee exposes per-job progress; subscribe via SSE).
- Click a row → opens the detail panel.
- Bulk actions: re-extract selected, delete selected.

**Source detail** (right or below):

- Source metadata (URL, upload date, document type).
- Provenance editor — three-state radio (`verified` / `self-reported` / `unverified`) with a free-text "why" field. Provenance contributes to the case `health.source_receipts_pct`.
- Extraction summary — count of extracted nodes per ACO primitive (e.g., "Actors: 4, Claims: 7, Events: 12"); ontology-valid percentage; sample quotes.
- "Re-extract" button — re-runs `cognee.cognify` on this source only. Useful when the analyst notices low quality.
- "View in Ontology" button — deep-links to the Ontology Tab filtered to candidates from this source.

**Upload affordance** — drag-and-drop zone or button. On drop, immediately creates a `source_receipts` row with status `uploading`, fires `cognee.add()`, then `cognee.cognify()` on completion.

**Quality dashboard** (top of tab):

- Total sources, total embeddings, ontology validity average, source receipts %.
- AI-driven gap suggestions from the orchestrator: "Library is dense on opposition voices but light on government communications — consider adding..."

### Backend

- `POST /v1/tabs/library/ingest?case_id=...` (multipart) — accepts a file, uploads to GCS, creates `source_receipts` row, kicks off `cognee.add()` + `cognee.cognify()` asynchronously, returns the source ID.
- `GET /v1/tabs/library?case_id=...` — list sources with status.
- `GET /v1/tabs/library/{source_id}` — detail.
- `PATCH /v1/tabs/library/{source_id}` — update provenance.
- `POST /v1/tabs/library/{source_id}/re-extract` — re-fire `cognee.cognify()` on this source.
- `DELETE /v1/tabs/library/{source_id}` — delete the row, call `cognee.forget()` on the document.

The cognify call must:
- Stream progress events via Cognee's progress hooks → push to the workspace SSE channel under event type `library.ingest_progress`.
- On completion, set `source_receipts.cognee_document_id`, `embeddings_count`, `nodes_extracted` and fire the orchestrator event.

### Codex direction

> Build the Library Tab. List + detail layout, drag-and-drop upload, real-time ingestion progress.
>
> The upload endpoint stores the file in GCS, creates the `source_receipts` row, and fires Cognee's pipeline: `cognee.add()` then `cognee.cognify()` with our ACO ontology (OWL file at `backend/data/ontologies/praxis_aco.owl`) and our ACO Pydantic DataPoints (`backend/services/cognee_aco_models.py`). Pipeline runs async; progress streamed via SSE.
>
> The orchestrator subgraph `on_source_ingested` runs after Cognee completes. It assesses extraction quality and writes warnings/suggestions to `workspace_suggestions`. Use `gemini-3-flash`.
>
> Replace existing `extract_structured/` and `extract_graphrag/` calls in this codepath. Keep those services in the repo for now — do not delete in this PR.
>
> Reuse `src/components/sources/source-picker.tsx` patterns where applicable, but the tab itself is a new component at `src/tabs/library/LibraryTab.tsx`.

### Acceptance criteria

- Drop a PDF; within 60 seconds (cold ingest of a 50-page document), the row shows `ready`, `embeddings_count > 0`, and `nodes_extracted > 0`.
- Cognee dataset for the case contains a node-set `case_<case_id>` with the document and its extracted entities.
- Ontology Tab's candidate queue shows new candidates from the upload within 90 seconds of completion.
- Re-extract button rebuilds extraction without re-uploading the file.
- Provenance changes are persisted and reflected in `health.source_receipts_pct`.
- A source with low ontology validity surfaces a warning in the orchestrator suggestions feed.

---

## Tab 3 — Ontology

### Objective

The Ontology Tab is the human-in-the-loop checkpoint where Cognee's extracted candidates become canonical graph nodes. It is the **only** path through which the canonical graph grows from Cognee output. Every promotion is a deliberate analyst decision, capped at confidence ≤ 0.6 and layer ∈ {Claim, Source} per the firewall. The tab also surfaces auto-grouping suggestions ("these 3 candidates may refer to the same Actor") and tracks per-primitive completeness.

### What's already in the codebase

`src/components/ontology/OntologyBadge.tsx`, `OntologySchemaViewer.tsx` (existing — likely show ACO primitives in compact and expanded forms). `backend/services/cognee_bridge.py` (from prior spec — `promote_link`, `reject_link`, `write_candidates`). The `aco_cognee_link` table is already in migration 0013 with the firewall trigger.

Reuse the badge and schema viewer. The candidates queue and promotion UI are new.

### What Cognee does for us

Cognee already extracted the candidates during `cognify()`. They sit in `aco_cognee_link` as `link_kind='candidate'`, with a reference to the Cognee node ID, the source quote, the proposed ACO primitive, and the `ontology_valid` flag.

Beyond extraction, Cognee gives us **dedup intelligence** via `cognee.search(mode=INSIGHTS, query=...)`. INSIGHTS surfaces relationship discoveries — including "these two nodes may refer to the same entity." We use this to power the auto-grouping suggestion.

Specifically: after each batch of candidates lands, the orchestrator runs `cognee.search(mode=INSIGHTS, query=f"find duplicate {primitive_type} candidates among recent extractions")` and parses the response into grouping suggestions.

### What LangGraph does for us

**Subgraph: `on_candidates_accumulated`** (lives in `backend/services/workspace_orchestrator/subgraphs/candidates.py`). Debounced — fires when 10+ new candidates arrive within 5 minutes, or after 30 minutes of accumulation, whichever first.

1. Group candidates by ACO primitive type.
2. For each type with ≥ 3 candidates, call `cognee.search(mode=INSIGHTS)` to find dedup groups.
3. For each dedup group, propose a single canonicalized representative + the duplicate set, written to `workspace_suggestions` with `target_tab='ontology'` and a `dedup_group_id`.
4. Compute primitive completeness (8 primitives present? → 100%, 6 → 75%, etc.) and surface the gauge.

Cost target: < 1500 tokens per run.

### Frontend

The Ontology Tab opens as overlay. Three-row layout:

**Top row — primitive counters and completeness gauge.**

A horizontal strip of eight pill counters: `Actors 16 · Claims 12 · Interests 8 · Constraints 6 · Leverage 4 · Commitments 5 · Events 14 · Narratives 3`. Each pill is clickable — clicking filters the candidates queue and recently-promoted lists below to that primitive.

To the right, a `Completeness` gauge — 0–100% based on (# primitives present / 8). When < 100%, a chip suggests the missing primitive and links to a research thread template ("No Leverage primitives extracted yet — open a thread on power dynamics?").

**Middle row — Candidates queue (left) and Recently promoted (right).**

Each candidate card shows: proposed ACO primitive, candidate name, source quote (truncated), source document, `ontology_valid` badge, three buttons: **Promote**, **Reject**, **Edit-and-promote**.

If a candidate is part of a dedup group (from the orchestrator), the card shows a small banner: "May be the same as `Hayat Tahrir al-Sham` (already promoted). Promote as duplicate? [yes / no]". Choosing "yes" links the candidate to the existing canonical node instead of creating a new one.

**Edit-and-promote** opens an inline form with the proposed primitive's structured fields (per the Pydantic DataPoint schema). The analyst can correct the actor type, the date, the location, etc., before promoting.

The Recently-promoted column is a paginated list of the last 50 promotions, with the analyst's name (for audit), the source quote, and a "view in Graph" button.

**Bottom row — auto-grouping suggestions.**

When the orchestrator has dedup groups pending, they appear here as group cards. Each group card lists the candidates in the group and offers "Merge as one" (canonicalize all to one node), "Keep separate" (dismiss the suggestion).

### Backend

- `GET /v1/tabs/ontology?case_id=...&primitive=...&status=...` — list candidates and recently-promoted.
- `POST /v1/tabs/ontology/promote/{link_id}` — promote a candidate. Validates `confidence ≤ 0.6` and `layer ∈ {Claim, Source}`. Writes to `graph_nodes` via `NodeRepo`. Updates `aco_cognee_link.link_kind` to `promoted`. Writes audit row.
- `POST /v1/tabs/ontology/reject/{link_id}` — reject. Marks `link_kind='rejected'`, persists reason. Calls `cognee.search(save_interaction=True, positive=False)` for the candidate so Cognee learns from the rejection.
- `POST /v1/tabs/ontology/edit-and-promote/{link_id}` — accept the candidate with analyst-edited fields. Same firewall constraints.
- `POST /v1/tabs/ontology/merge` — accept a dedup group. Body: `{representative_link_id, duplicate_link_ids}`. Promotes the representative; marks duplicates as `link_kind='merged_into'` with a foreign key.

The promotion endpoint must call the existing firewall trigger; any 500 from a constraint violation is a P1 escalation, not silently caught.

### Codex direction

> Build the Ontology Tab. Three-row layout: primitive counters + completeness, candidates queue + recently-promoted, dedup suggestions.
>
> Reuse `src/components/ontology/OntologyBadge.tsx` for the primitive pills and the badge on each candidate card. Reuse `OntologySchemaViewer.tsx` if applicable for the edit-and-promote form.
>
> The promotion path is unchanged from the prior spec (P8.3): the bridge writes a `graph_nodes` row with confidence ≤ 0.6 and layer ∈ {Claim, Source}; the firewall trigger enforces. Treat any constraint violation as a P1.
>
> The dedup subgraph runs server-side via the orchestrator. Cards rendered from `workspace_suggestions` with `dedup_group_id`. Confirming a merge calls a new endpoint `/v1/tabs/ontology/merge` that promotes one and marks the rest as merged.
>
> Add the new CI rule to `scripts/audit-cognee-isolation.ts`: only `backend/services/cognee_bridge.py` and `backend/routers/tab_ontology.py` may import bridge functions.

### Acceptance criteria

- Promote button writes a `graph_nodes` row, marks the candidate `promoted`, and the candidate disappears from the queue.
- A malicious test attempting to promote with `confidence=0.9` is rejected at the database level (not the application level) — verifiable via `pytest backend/tests/security/test_firewall_trigger.py`.
- Auto-grouping suggestions appear within 5 minutes of 10+ new candidates being extracted.
- Merging a dedup group promotes one node and marks duplicates correctly; subsequent searches return the canonical representative.
- The audit script confirms no new bridge imports outside the sanctioned path.

---

## Tab 4 — Graph

### Objective

The Graph Tab is the visualization of the canonical conflict graph. It is read-only in v1 (edits go through Ontology promotion). The analyst uses it to understand structure: which actors connect to which claims, which events constrain which commitments, which narratives bind which interests. The tab surfaces subgraph filters per ACO primitive and lets the analyst click any node for provenance — which sources contributed it, which research threads referenced it.

### What's already in the codebase

`src/components/conflict-graph/` (existing — the force-directed visualization, likely d3-based, possibly with a layered layout option). `backend/services/kg_repositories.py` (NodeRepo, EdgeRepo). `backend/services/graph_adapter.py`.

The visualization component is reused. Cognee's own visualize API is an alternative.

### What Cognee does for us

Two ways the Graph Tab can render:

**Option A — render from canonical Postgres tables** (`graph_nodes`, `graph_edges`). This is what we have today. Pros: deterministic, RLS-enforced, our source of truth. Cons: we render only what's been promoted; the candidate-but-not-yet-promoted nodes are invisible.

**Option B — render from Cognee's graph store** (`cognee.search(mode=GRAPH_COMPLETION, return_graph=True)` or Cognee's visualize API). Pros: richer, includes all extracted nodes, includes ontology relationships. Cons: not the canonical source.

**Decision: Option A is the default; Option B is a toggle.** The default view shows only canonical, promoted nodes — what the analyst has approved. A toggle "Include candidate nodes" overlays unconfirmed Cognee extractions in a lighter color, helping the analyst spot what's still pending review. This is honest about the firewall: the default shows the analyst's curated reality; the toggle shows what AI is proposing.

For node provenance click-through, Cognee gives us `cognee.search(mode=CHUNKS, query=node_name)` which returns the original passages that mention the node. Click any node → side panel shows the chunks.

### What LangGraph does for us

**Subgraph: `on_graph_density_threshold`** (lives in `backend/services/workspace_orchestrator/subgraphs/graph_density.py`).

When graph density crosses thresholds (0.03, 0.05, 0.10), the orchestrator surfaces recipe recommendations:

- crossing 0.03 → "Consider running `StakeholderMap` to see who's centrally connected"
- crossing 0.05 → "Try `ContradictionScan` — there are enough claims to find tensions"
- crossing 0.10 → "Run `NarrativeArc` — the graph is rich enough for arc analysis"

Suggestions go to `workspace_suggestions` with `target_chapter='tools'` and a recipe parameter. The Tools chapter renders them; the analyst clicks → recipe pre-loaded with reasonable defaults.

### Frontend

The Graph Tab opens as overlay. Layout is canvas-dominant.

**Toolbar** (top):

- Layout switcher: `Force-directed`, `Layered (by primitive)`, `Timeline (events on x-axis)`. The timeline view uses `temporal_cognify`'s timestamps.
- Primitive filter: 8 toggles, click to show/hide each primitive. Default: all on.
- "Include candidate nodes" toggle (off by default).
- "Highlight recent promotions" toggle (highlights nodes added in last 7 days).
- Search box — type a node name, the canvas pans/zooms to it.

**Canvas** (center):

- Force-directed by default. Nodes colored by ACO primitive (consistent palette across the app). Edge thickness encodes relationship strength.
- Hover a node → tooltip with name, type, source count.
- Click a node → side panel.

**Side panel** (right, slides in on click):

- Node metadata: ACO primitive, name, sub-type, attributes (from the Pydantic DataPoint).
- **Provenance** — `cognee.search(mode=CHUNKS, query=node_name, top_k=5)`. Lists the source passages that mention this node, with deep-links to the Library Tab.
- **Connections** — list of edges with weights. Clickable to navigate.
- **Research threads referencing this node** — derived from `research_threads.graph_node_ids` array.
- "Open in Ontology" if the node is still a candidate.

### Backend

- `GET /v1/tabs/graph?case_id=...&include_candidates=...&primitives=...` — return nodes and edges (from canonical tables, optionally union with Cognee candidates).
- `GET /v1/tabs/graph/node/{node_id}` — node detail with provenance.
- `GET /v1/tabs/graph/timeline?case_id=...` — events with timestamps, for the timeline layout.

The provenance call is the only one that needs Cognee. Implement it in the existing `cognee_memory.py` wrapper as `recall_provenance(node_name, case_id, top_k=5)`.

### Codex direction

> Build the Graph Tab. Reuse `src/components/conflict-graph/` for the canvas. Add the toolbar with layout switcher, primitive filter, candidate-overlay toggle, recent-promotions highlight, search.
>
> Render from canonical `graph_nodes`/`graph_edges` by default. When "Include candidates" is on, union with `aco_cognee_link` rows where `link_kind='candidate'`, render in a 50%-opacity color.
>
> Click a node → side panel. The provenance section calls `cognee.search(mode=CHUNKS)` via the wrapper. Show top 5 passages with source deep-links.
>
> Add the orchestrator subgraph `on_graph_density_threshold` to fire recipe suggestions at 0.03 / 0.05 / 0.10 density. Suggestions surface in the Tools chapter (cross-chapter wiring via `workspace_suggestions`).
>
> The graph is read-only in v1. Do not add inline node editing.

### Acceptance criteria

- Default view renders only canonical nodes; toggle adds candidates with visual distinction.
- Click a node, side panel opens within 1 second; provenance shows 5 source passages.
- Timeline layout uses `temporal_cognify` event dates.
- Crossing density 0.05 produces a Tools chapter suggestion within 60 seconds.
- Performance: 200-node graph renders in < 2 seconds; no jank on hover/click.

---

## What's shared across all four tabs

### The orchestrator hookup

Every tab subscribes to the same SSE endpoint: `GET /v1/workspace/events?case_id=...&surface=tab.<id>`. The endpoint filters server-side to suggestions and events relevant to that tab. This avoids client-side filtering and reduces bandwidth.

The frontend hook `useOrchestratorEvents(surfaceKey)` lives at `src/hooks/useOrchestratorEvents.ts` and is reused by both tabs and chapters. It returns a list of pending suggestions, a `dismiss(id)` action, and a `confirm(id)` action.

### The Tab manifest

Each tab ships a manifest at `src/tabs/<id>/manifest.ts`:

```
{
  id: 'context' | 'library' | 'ontology' | 'graph',
  title: string,
  short_title: string,  // for the Tab strip
  icon: string,
  position: 1 | 2 | 3 | 4,  // canonical order
  required_for_health: string[],  // which health metrics this tab contributes to
  feature_flag: string,
}
```

Tabs are not togglable, but the manifest still drives auto-discovery so adding a fifth tab in v2 is one folder.

### The MCP exposure

Each tab's read endpoints are exposed via the MCP server (`backend/mcp/praxis_server.py`):

- `praxis.get_situation_frame(case_id)` — Context Tab
- `praxis.list_sources(case_id)` — Library Tab
- `praxis.list_ontology_candidates(case_id)` — Ontology Tab
- `praxis.get_graph(case_id, include_candidates)` — Graph Tab

This makes PRAXIS queryable from any MCP client (Claude Code, ChatGPT desktop, IDE assistants). Forward-compatible with A2A when ADK becomes the standard.

### CI guarantees

Two new audit scripts run on every PR:

- `scripts/audit-tab-chapter-imports.ts` — Tabs do not import Chapter internals; Chapters do not import Tab internals; both use `useCaseContext()` for shared state.
- `scripts/audit-substrate-writers.ts` — only Tab routers may write to `situation_frames`, `source_receipts`, `aco_cognee_link`, `graph_nodes`, `graph_edges`. Chapters fail CI if they import the corresponding repos.

— end of Tabs build guide —

# PRAXIS Next 10 Critical Improvements - 2026-04-30

This wave focuses on making PRAXIS feel like a serious production workspace:
evidence comes in, context is structured, tools share the same backbone, outputs
can be drafted/exported, and the demo case proves the loop.

## 1. Document Production Workspace Spine

Status: implemented in this wave.

Objective: make Documents visibly operate as the source-to-briefing backbone, not
only as a file list.

Acceptance:

- Real workspaces show intake, extraction, structure, context, draft, and export
  stages computed from live document counts, extraction status, entity counts,
  and chunk counts.
- Demo mode shows labelled Nordalia source material with the same workflow
  model.
- Users can jump from Documents to Conflict Graph, Policy Memo, Export Center,
  Dashboard, upload, and expert context packs.
- UI explicitly states the current export reality: DOCX/PDF/JSON/CSV are
  supported; LibreOffice is the external/editor layer for exported DOCX until a
  managed editor is provisioned.

## 2. Demo Case As A Complete Operating Picture

Status: started.

Objective: make the Nordalia case a credible sample intelligence workspace, not
a collection of isolated synthetic responses.

Acceptance:

- One canonical demo case file defines actors, events, documents, sources,
  media narratives, legal constraints, humanitarian indicators, commitments,
  and draft artifacts.
- Dashboard, Documents, Conflict Graph, Timeline, Source Scout, Policy Memo,
  Talking Points, Media Roundup, and Export Center all read from that canonical
  demo case where feasible.
- All demo views remain labelled as synthetic and cannot write to production
  Firestore.

## 3. Dashboard Command Center Visualization

Status: next.

Objective: make the dashboard the command view for evidence readiness, risk,
tool progress, next action, and operator trust.

Acceptance:

- Dashboard includes a compact case topology: actors, evidence, open warnings,
  running tools, stale data, and next deliverables.
- Existing widgets share one visual system and avoid duplicated status copy.
- Demo dashboard shows a rich Nordalia operating picture without pretending it
  is live data.

## 4. Canonical Tool Data Migration

Status: next.

Objective: finish the migration to versioned `tool-data/{toolId}` envelopes so
exports, Ask PRAXIS, admin audit, and future graph services read the same shape.

Acceptance:

- Reads prefer `tool-data/{toolId}` and only fall back to legacy paths.
- All saves include schema version, source receipts where available, confidence
  note, generation metadata, and updated timestamp.
- Admin/operator surfaces can inspect latest run state and failed saves.

## 5. Ask PRAXIS Writeback Adapters

Status: next.

Objective: make Ask PRAXIS able to correct and update tool outputs safely.

Acceptance:

- Typed adapters exist for graph nodes/edges, timeline events, source records,
  draft sections, risk scores, and workspace settings.
- Ask PRAXIS asks missing required questions before editing.
- User sees a structured patch preview before persistence.

## 6. Grounded Search Receipt Layer

Status: next.

Objective: make visible, checkable search the primary trust layer for open-source
political analysis.

Acceptance:

- Search/crawler outputs carry query, source URL, title, date, snippet,
  extraction status, and trust notes.
- Tools can request fresh source packs instead of generating from memory.
- Source Scout, Deep Search, Media Roundup, Policy Memo, and Ask PRAXIS expose
  receipts prominently.

## 7. Context Certainty And Entity Resolution

Status: next.

Objective: track whether actors, names, claims, episodes, and edges are verified,
inferred, ambiguous, or stale.

Acceptance:

- Shared certainty model exists for actor aliases, source support, confidence,
  recency, and contradiction flags.
- Conflict Graph and Documents expose low-certainty entities.
- Drafting tools warn when an argument depends on weak or ambiguous evidence.

Progress:

- Added a deterministic situation-context health model covering profile,
  evidence, graph, tool readiness, agentic memory, freshness, ready layers, and
  missing layers.
- Injected context-health instructions into calibrated AI prompts so tools must
  qualify weak context and avoid invented source/document/graph facts.
- Dashboard now exposes context-health score and actionable context gaps in the
  Situation Launchpad.

## 8. Legal/Diplomatic Drafting Backbone

Status: next.

Objective: turn policy/legal/diplomatic drafting tools into a coherent artifact
production system.

Acceptance:

- Policy Memo, Diplomatic Dossier, Talking Points, UN Toolkit, Treaty Analysis,
  Legal Tracker, and Report Studio share artifact section models.
- Exports can render saved structured data without re-calling the LLM.
- Each artifact includes provenance, assumptions, limitations, and review
  status.

## 9. Admin And System Health Operations

Status: started.

Objective: make production support observable for the operator.

Acceptance:

- Admin panel shows current deployment revision, AI provider state, tool route
  failure rates, recent failed generations, Firestore health, crawler/search
  health, and export queue status.
- `giulio@tacitus.me` admin access remains explainable through the verified
  email allowlist.
- Fast deploy runbook exists so frontend/tool-surface changes can ship without
  rebuilding backend and worker images unnecessarily.

Progress:

- Added `cloudbuild.frontend.yaml` and `npm run deploy:frontend:cloud`.
- Excluded Graphify/Codex/review artifacts from Cloud Build and Docker build
  contexts.

## 10. Dialectica Graph Preparation

Status: planned.

Objective: keep current tools working while preparing the premium graph-backed
context layer.

Acceptance:

- Current ACO primitives map cleanly to Dialectica candidates: actor, claim,
  interest, constraint, commitment, event, narrative, evidence, source.
- Graph proposals remain reviewable before becoming canonical.
- Tool routes can ask for "current context" without knowing whether it came
  from Firestore documents, grounded search receipts, or future graph retrieval.

## Verification Rule

Each item must land with code, docs, and a validation path. Do not mark a tool as
working because the UI renders; mark it working only when it accepts real input,
calls the real service or a clearly labelled demo path, persists/exports where
promised, and shows failure/confidence states.

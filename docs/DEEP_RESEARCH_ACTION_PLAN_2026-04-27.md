# Deep Research Action Plan

> Consolidates `PRAXIS_DEEP_RESEARCH_MEMO_2026-04-26.md` into buildable lanes.
> Use this as the weekly sprint board for the 2026-04-27 week.

The deep-research memo is the long reference. This file is the execution plan.
Each lane should land as a coherent PR/commit with validation and docs.

## Priority Model

1. Make outputs structurally reliable.
2. Make agents durable and resumable.
3. Make evidence/citations defensible.
4. Make graph state human-approved.
5. Make operations observable and cheap to clean up.

## Lane 1 — Onboarding Context Capture

**Goal:** make first-run onboarding collect the context that lets tools behave
like expert assistants from the first situation onward.

Files:

- `src/app/onboarding/*`
- `src/components/onboarding/*`
- `src/types/analyst-profile.ts`
- `src/lib/context/profile-context.ts`

Deliverables:

- Role/domain/audience/language/red-line capture remains clear to beginners.
- Completion screen explains which tools and sources will benefit.
- Profile output is immediately visible in dashboard/tool context.
- No raw prompt XML by default.

## Lane 2 — Situation Creation Intelligence

**Goal:** situation creation should produce a high-quality starting corpus,
not just metadata.

Files:

- `src/app/app/situations/new/*`
- `src/components/onboarding/case-creation-wizard.tsx`
- `cloud_functions/on_situation_created/`
- `backend/routers/pipeline.py`

Deliverables:

- Creation wizard encourages sources, docs, geography, actors, objectives,
  and confidence gaps.
- Domain classification and source recommendations are visible before create.
- Pipeline job status appears in Activity Feed.
- Empty source situations still get honest next-action guidance.

## Lane 3 — Structured Backend Extraction

**Goal:** replace raw JSON parsing in `backend/graphify_tacitus/extract.py`
with schema-enforced output.

Files:

- `backend/graphify_tacitus/extract.py`
- `backend/graphify_tacitus/schemas/*`
- `backend/tests/`

Deliverables:

- Pydantic validation for extracted nodes/edges.
- Invalid model output fails visibly, not as silent empty extraction.
- Tests for malformed JSON, schema-invalid nodes, and empty extraction.

## Lane 4 — Document AI Ingestion

**Goal:** scanned PDFs and layout-heavy reports produce usable chunks.

Files:

- `src/app/api/documents/upload/route.ts`
- `cloud_functions/on_document_uploaded/`
- new Document AI client/service module

Deliverables:

- Layout Parser fallback when `pdf-parse` fails or extracts too little text.
- Chunk metadata includes page, heading, table/list hints.
- Cost/degrade state visible to users.

## Lane 5 — Vertex AI Search / RAG Expansion

**Goal:** add a managed retrieval tier for large corpora while keeping SKC as
the orchestration contract.

Files:

- `src/lib/knowledge/*`
- `src/lib/intelligence/corpus-search.ts`
- future Vertex Search/RAG client module

Deliverables:

- Retrieval policy decides: Firestore vector for situation-local chunks,
  Vertex AI Search/RAG for large public or cross-situation corpora, grounded
  Google Search for current web facts.
- Results still normalize to `CorpusItem`.
- Source/citation provenance stays visible in every tool.

## Lane 6 — Real Search / Deep Search Agent

**Goal:** real-time research should be defensible, current, and integrated into
tools rather than a separate novelty feature.

Files:

- `src/app/api/ai/deep-search-agent/route.ts`
- `src/lib/ai/vertex-agent.ts`
- `src/app/api/ai/grounded-search/route.ts`
- `src/lib/intelligence/corpus-search.ts`

Deliverables:

- Deep Search Agent sessions no longer clobber `agentSessions/active`.
- Grounded Google Search results become corpus items with citations.
- Search degradation is visible to users.

## Lane 7 — LangGraph Runtime Foundation

**Goal:** create the internal durable agent runtime.

Files:

- `backend/agents/langgraph/*`
- `backend/agents/requirements-langgraph.txt` or backend deps
- `docs/LANGGRAPH_CLOUDSQL_CHECKPOINTING.md`
- `cloudbuild.yaml` if new `praxis-agents` service is added

Deliverables:

- Postgres checkpointer setup.
- Agent run schema and thread IDs.
- Health endpoint verifies checkpoint DB reachability.
- No direct canonical graph writes.

## Lane 8 — Brainstorming Table Migration

**Goal:** move Brainstorming Table from synchronous route to checkpointed graph.

Files:

- `src/app/api/ai/brainstorming-table/route.ts`
- `src/app/app/brainstorming-table/page.tsx`
- `backend/agents/langgraph/brainstorming.py`

Deliverables:

- Persona turn nodes.
- Human review/interrupt before synthesis lock.
- Resume after process restart.
- Final output still writes to Firestore `tools/brainstorming-table`.

## Lane 9 — Brief Builder Migration

**Goal:** versioned, lockable briefs with human approval checkpoints.

Files:

- `src/app/api/ai/brief-builder/route.ts`
- future LangGraph brief module
- report/brief UI pages

Deliverables:

- Draft sections as graph steps.
- Lock/edit/reject flow.
- Audit event on lock or admin override.

## Lane 10 — Source Scout / Citation Validation

**Goal:** every source recommendation is ranked, preference-aware, and
validated before it enters the corpus.

Files:

- `src/app/api/ai/source-scout/route.ts`
- `src/lib/services/sources-preference.ts`
- `src/lib/intelligence/corpus-search.ts`

Deliverables:

- Retryable search/planning steps.
- Preferred/blocked source logic preserved.
- Citation validation and dead-link handling.

## Lane 11 — Graph Cartographer Approval Queue

**Goal:** agents propose graph changes; humans approve canonical writes.

Files:

- `src/lib/firebase/graph-updates-service.ts`
- `src/app/app/graph-review/`
- `backend/graphify_tacitus/*`

Deliverables:

- Proposals only, no silent canonical mutation.
- Approve/reject UI with provenance.
- System/audit events for every decision.

## Lane 12 — Tool Output Store Unification

**Goal:** resolve `tools/{toolId}` vs `tool-data/{toolId}` drift.

Files:

- `src/lib/api/save-tool-output.ts`
- `src/lib/services/tool-data-service.ts`
- `src/lib/knowledge/tool-output-layer.ts`
- `src/hooks/use-persisted-tool-data.ts`

Deliverables:

- One canonical write helper.
- Compatibility reads until migration complete.
- Tests that SKC/corpus can retrieve newly generated outputs.

## Lane 13 — Evaluation Harness

**Goal:** add quality gates beyond route plumbing.

Files:

- new `evals/`
- `backend/pyproject.toml`
- `cloudbuild.yaml`

Deliverables:

- Golden extraction set.
- RAG/citation faithfulness tests.
- Optional Cloud Build gate via `_RUN_EVALS=1`.

## Lane 14 — Postgres Cleanup And Retention

**Goal:** checkpoint state is cleaned without touching canonical user outputs.

Files:

- future cleanup route/job
- `docs/LANGGRAPH_CLOUDSQL_CHECKPOINTING.md`
- `scripts/audit-gcp.mjs`

Deliverables:

- Firestore `agent_runs.expiresAt`.
- Nightly cleanup calls LangGraph `delete_thread(thread_id)`.
- Cleanup emits `system_events`.
- No raw SQL cleanup until schema is pinned.

## Lane 15 — Sigma / Graphology Canvas

**Goal:** conflict graph scales past D3 SVG limits.

Files:

- `src/app/app/conflict-graph/page.tsx`
- `src/components/visualizations/`
- new graphology adapter

Deliverables:

- Large graph rendering path.
- D3 fallback behind flag.
- Node click opens provenance/citation drawer.

## Lane 16 — App Check And Abuse Controls

**Goal:** protected AI routes require real app traffic, not just a stolen
session cookie.

Files:

- `src/lib/api/with-auth.ts`
- `src/lib/auth/auth-context.tsx`
- `src/lib/firebase/admin.ts`

Deliverables:

- Logging-only rollout first.
- Enforced App Check on mutating AI routes after burn-in.
- Playwright/API tests for missing token.

## Immediate Next Build Order

1. Lane 1 — onboarding context capture.
2. Lane 2 — situation creation intelligence.
3. Lane 3 — structured backend extraction.
4. Lane 7 — LangGraph runtime foundation.
5. Lane 8 — Brainstorming Table migration.
6. Lane 14 — cleanup/retention job.
7. Lane 12 — tool-output unification.

Do not start Lane 8 until Lane 7 has a working checkpoint integration test.

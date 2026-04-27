# PRAXIS Deep Research & Implementation Memo

> **Authored:** 2026-04-26
> **Author:** Claude (Anthropic), commissioned by Giulio Catanzariti / TACITUS
> **Repo audited:** `A4_PRAXIS_CLOUD_Work-main` at version 6.4.0
> **Audience:** Future Claude Code / Codex sessions, contributing engineers
> **Pair with:** `CLAUDE.md`, `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md`,
> `docs/AGENTIC_SYSTEM.md`, `docs/CONTEXT_INJECTION.md`,
> `docs/CORPUS_ARCHITECTURE.md`, `docs/GCP_EXPANSION_PLAN_2026-04-26.md`

This memo is the result of a full read of the PRAXIS codebase and
external research as of April 2026. It identifies the smallest set of
high-leverage changes that move PRAXIS from "very capable internal
prototype" to a credibly defensible, production-grade conflict
intelligence platform. Every recommendation is anchored to existing
files, current dependencies, and concrete APIs. Where information is
missing, it is called out explicitly.

---

## Executive summary (one screen)

PRAXIS is already further along than its own roadmap docs suggest. The
ACO ontology, calibration contract, operational spine, dual-service
deployment, ADK Deep Research integration, multi-backend graph adapter
(`graph_adapter.py` already supports Neo4j, FalkorDB, and Spanner
Graph), Firestore native KNN vector search, and 4-layer Situation
Knowledge Core are all in place. The frontier from here is reliability
and defensibility, not feature surface area.

**The five highest-leverage upgrades are:**

1. **Replace raw `json.loads` extraction in
   `backend/graphify_tacitus/extract.py` with `instructor` +
   Pydantic-validated structured output** (or `google-genai`
   `response_schema`). One file, immediate ground-truth quality lift,
   unlocks deduplication, confidence calibration, and evaluation.
2. **Adopt LangGraph as the backend agent runtime** (one new module
   `backend/agents/langgraph/`). Brainstorming Table, Conflict Graph
   extraction, Deep Research, Mediation Designer, and the Approval Queue
   become durable, resumable, human-gated graphs. Replaces the current
   synchronous `/api/ai/*` orchestration for any multi-step tool.
3. **Upgrade ingestion to Document AI Layout Parser** triggered from
   `cloud_functions/on_document_uploaded/`. Closes the "scanned PDF
   yields zero entities" failure documented in `docs/GCP_EXPANSION_PLAN`
   and produces hierarchy-aware chunks instead of naive splits.
4. **Wire a real evaluation harness** (DeepEval + Ragas + a TACITUS
   golden set) into `cloudbuild.yaml` as a gate. Today there is no
   regression test for extraction quality across 53 calibrated AI
   routes — the audit-routes script only verifies plumbing.
5. **Move the conflict-graph UI from D3/SVG to Sigma.js + graphology
   + react-sigma** (or keep D3 for small previews and add Sigma for
   the main canvas). D3 caps at ~3-5k nodes; ACO graphs over a long
   conflict will exceed that.

These five changes plus the GCP-native extensions (Spanner Graph as
the production graph backend, Vertex AI Memory Bank for agent memory,
Vertex AI RAG Engine Serverless as a parallel retrieval path,
Cloud Workflows for pipeline orchestration, Cloud Tasks fan-out for
the Brainstorming Table) bring PRAXIS to top-tier and produce real
differentiation: a neurosymbolic conflict OS where every assertion is
typed, sourced, time-bounded, and challengeable.

The full plan follows.

---

# 1. Current PRAXIS architecture (audit)

## 1.1 Frontend

- **Framework:** Next.js 16.2.4 (App Router, Turbopack), TypeScript
  5.9.3, React 19.2. `src/app/` uses route groups: `(landing)`,
  `(auth)/login`, `app/*` (auth-gated), `demo/*` (cookie auth), `api/*`.
- **Styling/UI:** Tailwind CSS 4 + Radix UI + Framer Motion 12.
  Custom design tokens in `tailwind.config` and the spec in
  `CLAUDE.md` (Navy `#0F172A`, Emerald `#10B981`, Gold `#E8B931`).
- **State:** Zustand 5 stores under `src/stores/` (situation, app,
  debug, etc.). React Query is **not** in use; data flows through
  `usePersistedToolData` and Firestore `onSnapshot`.
- **Visualizations:** D3 7 (SVG) + custom components in
  `src/components/visualizations/` — force-graph, risk-gauge, etc.
  Leaflet 1.9 + react-leaflet 5.0 for geospatial views.
- **Chat / streaming:** AI SDK v6 (`@ai-sdk/react`,
  `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/google-vertex`).
  Streaming routes use `streamText({...}).toUIMessageStreamResponse()`.

## 1.2 Backend

- **Frontend Cloud Run service** (`praxis-frontend`):
  Next.js standalone build, public, deployed by Cloud Build. Serves
  the 73 API routes including all 35+ AI tools.
- **Backend Cloud Run service** (`praxis-backend`):
  Python 3.11 + FastAPI 0.115 + uvicorn. Routers in
  `backend/routers/`: `pipeline.py`, `graph.py`, `analyze.py`. As of
  the latest cloudbuild.yaml the backend now runs
  `--no-allow-unauthenticated` (P6A complete).
- **Background jobs:**
  - `cloud_functions/on_situation_created/` — fires the pipeline
    when a new situation document is written.
  - `cloud_functions/on_document_uploaded/` — extracts text and runs
    extraction on uploads.
  - `cloud_functions/gdelt_poller/` — promoted to a **Cloud Run
    Worker Pool** in `cloudbuild.yaml` (correct future-shape choice).
- **Cron:** Cloud Scheduler hits `/api/cron/*` endpoints with
  `CRON_SECRET` bearer auth. Three cron jobs today: GDELT poll
  (15 min), early-warning refresh (6am), generate-briefing (5am).

## 1.3 Cloud dependencies

| Service | Used for | Status |
|---|---|---|
| Cloud Run | Frontend + backend + worker pool | Production |
| Artifact Registry | Docker images at `us-central1-docker.pkg.dev/praxisbytacitus/praxis/` | Production |
| Cloud Build | CI/CD via `cloudbuild.yaml` | Production |
| Firebase Auth | Google OAuth + email/password + demo cookie | Production |
| Firestore (Native) | Single source of truth, real-time sync, vector index | Production |
| Cloud Storage | `gs://praxisbytacitus-praxis-uploads` | Production |
| Pub/Sub | 5 topics (`pipeline`, `extract`, `ingest`, `alert`, `profile.events`) | Production |
| Cloud Functions (Gen 2) | 3 event-triggered functions | Production |
| Cloud Scheduler | 3 cron jobs | Production |
| Secret Manager | 5 secrets (`praxis-firebase-sa`, `praxis-google-ai-key`, `praxis-cron-secret`, `praxis-cookie-secret`, `praxis-user-key-master`) | Production |
| BigQuery | `praxis_analytics` dataset for pipeline run logs | Production |
| Vertex AI | Gemini 3 Pro/Flash via ADC; ADK Agent Engine for Deep Research | Production with caveat (Agent Engine ID secret not yet mounted in cloudbuild — falls back to Gemini 3 + Search per `vertex-agent.ts:31-32`) |
| Cloud Tasks | 3 queues (`research`, `agents`, `embeddings`) provisioned per `docs/GCP_EXPANSION_PLAN` | Provisioned, fan-out **not yet wired** |
| Spanner Graph | adapter exists in `graph_adapter.py` | **Not provisioned** |
| Cloud Workflows | none | **Not in use** |
| Document AI | none | **Not in use** |
| Cloud Translation | none | **Not in use** |
| Vertex AI Search / RAG Engine | none | **Not in use** |
| Vertex AI Vector Search | none | **Not in use** (Firestore vectors instead) |
| reCAPTCHA Enterprise | App Check key in `cloudbuild.yaml` build args | Configured client-side, server enforcement TBD |
| Sentry | wired in `sentry.client.config.ts` + backend `main.py` lifespan | Production (DSN required) |
| OpenTelemetry → Cloud Trace | `@google-cloud/opentelemetry-cloud-trace-exporter` 2.0 + `@opentelemetry/sdk-node` 0.57 in `package.json`; `instrumentation.ts` registered | Wired |

## 1.4 AI dependencies

- **Frontend (`src/lib/ai/providers.ts`):** Vertex AI primary on Cloud
  Run via ADC (`AI_PROVIDER=vertex` in env). Models: `gemini-3-flash-preview`
  (Flash), `gemini-3.1-pro-preview` (Pro + Deep Think), `gemini-embedding-2-preview`
  → `text-embedding-005` fallback. Anthropic Claude Sonnet 4 optional via
  `ANTHROPIC_API_KEY` for `getAnalysisModel()`. **Single source of truth
  enforced** by Cloud Build pre-flight grep against forbidden strings.
  `callProModel()` provides Pro→Flash auto-fallback for quota safety.
- **Backend (`backend/services/gemini_client.py`):** thin wrapper
  around `google-genai` 1.8 calling Gemini directly with `httpx`.
  Used by the pipeline extraction stage. **No structured output
  enforcement** — see §1.7.
- **ADK Agent Engine:** `backend/agents/deep_research/agent.py` defines
  the planner/researcher/synthesizer triad; `backend/agents/deploy.py`
  registers it. Frontend bridge in `src/lib/ai/vertex-agent.ts` and
  the API route at `src/app/api/ai/deep-search-agent/`.

## 1.5 Storage / database

- **Firestore data model** (canonical, reproduced from `CLAUDE.md`):
  ```
  users/{uid}/
    profile/analyst                  AnalystProfile
    profile_versions/{vN}            immutable snapshots
    settings/api_keys                user-supplied LLM keys
    settings/graph_backend           per-user graph backend
    situations/{sitId}/
      (metadata)
      conflict-grammar               ACO entities (14 types)
      graph/main                     {nodes[], edges[]}
      graph/analysis                 pre-computed analytics
      documents/{docId}              uploaded files + chunks subcoll
      reports/{rptId}
      tool-data/{toolName}           cached structured outputs
      tools/{toolId}                 profile-versioned outputs
      chats/{id}, briefings/{id}, dossiers/{id}
      embeddings/{id}                768-dim vectors (FieldValue.vector)
      tool-embeddings/{toolId}
  credit_transactions/{txId}
  config/onboarding_suggestions      live-editable taxonomy
  config/domains/{id}                11 domain docs (live-editable)
  tool_runs, background_jobs, system_events, notifications, alerts,
  data_ingestions, graph_updates, audit_logs (operational spine)
  ```
- **Firestore vector search:** `findNearest({distanceMeasure: 'COSINE'})`
  in `src/lib/knowledge/vector-layer.ts`. 768-dim, indexed per situation.
- **Graph storage:**
  - Default: Firestore subcollections under `situations/{id}/graph/main/{nodes,edges}`
    via `FirestoreGraphLayer` in `src/lib/knowledge/graph-layer.ts`.
    Centrality + community detection happen in JS in
    `firestore-graph-analytics.ts`.
  - Optional: Neo4j (current preferred for power users) via
    `neo4j-driver` 6.0.1 + `backend/services/neo4j_client.py`.
  - Optional: FalkorDB via `falkordb` 1.1 (the test case from 2026-01-06).
  - Optional: Spanner Graph via `google-cloud-spanner` 3.50 — **adapter
    exists, instance not provisioned**.
- **Cloud Storage:** `praxisbytacitus-praxis-uploads` bucket. Documents
  hit Cloud Storage on upload; `chunkAndSaveDocument` chunks the
  extracted text inline.

## 1.6 Authentication

- **Client:** Firebase Auth via `@firebase/auth` 12.11. AuthProvider
  in `src/lib/auth/auth-context.tsx`. Three modes: Google redirect,
  email/password, demo cookie.
- **Server:** Firebase Admin SDK 13.7 in `src/lib/firebase/admin.ts`.
  ID token verification + signed cookie session via
  `src/lib/auth/cookie-signer.ts` (HMAC-signed, primary secret
  `COOKIE_SIGNING_SECRET`, alias `SESSION_SECRET`).
- **API gating:** every AI route wraps `withCalibration(toolId,
  creditOpType)` which chains `withAuth → checkAndDeductCredits →
  buildCalibratedContext → handler` and 403s non-demo users without
  `profile.meta.completedAt`.
- **Edge:** `src/middleware.ts` enforces JWT presence on `/app/*`,
  CSP/COOP/HSTS headers, route protection.
- **Firestore rules:** `firestore.rules` is owner-only (`request.auth.uid
  == uid`). `storage.rules` similarly scoped to user uploads.

## 1.7 Current weaknesses / technical debt

These are the issues that block PRAXIS from being defensibly
production-grade. Each is anchored to a specific file or boundary.

1. **Extraction parses JSON with regex.** `backend/graphify_tacitus/extract.py:109-119`
   strips markdown fences then `json.loads` — on parse failure it
   silently returns an empty `ExtractionResult`. There is no Pydantic
   validation against the ACO schemas in `schemas/aco.py`,
   `schemas/extraction.py`, `schemas/relationships.py`. Gemini
   structured output (`response_schema`) and/or `instructor` would
   eliminate this entire failure mode.
2. **Frontend extraction route also unstructured.** The TS
   `src/app/api/ai/extract/route.ts` calls `extractEntities` from
   `src/lib/services/entity-extraction.ts` which uses `Output.object()`
   from AI SDK v6 — that's better, but not all 35 `/api/ai/*` routes
   do this consistently; the audit script only checks calibration,
   not output schema enforcement.
3. **Scanned PDFs produce no signal.** `src/app/api/documents/upload/route.ts:42-50`
   imports `pdf-parse` at runtime; on failure it stores
   `[PDF text extraction failed — file stored but text could not be
   extracted automatically]` as the document body. `chunkAndSaveDocument`
   then chunks the literal error string. This is a silent data-quality
   bug for any UN report, ICC indictment, scanned ceasefire — the
   exact corpora PRAXIS needs.
4. **No durable agent runtime.** `backend/agents/deep_research/agent.py`
   uses Google ADK; the rest of the agent surface is synchronous
   `generateText`/`streamText` calls inside route handlers. There is no
   checkpointing, no resumability, no human-in-the-loop interrupt
   pattern. Brainstorming Table is "shipped synchronously" per
   `docs/AGENTIC_SYSTEM.md` and "needs Cloud Tasks fan-out".
5. **No evaluation harness.** Vitest + Playwright cover plumbing
   (auth, API contracts, smoke). There is no Ragas / DeepEval /
   promptfoo wired in, no extraction golden set, no faithfulness
   regression gate. `npm run audit:calibration` only verifies that
   routes wrap `withCalibration`. Quality is asserted by inspection.
6. **Graph viz won't scale.** D3 SVG in `src/components/visualizations/`
   degrades past ~3-5k nodes. ACO graphs across a multi-year
   conflict (Sudan, Syria, Ukraine) will hit that ceiling. No WebGL
   fallback wired today.
7. **No GraphRAG retrieval.** `src/lib/knowledge/retrieval-orchestrator.ts`
   composes layers but does not run a graph traversal step
   conditioned on the query. Retrieval is vector + tool-output +
   feed; the graph is only joined post-hoc in the UI.
8. **Pipeline orchestration is hard-coded.** `backend/routers/pipeline.py`
   chains `extract → build → cluster → analyze → report → export`
   inside a single FastAPI handler. A failed step orphans the run
   in `background_jobs`. No re-run from a step, no per-step retry
   policy, no operator-visible state machine. Cloud Workflows
   would solve this; it's flagged in `GCP_EXPANSION_PLAN` brick #33.
9. **`tools.ts` is 3,330 lines.** `src/lib/ai/tools.ts` defines 38
   tools in one file. This is now a refactor liability — splitting
   per category (intelligence, drafting, simulation) would clean up
   chat tool registration and make per-tool eval feasible.
10. **Spanner Graph adapter exists but instance does not.**
    `backend/services/graph_adapter.py` has the class; `setup-spanner.sh`
    is in `infrastructure/`; no production instance is created.
    For multi-tenant SaaS where each customer has thousands of
    situations × tens of thousands of nodes, Spanner Graph is the
    answer for unified graph + vector + relational at Spanner-scale
    consistency.
11. **Memory Bank not yet integrated.** `vertex-agent.ts:130-133`
    passes `user_id` to ADK but does not call the Memory Bank API
    directly. The ADK agent reads its own memory; cross-tool memory
    (e.g., the user's preferred sources, red-line phrases that the
    Brainstorming Table should respect) lives only in the
    `AnalystProfile` Firestore doc. Memory Bank GA since Dec 2025
    closes this loop.
12. **No App Check enforcement on AI routes.** `firebase` 12.11 ships
    App Check support; `cloudbuild.yaml` plumbs the reCAPTCHA
    Enterprise key. But the route handlers do not assert App Check
    tokens. A leaked session cookie is currently sufficient to
    drive the API.
13. **`tools/{toolName}` vs `tool-data/{toolName}` collection drift.**
    `CLAUDE.md` enumerates both; the codebase writes to both in
    different routes. Rename once and migrate via
    `scripts/migrate-tool-outputs-to-tools.ts`. This is also a
    P6 backlog item.
14. **Sentry has the surface but no DSN in Secret Manager
    publicly.** Verify `praxis-sentry-dsn` exists; if not, the
    backend Sentry init silently no-ops (`main.py:21`). Same for
    frontend.

## 1.8 Risky missing pieces

- Tenant isolation for Neo4j / Spanner Graph today relies on a
  `tenant_id` property on every node. This is not enforced at the
  database constraint level — a buggy query that drops the tenant
  filter exposes cross-tenant data. Spanner Graph row-level security
  + Neo4j multi-database (one DB per tenant) are the production
  answers.
- The `FIREBASE_SERVICE_ACCOUNT_KEY` is a long-lived JSON string
  in Secret Manager. Workload Identity Federation + ADC removes
  this. `vertex-agent.ts:54` already does `JSON.parse` of this; if
  this secret rotates, every Cloud Run revision must redeploy.
- The `_GOOGLE_MAPS_KEY` substitution in `cloudbuild.yaml:235` is
  empty and the key is embedded at build time. If filled in, ensure
  HTTP referrer restrictions are set or this will be abused.
- VPC Service Controls are not configured. For UN / sovereign
  procurement (per `docs/COMPLIANCE.md` aspirations), VPC-SC around
  the project boundary is table stakes.

---

# 2. Product interpretation

## 2.1 What PRAXIS is doing today

PRAXIS today is an **AI-native conflict workspace** that lets a
practitioner (analyst, mediator, policy adviser, humanitarian lead)
do the following per `Situation`:

1. Onboard via a 3-screen calibration wizard that produces an
   `AnalystProfile` (identity, perspective, working style) used to
   personalize every tool output thereafter.
2. Create a Situation with metadata, a primary domain (1 of 11),
   regions, actors.
3. Upload documents (PDF/DOCX/TXT/MD), paste text, or drop URLs;
   the system extracts text, chunks it, embeds it, and ingests
   into the SKC.
4. Trigger 38+ AI-driven tools that produce structured outputs
   tied to the ACO ontology — risk gauges, escalation scoring,
   actor profiles, stakeholder maps, briefings, dossiers, treaty
   analyses, mediation designs, scenario sets, policy memos,
   talking points.
5. View a conflict graph (ACO nodes + edges) per situation with
   centrality, community detection, faction maps, hidden linkages.
6. Run live data feeds (ACLED, GDELT, UCDP, UNHCR, HDX, ReliefWeb,
   UN News, World Bank, Crisis Group, SIPRI) into the SKC feed
   layer.
7. Use the Deep Research Agent (Vertex ADK) for cross-source
   research with grounding.
8. Get cron-scheduled briefings, alerts, and an operator console
   for ops oversight.

## 2.2 What PRAXIS is becoming

The North-Star outcomes from `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md`
are precise:

1. *"PRAXIS told me what changed and what to do — before I asked."*
2. *"Every figure is sourced and I can defend it in a UN meeting."*
3. *"Six experts argue the call — and I pick."*
4. *"My corpus is mine."* (cross-linked docs ↔ graph ↔ tool outputs)
5. *"PRAXIS keeps watching while I sleep."*

These map cleanly to four product pillars:

- **Calibrated context.** AnalystProfile + domain + situation +
  retrieval + provenance becomes the default frame for every tool
  call. (This is mostly built — `withCalibration` covers 53/57
  routes today.)
- **Cited assertions.** Every claim a tool produces ties back to a
  document chunk, a feed event, a typed graph node, or an external
  source — and the UI exposes that trace.
- **Multi-persona deliberation.** Brainstorming Table replaces
  the single-LLM tool with a calibrated council (mediator, legal,
  humanitarian, media, red team, synthesis chair) producing a
  table of structured arguments instead of a prose blob.
- **Durable, watchful operations.** Background pipelines,
  agentic monitors, change-since diffs, freshness scoring,
  notifications — all visible in an Activity Feed and Operator
  Console.

## 2.3 Core user workflows that should exist

A clean read of the current pages and the `docs/personas/` set
suggests these as the canonical user workflows:

- **W1: Open a situation** — pick or create; calibrated dashboard
  shows what changed, what's stale, and a single recommended
  next action.
- **W2: Ingest a document** — upload, OCR if needed, parse with
  layout awareness, chunk, embed, extract ACO entities,
  propose graph updates for human approval, persist.
- **W3: Pull live signal** — refresh feeds (ACLED/GDELT/etc.)
  per situation; new events propose graph updates; high-severity
  events generate alerts.
- **W4: Ask a question** — Ask PRAXIS calls the SKC retrieval
  orchestrator, returns a cited answer with the trace.
- **W5: Run a tool** — pick a tool, view "Why this output?"
  panel showing profile/domain/situation context used and the
  retrieval trace; output saved to `tool_runs` with provenance.
- **W6: Hold a brainstorming round** — invoke the Brainstorming
  Table on a question; multi-persona deliberation runs durably
  on Cloud Tasks; user reviews and accepts/rejects rows; final
  synthesis becomes a saved `Briefing`.
- **W7: Export a brief** — render a Word/PDF brief that
  preserves citations and the audit trail.
- **W8: Operate** — operator console shows job semaphores,
  failure rates, credits burn, audit trail.

## 2.4 What is implemented vs implied vs missing

| Capability | Status |
|---|---|
| AnalystProfile capture + persistence | ✅ Implemented |
| `withCalibration` middleware | ✅ Implemented |
| Domain taxonomy (11 live-editable domains) | ✅ Implemented |
| ACO 14-entity ontology + 72 relationships | ✅ Schema-level |
| Document upload + naive chunk + embed | ✅ Implemented |
| Document AI / OCR for scans | ❌ Missing |
| Layout-aware chunking | ❌ Missing |
| Translation (input/output) | ❌ Missing |
| Firestore native KNN vector search | ✅ Implemented |
| Vertex AI Vector Search 2.0 | ❌ Not used |
| Vertex AI Search / RAG Engine | ❌ Not used |
| Neo4j / FalkorDB / Spanner adapter | ✅ Code; only Neo4j wired in prod |
| Spanner Graph live | ❌ Not provisioned |
| GraphRAG retrieval (graph traversal as a retrieval step) | ⚠️ Partial — graph and vector layers exist; no joined retrieval policy |
| Operational spine (`tool_runs`, `background_jobs`, etc.) | ✅ Implemented |
| Vertex ADK Deep Research Agent | ⚠️ Code deployed; engine ID secret not yet mounted |
| Vertex AI Memory Bank integration | ❌ Not integrated |
| Durable, resumable agent workflows | ❌ Missing — synchronous only |
| Brainstorming Table multi-agent fan-out | ⚠️ Synchronous MVP shipped |
| Approval queue for graph/timeline mutations | ⚠️ `graph_updates` collection indexed; UI partial |
| Evaluation harness (extraction quality, faithfulness) | ❌ Missing |
| App Check enforcement on AI routes | ❌ Configured client-side, not server-enforced |
| Cloud Workflows pipeline orchestration | ❌ Hard-coded chain |
| Cloud Tasks fan-out for agents/embeddings | ⚠️ Queues provisioned; not wired |
| Sentry / OTel / structured logging | ✅ Wired (DSN dependent) |
| Stripe billing + credit metering | ✅ Implemented |
| Audit log + compliance docs | ⚠️ `audit_logs` collection + `docs/COMPLIANCE.md`; no formal SOC 2 work |

## 2.5 What to preserve, refactor, and not overbuild

**Preserve:**
- The `withCalibration` contract — it's the single best abstraction
  in the codebase. Every new agent/tool inherits calibration for free.
- The 4-layer SKC. The shape is right; the policies inside need work.
- The 14-type ACO + 72-relationship vocabulary. This is the
  intellectual moat — do not water it down.
- The `AnalystProfile` versioning + provenance contract. Required
  for defensible outputs; competitors do not have this.
- The dual-Cloud-Run topology with the model-string guard.
  Promotes Vertex over AI Studio in prod, falls back gracefully.
- Cloud Build pre-flight checks — the model-string guard and
  `audit:routes` are saving real bugs.

**Refactor (over the next 2–6 weeks):**
- Split `src/lib/ai/tools.ts` per category. 3,330 lines is too
  much; per-category files will let you bind situation context
  per tool group correctly (current bug: 11 tools in
  `createSituationBoundTools` was hardcoded to `DEMO_CONFLICT`).
- Replace synchronous `extract.py` LLM calls with structured
  output (Gemini `response_schema` or `instructor`).
- Promote Brainstorming Table from synchronous route handler to a
  LangGraph graph that runs on a Cloud Run Worker Pool consuming
  from the `praxis-agents` Cloud Tasks queue.
- Replace `pdf-parse` + `mammoth` direct calls with Document AI
  Layout Parser invocations from `on_document_uploaded`.
- Unify `tools/` and `tool-data/` Firestore collection paths.
  Migration script already exists.

**Do not overbuild yet:**
- Do **not** stand up a separate vector DB (Pinecone, Weaviate,
  Qdrant). Firestore native KNN for tenant-scoped retrieval +
  Vertex AI Search/RAG Engine for cross-corpus search is enough
  through 100k+ chunks per tenant.
- Do **not** add CrewAI or AutoGen on top of LangGraph — pick
  one durable runtime (LangGraph) and stick with it.
- Do **not** build a custom graph DB; Spanner Graph and Neo4j
  Aura cover the surface.
- Do **not** stand up a separate prompt-management tool
  (LangSmith, etc.) until traffic justifies it. Cloud Trace +
  Sentry + a `prompt_versions` Firestore collection is sufficient
  through Series A.

---

# 3. Google Cloud research and recommendations

## 3.1 AI / agentic / LLM layer

### Vertex AI Gemini API (primary)

- **Status:** Already in use via `@ai-sdk/google-vertex` 4.0.102 +
  `google-genai` 1.8 (backend). Vertex is the primary provider in
  prod (`AI_PROVIDER=vertex`).
- **Models in `providers.ts`:**
  - `gemini-3-flash-preview` (chat, light analysis)
  - `gemini-3.1-pro-preview` (Pro + Deep Think; 1M context, 65K
    output)
  - `gemini-embedding-2-preview` (768-dim multimodal)
- **Gemini 3.1 Flash-Lite** is now in public preview (April 2026)
  for high-volume / low-latency traffic. **Action:** add
  `MODEL_FLASH_LITE` constant in `providers.ts` and a
  `getLightweightModel()` helper for chat completions and
  classification tasks.
- **Structured output via `response_schema`** is the production
  path for ACO extraction. The Gemini API now accepts a Pydantic-
  compatible JSON schema directly. Use this in
  `backend/services/gemini_client.py` instead of regex JSON
  extraction.
- **Grounding with Google Search.** Already used by
  `getGroundedModel()`. Useful for actor enrichment, treaty status,
  source discovery. Watch quotas in BigQuery analytics.
- **Cost note (April 2026):** Gemini 3.1 Pro is $2/M input and
  $12/M output (≤200k tokens), Flash is materially cheaper.
  Calibrate Brainstorming Table to use Pro only for the Synthesis
  Chair node and Flash for everything else.

### Vertex AI Agent Engine (Sessions + Memory Bank)

- **GA since December 2025**, billing live since January 28, 2026.
  Pricing: $0.0864/vCPU-hr runtime + $0.25/1k events stored.
- **Already partially used** for Deep Research via
  `backend/agents/deploy.py` (ADK 3-phase: planner → researcher →
  synthesizer).
- **Memory Bank** (GA): Gemini-extracted long-term memories scoped
  per user, surviving across sessions. Solves the
  "remember my preferred sources, my red-line phrases, my analytical
  lens" problem cleanly without re-engineering the AnalystProfile.
- **Recommendation:**
  - **Deploy** the existing ADK agent to production (mount
    `praxis-agent-engine-id` in `cloudbuild.yaml` per the README in
    `backend/agents/README.md`).
  - **Add Memory Bank** scoped per Firebase UID. Read memories
    into `buildCalibratedContext` so every tool — not just the
    Deep Research Agent — sees the user's accumulated context.
  - **Watch out for memory poisoning** — Vertex docs explicitly
    flag prompt-injection risk on Memory Bank. Use Model Armor
    (Cloud's prompt-injection defense, GA late 2025) on every
    Memory Bank write. Today this is **not** wired in PRAXIS.
- **Where it fits in the architecture:** Vertex Agent Engine is
  best for the *external-facing* research agent (Deep Research,
  Source Scout) where you want sessions, memory, and managed
  scaling. Use **LangGraph** (see §4) for the *internal*,
  composable agent pipelines (Brainstorming Table, Conflict Graph
  builder, Approval Queue) where you want tighter control over
  state transitions and the ability to embed deterministic logic
  freely.

### Vertex AI Search / Discovery Engine

- Best for cross-situation, cross-document corpora — e.g., search
  across all UN Security Council resolutions, all ICC indictments,
  all OCHA situation reports.
- Provides grounded citations natively (not just text).
- **Recommendation:** Stand up a per-customer Vertex AI Search
  data store populated nightly by a Cloud Function reading from
  the corpus already in Firestore, as flagged in
  `docs/GCP_EXPANSION_PLAN_2026-04-26.md` (brick #3). Add it as an
  alternative retrieval layer in `searchSituationCorpus` selectable
  via `layers: ['vertex-search']`.
- **Don't** replace Firestore native KNN with this; that vector
  layer is the right answer for *per-situation* retrieval which
  is the dominant query pattern.

### Vertex AI RAG Engine

- **RAG Engine Serverless** is in public preview (April 2026).
  Removes the need to provision Spanner for the RAG database.
  Combines Document AI Layout Parser + auto-chunking + Vertex
  embedding + grounded retrieval as a managed pipeline.
- **Recommendation:** Use RAG Engine Serverless as the ingestion
  path for *public-domain* corpora (UN documents, treaty texts,
  ICC filings) that PRAXIS curates centrally. Use
  Firestore-native vectors for *user-uploaded* documents that
  must remain in the user's tenant.

### Vertex AI Vector Search 2.0

- GA in early 2026. Hybrid search (vector + full-text + semantic
  re-rank) in one parallel query, auto-embeddings, Private Service
  Connect, VPC-SC.
- **Recommendation:** Promote to "later" — it's the right answer
  if/when per-situation chunk counts exceed Firestore's effective
  KNN ceiling (around 100k vectors per index). Migration path is
  straightforward because the embedding model is the same and
  document chunks are already in Firestore.

### Vertex AI Evaluation (Gen AI evaluation service)

- GA support for evaluating partner models (Anthropic, Llama)
  added in 2026 release notes. Useful for benchmarking
  Claude Sonnet 4 vs Gemini 3.1 Pro on PRAXIS-specific tasks
  (extraction faithfulness, diplomatic-language scoring).
- **Recommendation:** Use this *in addition to* DeepEval/Ragas
  (see §4) — Vertex Eval is best for managed comparison runs at
  scale (e.g., monthly model selection); Ragas/DeepEval is best
  for CI gates.

### Gemini function calling and tool use

- AI SDK v6 already abstracts this. `src/lib/ai/tools.ts` registers
  tools; calls flow through `generateText({tools: ...})`.
- **Production hardening:** Add `Output.object({ schema: zodSchema })`
  on every tool that produces structured output. The audit script
  should be extended to enforce this.

## 3.2 Data / storage layer

### Firestore (Native)

- **Keep as the system of record.** Every tool output, profile
  version, situation, document, graph, embedding, and operational
  spine doc lives here. The owner-only rules + per-situation
  scoping is the right tenant-isolation default.
- **Indexes:** the `firestore.indexes.json` covers `tool_runs`,
  `background_jobs`, `system_events`, `notifications`, `alerts`,
  `data_ingestions`, `graph_updates`, `audit_logs`. Add an index
  for `embeddings` if any non-vector query is added.

### Cloud SQL / AlloyDB

- **Skip.** No relational query needs justify them. `pgvector` on
  AlloyDB is interesting but Firestore + Vertex Vector Search
  cover the retrieval surface.

### BigQuery

- Already used for `praxis_analytics` pipeline run logs.
- **Add:** sink `system_events` and `tool_runs` to BigQuery via a
  Pub/Sub-triggered Cloud Function for analytics + dashboards.
  Per-customer usage views, faithfulness regressions over time,
  feed-coverage gaps. `docs/GCP_EXPANSION_PLAN` brick #5.
- **Add:** GDELT BigQuery public dataset for historical trend
  queries — cheaper than re-polling the GDELT 2.0 API.

### BigQuery Vector Search and Graph Analytics

- BigQuery vector search is fine for *analytics* but not
  *retrieval* (latency too high for interactive). Skip for
  retrieval; consider for nightly batch analytics over the
  full corpus.
- BigQuery graph analytics is in preview but Spanner Graph is the
  better answer for production graphs.

### Cloud Storage

- **Keep.** `praxisbytacitus-praxis-uploads` is the right place
  for raw documents. Document AI ingests directly from GCS URIs.

### Vertex AI Vector Search

- See §3.1.

### Memorystore / Redis

- **Add when needed.** Useful for ephemeral session state, rate
  limiting, the LangGraph checkpointer. For MVP, Firestore-as-a-
  checkpointer or Spanner is fine.

### Pub/Sub

- Already in use. **Add** a `tool.runs.completed` topic and a
  `graph.update.proposed` topic to decouple the agent loop from
  consumers (analytics, notifications, audit).

### Cloud Tasks

- 3 queues already provisioned (`research`, `agents`, `embeddings`)
  but **not yet wired**. Wiring them up is mandatory for
  Brainstorming Table durable fan-out (`docs/AGENTIC_SYSTEM.md`),
  embedding refresh, and feed processing.

### Cloud Scheduler

- Already in use for cron. **Add** a daily eval-harness cron that
  runs DeepEval against the golden set and writes scores to
  BigQuery + an `eval_runs` Firestore collection.

## 3.3 Deployment / runtime layer

### Cloud Run

- **Keep.** Two services + one worker pool is the right shape.
- **Add:** a third Cloud Run service for the **LangGraph agent
  runtime** (call it `praxis-agents`). This service consumes from
  the `praxis-agents` Cloud Tasks queue, runs LangGraph graphs
  durably (checkpointer to Firestore or Spanner), and writes
  results back to Firestore. Min instances 0, max 20, timeout 1
  hour for long-running agent runs.

### Cloud Run Worker Pools

- `gdelt-poller` already runs as a Worker Pool (correct).
- **Add:** an `agent-worker` Worker Pool for non-HTTP background
  agents — e.g., per-situation continuous monitoring. Worker
  Pools (preview) are the right tool because they are
  pull-based and don't need an HTTP frontend.

### Cloud Build

- **Keep.** The pre-flight model-string guard and audit-routes
  step are the right shape. **Add** a `pytest` step against
  `backend/tests/` and a `vitest run` step. Currently neither
  runs in Cloud Build — only `audit-ai-routes.mjs` and
  `audit-gcp.mjs` do. Linux Cloud Build is the authoritative
  build environment per `CLAUDE.md`; CI tests should run there.
- **Add** a DeepEval / Ragas eval step gated by a substitution
  (`_RUN_EVALS=1`) so PRs run the golden-set extraction eval.

### Artifact Registry

- **Keep.** `us-central1-docker.pkg.dev/praxisbytacitus/praxis/` is
  the right path. Add a `praxis-agents` image when the LangGraph
  service ships.

### Secret Manager

- 5 secrets today. **Add:**
  - `praxis-agent-engine-id` (already noted in `cloudbuild.yaml`
    comments)
  - `praxis-langsmith-api-key` if LangGraph debugging on LangSmith
    is enabled
  - `praxis-document-ai-processor-id` for the layout parser
  - `praxis-sentry-dsn` (verify whether one exists today)

### Firebase Hosting / Firebase App Check

- **Keep Auth.** Don't switch to Identity Platform unless you need
  multi-tenant org boundaries (you mostly don't — `users/{uid}/`
  isolation handles it).
- **App Check** is configured client-side (the reCAPTCHA Enterprise
  key is in `cloudbuild.yaml` build args). **Action:** enforce App
  Check on `/api/ai/*` routes via `withAuth` extension. This is
  one of the highest-ROI security changes available.

### Cloudflare + Cloud Run custom domains

- `praxis.tacitus.me` is configured. **Keep** Cloudflare in front
  for DDoS, caching of static assets, and the ability to inject
  WAF rules. Don't terminate TLS at Cloudflare — terminate at
  Cloud Run so App Check / Firebase tokens are end-to-end.

### IAM best practices

- Verify that the Cloud Run runtime SA has *only*:
  - `roles/aiplatform.user`
  - `roles/datastore.user`
  - `roles/secretmanager.secretAccessor` (scoped to specific
    secrets via Secret-level IAM)
  - `roles/storage.objectAdmin` scoped to the uploads bucket
  - `roles/pubsub.publisher` on specific topics
- Run `gcloud projects get-iam-policy praxisbytacitus` and
  capture the diff in `docs/COMPLIANCE.md`.

## 3.4 Observability / security / governance

### Cloud Logging

- Already used via `logging_config.py` (structured JSON) and
  `@google-cloud/logging-winston` 6.0 (frontend). **Keep.**

### Error Reporting

- Picks up automatically from Cloud Logging structured errors and
  Sentry. **No change.**

### Cloud Monitoring + Alerts

- `infrastructure/monitoring-alerts.sh` exists. **Verify** that the
  alerts are actually deployed:
  - 5xx rate > 1% over 5 min on `praxis-frontend` and
    `praxis-backend`
  - Cloud Run instance count saturating
  - Pub/Sub topic backlog over threshold
  - Firestore rule reads denied (security signal)
  - GDELT poller heartbeat missing

### Cloud Trace

- OpenTelemetry is wired (`@google-cloud/opentelemetry-cloud-trace-exporter`).
  **Verify** end-to-end traces propagate through the
  frontend → backend FastAPI call (the `RequestContextMiddleware`
  in `backend/main.py:74` does propagate the `X-Cloud-Trace-Context`
  header — good).

### Cloud Audit Logs

- Already enabled at the project level by default. **Add**
  Data Access logs for Firestore and BigQuery if SOC 2 work
  begins.

### Security Command Center

- Free tier is fine through pilot. Premium tier when SOC 2 work
  begins.

### reCAPTCHA Enterprise + App Check

- Key is in `cloudbuild.yaml`. **Enforce** App Check on the
  client (`firebase` client) and verify on the server in
  `withAuth`. One file change.

### Model Armor

- Google's prompt-injection / output-safety service. GA late
  2025. **Recommendation:** wire on every Memory Bank write and
  every untrusted-input AI route (URL ingestion, document text,
  feed content). Today: **not used.**

### VPC Service Controls

- For UN procurement / sovereign tenant: VPC-SC the project
  perimeter so all Vertex AI / Firestore / Cloud Storage reads
  must originate inside the VPC. Add when first enterprise
  contract requires it.

### Data retention and deletion

- Firestore TTL: `infrastructure/setup-ttl.sh` exists. **Verify**
  it's applied to `system_events` (90 days), `tool_runs`
  (180 days), `notifications` (30 days after `read=true`).
- Cloud Storage lifecycle: add a rule that archives uploaded
  documents to Coldline after 90 days inactive.

### PII handling

- AnalystProfile contains identity / organization / regions —
  treat as PII per `docs/COMPLIANCE.md`. Memory Bank writes
  inherit this; document the data flow in a DPIA.

### Prompt logging risks

- Sentry currently sets `send_default_pii=False`
  (`backend/main.py:34`) — good. Verify the AI SDK's prompt
  serialization in error traces is also redacted. Add a redaction
  middleware if not.

### Model output auditability

- Every tool output is supposed to write to `tool_runs` with
  `profileVersion`, `domainVersion`, `modelUsed`, `promptVersion`.
  **Audit:** the audit script does not check this. Extend the
  `audit-ai-routes.mjs` to assert this contract.

---

# 4. Open-source libraries — research and recommendations

This section deliberately ignores trendy tools and asks "what
specifically helps PRAXIS?" Each candidate is evaluated against the
existing code.

## 4.1 Agentic frameworks

### LangGraph — **adopt now**

- Python (and TS, but the agent runtime should be Python alongside
  the existing FastAPI service). 1.0 GA late 2025; production
  deployments at Uber, JPMorgan, BlackRock, Cisco, LinkedIn,
  Klarna. v1.1 (Dec 2025) added retry middleware + content
  moderation middleware.
- Native: durable execution (checkpoints survive process restart),
  human-in-the-loop via `interrupt_before`, comprehensive memory
  (short-term in state + long-term via custom checkpointer),
  streaming, conditional branching, parallel fan-out.
- Maps cleanly to the `docs/AGENTIC_SYSTEM.md` agent registry:
  Situation Analyst, Source Scout, Graph Cartographer, Timeline
  Editor, Media Analyst, Legal Analyst, Humanitarian Analyst, Red
  Team Critic, Synthesis Chair → each becomes a node.
- Drawbacks: Python only on the durable side (TS LangGraph is
  catching up), checkpointer choice is a real decision (Postgres
  recommended; Firestore custom checkpointer is feasible).
- **Recommendation:** Adopt for all multi-step internal pipelines.
  New module `backend/agents/langgraph/` with one graph per agent
  family. Checkpoints in Firestore via a thin custom checkpointer
  (write to `users/{uid}/situations/{sitId}/agent_runs/{runId}/
  checkpoints/{ckptId}`) so the existing tenant-isolation
  invariant holds.

### Google ADK — **keep for the Deep Research Agent only**

- Already used in `backend/agents/deep_research/`. The Vertex AI
  Agent Engine + ADK + Memory Bank story is strong for
  outward-facing research agents.
- **Don't expand** ADK beyond Deep Research. Use LangGraph for
  internal pipelines because:
  - LangGraph's checkpoint model is stricter and more debuggable
    than ADK's session-event API for non-conversational flows.
  - ADK forces you into the Vertex Agent Engine runtime; LangGraph
    runs anywhere.
  - The Brainstorming Table needs deterministic fan-out + a
    structured output table per row, which is more naturally
    expressed in LangGraph state than in ADK conversation events.

### LangChain — **use as a thin tool/integration library, not a runtime**

- Already implicitly used via the AI SDK ecosystem. LangChain has
  good document loaders and the `LLMGraphTransformer` referenced
  in the GraphRAG reference architecture.
- **Recommendation:** import individual LangChain utilities where
  useful (e.g., `langchain_text_splitters.RecursiveCharacterTextSplitter`
  for fallback chunking, `langchain_google_spanner` for the
  Spanner Graph integration). Do **not** make LangChain the
  primary orchestration framework.

### LlamaIndex — **skip**

- Strong for RAG-first apps; Vertex AI Search/RAG Engine + custom
  retrieval covers PRAXIS needs better and avoids a second
  framework layer.

### CrewAI — **skip**

- Role-based crew metaphor is appealing for the Brainstorming
  Table on the surface, but: less control than LangGraph, weaker
  durability story, less mature production track record. The
  Brainstorming Table needs durable HITL — LangGraph wins.

### AutoGen / Microsoft Agent Framework — **skip**

- Microsoft has shifted strategic focus to the Microsoft Agent
  Framework (Azure-native). Not applicable for a GCP shop.

### Semantic Kernel — **skip** (Azure-native).

### Haystack — **skip** unless a need arises later.

### PydanticAI — **adopt for typed-tool-call agents**

- Pydantic-team agent framework. Type-safe, dependency-injected,
  validated outputs, integrated with Logfire for observability.
- v0.x but production-deployable; v1.0 expected.
- **Recommendation:** Use PydanticAI inside LangGraph nodes that
  need typed tool calls and dependency injection (e.g., the
  Conflict Graph builder needs a `GraphService` dependency, the
  Source Scout needs a `FeedClient` dependency). This is the
  highest-quality way to write agent nodes that have to call
  domain-specific tools with full type safety.

### MCP-related tooling — **adopt selectively**

- The Anthropic Model Context Protocol is increasingly the lingua
  franca for agent ↔ tool integration. Spanner Graph already has
  an MCP Toolbox; Cognee, Mem0, etc. ship MCP servers.
- **Recommendation:** expose a small **PRAXIS MCP server** that
  publishes the SKC retrieval tools, ACO entity lookup, graph
  query, and tool-output readers. Use cases: external Claude /
  Cursor / Continue developer use of PRAXIS context, future
  customer-side SDKs.

### OpenAI Agents SDK — **skip** (not a GCP fit).

### Recommended agent stack

- **Vertex AI ADK + Memory Bank** for the *external-facing*
  Deep Research Agent (already deployed).
- **LangGraph** as the durable, stateful runtime for *internal*
  agent pipelines (Brainstorming Table, Conflict Graph builder,
  Approval Queue, Continuous Monitor).
- **PydanticAI** for typed nodes inside LangGraph graphs that
  need dependency injection.
- **Instructor** for one-shot structured extraction inside any
  Python module that calls Gemini directly (the
  `gemini_client.py` upgrade).
- **MCP server** as a thin export surface for tool reuse.

This gives PRAXIS a single durable runtime (LangGraph), a single
source of truth for typed extraction (Instructor + PydanticAI on
Pydantic schemas), and a managed enterprise surface (Vertex Agent
Engine) where it makes sense.

## 4.2 RAG / retrieval / search

### LlamaIndex retrievers / LangChain retrievers — partial adoption

- Useful as building blocks, not as the primary retrieval system.

### Chroma / Qdrant / Weaviate / Milvus / FAISS — **skip**

- Firestore native KNN + Vertex AI Vector Search 2.0 cover the
  surface without adding another store. Migration cost from
  Firestore vectors to a separate DB only justifies itself past
  ~1M vectors per tenant, which PRAXIS won't hit for a long time.

### pgvector — **skip** (no Postgres in stack).

### Neo4j vector indexes — **keep optional**

- Useful when Neo4j is already the graph store. Tenant-isolated
  Neo4j is the answer for power users who want their own dedicated
  Neo4j instance — already supported in `graph_adapter.py`.

### Vertex AI Vector Search 2.0 — **add later** at scale (see §3.1).

### BigQuery vector search — **skip for retrieval**, **add for
analytics**.

### Spanner Graph + Spanner full-text + Spanner vector — **adopt as
the production graph + retrieval layer**

- Spanner Graph supports ISO GQL, full-text search, vector search,
  and SQL all in one consistent store. Native LangChain integration
  for GraphRAG. Per `setup-spanner.sh`, the infrastructure is
  scripted but not provisioned.
- **Recommendation:**
  - For the multi-tenant production tier, provision a Spanner
    instance with PRAXIS as the database.
  - Use Spanner Graph for the canonical conflict graph (one schema,
    tenant-scoped via row-level security).
  - Use Spanner vector for the per-tenant document vectors at
    scale.
  - Keep Firestore for transactional state (situations, profiles,
    tool runs, the operational spine) — the two stores complement
    each other.
- The `graph_adapter.py` already abstracts Neo4j / FalkorDB /
  Spanner; the adapter is the right place to add Spanner-as-RAG
  support.

### Hybrid retrieval architecture for PRAXIS — recommended

```
┌──────────────────────────────────────────────────────┐
│ Per-tenant retrieval (default; default tier)         │
│  - Firestore vector layer (768-dim COSINE)           │
│  - Firestore tool-output layer                       │
│  - Firestore feed layer (TTL-cached)                 │
│  - Firestore graph layer or Neo4j (per user setting) │
└──────────────────────────────────────────────────────┘
                          │
                          ▼ when retrieval miss / scale-out:
┌──────────────────────────────────────────────────────┐
│ Cross-tenant / public-corpus retrieval               │
│  - Vertex AI Search data store (UN docs, treaties,   │
│    ICC filings, ACLED schema)                        │
│  - Vertex AI RAG Engine Serverless                   │
└──────────────────────────────────────────────────────┘
                          │
                          ▼ enterprise tier:
┌──────────────────────────────────────────────────────┐
│ Spanner Graph + Spanner vector (replaces Firestore   │
│ graph + vector when tenant exceeds Firestore-native  │
│ KNN ceiling, or when SLA / VPC-SC requires it)       │
└──────────────────────────────────────────────────────┘
```

This is selectable in the `retrieval-orchestrator.ts` policy
based on tenant tier.

## 4.3 Knowledge graph / graph analytics

### Neo4j — **keep as the power-user / on-prem option**

- Already supported via `neo4j-driver` 6.0.1 + adapter. Excellent
  Cypher tooling, Bloom UI, tenant-per-database mode.
- For users who insist on running their own graph DB, Neo4j Aura
  (managed) is the path. PRAXIS already hands them this lever in
  Settings.

### FalkorDB — **keep as the dev / lightweight option**

- Already in `docker-compose.yml`. Useful for local dev and
  early customer evaluation. Don't promote to production unless
  a customer specifically needs it.

### Spanner Graph — **adopt as production default**

- See §4.2.

### NetworkX — **keep**

- Already used in the pipeline (`graphify_tacitus/build.py`,
  `cluster.py`). Right tool for in-memory analytics during the
  build stage.

### Graphology (TS) — **adopt for the frontend**

- Pairs with Sigma.js for graph viz. Provides centrality, shortest
  path, community detection in JS — a clean upgrade from the
  custom `firestore-graph-analytics.ts` for client-side analytics.

### igraph / graph-tool / cuGraph / DGL / PyTorch Geometric — **skip**

- Overkill for current scale. Revisit when graph node counts per
  tenant exceed 100k or when a research project needs GNN
  predictions on the conflict graph.

### Graphistry — **skip** (commercial visualization service).

### KùzuDB / ArangoDB / Memgraph / TypeDB — **skip** in favor of
Spanner Graph + Neo4j coverage.

### Cytoscape.js — **option for a "graph review" admin view**

- Strongest algorithm library among JS graph viz options. Best
  choice for a heavy admin / curation view (e.g., the Approval
  Queue UI for graph-update proposals where the user needs
  centrality + community + per-edge inspection).

### React Flow — **option for the Brainstorming Table layout**

- Different problem domain — node-based diagrams with custom
  components. Useful for pipeline visualizations (showing
  agent state graphs to power users). Not a fit for the conflict
  graph itself.

### Sigma.js + Graphology + react-sigma — **adopt as the primary
conflict-graph canvas**

- WebGL rendering, scales to 100k+ nodes. Graphology data layer
  separates graph data from rendering. `@react-sigma/core` +
  `@react-sigma/layout-forceatlas2` cover the React + force layout
  cleanly.
- Drawbacks: documentation thinner than Cytoscape's; need a custom
  styling layer to map ACO entity types to colors / icons.
- **Recommendation:** keep D3 SVG components for *small* visual
  primitives (faction sparkbars, escalation gauges, the timeline
  ribbon) but build the main `ConflictGraphCanvas` on Sigma.

### D3 — **keep for analytics / small charts**

- Already used. Don't rip it out; reduce its scope to small
  visualizations.

### Recommended graph stack

| Tier | Storage | Frontend | Use case |
|---|---|---|---|
| MVP / default tier | Firestore subcoll graph + JS analytics | D3 (small) + Sigma.js (canvas) | Most users |
| Power user tier | Neo4j Aura | Sigma.js + (optional) Cytoscape inspector | Users who want Cypher |
| Enterprise tier | Spanner Graph + Spanner vector | Sigma.js + Cytoscape inspector | Multi-region, VPC-SC, SLA |

## 4.4 Extraction / NLP / structured output

### Gemini structured output via `response_schema` — **adopt**

- Pydantic / Zod-compatible schema enforcement at the API level.
  Replaces the regex JSON extraction in
  `backend/graphify_tacitus/extract.py`.

### Pydantic — **already in use; expand**

- Used for FastAPI request models and `pydantic-settings` config.
  Extend to validate every LLM-produced artifact in the backend.

### Instructor — **adopt for Python LLM calls**

- 3M+ monthly downloads, 11k stars. Patches the Gemini / Anthropic
  / OpenAI clients with retry + Pydantic validation. One-line
  upgrade to `gemini_client.py`. Cap `max_retries=2` to avoid
  retry-cost runaway.

### Outlines / Guidance — **skip**

- Token-level constrained generation; only useful when
  `response_schema` is unavailable. Gemini supports
  `response_schema` natively.

### Guardrails AI — **skip**

- Heavyweight; covers a problem already solved by `response_schema`
  + `instructor` + Pydantic.

### BAML — **skip for now**

- Powerful (Schema Aligned Parsing recovers from garbled output)
  but introduces a separate language and code-generator. Revisit
  when extraction edge cases become a real cost.

### spaCy — **skip**

- LLM extraction has subsumed traditional NER for PRAXIS.

### GLiNER — **skip**

- Same as spaCy; gemini-3-flash-preview is cheaper per token now.

### sentence-transformers — **skip**

- Vertex embedding model is the production embedding path; no
  need for self-hosted.

### RapidFuzz — **adopt** for entity resolution

- Python fast fuzzy string matching. Useful in the entity-resolver
  step (canonical ID generation, near-duplicate actor detection).
  Already light enough to add freely.

### DuckDB — **skip** (no analytics workload that needs it).

### Polars — **skip** (pandas is already used minimally).

### pandas — **keep**, used inline.

### Apache Tika — **skip** (Document AI subsumes).

### Unstructured.io — **skip** (Document AI Layout Parser
subsumes; Tensorlake / Reducto are alternatives if Document AI
becomes too expensive).

### Docling / marker — **skip** (Document AI subsumes).

### PyMuPDF — **skip** (fall back from Document AI for non-PDF
edge cases only).

### pdfplumber — **skip**.

### python-docx — **skip** (already using `mammoth` in TS for
docx; Document AI for production).

### BeautifulSoup — **skip** (use `trafilatura` for HTML).

### trafilatura — **adopt** for URL ingestion

- Already in `package.json` overrides as a transitive dep. Use
  it explicitly in `extract_from_url` instead of the regex
  HTML stripper in `backend/graphify_tacitus/extract.py:97`.

### Firecrawl — **already in use**

- Frontend `@mendable/firecrawl-js` 4.16. Good fallback for
  JS-rendered pages.

### Ingestion stack recommendation

- **PDF / DOCX / PPTX / XLSX / scanned images:** Document AI
  Layout Parser (Gemini-powered, GA April 2026), invoked from
  `on_document_uploaded` Cloud Function. Falls back to
  `pdf-parse` / `mammoth` only if Document AI fails or quota
  exceeded.
- **HTML / URLs:** Firecrawl (already wired) for JS-rendered
  pages; trafilatura for static HTML.
- **Plain text / markdown:** read directly.
- **CSVs:** parse with `papaparse` (already in package via
  AI SDK ecosystem) or backend `csv` module.
- **Email (.eml / .msg):** add `mailparser` (TS) when needed —
  not a current priority.
- **UN reports / legal filings / treaty texts:** use Document AI
  Layout Parser then run a *pre-extraction* normalization pass
  (the Layout Parser preserves the table structure of UNSC
  resolutions correctly). Custom Form Parser processor for
  high-volume specific forms.
- **Meeting notes / transcripts:** treat as plain text but pass
  the speaker tags (already known from `CONCORDIA` integration)
  as metadata into the extraction prompt.

## 4.5 Evaluation / testing

### DeepEval — **adopt as the CI gate**

- pytest-compatible LLM evaluation. Provides faithfulness,
  contextual recall/precision/relevancy, answer relevancy, and
  custom metrics.
- **Recommendation:** wire DeepEval into Cloud Build as a gated
  step (substitution `_RUN_EVALS=1`). Run against:
  - Extraction golden set: 50 hand-curated UN / Crisis Group / ICC
    paragraphs with the expected ACO entity set, scored on
    precision / recall over node and edge sets.
  - Ask-PRAXIS faithfulness set: 30 (question, expected_sources,
    expected_answer_facts) tuples.
  - Tool output schema-conformance: every AI route that
    `Output.object()` should pass schema validation 100% of the
    time on a 20-prompt corpus per tool.

### Ragas — **adopt for retrieval-quality scoring**

- Pinning a version is essential per the literature (NaN-on-bad-
  judge-output is a known footgun). Use Ragas for context
  precision/recall/faithfulness on the SKC retrieval orchestrator.

### TruLens / Phoenix / Arize — **skip** for now.

- Vertex AI Trace + Cloud Trace + Sentry cover observability
  through Series A.

### LangSmith — **adopt only if LangGraph adoption needs it**

- LangSmith integrates natively with LangGraph for tracing /
  replay. Optional but high-value when debugging long-running
  graphs. Set `LANGSMITH_TRACING=true` per-run via env, gated
  by a per-developer flag so production runs don't exfiltrate
  traces.

### OpenTelemetry — **already adopted; verify end-to-end traces**.

### promptfoo — **adopt for prompt regression**

- Excellent for diffing prompt changes against an expected
  output set. Use for the `src/lib/ai/prompts/*.ts` files —
  any change to the diplomatic / system / report prompts
  triggers a promptfoo run in CI.

### pytest — **already adopted**.

### Playwright — **already adopted**; expand the smoke set
beyond `golden-path.spec.ts` and `capabilities-api.spec.ts` to
cover the top-10 tools.

### Vitest — **already adopted**; require it to run in Cloud Build.

### Cypress / Jest — **skip** (Playwright + Vitest cover the
surface).

### Sentry — **already adopted**.

### Recommended evaluation stack

```
CI gate (Cloud Build):
  pytest + DeepEval (extraction quality, faithfulness)
  vitest run (unit + types)
  playwright smoke (top-10 tools)
  promptfoo (prompts in src/lib/ai/prompts/*)
  audit-ai-routes.mjs (calibration contract)
  audit-gcp.mjs (resource sanity)

Daily cron (Cloud Scheduler → /api/cron/run-evals):
  DeepEval extraction golden set → BigQuery + Firestore eval_runs
  Ragas retrieval-quality set → BigQuery + Firestore eval_runs

Weekly (manual trigger):
  Vertex AI Eval comparison: Gemini 3.1 Pro vs Claude Sonnet 4
  on Brainstorming Table synthesis

Per-PR (manual):
  LangSmith trace replay for any LangGraph change
```

---

# 5. Recommended PRAXIS architecture

This section is the "where it should land" view, written so a coding
agent can implement against it without ambiguity.

## 5.1 Frontend

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router (already) | Migrate `middleware.ts` → `proxy.ts` per Next 16 deprecation |
| Language | TypeScript 5.9 (already) | |
| State | Zustand 5 (already) + React Query 6 (add) | React Query for server state caching of tool outputs |
| Styling | Tailwind 4 + Radix UI (already) | |
| Auth UI | Firebase Auth (already) | Add App Check enforcement |
| Conflict graph viz | **Sigma.js + Graphology + react-sigma** (new) | replaces D3 force-graph for the main canvas |
| Dashboards / charts | D3 (kept; reduce scope) + Recharts (add if needed) | |
| Map | Leaflet + react-leaflet (already) | |
| Upload UI | dropzone + Cloud Storage signed-URL upload (already) | Add presigned upload for files >10 MB |
| Chat / streaming | AI SDK v6 `streamText` (already) | |
| Forms | Radix + custom hooks (already) | Consider `react-hook-form` only if forms grow |
| Animations | Framer Motion (already) | |
| Markdown render | `react-markdown` + `rehype-highlight` (already) | |

## 5.2 Backend

| Layer | Choice | Notes |
|---|---|---|
| Frontend Cloud Run | Next.js standalone (already) | |
| Backend Cloud Run | Python 3.11 + FastAPI (already) | |
| Agent Cloud Run | **New service** `praxis-agents` | LangGraph + Cloud Tasks consumer |
| Long-running jobs | Cloud Tasks → `praxis-agents` Cloud Run | Brainstorming Table, embedding refresh |
| Pipeline orchestration | **Cloud Workflows** (new) | replaces hard-coded chain in `pipeline.py` |
| Continuous monitors | Cloud Run Worker Pool (already for GDELT; add agent-monitor pool) | |
| Model calling | `@ai-sdk/google-vertex` + `google-genai` + `instructor` | Provider abstraction is correct; add `instructor` for Py |
| Extraction | Gemini `response_schema` + Pydantic validation | Fix `extract.py` |
| Validation | Pydantic v2 + Zod | |
| Graph persistence | Firestore default; Neo4j optional; Spanner Graph for enterprise | `graph_adapter.py` is the right abstraction |
| Search / retrieval | SKC + Vertex AI Search alt-layer | |
| Export | `docx` (already) + `jspdf` (already) | Add a server-side Cloud Function for high-fidelity briefs |

## 5.3 Cloud

| Service | Purpose |
|---|---|
| Cloud Run (3 services) | frontend, backend, agents |
| Cloud Run Worker Pool (2) | gdelt-poller (existing), agent-monitor (new) |
| Cloud Workflows | Pipeline orchestration |
| Cloud Tasks (3 queues) | research, agents, embeddings (already provisioned) |
| Pub/Sub (7 topics) | Existing 5 + `tool.runs.completed`, `graph.update.proposed` |
| Cloud Functions (Gen 2) | `on_situation_created`, `on_document_uploaded` (now Document-AI-enabled), `gdelt_poller` (becomes Worker Pool) |
| Cloud Scheduler | Existing 3 + `eval-harness-daily` |
| Firestore | System of record |
| Cloud Storage | Documents, exports, eval golden sets |
| BigQuery | Analytics + eval results sink |
| Vertex AI | Gemini 3.1 Pro/Flash/Flash-Lite, Embedding 2, Agent Engine, Vector Search 2.0 (later), Search/RAG Engine |
| Spanner Graph | Production graph (enterprise tier) |
| Document AI | Layout Parser processor |
| Cloud Translation | i18n input/output |
| Secret Manager | Existing 5 + `praxis-agent-engine-id`, `praxis-document-ai-processor-id`, `praxis-sentry-dsn`, `praxis-langsmith-api-key` (optional) |
| reCAPTCHA Enterprise + App Check | Server-enforced |
| Cloud Logging / Trace / Monitoring | Already wired |
| Cloud Audit Logs / Security Command Center | Default + premium when SOC 2 begins |
| Model Armor | Wrap Memory Bank + untrusted-input AI routes |
| VPC Service Controls | Add when first enterprise contract requires |

## 5.4 AI / agent layer

| Decision | Choice |
|---|---|
| Primary model provider | Vertex AI |
| Standard model | `gemini-3-flash-preview` (chat, terminology, lightweight analysis) |
| Lightweight model (NEW) | `gemini-3.1-flash-lite-preview` (classification, routing, validation) |
| Pro model | `gemini-3.1-pro-preview` (structured tool output, dossiers, reports) |
| Deep-think model | `gemini-3.1-pro-preview` with `thinking_level: 'high'` |
| Diplomatic / nuance model | Claude Sonnet 4 (`@ai-sdk/anthropic`) → Pro fallback |
| Embedding model | `gemini-embedding-2-preview` 768-dim |
| Structured output | Gemini `response_schema` + Pydantic / Zod |
| Agent runtime (internal) | LangGraph |
| Agent runtime (external research) | Vertex AI Agent Engine + ADK |
| Agent memory (external) | Vertex AI Memory Bank |
| Agent memory (internal) | LangGraph state + Firestore `agent_runs` checkpoint collection |
| Tool calling abstraction | AI SDK v6 `tool({...})` for TS, PydanticAI for Py inside LangGraph |
| Human-in-the-loop | LangGraph `interrupt_before` checkpoints + Approval Queue UI |
| Evaluation | DeepEval + Ragas + Vertex AI Eval (managed) |
| Observability | Cloud Trace + Sentry + LangSmith (gated) |

## 5.5 Data model — proposed schemas

These are recommended Firestore document shapes. Existing fields are
preserved; new fields are marked **(NEW)**.

### `users/{uid}/profile/analyst` (existing — preserve)

```ts
interface AnalystProfile {
  identity: { role, seniority, organisation, displayName }
  perspective: {
    mandateChips, analyticalLenses, regionsOfFocus,
    audience, primaryDomain, secondaryDomains
  }
  workingStyle: {
    preferredSources, outputLanguage, redLinePhrases, writingTone
  }
  meta: { version, completedAt, skipCount, embedding, embeddingRefreshedAt }
}
```

### `users/{uid}/profile_versions/{vN}` (existing) — immutable
snapshot.

### `users/{uid}/situations/{situationId}` (existing — extend)

```ts
interface Situation {
  id, name, type, region, riskScore, glaslStage,
  status, actors[], domain, domainConfidence,
  domainOverriddenByUser, domainClassifiedAt,
  createdAt, updatedAt, ownerUid,
  // NEW
  graphSnapshotIds: string[],   // pointer list
  lastIngestionAt: timestamp,
  freshnessScore: number,        // computed from feeds + docs
  recommendedNextAction: { kind, payload, reasonedAt },
  semaphore: 'green' | 'yellow' | 'red' | 'purple',
}
```

### `users/{uid}/situations/{sitId}/documents/{docId}` (existing — extend)

```ts
interface SourceDocument {
  id, title, fileType, size,
  uploadedAt, status, entityCount,
  text,                           // legacy single-blob (keep for now)
  // NEW
  storagePath: string,           // gs:// URI
  parserUsed: 'pdf-parse'|'mammoth'|'documentai-layout'|'plain'|'firecrawl',
  parserVersion: string,
  language: string,              // BCP-47, detected at parse time
  layout: {                       // populated by Document AI
    pageCount, hasImages, hasTables, hasForms,
  },
  translations: { [lang]: { storagePath, translatedAt } },
  classification: { domain, confidence, rationale },
  contentHash: string,           // sha256 for dedup
  ingestionRunId: string,
  provenance: {
    sourceUrl, source, license, retrievedAt, fetchedBy,
  },
}
```

### `users/{uid}/situations/{sitId}/documents/{docId}/chunks/{chunkId}` (extend `embeddings/`)

Keep the existing `embeddings/` collection. Replace the chunkId
generation with a stable `${docId}-p${pageNum}-c${chunkInPage}` so
chunks survive re-ingestion. Add fields:

```ts
interface DocumentChunk {
  id, embedding, text,
  sourceDocId, pageNumber, chunkIndex,
  // NEW
  layoutType: 'heading'|'paragraph'|'list_item'|'table'|'figure_caption',
  ancestorHeadings: string[],    // from Document AI Layout Parser
  charSpan: [number, number],
  entityReferences: string[],
  ingestionRunId: string,
  createdAt, updatedAt,
}
```

### `users/{uid}/situations/{sitId}/extraction_runs/{runId}` (NEW)

```ts
interface ExtractionRun {
  id, situationId,
  inputs: { docIds: string[], urls: string[], textBlobs: string[] },
  modelUsed: string,
  promptVersion: string,
  schemaVersion: string,
  startedAt, completedAt,
  status: 'queued'|'running'|'succeeded'|'failed'|'partial',
  metrics: { nodesProposed, edgesProposed, conflicts, dedupedNodes },
  approvalQueueIds: string[],
  failureReason?: string,
  costUsd: number,
}
```

### `users/{uid}/situations/{sitId}/graph_snapshots/{snapshotId}` (NEW; index already exists)

```ts
interface GraphSnapshot {
  id, situationId,
  asOf: timestamp,
  triggerEvent: 'extraction'|'human-edit'|'feed-ingest'|'auto-merge',
  triggerRunId: string,
  nodesAddedIds, nodesUpdatedIds, nodesRemovedIds,
  edgesAddedIds, edgesUpdatedIds, edgesRemovedIds,
  metricsBefore, metricsAfter,
  approvedBy: string,
  approvedAt: timestamp,
  rollbackOf?: string,
}
```

### `users/{uid}/situations/{sitId}/graph/main/nodes/{nodeId}` (existing — extend)

```ts
interface ACONode {
  id, primitive_type,             // 14 ACO types
  label, summary,
  // typed metadata depending on primitive_type
  metadata: object,
  // NEW
  confidence: 'EXTRACTED'|'INFERRED'|'AMBIGUOUS'|'ASSESSED',
  validUntil?: timestamp,         // temporal
  validFrom?: timestamp,
  validationStatus: 'proposed'|'approved'|'rejected'|'auto',
  proposedByRunId: string,
  approvedByUid?: string,
  approvedAt?: timestamp,
  citations: Array<{ docId, chunkId, sourceUrl, quote, confidence }>,
  embedding?: number[],           // 768-dim, for Cypher-like vector lookups
  centrality: { degree, betweenness, eigenvector },
  domainTags: string[],
  modelUsed: string,
  promptVersion: string,
  createdAt, updatedAt,
}
```

### `users/{uid}/situations/{sitId}/graph/main/edges/{edgeId}` (existing — extend)

```ts
interface ACOEdge {
  id, source, target, relation,    // one of 72 typed relationships
  // NEW
  confidence,
  validFrom, validUntil,
  validationStatus, proposedByRunId, approvedByUid, approvedAt,
  citations,
  weight: number,                  // strength / frequency
  contradictedBy?: string[],       // edge ids that contradict this
  reinforces?: string[],
  modelUsed, promptVersion,
}
```

### `users/{uid}/situations/{sitId}/graph_updates/{proposalId}` (existing — extend)

Approval queue. Already indexed at the collection-group level.

```ts
interface GraphUpdateProposal {
  id, situationId, kind: 'add_node'|'update_node'|'remove_node'|'add_edge'|'update_edge'|'remove_edge'|'merge_nodes',
  proposedAt, status: 'pending'|'approved'|'rejected'|'auto-applied',
  proposedByAgent: string,
  payload, citations,
  reviewerUid?, decidedAt?, decisionRationale?,
}
```

### `users/{uid}/situations/{sitId}/agent_runs/{runId}` (NEW)

LangGraph durable agent runs.

```ts
interface AgentRun {
  id, situationId, agentName,
  graphVersion: string,            // langgraph compiled hash
  startedAt, completedAt,
  status: 'queued'|'running'|'awaiting_human'|'succeeded'|'failed'|'cancelled',
  threadId: string,                // LangGraph thread for resume
  inputState, finalState?,
  checkpoints: subcollection,
  cost: { tokensIn, tokensOut, usd },
  trace: { spanId, parentSpanId },
  approvalProposalIds?: string[],
  outputArtifactRef?: string,      // pointer to a brief / report / table
  modelUsed, promptVersion,
}
```

### `users/{uid}/situations/{sitId}/tool_runs/{runId}` (existing — extend)

```ts
interface ToolRun {
  id, uid, situationId, toolId,
  startedAt, status, completedAt,
  // NEW
  profileVersion, domainVersion, modelUsed, promptVersion,
  retrievalTrace: Array<{ layer, query, hits[] }>,
  citations,
  outputRef: string,               // pointer to tool-data/{toolId}
  evalScores?: { faithfulness, answerRelevancy, contextRelevancy },
  costUsd, tokensIn, tokensOut,
  errorRef?: string,
}
```

### `users/{uid}/situations/{sitId}/tools/{toolId}` (existing) — canonical
output cache. **Migration:** unify `tool-data/` and `tools/` into a
single canonical path (already partial; finish per
`scripts/migrate-tool-outputs-to-tools.ts`).

### `eval_runs/{runId}` (NEW, project-level)

Daily harness output, BigQuery-mirrored.

```ts
interface EvalRun {
  id, ranAt, runner: 'deepeval'|'ragas'|'promptfoo'|'vertex-eval',
  goldenSetId, goldenSetVersion,
  metrics: { faithfulness, contextPrecision, contextRecall, answerRelevancy, ... },
  perToolBreakdown: Record<toolId, metrics>,
  modelUsed, commit: string,
  passedGate: boolean,
}
```

### `audit_logs/{logId}` (existing — verify schema)

Already indexed by `actor`. Ensure every privileged action
(graph-update approval, profile-version bump, admin-role grant)
writes one.

---

# 6. Dependency recommendations

## 6.1 Keep (currently in `package.json`)

- `next@^16.2.4`, `react@^19.2.4` — current stack.
- `@ai-sdk/google-vertex@^4.0.102`, `@ai-sdk/google@^3.0.34`,
  `@ai-sdk/anthropic@^3.0.50`, `ai@^6.0.105` — AI SDK v6 is the
  right TS abstraction.
- `firebase@^12.11.0`, `firebase-admin@^13.7.0` — Auth + Firestore.
- `@google-cloud/pubsub@^4.11.0`, `@google-cloud/tasks@^5.5.2` —
  required for the operational spine.
- `@google-cloud/logging-winston@^6.0.0`,
  `@google-cloud/opentelemetry-cloud-trace-exporter@^2.0.0`,
  `@opentelemetry/sdk-node@^0.57.2`, `winston@^3.17.0` —
  observability.
- `@sentry/nextjs@^10.46.0` — error tracking.
- `zod@^4.3.6` — schema validation.
- `zustand@^5.0.11` — state.
- `neo4j-driver@^6.0.1` — graph option.
- `d3@^7.9.0`, `framer-motion@^12.34.4`, `react-leaflet@^5.0.0`,
  `leaflet@^1.9.4` — visualizations.
- `@radix-ui/*`, `class-variance-authority`, `clsx`,
  `tailwind-merge` — UI primitives.
- `docx@^9.6.1`, `jspdf@^4.2.1`, `mammoth@^1.12.0` — exports + parse.
- `pdf-parse@^2.4.5` — fallback PDF parser (keep but demote priority
  below Document AI).
- `@mendable/firecrawl-js@^4.16.0` — web scraping.
- `stripe@^20.4.1`, `resend@^6.9.4` — billing + email.
- `react-markdown@^10.1.0`, `remark-gfm@^4.0.1`, `rehype-highlight@^7.0.2` —
  markdown.
- `parallel-web@^0.3.2` — already in use; keep.
- `google-auth-library@^9.15.1` — required for Vertex.
- `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0` — onboarding
  drag-reorder.

## 6.2 Remove / consider removing

- **`pdf-parse`** — keep as fallback only. Move to lazy-import on
  first use. Remove if Document AI Layout Parser is wired and
  proves stable.
- **`@types/d3`** + heavy D3 usage — keep types; reduce D3 to small
  charts only.
- **`postcss` override + `@tailwindcss/postcss`** — verify still
  needed against Tailwind 4 (it is for now).
- **package.json `overrides` block** — audit each (`protobufjs`,
  `dompurify`, `@xmldom/xmldom`, `node-forge`, `axios`,
  `follow-redirects`, `fast-xml-parser`, `postcss`). Likely all
  still needed for transitive CVE fixes; document the rationale
  in `package.json` comment block or `docs/COMPLIANCE.md`.

## 6.3 Add now (Phase 0 / 1)

### Frontend (TypeScript)

```bash
npm install \
  sigma graphology graphology-layout-forceatlas2 \
  @react-sigma/core @react-sigma/layout-forceatlas2 \
  @react-sigma/controls \
  @tanstack/react-query \
  @firebase/app-check
```

- **sigma + graphology + react-sigma** — WebGL conflict-graph
  canvas. **Used in:** new `src/components/visualizations/conflict-graph-canvas.tsx`.
  Wire into `/app/conflict-graph` page.
- **@tanstack/react-query** — server-state caching for tool outputs
  and feed data. Replaces ad-hoc useEffect data fetching across
  the 56 tool pages. Side benefit: clean handling of optimistic
  updates for the Approval Queue UI.
- **@firebase/app-check** — server enforcement uses the existing
  reCAPTCHA Enterprise key already in `cloudbuild.yaml`.

### Backend (Python)

```bash
# in backend/pyproject.toml
pip install \
  langgraph langgraph-checkpoint-firestore \
  pydantic-ai \
  instructor \
  google-cloud-documentai \
  google-cloud-translate \
  google-cloud-aiplatform[reasoningengine] \
  google-cloud-discoveryengine \
  rapidfuzz \
  trafilatura \
  ragas deepeval pytest-asyncio promptfoo
```

- **langgraph + langgraph-checkpoint-firestore** — durable agent
  runtime. The Firestore checkpointer keeps tenant isolation.
  **Used in:** new `backend/agents/langgraph/` module.
- **pydantic-ai** — typed agent nodes inside LangGraph. **Used in:**
  Conflict Graph builder, Approval Queue worker, Source Scout.
- **instructor** — structured output for `gemini_client.py`.
  **Used in:** every Python module that calls Gemini directly.
- **google-cloud-documentai** — Layout Parser. **Used in:**
  `cloud_functions/on_document_uploaded/`.
- **google-cloud-translate** — i18n. **Used in:**
  new `src/lib/i18n/translate.ts` (TS) and a backend wrapper.
- **google-cloud-aiplatform[reasoningengine]** — Vertex Agent Engine
  + Memory Bank API. **Used in:** `backend/services/memory_bank_client.py`.
- **google-cloud-discoveryengine** — Vertex AI Search.
  **Used in:** new `backend/services/vertex_search_client.py` for
  cross-corpus retrieval.
- **rapidfuzz** — entity resolution. **Used in:**
  `backend/graphify_tacitus/build.py` deduplication step.
- **trafilatura** — replace HTML stripper. **Used in:**
  `backend/graphify_tacitus/extract.py`.
- **ragas + deepeval + pytest-asyncio + promptfoo** — eval
  harness. **Used in:** `backend/evals/` (new) and `cloudbuild.yaml`.

## 6.4 Add later (Phase 3 / 4)

```bash
# Frontend (when graph review UX needs it)
npm install cytoscape react-cytoscapejs

# Backend (when scale or research justifies)
pip install \
  langsmith \
  graphiti-core[full] \
  spanner-graph-langchain \
  marker-pdf \
  unstructured
```

- **cytoscape** — heavy admin / curation view (not the main
  canvas).
- **langsmith** — gate behind a per-developer flag.
- **graphiti-core[full]** — already at `>=0.5,<1.0` in
  `pyproject.toml`. Wire only when the temporal context graph
  surface is actually exposed to users.
- **spanner-graph-langchain** — official LangChain integration for
  Spanner Graph GraphRAG. Add when Spanner Graph instance is live.
- **marker-pdf / unstructured** — only if Document AI proves too
  expensive at scale.

---

# 7. APIs and environment variables

## 7.1 Recommended environment variables

These are added to `.env.example`. Critical secrets live in Secret
Manager and are mounted by `cloudbuild.yaml` `--set-secrets`. Public
build-time values live in `cloudbuild.yaml` `--build-arg`. None of
the values below should be committed to the repo.

### Existing (already required) — verify all set

```
# AI providers
AI_PROVIDER=vertex
GOOGLE_VERTEX_PROJECT=praxisbytacitus
GOOGLE_VERTEX_LOCATION=us-central1
GOOGLE_AI_API_KEY=                        # local dev fallback only
ANTHROPIC_API_KEY=                        # optional, deep analysis

# Firebase
FIREBASE_SERVICE_ACCOUNT_KEY=             # JSON string in Secret Manager
GOOGLE_CLOUD_PROJECT=praxisbytacitus

# Auth
COOKIE_SIGNING_SECRET=                    # primary
SESSION_SECRET=                           # alias to COOKIE_SIGNING_SECRET

# Operational
CRON_SECRET=
NEXT_PUBLIC_PRAXIS_BACKEND_URL=           # auto-set by Cloud Build
NEXT_PUBLIC_SITE_URL=https://praxis.tacitus.me
ADMIN_ALLOWLIST=                          # comma-separated UIDs

# User key encryption
USER_KEY_MASTER=                          # AES-GCM key

# Public Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Optional graph backends
NEO4J_URI=
NEO4J_USERNAME=
NEO4J_PASSWORD=

# Optional feeds
ACLED_API_KEY=
GDELT_API_KEY=
FIRECRAWL_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=
```

### NEW (this memo)

```
# Vertex AI Agent Engine + Memory Bank
VERTEX_AGENT_ENGINE_ID=                   # Reasoning Engine numeric id
VERTEX_AGENT_LOCATION=us-central1
VERTEX_MEMORY_BANK_ENABLED=1

# Document AI
DOCUMENTAI_PROCESSOR_ID=                  # Layout Parser processor id
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_VERSION=             # e.g. pretrained-layout-parser-v1.5-2025-08-25

# Cloud Translation
TRANSLATION_PROJECT=praxisbytacitus
TRANSLATION_LOCATION=us-central1

# Vertex AI Search / Discovery Engine
DISCOVERY_ENGINE_PROJECT=praxisbytacitus
DISCOVERY_ENGINE_LOCATION=global
DISCOVERY_ENGINE_DATASTORE_ID=

# Vertex AI Vector Search 2.0 (Phase 4)
VECTOR_SEARCH_INDEX_ENDPOINT=
VECTOR_SEARCH_DEPLOYED_INDEX_ID=

# Spanner Graph (enterprise tier)
SPANNER_INSTANCE=praxisbytacitus-spanner
SPANNER_DATABASE=praxis
SPANNER_GRAPH_NAME=ConflictGraph

# LangGraph + LangSmith
LANGGRAPH_CHECKPOINT_BACKEND=firestore    # firestore|spanner
LANGSMITH_TRACING=false                   # gated per-developer
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=praxis-agents

# Cloud Tasks (already provisioned)
TASKS_QUEUE_RESEARCH=praxis-research
TASKS_QUEUE_AGENTS=praxis-agents
TASKS_QUEUE_EMBEDDINGS=praxis-embeddings
PRAXIS_AGENTS_SERVICE_URL=                # set by Cloud Build for new service

# Cloud Workflows
WORKFLOWS_PIPELINE_NAME=praxis-situation-pipeline

# Eval harness
EVAL_GOLDEN_SET_BUCKET=gs://praxisbytacitus-evals
EVAL_BIGQUERY_DATASET=praxis_evals

# Sentry (verify)
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Model Armor (when enabled)
MODEL_ARMOR_PROJECT=praxisbytacitus
MODEL_ARMOR_TEMPLATE=praxis-default
```

### Secret Manager contract (production)

| Secret name | Mounted as | Used by |
|---|---|---|
| `praxis-firebase-sa` | `FIREBASE_SERVICE_ACCOUNT_KEY` | both Cloud Run services |
| `praxis-google-ai-key` | `GOOGLE_AI_API_KEY` | both (dev fallback) |
| `praxis-cron-secret` | `CRON_SECRET` | frontend |
| `praxis-cookie-secret` | `COOKIE_SIGNING_SECRET`, `SESSION_SECRET` | frontend |
| `praxis-user-key-master` | `USER_KEY_MASTER` | both |
| `praxis-agent-engine-id` (NEW) | `VERTEX_AGENT_ENGINE_ID` | frontend, agents |
| `praxis-document-ai-processor-id` (NEW) | `DOCUMENTAI_PROCESSOR_ID` | backend, document fn |
| `praxis-discovery-engine-datastore` (NEW) | `DISCOVERY_ENGINE_DATASTORE_ID` | backend |
| `praxis-sentry-dsn` (verify) | `SENTRY_DSN` | both |
| `praxis-langsmith-api-key` (NEW, gated) | `LANGSMITH_API_KEY` | agents |
| `praxis-stripe-secret-key` | `STRIPE_SECRET_KEY` | frontend |
| `praxis-stripe-webhook-secret` | `STRIPE_WEBHOOK_SECRET` | frontend |
| `praxis-acled-api-key` | `ACLED_API_KEY` | backend, gdelt-poller |
| `praxis-firecrawl-api-key` | `FIRECRAWL_API_KEY` | frontend |
| `praxis-resend-api-key` | `RESEND_API_KEY` | frontend |

### Where each variable applies

- **Local dev (`.env.local`):** `GOOGLE_AI_API_KEY`, public Firebase
  config, `NEO4J_*` (if running Neo4j locally), `FIRECRAWL_API_KEY`,
  `ANTHROPIC_API_KEY`. Do **not** put production secrets in
  `.env.local`.
- **Cloud Run (`cloudbuild.yaml --set-env-vars` + `--set-secrets`):**
  everything in §7.1.
- **GitHub Actions:** Cloud Build is the build system; GitHub
  Actions only triggers Cloud Build via OIDC. Avoid duplicating
  secrets in GitHub Actions.
- **Cloud Functions:** inherit env from deploy script.
  `on_document_uploaded` needs `DOCUMENTAI_*`; `gdelt_poller` needs
  `ACLED_API_KEY` only if it cross-references ACLED; otherwise
  needs only `PRAXIS_BACKEND_URL`.

---

# 8. PRAXIS ingestion and analysis pipeline (target design)

This is the canonical pipeline a coding agent should implement
against. Each step calls out the code module, cloud service,
library, data object, failure mode, and retry strategy.

## 8.1 End-to-end flow

```
[ User upload / paste / URL ]
       │
       ▼
1. Persist raw → Cloud Storage
       │
       ▼
2. Create SourceDocument → Firestore
       │ (Pub/Sub: documents.uploaded)
       ▼
3. Detect MIME / language → Cloud Function
       │
       ▼
4. Parse + layout-aware chunk → Document AI Layout Parser
       │   (or trafilatura for HTML, plain read for txt/md)
       ▼
5. Translate if not in user's outputLanguage → Cloud Translation
       │
       ▼
6. Store DocumentChunks (with ancestral headings, layout type)
       │   → Firestore documents/{docId}/chunks
       ▼
7. Generate embeddings (gemini-embedding-2)
       │   → Firestore vectors via FieldValue.vector
       ▼
8. Run primitive extraction → Gemini Pro w/ response_schema
       │   → Pydantic-validated ExtractionResult
       ▼
9. Validate against ACO schema (14 types, 72 relationships)
       │
       ▼
10. Entity resolve / dedupe (RapidFuzz + embedding sim)
       │
       ▼
11. Propose graph nodes/edges → graph_updates collection
       │ (non-default) await human approval
       │ (default mode) auto-apply with validationStatus='auto'
       ▼
12. Apply approved updates → graph/main/{nodes,edges}
       │   write GraphSnapshot
       ▼
13. Post-write fan-out:
       │ - re-run centrality + community → graph/analysis
       │ - re-rank tool-output cache freshness
       │ - mark situation freshnessScore stale
       │
       ▼
14. Trigger downstream agents (Source Scout, Timeline Editor,
    Red Team Critic) → LangGraph runs via Cloud Tasks
       │
       ▼
15. UI shows new entities + freshness flag + recommended action
```

## 8.2 Step-by-step recommendations

### Step 1: Persist raw

- **Module:** `cloud_functions/on_document_uploaded/main.py` (already
  exists; extend).
- **Service:** Cloud Storage `gs://praxisbytacitus-praxis-uploads/{uid}/{situationId}/{docId}/{filename}`.
- **Failure mode:** Cloud Storage 5xx → retry via Cloud Function
  retry policy (max 3 attempts, exponential).
- **Idempotency:** filename includes `docId`; Firestore write is
  the source of truth for "this exists".

### Step 2: Create SourceDocument

- **Module:** `src/lib/firebase/documents-service.ts` (already
  exists, extend with the new fields from §5.5).
- **Pub/Sub:** publish `documents.uploaded` topic so subsequent
  steps can run without coupling to the HTTP request.
- **Idempotency:** content-hashing — if a doc with the same
  `contentHash` already exists in this situation, return the
  existing one.

### Step 3: Detect MIME + language

- **Module:** new `cloud_functions/on_document_uploaded/parsers/detect.py`.
- **Library:** `python-magic` for MIME, `langdetect` or
  Cloud Translation `detectLanguage` for language.
- **Failure mode:** unknown MIME → mark `parserUsed: 'unknown'`,
  status `error`, do not run extraction.

### Step 4: Parse + layout-aware chunk

- **Module:** new `cloud_functions/on_document_uploaded/parsers/documentai.py`.
- **Service:** Document AI Layout Parser.
- **Library:** `google-cloud-documentai` 2.x.
- **Limits:** 20 MB / 500 pages per call; chunk a large PDF into
  page batches if needed.
- **Failure mode:** 429 quota → fall back to `pdf-parse` + naive
  chunking; mark `parserUsed: 'pdf-parse'` so later eval can
  detect the regression.
- **Retry:** exponential backoff (1s, 4s, 16s, give up).

### Step 5: Translate

- **Module:** new `src/lib/i18n/translate.ts` (server-only) +
  Python wrapper.
- **Service:** Cloud Translation v3.
- **Trigger:** `if doc.language !== profile.workingStyle.outputLanguage
  and doc.language !== 'en'`, translate to English (always store
  English) and to `outputLanguage` if different.
- **Failure mode:** quota exceeded → store original-only, raise a
  `system_event` for the operator console.

### Step 6: Store DocumentChunks

- **Module:** extend `chunkAndSaveDocument` in
  `src/lib/firebase/documents-service.ts`.
- **Schema:** §5.5 `DocumentChunk`.
- **Retry:** Firestore batch write atomic; on partial failure
  re-queue from chunk index.

### Step 7: Embeddings

- **Module:** `src/lib/knowledge/embedding-service.ts` (already
  exists; no changes needed beyond adopting the new chunk schema).
- **Failure mode:** embedding model unavailable → set chunk
  `embedding=null`, retry async via Cloud Tasks
  `praxis-embeddings` queue.

### Step 8: Primitive extraction

- **Module:** **rewrite** `backend/graphify_tacitus/extract.py`
  (the single highest-leverage change in this memo).
- **Library:** `instructor` patching `google-genai`, plus Pydantic
  models in `backend/graphify_tacitus/schemas/`.
- **Pseudocode:**
  ```python
  import instructor
  from google import genai

  client = instructor.from_genai(genai.Client(...))

  def extract_aco(text: str, ctx: dict) -> ExtractionResult:
      return client.chat.completions.create(
          model="gemini-3.1-pro-preview",
          response_model=ExtractionResult,   # Pydantic
          max_retries=2,
          messages=[
              {"role": "system", "content": ACO_SYSTEM_PROMPT},
              {"role": "user", "content": text},
          ],
      )
  ```
- **Failure mode:** validation failure on max_retries → write the
  raw output to `extraction_runs/{runId}.failureReason` and emit a
  system_event for review. Do not silently return empty.

### Step 9: Schema validation

- Already happens via `instructor` + Pydantic above. The Pydantic
  model **is** the contract — single source of truth between the
  prompt, the API response, and the downstream graph builder.

### Step 10: Entity resolve / dedupe

- **Module:** new `backend/graphify_tacitus/resolve.py`.
- **Library:** RapidFuzz + cosine similarity on entity embeddings.
- **Algorithm:**
  1. For each new node, find existing nodes of the same
     `primitive_type` in the situation graph.
  2. If RapidFuzz `WRatio(label) > 90` AND cosine sim of
     summary embeddings > 0.85 → merge (mark `mergedFrom`).
  3. If 70 < WRatio < 90 → propose a merge in `graph_updates`.
  4. Otherwise → new node.
- **Failure mode:** false merge — guarded by human approval queue
  for ambiguous cases.

### Step 11: Propose graph updates

- **Module:** new `backend/services/approval_queue.py`.
- **Storage:** `users/{uid}/situations/{sitId}/graph_updates`
  (collection group already indexed).
- **Auto-apply rule:** confidence == 'EXTRACTED' AND citations >= 1
  AND no contradiction with existing graph → auto-apply with
  `validationStatus='auto'`.
- **Default for INFERRED / AMBIGUOUS / ASSESSED:** queue for human
  approval.

### Step 12: Apply graph updates

- **Module:** `backend/services/graph_adapter.py` already wraps
  Neo4j / FalkorDB / Spanner. Add a `propose_or_apply()` method
  that respects the auto-apply policy.

### Step 13: Post-write fan-out

- **Module:** Pub/Sub trigger on `graph_updates` writes →
  Cloud Function that recomputes centrality / community and
  marks downstream tool outputs as stale.

### Step 14: Trigger downstream agents

- **Module:** new `backend/agents/langgraph/triggers.py`.
- **Service:** Cloud Tasks → `praxis-agents` queue → Cloud Run
  `praxis-agents` service.
- The agents themselves run as LangGraph graphs (see §9).

### Step 15: UI

- **Module:** `src/app/app/conflict-graph/page.tsx` (existing;
  swap canvas to Sigma) and the dashboard page.
- The new freshness/recommended-action surface is BIG #1 in
  `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` — already on the
  roadmap.

## 8.3 Pipeline orchestration

Replace the hard-coded chain in `backend/routers/pipeline.py` with
a Cloud Workflows definition that calls each Cloud Run step. This
gives the operator console:

- per-step retry policy
- visibility into which step failed
- ability to re-run from a step

`infrastructure/workflows/situation-pipeline.yaml` (NEW):

```yaml
main:
  params: [input]
  steps:
    - parse:
        call: http.post
        args:
          url: ${PARSE_FN_URL}
          body: ${input}
        result: parsed
    - chunk_and_embed:
        call: http.post
        args:
          url: ${CHUNK_FN_URL}
          body: ${parsed}
        result: chunks
    - extract:
        call: http.post
        args:
          url: ${BACKEND_URL}/api/v1/pipeline/extract
          body: ${chunks}
        result: extraction
    - resolve:
        call: http.post
        args:
          url: ${BACKEND_URL}/api/v1/pipeline/resolve
          body: ${extraction}
        result: resolved
    - propose_graph:
        call: http.post
        args:
          url: ${BACKEND_URL}/api/v1/pipeline/propose
          body: ${resolved}
        result: proposals
    - finalize:
        return: ${proposals}
```

Each step has its own retry policy. The `on_situation_created`
Cloud Function becomes a Workflow launcher.

---

# 9. Agentic workflow (target design)

PRAXIS agents propose, explain, cite, and ask for approval. They do
**not** silently mutate canonical state. This section maps the
existing `docs/AGENTIC_SYSTEM.md` agent registry to LangGraph
implementations.

## 9.1 Architectural choice

**Use LangGraph for everything that has more than one LLM step or
needs human review or needs to survive a process restart.**
**Use Vertex ADK only for the Deep Research Agent** (already deployed).
Each LangGraph graph runs on a new Cloud Run service `praxis-agents`,
triggered by Cloud Tasks, checkpointing to Firestore.

This is **not** "true multi-agent" in the autonomous-collaboration
sense. PRAXIS deliberately uses **agentic workflows** with
predetermined paths, deliberate human checkpoints, and structured
output per node. Reliability over theatrics.

## 9.2 Agent registry → LangGraph mapping

| Agent | Inputs | Outputs | Model | Tools | HITL? |
|---|---|---|---|---|---|
| **Intake / Document Parser** | upload event | parsed chunks | Flash-Lite | Document AI, Translation | no |
| **Primitive Extractor** | chunks | proposed nodes/edges | Pro (response_schema) | none | no |
| **Entity Resolver** | proposed nodes | merged proposals | Flash | RapidFuzz, embedding similarity | yes (ambiguous) |
| **Graph Builder** | resolved proposals | applied graph updates | none (deterministic) | graph_adapter | no |
| **Provenance Verifier** | proposed edge | confidence score | Flash | citation lookup | no |
| **Source Scout** | situation context | ranked sources | Flash + grounded search | Firecrawl, ACLED, GDELT | no |
| **Conflict Analyst** | graph + corpus | escalation, faction map | Pro | graph queries, retrieval | no |
| **Escalation Analyst** | events + graph | Glasl stage estimate | Pro deep-think | timeline, risk-engine | no |
| **Leverage Analyst** | actors + claims | leverage table | Pro | retrieval | no |
| **Scenario Analyst** | situation + actors | scenario set | Pro deep-think | game-theory module | yes (parameter approval) |
| **Red Team Critic** | any draft output | critique with confidence delta | Claude Sonnet 4 (or Pro) | retrieval | no |
| **Synthesis Chair** | expert turns | consolidated memo + options | Claude Sonnet 4 (or Pro deep-think) | none | yes (final acceptance) |
| **Timeline Editor** | feeds + docs | event proposals | Flash | feed clients | yes (default) |
| **Approval Queue Worker** | proposal | applied or rejected | none | graph_adapter, audit-log | yes (always) |

## 9.3 Concrete LangGraph: the Brainstorming Table

The Brainstorming Table is the highest-value agentic surface PRAXIS
ships. Today it runs synchronously in a route handler. Target shape:

```python
# backend/agents/langgraph/brainstorming_table.py
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.firestore import FirestoreSaver

class TableState(TypedDict):
    situation_id: str
    uid: str
    question: str
    context: dict          # AnalystProfile + situation + retrieval
    rows: list[dict]       # one per persona contribution
    critique: list[dict]
    synthesis: str | None
    user_acceptance: dict | None

g = StateGraph(TableState)
g.add_node("retrieve_context",   retrieve_situation_context)
g.add_node("mediator_persona",   run_mediator_node)
g.add_node("legal_persona",      run_legal_node)
g.add_node("humanitarian",       run_humanitarian_node)
g.add_node("media_analyst",      run_media_node)
g.add_node("red_team",           run_red_team_node)
g.add_node("synthesis_chair",    run_synthesis_node)
g.add_node("await_acceptance",   await_human_decision)
g.add_node("persist_briefing",   persist_to_firestore)

g.add_edge(START, "retrieve_context")
g.add_edge("retrieve_context", "mediator_persona")
g.add_edge("retrieve_context", "legal_persona")
g.add_edge("retrieve_context", "humanitarian")
g.add_edge("retrieve_context", "media_analyst")
# fan-in
for p in ["mediator_persona","legal_persona","humanitarian","media_analyst"]:
    g.add_edge(p, "red_team")
g.add_edge("red_team", "synthesis_chair")
g.add_edge("synthesis_chair", "await_acceptance")
# HITL interrupt
g.add_edge("await_acceptance", "persist_briefing")
g.add_edge("persist_briefing", END)

compiled = g.compile(
    checkpointer=FirestoreSaver(uid_path="users/{uid}/situations/{sid}/agent_runs"),
    interrupt_before=["await_acceptance"],
)
```

- **Persona nodes** run in parallel via LangGraph's native fan-out.
- **Red Team Critic** reads all four persona outputs and emits
  per-claim critique with confidence deltas.
- **Synthesis Chair** uses Claude Sonnet 4 for diplomatic language
  with `getAnalysisModel()` semantics on the TS side.
- **HITL interrupt** before persistence — user sees the table,
  accepts/rejects rows, edits synthesis, then resumes.
- **Checkpoint after every node** — survives Cloud Run cold-start
  preemption and worker restart.

The trigger flow:

```
POST /api/ai/brainstorming-table  (Cloud Run praxis-frontend)
  ↓ enqueue Cloud Task
Cloud Tasks praxis-agents queue
  ↓ HTTP
Cloud Run praxis-agents service
  ↓ compiled.invoke(input, config={'thread_id': runId})
LangGraph runs nodes, checkpoints to Firestore
  ↓ when interrupted at await_acceptance
Frontend polls / subscribes to `agent_runs/{runId}` → renders table
User accepts → POST /api/ai/brainstorming-table/resume
  ↓ enqueue Cloud Task with resume payload
Cloud Run praxis-agents
  ↓ compiled.invoke(None, config) → resumes from checkpoint
Persist briefing → emit `tool.runs.completed` Pub/Sub
```

## 9.4 Concrete LangGraph: Conflict Graph builder

```python
# backend/agents/langgraph/conflict_graph_builder.py
class GraphBuildState(TypedDict):
    situation_id: str
    extraction_run_id: str
    raw_extraction: ExtractionResult        # Pydantic
    resolved: ResolvedExtraction | None
    proposals: list[GraphUpdateProposal]
    auto_applied: list[str]
    awaiting_human: list[str]

g = StateGraph(GraphBuildState)
g.add_node("validate_schema",       validate_aco_schema)
g.add_node("resolve_entities",      resolve_with_rapidfuzz_and_embeddings)
g.add_node("verify_provenance",     check_citations_exist)
g.add_node("classify_decisions",    auto_apply_or_queue)
g.add_node("apply_auto",            apply_to_graph_via_adapter)
g.add_node("queue_human",           write_to_graph_updates)
g.add_node("emit_events",           publish_graph_update_proposed)

g.add_edge(START, "validate_schema")
g.add_edge("validate_schema", "resolve_entities")
g.add_edge("resolve_entities", "verify_provenance")
g.add_edge("verify_provenance", "classify_decisions")
g.add_conditional_edges(
    "classify_decisions",
    lambda s: ["apply_auto", "queue_human"],  # parallel fan-out
)
g.add_edge("apply_auto", "emit_events")
g.add_edge("queue_human", "emit_events")
g.add_edge("emit_events", END)
```

This graph runs **without HITL** in the default flow but the
`queue_human` node is itself the HITL gate — humans approve via the
Approval Queue UI, which writes a `graph_updates/{id}.status` change
that triggers a separate "applier" graph.

## 9.5 Concrete LangGraph: Approval Queue worker

```python
# backend/agents/langgraph/approval_applier.py
class ApplyState(TypedDict):
    proposal_id: str
    proposal: GraphUpdateProposal
    decision: 'approved' | 'rejected'
    reviewer_uid: str

g = StateGraph(ApplyState)
g.add_node("load_proposal",   load_from_firestore)
g.add_node("validate_decision", check_reviewer_authority)
g.add_node("apply_or_skip",   apply_via_graph_adapter_if_approved)
g.add_node("snapshot_graph",  write_graph_snapshot)
g.add_node("audit_log",       write_audit_entry)
g.add_node("notify",          enqueue_notification)
```

Triggered by a Pub/Sub message published on `graph_updates/{id}`
status change.

## 9.6 Why this beats raw multi-agent demos

- **Durable.** Every node checkpoints. A Cloud Run preemption
  doesn't lose the work.
- **Auditable.** Every state transition writes to
  `agent_runs/{runId}/checkpoints/{ckptId}`.
- **Type-safe.** Pydantic models on every transition.
- **Testable.** LangGraph supports time-travel / replay against
  a saved checkpoint. Bug found in prod → developer replays the
  exact run locally.
- **HITL-native.** No bespoke pause/resume infrastructure.
- **Tenant-isolated.** Checkpointer scopes to `users/{uid}` in the
  Firestore path.

---

# 10. Implementation roadmap

Five phases. Each phase has concrete tasks, files touched, deps
added, GCP services involved, success criteria, and tests.

## Phase 0 — Stabilize the current repo (1 week)

**Goal:** every claim in `CLAUDE.md` is true and verified by CI.

| Task | Files | Success |
|---|---|---|
| Verify Sentry DSN exists in Secret Manager and is mounted | `cloudbuild.yaml`, Secret Manager | Frontend + backend show events in Sentry under a sample exception |
| Verify TTL policies on `system_events`, `tool_runs`, `notifications` | `infrastructure/setup-ttl.sh` | `gcloud firestore` reports the policy |
| Add `pytest` step to `cloudbuild.yaml` | `cloudbuild.yaml` | Cloud Build run logs include backend test output |
| Add `vitest run` step to `cloudbuild.yaml` | `cloudbuild.yaml` | Cloud Build run logs include 140+ tests passing |
| Mount `praxis-agent-engine-id` in `cloudbuild.yaml` once Vertex Agent Engine is deployed | `cloudbuild.yaml`, `backend/agents/deploy.py` | `/api/health/checks/vertex_adk == 'ok'` |
| Migrate `tool-data/` ↔ `tools/` to single canonical path | `scripts/migrate-tool-outputs-to-tools.ts`, every AI route | Zero docs in the old path post-migration |
| Server-enforce App Check on `/api/ai/*` | `src/lib/api/with-auth.ts` | requests without App Check token receive 403 |
| Audit IAM least-privilege | gcloud project policy | Recorded in `docs/COMPLIANCE.md` |

**Tests:** lint, typecheck, vitest, pytest, audit-routes, audit-gcp,
golden-path Playwright, App Check 403 e2e.

## Phase 1 — Production ingestion MVP (2 weeks)

**Goal:** an analyst can upload any document type and get a
defensible graph in <2 min.

| Task | Files | Deps added | Success |
|---|---|---|---|
| Wire Document AI Layout Parser | `cloud_functions/on_document_uploaded/`, new `parsers/documentai.py` | `google-cloud-documentai` | Scanned PDF produces ≥1 chunk with non-empty text and ancestor headings |
| Replace `extract.py` with structured output | `backend/graphify_tacitus/extract.py`, `schemas/*.py` | `instructor`, Pydantic | 100% of extractions either pass schema validation or write a `failureReason` |
| Replace HTML stripper with trafilatura | `backend/graphify_tacitus/extract.py` | `trafilatura` | Extraction quality on URL inputs improves measurably (eval set) |
| Extend `SourceDocument` and `DocumentChunk` schemas | `src/lib/firebase/documents-service.ts`, types | none | New fields populated on every new upload |
| Add `extraction_runs` collection | `src/lib/firebase/extraction-runs-service.ts` (new) | none | Every extraction emits a record |
| Add Cloud Translation hook | new `src/lib/i18n/translate.ts` + Python wrapper | `google-cloud-translate` | French analyst uploading Arabic doc gets the same entities the English analyst would (eval) |
| Add unified Cloud Workflows pipeline | `infrastructure/workflows/situation-pipeline.yaml` | none | Operator can re-run from a failed step in the console |
| Sigma.js conflict-graph canvas | `src/components/visualizations/conflict-graph-canvas.tsx`, `/app/conflict-graph/page.tsx` | sigma, graphology, react-sigma | 50k-node graph renders at >30 fps |

**Tests:** Document AI golden set (10 docs of mixed types), extraction
schema-conformance test, Sigma performance test on a synthetic 50k
graph, Playwright smoke for upload→graph appears.

## Phase 2 — Graph intelligence (3 weeks)

**Goal:** the graph is the product. Every claim is sourced and
typed. Approval queue drives quality.

| Task | Files | Deps added | Success |
|---|---|---|---|
| Provision Spanner Graph for enterprise tier | `infrastructure/setup-spanner.sh` | `spanner-graph-langchain` (later) | Graph reads at p95 < 100ms across 100k nodes |
| Make graph backend selection per-tenant | `src/lib/firebase/graph-service.ts`, `graph_adapter.py` | none | Per-user setting honored |
| Entity resolver | `backend/graphify_tacitus/resolve.py` | `rapidfuzz` | Dedup precision > 95% on golden set |
| Approval queue UI | `src/app/app/graph-review/page.tsx` (new) | none | Reviewer can approve/reject in <5s per proposal |
| Graph snapshots | `users/{uid}/situations/{sid}/graph_snapshots`, `src/lib/firebase/graph-snapshots-service.ts` | none | Rollback restores prior state |
| Provenance UI | `src/components/praxis/citation-trace-panel.tsx` | none | Every node/edge in the canvas shows full citation panel on click |
| GraphRAG retrieval policy | `src/lib/knowledge/retrieval-orchestrator.ts` | none | Multi-hop questions ("How does X's commitment to Y constrain Z?") return graph-traversed context |
| Move temporal context graph to Graphiti | `backend/services/graphiti_client.py` | `graphiti-core[full]` | Time-bounded facts ("ceasefire was active until ...") render with valid windows |

**Tests:** entity resolution F1 on golden set, approval queue
e2e, graph snapshot roundtrip, retrieval-recall on multi-hop set.

## Phase 3 — Agentic analysis (4 weeks)

**Goal:** Brainstorming Table is the differentiator. Other agents
follow the same pattern.

| Task | Files | Deps added | Success |
|---|---|---|---|
| Stand up `praxis-agents` Cloud Run service | new `backend/agents/Dockerfile`, `cloudbuild.yaml` | `langgraph`, `langgraph-checkpoint-firestore`, `pydantic-ai` | Service deploys; healthcheck passes |
| Brainstorming Table LangGraph | `backend/agents/langgraph/brainstorming_table.py` | above | End-to-end run completes; checkpoints visible in Firestore |
| Conflict Graph builder LangGraph | `backend/agents/langgraph/conflict_graph_builder.py` | above | Replaces synchronous extract + build chain |
| Approval Queue applier LangGraph | `backend/agents/langgraph/approval_applier.py` | above | Pub/Sub-triggered, fully durable |
| HITL interrupt UI | `src/app/app/agent-runs/[runId]/page.tsx` | none | User sees paused run, can edit and resume |
| Memory Bank integration | new `backend/services/memory_bank_client.py` + add to `buildCalibratedContext` | `google-cloud-aiplatform[reasoningengine]` | User's preferences accumulate across tools |
| Migrate Brainstorming Table route to call LangGraph | `src/app/api/ai/brainstorming-table/route.ts` | none | Existing UI still works; durability is now real |
| Daily continuous monitor (per-situation) | new `cloud_run_worker_pools/agent-monitor/` | above | Each situation gets a daily 'what changed' summary |

**Tests:** LangGraph replay tests, HITL interrupt e2e, Memory Bank
write-then-recall test.

## Phase 4 — Evaluation & enterprise hardening (3 weeks)

**Goal:** PRAXIS passes a UN procurement evaluation.

| Task | Files | Deps added | Success |
|---|---|---|---|
| Build TACITUS extraction golden set | `evals/golden_extraction/` (50 paragraphs + expected ACO sets) | `deepeval`, `ragas` | Captured under `gs://praxisbytacitus-evals` |
| DeepEval CI gate | `cloudbuild.yaml`, `evals/test_extraction.py` | above | Cloud Build fails if precision < 0.85 or recall < 0.75 |
| Ragas retrieval gate | `evals/test_retrieval.py` | above | Faithfulness > 0.9 on Ask-PRAXIS golden set |
| Promptfoo for prompt regression | `evals/promptfoo.yaml`, `src/lib/ai/prompts/*.ts` | `promptfoo` | Diff in any prompt triggers a regression check |
| Vertex AI Eval monthly model comparison | `evals/vertex_eval_run.py` | `google-cloud-aiplatform` | Model selection table updated monthly |
| BigQuery sink for eval results | new Cloud Function `cf_eval_to_bq` | none | `praxis_evals.eval_runs` populated daily |
| Audit log enforcement | extend `withCalibration` to write `audit_logs` | none | Every privileged action observable |
| Tenant isolation tests | `tests/integration/tenant-isolation.spec.ts` | none | Cross-tenant read attempts are blocked at every layer |
| PII / DPIA documentation | `docs/COMPLIANCE.md`, `docs/dpia.md` (new) | none | Sign-off gate for first enterprise contract |
| Model Armor on Memory Bank writes | `backend/services/memory_bank_client.py` | `google-cloud-aiplatform[modelarmor]` | Prompt-injection attempts flagged in audit_logs |
| VPC Service Controls (gated by enterprise need) | `infrastructure/vpc-sc.tf` (new, Terraform) | none | Project perimeter enforced |
| SOC 2 Type I prep | `docs/COMPLIANCE.md`, vendor selection | n/a | Gap analysis complete |

**Tests:** the eval harness *is* the test. Plus Playwright tenant
isolation, Sentry chaos drill (kill a Cloud Run instance mid-run,
verify LangGraph resumes).

---

# 11. Coding-agent task list

These are dropped-in tasks for Claude Code / Codex. Each has a
title, goal, files to inspect, files to modify, implementation
notes, acceptance criteria, tests, and rollback notes. Tasks are
ordered for dependency.

> Convention: each PR uses Conventional Commits (`feat`, `fix`,
> `chore`, `refactor`) and includes the audit/spec ID where
> applicable, per `CLAUDE.md`.

---

### T1 — Replace JSON-regex extraction with structured output

**Goal:** Eliminate silent extraction failures by enforcing the ACO
schema at the API boundary.

**Files to inspect:**
- `backend/graphify_tacitus/extract.py`
- `backend/graphify_tacitus/schemas/aco.py`
- `backend/graphify_tacitus/schemas/extraction.py`
- `backend/graphify_tacitus/schemas/relationships.py`
- `backend/services/gemini_client.py`

**Files to modify:**
- `backend/pyproject.toml` — add `instructor>=1.0,<2.0`
- `backend/graphify_tacitus/extract.py` — rewrite `_parse_llm_response`
  to use `instructor.from_genai`
- `backend/graphify_tacitus/schemas/extraction.py` — make every
  field strictly typed; remove permissive `dict[str, Any]` metadata
  fields where the entity-type schema in `aco.py` already says
  what's allowed
- `backend/services/gemini_client.py` — patch the client with
  instructor; expose a `generate_structured(model, response_model,
  prompt)` method

**Implementation notes:**
- Use `instructor.from_genai(genai.Client(...))` with
  `response_model=ExtractionResult`
- `max_retries=2` to cap retry-cost runaway
- Capture the raw response on validation failure into
  `extraction_runs/{runId}.failureReason`
- Keep the existing `ACO_EXTRACTION_PROMPT` as the system prompt;
  Pydantic schema replaces the JSON spec at the bottom

**Acceptance:**
- `pytest backend/tests/test_extract.py -v` — every test in the
  suite passes including a new "schema-violation-handled" case
- Running on the existing Sudan / Syria sample texts produces
  the same number or more typed entities as before
- `extraction_runs.failureReason` is populated in the rare cases
  where validation fails

**Tests:** extend `backend/tests/` with a new `test_extract_structured.py`:
3 cases (clean, ambiguous, malformed-input).

**Rollback:** revert the file; the legacy regex parser is small
enough to keep in `extract_legacy.py` for a release.

---

### T2 — Wire Document AI Layout Parser into document upload

**Goal:** stop silently dropping scanned PDFs.

**Files to inspect:**
- `cloud_functions/on_document_uploaded/main.py`
- `src/app/api/documents/upload/route.ts`
- `src/lib/firebase/documents-service.ts`

**Files to modify:**
- `backend/pyproject.toml` and `cloud_functions/on_document_uploaded/requirements.txt` —
  add `google-cloud-documentai>=2.0,<3.0`
- `cloud_functions/on_document_uploaded/main.py` — branch on MIME:
  PDF/DOCX/PPTX/XLSX → Document AI Layout Parser; HTML →
  `trafilatura`; txt/md → plain
- `cloud_functions/on_document_uploaded/parsers/documentai.py` (new)
- `src/lib/firebase/documents-service.ts` — extend `SourceDocument`
  with `parserUsed`, `language`, `layout`, `contentHash`,
  `ingestionRunId`
- `src/app/api/documents/upload/route.ts` — short-circuit when
  Document AI is enabled (set `parserUsed: 'documentai-layout'`
  preliminarily)
- `infrastructure/setup-gcp.sh` — provision Document AI processor;
  store ID in Secret Manager
- `cloudbuild.yaml` — mount `DOCUMENTAI_PROCESSOR_ID`

**Implementation notes:**
- Use the `pretrained-layout-parser-v1.5-2025-08-25` processor
  version
- Cap chunk size to 1024 tokens with 256 overlap (matches Vertex
  RAG defaults)
- Persist ancestor headings into `DocumentChunk.ancestorHeadings`
  for later retrieval grounding

**Acceptance:**
- Scan a PDF (e.g., a UN report scan); chunks appear in
  Firestore with non-empty `text` and populated
  `ancestorHeadings`
- The Conflict Graph extraction runs on those chunks
- `documentai-layout` shows in `SourceDocument.parserUsed`

**Tests:** `pytest cloud_functions/on_document_uploaded/tests/test_parsers.py`
with a fixture scanned PDF.

**Rollback:** flag-gate via env var
`DOCUMENT_AI_ENABLED=0` to fall back to `pdf-parse`.

---

### T3 — Add `extraction_runs` and provenance fields

**Goal:** every extraction is traceable.

**Files to inspect:** see T1 + `firestore.indexes.json`

**Files to modify:**
- `firestore.indexes.json` — add index for `extraction_runs` by
  `situationId` + `startedAt DESC`
- `firestore.rules` — owner-only on the new collection
- new `src/lib/firebase/extraction-runs-service.ts`
- `backend/services/firestore_sync.py` — write the run

**Acceptance:**
- Every extraction emits a `extraction_runs/{runId}` doc
- The doc carries `modelUsed`, `promptVersion`, `schemaVersion`,
  `metrics`, `costUsd`

**Tests:** unit test in `tests/services/extraction-runs.spec.ts`.

**Rollback:** drop collection; non-breaking.

---

### T4 — Stand up `praxis-agents` Cloud Run service with LangGraph

**Goal:** durable agent runtime.

**Files to inspect:**
- `cloudbuild.yaml`
- `backend/agents/`
- `infrastructure/deploy-backend.sh`

**Files to modify:**
- new `backend/agents/Dockerfile` (Python 3.11 slim, FastAPI,
  LangGraph)
- new `backend/agents/main.py` (FastAPI consumer of Cloud Tasks)
- new `backend/agents/langgraph/__init__.py`
- new `backend/agents/langgraph/firestore_checkpointer.py` —
  custom Saver writing to `users/{uid}/situations/{sid}/agent_runs/{runId}/checkpoints`
- `cloudbuild.yaml` — add build + deploy steps for `praxis-agents`
  service; environment with same secrets as `praxis-backend`
- `backend/pyproject.toml` (or new `backend/agents/pyproject.toml`) —
  add `langgraph`, `pydantic-ai`

**Implementation notes:**
- Cloud Run service: 0–20 instances, 1 hour timeout, 4 GB memory
- Authenticate via OIDC ID token from Cloud Tasks; validate in
  FastAPI middleware
- Endpoint shape: `POST /v1/run/{graphId}` with `{ runId,
  inputState }`; `POST /v1/resume/{runId}` with `{ payload }`

**Acceptance:**
- `gcloud run services describe praxis-agents` returns ready
- `curl /v1/healthz` returns 200
- A test graph (echo node) round-trips with a Firestore checkpoint

**Tests:** integration test invoking a trivial graph and checking
the checkpoint exists.

**Rollback:** delete the service; nothing in production depends on
it yet.

---

### T5 — Migrate Brainstorming Table to LangGraph

**Goal:** the highest-value agent surface becomes durable + HITL.

**Files to inspect:**
- `src/app/api/ai/brainstorming-table/route.ts`
- `src/app/app/brainstorming-table/page.tsx`
- `docs/AGENTIC_SYSTEM.md`

**Files to modify:**
- new `backend/agents/langgraph/brainstorming_table.py` (graph
  definition; see §9.3)
- `src/app/api/ai/brainstorming-table/route.ts` — enqueue Cloud
  Task instead of synchronously calling LLMs
- new `src/app/api/ai/brainstorming-table/resume/route.ts`
- `src/app/app/brainstorming-table/page.tsx` — subscribe to
  `users/{uid}/situations/{sid}/agent_runs/{runId}` for live
  state; render the table; allow accept/edit/reject; call resume
- `firestore.rules` — owner-only on `agent_runs`

**Acceptance:**
- New round produces 4 persona rows + 1 critique + 1 synthesis,
  all checkpointed
- User edit + accept resumes the graph and writes a Briefing
- Killing the Cloud Run instance mid-run does not lose state

**Tests:** Playwright e2e (`tests/e2e/brainstorming-table.spec.ts`)
covering the full pause-edit-resume.

**Rollback:** the synchronous route is preserved at `/api/ai/brainstorming-table-legacy`
during transition.

---

### T6 — Sigma.js conflict-graph canvas

**Goal:** scale to 50k+ nodes with smooth interaction.

**Files to inspect:**
- `src/app/app/conflict-graph/page.tsx`
- `src/components/visualizations/` (existing D3 components)
- `src/lib/constants/aco-colors.ts`, `entity-colors.ts`

**Files to modify:**
- `package.json` — add `sigma`, `graphology`, `graphology-layout-forceatlas2`,
  `@react-sigma/core`, `@react-sigma/layout-forceatlas2`,
  `@react-sigma/controls`
- new `src/components/visualizations/conflict-graph-canvas.tsx`
  (Sigma + Graphology + react-sigma)
- new `src/lib/visualizations/aco-styling.ts` — maps
  primitive_type → color/icon
- `src/app/app/conflict-graph/page.tsx` — swap in the new canvas;
  preserve the right-rail panel + provenance UI
- new `src/lib/visualizations/graphology-adapter.ts` — converts
  ACO graph from `getGraph(uid, sid)` into a Graphology instance

**Implementation notes:**
- Use ForceAtlas2 in WebWorker mode (`FA2Layout`)
- Per-edge color by relationship category (causal/structural/
  antagonistic/cooperative/foundational)
- Per-node icon by primitive_type (use existing `aco-colors.ts`)
- Click handler opens the citation-trace-panel side drawer

**Acceptance:**
- A synthetic 50k-node graph renders; pan / zoom / select are
  smooth (>30 fps)
- The existing centrality panel on the right rail still works
- Click on any node shows the citation trace

**Tests:** Playwright performance test rendering a fixture 50k
graph, asserting frame budget.

**Rollback:** keep the D3 component behind a flag
`?engine=d3` until Sigma is stable.

---

### T7 — Add evaluation harness (DeepEval + Ragas)

**Goal:** quality has a regression gate.

**Files to inspect:**
- `cloudbuild.yaml`
- `backend/tests/`
- `scripts/audit-ai-routes.mjs`

**Files to modify:**
- new top-level `evals/` directory with `golden_extraction/`,
  `golden_retrieval/`, `golden_prompts/` subdirs
- new `evals/test_extraction.py` — DeepEval against the golden set
- new `evals/test_retrieval.py` — Ragas faithfulness
- new `evals/promptfoo.yaml`
- `backend/pyproject.toml` — add `deepeval`, `ragas`,
  `promptfoo` (or pin via `npx`)
- `cloudbuild.yaml` — add a gated step `_RUN_EVALS=1`
- new `src/app/api/cron/run-evals/route.ts` — daily DeepEval run
- new BigQuery table `praxis_evals.eval_runs`

**Acceptance:**
- `_RUN_EVALS=1` Cloud Build run produces a JUnit-style report
- Daily cron writes results to BigQuery
- A regression on the extraction set fails CI

**Tests:** the harness is the test.

**Rollback:** keep the gate optional (`_RUN_EVALS=0`).

---

### T8 — Vertex AI Memory Bank integration

**Goal:** cross-tool, cross-session user memory beyond AnalystProfile.

**Files to inspect:**
- `src/lib/ai/vertex-agent.ts`
- `src/lib/context/profile-context.ts`
- `src/lib/api/with-calibration.ts`

**Files to modify:**
- `backend/pyproject.toml` — add
  `google-cloud-aiplatform[reasoningengine]`
- new `backend/services/memory_bank_client.py` — wrap CreateMemory,
  GenerateMemories, RetrieveMemories
- new `src/lib/ai/memory-bank-client.ts` — Node wrapper using
  `google-auth-library`
- `src/lib/context/profile-context.ts` — extend `buildCalibratedContext`
  to inject top-K relevant memories alongside the AnalystProfile
- `src/app/api/cron/refresh-memories/route.ts` (new) — nightly
  GenerateMemories per active user

**Implementation notes:**
- Scope memories per Firebase UID (Memory Bank's `user_id`)
- Filter by topic when retrieving (e.g., only memories tagged with
  the current situation's domain)
- Wrap every write in Model Armor

**Acceptance:**
- Tell a tool "I prefer Crisis Group over Reuters"; tomorrow,
  another tool reads it
- Memories visible in the user's Settings → Memories page (new)

**Tests:** integration test write-then-retrieve.

**Rollback:** flag-gate via `VERTEX_MEMORY_BANK_ENABLED=0`.

---

### T9 — App Check server enforcement on AI routes

**Goal:** stolen session cookies cannot drive the API.

**Files to inspect:**
- `src/lib/api/with-auth.ts`
- `src/middleware.ts`
- `src/lib/firebase/admin.ts`

**Files to modify:**
- `src/lib/firebase/admin.ts` — initialize App Check Admin SDK
  alongside Firestore Admin
- `src/lib/api/with-auth.ts` — verify `X-Firebase-AppCheck` header
  on every AI route
- `src/lib/auth/auth-context.tsx` — call `getToken(appCheckInstance)`
  and attach to every fetch

**Implementation notes:**
- Use `replayProtection: true` for AI routes that mutate
- Soft-launch with logging-only mode, then enforce after 7 days

**Acceptance:**
- Requests without an App Check token receive 403
- All existing tools still work for real users

**Tests:** Playwright test of a forged cookie hitting `/api/ai/*`
returning 403.

**Rollback:** flag `APP_CHECK_ENFORCE=0`.

---

### T10 — Migrate pipeline to Cloud Workflows

**Goal:** operator-visible pipeline state.

**Files to inspect:**
- `backend/routers/pipeline.py`
- `cloud_functions/on_situation_created/`

**Files to modify:**
- new `infrastructure/workflows/situation-pipeline.yaml`
- `cloud_functions/on_situation_created/main.py` — launch the
  workflow instead of directly calling backend
- `backend/routers/pipeline.py` — split into per-step endpoints
  (`/pipeline/parse`, `/pipeline/extract`, `/pipeline/build`,
  `/pipeline/cluster`, `/pipeline/analyze`, `/pipeline/report`)

**Acceptance:**
- Operator can re-run from a step in the Cloud Workflows console
- Per-step retry policy applied (3 attempts on extract; 1 on
  report)

**Tests:** an integration test creating a situation and asserting
the workflow completes end-to-end.

**Rollback:** keep the chain endpoint at
`/pipeline/run-legacy`.

---

### T11 — GraphRAG retrieval policy

**Goal:** multi-hop questions get graph context, not just vectors.

**Files to inspect:**
- `src/lib/knowledge/retrieval-orchestrator.ts`
- `src/lib/knowledge/situation-knowledge-core.ts`

**Files to modify:**
- `src/lib/knowledge/retrieval-orchestrator.ts` — for any query
  that names entities present in the graph, run a 2-hop
  `MATCH (entity)-[*1..2]-(neighbor)` (using the graph adapter)
  and concatenate neighbor summaries to the vector hits
- new `src/lib/knowledge/graph-traversal.ts` — wraps Neo4j /
  Spanner / Firestore adapters
- update `searchSituationCorpus` to call the new policy

**Acceptance:**
- Ask: "How does Russia's commitment to Minsk II constrain its
  current Ukraine policy?" returns evidence drawn from a 2-hop
  walk over Commitment → Constraint → Actor

**Tests:** Ragas multi-hop retrieval on a 20-question golden set;
context recall must improve over baseline by >0.1.

**Rollback:** flag `GRAPHRAG_ENABLED=0` to revert to vector-only.

---

### T12 — Approval queue UI

**Goal:** humans validate proposals before canonical writes.

**Files to inspect:**
- `firestore.indexes.json` (already has `graph_updates` index)
- `src/components/praxis/`

**Files to modify:**
- new `src/app/app/graph-review/page.tsx`
- new `src/components/graph-review/proposal-card.tsx`
- `src/lib/firebase/graph-updates-service.ts` (new)

**Acceptance:**
- Reviewer sees a queue of proposals scoped to the active
  situation
- Approve/reject writes back to `graph_updates/{id}.status`
- Pub/Sub triggers the Approval Queue applier (T4)

**Tests:** Playwright e2e covering propose → approve → graph
updated.

**Rollback:** the page is additive; remove the route to roll back.

---

### T13 — Refactor `tools.ts` per category

**Goal:** make per-category situation binding correct and
testable.

**Files to inspect:**
- `src/lib/ai/tools.ts` (3,330 lines)
- `src/lib/ai/situation-context.ts`

**Files to modify:**
- new `src/lib/ai/tools/intelligence.ts`,
  `src/lib/ai/tools/drafting.ts`,
  `src/lib/ai/tools/simulation.ts`,
  `src/lib/ai/tools/context.ts`,
  `src/lib/ai/tools/workspace.ts`
- `src/lib/ai/tools/index.ts` re-exports
- delete (or rename to `tools-legacy.ts`) the monolith
- update `src/components/assistant/` consumers

**Acceptance:**
- `npm run verify-tools` passes
- chat tool registration unchanged
- one PR per category for review safety

**Rollback:** restore monolith from git history.

---

### T14 — Audit log enforcement

**Goal:** every privileged action observable.

**Files to inspect:**
- `firestore.indexes.json` (`audit_logs`)
- `src/lib/api/with-calibration.ts`

**Files to modify:**
- `src/lib/api/with-auth.ts` — write `audit_logs/{id}` for
  approve/reject, profile-version bump, admin actions
- new `src/lib/audit/audit-log-service.ts`

**Acceptance:**
- Every approval / admin action shows in the audit collection
- Operator console exposes a recent-audit panel

**Rollback:** non-blocking; a missing audit log warns to Sentry
but does not fail the request.

---

### T15 — Promptfoo prompt regression gate

**Goal:** prompt drift is caught.

**Files to modify:**
- `evals/promptfoo.yaml` covering `src/lib/ai/prompts/*.ts`
- `cloudbuild.yaml` step `_RUN_PROMPTFOO=1`

**Acceptance:**
- A material change to `system.ts` triggers a regression
- Per-prompt golden output set committed under
  `evals/golden_prompts/`

**Rollback:** disable the step.

---

# 12. Executive recommendation

## 12.1 Direct recommendation

PRAXIS is closer to top-tier than the roadmap docs admit. The
ontology is the moat. The calibration contract is the hidden
weapon. Two engineering shifts unlock the next altitude:

1. **Make the system honest.** Every claim cited, every extraction
   schema-validated, every approval audited, every regression
   caught by a CI gate. This is the work in Phases 0–2 + the
   evaluation harness.
2. **Make the system durable.** The agent surface (Brainstorming
   Table, Conflict Graph builder, Approval Queue, Continuous
   Monitor) becomes LangGraph-on-Cloud-Run-with-Firestore-checkpoints.
   No more synchronous fragility. This is Phase 3.

After those two shifts, **PRAXIS becomes the only AI conflict
intelligence platform that produces typed, sourced, time-bounded,
challengeable outputs at the level a UN diplomat or sovereign
adviser will defend in a meeting.** The competitors are either
glorified RAG chats or static research tools; PRAXIS will be
neither.

## 12.2 Best short-term stack (Phases 0–2, ~6 weeks)

- Frontend: Next.js 16 + React Query + Sigma.js for the canvas.
- Backend: FastAPI + Pydantic + instructor + Document AI Layout
  Parser + Cloud Workflows for the pipeline.
- Storage: Firestore (transactional + vectors + per-situation
  graph), Cloud Storage (raw docs).
- AI: Vertex AI Gemini 3 family with `response_schema` + Claude
  Sonnet 4 for diplomatic output. Memory Bank wired but optional.
- Eval: DeepEval + Ragas + promptfoo gates in Cloud Build.
- Graph: Firestore default; Neo4j optional per-user.

## 12.3 Best medium-term stack (Phases 3–4, +6 weeks)

- Add: `praxis-agents` Cloud Run service with LangGraph + PydanticAI.
- Add: Vertex AI Search/RAG Engine Serverless for cross-tenant
  public corpora.
- Add: Vertex AI Memory Bank cross-tool memory.
- Add: Spanner Graph for enterprise tier (when first enterprise
  customer requires it).
- Add: VPC Service Controls + Model Armor (when first enterprise
  contract requires).

## 12.4 What not to do

- **Don't add a separate vector DB.** Firestore + Vertex Vector
  Search 2.0 cover the surface for years.
- **Don't add CrewAI / AutoGen on top of LangGraph.** Pick one
  durable runtime.
- **Don't write a custom prompt-management system** (yet).
  Cloud Trace + Sentry + a `prompt_versions` Firestore collection
  is sufficient through Series A.
- **Don't ship "agents" that mutate canonical state directly.**
  Always propose → approve → write.
- **Don't conflate the SKC retrieval orchestrator with a generic
  RAG library.** Keep it tied to ACO + AnalystProfile.
- **Don't break the model-string discipline.** Pre-flight grep is
  saving real bugs; keep it.
- **Don't expand `tools.ts` further.** Refactor per category before
  it grows.

## 12.5 What to build first

1. **T1 — Structured extraction.** This is the single highest-
   leverage day-of-work in the entire memo.
2. **T2 — Document AI ingestion.** Closes the "scanned PDF yields
   nothing" failure mode.
3. **T6 — Sigma canvas.** Visible to every user; high impact on
   the demo.
4. **T7 — Eval harness.** No more shipping without a gate.
5. **T4 + T5 — `praxis-agents` Cloud Run + Brainstorming Table on
   LangGraph.** This is the differentiating product surface.

## 12.6 What to research later

- **GNN-based escalation prediction** on the conflict graph
  (PyTorch Geometric / DGL). Real research. Wait until the corpus
  is sufficient (10k+ situations).
- **Causal inference layer over events** (DoWhy / EconML) for
  policy counterfactuals — research-paper territory.
- **A2UI from Vertex Agent Builder** — agent-generated UI widgets
  for power tools. Cool, but only after the basic UI is rock solid.
- **MCP server export of PRAXIS context.** Strategic for ecosystem
  integrations once the API is stable.
- **Federated tenant graph queries.** When enterprise customers
  want cross-mission analysis without data movement.

## 12.7 What makes PRAXIS differentiated

After Phases 0–4, PRAXIS will be the only platform that combines:

1. **A peer-reviewable conflict ontology** (ACO 14 + 72) used by
   every tool, not just one.
2. **Durable, auditable agent workflows** with HITL by default —
   not optional and not bolted on.
3. **Calibrated context per analyst** — `AnalystProfile` +
   domain + situation + retrieval — that makes every output
   personalized to the user's role, lens, language, and red lines.
4. **Provenance-first UX** — every assertion traces to a typed
   graph node and a document chunk and a citation, exposed in the
   UI.
5. **Multi-persona deliberation** that produces a structured
   table of arguments (with critique, confidence, and synthesis),
   not a single LLM blob.
6. **Time-bounded facts** via Graphiti + temporal validation
   windows on every node and edge.
7. **Pure GCP-native, enterprise-ready posture** — VPC-SC, Model
   Armor, App Check, audit logs, per-tenant isolation by default.

That bundle is unique. Nothing in the open-source RAG landscape
nor in the agent-orchestration landscape nor in the conflict-
intelligence vendor landscape matches it.

---

# Appendix A — Verification commands

After implementing any task in §11, run:

```bash
# Lint + types
npm run lint
npx tsc --noEmit

# Standalone build (catches Next.js standalone issues)
npm run build

# Backend tests
cd backend && python -m pytest tests/ -v && cd ..

# Forbidden model strings — must return zero matches
rg "gemini-2\.0|gemini-2\.5|gemini-3-pro-preview" src/ backend/

# AI route calibration audit
node scripts/audit-ai-routes.mjs

# Tool registry sanity
npm run verify-tools

# GCP resource audit
npm run audit:gcp

# Vitest
npx vitest run

# Playwright smoke
npm run smoke:public
npm run smoke:golden-path

# Eval harness (when wired in T7)
pytest evals/ -v

# Local smoke
npm run dev   # frontend on :3000
docker-compose up   # backend + Neo4j + FalkorDB
```

# Appendix B — File-anchor index

The most important files referenced in this memo:

- `CLAUDE.md` — repo + architecture guide
- `cloudbuild.yaml` — CI/CD
- `package.json`, `backend/pyproject.toml` — dependency manifests
- `src/lib/ai/providers.ts` — single source of truth for models
- `src/lib/ai/tools.ts` — 3,330-line tool registry (refactor target)
- `src/lib/api/with-calibration.ts` — calibration middleware
- `src/lib/knowledge/situation-knowledge-core.ts` — SKC entry
- `src/lib/knowledge/vector-layer.ts` — Firestore native KNN
- `src/lib/knowledge/graph-layer.ts` — graph layer abstraction
- `src/lib/firebase/admin.ts` — Firebase Admin SDK init
- `src/app/api/ai/extract/route.ts` — TS extraction route
- `src/app/api/documents/upload/route.ts` — document upload
- `src/middleware.ts` — Edge routing + CSP
- `firestore.rules`, `firestore.indexes.json`, `storage.rules`
- `backend/main.py` — FastAPI app entry
- `backend/routers/pipeline.py` — pipeline orchestration
- `backend/graphify_tacitus/extract.py` — primitive extractor
- `backend/graphify_tacitus/schemas/aco.py`,
  `schemas/extraction.py`, `schemas/relationships.py` — ACO
- `backend/services/graph_adapter.py` — multi-backend graph
- `backend/services/gemini_client.py` — Gemini wrapper
- `backend/services/graphiti_client.py` — temporal graph
- `backend/agents/deep_research/agent.py` — ADK agent
- `cloud_functions/on_document_uploaded/` — document trigger
- `cloud_functions/on_situation_created/` — situation trigger
- `cloud_functions/gdelt_poller/` — feed worker pool
- `infrastructure/setup-gcp.sh`, `setup-spanner.sh`,
  `monitoring-alerts.sh` — IaC
- `docs/AGENTIC_SYSTEM.md` — agent registry
- `docs/CONTEXT_INJECTION.md` — calibration contract
- `docs/CORPUS_ARCHITECTURE.md` — retrieval contract
- `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` — flagship roadmap
- `docs/GCP_EXPANSION_PLAN_2026-04-26.md` — 12 GCP services to add
- `docs/OPERATIONAL_SPINE.md` — tool_runs / background_jobs / etc.

# Appendix C — Open questions (call out to the human)

These questions should be resolved before sprinting:

1. **Is Vertex AI Agent Engine billing acceptable** at the projected
   load (Memory Bank events + runtime)? If not, defer Memory Bank
   to Phase 4.
2. **Should the enterprise tier exist as a separate Spanner
   instance per customer or a shared instance with row-level
   isolation?** Affects T-Phase-2 cost model.
3. **Which language is the priority second after English?**
   Affects which translation model versions to pin in T-Phase-1.
4. **Is the user okay with a new top-level `evals/` directory at
   the repo root** or should it live under `backend/evals/`?
5. **Cloudflare in front of Cloud Run — is the existing TLS
   passthrough configuration documented?** Required for App Check
   replay protection.
6. **Are there any current customers who would be broken by the
   `tools/` ↔ `tool-data/` migration?** Affects rollback strategy
   for T-Phase-0.
7. **What's the policy on user-supplied LLM keys** (`USER_KEY_MASTER`)?
   If users routinely supply their own keys, the `instructor`-based
   extraction needs to support per-request key injection.
8. **VPC-SC perimeter scope** — is the goal to block all egress
   from the project, or only certain services?

---

*End of memo.*

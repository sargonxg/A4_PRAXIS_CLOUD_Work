# PRAXIS Strategic Agentic Roadmap — 2026-04-26

Purpose: consolidate the next high-impact improvements into a single execution
queue for Codex, Claude Code, and human operators. This document is intentionally
practical: each item states the user value, the architecture path, the first
files to inspect, and the definition of done.

Read with:

- `docs/PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md`
- `docs/CORPUS_ARCHITECTURE.md`
- `docs/AGENTIC_SYSTEM.md`
- `docs/NEXT_BRICKS_2026-04-26.md`
- `docs/superpowers/specs/2026-04-26-brainstorming-table-media-intelligence-plan.md`
- `docs/tools/UX_AUDIT_2026-04-26.md`
- `docs/DEPLOYMENT_LOG.md`

## North-Star Workflow

PRAXIS should feel like a daily analytical operating system:

1. The user creates or opens a situation.
2. PRAXIS assembles the live situation context: profile, mandate, sources,
   uploaded documents, graph, timeline, feed alerts, prior tool outputs, and
   open questions.
3. The dashboard tells the user what changed, what is missing, what is stale,
   and which tool should be run next.
4. Tools produce structured outputs with sources, confidence, assumptions,
   retrieval trace, and proposed updates.
5. Ask PRAXIS answers from the workspace corpus and can propose mutations, but
   user approval controls canonical knowledge.
6. Background agents keep feeds, documents, briefs, alerts, and graph deltas
   fresh through Cloud Run, Cloud Tasks, Pub/Sub, and Firestore.

## High-Impact Improvement Queue

| # | Improvement | User value | First implementation slice | Primary files/services |
|---|---|---|---|---|
| 1 | Dashboard Mission Control v2 | A user sees what matters this morning: changes, stale tools, open approvals, source gaps, and next action. | Add a `NextRecommendedAction` component using tool freshness, situation health, and role recommendations. | `src/app/app/dashboard/page.tsx`, `src/components/dashboard/*`, Firestore `tool_runs`, `system_events` |
| 2 | Situation Health Card | Each situation has a readiness score: sources, documents, graph, timeline, feeds, and last AI run. | Create `src/lib/situations/health.ts` with a test, then surface on dashboard and `/app/situations/[id]`. | Firestore situation doc, `tool-data`, `data_ingestions`, `background_jobs` |
| 3 | Canonical Tool Output Envelope | Every tool output becomes reusable context with provenance. | Define `ToolOutputEnvelope` and adapt one tool route plus `saveToolOutput`. | `src/types/tool-output.ts`, `src/lib/api/save-tool-output.ts`, `src/lib/knowledge/tool-output-layer.ts` |
| 4 | "Why This Output?" Panel | Analysts can defend an answer in a meeting. | Render model, profile version, domain version, source count, confidence, and retrieval query below one tool output. | New `src/components/praxis/output-provenance-panel.tsx` |
| 5 | Ask PRAXIS Workspace Operator | Chat becomes an interface to the corpus, not a generic assistant. | Add response cards for proposed edits and recommended tool runs; do not auto-write. | `src/app/api/ai/chat/route.ts`, `src/components/assistant/*`, `mutation-confirm-card.tsx` |
| 6 | ARGUS Personal Corpus | Ask PRAXIS reliably searches the user's situation-specific watch items and sources. | Expand the current corpus bridge with ranking, citation IDs, and UI disclosure. | `src/lib/argus/corpus-context.ts`, `docs/CORPUS_ARCHITECTURE.md`, Firestore `tool-data/argus`, `tool-data/sources-library` |
| 7 | Brainstorming Table MVP | Expert personas debate, criticize, and converge on policy options in a transparent table. | Build a read-only prototype route with personas, turns, claims, critiques, and synthesis schema. | New `/app/brainstorming-table`, `/api/ai/brainstorming-table`, Cloud Tasks queue `praxis-agents` |
| 8 | Media 24-Hour Roundup v2 | Users get a defensible morning media brief from keywords, source lists, and language filters. | Persist per-situation media keywords and source domains; pass them into Media Roundup query plan. | `src/lib/media/search-query.ts`, `/api/ai/media-roundup`, situation settings |
| 9 | Online Research Planner | Tools declare what they need to search before they search, avoiding opaque web calls. | Add a `ResearchPlan` type and show planned queries in Media Roundup / Deep Research. | `src/lib/ai/research-engine.ts`, `src/lib/ai/web-research.ts`, media tools |
| 10 | Graph Delta Approval Queue | Entity/relationship changes are proposed with evidence before entering the canonical graph. | Define `graph_updates` read/write helpers and show outstanding count on situation overview. | `src/lib/firebase/graph-service.ts`, `/app/situations/[id]`, backend graph extraction |
| 11 | Timeline From Evidence | The timeline is generated from source-backed events, not decorative sample content. | Build event normalization helper from documents/feed alerts/tool outputs. | `src/app/app/timeline/page.tsx`, `src/components/shared/conflict-timeline.tsx` |
| 12 | Document-to-Graph Citations | Clicking a graph node shows the paragraph or source that created it. | Add `documentId`/`chunkId` provenance to graph node shapes and UI. | Backend extraction, `src/components/graph/entity-panel.tsx`, Documents page |
| 13 | Humanitarian Route Promotion | Humanitarian analysis gets a dedicated calibrated route and structured output. | Add `/api/ai/humanitarian/route.ts` with schema, `withCalibration`, and persistence. | ReliefWeb/HDX/OCHA prompt layer, `with-credits.ts` |
| 14 | Notification Bell on Real Firestore | Users see actual background jobs, failures, and approvals. | Replace demo-only top-bar notifications with Firestore-backed notifications for auth users. | `src/components/shared/notifications.tsx`, `/api/notifications/[id]` |
| 15 | Cloud Tasks Agent Runner | Long analyses move out of request/response and become retryable, observable work. | Add a small task enqueue helper and one queued endpoint for Brainstorming Table turns. | `@google-cloud/tasks`, queues `praxis-agents`, `praxis-research`, Cloud Run frontend API handlers |
| 16 | Firestore Vector Search Pilot | Personal corpus retrieval stays close to the operational source of truth. | Prototype vector fields for document chunks and query top-k chunks for Ask PRAXIS. | Firestore vector indexes, Vertex AI embeddings, `retrieveRelevantChunks` |
| 17 | BigQuery Feed Intelligence Mart | Analysts and ops can query feed coverage, stale regions, and tool invocation trends. | Emit tool/run/feed metadata to BigQuery tables with hashed user IDs. | BigQuery `praxis_analytics`, `tool_runs`, `data_ingestions` |
| 18 | Admin Diagnostics Console v2 | Operators see service health without reading raw logs first. | Add cards for Cloud Tasks queue depth, worker last success, scheduler last run, and build revision. | `/app/admin/operator-console`, `/api/admin/operator-console`, `scripts/audit-gcp.mjs` |
| 19 | Demo Leak Removal | Authenticated users never see fictional Nordalia data unless in demo mode. | Audit top 10 pages for demo constants and replace with honest empty states. | `docs/tools/UX_AUDIT_2026-04-26.md`, affected pages |
| 20 | Release Identity and Handoff Hygiene | Users and operators see one version; future agents know what shipped. | Centralize version/build labels and update package metadata. | `src/lib/constants/app-version.ts`, sidebar, footer, docs |
| 21 | Trust Cleanup: No False Progress | UI must never claim background research or live data when the path is disabled. | Hide stale background-research affordance, return `501` for inactive queue, and remove live-mode demo fallback from Timeline. | `src/components/praxis/ai-populate.tsx`, `/api/research`, Timeline |

## Agentic Operating Structure

Use these lanes for parallel work. Each lane owns a disjoint set of files and
commits separately.

| Agent | Persona | Owns | Avoids | First mission |
|---|---|---|---|---|
| Codex-Architect | CTO/SRE | `infrastructure/*`, `scripts/audit-gcp.mjs`, Cloud Run, Cloud Tasks, Pub/Sub, deployment docs | Landing copy unless needed | Keep deployment green; add queue/worker diagnostics. |
| Codex-Product | Senior product engineer | Dashboard, situation overview, tool status, next action UX | Cloud Build/IAM | Ship Situation Health Card and next recommended action. |
| Claude-UX | UX researcher/designer | Landing, onboarding, empty states, docs clarity | Auth internals, infra scripts | Remove remaining stale/fake user claims and improve tool empty states. |
| Claude-Tools | Tool specialist | One tool at a time: Humanitarian, Media Roundup, Brainstorming Table | Shared shell unless required | Promote a partial tool to calibrated, persisted, cited output. |
| Data-Agent | Data engineer | Documents, graph provenance, BigQuery, embeddings, vector search | Marketing pages | Build document-to-graph provenance and corpus retrieval. |
| Red-Team | Reviewer | Tests, route audit, demo leaks, security copy, auth assumptions | Feature ownership | Find regressions before deploy. |

## Execution Plan

### Next 2 Hours

1. Finish release identity cleanup: one version constant, package version
   aligned, sidebar/footer fixed.
2. Close no-false-progress trust fixes: Timeline empty state instead of demo
   fallback, inactive background research returns `501`, Assistant modes map
   to API settings, and Feed Alerts expose source/Ask actions.
3. Add this roadmap and update handoff docs so Claude Code can start cleanly.
4. Run `npx tsc --noEmit --pretty false` and focused lint/type checks for
   touched files.
5. Push to `main`.

### Next 1 Day

1. Ship Situation Health Card.
2. Add real notification bell wiring.
3. Promote Humanitarian to a calibrated route or start Brainstorming Table MVP
   if Claude owns Humanitarian.
4. Add `ResearchPlan` display to Media Roundup.
5. Update `docs/tools/INDEX.md` and changelog after each tool moves.

### Next 3 Days

1. Canonical Tool Output Envelope for Briefing, Media Roundup, and Risk.
2. Output Provenance Panel shared across tools.
3. Graph Delta Approval Queue first slice.
4. Timeline from evidence-backed normalized events.
5. BigQuery feed/tool run export plan.

### Next 7 Days

1. Brainstorming Table MVP with expert turns, critique, synthesis, and export.
2. Cloud Tasks agent runner for long-running expert/table/research jobs.
3. Firestore vector search pilot for active-situation document chunks.
4. Admin Diagnostics Console v2 with queue depth, scheduler recency, worker
   last success, and production revision.
5. Demo leak audit closed for authenticated user paths.

## Architecture Notes From Current Google Cloud Docs

- Cloud Tasks HTTP target tasks are appropriate for durable work that can
  retry against Cloud Run endpoints and carry queue/task retry headers.
- Firestore vector search can run KNN queries over stored embeddings in the
  operational database; embeddings still need to be generated separately, e.g.
  with Vertex AI. Current documented limits include 2048 dimensions and no
  real-time snapshot listeners for vector queries.
- Cloud Run worker pools are currently documented as Preview / Pre-GA; keep
  GDELT worker-pool usage behind explicit ops checks and document fallback
  paths for scheduled Cloud Run jobs if support posture changes.
- Vertex AI is the correct managed AI platform for enterprise controls,
  grounding, embeddings, model routing, and future Agent Engine work.

Official references checked 2026-04-26:

- <https://docs.cloud.google.com/tasks/docs/creating-http-target-tasks>
- <https://docs.cloud.google.com/firestore/docs/vector-search>
- <https://docs.cloud.google.com/run/docs/managing/workerpools>
- <https://cloud.google.com/vertex-ai/generative-ai/docs>

## Claude Code Copy-Paste Prompt

```text
Continue PRAXIS from a fresh pull of main.

Run first:
git pull origin main
git status
git log --oneline -8

Read in this order:
- CLAUDE.md
- AGENTS.md
- CHANGELOG.md
- docs/CONTINUATION.md
- docs/DEPLOYMENT_LOG.md
- docs/NEXT_BRICKS_2026-04-26.md
- docs/PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md
- docs/STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md
- docs/tools/UX_AUDIT_2026-04-26.md

Your mission:
Act as UX lead + tool-quality engineer for policy analysts and diplomats.
Pick one lane only and keep file ownership tight:
1. Humanitarian route promotion, or
2. Brainstorming Table MVP shell + route spec, or
3. Dashboard/Situation Health Card UX.

Definition of done:
- The user sees a clearer, more useful workflow for an active situation.
- No authenticated page renders fictional demo data unless demo mode is active.
- AI routes use withCalibration with the correct tool ID and credit operation.
- Outputs persist with provenance where applicable.
- Docs updated: CHANGELOG.md, docs/CONTINUATION.md, and the relevant tool/spec doc.
- Validation: npx tsc --noEmit --pretty false; node scripts/audit-ai-routes.mjs;
  focused vitest for touched logic; npm run build if shared UI or routes changed.
- Commit with a clear message and push to origin main.
- Do not alter Cloud Run/Firebase/IAM unless your lane explicitly requires it.
```

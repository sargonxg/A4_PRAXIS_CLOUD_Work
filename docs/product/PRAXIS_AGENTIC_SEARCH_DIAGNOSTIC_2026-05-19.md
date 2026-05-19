# PRAXIS Agentic Search Diagnostic

Date: 2026-05-19

## Runtime Inventory

- Ask entrypoint: `src/app/api/ai/chat/route.ts`
- Ask orchestration receipt: `src/lib/ai/ask-orchestrator.ts`
- AgentRun API: `src/app/api/agents/runs/route.ts`
- Run detail and stream APIs: `src/app/api/agents/runs/[runId]/route.ts`, `src/app/api/agents/runs/[runId]/stream/route.ts`
- Worker execution: `src/app/api/agents/runs/[runId]/execute/route.ts`, `src/lib/agent-runtime/worker.ts`
- Cloud Tasks dispatch: `src/lib/agent-runtime/cloud-tasks.ts`
- ADK bridge: `src/lib/agent-runtime/adk-bridge.ts`
- Genkit flow bridge: `src/lib/agent-runtime/capsule-factory.ts`, `src/lib/agent-runtime/mirror.ts`
- Grounding posture: `src/lib/agent-runtime/grounding-adapter.ts`
- Read-only health endpoint: `src/app/api/health/agentic-search/route.ts`
- CLI audit: `npm run audit:agentic-search`
- User-visible status: Advanced/System settings, Research runtime card

## Current Flow

Ask PRAXIS remains the canonical cockpit. A logged-in Ask turn resolves the active ContextCapsule, builds a runtime receipt, classifies task depth, selects tools, and queues an `AgentRun` when the task is deep, current, multi-source, or specialist-agent shaped.

Deep/current/source-heavy Ask turns fold into the live `research-memo` policy agent. When the `deep-search-agent` tool is selected, the queued run now carries `metadata.deepSearch = true` plus a `groundingPlan` that records which grounding modes are active or deferred. The durable PRAXIS run id, trace id, tool ids, receipt posture, and output destination remain canonical; ADK session ids stay substrate metadata.

## Visible Process Rail

Ask timeline labels now use the compact process language:

1. Reading capsule
2. Planning searches
3. Checking sources
4. Retrieving documents
5. Reviewing gaps
6. Synthesizing memo
7. Saving output

Each label maps to an orchestration receipt stage. The Advanced receipt remains the place for trace id, queued run id, selected tools, model tier, grounding posture, approval gates, and output target.

## Grounding Modes

Supported now:

- `internal_capsule_corpus`
- `uploaded_documents`
- `google_search` when `VERTEX_GROUNDING_GOOGLE_SEARCH_ENABLED=true`

Deferred until run-ledger and receipt visibility are stable:

- `vertex_ai_search`
- `gemini_enterprise_datastore`

PRAXIS receipts remain canonical. Google grounding metadata can attach to receipts, and Google Search suggestion display is required whenever `google_search` mode is active.

## Blockers And Diagnostics

`/api/health/agentic-search` returns `ready`, `degraded`, or `blocked` with exact missing config names. It checks:

- Cloud SQL run ledger config
- Cloud Tasks queue names
- worker route URL and auth posture
- Vertex/Gemini project config
- ADK/Agent Platform runtime id
- Genkit provider config
- Vertex Google Search grounding flag
- route/runtime inventory

Required blockers are the durable run ledger and worker dispatch auth. Missing ADK, Genkit, and Google Search grounding degrade the runtime but do not block the PRAXIS-led MVP.

## Remaining Work

- Move the legacy direct `/api/ai/deep-search-agent` route behind the run worker or make it a compatibility wrapper that creates/attaches an `AgentRun`.
- Persist parsed ADK source and tool-call events into `agent_tool_calls` and source receipts, not only normalized run events.
- Bind the focused Ask rail to `/api/agents/runs/[runId]/stream` for live updates after dispatch.
- Add authenticated Playwright coverage for an Ask turn that queues deep research, opens the run, inspects receipts, and saves output.

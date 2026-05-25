# Agentic Search Redflags (2026-05-25)

Status: blocked

| Redflag | Status | Detail |
| --- | --- | --- |
| local_env_blockers | blocked | Missing: AGENT_RUNTIME_DATABASE_URL or PRAXIS_DATABASE_URL or DATABASE_URL, AGENT_RUN_TASKS_PROJECT, AGENT_RUN_TASKS_LOCATION, AGENT_RUN_TASKS_QUEUE, AGENT_RUN_WORKER_BASE_URL or NEXT_PUBLIC_APP_URL or APP_URL or VERCEL_PROJECT_PRODUCTION_URL, AGENT_RUN_WORKER_SHARED_SECRET or AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL+AGENT_RUN_WORKER_OIDC_AUDIENCE, GOOGLE_VERTEX_PROJECT or GOOGLE_CLOUD_PROJECT or GCLOUD_PROJECT, VERTEX_AGENT_ENGINE_ID or GOOGLE_ADK_AGENT_ENGINE_ID, GOOGLE_GENAI_API_KEY or GOOGLE_AI_API_KEY or GEMINI_API_KEY or GOOGLE_VERTEX_PROJECT, VERTEX_GROUNDING_GOOGLE_SEARCH_ENABLED, RESEARCH_GRAPH_ENABLED |
| production_readiness | blocked | Agentic search blocked |
| agent_run_ledger | blocked | Durable deep-search runs need Cloud SQL before Ask can claim queued research. |
| stream_availability | ready | AgentRun stream route is present in inventory. |
| grounding_configured | degraded | Google Search grounding is not explicitly enabled; keep current-source claims caveated. |
| adk_configured | degraded | ADK is optional for MVP but missing; deep search should remain PRAXIS-led until configured. |
| saved_output_persistence | ready | AgentRun ledger, events, tool calls, approvals, and artifacts are checked by runtime inventory. |
| app_search_proof | ready | Unified app-search route, service, GlobalSearch wiring, and contract audit are present. |

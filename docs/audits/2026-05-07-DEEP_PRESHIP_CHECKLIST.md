# PRAXIS Deep Pre-Ship Checklist Audit

Date: 2026-05-07

Summary: 94 PASS, 3 WARN, 0 BLOCKED across 97 static pre-ship checks.

This audit is deliberately conservative: live staging checks, Cloud SQL restore tests, load tests, browser sessions, and Vertex billing comparisons remain blocked until run against staging/production credentials and datasets.

## 1. Database, migrations, RLS, connection pool

| Status | Check | Evidence | Remediation |
|---|---|---|---|
| PASS | Required table cases | Migration creates cases. | None. |
| PASS | Required table workspaces | Migration creates workspaces. | None. |
| PASS | Required table situation_frames | Migration creates situation_frames. | None. |
| PASS | Required table source_receipts | Migration creates source_receipts. | None. |
| PASS | Required table aco_cognee_link | Migration creates aco_cognee_link. | None. |
| PASS | Required table graph_nodes | Migration creates graph_nodes. | None. |
| PASS | Required table graph_edges | Migration creates graph_edges. | None. |
| PASS | Required table research_threads | Migration creates research_threads. | None. |
| PASS | Required table ach_hypotheses | Migration creates ach_hypotheses. | None. |
| PASS | Required table ach_cells | Migration creates ach_cells. | None. |
| PASS | Required table dialectica_runs | Migration creates dialectica_runs. | None. |
| PASS | Required table memos | Migration creates memos. | None. |
| PASS | Required table memo_versions | Migration creates memo_versions. | None. |
| PASS | Required table briefings | Migration creates briefings. | None. |
| PASS | Required table drafts | Migration creates drafts. | None. |
| PASS | Required table workspace_suggestions | Migration creates workspace_suggestions. | None. |
| PASS | Required table workspace_events_log | Migration creates workspace_events_log. | None. |
| PASS | Required table workspace_orchestrator_log | Migration creates workspace_orchestrator_log. | None. |
| PASS | Required table cognee_pending_writes | Migration creates cognee_pending_writes. | None. |
| PASS | Required table notifications | Migration creates notifications. | None. |
| PASS | Required table notification_preferences | Migration creates notification_preferences. | None. |
| PASS | cases.case_type column | Migration text references case_type. | Add case_type to the canonical case record if Postgres cases are part of the production substrate. |
| PASS | cases.case_type_secondary column | Migration text references case_type_secondary. | Add case_type_secondary to the canonical case record if Postgres cases are part of the production substrate. |
| PASS | situation_frames owner/case index | situation_frames has owner_uid/case_id index marker. | None. |
| PASS | source_receipts owner/case index | source_receipts has owner_uid/case_id index marker. | None. |
| PASS | research_threads owner/case index | research_threads has owner_uid/case_id index marker. | None. |
| PASS | memos owner/case index | memos has owner_uid/case_id index marker. | None. |
| PASS | drafts owner/case index | drafts has owner_uid/case_id index marker. | None. |
| PASS | briefings owner/case index | briefings has owner_uid/case_id index marker. | None. |
| PASS | dialectica_runs owner/case index | dialectica_runs has owner_uid/case_id index marker. | None. |
| PASS | workspace_suggestions owner/case index | workspace_suggestions has owner_uid/case_id index marker. | None. |
| PASS | workspace_orchestrator_log owner/case index | workspace_orchestrator_log has owner_uid/case_id index marker. | None. |
| PASS | cases RLS policy | cases has RLS and tenant policy markers. | None. |
| PASS | workspaces RLS policy | workspaces has RLS and tenant policy markers. | None. |
| PASS | situation_frames RLS policy | situation_frames has RLS and tenant policy markers. | None. |
| PASS | source_receipts RLS policy | source_receipts has RLS and tenant policy markers. | None. |
| PASS | research_threads RLS policy | research_threads has RLS and tenant policy markers. | None. |
| PASS | memos RLS policy | memos has RLS and tenant policy markers. | None. |
| PASS | drafts RLS policy | drafts has RLS and tenant policy markers. | None. |
| PASS | briefings RLS policy | briefings has RLS and tenant policy markers. | None. |
| PASS | dialectica_runs RLS policy | dialectica_runs has RLS and tenant policy markers. | None. |
| PASS | workspace_suggestions RLS policy | workspace_suggestions has RLS and tenant policy markers. | None. |
| PASS | workspace_events_log RLS policy | workspace_events_log has RLS and tenant policy markers. | None. |
| PASS | workspace_orchestrator_log RLS policy | workspace_orchestrator_log has RLS and tenant policy markers. | None. |
| PASS | notifications RLS policy | notifications has RLS and tenant policy markers. | None. |
| PASS | notification_preferences RLS policy | notification_preferences has RLS and tenant policy markers. | None. |
| PASS | backend/main.py includes @app.get("/metrics") | backend/main.py contains required marker. | None. |
| PASS | backend/main.py includes render_prometheus | backend/main.py contains required marker. | None. |
| PASS | backend/main.py includes PlainTextResponse | backend/main.py contains required marker. | None. |

## 5. Tenant isolation

| Status | Check | Evidence | Remediation |
|---|---|---|---|
| PASS | backend/services/postgres.py includes set_config('app.tenant_id', %s, true) | backend/services/postgres.py contains required marker. | None. |
| PASS | backend/services/postgres.py includes asynccontextmanager | backend/services/postgres.py contains required marker. | None. |
| PASS | backend/services/postgres.py includes AsyncConnectionPool | backend/services/postgres.py contains required marker. | None. |
| PASS | backend/services/postgres.py includes record_tenant_session_reset | backend/services/postgres.py contains required marker. | None. |

## 2. Cognee substrate wrapper

| Status | Check | Evidence | Remediation |
|---|---|---|---|
| PASS | backend/services/metrics.py includes cognee_calls_total | backend/services/metrics.py contains required marker. | None. |
| PASS | backend/services/metrics.py includes cognee_failures_total | backend/services/metrics.py contains required marker. | None. |
| PASS | backend/services/metrics.py includes cognee_latency_seconds | backend/services/metrics.py contains required marker. | None. |
| PASS | backend/services/metrics.py includes tenant_session_resets_total | backend/services/metrics.py contains required marker. | None. |
| PASS | backend/services/metrics.py includes render_prometheus | backend/services/metrics.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes def dataset_for | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes async def improve | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes async def add | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes async def cognify | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes async def memify | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes async def search | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes async def remember | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes async def recall | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes async def forget | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes def get_resolver | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes def get_data_points | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | backend/services/cognee_memory.py includes record_cognee_call | backend/services/cognee_memory.py contains required marker. | None. |
| PASS | Dataset names flow through cognee_memory.dataset_for | No inline owner_uid__case_id construction found outside wrapper. | Replace inline dataset-name construction with MemoryScope or dataset_for(). |

## 3. ACO ontology system

| Status | Check | Evidence | Remediation |
|---|---|---|---|
| PASS | backend/services/ontology_system.py includes ONTOLOGY_VERSION | backend/services/ontology_system.py contains required marker. | None. |
| PASS | backend/services/ontology_system.py includes CASE_TYPES | backend/services/ontology_system.py contains required marker. | None. |
| PASS | backend/services/ontology_system.py includes ontology_stack_for_case_types | backend/services/ontology_system.py contains required marker. | None. |
| PASS | backend/services/ontology_system.py includes ontology_cache_snapshot | backend/services/ontology_system.py contains required marker. | None. |
| PASS | Base and ten specialization OWL files exist | base=true; specializations=10 | Add the missing OWL files before marking ontology functional complete. |
| PASS | backend/main.py includes /v1/debug/ontology/cache | backend/main.py contains required marker. | None. |
| PASS | backend/main.py includes /v1/debug/case/{case_id}/ontology | backend/main.py contains required marker. | None. |

## 6. Workspace orchestrator

| Status | Check | Evidence | Remediation |
|---|---|---|---|
| PASS | Workspace orchestrator marker on_situation_frame_saved | Found on_situation_frame_saved. | Wire on_situation_frame_saved before the orchestrator checklist can be complete. |
| PASS | Workspace orchestrator marker workspace_orchestrator_log | Found workspace_orchestrator_log. | Wire workspace_orchestrator_log before the orchestrator checklist can be complete. |
| PASS | Workspace orchestrator marker workspace_suggestions | Found workspace_suggestions. | Wire workspace_suggestions before the orchestrator checklist can be complete. |

## 7. Vertex Gemini integration

| Status | Check | Evidence | Remediation |
|---|---|---|---|
| PASS | Allowed model gemini-3-flash present | gemini-3-flash appears in source. | Confirm model routing matrix if this is intentional. |
| PASS | Allowed model gemini-3.1-pro-preview present | gemini-3.1-pro-preview appears in source. | Confirm model routing matrix if this is intentional. |
| WARN | No banned direct model marker gpt- | gpt- marker found; run audit:model-strings for allowlist context. | Move direct model strings into the approved provider matrix or update the allowlist audit. |
| WARN | No banned direct model marker claude- | claude- marker found; run audit:model-strings for allowlist context. | Move direct model strings into the approved provider matrix or update the allowlist audit. |
| PASS | No banned direct model marker gemini-1. | gemini-1. marker not found. | None. |
| WARN | No banned direct model marker gemini-2. | gemini-2. marker found; run audit:model-strings for allowlist context. | Move direct model strings into the approved provider matrix or update the allowlist audit. |

## 9. MCP server

| Status | Check | Evidence | Remediation |
|---|---|---|---|
| PASS | backend/mcp/praxis_server.py includes praxis.list_cases | backend/mcp/praxis_server.py contains required marker. | None. |
| PASS | backend/mcp/praxis_server.py includes praxis.get_situation_frame | backend/mcp/praxis_server.py contains required marker. | None. |
| PASS | backend/mcp/praxis_server.py includes praxis.list_sources | backend/mcp/praxis_server.py contains required marker. | None. |
| PASS | backend/mcp/praxis_server.py includes praxis.get_graph | backend/mcp/praxis_server.py contains required marker. | None. |
| PASS | backend/mcp/praxis_server.py includes praxis.recall | backend/mcp/praxis_server.py contains required marker. | None. |

## 16. CI / audit scripts

| Status | Check | Evidence | Remediation |
|---|---|---|---|
| PASS | audit:cognee script exists | audit:cognee is in package.json. | Add package script audit:cognee. |
| PASS | audit:workspace-tabs-chapters script exists | audit:workspace-tabs-chapters is in package.json. | Add package script audit:workspace-tabs-chapters. |
| PASS | audit:substrate-writers script exists | audit:substrate-writers is in package.json. | Add package script audit:substrate-writers. |
| PASS | audit:orchestrator-writes script exists | audit:orchestrator-writes is in package.json. | Add package script audit:orchestrator-writes. |
| PASS | audit:ontology-system script exists | audit:ontology-system is in package.json. | Add package script audit:ontology-system. |


# Workspace Tabs and Chapters Second Pass

Date: 2026-05-07

Source prompts:

- `docs/codex-prompts/WORKSPACE_RETHINK.md`
- `docs/codex-prompts/TABS_BUILD_GUIDE.md`
- `docs/codex-prompts/CHAPTERS_BUILD_GUIDE.md`

## Implemented In This Pass

- Context tab moved from a generic note frame to the four-field situation frame required by the tabs guide.
- Context saves now route through the tab backend and write a Cognee `Situation` data point, with retry rows in `cognee_pending_writes` when the isolated Cognee service is unavailable.
- Library backend coverage now includes upload ingest, source list, source detail, re-extract, and soft-delete.
- Library ingest calls Cognee `add` and `cognify` through disabled-safe wrappers and records the status on the source receipt.
- Chapter backend coverage now includes Desk Q&A, Research thread lifecycle, Memos, Drafts, ACH helper endpoints, Tools recipe runs, and Boardroom briefing endpoints.
- Tools now include all 12 DIALECTICA recipes requested by the workspace rethink guide.
- MCP context reads now include research threads, memos, and drafts.
- Legacy chapter `?tab=` links were removed so the four-tab contract remains clean.
- Audit scripts were expanded to assert the new endpoints, recipes, MCP reads, four-field context editor, and absence of legacy chapter tab links.

## Follow-Up Frontend Wiring

- Context's inline document upload now posts to `/api/backend/tabs/library/ingest`, so upload handoffs create Library source receipts instead of using the older document-only endpoint.
- Library now reads backend source receipts from `/api/backend/tabs/library`, displays Cognee/embedding/node status fields, uploads files through the Library ingest route, and exposes re-extract plus remove-receipt actions.
- Research now lists backend research threads, opens a thread from the active question, runs recall through `/api/backend/chapters/research/threads/{threadId}/recall`, and closes a thread through the memify path.
- Memo Studio now writes saved/exported memo versions to `/api/backend/chapters/memos` and includes a "Suggest content" action through `/api/backend/chapters/memos/{memoId}/assist`.
- `audit:workbench` now asserts the frontend/backend wiring for Library ingest/source management and Research thread recall.

## Still Not Complete

- Live Cognee execution is not inside this monolith. The application now degrades and queues correctly, but the isolated `praxis-cognee` service still has to fulfill live `remember/add/cognify/search/memify/forget`.
- Several chapter frontends still consume existing local/demo stores rather than the new backend endpoints.
- Draft, ACH, Tools, and Boardroom still need the same level of frontend/backend connection that Library, Research, and Memo Studio received in this follow-up pass.
- LangGraph orchestration is represented by subgraph skeletons and event logging; it is not yet a full durable multi-agent execution graph.
- Migrations `0015_workspace_tabs_chapters.py` and `0016_workspace_chapter_products.py` must be applied in staging/production before these SQL-backed endpoints are production-ready.
- Browser e2e tests for the new source ingest, research recall, memo assist, draft cite/export, ACH suggestion, tools recipe, and boardroom briefing routes remain to be added.

## Verification Target

- `python -m py_compile` on the new backend routers/services.
- `npm run typecheck`
- `npm run audit:workspace-tabs-chapters`
- `npm run audit:substrate-writers`
- `npm run audit:orchestrator-writes`
- `npm run audit:workbench`
- `npm run build`
- `npm run test`
- `graphify update .`

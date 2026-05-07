# Workspace Tabs and Chapters Foundation

Status: implemented foundation, 2026-05-07.

Source prompts:

- `docs/codex-prompts/WORKSPACE_RETHINK.md`
- `docs/codex-prompts/TABS_BUILD_GUIDE.md`
- `docs/codex-prompts/CHAPTERS_BUILD_GUIDE.md`

## Product Shape

PRAXIS workbench now separates substrate tabs from desk chapters.

Tabs are the persistent substrate strip and are limited to four canonical surfaces:

1. Context
2. Library
3. Ontology
4. Graph

Tabs open as an overlay above the desk so the chapter workspace remains mounted.

Chapters are the working panes on the desk:

1. Desk, always on
2. Research
3. Memos
4. Draft
5. ACH
6. Tools
7. Boardroom

## Code Anchors

- Tab registry: `src/tabs/`
- Chapter registry: `src/chapters/`
- Workbench shell: `src/components/workbench/workbench-active-case.tsx`
- Chapter desk renderer: `src/components/workbench/chapter-renderer.tsx`
- Tab descriptors: `src/lib/workbench/tabs.ts`
- Chapter descriptors: `src/lib/workbench/chapter-flow.ts`
- Workspace event hook: `src/hooks/useOrchestratorEvents.ts`

## Backend Anchors

- Tab router: `backend/routers/tabs.py`
- Chapter router: `backend/routers/chapters.py`
- Workspace event router: `backend/routers/workspace.py`
- Orchestrator skeleton: `backend/services/workspace_orchestrator/`
- Cognee ACO models: `backend/services/cognee_aco_models.py`
- Workspace migration: `backend/migrations/versions/0015_workspace_tabs_chapters.py`
- MCP read surface: `backend/mcp/praxis_server.py`

## Guardrails

- Cognee remains disabled-safe. Calls return honest queued/disabled states when the isolated Cognee service is not enabled.
- Cognee search routes enforce `save_interaction=True`.
- Chapters must not write substrate tables directly.
- The orchestrator may write only advisory/log/candidate surfaces, not canonical work-product or substrate tables.

## Audits

- `npm run audit:workspace-tabs-chapters`
- `npm run audit:substrate-writers`
- `npm run audit:orchestrator-writes`

Known remaining work:

- Replace stubbed SSE coach/desk streams with live LangGraph subgraphs.
- Apply the new migration in staging/production before relying on the SQL endpoints.
- Move frontend tab overlay content to `src/tabs/registry.ts` directly once the legacy workbench components are fully retired.
- Add browser e2e coverage for tab overlays and chapter toggles.

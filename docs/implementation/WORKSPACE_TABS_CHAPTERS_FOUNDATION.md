# Workspace Tabs and Chapters Foundation

Status: implemented foundation plus second pass, 2026-05-07.

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
- Follow-up convergence migration: `backend/migrations/versions/0016_workspace_chapter_products.py`
- MCP read surface: `backend/mcp/praxis_server.py`

## Second-Pass Coverage

- Context now saves the guide's four-field situation frame: what is happening, why it matters, what would change the assessment, and the policy question.
- Situation-frame writes are remembered as a Cognee `Situation` data point and queued in `cognee_pending_writes` when Cognee is disabled or unavailable.
- Library now has authenticated ingest, list, detail, re-extract, and soft-delete endpoints. Ingest calls Cognee `add` plus `cognify` when available, and records disabled/queued status honestly.
- Chapters now expose backend APIs for Desk Q&A, Research threads and recall, Memos, Drafts, ACH, Tools recipe runs, and Boardroom briefings.
- Tools now expose the 12 DIALECTICA recipes: stakeholder map, contradiction scan, constraint leverage map, commitment tracker, narrative arc, ambiguity audit, red-team counterclaim, counterfactual branch, evidence gap finder, policy option generator, risk weighting, and decision memo synthesis.
- MCP read surfaces now include research threads, memos, and drafts for agent/tool context interop.
- Legacy chapter targets are no longer encoded as `?tab=` links; substrate tabs stay in the tab query and chapters use the workbench chapter rail/hash entrypoints.

## Guardrails

- Cognee remains disabled-safe. Calls return honest queued/disabled states when the isolated Cognee service is not enabled.
- Cognee search routes enforce `save_interaction=True`.
- Chapters must not write substrate tables directly.
- The orchestrator may write only advisory/log/candidate surfaces, not canonical work-product or substrate tables.

## Audits

- `npm run audit:workspace-tabs-chapters`
- `npm run audit:substrate-writers`
- `npm run audit:orchestrator-writes`
- `npm run audit:workbench`

Known remaining work:

- Replace stubbed SSE coach/desk streams with live LangGraph subgraphs.
- Apply migrations `0015_workspace_tabs_chapters.py` and `0016_workspace_chapter_products.py` in staging/production before relying on the SQL endpoints.
- Build full frontend controls for every new chapter endpoint; the backend contract is present, while several existing panes still use local/demo state until connected.
- Wire the isolated live Cognee service behind `backend/services/cognee_memory.py`; current routes are deliberately disabled-safe and queue work rather than failing user flows.
- Add browser e2e coverage for tab overlays, source ingest, research recall, memo assist, draft cite/export, ACH suggestions, recipe runs, and boardroom briefings.

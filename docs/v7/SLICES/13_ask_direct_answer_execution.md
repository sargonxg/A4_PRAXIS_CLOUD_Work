# Slice 13 - Ask Direct Answer Execution

## Purpose

Move the first Ask PRAXIS action from receipt-only scaffolding to an execution seam that uses the resolved Context Core snapshot. This slice keeps the scope narrow: only `direct_answer` turns execute from the core snapshot; skill and subagent routes remain staged until their dedicated executors ship.

## Scope

- Add `backend/services/ask/executor.py`.
- Build a direct-answer prompt from `coreContext`, ontology binding, context health, and advisories.
- Add `PRAXIS_V7_ASK_AI_ENABLED`, default false, so local CI and preview environments do not require live Vertex credentials.
- When the flag is enabled, call the backend Vertex/Gemini client for direct-answer turns.
- When the flag is disabled or Vertex fails, persist a context-grounded preview instead of pretending a model answer ran.
- Persist execution metadata on the assistant `ask_messages` row.
- Persist core citations in `ask_message_citations`.
- Show execution runtime and core citation receipts in the Ask UI.
- Add `audit:v7-ask-direct-execution` and wire it into `audit:gate` and `audit:architecture-chain`.

## Out of Scope

- Skill execution from Ask.
- Subagent plan execution from Ask.
- Streaming SSE.
- Live model calls in local CI.
- Usage-cost accounting beyond deterministic token estimates.
- Cognee recall or Source/Document Core retrieval.

## Acceptance Criteria

- `python -m py_compile backend\services\ask\executor.py backend\routers\ask.py backend\config.py` passes.
- `npm run audit:v7-ask-direct-execution` passes.
- `npm run audit:v7-ask-runtime` passes.
- `npm run audit:v7-ask-core-resolution` passes.
- `npm run audit:architecture-chain` passes.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Flagged Playwright smoke shows an Ask turn with visible `Routing:`, `Candidate skills:`, and `Context:` receipts; local fallback continues to render without a Python backend.

## Rollback

Remove `backend/services/ask/executor.py`, restore `/ask/run` assistant messages to receipt-only persistence, remove `PRAXIS_V7_ASK_AI_ENABLED`, remove execution/citation UI receipts, and remove `audit:v7-ask-direct-execution` from `package.json` and `audit-architecture-chain`.

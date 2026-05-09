# Slice 15 - Ask Core Skill Execution

## Purpose

Make staged Analyst Skills useful inside the simplified Ask PRAXIS surface. The first slice executes a small set of read-only consolidated skills directly from the resolved Context Core snapshot, without exposing the old tool marketplace or pretending every specialist tool is finished.

## Scope

- Extend `backend/services/ask/executor.py` with supported core-aware skills:
  - `research-sources`
  - `actors-stakeholders`
  - `briefing-studio`
- Build skill-specific prompts from `coreContext`.
- When `PRAXIS_V7_ASK_AI_ENABLED=true`, call Vertex/Gemini for supported skill runs.
- When the flag is disabled, persist a deterministic core-grounded skill preview with clear missing-core next actions.
- Keep unsupported skills and subagent plans as honest staged receipts.
- Preserve core citations through `ask_message_citations`.
- Update the Ask skill contract copy so it no longer claims all skill execution is future work.
- Add `audit:v7-ask-skill-execution` and wire it into `audit:gate` and `audit:architecture-chain`.

## Out of Scope

- Executing all 55 registered tools.
- Mutating graph/source/output state from a skill.
- Streaming SSE.
- Tool-specific canary fixtures for every preserved legacy tool.
- Full cost accounting beyond the existing deterministic estimate.

## Acceptance Criteria

- `python -m py_compile backend\services\ask\executor.py backend\routers\ask.py` passes.
- `npm run audit:v7-ask-skill-execution` passes.
- `npm run audit:v7-ask-direct-execution` passes.
- `npm run audit:v7-ask-runtime` passes.
- `npm run audit:architecture-chain` passes.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Flagged Playwright smoke can stage `briefing-studio`, submit an Ask turn, and see a saved skill execution receipt without the old marketplace.

## Rollback

Remove `SUPPORTED_CORE_SKILLS`, `build_skill_prompt`, and the supported-skill execution branch from `backend/services/ask/executor.py`; restore the Ask skill contract copy; remove `audit:v7-ask-skill-execution` from `package.json` and `audit-architecture-chain`.

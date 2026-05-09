# Slice 11 - Ask Routing Layer

## Purpose

Make Ask PRAXIS inspectable before the full calibrated execution cutover. A user should be able to save an Ask turn, see whether PRAXIS classified it as a direct answer, skill run, subagent plan, or clarification, and see the staged skill/subagent target without the UI pretending that full v7 AI execution has already landed.

## Scope

- Add `backend/services/ask/router.py` with deterministic, inspectable routing heuristics for the four v7 actions: `direct_answer`, `run_skill`, `run_subagent_plan`, and `clarify`.
- Respect an explicitly staged Analyst Skill from `/app/ask?skill=<id>`.
- Persist routing metadata on the assistant receipt in `ask_messages`.
- Include the top three candidate skill IDs in the routing receipt so the next execution slice can turn suggestions into real runs.
- Return the routing decision from `/api/v1/ask/run`.
- Show the routing decision and candidate skills in `V7AskRuntimePanel`.
- Add `audit:v7-ask-routing-layer` and wire it into `audit:gate` and `audit:architecture-chain`.

## Out of Scope

- Full calibrated model execution from the new Ask router.
- Streaming SSE.
- Tool-run execution.
- Citation persistence from generated answers.
- New user-facing tools or skills.

## Acceptance Criteria

- `python -m py_compile backend\services\ask\router.py backend\routers\ask.py backend\services\ask\types\models.py backend\services\ask\types\__init__.py` passes.
- `npm run audit:v7-ask-routing-layer` passes.
- `npm run audit:v7-ask-runtime` passes.
- `npm run audit:ask-thread-substrate` passes.
- `npm run audit:architecture-chain` passes.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Flagged Playwright smoke shows an Ask turn saved and a visible `Routing:` receipt.

## Rollback

Remove `backend/services/ask/router.py`, remove `skill_id` from Ask run contracts, restore `/ask/run` to persistence-only receipts, remove `audit:v7-ask-routing-layer` from `package.json` and `audit-architecture-chain`, and remove the routing receipt from `V7AskRuntimePanel`.

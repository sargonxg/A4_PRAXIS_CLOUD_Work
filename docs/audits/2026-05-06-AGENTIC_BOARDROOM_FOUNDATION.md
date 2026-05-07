# Pack 16 Agentic Boardroom Foundation Pass

Date: 2026-05-06

## Implemented

- Stored Pack 16 at `docs/codex-prompts/PRAXIS_CODEX_16_AGENTIC_BOARDROOM.md`.
- Added shared Boardroom Zod types at `src/types/boardroom.ts`.
- Added Pydantic mirrors at `backend/types/boardroom.py`.
- Added ten canonical persona specs with deep profiles, voice rules, tool affinity, and versioned corpus manifests.
- Added deterministic foundation orchestration that produces citable synthesized deliberation artifacts under a $1.50 cost ceiling.
- Added authenticated Boardroom API routes:
  - `GET/POST /api/boardroom/deliberations?caseId=...`
  - `GET/PATCH /api/boardroom/deliberations/[deliberationId]?caseId=...`
  - `POST /api/boardroom/deliberations/[deliberationId]/start`
  - `POST /api/boardroom/deliberations/[deliberationId]/abort`
  - `GET /api/boardroom/deliberations/[deliberationId]/export?caseId=...&format=docx|md`
  - `POST /api/boardroom/deliberations/[deliberationId]/synthesis/promote`
- Added first-class workbench routes:
  - `/app/workbench/[caseId]/boardroom`
  - `/app/workbench/[caseId]/boardroom/new`
  - `/app/workbench/[caseId]/boardroom/[deliberationId]`
  - `/app/workbench/[caseId]/boardroom/[deliberationId]/synthesis`
- Added visual boardroom components: round table, geometric avatars, speech bubbles, citation pills, tool-use indicators, moderator chyron, transcript pane, and playback controls.
- Added DOCX and Markdown exports for deliberation synthesis and transcript.
- Added synthesis claim promotion into the existing `graph_updates` review queue. Claims remain synthesized and advisory until a user approves the proposal.
- Added start and abort lifecycle controls. The local stream is deterministic SSE; live Agent Engine token/turn streaming remains the staging follow-up.
- Added custom persona authoring v1 at `/app/settings/personas` with a Firestore-backed API, corpus manifest capture, voice profile controls, declared tool affinity, sandbox metadata, and deterministic test-deliberation preview.
- Added deterministic SSE streaming at `/api/boardroom/deliberations/[deliberationId]/stream` so the live surface consumes contribution, synthesis, and done events while Agent Engine streaming is prepared.
- Added custom persona detail/new routes, backend custom-persona validator/prompt/sandbox scaffolds, persona-corpus ingest/retrieval scaffolds, and Pack 16 e2e tests for boardroom flow, abort/cost guard, and custom persona creation.
- Added `analyst_persona` and `moderator` backend subagent scaffolds, prompts, eval tests, and skills.
- Added ADRs 0026-0028.
- Added `npm run audit:boardroom`.

## Still Required

- Live Vertex AI Agent Engine deployment for `analyst_persona` and `moderator`.
- Live pgvector/Vector Search backing for persona corpus retrieval.
- Binary corpus upload/chunking for custom personas beyond manifest capture.
- Full Pack 16 e2e suites and cost telemetry from live model calls.

## Verification Targets

- `npm run typecheck`
- `npm run build`
- `npm run audit:boardroom`
- `npm run audit:persona-corpora-fresh`
- `npm run audit:workbench`
- `npm run audit:codex-prompts`
- `npm run test -- tests/unit/lib/boardroom/personas.test.ts tests/unit/lib/boardroom/deliberation.test.ts tests/unit/lib/boardroom/export.test.ts tests/unit/lib/boardroom/custom-personas.test.ts`
- `pytest backend/tests/test_boardroom_types.py backend/tests/test_custom_personas.py backend/tests/test_persona_corpus_retrieval.py backend/agents/analyst_persona/eval/run_eval.py backend/agents/moderator/eval/run_eval.py -q`
- `npx playwright test tests/e2e/workbench/boardroom-flow.spec.ts tests/e2e/workbench/boardroom-abort-and-cost-guard.spec.ts tests/e2e/settings/custom-persona-creation.spec.ts`

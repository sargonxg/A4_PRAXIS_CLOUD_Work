# PRAXIS AI Orchestration Audit Report

Date: 2026-05-07

Prompt source: `C:\Users\giuli\Downloads\AI_ORCHESTRATION_AUDIT_PROMPT.md`

## TL;DR

Status: RED/YELLOW.

Provider isolation and model-matrix discipline are in good shape for the current production-safe posture, but the workspace orchestration layer is not yet a live Gemini Enterprise Agent Platform/LangGraph runtime. Current chapter recipes and subgraphs are deterministic scaffolds, and `/backend/routers/workspace.py` streams a heartbeat rather than real durable progress events. This is acceptable as an honest demo-safe state, but it does not satisfy the prompt's live orchestration contract.

## What Passed

| Check | Result | Evidence |
| --- | --- | --- |
| AI provider isolation | PASS | `npm run audit:ai-provider-isolation` passed earlier in this audit pack. |
| Model matrix coverage | PASS | `npm run audit:model-matrix-coverage` passed earlier in this audit pack. |
| Orchestrator write boundary | PASS | `npm run audit:orchestrator-writes` passed. |
| Settings model allowlist | PASS | Added `src/lib/ai/model-preferences.ts` so UI/API settings use matrix-derived model ids. |
| Direct model-string cleanup | PASS | Settings page and settings API no longer carry their own `gemini-2.5-*` allowlist. |

## Findings

| ID | Severity | Area | Finding | Recommendation |
| --- | --- | --- | --- | --- |
| AI-F01 | P0 | Live orchestration | Workspace subgraphs are deterministic Python helpers, not live LangGraph/Vertex executions with resumable state. | Introduce a real orchestration runner with graph state, retry policy, cancellation, and per-step event logging. |
| AI-F02 | P1 | SSE/events | `/v1/workspace/events` currently emits a single heartbeat. No durable `LISTEN/NOTIFY` event stream was found. | Add a Postgres-backed event cursor or LISTEN/NOTIFY bridge tied to `workspace_orchestrator_log`. |
| AI-F03 | P1 | Cost ledger | Chapter recipes return deterministic queued runs; live model cost cannot be measured locally. | Add per-run token/cost records at the orchestration runner boundary and expose them in run telemetry. |
| AI-F04 | P1 | Gemini Enterprise deployment proof | No live Agent Engine deployment verification was run in this local pass. | Add a staging script that verifies agent deployments, eval freshness, and Cloud Trace parent/child spans. |
| AI-F05 | P2 | Model spec tension | The prompt asks for Gemini 3 targets. The repo currently keeps Gemini 2.5 ids and explicitly blocks Gemini 3 targets unless `PRAXIS_ALLOW_GEMINI3_TARGETS=1`. | Keep current matrix until production availability is verified; document Gemini 3 as readiness-gated, not assumed. |

## Fixes Made This Pass

- Added `src/lib/ai/model-preferences.ts`.
- Updated `src/app/app/settings/model-preferences/page.tsx` to derive its options from the model matrix.
- Updated `src/app/api/settings/ai/route.ts` to validate with `isModelPreferenceValue`.
- Updated `src/lib/firebase/firestore.ts` to use the central default model preference.

## Verification

```text
npm run audit:ai-provider-isolation
npm run audit:model-matrix-coverage
npm run audit:orchestrator-writes
```

The provider/matrix/orchestrator static checks pass. Live Vertex/Agent Engine smoke calls were not run in this local pass.

## Next Implementation Queue

1. Implement a real workspace orchestrator runner and durable event stream.
2. Add cost ledger writes for every model-backed step.
3. Add staging deployment/eval/trace verification for Agent Engine subagents.
4. Revisit Gemini 3 model ids only when the production project proves availability.

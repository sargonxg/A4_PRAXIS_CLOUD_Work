# Ask PRAXIS Agentic Search Proof

Date: 2026-05-20

## Diagnostic Posture

Local env blockers remain separate from product proof. `npm run audit:agentic-search` still validates live configuration for the Cloud SQL ledger, worker dispatch, Google/Vertex/Genkit, ADK, and explicit Google Search grounding env. `npm run audit:agentic-search-proof` is the production-safe static proof gate for Ask -> AgentRun -> worker -> stream -> receipt markers.

## Proof Matrix

| Area | Status | Evidence |
|---|---|---|
| Ask queued-run proof | Added | Deep/current/source-heavy Ask turns carry `selectedToolIds`, `searchPlan`, `sourceReceiptIds`, `sourceCount`, `groundingPlan`, `groundingPosture`, `sourcePosture`, `degradedReason`, and queued `runId` when the ledger is available. |
| Worker search evidence | Added | Research Memo Agent runs with `grounded-search` or `deep-search-agent` append search evidence tool calls before memo/output persistence and mirror `grounding.*`, `tool.*`, and `praxis.search_evidence_*` style events. |
| Degraded grounding | Added | Missing Google Search grounding records `Grounding unavailable` plus a user-safe degraded reason; receipts do not imply current public-web coverage. |
| Safe DTO/UI proof | Added | AgentRun DTO and Ask queued-run panel expose selected search tools, source receipt count, grounding posture, degraded reason, output target, and run id without internal spend or secrets. |
| Direct routes | Labeled | `/api/ai/deep-search-agent`, `/api/ai/grounded-search`, and `/api/ai/source-scout` remain fallback/specialized compatibility paths. The canonical Ask product path is queued AgentRun orchestration. |

## Remaining Red Flags

- Live source collection is still gated by environment and provider availability; the worker records a degraded receipt instead of pretending live grounding ran.
- `audit:agentic-search` may remain blocked in a local shell without Cloud SQL, worker auth, Vertex/Gemini, ADK, Genkit, and grounding env.
- This slice improves V1 proof and receipts; it does not rebuild the global Sources Library.

## Validation

- `npx vitest run tests/unit/lib/agent-runtime/api-schema.test.ts tests/unit/lib/agent-runtime/worker.test.ts tests/unit/lib/ai/ask-orchestrator.test.ts`
- `npm run audit:agentic-search-proof`

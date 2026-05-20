# PRAXIS Agentic Proof + UX Matrix

Date: 2026-05-20

## Diagnostic Split

Local shell readiness is blocked by missing local environment variables for Cloud SQL, worker dispatch auth, Vertex/Gemini, ADK, Genkit, and explicit Google Search grounding. Production readiness is separate: `https://praxis.tacitus.me/api/health/agentic-search` returned `ready`, and `https://praxis.tacitus.me/api/health/runtime` returned `ok` with agent ledger, queue, worker dispatch, and agent platform checks green.

## Route / Tool / UI / Runtime Matrix

| Capability | Route / Module | Runtime State | UI Proof | Degraded Mode |
|---|---|---|---|---|
| Ask orchestration | `src/app/api/ai/chat/route.ts`, `src/lib/ai/ask-orchestrator.ts` | Deep/current/source-heavy asks route to `queue_agent_run`; simple turns stay synchronous with receipts. | Ask rail stages: capsule read, research plan, source discovery, document retrieval, gap review, synthesis, save output. | Synchronous Ask fallback is explicit when AgentRun ledger or dispatch is unavailable. |
| AgentRun ledger | `src/app/api/agents/runs/route.ts`, `src/lib/agent-runtime/postgres.ts` | Cloud SQL remains canonical for `agent_runs`, `agent_run_events`, `agent_tool_calls`, approvals, and artifacts. | Run id, policy agent label, output target, selected tools, source count, approval gates, and source posture are exposed in safe DTOs. | Local shell blocks without `DATABASE_URL`/`PRAXIS_DATABASE_URL`; production health is ready. |
| AgentRun stream | `src/app/api/agents/runs/[runId]/stream/route.ts`, `src/hooks/useOrchestratorEvents.ts` | SSE normalizes ledger and worker events into stable rail labels. | Ask queued-run panel subscribes to `/api/agents/runs/[runId]/stream` and renders recent process events. | Stream reconnect and failure text remain explicit. |
| Deep Search Agent | `src/app/api/ai/deep-search-agent/route.ts` | Still available as the ADK-facing capability, but Ask treats durable AgentRun as the product path. | Selected as a tool in receipts when deep/current/source-heavy prompts require it. | ADK unavailable remains a degraded runtime state, not a hidden success. |
| Grounded search | `src/app/api/ai/grounded-search/route.ts`, `src/lib/agent-runtime/grounding-adapter.ts` | Google-native grounding posture is preserved when selected. | Receipts expose grounding posture without showing internal query costs. | Missing grounding metadata is labeled as absent instead of implied. |
| Source scout | `src/app/api/ai/source-scout/route.ts` | Source discovery remains a route/tool lane for citable source work. | Source counts and receipt previews feed Ask and AgentRun proof fields. | Source metadata missing becomes a source posture gap. |
| Memo save / output | `src/lib/agent-runtime/worker.ts`, Memo Studio storage | Research memo worker writes memo drafts and output capsule links. | Output target and saved output href are surfaced on AgentRun DTOs and queued-run controls. | Persistence failure is a run failure or dispatch retry path. |
| Graph proposals | `src/app/api/ai/graph-propose/route.ts` | Graph/Cognee enrichment remains review-gated and non-authoritative. | Approval gate counts stay visible on the rail. | Writes require explicit approval; no direct canonical graph mutation from Ask. |
| Capsule writeback | Context capsule APIs under `src/app/api/context/capsules/**` | Firestore remains canonical for ContextCapsules and app state. | Capsule read appears as the first Ask rail stage. | Thin or missing capsule state is surfaced as a warning. |

## Eval Harness

`npm run eval:agentic-research` writes redacted artifacts under `docs/audits/agentic-research-evals/`. The harness compares PRAXIS AgentRun proof against a generic prompt-only baseline across five fixed scenarios:

- current-events
- conflict-policy-research
- claim-source-discovery
- contradiction-uncertainty
- capsule-grounded-research

The first run produced `5/5` PRAXIS wins on capsule reuse, persistence, audit trail, citation fidelity, and uncertainty handling. Latency and failure mode are explicit fields so live grading can replace deterministic contract scoring later.

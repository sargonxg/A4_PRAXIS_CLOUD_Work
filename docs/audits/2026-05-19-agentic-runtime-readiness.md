# Agentic Runtime Readiness Cleanup Audit

Generated: 2026-05-20T02:02:57.122Z

Cleanup must preserve these lanes because they are the backbone of real agentic work.

| Status | Area | Routes | Evidence | Next action |
| --- | --- | --- | --- | --- |
| pass | Ask conversation | `/api/conversations`<br>`/api/conversations/[conversationId]/turns` | routes present<br>markers found: TaskletPraxisWorkbench, buildEnrichedTurnCapsule | Preserve this runtime lane during cleanup. |
| pass | Agent run ledger | `/api/agents/runs`<br>`/api/agents/runs/[runId]` | routes present<br>markers found: AgentRunOutputSchema, toAgentRunOutput | Preserve this runtime lane during cleanup. |
| pass | Worker dispatch and execution | `/api/agents/runs/[runId]/dispatch`<br>`/api/agents/runs/[runId]/execute`<br>`/api/agents/runs/[runId]/stream` | routes present<br>markers found: Cloud Tasks, useOrchestratorEvents | Preserve this runtime lane during cleanup. |
| pass | Capsule context | `/api/context/capsules`<br>`/api/context/resolve`<br>`/api/context/packages` | routes present<br>markers found: ContextCapsule, resolveInjectableContext | Preserve this runtime lane during cleanup. |
| pass | Output handoff | `/api/output-capsules`<br>`/api/memos/from-ask`<br>`/api/work-products/export-docx` | routes present<br>markers found: outputHref, memo_studio | Preserve this runtime lane during cleanup. |

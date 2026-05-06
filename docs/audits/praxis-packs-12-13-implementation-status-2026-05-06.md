# PRAXIS Packs 12-13 Implementation Status

Date: 2026-05-06

## Pack 12 - Context Architecture

| Deliverable | Status | Evidence | Notes |
|---|---|---|---|
| Prompt preserved | SHIPPED | `docs/codex-prompts/PRAXIS_CODEX_12_CONTEXT_ARCHITECTURE.md` | Audited with the prompt pack gate. |
| Four-layer TS model | SHIPPED | `src/types/context.ts` | User, Workspace, Case, Conversation, Snapshot, Spec, PreparedContext. |
| Backend mirror | SHIPPED | `backend/services/context_layers.py` | Pydantic mirror for backend agents. |
| Advisory middleware | SHIPPED | `src/lib/context/context-aware.ts`, `src/lib/api/with-context-aware.ts` | Adds context snapshot and headers. |
| Hard 412 gate removed from shared calibration | SHIPPED | `src/lib/api/with-calibration.ts` | Tool runs receive `contextSnapshot`; low context is advisory. |
| Conversation context | SHIPPED | `src/lib/context/conversation-token.ts`, `src/lib/context/context-aware.ts` | Signed HMAC token path is preferred; unsigned JSON remains dev/demo fallback only. |
| Context Preparer contract | SHIPPED | `src/lib/tools/context-provider.ts`, `skills/subagents/context-preparer/SKILL.md` | Executable TS provider prepares four-layer context; LangGraph orchestration remains future agent work. |

## Pack 13 - Tool Context Interop

| Deliverable | Status | Evidence | Notes |
|---|---|---|---|
| Prompt preserved | SHIPPED | `docs/codex-prompts/PRAXIS_CODEX_13_TOOL_CONTEXT_INTEROP.md` | Audited with the prompt pack gate. |
| Tool Contract v2 | SHIPPED | `src/lib/tools/marketplace/types.ts`, `registry.ts` | All 16 marketplace tools expose v2 fields. |
| Skills | SHIPPED | `skills/tools/*/SKILL.md`, `skills/subagents/*/SKILL.md` | Audited by `audit:tool-skills-present`. |
| Suggestion engine | SHIPPED | `src/lib/tools/marketplace/suggestions.ts`, `ToolMarketplace.tsx` | Top-three recommendations shown in Workbench Tools tab. |
| ContextProvider DI | SHIPPED | `src/lib/tools/context-provider.ts` | Tools can receive prepared context, projections, advisories, and subagent packets through one provider. |
| Context projection | SHIPPED | `src/lib/tools/marketplace/projections/default.ts`, `scripts/audit-tool-contract-v2.ts` | Registry points to a real projection module and the audit enforces file existence. |
| Subagent runtime contract | PARTIAL | skill files and dependencies declared | LangGraph subgraphs and telemetry remain backlog. |

## Gates Added

- `audit:context-aware-coverage`
- `audit:tool-contract-v2`
- `audit:tool-skills-present`

These are included in `audit:gate`.

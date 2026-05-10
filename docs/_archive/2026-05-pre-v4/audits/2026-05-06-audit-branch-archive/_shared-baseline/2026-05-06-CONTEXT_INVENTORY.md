# Context Inventory

Date: 2026-05-06

## Current Surfaces

| Surface | Existing shape | Pack 12 mapping |
|---|---|---|
| `src/lib/context/context-health-score.ts` | Case-only score over scope, actors, sources, documents, graph, provenance | Preserved inside `CaseContext.contextHealth`; advisory only |
| `src/lib/context/profile-context.ts` | Analyst profile plus situation context for AI prompts | Feeds `UserContext` and `CaseContext` |
| `src/lib/api/with-calibration.ts` | Auth, credits, calibration, tool runs, firewall | Now attaches `contextSnapshot` from `withContextAware` |
| `src/components/workbench/tool-gate.tsx` | Former UI blocker with manual override | Now advisory UI; child tool surfaces still render |
| `src/app/api/situations/[id]/context-health/route.ts` | Audit route for context override notes | Kept as audit trail for low-context decisions |
| `src/components/tools/ToolMarketplace.tsx` | Registry browser by ontology, health, cost | Now also shows v2 tool suggestions and context-aware metadata |
| `src/lib/tools/marketplace/registry.ts` | Sixteen curated tools with loose schemas | Migrated to Tool Contract v2 fields |
| `src/types/memo.ts` | Memo templates and blocks | Referenced by `UserContext.mandate.typicalOutputs` and preferences |
| `src/lib/ontology/types.ts` | Ontology IDs and primitive mapping | Referenced by `CaseContext.ontologyId` and tool `contextSpec` |

## New Contract

- `src/types/context.ts` defines User, Workspace, Case, Conversation, Snapshot, Spec, and Prepared Context.
- `backend/services/context_layers.py` mirrors the contract for backend agent work.
- `src/lib/context/context-aware.ts` builds advisory snapshots and response headers.
- `withCalibration` no longer returns a 412 context-health blocker. It passes `contextSnapshot` to handlers and sets `X-Praxis-Context-*` headers.

## Remaining Backend Work

- Firestore persistence for full user/workspace context settings.
- Signed conversation token rather than plain JSON header.
- LangGraph Context Preparer implementation beyond the typed skill and contract layer.
- Diagnostics aggregation for context health distribution and preparer invocation count.

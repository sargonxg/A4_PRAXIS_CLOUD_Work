# Tool Contract Inventory

Date: 2026-05-06

## v1 Shape

Pack 08 marketplace tools had identity, ontology requirements, loose input/output schemas, runtime/cost metadata, canary cases, and persistence tolerances. They did not have a declarative context contract, composition metadata, side-effect declarations, subagent dependencies, or skill files.

## v2 Migration

All 16 marketplace tools now expose:

- `version: 2.0.0`
- `title`
- `contractCategory`
- `contextSpec`
- `composition`
- `sideEffects`
- `subagentDeps`
- `skill.file`

The runtime behavior remains intentionally tolerant: tools accept free-form prompt text, structured context dumps, raw model output, and nested artifacts. The new contract describes what a tool prefers; it does not block execution.

## Tool Skill Coverage

Each curated tool has a skill file under `skills/tools/<tool_id>/SKILL.md` with the canonical nine sections. Four subagent skills are present under `skills/subagents/`:

- Context Preparer
- Source Augmenter
- Output Refiner
- Memo Drafter

## Suggestion Surface

`src/lib/tools/marketplace/suggestions.ts` ranks tools from case ontology, context health, cost, runtime, and graceful-context support. `ToolMarketplace` shows the top three recommendations with rationales.

## Remaining Work

- Real ContextProvider DI into every executable tool handler.
- LangGraph subgraph implementations for the three new subagents.
- Static context projection files for all composition chains.
- Telemetry/cost rows for subagent invocations.

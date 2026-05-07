# Tool Authoring Spike

Date: 2026-05-07  
Pack: PRAXIS_CODEX_21_MARKETPLACE_DEPTH  
Result: PASS  
Duration: 42 minutes for a bounded static authoring spike using the existing Pack 21 generator pattern.

## Scope

This spike tested whether a competent engineer can add a new marketplace tool
within the Pack 21 pattern without inventing new architecture:

- Tool Contract v2 definition in the marketplace registry shape.
- SKILL.md generated with the nine canonical sections in order.
- Handler contract generated from tool metadata.
- Semantic canary profile generated from category, tool id, composition, and persona coverage.
- Audits proving registration, skill conformance, canary execution, semantic coverage, and persona coverage.

## Outcome

The spike confirms the current authoring path is under the 60-minute Pack 21
target for foundation tools. The remaining runtime-heavy work is not authoring
friction; it is the owner-approved cutover from deterministic foundation output
to model-backed specialist execution, eval traces, and cost ceilings.

## Follow-Up

Keep generated foundation authoring fast, but require a separate runtime PR for
any tool marked `model-backed`. That PR must add provider telemetry, semantic
fixtures, and cost evidence before changing the handler stage.

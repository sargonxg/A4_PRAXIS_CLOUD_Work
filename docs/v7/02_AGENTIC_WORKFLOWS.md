# PRAXIS v7 Brief 02 - Agentic Workflows

Status: active brief

## Goal

Turn PRAXIS tools into guided workflows.

The user should pick a goal. Ask PRAXIS should gather context, propose a plan, ask for confirmation, run existing tools/routes, and save an output.

## Workflow Pattern

Every workflow follows:

1. Intent
2. Context
3. Plan
4. Run
5. Review
6. Save

## Initial Workflows

| Workflow | Output | Existing Capability |
| --- | --- | --- |
| Understand Situation | First-read brief and context map. | Desk, GraphIntelligencePanels, Ontology, saved claims. |
| Improve Context | Context candidates and coverage update. | ContextTab, Library, Research, Cognee pending writes. |
| Generate Handover | Successor handover. | MemoStudio, Draft, export routes. |
| Update Brief | Delta brief from new source/event. | Research ingest, memo/draft routes, briefing routes. |
| Red-Team Assessment | Counter-assessment and assumptions. | ACH, red-team routes, Boardroom. |
| Prepare Meeting | Talking points and likely questions. | Boardroom, talking-points, memo templates. |
| Review Sources And Claims | Source/trust gap report. | EvidenceDrawer, source receipts, saved claims. |

## Required Registry

Add a typed workflow registry before building workflow UI:

- `src/lib/agentic-workflows/registry.ts`

Each workflow declares:

- input context
- steps
- routes/tools used
- output artifact
- save location
- confirmation requirement
- AI/structural/hybrid tier

## Acceptance

- Workflows appear before raw tool grids.
- Every mutating step is confirmed.
- Every workflow has a save location.
- Structural/deterministic steps are labeled honestly.

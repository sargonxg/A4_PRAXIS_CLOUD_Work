# Brainstorming Table

Tool id: `brainstorming-table`

## Product Role

Help a policy or intelligence user use Brainstorming Table to turn the active situation into a concrete, reviewable work product.

Brainstorming Table exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `simulation`
- AI route: `/api/ai/brainstorming-table`
- Data schema: `BrainstormingTableSchema`
- Output type: `structured`
- Model tier: `pro`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / specialized / active
- Conflict analyst / secondary / active
- Country desk / premium-future / next
- Mediator / primary / next
- Humanitarian / premium-future / future
- Legal / sanctions / premium-future / future
- Political risk / premium-future / future
- Policy research / primary / future
- Media analyst / premium-future / future
- Stabilization / premium-future / future
- Election / governance / premium-future / future

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `prior-tool-outputs`
- `graph-backbone`

## Optional Context

- `advisor-memory`
- `live-web-research`
- `document-corpus`
- `source-library`
- `external-feeds`

## Situation Inputs

- `name`
- `region`

## Required Questions

- Which actors and choices should the model include?
- Which assumptions should be stress-tested?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Scenario or strategic model (table) - A structured simulation with drivers, assumptions, probability or payoff logic, and warning signals.

## Methods And Sources

Frameworks:
- Lederach Multi-Level Mediation
- ICD 203 Probability Language
- Stedman Spoiler Theory
- IPC Food Security Phases
- OCHA Humanitarian Standards

Primary evidence policy:
- active situation record
- analyst profile and preferences
- Situation corpus (ARGUS, Sources Library, Documents, Graph, Tool Outputs)
- Pasted working text
- Selected uploaded PDF/TXT/DOCX document extracts

Degraded state triggers:
- missing active situation
- missing required situation fields

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/brainstorming-table`
- Version history: `users/{uid}/situations/{situationId}/tool-data/brainstorming-table/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/brainstorming-table`
- Graph proposals: `users/{uid}/situations/{situationId}/graph_updates/{proposalId}`
- Sources: `users/{uid}/situations/{situationId}/sources/{sourceId}`
- Document chunks: `users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}`
- Audit trail: `users/{uid}/situations/{situationId}/tool-runs/{toolRunId}`

## Graph Backbone

- Current mode: `none`
- Future Dialectica role: No direct graph role yet; may read finalized Dialectica summaries later.

## Document Production

- LibreOffice export lane: no
- Not a primary document-production tool.
- Not a document-production tool; expose structured output to Report Studio when useful.

## Ask PRAXIS Actions

- Explain what Brainstorming Table is showing and what is weak or missing.
- Ask clarifying questions before regenerating Brainstorming Table when required inputs are missing.
- Write a corrected structured payload back to brainstorming-table when the user asks to change it.

## Quality Bar

- Declares assumptions
- Shows sensitivity to changed inputs
- Connects outputs to concrete decisions

## Next Implementation Tasks

- [ ] Verify the page shows the operating contract, context blueprint, confidence, provenance, and degraded state.
- [ ] Verify the route accepts active situation context and returns schema-valid, non-empty output.
- [ ] Verify saved output reloads from canonical tool-data and can be exported or reused by Ask PRAXIS.
- [ ] Add or update browser smoke coverage for a realistic first-time and power-user flow.

## Regeneration

This file is generated from the registry, operating contract, path taxonomy, and context blueprint. Run `npm run generate:tool-docs` after changing those sources.

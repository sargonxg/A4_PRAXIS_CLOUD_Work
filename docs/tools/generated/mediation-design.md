# Mediation Designer

Tool id: `mediation-design`

## Product Role

Help a policy or intelligence user use Mediation Designer to turn the active situation into a concrete, reviewable work product.

Mediation Designer exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `simulation`
- AI route: `/api/ai/mediation-design`
- Data schema: `MediationDesignSchema`
- Output type: `structured`
- Model tier: `thinking`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Conflict analyst / secondary / active
- Mediator / primary / next
- Stabilization / secondary / future

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `prior-tool-outputs`
- `document-corpus`
- `drafting-constraints`
- `graph-backbone`

## Optional Context

- `advisor-memory`
- `live-web-research`
- `source-library`

## Situation Inputs

- `actors`
- `description`
- `region`
- `glaslStage`

## Required Questions

- Which actors and choices should the model include?
- Which assumptions should be stress-tested?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Scenario or strategic model (table) - A structured simulation with drivers, assumptions, probability or payoff logic, and warning signals.

## Methods And Sources

Frameworks:
- Berghof Mediation Process Framework
- Zartman Ripeness Theory
- Stedman Spoiler Theory
- UN DPPA Mediation Standards

Primary evidence policy:
- active situation record
- analyst profile and preferences
- uploaded documents and extracted fragments

Degraded state triggers:
- missing active situation
- missing required situation fields
- no document/source evidence for key claims

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/mediation-design`
- Version history: `users/{uid}/situations/{situationId}/tool-data/mediation-design/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/mediation-design`
- Graph proposals: `users/{uid}/situations/{situationId}/graph_updates/{proposalId}`
- Sources: `users/{uid}/situations/{situationId}/sources/{sourceId}`
- Document chunks: `users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}`
- Audit trail: `users/{uid}/situations/{situationId}/tool-runs/{toolRunId}`

## Graph Backbone

- Current mode: `none`
- Future Dialectica role: No direct graph role yet; may read finalized Dialectica summaries later.

## Document Production

- LibreOffice export lane: yes
- draft artifact
- Produce structured sections first; export adapters can render to DOCX/PDF/LibreOffice later without re-calling the model.

## Ask PRAXIS Actions

- Explain what Mediation Designer is showing and what is weak or missing.
- Ask clarifying questions before regenerating Mediation Designer when required inputs are missing.
- Write a corrected structured payload back to mediation-design when the user asks to change it.

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

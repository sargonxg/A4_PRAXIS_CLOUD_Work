# Game Theory

Tool id: `game-theory`

## Product Role

Help a policy or intelligence user use Game Theory to turn the active situation into a concrete, reviewable work product.

Game Theory exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `simulation`
- AI route: `/api/ai/game-theory`
- Data schema: `ScenarioSchema`
- Output type: `structured`
- Model tier: `thinking`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Conflict analyst / secondary / active
- Mediator / secondary / next

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

## Situation Inputs

- `actors`
- `description`

## Required Questions

- Which actors and choices should the model include?
- Which assumptions should be stress-tested?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Scenario or strategic model (table) - A structured simulation with drivers, assumptions, probability or payoff logic, and warning signals.

## Methods And Sources

Frameworks:
- Schelling Focal Points
- Putnam Two-Level Games
- Fearon Rationalist War Causes

Primary evidence policy:
- active situation record
- analyst profile and preferences

Degraded state triggers:
- missing active situation
- missing required situation fields

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/game-theory`
- Version history: `users/{uid}/situations/{situationId}/tool-data/game-theory/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/game-theory`
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

- Explain what Game Theory is showing and what is weak or missing.
- Ask clarifying questions before regenerating Game Theory when required inputs are missing.
- Write a corrected structured payload back to game-theory when the user asks to change it.

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

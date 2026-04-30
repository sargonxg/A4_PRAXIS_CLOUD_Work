# Scenario Planner

Tool id: `scenarios`

## Product Role

Help a policy or intelligence user use Scenario Planner to turn the active situation into a concrete, reviewable work product.

Scenario Planner exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `simulation`
- AI route: `/api/ai/scenario`
- Data schema: `ScenarioSchema`
- Output type: `streaming`
- Model tier: `thinking`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Conflict analyst / secondary / active
- Political risk / primary / future

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
- `actors`
- `glaslStage`

## Required Questions

- Which actors and choices should the model include?
- Which assumptions should be stress-tested?

## Expected Outputs

- Interactive answer (brief) - Conversational output that can ask clarifying questions and route the user to the right tool.
- Scenario or strategic model (table) - A structured simulation with drivers, assumptions, probability or payoff logic, and warning signals.

## Methods And Sources

Frameworks:
- Glasl Escalation Model
- SIPRI Scenario Methodology
- Zartman Ripeness Theory

Primary evidence policy:
- active situation record
- analyst profile and preferences
- GDELT
- UCDP

Degraded state triggers:
- missing active situation
- missing required situation fields

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/scenarios`
- Version history: `users/{uid}/situations/{situationId}/tool-data/scenarios/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/scenarios`
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

- Explain what Scenario Planner is showing and what is weak or missing.
- Ask clarifying questions before regenerating Scenario Planner when required inputs are missing.
- Write a corrected structured payload back to scenarios when the user asks to change it.

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

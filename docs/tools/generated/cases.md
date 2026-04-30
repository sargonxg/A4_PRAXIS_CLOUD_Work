# Case Library

Tool id: `cases`

## Product Role

Help a policy or intelligence user use Case Library to turn the active situation into a concrete, reviewable work product.

Case Library exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `workspace`
- AI route: `/api/data/conflicts`
- Data schema: `CaseSchema`
- Output type: `structured`
- Model tier: `provider-default`
- Active path focus: No - documented for later path activation.

## Workflow Paths

- No path membership yet.

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `team-workspace`

## Optional Context

- `advisor-memory`
- `live-web-research`
- `document-corpus`
- `source-library`

## Situation Inputs

- None declared.

## Required Questions

- What workspace object or setting is being managed?
- Who can view, change, or export this object?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Workspace management state (workspace) - A saved state, configuration, export, case, team object, or administrative control.

## Methods And Sources

Frameworks:
- None declared.

Primary evidence policy:
- active situation record
- analyst profile and preferences

Degraded state triggers:
- missing active situation
- missing required situation fields

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/cases`
- Version history: `users/{uid}/situations/{situationId}/tool-data/cases/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/cases`
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

- Explain what Case Library is showing and what is weak or missing.
- Ask clarifying questions before regenerating Case Library when required inputs are missing.
- Write a corrected structured payload back to cases when the user asks to change it.

## Quality Bar

- Makes state changes explicit
- Avoids silent destructive actions
- Keeps user and situation boundaries clear

## Next Implementation Tasks

- [ ] Verify the page shows the operating contract, context blueprint, confidence, provenance, and degraded state.
- [ ] Verify the route accepts active situation context and returns schema-valid, non-empty output.
- [ ] Verify saved output reloads from canonical tool-data and can be exported or reused by Ask PRAXIS.
- [ ] Add or update browser smoke coverage for a realistic first-time and power-user flow.

## Regeneration

This file is generated from the registry, operating contract, path taxonomy, and context blueprint. Run `npm run generate:tool-docs` after changing those sources.

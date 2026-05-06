# Advisory Council

Tool id: `advisory`

## Product Role

Help a policy or intelligence user use Advisory Council to turn the active situation into a concrete, reviewable work product.

Advisory Council exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `workspace`
- AI route: `/api/ai/advisory`
- Data schema: `AdvisorChatSchema`
- Output type: `streaming`
- Model tier: `provider-default`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / core / active
- Conflict analyst / core / active
- Country desk / core / next
- Mediator / core / next
- Humanitarian / core / future
- Legal / sanctions / core / future
- Political risk / core / future
- Policy research / core / future
- Media analyst / core / future
- Stabilization / core / future
- Election / governance / core / future

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

- `description`
- `actors`

## Required Questions

- What workspace object or setting is being managed?
- Who can view, change, or export this object?

## Expected Outputs

- Interactive answer (brief) - Conversational output that can ask clarifying questions and route the user to the right tool.
- Workspace management state (workspace) - A saved state, configuration, export, case, team object, or administrative control.

## Methods And Sources

Frameworks:
- Multi-Perspectival Analysis
- Devil's Advocacy Technique
- Red Team Methodology

Primary evidence policy:
- active situation record
- analyst profile and preferences

Degraded state triggers:
- missing active situation
- missing required situation fields

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/advisory`
- Version history: `users/{uid}/situations/{situationId}/tool-data/advisory/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/advisory`
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

- Summarize advisor stance
- Compare advisory recommendations
- Turn advice into a concrete next step

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

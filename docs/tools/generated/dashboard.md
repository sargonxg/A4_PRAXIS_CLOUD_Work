# Dashboard

Tool id: `dashboard`

## Product Role

Help a policy or intelligence user use Dashboard to turn the active situation into a concrete, reviewable work product.

Dashboard exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `context`
- AI route: `/api/ai/dashboard-summary`
- Data schema: `DashboardSnapshotSchema`
- Output type: `structured`
- Model tier: `flash`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / core / active
- Generic core / primary / active
- Conflict analyst / core / active
- Conflict analyst / primary / active
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

## Optional Context

- `advisor-memory`
- `live-web-research`
- `graph-backbone`
- `document-corpus`
- `source-library`
- `external-feeds`

## Situation Inputs

- `name`
- `region`
- `actors`

## Required Questions

- What situation, geography, and time window should this view represent?
- Which actors, sources, or documents are currently missing?

## Expected Outputs

- Executive operating picture (dashboard) - Risk, graph, sources, active tasks, latest intelligence, and recommended next actions.

## Methods And Sources

Frameworks:
- INFORM Risk Index
- Glasl Escalation Model

Primary evidence policy:
- active situation record
- analyst profile and preferences
- GDELT
- UCDP
- ReliefWeb
- HDX HAPI
- World Bank

Degraded state triggers:
- missing active situation
- missing required situation fields

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/dashboard`
- Version history: `users/{uid}/situations/{situationId}/tool-data/dashboard/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/dashboard`
- Graph proposals: `users/{uid}/situations/{situationId}/graph_updates/{proposalId}`
- Sources: `users/{uid}/situations/{situationId}/sources/{sourceId}`
- Document chunks: `users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}`
- Audit trail: `users/{uid}/situations/{situationId}/tool-runs/{toolRunId}`

## Graph Backbone

- Current mode: `read`
- Future Dialectica role: Reads current ACO graph context now and should graduate to Dialectica ontology-backed retrieval, graph proposals, and analyst-approved graph mutations.

## Document Production

- LibreOffice export lane: no
- Not a primary document-production tool.
- Not a document-production tool; expose structured output to Report Studio when useful.

## Ask PRAXIS Actions

- Summarize the dashboard
- Explain why a metric changed
- Create a task list from current gaps

## Quality Bar

- Shows current situation scope
- Makes missing data visible
- Links to at least one downstream action

## Next Implementation Tasks

- [ ] Verify the page shows the operating contract, context blueprint, confidence, provenance, and degraded state.
- [ ] Verify the route accepts active situation context and returns schema-valid, non-empty output.
- [ ] Verify saved output reloads from canonical tool-data and can be exported or reused by Ask PRAXIS.
- [ ] Add or update browser smoke coverage for a realistic first-time and power-user flow.

## Regeneration

This file is generated from the registry, operating contract, path taxonomy, and context blueprint. Run `npm run generate:tool-docs` after changing those sources.

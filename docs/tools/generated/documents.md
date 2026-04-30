# Documents

Tool id: `documents`

## Product Role

Help a policy or intelligence user use Documents to turn the active situation into a concrete, reviewable work product.

Documents exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `context`
- AI route: `/api/documents`
- Data schema: `DocumentSchema`
- Output type: `structured`
- Model tier: `provider-default`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / core / active
- Generic core / primary / active
- Conflict analyst / core / active
- Country desk / core / next
- Mediator / core / next
- Humanitarian / core / future
- Legal / sanctions / core / future
- Legal / sanctions / secondary / future
- Political risk / core / future
- Policy research / core / future
- Policy research / secondary / future
- Media analyst / core / future
- Stabilization / core / future
- Election / governance / core / future

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `graph-backbone`

## Optional Context

- `advisor-memory`
- `live-web-research`
- `document-corpus`
- `source-library`

## Situation Inputs

- `id`

## Required Questions

- What situation, geography, and time window should this view represent?
- Which actors, sources, or documents are currently missing?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Situation context view (dashboard) - A structured view that orients the user and routes them to the next best analytical tool.

## Methods And Sources

Frameworks:
- ACO Conflict Grammar v2.0

Primary evidence policy:
- active situation record
- analyst profile and preferences
- ACO graph primitives and graph proposals

Degraded state triggers:
- missing active situation
- missing required situation fields
- no graph primitives or approved graph context yet

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/documents`
- Version history: `users/{uid}/situations/{situationId}/tool-data/documents/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/documents`
- Graph proposals: `users/{uid}/situations/{situationId}/graph_updates/{proposalId}`
- Sources: `users/{uid}/situations/{situationId}/sources/{sourceId}`
- Document chunks: `users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}`
- Audit trail: `users/{uid}/situations/{situationId}/tool-runs/{toolRunId}`

## Graph Backbone

- Current mode: `read-write`
- Future Dialectica role: Reads current ACO graph context now and should graduate to Dialectica ontology-backed retrieval, graph proposals, and analyst-approved graph mutations.

## Document Production

- LibreOffice export lane: no
- Not a primary document-production tool.
- Not a document-production tool; expose structured output to Report Studio when useful.

## Ask PRAXIS Actions

- Extract entities from a document
- Link passages to claims
- Create a document-derived briefing

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

# Sources Library

Tool id: `sources-library`

## Product Role

Help a policy or intelligence user use Sources Library to turn the active situation into a concrete, reviewable work product.

Sources Library exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `context`
- AI route: `/api/ai/discover-sources`
- Data schema: `SourceSchema`
- Output type: `structured`
- Model tier: `flash`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / secondary / active
- Humanitarian / secondary / future
- Policy research / secondary / future
- Media analyst / secondary / future

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `source-library`
- `live-web-research`

## Optional Context

- `advisor-memory`
- `graph-backbone`
- `document-corpus`
- `external-feeds`

## Situation Inputs

- `region`
- `actors`

## Required Questions

- What situation, geography, and time window should this view represent?
- Which actors, sources, or documents are currently missing?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Situation context view (dashboard) - A structured view that orients the user and routes them to the next best analytical tool.

## Methods And Sources

Frameworks:
- Ad Fontes Media Bias Chart
- CRAAP Test (Currency, Relevance, Authority, Accuracy, Purpose)

Primary evidence policy:
- active situation record
- analyst profile and preferences
- Google Grounding
- grounded web search receipts

Degraded state triggers:
- missing active situation
- missing required situation fields
- no checkable web/source receipts

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/sources-library`
- Version history: `users/{uid}/situations/{situationId}/tool-data/sources-library/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/sources-library`
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

- Add a source
- Assess source credibility
- Recommend source gaps

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
